// Generates the wiki in wiki/ (one page per location, faction and person) plus wiki/all-in-one.html, from js/data.js and content/notes.js.
// Usage: node tools/build-wiki.js   (no dependencies; run node tools/build-map.js first if the island changed)
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),out=path.join(root,'wiki'),box={};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'js/world.js'),'utf8')+';this.D={L,LINKS,POS,FACTIONS,FACTION_TREE,GROUPS,FACTION_AT,BOATS,NPCS,DOORS,QUEST_DAYS,QUEST_EVENTS,QUEST_TITLES,QUEST_EVENINGS,QUESTS,ITEMS,DISTRICTS,DISTRICT_OF,TRAM_STOPS,MAPS,EX,BLD,atWorkWhen,eveningAt,OPEN_ON,OPEN_AT,TRACK_INFO,MUSIC_AT};'+fs.readFileSync(path.join(root,'content/notes.js'),'utf8')+';this.N=NOTES;'+fs.readFileSync(path.join(root,'js/mapgeo.js'),'utf8')+';this.G=MAP_GEO;',box);
const {L,LINKS,POS,FACTIONS,FACTION_TREE,GROUPS,FACTION_AT,BOATS,NPCS,DOORS,QUEST_DAYS,QUEST_EVENTS,QUEST_TITLES,QUEST_EVENINGS,QUESTS,ITEMS,DISTRICTS,DISTRICT_OF,TRAM_STOPS,MAPS,EX,BLD,atWorkWhen,eveningAt,OPEN_ON,OPEN_AT,TRACK_INFO,MUSIC_AT}=box.D,NOTES=box.N,MAP_GEO=box.G;
// where someone is by day and by night (the game's routines, js/game.js): at work, where NPCS places them, or at home. Someone
// with no home stays at work; null means not on the island at all.
const whereAt=(n,night)=>eveningAt(n,night)?n.evening.m:atWorkWhen(n,night)||!L[n.home]?n.m:n.home,atHomeWhen=(n,night)=>!eveningAt(n,night)&&!atWorkWhen(n,night)&&!!L[n.home];
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
  (n.also||[]).forEach(f=>{if(!FACTIONS[f])bad.push('also (unknown faction '+f+')')});
  if(n.partner&&NPCS.find(o=>o.name==n.partner)?.partner!=n.name)bad.push('partner ('+n.partner+' must be someone who names '+n.name+' as their partner)');
  if(n.faction&&n.faction!='none'&&!FACTIONS[n.faction])bad.push('faction (unknown id '+n.faction+')');
  if(bad.length)throw new Error('NPC '+(n.name||JSON.stringify(n))+' is missing or has a bad: '+bad.join(', '))});
const A=(c,k,id,t)=>`<a href="${c.single?'#'+k+'-'+id:c.pre+k+'/'+id+'.html'}">${esc(t)}</a>`;
const home=c=>c.single?'#home':c.pre+'index.html',lst=(c,k)=>c.single?'#'+k:c.pre+k+'/index.html';
// top: the place on the island a building interior stands in (its own id for a place). Homes are linked with that place in brackets.
const top=id=>POS[id]||!parentOf(id)?id:top(parentOf(id));
const HOMES=new Set([...NPCS.map(n=>n.home),...Object.keys(L).filter(i=>/^(house|villa|shack|tent)_/.test(i))]);
const locA=(c,id)=>A(c,'locations',id,L[id][0])+(HOMES.has(id)&&top(id)!=id?' ('+esc(L[top(id)][0])+')':''),facA=(c,id)=>id=='none'?'Unaligned':A(c,'factions',id,FACTIONS[id][0]),npcA=(c,n)=>A(c,'npcs',nid(n),n.name).replace('<a ',`<a class="${n.gender=='female'?'gf':'gm'}" `);
// ---- Plans: a map of one place, drawn from its tiles. Buildings you can go into link to their pages, exits link to the
// neighbouring place (and carry data-loc, so the island map viewer opens that place's plan instead), and people are marked.
const href=(c,k,id)=>c.single?'#'+k+'-'+id:c.pre+k+'/'+id+'.html';
const GROUND={snow:'#eef3f7',sand:'#e8dcb4',rock:'#dde1e4',farm:'#eef3f7',harbour:'#eef3f7',deck:'#9aa0a6'};
const TILE={',':'#cdbf9f',E:'#cdbf9f',p:'#a8794c',F:'#a8794c','~':'#6aa6d6',b:'#6aa6d6',T:'#3e7a5e',R:'#8d959e',v:'#e8601e',l:'#6b737c',P:'#bcc2c8',a:'#e2d8bf',s:'#e8dcb4',r:'#dde1e4','.':'#eef3f7'};
const KINDCOL={mast:'#c0392b',derrick:'#e0a100',tent:'#5e7a4a',shelter:'#9fc6e0',van:'#f2efe6',fountain:'#9fc6e0',manhole:'#3a3d44'};
const halo='stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"';
function plan(c,id){const M=MAPS[id],h=M.length,w=M[0].length,S=16,th=L[id][3],fs=L[id][4],tc=ch=>th=='deck'&&ch=='p'?'#9aa0a6':TILE[ch];
  let o=`<svg class="plan-svg" viewBox="0 0 ${w*S} ${h*S}" style="max-width:${w*26}px" role="img" aria-label="Map of ${esc(L[id][0])}" font-family="system-ui,-apple-system,'Segoe UI',sans-serif"><rect width="${w*S}" height="${h*S}" fill="${GROUND[th]}"/>`;
  // ground, paths, water and trees: one rectangle per run of the same colour along each row
  for(let y=0;y<h;y++)for(let x=0;x<w;){const col=tc(M[y][x]);let e=x+1;while(e<w&&tc(M[y][e])==col)e++;if(col&&col!=GROUND[th])o+=`<rect x="${x*S}" y="${y*S}" width="${(e-x)*S}" height="${S}" fill="${col}"/>`;x=e}
  // tram rails
  for(let y=0;y<h;y++){const a=M[y].indexOf('l'),b=M[y].lastIndexOf('l');if(a>=0)o+=`<path d="M${a*S} ${y*S+4}H${(b+1)*S}M${a*S} ${y*S+12}H${(b+1)*S}" stroke="#c9ced4" stroke-width="1.5"/>`}
  // buildings, and other labelled features
  fs.forEach(([x,y,fw,fh,t,lb,st])=>{const X=x*S,Y=y*S,W=fw*S,H=fh*S,cx=X+W/2,cy=Y+H/2;
    if(t=='#'||st){const b=BLD[st]||{},fill=KINDCOL[b.kind]||b.wall||'#b9a98a',d=DOORS.find(d=>d[0]==id&&d[1]>=x&&d[1]<x+fw&&d[2]>=y&&d[2]<y+fh),
        fsz=Math.max(6,Math.min(10,W/Math.max(4,(lb||'').length)*1.7));
      const g=`<rect x="${X+1}" y="${Y+1}" width="${W-2}" height="${H-2}" rx="3" fill="${fill}" stroke="${b.roof||'#4a3b2a'}" stroke-width="2"/>`+
        (lb?`<text x="${cx}" y="${cy+fsz/3}" text-anchor="middle" font-size="${fsz.toFixed(1)}" font-weight="bold" fill="#2b2118" ${halo}>${esc(lb)}</text>`:'');
      o+=d?`<a href="${href(c,'locations',d[5])}" class="bld"><title>${esc(L[d[5]][0])} (go inside)</title>${g}</a>`:g}
    else if(lb&&!'~T'.includes(t))o+=`<text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="7.5" font-style="italic" fill="#2b2118" ${halo}>${esc(lb)}</text>`});
  // doors
  DOORS.filter(d=>d[0]==id).forEach(d=>{o+=`<a href="${href(c,'locations',d[5])}" class="bld"><title>Door to ${esc(L[d[5]][0])}</title><rect x="${d[1]*S+4}" y="${d[2]*S+7}" width="8" height="9" fill="#5b3a26" stroke="#fff" stroke-width="1"/></a>`});
  // exits to neighbouring places, and boat berths
  EX[id].filter(e=>'LRTBF'.includes(e.s)).forEach(e=>{const X=e.x*S,Y=e.y*S,f=e.s=='F',side=f?(e.ax>e.x?'L':'R'):e.s,
      t=(f?'Boat to ':'')+L[e.to][0],x=side=='L'?X+3:side=='R'?X+S-3:X+S/2,y=Y+S/2+3,an=side=='L'?'start':side=='R'?'end':'middle';
    o+=`<a href="${href(c,'locations',e.to)}" data-loc="${e.to}" class="exit"><title>${esc(L[e.to][0])}</title><text x="${x}" y="${y}" text-anchor="${an}" font-size="9" font-weight="bold" fill="#1f6f9a" ${halo}>${({L:'← ',T:'↑ ',B:'↓ '})[side]||''}${esc(t)}${side=='R'?' →':''}</text></a>`});
  // people
  NPCS.filter(n=>n.m==id).forEach(n=>{const X=n.x*S+S/2,Y=n.y*S+S/2;
    o+=`<a href="${href(c,'npcs',nid(n))}"><title>${esc(n.name)}, ${esc(n.job)}</title><circle cx="${X}" cy="${Y}" r="4.5" fill="${n.body}" stroke="#fff" stroke-width="1.5"/><text x="${X}" y="${Y-7}" text-anchor="middle" font-size="7" fill="#2b2118" ${halo}>${esc(n.name)}</text></a>`});
  return o+'</svg>'}
