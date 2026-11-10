// ---- The cassette player: equip it, put in one of Ruby's tapes (TAPES, in js/data.js) and press Play, and the tape plays in your
// headphones wherever you go, instead of the place's own music and instead of the radio. Put the player away and it stops; take
// it out again and it carries on. Each tape has six songs, three a side; at the end of side B it turns over and starts again.
// The songs are made in the browser as they play, like the rest of the music (js/music.js): each tape's band has its own sound
// (STYLES), and each song is made from a seeded random, so a song sounds the same every time you play it. All of it goes through
// a little tape wobble and hiss.

// how each band sounds: tempo, beats in a bar, keys, chord progressions ([root, M or m] a bar each), and how long a song lasts
const STYLES={
  synth:{bpm:[112,126],meter:4,keys:[-3,0,2,5],secs:100,progs:[[[0,'m'],[8,'M'],[3,'M'],[10,'M']],[[0,'m'],[5,'m'],[8,'M'],[10,'M']],[[0,'m'],[10,'M'],[8,'M'],[7,'M']]]},
  ballad:{bpm:[66,80],meter:4,keys:[-2,0,3,5],secs:110,progs:[[[0,'M'],[7,'M'],[9,'m'],[5,'M']],[[0,'M'],[9,'m'],[5,'M'],[7,'M']],[[0,'M'],[4,'m'],[5,'M'],[7,'M']]]},
  surf:{bpm:[138,156],meter:4,keys:[-5,-2,0,2],secs:90,progs:[[[0,'M'],[5,'M'],[7,'M'],[5,'M']],[[0,'M'],[9,'m'],[5,'M'],[7,'M']],[[0,'m'],[10,'M'],[8,'M'],[7,'M']]]},
  folk:{bpm:[150,176],meter:3,keys:[-2,0,3,5],secs:80,progs:[[[0,'M'],[5,'M'],[7,'M'],[0,'M']],[[0,'m'],[5,'m'],[7,'M'],[0,'m']],[[0,'M'],[7,'M'],[7,'M'],[0,'M']]]}};
const TRI3={M:[0,4,7],m:[0,3,7]},MAJ=[0,2,4,5,7,9,11],MIN=[0,2,3,5,7,8,10];
const TAPE_NOW={song:null};   // what's playing now (for the caption and the held-item box)
const tapeOwned=()=>Object.keys(TAPES).filter(k=>has(k));
const tapePlaying=()=>!!(ME.tapeOn&&ME.equipped=='walkman'&&has('walkman')&&ME.tape&&has(ME.tape));
// what the music should be (js/music.js asks every quarter second): this tape, while it's playing
function tapeWant(){return tapePlaying()?'tape:'+ME.tape:null}
function tapeSay(t){radioCap.hidden=!t;if(t)radioCap.innerHTML=t}

