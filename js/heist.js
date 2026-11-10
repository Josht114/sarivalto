// ---- Cracking a safe, and forging a document: minigames a quest condition can open (use: a piece of furniture, play: 'safe' or
// 'forge'). Facing the furniture and pressing E opens it in the start menu's panel; finishing it meets the condition. Close it
// (Escape) and you can come back and try again.

// ---- The safe: a dial from 0 to 39 and three wheels. Turn the dial (left and right) and listen: when it lands on the number a
// wheel wants, there's a click, and the stethoscope's needle jumps (near it, it stirs). Set the wheel there (Space or E). Set it
// anywhere else and the wheels slip, and you start again from the first. Set all three and the handle turns.
const SF={q:null,i:0,dial:0,wheel:0,combo:[0,0,0],click:0,note:'',open:false,slips:0,raf:false,buf:null};
const SF_N=40;
// the click of a wheel, in the headphones of the stethoscope
function sfClick(loud){const ac=typeof audio=='function'&&audio();if(!ac||ac.state!='running')return;SF.buf??=noiseBuf(ac,.2,false);
  noiseHit(ac,MU.master||ac.destination,ac.currentTime,'bandpass',loud?2600:1800,loud?3:1.5,loud?.5:.08,loud?.04:.02,0,SF.buf)}
// how near the dial is to the wheel's number (1 on it, less either side, 0 further off)
const sfNear=()=>{const d=Math.abs(SF.dial-SF.combo[SF.wheel]),k=Math.min(d,SF_N-d);return k==0?1:k==1?.35:k==2?.15:0};
function sfTurn(by){if(SF.open)return;SF.dial=((SF.dial+by)%SF_N+SF_N)%SF_N;const n=sfNear();if(n==1){SF.click=performance.now();sfClick(true)}else sfClick(false);renderStart()}
function sfSet(){if(SF.open)return;
  if(SF.dial==SF.combo[SF.wheel]){SF.wheel++;
    if(SF.wheel>=3){SF.open=true;SF.note='The last wheel drops into place. The handle turns.';renderStart();setTimeout(()=>{if(START=='safe')closeStart();meet(SF.q,SF.i)},1200);return}
    SF.note=`Wheel ${SF.wheel} drops into place with a soft clunk. Now the next.`}
  else{SF.wheel=0;SF.slips++;SF.note='Nothing. The wheels slip back. Start again from the first.'}
  renderStart()}
function drawSafe(t){const c=startEl.querySelector('#safec');if(!c)return;const g=c.getContext('2d'),W=c.width,H=c.height,cx=62,cy=56,r=44;
  g.fillStyle='#1a1a1e';g.fillRect(0,0,W,H);
  // the safe door and the dial, its numbers every five, and the mark at the top
  g.fillStyle='#4a5058';g.fillRect(4,4,116,104);g.fillStyle='#5a6068';g.fillRect(4,4,116,3);
  g.fillStyle='#2a2e34';g.beginPath();g.arc(cx,cy,r+3,0,7);g.fill();g.fillStyle='#c8ccd0';g.beginPath();g.arc(cx,cy,r,0,7);g.fill();
  g.fillStyle='#2a2e34';g.font='9px monospace';g.textAlign='center';g.textBaseline='middle';
  for(let k=0;k<SF_N;k++){const a=(k-SF.dial)/SF_N*Math.PI*2-Math.PI/2,big=k%5==0,r1=r-(big?7:4);
    g.fillRect(cx+Math.cos(a)*r1-1,cy+Math.sin(a)*r1-1,2,2);if(big)g.fillText(k,cx+Math.cos(a)*(r-15),cy+Math.sin(a)*(r-15))}
  g.fillStyle='#8a9098';g.beginPath();g.arc(cx,cy,10,0,7);g.fill();g.fillStyle='#c0392b';g.fillRect(cx-1,cy-r-8,3,8);
  // the stethoscope: a needle that jumps on a click and stirs when you're near
  const mx=134,mw=W-mx-8,since=(t-SF.click)/1000,lvl=SF.open?0:Math.max(sfNear()*.4,since<.6?1-since/.6:0);
  g.fillStyle='#e8e0c8';g.fillRect(mx,14,mw,56);g.fillStyle='#3a3a40';g.fillRect(mx,14,mw,2);
  const a=-Math.PI*.8+lvl*Math.PI*.6,px=mx+mw/2,py=64;g.strokeStyle='#c0392b';g.lineWidth=2;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*40,py+Math.sin(a)*40);g.stroke();
  g.fillStyle='#3a3a40';g.font='9px monospace';g.fillText('LISTEN',px,82);
  // the three wheels, set or not
  for(let k=0;k<3;k++){g.fillStyle=k<SF.wheel||SF.open?'#ffd23a':k==SF.wheel?'#9fe870':'#3a3a40';g.fillRect(mx+8+k*((mw-16)/3),92,(mw-16)/3-4,8)}}
