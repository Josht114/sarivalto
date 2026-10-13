const T=16,VW=15,VH=10;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');cv.width=VW*T;cv.height=VH*T;
const hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+1,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};


// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
// ---- The calendar: the game runs through the 30 days of September, starting on the 1st (?day=N starts on another day for
// testing). Sleeping in your own bed moves on to the next morning; the calendar on the wall at home shows the date.
const MONTH='September',DAYS=30;let DAY=Math.min(DAYS,Math.max(1,parseInt(new URLSearchParams(location.search).get('day'))||1));
// The "Jump to" list: outdoor locations first, then a divider, then the interiors grouped by the outdoor area they open
// onto (found by walking out through doors), each group and each list sorted alphabetically (the tram is left out).
// The first option is a hidden one naming where the player is, so the select shows it but the list always opens at the top.
const sel=document.getElementById('jump'),here=new Option('','',true,true);here.hidden=true;sel.appendChild(here);
const isIn=id=>L[id][3]=='interior',byName=(a,b)=>NM[a].localeCompare(NM[b]);
function areaOf(id){const seen=new Set([id]),q=[id];while(q.length){const m=q.shift();
  for(const e of EX[m]){if(!isIn(e.to)&&e.to!='tram')return e.to;if(!seen.has(e.to)){seen.add(e.to);q.push(e.to)}}}}
const AREAS={};for(const id in L)if(id!='tram'&&isIn(id))(AREAS[areaOf(id)]??=[]).push(id);
const group=(label,ids)=>{const g=document.createElement('optgroup');g.label=label;ids.sort(byName).forEach(id=>g.appendChild(new Option(NM[id],id)));sel.appendChild(g)};
group('Outside',Object.keys(L).filter(id=>id!='tram'&&!isIn(id)));
sel.appendChild(document.createElement('hr'));
Object.keys(AREAS).sort(byName).forEach(a=>group('Inside: '+NM[a],AREAS[a]));
const showHere=id=>{here.text=NM[id];sel.selectedIndex=0};
function go(id){P.m=id;[P.x,P.y]=inw(EX[id][0]);P.rx=P.x;P.ry=P.y;P.mv=null;showHere(id)}
// The game starts at home: the living space behind the Hidden Radio Room, beside the player's bed.
P.m='hekki_room';P.x=P.rx=17;P.y=P.ry=3;P.dir=0;showHere(P.m);
// (the ?gothic proof of concept starts in Eastbrook's square instead)
if(GOTHIC||DETAILED){P.m='second';P.x=P.rx=19;P.y=P.ry=12;showHere(P.m)}
// The day/night toggle beside it (or N): the scenes are rebuilt, since windows, lamps and the detailed proof of concept's
// art differ by night.
const dn=document.getElementById('daynight');
function setNight(on){NIGHT=on;for(const k in SC)delete SC[k];for(const k in PCACHE)delete PCACHE[k];dn.textContent=on?'\u263E Night':'\u2600 Day';dn.setAttribute('aria-pressed',on)}
dn.onclick=()=>{setNight(!NIGHT);dn.blur()};setNight(NIGHT);
addEventListener('keydown',e=>{if(e.target!=sel&&!e.repeat&&!MENU&&!BUSY&&!CONVO&&(e.key=='n'||e.key=='N'))setNight(!NIGHT)});
// ---- The start menu (M, or the Menu button): an Inventory tab (the date, the CIA's money and your own, what you carry),
// a Quests tab (active quests) and a Map tab (the island map, with where you are). The game pauses while it is open.
const ME={cia:PLAYER.ciaFunds,cash:PLAYER.funds,items:PLAYER.items.map(([id,n])=>({id,n})),sel:0,note:'',filmIn:0,light:false,quests:QUESTS.slice()};
const startEl=document.getElementById('start'),startBtn=document.getElementById('startbtn'),TABS=[['inv','Inventory'],['quests','Quests'],['map','Map'],['save','Save']];
let START=null;  // the open tab, or null when the menu is closed
// a grid of item slots (at least 4 rows of 4), with how many of each and, in a shop, the price
const slotsOf=(list,sel,priced)=>Array.from({length:Math.max(16,Math.ceil(list.length/4)*4)},(_,i)=>{const t=list[i];
  return t?`<button class="slot" data-item="${i}" aria-pressed="${i==sel}" title="${esc(ITEMS[t.id].name)}"><img src="${itemIcon(t.id)}" alt="">${priced?`<span class="p">$${t.p}</span>`:''}${t.n>1?`<span class="n">${t.n}</span>`:''}</button>`:'<span class="slot"></span>'}).join('');
