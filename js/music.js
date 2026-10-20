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

// The shops: cheerful music from the speakers in the ceiling (a bright, slightly tinny sound): a bouncy easy-listening tune in C
// at 112 beats a minute, round I-vi-ii-V. A vibraphone plays the tune (the same 8 bars each time round), an electric piano
// strikes the chords, the bass bounces between root and fifth, and a shaker and a rim click keep time. Over it, the shop: the
// till ringing up a sale (a ding and its drawer), the door's chime, footsteps, and a paper bag rustling at the counter.
function startShop(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,1.7),noise=noiseBuf(ac,1,false),r=Math.random,rs=rng(23),beat=60/112;
  // the ceiling speakers: no deep bass, no sparkle
  const spk=ac.createBiquadFilter(),spk2=ac.createBiquadFilter(),mus=ac.createGain();spk.type='highpass';spk.frequency.value=160;spk2.type='lowpass';spk2.frequency.value=3800;mus.gain.value=1;
  mus.connect(spk);spk.connect(spk2);spk2.connect(bus);
  const PROG=[[60,[0,4,7,11]],[57,[0,3,7,10]],[62,[0,3,7,10]],[55,[0,4,7,10]]];
  // the tune: 8 bars of eighths from the chord's notes, with rests and held notes
  const TUNE=Array.from({length:8},(_,bi)=>{const[root,ch]=PROG[bi%4];return Array.from({length:8},(_,i)=>bi%4==3&&i>4?null:i%2&&rs()<.5?null:rs()<.12?null:root+12+[...ch,12][rs()*5|0])});
  const vib=(t,m,dur)=>{const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),tr=ac.createOscillator(),tg=ac.createGain();o.frequency.value=mtof(m);o2.frequency.value=mtof(m)*4;
    tr.frequency.value=5.5;tg.gain.value=.012;tr.connect(tg);tg.connect(g.gain);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.005);g.gain.exponentialRampToValueAtTime(.002,t+dur+.6);
    const g2=ac.createGain();g2.gain.setValueAtTime(.25,t);g2.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);o2.connect(g2);g2.connect(g);panTo(ac,g,mus,.25);for(const x of[o,o2,tr]){x.start(t);x.stop(t+dur+.7)}};
  const epiano=(t,notes,dur)=>{for(const m of notes)for(const[rr,a]of[[1,.022],[2,.008],[3,.003]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=mtof(m)*rr;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.008);g.gain.exponentialRampToValueAtTime(a*.3,t+.3);g.gain.exponentialRampToValueAtTime(.0002,t+dur);o.connect(g);panTo(ac,g,mus,-.25);o.start(t);o.stop(t+dur+.05)}};
  const bass=(t,m,dur)=>{blip(ac,mus,t,'triangle',mtof(m),dur,.2);blip(ac,mus,t,'sine',mtof(m)*2,dur*.6,.06)};
  // the shop's own sounds
  const ding=t=>{for(const[f,a]of[[2093,.03],[1568,.02],[4186,.006]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.0003,t+1.2);o.connect(g);g.connect(bus);o.start(t);o.stop(t+1.3)}
    noiseHit(ac,bus,t+.15,'lowpass',500,.6,.08,.35,.3,noise)};
  const chime=t=>{[[1318.5,0],[1046.5,.35]].forEach(([f,dt])=>{for(const[rr,a]of[[1,.03],[2.4,.008]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*rr;g.gain.setValueAtTime(a,t+dt);g.gain.exponentialRampToValueAtTime(.0004,t+dt+1.6);o.connect(g);panTo(ac,g,bus,-.6);o.start(t+dt);o.stop(t+dt+1.7)}})};
  const steps=t=>{const n=3+(r()*5|0),pan=r()*1.4-.7,gap=.42+r()*.12;for(let k=0;k<n;k++)noiseHit(ac,bus,t+k*gap,'bandpass',1300+r()*400,1.5,.025,.07,pan+k*.05,noise)};
  const rustle=t=>{const n=4+(r()*5|0);for(let k=0;k<n;k++)noiseHit(ac,bus,t+k*.06+r()*.05,'bandpass',3000+r()*2500,1.2,.02,.05,.4,noise)};
  let step=0,next=t0,td=t0+8+r()*10,tc=t0+15+r()*20,ts=t0+3,tb=t0+10+r()*10;
  const tick=()=>{const now=ac.currentTime;
    while(next<now+1){const i=step%8,bi=(step>>3)%8,[root,ch]=PROG[bi%4],e=beat/2,t=next+(i%2?e*.12:0);   // a little swing on the off-beats
      const m=TUNE[bi][i];if(m)vib(t,m,TUNE[bi][i+1]===null?e*1.8:e*.9);
      if(i==0||i==3)epiano(t,ch.slice(1).map(iv=>root+iv),i==0?e*2.5:e*4);
      if(i==0)bass(t,root-24,e*1.8);if(i==4)bass(t,root-17,e*1.8);if(i==7)bass(t,root-24+(r()<.5?2:-1),e*.8);
      noiseHit(ac,mus,t,'highpass',7000,.7,i%2?.018:.028,.05,.15,noise);
      if(i==2||i==6)noiseHit(ac,mus,t,'bandpass',1900,4,.06,.05,-.1,noise);
      next+=e;step++}
    if(td<now+1){ding(td);if(r()<.6)rustle(td+1.4);td+=16+r()*18}if(tc<now+1){chime(tc);tc+=25+r()*30}if(ts<now+1){steps(ts);ts+=3+r()*6}if(tb<now+1){rustle(tb);tb+=20+r()*25}};
  tick();const iv=setInterval(tick,300);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}

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
// The barracks: a fife and drum corps of the 1860s playing a march in G, two beats to the bar at 112 beats a minute, across the
// parade ground (its echo coming back off the buildings). Two fifes play the tune, the second a third below the first; a snare
// drum beats out its sticking with accents, flams and a roll every fourth bar, and a bass drum marks each beat. Each time round:
// the drums alone for four bars (ending on a roll), then the tune twice through its first part and twice through its second.
const FIFE_A=[[74,1],[79,1],[79,1],[81,1],[83,1],[81,1],[79,1],[83,1],[86,2],[83,1],[79,1],[81,2],[78,1],[74,1],
  [79,1],[79,1],[81,1],[83,1],[84,1],[83,1],[81,1],[79,1],[81,1],[83,1],[81,1],[78,1],[79,4]];
const FIFE_B=[[83,1],[86,1],[86,1],[86,1],[88,1],[86,1],[84,1],[83,1],[84,1],[88,1],[88,1],[84,1],[83,2],[86,2],
  [86,1],[83,1],[79,1],[83,1],[84,1],[81,1],[78,1],[81,1],[79,1],[83,1],[81,1],[78,1],[79,2],[null,2]];