// one tape, song after song from ME.tapeN
function startTape(id){const ac=audio();if(!ac)return null;const T=TAPES[id],S=STYLES[T.style],hz=s=>220*2**(s/12);
  // the tape: a slow wobble in pitch (a delay whose length drifts), the top end rolled off, and a little hiss
  const out=ac.createGain();out.gain.value=0;out.gain.setTargetAtTime(.85,ac.currentTime,.4);out.connect(MU.master||ac.destination);
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7500;lp.connect(out);
  const wow=ac.createDelay(.1),lfo=ac.createOscillator(),lg=ac.createGain();wow.delayTime.value=.012;lfo.frequency.value=.6;lg.gain.value=.0012;lfo.connect(lg);lg.connect(wow.delayTime);lfo.start();wow.connect(lp);
  const bus=ac.createGain();bus.gain.value=1;bus.connect(wow);
  const echo=ac.createDelay(1),fb=ac.createGain(),eg=ac.createGain();echo.delayTime.value=60/((S.bpm[0]+S.bpm[1])/2)*.75;fb.gain.value=.3;eg.gain.value=.5;echo.connect(fb);fb.connect(echo);echo.connect(eg);eg.connect(bus);
  const noise=noiseBuf(ac,2,false),hiss=ac.createBufferSource(),hf=ac.createBiquadFilter(),hg=ac.createGain();hiss.buffer=noise;hiss.loop=true;hf.type='highpass';hf.frequency.value=5000;hg.gain.value=.007;hiss.connect(hf);hf.connect(hg);hg.connect(out);hiss.start();
  // ---- the instruments: each plays one note (or hit) at time t
  const env=(g,t,a,att,dec)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+att);g.gain.exponentialRampToValueAtTime(.0005,t+att+dec)};
  const osc=(type,f,t,len,dest,det=0)=>{const o=ac.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=det;o.connect(dest);o.start(t);o.stop(t+len);return o};
  const I={
    kick:(t,a=.5)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);env(g,t,a,.004,.3);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.4)},
    snare:(t,a=.25)=>{noiseHit(ac,bus,t,'bandpass',1900,.7,a,.16,0,noise);const g=ac.createGain();env(g,t,a*.4,.002,.08);g.connect(bus);osc('triangle',190,t,.12,g)},
    clap:(t,a=.22)=>{for(const d of[0,.012,.024])noiseHit(ac,bus,t+d,'bandpass',1400,1.2,a,.12,0,noise)},
    hat:(t,a=.06)=>noiseHit(ac,bus,t,'highpass',8000,.5,a,.05,.2,noise),
    brush:(t,a=.05)=>noiseHit(ac,bus,t,'bandpass',3500,.4,a,.22,-.2,noise),
    // the bass: a soft synth (square, filtered) or a round one (triangle)
    bass:(t,s,len,a=.22,type='triangle')=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=type=='square'?500:900;env(g,t,a,.01,len);f.connect(g);g.connect(bus);osc(type,hz(s),t,len+.1,f)},
    // a pad: the chord in detuned saws, held for the bar
    pad:(t,ss,len,a=.03)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=1100;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.4);g.gain.setValueAtTime(a,t+len-.2);g.gain.linearRampToValueAtTime(0,t+len+.3);
      f.connect(g);g.connect(bus);ss.forEach(s=>{for(const d of[-7,7])osc('sawtooth',hz(s),t,len+.4,f,d)})},
    // the synth lead and the arpeggio: square or saw, bright, into the echo
    synth:(t,s,len,a=.06,type='sawtooth')=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(1200,t+len);env(g,t,a,.01,len);f.connect(g);g.connect(bus);g.connect(echo);
      osc(type,hz(s),t,len+.1,f,-4);osc(type,hz(s),t,len+.1,f,5)},
    // the piano: a few sine partials dying away
    piano:(t,s,a=.08,dec=1.8)=>{for(const[r,k]of[[1,1],[2,.35],[3,.12],[4,.05]]){const g=ac.createGain();env(g,t,a*k,.006,dec/r);g.connect(bus);g.connect(echo);osc('sine',hz(s)*r,t,dec/r+.1,g)}},
    // the twangy guitar: a saw whose filter snaps shut, into a springy echo
    pluck:(t,s,len,a=.09)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.Q.value=4;f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(500,t+.35);env(g,t,a,.004,Math.max(.2,len));f.connect(g);g.connect(bus);g.connect(echo);osc('sawtooth',hz(s),t,len+.4,f)},
    // the accordion: two reeds a little apart, squeezed in and out, with a slow wobble
    accordion:(t,s,len,a=.05)=>{const f=ac.createBiquadFilter(),g=ac.createGain(),tr=ac.createOscillator(),tg=ac.createGain();f.type='bandpass';f.frequency.value=1300;f.Q.value=.6;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.04);g.gain.setValueAtTime(a,t+len*.85);g.gain.linearRampToValueAtTime(0,t+len);tr.frequency.value=5.5;tg.gain.value=a*.25;tr.connect(tg);tg.connect(g.gain);tr.start(t);tr.stop(t+len+.1);
      f.connect(g);g.connect(bus);for(const d of[-9,9])osc('square',hz(s),t,len+.1,f,d)}};
  // ---- a song: its tempo, key, chords and a tune, all from its own seed
  let n=ME.tapeN||0,song=null,bar=0,nextT=ac.currentTime+.4,gapTill=0,iv=0,stopped=false;
  const newSong=()=>{const r=rng([...id].reduce((h,c)=>h*31+c.charCodeAt(0)|0,7)+n*101),pick=a=>a[r()*a.length|0];
    const bpm=S.bpm[0]+r()*(S.bpm[1]-S.bpm[0])|0,beat=60/bpm,prog=pick(S.progs),key=pick(S.keys),scale=prog[0][1]=='m'?MIN:MAJ,slots=S.meter*2;
    const per=prog.length,sections=Math.max(4,Math.round(S.secs/(beat*S.meter*per)));
    // the tune: a rhythm for odd bars and one for even bars, and notes that move by step and land on the chord on the beat
    const rhythm=()=>Array.from({length:slots},(_,i)=>i==0||r()<(i%2?.35:.65));const rh=[rhythm(),rhythm()];
    const inScale=s=>{const o=Math.floor(s/12),d=((s%12)+12)%12;let best=0;for(const x of scale)if(Math.abs(x-d)<Math.abs(best-d))best=x;return o*12+best};
    let p=12;const tune=prog.map(([root,q],b)=>{const out=[],on=rh[b%2];for(let i=0;i<slots;i++){if(!on[i])continue;
      if(i%2==0){const tones=[-12,0,12].flatMap(o=>TRI3[q].map(x=>root+x+o)).filter(x=>x>=3&&x<=22);p=tones.reduce((a,x)=>Math.abs(x-p+(r()-.5)*5)<Math.abs(a-p)?x:a,tones[0])}
      else p=inScale(p+(r()<.5?-2:2));p=Math.max(3,Math.min(22,p));let len=1;while(i+len<slots&&!on[i+len])len++;out.push([i,p,len])}return out});
    return{title:T.songs[n%6],bpm,beat,prog,key,tune,slots,per,sections,bars:per*sections}};
  const side=()=>n%6<3?'Side A':'Side B';
  const caption=()=>{TAPE_NOW.song=song.title;tapeSay(`<small>&#128252; ${esc(T.band)}, ${esc(T.album)} &middot; ${side()}</small>&#9834; ${esc(song.title)}`)};
  // one bar of the song, for each band's sound
  const playBar=t=>{const{beat,prog,key,tune,slots,per}=song,i=bar%per,sec=Math.floor(bar/per),last=bar==song.bars-1,[root,q]=prog[i],R=key+root,ch=TRI3[q].map(x=>R+x),
      sl=beat/2,melody=sec>0&&(sec%4!=3||sec==song.sections-1),barLen=beat*S.meter;
    if(last){// the last bar: the home chord, rung out
      const home=TRI3[prog[0][1]].map(x=>key+prog[0][0]+x);if(T.style=='synth')I.pad(t,home,barLen*1.5,.035);else if(T.style=='folk')I.accordion(t,home[0]+12,barLen*1.5);else home.forEach(s=>T.style=='surf'?I.pluck(t,s,barLen):I.piano(t,s,.07,3));
      I.bass(t,key+prog[0][0]-24,barLen,.2,T.style=='synth'?'square':'triangle');if(T.style=='synth'||T.style=='surf')I.kick(t);return}
    if(melody)for(const[at,s,len]of tune[i]){const st=t+at*sl,d=len*sl;
      if(T.style=='synth')I.synth(st,key+s,d*.9);else if(T.style=='ballad')I.piano(st,key+s+12,.09,2.2);else if(T.style=='surf')I.pluck(st,key+s,d*.9,.1);else I.accordion(st,key+s+12,d*.95,.055)}
    if(T.style=='synth'){const drums=sec>0;I.pad(t,ch.map(s=>s+12),barLen,sec%4==3?.045:.028);
      for(let b=0;b<4;b++){if(drums)I.kick(t+b*beat);if(drums&&b%2)I.clap(t+b*beat);if(drums||b>1)I.hat(t+b*beat+beat/2)}
      for(let k=0;k<8;k++)I.bass(t+k*sl,R-24+(k%4==3?12:0),sl*.8,.16,'square');
      for(let k=0;k<16;k++)I.synth(t+k*beat/4,ch[[0,1,2,1][k%4]]+12*((k>>2)%2)+12,beat/4*.8,melody?.018:.03,'square')}
    else if(T.style=='ballad'){I.pad(t,ch,barLen,.012);I.bass(t,R-24,beat*2,.18);I.bass(t+beat*2,R-24+(i%2?7:0),beat*2,.15);
      [0,1,2,1,0,1,2,1].forEach((x,k)=>I.piano(t+k*sl,ch[x]+(k>3&&x==2?0:-12)+(x==0&&k==4?12:0),.035,1.4));if(sec>1){I.brush(t+beat);I.brush(t+beat*3)}}
    else if(T.style=='surf'){for(let b=0;b<4;b++){if(b%2==0)I.kick(t+b*beat);else I.snare(t+b*beat);I.hat(t+b*beat,.05);I.hat(t+b*beat+sl,.035)}
      for(let k=0;k<8;k++)I.bass(t+k*sl,R-24+(k%4==2?7:0),sl*.9,.2);for(let b=0;b<4;b++)ch.forEach(s=>I.pluck(t+b*beat+sl,s,.12,.025))}
    else{// folk: oom-pah-pah, the bass on the beat and the accordion's chord after it
      I.bass(t,R-24+(bar%2?7:0),beat*.9,.24);for(let b=1;b<3;b++)ch.forEach(s=>I.accordion(t+b*beat,s,beat*.5,.022));I.hat(t,.03)}};
  const tick=()=>{if(stopped)return;const now=ac.currentTime;
    if(!song){if(now<gapTill)return;song=newSong();ME.tapeN=n;bar=0;nextT=Math.max(nextT,now+.2);caption()}
    while(song&&nextT<now+1.5){playBar(nextT);nextT+=song.beat*S.meter*(bar==song.bars-1?2:1);if(++bar>=song.bars){
      // the end of the song: a little gap of hiss, then the next; at the end of side B the tape turns over
      gapTill=nextT+1.5;n=(n+1)%6;song=null;setTimeout(()=>{if(!stopped){TAPE_NOW.song=null;if(n==0)tapeSay('<small>&#128252; The tape turns over</small>Back to side A.')}},Math.max(0,(gapTill-1.5-now)*1000))}}};
  tick();iv=setInterval(tick,200);
  return{stop(){stopped=true;clearInterval(iv);TAPE_NOW.song=null;tapeSay('');out.gain.setTargetAtTime(0,ac.currentTime,.15);setTimeout(()=>{hiss.stop();lfo.stop();out.disconnect()},1500)}}}