const money=v=>'$'+v.toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function renderStart(){if(START=='shop'){renderShop();return}let body='';
  if(START=='inv'){// the date and money, then a grid of what you carry (at least 4 rows of 4), and the chosen item's panel
    ME.sel=Math.max(0,Math.min(ME.sel,ME.items.length-1));const it=ME.items[ME.sel],d=it&&ITEMS[it.id];
    const slots=slotsOf(ME.items,ME.sel);
    body=`<dl><dt>Date</dt><dd>${DAY} ${MONTH} <small>(day ${DAY} of ${DAYS})</small></dd><dt>CIA funds</dt><dd>${money(ME.cia)}</dd><dt>Personal funds</dt><dd>${money(ME.cash)}</dd></dl>
    <div class="inv"><div class="slots" role="listbox" aria-label="Items">${slots}</div><div class="item">${d?`<div class="ihead"><img src="${itemIcon(it.id)}" alt=""><h3>${esc(d.name)}${it.n>1?' &times;'+it.n:''}</h3></div>
      <p>${esc(d.desc)}${itemState(it.id)}</p><div class="acts">${itemActions(it.id).map((x,i)=>`<button data-act="${i}">${esc(x)}</button>`).join('')}</div>${ME.note?`<p class="note">${esc(ME.note)}</p>`:''}`:'<p>You are carrying nothing.</p>'}</div></div>`}
  if(START=='quests')body=ME.quests.length?`<ul>${ME.quests.map(q=>`<li><b>${esc(q.title)}</b> <small>from ${esc(q.from)}</small><br>${esc(q.text)}</li>`).join('')}</ul>`:'<p>No active quests.</p>';
  if(START=='map'){// you are marked at your place on the island map (indoors, at the place the building is in)
    const a=POS[P.m]?P.m:areaOf(P.m),p=a&&POS[a];
    body=`<div class="map"><img src="docs/island-map.svg" alt="Map of the island">${p?`<span class="you" style="left:${p[0]/17}%;top:${p[1]/8.6}%"></span>`:''}</div>
      <p>You are in ${esc(NM[P.m])}${a&&a!=P.m?', '+esc(NM[a]):''}.</p>`}
  if(START=='save'){// the save slots: where and when each was saved, and buttons to save over it, load it or delete it
    // (overwriting, loading and deleting ask again on the button first)
    const btn=(d,i,t)=>`<button data-do="${d}" data-slot="${i}">${ME.confirm==d+i?t+'?':t}</button>`;
    body=`<div class="saves">${SAVES.map(i=>{const v=readSave(i);
      return `<div class="save"><div><b>${slotName(i)}</b><br>${v?`${esc(v.where)}: ${v.day} ${MONTH}, ${v.night?'night':'day'}<br><small>Saved ${new Date(v.at).toLocaleString()}</small>`:'<small>Empty</small>'}</div>
        <div class="acts">${btn('save',i,i=='quick'?'Quick save (Q)':v?'Overwrite':'Save here')}${v?btn('load',i,'Load')+btn('del',i,'Delete'):''}</div></div>`}).join('')}</div>
      <p><small>Saves are kept in this browser.</small></p>${ME.note?`<p class="note">${esc(ME.note)}</p>`:''}`}
  startEl.innerHTML=`<div class="tabs" role="tablist">${TABS.map(([k,t])=>`<button role="tab" data-tab="${k}" aria-selected="${k==START}">${t}</button>`).join('')}<button class="close" aria-label="Close the menu">&times;</button></div><div>${body}</div>`;
  startEl.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{START=b.dataset.tab;ME.note='';ME.confirm='';renderStart()});
  startEl.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>slotAction(b.dataset.do,b.dataset.slot=='quick'?'quick':+b.dataset.slot));
  startEl.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{ME.sel=+b.dataset.item;ME.note='';renderStart()});
  startEl.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>useItem(itemActions(ME.items[ME.sel].id)[+b.dataset.act]));startEl.querySelector('.close').onclick=closeStart}
