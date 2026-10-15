// ---- Games: the slot machines and blackjack tables in the casino, and the machines in the arcade. Each opens in the start menu's
// panel (START is 'slots', 'blackjack' or 'arcade'); game.js draws it through PLAYS[START].render and hands it the keys pressed
// (PLAYS[START].key). You gamble with your own money: the Agency would notice its funds going into a slot machine. The arcade
// costs a dollar a game, and keeps your best score on each (ME.hi, saved with the game).
const featAhead=re=>{const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return FL[P.m].find(([fx,fy,w,h,,l])=>l&&re.test(l)&&x>=fx&&x<fx+w&&y>=fy&&y<fy+h)};
// the game on the tile you're facing, if any
function gameAhead(){if(P.m=='casino'){if(featAhead(/^Slot Machines$/))return'slots';if(featAhead(/^Card Table$/))return'blackjack'}
  if(P.m=='arcadein'&&featAhead(/^Arcade Screens$/))return'arcade';
  // a seat in the cinema
  if(P.m=='cinemain'){const[dx,dy]=DIR[P.dir];if(MAPS[P.m][P.y+dy]?.[P.x+dx]=='o')return'film'}return null}
const GAME_HINT={slots:'Press E to play the slot machine',blackjack:'Press E to sit at the blackjack table',arcade:'Press E to play the arcade machines',film:'Press E to watch the film'};
// a card table is also somewhere to sit and wait for the evening
function openPlay(g){if(MENU||RIDE||BUSY)return;
  if(g=='blackjack'){choose('A blackjack table. The dealer is shuffling.',[['Play blackjack',()=>startPlay('blackjack')],...(NIGHT?[]:[['Sit and wait until night',sitDown]]),['Not now']]);return}
  if(g=='film'){choose('Now showing: STORMWING. A ticket is $4.',[['Buy a ticket and watch',watchFilm],['Not now']]);return}
  startPlay(g)}
function startPlay(g){SHOP=null;START=g;stack=[];startEl.hidden=false;PLAYS[g].open?.();renderStart()}
const gameHead=(title,sub)=>`<div class="tabs"><h3 class="shopname">${title} <small>${sub}</small></h3><button class="close" aria-label="Stop playing">&times;</button></div>`;
const wire=()=>{startEl.querySelector('.close').onclick=closeStart;startEl.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{PLAYS[START].act(b.dataset.g);b.blur()})};
const cashLine=()=>`<dl><dt>Personal funds</dt><dd>${money(ME.cash)}</dd></dl>`;

// ---- The slot machine: three reels, a bet of $1 to $25. Three of a kind pays the bet times PAY; two cherries pays double.
const SYM=['cherry','lemon','bell','kelp','bar','seven'],SW=[5,5,3,3,2,1],PAY={seven:50,bar:20,bell:20,kelp:15,lemon:10,cherry:8},BETS=[1,5,10,25];
const SYM_NAME={cherry:'Cherries',lemon:'Lemons',bell:'Bells',kelp:'Kelp Colas',bar:'Bars',seven:'Sevens'};
const spinSym=()=>{let r=Math.random()*SW.reduce((a,b)=>a+b);for(let i=0;i<SYM.length;i++)if((r-=SW[i])<0)return SYM[i];return SYM[0]};
const SL={bet:1,reels:['seven','bar','kelp'],spin:null,win:0,note:'Choose a bet and pull the lever.'};
// a symbol drawn into a 48x48 window at (x,y), on a 16x16 grid of 3px squares
function drawSym(g,s,x,y){const R=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(x+a*3,y+b*3,w*3,h*3)};g.textAlign='center';
  if(s=='cherry'){R('#2e9d57',8,1,1,4);R('#2e9d57',9,1,3,1);R('#2e9d57',6,4,2,1);R('#2e9d57',9,4,2,1);R('#2e9d57',5,5,1,3);R('#2e9d57',10,5,1,3);
    for(const cx of[5,11]){R('#c0392b',cx-2,8,5,5);R('#c0392b',cx-3,9,7,3);R('#f2a0a0',cx-1,9,1,1)}}
  if(s=='lemon'){R('#f2d13a',4,4,8,9);R('#f2d13a',3,5,10,7);R('#f2d13a',2,7,12,3);R('#fff3a0',5,5,3,1);R('#c9a020',13,8,1,1);R('#c9a020',2,8,1,1)}
  if(s=='bell'){R('#8a5a10',7,1,2,1);R('#e0a100',6,2,4,2);R('#e0a100',5,4,6,4);R('#e0a100',4,8,8,3);R('#e0a100',3,11,10,2);R('#ffd23a',6,4,1,6);R('#8a5a10',7,13,2,2)}
  if(s=='kelp'){R('#c0392b',7,1,2,1);R('#2e9d57',7,2,2,4);R('#2e9d57',5,6,6,9);R('#5fc48a',5,6,1,9);R('#f4f4f0',5,9,6,3);R('#c0392b',6,10,4,1)}
  if(s=='bar'){R('#1a1a1e',1,5,14,6);R('#f4f4f0',1,5,14,1);R('#f4f4f0',1,10,14,1);g.fillStyle='#f4f4f0';g.font='bold 13px monospace';g.fillText('BAR',x+24,y+28)}
  if(s=='seven'){g.font='bold 42px monospace';g.fillStyle='#7a1a1a';g.fillText('7',x+26,y+42);g.fillStyle='#e0392b';g.fillText('7',x+24,y+40)}}
