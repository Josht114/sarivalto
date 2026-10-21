const T=16,VW=15,VH=10;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');cv.width=VW*T;cv.height=VH*T;
const hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+1,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};


// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
// ---- The calendar: the game runs through the 30 days of September, starting on the 1st (?day=N starts on another day for
// testing). Sleeping in your own bed moves on to the next morning; the calendar on the wall at home shows the date.
const MONTH='September',DAYS=30;const QDAY=parseInt(new URLSearchParams(location.search).get('day'));let DAY=Number.isNaN(QDAY)||QDAY<1?-9:Math.min(DAYS,QDAY);
// Days are counted from 1 September; the days before it are in August (day 0 is 31 August, so 22 August is day -9). DATES are the
// days you can be on: 22 August, then the month itself. nextDay is the one after a day (22 August is followed by 1 September).
const DATES=[-9,...Array.from({length:DAYS},(_,i)=>i+1)],dateStr=d=>d<1?(31+d)+' August':d+' '+MONTH,nextDay=d=>DATES[DATES.indexOf(d)+1]??d+1;
// The "Jump to" list: outdoor locations first, then a divider, then the interiors grouped by the outdoor area they open
// onto (found by walking out through doors), each group and each list sorted alphabetically (the tram is left out).
// The first option is a hidden one naming where the player is, so the select shows it but the list always opens at the top.
const sel=document.getElementById('jump'),here=new Option('','',true,true);here.hidden=true;sel.appendChild(here);
const isIn=id=>L[id][3]=='interior',byName=(a,b)=>NM[a].localeCompare(NM[b]);
function areaOf(id){const seen=new Set([id]),q=[id];while(q.length){const m=q.shift();
  for(const e of EX[m]){if(!isIn(e.to)&&e.to!='tram')return e.to;if(!seen.has(e.to)){seen.add(e.to);q.push(e.to)}}}}
const AREAS={};for(const id in L)if(id!='tram'&&isIn(id))(AREAS[areaOf(id)??'']??=[]).push(id);
const group=(label,ids)=>{const g=document.createElement('optgroup');g.label=label;ids.sort(byName).forEach(id=>g.appendChild(new Option(NM[id],id)));sel.appendChild(g)};
group('Outside',Object.keys(L).filter(id=>id!='tram'&&!isIn(id)));
sel.appendChild(document.createElement('hr'));
Object.keys(AREAS).filter(a=>a).sort(byName).forEach(a=>group('Inside: '+NM[a],AREAS[a]));
// places not on the island at all (CIA Headquarters at Langley)
if(AREAS[''])group('Off the island',AREAS['']);
const showHere=id=>{here.text=NM[id];sel.selectedIndex=0};
function go(id){P.m=id;[P.x,P.y]=inw(EX[id][0]);P.rx=P.x;P.ry=P.y;P.mv=null;showHere(id)}
// The game starts at home: the living space behind the Hidden Radio Room, beside the player's bed.
P.m='hekki_room';P.x=P.rx=17;P.y=P.ry=3;P.dir=0;showHere(P.m);
// (on 22 August, before the month begins, you are at CIA Headquarters in Langley)
if(DAY<1){P.m='langley';P.x=P.rx=11;P.y=P.ry=10;P.dir=1;showHere(P.m)}
// (the ?gothic proof of concept starts in Eastbrook's square instead)
if(GOTHIC||DETAILED){P.m='second';P.x=P.rx=19;P.y=P.ry=12;showHere(P.m)}
if(MODERN){P.m='fishing';P.x=P.rx=20;P.y=P.ry=8;showHere(P.m)}  // the modern proof of concept starts in Frostholm
if(STEAM||STEAM2||CLASSIC)go('town');  // the steampunk proof of concept (and ?steam2, ?classic) start in Kingsgrad
// The day/night toggle beside it (or N): the scenes are rebuilt, since windows, lamps and the detailed proof of concept's
// art differ by night.
const dn=document.getElementById('daynight');
function setNight(on){NIGHT=on;applyRoutine();for(const k in SC)delete SC[k];for(const k in PCACHE)delete PCACHE[k];dn.textContent=on?'\u263E Night':'\u2600 Day';dn.setAttribute('aria-pressed',on)}
dn.onclick=()=>{setNight(!NIGHT);dn.blur()};setNight(NIGHT);
// Full screen (the button, or F): the game's stage fills the screen; on a touch screen the direction pad moves into it while it does
const stage=document.getElementById('stage'),fsb=document.getElementById('fsbtn'),pad=document.getElementById('pad'),controls=document.getElementById('controls');
stage.style.setProperty('--ar',cv.width/cv.height);fsb.hidden=!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
const inFS=()=>(document.fullscreenElement||document.webkitFullscreenElement)==stage;
function toggleFS(){if(inFS())(document.exitFullscreen||document.webkitExitFullscreen).call(document);else(stage.requestFullscreen||stage.webkitRequestFullscreen).call(stage)}
fsb.onclick=()=>{toggleFS();fsb.blur()};
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{const on=inFS();fsb.setAttribute('aria-pressed',on);fsb.innerHTML=on?'Exit full screen':'&#9974; Full screen';
  if(matchMedia('(pointer:coarse)').matches){if(on)stage.appendChild(pad);else controls.after(pad)}}));
addEventListener('keydown',e=>{if(e.target.tagName!='SELECT'&&!e.repeat&&!MENU&&!BUSY&&!CONVO&&(e.key=='n'||e.key=='N'))setNight(!NIGHT)});
// ---- The start menu (M, or the Menu button): an Inventory tab (the date, the CIA's money and your own, what you carry),
// a Quests tab (active quests) and a Map tab (the island map, with where you are). The game pauses while it is open.
const ME={cia:PLAYER.ciaFunds,cash:PLAYER.funds,items:PLAYER.items.map(([id,n])=>({id,n})),sel:0,note:'',filmIn:0,light:false,quests:startQuests(),look:{...PLAYER.look},clothes:PLAYER.clothes.slice(),hi:{},equipped:null,hunger:PLAYER.hunger,nicotine:PLAYER.nicotine,cigsLeft:20,alcohol:0,tattoos:[]};
// your quests, in the order you took them on: {id, met: which conditions are met, done}
function startQuests(){return Object.keys(QUESTS).filter(id=>QUESTS[id].start&&(QUESTS[id].day??DAY)==DAY).map(id=>({id,met:[],done:false,took:DAY}))}
const startEl=document.getElementById('start'),startBtn=document.getElementById('startbtn'),TABS=[['inv','Inventory'],['quests','Quests'],['map','Map'],['save','Save'],['opts','Options']];
let START=null;  // the open tab, or null when the menu is closed
// a grid of item slots (at least 4 rows of 4), with how many of each and, in a shop, the price
const slotsOf=(list,sel,priced)=>Array.from({length:Math.max(16,Math.ceil(list.length/4)*4)},(_,i)=>{const t=list[i];
  return t?`<button class="slot${!priced&&ME.equipped==t.id?' eq':''}" data-item="${i}" aria-pressed="${i==sel}" title="${esc(ITEMS[t.id].name)}${!priced&&ME.equipped==t.id?' (equipped)':''}"><img src="${itemIcon(t.id)}" alt="">${!priced&&ME.equipped==t.id?'<span class="e">E</span>':''}${priced?`<span class="p">$${t.p}</span>`:''}${t.n>1?`<span class="n">${t.n}</span>`:''}</button>`:'<span class="slot"></span>'}).join('');
