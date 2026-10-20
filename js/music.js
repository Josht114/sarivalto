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
// (where each piece plays, MUSIC_AT, and its name, TRACK_INFO, are in js/data.js)
// vol: the master volume (0 to 1, the Options tab's slider), which the music, the place sounds and the radio all go through
const MU={ac:null,on:true,vol:1,track:null,out:null,master:null,want:null};
try{MU.on=localStorage.getItem('sarivalto-music')!='off';const v=parseFloat(localStorage.getItem('sarivalto-volume'));if(v>=0&&v<=1)MU.vol=v}catch(e){}
function setVolume(v){MU.vol=Math.max(0,Math.min(1,v));try{localStorage.setItem('sarivalto-volume',String(MU.vol))}catch(e){}if(MU.master)MU.master.gain.setTargetAtTime(MU.vol,MU.ac.currentTime,.05)}
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
  MU.master=ac.createGain();MU.master.gain.value=MU.vol;MU.master.connect(ac.destination);
  MU.out=ac.createGain();MU.out.gain.value=MU.on?1:0;MU.out.connect(MU.master);
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
// The Midnight Note: a jazz quartet playing a medium swing in F, round and round a 32-bar tune (A A B A) of ii-V-I changes.
// The bass walks: the root on the first beat of each bar, chord tones on the next two, and on the fourth a note a semitone from
// the next root, leading into it. The drummer keeps the ride cymbal's swing ("ding, ding-a ding, ding-a"), the hi-hat on two
// and four, and a soft brushed snare. The piano comps: chords voiced without their roots, struck on the off-beats. Now and then
// a breathy tenor sax improvises a phrase from the chord's notes, then lays out. All in a small club's echo.
const JAZZ_A=[[55,'m7'],[48,'7'],[53,'maj7'],[50,'7'],[55,'m7'],[48,'7'],[57,'m7'],[50,'7']],JAZZ_B=[[58,'maj7'],[51,'7'],[57,'m7'],[50,'7'],[55,'m7'],[48,'7'],[53,'maj7'],[48,'7']];
const JAZZ_FORM=[...JAZZ_A,...JAZZ_A,...JAZZ_B,...JAZZ_A],JV={m7:[3,7,10,14],'7':[4,10,14,21],maj7:[4,7,11,14]},JT={m7:[0,3,7,10],'7':[0,4,7,10],maj7:[0,4,7,11]};
const mtof=m=>440*2**((m-69)/12);
function startJazz(){const ac=audio();if(!ac)return null;const t0=ac.currentTime+.3,bus=ac.createGain();bus.gain.value=0;bus.gain.setTargetAtTime(.8,t0,1);bus.connect(MU.out);
  // the club: a short, warm echo
  const room=ac.createConvolver(),n=ac.sampleRate*.9|0,ir=ac.createBuffer(2,n,ac.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)*.5}
  room.buffer=ir;const wet=ac.createGain();wet.gain.value=.28;room.connect(wet);wet.connect(bus);
  const send=(node,amt=1)=>{node.connect(bus);if(amt){const g=ac.createGain();g.gain.value=amt;node.connect(g);g.connect(room)}};
  const noise=noiseBuf(ac,1,false),bpm=126,beat=60/bpm,sw=beat*2/3;
  // the bass: a plucked, round tone
  const bass=(t,m)=>{const o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='triangle';o2.type='sine';o.frequency.value=o2.frequency.value=mtof(m);o2.frequency.value*=2;
    f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(260,t+beat*.9);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.32,t+.012);g.gain.exponentialRampToValueAtTime(.06,t+beat*.8);g.gain.linearRampToValueAtTime(0,t+beat*.98);
    const g2=ac.createGain();g2.gain.value=.25;o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);send(g,.15);for(const x of[o,o2]){x.start(t);x.stop(t+beat)}};
  // the drums: ride cymbal, hi-hat, brushes
  const hit=(t,freq,q,lvl,dec,pan=0)=>{const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(lvl,t);g.gain.exponentialRampToValueAtTime(.0008,t+dec);s.connect(f);f.connect(g);let out=g;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan;g.connect(p);out=p}send(out,.2);s.start(t,Math.random()*.5);s.stop(t+dec+.05)};
  const ride=(t,l)=>{hit(t,7200,2.5,.06*l,1.1,.35);const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=5180;g.gain.setValueAtTime(.006*l,t);g.gain.exponentialRampToValueAtTime(.0004,t+.9);o.connect(g);send(g,.1);o.start(t);o.stop(t+1)};
  // the piano: a struck chord, each note with a couple of overtones, dying away
  const piano=(t,notes,lvl,dur)=>{for(const m of notes)for(const[r,a]of[[1,1],[2,.35],[3,.12],[4.02,.05]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=mtof(m)*r;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl*a,t+.006);g.gain.exponentialRampToValueAtTime(lvl*a*.25,t+.25);g.gain.exponentialRampToValueAtTime(.0003,t+dur);
    let out=g;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=-.3;g.connect(p);out=p}o.connect(g);send(out,.35);o.start(t);o.stop(t+dur+.05)}};
  // the sax: a reedy tone, breathy at the start of each note, the filter opening as it's blown, with a little vibrato on long notes
  const sax=(t,m,dur,acc)=>{const o=ac.createOscillator(),o2=ac.createOscillator(),vib=ac.createOscillator(),vg=ac.createGain(),f=ac.createBiquadFilter(),g=ac.createGain();
    o.type='sawtooth';o2.type='square';o.frequency.value=o2.frequency.value=mtof(m);o2.detune.value=6;vib.frequency.value=5.6;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(dur>.4?14:3,t+dur);vib.connect(vg);vg.connect(o.detune);vg.connect(o2.detune);
    f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(700,t);f.frequency.linearRampToValueAtTime(acc?2600:1900,t+.06);f.frequency.linearRampToValueAtTime(1300,t+dur);
    const lv=acc?.07:.05;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lv,t+.035);g.gain.setValueAtTime(lv*.85,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur);
    const g2=ac.createGain();g2.gain.value=.3;o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);
    const br=ac.createBufferSource(),bf=ac.createBiquadFilter(),bg=ac.createGain();br.buffer=noise;bf.type='bandpass';bf.frequency.value=mtof(m)*3;bf.Q.value=1;bg.gain.setValueAtTime(.025,t);bg.gain.exponentialRampToValueAtTime(.001,t+.12);br.connect(bf);bf.connect(bg);bg.connect(g);
    let out=g;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=.25;g.connect(p);out=p}send(out,.45);for(const x of[o,o2,vib])x.start(t),x.stop(t+dur+.05);br.start(t,Math.random()*.5);br.stop(t+.15)};
  let bar=0,next=t0,solo=0;
  const playBar=t=>{const[r,q]=JAZZ_FORM[bar%JAZZ_FORM.length],[nr]=JAZZ_FORM[(bar+1)%JAZZ_FORM.length],tones=JT[q];
    // walking bass: root, two chord tones, then a semitone into the next root
    const lo=m=>{while(m>45)m-=12;while(m<36)m+=12;return m},nxt=lo(nr);
    [lo(r),lo(r+tones[1+(Math.random()*2|0)]),lo(r+tones[2]),nxt+(Math.random()<.5?1:-1)].forEach((m,b)=>bass(t+b*beat,m));
    // ride: every beat, with the swung skip before two and four; hi-hat foot on two and four; brushes stirring now and then
    for(let b=0;b<4;b++){ride(t+b*beat,b%2?1:.8);if(b%2==0)ride(t+b*beat+sw,.55);if(b%2)hit(t+b*beat,9000,1.5,.03,.06,-.2);if(Math.random()<.3)hit(t+b*beat+sw,1800,.7,.025,.18,0)}
    // piano: two or three rootless chords on the off-beats
    const voic=JV[q].map(i=>{let m=r+i;while(m>70)m-=12;while(m<56)m+=12;return m});
    const spots=[[0,1.67,3],[1.67,3.67],[.67,2,3.67],[0,2.67]][Math.random()*4|0];for(const sp of spots)piano(t+sp*beat,voic,.028,sp%1?beat*1.2:beat*1.8);
    // the sax: a phrase every other four bars or so, chord tones and steps between them, in swung eighths with a long note at the end
    if(bar%4==0)solo=Math.random()<.55?4:0;
    if(solo>0){solo--;let tt=t+(Math.random()<.5?0:beat),m=r+12+tones[Math.random()*4|0];while(m<62)m+=12;while(m>76)m-=12;const end=t+beat*4-.05;
      while(tt<end-beat*.4){const long=Math.random()<.18,d=long?beat*1.5:((Math.round((tt-t)/beat*3)%3==0)?sw:beat-sw);
        sax(tt,m,Math.min(d*.95,end-tt),Math.random()<.3);tt+=d;if(Math.random()<.12)tt+=beat-sw;
        const step=[-2,-1,1,2,3,-3,4,-4][Math.random()*8|0];m+=step;const pc=((m-r)%12+12)%12;if(!tones.includes(pc)&&Math.random()<.5)m+=pc>6?1:-1;while(m<62)m+=12;while(m>78)m-=12}}
    bar++};
  const tick=()=>{while(next<ac.currentTime+1.2){playBar(next);next+=beat*4}};tick();const iv=setInterval(tick,300);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.8);setTimeout(()=>bus.disconnect(),4000)}}}
