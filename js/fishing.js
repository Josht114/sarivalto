// ---- Fishing. With a fishing rod in your hand (equipped from the inventory), face any water (the sea, the lake, the river) and press E, or use the rod's Fish
// action. It opens in the start-menu panel (START 'fishing'): cast (E, Space or Enter), wait for the float to dip and strike in
// time, then reel in: hold E (or Space) to push the green zone right, let go and it drifts back left; keep the fish inside it
// and the catch bar fills, let it slip and the bar drains; full, it's yours, empty, it's gone. What bites depends on the water
// (sea fish at the coast and the harbours, freshwater fish inland; FISH in data.js) and the time of day; the rarer the fish, the
// smaller the zone and the harder it fights. Olga at the fish shop buys your catch. 240x135, drawn each frame while it's open.
const FW_=240,FH_=135,FS={st:'cast',t:0,last:0,hold:false,fish:null,pos:.5,vel:0,zone:.5,prog:.35,note:''};
// the water you're facing, if any: 'sea' or 'fresh'
function waterAhead(){const[dx,dy]=DIR[P.dir],t=MAPS[P.m][P.y+dy]?.[P.x+dx];if(t!='~')return null;return['harbour','sand','deck'].includes(L[P.m][3])?'sea':'fresh'}
const canFish=()=>ME.equipped=='fishrod'&&!!has('fishrod')&&!!waterAhead();
// what bites: by the water, and more of some fish at night
function pickFish(where){const pool=Object.entries(FISH).filter(([,f])=>f.where==where||f.where=='any'),w=pool.map(([,f])=>NIGHT&&f.night?f.night:f.w);let r=Math.random()*w.reduce((a,b)=>a+b);
  for(let i=0;i<pool.length;i++)if((r-=w[i])<0)return pool[i][0];return pool[0][0]}
function startFishing(){if(MENU||RIDE||BUSY||CONVO)return;FS.where=waterAhead();if(!FS.where)return;Object.assign(FS,{st:'cast',fish:null,note:'Press E to cast.'});SHOP=null;START='fishing';stack=[];startEl.hidden=false;renderStart();
  FS.last=performance.now();requestAnimationFrame(fishLoop)}
function fishStep(dt){FS.t+=dt;
  if(FS.st=='wait'&&FS.t>=FS.biteAt){FS.st='bite';FS.t=0;FS.note='The float dips! Strike!'}
  else if(FS.st=='bite'&&FS.t>.9){FS.st='cast';FS.note='Too slow: it took the bait and got away. Press E to cast again.';renderStart()}
  else if(FS.st=='reel'){const f=FISH[FS.fish],hard=1-f.zone*2;
    // the fish darts about, harder the rarer it is
    if(Math.random()<dt*(1.2+hard*3))FS.vel=(Math.random()-.5)*(1.2+hard*2.4);FS.pos=Math.max(.04,Math.min(.96,FS.pos+FS.vel*dt));if(FS.pos<=.04||FS.pos>=.96)FS.vel=-FS.vel;
    FS.zone=Math.max(f.zone/2,Math.min(1-f.zone/2,FS.zone+(FS.hold?.95:-.8)*dt));
    FS.prog+=(Math.abs(FS.pos-FS.zone)<=f.zone/2?.32:-.24)*dt;
    if(FS.prog>=1)landFish();else if(FS.prog<=0){FS.st='cast';FS.note=`The line goes slack. The ${f.name.toLowerCase()} got away. Press E to cast again.`;renderStart()}}}
function landFish(){const f=FISH[FS.fish],mine=has(FS.fish);if(mine)mine.n++;else ME.items.push({id:FS.fish,n:1});FS.st='caught';
  FS.note=f.junk?`You reel in... ${f.name.toLowerCase()=='old boot'?'an old boot':'a '+f.name.toLowerCase()}. Press E to cast again.`:`You land ${/^[AEIOU]/.test(f.name)?'an':'a'} ${f.name.toLowerCase()}! Olga pays ${money(f.price)} for one. Press E to cast again.`;renderStart()}