const money=v=>'$'+v.toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function renderStart(){if(START=='shop'){renderShop();return}if(START=='tracker'){renderTracker();return}if(START=='wardrobe'){renderWardrobe();return}if(typeof PLAYS!='undefined'&&PLAYS[START]){PLAYS[START].render();return}let body='';
  if(START=='inv'){// the date and money, then a grid of what you carry (at least 4 rows of 4), and the chosen item's panel
    ME.sel=Math.max(0,Math.min(ME.sel,ME.items.length-1));const it=ME.items[ME.sel],d=it&&ITEMS[it.id];
    const slots=slotsOf(ME.items,ME.sel);
    body=`<dl><dt>Date</dt><dd>${dateStr(DAY)} <small>${DAY<1?'(before the month begins)':`(day ${DAY} of ${DAYS})`}</small></dd><dt>CIA funds</dt><dd>${money(ME.cia)}</dd><dt>Personal funds</dt><dd>${money(ME.cash)}</dd>${ME.tattoos.length?`<dt>Tattoos</dt><dd>${ME.tattoos.map(t=>esc(tatName(t.id))+' <small>('+esc(t.place.toLowerCase())+')</small>').join(', ')}</dd>`:''}</dl>
    <div class="inv"><div class="slots" role="listbox" aria-label="Items">${slots}</div><div class="item">${d?`<div class="ihead"><img src="${itemIcon(it.id)}" alt=""><h3>${esc(d.name)}${it.n>1?' &times;'+it.n:''}${ME.equipped==it.id?' <small class="eqd">Equipped</small>':''}</h3></div>
      <p>${esc(d.desc)}${itemState(it.id)}</p><div class="acts">${itemActions(it.id).map((x,i)=>`<button data-act="${i}">${esc(x)}</button>`).join('')}</div>${ME.note?`<p class="note">${esc(ME.note)}</p>`:''}`:'<p>You are carrying nothing.</p>'}</div></div>`}
  if(START=='quests'){const li=q=>{const Q=QUESTS[q.id],g=NPCS.find(n=>n.name==Q.giver);return`<li class="${q.done?'qdone':''}"><b>${esc(Q.title)}</b> <small>${Q.main?'Main quest':'Side quest'}, from ${esc(Q.giver)}${g?', '+esc(g.job.replace(/ \(.*\)$/,'')):''}</small><br>${esc(Q.text)}`+
      `<ul class="qconds">${Q.done.map((c,i)=>`<li class="${q.done||q.met[i]?'met':''}">${q.done||q.met[i]?'&#9745;':'&#9744;'} ${esc(c.what)}</li>`).join('')}</ul></li>`};
    const on=ME.quests.filter(q=>!q.done),off=ME.quests.filter(q=>q.done);
    body=(on.length?`<h3>Active</h3><ul class="quests">${on.map(li).join('')}</ul>`:'<p>No active quests.</p>')+(off.length?`<h3>Completed</h3><ul class="quests">${off.map(li).join('')}</ul>`:'')}
  if(START=='map'){// you are marked at your place on the island map (indoors, at the place the building is in)
    const a=POS[P.m]?P.m:areaOf(P.m),p=a&&POS[a];
    body=`<div class="map"><img src="docs/island-map.svg" alt="Map of the island">${mapFog()}${p?`<span class="you" style="left:${p[0]/17}%;top:${p[1]/8.6}%"></span>`:''}${questPlaces().map(([a,main])=>`<span class="qstar${main?'':' side'}" title="${esc(NM[a])}: someone here has a ${main?'main':'side'} quest for you" style="left:${POS[a][0]/17}%;top:${POS[a][1]/8.6}%">&#9733;</span>`).join('')}</div>
      <p>You are in ${esc(NM[P.m])}${a&&a!=P.m?', '+esc(NM[a]):''}.</p>`}
  if(START=='opts'){// the volume of everything you hear (the music, the place sounds and the radio), remembered in this browser
    const v=typeof MU!='undefined'?Math.round(MU.vol*100):100;
    body=`<h3>Sound</h3><p><label for="volume">Volume</label> <input type="range" id="volume" min="0" max="100" step="5" value="${v}"> <b id="volval">${v}%</b></p>
      <p><small>The volume of everything: the music, the sounds of each place and the radio. The Music button turns the music and place sounds off and on; the Radio button plays Radio Sarivalto instead.</small></p>`}
  if(START=='save'){// the save slots: where and when each was saved, and buttons to save over it, load it or delete it
    // (overwriting, loading and deleting ask again on the button first)
    const btn=(d,i,t)=>`<button data-do="${d}" data-slot="${i}">${ME.confirm==d+i?t+'?':t}</button>`;
    body=`<div class="saves">${SAVES.map(i=>{const v=readSave(i);
      return `<div class="save"><div><b>${slotName(i)}</b><br>${v?`${esc(v.where)}: ${dateStr(v.day)}, ${v.night?'night':'day'}<br><small>Saved ${new Date(v.at).toLocaleString()}</small>`:'<small>Empty</small>'}</div>
        <div class="acts">${btn('save',i,i=='quick'?'Quick save (Q)':v?'Overwrite':'Save here')}${v?btn('load',i,'Load')+btn('del',i,'Delete')+btn('exp',i,'Export'):''}</div></div>`}).join('')}</div>
      <div class="acts"><label class="filebtn"><input type="file" accept=".json,application/json" hidden>Import a save file&hellip;</label></div>
      <p><small>${esc(store.where)}</small></p>${ME.note?`<p class="note">${esc(ME.note)}</p>`:''}`}
  startEl.innerHTML=`<div class="tabs" role="tablist">${TABS.map(([k,t])=>`<button role="tab" data-tab="${k}" aria-selected="${k==START}">${t}</button>`).join('')}<button class="close" aria-label="Close the menu">&times;</button></div><div>${body}</div>`;
  startEl.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{START=b.dataset.tab;ME.note='';ME.confirm='';renderStart()});
  const vol=startEl.querySelector('#volume');if(vol)vol.oninput=()=>{if(typeof setVolume=='function')setVolume(vol.value/100);startEl.querySelector('#volval').textContent=vol.value+'%'};
  const fi=startEl.querySelector('.filebtn input');if(fi)fi.onchange=()=>{if(fi.files[0])importSave(fi.files[0])};
  startEl.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>slotAction(b.dataset.do,b.dataset.slot=='quick'?'quick':+b.dataset.slot));
  startEl.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{ME.sel=+b.dataset.item;ME.note='';renderStart()});
  startEl.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>useItem(itemActions(ME.items[ME.sel].id)[+b.dataset.act]));startEl.querySelector('.close').onclick=closeStart}
// What each item can do. The actions come from ITEMS, with a few that change with the item's state (the flashlight's switch,
// film in the camera); useItem carries one out and leaves a line in the panel.
const has=id=>ME.items.find(i=>i.id==id),take=id=>{const i=has(id);if(i&&--i.n<=0)ME.items.splice(ME.items.indexOf(i),1)};
function itemActions(id){const a=ITEMS[id].actions.map(a=>id=='flashlight'&&a=='Turn on'&&ME.light?'Turn off':a);return ITEMS[id].equip?[ME.equipped==id?'Unequip':'Equip',...a]:a}
function itemState(id){return id=='camera'?` ${ME.filmIn?'Loaded: '+ME.filmIn+' exposures left.':'No film loaded.'}`:id=='flashlight'?` It is ${ME.light?'on':'off'}.`:''}
function loadFilm(){if(ME.filmIn)return'The camera already has film in it.';if(!has('film'))return'You have no film.';take('film');ME.filmIn=50;return'You load a fresh roll of film into the Minox: 50 exposures.'}
const HEADLINES=['THE KING IS DEAD: ISLAND MOURNS','WHO WILL RULE SARIVALTO? PARTIES PREPARE','REPUBLICANS STILL WITHOUT A LEADER','KELP COLA PROFITS UP AGAIN','OIL RIG PRODUCTION AT RECORD HIGH','SOVIET TRAWLERS SEEN OFF THE NORTH COAST','CHURCH CALLS FOR CALM'];
function useItem(a){const id=ME.items[ME.sel].id,nm=ITEMS[id].name.toLowerCase();
  // holding something: one thing at a time
  if(a=='Equip'||a=='Unequip'){const was=ME.equipped&&ME.equipped!=id&&ITEMS[ME.equipped];ME.equipped=a=='Equip'?id:null;
    ME.note=id=='cigarettes'?(a=='Equip'?`You light a cigarette${was?` and put away the ${was.name.toLowerCase()}`:''}. You'll smoke as you go.`:'You stub out your cigarette.')
      :a=='Equip'?`You take the ${nm} in your hand${was?`, putting away the ${was.name.toLowerCase()}`:''}.`:`You put the ${nm} away.`;renderStart();return}
  const gone=v=>()=>(take(id),`You ${v} the ${nm}.`+(typeof eat=='function'?eat(id):'')),R={
  beer:{Drink:gone('drink')},whisky:{Drink:gone('drink')},cola:{Drink:gone('drink')},coffee:{Drink:gone('drink')},cigarettes:{Smoke:()=>smoke()},
  burger:{Eat:gone('eat')},pizza:{Eat:gone('eat')},wine:{Drink:gone('drink')},bun:{Eat:gone('eat')},meal:{Eat:gone('eat')},smokedfish:{Eat:gone('eat')},bread:{Eat:gone('eat')},hotdog:{Eat:gone('eat')},
  newspaper:{Read:()=>`The headline: ${HEADLINES[((DAY-1)%HEADLINES.length+HEADLINES.length)%HEADLINES.length]}.`},book:{Read:'You read a chapter. The hero gets away again.'},
  islandmap:{'Look at':()=>{START='map';return''}},souvenir:{'Look at':'Kelpy grins back at you.'},record:{'Look at':'You need a record player to hear it.'},
  radio:{Listen:()=>typeof toggleRadio=='function'?toggleRadio():'Radio Sarivalto: Kaisa is playing slow songs for the late king.'},fishrod:{Fish:()=>ME.equipped!='fishrod'?'Equip the fishing rod first.':canFish()?(closeStart(),startFishing(),''):'Face some open water (the sea, the lake or the river) to fish in it.'},
  notebook:{'Read':`${dateStr(DAY)}: ${DAY==1?'Arrived on Sarivalto. Set up in the hidden room under the radio tower. Report to Chuck.':'Nothing new written yet.'}`,'Write a note':'Nothing worth writing down yet.'},
  camera:{'Take a photo':()=>ME.filmIn?'Nothing here worth photographing.':'There is no film in the camera.','Load film':loadFilm},
  film:{'Load into camera':loadFilm},
  codebook:{'Read':'Call sign for Chuck: NIGHTJAR. Today\'s pad page is marked with a pencil tick.','Burn':'Not yet: you still need it to talk to Chuck.'},
  lockpicks:{'Pick a lock':'There is no lock here to pick.'},
  flashlight:{'Turn on':()=>(ME.light=true,'Click. The flashlight is on.'),'Turn off':()=>(ME.light=false,'Click. The flashlight is off.')}}[id]?.[a]??(FISH[id]&&a=='Look at'?FISH[id].desc+(FISH[id].junk?' Nobody will buy it.':' Olga at the fish shop pays '+money(FISH[id].price)+' for one.'):undefined);
  ME.note=typeof R=='function'?R():R??'You cannot do that yet.';const at=ME.items.findIndex(i=>i.id==id);if(at>=0)ME.sel=at;renderStart()}
// ---- Shops: talking to a shopkeeper at their shop shows their stock (in the same grid as your inventory). Choose an item and
// pay with CIA funds or your own money; it moves from their stock to your inventory. Deliveries come every other day (the 1st,
// 3rd, 5th and so on of September): a shop you look in on after one has its stock filled back up to what it started with (anything
// it has more of, it keeps).
const STOCK={};    // each shop's stock as it is now, by keeper name
const STOCKED={};  // the delivery day each shop's stock was last filled on, by keeper name
let SHOP=null;     // the open shop: {n: the keeper, sel: the chosen item, note: the last thing that happened}
const deliveryDay=d=>d<1?d:d%2?d:d-1;
function stockOf(n){const full=SHOPS[n.name].stock,dd=deliveryDay(DAY),st=STOCK[n.name];
  if(!st||STOCKED[n.name]==null||STOCKED[n.name]<dd||STOCKED[n.name]>DAY){
    STOCK[n.name]=[...full.map(([id,c,p])=>{const had=st&&st.find(t=>t.id==id);return{id,n:Math.max(c,had?had.n:0),p}}),...(st||[]).filter(t=>!full.some(([id])=>id==t.id))];STOCKED[n.name]=dd}
  return STOCK[n.name]}
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
  if(CLOTHES[t.id]&&ME.clothes.includes(t.id)){SHOP.note=`You already have the ${nm} in your wardrobe.`;renderStart();return}
  if(ME[how]<t.p){SHOP.note=`You don't have enough ${how=='cia'?'CIA funds':'money of your own'} for the ${nm}.`;renderStart();return}
  ME[how]-=t.p;if(CLOTHES[t.id])ME.clothes.push(t.id);else{const mine=has(t.id);if(mine)mine.n++;else ME.items.push({id:t.id,n:1})}if(--t.n<=0)st.splice(SHOP.sel,1);
  SHOP.note=`You buy the ${nm} for ${money(t.p)}, paid from ${how=='cia'?'CIA funds':'your own money'}.`+(CLOTHES[t.id]?' It will be waiting in your wardrobe at home.':'');renderStart()}