// What each item can do. The actions come from ITEMS, with a few that change with the item's state (the flashlight's switch,
// film in the camera); useItem carries one out and leaves a line in the panel.
const has=id=>ME.items.find(i=>i.id==id),take=id=>{const i=has(id);if(i&&--i.n<=0)ME.items.splice(ME.items.indexOf(i),1)};
function itemActions(id){return ITEMS[id].actions.map(a=>id=='flashlight'&&a=='Turn on'&&ME.light?'Turn off':a)}
function itemState(id){return id=='camera'?` ${ME.filmIn?'Loaded: '+ME.filmIn+' exposures left.':'No film loaded.'}`:id=='flashlight'?` It is ${ME.light?'on':'off'}.`:''}
function loadFilm(){if(ME.filmIn)return'The camera already has film in it.';if(!has('film'))return'You have no film.';take('film');ME.filmIn=50;return'You load a fresh roll of film into the Minox: 50 exposures.'}
const HEADLINES=['THE KING IS DEAD: ISLAND MOURNS','WHO WILL RULE SARIVALTO? PARTIES PREPARE','REPUBLICANS STILL WITHOUT A LEADER','KELP COLA PROFITS UP AGAIN','OIL RIG PRODUCTION AT RECORD HIGH','SOVIET TRAWLERS SEEN OFF THE NORTH COAST','CHURCH CALLS FOR CALM'];
function useItem(a){const id=ME.items[ME.sel].id,nm=ITEMS[id].name.toLowerCase(),gone=v=>()=>(take(id),`You ${v} the ${nm}.`),R={
  beer:{Drink:gone('drink')},whisky:{Drink:gone('drink')},cola:{Drink:gone('drink')},coffee:{Drink:gone('drink')},cigarettes:{Smoke:()=>'You smoke a cigarette.'},
  burger:{Eat:gone('eat')},bun:{Eat:gone('eat')},meal:{Eat:gone('eat')},smokedfish:{Eat:gone('eat')},bread:{Eat:gone('eat')},hotdog:{Eat:gone('eat')},
  newspaper:{Read:()=>`The headline: ${HEADLINES[(DAY-1)%HEADLINES.length]}.`},book:{Read:'You read a chapter. The hero gets away again.'},
  islandmap:{'Look at':()=>{START='map';return''}},souvenir:{'Look at':'Kelpy grins back at you.'},record:{'Look at':'You need a record player to hear it.'},
  shirt:{Wear:'You put on the flannel shirt.'},beanie:{Wear:'You pull on the beanie.'},suit:{Wear:'You put on the suit. You look like you belong in Kingsgrad.'},
  radio:{Listen:'Radio Sarivalto: Kalle is playing slow songs for the late king.'},fishrod:{Fish:'Find some open water to fish in.'},
  notebook:{'Read':`${DAY} ${MONTH}: ${DAY==1?'Arrived on Sarivalto. Set up in the hidden room under the radio tower. Report to Chuck.':'Nothing new written yet.'}`,'Write a note':'Nothing worth writing down yet.'},
  camera:{'Take a photo':()=>ME.filmIn?'Nothing here worth photographing.':'There is no film in the camera.','Load film':loadFilm},
  film:{'Load into camera':loadFilm},
  codebook:{'Read':'Call sign for Chuck: NIGHTJAR. Today\'s pad page is marked with a pencil tick.','Burn':'Not yet: you still need it to talk to Chuck.'},
  lockpicks:{'Pick a lock':'There is no lock here to pick.'},
  flashlight:{'Turn on':()=>(ME.light=true,'Click. The flashlight is on.'),'Turn off':()=>(ME.light=false,'Click. The flashlight is off.')}}[id]?.[a];
  ME.note=typeof R=='function'?R():R??'You cannot do that yet.';const at=ME.items.findIndex(i=>i.id==id);if(at>=0)ME.sel=at;renderStart()}
// ---- Shops: talking to a shopkeeper at their shop shows their stock (in the same grid as your inventory). Choose an item and
// pay with CIA funds or your own money; it moves from their stock to your inventory.
const STOCK={};  // each shop's stock as it is now, by keeper name
let SHOP=null;   // the open shop: {n: the keeper, sel: the chosen item, note: the last thing that happened}
const stockOf=n=>STOCK[n.name]??=SHOPS[n.name].stock.map(([id,c,p])=>({id,n:c,p}));
function openShop(n){if(MENU||RIDE)return;SHOP={n,sel:0,note:''};START='shop';stack=[];startEl.hidden=false;renderStart()}
function renderShop(){const n=SHOP.n,st=stockOf(n);SHOP.sel=Math.max(0,Math.min(SHOP.sel,st.length-1));const t=st[SHOP.sel],d=t&&ITEMS[t.id];
  const pay=(k,label,v,key)=>`<button data-pay="${k}"${v<t.p?' disabled':''}>${label} <small>(${key})</small></button>`;
  startEl.innerHTML=`<div class="tabs"><h3 class="shopname">${esc(NM[n.loc]&&L[n.loc][3]=='interior'?NM[n.loc]:n.job)} <small>${esc(n.name)}'s stock</small></h3><button class="close" aria-label="Leave the shop">&times;</button></div>
    <dl><dt>CIA funds</dt><dd>${money(ME.cia)}</dd><dt>Personal funds</dt><dd>${money(ME.cash)}</dd></dl>
    <div class="inv"><div class="slots" role="listbox" aria-label="For sale">${slotsOf(st,SHOP.sel,1)}</div><div class="item">${d?`<div class="ihead"><img src="${itemIcon(t.id)}" alt=""><h3>${esc(d.name)} <small>${t.n} left</small></h3></div>
      <p>${esc(d.desc)}</p><p class="price">${money(t.p)}</p><div class="acts">${pay('cia','Pay with CIA funds',ME.cia,'C')}${pay('cash','Pay with personal money',ME.cash,'P')}</div>`:'<p>Sold out.</p>'}
      ${SHOP.note?`<p class="note">${esc(SHOP.note)}</p>`:''}</div></div>`;
  startEl.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{SHOP.sel=+b.dataset.item;SHOP.note='';renderStart()});
  startEl.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>buy(b.dataset.pay));startEl.querySelector('.close').onclick=closeStart}
function buy(how){const st=stockOf(SHOP.n),t=st[SHOP.sel];if(!t)return;const nm=ITEMS[t.id].name.toLowerCase();
  if(ME[how]<t.p){SHOP.note=`You don't have enough ${how=='cia'?'CIA funds':'money of your own'} for the ${nm}.`;renderStart();return}
  ME[how]-=t.p;const mine=has(t.id);if(mine)mine.n++;else ME.items.push({id:t.id,n:1});if(--t.n<=0)st.splice(SHOP.sel,1);
  SHOP.note=`You buy the ${nm} for ${money(t.p)}, paid from ${how=='cia'?'CIA funds':'your own money'}.`;renderStart()}