for(const k in TAPES)TRACKS['tape:'+k]=()=>startTape(k);

// ---- what you can do with the player and the tapes (useItem, in js/game.js, calls these)
const tapeName=id=>`${TAPES[id].album} by ${TAPES[id].band}`;
// a tape in, if there isn't one: the first you have
function tapeIn(){if(!ME.tape||!has(ME.tape)){ME.tape=tapeOwned()[0]||null;ME.tapeN=0}return ME.tape}
function tapePlay(){if(!tapeIn())return"There's no tape in it. Ruby's record shop sells cassettes.";
  if(ME.equipped!='walkman')return'Equip the cassette player first, then press Play.';ME.tapeOn=true;MU.want=undefined;
  return`You put on the headphones and press Play. ${tapeName(ME.tape)}: "${TAPES[ME.tape].songs[ME.tapeN||0]}".`}
function tapeStop(){ME.tapeOn=false;return'Click. You press Stop.'}
function tapeNext(){if(!tapeIn())return"There's no tape in it.";ME.tapeN=((ME.tapeN||0)+1)%6;MU.want=undefined;
  return`You fast-forward to the next song: "${TAPES[ME.tape].songs[ME.tapeN]}".`}
function tapeChange(){const all=tapeOwned();if(!all.length)return"You haven't got any tapes. Ruby's record shop sells them.";
  if(all.length==1&&ME.tape==all[0])return"It's the only tape you have.";ME.tape=all[(all.indexOf(ME.tape)+1)%all.length];ME.tapeN=0;MU.want=undefined;
  return`You flip open the lid and put in ${tapeName(ME.tape)}.`}
// Play on a cassette: into the player, the player into your hand, and Play
function tapeLoad(id){if(!has('walkman'))return"You need a cassette player to hear it. Nils's electronics shop in Frostholm sells them.";
  const was=ME.equipped&&ME.equipped!='walkman'&&ITEMS[ME.equipped];ME.tape=id;ME.tapeN=0;ME.equipped='walkman';ME.tapeOn=true;MU.want=undefined;
  return`You put ${tapeName(id)} in the cassette player${was?`, put away the ${was.name.toLowerCase()}`:''} and press Play.`}