// ---- Saving and loading: a quick save and three slots, kept by store (js/store.js: in the browser, or as files in the app). A save holds where you are, the date and time of day, your money,
// items and quests, and what is left in every shop.
// the quick save (Q, or its button) has its own slot, saved over without asking; then the three ordinary slots
const SAVES=['quick',0,1,2],slotName=i=>i=='quick'?'Quick save':'Slot '+(i+1);
const okSave=v=>v&&v.v==1&&v.p&&MAPS[v.p.m]?v:null,readSave=i=>okSave(store.get(i));
function slotAction(d,i){if(d=='exp'){exportSave(i);return}const ask=d!='save'||i!='quick'&&readSave(i);
  if(ask&&ME.confirm!=d+i){ME.confirm=d+i;ME.note='';renderStart();return}ME.confirm='';
  if(d=='save')ME.note=saveGame(i);if(d=='del'){store.remove(i).catch(e=>console.warn(e));ME.note=slotName(i)+' deleted.'}
  if(d=='load'){loadGame(i);return}renderStart()}
function saveGame(i){if(P.m=='tram')return'You cannot save on the tram.';const a=POS[P.m]?P.m:areaOf(P.m);
  const v={v:1,at:Date.now(),where:NM[P.m]+(a&&a!=P.m?', '+NM[a]:''),day:DAY,night:NIGHT,p:{m:P.m,x:P.x,y:P.y,dir:P.dir},
    me:{cia:ME.cia,cash:ME.cash,items:ME.items,filmIn:ME.filmIn,light:ME.light,quests:ME.quests,look:ME.look,clothes:ME.clothes,hi:ME.hi,equipped:ME.equipped,hunger:ME.hunger,nicotine:ME.nicotine,cigsLeft:ME.cigsLeft,smokeT:ME.smokeT,alcohol:ME.alcohol,tattoos:ME.tattoos},stock:STOCK,stocked:STOCKED,fp:FP};
  // (if storing fails, say so once it has)
  store.put(i,v).catch(()=>say('The game could not be saved: there is nowhere to store it.',5000));return i=='quick'?'Quick saved.':'Game saved in '+slotName(i).toLowerCase()+'.'}
// a save as a file to download, and a save file loaded straight into the game
function exportSave(i){const v=readSave(i);if(!v)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(v,null,1)],{type:'application/json'}));
  a.download=`sarivalto-${i=='quick'?'quicksave':'slot-'+(i+1)}-day-${v.day}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);ME.note=slotName(i)+' exported as a file.';renderStart()}
async function importSave(f){let v=null;try{v=okSave(JSON.parse(await f.text()))}catch(e){}if(!v){ME.note='That file is not a Sarivalto save.';renderStart();return}
  loadSave(v);say('Loaded '+v.where+', '+dateStr(v.day)+' from the file. Save it in a slot to keep it.',5000)}
function loadGame(i){const v=readSave(i);if(!v){ME.note='That save could not be loaded.';renderStart();return}loadSave(v);say('Game loaded: '+v.where+', '+dateStr(DAY)+'.',4000)}
function loadSave(v){
  DAY=v.day;setNight(v.night);if(v.fp){Object.assign(FP.pts,v.fp.pts);FP.hist=v.fp.hist||{}}Object.assign(ME,v.me,{sel:0,note:'',confirm:''});ME.quests=(Array.isArray(ME.quests)?ME.quests:startQuests()).filter(q=>QUESTS[q.id]);ME.quests.forEach(q=>{if(QUESTS[q.id].main&&q.took==null)q.took=QUESTS[q.id].day});ME.look={...PLAYER.look,...(v.me.look||{})};ME.clothes=v.me.clothes||PLAYER.clothes.slice();ME.hi=v.me.hi||{};ME.equipped=v.me.equipped??null;ME.hunger=v.me.hunger??PLAYER.hunger;ME.nicotine=v.me.nicotine??PLAYER.nicotine;ME.cigsLeft=v.me.cigsLeft??20;ME.smokeT=v.me.smokeT??0;ME.alcohol=v.me.alcohol??0;ME.tattoos=v.me.tattoos||[];for(const k in STOCK)delete STOCK[k];Object.assign(STOCK,v.stock);for(const k in STOCKED)delete STOCKED[k];for(const k in STOCK)STOCKED[k]=v.stocked?.[k]??deliveryDay(DAY);
  TRIP=null;closeStart();place(v.p.m,[v.p.x,v.p.y],v.p.dir)}
// ---- The Faction Tracker (on the computer in your home): every main faction's points, a bar chart comparing them, and a line
// chart of each faction's points through September. FP.pts holds the points now; FP.hist[day] the points as they stood at the end
// of each day on which they changed (a day with no entry carries on from the one before).
const MAIN_FACTIONS=Object.keys(FACTIONS).filter(f=>!GROUPS.includes(f));
const FP={pts:Object.fromEntries(MAIN_FACTIONS.map(f=>[f,0])),hist:{}};
function addPoints(f,n){FP.pts[f]=(FP.pts[f]||0)+n;FP.hist[DAY]={...FP.pts};if(START=='tracker')renderStart()}
const ptsOn=d=>{for(let k=d;k>=1;k--)if(FP.hist[k])return FP.hist[k];const pre=Object.keys(FP.hist).map(Number).filter(k=>k<1).sort((a,b)=>b-a)[0];return pre!=null?FP.hist[pre]:Object.fromEntries(MAIN_FACTIONS.map(f=>[f,0]))};
function openTracker(){if(MENU||RIDE||BUSY)return;SHOP=null;START='tracker';stack=[];startEl.hidden=false;renderStart()}
function renderTracker(){const rank=MAIN_FACTIONS.slice().sort((a,b)=>FP.pts[b]-FP.pts[a]),max=Math.max(10,...MAIN_FACTIONS.map(f=>FP.pts[f]));
  const sw=f=>`<span class="fsw" style="background:${FACTIONS[f][1]}"></span>`;
  // the line chart: days 1-30 across, points up; each faction's line runs as far as today
  const W=340,H=150,pl=30,pr=8,pt=8,pb=20,xs=d=>pl+(d-1)*(W-pl-pr)/(DAYS-1);let lo=0,hi=10;for(let d=1;d<=DAY;d++)for(const f of MAIN_FACTIONS){const v=ptsOn(d)[f]||0;lo=Math.min(lo,v);hi=Math.max(hi,v)}
  const ys=v=>pt+(hi-v)*(H-pt-pb)/(hi-lo||1),grid=[...Array(5).keys()].map(i=>lo+(hi-lo)*i/4);
  const lines=MAIN_FACTIONS.map(f=>{const pts=[];for(let d=1;d<=DAY;d++)pts.push(xs(d).toFixed(1)+','+ys(ptsOn(d)[f]||0).toFixed(1));return`<polyline fill="none" stroke="${FACTIONS[f][1]}" stroke-width="2" points="${pts.join(' ')}"/>`+(DAY==1?`<circle cx="${xs(1)}" cy="${ys(FP.pts[f])}" r="2.5" fill="${FACTIONS[f][1]}"/>`:'')}).join('');
  const svg=`<svg class="lines" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points by day">${grid.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${ys(v)}" y2="${ys(v)}" stroke="#2a3a2a"/><text x="${pl-4}" y="${ys(v)+3}" font-size="8" fill="#9fb59a" text-anchor="end">${Math.round(v)}</text>`).join('')}
    ${[1,5,10,15,20,25,30].map(d=>`<text x="${xs(d)}" y="${H-6}" font-size="8" fill="#9fb59a" text-anchor="middle">${d}</text>`).join('')}${DAY>=1?`<line x1="${xs(DAY)}" x2="${xs(DAY)}" y1="${pt}" y2="${H-pb}" stroke="#9fe870" stroke-dasharray="2 2"/>`:''}${lines}</svg>`;
  startEl.innerHTML=`<div class="tabs"><h3 class="shopname">Faction Tracker <small>${dateStr(DAY)}</small></h3><button class="close" aria-label="Close the tracker">&times;</button></div>
    <div class="ftrack"><div><h3>Points</h3><div class="bars">${rank.map(f=>`<div class="bar"><span>${sw(f)}${esc(FACTIONS[f][0])}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(0,FP.pts[f])/max*100}%;background:${FACTIONS[f][1]}"></span></span><span>${FP.pts[f]}</span></div>`).join('')}</div>
    </div><div><h3>Points through September</h3>${svg}</div></div>`;
  startEl.querySelector('.close').onclick=closeStart}
// the computer in your home: the bank of screens labelled Computer, on the tile you're facing
const computerAhead=()=>{if(P.m!=HOME)return false;const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return FL[P.m].some(([fx,fy,w,h,,l])=>l=='Computer'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
// the test tools beside Jump to: add or take away 10 points for a faction, or move on a day
const tfac=document.getElementById('tfac');tfac.innerHTML=MAIN_FACTIONS.map(f=>`<option value="${f}">${FACTIONS[f][0]}</option>`).join('');
document.getElementById('tplus').onclick=e=>{addPoints(tfac.value,10);say(FACTIONS[tfac.value][0]+': '+FP.pts[tfac.value]+' points.');e.target.blur()};
document.getElementById('tminus').onclick=e=>{addPoints(tfac.value,-10);say(FACTIONS[tfac.value][0]+': '+FP.pts[tfac.value]+' points.');e.target.blur()};
// moving to another day: the calendar on the wall and anything showing the date are drawn again
function setDay(d){const was=DAY;DAY=DATES.includes(d)?d:Math.max(1,Math.min(DAYS,d));for(const k in SC)delete SC[k];for(const k in PCACHE)delete PCACHE[k];dayjump.value=DAY;BLOCKS.clear();
  // (from 22 August into the month you arrive on the island, at home; back to 22 August, you are at Langley again)
  let note='';if(was<1&&DAY>=1&&/^langley/.test(P.m)){place(HOME,[17,3],0);note=' You arrive on Sarivalto.'+(chuckCalling()?' The big screen is flashing: Chuck is calling.':'')}
  else if(was>=1&&DAY<1&&!/^langley/.test(P.m)){TRIP=null;place('langley',[11,10],1);note=' You are back at CIA Headquarters.'}
  note+=arrivals();if(START)renderStart();return note}
document.getElementById('tday').onclick=e=>{if(DAY<DAYS){const n=setDay(nextDay(DAY));say('It is now '+dateStr(DAY)+'.'+n)}e.target.blur()};
// the date picker beside Jump to: any day of the month
const dayjump=document.getElementById('dayjump');DATES.forEach(d=>dayjump.appendChild(new Option(dateStr(d),d)));dayjump.value=DAY;
dayjump.onchange=()=>{const n=setDay(+dayjump.value);say('It is now '+dateStr(DAY)+'.'+n);dayjump.blur()};
// ---- The wardrobe in your home: your hair and facial hair (style and colour) and the clothes you own, with a preview of you from
// each side. Up and down (or W and S) choose a row, left and right (or A and D) change it; the arrows on each row do the same.
const WARD={row:0};
// (in the Cover Story Department, WARD.all: every outfit in the game, and what you leave wearing is yours)
const ownedOf=slot=>Object.keys(CLOTHES).filter(id=>CLOTHES[id].slot==slot&&(id=='nohat'||WARD.all||ME.clothes.includes(id))).map(id=>[id,CLOTHES[id].name]);
const WROWS=[['hair','Hair',()=>HAIR_STYLES],['hairCol','Hair colour',()=>HAIR_COLS],['beard','Facial hair',()=>BEARD_STYLES],['beardCol','Facial hair colour',()=>HAIR_COLS],
  ['hat','Headwear',()=>ownedOf('hat')],['top','Top',()=>ownedOf('top')],['legs','Trousers',()=>ownedOf('legs')],['shoes','Shoes',()=>ownedOf('shoes')]];
function openWardrobe(all){if(MENU||RIDE||BUSY)return;SHOP=null;WARD.all=!!all;START='wardrobe';stack=[];startEl.hidden=false;renderStart()}
// ---- The Cover Story Department at Langley: the character creator. Every hairstyle, colour and outfit in the game to choose from;
// leaving it, the clothes you have on go into your wardrobe at home, and your alias is done (questEvent 'alias').
const openCover=()=>openWardrobe(true);
function leaveCover(){WARD.all=false;for(const k of['hat','top','legs','shoes'])if(ME.look[k]&&ME.look[k]!='nohat'&&!ME.clothes.includes(ME.look[k]))ME.clothes.push(ME.look[k]);questEvent('alias')}
// the cigarette machine in the Langley cafeteria: a pack for $2 of your own money
const vendingAhead=()=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return P.m=='langley_cafe'&&FL[P.m].some(([fx,fy,w,h,,l])=>l=='Cigarette Machine'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
function cigMachine(){choose('A cigarette machine. Twenty to a pack, $2.',[['Buy a pack ($2)',()=>{if(ME.cash<2){say("You don't have $2 of your own.",3500);return}ME.cash-=2;const c=has('cigarettes');if(c)c.n++;else ME.items.push({id:'cigarettes',n:1});say('Clunk. A pack of cigarettes drops into the tray.',3500)}],['Not now']])}
const mirrorAhead=()=>{if(P.m!='langley_cover')return false;const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return FL[P.m].some(([fx,fy,w,h,,l])=>l=='Dressing Mirror'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
function wstep(i,dd){const[k,,f]=WROWS[i],o=f(),j=Math.max(0,o.findIndex(([v])=>v==ME.look[k]));ME.look[k]=o[(j+dd+o.length)%o.length][0];WARD.row=i;renderStart()}
function renderWardrobe(){const rows=WROWS.map(([k,label,f],i)=>{const o=f(),j=Math.max(0,o.findIndex(([v])=>v==ME.look[k])),lc=label.toLowerCase();
    return`<div class="wrow${i==WARD.row?' on':''}"><span class="wl">${label}</span><button data-w="${i}" data-d="-1" aria-label="Previous ${lc}">&#9664;</button>`+
      `<span class="wv">${k.endsWith('Col')?`<i class="wsw" style="background:${o[j][0]}"></i>`:''}${esc(o[j][1])} <small>${j+1}/${o.length}</small></span><button data-w="${i}" data-d="1" aria-label="Next ${lc}">&#9654;</button></div>`}).join('');
  startEl.innerHTML=`<div class="tabs"><h3 class="shopname">${WARD.all?'Cover Story Department <small>your alias</small>':'Wardrobe'}</h3><button class="close" aria-label="${WARD.all?'Done':'Close the wardrobe'}">&times;</button></div>
    <div class="wardrobe"><div class="wprev" aria-label="How you look">${[0,3,1,2].map(()=>'<canvas width="48" height="60"></canvas>').join('')}</div><div class="wopts">${rows}</div></div>
    <p class="note">Up and down choose, left and right change. ${WARD.all?'Anything you leave wearing goes into your wardrobe. Close when you are done.':`More clothes are for sale at ${esc(NM.clothes_in)}, ${esc(NM.tailor)} and ${esc(NM.outfitters_in)}.`}</p>`;
  startEl.querySelectorAll('.wprev canvas').forEach((c,i)=>{const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(lookChar([0,3,1,2][i],0,ME.look),0,0,48,60)});
  startEl.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>wstep(+b.dataset.w,+b.dataset.d));startEl.querySelector('.close').onclick=closeStart}
