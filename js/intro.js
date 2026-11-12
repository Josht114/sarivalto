// ---- Films: short scenes drawn in pixel art as they play, on a canvas the size of the game screen, with a caption along the
// bottom and an engine's hum (through the Music button, like the rest of the music). Skip (or Escape, Space, E or Enter) jumps to
// the end. Each film (CLIPS) has its length, its captions, its hum, how to draw a frame, and what happens when it ends.
//   intro: the opening, played when you start a new game from the title screen (or with ?intro in the address). You drive to
//     work on a summer morning in Virginia, through the woods and in at the gate of CIA Headquarters, park, and walk up to the
//     doors. Then the game begins in the lobby, in front of Joan at the front desk, who starts talking at once.
//   flight: boarding Peggy's seaplane at Langley. Up off the airstrip at dusk, east all night over the sea, and down at dawn
//     on a grey sea off Sarivalto, beside the fishing boat that takes you in (then the game moves on to 1 September, as before).
const introEl=document.getElementById('intro'),introCv=introEl.querySelector('canvas'),introCap=introEl.querySelector('.cap');
const IN={on:false,f:null,t0:0,raf:0,hum:null,cap:'',done:null};
// an engine, low and steady: [two tones (Hz), how bright]
function filmHum(on,spec){const ac=typeof audio=='function'&&audio();if(!ac)return;
  if(on){const[f1,f2,lp]=spec,o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f1;o2.type='square';o2.frequency.value=f2;f.type='lowpass';f.frequency.value=lp;
    g.gain.value=0;g.gain.setTargetAtTime(.07,ac.currentTime,.5);o.connect(f);o2.connect(f);f.connect(g);g.connect(MU.out||ac.destination);o.start();o2.start();IN.hum={o,o2,g}}
  else if(IN.hum){const{o,o2,g}=IN.hum,t=ac.currentTime;IN.hum=null;g.gain.setTargetAtTime(0,t,.4);o.stop(t+2);o2.stop(t+2)}}
const inEase=x=>x<=0?0:x>=1?1:x*x*(3-2*x),inLerp=(a,b,x)=>a+(b-a)*x;
// a sky in bands of colour, top to bottom, down to y
function filmSky(g,cols,y){const h=Math.ceil(y/cols.length);cols.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*h,240,h)})}

// ---- The opening
// the car, side on, driving right: an 80s saloon in maroon, its wheels turning
function introCar(g,x,y,spin,door){const R=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x+a),Math.round(y+b),w,h)};
  R('#5a1a1a',2,6,40,8);R('#7a2a2a',2,6,40,6);R('#7a2a2a',10,0,20,7);R('#9fc6e0',12,1,7,5);R('#9fc6e0',21,1,7,5);R('#5a1a1a',19,1,2,6);
  R('#c8ccd0',0,10,3,2);R('#c8ccd0',41,10,3,2);R('#ffe08a',41,7,2,2);R('#c0392b',1,7,2,2);
  if(door)R('#5a1a1a',19,1,10,11);
  for(const wx of[9,33]){R('#1a1a1e',wx-4,10,9,7);R('#8a9098',wx-2,12,5,3);g.fillStyle='#1a1a1e';const a=spin%2<1;g.fillRect(Math.round(x+wx)-(a?2:0),Math.round(y+13),a?5:1,1);g.fillRect(Math.round(x+wx),Math.round(y+13)-(a?0:2),1,a?1:5)}}
// trees: a pine or a round leafy one
function introTree(g,x,y,k,c1,c2){g.fillStyle='#4a3020';g.fillRect(Math.round(x)+5,y+14,2,6);
  if(k%2){g.fillStyle=c1;for(let r=0;r<4;r++)g.fillRect(Math.round(x)+5-r*1.5,y+r*4,2+r*3,4)}else{g.fillStyle=c1;g.fillRect(Math.round(x)+1,y+3,10,10);g.fillRect(Math.round(x)+3,y+1,6,14);g.fillStyle=c2;g.fillRect(Math.round(x)+2,y+4,4,4)}}
