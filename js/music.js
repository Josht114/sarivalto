// ---- Background music, made in the browser as it plays (Web Audio; no recordings). Each piece belongs to some places (MUSIC_AT);
// walking into one of them fades its music in, and leaving fades it out. The Music button turns it all off and on (remembered in
// this browser). Browsers only let a page make sound once you've clicked or pressed a key, so it starts on the first one.
//
// The monastery: Gregorian chant. A small choir of men's voices sings one line in the Dorian mode on D, a syllable or a few notes
// at a time to the vowels of the Salve Regina, each phrase rising from the final, reciting, turning, and falling to its cadence,
// with a breath between phrases; under them a low hummed drone on D; all of it in a long stone-church echo.
//
// The harbours: the sea. Waves roll in every few seconds (deep rumbling noise swelling and falling away, a hiss of surf as each
// one breaks), gulls cry now and then from one side or the other, and a bell buoy clangs far out. A voice is a buzzy
// tone shaped by three filters into a vowel (ah, eh, ee, oh, oo), with a little vibrato, a little out of tune with the others.
const MUSIC_AT={chant:['monastery','monchurch','monks','house_thyme'],ocean:['harbour','privharbour','kalanharbour','savilaharbour']};
const MU={ac:null,on:true,track:null,out:null,want:null};
try{MU.on=localStorage.getItem('sarivalto-music')!='off'}catch(e){}
// the vowels: their three formants (Hz) and how loud each is
const VOWEL={a:[[700,1],[1220,.5],[2600,.25]],e:[[450,1],[1800,.4],[2550,.2]],i:[[300,1],[2200,.35],[2900,.2]],o:[[450,1],[800,.6],[2830,.12]],u:[[325,1],[700,.4],[2530,.1]]};
const DORIAN=[0,2,3,5,7,9,10],D3=146.83,degHz=d=>D3*2**((Math.floor(d/7)*12+DORIAN[((d%7)+7)%7])/12);
// a seeded random, so each run of the chant is the same
const rng=s=>()=>((s=Math.imul(s^s>>>15,s|1)^(s+Math.imul(s^s>>>7,s|61)))>>>0)/4294967296;
// ---- the chant: phrases of the Salve Regina, each made into notes: [degree, seconds, vowel]
const SALVE=['Salve Regina','mater misericordiae','vita dulcedo','et spes nostra salve','Ad te clamamus','exsules filii Evae','Ad te suspiramus','gementes et flentes','in hac lacrimarum valle'];
function chantPhrase(text,r,end){const vs=text.toLowerCase().match(/[aeiou]+/g).map(v=>v[v.length-1]),n=vs.length,out=[];let deg=r()<.5?0:2;
  vs.forEach((v,i)=>{const left=n-1-i;
    if(i<2)deg=[0,2,3][Math.min(2,i+(r()<.5?1:0))];                  // the opening rises from the final
    else if(left<=2)deg=end+left;                                       // the cadence falls to its end
    else if(r()<.55)deg=4;                                              // reciting on the dominant
    else deg=Math.max(1,Math.min(6,deg+[-1,1,1,-1,2][r()*5|0]));
    if(left==1||(r()<.18&&left>2)){const k=2+(r()*2|0);for(let j=0;j<k;j++)out.push([deg+[0,1,0,-1][j%4],.3,v])}   // a melisma: a few notes on one vowel
    else out.push([deg,left==0?1.6:.48+r()*.14,v])});
  return out}
function chantScore(){const r=rng(7),out=[];SALVE.forEach((t,i)=>out.push(chantPhrase(t,r,i%3==2?4:0)));return out}
// ---- the sound
function audio(){if(MU.ac)return MU.ac;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;const ac=MU.ac=new AC();
  MU.out=ac.createGain();MU.out.gain.value=MU.on?1:0;MU.out.connect(ac.destination);
  // the echo of a stone church: a few seconds of noise dying away
  const len=ac.sampleRate*4.5,ir=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  MU.verb=ac.createConvolver();MU.verb.buffer=ir;const wet=ac.createGain();wet.gain.value=.55;MU.verb.connect(wet);wet.connect(MU.out);MU.dry=ac.createGain();MU.dry.gain.value=.35;MU.dry.connect(MU.out);return ac}
