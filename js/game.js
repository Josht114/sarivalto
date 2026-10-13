const T=16,VW=15,VH=10;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');cv.width=VW*T;cv.height=VH*T;
const hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+1,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};


// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
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
sel.onchange=()=>{const id=sel.value;closeMenu();RIDE=TRIP=null;go(id);sel.blur()};
const SOLID='#TR~vbkWecuxygitno';
// tramAt: a tram covers this tile (its track row or the row behind it that its body rises over)
const tramAt=(m,x,y)=>tramsOn(m,performance.now()).some(q=>(q.y==y||q.y-1==y)&&x*16+16>q.x+3&&x*16<q.x+93);
const solid=(m,x,y)=>{const t=MAPS[m][y]?.[x];return !t||SOLID.includes(t)||NPCS.some(n=>n.m==m&&n.x==x&&n.y==y)||
  PROPS.some(p=>{const sp=propSpan(p[3]),x0=p[1]-((sp-1)>>1);return p[0]==m&&x>=x0&&x<x0+sp&&p[2]==y&&!PROP_PASS.includes(p[3])})||tramAt(m,x,y)};
const press=d=>{if(!stack.includes(d))stack.push(d)},release=d=>{stack=stack.filter(k=>k!==d)};
addEventListener('keydown',e=>{if(e.target==sel||MENU||RIDE)return;const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY){press(KEY[k]);e.preventDefault()}});
addEventListener('keyup',e=>{const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY)release(KEY[k])});
document.querySelectorAll('#pad button[data-d]').forEach(b=>{const d=+b.dataset.d;
  b.addEventListener('pointerdown',e=>{e.preventDefault();press(d)});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>release(d)))});
// the exit (map edge, door or boat berth) the player is standing on, if any, and taking it
const exitHere=()=>EX[P.m].find(e=>e.x==P.x&&e.y==P.y);
function useExit(e){const b=EX[e.to].find(q=>q.to==P.m);P.m=e.to;[P.x,P.y]=inw(b);P.rx=P.x;P.ry=P.y;showHere(P.m)}
function update(dt){
  if(RIDE){if(performance.now()-RIDE.t0>RIDE_DUR)arrive();return}if(MENU)return;
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
let MSG=null,MENU=0,RIDE=null,TRIP=null;const RIDE_DUR=2800,say=(s,d=3000)=>{MSG={s,t:performance.now(),d}},menu=document.getElementById('menu');
// ---- Talking: the person on the tile the player is facing, and what they say (a placeholder line for everyone for now)
const npcAhead=()=>{const[dx,dy]=DIR[P.dir];return NPCS.find(n=>n.m==P.m&&n.x==P.x+dx&&n.y==P.y+dy)};
const line=n=>`"My name is ${n.name}. I work at ${NM[n.loc]||'nowhere in particular'}. I like ${n.faction=='none'?'no faction in particular':FACTIONS[n.faction][0]}."`;
function talk(n){n.dir=P.dir^1;say(line(n),6000)}
const onPlatform=()=>TRAM_STOPS.includes(P.m)&&MAPS[P.m][P.y][P.x]=='P';
const place=(m,[x,y],dir)=>{P.m=m;P.x=x;P.y=y;P.rx=x;P.ry=y;P.mv=null;P.dir=dir;showHere(m)};
// where to put someone getting off: the free platform tile (in front of the track) nearest the tram's door, or failing that
// the ground just in front of the platform
function platformSpot(m){const tr=scene(m).trams.find(q=>q.plat),door=(tr.stop+48)/16,w=MAPS[m][0].length,c=[];
  // (a little further along is better than right above the shelter, whose roof would hide the player)
  for(const y of[tr.y+1,tr.y+2])for(let x=0;x<w;x++)if(!solid(m,x,y))c.push([x,y,Math.abs(x+.5-door)+(y==tr.y+1?0:3)+(MAPS[m][y][x]=='P'?0:2)+(MAPS[m][y+1]?.[x]=='#'?4:0)]);
  const[x,y]=c.sort((a,b)=>a[2]-b[2])[0];return[x,y]}
function act(){if(P.mv||MENU||RIDE)return;const now=performance.now();
  if(P.m=='tram'){openMenu();return}
  const n=npcAhead();if(n){talk(n);return}
  const e=exitHere();if(e&&PRESS_DOORS.has(e.to)){useExit(e);return}
  if(!onPlatform())return;const st=tramState(P.m,now);
  if(!st){TRAMS[P.m]={ph:'arrive',t0:now};say('You press the button to call the tram.');return}
  if(st.ph=='arrive'){say('The tram is on its way.');return}
  if(st.ph=='leave'){say('The tram has just left.');return}
  TRIP={from:P.m};TRAMS[P.m]={ph:'wait',t0:now};place('tram',[10,5],1);say('You get on the tram.')}
function openMenu(){MENU=performance.now();stack=[];
  menu.innerHTML='<p>Where to?</p>'+TRAM_STOPS.filter(s=>s!=TRIP.from).map(s=>`<button data-to="${s}">${NM[s]}</button>`).join('')+'<button data-to="">Stay on board</button>';
  menu.querySelectorAll('button').forEach(b=>b.onclick=()=>pick(b.dataset.to));menu.hidden=false;menu.querySelector('button').focus()}
const closeMenu=()=>{MENU=0;menu.hidden=true};
// (a click within a moment of opening is the key that opened the menu, not a choice)
function pick(to){if(performance.now()-MENU<250)return;closeMenu();if(to){RIDE={to,t0:performance.now()};delete TRAMS[TRIP.from]}}
function arrive(){const to=RIDE.to;RIDE=TRIP=null;TRAMS[to]={ph:'wait',t0:performance.now()-TRAM_WAIT+2500};place(to,platformSpot(to),0);say('You get off the tram at '+NM[to]+'.')}
function leaveTram(){const from=TRIP.from;TRIP=null;TRAMS[from]={ph:'wait',t0:performance.now()-TRAM_WAIT+3000};place(from,platformSpot(from),0);say('You get off the tram.')}
// with the menu open: up/down (or W/S) move between stops, E picks, Escape closes it (Enter and Space work on buttons anyway)
addEventListener('keydown',e=>{if(!MENU)return;const bs=[...menu.querySelectorAll('button')],i=bs.indexOf(document.activeElement),k=e.key.toLowerCase();
  if(k=='arrowdown'||k=='s')bs[(i+1)%bs.length].focus();else if(k=='arrowup'||k=='w')bs[(i-1+bs.length)%bs.length].focus();
  else if(k=='escape')closeMenu();else if(k=='e')(bs[i]||bs[0]).click();else return;e.preventDefault()});
addEventListener('keydown',e=>{if(e.target!=sel&&!e.repeat&&!MENU&&(e.key=='e'||e.key=='E'||e.key==' '||e.key=='Enter')){act();e.preventDefault()}});
document.getElementById('act').addEventListener('pointerdown',e=>{e.preventDefault();if(MENU){const b=document.activeElement;if(menu.contains(b))b.click()}else act()});
// what the action key would do here, shown above the player
function tramHint(){if(P.m=='tram')return MENU?null:'Press E to choose a stop';
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
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);requestAnimationFrame(loop)})(0);