// a third below, in G major: two steps down the scale
const G_MAJ=[7,9,11,0,2,4,6],third=m=>{const k=G_MAJ.indexOf(m%12);let d=m;for(let n=0;n<2;n++){const pc=G_MAJ[(k-n-1+7)%7];do d--;while(d%12!=pc)}return d};
function startArmy(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,.75),noise=noiseBuf(ac,1,false),beat=60/112,e=beat/2,r=Math.random;
  // the parade ground: the sound comes back off the buildings a moment later, twice, fainter
  const echo=ac.createDelay(1),eg=ac.createGain(),ef=ac.createBiquadFilter();echo.delayTime.value=.21;eg.gain.value=.28;ef.type='lowpass';ef.frequency.value=2200;echo.connect(ef);ef.connect(eg);eg.connect(bus);eg.connect(echo);
  const out=ac.createGain();out.connect(bus);out.connect(echo);
  // a fife: a nearly pure, shrill tone, breathy at the start, a little vibrato on held notes
  const fife=(t,m,dur,lvl,pan)=>{const o=ac.createOscillator(),o2=ac.createOscillator(),vib=ac.createOscillator(),vg=ac.createGain(),g=ac.createGain(),g2=ac.createGain();
    o.frequency.value=mtof(m);o2.frequency.value=mtof(m)*2;o.detune.value=(r()-.5)*8;vib.frequency.value=5.8;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(dur>e*1.5?12:2,t+dur);vib.connect(vg);vg.connect(o.detune);vg.connect(o2.detune);
    g2.gain.value=.12;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+.025);g.gain.setValueAtTime(lvl*.9,t+dur*.85);g.gain.linearRampToValueAtTime(0,t+dur*.97);
    o.connect(g);o2.connect(g2);g2.connect(g);panTo(ac,g,out,pan);
    const b=ac.createBufferSource(),bf=ac.createBiquadFilter(),bg=ac.createGain();b.buffer=noise;bf.type='bandpass';bf.frequency.value=mtof(m)*1.5;bf.Q.value=2;bg.gain.setValueAtTime(lvl*.5,t);bg.gain.exponentialRampToValueAtTime(lvl*.04,t+.08);bg.gain.linearRampToValueAtTime(0,t+dur);
    b.connect(bf);bf.connect(bg);panTo(ac,bg,out,pan);for(const x of[o,o2,vib])x.start(t),x.stop(t+dur+.02);b.start(t,r()*.5);b.stop(t+dur+.02)};
  // the snare: a rattle of the wires and the drumhead's knock; a flam is a grace note just before
  const snare=(t,a,flam)=>{if(flam)snare(t-.025,a*.35);noiseHit(ac,out,t,'bandpass',2600,.9,.11*a,.11,-.15,noise);blip(ac,out,t,'triangle',190,.05,.08*a,-.15,140)};
  const roll=(t,dur,a)=>{for(let k=0;k<dur/.034;k++)snare(t+k*.034,a*(.45+.35*k*.034/dur))};
  const bassdrum=(t,a)=>{blip(ac,out,t,'sine',78,.35,.32*a,.1,48);noiseHit(ac,out,t,'lowpass',260,.7,.12*a,.12,.1,noise)};
  // the snare's pattern for a bar, in sixteenths: accent levels (0 is a rest)
  const PAT=[[1,.4,.55,.4,.9,0,.55,.45],[1,.45,.5,0,.85,.4,.55,.4],[1,0,.55,.4,.9,.45,.6,0]];
  // the tune as bars of four eighths; the order each time round: four bars of drums, A, A, B, B
  const bars=tune=>{const out=[];let cur=[],len=0;for(const[m,d]of tune){cur.push([m,d]);len+=d;if(len>=4){out.push(cur);cur=[];len=0}}return out};
  const A=bars(FIFE_A),B=bars(FIFE_B),ORDER=[null,null,null,'roll',...A,...A,...B,...B];
  let bar=0,next=t0;
  const playBar=t=>{const i=bar%ORDER.length,b=ORDER[i],tune=Array.isArray(b);
    bassdrum(t,1);bassdrum(t+beat,.75);
    if(b=='roll'){roll(t,beat*1.5,1);snare(t+beat*1.5,1.1,true)}
    else if(tune&&(i-4)%8==7){roll(t,beat*1.4,.9);snare(t+beat*1.5,1,true)}
    else{const p=PAT[bar%3];p.forEach((a,k)=>{if(a)snare(t+k*e/2,a,k==0&&bar%2==0)})}
    if(tune){let tt=t;for(const[m,d]of b){if(m){fife(tt,m,d*e*.95,.06,.2);fife(tt+.004,third(m),d*e*.95,.04,-.25)}tt+=d*e}}
    bar++};
  const tick=()=>{while(next<ac.currentTime+1){playBar(next);next+=beat*2}};tick();const iv=setInterval(tick,300);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}
// The roads: the snowy woods either side. A light breeze moves through the pines, rising and falling (soft noise, its pitch rising
// as it blows harder), a branch creaks now and then, and snow slumps off one. By day the birds: a tit's two-note "fee-bee", a
// finch's trill, chirps, a crow cawing far off, and a woodpecker drumming on a trunk. By night (the Day/Night button) they're quiet,
// the breeze picks up a little, and an owl hoots from somewhere in the trees.
function startWoods(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,4.5),noise=noiseBuf(ac,1,false),r=Math.random,night=()=>typeof NIGHT!='undefined'&&NIGHT;
  // the wind: two bands of noise, low and high, rising and falling together
  const wind=ac.createBufferSource(),lo=ac.createBiquadFilter(),hi=ac.createBiquadFilter(),lg=ac.createGain(),hg=ac.createGain();wind.buffer=noiseBuf(ac,5,false);wind.loop=true;
  lo.type='bandpass';lo.frequency.value=420;lo.Q.value=.9;hi.type='bandpass';hi.frequency.value=1500;hi.Q.value=2.5;lg.gain.value=.008;hg.gain.value=.0005;
  wind.connect(lo);wind.connect(hi);lo.connect(lg);hi.connect(hg);lg.connect(bus);panTo(ac,hg,bus,.3);wind.start(t0);
  // a bird's note: a sine sliding from one pitch to another
  const tw=(t,f1,f2,d,a,pan)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.01);g.gain.setValueAtTime(a,t+d*.7);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g);panTo(ac,g,bus,pan);o.start(t);o.stop(t+d+.02)};
  const birds=[
    (t,p)=>{const f=3600+r()*300;tw(t,f,f*.98,.32,.025,p);tw(t+.4,f*.84,f*.82,.38,.022,p)},                             // a tit: fee-bee
    (t,p)=>{const n=6+(r()*8|0),f=4200+r()*1500;for(let k=0;k<n;k++)tw(t+k*.055,f*(1+(k%2)*.12),f*.9,.045,.016,p)},       // a finch's trill
    (t,p)=>{const n=1+(r()*3|0);for(let k=0;k<n;k++)tw(t+k*(.18+r()*.1),5200+r()*800,3600,.07,.02,p)},                     // chirps
    (t,p)=>{const n=2+(r()*2|0);for(let k=0;k<n;k++){const st=t+k*.5,o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';   // a crow, far off
      o.frequency.setValueAtTime(520,st);o.frequency.linearRampToValueAtTime(430,st+.32);f.type='bandpass';f.frequency.value=1300;f.Q.value=2;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.018,st+.04);g.gain.linearRampToValueAtTime(0,st+.34);
      o.connect(f);f.connect(g);panTo(ac,g,bus,p);o.start(st);o.stop(st+.36)}},
    (t,p)=>{const n=12+(r()*8|0);for(let k=0;k<n;k++){const st=t+k*.055*(1+k*.012);noiseHit(ac,bus,st,'bandpass',900,3,.07*(1-k/n*.5),.04,p,noise);blip(ac,bus,st,'triangle',320,.03,.03*(1-k/n*.5),p)}}]; // a woodpecker
  // an owl: hoo, hoo-hoo, hoooo
  const owl=(t,p)=>{[[0,.35],[.75,.18],[1,.18],[1.35,.6]].forEach(([dt,d])=>{const st=t+dt,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(390,st);o.frequency.linearRampToValueAtTime(360,st+d);
    g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(.05,st+.06);g.gain.linearRampToValueAtTime(0,st+d);o.connect(g);panTo(ac,g,bus,p);o.start(st);o.stop(st+d+.02)})};
  // a branch creaking, and snow sliding off one
  const creak=(t,p)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(),d=.6+r()*.8;o.type='sawtooth';o.frequency.setValueAtTime(70+r()*40,t);o.frequency.linearRampToValueAtTime(110+r()*60,t+d);
    f.type='bandpass';f.frequency.value=900;f.Q.value=6;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03,t+d*.3);g.gain.linearRampToValueAtTime(0,t+d);o.connect(f);f.connect(g);panTo(ac,g,bus,p);o.start(t);o.stop(t+d+.02)};
  const slump=(t,p)=>{noiseHit(ac,bus,t,'lowpass',900,.6,.1,.5,p,noise);for(let k=0;k<5;k++)noiseHit(ac,bus,t+.1+k*.07,'highpass',3000,.6,.015,.12,p,noise)};
  let tg=t0,tb=t0+1,tc=t0+8+r()*10,ts=t0+15+r()*20;
  const tick=()=>{const now=ac.currentTime,n=night(),side=()=>r()*1.8-.9;
    if(tg<now+1){const w=(n?.25:.1)+r()*.35;lg.gain.setTargetAtTime(.005+w*.014,tg,2);hg.gain.setTargetAtTime(w*w*.004,tg,2);lo.frequency.setTargetAtTime(250+w*250,tg,2);hi.frequency.setTargetAtTime(1000+w*600,tg,2);tg+=4+r()*5}
    if(tb<now+1){if(n){owl(tb,side());tb+=10+r()*14}else{const k=r(),b=k<.32?0:k<.55?1:k<.8?2:k<.92?3:4;birds[b](tb,side());tb+=1.2+r()*4}}
    if(tc<now+1){creak(tc,side());tc+=12+r()*18}if(ts<now+1){slump(ts,side());ts+=25+r()*35}};
  tick();const iv=setInterval(tick,300);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.8);setTimeout(()=>{wind.stop();bus.disconnect()},4000)}}}