// the wardrobe in your home is the tile you're facing
const wardrobeAhead=()=>{if(P.m!=HOME)return false;const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return FL[P.m].some(([fx,fy,w,h,,l])=>l=='Wardrobe'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
// the map's shading: every place not open yet is darkened (its patch of island, clipped to the coast; the oil rig, out at sea, a
// circle), and a snow bank marks each road from an open place into a closed one
function mapFog(){if(typeof MAP_GEO=='undefined')return'';const G=MAP_GEO,shut=Object.keys(G.rp).filter(id=>!isOpen(id));if(!shut.length)return'';
  const cells=shut.filter(id=>G.cells[id]).map(id=>`<polygon points="${G.cells[id]}"/>`).join('')+(shut.includes('oilrig')?`<circle cx="${G.rp.oilrig[0]}" cy="${G.rp.oilrig[1]}" r="46"/>`:'');
  const banks=LINKS.map(l=>l.split(' ')).filter(([a,,b])=>isOpen(a)!=isOpen(b)).map(([a,,b])=>{const p=G.rp[a],q=G.rp[b],x=(p[0]+q[0])/2,y=(p[1]+q[1])/2;
    return`<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><title>Snowed in: ${esc(NM[isOpen(a)?b:a])}</title><path d="M-17 7Q-12 -8 -3 -4Q4 -14 12 -3Q18 -1 18 7Z" fill="#f8fbfd" stroke="#5a6a7a" stroke-width="2"/><path d="M-9 0Q-4 -5 1 -2" stroke="#c8d6e2" stroke-width="2" fill="none"/>`+
      `<path d="M14 7V-14" stroke="#4a3020" stroke-width="2.5"/><rect x="6" y="-22" width="18" height="10" rx="1.5" fill="#c0392b" stroke="#fff" stroke-width="1.5"/><path d="M15 -20V-15M15 -13.5V-13" stroke="#fff" stroke-width="2"/></g>`}).join('');
  return`<svg class="fog" viewBox="0 0 1700 860" aria-hidden="true"><defs><clipPath id="fogisl"><polygon points="${G.coast}"/></clipPath></defs><g clip-path="url(#fogisl)" fill="#1a2430" fill-opacity=".42">${cells}</g>${banks}</svg>`}
function openStart(tab='inv'){if(MENU||RIDE||BUSY||CONVO)return;START=tab;stack=[];startEl.hidden=false;startBtn.setAttribute('aria-expanded','true');renderStart()}
function closeStart(){if(START=='wardrobe'&&WARD.all)leaveCover();START=null;SHOP=null;startEl.hidden=true;startBtn.setAttribute('aria-expanded','false')}
startBtn.onclick=()=>{START?closeStart():openStart();startBtn.blur()};
// M opens and closes it, Escape closes it, left and right (or A and D) move between tabs
addEventListener('keydown',e=>{if(e.target.tagName=='SELECT'||e.repeat)return;const k=e.key;
  if(k=='m'||k=='M'){START?closeStart():openStart();e.preventDefault()}
  else if((k=='f'||k=='F')&&!CONVO&&!fsb.hidden){toggleFS();e.preventDefault()}
  else if((k=='q'||k=='Q')&&!MENU&&!RIDE&&!BUSY&&!CONVO){const r=saveGame('quick');if(START=='save'){ME.note=r;renderStart()}else say(r,2500);e.preventDefault()}
  else if(START&&k=='Escape'){closeStart();e.preventDefault()}
  // in a shop the arrows (or WASD) move through the stock, C pays with CIA funds and P with your own money
  // in the casino and arcade games, the game takes the keys
  else if(typeof PLAYS!='undefined'&&PLAYS[START]){if(PLAYS[START].key(k,e))e.preventDefault()}
  else if(START=='wardrobe'){const m={ArrowUp:-1,w:-1,ArrowDown:1,s:1}[k.length==1?k.toLowerCase():k],c={ArrowLeft:-1,a:-1,ArrowRight:1,d:1}[k.length==1?k.toLowerCase():k];
    if(m){WARD.row=(WARD.row+m+WROWS.length)%WROWS.length;renderStart();e.preventDefault()}else if(c){wstep(WARD.row,c);e.preventDefault()}}
  else if(START=='shop'){const st=stockOf(SHOP.n),d={ArrowLeft:-1,a:-1,ArrowRight:1,d:1,ArrowUp:-4,w:-4,ArrowDown:4,s:4}[k.length==1?k.toLowerCase():k];
    if(d){const n=SHOP.sel+d;if(n>=0&&n<st.length){SHOP.sel=n;SHOP.note=''}renderStart();e.preventDefault()}
    else if(k=='c'||k=='C'){buy('cia');e.preventDefault()}else if(k=='p'||k=='P'){buy('cash');e.preventDefault()}else if(k=='Tab')e.preventDefault()}
  // Tab (or 1, 2, 3) changes tab; in the inventory the arrows (or WASD) move through the grid and E, Space or Enter does the item's
  // first action; on the other tabs left and right change tab
  else if(START&&(k=='Tab'||/^[1-9]$/.test(k)&&k<=TABS.length)){const i=TABS.findIndex(t=>t[0]==START);START=TABS[k=='Tab'?(i+(e.shiftKey?TABS.length-1:1))%TABS.length:k-1][0];ME.note='';renderStart();e.preventDefault()}
  else if(START=='inv'&&ME.items.length&&/^(Arrow(Left|Right|Up|Down)|[wasdWASD])$/.test(k)){const d={ArrowLeft:-1,a:-1,ArrowRight:1,d:1,ArrowUp:-4,w:-4,ArrowDown:4,s:4}[k.length==1?k.toLowerCase():k],n=ME.sel+d;
    if(n>=0&&n<ME.items.length){ME.sel=n;ME.note=''}renderStart();e.preventDefault()}
  else if(START=='inv'&&ME.items.length&&/^(e|E| |Enter)$/.test(k)&&!(e.target.closest&&e.target.closest('#start button'))){useItem(itemActions(ME.items[ME.sel].id)[0]);e.preventDefault()}
  else if(START&&START!='inv'&&e.target.type!='range'&&/^(ArrowLeft|ArrowRight|a|d|A|D)$/.test(k)){const i=TABS.findIndex(t=>t[0]==START),d=/Right|d|D/.test(k)?1:TABS.length-1;START=TABS[(i+d)%TABS.length][0];ME.note='';renderStart();e.preventDefault()}});
sel.onchange=()=>{const id=sel.value;closeMenu();RIDE=TRIP=null;go(id);sel.blur()};
const SOLID='#TR~vbkWecuxygitnoC';
// tramAt: a tram covers this tile (its track row or the row behind it that its body rises over)
const tramAt=(m,x,y)=>tramsOn(m,performance.now()).some(q=>(q.y==y||q.y-1==y)&&x*16+16>q.x+3&&x*16<q.x+93);
const solid=(m,x,y)=>{const t=MAPS[m][y]?.[x];return !t||SOLID.includes(t)||!!snowAt(m,x,y)||NPCS.some(n=>n.m==m&&n.x==x&&n.y==y)||
  PROPS.some(p=>{const sp=propSpan(p[3]),x0=p[1]-((sp-1)>>1);return p[0]==m&&x>=x0&&x<x0+sp&&p[2]==y&&!PROP_PASS.includes(p[3])})||tramAt(m,x,y)};
const press=d=>{if(!stack.includes(d))stack.push(d)},release=d=>{stack=stack.filter(k=>k!==d)};
addEventListener('keydown',e=>{if(e.target.tagName=='SELECT'||MENU||RIDE||START||BUSY||CONVO)return;const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY){press(KEY[k]);e.preventDefault()}});
addEventListener('keyup',e=>{const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY)release(KEY[k])});
document.querySelectorAll('#pad button[data-d]').forEach(b=>{const d=+b.dataset.d;
  b.addEventListener('pointerdown',e=>{e.preventDefault();press(d)});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>release(d)))});
