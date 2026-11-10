// ---- Save storage. The game reads and writes saves only through store, so where they are kept can change without touching the
// game: as files in the repo's saves/ folder when the game is served by tools/serve.py (so they can go into git and on to another
// machine); in localStorage when it's served some other way or opened as a file; in the stand-alone app, as files in the app's
// data folder. The saves are all read once at start-up (store.init) and kept in memory, so reading is instant; writes update
// that copy and are then stored, which may take a moment (store.put and store.remove return promises).
//
// A desktop shell (Electron, Tauri) supplies file storage by putting a bridge on window before the game's scripts load:
//   window.SARIVALTO_SAVES = {where: 'a sentence saying where saves are kept',
//     readAll(): Promise<{slot: save}>, write(slot, save): Promise, remove(slot): Promise}
// A save is a plain object (see saveGame in game.js); the slots are 'quick', 0, 1 and 2.
const store=(()=>{
  const KEY=s=>'sarivalto-save-'+s,SLOTS=['quick',0,1,2];
  // the browser's own storage (any of these can throw in a private window or with storage blocked)
  const local={where:'Saves are kept in this browser. Export a save to keep a copy as a file, or play through tools/serve.py to keep them in the saves folder.',
    async readAll(){const out={};for(const s of SLOTS){try{const v=JSON.parse(localStorage.getItem(KEY(s)));if(v)out[s]=v}catch(e){}}return out},
    async write(s,v){localStorage.setItem(KEY(s),JSON.stringify(v))},
    async remove(s){localStorage.removeItem(KEY(s))}};
  // files in the repo's saves/ folder, through tools/serve.py
  const ok=r=>{if(!r.ok)throw new Error('the save server said '+r.status);return r};
  const files={where:'Saves are kept in the game\'s saves folder (saves/quick.json, saves/0.json and so on). Commit and push them to play on from another machine.',
    async readAll(){return(await fetch('api/saves',{cache:'no-store'}).then(ok)).json()},
    async write(s,v){await fetch('api/saves/'+s,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}).then(ok)},
    async remove(s){await fetch('api/saves/'+s,{method:'DELETE'}).then(ok)}};
  let back=window.SARIVALTO_SAVES||local;const cache={};
  return{get where(){return back.where},
    async init(){
      // served by tools/serve.py: use the saves folder, and the first time, move over any saves this browser has that it doesn't
      if(!window.SARIVALTO_SAVES&&location.protocol!='file:'){try{const got=await files.readAll();back=files;Object.assign(cache,got);
        const mine=await local.readAll();for(const s of SLOTS)if(mine[s]&&!got[s]){cache[s]=mine[s];await files.write(s,mine[s])}return}catch(e){}}
      try{Object.assign(cache,await back.readAll())}catch(e){console.warn('Saves could not be read:',e)}},
    // (a fresh copy each time, so playing on from a loaded save can't change the save itself)
    get:s=>cache[s]==null?null:structuredClone(cache[s]),
    put(s,v){cache[s]=structuredClone(v);return back.write(s,v)},
    remove(s){delete cache[s];return back.remove(s)}}})();
