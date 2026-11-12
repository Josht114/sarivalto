// ---- Tuning the radio: calling Langley on the Radio Equipment in your room. Turn the dial along the band (left and right; hold
// Shift for big steps) until the static clears and Langley's carrier comes through clean, then hold it there for a moment and the
// call connects. Hekki has marked the frequency on the dial in red pencil, roughly. Langley moves its frequency every day.
// A quest condition can open it (use: 'Radio Equipment', play: 'radiotune': Chuck's "report in on the radio set"); otherwise
// it's how you call Langley (and it flashes INCOMING CALL when someone there has something for you): Chuck by day, George by night.
const RT={q:null,i:0,then:null,dial:.5,target:.6,mark:.6,hold:0,last:0,ok:false,note:'',raf:false,snd:null};
const RT_LO=3,RT_HI=12,RT_HOLD=1.2;
// how clear the signal is, from 0 (only static) to 1 (right on Langley's frequency); and whether it's close enough to hold
const rtSig=()=>Math.max(0,1-Math.abs(RT.dial-RT.target)/.07);
const rtOn=()=>Math.abs(RT.dial-RT.target)<.012;
const rtMHz=v=>(RT_LO+v*(RT_HI-RT_LO)).toFixed(2);
// start tuning; then: what happens once the call connects
function rtBegin(then,q=null,i=0){const r=rng(DAY*7919+13);
  RT.target=.12+r()*.76;RT.mark=RT.target+(r()-.5)*.05;
  RT.dial=Math.max(0,Math.min(1,RT.target>.5?RT.target-.3-r()*.15:RT.target+.3+r()*.15));
  Object.assign(RT,{q,i,then,hold:0,last:performance.now(),ok:false,note:"Turn the dial until the static clears, then hold it there. Hekki's red pencil mark is close."});startPlay('radiotune')}
function rtTurn(by){if(RT.ok)return;RT.dial=Math.max(0,Math.min(1,RT.dial+by));renderStart()}
// the sound in the headphones: static that fades as you tune in, and Langley's carrier tone that grows
function rtSound(s){const ac=typeof audio=='function'&&audio();if(!ac||ac.state!='running')return;
  if(!RT.snd){const n=ac.createBufferSource(),f=ac.createBiquadFilter(),ng=ac.createGain(),o=ac.createOscillator(),og=ac.createGain();
    n.buffer=noiseBuf(ac,2,false);n.loop=true;f.type='bandpass';f.frequency.value=2200;f.Q.value=.7;ng.gain.value=0;o.frequency.value=660;og.gain.value=0;
    n.connect(f);f.connect(ng);ng.connect(MU.master||ac.destination);o.connect(og);og.connect(MU.master||ac.destination);n.start();o.start();RT.snd={n,o,ng,og}}
  const t=ac.currentTime;RT.snd.ng.gain.setTargetAtTime((1-s)*.05+.004,t,.05);RT.snd.og.gain.setTargetAtTime(s*s*.035,t,.05)}
function rtQuiet(){if(!RT.snd)return;const{n,o,ng,og}=RT.snd;RT.snd=null;try{ng.gain.value=0;og.gain.value=0;n.stop();o.stop()}catch(e){}}
function drawRadio(t){const c=startEl.querySelector('#radioc');if(!c)return;const g=c.getContext('2d'),W=c.width,H=c.height,s=RT.ok?1:rtSig(),R=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x|0,y|0,w,h)};
  R('#2a2018',0,0,W,H);
  // the dial: the band from 3 to 12 MHz, Hekki's red pencil mark, and the needle
  const bx=12,bw=W-24;R('#e8dcb8',bx-4,6,bw+8,30);g.fillStyle='#3a3020';g.font='8px monospace';g.textAlign='center';
  for(let m=RT_LO;m<=RT_HI;m++){const x=bx+(m-RT_LO)/(RT_HI-RT_LO)*bw;R('#3a3020',x,8,1,6);g.fillText(m,x,24)}
  for(let k=0;k<=36;k++)R('#7a6a50',bx+k/36*bw,8,1,3);
  const mx=bx+RT.mark*bw;R('rgba(200,40,30,.75)',mx-3,27,7,2);R('rgba(200,40,30,.6)',mx-1,25,3,1);
  R('#c0392b',bx+RT.dial*bw-1,6,2,30);
  // the scope: a scribble of static, and a clean wave as the signal comes through
  const sy=44,sh=34,mid=sy+sh/2;R('#0c1a10',bx-4,sy,bw+8,sh);g.strokeStyle='#7fe08a';g.lineWidth=1;g.beginPath();
  for(let x=0;x<=bw;x+=2){const n=(Math.random()*2-1)*(1-s)*13,w=Math.sin(x*.32+t*.012)*s*11;x?g.lineTo(bx+x,mid+n+w):g.moveTo(bx+x,mid+n+w)}g.stroke();
  // the signal meter, and how long you've held it
  R('#3a3020',bx-4,84,bw+8,8);R(rtOn()||RT.ok?'#2e9d57':'#c9a040',bx-3,85,(bw+6)*s,6);
  R('#3a3020',bx-4,96,bw+8,4);R('#ffd23a',bx-3,97,(bw+6)*Math.min(1,RT.ok?1:RT.hold/RT_HOLD),2)}