const info=rows=>'<table class="info">'+rows.filter(Boolean).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')+'</table>';
const list=a=>a.length?a.join(', '):'—';
// ---- Access: the island opens up a part at a time (OPEN_ON by district, OPEN_AT for a place of its own; js/data.js), as the game
// does it (js/game.js): a place is open from its day on, and a road from an open place into a closed one is blocked by snow.
const openDay=id=>OPEN_AT[id]??OPEN_ON[DISTRICT_OF[id]]??1,OPEN_DAYS=[...new Set(Object.keys(POS).map(openDay))].sort((a,b)=>a-b);
const isOpenOn=(id,d)=>openDay(id)<=d,blockedOn=d=>LINKS.map(l=>l.split(' ')).filter(([a,,b])=>isOpenOn(a,d)!=isOpenOn(b,d)).map(([a,,b])=>isOpenOn(a,d)?[a,b]:[b,a]);
// a small map of the island on a day: open places in their district's colour, the ones opening that day outlined in gold, closed
// ones grey; snow marks the blocked roads
function accessMap(d){const G=MAP_GEO,ids=Object.keys(G.cells);
  const cell=id=>{const o=isOpenOn(id,d),nw=openDay(id)==d;return`<polygon points="${G.cells[id]}" fill="${o?DISTRICTS[DISTRICT_OF[id]][1]:'#8f969c'}" stroke="${o?'#fff':'#7a8086'}" stroke-width="2"${nw?' class="new"':''}><title>${esc(L[id][0])}${o?'':' (closed)'}</title></polygon>`};
  const news=ids.filter(id=>openDay(id)==d).map(id=>`<polygon points="${G.cells[id]}" fill="none" stroke="#e0a100" stroke-width="7"/>`).join('');
  const roads=LINKS.map(l=>l.split(' ')).map(([a,,b])=>{const p=G.rp[a],q=G.rp[b],o=isOpenOn(a,d)&&isOpenOn(b,d);return`<path d="M${p[0]} ${p[1]}L${q[0]} ${q[1]}" stroke="${o?'#6b5a3a':'#5a5f66'}" stroke-width="5" stroke-opacity="${o?.9:.5}"/>`}).join('');
  const snow=blockedOn(d).map(([a,b])=>{const p=G.rp[a],q=G.rp[b];return`<circle cx="${(p[0]+q[0])/2}" cy="${(p[1]+q[1])/2}" r="15" fill="#fff" stroke="#c0392b" stroke-width="5"/>`}).join('');
  const dots=Object.keys(G.rp).map(id=>`<circle cx="${G.rp[id][0]}" cy="${G.rp[id][1]}" r="9" fill="${isOpenOn(id,d)?'#2b2118':'#5a5f66'}"/>`).join('');
  return`<svg viewBox="80 90 1340 720" role="img" aria-label="The island on ${d} September"><defs><clipPath id="cl${d}"><polygon points="${G.coast}"/></clipPath></defs>`+
    `<polygon points="${G.coast}" fill="#cfd8dc"/><g clip-path="url(#cl${d})">${ids.map(cell).join('')}${news}</g><polygon points="${G.coast}" fill="none" stroke="#4a3b2a" stroke-width="4"/>${roads}${snow}${dots}</svg>`}
// The Audio page: each piece of background sound, what you hear and where; then every location with the sound it has, by place
function audioBody(c){const trackOf=id=>Object.keys(MUSIC_AT).find(k=>MUSIC_AT[k].includes(id)),here=id=>{const k=trackOf(id);return k?TRACK_INFO[k][0]:''};
  const tracks=Object.keys(TRACK_INFO).map(k=>`<h3>${esc(TRACK_INFO[k][0])}</h3><p>${esc(TRACK_INFO[k][1])}</p><p><small>Plays at: ${MUSIC_AT[k].map(id=>A(c,'locations',id,L[id][0])).join(', ')}</small></p>`).join('');
  const g={};Object.keys(L).filter(id=>id!='tram').forEach(id=>(g[top(id)]??=[]).push(id));
  const head='<colgroup><col style="width:50%"><col></colgroup><thead><tr><th data-col="0" class="asc">Location</th><th data-col="1">Background audio</th></tr></thead>';
  const all=Object.keys(L).filter(id=>id!='tram'),n=all.filter(trackOf).length;
  return `<h1>Audio</h1><p>The background sound each place has, made in the browser as you play. Places without any are quiet.
Radio Sarivalto, when it is switched on (the Radio button, or Listen on a transistor radio), plays instead of all of it, anywhere. The Music button
turns the music and place sounds off and on, and the volume is set on the Options tab of the game's menu.</p><h2>Tracks</h2>${tracks}
<h2>Every location</h2><p><small>${n} of ${all.length} locations have background audio.</small></p>`+filter+
    Object.keys(g).sort((a,b)=>L[a][0].localeCompare(L[b][0])).map(p=>`<section class="grp"><h3>${locA(c,p)}</h3><div class="wide"><table class="grid sortable">${head}<tbody>${
      g[p].sort((a,b)=>(a==p?-1:b==p?1:L[a][0].localeCompare(L[b][0]))).map(id=>`<tr data-s="${esc((L[id][0]+' '+L[p][0]+' '+(here(id)||'none')).toLowerCase())}"><td>${A(c,'locations',id,L[id][0])}</td><td data-v="${esc(here(id)||'~')}">${here(id)?esc(here(id)):'<small>None</small>'}</td></tr>`).join('')}</tbody></table></div></section>`).join('')}