// E, Space or Enter: cast, strike, or (held) reel
function fishPress(){if(FS.st=='cast'||FS.st=='caught'){FS.st='wait';FS.t=0;FS.biteAt=1.5+Math.random()*4;FS.note='Wait for the float to dip...';renderStart()}
  else if(FS.st=='wait'){FS.st='cast';FS.note='Too soon: you pulled the hook clean out of the water. Press E to cast again.';renderStart()}
  else if(FS.st=='bite'){FS.st='reel';FS.fish=pickFish(FS.where);Object.assign(FS,{pos:.5,vel:0,zone:.5,prog:.35,t:0});FS.note='Hold E to keep the fish in the green!';renderStart()}}
function fishLoop(now){if(START!='fishing')return;const dt=Math.min(.05,(now-FS.last)/1000);FS.last=now;fishStep(dt);fishDraw(now/1000);requestAnimationFrame(fishLoop)}
// the picture: the sky (by day or night), the far shore, the water, your rod and line, the float; and when reeling, the struggle bar
function fishDraw(s){const c=startEl.querySelector('#fishc');if(!c)return;const g=c.getContext('2d'),sea=FS.where=='sea';
  let gr=g.createLinearGradient(0,0,0,60);gr.addColorStop(0,NIGHT?'#0a1028':'#7ab0d8');gr.addColorStop(1,NIGHT?'#24305a':'#d8ecf4');g.fillStyle=gr;g.fillRect(0,0,FW_,60);
  if(NIGHT)for(let i=0;i<30;i++){g.fillStyle='#fff';g.fillRect((i*53)%FW_,(i*29)%50,1,1)}
  g.fillStyle=sea?'#5a6a78':'#3a5a3a';g.beginPath();g.moveTo(0,60);for(let x=0;x<=FW_;x+=20)g.lineTo(x,52-Math.abs(Math.sin(x/37))*8);g.lineTo(FW_,60);g.fill();
  g.fillStyle=SNOW;for(let x=0;x<=FW_;x+=40){g.beginPath();g.moveTo(x+6,48);g.lineTo(x+12,43);g.lineTo(x+18,48);g.fill()}
  gr=g.createLinearGradient(0,60,0,FH_);gr.addColorStop(0,sea?(NIGHT?'#1a3050':'#3a7aa8'):(NIGHT?'#1a3a3a':'#3a7a7a'));gr.addColorStop(1,sea?'#0e2a44':'#0e3030');g.fillStyle=gr;g.fillRect(0,60,FW_,FH_-60);
  for(let i=0;i<16;i++){const y=64+(i*7)%66,x=((i*61+s*(8+i%3*4))%(FW_+40))-20;g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x,y,10+i%4*3,1)}
  // the rod from the bottom left, and the line out to the float
  const fx=150,fy=78,bite=FS.st=='bite',dip=bite?3+Math.sin(s*30)*1.5:FS.st=='wait'?Math.sin(s*2.4)*1:0,out=FS.st!='cast'&&FS.st!='caught';
  g.strokeStyle='#5a3a22';g.lineWidth=3;g.beginPath();g.moveTo(0,FH_);g.lineTo(70,52);g.stroke();g.strokeStyle='#c9a040';g.lineWidth=1;g.beginPath();g.moveTo(14,123);g.lineTo(20,118);g.stroke();
  if(out){g.strokeStyle='rgba(240,240,240,.8)';g.lineWidth=.6;g.beginPath();g.moveTo(70,52);g.quadraticCurveTo(110,60,fx,fy+dip);g.stroke();
    if(FS.st=='reel'){g.fillStyle='rgba(255,255,255,.5)';for(let k=0;k<3;k++){g.beginPath();g.arc(fx+Math.sin(s*9+k)*6,fy+2,3+k*2+Math.sin(s*7)*1,0,7);g.fill()}}
    else{g.fillStyle='#c0392b';g.fillRect(fx-2,fy-4+dip,4,4);g.fillStyle='#f4f4f0';g.fillRect(fx-2,fy+dip,4,3);g.fillStyle='#2a2a33';g.fillRect(fx,fy-7+dip,1,3);
      if(bite){g.strokeStyle='rgba(255,255,255,.6)';for(let k=1;k<3;k++){g.beginPath();g.ellipse(fx,fy+4,4+k*4+(s*20%4),1.5+k,0,0,7);g.stroke()}}}}
  // the struggle: the fish (a silver flash) and your green zone along the bar, the catch bar on the right
  if(FS.st=='reel'){const f=FISH[FS.fish],bx=12,bw=196,by=112;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(bx-2,by-4,bw+4,16);
    g.fillStyle=FS.hold?'#5fe08a':'#3aa860';g.fillRect(bx+(FS.zone-f.zone/2)*bw,by-2,f.zone*bw,12);
    const px=bx+FS.pos*bw;g.fillStyle='#e8eef4';g.beginPath();g.ellipse(px,by+4,5,3,0,0,7);g.fill();g.beginPath();g.moveTo(px-5,by+4);g.lineTo(px-9,by+1);g.lineTo(px-9,by+7);g.fill();g.fillStyle='#14061e';g.fillRect(px+2,by+3,1,1);
    g.fillStyle='rgba(0,0,0,.55)';g.fillRect(222,40,10,80);g.fillStyle=FS.prog>.66?'#5fe08a':FS.prog>.33?'#ffd23a':'#ff5a3a';g.fillRect(224,42+76*(1-FS.prog),6,76*FS.prog)}
  if(FS.st=='caught'&&FS.fish){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(70,72,100,34);g.font='bold 10px sans-serif';g.textAlign='center';g.fillStyle='#ffd23a';g.fillText(FISH[FS.fish].name,120,88);
    g.font='8px sans-serif';g.fillStyle='#fff';g.fillText(FISH[FS.fish].junk?'Not worth a penny':'Worth '+money(FISH[FS.fish].price),120,100)}}