// shared bits for the tracks below: a bus fading in to level, a pannable output, and a short noise hit through a filter
function trackBus(ac,level){const t0=ac.currentTime+.2,bus=ac.createGain();bus.gain.value=0;bus.gain.setTargetAtTime(level,t0,.6);bus.connect(MU.out);return[bus,t0]}
const panTo=(ac,node,dest,v)=>{if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=v;node.connect(p);p.connect(dest)}else node.connect(dest)};
function noiseHit(ac,dest,t,type,freq,q,lvl,dec,pan=0,buf){const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;f.type=type;f.frequency.value=freq;f.Q.value=q;
  g.gain.setValueAtTime(lvl,t);g.gain.exponentialRampToValueAtTime(.0005,t+dec);s.connect(f);f.connect(g);panTo(ac,g,dest,pan);s.start(t,Math.random()*.5);s.stop(t+dec+.05)}
// a short note: an oscillator (or a periodic wave) with a quick attack and a decay or a hold, panned
function blip(ac,dest,t,wave,f,dur,lvl,pan=0,slide){const o=ac.createOscillator(),g=ac.createGain();if(typeof wave=='string')o.type=wave;else o.setPeriodicWave(wave);
  o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+.005);g.gain.setValueAtTime(lvl,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(g);panTo(ac,g,dest,pan);o.start(t);o.stop(t+dur+.02)}