// The CIA: ominous music, the kind a Cold War thriller plays while someone opens a file they shouldn't. A low drone on D that
// never settles (two detuned tones through a filter slowly opening and closing), a slow pulse beneath it like a heartbeat, string
// chords swelling and fading that sit uneasily (a minor second, a tritone), single high piano notes falling into a long echo, and
// now and then a low brass swell. All in a large, dark room.
function startSpy(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,1),r=Math.random,mt=m=>440*2**((m-69)/12);
  const room=ac.createConvolver(),n=ac.sampleRate*3.5|0,ir=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)*.6}
  room.buffer=ir;const wet=ac.createGain();wet.gain.value=.5;room.connect(wet);wet.connect(bus);
  const out=(node,amt)=>{node.connect(bus);const g=ac.createGain();g.gain.value=amt;node.connect(g);g.connect(room)};
  // the drone
  const df=ac.createBiquadFilter(),dg=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();df.type='lowpass';df.frequency.value=180;df.Q.value=4;dg.gain.value=0;dg.gain.setTargetAtTime(.09,t0,3);
  lfo.frequency.value=.045;lg.gain.value=110;lfo.connect(lg);lg.connect(df.frequency);df.connect(dg);out(dg,.3);
  const drone=[[38,0],[38,9],[26,-4]].map(([m,det])=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mt(m);o.detune.value=det;o.connect(df);o.start(t0);return o});lfo.start(t0);
  // the pulse: a low, soft thump, lub-dub
  const thump=(t,a)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(62,t);o.frequency.exponentialRampToValueAtTime(36,t+.25);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g);out(g,.15);o.start(t);o.stop(t+.45)};
  // the strings: each note three detuned saws through a soft filter, swelling in and fading out
  const CHORDS=[[0,3,7,13],[0,1,7,12],[0,6,10,15],[-2,1,5,11],[0,3,8,14],[-1,3,6,12]];
  const strings=(t,ch,dur)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1300,t+dur*.5);f.frequency.linearRampToValueAtTime(600,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);f.connect(g);out(g,.7);
    for(const iv of ch)for(const det of[-9,0,8]){const o=ac.createOscillator(),og=ac.createGain();o.type='sawtooth';o.frequency.value=mt(50+iv);o.detune.value=det;og.gain.value=.12;o.connect(og);og.connect(f);o.start(t);o.stop(t+dur+.1)}};
  // a piano note, high and alone
  const SCALE=[0,1,3,6,7,8,10];
  const piano=t=>{const m=74+SCALE[r()*SCALE.length|0]+(r()<.3?12:0);for(const[rr,a]of[[1,.05],[2,.015],[3,.005],[4.1,.002]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=mt(m)*rr;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.006);g.gain.exponentialRampToValueAtTime(.0002,t+3.5/rr);panTo(ac,g,bus,r()*1.2-.6);const s2=ac.createGain();s2.gain.value=1.2;g.connect(s2);s2.connect(room);o.connect(g);o.start(t);o.stop(t+3.6)}};
  // the brass: a low swell on two notes a semitone apart, the filter opening as it grows
  const brass=t=>{const f=ac.createBiquadFilter(),g=ac.createGain(),d=5;f.type='lowpass';f.frequency.setValueAtTime(250,t);f.frequency.linearRampToValueAtTime(950,t+d*.6);f.frequency.linearRampToValueAtTime(300,t+d);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+d*.6);g.gain.linearRampToValueAtTime(0,t+d);f.connect(g);out(g,.6);
    for(const m of[38,39,45])for(const det of[-6,6]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mt(m);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+d+.1)}};
  let tp=t0+2,ts=t0+1,ci=0,tn=t0+6,tb=t0+25+r()*15;
  const tick=()=>{const now=ac.currentTime;
    while(tp<now+1){thump(tp,.22);thump(tp+.32,.13);tp+=1.7}
    if(ts<now+1){const d=9+r()*4;strings(ts,CHORDS[ci++%CHORDS.length],d);ts+=d*.75}
    if(tn<now+1){piano(tn);if(r()<.35)piano(tn+.55);tn+=2.5+r()*4.5}
    if(tb<now+1){brass(tb);tb+=28+r()*25}};
  tick();const iv=setInterval(tick,300);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.8);setTimeout(()=>{drone.forEach(o=>o.stop());lfo.stop();bus.disconnect()},4000)}}}