// ---- Saving and loading: three slots in the browser's storage. A save holds where you are, the date and time of day, your money,
// items and quests, and what is left in every shop.
// the quick save (Q, or its button) has its own slot, saved over without asking; then the three ordinary slots
const SAVES=['quick',0,1,2],saveKey=i=>'sarivalto-save-'+i,slotName=i=>i=='quick'?'Quick save':'Slot '+(i+1);
function readSave(i){try{const v=JSON.parse(localStorage.getItem(saveKey(i)));return v&&v.v==1?v:null}catch(e){return null}}
function slotAction(d,i){const ask=d!='save'||i!='quick'&&readSave(i);
  if(ask&&ME.confirm!=d+i){ME.confirm=d+i;ME.note='';renderStart();return}ME.confirm='';
  if(d=='save')ME.note=saveGame(i);if(d=='del'){try{localStorage.removeItem(saveKey(i))}catch(e){}ME.note=slotName(i)+' deleted.'}
  if(d=='load'){loadGame(i);return}renderStart()}
function saveGame(i){if(P.m=='tram')return'You cannot save on the tram.';const a=POS[P.m]?P.m:areaOf(P.m);
  const v={v:1,at:Date.now(),where:NM[P.m]+(a&&a!=P.m?', '+NM[a]:''),day:DAY,night:NIGHT,p:{m:P.m,x:P.x,y:P.y,dir:P.dir},
    me:{cia:ME.cia,cash:ME.cash,items:ME.items,filmIn:ME.filmIn,light:ME.light,quests:ME.quests},stock:STOCK};
  try{localStorage.setItem(saveKey(i),JSON.stringify(v));return i=='quick'?'Quick saved.':'Game saved in '+slotName(i).toLowerCase()+'.'}catch(e){return'The game could not be saved: this browser is not letting the page store anything.'}}
function loadGame(i){const v=readSave(i);if(!v||!MAPS[v.p.m]){ME.note='That save could not be loaded.';renderStart();return}
  DAY=v.day;setNight(v.night);Object.assign(ME,v.me,{sel:0,note:'',confirm:''});for(const k in STOCK)delete STOCK[k];Object.assign(STOCK,v.stock);
  TRIP=null;closeStart();place(v.p.m,[v.p.x,v.p.y],v.p.dir);say('Game loaded: '+v.where+', '+DAY+' '+MONTH+'.',4000)}
function openStart(tab='inv'){if(MENU||RIDE||BUSY||CONVO)return;START=tab;stack=[];startEl.hidden=false;startBtn.setAttribute('aria-expanded','true');renderStart()}
function closeStart(){START=null;SHOP=null;startEl.hidden=true;startBtn.setAttribute('aria-expanded','false')}
startBtn.onclick=()=>{START?closeStart():openStart();startBtn.blur()};
// M opens and closes it, Escape closes it, left and right (or A and D) move between tabs
addEventListener('keydown',e=>{if(e.target==sel||e.repeat)return;const k=e.key;
  if(k=='m'||k=='M'){START?closeStart():openStart();e.preventDefault()}
  else if((k=='q'||k=='Q')&&!MENU&&!RIDE&&!BUSY&&!CONVO){const r=saveGame('quick');if(START=='save'){ME.note=r;renderStart()}else say(r,2500);e.preventDefault()}
  else if(START&&k=='Escape'){closeStart();e.preventDefault()}
  // in a shop the arrows (or WASD) move through the stock, C pays with CIA funds and P with your own money
  else if(START=='shop'){const st=stockOf(SHOP.n),d={ArrowLeft:-1,a:-1,ArrowRight:1,d:1,ArrowUp:-4,w:-4,ArrowDown:4,s:4}[k.length==1?k.toLowerCase():k];
    if(d){const n=SHOP.sel+d;if(n>=0&&n<st.length){SHOP.sel=n;SHOP.note=''}renderStart();e.preventDefault()}
    else if(k=='c'||k=='C'){buy('cia');e.preventDefault()}else if(k=='p'||k=='P'){buy('cash');e.preventDefault()}else if(k=='Tab')e.preventDefault()}
  // Tab (or 1, 2, 3) changes tab; in the inventory the arrows (or WASD) move through the grid and E, Space or Enter does the item's
  // first action; on the other tabs left and right change tab
  else if(START&&(k=='Tab'||/^[1-4]$/.test(k))){const i=TABS.findIndex(t=>t[0]==START);START=TABS[k=='Tab'?(i+(e.shiftKey?TABS.length-1:1))%TABS.length:k-1][0];ME.note='';renderStart();e.preventDefault()}
  else if(START=='inv'&&ME.items.length&&/^(Arrow(Left|Right|Up|Down)|[wasdWASD])$/.test(k)){const d={ArrowLeft:-1,a:-1,ArrowRight:1,d:1,ArrowUp:-4,w:-4,ArrowDown:4,s:4}[k.length==1?k.toLowerCase():k],n=ME.sel+d;
    if(n>=0&&n<ME.items.length){ME.sel=n;ME.note=''}renderStart();e.preventDefault()}
  else if(START=='inv'&&ME.items.length&&/^(e|E| |Enter)$/.test(k)&&!(e.target.closest&&e.target.closest('#start button'))){useItem(itemActions(ME.items[ME.sel].id)[0]);e.preventDefault()}
  else if(START&&START!='inv'&&/^(ArrowLeft|ArrowRight|a|d|A|D)$/.test(k)){const i=TABS.findIndex(t=>t[0]==START),d=/Right|d|D/.test(k)?1:TABS.length-1;START=TABS[(i+d)%TABS.length][0];ME.note='';renderStart();e.preventDefault()}});