function drawSlots(t){const c=startEl.querySelector('#slotc');if(!c)return;const g=c.getContext('2d');g.fillStyle='#2a1020';g.fillRect(0,0,c.width,c.height);
  for(let i=0;i<3;i++){const x=10+i*56,y=8;g.fillStyle='#c9a040';g.fillRect(x-2,y-2,52,52);g.fillStyle='#f4f4f0';g.fillRect(x,y,48,48);
    const spinning=SL.spin&&t<SL.spin.t0+SL.spin.stop[i];g.save();g.beginPath();g.rect(x,y,48,48);g.clip();
    if(spinning){const k=Math.floor(t/55+i*3),off=(t/2.2)%48;drawSym(g,SYM[(k*7+i)%SYM.length],x,y+off-48);drawSym(g,SYM[(k*5+i+2)%SYM.length],x,y+off)}
    else drawSym(g,SL.reels[i],x,y);g.restore();
    g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,y,48,6);g.fillRect(x,y+42,48,6)}
  if(!SL.spin&&SL.win){g.fillStyle='#ff3b2f';g.fillRect(4,31,172,2)}}
function slotLoop(t){if(START!='slots'||!SL.spin)return;drawSlots(t);
  if(t>=SL.spin.t0+SL.spin.stop[2]){const[a,b,c]=SL.reels=SL.spin.res;SL.spin=null;const n=SL.reels.filter(s=>s=='cherry').length;
    SL.win=a==b&&b==c?SL.bet*PAY[a]:n==2?SL.bet*2:0;ME.cash+=SL.win;
    SL.note=SL.win?(a==b&&b==c?`Three ${SYM_NAME[a].toLowerCase()}! You win ${money(SL.win)}.`:`Two cherries: you win ${money(SL.win)}.`):'No luck this time.';renderStart();return}
  requestAnimationFrame(slotLoop)}
const PLAYS={};
PLAYS.slots={
  render(){startEl.innerHTML=gameHead('Slot Machine','Casino')+cashLine()+
    `<div class="gamebox"><div><canvas id="slotc" width="180" height="64"></canvas><p class="note" aria-live="polite">${esc(SL.note)}</p>
      <div class="acts"><span>Bet:</span>${BETS.map(b=>`<button data-g="bet${b}" aria-pressed="${SL.bet==b}"${ME.cash<b?' disabled':''}>${money(b)}</button>`).join('')}</div>
      <div class="acts"><button data-g="spin"${SL.spin||ME.cash<SL.bet?' disabled':''}>Pull the lever <small>(Space)</small></button></div></div>
      <table class="paytable"><caption>Pays (times your bet)</caption><tbody>${SYM.slice().reverse().map(s=>`<tr><td>Three ${SYM_NAME[s].toLowerCase()}</td><td>${PAY[s]}&times;</td></tr>`).join('')}<tr><td>Two cherries</td><td>2&times;</td></tr></tbody></table></div>`;
    wire();drawSlots(performance.now())},
  act(a){if(SL.spin)return;if(a.startsWith('bet')){SL.bet=+a.slice(3);renderStart();return}
    if(a=='spin'){if(ME.cash<SL.bet){SL.note=`You need ${money(SL.bet)} of your own money to play.`;renderStart();return}
      ME.cash-=SL.bet;SL.win=0;SL.note='The reels spin…';SL.spin={t0:performance.now(),stop:[700,1050,1400],res:[spinSym(),spinSym(),spinSym()]};renderStart();requestAnimationFrame(slotLoop)}},
  key(k){if(k==' '||k=='Enter'||k=='e'||k=='E'){this.act('spin');return true}
    const d={ArrowLeft:-1,a:-1,A:-1,ArrowRight:1,d:1,D:1}[k];if(d&&!SL.spin){const i=Math.max(0,Math.min(BETS.length-1,BETS.indexOf(SL.bet)+d));SL.bet=BETS[i];renderStart();return true}return/^Arrow|^[wasd]$/i.test(k)}};

