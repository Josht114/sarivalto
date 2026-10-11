// Generates the wiki in wiki/ (one page per location, faction and person) plus wiki/all-in-one.html, from js/data.js and content/notes.js.
// Usage: node tools/build-wiki.js   (no dependencies; run node tools/build-map.js first if the island changed)
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'wiki'),box={};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+';this.D={L,LINKS,POS,FACTIONS,FACTION_AT,BOATS,NPCS,DOORS,QUEST_WEEKS,DISTRICTS,DISTRICT_OF};'+fs.readFileSync(path.join(root,'content/notes.js'),'utf8')+';this.N=NOTES;',box);
const {L,LINKS,POS,FACTIONS,FACTION_AT,BOATS,NPCS,DOORS,QUEST_WEEKS,DISTRICTS,DISTRICT_OF}=box.D,NOTES=box.N;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const KIND={town:'Settlement',road:'Road',site:'Notable site',nature:'Wilderness',harbour:'Harbour or sea',interior:'Interior'};
const kind=id=>POS[id]?POS[id][2]:'interior',parentOf=id=>{const d=DOORS.find(d=>d[5]==id);return d&&d[0]};
// district of a place; interiors take the district of the building they are in
const distOf=id=>id&&(DISTRICT_OF[id]||distOf(parentOf(id)));
Object.keys(POS).forEach(id=>{if(!DISTRICTS[DISTRICT_OF[id]])throw new Error(L[id][0]+' ('+id+') has no district in DISTRICT_OF')});
const walk={};LINKS.forEach(s=>{const[a,,b]=s.split(' ');(walk[a]??=[]).push(b);(walk[b]??=[]).push(a)});
const nid=n=>n.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),npcOf=id=>NPCS.find(n=>nid(n)==id);
// Every NPC must have a name, job, faction, main location and home (a building interior you can enter).
const BUILDINGS=new Set(DOORS.map(d=>d[5]));  // 'none' is allowed for someone with no fixed home
NPCS.forEach(n=>{const bad=['name','job','faction','loc','home'].filter(k=>!n[k]);if(n.loc&&!L[n.loc])bad.push('loc (unknown id '+n.loc+')');
  if(n.home&&n.home!='none'&&!BUILDINGS.has(n.home))bad.push('home ('+n.home+' is not a building interior in DOORS)');
  if(n.faction&&n.faction!='none'&&!FACTIONS[n.faction])bad.push('faction (unknown id '+n.faction+')');
  if(bad.length)throw new Error('NPC '+(n.name||JSON.stringify(n))+' is missing or has a bad: '+bad.join(', '))});