sel.onchange=()=>{const id=sel.value;closeMenu();RIDE=TRIP=null;go(id);sel.blur()};
const SOLID='#TR~vbkWecuxygitnoC';
// tramAt: a tram covers this tile (its track row or the row behind it that its body rises over)
const tramAt=(m,x,y)=>tramsOn(m,performance.now()).some(q=>(q.y==y||q.y-1==y)&&x*16+16>q.x+3&&x*16<q.x+93);
const solid=(m,x,y)=>{const t=MAPS[m][y]?.[x];return !t||SOLID.includes(t)||NPCS.some(n=>n.m==m&&n.x==x&&n.y==y)||
  PROPS.some(p=>{const sp=propSpan(p[3]),x0=p[1]-((sp-1)>>1);return p[0]==m&&x>=x0&&x<x0+sp&&p[2]==y&&!PROP_PASS.includes(p[3])})||tramAt(m,x,y)};
const press=d=>{if(!stack.includes(d))stack.push(d)},release=d=>{stack=stack.filter(k=>k!==d)};
addEventListener('keydown',e=>{if(e.target==sel||MENU||RIDE||START||BUSY||CONVO)return;const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY){press(KEY[k]);e.preventDefault()}});
addEventListener('keyup',e=>{const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY)release(KEY[k])});
document.querySelectorAll('#pad button[data-d]').forEach(b=>{const d=+b.dataset.d;
  b.addEventListener('pointerdown',e=>{e.preventDefault();press(d)});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>release(d)))});
// the exit (map edge, door or boat berth) the player is standing on, if any, and taking it
const exitHere=()=>EX[P.m].find(e=>e.x==P.x&&e.y==P.y);
function useExit(e){const b=EX[e.to].find(q=>q.to==P.m);P.m=e.to;[P.x,P.y]=inw(b);P.rx=P.x;P.ry=P.y;showHere(P.m)}
function update(dt){
  if(RIDE){if(performance.now()-RIDE.t0>RIDE_DUR)arrive();return}if(MENU||START||BUSY||CONVO)return;
  if(P.mv){const m=P.mv;m.t+=dt/.16;const k=Math.min(m.t,1);P.rx=m.fx+(m.tx-m.fx)*k;P.ry=m.fy+(m.ty-m.fy)*k;
    if(m.t>=1){P.mv=null;const e=exitHere();
      if(e&&!PRESS_DOORS.has(e.to))useExit(e);
      else if(P.m=='tram'&&MAPS.tram[P.y][P.x]=='m')leaveTram()}}
  if(!P.mv&&tramAt(P.m,P.x,P.y)){standClear();return}
  if(!P.mv&&stack.length){const d=stack[stack.length-1],[dx,dy]=DIR[d];P.dir=d;
    const nx=P.x+dx,ny=P.y+dy;if(!solid(P.m,nx,ny)){P.mv={fx:P.x,fy:P.y,tx:nx,ty:ny,t:0};P.x=nx;P.y=ny;P.par^=1}}
}
// a tram has come along where the player is standing: move them to the nearest free tile (preferring in front of the track)
function standClear(){let best=null;for(let dy=-4;dy<=4;dy++)for(let dx=-6;dx<=6;dx++){const x=P.x+dx,y=P.y+dy;
    if(!solid(P.m,x,y)){const d=Math.abs(dx)+Math.abs(dy)*1.5-(dy>0?.5:0);if(!best||d<best[2])best=[x,y,d]}}
  if(best){place(P.m,[best[0],best[1]],P.dir);say('Mind the tram!')}}
// ---- Riding the tram. On a platform, the action key (E, Space or Enter, or the E button) calls the tram; once it has stopped,
// pressing it again gets on. Inside the tram the action key opens a menu of stops; picking one plays a short ride and then
// puts the player on that stop's platform as the tram pulls away. Walking out of the tram's door gets off where you got on.
let MSG=null,MENU=0,RIDE=null,TRIP=null,BUSY=false,CONVO=null,CONVO_END=0;const RIDE_DUR=2800,say=(s,d=3000)=>{MSG={s,t:performance.now(),d}},menu=document.getElementById('menu');
// ---- Talking: the person on the tile the player is facing, and what they say (a placeholder line for everyone for now)
const npcAhead=()=>{const[dx,dy]=DIR[P.dir];return NPCS.find(n=>n.m==P.m&&n.x==P.x+dx&&n.y==P.y+dy)};
const line=n=>`"My name is ${n.name}. I work at ${NM[n.loc]||'nowhere in particular'}. I like ${n.faction=='none'?'no faction in particular':FACTIONS[n.faction][0]}."`;
// your own bed (in the living space behind the Hidden Radio Room) is the tile you're facing
const HOME='hekki_room',bedAhead=()=>{const[dx,dy]=DIR[P.dir];return P.m==HOME&&MAPS[P.m][P.y+dy]?.[P.x+dx]=='e'};
// a table to sit at (or the hotel lobby's seats) in one of the WAIT_AT places is the tile you're facing
const seatAhead=()=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return WAIT_AT.includes(P.m)&&
  FL[P.m].some(([fx,fy,w,h,ch,l])=>x>=fx&&x<fx+w&&y>=fy&&y<fy+h&&(ch=='o'||ch=='u'&&/table/i.test(l||'')))};