// The Arcade: an upbeat chiptune in A minor at 144 beats a minute, the way the cabinets' own music sounds. A thin pulse-wave lead
// plays a tune made from the chord's notes (the same tune each time round, with a variation on the repeat), a triangle bass bubbles
// in octaves, and noise makes the drums: kick, snare on two and four, hi-hats. Over it, from the machines all round the hall,
// coins dropping, lasers, jumps and explosions, from one side or the other.
function startArcade(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,.9),noise=noiseBuf(ac,1,false),st=60/144/4;
  const pulse=(duty)=>{const n=32,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*duty);return ac.createPeriodicWave(re,im)},p25=pulse(.25),p12=pulse(.125);
  const PROG=[[57,[0,3,7]],[53,[0,4,7]],[48,[0,4,7]],[55,[0,4,7]]],r=rng(42);
  // the tune: 4 bars of 16 steps, a note on most eighths from the chord (an octave up), rests and the odd held note
  const tune=PROG.map(([root,ch])=>Array.from({length:16},(_,i)=>i%2&&r()<.6?null:r()<.15?null:root+24+[...ch,12][r()*4|0]+(r()<.2?12:0)));
  let step=0,next=t0;
  const sfx=t=>{const pan=r()*1.6-.8,k=r();
    if(k<.3){blip(ac,bus,t,p25,988,.07,.05,pan);blip(ac,bus,t+.08,p25,1319,.18,.05,pan)}                                 // a coin
    else if(k<.55)blip(ac,bus,t,p12,1600,.25,.04,pan,180);                                                                   // a laser
    else if(k<.75)blip(ac,bus,t,'square',220,.22,.04,pan,880);                                                               // a jump
    else noiseHit(ac,bus,t,'lowpass',1200,.5,.18,.7,pan,noise)};                                                           // an explosion
  let fx=t0+2;
  const tick=()=>{while(next<ac.currentTime+.8){const bar=(step>>4)%4,i=step%16,[root,ch]=PROG[bar],second=(step>>6)%2;
      let m=tune[bar][i];if(second&&m&&i%4==2)m+=ch[1]==3?3:4;                                                                // the repeat's variation
      if(m)blip(ac,bus,next,p25,mtof(m),st*(tune[bar][i+1]===null?1.8:.9),.06,.1);
      if(i%2==0)blip(ac,bus,next,'triangle',mtof(root-12+(i%4?12:0)),st*1.8,.16);                                              // the bass, in octaves
      if(i%8==0)blip(ac,bus,next,'sine',150,.12,.3,0,40);if(i%8==4)noiseHit(ac,bus,next,'bandpass',2000,.8,.12,.12,0,noise);     // kick, snare
      if(i%2==0)noiseHit(ac,bus,next,'highpass',8000,.7,.04,.04,.2,noise);
      next+=st;step++}
    while(fx<ac.currentTime+.8){sfx(fx);fx+=1.5+r()*4}};
  tick();const iv=setInterval(tick,200);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.5);setTimeout(()=>bus.disconnect(),3000)}}}