// the exit (map edge, door or boat berth) the player is standing on, if any, and taking it
const exitHere=()=>EX[P.m].find(e=>e.x==P.x&&e.y==P.y);
// a place that is shut at this time of day, and what its door says
const shut=id=>NIGHT?DAY_ONLY.includes(id):NIGHT_ONLY.includes(id);
const shutMsg=id=>NM[id]+' is closed. It opens '+(NIGHT?'in the morning.':'at night.');
// ---- Which places are open today (OPEN_ON, OPEN_AT in data.js); interiors and places off the map are always open (they're reached
// through somewhere that is). A road out of a place into one that isn't open yet is blocked by a snow bank one tile in from the
// edge, with a DANGER sign beside the road; both are solid, and the sign can be read.
const openDay=id=>OPEN_AT[id]??OPEN_ON[DISTRICT_OF[id]],isOpen=id=>!POS[id]||(openDay(id)??1)<=DAY;
const BLOCKS=new Map();  // by place: its snow banks [{x, y, to, sx, sy}] (sx, sy: the sign); worked out once a day
function snowBlocks(m){if(BLOCKS.has(m))return BLOCKS.get(m);
  const out=EX[m].filter(e=>'TBLR'.includes(e.s)&&!isOpen(e.to)).map(e=>{const[x,y]=inw(e),v=e.s=='T'||e.s=='B',G=MAPS[m];
    const side=(v?[[x+1,y],[x-1,y]]:[[x,y-1],[x,y+1]]).find(([a,b])=>G[b]?.[a]&&!SOLID.includes(G[b][a])&&G[b][a]!='E'&&G[b][a]!=',')||(v?[x+1,y]:[x,y+1]);
    return{x,y,to:e.to,sx:side[0],sy:side[1]}});
  BLOCKS.set(m,out);return out}
const snowAt=(m,x,y)=>snowBlocks(m).find(b=>b.x==x&&b.y==y||b.sx==x&&b.sy==y);
const signAhead=()=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return snowBlocks(P.m).find(b=>b.sx==x&&b.sy==y)};
function useExit(e){const b=EX[e.to].find(q=>q.to==P.m);P.m=e.to;[P.x,P.y]=inw(b);P.rx=P.x;P.ry=P.y;showHere(P.m)}
function update(dt){
  if(RIDE){if(performance.now()-RIDE.t0>RIDE_DUR)arrive();return}if(MENU||START||BUSY||CONVO)return;
  if(typeof needsTick=='function')needsTick(dt);
  if(P.mv){const m=P.mv;m.t+=dt/.16;const k=Math.min(m.t,1);P.rx=m.fx+(m.tx-m.fx)*k;P.ry=m.fy+(m.ty-m.fy)*k;
    if(m.t>=1){P.mv=null;const e=exitHere();
      if(e&&!PRESS_DOORS.has(e.to)){if(isOpen(e.to))useExit(e);else say('The boat to '+NM[e.to]+" isn't running: the harbour there is snowed in.",4000)}
      else if(P.m=='tram'&&MAPS.tram[P.y][P.x]=='m')leaveTram()}}
  if(!P.mv&&tramAt(P.m,P.x,P.y)){standClear();return}
  if(!P.mv&&stack.length){const d=stack[stack.length-1],[dx,dy]=DIR[d];P.dir=d;
    const nx=P.x+dx,ny=P.y+dy,door=EX[P.m].find(e=>e.x==nx&&e.y==ny&&shut(e.to));
    if(door){if(!MSG||MSG.s!=shutMsg(door.to)||performance.now()-MSG.t>MSG.d)say(shutMsg(door.to))}
    else if(bigDoor(nx,ny,d))useExit(bigDoor(nx,ny,d));
    else if(stairsWay(nx,ny,d)){const t=stairsWay(nx,ny,d);if(!MSG||MSG.s!=t||performance.now()-MSG.t>MSG.d)say(t)}
    else if(snowAt(P.m,nx,ny)){const t=signAhead()?'The sign says: DANGER! SNOW. NO ACCESS.':'A deep bank of snow blocks the road.';if(!MSG||MSG.s!=t||performance.now()-MSG.t>MSG.d)say(t)}
    else if(lockedFront(nx,ny,d)){const t=lockedFront(nx,ny,d);if(!MSG||MSG.s!=t||performance.now()-MSG.t>MSG.d)say(t)}
    else if(!solid(P.m,nx,ny)){P.mv={fx:P.x,fy:P.y,tx:nx,ty:ny,t:0};P.x=nx;P.y=ny;P.par^=1}}
}
// a warehouse's or barn's big sliding doors (BLD deco 'whs', drawn across the middle of its front): walking up into them is
// the same as using the building's own door beside them (unless that door is shut)
// a padlocked building (BLD locked: what it says): walking up into its front says so
function lockedFront(x,y,d){if(DIR[d][1]!=-1)return null;const f=FL[P.m].find(([fx,fy,w,h,,,st])=>BLD[st]?.locked&&y==fy+h-1&&x>=fx&&x<fx+w);return f?BLD[f[6]].locked:null}
// stairs go one way: up from the bottom (walking up into them), down from the top (walking down into them); from any other side
// they say which way they go
function stairsWay(x,y,d){if(MAPS[P.m][y]?.[x]!='z')return null;const f=FL[P.m].find(([fx,fy,w,h,c])=>c=='z'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h),up=/up/i.test(f?.[5]||'');
  return DIR[d][1]==(up?-1:1)?null:up?'These stairs go up: climb them from the bottom.':'These stairs go down: take them from the top.'}
function bigDoor(x,y,d){if(DIR[d][1]!=-1)return null;const f=FL[P.m].find(([fx,fy,w,h,,,st])=>BLD[st]?.deco=='whs'&&y==fy+h-1&&x>=fx&&x<fx+w);if(!f)return null;
  const[fx,fy,w,h]=f,bx=(w*16>>1)-12,i=x-fx;if(i*16+15<bx||i*16>bx+24)return null;
  const e=EX[P.m].find(e=>e.y==fy+h-1&&e.x>=fx&&e.x<fx+w&&L[e.to]?.[3]=='interior');return e&&!shut(e.to)?e:null}
