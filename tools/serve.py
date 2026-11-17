# Serves the game, and keeps its saves as files in the repo's saves/ folder (saves/quick.json, saves/0.json and so on), so they
# can be committed and carried to another machine with git. Run from anywhere:
#     python tools/serve.py           (then open http://localhost:8765)
#     python tools/serve.py 8000      (another port)
# The game asks GET /api/saves for every save, PUT /api/saves/<slot> to write one and DELETE /api/saves/<slot> to remove one
# (js/store.js). Served any other way (a plain server, or index.html opened as a file), it keeps saves in the browser instead.
# Nothing is cached, so an edited file shows on the next reload.
import json, os, socket, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVES = os.path.join(ROOT, 'saves')
SLOTS = ['quick', '0', '1', '2']
MAX = 20 * 1024 * 1024  # the most a save may be, in bytes


class Handler(SimpleHTTPRequestHandler):
    # keep connections open (HTTP/1.1), so the browser, not the server, hangs up once it has a whole file; an idle one closes after 30 seconds
    protocol_version = 'HTTP/1.1'
    timeout = 30

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def reply(self, code, body=None):
        data = json.dumps(body).encode() if body is not None else b''
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    # the slot a request names (/api/saves/<slot>), or None if it isn't one
    def slot(self):
        p = self.path.split('?')[0].rstrip('/')
        if not p.startswith('/api/saves/'):
            return None
        s = p[len('/api/saves/'):]
        return s if s in SLOTS else None

    def do_GET(self):
        if self.path.split('?')[0].rstrip('/') != '/api/saves':
            return super().do_GET()
        out = {}
        for s in SLOTS:
            f = os.path.join(SAVES, s + '.json')
            try:
                with open(f, encoding='utf-8') as fh:
                    out[s] = json.load(fh)
            except FileNotFoundError:
                pass
            except ValueError:
                print('Save ' + f + " isn't valid JSON; leaving it out", file=sys.stderr)
        self.reply(200, out)

    def do_PUT(self):
        s = self.slot()
        if s is None:
            return self.reply(404, {'error': 'no such save slot'})
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > MAX:
            self.close_connection = True  # the body is never read, so this connection can't carry another request
            return self.reply(413, {'error': 'save missing or too big'})
        try:
            save = json.loads(self.rfile.read(n))
        except ValueError:
            return self.reply(400, {'error': 'not JSON'})
        # write to a temporary file first, so a save is never left half-written
        os.makedirs(SAVES, exist_ok=True)
        f = os.path.join(SAVES, s + '.json')
        with open(f + '.tmp', 'w', encoding='utf-8') as fh:
            json.dump(save, fh, ensure_ascii=False, separators=(',', ':'))
        os.replace(f + '.tmp', f)
        self.reply(200, {'ok': True})

    def do_DELETE(self):
        s = self.slot()
        if s is None:
            return self.reply(404, {'error': 'no such save slot'})
        try:
            os.remove(os.path.join(SAVES, s + '.json'))
        except FileNotFoundError:
            pass
        self.reply(200, {'ok': True})


# the game asks for some twenty-five files at once: let them all queue (the default is five, and on Windows the rest are refused)
class Server(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True
    # on Windows this would let a second copy share the port and take half the requests: make it fail instead
    allow_reuse_address = os.name != 'nt'

    # on Windows, hanging up while the end of a big file is still on its way can lose that end, and the browser gets a reset some
    # twenty seconds later: so give the browser up to five seconds to hang up first (it does as soon as it has the whole file)
    def shutdown_request(self, request):
        try:
            request.settimeout(5)
            while request.recv(65536):
                pass
        except OSError:
            pass
        super().shutdown_request(request)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    try:
        server = Server(('localhost', port), Handler)
    except OSError:
        sys.exit('Port %d is in use: is the game already being served? Stop that copy, or pass another port.' % port)
    print('Sarivalto on http://localhost:%d (saves in %s)' % (port, SAVES))
    server.serve_forever()