// a choir singing one line: voices (a sawtooth each, a little detuned, with vibrato) through a vowel's three formant filters
function choir(ac,dest,voices,level){const bus=ac.createGain(),env=ac.createGain();env.gain.value=0;const fs=[0,1,2].map(()=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='bandpass';f.Q.value=9;bus.connect(f);f.connect(g);g.connect(env);return[f,g]});
  const oscs=voices.map((det,k)=>{const o=ac.createOscillator(),v=ac.createOscillator(),vg=ac.createGain(),og=ac.createGain();o.type='sawtooth';o.detune.value=det;v.frequency.value=4.6+k*.37;vg.gain.value=9+k*2;v.connect(vg);vg.connect(o.detune);og.gain.value=.22;o.connect(og);og.connect(bus);o.start();v.start();return o});
  const lvl=ac.createGain();lvl.gain.value=level;env.connect(lvl);lvl.connect(dest);
  return{env,set(t,hz,vowel,glide=.04){oscs.forEach(o=>o.frequency.setTargetAtTime(hz,t,glide));VOWEL[vowel].forEach(([f,a],j)=>{fs[j][0].frequency.setTargetAtTime(f,t,.05);fs[j][1].gain.setTargetAtTime(a,t,.05)})},
    stop(t){oscs.forEach(o=>o.stop(t))}}}
// the chant playing: the line and the drone, scheduled a little ahead of time
function startChant(){const ac=audio();if(!ac)return null;const t0=ac.currentTime+.2,bus=ac.createGain();bus.gain.value=0;bus.gain.setTargetAtTime(1,t0,1.2);bus.connect(MU.verb);bus.connect(MU.dry);
  const line=choir(ac,bus,[-7,4,11,-2],.55),drone=choir(ac,bus,[-5,6],.22);drone.set(t0,degHz(-7),'o',.01);drone.env.gain.setTargetAtTime(1,t0,2);
  const score=chantScore();let p=0,next=t0+1;
  const tick=()=>{while(next<ac.currentTime+1.5){const ph=score[p++%score.length];line.env.gain.setTargetAtTime(1,next,.12);let t=next;
      for(const[deg,dur,v]of ph){line.set(t,degHz(deg),v,dur<.35?.025:.05);t+=dur}line.env.gain.setTargetAtTime(0,t-.25,.18);
      // the drone moves to the fifth now and then, and back
      drone.set(next,degHz(p%4==3?-3:-7),p%2?'u':'o',.8);next=t+1.4}};
  tick();const iv=setInterval(tick,400);
  return{stop(){clearInterval(iv);const t=ac.currentTime;bus.gain.setTargetAtTime(0,t,.8);setTimeout(()=>{line.stop(ac.currentTime);drone.stop(ac.currentTime);bus.disconnect()},4000)}}}
