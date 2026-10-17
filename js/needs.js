// ---- Needs: hunger and nicotine, each a meter from 0 (empty) to 100 (full), shown on the game screen; and alcohol, the other way
// round, from 0 (sober) up to 100 as you drink (ALCOHOL in data.js). All three run down slowly while you play (not while a menu,
// a conversation or a game is open), and a chunk more when time passes (waiting for the evening; a night's sleep sobers you up).
// Eating fills hunger (FOOD in data.js: a meal more than a bun); smoking a cigarette fills nicotine. A pack holds twenty
// (ME.cigsLeft counts down the one you've opened); equipped, you smoke them one after another as you go. When hunger or nicotine
// runs low you're told so now and then. Saved with the game.
const NEED_DRAIN={hunger:100/480,nicotine:100/360};  // per second of play: hunger empties in eight minutes, nicotine in six
const NEED_LOW=20,NEED_SAY={hunger:"Your stomach growls. You need something to eat.",nicotine:"You're craving a cigarette."};
const SOBER=100/300;  // how fast drink wears off, per second of play: from blind drunk to sober in five minutes
const DRUNK_AT=60;  // over this the alcohol bar goes red
// smoking as you go (cigarettes equipped): one cigarette lasts this many seconds of play, giving SMOKE_NIC nicotine over that time
const SMOKE_EACH=25,SMOKE_NIC=45;
let needNag=0;
function needsTick(dt){for(const k in NEED_DRAIN)ME[k]=Math.max(0,ME[k]-NEED_DRAIN[k]*dt);ME.alcohol=Math.max(0,ME.alcohol-SOBER*dt);
  // smoking as you go: nicotine all the while, and a cigarette gone every SMOKE_EACH seconds
  if(ME.equipped=='cigarettes'){if(!has('cigarettes')){ME.equipped=null;say('You\'re out of cigarettes.',3500)}
    else{ME.nicotine=Math.min(100,ME.nicotine+SMOKE_NIC/SMOKE_EACH*dt);if((ME.smokeT=(ME.smokeT||0)+dt)>=SMOKE_EACH){ME.smokeT=0;ME.cigsLeft=(ME.cigsLeft||20)-1;
      if(ME.cigsLeft<=0){take('cigarettes');ME.cigsLeft=20;if(!has('cigarettes')){ME.equipped=null;say('You stub out your last cigarette. The pack is empty, and you have no more.',4500)}else say('You crumple the empty pack and open another.',3500)}}}}
  // a reminder when something's low, every half a minute or so (and not over another message)
  if((needNag-=dt)<=0){const low=Object.keys(NEED_DRAIN).find(k=>ME[k]<NEED_LOW);if(low&&!MSG){say(NEED_SAY[low]+(ME[low]<=0?' Badly.':''),4000);needNag=30}else needNag=5}}
// time passing in a moment (sitting until evening, sleeping): the meters drop by this much
function needsPass(h,n,a){ME.hunger=Math.max(0,ME.hunger-h);ME.nicotine=Math.max(0,ME.nicotine-n);ME.alcohol=Math.max(0,ME.alcohol-a)}
function eat(id){const f=FOOD[id]||0,a=ALCOHOL[id]||0;ME.hunger=Math.min(100,ME.hunger+f);const was=ME.alcohol;ME.alcohol=Math.min(100,ME.alcohol+a);
  // a word when the drink takes hold
  const drunk=a&&was<DRUNK_AT&&ME.alcohol>=DRUNK_AT?' The room tilts a little. You\'re drunk.':a&&was<30&&ME.alcohol>=30?' You feel warm and tipsy.':a&&ME.alcohol>=100?' You can barely stand.':'';
  return(f>=40?' That filled you up.':f>=20?' That hit the spot.':'')+drunk}
// smoking: one cigarette from the open pack, a new pack opened when it's empty
function smoke(){if(!has('cigarettes'))return'You have no cigarettes.';ME.cigsLeft=(ME.cigsLeft||20)-1;ME.nicotine=Math.min(100,ME.nicotine+45);
  const left=ME.cigsLeft;if(left<=0){take('cigarettes');ME.cigsLeft=20;return'You light up your last cigarette from the pack and crumple it.'}
  return`You light a cigarette and breathe out slowly. ${left} left in the pack.`}
// the meters on the screen: three bars under what you're holding; hunger and nicotine red when low, alcohol red when high
const needsEl=document.getElementById('needs');
function showNeeds(){const bar=(k,label)=>{const v=Math.round(ME[k]),low=v<NEED_LOW;return`<div class="need${low?' low':''}"><span>${label}</span><i><b style="width:${v}%"></b></i></div>`};
  const v=Math.round(ME.alcohol),drunk=v>=DRUNK_AT;const html=bar('hunger','Hunger')+bar('nicotine','Nicotine')+`<div class="need alc${drunk?' low':''}"><span>Alcohol</span><i><b style="width:${v}%"></b></i></div>`;if(needsEl.innerHTML!=html)needsEl.innerHTML=html}