// The coffee shop: people talking at the tables (voices too far off to make out: buzzy tones shaped into vowels, a syllable at a
// time, in phrases with pauses), the espresso machine (the pump's hum and the coffee running) and its steam wand hissing as it
// froths milk, the grinder whirring, cups set down on saucers and spoons stirring, the beans popping in the roaster now and then,
// and an acoustic guitar picking slow chords in the background. All a little soft, so nothing fizzes.
function startCafe(){const ac=audio();if(!ac)return null;const[out0,t0]=trackBus(ac,1.7),bus=ac.createGain(),soft=ac.createBiquadFilter(),noise=noiseBuf(ac,1,false),r=Math.random,mt=m=>440*2**((m-69)/12),V='aeiou';
  soft.type='lowpass';soft.frequency.value=3200;soft.Q.value=.5;bus.connect(soft);soft.connect(out0);
  // a voice at a table: a phrase of syllables, each a vowel, rising and falling in pitch
  const talk=(t,f0,pan)=>{const o=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter();o.type='sawtooth';lp.type='lowpass';lp.frequency.value=1300;g.gain.value=0;
    const fs=[0,1,2].map(()=>{const f=ac.createBiquadFilter(),fg=ac.createGain();f.type='bandpass';f.Q.value=6;o.connect(f);f.connect(fg);fg.connect(g);return[f,fg]});g.connect(lp);panTo(ac,lp,bus,pan);
    const n=4+(r()*10|0);let tt=t;for(let k=0;k<n;k++){const d=.1+r()*.12,v=VOWEL[V[r()*5|0]];o.frequency.setTargetAtTime(f0*(1+(r()-.5)*.25)*(k==n-1?.85:1),tt,.03);
      v.forEach(([f,a],j)=>{fs[j][0].frequency.setTargetAtTime(f,tt,.02);fs[j][1].gain.setTargetAtTime(a,tt,.02)});g.gain.setTargetAtTime(.012+r()*.006,tt,.015);g.gain.setTargetAtTime(.002,tt+d*.75,.02);tt+=d;if(r()<.12)tt+=.15}
    g.gain.setTargetAtTime(0,tt,.03);o.start(t);o.stop(tt+.3);return tt-t};
  const voices=[[120,-.6],[205,.5],[110,.2],[230,-.3]].map(([f0,pan])=>({f0,pan,next:t0+r()*3}));
  // the espresso machine: the pump's hum and the coffee running into the cup
  const espresso=t=>{const d=6+r()*4,o=ac.createOscillator(),og=ac.createGain();o.type='square';o.frequency.value=50;og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(.012,t+.2);og.gain.setValueAtTime(.012,t+d);og.gain.linearRampToValueAtTime(0,t+d+.3);
    const of=ac.createBiquadFilter();of.type='lowpass';of.frequency.value=400;o.connect(of);of.connect(og);panTo(ac,og,bus,.55);o.start(t);o.stop(t+d+.4);
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;s.loop=true;f.type='bandpass';f.frequency.value=750;f.Q.value=5;g.gain.setValueAtTime(0,t+1.5);g.gain.linearRampToValueAtTime(.008,t+2.5);g.gain.setValueAtTime(.008,t+d-.5);g.gain.linearRampToValueAtTime(0,t+d);
    const wob=ac.createOscillator(),wg=ac.createGain();wob.frequency.value=6;wg.gain.value=180;wob.connect(wg);wg.connect(f.frequency);wob.start(t);wob.stop(t+d+.4);
    s.connect(f);f.connect(g);panTo(ac,g,bus,.55);s.start(t);s.stop(t+d+.4)};
  // the steam wand: a smooth hiss whose pitch falls as the milk heats, and the milk's low roll under it
  const steam=t=>{const d=4+r()*3,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;s.loop=true;f.type='bandpass';f.Q.value=1.2;f.frequency.setValueAtTime(2800,t);f.frequency.linearRampToValueAtTime(1500,t+d);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.014,t+.4);g.gain.setValueAtTime(.012,t+d-.6);g.gain.linearRampToValueAtTime(0,t+d);s.connect(f);f.connect(g);panTo(ac,g,bus,.6);s.start(t);s.stop(t+d+.1);
    const m=ac.createBufferSource(),mf=ac.createBiquadFilter(),mg=ac.createGain();m.buffer=noise;m.loop=true;mf.type='lowpass';mf.frequency.value=350;mg.gain.setValueAtTime(0,t+d*.4);mg.gain.linearRampToValueAtTime(.03,t+d*.6);mg.gain.linearRampToValueAtTime(0,t+d);m.connect(mf);mf.connect(mg);panTo(ac,mg,bus,.6);m.start(t);m.stop(t+d+.1)};
  // the grinder
  const grind=t=>{const d=3+r()*2,o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.linearRampToValueAtTime(170,t+.4);f.type='bandpass';f.frequency.value=900;f.Q.value=1.5;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018,t+.2);g.gain.setValueAtTime(.018,t+d);g.gain.linearRampToValueAtTime(0,t+d+.4);o.connect(f);f.connect(g);panTo(ac,g,bus,.5);o.start(t);o.stop(t+d+.5)};
  // china: a cup on a saucer (a ring and a knock), a spoon stirring (a run of small chinks)
  const clink=(t,pan)=>{const f=2400+r()*1600;for(const[rr,a]of[[1,.03],[2.7,.012],[5.1,.004]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*rr;g.gain.setValueAtTime(a,t);g.gain.exponentialRampToValueAtTime(.0002,t+.25/rr+.05);o.connect(g);panTo(ac,g,bus,pan);o.start(t);o.stop(t+.35)}};
  const china=(t,pan)=>{if(r()<.5){noiseHit(ac,bus,t,'bandpass',900,1.2,.03,.05,pan,noise);clink(t,pan)}else{const n=4+(r()*5|0);for(let k=0;k<n;k++)clink(t+k*.16+r()*.03,pan)}};
  // the roaster: the beans popping (first crack), a few soft pops at the back
  const crack=t=>{const n=4+(r()*5|0);for(let k=0;k<n;k++)blip(ac,bus,t+r()*4,'sine',700+r()*500,.025,.015,-.7,300)};
  // the guitar: slow fingerpicked chords, a long way off (a plucked string: a bright tone dying quickly to a soft one)
  const PROG=[[52,[0,7,12,16,19]],[57,[0,7,12,15,19]],[50,[0,7,12,16,19]],[55,[0,7,12,16,19]]],beat=60/80;
  const pluck=(t,m)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=mt(m);f.type='lowpass';f.frequency.setValueAtTime(3000,t);f.frequency.exponentialRampToValueAtTime(500,t+.4);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.014,t+.004);g.gain.exponentialRampToValueAtTime(.0003,t+2.2);o.connect(f);f.connect(g);panTo(ac,g,bus,-.35);o.start(t);o.stop(t+2.3)};
  const PICK=[0,2,3,4,1,3,2,4];let step=0,gn=t0+.5,te=t0+4+r()*8,tst=t0+14+r()*12,tgr=t0+9+r()*15,tch=t0+1,tcr=t0+30+r()*30;
  const tick=()=>{const now=ac.currentTime;
    for(const v of voices)if(v.next<now+1){const d=talk(v.next,v.f0,v.pan);v.next+=d+.6+r()*(r()<.3?6:2)}
    while(gn<now+1){const[root,ch]=PROG[(step>>3)%4];pluck(gn+r()*.01,root+ch[PICK[step%8]]);gn+=beat/2;step++}
    if(te<now+1){espresso(te);te+=20+r()*20}if(tst<now+1){steam(tst);tst+=28+r()*25}if(tgr<now+1){grind(tgr);tgr+=30+r()*30}
    if(tch<now+1){china(tch,r()*1.6-.8);tch+=1.5+r()*4}if(tcr<now+1){crack(tcr);tcr+=45+r()*45}};
  tick();const iv=setInterval(tick,250);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}