// ---- the sea at a harbour
function noiseBuf(ac,secs,brown){const n=ac.sampleRate*secs,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;d[i]=last*3.5}else d[i]=w}return b}
function startOcean(){const ac=audio();if(!ac)return null;const t0=ac.currentTime+.1,bus=ac.createGain();bus.gain.value=0;bus.gain.setTargetAtTime(1,t0,1.5);bus.connect(MU.out);
  const loop=(buf)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start(t0);return s};
  // the swell: deep brown noise through a low filter that opens as each wave builds
  const deep=loop(noiseBuf(ac,6,true)),lp=ac.createBiquadFilter(),swell=ac.createGain();lp.type='lowpass';lp.frequency.value=300;swell.gain.value=.15;deep.connect(lp);lp.connect(swell);swell.connect(bus);
  // the surf: bright noise, heard as each wave breaks and runs back
  const hiss=loop(noiseBuf(ac,3,false)),hp=ac.createBiquadFilter(),surf=ac.createGain();hp.type='bandpass';hp.frequency.value=2400;hp.Q.value=.6;surf.gain.value=0;hiss.connect(hp);hp.connect(surf);surf.connect(bus);
  const pan=(v)=>{const p=ac.createStereoPanner?ac.createStereoPanner():null;if(p){p.pan.value=v;p.connect(bus);return p}return bus};
  // a gull: a few falling cries
  const gull=(t)=>{const p=pan(Math.random()*1.6-.8),n=2+(Math.random()*3|0),base=1100+Math.random()*500;
    for(let k=0;k<n;k++){const st=t+k*(.32+Math.random()*.12),o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';f.type='bandpass';f.frequency.value=base*1.4;f.Q.value=3;
      o.frequency.setValueAtTime(base*1.25,st);o.frequency.exponentialRampToValueAtTime(base*.78,st+.26);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.05,st+.03);g.gain.exponentialRampToValueAtTime(.001,st+.28);
      o.connect(f);f.connect(g);g.connect(p);o.start(st);o.stop(st+.3)}};
  // the bell buoy: a struck bell, far off
  const bell=(t)=>{const p=pan(-.5+Math.random());for(const[r,a]of[[1,.04],[2.76,.018],[5.4,.008]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=392*r;g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.0005,t+3.2);o.connect(g);g.connect(p);o.start(t);o.stop(t+3.3)}};
  let wave=t0,cry=t0+3+Math.random()*5,clang=t0+6+Math.random()*6;
  const tick=()=>{const now=ac.currentTime;
    while(wave<now+2){const up=2.2+Math.random()*1.5,down=3+Math.random()*2,peak=.5+Math.random()*.35;
      swell.gain.setTargetAtTime(peak,wave,up/3);lp.frequency.setTargetAtTime(700+peak*700,wave,up/3);
      surf.gain.setTargetAtTime(peak*.32,wave+up*.8,.25);surf.gain.setTargetAtTime(0,wave+up+.4,down/3);
      swell.gain.setTargetAtTime(.12,wave+up,down/3);lp.frequency.setTargetAtTime(320,wave+up,down/3);wave+=up+down}
    if(cry<now+2){gull(cry);cry+=7+Math.random()*14}
    if(clang<now+2){bell(clang);if(Math.random()<.5)bell(clang+1.7+Math.random());clang+=9+Math.random()*10}};
  tick();const iv=setInterval(tick,400);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.8);setTimeout(()=>{deep.stop();hiss.stop();bus.disconnect()},4000)}}}
const TRACKS={chant:startChant,ocean:startOcean};
// which music belongs where you are (indoors, by the place the building stands in)
function musicFor(m){for(const k in MUSIC_AT)if(MUSIC_AT[k].includes(m))return k;return null}
// called every frame: start or fade the music for where you are
function musicTick(){const ok=MU.ac&&MU.ac.state=='running',want=!ok?null:typeof RADIO!='undefined'&&RADIO.on?'radio':MU.on?musicFor(P.m):null;if(want===MU.want)return;MU.want=want;
  if(MU.track){MU.track.stop();MU.track=null}if(want)MU.track=TRACKS[want]()}
// the first click or key press lets the page make sound
const wake=()=>{const ac=audio();if(ac&&ac.state!='running')ac.resume()};
addEventListener('pointerdown',wake,true);addEventListener('keydown',wake,true);
// the Music button
const musicBtn=document.getElementById('musicbtn');
function showMusicBtn(){musicBtn.setAttribute('aria-pressed',MU.on);musicBtn.textContent=MU.on?'♪ Music':'♪ Off'}
musicBtn.onclick=()=>{MU.on=!MU.on;try{localStorage.setItem('sarivalto-music',MU.on?'on':'off')}catch(e){}if(MU.out)MU.out.gain.setTargetAtTime(MU.on?1:0,MU.ac.currentTime,.3);showMusicBtn();musicBtn.blur()};
showMusicBtn();setInterval(musicTick,250);

// ---- The radio: Radio Sarivalto, wherever you are, while it's switched on (the Radio button, or Listen on your transistor radio;
// remembered in this browser). It plays instead of the place's own sounds. Songs are slow, misty instrumentals made as they play
// (a pad of chords, a soft bass, an electric piano picking out the chord with an echo), each in its own key and tempo; between
// them Kaisa, the DJ, back-announces the song, says something (the news, the weather, an advert, a dedication) and introduces the
// next. What she says shows in a caption, and is spoken in the browser's own voice where it has one. All of it comes through a
// radio's narrow speaker, with a little static.
const RADIO_SONGS=[['Northern Lights','The Frostholm Five'],['Harbour in the Fog','Lena Lumi'],['Kelp Cola Summer','The Saltwick Sound'],['Slow Train to Eastbrook','Mikko and the Mists'],
  ['Last Ferry Home','Aurora Band'],['Snowblind','The Ice Harbours'],['Waltz for the Old King','The Palace Strings'],['Midnight in Kingsgrad','Saara Vale'],['Lighthouse','Northbound'],
  ['Pine Forest Road','The Valto River Boys'],['Neon on the Snow','Frostholm Nights'],['September Rain','Ilse and the Islanders']];