// The shops: the murmur of customers rising and falling, footsteps crossing the floor, the till ringing up a sale (a ding and
// its drawer) every so often, the door's chime now and then, and very quiet music in the background.
function startShop(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,2.8),noise=noiseBuf(ac,1,false),r=Math.random;
  const mur=ac.createBufferSource(),mf=ac.createBiquadFilter(),mg=ac.createGain();mur.buffer=noiseBuf(ac,4,true);mur.loop=true;mf.type='bandpass';mf.frequency.value=480;mf.Q.value=.8;mg.gain.value=.05;
  mur.connect(mf);mf.connect(mg);mg.connect(bus);mur.start(t0);
  const ding=t=>{for(const[f,a]of[[2093,.03],[1568,.02],[4186,.006]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.0003,t+1.2);o.connect(g);g.connect(bus);o.start(t);o.stop(t+1.3)}
    noiseHit(ac,bus,t+.15,'lowpass',500,.6,.08,.35,.3,noise)};
  const chime=t=>{[[1318.5,0],[1046.5,.35]].forEach(([f,dt])=>{for(const[rr,a]of[[1,.03],[2.4,.008]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*rr;g.gain.setValueAtTime(a,t+dt);g.gain.exponentialRampToValueAtTime(.0004,t+dt+1.6);o.connect(g);panTo(ac,g,bus,-.6);o.start(t+dt);o.stop(t+dt+1.7)}})};
  const steps=t=>{const n=3+(r()*5|0),pan=r()*1.4-.7,gap=.42+r()*.12;for(let k=0;k<n;k++)noiseHit(ac,bus,t+k*gap,'bandpass',1300+r()*400,1.5,.025,.07,pan+k*.05,noise)};
  // the background music: soft chords on an electric piano, a long way off
  const CH=[[60,[0,4,7,11]],[57,[0,3,7,10]],[53,[0,4,7,11]],[55,[0,4,7,10]]];let ci=0,cnext=t0,tw=t0+1,td=t0+12+r()*12,tc=t0+20+r()*20,ts=t0+3;
  const tick=()=>{const now=ac.currentTime;
    if(tw<now+1){mg.gain.setTargetAtTime(.03+r()*.04,tw,.6);tw+=.7+r()*.8}
    while(cnext<now+1){const[root,ch]=CH[ci++%4];for(const iv of ch)blip(ac,bus,cnext+r()*.03,'sine',mtof(root+iv),3.6,.006,0);cnext+=4}
    if(td<now+1){ding(td);td+=18+r()*20}if(tc<now+1){chime(tc);tc+=25+r()*30}if(ts<now+1){steps(ts);ts+=3+r()*6}};
  tick();const iv=setInterval(tick,300);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>{mur.stop();bus.disconnect()},3000)}}}