// Industry: the lumber mill, the oil rig, the fish processing plant and the Kelp Cola factory, each with its machinery, all a little
// muffled (as if heard through the walls) so none of it is harsh. Common to
// all: the hum of the motors (low buzzing tones), a conveyor or a chain clattering in a steady rhythm, metal clanking now and then,
// and the hiss of air or steam let out of a valve. And each its own:
//   the mill: the big saw whining up to speed and biting into a log (its pitch dropping and buzzing as it cuts, then free again),
//     and the cut timber thudding down onto the stack;
//   the rig: the drilling pump's slow, heavy chug, the drill's grinding whine, a chain rattling through, and the sea and the wind
//     around the platform;
//   the plant: the conveyor rattling fish along the line, a refrigeration compressor droning and cycling, fish slapping wetly
//     into the bins, and a pneumatic pusher thumping;
//   the cola factory (and its warehouse): bottles clinking against each other along the bottling line, the filler hissing, the
//     capper thumping caps on, and crates of full bottles set down.
function startIndustry(kind){const ac=audio();if(!ac)return null;const[out0,t0]=trackBus(ac,kind=='rig'?1.2:1.4),bus=ac.createGain(),soft=ac.createBiquadFilter(),noise=noiseBuf(ac,1,false),r=Math.random,side=()=>r()*1.6-.8,live=[];
  // everything a little muffled, as if heard through the walls, so none of it is harsh
  soft.type='lowpass';soft.frequency.value=1900;soft.Q.value=.4;bus.connect(soft);soft.connect(out0);
  const loop=(buf,type,f,q,lvl,pan)=>{const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.value=lvl;s.connect(fl);fl.connect(g);panTo(ac,g,bus,pan);s.start(t0);live.push(s);return{g,fl}};
  // the motors: a low buzz, two tones a little apart
  const hf=ac.createBiquadFilter(),hg=ac.createGain();hf.type='lowpass';hf.frequency.value=kind=='plant'?320:240;hg.gain.value=kind=='rig'?.05:.035;hf.connect(hg);hg.connect(bus);
  for(const[f,det]of[[kind=='rig'?45:50,0],[kind=='rig'?90:100,7]]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;o.connect(hf);o.start(t0);live.push(o)}
  // metal: a struck piece of steel (inharmonic partials)
  const clank=(t,pan,a=.02,f=180+r()*400)=>{for(const[rr,aa]of[[1,1],[2.76,.45],[5.4,.15]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*rr;g.gain.setValueAtTime(a*aa,t);g.gain.exponentialRampToValueAtTime(.0002,t+.6/Math.sqrt(rr));o.connect(g);panTo(ac,g,bus,pan);o.start(t);o.stop(t+.7)}
    noiseHit(ac,bus,t,'bandpass',2500,1,a*.8,.04,pan,noise)};
  const hiss=(t,pan,a=.02)=>{const d=.6+r()*1.4,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;s.loop=true;f.type='highpass';f.frequency.value=3000+r()*2000;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.03);g.gain.exponentialRampToValueAtTime(.002,t+d);s.connect(f);f.connect(g);panTo(ac,g,bus,pan);s.start(t);s.stop(t+d+.05)};
  const thud=(t,pan,a=.3)=>{blip(ac,bus,t,'sine',90,.3,a,pan,40);noiseHit(ac,bus,t,'lowpass',400,.7,a*.5,.2,pan,noise)};
  // glass: a bottle knocking against the next (a high, short ring)
  const glass=(t,pan,a=.006)=>{const f=2600+r()*900;for(const[rr,aa]of[[1,1],[2.3,.4],[4.1,.15]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*rr;g.gain.setValueAtTime(a*aa,t);g.gain.exponentialRampToValueAtTime(.0002,t+.18);o.connect(g);panTo(ac,g,bus,pan);o.start(t);o.stop(t+.2)}};
  // the conveyor's rhythm: [seconds between, accent pattern, filter Hz, level]
  const BELT={mill:[.24,[1,.5,.7,.5],900,.035],rig:[.11,[1,.6,.8,.6,.9,.6],1800,.012],plant:[.16,[1,.6,.8,.6],1500,.03],cola:[.2,[1,.6,.8,.6],1200,.022]}[kind];
  // ---- each place's own
  let saw=null;
  if(kind=='mill')saw={next:t0+2,f:()=>{const t=saw.next,o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(),cut=2.5+r()*3;o.type='triangle';o2.type='square';f.type='bandpass';f.frequency.value=1500;f.Q.value=.8;
      // spinning up, biting in (lower, rough), through, and spinning free
      o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(1150,t+1.2);o.frequency.setTargetAtTime(820,t+1.6,.15);o.frequency.setTargetAtTime(1150,t+1.6+cut,.2);o.frequency.setTargetAtTime(300,t+2.6+cut,.4);
      o2.frequency.value=37;const og=ac.createGain();og.gain.setValueAtTime(0,t);og.gain.setValueAtTime(.4,t+1.6);og.gain.setValueAtTime(0,t+1.6+cut);o2.connect(og);og.connect(g.gain);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.01,t+1.2);g.gain.setTargetAtTime(.022,t+1.6,.1);g.gain.setTargetAtTime(.01,t+1.6+cut,.2);g.gain.setTargetAtTime(0,t+2.8+cut,.3);
      o.connect(f);f.connect(g);panTo(ac,g,bus,.3);o.start(t);o.stop(t+4.5+cut);o2.start(t);o2.stop(t+4.5+cut);
      const chips=ac.createBufferSource(),cf=ac.createBiquadFilter(),cg=ac.createGain();chips.buffer=noise;chips.loop=true;cf.type='highpass';cf.frequency.value=2500;cg.gain.setValueAtTime(0,t);cg.gain.setTargetAtTime(.012,t+1.6,.1);cg.gain.setTargetAtTime(0,t+1.6+cut,.1);
      chips.connect(cf);cf.connect(cg);panTo(ac,cg,bus,.3);chips.start(t);chips.stop(t+4.5+cut);
      thud(t+2.4+cut+r(),side());if(r()<.6)thud(t+3+cut+r(),side(),.22);saw.next+=8+cut+r()*8}};
  let pump=t0+1,sea=null;
  if(kind=='rig'){sea=loop(noiseBuf(ac,6,true),'lowpass',350,.5,.12,0);loop(noise,'bandpass',600,.4,.008,-.4)}
  if(kind=='plant')loop(noise,'bandpass',220,2,.025,-.5);   // the compressor's rumble
  let comp=t0+20,tb=t0,bi=0,tcl=t0+3,ths=t0+5+r()*6,tx=t0+2,tw=t0+3;
  const tick=()=>{const now=ac.currentTime;
    while(tb<now+1){const[gap,pat,f,lvl]=BELT;noiseHit(ac,bus,tb,'bandpass',f*(1+(r()-.5)*.1),2,lvl*pat[bi%pat.length],.05,-.3,noise);
      if(kind=='cola'){glass(tb+r()*.05,-.3);if(r()<.5)glass(tb+.08+r()*.08,-.2,.008)}tb+=gap;bi++}
    if(tcl<now+1){clank(tcl,side(),kind=='cola'?.025:.04);tcl+=5+r()*10}
    if(ths<now+1){hiss(ths,side());ths+=15+r()*20}
    if(saw&&saw.next<now+1)saw.f();
    if(kind=='rig'){while(pump<now+1){thud(pump,0,.35);noiseHit(ac,bus,pump+.35,'bandpass',300,1.5,.05,.3,0,noise);pump+=1.25}
      if(tw<now+1){const w=.5+r()*.5;sea.g.gain.setTargetAtTime(.06+w*.1,tw,1.2);sea.fl.frequency.setTargetAtTime(250+w*300,tw,1.2);tw+=3+r()*3}
      if(tx<now+1){if(r()<.5){const n=10+(r()*15|0);for(let k=0;k<n;k++)clank(tx+k*.07,.4,.012,600+r()*300)}           // a chain
        else{const o=ac.createOscillator(),g=ac.createGain(),d=3+r()*3;o.type='sawtooth';o.frequency.setValueAtTime(220,tx);o.frequency.linearRampToValueAtTime(260,tx+d);  // the drill grinding
          const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=700;f.Q.value=3;g.gain.setValueAtTime(0,tx);g.gain.linearRampToValueAtTime(.025,tx+.5);g.gain.linearRampToValueAtTime(0,tx+d);o.connect(f);f.connect(g);g.connect(bus);o.start(tx);o.stop(tx+d+.05)}
        tx+=8+r()*10}}
    if(kind=='plant'){if(tx<now+1){const n=1+(r()*3|0);for(let k=0;k<n;k++)noiseHit(ac,bus,tx+k*.22,'lowpass',700+r()*500,.8,.12,.09,side(),noise);tx+=1.5+r()*3.5}   // fish into the bins
      if(tw<now+1){thud(tw,.5,.18);hiss(tw+.25,.5);tw+=9+r()*9}                                                                                                 // the pusher
      if(comp<now+1){hg.gain.setTargetAtTime(hg.gain.value>.04?.035:.06,comp,.8);comp+=25+r()*20}}                                                           // the compressor cycling
    if(kind=='cola'){while(tw<now+1){hiss(tw,.4,.02);thud(tw+.5,.4,.1);clank(tw+.52,.4,.012,900);tw+=1.6}                                                       // filler, then capper
      if(tx<now+1){thud(tx,side(),.2);for(let k=0;k<6;k++)glass(tx+.02+r()*.15,side(),.01);tx+=7+r()*9}}};                                                    // a crate set down
  tick();const iv=setInterval(tick,250);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>{live.forEach(n=>n.stop());bus.disconnect()},3000)}}}
