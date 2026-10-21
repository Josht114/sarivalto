// ---- Poker: Texas hold'em at fixed limits against three players, at the card table in the pizzeria's back room (the Syndicate's
// game, $1/$2) and the poker table in the casino ($2/$4). You play with your own money: your bets come straight out of it and
// your winnings go straight back in. Opens in the start-menu panel (START 'poker'); X folds (F is full screen), C checks or calls, R bets or raises,
// Space deals the next hand, Escape leaves (anything already in the pot stays there).
// Each hand: blinds, two cards each, then betting before the flop, on the flop, the turn and the river (bets of one big blind on
// the first two rounds and two on the last two, at most four bets a round); the best five cards of seven win. (A player all in
// for less still plays for the whole pot: there are no side pots.) At the showdown each hand turned up is named, and the five
// cards that won (in the winner's hand and on the table) are outlined in gold.
// The other players weigh up their hand by dealing out the rest of the hand at random a couple of hundred times, then bet, call
// or fold by how often they'd win against what it costs, with a bluff now and then; each has a temper of their own.
const POKER_AT={
  pizzeria_in:{title:'Backroom Poker',sb:1,bb:2,stack:80,who:['Paolo','Nico','Lucia'],intro:'The Syndicate\'s card game in the back room. Texas hold\'em, $1/$2.'},
  casino:{title:'Casino Poker',sb:2,bb:4,stack:200,who:['Greta','Sid','Vince'],intro:'A poker table at the casino. Texas hold\'em, $2/$4.'}};
const PK={at:null,h:null,seats:[],note:'',timer:0};
// ---- hand values: every hand of five is a number, bigger is better (its kind, then the cards that settle ties)
const RV={2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14},HAND_NAMES=['High card','Pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
function eval5(cs){const v=cs.map(c=>RV[c.r]).sort((a,b)=>b-a),fl=cs.every(c=>c.s==cs[0].s),cnt={};v.forEach(x=>cnt[x]=(cnt[x]||0)+1);
  const g=Object.entries(cnt).map(([r,n])=>[n,+r]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);let st=0;
  if(g.length==5){if(v[0]-v[4]==4)st=v[0];else if(v[0]==14&&v[1]==5)st=5}
  const[cat,ks]=st&&fl?[8,[st]]:g[0][0]==4?[7,[g[0][1],g[1][1]]]:g[0][0]==3&&g[1][0]==2?[6,[g[0][1],g[1][1]]]:fl?[5,v]:st?[4,[st]]:
    g[0][0]==3?[3,g.map(x=>x[1])]:g[0][0]==2&&g[1][0]==2?[2,g.map(x=>x[1])]:g[0][0]==2?[1,g.map(x=>x[1])]:[0,v];
  let s=cat;for(let i=0;i<5;i++)s=s*15+(ks[i]||0);return s}
const COMBOS={};const combos=n=>COMBOS[n]??=(()=>{const out=[];const rec=(st,a)=>{if(a.length==5){out.push(a);return}for(let i=st;i<n;i++)rec(i+1,[...a,i])};rec(0,[]);return out})();
const bestOf=cs=>combos(cs.length).reduce((b,ix)=>Math.max(b,eval5(ix.map(i=>cs[i]))),0),
  // the five cards that make the best hand
  bestFive=cs=>combos(cs.length).reduce((b,ix)=>{const v=eval5(ix.map(i=>cs[i]));return v>b[0]?[v,ix.map(i=>cs[i])]:b},[-1,[]])[1],handName=s=>HAND_NAMES[Math.floor(s/15**5)];
// a hand described in full, so two hands of the same kind can be told apart: "two pair, kings and sevens", "straight, nine high"
const RANK_NAME={2:['two','twos'],3:['three','threes'],4:['four','fours'],5:['five','fives'],6:['six','sixes'],7:['seven','sevens'],8:['eight','eights'],9:['nine','nines'],10:['ten','tens'],11:['jack','jacks'],12:['queen','queens'],13:['king','kings'],14:['ace','aces']};
function handDesc(v){const cat=Math.floor(v/15**5),k=[4,3,2,1,0].map(i=>Math.floor(v/15**i)%15),one=r=>RANK_NAME[r]?.[0],many=r=>RANK_NAME[r]?.[1];
  return[`high card, ${one(k[0])}`,`a pair of ${many(k[0])}`,`two pair, ${many(k[0])} and ${many(k[1])}`,`three ${many(k[0])}`,`a straight, ${one(k[0])} high`,`a flush, ${one(k[0])} high`,
    `a full house, ${many(k[0])} over ${many(k[1])}`,`four ${many(k[0])}`,k[0]==14?'a royal flush':`a straight flush, ${one(k[0])} high`][cat]}
// how often a hand wins against so many others, dealing out the rest at random
function equity(hole,board,opp,sims=180){const used=new Set([...hole,...board].map(c=>c.r+c.s)),rest=SUITS.flatMap(s=>RANKS.map(r=>({r,s}))).filter(c=>!used.has(c.r+c.s));let win=0;
  for(let k=0;k<sims;k++){const d=rest.slice();for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}let p=0;const b=[...board,...d.slice(p,p+=5-board.length)],me=bestOf([...hole,...b]);
    let best=true,tie=0;for(let o=0;o<opp;o++){const v=bestOf([d[p++],d[p++],...b]);if(v>me){best=false;break}if(v==me)tie++}if(best)win+=1/(tie+1)}return win/sims}