function accessBody(c){const place=id=>A(c,'locations',id,L[id][0]),list=a=>a.length?a.join(', '):'–';
  const rows=OPEN_DAYS.map(d=>{const opens=Object.keys(POS).filter(id=>openDay(id)==d),dists=[...new Set(opens.map(id=>DISTRICT_OF[id]))],whole=k=>Object.keys(POS).filter(i=>DISTRICT_OF[i]==k).every(i=>openDay(i)==d);
    return`<tr><th>${d} September</th><td>${dists.length?dists.map(k=>`<span class="sw" style="background:${DISTRICTS[k][1]}"></span>${esc(DISTRICTS[k][0])}${whole(k)?'':' <small>(part)</small>'}`).join(', '):'–'}</td><td>${list(opens.map(place))}</td><td>${Object.keys(POS).filter(id=>isOpenOn(id,d)).length} of ${Object.keys(POS).length}</td>`+
      `<td>${list(blockedOn(d).map(([a,b])=>place(a)+' &rarr; '+place(b)))}</td></tr>`}).join('');
  return`<h1>Access</h1><p>The island doesn't open all at once. The story begins on <b>22 August</b> at ${A(c,'locations','langley','CIA Headquarters')} in Langley, before you reach the island at all. From <b>1 September</b> the island opens up a part at a time, as the snow is cleared; once a place is open it stays open for the rest of the month.</p>
<h2>What's open when</h2><p>Each part opens on the day below (most of it a district at a time; Central opens in two parts, with Kelp Cola HQ a day after Kingsgrad and the palace). The last column lists the roads still blocked that day, from the open side to the closed one.</p>
<div class="qtable"><table class="sched access"><thead><tr><th>Day</th><th>District opens</th><th>Places that open</th><th>Open</th><th>Blocked roads</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Day by day</h2><p>The island on each day it changes: open places in their district's colour, the ones that open that day outlined in gold, closed ones grey, and a ring on each blocked road.</p>
<div class="accmaps">${OPEN_DAYS.map(d=>`<figure>${accessMap(d)}<figcaption>${d} September</figcaption></figure>`).join('')}</div>
<h2>In the game</h2><ul>
<li><b>Snow banks.</b> A road from an open place into a closed one has a deep bank of snow across it, one step in from the edge, and the way out is labelled <i>(closed)</i>. Walking into the snow says so.</li>
<li><b>The sign.</b> Beside every snow bank stands a red and white <b>DANGER / SNOW</b> sign. Read it (E) and it says: <i>DANGER! SNOW. NO ACCESS.</i> and names the place the road leads to.</li>
<li><b>Boats and trams.</b> Boats don't run to a harbour that is still snowed in, and the tram only offers the stops that are open.</li>
<li><b>The map.</b> On the island map in the game (the menu's Map tab, or the map on the wall at home), the places not open yet are shaded, and a snow bank marks each blocked road.</li>
<li><b>Getting there.</b> Moving from 22 August into September takes you from Langley to your home on the island; going back to 22 August takes you back to Langley. The <i>Jump to</i> test list still goes anywhere.</li></ul>
<h2>Changing it</h2><p>The days are set in <code>js/data.js</code>: <code>OPEN_ON</code> gives each district its day, and <code>OPEN_AT</code> gives a single place a day of its own. The map shapes the game shades come from <code>tools/build-map.js</code>, which writes <code>js/mapgeo.js</code>.</p>`}
function locBody(c,id){const[name,w,h,,fs]=L[id],k=kind(id),par=parentOf(id),fac=FACTION_AT[id],
    // a place on the island also lists everyone in the buildings that stand in it, saying which building they are in
    out=!!POS[id],at=x=>x&&x!='none'&&(out?top(x)==id:x==id),people=NPCS.filter(n=>at(n.m)||at(n.loc)),res=NPCS.filter(n=>at(n.home)),day=NPCS.filter(n=>at(whereAt(n,false))),night=NPCS.filter(n=>at(whereAt(n,true))),
    where=x=>out&&x&&x!=id&&top(x)==id?' · '+A(c,'locations',x,L[x][0]):'';
  const labels=[...new Set(fs.filter(f=>f[5]).map(f=>f[5]))],ent=DOORS.filter(d=>d[0]==id);
  const dd=distOf(id),rows=[['Type',KIND[k]],dd?['District',`<span class="sw" style="background:${DISTRICTS[dd][1]}"></span>`+esc(DISTRICTS[dd][0])]:['District','Travels between districts'],par&&['Inside',locA(c,par)],POS[id]&&['Open from',`<a href="${lst(c,'access')}">${openDay(id)} September</a>`],fac&&['Faction base',`<span class="sw" style="background:${FACTIONS[fac][1]}"></span>`+facA(c,fac)],['Size',w+' × '+h+' tiles'],
    walk[id]&&['Walk to',list(walk[id].map(x=>locA(c,x)))],BOATS[id]&&['Boat to',list(BOATS[id].map(x=>locA(c,x)))],
    ent.length&&['Buildings to enter',list(ent.map(d=>A(c,'locations',d[5],L[d[5]][0])))],people.length&&['People',out?`<a href="#people">${people.length}</a>`:list(people.map(n=>npcA(c,n)))],res.length&&['Residents',out?`<a href="#residents">${res.length}</a>`:list(res.map(n=>npcA(c,n)))]];
  let t=`<h1>${esc(name)}</h1>${info(rows)}<p>${esc((NOTES.locations||{})[id]||name+' is a '+KIND[k].toLowerCase()+' on the island.')}</p>`;
  if(POS[id])t+=`<h2 style="clear:both">Map</h2><div class="plan">${plan(c,id)}</div>`;
  if(k=='harbour'&&!BOATS[id]&&id!='oilrig')t+=`<p>No boats run to or from this harbour.</p>`;
  if(labels.length)t+=`<h2>Points of interest</h2><ul>${labels.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`;
  const ts=TRAM_STOPS.indexOf(id),tn=TRAM_STOPS.length,tram=ts<0?'':`<li>By tram from ${locA(c,TRAM_STOPS[(ts+tn-1)%tn])} (the tram goes on to ${locA(c,TRAM_STOPS[(ts+1)%tn])})</li>`;
  if(walk[id]||BOATS[id]||tram)t+=`<h2>Getting here</h2><ul>${(walk[id]||[]).map(x=>`<li>On foot from ${locA(c,x)}</li>`).join('')}${(BOATS[id]||[]).map(x=>`<li>By boat from ${locA(c,x)}</li>`).join('')}${tram}</ul>`;
  if(ent.length)t+=`<h2>Inside</h2><ul>${ent.map(d=>`<li>${A(c,'locations',d[5],L[d[5]][0])}</li>`).join('')}</ul>`;
  if(res.length)t+=`<h2 id="residents">Residents</h2><ul>${res.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)}${where(n.home)}</li>`).join('')}</ul>`;
  if(people.length)t+=`<h2 id="people">People</h2><ul>${people.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} (${facA(c,n.faction)})${where(at(n.m)?n.m:n.loc)}</li>`).join('')}</ul>`;
  // who is actually here by day, and at night (people at work, or at home)
  const here=(a,nt)=>a.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)}${where(whereAt(n,nt))}${atHomeWhen(n,nt)?' <small>(at home)</small>':''}</li>`).join('');
  if(day.length||night.length)t+=`<h2 id="daynight">Here by day and at night</h2><div class="cols2"><div><h3>By day <small>(${day.length})</small></h3><ul>${here(day,false)||'<li>No one</li>'}</ul></div>`+
    `<div><h3>At night <small>(${night.length})</small></h3><ul>${here(night,true)||'<li>No one</li>'}</ul></div></div>`;
  return t}
const inFac=(n,id)=>n.faction==id||(n.also||[]).includes(id);
// every name in a faction's hierarchy must be someone in that faction, and appear only once
const treePlaced=t=>[...[].concat(t.lead||[]),...(t.top||[]),...(t.next||[]),...Object.values(t.under||{}).flat()].filter(Boolean);
Object.entries(FACTION_TREE).forEach(([id,t])=>{const bad=m=>{console.error('FACTION_TREE.'+id+': '+m);process.exit(1)},placed=treePlaced(t),seen=new Set();
  [...placed,...Object.keys(t.under||{})].forEach(nm=>{const n=NPCS.find(o=>o.name==nm);if(!n||!inFac(n,id))bad(nm+' is not in the faction')});
  placed.forEach(nm=>{if(seen.has(nm))bad(nm+' appears twice');seen.add(nm)});
  Object.keys(t.under||{}).forEach(nm=>{if(!placed.includes(nm))bad(nm+' has people under them but is not in the chart')});
  if(t.next&&!t.joint)bad('next is only for a joint top')});
// a faction's hierarchy chart: the leader, then each important member with the people under them (to any depth), then everyone
// else, all joined by lines (more than three people with no one under them make one box listing them all). With a joint top, the
// top members share one box and the next tier and everyone else hang below it.
function orgChart(c,id){const t=FACTION_TREE[id]||{},col=FACTIONS[id][1],mem=NPCS.filter(n=>inFac(n,id)),by=nm=>NPCS.find(n=>n.name==nm),U=t.under||{};
  const placed=new Set(treePlaced(t)),rest=mem.filter(n=>!placed.has(n.name)).map(n=>n.name);
  const node=(n,cls='')=>`<div class="node ${cls}" style="border-top-color:${col}">${npcA(c,n)}<small>${esc(n.job)}</small></div>`;
  const li=(nm,cls='')=>`<li>${node(by(nm),cls)}${(U[nm]||[]).length?`<ul>${kids(U[nm])}</ul>`:''}</li>`;
  const kids=(names,label)=>!names.length?'':(names.length<=3||names.some(nm=>U[nm]))&&!label?names.map(nm=>li(nm)).join(''):
    `<li><div class="node grp" style="border-top-color:${col}">${label?`<b>${label}</b>`:''}${names.map(nm=>{const n=by(nm);return`<span>${npcA(c,n)} <small>${esc(n.job)}</small></span>`}).join('')}</div></li>`;
  const tops=t.top||[],members=kids(rest,tops.length?'Members':''),jointBelow=(t.next||[]).map(nm=>li(nm,'top')).join('')+members;
  const below=t.joint?`<li><div class="node top joint" style="border-top-color:${col}">${tops.map(nm=>`<span>${npcA(c,by(nm))}<small>${esc(by(nm).job)}</small></span>`).join('')}</div>${jointBelow?`<ul>${jointBelow}</ul>`:''}</li>`
    :tops.map(nm=>li(nm,'top')).join('')+members;
  const head=Array.isArray(t.lead)?`<div class="node lead joint" style="border-top-color:${col}">${t.lead.map(nm=>`<span>${npcA(c,by(nm))}<small>${esc(by(nm).job)}</small></span>`).join('')}</div>`:t.lead?node(by(t.lead),'lead'):`<div class="node lead vacant" style="border-top-color:${col}"><b>${esc(t.vacant||'Leader: vacant')}</b></div>`;
  return `<div class="org"><ul><li>${head}${below?`<ul>${below}</ul>`:''}</li></ul></div>`}
// the Quests page: the whole 30-day schedule, a row per day grouped into weeks, a column per main faction
// and the CIA (the factions' main quests in the morning; George's CIA quests in the evening, marked with a moon), with the island-wide days across
// every column (an intro day, or day 0, shows the main quests made for it so far, from QUESTS); then each
// faction's totals; then every quest in the game so far, main quests by day and then side quests, with their steps
const Q_COLS=['communist','royal','cola','oil','church','syndicate','democrat','cia'];
const weekOf=d=>d==0?0:Math.min(5,Math.ceil(d/7));
// the main quests made for a day of the schedule (day 0 is 22 August, before the month begins: day -9 in the game)
// a quest on the table that's in the game: a quest of that title on that day; it gets a tick
const inGame=(t,d)=>Object.values(QUESTS).some(Q=>Q.title==t&&(Q.day==d||Q.day==null)),tick=ok=>ok?'<b class="tick" title="In the game">&#10003;</b> ':'';
const mainsOn=d=>Object.keys(QUESTS).filter(id=>QUESTS[id].main&&QUESTS[id].day==(d==0?-9:d));
const qDate=d=>d<1?(31+d)+' August':d+' September';
// a quest step, as the Quests tab lists it, with what it gives you
function qStep(c,st,Q){const extra=[st.if?'only if you choose to '+(Q.choices?.[st.if]||st.if):'',...Object.entries(st.points||{}).map(([f,n])=>(n>0?'+':'')+n+' point for '+FACTIONS[f][0]),st.bring?'hand over '+st.bring.map(id=>ITEMS[id].name.toLowerCase()).join(', '):'',st.enter?st.speaker+' is waiting there to speak':'',st.gift?'you get the '+ITEMS[st.gift].name.toLowerCase():'',st.price?'$'+st.price+' from CIA funds':'',
    ...[st.gives||[]].flat().map(id=>(QUESTS[id].main?'gives the main quest ':'gives the side quest ')+QUESTS[id].title)].filter(Boolean);
  return`<li>${esc(st.what)}${extra.length?` <small>(${esc(extra.join('; '))})</small>`:''}</li>`}
function questBlock(c,id){const Q=QUESTS[id],g=NPCS.find(n=>n.name==Q.giver),from=Object.keys(QUESTS).find(k=>QUESTS[k].done.some(st=>[st.gives||[]].flat().includes(id)));
  const how=Q.main?(Q.start?'Yours from the start of a new game':Q.ring?'A telephone call on the morning of '+qDate(Q.day):Q.given?'Given when '+QUESTS[from].title+' is done':(Q.call?'Offered on the morning video call':'Offered in person')+' on '+qDate(Q.day)):
    Q.given?'Given during '+(from?QUESTS[from].title:'another quest'):Q.opens?'Offered once '+Q.opens.map(p=>L[p][0]).join(' and ')+' are open':'Offered from '+qDate(Q.from??1);
  return`<div class="qcard"><h3>${esc(Q.title)} <small>${Q.main?'Main quest':'Side quest'}</small></h3>${info([['From',g?npcA(c,g):esc(Q.giver)],['How you get it',esc(how)]])}<p>${esc(Q.text)}</p><ol>${Q.done.map(st=>qStep(c,st,Q)).join('')}</ol></div>`}
// the day a side quest can first be had: its first day (from), the day the places it needs are open (opens), or the day of the
// quest that gives it to you (given)
function sideDay(id){const Q=QUESTS[id];if(Q.given){const from=Object.keys(QUESTS).find(k=>QUESTS[k].done.some(st=>[st.gives||[]].flat().includes(id)));return from?Math.max(0,QUESTS[from].day??1):1}
  return Math.max(Q.from??1,...(Q.opens||[]).map(openDay))}
function questsBody(c){const sides0=Object.keys(QUESTS).filter(id=>!QUESTS[id].main),sideOn=d=>sides0.filter(id=>sideDay(id)==d);const head=Q_COLS.map(f=>`<th><span class="sw" style="background:${FACTIONS[f][1]}"></span>${A(c,'factions',f,FACTIONS[f][0])}</th>`).join('');
  const rows=Array.from({length:31},(_,d)=>{const w=weekOf(d),first=d==0||d==1||(d-1)%7==0&&d<=29,span=Array.from({length:31},(_,k)=>k).filter(k=>weekOf(k)==w).length,ev=QUEST_EVENTS[d];
    const wk=first?`<th class="wk" rowspan="${span}">${w?'Week '+w:''}</th>`:'';
    const side=`<td>${sideOn(d).map(id=>`<span class="qs" title="From ${esc(QUESTS[id].giver)}">${tick(true)}${esc(QUESTS[id].title)}</span>`).join(' ')}</td>`;
    const cells=ev&&!ev[1]?`<td class="evrow" colspan="${Q_COLS.length}">${esc(ev[0])}</td>`+side:Q_COLS.map(f=>{const q=QUEST_DAYS[f],col=FACTIONS[f][1];
      const made=mainsOn(d).map(id=>QUESTS[id].title).join(', then ');
      if(ev&&ev[1]==f)return`<td class="qi" style="border-color:${col}">${tick(!!made)}${esc(made||ev[0])}</td>`;
      if(q&&q.intro==d)return`<td><span class="qi" style="border-color:${col};color:${col}">${tick(!!made)}${esc(made||'Intro')}</span></td>`;
      const ev2=QUEST_EVENINGS[d]?.[f];if(ev2)return`<td><span class="qq" style="background:${col}" title="In the evening">${tick(inGame(ev2,d))}&#9790; ${esc(ev2)}</span></td>`;
      if(q&&q.days.includes(d)){const t=QUEST_TITLES[d]?.[f]||'Quest';return`<td><span class="qq" style="background:${col}">${tick(inGame(t,d))}${esc(t)}</span></td>`}return'<td></td>'}).join('')+(ev&&!ev[1]?'':side);
    return`<tr class="${first&&d?'wkstart':''}">${wk}<td class="day">${d}</td>${cells}</tr>`}).join('');
  const sum=Q_COLS.filter(f=>QUEST_DAYS[f]).map(f=>`<tr><td><span class="sw" style="background:${FACTIONS[f][1]}"></span>${A(c,'factions',f,FACTIONS[f][0])}</td><td>${QUEST_DAYS[f].intro}</td><td>${QUEST_DAYS[f].days.map(d=>QUEST_TITLES[d]?.[f]?`${d} (${esc(QUEST_TITLES[d][f])})`:d).join(', ')}</td><td>${QUEST_DAYS[f].days.length}</td></tr>`).join('')+
    `<tr><td><span class="sw" style="background:${FACTIONS.cia[1]}"></span>${A(c,'factions','cia',FACTIONS.cia[0])} <small>(George, evenings)</small></td><td>0</td><td>${Object.keys(QUEST_EVENINGS).map(d=>`${d} (${esc(QUEST_EVENINGS[d].cia)})`).join(', ')}</td><td>${Object.keys(QUEST_EVENINGS).length}</td></tr>`;
  const mains=Object.keys(QUESTS).filter(id=>QUESTS[id].main).sort((a,b)=>QUESTS[a].day-QUESTS[b].day),sides=Object.keys(QUESTS).filter(id=>!QUESTS[id].main);
  return `<h1>Quests</h1><p>The game runs over the 30 days of September. It opens on day 0 (22 August, at CIA Headquarters) with the CIA's game intro; over the first week each of the seven main factions is introduced on its own day, and from then on two factions (or more) have quests on most mornings, and from the second week, every three or four evenings, George at Langley has a job for the CIA. Three days belong to the whole island: Event 1 on day 14, the volcano on day 21 and the finale on day 30. The intro quests made so far are named in the schedule; <a href="#made">the quests in the game so far</a> are described below it.</p>
<p>There are two kinds of quest. A <b>main quest</b> belongs to a day: its giver offers it that morning (a gold star), you can take on only one main quest a day, and you can't sit and wait for the evening until it's done. A <b>side quest</b> (a silver star, or given to you during another quest) can be taken on and done at any time. Chuck offers his on the morning video call, on the big screen in the Hidden Radio Room; George, at Langley, takes the evening calls. The side quests are listed on the day they can first be had. George's evening quests are marked with a moon (&#9790;). A tick (&#10003;) marks the quests that are in the game already.</p>
<div class="qtable"><table class="sched"><thead><tr><th>Week</th><th>Day</th>${head}<th>Side quests</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>By faction</h2><table class="sched sum"><thead><tr><th>Faction</th><th>Intro</th><th>Quest days</th><th>Quests</th></tr></thead><tbody>${sum}</tbody></table>
<h2 id="made">The quests in the game so far</h2><h3>Main quests</h3>${mains.map((id,i)=>(i&&QUESTS[mains[i-1]].day==QUESTS[id].day?'':`<h4>${esc(qDate(QUESTS[id].day))}</h4>`)+questBlock(c,id)).join('')}
<h3>Side quests</h3>${sides.map(id=>questBlock(c,id)).join('')}`}
// the Hierarchies page: every faction's chart side by side, main factions first, for comparing them
function hierBody(c){const ids=Object.keys(FACTIONS),card=id=>`<section class="hcard" style="border-top-color:${FACTIONS[id][1]}"><h3><span class="sw" style="background:${FACTIONS[id][1]}"></span>${A(c,'factions',id,FACTIONS[id][0])} <small>${NPCS.filter(n=>inFac(n,id)).length} people</small></h3>${orgChart(c,id)}</section>`;
  return `<h1>Hierarchies</h1><p>Every faction's hierarchy side by side: its leader at the top, its important members below, and everyone else beneath them. Click a faction for its page.</p>
<h2>Factions</h2><div class="hgrid">${ids.filter(i=>!GROUPS.includes(i)).map(card).join('')}</div>
<h2>Groups</h2><div class="hgrid">${ids.filter(i=>GROUPS.includes(i)).map(card).join('')}</div>
<h2>Unaffiliated</h2><p>Everyone who belongs to no faction or group, grouped by the district they work in.</p><div class="hgrid">${unaffChart(c)}</div>`}
// the chart of everyone with no faction (and in no group): one box per district, listing who works there, their job and where
function unaffChart(c){const un=NPCS.filter(n=>n.faction=='none'&&!(n.also||[]).length),by={};if(!un.length)return'<p>Everyone belongs to a faction or a group.</p>';un.forEach(n=>(by[distOf(n.loc)||'']??=[]).push(n));
  const box=d=>`<li><div class="node grp" style="border-top-color:${DISTRICTS[d]?DISTRICTS[d][1]:'var(--bd)'}"><b>${esc(DISTRICTS[d]?DISTRICTS[d][0]:'Elsewhere')} · ${by[d].length}</b>${by[d].map(n=>`<span>${npcA(c,n)} <small>${esc(n.job)}, ${esc(L[top(n.loc)][0])}</small></span>`).join('')}</div></li>`;
  const ds=[...Object.keys(DISTRICTS),''].filter(d=>by[d]);
  return `<section class="hcard full" style="border-top-color:var(--mut)"><h3>Unaffiliated <small>${un.length} people</small></h3><div class="org"><ul><li><div class="node lead vacant" style="border-top-color:var(--mut)"><b>No faction</b></div><ul>${ds.map(box).join('')}</ul></li></ul></div></section>`}
