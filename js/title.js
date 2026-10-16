// ---- The title screen, shown when the game opens: a pixel-art picture (img/title.png, made with tools/make-title.html) of a dirty-blond man with a moustache
// in a white suit and sunglasses, with a Kelp Cola, a hot dog and a cigarette, under a neon-pink sky on the island. Continue
// loads your most recent save, New game starts afresh (22 August, at Langley), Load game opens the saves. The game waits behind
// it (BUSY) until you choose. Skipped when the address asks for a test start (?new, ?day, ?night and the proofs of concept).
const titleEl=document.getElementById('title');
let TITLE=false;
function showTitle(){const hasSave=SAVES.some(i=>readSave(i));titleEl.querySelector('[data-t="cont"]').hidden=!hasSave;TITLE=true;BUSY=true;stack=[];titleEl.hidden=false;
  titleEl.querySelector('button:not([hidden])').focus()}
function hideTitle(){TITLE=false;BUSY=false;titleEl.hidden=true}
titleEl.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const k=b.dataset.t;hideTitle();
  if(k=='cont'){const i=SAVES.filter(i=>readSave(i)).sort((a,b)=>readSave(b).at-readSave(a).at)[0];if(i!=null)loadGame(i)}
  if(k=='new')say(DAY<1?'22 August. CIA Headquarters, Langley, Virginia.':'A new game begins.',5000);
  if(k=='load')openStart('save')});
// on the title screen, the arrows (or WASD) choose, and E, Space or Enter picks (F still goes full screen)
addEventListener('keydown',e=>{if(!TITLE)return;const k=e.key.length==1?e.key.toLowerCase():e.key,bs=[...titleEl.querySelectorAll('button:not([hidden])')],i=bs.indexOf(document.activeElement);
  if(k=='f')return;
  if(k=='ArrowDown'||k=='s'||k=='ArrowRight'||k=='d')bs[(i+1)%bs.length].focus();else if(k=='ArrowUp'||k=='w'||k=='ArrowLeft'||k=='a')bs[(i-1+bs.length)%bs.length].focus();else if(k=='e'||k==' '||k=='Enter')(bs[i]||bs[0]).click();
  e.preventDefault();e.stopImmediatePropagation()},true);