function introSky(g){const bands=['#7fb6e0','#93c3e6','#aacfe6','#c4dae0','#e2dcc4','#f2d6a6'];bands.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*13,240,13)});g.fillStyle='#fff3c8';g.fillRect(186,40,12,12);g.fillStyle='#fffbe8';g.fillRect(188,42,8,8)}
// the drive (and the gate): woods scrolling past at their own speeds, the road, the car
function introRoad(g,dist,t){introSky(g);
  g.fillStyle='#5f8a6a';for(let i=0;i<9;i++){const x=((i*40-dist*.1)%360+360)%360-60;g.fillRect(x,64,44,14);g.fillRect(x+8,58,28,8)}
  for(let i=0;i<14;i++){const x=((i*22-dist*.35)%308+308)%308-34;introTree(g,x,62+(i%3)*2,i,'#3a6a3a','#5a8a4a')}
  g.fillStyle='#6aa04a';g.fillRect(0,84,240,22);g.fillStyle='#5a5a60';g.fillRect(0,106,240,26);g.fillStyle='#3a3a40';g.fillRect(0,106,240,2);g.fillRect(0,130,240,2);
  g.fillStyle='#f2d13a';for(let i=0;i<10;i++){const x=((i*30-dist)%300+300)%300-30;g.fillRect(x,118,14,2)}
  g.fillStyle='#4a8a3a';g.fillRect(0,132,240,28);
  for(let i=0;i<10;i++){const x=((i*36-dist*1.6)%360+360)%360-30;g.fillStyle='#8a6a4a';g.fillRect(x,136,3,16);g.fillStyle='#6a4a2a';g.fillRect(x-14,140,30,2)}}
// the car park in front of headquarters: the long pale building, its flags and doors
function introLot(g){introSky(g);g.fillStyle='#4a7a4a';g.fillRect(0,58,240,12);
  g.fillStyle='#d8d4c8';g.fillRect(20,30,200,52);g.fillStyle='#c4c0b4';g.fillRect(20,30,200,4);g.fillStyle='#b0aca0';g.fillRect(96,22,48,60);
  g.fillStyle='#4a5a6a';for(let r=0;r<4;r++)for(let c=0;c<16;c++){const x=26+c*12;if(x>92&&x<146)continue;g.fillRect(x,38+r*11,6,6)}
  for(let r=0;r<5;r++)for(let c=0;c<3;c++)g.fillRect(102+c*14,28+r*9,8,5);
  g.fillStyle='#2a3a4a';g.fillRect(110,66,20,16);g.fillStyle='#8a9aa8';g.fillRect(119,66,2,16);
  for(const fx of[86,154]){g.fillStyle='#8a8a90';g.fillRect(fx,16,1,66);g.fillStyle='#c0392b';g.fillRect(fx+1,16,10,7);g.fillStyle='#2a4aa8';g.fillRect(fx+1,16,4,4)}
  g.fillStyle='#8a8a90';g.fillRect(0,82,240,78);g.fillStyle='#f4f4f0';for(let i=0;i<9;i++)g.fillRect(14+i*26,112,2,16);g.fillStyle='#a0a0a8';g.fillRect(108,82,24,30)}
function introDraw(g,t){
  if(t<12){// driving, then slowing for the gate at 7.5 to 9.5, the barrier up, and away
    const slow=t<7.5?0:t<9.6?inEase((t-7.5)/2.1):1,dist=t<7.5?t*90:7.5*90+inLerp(0,95,slow);introRoad(g,dist,t);
    let cx=96;if(t>10.4)cx=96+Math.pow(t-10.4,2)*40;
    if(t>7.5){// the guard's booth and the barrier, coming in from the right and stopping beside the car
      const bx=inLerp(260,150,inEase((t-7.5)/2.1));g.fillStyle='#e8e4d8';g.fillRect(bx,82,22,26);g.fillStyle='#9fc6e0';g.fillRect(bx+3,86,16,8);g.fillStyle='#5a5a60';g.fillRect(bx,80,22,3);
      g.fillStyle='#222';g.fillRect(bx+8,88,6,6);const up=t<9.7?0:Math.min(1,(t-9.7)/.7);g.save();g.translate(bx-2,104);g.rotate(-up*Math.PI/2.2);g.fillStyle='#f4f4f0';g.fillRect(-36,-2,36,3);g.fillStyle='#c0392b';for(let i=0;i<4;i++)g.fillRect(-34+i*9,-2,4,3);g.restore()}
    introCar(g,cx,100+(t*7%1<.5?0:1),t*(t<9.6?8:t>10.4?6:0),false)}
  else{// the car park: in from the left, park, out of the car, up to the doors
    introLot(g);const k=Math.min(1,(t-12)/2.6),cx=inLerp(-50,150,1-Math.pow(1-k,3)),door=t>15&&t<17.2;introCar(g,cx,96,t<14.6?t*6:0,door);
    if(t>15.2){const w=Math.min(1,(t-15.4)/1.8),px=inLerp(cx+20,114,w),py=inLerp(100,82,w),walk=w>0&&w<1,fr=walk?Math.floor(t*6)%2:0;
      const sp=lookChar(walk?1:0,fr,ME.look);g.drawImage(sp,Math.round(px),Math.round(py-16),12,15)}}}