// ---- Blackjack against the house: a fresh deck each hand, the dealer draws to 17, blackjack pays 3 to 2, and you may double
// down on your first two cards.
const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],CHIPS=[5,10,25,50];
const BJ={bet:10,h:null,note:'Place your bet and deal.'};
const handVal=cs=>{let v=0,a=0;for(const c of cs){v+=c.r=='A'?11:/[JQK]/.test(c.r)?10:+c.r;if(c.r=='A')a++}while(v>21&&a){v-=10;a--}return v};
const natural=cs=>cs.length==2&&handVal(cs)==21;
const cardHtml=(c,hide)=>hide?'<span class="card back" aria-label="Face-down card"></span>':`<span class="card${c.s=='♥'||c.s=='♦'?' red':''}">${c.r}<b>${c.s}</b></span>`;
function bjSettle(){const h=BJ.h,p=handVal(h.p),d=handVal(h.d);h.done=true;let back=0,msg;
  if(p>21)msg=`Bust with ${p}. The house takes ${money(h.bet)}.`;
  else if(natural(h.p)&&!natural(h.d)){back=h.bet+Math.floor(h.bet*1.5);msg=`Blackjack! You win ${money(back-h.bet)}.`}
  else if(natural(h.d)&&!natural(h.p))msg=`The dealer has blackjack. You lose ${money(h.bet)}.`;
  else if(d>21){back=h.bet*2;msg=`The dealer busts with ${d}. You win ${money(h.bet)}.`}
  else if(p>d){back=h.bet*2;msg=`${p} beats ${d}. You win ${money(h.bet)}.`}
  else if(p==d){back=h.bet;msg=`${p} each: a push. Your bet comes back.`}
  else msg=`The dealer's ${d} beats your ${p}. You lose ${money(h.bet)}.`;
  ME.cash+=back;BJ.note=msg;renderStart()}
function bjDealer(){const h=BJ.h;if(handVal(h.p)<=21)while(handVal(h.d)<17)h.d.push(h.deck.pop());bjSettle()}
PLAYS.blackjack={
  render(){const h=BJ.h,live=h&&!h.done;
    startEl.innerHTML=gameHead('Blackjack','Casino')+cashLine()+`<div class="felt">
      <div class="bjrow"><span class="bjl">Dealer${h?` <small>${live?'?':handVal(h.d)}</small>`:''}</span><span class="cards">${h?h.d.map((c,i)=>cardHtml(c,live&&i==1)).join(''):''}</span></div>
      <div class="bjrow"><span class="bjl">You${h?` <small>${handVal(h.p)}</small>`:''}</span><span class="cards">${h?h.p.map(c=>cardHtml(c)).join(''):''}</span></div>
      <p class="note" aria-live="polite">${esc(BJ.note)}${h?` <small>(bet ${money(h.bet)})</small>`:''}</p></div>
      <div class="acts">${live?`<button data-g="hit">Hit <small>(H)</small></button><button data-g="stand">Stand <small>(S)</small></button>${h.p.length==2&&ME.cash>=h.bet?'<button data-g="double">Double down <small>(D)</small></button>':''}`
        :`<span>Bet:</span>${CHIPS.map(b=>`<button data-g="bet${b}" aria-pressed="${BJ.bet==b}"${ME.cash<b?' disabled':''}>${money(b)}</button>`).join('')}<button data-g="deal"${ME.cash<BJ.bet?' disabled':''}>Deal <small>(Space)</small></button>`}</div>`;
    wire()},
  act(a){const h=BJ.h,live=h&&!h.done;
    if(!live){if(a.startsWith('bet')){BJ.bet=+a.slice(3);renderStart()}
      if(a=='deal'){if(ME.cash<BJ.bet){BJ.note=`You need ${money(BJ.bet)} of your own money to play.`;renderStart();return}
        const deck=SUITS.flatMap(s=>RANKS.map(r=>({r,s})));for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]]}
        ME.cash-=BJ.bet;BJ.h={deck,bet:BJ.bet,p:[deck.pop(),deck.pop()],d:[deck.pop(),deck.pop()],done:false};BJ.note='Hit or stand?';
        if(natural(BJ.h.p)||natural(BJ.h.d)){bjSettle();return}renderStart()}return}
    if(a=='hit'){h.p.push(h.deck.pop());const v=handVal(h.p);if(v>21)bjSettle();else if(v==21)bjDealer();else renderStart()}
    if(a=='stand')bjDealer();
    if(a=='double'&&h.p.length==2&&ME.cash>=h.bet){ME.cash-=h.bet;h.bet*=2;h.p.push(h.deck.pop());bjDealer()}},
  key(k){const live=BJ.h&&!BJ.h.done,l=k.toLowerCase();
    if(live){const a={h:'hit',s:'stand',d:'double'}[l];if(a){this.act(a);return true}return/^Arrow|^[wa]$/i.test(k)}
    if(k==' '||k=='Enter'||l=='e'){this.act('deal');return true}
    const d={arrowleft:-1,a:-1,arrowright:1,d:1}[l];if(d){const i=Math.max(0,Math.min(CHIPS.length-1,CHIPS.indexOf(BJ.bet)+d));BJ.bet=CHIPS[i];renderStart();return true}return/^Arrow|^[ws]$/i.test(k)}};