// ---- the table
const chipsOf=p=>p.me?ME.cash:p.chips,addChips=(p,n)=>{if(p.me)ME.cash+=n;else p.chips+=n};
function sitDownPoker(){const T=POKER_AT[P.m];if(ME.cash<T.bb*2){say(`You need at least ${money(T.bb*2)} of your own money to sit in.`,4000);return}
  PK.at=P.m;PK.h=null;PK.note='You take a seat. Press Space to deal.';
  const who=P.m=='pizzeria_in'&&typeof openConds=='function'&&openConds().some(([,,c])=>c.event=='pokerdon')?['Gustavo','Paolo','Nico']:T.who;
  PK.seats=[{name:'You',me:true},...who.map((nm,i)=>{const n=NPCS.find(x=>x.name==nm)||{name:nm,body:'#5a5f68',hair:'#3a2a20'};
    return{name:nm,chips:T.stack,pic:portrait(n).toDataURL(),temper:[.0,.06,-.05][i]}})];PK.dealer=Math.floor(Math.random()*4);startPlay('poker')}
const inHand=()=>PK.seats.filter(p=>!p.folded&&!p.out),canAct=p=>!p.folded&&!p.out&&!p.allin;
const nextSeat=(i,f)=>{for(let k=1;k<=4;k++){const j=(i+k)%4;if(f(PK.seats[j]))return j}return-1};
function put(p,n){n=Math.min(n,chipsOf(p));addChips(p,-n);p.bet+=n;p.inPot+=n;if(chipsOf(p)<=0)p.allin=true}
function dealHand(){const T=POKER_AT[PK.at];clearTimeout(PK.timer);
  if(ME.cash<T.bb){PK.note=`You need at least ${money(T.bb)} to play another hand.`;renderStart();return}
  PK.seats.forEach(p=>{if(!p.me&&p.chips<T.bb)p.out=true});
  // (if you've cleaned out the whole table, they go and fetch more money)
  if(PK.seats.every(p=>p.me||p.out)){PK.seats.forEach(p=>{if(!p.me){p.out=false;p.chips=T.stack}});say('You\'ve cleaned out the table! The others come back with fresh money.',4000)}
  const deck=SUITS.flatMap(s=>RANKS.map(r=>({r,s})));for(let i=deck.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[deck[i],deck[j]]=[deck[j],deck[i]]}
  PK.seats.forEach(p=>Object.assign(p,{cards:[],folded:!!p.out,allin:false,bet:0,inPot:0,show:false,won:0}));
  PK.dealer=nextSeat(PK.dealer,p=>!p.out);const sb=nextSeat(PK.dealer,p=>!p.out),bb=nextSeat(sb,p=>!p.out);
  PK.h={deck,board:[],winCards:new Set(),street:0,cur:T.bb,raises:1,acted:new Set(),over:false,sb,bb};put(PK.seats[sb],T.sb);put(PK.seats[bb],T.bb);
  for(let k=0;k<2;k++)PK.seats.forEach(p=>{if(!p.out)p.cards.push(deck.pop())});
  PK.h.turn=nextSeat(bb,canAct);PK.note='';advance()}