function safeLoop(t){if(START!='safe'||SF.open){SF.raf=false;return}drawSafe(t);requestAnimationFrame(safeLoop)}
PLAYS.safe={
  // a new safe each time: three numbers, not too close together
  begin(q,i){const pick=()=>Math.floor(Math.random()*SF_N);let c=[pick(),pick(),pick()];while(Math.abs(c[0]-c[1])<6||Math.abs(c[1]-c[2])<6)c=[pick(),pick(),pick()];
    Object.assign(SF,{q,i,dial:0,wheel:0,combo:c,open:false,slips:0,click:0,note:'Turn the dial and listen for the click. Set each wheel when you hear it.'});startPlay('safe')},
  render(){startEl.innerHTML=gameHead('Cracking the Safe',NM[SF.q?.id&&QUESTS[SF.q.id].done[SF.i].m]||'')+
    `<div class="gamebox"><div><canvas id="safec" width="220" height="112"></canvas><p class="note" aria-live="polite">${esc(SF.note)}</p>
      <div class="acts"><button data-g="l5"${SF.open?' disabled':''}>&laquo; 5</button><button data-g="l1"${SF.open?' disabled':''}>&lsaquo; Left</button><button data-g="r1"${SF.open?' disabled':''}>Right &rsaquo;</button><button data-g="r5"${SF.open?' disabled':''}>5 &raquo;</button></div>
      <div class="acts"><button data-g="set"${SF.open?' disabled':''}>Set the wheel <small>(Space)</small></button></div></div>
      <p>The dial is on <b>${SF.dial}</b>. Wheels set: ${SF.open?3:SF.wheel} of 3.${SF.slips?` <small>(Slipped ${SF.slips} time${SF.slips>1?'s':''}.)</small>`:''}<br><small>Left and right arrows turn the dial (hold Shift for five at a time). Escape to give up.</small></p></div>`;
    wire();drawSafe(performance.now());if(!SF.raf&&!SF.open){SF.raf=true;requestAnimationFrame(safeLoop)}},
  act(a){if(a=='set')sfSet();else sfTurn((a[0]=='l'?-1:1)*+a.slice(1))},
  key(k,e){if(k==' '||k=='Enter'||k=='e'||k=='E'){sfSet();return true}const n=e?.shiftKey?5:1;
    if(k=='ArrowLeft'||k=='a'||k=='A'){sfTurn(-n);return true}if(k=='ArrowRight'||k=='d'||k=='D'){sfTurn(n);return true}return/^Arrow|^[ws]$/i.test(k)}};