const PROGS=[[[0,'m7'],[8,'maj7'],[3,'maj7'],[10,'6']],[[0,'maj7'],[9,'m7'],[5,'maj7'],[7,'6']],[[0,'m9'],[5,'m7'],[10,'maj7'],[3,'maj7']],[[0,'maj7'],[4,'m7'],[9,'m7'],[5,'maj7']]];
const CHORD={maj7:[0,4,7,11],m7:[0,3,7,10],'6':[0,4,7,9],m9:[0,3,7,10,14]};
const RADIO={on:false,cap:null};try{RADIO.on=localStorage.getItem('sarivalto-radio')=='on'}catch(e){}
const radioCap=document.getElementById('radiocap'),radioBtn=document.getElementById('radiobtn');
function radioSay(t){radioCap.hidden=!t;if(t)radioCap.innerHTML=`<small>&#128251; Radio Sarivalto</small>${esc(t)}`}
// what Kaisa says between songs
// (written to be said: contractions, pauses at commas, the odd "Right then")
function djLines(last,next){const pick=a=>a[Math.random()*a.length|0],when=NIGHT?'evening':'morning',out=[],[t,a]=next;
  const ord=d=>d+(d%10==1&&d!=11?'st':d%10==2&&d!=12?'nd':d%10==3&&d!=13?'rd':'th'),day=DAY<1?ord(31+DAY)+' of August':ord(DAY)+' of September';
  out.push(last?pick([`That was ${last[0]}, from ${last[1]}.`,`Mm, lovely. That was ${last[1]}, with ${last[0]}.`,`${last[0]}, there, by ${last[1]}. One of my favourites, that.`]):
    NIGHT?"Evening, everyone. It's Kaisa, keeping you company on Radio Sarivalto.":"Good morning, Sarivalto. You're listening to Radio Sarivalto, and I'm Kaisa.");
  if(last&&Math.random()<.5)out.push(`It's the ${day}, and ${NIGHT?"it's a cold one out there tonight":"it's a grey old morning out there"}.`);
  const head=HEADLINES[(DAY-1+(Math.random()*3|0)+HEADLINES.length)%HEADLINES.length].toLowerCase().replace(/^./,c=>c.toUpperCase()).replace(/:/g,',');
  const someone=pick(NPCS.filter(n=>n.home&&L[n.home])),where=NM[POS[someone.home]?someone.home:areaOf(someone.home)]||L[someone.home][0];
  out.push(pick([`Now, the news. ${head}. More on that later.`,
    pick(["Right then, the weather. More snow tonight over the North, I'm afraid, and a hard frost down by the harbours.","The weather, now. Clear skies over Kingsgrad, but the wind's getting up at sea, so take care out there, fishermen.",`There's fog rolling in off the water this ${when}. Take it slowly on those roads.`,"A bit of snow on the high road up to the monastery, but the mill road's open."]),
    pick(["Thirsty? There's nothing quite like the taste of the sea. Kelp Cola. The island, in a bottle.","Polar Burger, in Frostholm. The hottest thing north of the Arctic Circle.","Cold out there? The good people at Flannel and Folk, in Eastbrook, have a warm shirt for every fisherman.","The pizzeria in Kingsgrad's open till late, tonight. Tell them Kaisa sent you."]),
    `I've got a request here, for ${someone.name}, in ${where}. Someone out there's thinking of you.`,
    "The palace has asked for a little quiet in Kingsgrad this week, while the island mourns its king."]));
  out.push(pick([`Here's ${t}, by ${a}.`,`Let's keep things nice and slow. This is ${a}, with ${t}.`,`Right then. Here's ${t}.`]));return out}
