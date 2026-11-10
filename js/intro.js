// ---- The opening: a short film played when you start a new game from the title screen (or with ?intro in the address). You
// drive to work on a summer morning in Virginia, through the woods and in at the gate of CIA Headquarters, park, and walk up to
// the doors. Then the game begins in the lobby, in front of Joan at the front desk, who starts talking at once. Drawn in pixel art
// as it plays, on a canvas the size of the game screen; Skip (or Escape, Space, E or Enter) jumps straight to the lobby.
const introEl=document.getElementById('intro'),introCv=introEl.querySelector('canvas'),introCap=introEl.querySelector('.cap');
const IN={on:false,t0:0,raf:0,hum:null,cap:''};
const INTRO_LEN=19;
// what's said along the bottom, and when (seconds)
const INTRO_CAPS=[[0,3.6,'22 August, 198-. Langley, Virginia.'],[3.8,7.4,'Your first morning back. A new assignment, they said. They didn\'t say where.'],
  [7.8,12,'The guard at the gate knows your car. He doesn\'t know your name. Nobody here does.'],[12.4,17.6,'CIA Headquarters.']];
// a car's engine, low and steady, while you drive (through the Music button, like the rest of the music)
function introHum(on){const ac=typeof audio=='function'&&audio();if(!ac)return;
  if(on){const o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=52;o2.type='square';o2.frequency.value=26;f.type='lowpass';f.frequency.value=220;
    g.gain.value=0;g.gain.setTargetAtTime(.07,ac.currentTime,.5);o.connect(f);o2.connect(f);f.connect(g);g.connect(MU.out||ac.destination);o.start();o2.start();IN.hum={o,o2,g}}
  else if(IN.hum){const{o,o2,g}=IN.hum,t=ac.currentTime;IN.hum=null;g.gain.setTargetAtTime(0,t,.4);o.stop(t+2);o2.stop(t+2)}}
const inEase=x=>x<=0?0:x>=1?1:x*x*(3-2*x),inLerp=(a,b,x)=>a+(b-a)*x;
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
// one frame of the film at time t (seconds)
function introFrame(t){const g=introCv.getContext('2d');g.imageSmoothingEnabled=false;
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
      const sp=lookChar(walk?1:0,fr,ME.look);g.drawImage(sp,Math.round(px),Math.round(py-16),12,15)}}
  // fade in at the start, out at the end
  const fade=t<.8?1-t/.8:t>INTRO_LEN-1.4?Math.min(1,(t-(INTRO_LEN-1.4))/1.2):0;if(fade>0){g.fillStyle=`rgba(0,0,0,${fade})`;g.fillRect(0,0,240,160)}
  const cap=INTRO_CAPS.find(([a,b])=>t>=a&&t<b)?.[2]||'';if(cap!=IN.cap){IN.cap=cap;introCap.textContent=cap;introCap.hidden=!cap}}
function introLoop(now){if(!IN.on)return;const t=(now-IN.t0)/1000;if(t>=INTRO_LEN){endIntro();return}introFrame(t);IN.raf=requestAnimationFrame(introLoop)}
function playIntro(){IN.on=true;IN.cap='';BUSY=true;stack=[];introEl.hidden=false;introHum(true);IN.t0=performance.now();introFrame(0);IN.raf=requestAnimationFrame(introLoop);
  introEl.querySelector('.skip').focus()}
// the end (or Skip): into the lobby, in front of the front desk, and Joan starts talking
function endIntro(){if(!IN.on)return;IN.on=false;cancelAnimationFrame(IN.raf);introHum(false);introEl.hidden=true;BUSY=false;
  place('langley',[17,9],1);const joan=NPCS.find(n=>n.name=='Joan');if(joan&&joan.m==P.m)setTimeout(()=>{if(!CONVO&&!START)talk(joan)},350)}
introEl.querySelector('.skip').onclick=endIntro;
addEventListener('keydown',e=>{if(!IN.on)return;if(['Escape',' ','Enter','e','E'].includes(e.key))endIntro();e.preventDefault();e.stopImmediatePropagation()},true);
// ?intro in the address plays it on a test start too
if(/[?&]intro\b/.test(location.search)&&DAY<1)setTimeout(playIntro,300);