// ---- The forgery: match the real card (the paper, the ink and the hand it's written in), then write it out, four lines, each
// with a steady hand (press while the needle is in the green; miss and the pen blots, and you start a fresh card). Held next to
// the real one, a wrong paper, ink or hand gives it away, and it goes in the stove. Get it right and you make two.
const FG_OPTS={paper:[['card','Yellowed index card','#e8d49a'],['white','White typing paper','#f4f4f0'],['letter','Kelp Cola letterhead','#dff0e2']],
  ink:[['blue','Blue biro','#2a4aa8'],['green','Green fountain pen','#2e7a3a'],['black','Black ink','#1a1a1e']],
  hand:[['print','Neat capitals'],['slant','Slanting copperplate'],['round','Round schoolroom hand']]};
const FG_REAL={paper:'card',ink:'green',hand:'slant'},FG_LINES=4;
const FG={q:null,i:0,paper:'white',ink:'blue',hand:'print',lines:0,writing:false,zone:[.4,.6],t0:0,speed:1,note:'',done:false,raf:false,ruined:0};
const fgOpt=(k,v)=>FG_OPTS[k].find(o=>o[0]==v);
function fgZone(){const w=.3-FG.lines*.04,a=.1+Math.random()*(.8-w);FG.zone=[a,a+w];FG.speed=.8+FG.lines*.2;FG.t0=performance.now()}
const fgNeedle=t=>{const p=((t-FG.t0)/1000*FG.speed)%2;return p<1?p:2-p};
// a line of handwriting on a card, in that hand: little strokes, slanted, upright or round
function fgScrawl(g,x,y,w,hand,seed){let s=seed;const r=()=>(s=(s*9301+49297)%233280)/233280;
  for(let px=0;px<w;){const lw=hand=='print'?3:hand=='round'?4:5,h=hand=='print'?5:4;
    if(hand=='slant'){for(let k=0;k<lw;k++)g.fillRect(x+px+k,y-k*.8+(r()<.3?-2:0),1,2)}
    else if(hand=='round'){g.fillRect(x+px,y-2,lw,1);g.fillRect(x+px,y+1,lw,1);g.fillRect(x+px,y-1,1,2);g.fillRect(x+px+lw-1,y-1,1,2)}
    else{g.fillRect(x+px,y-h+2,1,h);g.fillRect(x+px+2,y-h+2,1,h);g.fillRect(x+px,y-h+2,3,1)}
    px+=lw+1+(r()<.25?4:0)}}
// a card: its paper, and as many lines written on it as there are
function fgCard(g,x,y,paper,ink,hand,lines,seed){const P=fgOpt('paper',paper);g.fillStyle='#00000055';g.fillRect(x+3,y+3,90,60);g.fillStyle=P[2];g.fillRect(x,y,90,60);
  if(paper=='card'){g.fillStyle='#c9b070';g.fillRect(x,y+10,90,1)}if(paper=='letter'){g.fillStyle='#2e9d57';g.fillRect(x+30,y+3,30,4)}
  g.fillStyle=fgOpt('ink',ink)[2];for(let k=0;k<lines;k++)fgScrawl(g,x+8,y+20+k*10,74-(k==lines-1?20:0),hand,seed+k*17)}
function drawForge(t){const c=startEl.querySelector('#forgec');if(!c)return;const g=c.getContext('2d'),W=c.width;g.fillStyle='#3a2a1a';g.fillRect(0,0,W,c.height);
  g.fillStyle='#ffe08a';g.font='9px monospace';g.textAlign='center';g.fillText('THE REAL ONE',52,10);g.fillText('YOURS',W-52,10);
  fgCard(g,7,16,FG_REAL.paper,FG_REAL.ink,FG_REAL.hand,FG_LINES,3);fgCard(g,W-97,16,FG.paper,FG.ink,FG.hand,FG.done?FG_LINES:FG.lines,3);
  if(FG.writing){const bx=10,bw=W-20,by=86;g.fillStyle='#1a1a1e';g.fillRect(bx,by,bw,10);g.fillStyle='#2e9d57';g.fillRect(bx+FG.zone[0]*bw,by,(FG.zone[1]-FG.zone[0])*bw,10);
    g.fillStyle='#f4f4f0';g.fillRect(bx+fgNeedle(t)*bw-1,by-3,3,16)}}