// a tram has come along where the player is standing: move them to the nearest free tile (preferring in front of the track)
function standClear(){let best=null;for(let dy=-4;dy<=4;dy++)for(let dx=-6;dx<=6;dx++){const x=P.x+dx,y=P.y+dy;
    if(!solid(P.m,x,y)){const d=Math.abs(dx)+Math.abs(dy)*1.5-(dy>0?.5:0);if(!best||d<best[2])best=[x,y,d]}}
  if(best){place(P.m,[best[0],best[1]],P.dir);say('Mind the tram!')}}
// ---- Riding the tram. On a platform, the action key (E, Space or Enter, or the E button) calls the tram; once it has stopped,
// pressing it again gets on. Inside the tram the action key opens a menu of stops; picking one plays a short ride and then
// puts the player on that stop's platform as the tram pulls away. Walking out of the tram's door gets off where you got on.
let MSG=null,MENU=0,RIDE=null,TRIP=null,BUSY=false,CONVO=null,CONVO_END=0;const RIDE_DUR=2800,say=(s,d=3000)=>{MSG={s,t:performance.now(),d}},menu=document.getElementById('menu');
// ---- Talking: the person on the tile the player is facing, or just across a counter (tile c: bar counters, shop counters,
// reception desks) or a cell's bars from it, and what they say (a placeholder line for everyone for now)
const npcAhead=()=>{const[dx,dy]=DIR[P.dir];let x=P.x+dx,y=P.y+dy;
  for(let i=0;i<3;i++){const n=NPCS.find(n=>n.m==P.m&&n.x==x&&n.y==y);if(n)return n;if(MAPS[P.m][y]?.[x]!='c'&&!barsAt(x,y))return;x+=dx;y+=dy}};
// cell bars (a feature labelled as bars): you can talk to someone through them, as across a counter
const barsAt=(x,y)=>FL[P.m].some(([fx,fy,w,h,,l])=>/bars/i.test(l||'')&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h);
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
  // (not until today's main quest is done)
  const due=mainDue();if(due){say(due=='offer'?"You can't call it a day yet: there's a main quest for you today. Look for the gold star.":"You can't call it a day yet: finish today's main quest first ("+QUESTS[due.id].title+').',5000);return}
  choose('Sit and wait for the evening?',[['Sit and wait until night',()=>pass(()=>{setNight(true);needsPass(20,30,60)},()=>'You sit and wait. The day goes by, and night falls.')],['Not now']])}
// a map on the wall (an interior's back-wall decoration 'map', in your home and elsewhere): facing up at it, from the floor below
// it or with furniture in between, and pressing E opens the island map
const mapAhead=()=>{if(DIR[P.dir][1]!=-1||L[P.m][3]!='interior'||P.y>2)return false;const x=P.x;return(INT[P.m]?.deco||[]).some(d=>d[1]=='map'&&d[0]==x)};
function sleep(){if(!NIGHT){say('It is still daytime, and you are not tired. Sit at the table and wait for the evening.',5000);return}
  if(DAY>=DAYS){say('It is '+DAYS+' '+MONTH+', the last day of the month. There is no time to sleep now.',5000);return}
  choose('Go to bed?',[['Sleep until morning',()=>pass(()=>{setDay(nextDay(DAY));setNight(false);needsPass(30,40,100)},()=>'You sleep through the night. Good morning: it is '+dateStr(DAY)+'.'+arrivals())],['Not now']])}
// ---- Quests (QUESTS in data.js)
const qOf=id=>ME.quests.find(q=>q.id==id);
// the quest someone has to give you: one of theirs you haven't taken on yet (they have a star over their head)
// (a main quest only on its own morning, and only if you haven't taken on another main quest that day; a side quest from its
// first day, once the places it needs are open)
const mainTaken=()=>ME.quests.find(q=>QUESTS[q.id].main&&q.took==DAY);
const offerable=id=>{const Q=QUESTS[id];if(qOf(id)||Q.given||Q.ring)return false;if(Q.main)return Q.day==DAY&&!NIGHT&&!mainTaken();return(Q.from??-99)<=DAY&&(Q.opens||[]).every(isOpen)};
const offerOf=n=>Object.keys(QUESTS).filter(id=>QUESTS[id].giver==n.name&&offerable(id)).sort((a,b)=>!!QUESTS[b].main-!!QUESTS[a].main)[0];
// the main quest standing between you and the evening: today's, taken on and not yet done ('offer' if there is one today you
// haven't taken on), or nothing
const mainDue=()=>{if(DAY<1)return null;const t=mainTaken();if(t)return t.done?null:t;return Object.keys(QUESTS).some(id=>QUESTS[id].main&&QUESTS[id].day==DAY)?'offer':null};
// the places on the island map where someone has a quest to give (indoors, the place their building is in)
// (with whether any of them is a main quest)
const questPlaces=()=>{const at={};for(const n of NPCS){const id=n.m&&offerOf(n);if(!id)continue;const a=POS[n.m]?n.m:areaOf(n.m);if(a&&POS[a])at[a]=at[a]||!!QUESTS[id].main}return Object.entries(at)};
// each condition not yet met in your active quests, as [quest, its index, the condition]
// (in a quest whose conditions come in order, only the next one; a last condition only once all the others are met)
const openConds=()=>ME.quests.filter(q=>!q.done).flatMap(q=>{const Q=QUESTS[q.id],cs=Q.done.map((c,i)=>[q,i,c]).filter(([,i])=>!q.met[i]);
  return Q.seq?cs.slice(0,1).filter(([q,i,c])=>!c.days||DAY>=(q.when?.[i-1]??DAY)+c.days):cs.every(([,,c])=>c.last)?cs:cs.filter(([,,c])=>!c.last)});
// meeting a condition; with all of them met, the quest is done (and if what's left is a last step, or the next in order, it says so)
function meet(q,i,quiet){const Q=QUESTS[q.id];q.met[i]=true;if(Q.meet&&Q.done.every((_,k)=>q.met[k]))setTimeout(applyRoutine,0);(q.when??=[])[i]=DAY;
  const gv=[Q.done[i].gives||[]].flat().filter(id=>!qOf(id));gv.forEach(id=>ME.quests.push({id,met:[],done:false,took:DAY}));
  const gift=Q.done[i].gift;if(gift){const mine=has(gift);if(mine)mine.n++;else ME.items.push({id:gift,n:1})}
  const gave=(gift?' You get the '+ITEMS[gift].name.toLowerCase()+'.':'')+gv.map(id=>(QUESTS[id].main?' New main quest: ':' New side quest: ')+QUESTS[id].title+'.').join('');if(Q.done.every((_,k)=>q.met[k])){q.done=true;q.day=DAY;say((quiet?'':Q.thanks+' ')+'Quest complete: '+Q.title+'.'+gave,quiet?4000:7000)}
  else{const said=Q.done[i].said,left=Q.done.filter((_,k)=>!q.met[k]),next=!said&&(Q.seq||left.every(c=>c.last))?' Next: '+left[0].what.replace(/^./,c=>c.toLowerCase())+'.':'';
    say((said?said+' ':'')+'Quest updated: '+Q.title+'.'+next+gave,said||next||gave?12000:4000)}}
// something happening in the game (a tattoo, say) meets the conditions waiting for it
function questEvent(ev){for(const[q,i,c]of openConds())if(c.event==ev){const n=((q.cnt??={})[i]||0)+1;q.cnt[i]=n;
  if(n>=(c.count||1))meet(q,i);else say(QUESTS[q.id].title+': '+n+' of '+c.count+'.',2500)}}
// what's arrived this morning for a condition that had to wait (said when the day begins)
// (a quest that comes by telephone, ring, rings on the morning of its day and is yours; someone it has waiting somewhere goes there)
function morningCalls(){if(NIGHT)return'';const rung=Object.keys(QUESTS).filter(id=>QUESTS[id].ring&&QUESTS[id].day==DAY&&!qOf(id));rung.forEach(id=>ME.quests.push({id,met:[],done:false,took:DAY}));
  if(rung.length)applyRoutine();return rung.map(id=>' '+QUESTS[id].ring+' New main quest: '+QUESTS[id].title+'.').join('')}