// Kaisa speaking, line by line, with what she says in the caption; then done(). With a natural-sounding voice in the browser (the
// "Natural" ones in Edge, Google's in Chrome) she speaks the words, at her own pitch and an easy pace; with only the old robotic
// ones, she's heard as an indistinct voice through the radio (mouth: the murmur, from startRadio), and the caption has her words.
const NATURAL=/natural|online|google|premium|enhanced|siri/i;
function djVoice(){const vs=window.speechSynthesis?speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)):[],fem=/female|libby|sonia|maisie|hazel|susan|aria|jenny|emma|ava|ana|michelle|zira|samantha|karen|serena|kate/i;
  return vs.find(v=>NATURAL.test(v.name)&&/en-GB/i.test(v.lang)&&fem.test(v.name))||vs.find(v=>NATURAL.test(v.name)&&fem.test(v.name))||vs.find(v=>/Google UK English Female/i.test(v.name))||vs.find(v=>NATURAL.test(v.name))||null}
function djTalk(lines,done,mouth){let i=0;const voice=djVoice();
  const next=()=>{if(!RADIO.playing)return;if(i>=lines.length){done();return}const t=lines[i++];radioSay('Kaisa: '+t);
    if(voice){const u=new SpeechSynthesisUtterance(t);u.voice=voice;u.rate=.94+Math.random()*.06;u.pitch=1;u.volume=.9;let fin=false;const go=()=>{if(!fin){fin=true;setTimeout(next,380+Math.random()*250)}};
      u.onend=go;u.onerror=go;speechSynthesis.speak(u);setTimeout(go,t.length*95+3000)}
    else setTimeout(next,(mouth?mouth(t):1.8+t.length*.055)*1000+420)};next()}