// a short choice in the middle of the screen (the tram's stop menu): [label, what to do] for each option; the last is "no"
function choose(q,opts){MENU=performance.now();stack=[];menu.setAttribute('aria-label',q);
  menu.innerHTML='<p>'+q+'</p>'+opts.map(([t],i)=>`<button data-i="${i}"${i==opts.length-1?' data-to=""':''}>${t}</button>`).join('');
  menu.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(performance.now()-MENU<250)return;closeMenu();opts[+b.dataset.i][1]?.()});menu.hidden=false;menu.querySelector('button').focus()}
// time passing: the screen fades to black, the change happens, and it fades back in with a message
const fadeEl=document.getElementById('fade');
function pass(change,msg){BUSY=true;stack=[];fadeEl.style.opacity=1;setTimeout(()=>{change();fadeEl.style.opacity=0;say(msg(),5000);setTimeout(()=>BUSY=false,800)},1100)}
// sitting and waiting takes you from day to night; sleeping in your bed takes you from night to the next morning
function sitDown(){if(NIGHT){say('It is already night. Go home and get some sleep.',4000);return}
  choose('Sit and wait for the evening?',[['Sit and wait until night',()=>pass(()=>setNight(true),()=>'You sit and wait. The day goes by, and night falls.')],['Not now']])}
function sleep(){if(!NIGHT){say('It is still daytime, and you are not tired. Sit at the table and wait for the evening.',5000);return}
  if(DAY>=DAYS){say('It is '+DAYS+' '+MONTH+', the last day of the month. There is no time to sleep now.',5000);return}
  choose('Go to bed?',[['Sleep until morning',()=>pass(()=>{DAY++;setNight(false)},()=>'You sleep through the night. Good morning: it is '+DAY+' '+MONTH+'.')],['Not now']])}
function talk(n){n.dir=P.dir^1;if(CONVOS[n.name]){converse(n);return}if(SHOPS[n.name]&&n.m==n.loc){say(`"Welcome! Have a look at what I've got."`,3000);openShop(n);return}say(line(n),6000)}
const onPlatform=()=>TRAM_STOPS.includes(P.m)&&MAPS[P.m][P.y][P.x]=='P';
const place=(m,[x,y],dir)=>{P.m=m;P.x=x;P.y=y;P.rx=x;P.ry=y;P.mv=null;P.dir=dir;showHere(m)};
// where to put someone getting off: the free platform tile (in front of the track) nearest the tram's door, or failing that
// the ground just in front of the platform
function platformSpot(m){const tr=scene(m).trams.find(q=>q.plat),door=(tr.stop+48)/16,w=MAPS[m][0].length,c=[];
  // (a little further along is better than right above the shelter, whose roof would hide the player)
  for(const y of[tr.y+1,tr.y+2])for(let x=0;x<w;x++)if(!solid(m,x,y))c.push([x,y,Math.abs(x+.5-door)+(y==tr.y+1?0:3)+(MAPS[m][y][x]=='P'?0:2)+(MAPS[m][y+1]?.[x]=='#'?4:0)]);
  const[x,y]=c.sort((a,b)=>a[2]-b[2])[0];return[x,y]}
function act(){if(P.mv||MENU||RIDE||START||BUSY||CONVO)return;const now=performance.now();if(now-CONVO_END<300)return;
  if(P.m=='tram'){openMenu();return}
  if(bedAhead()){sleep();return}
  const n=npcAhead();if(n){talk(n);return}
  if(seatAhead()){sitDown();return}
  const e=exitHere();if(e&&PRESS_DOORS.has(e.to)){useExit(e);return}
  if(!onPlatform())return;const st=tramState(P.m,now);
  if(!st){TRAMS[P.m]={ph:'arrive',t0:now};say('You press the button to call the tram.');return}
  if(st.ph=='arrive'){say('The tram is on its way.');return}
  if(st.ph=='leave'){say('The tram has just left.');return}
  TRIP={from:P.m};TRAMS[P.m]={ph:'wait',t0:now};place('tram',[10,5],1);say('You get on the tram.')}
function openMenu(){MENU=performance.now();stack=[];menu.setAttribute('aria-label','Choose a tram stop');
  menu.innerHTML='<p>Where to?</p>'+TRAM_STOPS.filter(s=>s!=TRIP.from).map(s=>`<button data-to="${s}">${NM[s]}</button>`).join('')+'<button data-to="">Stay on board</button>';
  menu.querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b.dataset.to));menu.hidden=false;menu.querySelector('button').focus()}