// The casino: upbeat big-band swing, the sound of a Las Vegas lounge, at 168 beats a minute in B flat. The bass walks, the drums
// swing on the ride cymbal with the hi-hat on two and four and a kick under it, the brass section punches out chords on the
// off-beats, and a trumpet plays a bright riff over the top. Behind it the floor: slot machines ringing and paying out, chips
// clattering, and the roulette ball skittering round the wheel.
function startCasino(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,.9),noise=noiseBuf(ac,1,false),r=Math.random,mt=m=>440*2**((m-69)/12),beat=60/168,sw=beat*2/3;
  // I-vi-ii-V, then iii-VI-ii-V, in B flat
  const FORM=[[46,'maj'],[55,'min'],[48,'min'],[53,'dom'],[50,'min'],[55,'dom'],[48,'min'],[53,'dom']],T={maj:[0,4,7,9],min:[0,3,7,10],dom:[0,4,7,10]};
  const bass=(t,m)=>{blip(ac,bus,t,'triangle',mt(m),beat*.9,.3);blip(ac,bus,t,'sine',mt(m)*2,beat*.5,.06)};
  const brass=(t,root,q,dur)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.setValueAtTime(800,t);f.frequency.linearRampToValueAtTime(2600,t+.05);f.frequency.linearRampToValueAtTime(1400,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.02);g.gain.setValueAtTime(.04,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);f.connect(g);panTo(ac,g,bus,-.25);
    for(const iv of T[q]){let m=root+iv+12;while(m<58)m+=12;while(m>72)m-=12;for(const det of[-7,7]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mt(m);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+dur+.02)}}};
  const trumpet=(t,m,dur)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.setValueAtTime(mt(m)*.97,t);o.frequency.linearRampToValueAtTime(mt(m),t+.04);f.type='lowpass';f.frequency.setValueAtTime(1200,t);f.frequency.linearRampToValueAtTime(3500,t+.04);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.setValueAtTime(.04,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);panTo(ac,g,bus,.3);o.start(t);o.stop(t+dur+.02)};
  const rr=rng(77),RIFF=[0,1,2,3].map(()=>Array.from({length:8},(_,i)=>i%2&&rr()<.4?null:rr()<.2?null:[0,2,4,7,9,12,14][rr()*7|0]));
  // the floor
  const slotWin=t=>{const p=r()*1.4-.7,n=10+(r()*10|0);for(let k=0;k<n;k++){const f=[1319,1568,2093][k%3];blip(ac,bus,t+k*.07,'square',f,.06,.008,p)}};
  const chips=t=>{const p=r()*1.4-.7,n=5+(r()*8|0);for(let k=0;k<n;k++)noiseHit(ac,bus,t+k*.035+r()*.02,'bandpass',3500+r()*2000,3,.025,.03,p,noise)};
  const wheel=t=>{const p=r()*1.4-.7;for(let k=0,tt=t,gap=.06;k<40;k++){noiseHit(ac,bus,tt,'bandpass',4500,4,.015,.02,p,noise);tt+=gap;gap*=1.05}};
  let bar=0,next=t0,tf=t0+3+r()*5;
  const playBar=t=>{const[root,q]=FORM[bar%8],[nr]=FORM[(bar+1)%8],tn=T[q],lo=m=>{while(m>45)m-=12;while(m<33)m+=12;return m};
    [lo(root),lo(root+tn[1]),lo(root+tn[2]),lo(nr)+(r()<.5?1:-1)].forEach((m,b)=>bass(t+b*beat,m));
    for(let b=0;b<4;b++){noiseHit(ac,bus,t+b*beat,'bandpass',7000,2.5,.05,.4,.3,noise);if(b%2)noiseHit(ac,bus,t+b*beat+sw,'bandpass',7000,2.5,.03,.25,.3,noise);
      if(b%2)noiseHit(ac,bus,t+b*beat,'highpass',8500,1,.04,.05,-.2,noise);if(b%2==0)blip(ac,bus,t+b*beat,'sine',120,.12,.25,0,45);if(b%2)noiseHit(ac,bus,t+b*beat,'bandpass',1800,.8,.06,.12,0,noise)}
    // the brass: stabs on the "and" of one and three, or a long chord across the bar every fourth
    if(bar%4==3)brass(t,root,q,beat*3.5);else{brass(t+sw,root,q,beat*.45);brass(t+beat*2+sw,root,q,beat*.45)}
    // the trumpet riff over the second half of the form
    if((bar>>3)%2){const riff=RIFF[bar%4];riff.forEach((n,i)=>{if(n!=null){let m=root+12+n;while(m<65)m+=12;while(m>82)m-=12;trumpet(t+(i>>1)*beat+(i%2?sw:0),m,(i%2?beat-sw:sw)*.95)}})}
    bar++};
  const tick=()=>{const now=ac.currentTime;while(next<now+1){playBar(next);next+=beat*4}
    if(tf<now+1){const k=r();if(k<.45)slotWin(tf);else if(k<.85)chips(tf);else wheel(tf);tf+=2+r()*5}};
  tick();const iv=setInterval(tick,250);return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}