// The pizzeria: an Italian waltz in C, about 168 beats a minute. A musette accordion (reeds tuned a little apart, so they shimmer)
// carries the tune over a mandolin trembling on the chord on the second and third beats, and a bass on the first: oom-pah-pah.
// The tune is made from the chord's notes and steps between them, the same each time round (A A B A).
function startPizzeria(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,1.8),beat=60/168,r=rng(11);
  const C=[60,[0,4,7]],G7=[55,[0,4,7,10]],F=[53,[0,4,7]],Am=[57,[0,3,7]],D7=[50,[0,4,7,10]];
  const A=[C,C,G7,G7,G7,G7,C,C],B=[F,F,C,C,D7,D7,G7,G7],FORM=[...A,...A,...B,...A];
  // the tune for each 8-bar section: three notes a bar, sometimes a long note instead
  const make=sec=>sec.map(([root,ch],bi)=>{const end=bi==7;if(end)return[[root+12,3]];const out=[];let left=3;while(left>0){const d=left==3&&r()<.3?2:1;out.push([root+12+[...ch,12][r()*(ch.length+1)|0]+(r()<.25?(r()<.5?2:-1):0),d]);left-=d}return out});
  const tuneA=make(A),tuneB=make(B),TUNE=[...tuneA,...tuneA,...tuneB,...tuneA];
  const acc=(t,m,dur)=>{const g=ac.createGain(),f=ac.createBiquadFilter(),trem=ac.createOscillator(),tg=ac.createGain();f.type='bandpass';f.frequency.value=1400;f.Q.value=.7;
    trem.frequency.value=6;tg.gain.value=.012;trem.connect(tg);tg.connect(g.gain);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.04);g.gain.setValueAtTime(.045,t+dur-.06);g.gain.linearRampToValueAtTime(0,t+dur);
    const os=[[-14,'sawtooth'],[0,'square'],[13,'sawtooth']].map(([det,ty])=>{const o=ac.createOscillator();o.type=ty;o.frequency.value=mtof(m);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+dur+.05);return o});
    f.connect(g);panTo(ac,g,bus,.2);trem.start(t);trem.stop(t+dur+.05)};
  const mando=(t,notes,dur)=>{for(let k=0;k<dur/.07;k++)for(const m of notes){const o=ac.createOscillator(),g=ac.createGain(),tt=t+k*.07+Math.random()*.008;o.type='triangle';o.frequency.value=mtof(m)*2;
    g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.022,tt+.004);g.gain.exponentialRampToValueAtTime(.001,tt+.09);o.connect(g);panTo(ac,g,bus,-.35);o.start(tt);o.stop(tt+.1)}};
  const bass=(t,m)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=mtof(m);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.28,t+.01);g.gain.exponentialRampToValueAtTime(.01,t+beat*.9);o.connect(g);g.connect(bus);o.start(t);o.stop(t+beat)};
  let bar=0,next=t0;
  const tick=()=>{while(next<ac.currentTime+1){const i=bar%FORM.length,[root,ch]=FORM[i];let lo=root-12;while(lo>48)lo-=12;
      bass(next,lo);const voicing=ch.slice(1,3).map(iv=>root+iv);mando(next+beat,voicing,beat*.9);mando(next+beat*2,voicing,beat*.9);
      let tt=next;for(const[m,d]of TUNE[i]){acc(tt,m,d*beat*.96);tt+=d*beat}
      next+=beat*3;bar++}};
  tick();const iv=setInterval(tick,300);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}