const closeMenu=()=>{MENU=0;menu.hidden=true};
// (a click within a moment of opening is the key that opened the menu, not a choice)
function pick(to){if(performance.now()-MENU<250)return;closeMenu();if(to){RIDE={to,t0:performance.now()};delete TRAMS[TRIP.from]}}
function arrive(){const to=RIDE.to;RIDE=TRIP=null;TRAMS[to]={ph:'wait',t0:performance.now()-TRAM_WAIT+2500};place(to,platformSpot(to),0);say('You get off the tram at '+NM[to]+'.')}
function leaveTram(){const from=TRIP.from;TRIP=null;TRAMS[from]={ph:'wait',t0:performance.now()-TRAM_WAIT+3000};place(from,platformSpot(from),0);say('You get off the tram.')}
// ---- Conversations (CONVOS): their portrait and what they say at the top left, your replies along the bottom. Up and down (or
// W and S) choose a reply, E, Space or Enter says it (or press its number, or click it); when it ends, everything closes.
const cvEl=document.getElementById('convo');
function converse(n){const c=CONVOS[n.name];CONVO={n,c,at:c.start,sel:0};stack=[];MSG=null;
  const pc=cvEl.querySelector('canvas'),g=pc.getContext('2d');g.clearRect(0,0,pc.width,pc.height);g.drawImage(portrait(n),0,0);
  cvEl.querySelector('.who').textContent=n.name;cvEl.hidden=false;renderConvo()}
const replies=()=>CONVO.c.nodes[CONVO.at].opts||[['End the conversation',null]];
function renderConvo(){const nd=CONVO.c.nodes[CONVO.at];
  cvEl.querySelector('.said').innerHTML=`<b>${esc(CONVO.n.name)}</b><p>"${esc(nd.say)}"</p>`;
  cvEl.querySelector('.opts').innerHTML=replies().map(([t],i)=>`<button data-o="${i}" aria-pressed="${i==CONVO.sel}"><span>${i+1}.</span> ${esc(t)}</button>`).join('');
  cvEl.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>reply(+b.dataset.o))}
function reply(i){const o=replies()[i];if(!o)return;if(o[1]==null){endConvo();return}CONVO.at=o[1];CONVO.sel=0;renderConvo()}
function endConvo(){CONVO=null;CONVO_END=performance.now();cvEl.hidden=true}
addEventListener('keydown',e=>{if(!CONVO||e.repeat)return;const k=e.key.length==1?e.key.toLowerCase():e.key,n=replies().length;
  if(k=='ArrowDown'||k=='s')CONVO.sel=(CONVO.sel+1)%n;else if(k=='ArrowUp'||k=='w')CONVO.sel=(CONVO.sel+n-1)%n;
  else if(/^[1-9]$/.test(k)&&+k<=n)reply(+k-1);else if(k=='e'||k==' '||k=='Enter')reply(CONVO.sel);else if(k=='Escape')endConvo();else return;
  if(CONVO)renderConvo();e.preventDefault()});
// with the menu open: up/down (or W/S) move between stops, E picks, Escape closes it (Enter and Space work on buttons anyway)
addEventListener('keydown',e=>{if(!MENU)return;const bs=[...menu.querySelectorAll('button')],i=bs.indexOf(document.activeElement),k=e.key.toLowerCase();
  if(k=='arrowdown'||k=='s')bs[(i+1)%bs.length].focus();else if(k=='arrowup'||k=='w')bs[(i-1+bs.length)%bs.length].focus();
  else if(k=='escape')closeMenu();else if(k=='e')(bs[i]||bs[0]).click();else return;e.preventDefault()});
addEventListener('keydown',e=>{if(e.target!=sel&&!e.repeat&&!MENU&&(e.key=='e'||e.key=='E'||e.key==' '||e.key=='Enter')){act();e.preventDefault()}});
document.getElementById('act').addEventListener('pointerdown',e=>{e.preventDefault();if(CONVO){reply(CONVO.sel);return}if(MENU){const b=document.activeElement;if(menu.contains(b))b.click()}else act()});
// what the action key would do here, shown above the player
function tramHint(){if(CONVO)return null;if(P.m=='tram')return MENU?null:'Press E to choose a stop';
  if(bedAhead()&&!P.mv)return DAY>=DAYS?'The last day: no time to sleep':NIGHT?'Press E to sleep':'Your bed: sleep once it is night';
  if(seatAhead()&&!P.mv&&!npcAhead())return NIGHT?'Night has fallen':'Press E to sit and wait';
  const n=npcAhead();if(n&&!P.mv)return'Press E to talk to '+n.name;
  const e=exitHere();if(e&&PRESS_DOORS.has(e.to))return'Press E to go down into the '+NM[e.to];if(!onPlatform())return null;const st=tramState(P.m,performance.now());
  return!st?'Press E to call the tram':st.ph=='wait'?'Press E to get on':st.ph=='arrive'?'The tram is coming…':null}