// The circus: Romani music, a csárdás in D harmonic minor, the way a travelling band would play it. It begins slow and free (the
// lassú): the violin sings a mournful tune, sliding into its notes with a wide vibrato, over the accordion's held chords and the
// cimbalom rolling up through them. Then it breaks into the fast dance (the friss): the bass and the cimbalom's chords go oom-pah,
// and the violin runs in quick notes, twice through, the second time an octave higher. Then slow again.
const HMIN=[0,2,3,5,7,8,11],hdeg=d=>62+12*Math.floor(d/7)+HMIN[((d%7)+7)%7];
function startRomani(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,.9),noise=noiseBuf(ac,1,false),mt=m=>440*2**((m-69)/12),rr=rng(31);
  // chords: [root (MIDI), its notes as harmonic-minor degrees]
  const Dm=[50,[0,2,4]],Gm=[55,[3,5,7]],A7=[57,[4,6,8,10]],Bb=[58,[5,7,9]];
  const SLOW=[Dm,Dm,Gm,Gm,Bb,A7,Dm,A7],FAST=[Dm,Dm,A7,A7,A7,A7,Dm,Dm,Gm,Gm,Dm,Dm,A7,A7,Dm,Dm],sb=60/66,fb=60/168;
  // the tunes, made once: the slow one in long notes and short, the fast one in running eighths landing on the chord each bar
  const near=(d,ch)=>{let best=d,bd=99;for(const c of ch)for(const o of[-7,0,7]){const x=c+o;if(Math.abs(x-d)<bd){bd=Math.abs(x-d);best=x}}return best};
  let d=4;const slowT=SLOW.map(([,ch])=>{const rh=[[2,1,1],[3,1],[1,1,2],[4],[1.5,.5,2]][rr()*5|0];return rh.map((len,i)=>{d=i==0?near(d+(rr()<.5?1:-1),ch):Math.max(0,Math.min(11,d+[-1,1,-1,2,-2][rr()*5|0]));return[d,len]})});
  d=7;const fastT=FAST.map(([,ch])=>[0,1,2,3].map(i=>{d=i==0?near(d,ch):Math.max(2,Math.min(13,d+[-1,1,1,-1,2,-2][rr()*6|0]));return d}));
  // the violin
  const violin=(t,m,dur,slow)=>{const o=ac.createOscillator(),o2=ac.createOscillator(),vib=ac.createOscillator(),vg=ac.createGain(),f=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),g=ac.createGain();
    o.type=o2.type='sawtooth';const fr=mt(m);if(slow&&Math.random()<.5){o.frequency.setValueAtTime(fr*.94,t);o.frequency.exponentialRampToValueAtTime(fr,t+.12)}else o.frequency.value=fr;o2.frequency.value=fr;o2.detune.value=6;
    vib.frequency.value=slow?5.6:6.5;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(slow?22:6,t+Math.min(dur,.5));vib.connect(vg);vg.connect(o.detune);vg.connect(o2.detune);
    f.type='peaking';f.frequency.value=2600;f.gain.value=8;f.Q.value=1;lp.type='lowpass';lp.frequency.value=5000;
    const lv=slow?.04:.035;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lv,t+(slow?.1:.02));g.gain.setValueAtTime(lv*.9,t+dur*.85);g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(f);o2.connect(f);f.connect(lp);lp.connect(g);panTo(ac,g,bus,.2);for(const x of[o,o2,vib]){x.start(t);x.stop(t+dur+.02)}};
  // the cimbalom: a hammered string, bright and ringing
  const cimb=(t,m,a)=>{for(const[r,aa]of[[1,1],[2,.5],[3,.22],[4.15,.08]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=mt(m)*r*(1+(Math.random()-.5)*.002);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a*aa,t+.003);g.gain.exponentialRampToValueAtTime(.0002,t+1.6/r);o.connect(g);panTo(ac,g,bus,-.3);o.start(t);o.stop(t+1.7)}};
  // the accordion: reeds tuned a little apart, through a soft filter
  const accord=(t,notes,dur,a)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='bandpass';f.frequency.value=1200;f.Q.value=.6;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.06);g.gain.setValueAtTime(a,t+dur-.08);g.gain.linearRampToValueAtTime(0,t+dur);
    f.connect(g);panTo(ac,g,bus,-.1);for(const m of notes)for(const det of[-10,10]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mt(m);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+dur+.02)}};
  const bass=(t,m,dur)=>{blip(ac,bus,t,'triangle',mt(m),dur,.28);noiseHit(ac,bus,t,'lowpass',300,.7,.05,.05,0,noise)};
  const notes=ch=>ch.map(x=>hdeg(x)-12);
  // the sections: the slow one, then the fast one twice
  const SECT=[['slow',0],['fast',0],['fast',1]];let si=0,bar=0,next=t0;
  const playBar=t=>{const[kind,rep]=SECT[si%3];
    if(kind=='slow'){const[root,ch]=SLOW[bar];accord(t,notes(ch),sb*4,.022);bass(t,root-12,sb*2);bass(t+sb*2,root-12,sb*2);
      const ns=notes(ch);for(let k=0;k<8;k++)cimb(t+k*sb/2+Math.random()*.02,ns[k%ns.length]+12*(k>>2&1),.02);
      let tt=t;for(const[dd,len]of slowT[bar]){violin(tt,hdeg(dd)+12,len*sb*.97,true);tt+=len*sb}
      bar++;if(bar>=SLOW.length){bar=0;si++}return sb*4}
    const[root,ch]=FAST[bar],ns=notes(ch);bass(t,root-12,fb*.8);bass(t+fb,root-5,fb*.8);
    for(const k of[.5,1.5]){accord(t+k*fb,ns,fb*.4,.02);ns.forEach(m=>cimb(t+k*fb,m+12,.012))}
    fastT[bar].forEach((dd,i)=>violin(t+i*fb/2,hdeg(dd)+12*(1+rep),fb/2*.92,false));
    bar++;if(bar>=FAST.length){bar=0;si++}return fb*2};
  const tick=()=>{while(next<ac.currentTime+1.2)next+=playBar(next)};tick();const iv=setInterval(tick,250);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.6);setTimeout(()=>bus.disconnect(),3000)}}}