const arrivals=()=>morningCalls()+openConds().filter(([q,i,c])=>c.arrives&&q.when?.[i-1]!=null&&DAY==q.when[i-1]+(c.days||0)).map(([,,c])=>' '+c.arrives).join('');
// ---- The video call: the big screen in your home links to Langley: to Chuck by day, and in the evening to George, who handles the
// jobs that are done after dark. When the one on the line has a quest for you, or is waiting to hear about one, you can call them;
// when they have a new quest for you the screen says INCOMING CALL (chuckCalling). The call puts them in the conversation panel on
// a video feed.
const CHUCK=()=>NPCS.find(n=>n.name=='Chuck');
const CALLER=()=>NPCS.find(n=>n.name==(NIGHT?'George':'Chuck'));
const chuckCalling=()=>{const n=CALLER();return DAY>=1&&!!n&&!!offerOf(n)};
const screenAhead=()=>{if(P.m!=HOME)return false;const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return FL[P.m].some(([fx,fy,w,h,,l])=>l=='Big Screen'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
function videoCall(){const n=CALLER();if(!n)return;if(DAY<1){say(`The screen shows LINK READY. You are at Langley: ${n.name} is ${n.name=='Chuck'?'upstairs':'in the cafeteria'}.`,4000);return}
  const c=questTalk(n)||{start:'a',nodes:{a:{say:n.name=='Chuck'?"NIGHTJAR, Langley. Nothing new for you right now. Keep your head down and your eyes open.":"NIGHTJAR. George. Chuck's gone home; the night shift's mine. Nothing for you tonight. When there's a job that needs doing after dark, I'll call."}}};
  converse(n,c);cvEl.classList.add('call')}
// a use condition: the furniture it names, in the place it names, on the tile you're facing
const useAhead=()=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return openConds().find(([,,c])=>c.use&&c.m==P.m&&FL[P.m].some(([fx,fy,w,h,,l])=>l==c.use&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h))};
// talking to someone about a quest, as a conversation: hand over what it asks for, if you have it; be reminded of it; or be
// offered a new one. Returns the conversation, or nothing if they have no quest business with you.
const unquote=t=>t.replace(/^"|"$/g,'');
function questTalk(n){
  // a tour: pay for it (from CIA funds) and it's yours; the quest moves on once it's over, if you paid
  const tr=openConds().find(([,,c])=>c.tour==n.name);if(tr){const[q,i,c]=tr;let paid=false;
    const a={...c.chat.nodes.a,opts:ME.cia>=c.price?[['Pay $'+c.price+' for the tour (CIA funds)','b',()=>{ME.cia-=c.price;paid=true}],['Not now',null]]:[["Not now (you don't have $"+c.price+')',null]]};
    return{start:'a',nodes:{...c.chat.nodes,a},onEnd:()=>{if(paid)meet(q,i)}}}
  const tk=openConds().find(([,,c])=>c.talk==n.name);if(tk){const[q,i,c]=tk;return{...(c.chat||QUESTS[q.id].chat),onEnd:()=>meet(q,i)}}
  const g=openConds().find(([,,c])=>c.give&&c.to==n.name),Qg=g&&QUESTS[g[0].id];
  if(g&&has(g[2].give)){const[q,i,c]=g,nm=ITEMS[c.give].name.toLowerCase();
    return{start:'a',nodes:{a:{say:Qg.giver==n.name&&Qg.wait?Qg.wait:'Have you got something for me?',opts:[['Give '+n.name+' the '+nm,'thanks',()=>{take(c.give);meet(q,i,true)}],['Not yet',null]]},
      thanks:{say:unquote(Qg.thanks)}}}}
  // (today's main quest comes before a reminder, and the reminder is about the latest quest you took on from them)
  const id=offerOf(n),w=[...ME.quests].reverse().find(q=>!q.done&&QUESTS[q.id].giver==n.name&&QUESTS[q.id].wait);if(w&&!(id&&QUESTS[id].main))return{start:'a',nodes:{a:{say:QUESTS[w.id].wait}}};
  if(!id)return null;const Q=QUESTS[id];
  return{start:'a',nodes:{a:{say:Q.offer,opts:[['Accept: '+Q.title,'yes',()=>{ME.quests.push({id,met:[],done:false,took:DAY});say((Q.main?'New main quest: ':'New side quest: ')+Q.title+'.',4000)}],['Not now',null]]},yes:{say:Q.accept}}}}
// talking to someone: their quest business first, then their own conversation (CONVOS), a shopkeeper's welcome, or a line about
// themselves; all of it in the conversation panel
function talk(n){n.dir=P.dir^1;
  const c=questTalk(n)||CONVOS[n.name]||(SHOPS[n.name]&&n.m==n.loc?{start:'a',nodes:{a:{say:"Welcome! Have a look at what I've got.",opts:[['Show me your stock',null,()=>openShop(n)],...(n.name==FISH_BUYER&&ME.items.some(i=>FISH[i.id]&&!FISH[i.id].junk)?[['Sell my catch',null,sellCatch]]:[]),['Goodbye',null]]}}}:{start:'a',nodes:{a:{say:unquote(line(n))}}});
  converse(n,c)}
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
  const u=useAhead();if(u){meet(u[0],u[1]);return}
  if(screenAhead()){videoCall();return}
  if(mapAhead()){openStart('map');return}
  if(computerAhead()){openTracker();return}
  if(wardrobeAhead()){openWardrobe();return}
  if(mirrorAhead()){openCover();return}
  if(vendingAhead()){cigMachine();return}
  if(typeof canFish=='function'&&canFish()){startFishing();return}
  if(typeof waterAhead=='function'&&has('fishrod')&&ME.equipped!='fishrod'&&waterAhead()){say('Equip your fishing rod first: open the menu (M), choose it in your inventory and press Equip.',4500);return}
  const sg=signAhead();if(sg){say('DANGER! SNOW. NO ACCESS. The road to '+NM[sg.to]+' is buried in drifts.',5000);return}
  const g=typeof gameAhead=='function'&&gameAhead();if(g){openPlay(g);return}
  const n=npcAhead();if(n){talk(n);return}
  if(seatAhead()){sitDown();return}
  const e=exitHere();if(e&&PRESS_DOORS.has(e.to)){useExit(e);return}
  if(!onPlatform())return;const st=tramState(P.m,now);
  if(!st){TRAMS[P.m]={ph:'arrive',t0:now};say('You press the button to call the tram.');return}
  if(st.ph=='arrive'){say('The tram is on its way.');return}
  if(st.ph=='leave'){say('The tram has just left.');return}
  TRIP={from:P.m};TRAMS[P.m]={ph:'wait',t0:now};place('tram',[10,5],1);say('You get on the tram.')}
function openMenu(){MENU=performance.now();stack=[];menu.setAttribute('aria-label','Choose a tram stop');
  menu.innerHTML='<p>Where to?</p>'+TRAM_STOPS.filter(s=>s!=TRIP.from&&isOpen(s)).map(s=>`<button data-to="${s}">${NM[s]}</button>`).join('')+'<button data-to="">Stay on board</button>';
  menu.querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b.dataset.to));menu.hidden=false;menu.querySelector('button').focus()}
const closeMenu=()=>{MENU=0;menu.hidden=true};
// (a click within a moment of opening is the key that opened the menu, not a choice)
function pick(to){if(performance.now()-MENU<250)return;closeMenu();if(to){RIDE={to,t0:performance.now()};delete TRAMS[TRIP.from]}}
function arrive(){const to=RIDE.to;RIDE=TRIP=null;TRAMS[to]={ph:'wait',t0:performance.now()-TRAM_WAIT+2500};place(to,platformSpot(to),0);say('You get off the tram at '+NM[to]+'.')}
function leaveTram(){const from=TRIP.from;TRIP=null;TRAMS[from]={ph:'wait',t0:performance.now()-TRAM_WAIT+3000};place(from,platformSpot(from),0);say('You get off the tram.')}
// ---- Conversations (CONVOS): their portrait and what they say at the top left, your replies along the bottom. Up and down (or
// W and S) choose a reply, E, Space or Enter says it (or press its number, or click it); when it ends, everything closes.
const cvEl=document.getElementById('convo');
function converse(n,c=CONVOS[n.name]){CONVO={n,c,at:c.start,sel:0};stack=[];MSG=null;
  const pc=cvEl.querySelector('canvas'),g=pc.getContext('2d');g.clearRect(0,0,pc.width,pc.height);g.drawImage(portrait(n),0,0);
  cvEl.querySelector('.who').textContent=n.name;cvEl.querySelector('.job').textContent=n.job.replace(/ \(.*\)$/,'');
  // a small badge in the faction's colour with its short name (and the faction's full name on hover)
  const F=FACTIONS[n.faction];cvEl.querySelector('.fac').innerHTML=F?`<i style="background:${F[1]}" title="${esc(F[0])}">${esc(F[2])}</i> ${esc(F[0])}`:'<i class="none" title="Unaligned">&ndash;</i> Unaligned';
  cvEl.hidden=false;renderConvo()}
const replies=()=>CONVO.c.nodes[CONVO.at].opts||[['End the conversation',null]];
function renderConvo(){const nd=CONVO.c.nodes[CONVO.at];
  cvEl.querySelector('.said').innerHTML=`<b>${esc(CONVO.n.name)}</b><p>"${esc(nd.say)}"</p>`;
  cvEl.querySelector('.opts').innerHTML=replies().map(([t],i)=>`<button data-o="${i}" aria-pressed="${i==CONVO.sel}"><span>${i+1}.</span> ${esc(t)}</button>`).join('');
  cvEl.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>reply(+b.dataset.o))}
function reply(i){const o=replies()[i];if(!o)return;if(o[1]==null){endConvo();o[2]?.();return}o[2]?.();CONVO.at=o[1];CONVO.sel=0;renderConvo()}
function endConvo(){const f=CONVO?.c.onEnd;CONVO=null;CONVO_END=performance.now();cvEl.hidden=true;cvEl.classList.remove('call');f?.()}
addEventListener('keydown',e=>{if(!CONVO||e.repeat)return;const k=e.key.length==1?e.key.toLowerCase():e.key,n=replies().length;
  if(k=='ArrowDown'||k=='s')CONVO.sel=(CONVO.sel+1)%n;else if(k=='ArrowUp'||k=='w')CONVO.sel=(CONVO.sel+n-1)%n;
  else if(/^[1-9]$/.test(k)&&+k<=n)reply(+k-1);else if(k=='e'||k==' '||k=='Enter')reply(CONVO.sel);else if(k=='Escape')endConvo();else return;
  if(CONVO)renderConvo();e.preventDefault()});
// with the menu open: up/down (or W/S) move between stops, E picks, Escape closes it (Enter and Space work on buttons anyway)
addEventListener('keydown',e=>{if(!MENU)return;const bs=[...menu.querySelectorAll('button')],i=bs.indexOf(document.activeElement),k=e.key.toLowerCase();
  if(k=='arrowdown'||k=='s')bs[(i+1)%bs.length].focus();else if(k=='arrowup'||k=='w')bs[(i-1+bs.length)%bs.length].focus();
  else if(k=='escape')closeMenu();else if(k=='e')(bs[i]||bs[0]).click();else return;e.preventDefault()});