// ---- The flight
// Peggy's seaplane, side on, flying right: a high wing, two floats, the propeller turning, a light blinking on the wingtip
function seaplane(g,x,y,ang,t){g.save();g.translate(Math.round(x),Math.round(y));g.rotate(ang);const R=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(a,b,w,h)};
  R('#e8e4d8',-16,-4,30,7);R('#c0392b',-16,0,30,2);R('#e8e4d8',-20,-6,6,4);R('#c0392b',-22,-10,4,6);R('#9fc6e0',4,-3,6,3);
  R('#d8d4c8',-8,-8,24,2);R('#8a8a90',-2,-6,1,4);R('#8a8a90',8,-6,1,4);
  R('#8a8a90',-8,3,1,4);R('#8a8a90',6,3,1,4);R('#f4f4f0',-12,7,24,2);R('#c8ccd0',10,6,4,2);
  R('#3a3a40',14,-2,2,3);const p=Math.floor(t*30)%2;R('#c8ccd0',16,p?-6:-2,1,p?11:4);
  if(Math.floor(t*2)%2)R('#ff3b2f',15,-9,2,2);g.restore()}
// waves on a sea: short pale dashes drifting past
function filmSea(g,y,col,dash,dist){g.fillStyle=col;g.fillRect(0,y,240,160-y);g.fillStyle=dash;for(let r=0;r<6;r++)for(let i=0;i<9;i++){const x=((i*34+r*17-dist*(.5+r*.2))%306+306)%306-30;g.fillRect(x,y+4+r*9,8+r*2,1)}}
// a little island on the horizon: dark hills, snowy tops, the volcano smoking
function filmIsland(g,x,y){g.fillStyle='#4a5560';g.fillRect(x,y-6,70,6);g.fillRect(x+8,y-12,22,6);g.fillRect(x+36,y-16,20,10);g.fillRect(x+42,y-22,8,6);
  g.fillStyle='#e8eef2';g.fillRect(x+10,y-12,8,2);g.fillRect(x+40,y-16,6,2);g.fillRect(x+42,y-22,8,2);g.fillStyle='#b8c0c8';g.fillRect(x+45,y-28,3,5);g.fillRect(x+47,y-33,4,5)}
// the fishing boat that meets the plane: a dark red hull, a white wheelhouse, a mast
function fishingBoat(g,x,y,t){const b=Math.sin(t*2)>0?0:1,R=(c,a,c2,w,h)=>{g.fillStyle=c;g.fillRect(x+a,y+c2+b,w,h)};
  R('#7a2a2a',0,0,30,5);R('#5a1a1a',2,5,26,2);R('#e8e4d8',16,-7,9,7);R('#2a3a4a',18,-5,3,2);R('#4a3020',8,-16,1,16);R('#4a3020',4,-12,10,1);R('#ffd23a',23,-9,2,2)}
function flightDraw(g,t){
  if(t<5.5){// the airstrip at dusk: rolling, lifting off, climbing away to the east
    filmSky(g,['#2a3060','#4a3a70','#8a4a7a','#d06a6a','#f09a6a','#f6c88a'],84);
    g.fillStyle='#1a2a1a';for(let i=0;i<16;i++){const x=i*16;g.fillRect(x,78-(i%3)*3,16,8)}
    g.fillStyle='#2a2a30';g.fillRect(6,58,40,24);g.fillStyle='#ffd23a';for(let i=0;i<4;i++)g.fillRect(10+i*9,64,4,3);
    g.fillStyle='#3a4a3a';g.fillRect(0,84,240,76);g.fillStyle='#4a4a50';g.fillRect(0,104,240,20);g.fillStyle='#e8e4d8';for(let i=0;i<10;i++)g.fillRect(i*26+4,113,12,2);
    for(let i=0;i<12;i++){g.fillStyle=Math.floor(t*4+i)%3?'#ffd23a':'#ff8a3a';g.fillRect(i*22+2,102,2,2);g.fillRect(i*22+2,125,2,2)}
    const roll=Math.min(t,2.6),x=30+roll*roll*16+(t>2.6?(t-2.6)*80:0),lift=t>2.6?Math.pow(t-2.6,1.6)*18:0;seaplane(g,x,100-lift,t>2.6?-.18:0,t)}
  else if(t<11.5){// night over the sea: the moon and stars, clouds and dark water slipping past
    const s=t-5.5;filmSky(g,['#06081a','#0a1030','#101a40','#1a2650','#22305a'],100);
    for(let i=0;i<40;i++){const x=(i*53)%240,y=(i*29)%90;g.fillStyle=(i+Math.floor(t*3))%7?'#c8d0e8':'#ffffff';g.fillRect(x,y,1,1)}
    g.fillStyle='#e8e4c8';g.fillRect(190,16,12,12);g.fillStyle='#0a1030';g.fillRect(194,16,8,9);
    filmSea(g,100,'#0a1a2e','#2a4a6a',s*60);
    g.fillStyle='#3a4466';for(let i=0;i<5;i++){const x=((i*70-s*30)%350+350)%350-50;g.fillRect(x,40+(i%2)*14,40,5);g.fillRect(x+8,36+(i%2)*14,22,4)}
    seaplane(g,110,68+Math.sin(t*1.5)*2,0,t)}
  else{// dawn off Sarivalto: the island on the horizon, the boat waiting, down onto the water and in beside it
    const s=t-11.5;filmSky(g,['#8a9aaa','#a6b2bc','#c4c6c4','#ddd2c0','#ecd8b8'],92);g.fillStyle='#f6e2b8';g.fillRect(40,78,14,8);
    filmIsland(g,150,92);const k=Math.min(1,s/4.6),land=s>4.6,slow=land?Math.min(1,(s-4.6)/1.8):0;
    filmSea(g,92,'#4a5a66','#8a9aa6',land?(4.6*40+inLerp(0,30,inEase(slow))):s*40);fishingBoat(g,176,112,t);
    const x=inLerp(-20,120,inEase(k))+(land?inLerp(0,26,inEase(slow)):0),y=inLerp(54,114,inEase(k));seaplane(g,x,y,land?0:.12,t);
    if(land&&s<5.6){g.fillStyle='#e8eef2';for(let i=0;i<6;i++)g.fillRect(x-14-i*4,118-((i*3+Math.floor(s*20))%5),2,2)}}}

