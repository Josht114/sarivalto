// Checks the daily conversations for lines that lean on an earlier day: a reply or an opener that mentions something the same
// person only talked about on an earlier day (and not earlier in today's conversation), with nothing to say whether the player
// heard that day. A player may skip any day with anyone, so each such line needs a heard-before condition (on a reply,
// 'Name:4|Name:9' or '!Name:4|Name:9'; on an opener, another opener in the fifth part) or to explain itself.
// Run: node tools/daily-continuity.js [slug ...]     (--json for a list a script can read; --ok to mark everything it finds now as
// looked at and fine, in content/daily/continuity-ok.txt)
// It prints each suspect line, the words that give it away, and the earlier days they were said on. It's a guide, not a judge:
// words count only if they're distinctive (few of the cast use them), so some suspects are fine and a few misses are possible.
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','content','daily');
const args=process.argv.slice(2),json=args.includes('--json'),mark=args.includes('--ok'),want=args.filter(a=>!a.startsWith('--'));
// names everyone knows of (people, places, factions), which don't need an earlier conversation to mention
const dataSrc=fs.readFileSync(path.join(__dirname,'..','js','data.js'),'utf8');
const common=new Set([...dataSrc.matchAll(/name:'([^']+)'/g)].map(m=>m[1].toLowerCase()).flatMap(n=>[n,...n.split(' ')]));
[...dataSrc.matchAll(/^(\w+):\['([^']+)'/gm)].forEach(m=>m[2].toLowerCase().split(/\W+/).forEach(w=>common.add(w)));
const STOP=new Set(('september sunday monday tuesday wednesday thursday friday saturday morning evening night island sarivalto king prince princess '+
  'party church cola oil vote mountain volcano ash snow funeral gathering tremor eruption today tomorrow yesterday').split(' '));
// the words of a line, stage directions included (they're on screen too); a word ends its possessive
const words=t=>((t||'').toLowerCase().match(/[a-z][a-z'-]{3,}/g)||[]).map(w=>w.replace(/'s$|s'$/,''));
// how many people's files use each word: a word most of the cast uses is ordinary English, not a running thread
const all=fs.readdirSync(dir).filter(f=>f.endsWith('.js')),DF={};
for(const f of all)for(const w of new Set(words(fs.readFileSync(path.join(dir,f),'utf8'))))DF[w]=(DF[w]||0)+1;
// lines already looked at and found fine (content/daily/continuity-ok.txt: one 'slug day kind: line' per row), so only new ones show
const okFile=path.join(dir,'continuity-ok.txt'),OK=new Set(fs.existsSync(okFile)?fs.readFileSync(okFile,'utf8').split('\n').map(l=>l.trim()).filter(Boolean):[]);
const out=[];
for(const f of all.filter(f=>!want.length||want.includes(f.replace(/\.js$/,'')))){const D={};
  try{new Function('DAILY',fs.readFileSync(path.join(dir,f),'utf8'))(D)}catch(e){console.log(f,'ERROR',e.message);continue}
  for(const name in D){const days=Object.keys(D[name]).map(Number).sort((a,b)=>a-b);
    // everything each day said: the opener, the answers (however deep) and the closing line; not the player's own replies
    const said={};const walk=(o,into)=>{for(const r of o||[]){const a=r[1];if(Array.isArray(a)){words(a[0]).forEach(w=>into.add(w));walk(a[1],into)}else words(a).forEach(w=>into.add(w))}};
    for(const d of days){const s=new Set(words(D[name][d][0]));walk(D[name][d][1],s);words(D[name][d][2]).forEach(w=>s.add(w));said[d]=s}
    for(const d of days){const[op,reps,,,alt]=D[name][d];
      const earlier=w=>days.filter(e=>e<d&&said[e].has(w));
      const odd=w=>!STOP.has(w)&&!common.has(w)&&(DF[w]||0)<=10&&earlier(w).length&&days.filter(e=>said[e].has(w)).length<=10;
      const flag=(kind,line,hits)=>{if(OK.has(f.replace(/\.js$/,'')+' '+d+' '+kind+': '+line))return;const ds=[...new Set(hits.flatMap(earlier))].sort((a,b)=>a-b);
        out.push({slug:f.replace(/\.js$/,''),name,day:d,kind,line,hits,days:ds})};
      // the opener: names (a capitalised word mid-sentence) said on an earlier day (unless it already has another opener for those who heard)
      if(!alt){const caps=new Set(((op||'').match(/(?<=[a-z,;:] |\) )[A-Z][a-z'-]{2,}/g)||[]).map(w=>w.toLowerCase().replace(/'s$/,'')));const h=[...new Set(words(op))].filter(w=>caps.has(w)&&odd(w));if(h.length)flag('opener',op,h)}
      // the replies on the first level: distinctive words not in today's opener, said on an earlier day
      const today=new Set(words(op));Object.values(alt||{}).forEach(o=>words(o).forEach(w=>today.add(w)));
      for(const r of reps||[]){if(r[2])continue;const h=[...new Set(words(r[0]))].filter(w=>!today.has(w)&&odd(w));if(h.length)flag('reply',r[0],h)}}}}
if(mark){fs.appendFileSync(okFile,out.map(o=>o.slug+' '+o.day+' '+o.kind+': '+o.line).join('\n')+(out.length?'\n':''));console.log(out.length+' lines marked as fine')}
else if(json)console.log(JSON.stringify(out));
else{for(const o of out)console.log(`${o.slug} ${o.day} ${o.kind}: ${o.line.slice(0,100)}  <- ${o.hits.join(', ')} (day ${o.days.join(', ')})`);
  console.log(out.length+' suspect lines ('+out.filter(o=>o.kind=='reply').length+' replies, '+out.filter(o=>o.kind=='opener').length+' openers)')}