const potTotal=()=>PK.seats.reduce((a,p)=>a+p.inPot,0),betSize=()=>POKER_AT[PK.at].bb*(PK.h.street<2?1:2);
// a player does something: fold, check or call, or bet or raise (once four bets are in, a raise is a call)
function pokerAct(i,a){const h=PK.h,p=PK.seats[i],call=h.cur-p.bet;
  if(a=='raise'&&h.raises>=4)a='call';
  if(a=='fold'&&call<=0)a='call';
  if(a=='fold'){p.folded=true;p.said='Fold'}
  else if(a=='call'){put(p,call);p.said=call>0?(p.allin?'All in':'Call '+money(call)):'Check'}
  else{put(p,h.cur+betSize()-p.bet);const was=h.cur;h.cur=Math.max(h.cur,p.bet);h.raises++;h.acted=new Set();p.said=p.allin?'All in':(was?'Raise to ':'Bet ')+money(p.bet)}
  h.acted.add(i)}
// who's next, or on to the next card, or the showdown
function advance(){const h=PK.h;if(!h||h.over||START!='poker')return;
  if(inHand().length==1){finish();return}
  const waiting=PK.seats.map((p,i)=>i).filter(i=>canAct(PK.seats[i])&&(!h.acted.has(i)||PK.seats[i].bet<h.cur));
  if(!waiting.length||inHand().filter(canAct).length<=1&&waiting.every(i=>PK.seats[i].bet>=h.cur)){
    if(h.street==3){finish();return}
    h.street++;PK.seats.forEach(p=>{p.bet=0;p.said=''});h.cur=0;h.raises=0;h.acted=new Set();h.board.push(...h.deck.splice(-(h.street==1?3:1)));
    h.turn=nextSeat(PK.dealer,canAct);if(h.turn<0||inHand().filter(canAct).length<=1){renderStart();PK.timer=setTimeout(advance,700);return}}
  else if(!waiting.includes(h.turn))h.turn=nextSeat(h.turn,p=>waiting.includes(PK.seats.indexOf(p)));
  renderStart();const p=PK.seats[h.turn];if(p.me)return;
  PK.timer=setTimeout(()=>{if(START!='poker'||PK.h!==h)return;pokerAct(h.turn,aiChoice(p));advance()},650+Math.random()*500)}
// the other players' minds: how often they'd win, against the price of staying in
function aiChoice(p){const h=PK.h,opp=inHand().length-1,eq=equity(p.cards,h.board,opp),call=h.cur-p.bet,pot=potTotal(),odds=call/(pot+call||1),r=Math.random(),t=p.temper;
  if(call<=0)return eq>.6-t||r<.08+t?'raise':'call';
  if(eq>.72-t&&h.raises<4)return'raise';if(eq>=odds*1.15-t||r<.06+t)return'call';return'fold'}
// the end of a hand: the last one standing takes the pot, or the best hand at the showdown (split if tied)
function finish(){const h=PK.h;h.over=true;h.turn=-1;const pot=potTotal(),live=inHand();let msg;
  if(live.length==1){const w=live[0];addChips(w,pot);w.won=pot;msg=w.me?`Everyone else folds. You win ${money(pot)}.`:`${w.name} wins ${money(pot)}.`}
  else{while(h.board.length<5)h.board.push(h.deck.pop());live.forEach(p=>{p.show=true;p.val=bestOf([...p.cards,...h.board])});const top=Math.max(...live.map(p=>p.val)),ws=live.filter(p=>p.val==top),share=Math.floor(pot/ws.length);
    ws.forEach((w,i)=>{const n=share+(i==0?pot-share*ws.length:0);addChips(w,n);w.won=n});h.winCards=new Set(ws.flatMap(w=>bestFive([...w.cards,...h.board])));const nm=handDesc(top);
    msg=ws.length>1?`Split pot: ${ws.map(w=>w.me?'you':w.name).join(' and ')} with ${nm}.`:ws[0].me?`You win ${money(pot)} with ${nm}!`:`${ws[0].name} wins ${money(pot)} with ${nm}.`}
  PK.note=msg+' Press Space for the next hand.';renderStart();
  if(PK.at=='pizzeria_in'&&PK.seats.some(p=>p.name=='Gustavo')&&typeof questEvent=='function')questEvent('pokerdon')}