function facBody(c,id){const[name,col,badge,desc]=FACTIONS[id],bases=Object.keys(FACTION_AT).filter(l=>FACTION_AT[l]==id),mem=NPCS.filter(n=>inFac(n,id)),qd=QUEST_DAYS[id],wk=qd?qd.days:[],side=GROUPS.includes(id);
  const grid='<div class="weeks">'+Array.from({length:30},(_,i)=>{const d=i+1,ev=QUEST_EVENTS[d];return wk.includes(d)?`<span class="on" style="background:${col}" title="${esc(QUEST_TITLES[d]?.[id]||'Quest')}">${d}</span>`:qd&&qd.intro==d?`<span class="intro" style="border-color:${col};color:${col}" title="Introduction">${d}</span>`:ev?`<span class="ev" title="${esc(ev[0])}">${d}</span>`:`<span>${d}</span>`}).join('')+'</div>';
  return `<h1><span class="sw big" style="background:${col}"></span>${esc(name)}</h1>${info([['Type',side?"Group (can't win)":'Faction (can win)'],['Badge',esc(badge)],['Bases',list(bases.map(l=>locA(c,l)))],['People',list(mem.map(n=>npcA(c,n)))],!side&&['Quests',qd?`${wk.length} (days ${wk.join(', ')}); introduced on day ${qd.intro}`:'None scheduled']])}
<p>${esc(desc)}</p><p>${esc((NOTES.factions||{})[id]||'')}</p>`+(mem.length||FACTION_TREE[id]?`<h2>Hierarchy</h2>${orgChart(c,id)}`:'')+(side?'':`<h2>Quest days</h2><p>The faction's days in September (the game's 30 days): its introduction (outlined), its quests (filled) and the days given to the whole island (hatched). <a href="${lst(c,'quests')}">The full schedule</a>.</p>${grid}`)+`
<h2>Bases</h2><ul>${bases.map(l=>`<li>${locA(c,l)}</li>`).join('')||'<li>None yet</li>'}</ul>`+(mem.length?`<h2>People</h2><ul>${mem.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} · ${locA(c,n.loc)}</li>`).join('')}</ul>`:'')}
// where someone is by day or by night, as a link with the place it is in and whether they are at work or at home
function when(c,n,night){const x=whereAt(n,night);if(!x)return'Off the island';return A(c,'locations',x,L[x][0])+(top(x)!=x?' <small>('+esc(L[top(x)][0])+')</small>':'')+' <small>· '+(atHomeWhen(n,night)?'at home':'at work')+'</small>'}
// a colour for each place on the island, used in the People tables (in front of every location, by the place it is in)
const PLACE_COL=(()=>{
  // colours as different from each other as possible: from a grid of candidate colours, pick each next one as far as possible
  // (in CIE Lab, roughly how different colours look) from every one already picked, keeping to mid lightness so that every
  // swatch shows up on both the light and dark pages
  const lin=v=>(v/=255)<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4),f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;
  const lab=([r,g,b])=>{[r,g,b]=[r,g,b].map(lin);const X=f((r*.4124+g*.3576+b*.1805)/.9505),Y=f(r*.2126+g*.7152+b*.0722),Z=f((r*.0193+g*.1192+b*.9505)/1.089);return[116*Y-16,500*(X-Y),200*(Y-Z)]};
  const cand=[];for(let r=0;r<256;r+=17)for(let g=0;g<256;g+=17)for(let b=0;b<256;b+=17){const c=lab([r,g,b]);if(c[0]>=38&&c[0]<=82)cand.push({rgb:[r,g,b],c})}
  const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]),ids=Object.keys(POS).sort((a,b)=>L[a][0].localeCompare(L[b][0])),picked=[];
  let best=cand.reduce((a,b)=>Math.hypot(b.c[1],b.c[2])>Math.hypot(a.c[1],a.c[2])?b:a);  // start with the most vivid
  while(picked.length<ids.length){picked.push(best);let far=-1;for(const k of cand){const m=Math.min(...picked.map(p=>d(p.c,k.c)));if(m>far){far=m;best=k}}}
  // hand them out so that places next to each other (joined by a path, or close on the overview map) get the most different
  // colours: the busiest places first, each taking the colour left that is furthest from its neighbours' colours
  const near={};ids.forEach(a=>near[a]=new Set());LINKS.forEach(l=>{const[a,,b]=l.split(' ');if(near[a]&&near[b]){near[a].add(b);near[b].add(a)}});
  ids.forEach(a=>ids.forEach(b=>{if(a!=b&&Math.hypot(POS[a][0]-POS[b][0],POS[a][1]-POS[b][1])<230){near[a].add(b);near[b].add(a)}}));
  const out={},col={},left=[...picked];[...ids].sort((a,b)=>near[b].size-near[a].size||L[a][0].localeCompare(L[b][0])).forEach(id=>{
    const nb=[...near[id]].filter(n=>col[n]),sc=k=>nb.length?Math.min(...nb.map(n=>d(col[n].c,k.c))):0;
    const k=left.reduce((a,b)=>sc(b)>sc(a)?b:a);left.splice(left.indexOf(k),1);col[id]=k;out[id]='#'+k.rgb.map(v=>v.toString(16).padStart(2,'0')).join('')});
  return out})();
const placeSw=(id,big)=>PLACE_COL[id]?`<span class="sw${big?' big':''}" style="background:${PLACE_COL[id]}" title="${esc(L[id][0])}"></span>`:'';
const gen=n=>n.gender=='male'?'Male':n.gender=='female'?'Female':'Not specified';
function npcBody(c,n){const nt=(NOTES.npcs||{})[nid(n)]||{};
  return `<h1>${esc(n.name)}</h1>${info([['Name',esc(n.name)],['Gender',gen(n)],n.partner&&['Partner',npcA(c,NPCS.find(o=>o.name==n.partner))],['Job',esc(n.job)],['Faction',facA(c,n.faction)],['Groups',(n.also||[]).length?n.also.map(f=>`<span class="sw" style="background:${FACTIONS[f][1]}"></span>`+facA(c,f)).join(', '):'None'],['Main location',locA(c,n.loc)],['Home',n.home=='none'?'No fixed home':locA(c,n.home)],nt.work&&['Works at',locA(c,nt.work)],['By day',when(c,n,false)],['By night',when(c,n,true)],
   ['Look',`<span class="sw" style="background:${n.body}"></span> clothes <span class="sw" style="background:${n.hair}"></span> hair`]])}<p>${esc(nt.note||n.name+' lives on the island.')}</p>`}
const filter='<input class="filter" type="search" placeholder="Filter…" aria-label="Filter">';
function idxBody(c,k){let t;
  if(k=='locations'){const g={};Object.keys(L).forEach(i=>(g[kind(i)]??=[]).push(i));
    t='<h1>Locations</h1>'+filter+Object.keys(KIND).filter(x=>g[x]).map(x=>`<h2>${KIND[x]}</h2><ul class="cols">${g[x].map(i=>`<li data-s="${esc((L[i][0]+' '+x+' '+(DISTRICTS[distOf(i)]||[''])[0]).toLowerCase())}">${locA(c,i)}</li>`).join('')}</ul>`).join('')+
      '<h2>By district</h2>'+Object.keys(DISTRICTS).map(d=>`<h3><span class="sw" style="background:${DISTRICTS[d][1]}"></span>${esc(DISTRICTS[d][0])}</h3><ul class="cols">${Object.keys(POS).filter(i=>DISTRICT_OF[i]==d).map(i=>`<li data-s="${esc((L[i][0]+' '+DISTRICTS[d][0]).toLowerCase())}">${locA(c,i)}</li>`).join('')}</ul>`).join('')}
  else if(k=='factions'){const un=NPCS.filter(n=>n.faction=='none'&&!(n.also||[]).length);// one section per faction, listing everyone aligned with it
    const sec=i=>{const mem=NPCS.filter(n=>inFac(n,i));
      return`<h3><span class="sw" style="background:${FACTIONS[i][1]}"></span>${facA(c,i)}</h3><p><small>${esc(FACTIONS[i][3])}</small></p><ul>${mem.length?mem.map(n=>`<li data-s="${esc((n.name+' '+n.job+' '+FACTIONS[i][0]).toLowerCase())}">${npcA(c,n)}, ${esc(n.job)}</li>`).join(''):'<li>No members yet</li>'}</ul>`},ids=Object.keys(FACTIONS);
    t='<h1>Factions</h1><p>Compare every faction\'s leadership on the <a href="'+lst(c,'hierarchies')+'">Hierarchies</a> page.</p>'+filter+'<h2>Factions</h2><p>The factions that can win the game.</p>'+ids.filter(i=>!GROUPS.includes(i)).map(sec).join('')+
      "<h2>Groups</h2><p>Groups that play a part in the story but can't win it.</p>"+ids.filter(i=>GROUPS.includes(i)).map(sec).join('')+
    (un.length?`<h2>Unaligned people</h2><ul>${un.map(n=>`<li>${npcA(c,n)}, ${esc(n.job)} · ${locA(c,n.loc)}</li>`).join('')}</ul>`:'')}
  else{// one table per place on the island (alphabetical), sorted by name; people based inside a building are listed under the
    // place it stands in. Click a column heading to sort that table by it.
    const where=(x,g)=>placeSw(top(x))+A(c,'locations',x,L[x][0])+(top(x)!=x&&top(x)!=g?' <small>('+esc(L[top(x)][0])+')</small>':'');
    const row=(n,g)=>{const f=n.faction=='none'?'Unaligned':FACTIONS[n.faction][0],note=((NOTES.npcs||{})[nid(n)]||{}).note||'';
      return `<tr data-s="${esc([n.name,f,L[n.loc][0],L[g][0],...[false,true].map(nt=>whereAt(n,nt)?L[whereAt(n,nt)][0]:''),n.home=='none'?'':L[n.home][0],n.job,gen(n),...(n.also||[]).map(x=>FACTIONS[x][0]),note].join(' ').toLowerCase())}"><td>${npcA(c,n)}</td><td>${gen(n)}</td>`+
        `<td data-v="${esc(f)}">${n.faction=='none'?'Unaligned':`<span class="sw" style="background:${FACTIONS[n.faction][1]}"></span>`+facA(c,n.faction)}</td>`+
        `<td data-v="${esc((n.also||[]).map(x=>FACTIONS[x][0]).join(' ')||'~')}">${(n.also||[]).map(x=>`<span class="sw" style="background:${FACTIONS[x][1]}"></span>`+facA(c,x)).join('<br>')||'—'}</td>`+
        [false,true].map(nt=>{const x=whereAt(n,nt);return x?`<td data-v="${esc(L[x][0])}">${where(x,g)}${atHomeWhen(n,nt)?' <small>(home)</small>':''}</td>`:'<td data-v="~">Off the island</td>'}).join('')+
        `<td data-v="${esc(n.home=='none'?'~':L[n.home][0])}">${n.home=='none'?'No fixed home':where(n.home,g)}</td>`+
        `<td>${esc(n.job)}</td><td class="note">${esc(note)}</td></tr>`};
    const head='<colgroup><col style="width:8%"><col style="width:7.5%"><col style="width:11%"><col style="width:9.5%"><col style="width:12%"><col style="width:12%"><col style="width:11%"><col style="width:9%"><col></colgroup><thead><tr>'+
      ['Name','Gender','Faction','Groups','By day','By night','Home','Job','Notes'].map((h,k)=>`<th${k<8?` data-col="${k}"`:''}${k==0?' class="asc"':''}>${h}</th>`).join('')+'</tr></thead>';
    const g={};NPCS.forEach(n=>(g[top(n.loc)]??=[]).push(n));
    // the couples (NPCS partner), each once: both people with their faction or group, their home (shared or not) and where they work
    const fac=n=>n.faction=='none'?'Unaligned':`<span class="sw" style="background:${FACTIONS[n.faction][1]}"></span>`+facA(c,n.faction);
    const pairs=NPCS.filter(n=>n.partner).map(n=>[n,NPCS.find(o=>o.name==n.partner)]).filter(([a,b])=>b&&a.name<b.name);
    const partners=pairs.length?`<section><h2>Partners <small>(${pairs.length} couples)</small></h2><div class="wide"><table class="grid"><thead><tr><th>Partner</th><th>Faction or group</th><th>Partner</th><th>Faction or group</th><th>Home</th><th>Work</th></tr></thead><tbody>${
      pairs.map(([a,b])=>`<tr><td>${npcA(c,a)}</td><td>${fac(a)}</td><td>${npcA(c,b)}</td><td>${fac(b)}</td><td>${a.home==b.home?where(a.home,top(a.home))+' <small>(together)</small>':where(a.home,top(a.home))+' and '+where(b.home,top(b.home))}</td><td>${esc(a.name)}: ${where(a.loc,top(a.loc))}<br>${esc(b.name)}: ${where(b.loc,top(b.loc))}</td></tr>`).join('')}</tbody></table></div></section>`:'';
    t='<h1>People</h1>'+filter+`<p><small>${NPCS.length} people (${NPCS.filter(n=>n.gender=='male').length} men, ${NPCS.filter(n=>n.gender=='female').length} women${NPCS.some(n=>!n.gender)?`, ${NPCS.filter(n=>!n.gender).length} not specified`:''}), grouped by the place they are based in, with where each of them is by day and by night. Click a column heading to sort a table by it.</small></p>`+partners+
      Object.keys(g).sort((a,b)=>L[a][0].localeCompare(L[b][0])).map(i=>`<section class="grp"><h2>${placeSw(i,1)}${locA(c,i)} <small>(${g[i].length})</small></h2><div class="wide"><table class="grid sortable">${head}<tbody>${
        g[i].sort((a,b)=>a.name.localeCompare(b.name)).map(n=>row(n,i)).join('')}</tbody></table></div></section>`).join('')}
  return t}
const svg=fs.readFileSync(path.join(root,'docs/island-map.svg'),'utf8').replace(/<\?xml.*?\?>/,'');
function mapView(c){const ov=svg.replace(/href="\.\.\/wiki\/locations\/(\w+)\.html"/g,(m,id)=>'href="'+href(c,'locations',id)+'"');
  return `<div class="mapview"><p class="hint">Click a place to see a map of it.</p><div class="overview map">${ov}</div>`+
    Object.keys(POS).map(id=>`<div class="plan" data-plan="${id}" hidden><div class="planbar"><button type="button" class="back">← Island map</button><b>${esc(L[id][0])}</b><a href="${href(c,'locations',id)}">About this place →</a></div>${plan(c,id)}</div>`).join('')+'</div>'}
function homeBody(c){return `<h1>Sarivalto Wiki</h1><p>${esc(NOTES.about)}</p>${mapView(c)}
<ul class="cols"><li><b>${Object.keys(L).filter(i=>POS[i]).length}</b> places and <b>${Object.keys(L).filter(i=>!POS[i]).length}</b> building interiors: <a href="${lst(c,'locations')}">all locations</a></li><li><b>${Object.keys(FACTIONS).length-GROUPS.length}</b> <a href="${lst(c,'factions')}">factions</a> and <b>${GROUPS.length}</b> groups</li><li><b>${NPCS.length}</b> <a href="${lst(c,'npcs')}">people</a></li></ul>`}
const CSS=`/* a side quest in the Quests table: a silver-outlined chip */
.sched .tick{display:inline-block;width:1.15em;height:1.15em;line-height:1.15em;text-align:center;border-radius:50%;background:#1f7a3f;color:#fff;font-weight:bold;font-size:.85em;box-shadow:0 0 0 1px #fff;margin-right:2px}
.sched .qs{display:inline-block;margin:1px 0;padding:1px 6px;border:1px solid #9aa6b4;border-radius:10px;font-size:.85em;white-space:nowrap}
/* the Quests table kept narrow: the quests' names wrap within their columns */
.qtable .sched th,.qtable .sched td{white-space:normal;padding:3px 4px}.qtable .sched thead th{min-width:0;width:9%}.qtable .sched th.wk{width:auto}
.qtable .sched .qq,.qtable .sched .qi,.qtable .sched .qs{white-space:normal;line-height:1.2;padding:2px 5px}
/* the Quests page: a card per quest */
.qcard{border:1px solid #c8d2dc;border-radius:6px;padding:8px 12px;margin:8px 0 14px}.qcard h3{margin:2px 0 6px}.qcard h3 small{font-weight:normal;opacity:.7;font-size:.75em;margin-left:6px}.qcard ol{margin:6px 0 2px 1.2em;padding:0}.qcard small{opacity:.75}
/* faction hierarchy charts: boxes joined by lines, scrolling sideways on a narrow screen */
.org{overflow-x:auto;padding:4px 0 12px;margin:0 0 8px}
.org ul{display:flex;justify-content:center;position:relative;margin:0;padding:18px 0 0;list-style:none}
.org li{position:relative;display:flex;flex-direction:column;align-items:center;padding:18px 5px 0;margin:0}
.org li::before,.org li::after{content:'';position:absolute;top:0;right:50%;width:50%;height:18px;border-top:2px solid var(--bd)}
.org li::after{right:auto;left:50%;border-left:2px solid var(--bd)}
.org li:only-child{padding-top:0}.org li:only-child::before,.org li:only-child::after{display:none}
.org li:first-child::before,.org li:last-child::after{border:0}
.org li:last-child::before{border-right:2px solid var(--bd);border-radius:0 6px 0 0}
.org li:first-child::after{border-radius:6px 0 0 0}
.org ul ul::before{content:'';position:absolute;top:0;left:50%;height:18px;border-left:2px solid var(--bd)}
.org>ul{padding-top:0}.org>ul>li{padding-top:0}.org>ul>li::before,.org>ul>li::after{display:none}
.org .node{background:var(--card);border:1px solid var(--bd);border-top:4px solid;border-radius:6px;padding:6px 10px;text-align:center;min-width:110px;max-width:200px;font-size:.92em;line-height:1.3}
.org .node small{display:block;color:var(--mut);font-size:.82em}
.org .node.lead{font-size:1.05em;min-width:150px;box-shadow:0 1px 4px rgba(0,0,0,.12)}.org .node.lead a{font-weight:bold}
.org .node.joint{display:flex;gap:14px;max-width:none}.org .node.joint span{flex:1}
.org .node.vacant{font-style:italic;color:var(--mut)}
.org .node.grp{text-align:left;max-width:260px;display:flex;flex-direction:column;gap:3px}
.org .node.grp b{color:var(--mut);font-size:.85em;text-transform:uppercase;letter-spacing:.05em}
.org .node.grp span small{display:inline}
:root{--gf:#c2255c;--gm:#1864ab;--bg:#f4f1e6;--fg:#2b2118;--mut:#6b5f50;--card:#fffdf6;--bd:#d9d0bc;--ac:#1f6f9a;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--gf:#f783ac;--gm:#74c0fc;--bg:#10161d;--fg:#e6edf3;--mut:#9aa8b6;--card:#17202a;--bd:#2c3a48;--ac:#6fb7e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Georgia,serif}a{color:var(--ac)}a.gf{color:var(--gf)}a.gm{color:var(--gm)}
header{display:flex;gap:18px;align-items:baseline;flex-wrap:wrap;padding:12px 20px;background:var(--card);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:2}
.brand{font-weight:bold;letter-spacing:2px;text-decoration:none;color:var(--fg)}nav{display:flex;gap:14px}
main,.page{max-width:900px;margin:0 auto;padding:18px 20px 40px}h1{margin:.2em 0 .4em}h2{margin-top:1.6em;border-bottom:1px solid var(--bd);padding-bottom:.2em}
.info{float:right;margin:0 0 14px 20px;width:290px;max-width:100%;background:var(--card);border:1px solid var(--bd);border-collapse:collapse;font-size:14px}
.info th{text-align:left;vertical-align:top;padding:6px 8px;color:var(--mut);width:34%;border-bottom:1px solid var(--bd)}.info td{padding:6px 8px;border-bottom:1px solid var(--bd)}
.sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid #0006;margin-right:6px;vertical-align:-1px}.sw.big{width:22px;height:22px;vertical-align:-3px}
.wide{position:relative;left:50%;transform:translateX(-50%);width:min(1280px,calc(100vw - 32px));overflow-x:auto}
.grid{width:100%;min-width:900px;table-layout:fixed;border-collapse:collapse;font-size:14px;line-height:1.4;background:var(--card);border:1px solid var(--bd)}.grid th,.grid td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid var(--bd)}
.grid th{position:sticky;top:0;background:var(--card);color:var(--mut);white-space:nowrap}.grid th[data-col]{cursor:pointer}.grid th[data-col]:hover{color:var(--fg)}.grid th.asc:after{content:' ▲'}.grid th.desc:after{content:' ▼'}
.grid td{overflow-wrap:anywhere}.grid td:nth-child(3),.grid td:nth-child(4){white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.grid td.note{color:var(--mut)}.grid tbody tr:nth-child(even){background:color-mix(in srgb,var(--bd) 18%,transparent)}
.cols2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0 24px}.cols2 h3{margin:.6em 0 .2em}
.cols{columns:2 240px;list-style:none;padding:0}.cols li{break-inside:avoid;margin:0 0 8px}small{color:var(--mut)}
.map{width:100%;height:auto;border:1px solid var(--bd);border-radius:6px;display:block}.filter{width:100%;padding:8px 10px;font:inherit;border:1px solid var(--bd);border-radius:6px;background:var(--card);color:var(--fg)}
.weeks{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;max-width:420px}.weeks span{text-align:center;font:12px sans-serif;padding:5px 0;border:1px solid var(--bd);border-radius:3px;color:var(--mut)}.weeks .intro{border:2px solid;font-weight:bold;padding:4px 0}.weeks .ev{background:repeating-linear-gradient(45deg,transparent 0 3px,var(--bd) 3px 5px)}
.hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:14px;width:min(1400px,calc(100vw - 24px));position:relative;left:50%;transform:translateX(-50%);margin-bottom:18px}
.hcard{background:var(--card);border:1px solid var(--bd);border-top:4px solid;border-radius:8px;padding:8px 10px;min-width:0}.hcard h3{margin:2px 0 6px;font-size:1.05em}.hcard h3 small{color:var(--mut);font-weight:normal;font-size:.8em}.hcard .org{margin:0}.hcard.full{grid-column:1/-1}
@media (max-width:480px){.hgrid{grid-template-columns:1fr}}
.access td,.access th{vertical-align:top}.accmaps{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:8px 0 16px}.accmaps figure{margin:0;text-align:center}.accmaps svg{width:100%;height:auto;background:#d4ecf4;border-radius:8px}.accmaps figcaption{font-weight:bold;margin-top:2px}
.qtable{overflow-x:auto;width:min(1000px,calc(100vw - 24px));position:relative;left:50%;transform:translateX(-50%)}.qtable .sched{width:100%}.sched{border-collapse:collapse;font-size:.9em;margin:8px 0 16px}.sched th,.sched td{border:1px solid var(--bd);padding:3px 8px;text-align:center;white-space:nowrap}
.sched thead th{background:var(--card);font-size:.88em;white-space:normal;line-height:1.25;min-width:84px}.sched .wk{background:var(--card);font-weight:bold}.sched .day{color:var(--mut);font-variant-numeric:tabular-nums}
.sched tr.wkstart td,.sched tr.wkstart th{border-top:2px solid var(--fg)}
.sched .qq{display:inline-block;color:#fff;font-size:.82em;font-weight:bold;padding:1px 8px;border-radius:3px}
.sched .qi{display:inline-block;border:2px solid;font-size:.82em;font-weight:bold;padding:0 6px;border-radius:3px}
.sched td.qi{display:table-cell}.sched .evrow{font-weight:bold;letter-spacing:.04em;background:repeating-linear-gradient(45deg,var(--card) 0 6px,transparent 6px 12px)}
.sched.sum td{text-align:left}
.weeks .on{color:#fff;font-weight:bold}
[hidden]{display:none!important}a.loc{cursor:pointer}a.loc:hover rect,a.loc:focus rect{filter:brightness(1.08)}.mapview .hint{margin:0 0 6px;color:var(--mut);font-size:14px}
.plan{margin:8px 0}.plan-svg{display:block;width:100%;height:auto;border:1px solid var(--bd);border-radius:6px;margin:0 auto}a.bld:hover rect{stroke:#1f6f9a;stroke-width:3}a.exit:hover text{fill:#0b4a6e}
.planbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 8px}.planbar a{margin-left:auto}.back{font:inherit;font-size:14px;padding:5px 10px;border:1px solid var(--bd);border-radius:6px;background:var(--card);color:var(--fg);cursor:pointer}
footer{text-align:center;color:var(--mut);font-size:13px;padding:20px}@media (max-width:640px){.info{float:none;width:100%}}`;
const JS=`document.addEventListener('click',function(e){var v=e.target.closest('.mapview');if(!v)return;
  if(e.target.closest('.back')){v.querySelectorAll('.plan').forEach(function(p){p.hidden=true});v.querySelector('.overview').hidden=false;v.scrollIntoView({block:'nearest'});return}
  var a=e.target.closest('[data-loc]'),p=a&&v.querySelector('[data-plan="'+a.getAttribute('data-loc')+'"]');if(!p)return;e.preventDefault();
  v.querySelectorAll('.plan').forEach(function(q){q.hidden=q!=p});v.querySelector('.overview').hidden=true;v.scrollIntoView({block:'nearest'})});
document.addEventListener('input',function(e){if(!e.target.classList.contains('filter'))return;var q=e.target.value.toLowerCase();var a=e.target.closest('article');a.querySelectorAll('[data-s]').forEach(function(li){li.hidden=li.dataset.s.indexOf(q)<0});
  a.querySelectorAll('.grp').forEach(function(g){g.hidden=!g.querySelector('[data-s]:not([hidden])')})});
document.addEventListener('click',function(e){var th=e.target.closest('.sortable th[data-col]');if(!th)return;var t=th.closest('table'),k=+th.dataset.col,up=!th.classList.contains('asc'),b=t.tBodies[0];
  t.querySelectorAll('th').forEach(function(h){h.classList.remove('asc','desc')});th.classList.add(up?'asc':'desc');
  var v=function(r){var c=r.cells[k];return(c.dataset.v||c.textContent).toLowerCase()};
  Array.from(b.rows).sort(function(x,y){return(v(x)<v(y)?-1:v(x)>v(y)?1:0)*(up?1:-1)}).forEach(function(r){b.appendChild(r)})})`;
const nav=c=>`<header><a class="brand" href="${home(c)}">SARIVALTO WIKI</a><nav><a href="${lst(c,'locations')}">Locations</a><a href="${lst(c,'factions')}">Factions</a><a href="${lst(c,'npcs')}">People</a><a href="${lst(c,'hierarchies')}">Hierarchies</a><a href="${lst(c,'quests')}">Quests</a><a href="${lst(c,'access')}">Access</a><a href="${lst(c,'audio')}">Audio</a><a href="${c.single?'':c.pre}../island-map.svg">Map</a><a href="${c.single?'':c.pre}../index.html">Game</a></nav></header>`;
const pages=[{k:'',id:'home',title:'Home',body:homeBody,file:'index.html',pre:''}];
pages.push({k:'hierarchies',id:'hierarchies',title:'Hierarchies',body:hierBody,file:'hierarchies/index.html',pre:'../'});
pages.push({k:'quests',id:'quests',title:'Quests',body:questsBody,file:'quests/index.html',pre:'../'});
pages.push({k:'access',id:'access',title:'Access',body:accessBody,file:'access/index.html',pre:'../'});
pages.push({k:'audio',id:'audio',title:'Audio',body:audioBody,file:'audio/index.html',pre:'../'});
['locations','factions','npcs'].forEach(k=>pages.push({k,id:k,title:k=='npcs'?'People':k[0].toUpperCase()+k.slice(1),body:c=>idxBody(c,k),file:k+'/index.html',pre:'../'}));
Object.keys(L).forEach(i=>pages.push({id:'locations-'+i,title:L[i][0],body:c=>locBody(c,i),file:'locations/'+i+'.html',pre:'../'}));
Object.keys(FACTIONS).forEach(i=>pages.push({id:'factions-'+i,title:FACTIONS[i][0],body:c=>facBody(c,i),file:'factions/'+i+'.html',pre:'../'}));
NPCS.forEach(n=>pages.push({id:'npcs-'+nid(n),title:n.name,body:c=>npcBody(c,n),file:'npcs/'+nid(n)+'.html',pre:'../'}));
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'style.css'),CSS);
for(const p of pages){const c={pre:p.pre,single:false},f=path.join(out,p.file);fs.mkdirSync(path.dirname(f),{recursive:true});
  fs.writeFileSync(f,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.title)} · Sarivalto Wiki</title><link rel="stylesheet" href="${p.pre}style.css"></head><body>${nav(c)}<main><article>${p.body(c)}</article></main><footer>Sarivalto wiki, generated from the game data</footer><script>${JS}</script></body></html>`)}
const cs={pre:'',single:true};
fs.writeFileSync(path.join(out,'all-in-one.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sarivalto Wiki</title><style>${CSS}.page{display:none}.page:target{display:block}</style></head><body>${nav(cs)}${pages.map(p=>`<section class="page" id="${p.id}"><article>${p.body(cs)}</article></section>`).join('')}<footer>Sarivalto wiki, generated from the game data</footer><script>${JS};if(!location.hash)location.hash='#home'</script></body></html>`);
console.log('wiki: '+pages.length+' pages');
