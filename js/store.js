// ---- Save storage. The game reads and writes saves only through store, so where they are kept can change without touching the
// game: in a browser, in localStorage; in the stand-alone app, as files in the app's data folder. The saves are all read once at
// start-up (store.init) and kept in memory, so reading is instant; writes update that copy and are then stored, which may take a
// moment (store.put and store.remove return promises).
//
// A desktop shell (Electron, Tauri) supplies file storage by putting a bridge on window before the game's scripts load:
//   window.SARIVALTO_SAVES = {where: 'a sentence saying where saves are kept',
//     readAll(): Promise<{slot: save}>, write(slot, save): Promise, remove(slot): Promise}
// A save is a plain object (see saveGame in game.js); the slots are 'quick', 0, 1 and 2.
const store=(()=>{
  const KEY=s=>'sarivalto-save-'+s,SLOTS=['quick',0,1,2];
  // the browser's own storage (any of these can throw in a private window or with storage blocked)
  const local={where:'Saves are kept in this browser. Export a save to keep a copy as a file.',
    async readAll(){const out={};for(const s of SLOTS){try{const v=JSON.parse(localStorage.getItem(KEY(s)));if(v)out[s]=v}catch(e){}}return out},
    async write(s,v){localStorage.setItem(KEY(s),JSON.stringify(v))},
    async remove(s){localStorage.removeItem(KEY(s))}};
  const back=window.SARIVALTO_SAVES||local,cache={};
  return{where:back.where,
    async init(){try{Object.assign(cache,await back.readAll())}catch(e){console.warn('Saves could not be read:',e)}},
    // (a fresh copy each time, so playing on from a loaded save can't change the save itself)
    get:s=>cache[s]==null?null:structuredClone(cache[s]),
    put(s,v){cache[s]=structuredClone(v);return back.write(s,v)},
    remove(s){delete cache[s];return back.remove(s)}}})();