// The palace: a stately Baroque processional in D major at 72 beats a minute, the music of a court. The strings hold the chords
// and their bass walks in steady quarters; the harpsichord ripples through each chord in sixteenths; the timpani strike D and A
// on the first and third beats; and two trumpets play the tune, in thirds, in the dotted rhythms of a grand entrance, in the
// second half of each time round (the strings and harpsichord alone in the first). All in a palace hall's long echo.
const DMAJ=[0,2,4,5,7,9,11],ddeg=d=>62+12*Math.floor(d/7)+DMAJ[((d%7)+7)%7];
function startRegal(){const ac=audio();if(!ac)return null;const[bus,t0]=trackBus(ac,1.1),noise=noiseBuf(ac,1,false),mt=m=>440*2**((m-69)/12),beat=60/72,rr=rng(5);
  const hall=ac.createConvolver(),n=ac.sampleRate*2.8|0,ir=ac.createBuffer(2,n,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)*.5}
  hall.buffer=ir;const wet=ac.createGain();wet.gain.value=.45;hall.connect(wet);wet.connect(bus);
  const out=(node,pan,amt=.6)=>{panTo(ac,node,bus,pan);const g=ac.createGain();g.gain.value=amt;node.connect(g);g.connect(hall)};
  // chords as D-major degrees (0 = D): I IV V I, vi ii V I, IV I V vi, ii V V I
  const PROG=[0,3,4,0,5,1,4,0,3,0,4,5,1,4,4,0],TRI=r=>[r,r+2,r+4];
  // the tune: two trumpets, a third apart; each bar a rhythm of a grand entrance, its first note on the chord
  const RH=[[1.5,.5,2],[1,1,1,1],[1.5,.5,1.5,.5],[2,2],[.75,.25,1,2],[4]];let d=7;
  const TUNE=PROG.map((c,bi)=>{const rh=bi%4==3?RH[bi==15?5:3]:RH[rr()*5|0];return rh.map((len,i)=>{if(i==0){let best=d,bd=99;for(const x of TRI(c))for(const o of[0,7,14]){const y=x+o;if(y>=4&&y<=13&&Math.abs(y-d)<bd){bd=Math.abs(y-d);best=y}}d=best}
    else d=Math.max(4,Math.min(13,d+[-1,1,-1,1,2,-2][rr()*6|0]));return[d,len]})});
  const trumpet=(t,m,dur,pan,lvl)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(),vib=ac.createOscillator(),vg=ac.createGain();o.type='sawtooth';o.frequency.value=mt(m);
    vib.frequency.value=5;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(dur>beat?8:0,t+dur);vib.connect(vg);vg.connect(o.detune);
    f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.linearRampToValueAtTime(3200,t+.04);f.frequency.linearRampToValueAtTime(2000,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+.03);g.gain.setValueAtTime(lvl*.85,t+dur*.85);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);out(g,pan);
    for(const x of[o,vib]){x.start(t);x.stop(t+dur+.02)}};
  const strings=(t,ms,dur)=>{const f=ac.createBiquadFilter(),g=ac.createGain();f.type='lowpass';f.frequency.value=1500;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022,t+.15);g.gain.setValueAtTime(.022,t+dur-.15);g.gain.linearRampToValueAtTime(0,t+dur);
    f.connect(g);out(g,-.15,.8);for(const m of ms)for(const det of[-8,8]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mt(m);o.detune.value=det;o.connect(f);o.start(t);o.stop(t+dur+.02)}};
  const cello=(t,m,dur)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=mt(m);f.type='lowpass';f.frequency.value=700;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.05);g.gain.setValueAtTime(.06,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);out(g,-.3,.4);o.start(t);o.stop(t+dur+.02)};
  const harpsi=(t,m)=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='square';o.frequency.value=mt(m);f.type='highpass';f.frequency.value=500;
    g.gain.setValueAtTime(.016,t);g.gain.exponentialRampToValueAtTime(.0003,t+.6);o.connect(f);f.connect(g);out(g,.35,.4);o.start(t);o.stop(t+.65)};
  const timp=(t,m,a)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(mt(m)*1.04,t);o.frequency.exponentialRampToValueAtTime(mt(m),t+.08);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+1.4);
    o.connect(g);out(g,0,.5);o.start(t);o.stop(t+1.5);noiseHit(ac,bus,t,'lowpass',500,.7,a*.4,.15,0,noise)};
  let bar=0,next=t0;
  const playBar=t=>{const i=bar%16,round=(bar>>4)%2,c=PROG[i],ch=TRI(c).map(x=>ddeg(x)-12),root=ddeg(c)-24;
    strings(t,ch,beat*4);
    [root,ddeg(c+2)-24,ddeg(c+4)-24,ddeg(c+2)-24].forEach((m,b)=>cello(t+b*beat,m,beat*.9));
    for(let k=0;k<16;k++)harpsi(t+k*beat/4,ch[[0,1,2,1][k%4]]+12*((k>>2)%2));
    timp(t,c==4||c==1?45:38,.35);timp(t+beat*2,45,.22);if(i%4==3){for(let k=0;k<6;k++)timp(t+beat*3+k*beat/6,38,.08+k*.03)}
    if(round){let tt=t;for(const[dd,len]of TUNE[i]){trumpet(tt,ddeg(dd),len*beat*.95,.2,.04);trumpet(tt+.006,ddeg(dd-2),len*beat*.95,-.05,.028);tt+=len*beat}}
    bar++};
  const tick=()=>{while(next<ac.currentTime+1.2){playBar(next);next+=beat*4}};tick();const iv=setInterval(tick,250);
  return{stop(){clearInterval(iv);bus.gain.setTargetAtTime(0,ac.currentTime,.8);setTimeout(()=>bus.disconnect(),4000)}}}
const TRACKS={regal:startRegal,romani:startRomani,mill:()=>startIndustry('mill'),rig:()=>startIndustry('rig'),plant:()=>startIndustry('plant'),cola:()=>startIndustry('cola'),casino:startCasino,cafe:startCafe,spy:startSpy,woods:startWoods,army:startArmy,chant:startChant,ocean:startOcean,jazz:startJazz,arcade:startArcade,shop:startShop,pizzeria:startPizzeria};
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
// Kaisa speaking: the caption, line by line, and the browser's voice if there is one (a woman's English voice if it has one, any
// English voice if not); then done()
function djVoice(){const vs=window.speechSynthesis?speechSynthesis.getVoices():[];
  return vs.find(v=>/^en/i.test(v.lang)&&/female|zira|hazel|susan|libby|sonia|samantha|karen/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null}
// browsers load their voices after the page, so look again when they arrive
let DJV=null;const findVoice=()=>{DJV=djVoice()};if(window.speechSynthesis){findVoice();speechSynthesis.addEventListener?.('voiceschanged',findVoice)}
function djTalk(lines,done){let i=0;const voice=DJV||djVoice();
  const next=()=>{if(!RADIO.playing)return;if(i>=lines.length){done();return}const t=lines[i++];radioSay('Kaisa: '+t);
    if(voice){const u=new SpeechSynthesisUtterance(t);u.voice=voice;u.rate=1;u.pitch=1.08;u.volume=.9*MU.vol;let fin=false;const go=()=>{if(!fin){fin=true;setTimeout(next,350)}};u.onend=go;u.onerror=go;speechSynthesis.speak(u);setTimeout(go,t.length*90+3000)}
    else setTimeout(next,1800+t.length*55)};next()}
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
  // the station's chime before a break, and a soft bed of music under her voice
  const chime=()=>{const t=ac.currentTime+.05;[[0,659.3],[.22,830.6],[.44,987.8],[.7,1318.5]].forEach(([dt,f])=>{for(const[r,a]of[[1,.06],[2.01,.02],[3,.008]]){const o=ac.createOscillator(),gg=ac.createGain();
      o.frequency.value=f*r;gg.gain.setValueAtTime(0,t+dt);gg.gain.linearRampToValueAtTime(a,t+dt+.01);gg.gain.exponentialRampToValueAtTime(.0005,t+dt+1.4);o.connect(gg);gg.connect(hp);gg.connect(echo);o.start(t+dt);o.stop(t+dt+1.5)}});return 1.6};
  let bed=null;const bedOn=()=>{const t=ac.currentTime,bg=ac.createGain(),bf=ac.createBiquadFilter();bf.type='lowpass';bf.frequency.value=900;bg.gain.value=0;bg.gain.setTargetAtTime(.022,t+.3,.8);bf.connect(bg);bg.connect(hp);
      const root=[-5,-2,0,3][Math.random()*4|0],os=CHORD.maj7.map(iv=>{const o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(root+iv-12);o.detune.value=(Math.random()-.5)*10;o.connect(bf);o.start(t);return o});
      bed={bg,os}};
  const bedOff=()=>{if(!bed)return;const{bg,os}=bed,t=ac.currentTime;bed=null;bg.gain.setTargetAtTime(0,t,.5);os.forEach(o=>o.stop(t+3))};
  // a break: the chime (on the first and now and then after), the bed fading in, then Kaisa; the bed fades as the song starts
  let breaks=0;const talk=()=>{song=newSong();const lines=djLines(last,[song.title,song.artist]),pre=breaks++%3==0?chime():.3;bedOn();
    setTimeout(()=>{if(RADIO.playing)djTalk(lines,()=>{bedOff();play()})},pre*1000)};
  talk();iv=setInterval(tick,300);
  return{stop(){RADIO.playing=false;clearInterval(iv);bedOff();if(window.speechSynthesis)speechSynthesis.cancel();radioSay('');out.gain.setTargetAtTime(0,ac.currentTime,.4);setTimeout(()=>{crackle.stop();out.disconnect()},2500)}}}
TRACKS.radio=startRadio;
function showRadioBtn(){radioBtn.setAttribute('aria-pressed',RADIO.on);radioBtn.innerHTML=RADIO.on?'&#128251; Radio on':'&#128251; Radio'}
function toggleRadio(){RADIO.on=!RADIO.on;try{localStorage.setItem('sarivalto-radio',RADIO.on?'on':'off')}catch(e){}showRadioBtn();return RADIO.on?'You switch on the radio. Radio Sarivalto crackles into life.':'You switch the radio off.'}
radioBtn.onclick=()=>{toggleRadio();radioBtn.blur()};showRadioBtn();