addEventListener('keydown',e=>{if(e.target.tagName!='SELECT'&&!e.repeat&&!MENU&&(e.key=='e'||e.key=='E'||e.key==' '||e.key=='Enter')){act();e.preventDefault()}});
document.getElementById('act').addEventListener('pointerdown',e=>{e.preventDefault();if(CONVO){reply(CONVO.sel);return}if(MENU){const b=document.activeElement;if(menu.contains(b))b.click()}else act()});
// what the action key would do here, shown above the player
function tramHint(){if(CONVO)return null;if(P.m=='tram')return MENU?null:'Press E to choose a stop';
  if(useAhead()&&!P.mv)return'Press E to '+useAhead()[2].what.replace(/^./,c=>c.toLowerCase());
  if(screenAhead()&&!P.mv)return chuckCalling()?`Press E to answer ${CALLER().name}'s call`:`Press E to call Langley (${CALLER().name})`;
  if(mapAhead()&&!P.mv)return'Press E to look at the map';
  if(computerAhead()&&!P.mv)return'Press E to use the Faction Tracker';
  if(wardrobeAhead()&&!P.mv)return'Press E to open the wardrobe';
  if(mirrorAhead()&&!P.mv)return'Press E to work on your alias';
  if(vendingAhead()&&!P.mv)return'Press E to buy cigarettes';
  if(bedAhead()&&!P.mv)return DAY>=DAYS?'The last day: no time to sleep':NIGHT?'Press E to sleep':'Your bed: sleep once it is night';
  if(signAhead()&&!P.mv)return'Press E to read the sign';
  if(typeof canFish=='function'&&canFish()&&!P.mv)return'Press E to fish';
  if(typeof waterAhead=='function'&&has('fishrod')&&ME.equipped!='fishrod'&&waterAhead()&&!P.mv)return'Equip your fishing rod to fish';
  const ga=typeof gameAhead=='function'&&gameAhead();if(ga&&!P.mv&&!npcAhead())return GAME_HINT[ga];
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
  const it=scene(P.m).iconTop||{};FL[P.m].forEach(([x,y,w,h,c,lb,st])=>{if(lb)tx(c=='e'&&FLAT_BLOCK.test(P.m)?flatLabel(P.m,x,y):lb,(x+w/2)*T-cx,st?Math.min(y*T,it[x+','+y]??1e9)-cy-3:(y+h/2)*T-cy+2,'center',st?'b':'s')});
  EX[P.m].filter(e=>e.s!='O').forEach(e=>{const[ix,iy]=inw(e),s=e.s=='F'?(e.ax>e.x?'L':'R'):e.s,nm=NM[e.to]+(e.s=='F'?' (boat)':'')+(isOpen(e.to)?'':' (closed)'),lb=(s=='R'?'':'\u2192 ')+nm+(s=='R'?' \u2192':'');
    tx(lb,s=='L'?ix*T-cx:s=='R'?(ix+1)*T-cx:(ix+.5)*T-cx,iy*T-cy+10,s=='L'?'left':s=='R'?'right':'center','x')});
  if(L[P.m][3]=='interior')EX[P.m].filter(e=>e.s=='O'&&L[e.to][3]=='interior'&&MAPS[P.m][e.y][e.x]=='m').forEach(e=>tx(NM[e.to],(e.x+.5)*T-cx,e.y*T-cy+(e.y==0?-8:8),'center','x'));
  const hint=tramHint();if(hint)tx(hint,P.rx*T-cx+8,P.ry*T-cy-12,'center','x');
  if(MSG&&t-MSG.t<MSG.d)tx(MSG.s,cv.width/2,cv.height-12,'center','h');
  tx(NM[P.m]+'  ('+P.x+','+P.y+')',3,15,'left','h');drawLabels();
}
// On opening the game, carry on from the most recent save (if there is one). Starting with ?new in the address starts a new game
// instead, as do the addresses that set up the start themselves (?day=, ?night and the proofs of concept).
// ---- Routines: by day everyone is at work, where NPCS places them (night workers the other way round); at night they are at home (their home, and any floors
// joined to it by stairs that have beds), each beside a bed, sharing beds only once every bed has someone (except couples, who share one). No one is put on an
// exit, beside one, or anywhere that would cut off part of the room. Worked out once, when the game starts.
var ROUTINE=null;  // (var: setNight runs before this line on the first load)
// (people who work somewhere open only at night are at home by day instead; EVENING_STAFF stay at work at night too)
function applyRoutine(){if(!ROUTINE)return;NPCS.forEach(n=>Object.assign(n,eveningAt(n,NIGHT)||!atWorkWhen(n,NIGHT)&&ROUTINE.get(n)||n.atWork));
  // (and someone a quest of yours has waiting somewhere, while it's yours: meet)
  for(const q of ME.quests){const w=!q.done&&QUESTS[q.id].meet;if(!w)continue;const n=NPCS.find(p=>p.name==w.name);if(n)Object.assign(n,{m:w.m,x:w.x,y:w.y,dir:w.dir})}}
function planRoutine(){const R=new Map(),taken=new Set(),use={},D4=[[0,1],[0,-1],[-1,0],[1,0]];
  // the tiles of a place that are solid whoever is standing where (walls, furniture, props), worked out once per place
  const G={},grid=m=>G[m]??=MAPS[m].map((row,y)=>[...row].map((t,x)=>SOLID.includes(t)||PROPS.some(p=>{const sp=propSpan(p[3]),x0=p[1]-((sp-1)>>1);return p[0]==m&&x>=x0&&x<x0+sp&&p[2]==y&&!PROP_PASS.includes(p[3])})));
  const free=(m,x,y)=>{const r=grid(m)[y];return!!r&&x>=0&&x<r.length&&!r[x]&&!taken.has(m+','+x+','+y)};
  // the tiles that can be reached from the way in (some rooms have corners no one can ever get to; those don't count)
  const reach=m=>{const ex=EX[m]||[],seen=new Set(ex.map(e=>e.x+','+e.y)),q=ex.map(e=>[e.x,e.y]);
    while(q.length){const[x,y]=q.pop();for(const[dx,dy]of D4){const X=x+dx,Y=y+dy,k=X+','+Y;if(!seen.has(k)&&free(m,X,Y)){seen.add(k);q.push([X,Y])}}}return seen};
  const beds=m=>FL[m].filter(f=>f[4]=='e'),hasBeds=m=>L[m]&&L[m][3]=='interior'&&beds(m).length>0;
  // the floors of someone's home: the home itself and the rooms with beds joined to it by stairs (never your own room)
  const floors=h=>{const out=[h],q=[h];while(q.length){const m=q.shift();(EX[m]||[]).forEach(e=>{if(e.to!=HOME&&!out.includes(e.to)&&hasBeds(e.to)){out.push(e.to);q.push(e.to)}})}return out};
  NPCS.forEach(n=>{n.atWork={m:n.m,x:n.x,y:n.y,dir:n.dir,costume:n.costume}});
  const BED=new Map();  // where each person sleeps: the room and which bed in it
  NPCS.filter(n=>L[n.home]).forEach((n,i)=>{let best=null;const pn=n.partner&&NPCS.find(o=>o.name==n.partner),pb=pn&&BED.get(pn);
    floors(n.home).forEach((m,fi)=>{const ex=EX[m]||[],base=reach(m);
      for(let y=0;y<MAPS[m].length;y++)for(let x=0;x<MAPS[m][y].length;x++){
        if(!free(m,x,y)||!base.has(x+','+y)||ex.some(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<=1))continue;
        let bed=null,dir=0;D4.forEach(([dx,dy],d)=>{if(bed==null&&MAPS[m][y+dy]?.[x+dx]=='e'){bed=beds(m).findIndex(([fx,fy,w,h])=>x+dx>=fx&&x+dx<fx+w&&y+dy>=fy&&y+dy<fy+h);dir=d}});
        const sc=(bed!=null&&bed>=0?(use[m+bed]||0)*2:3)+fi*.1+((x*31+y*17+i*7)%97)/1000-(pb&&pb.m==m&&pb.bed==bed&&bed>=0?10:0);
        if(!best||sc<best.sc){taken.add(m+','+x+','+y);const ok=reach(m).size==base.size-1;taken.delete(m+','+x+','+y);if(ok)best={sc,m,x,y,dir,bed}}}});
    if(!best)return;taken.add(best.m+','+best.x+','+best.y);if(best.bed!=null&&best.bed>=0)use[best.m+best.bed]=(use[best.m+best.bed]||0)+1;
    BED.set(n,{m:best.m,bed:best.bed});R.set(n,{m:best.m,x:best.x,y:best.y,dir:best.dir,costume:undefined})});
  // who sleeps by each bed in the apartment blocks, for the labels on their flats
  BED.forEach((b,n)=>{if(b.bed>=0&&FLAT_BLOCK.test(b.m)){const[fx,fy]=beds(b.m)[b.bed];((FLATS[b.m]??={})[fx+','+fy]??=[]).push(n.name)}});
  return R}
// the apartment blocks' floors, and each flat's residents there by its bed (FLATS[place][bed x,y]); a flat's label names them
var FLATS={};const FLAT_BLOCK=/^(apartments|skyapts|kgapts|eblofts|hsresid)/;
const flatLabel=(m,x,y)=>{const ns=FLATS[m]?.[x+','+y];return!ns?'Empty flat':(ns.length>1?ns.slice(0,-1).join(', ')+' & '+ns.at(-1):ns[0])+"'s flat"};
ROUTINE=planRoutine();applyRoutine();setTimeout(()=>{const t=morningCalls();if(t)say(t.trim(),12000)},1200);
// once the saves are read, the title screen (js/title.js): Continue there loads the most recent save. (A test start, ?new, ?day,
// ?night or a proof of concept, goes straight into the game.) It waits for the page to finish loading, so js/title.js is there.
store.init().then(()=>{const go=()=>{if(!GOTHIC&&!DETAILED&&!MODERN&&!STEAM&&!STEAM2&&!CLASSIC&&!/[?&](new|day|night)\b/.test(location.search))showTitle()};
  if(document.readyState=='complete')go();else addEventListener('load',go)});
// what you're holding, in the top right of the screen: redrawn only when it changes
const hudEq=document.getElementById('hudeq');let hudWas;
function showHeld(){const id=ME.equipped&&has(ME.equipped)?ME.equipped:null,extra=id=='cigarettes'?` <small>${ME.cigsLeft} left in the pack</small>`:'',key=id+extra;if(key===hudWas)return;hudWas=key;hudEq.hidden=!id;
  if(id)hudEq.innerHTML=`<img src="${itemIcon(id)}" alt=""><span><small>${id=='cigarettes'?'Smoking':'Equipped'}</small>${esc(ITEMS[id].name)}${extra}</span>`}
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);if(dayjump.value!=DAY&&document.activeElement!=dayjump)dayjump.value=DAY;showHeld();if(typeof showNeeds=='function')showNeeds();requestAnimationFrame(loop)})(0);