const A=(c,k,id,t)=>`<a href="${c.single?'#'+k+'-'+id:c.pre+k+'/'+id+'.html'}">${esc(t)}</a>`;
const home=c=>c.single?'#home':c.pre+'index.html',lst=(c,k)=>c.single?'#'+k:c.pre+k+'/index.html';
const locA=(c,id)=>A(c,'locations',id,L[id][0]),facA=(c,id)=>id=='none'?'Unaligned':A(c,'factions',id,FACTIONS[id][0]),npcA=(c,n)=>A(c,'npcs',nid(n),n.name);
const info=rows=>'<table class="info">'+rows.filter(Boolean).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')+'</table>';
const list=a=>a.length?a.join(', '):'—';
function locBody(c,id){const[name,w,h,,fs]=L[id],k=kind(id),par=parentOf(id),fac=FACTION_AT[id],people=NPCS.filter(n=>n.m==id||n.loc==id),res=NPCS.filter(n=>n.home==id);
  const labels=[...new Set(fs.filter(f=>f[5]).map(f=>f[5]))],ent=DOORS.filter(d=>d[0]==id);
  const dd=distOf(id),rows=[['Type',KIND[k]],['District',`<span class="sw" style="background:${DISTRICTS[dd][1]}"></span>`+esc(DISTRICTS[dd][0])],par&&['Inside',locA(c,par)],fac&&['Faction base',`<span class="sw" style="background:${FACTIONS[fac][1]}"></span>`+facA(c,fac)],['Size',w+' × '+h+' tiles'],
    walk[id]&&['Walk to',list(walk[id].map(x=>locA(c,x)))],BOATS[id]&&['Boat to',list(BOATS[id].map(x=>locA(c,x)))],
    ent.length&&['Buildings to enter',list(ent.map(d=>locA(c,d[5])))],people.length&&['People',list(people.map(n=>npcA(c,n)))],res.length&&['Residents',list(res.map(n=>npcA(c,n)))]];
  let t=`<h1>${esc(name)}</h1>${info(rows)}<p>${esc((NOTES.locations||{})[id]||name+' is a '+KIND[k].toLowerCase()+' on the island.')}</p>`;
  if(k=='harbour'&&!BOATS[id]&&id!='oilrig')t+=`<p>No boats run to or from this harbour.</p>`;
  if(labels.length)t+=`<h2>Points of interest</h2><ul>${labels.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
  if(walk[id]||BOATS[id])t+=`<h2>Getting here</h2><ul>${(walk[id]||[]).map(x=>`<li>On foot from ${locA(c,x)}</li>`).join('')}${(BOATS[id]||[]).map(x=>`<li>By boat from ${locA(c,x)}</li>`).join('')}</ul>`;
  if(ent.length)t+=`<h2>Inside</h2><ul>${ent.map(d=>`<li>${locA(c,d[5])}</li>`).join('')}</ul>`;
  if(res.length)t+=`<h2>Residents</h2><ul>${res.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)}</li>`).join('')}</ul>`;
  if(people.length)t+=`<h2>People</h2><ul>${people.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} (${facA(c,n.faction)})</li>`).join('')}</ul>`;
  return t}
function facBody(c,id){const[name,col,badge,desc]=FACTIONS[id],bases=Object.keys(FACTION_AT).filter(l=>FACTION_AT[l]==id),mem=NPCS.filter(n=>n.faction==id),wk=QUEST_WEEKS[id]||[];
  const grid='<div class="weeks">'+Array.from({length:19},(_,i)=>`<span class="${wk.includes(i+1)?'on':''}" style="${wk.includes(i+1)?'background:'+col:''}">${i+1}</span>`).join('')+'</div>';
  return `<h1><span class="sw big" style="background:${col}"></span>${esc(name)}</h1>${info([['Badge',esc(badge)],['Bases',list(bases.map(l=>locA(c,l)))],['People',list(mem.map(n=>npcA(c,n)))],['Quests',wk.length?wk.length+' (weeks '+wk.join(', ')+')':'None scheduled']])}
<p>${esc(desc)}</p><p>${esc((NOTES.factions||{})[id]||'')}</p><h2>Quest weeks</h2><p>Weeks of the 19-week cycle in which this faction has quests:</p>${grid}
<h2>Bases</h2><ul>${bases.map(l=>`<li>${locA(c,l)}</li>`).join('')||'<li>None yet</li>'}</ul>`+(mem.length?`<h2>People</h2><ul>${mem.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} · ${locA(c,n.loc)}</li>`).join('')}</ul>`:'')}
function npcBody(c,n){const nt=(NOTES.npcs||{})[nid(n)]||{};
  return `<h1>${esc(n.name)}</h1>${info([['Name',esc(n.name)],['Job',esc(n.job)],['Faction',facA(c,n.faction)],['Main location',locA(c,n.loc)],['Home',n.home=='none'?'No fixed home':locA(c,n.home)],nt.work&&['Works at',locA(c,nt.work)],n.m&&n.m!=n.loc&&['Currently found',locA(c,n.m)],
   ['Look',`<span class="sw" style="background:${n.body}"></span> clothes <span class="sw" style="background:${n.hair}"></span> hair`]])}<p>${esc(nt.note||n.name+' lives on the island.')}</p>`}
