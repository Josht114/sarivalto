// ---- Picking a lock. A quest condition with pick: a place (Flat Cola: the electronics store in Frostholm, shut at night) is met by
// walking into that place's shut door with your lock picks and picking it. It opens in the start menu's panel (START 'lockpick'):
// the lock has five pins; for each, a needle swings across the tension bar, and you lift the pin (Space, E or the button) while the
// needle is in the green. Each pin's green is narrower and the needle quicker; lift at the wrong moment and the pick slips and every
// pin drops again. Set all five and the lock opens: the condition is met, and the door stays open while the quest is yours.
const LP={q:null,i:0,to:'',raf:false,pins:0,zone:[.4,.6],t0:0,speed:1,note:'',open:false,slips:0};
const LP_PINS=5;
// a new green for the pin you're on: narrower, and the needle quicker, the further in you are
function lpZone(){const w=.26-LP.pins*.035,a=.1+Math.random()*(.8-w);LP.zone=[a,a+w];LP.speed=.9+LP.pins*.22;LP.t0=performance.now()}
// where the needle is, 0 to 1, swinging back and forth
const lpNeedle=t=>{const p=((t-LP.t0)/1000*LP.speed)%2;return p<1?p:2-p};
// the shut door you're walking into, if a quest of yours has you pick its lock
const pickAt=to=>openConds().find(([,,c])=>c.pick==to);
// a place whose lock you've picked, while the quest is still yours: its door stays open
const picked=id=>ME.quests.some(q=>!q.done&&QUESTS[q.id].done.some((c,i)=>c.pick==id&&q.met[i]));
function startPick([q,i]){if(!has('lockpicks')){say("The door's locked. You'd need your lock picks.",3500);return}
  Object.assign(LP,{q,i,to:QUESTS[q.id].done[i].pick,pins:0,open:false,slips:0,note:'Lift each pin while the needle is in the green.'});lpZone();startPlay('lockpick')}
function lpLift(){if(LP.open)return;const n=lpNeedle(performance.now());
  if(n>=LP.zone[0]&&n<=LP.zone[1]){LP.pins++;
    if(LP.pins>=LP_PINS){LP.open=true;LP.note='The last pin sets, the plug turns, and the lock clicks open.';renderStart();
      setTimeout(()=>{if(START=='lockpick')closeStart();meet(LP.q,LP.i)},1100);return}
    LP.note=`Pin ${LP.pins} sets with a click.`;lpZone()}
  else{LP.pins=0;LP.slips++;LP.note='The pick slips, and the pins drop. Start again.';lpZone()}
  renderStart()}
function drawLock(t){const c=startEl.querySelector('#lockc');if(!c)return;const g=c.getContext('2d'),W=c.width,R=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  R('#1a1a1e',0,0,W,c.height);
  // the lock body, the plug (with the shear line along its top) and the five pins
  R('#8a8f96',10,8,W-20,58);R('#b8bcc2',10,8,W-20,3);R('#c9a040',18,40,W-36,20);R('#3a3a40',18,39,W-36,1);
  for(let k=0;k<LP_PINS;k++){const x=30+k*((W-60)/(LP_PINS-1))-5,set=k<LP.pins||LP.open,cur=k==LP.pins&&!LP.open,up=set?8:0;
    R('#2a2a30',x-1,10,12,40);                       // the pin's hole
    R('#6a6e74',x+3,12,4,6);                          // the spring
    R('#9aa0a8',x,18-up,10,14);                       // the driver pin
    R(set?'#ffd23a':'#d8b050',x,32-up,10,10);         // the key pin
    if(cur){R('#9fe870',x,62,10,2)}}
  // the tension bar, its green and the needle
  const bx=14,bw=W-28,by=74;R('#3a3a40',bx,by,bw,12);R('#2e9d57',bx+LP.zone[0]*bw,by,(LP.zone[1]-LP.zone[0])*bw,12);
  if(!LP.open){const n=lpNeedle(t);R('#f4f4f0',bx+n*bw-1,by-3,3,18)}}
function lockLoop(t){if(START!='lockpick'||LP.open){LP.raf=false;return}drawLock(t);requestAnimationFrame(lockLoop)}
PLAYS.lockpick={
  render(){startEl.innerHTML=gameHead('Picking the Lock',NM[LP.to]||'')+
    `<div class="gamebox"><div><canvas id="lockc" width="220" height="96"></canvas><p class="note" aria-live="polite">${esc(LP.note)}</p>
      <div class="acts"><button data-g="lift"${LP.open?' disabled':''}>Lift the pin <small>(Space)</small></button></div></div>
      <p>Pins set: ${LP.open?LP_PINS:LP.pins} of ${LP_PINS}.${LP.slips?` <small>(Slipped ${LP.slips} time${LP.slips>1?'s':''}.)</small>`:''}<br><small>Escape to give up.</small></p></div>`;
    wire();drawLock(performance.now());if(!LP.raf&&!LP.open){LP.raf=true;requestAnimationFrame(lockLoop)}},
  act(a){if(a=='lift')lpLift()},
  key(k){if(k==' '||k=='Enter'||k=='e'||k=='E'){lpLift();return true}return/^Arrow|^[wasd]$/i.test(k)}};