function forgeLoop(t){if(START!='forge'||!FG.writing){FG.raf=false;return}drawForge(t);requestAnimationFrame(forgeLoop)}
// writing a line: steady (in the green), or a blot that spoils the card
function fgStroke(){if(!FG.writing)return;const n=fgNeedle(performance.now());
  if(n<FG.zone[0]||n>FG.zone[1]){FG.lines=0;FG.ruined++;FG.note='Your hand shakes, and the pen blots. That card is spoiled: start a fresh one.';fgZone();renderStart();return}
  FG.lines++;if(FG.lines<FG_LINES){FG.note=`Line ${FG.lines} done, steady as a bank clerk.`;fgZone();renderStart();return}
  // all four lines: hold it next to the real one
  FG.writing=false;const wrong=['paper','ink','hand'].filter(k=>FG[k]!=FG_REAL[k]);
  if(wrong.length){FG.lines=0;FG.ruined++;FG.note=`Side by side, it's plainly wrong: the ${wrong.map(k=>({paper:'paper',ink:'ink',hand:'handwriting'})[k]).join(' and the ')}. Into the stove it goes. Try again.`;renderStart();return}
  FG.done=true;FG.note="Side by side, you can't tell them apart. You write a second while your hand's in.";renderStart();
  setTimeout(()=>{if(START=='forge')closeStart();const mine=has('forgedcard');if(mine)mine.n+=2;else ME.items.push({id:'forgedcard',n:2});qFlag(FG.q.id,'forged');meet(FG.q,FG.i)},1400)}
PLAYS.forge={
  begin(q,i){if(!has('recipe_home')){say("You'd need the real card in front of you to copy.",4000);return}
    Object.assign(FG,{q,i,lines:0,writing:false,done:false,ruined:0,note:'Choose the paper, the ink and the hand to match the real card. Then write it out.'});startPlay('forge')},
  render(){const row=(k,label)=>`<div class="acts"><span>${label}:</span>${FG_OPTS[k].map(o=>`<button data-g="${k}:${o[0]}" aria-pressed="${FG[k]==o[0]}"${FG.writing||FG.done?' disabled':''}>${o[1]}</button>`).join('')}</div>`;
    startEl.innerHTML=gameHead('Forging the Recipe','Hidden Radio Room')+
    `<div class="gamebox"><div><canvas id="forgec" width="210" height="${FG.writing?102:84}"></canvas><p class="note" aria-live="polite">${esc(FG.note)}</p>
      ${row('paper','Paper')}${row('ink','Ink')}${row('hand','Hand')}
      <div class="acts">${FG.writing?`<button data-g="stroke">Write the line <small>(Space)</small></button>`:`<button data-g="write"${FG.done?' disabled':''}>Write it out</button>`}</div></div>
      <p>${FG.writing?`Lines written: ${FG.lines} of ${FG_LINES}. Press while the needle is in the green.`:'Match your card to the real one, then write it out, four lines.'}${FG.ruined?` <small>(Cards spoiled: ${FG.ruined}.)</small>`:''}<br><small>Escape to give up.</small></p></div>`;
    wire();drawForge(performance.now());if(FG.writing&&!FG.raf){FG.raf=true;requestAnimationFrame(forgeLoop)}},
  act(a){if(a=='write'){FG.writing=true;FG.lines=0;FG.note='Steady now. Press as the needle crosses the green.';fgZone();renderStart();return}
    if(a=='stroke'){fgStroke();return}const[k,v]=a.split(':');if(FG_OPTS[k]&&!FG.writing){FG[k]=v;renderStart()}},
  key(k){if(k==' '||k=='Enter'||k=='e'||k=='E'){if(FG.writing)fgStroke();return true}return/^Arrow|^[wasd]$/i.test(k)}};