// ---- The arcade: three machines, a dollar a game. Snake (steer with the arrows, eat the kelp, don't hit the walls or your own
// tail), Brick Breaker (left and right move the paddle) and Invaders (left and right move, Space fires). 240x160, drawn at 60fps.
const AGAMES=[['snake','Snake','Steer with the arrows. Eat the kelp; don\'t hit the walls or your own tail.'],['bricks','Brick Breaker','Left and right move the paddle. Clear every brick.'],
  ['invaders','Invaders','Left and right move your ship, Space fires. Stop them before they land.']];
const AR={pick:0,st:'menu',g:null,keys:new Set(),score:0,last:0};
const AW=240,AH=160;
const AG={
  snake:{init(s){s.body=[[8,8],[7,8],[6,8]];s.dir=[1,0];s.next=[1,0];s.food=this.food(s);s.t=0;s.every=.12},
    food(s){let f;do f=[Math.random()*24|0,Math.random()*16|0];while(s.body?.some(([x,y])=>x==f[0]&&y==f[1]));return f},
    step(s,dt){const K=AR.keys,d=K.has('left')?[-1,0]:K.has('right')?[1,0]:K.has('up')?[0,-1]:K.has('down')?[0,1]:null;if(d&&(d[0]!=-s.dir[0]||d[1]!=-s.dir[1]))s.next=d;
      if((s.t+=dt)<s.every)return;s.t=0;s.dir=s.next;const[hx,hy]=s.body[0],h=[hx+s.dir[0],hy+s.dir[1]];
      if(h[0]<0||h[1]<0||h[0]>=24||h[1]>=16||s.body.some(([x,y])=>x==h[0]&&y==h[1]))return arcadeOver();
      s.body.unshift(h);if(h[0]==s.food[0]&&h[1]==s.food[1]){AR.score+=10;s.food=this.food(s);s.every=Math.max(.05,s.every*.96)}else s.body.pop()},
    draw(g,s){g.fillStyle='#0b1a10';g.fillRect(0,0,AW,AH);g.fillStyle='#2e9d57';g.fillRect(s.food[0]*10+3,s.food[1]*10+1,4,8);g.fillStyle='#c0392b';g.fillRect(s.food[0]*10+4,s.food[1]*10,2,1);
      s.body.forEach(([x,y],i)=>{g.fillStyle=i?'#9fe870':'#e8ff70';g.fillRect(x*10+1,y*10+1,8,8)})}},
  bricks:{init(s){s.px=102;s.lives=3;s.wave=1;this.wall(s);this.serve(s)},
    wall(s){s.br=[];for(let r=0;r<5;r++)for(let c=0;c<8;c++)s.br.push({x:4+c*29,y:16+r*10,col:['#c0392b','#e0782a','#e0c02a','#2e9d57','#2e86c1'][r],pts:(5-r)*10})},
    serve(s){s.bx=s.px+18;s.by=140;const sp=110+s.wave*15;s.vx=sp*.6*(Math.random()<.5?-1:1);s.vy=-sp*.8;s.wait=.8},
    step(s,dt){const K=AR.keys;s.px=Math.max(0,Math.min(AW-36,s.px+((K.has('right')?1:0)-(K.has('left')?1:0))*170*dt));if(s.wait>0){s.wait-=dt;s.bx=s.px+18;return}
      s.bx+=s.vx*dt;s.by+=s.vy*dt;if(s.bx<2){s.bx=2;s.vx=Math.abs(s.vx)}if(s.bx>AW-2){s.bx=AW-2;s.vx=-Math.abs(s.vx)}if(s.by<2){s.by=2;s.vy=Math.abs(s.vy)}
      if(s.vy>0&&s.by>=146&&s.by<=152&&s.bx>=s.px-2&&s.bx<=s.px+38){s.vy=-Math.abs(s.vy);s.vx=((s.bx-s.px-18)/18)*Math.hypot(s.vx,s.vy)*.75}
      const b=s.br.find(b=>s.bx>=b.x&&s.bx<=b.x+27&&s.by>=b.y&&s.by<=b.y+8);if(b){s.br.splice(s.br.indexOf(b),1);AR.score+=b.pts;s.vy=-s.vy;if(!s.br.length){s.wave++;this.wall(s);this.serve(s)}}
      if(s.by>AH){if(--s.lives<=0)return arcadeOver();this.serve(s)}},
    draw(g,s){g.fillStyle='#10101c';g.fillRect(0,0,AW,AH);s.br.forEach(b=>{g.fillStyle=b.col;g.fillRect(b.x,b.y,27,8);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(b.x,b.y,27,1)});
      g.fillStyle='#e8e8f0';g.fillRect(s.px,148,36,4);g.fillStyle='#ffd23a';g.fillRect(s.bx-2,s.by-2,4,4);for(let i=0;i<s.lives;i++){g.fillStyle='#e8e8f0';g.fillRect(AW-12-i*10,4,7,2)}}},
  invaders:{init(s){s.x=112;s.lives=3;s.wave=0;s.shot=null;s.bombs=[];this.fleet(s)},
    fleet(s){s.al=[];for(let r=0;r<4;r++)for(let c=0;c<8;c++)s.al.push({x:20+c*22,y:18+r*14,r});s.dx=1;s.speed=14+s.wave*6;s.wave++;s.hit=0},
    step(s,dt){const K=AR.keys;s.x=Math.max(4,Math.min(AW-16,s.x+((K.has('right')?1:0)-(K.has('left')?1:0))*120*dt));
      if(K.has('fire')&&!s.shot)s.shot={x:s.x+5,y:142};if(s.shot&&(s.shot.y-=220*dt)<0)s.shot=null;if(s.hit>0)s.hit-=dt;
      const sp=s.speed*(1+(32-s.al.length)/12);let edge=false;s.al.forEach(a=>{a.x+=s.dx*sp*dt;if(a.x<4||a.x>AW-16)edge=true});
      if(edge){s.dx=-s.dx;s.al.forEach(a=>{a.x+=s.dx*2;a.y+=6})}
      if(s.shot){const a=s.al.find(a=>s.shot.x>=a.x-1&&s.shot.x<=a.x+12&&s.shot.y>=a.y&&s.shot.y<=a.y+8);if(a){s.al.splice(s.al.indexOf(a),1);s.shot=null;AR.score+=(4-a.r)*10;if(!s.al.length)this.fleet(s)}}
      if(s.al.length&&Math.random()<dt*(1+s.wave*.5)){const a=s.al[Math.random()*s.al.length|0];s.bombs.push({x:a.x+6,y:a.y+8})}
      s.bombs=s.bombs.filter(b=>(b.y+=80*dt)<AH);const hb=s.bombs.find(b=>b.x>=s.x&&b.x<=s.x+12&&b.y>=144&&b.y<=152);
      if(hb){s.bombs=[];s.hit=1;if(--s.lives<=0)return arcadeOver()}
      if(s.al.some(a=>a.y>=136))return arcadeOver()},
    draw(g,s,t){g.fillStyle='#05050f';g.fillRect(0,0,AW,AH);for(let i=0;i<30;i++){g.fillStyle='#3a3a5a';g.fillRect((i*53)%AW,(i*37)%AH,1,1)}
      const fr=(t/400|0)%2;s.al.forEach(a=>{g.fillStyle=['#ff5fa8','#ff8a3a','#ffd23a','#9fe870'][a.r];g.fillRect(a.x+2,a.y,8,6);g.fillRect(a.x,a.y+2,12,3);g.fillStyle='#05050f';g.fillRect(a.x+3,a.y+2,2,2);g.fillRect(a.x+7,a.y+2,2,2);
        g.fillStyle=['#ff5fa8','#ff8a3a','#ffd23a','#9fe870'][a.r];if(fr){g.fillRect(a.x,a.y+6,2,2);g.fillRect(a.x+10,a.y+6,2,2)}else{g.fillRect(a.x+3,a.y+6,2,2);g.fillRect(a.x+7,a.y+6,2,2)}});
      if(!(s.hit>0&&(t/100|0)%2)){g.fillStyle='#5ab0ff';g.fillRect(s.x,146,12,5);g.fillRect(s.x+5,143,2,3)}
      if(s.shot){g.fillStyle='#f4f4f0';g.fillRect(s.shot.x,s.shot.y,2,5)}g.fillStyle='#ff3b2f';s.bombs.forEach(b=>g.fillRect(b.x,b.y,2,4));
      for(let i=0;i<s.lives;i++){g.fillStyle='#5ab0ff';g.fillRect(AW-14-i*14,4,10,3)}}}};