const TRACKS={chant:startChant,ocean:startOcean,jazz:startJazz,arcade:startArcade,shop:startShop,pizzeria:startPizzeria};
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
  const head=HEADLINES[((DAY-1+(Math.random()*3|0))%HEADLINES.length+HEADLINES.length)%HEADLINES.length].toLowerCase().replace(/^./,c=>c.toUpperCase()).replace(/:/g,',');
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
// browsers load their voices after the page, so look again when they arrive
let DJV=null;const findVoice=()=>{DJV=djVoice()};if(window.speechSynthesis){findVoice();speechSynthesis.addEventListener?.('voiceschanged',findVoice)}
// how Kaisa says a line: brighter for a greeting, an advert or a song she's about to play, calmer for the news
const mood=t=>/^(good morning|evening|hello)|kelp cola|polar burger|tell them|here's|let's keep/i.test(t)?{pitch:1.08,rate:1.02}:/^now, the news|the palace|mourns/i.test(t)?{pitch:.98,rate:.95}:{pitch:1.03,rate:.99};
function djTalk(lines,done,mouth){let i=0;const voice=DJV||djVoice();
  const next=()=>{if(!RADIO.playing)return;if(i>=lines.length){done();return}const t=lines[i++];radioSay('Kaisa: '+t);
    if(voice){// one sentence at a time, each a touch different in pitch and pace, a question rising, a short breath between them
      const sents=t.split(/(?<=[.!?])\s+/).filter(Boolean),m=mood(t);let k=0,fin=false;
      const end=()=>{if(!fin){fin=true;setTimeout(next,450+Math.random()*250)}};
      const say=()=>{if(!RADIO.playing)return;if(k>=sents.length){end();return}const st=sents[k++],u=new SpeechSynthesisUtterance(st);u.voice=voice;
        u.pitch=Math.max(.5,m.pitch+(Math.random()-.5)*.06+(/\?$/.test(st)?.05:0));u.rate=m.rate+(Math.random()-.5)*.05;u.volume=.92*MU.vol;
        let done1=false;const go=()=>{if(!done1){done1=true;setTimeout(say,180+Math.random()*180)}};u.onend=go;u.onerror=go;speechSynthesis.speak(u);setTimeout(go,st.length*90+2500)};
      say();setTimeout(end,t.length*100+6000)}
    else setTimeout(next,(mouth?mouth(t):1.8+t.length*.055)*1000+420)};next()}