function rtLoop(t){if(START!='radiotune'||RT.ok){rtQuiet();RT.raf=false;return}
  const dt=Math.min(.1,(t-RT.last)/1000);RT.last=t;
  if(rtOn()){RT.hold+=dt;if(RT.hold>=RT_HOLD){RT.ok=true;RT.note='The carrier steadies, and a voice comes through the static: "Langley. Go ahead."';rtQuiet();renderStart();
    setTimeout(()=>{if(START=='radiotune')closeStart();RT.then?.()},1100);return}}
  else RT.hold=Math.max(0,RT.hold-dt*2);
  rtSound(rtSig());drawRadio(t);requestAnimationFrame(rtLoop)}
PLAYS.radiotune={
  // from a quest condition: connecting meets it
  begin(q,i){rtBegin(()=>meet(q,i),q,i)},
  render(){startEl.innerHTML=gameHead('Tuning the Radio','Calling Langley')+
    `<div class="gamebox"><div><canvas id="radioc" width="240" height="104"></canvas><p class="note" aria-live="polite">${esc(RT.note)}</p>
      <div class="acts"><button data-g="l5"${RT.ok?' disabled':''}>&laquo;</button><button data-g="l1"${RT.ok?' disabled':''}>&lsaquo; Down</button><button data-g="r1"${RT.ok?' disabled':''}>Up &rsaquo;</button><button data-g="r5"${RT.ok?' disabled':''}>&raquo;</button></div>
      <p>The dial reads <b>${rtMHz(RT.dial)} MHz</b>.<br><small>Left and right arrows turn the dial (hold Shift to turn it faster). Escape to hang up.</small></p></div></div>`;
    wire();drawRadio(performance.now());if(!RT.raf&&!RT.ok){RT.raf=true;RT.last=performance.now();requestAnimationFrame(rtLoop)}},
  act(a){rtTurn((a[0]=='l'?-1:1)*(a.slice(1)=='5'?.05:.004))},
  key(k,e){const n=e?.shiftKey?.03:.004;
    if(k=='ArrowLeft'||k=='a'||k=='A'){rtTurn(-n);return true}if(k=='ArrowRight'||k=='d'||k=='D'){rtTurn(n);return true}return/^Arrow|^[ws ]$/i.test(k)}};
// the radio set in your room, when it isn't a quest's: a call to Langley over the air (Chuck by day, George by night)
const radioAhead=()=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return(P.m==HOME||P.m=='hekki_room')&&FL[P.m].some(([fx,fy,w,h,,l])=>l=='Radio Equipment'&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
function radioCall(){const n=CALLER();if(!n)return;
  const c=questTalk(n)||{start:'a',nodes:{a:{say:n.name=='Chuck'?"(Chuck's voice, thin through the static.) NIGHTJAR, Langley. Nothing new for you right now. Keep your head down and your eyes open. Over.":"(George, faint and crackling.) NIGHTJAR. George. Nothing tonight. When there's a job that needs doing after dark, I'll call. Over."}}};
  converse(n,c);cvEl.classList.add('radio')}