const cam=(p,len,view)=>len<=view?-((view-len)>>1):Math.max(0,Math.min(len-view,Math.round(p)));
// Labels are drawn on a second, full-resolution canvas laid over the game so text stays sharp at any size.
const ov=document.getElementById('ov'),og=ov.getContext('2d');let LB=[];
const tx=(s,x,y,al,k)=>{LB.push([s,x,y,al,k])};
const rr=(x,y,w,h,r)=>{og.beginPath();og.moveTo(x+r,y);og.arcTo(x+w,y,x+w,y+h,r);og.arcTo(x+w,y+h,x,y+h,r);og.arcTo(x,y+h,x,y,r);og.arcTo(x,y,x+w,y,r);og.closePath()};
function drawLabels(){
  const r=cv.getBoundingClientRect(),d=globalThis.devicePixelRatio||1,w=Math.round(r.width*d),h=Math.round(r.height*d);
  if(ov.width!=w||ov.height!=h){ov.width=w;ov.height=h}
  og.clearRect(0,0,w,h);const f=w/cv.width;og.lineJoin='round';og.textBaseline='middle';og.textAlign='left';
  for(const[s,x,y,al,k]of LB){const fs=Math.round((k=='h'?14:12)*d);og.font='bold '+fs+'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const m=og.measureText(s).width,pad=5*d,Y=y*f-fs*.4,X=x*f;let x0=al=='left'?X:al=='right'?X-m:X-m/2;x0=Math.max(pad+1,Math.min(w-m-pad-1,x0));
    if(k=='s'){og.lineWidth=3.5*d;og.strokeStyle='rgba(11,18,10,.9)';og.strokeText(s,x0,Y);og.fillStyle='#ffffff';og.fillText(s,x0,Y);continue}
    og.fillStyle=k=='x'?'rgba(11,26,43,.9)':'rgba(11,18,10,.82)';rr(x0-pad,Y-fs*.68,m+pad*2,fs*1.36,fs*.5);og.fill();
    og.fillStyle=k=='x'?'#9fe870':k=='n'?'#ffe9a8':'#ffffff';og.fillText(s,x0,Y)}
  LB=[]}
function draw(t){
  if(RIDE){const u=Math.min(1,(t-RIDE.t0)/RIDE_DUR);drawRide(t,u);tx('Next stop: '+NM[RIDE.to],cv.width/2,16,'center','h');drawLabels();return}
  const M=MAPS[P.m],mh=M.length,mw=M[0].length;
  ctx.fillStyle='#0b120a';ctx.fillRect(0,0,cv.width,cv.height);
  // interiors have a taller back wall reaching WU pixels above the map; let the camera show it
  const top=L[P.m][3]=='interior'?WU:0;
  const cx=cam(P.rx*T+T/2-cv.width/2,mw*T,cv.width),cy=cam(P.ry*T+T/2-cv.height/2+top,mh*T+top,cv.height)-top;
  drawWorld2(P.m,cx,cy,t,P.mv?1+P.par:0);
  NPCS.filter(n=>n.m==P.m).forEach(n=>tx(n.name,n.x*T-cx+8,n.y*T-cy-7,'center','n'));
  // (a building whose picture sign stands on its roof has its label above the picture)
  const it=scene(P.m).iconTop||{};FL[P.m].forEach(([x,y,w,h,c,lb,st])=>{if(lb)tx(lb,(x+w/2)*T-cx,st?Math.min(y*T,it[x+','+y]??1e9)-cy-3:(y+h/2)*T-cy+2,'center',st?'b':'s')});
  EX[P.m].filter(e=>e.s!='O').forEach(e=>{const[ix,iy]=inw(e),s=e.s=='F'?(e.ax>e.x?'L':'R'):e.s,nm=NM[e.to]+(e.s=='F'?' (boat)':''),lb=(s=='R'?'':'\u2192 ')+nm+(s=='R'?' \u2192':'');
    tx(lb,s=='L'?ix*T-cx:s=='R'?(ix+1)*T-cx:(ix+.5)*T-cx,iy*T-cy+10,s=='L'?'left':s=='R'?'right':'center','x')});
  if(L[P.m][3]=='interior')EX[P.m].filter(e=>e.s=='O'&&L[e.to][3]=='interior'&&MAPS[P.m][e.y][e.x]=='m').forEach(e=>tx(NM[e.to],(e.x+.5)*T-cx,e.y*T-cy+(e.y==0?-8:8),'center','x'));
  const hint=tramHint();if(hint)tx(hint,P.rx*T-cx+8,P.ry*T-cy-12,'center','x');
  if(MSG&&t-MSG.t<MSG.d)tx(MSG.s,cv.width/2,cv.height-12,'center','h');
  tx(NM[P.m]+'  ('+P.x+','+P.y+')',3,15,'left','h');drawLabels();
}
// On opening the game, carry on from the most recent save (if there is one). Starting with ?new in the address starts a new game
// instead, as do the addresses that set up the start themselves (?day=, ?night and the proofs of concept).
if(!GOTHIC&&!DETAILED&&!/[?&](new|day|night)\b/.test(location.search)){const i=SAVES.filter(i=>readSave(i)).sort((a,b)=>readSave(b).at-readSave(a).at)[0];if(i!=null)loadGame(i)}
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);requestAnimationFrame(loop)})(0);