const filter='<input class="filter" type="search" placeholder="Filter…" aria-label="Filter">';
function idxBody(c,k){let t;
  if(k=='locations'){const g={};Object.keys(L).forEach(i=>(g[kind(i)]??=[]).push(i));
    t='<h1>Locations</h1>'+filter+Object.keys(KIND).filter(x=>g[x]).map(x=>`<h2>${KIND[x]}</h2><ul class="cols">${g[x].map(i=>`<li data-s="${esc((L[i][0]+' '+x+' '+DISTRICTS[distOf(i)][0]).toLowerCase())}">${locA(c,i)}</li>`).join('')}</ul>`).join('')+
      '<h2>By district</h2>'+Object.keys(DISTRICTS).map(d=>`<h3><span class="sw" style="background:${DISTRICTS[d][1]}"></span>${esc(DISTRICTS[d][0])}</h3><ul class="cols">${Object.keys(POS).filter(i=>DISTRICT_OF[i]==d).map(i=>`<li data-s="${esc((L[i][0]+' '+DISTRICTS[d][0]).toLowerCase())}">${locA(c,i)}</li>`).join('')}</ul>`).join('')}
  else if(k=='factions'){const un=NPCS.filter(n=>n.faction=='none');// one section per faction, listing everyone aligned with it
    t='<h1>Factions</h1>'+filter+Object.keys(FACTIONS).map(i=>{const mem=NPCS.filter(n=>n.faction==i);
      return`<h2><span class="sw" style="background:${FACTIONS[i][1]}"></span>${facA(c,i)}</h2><p><small>${esc(FACTIONS[i][3])}</small></p><ul>${mem.length?mem.map(n=>`<li data-s="${esc((n.name+' '+n.job+' '+FACTIONS[i][0]).toLowerCase())}">${npcA(c,n)}, ${esc(n.job)}</li>`).join(''):'<li>No members yet</li>'}</ul>`}).join('')+
    (un.length?`<h2>Unaligned people</h2><ul>${un.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} · ${locA(c,n.loc)}</li>`).join('')}</ul>`:'')}
  else t='<h1>People</h1>'+filter+'<ul class="cols">'+NPCS.map(n=>`<li data-s="${esc([n.name,n.job,n.faction=='none'?'unaligned':FACTIONS[n.faction][0],L[n.loc][0]].join(' ').toLowerCase())}">${npcA(c,n)}<br><small>${esc(n.job)} · ${facA(c,n.faction)} · ${locA(c,n.loc)} · ${n.home=='none'?'no fixed home':'lives in '+locA(c,n.home)}</small></li>`).join('')+'</ul>';
  return t}
const svg=fs.readFileSync(path.join(root,'docs/island-map.svg'),'utf8').replace(/<\?xml.*?\?>/,'');
function homeBody(c){return `<h1>Sarivalto Wiki</h1><p>${esc(NOTES.about)}</p>${c.single?`<div class="map">${svg}</div>`:`<p><img class="map" src="${c.pre}../docs/island-map.svg" alt="Map of the island"></p>`}
<ul class="cols"><li><b>${Object.keys(L).filter(i=>POS[i]).length}</b> places and <b>${Object.keys(L).filter(i=>!POS[i]).length}</b> building interiors: <a href="${lst(c,'locations')}">all locations</a></li><li><b>${Object.keys(FACTIONS).length}</b> <a href="${lst(c,'factions')}">factions</a></li><li><b>${NPCS.length}</b> <a href="${lst(c,'npcs')}">people</a></li></ul>`}
const CSS=`:root{--bg:#f4f1e6;--fg:#2b2118;--mut:#6b5f50;--card:#fffdf6;--bd:#d9d0bc;--ac:#1f6f9a;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#10161d;--fg:#e6edf3;--mut:#9aa8b6;--card:#17202a;--bd:#2c3a48;--ac:#6fb7e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Georgia,serif}a{color:var(--ac)}
header{display:flex;gap:18px;align-items:baseline;flex-wrap:wrap;padding:12px 20px;background:var(--card);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:2}
.brand{font-weight:bold;letter-spacing:2px;text-decoration:none;color:var(--fg)}nav{display:flex;gap:14px}
main,.page{max-width:900px;margin:0 auto;padding:18px 20px 40px}h1{margin:.2em 0 .4em}h2{margin-top:1.6em;border-bottom:1px solid var(--bd);padding-bottom:.2em}
.info{float:right;margin:0 0 14px 20px;width:290px;max-width:100%;background:var(--card);border:1px solid var(--bd);border-collapse:collapse;font-size:14px}
.info th{text-align:left;vertical-align:top;padding:6px 8px;color:var(--mut);width:34%;border-bottom:1px solid var(--bd)}.info td{padding:6px 8px;border-bottom:1px solid var(--bd)}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid #0006;margin-right:6px;vertical-align:-1px}.sw.big{width:22px;height:22px;vertical-align:-3px}
.cols{columns:2 240px;list-style:none;padding:0}.cols li{break-inside:avoid;margin:0 0 8px}small{color:var(--mut)}
.map{width:100%;height:auto;border:1px solid var(--bd);border-radius:6px;display:block}.filter{width:100%;padding:8px 10px;font:inherit;border:1px solid var(--bd);border-radius:6px;background:var(--card);color:var(--fg)}
.weeks{display:grid;grid-template-columns:repeat(19,1fr);gap:3px;max-width:640px}.weeks span{text-align:center;font:12px sans-serif;padding:5px 0;border:1px solid var(--bd);border-radius:3px;color:var(--mut)}.weeks .on{color:#fff;font-weight:bold}
footer{text-align:center;color:var(--mut);font-size:13px;padding:20px}@media (max-width:640px){.info{float:none;width:100%}}`;
const JS=`document.addEventListener('input',function(e){if(!e.target.classList.contains('filter'))return;var q=e.target.value.toLowerCase();e.target.closest('article').querySelectorAll('li[data-s]').forEach(function(li){li.hidden=li.dataset.s.indexOf(q)<0})})`;
const nav=c=>`<header><a class="brand" href="${home(c)}">SARIVALTO WIKI</a><nav><a href="${lst(c,'locations')}">Locations</a><a href="${lst(c,'factions')}">Factions</a><a href="${lst(c,'npcs')}">People</a></nav></header>`;
const pages=[{k:'',id:'home',title:'Home',body:homeBody,file:'index.html',pre:''}];
['locations','factions','npcs'].forEach(k=>pages.push({k,id:k,title:k[0].toUpperCase()+k.slice(1),body:c=>idxBody(c,k),file:k+'/index.html',pre:'../'}));
Object.keys(L).forEach(i=>pages.push({id:'locations-'+i,title:L[i][0],body:c=>locBody(c,i),file:'locations/'+i+'.html',pre:'../'}));
Object.keys(FACTIONS).forEach(i=>pages.push({id:'factions-'+i,title:FACTIONS[i][0],body:c=>facBody(c,i),file:'factions/'+i+'.html',pre:'../'}));
NPCS.forEach(n=>pages.push({id:'npcs-'+nid(n),title:n.name,body:c=>npcBody(c,n),file:'npcs/'+nid(n)+'.html',pre:'../'}));
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'style.css'),CSS);
for(const p of pages){const c={pre:p.pre,single:false},f=path.join(out,p.file);fs.mkdirSync(path.dirname(f),{recursive:true});
  fs.writeFileSync(f,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.title)} · Sarivalto Wiki</title><link rel="stylesheet" href="${p.pre}style.css"></head><body>${nav(c)}<main><article>${p.body(c)}</article></main><footer>Sarivalto wiki, generated from the game data</footer><script>${JS}</script></body></html>`)}
const cs={pre:'',single:true};
fs.writeFileSync(path.join(out,'all-in-one.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sarivalto Wiki</title><style>${CSS}.page{display:none}.page:target{display:block}</style></head><body>${nav(cs)}${pages.map(p=>`<section class="page" id="${p.id}"><article>${p.body(cs)}</article></section>`).join('')}<footer>Sarivalto wiki, generated from the game data</footer><script>${JS};if(!location.hash)location.hash='#home'</script></body></html>`);
console.log('wiki: '+pages.length+' pages');