function arcadeOver(){const id=AGAMES[AR.pick][0],best=ME.hi[id]||0;AR.st='over';AR.best=AR.score>best;if(AR.best)ME.hi[id]=AR.score;renderStart()}
function arcadeLoop(t){if(START!='arcade'||AR.st!='play')return;const dt=Math.min(.05,(t-AR.last)/1000);AR.last=t;const id=AGAMES[AR.pick][0];AG[id].step(AR.g,dt);
  if(AR.st!='play')return;const c=startEl.querySelector('#arcc');if(c){const g=c.getContext('2d');AG[id].draw(g,AR.g,t);g.fillStyle='#f4f4f0';g.font='8px monospace';g.textAlign='left';g.fillText('SCORE '+AR.score,4,AH-3)}
  requestAnimationFrame(arcadeLoop)}
PLAYS.arcade={
  open(){AR.st='menu';AR.keys.clear()},
  render(){const[id,name,how]=AGAMES[AR.pick];let main;
    if(AR.st=='play')main=`<canvas id="arcc" width="${AW}" height="${AH}"></canvas><div class="pad">${[['left','&#9664;'],['up','&#9650;'],['down','&#9660;'],['right','&#9654;'],['fire','Fire']].map(([k,t])=>`<button data-k="${k}" aria-label="${k}">${t}</button>`).join('')}</div>`;
    else main=`<div class="amenu">${AGAMES.map(([gid,n],i)=>`<button data-g="pick${i}" aria-pressed="${i==AR.pick}">${n} <small>best ${ME.hi[gid]||0}</small></button>`).join('')}</div>
      <p class="note" aria-live="polite">${AR.st=='over'?`<b>Game over.</b> You scored ${AR.score}${AR.best?': a new best!':'.'} `:''}${esc(name)}: ${esc(how)}</p>
      <div class="acts"><button data-g="play"${ME.cash<1?' disabled':''}>Insert $1 and play <small>(Space)</small></button></div>`;
    startEl.innerHTML=gameHead('Arcade',AR.st=='play'?name:'a dollar a game')+(AR.st=='play'?'':cashLine())+`<div class="arcade${AR.st=='play'?' playing':''}">${main}</div>`;wire();
    startEl.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{e.preventDefault();AR.keys.add(k)};b.onpointerup=b.onpointerleave=()=>AR.keys.delete(k)});
    if(AR.st=='play'){const g=startEl.querySelector('#arcc').getContext('2d');AG[id].draw(g,AR.g,performance.now())}},
  act(a){if(AR.st=='play')return;if(a.startsWith('pick')){AR.pick=+a.slice(4);AR.st='menu';renderStart();return}
    if(a=='play'){if(ME.cash<1){return}ME.cash-=1;AR.score=0;AR.g={};AG[AGAMES[AR.pick][0]].init(AR.g);AR.st='play';AR.keys.clear();renderStart();AR.last=performance.now();requestAnimationFrame(arcadeLoop)}},
  key(k,e){const K={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',' ':'fire'}[k];
    if(AR.st=='play'){if(K){AR.keys.add(K);return true}return false}
    if(k==' '||k=='Enter'||k=='e'||k=='E'){this.act('play');return true}
    if(K=='up'||K=='left'){AR.pick=(AR.pick+AGAMES.length-1)%AGAMES.length;AR.st='menu';renderStart();return true}
    if(K=='down'||K=='right'){AR.pick=(AR.pick+1)%AGAMES.length;AR.st='menu';renderStart();return true}return false}};
addEventListener('keyup',e=>{const K={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',' ':'fire'}[e.key];if(K)AR.keys.delete(K)});