// one song, scheduled chord by chord a little ahead: pad, bass, electric piano
function startRadio(){const ac=audio();if(!ac)return null;const out=ac.createGain();out.gain.value=0;out.gain.setTargetAtTime(.9,ac.currentTime,.6);
  // the radio's speaker: no deep bass, no sparkle, a little crackle
  const hp=ac.createBiquadFilter(),lp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=140;lp.type='lowpass';lp.frequency.value=4200;hp.connect(lp);lp.connect(out);out.connect(MU.master||ac.destination);
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
  // Kaisa heard through the radio, her words not quite made out: a woman's voice that follows the words as written. Each syllable
  // takes its vowel from the word (a, e, i, o, u; y as i), and begins with its consonant: a hiss for s, f, h and th, a short pop for
  // p, t, k, b, d and g, a hum for m and n. Her voice is a little breathy and never quite steady; a stressed syllable is a touch
  // louder and higher; her pitch drifts down through a sentence and falls at its end (or rises, on a question), with a pause at
  // each comma and full stop. Returns how long it lasts.
  const murmur=text=>{const t0=ac.currentTime+.05,o=ac.createOscillator(),vib=ac.createOscillator(),vg=ac.createGain(),voiced=ac.createGain(),g=ac.createGain();
    o.type='sawtooth';vib.frequency.value=5.4;vg.gain.value=7;vib.connect(vg);vg.connect(o.detune);o.connect(voiced);
    // breath: soft noise through the same mouth, under the voice; consonants: noise through their own filter
    const br=ac.createBufferSource(),brg=ac.createGain();br.buffer=noiseBuf(ac,2,false);br.loop=true;brg.gain.value=.05;br.connect(brg);
    const cons=ac.createBufferSource(),cf=ac.createBiquadFilter(),cg=ac.createGain();cons.buffer=noiseBuf(ac,2,false);cons.loop=true;cf.type='bandpass';cf.Q.value=1.5;cg.gain.value=0;cons.connect(cf);cf.connect(cg);cg.connect(hp);
    const fs=[0,1,2].map(()=>{const f=ac.createBiquadFilter(),fg=ac.createGain();f.type='bandpass';f.Q.value=7;voiced.connect(f);brg.connect(f);f.connect(fg);fg.connect(g);return[f,fg]});
    g.gain.value=0;g.connect(hp);
    let tt=t0;const sents=text.split(/(?<=[.!?])\s+/);
    for(const sent of sents){const q=/\?$/.test(sent),words=sent.split(/\s+/).filter(Boolean),sylls=[];
      words.forEach((w,wi)=>{const lw=w.toLowerCase().replace(/[^a-z]/g,''),parts=lw.match(/[^aeiouy]*[aeiouy]+/g)||[lw||'a'];
        parts.forEach((p,pi)=>{const v=(p.match(/[aeiouy]+/)||['a'])[0],on=p.replace(/[aeiouy]+$/,'');sylls.push({v:v[0]=='y'?'i':v[0],on,stress:pi==0&&lw.length>3,last:pi==parts.length-1,comma:pi==parts.length-1&&/[,;:]$/.test(w)})})});
      sylls.forEach((sy,k)=>{const fall=k/Math.max(1,sylls.length-1),d=(sy.stress?.17:.13)+Math.random()*.05,end=k>=sylls.length-2;
        let f0=212*(1.07-.14*fall)*(sy.stress?1.07:1)*(1+(Math.random()-.5)*.03);if(end)f0*=q?1.14+.06*(k-sylls.length+2):.9;
        // the consonant
        const c=sy.on.slice(-1);if(c){const fric=/[sfhzvcx]/.test(sy.on)||/th|sh|ch/.test(sy.on),plos=/[ptkbdgq]/.test(c),nas=/[mn]/.test(c);
          if(fric){cf.frequency.setValueAtTime(/s|z|c|x/.test(sy.on)?5200:/sh|ch/.test(sy.on)?3000:1800,tt);cg.gain.setTargetAtTime(.09,tt,.008);cg.gain.setTargetAtTime(0,tt+.06,.012);tt+=.06}
          else if(plos){g.gain.setTargetAtTime(0,tt,.006);cf.frequency.setValueAtTime(/[pb]/.test(c)?900:/[td]/.test(c)?3500:1800,tt+.02);cg.gain.setValueAtTime(.12,tt+.02);cg.gain.setTargetAtTime(0,tt+.025,.008);tt+=.04}
          else if(nas){fs.forEach(([f,fg],j)=>{f.frequency.setTargetAtTime([280,1200,2500][j],tt,.01);fg.gain.setTargetAtTime(j?.08:.6,tt,.01)});o.frequency.setTargetAtTime(f0,tt,.02);g.gain.setTargetAtTime(.08,tt,.01);tt+=.05}}
        // the vowel
        o.frequency.setTargetAtTime(f0,tt,.03);VOWEL[sy.v].forEach(([f,amp],j)=>{fs[j][0].frequency.setTargetAtTime(f*1.12,tt,.025);fs[j][1].gain.setTargetAtTime(amp,tt,.02)});
        g.gain.setTargetAtTime(sy.stress?.19:.15,tt,.015);g.gain.setTargetAtTime(.03,tt+d*.78,.025);tt+=d;
        if(sy.last){g.gain.setTargetAtTime(.008,tt,.02);tt+=sy.comma?.24:.035}});
      g.gain.setTargetAtTime(0,tt,.035);tt+=.42}
    for(const n of[o,vib,br,cons]){n.start(t0);n.stop(tt+.2)}return tt-t0};
  // the station's chime before a break, and a soft bed of music under her voice
  const chime=()=>{const t=ac.currentTime+.05;[[0,659.3],[.22,830.6],[.44,987.8],[.7,1318.5]].forEach(([dt,f])=>{for(const[r,a]of[[1,.06],[2.01,.02],[3,.008]]){const o=ac.createOscillator(),gg=ac.createGain();
      o.frequency.value=f*r;gg.gain.setValueAtTime(0,t+dt);gg.gain.linearRampToValueAtTime(a,t+dt+.01);gg.gain.exponentialRampToValueAtTime(.0005,t+dt+1.4);o.connect(gg);gg.connect(hp);gg.connect(echo);o.start(t+dt);o.stop(t+dt+1.5)}});return 1.6};
  let bed=null;const bedOn=()=>{const t=ac.currentTime,bg=ac.createGain(),bf=ac.createBiquadFilter();bf.type='lowpass';bf.frequency.value=900;bg.gain.value=0;bg.gain.setTargetAtTime(.022,t+.3,.8);bf.connect(bg);bg.connect(hp);
      const root=[-5,-2,0,3][Math.random()*4|0],os=CHORD.maj7.map(iv=>{const o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(root+iv-12);o.detune.value=(Math.random()-.5)*10;o.connect(bf);o.start(t);return o});
      bed={bg,os}};
  const bedOff=()=>{if(!bed)return;const{bg,os}=bed,t=ac.currentTime;bed=null;bg.gain.setTargetAtTime(0,t,.5);os.forEach(o=>o.stop(t+3))};
  // a break: the chime (on the first and now and then after), the bed fading in, then Kaisa; the bed fades as the song starts
  let breaks=0;const talk=()=>{song=newSong();const lines=djLines(last,[song.title,song.artist]),pre=breaks++%3==0?chime():.3;bedOn();
    setTimeout(()=>{if(RADIO.playing)djTalk(lines,()=>{bedOff();play()},murmur)},pre*1000)};
  talk();iv=setInterval(tick,300);
  return{stop(){RADIO.playing=false;clearInterval(iv);bedOff();if(window.speechSynthesis)speechSynthesis.cancel();radioSay('');out.gain.setTargetAtTime(0,ac.currentTime,.4);setTimeout(()=>{crackle.stop();out.disconnect()},2500)}}}
TRACKS.radio=startRadio;
function showRadioBtn(){radioBtn.setAttribute('aria-pressed',RADIO.on);radioBtn.innerHTML=RADIO.on?'&#128251; Radio on':'&#128251; Radio'}
function toggleRadio(){RADIO.on=!RADIO.on;try{localStorage.setItem('sarivalto-radio',RADIO.on?'on':'off')}catch(e){}showRadioBtn();return RADIO.on?'You switch on the radio. Radio Sarivalto crackles into life.':'You switch the radio off.'}
radioBtn.onclick=()=>{toggleRadio();radioBtn.blur()};showRadioBtn();