PLAYS.poker={
  render(){const T=POKER_AT[PK.at],h=PK.h,me=PK.seats[0],live=h&&!h.over,myTurn=live&&h.turn==0,call=live?h.cur-me.bet:0;
    const card=(c,hide)=>{const t=cardHtml(c,hide);return!hide&&h&&h.winCards.has(c)?t.replace('class="card','class="card win'):t},named=p=>p.show&&h.board.length==5?`<small class="hname">${handDesc(bestOf([...p.cards,...h.board]))}</small>`:'';
    const seat=(p,i)=>`<div class="pseat${p.folded?' folded':''}${h&&h.turn==i?' turn':''}"><img src="${p.pic}" alt=""><div><b>${esc(p.name)}</b>${PK.dealer==i?' <i class="dbtn">D</i>':''}<br><small>${money(p.chips)}</small></div>`+
      `<span class="cards">${p.out?'<small>Out</small>':h?p.cards.map(c=>card(c,!p.show)).join(''):''}${named(p)}</span><small class="said">${p.won?'Wins '+money(p.won):p.said||''}</small></div>`;
    const board=h?h.board.map(c=>card(c)).join('')+'<span class="card slot"></span>'.repeat(5-h.board.length):'';
    startEl.innerHTML=gameHead(T.title,`Texas hold'em, ${money(T.sb)}/${money(T.bb)}`)+cashLine()+`<div class="felt poker">
      <div class="pseats">${PK.seats.slice(1).map((p,i)=>seat(p,i+1)).join('')}</div>
      <div class="pboard"><span class="cards">${board}</span><span class="pot">Pot ${money(h?potTotal():0)}</span></div>
      <div class="pme${myTurn?' turn':''}"><b>You</b>${PK.dealer==0?' <i class="dbtn">D</i>':''}<span class="cards">${h?me.cards.map(c=>card(c)).join(''):''}</span>${h&&me.cards.length&&h.board.length>=3?`<small>${handDesc(bestOf([...me.cards,...h.board]))}</small>`:''}<small class="said">${me.won?'Wins '+money(me.won):me.said||''}</small></div>
      <p class="note" aria-live="polite">${esc(myTurn?(call>0?`${money(call)} to call.`:'Your move.'):PK.note||(live?PK.seats[h.turn].name+' is thinking…':''))}</p></div>
      <div class="acts">${myTurn?`<button data-g="fold"${call<=0?' disabled':''}>Fold <small>(X)</small></button><button data-g="call">${call>0?'Call '+money(Math.min(call,ME.cash)):'Check'} <small>(C)</small></button>`+
        `<button data-g="raise"${h.raises>=4||ME.cash<=call?' disabled':''}>${h.cur>0?'Raise':'Bet'} ${money(betSize())} <small>(R)</small></button>`:live?'':`<button data-g="deal">Deal the next hand <small>(Space)</small></button>`}</div>`;
    wire()},
  act(a){const h=PK.h;if(a=='deal'){if(!h||h.over)dealHand();return}if(!h||h.over||h.turn!=0)return;pokerAct(0,a);advance()},
  key(k){const l=k.toLowerCase();if(l=='x'){this.act('fold');return true}if(l=='c'){this.act('call');return true}if(l=='r'){this.act('raise');return true}
    if(k==' '||k=='Enter'||l=='e'){this.act('deal');return true}return/^Arrow|^[wasd]$/i.test(k)}};