// one song, scheduled chord by chord a little ahead: pad, bass, electric piano
function startRadio(){const ac=audio();if(!ac)return null;const out=ac.createGain();out.gain.value=0;out.gain.setTargetAtTime(.9,ac.currentTime,.6);
  // the radio's speaker: no deep bass, no sparkle, a little crackle
  const hp=ac.createBiquadFilter(),lp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=140;lp.type='lowpass';lp.frequency.value=4200;hp.connect(lp);lp.connect(out);out.connect(ac.destination);
  const crackle=ac.createBufferSource(),cg=ac.createGain(),cb=ac.createBiquadFilter();crackle.buffer=noiseBuf(ac,2,false);crackle.loop=true;cb.type='bandpass';cb.frequency.value=3000;cg.gain.value=.012;crackle.connect(cb);cb.connect(cg);cg.connect(out);crackle.start();
  const echo=ac.createDelay(1),fb=ac.createGain();fb.gain.value=.35;echo.connect(fb);fb.connect(echo);echo.connect(hp);
  RADIO.playing=true;let song=null,last=null,chord=0,nextT=0,mode='dj',iv=0;
  const hz=(semi)=>220*2**(semi/12);
  const chordAt=(t,root,q,dur,bpm)=>{
    // the pad: the chord in detuned saws through a soft filter, swelling in and out
    const pf=ac.createBiquadFilter(),pg=ac.createGain();pf.type='lowpass';pf.frequency.value=700;pf.frequency.linearRampToValueAtTime(1400,t+dur*.5);pf.frequency.linearRampToValueAtTime(800,t+dur);
    pg.gain.setValueAtTime(0,t);pg.gain.linearRampToValueAtTime(.05,t+1.2);pg.gain.setValueAtTime(.05,t+dur-.6);pg.gain.linearRampToValueAtTime(0,t+dur+1.2);pf.connect(pg);pg.connect(hp);
    CHORD[q].slice(0,4).forEach(iv=>{for(const det of[-8,7]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(root+iv-12);o.detune.value=det;o.connect(pf);o.start(t);o.stop(t+dur+1.4)}});
    // the bass: the root, on the first and third beats
    const beat=60/bpm;for(let b=0;b<dur/beat;b+=2){const o=ac.createOscillator(),g=ac.createGain(),st=t+b*beat;o.type='triangle';o.frequency.value=hz(root-24);g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.18,st+.04);g.gain.exponentialRampToValueAtTime(.001,st+beat*1.8);o.connect(g);g.connect(hp);o.start(st);o.stop(st+beat*2)}
    // the electric piano: notes of the chord on the off-beats, now and then, echoing
    for(let b=0;b<dur/beat*2;b++){if(Math.random()<.45)continue;const st=t+b*beat/2,n=CHORD[q][Math.random()*CHORD[q].length|0]+12*(Math.random()<.4?1:0),f=hz(root+n);
      for(const[r,a]of[[1,.07],[2,.025],[3.9,.008]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*r;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(a,st+.01);g.gain.exponentialRampToValueAtTime(.0005,st+1.6/r);o.connect(g);g.connect(hp);g.connect(echo);o.start(st);o.stop(st+1.7)}}};
  const newSong=()=>{const[title,artist]=RADIO_SONGS[Math.random()*RADIO_SONGS.length|0],prog=PROGS[Math.random()*PROGS.length|0],bpm=70+Math.random()*24|0;
    return{title,artist,prog,bpm,key:[-5,-2,0,3,5][Math.random()*5|0],chords:prog.length*(3+(Math.random()*2|0))}};
  const tick=()=>{if(mode!='song')return;while(nextT<ac.currentTime+2&&chord<song.chords){const[r,q]=song.prog[chord%song.prog.length],dur=8*60/song.bpm;chordAt(nextT,song.key+r,q,dur,song.bpm);nextT+=dur;chord++}
    if(chord>=song.chords&&ac.currentTime>nextT){mode='dj';last=[song.title,song.artist];talk()}};
  const play=()=>{mode='song';chord=0;nextT=ac.currentTime+.3;radioSay(`♪ ${song.title} — ${song.artist}`);tick()};
  // Kaisa heard through the radio, her words not quite made out: a woman's voice, a syllable at a time (a vowel each, from VOWEL),
  // her pitch rising and falling and settling at the end of a sentence, pausing at commas and full stops; returns how long it lasts
  const murmur=text=>{const t0=ac.currentTime+.05,o=ac.createOscillator(),vib=ac.createOscillator(),vg=ac.createGain(),g=ac.createGain();o.type='sawtooth';vib.frequency.value=5.2;vg.gain.value=6;vib.connect(vg);vg.connect(o.detune);
    const fs=[0,1,2].map(()=>{const f=ac.createBiquadFilter(),fg=ac.createGain();f.type='bandpass';f.Q.value=8;o.connect(f);f.connect(fg);fg.connect(g);return[f,fg]});g.gain.value=0;g.connect(hp);
    const vs=Object.keys(VOWEL);let tt=t0,k=0;
    for(const sent of text.split(/(?<=[.!?])\s+/)){const words=sent.split(/\s+/);words.forEach((w,wi)=>{const syl=Math.max(1,(w.match(/[aeiouy]+/gi)||[]).length),fall=wi/Math.max(1,words.length-1);
      for(let s=0;s<syl;s++){const d=.12+Math.random()*.07,f0=205*(1+.07*Math.sin(k++*1.3))*(1.06-.16*fall),v=vs[Math.random()*vs.length|0];
        o.frequency.setTargetAtTime(f0,tt,.03);VOWEL[v].forEach(([f,amp],j)=>{fs[j][0].frequency.setTargetAtTime(f*1.12,tt,.02);fs[j][1].gain.setTargetAtTime(amp,tt,.02)});
        g.gain.setTargetAtTime(.16,tt,.015);g.gain.setTargetAtTime(.03,tt+d*.75,.02);tt+=d}
      g.gain.setTargetAtTime(.01,tt,.02);tt+=/,$/.test(w)?.2:.04});g.gain.setTargetAtTime(0,tt,.03);tt+=.38}
    o.start(t0);vib.start(t0);o.stop(tt+.2);vib.stop(tt+.2);return tt-t0};
  const talk=()=>{song=newSong();djTalk(djLines(last,[song.title,song.artist]),()=>play(),murmur)};
  talk();iv=setInterval(tick,300);
  return{stop(){RADIO.playing=false;clearInterval(iv);if(window.speechSynthesis)speechSynthesis.cancel();radioSay('');out.gain.setTargetAtTime(0,ac.currentTime,.4);setTimeout(()=>{crackle.stop();out.disconnect()},2500)}}}
TRACKS.radio=startRadio;
function showRadioBtn(){radioBtn.setAttribute('aria-pressed',RADIO.on);radioBtn.innerHTML=RADIO.on?'&#128251; Radio on':'&#128251; Radio'}
function toggleRadio(){RADIO.on=!RADIO.on;try{localStorage.setItem('sarivalto-radio',RADIO.on?'on':'off')}catch(e){}showRadioBtn();return RADIO.on?'You switch on the radio. Radio Sarivalto crackles into life.':'You switch the radio off.'}
radioBtn.onclick=()=>{toggleRadio();radioBtn.blur()};showRadioBtn();