// ---- the films, and playing one
const CLIPS={
  intro:{len:19,hum:[52,26,220],draw:introDraw,
    caps:[[0,3.6,'22 August, 198-. Langley, Virginia.'],[3.8,7.4,'Your first morning back. A new assignment, they said. They didn\'t say where.'],
      [7.8,12,'The guard at the gate knows your car, and waves you through. Same faces, same bad coffee. It\'s good to be back.'],[12.4,17.6,'CIA Headquarters.']],
    // into the lobby, in front of the front desk, and Joan starts talking
    done(){place('langley',[17,9],1);const joan=NPCS.find(n=>n.name=='Joan');if(joan&&joan.m==P.m)setTimeout(()=>{if(!CONVO&&!START)talk(joan)},350)}},
  flight:{len:19,hum:[96,48,700],draw:flightDraw,
    caps:[[0,5.2,'Langley airstrip, at dusk. Peggy opens the throttle, and the little seaplane climbs out over Virginia.'],
      [5.8,11.2,'Then east, all night, over dark water. Peggy hums along to the radio. You try to sleep.'],
      [11.8,17.6,'Dawn, 1 September. A grey sea off Sarivalto, and a fishing boat waiting.']]}};
function clipFrame(t){const f=IN.f,g=introCv.getContext('2d');g.imageSmoothingEnabled=false;f.draw(g,t);
  // fade in at the start, out at the end
  const fade=t<.8?1-t/.8:t>f.len-1.4?Math.min(1,(t-(f.len-1.4))/1.2):0;if(fade>0){g.fillStyle=`rgba(0,0,0,${fade})`;g.fillRect(0,0,240,160)}
  const cap=f.caps.find(([a,b])=>t>=a&&t<b)?.[2]||'';if(cap!=IN.cap){IN.cap=cap;introCap.textContent=cap;introCap.hidden=!cap}}
function clipLoop(now){if(!IN.on)return;const t=(now-IN.t0)/1000;if(t>=IN.f.len){endFilm();return}clipFrame(t);IN.raf=requestAnimationFrame(clipLoop)}
// play a film; done (if given) runs when it ends or is skipped, after the film's own ending
function playFilm(name,done){IN.f=CLIPS[name];IN.done=done||null;IN.on=true;IN.cap='';BUSY=true;stack=[];introEl.hidden=false;introEl.setAttribute('aria-label',name=='intro'?'Opening':'Flight');
  filmHum(true,IN.f.hum);IN.t0=performance.now();clipFrame(0);IN.raf=requestAnimationFrame(clipLoop);introEl.querySelector('.skip').focus()}
function endFilm(){if(!IN.on)return;IN.on=false;cancelAnimationFrame(IN.raf);filmHum(false);introEl.hidden=true;BUSY=false;IN.f.done?.();const d=IN.done;IN.done=null;d?.()}
const playIntro=()=>playFilm('intro');
introEl.querySelector('.skip').onclick=endFilm;
addEventListener('keydown',e=>{if(!IN.on)return;if(['Escape',' ','Enter','e','E'].includes(e.key))endFilm();e.preventDefault();e.stopImmediatePropagation()},true);
// ?intro in the address plays the opening on a test start too
if(/[?&]intro\b/.test(location.search)&&DAY<1)setTimeout(playIntro,300);