PLAYS.fishing={
  render(){const caught=ME.items.filter(i=>FISH[i.id]&&!FISH[i.id].junk).reduce((a,i)=>a+i.n,0);
    startEl.innerHTML=gameHead('Fishing',FS.where=='sea'?'sea fishing':'freshwater fishing')+`<div class="fishing"><canvas id="fishc" width="${FW_}" height="${FH_}"></canvas></div>
      <p class="note" aria-live="polite">${esc(FS.note)}</p><p class="note"><small>In your bag: ${caught} fish. Olga at the fish shop buys them. Escape stops fishing.</small></p>`;wire();fishDraw(performance.now()/1000)},
  act(){},
  key(k){if(k==' '||k=='Enter'||k=='e'||k=='E'){if(FS.st=='reel')FS.hold=true;else fishPress();return true}return/^Arrow|^[wasd]$/i.test(k)}};
addEventListener('keyup',e=>{if(START=='fishing'&&(e.key==' '||e.key=='Enter'||e.key=='e'||e.key=='E'))FS.hold=false});
// ---- Selling your catch to Olga: she pays the price of each fish (junk she leaves you to throw away yourself)
function sellCatch(){const fish=ME.items.filter(i=>FISH[i.id]&&!FISH[i.id].junk);if(!fish.length){say("\"You've no fish for me, dear.\"",3000);return}
  const n=fish.reduce((a,i)=>a+i.n,0),pay=fish.reduce((a,i)=>a+i.n*FISH[i.id].price,0);ME.items=ME.items.filter(i=>!fish.includes(i));ME.cash+=pay;say(`Olga buys your ${n} fish for ${money(pay)}.`,4000)}
