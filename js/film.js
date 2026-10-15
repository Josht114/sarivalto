// ---- STORMWING, the picture showing at the cinema: an 80-second animated short about two fighter pilots over the frozen North,
// Falcon and his wingman Frost. Sit in one of the cinema's seats (or buy a ticket from Otto) to watch it, for $4. It plays in the
// start-menu panel (START 'film'); Space pauses it, Escape leaves. The film is drawn fresh for any moment (filmFrame(g, t)), so
// it can be paused, skipped or checked frame by frame. 256x144, drawn at twice that for sharper subtitles.
const FW=256,FH=144,clamp=u=>Math.max(0,Math.min(1,u)),ease=u=>u*u*(3-2*u),fade=(u,a=.12)=>Math.min(clamp(u/a),clamp((1-u)/a));
const FILM={t:0,last:0,paused:false,ended:false};
// ---- drawing helpers
function fsky(g,c1,c2,c3){const gr=g.createLinearGradient(0,0,0,FH);gr.addColorStop(0,c1);gr.addColorStop(.62,c2);gr.addColorStop(1,c3);g.fillStyle=gr;g.fillRect(0,0,FW,FH)}
function fsun(g,x,y,r,col){const gr=g.createRadialGradient(x,y,0,x,y,r*3);gr.addColorStop(0,col);gr.addColorStop(.3,col+'88');gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fillRect(x-r*3,y-r*3,r*6,r*6);g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
// a range of mountains, repeating every 256 pixels, scrolled by off; snow on the peaks if snow is set
function fmount(g,off,base,h,col,snow,seed){const pk=[];for(let i=0;i<8;i++)pk.push([i*36+((seed*37+i*53)%17),base-h*(.45+((seed*13+i*29)%10)/18)]);
  for(const k of[-1,0,1]){const ox=((-off%256)+256)%256+k*256-256;g.fillStyle=col;g.beginPath();g.moveTo(ox,FH);pk.forEach(([x,y],i)=>{g.lineTo(ox+x,y);g.lineTo(ox+x+18,base-h*.2)});g.lineTo(ox+300,FH);g.fill();
    if(snow){g.fillStyle=snow;pk.forEach(([x,y])=>{g.beginPath();g.moveTo(ox+x,y);g.lineTo(ox+x+7,y+8);g.lineTo(ox+x+2,y+6);g.lineTo(ox+x-4,y+9);g.closePath();g.fill()})}}}
function fclouds(g,off,y,col,n,sz){g.fillStyle=col;for(let i=0;i<n;i++){const x=((i*97+13)%300)-((off*(1+i%3*.3))%300+300)%300+300,yy=y+(i*23%30);
  for(const[dx,dy,r]of[[0,0,sz],[sz*.9,-sz*.3,sz*.8],[sz*1.8,0,sz*.7]]){g.beginPath();g.arc((x%300)-30+dx,yy+dy,r,0,7);g.fill()}}}
// a fighter jet seen from the side, nose to the right (dir -1 faces left), s its size; ab lights the afterburner; bandits are dark
// with a red band
function fjet(g,x,y,s,dir=1,o={}){const T=o.t??0,col=o.bandit?'#4a4f58':'#9aa6b4',dk=o.bandit?'#2b2f36':'#6a7684';g.save();g.translate(x,y);g.rotate(o.tilt||0);g.scale(dir*s,s);
  if(o.ab){const f=10+Math.sin(T*60)*3;g.fillStyle='#ff8a3a';g.beginPath();g.moveTo(-1,-2.2);g.lineTo(-f,0);g.lineTo(-1,2.2);g.fill();g.fillStyle='#fff3a0';g.beginPath();g.moveTo(-1,-1.2);g.lineTo(-f*.55,0);g.lineTo(-1,1.2);g.fill()}
  g.fillStyle=dk;g.beginPath();g.moveTo(3,-3);g.lineTo(0,-12);g.lineTo(5,-12);g.lineTo(12,-3);g.fill();
  g.fillStyle=col;g.beginPath();g.moveTo(0,-2.5);g.lineTo(8,-3.5);g.lineTo(30,-3.5);g.lineTo(42,0);g.lineTo(30,2.5);g.lineTo(4,3);g.lineTo(0,2.5);g.fill();
  g.fillStyle=dk;g.beginPath();g.moveTo(13,1);g.lineTo(25,1);g.lineTo(9,8);g.fill();g.fillRect(0,-2.5,3,5);
  g.fillStyle='#8fd0ff';g.beginPath();g.ellipse(29,-4,6,2.6,0,Math.PI,0);g.fill();g.fillStyle='#e8f6ff';g.fillRect(27,-5.5,3,1);
  if(o.bandit){g.fillStyle='#c0392b';g.fillRect(36,-2,3,4);g.fillRect(4,-11,3,3)}else{g.fillStyle='#2e5db0';g.beginPath();g.arc(5,-7,2,0,7);g.fill();g.fillStyle='#fff';g.fillRect(4.5,-7.5,1,1);g.fillStyle='#1f3a6f';g.fillRect(14,-1,10,1)}
  g.restore()}
function fmissile(g,x,y,ang,len=7){g.save();g.translate(x,y);g.rotate(ang);g.fillStyle='#e8e8e8';g.fillRect(-len,-1,len,2);g.fillStyle='#c0392b';g.fillRect(0,-1,2,2);g.fillStyle='#ffd23a';g.fillRect(-len-3,-1,3,2);g.restore()}
function fboom(g,x,y,u){if(u<=0||u>=1)return;const r=4+u*26;g.globalAlpha=1-u;g.fillStyle='#6a6a70';g.beginPath();g.arc(x,y-u*6,r*1.1,0,7);g.fill();
  g.fillStyle='#ff8a3a';g.beginPath();g.arc(x,y,r*.8,0,7);g.fill();g.fillStyle='#fff3a0';g.beginPath();g.arc(x,y,r*.45*(1-u),0,7);g.fill();g.globalAlpha=1;
  for(let i=0;i<10;i++){const a=i*.63,d=r*1.3;g.fillStyle='#2b2f36';g.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d+u*u*20,2,2)}}
// subtitles: who speaks (in gold) and what they say, wrapped across up to two lines on a dark band
function fsub(g,who,text){g.font='bold 8px sans-serif';const words=(who?who+': ':'')+text,lines=[];let cur='';
  for(const w of words.split(' ')){const tr=cur?cur+' '+w:w;if(g.measureText(tr).width>228&&cur){lines.push(cur);cur=w}else cur=tr}lines.push(cur);
  const h=lines.length*10+6;g.fillStyle='rgba(0,0,0,.62)';g.fillRect(8,FH-h-4,FW-16,h);g.textAlign='center';
  lines.forEach((l,i)=>{const y=FH-h+7+i*10;if(i==0&&who){const wd=g.measureText(l).width,wp=g.measureText(who+':').width;g.textAlign='left';g.fillStyle='#ffd23a';g.fillText(who+':',FW/2-wd/2,y);g.fillStyle='#fff';g.fillText(l.slice(who.length+1),FW/2-wd/2+wp,y);g.textAlign='center'}
    else{g.fillStyle='#fff';g.fillText(l,FW/2,y)}})}
const ftext=(g,s,x,y,font,col,al='center')=>{g.font=font;g.textAlign=al;g.fillStyle=col;g.fillText(s,x,y)};
// ---- the scenes: how long each lasts (seconds) and how to draw it at a point u (0 to 1) through it, T seconds in
const SCENES=[
  // a studio card on black
  {d:5,f(g,u){g.fillStyle='#000';g.fillRect(0,0,FW,FH);g.globalAlpha=Math.sin(Math.PI*u);g.fillStyle='#9fc0e0';g.beginPath();g.moveTo(128,40);g.lineTo(146,70);g.lineTo(110,70);g.fill();
    g.strokeStyle='#e8f4fa';g.lineWidth=2;g.beginPath();g.moveTo(98,62);g.quadraticCurveTo(128,48,160,58);g.stroke();ftext(g,'NORTHWIND PICTURES',128,90,'bold 11px serif','#e8f4fa');ftext(g,'presents',128,104,'italic 8px serif','#9fc0e0');g.globalAlpha=1}},
  // the title over a sunset, a jet streaking across
  {d:7,f(g,u,T){fsky(g,'#1a1040','#c0406a','#ffb050');fsun(g,190,104,14,'#ffd27a');fmount(g,T*6,128,46,'#3a1e4a',null,2);fmount(g,T*14,140,30,'#24122e',null,5);
    const x=-50+ease(clamp(u/.55))*360;g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(-10,72);g.lineTo(x-6,72);g.stroke();fjet(g,x,70,.9,1,{ab:1,t:T});
    if(u>.42){const k=ease(clamp((u-.42)/.2)),sc=1.6-.6*k;g.save();g.globalAlpha=k;g.translate(128,52);g.scale(sc,sc);g.font='bold 30px serif';g.textAlign='center';
      const gr=g.createLinearGradient(0,-24,0,4);gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,'#9fb0c0');gr.addColorStop(.55,'#5a6a7a');gr.addColorStop(1,'#d8e4ee');
      g.fillStyle='#1a1020';g.fillText('STORMWING',2,2);g.fillStyle=gr;g.fillText('STORMWING',0,0);g.restore();g.globalAlpha=1}
    if(u>.66){g.globalAlpha=clamp((u-.66)/.12);ftext(g,'The sky has no speed limit.',128,74,'italic 9px serif','#fff3e0');g.globalAlpha=1}}},
  // Falcon in the cockpit at dusk, grinning behind his sunglasses
  {d:5,f(g,u){fsky(g,'#2a1a3a','#d0603a','#f0a050');g.fillStyle='#3a2a2a';g.fillRect(0,96,FW,48);g.fillStyle='#2a1e1e';for(let x=0;x<FW;x+=40)g.fillRect(x,84,30,14);
    g.fillStyle='#5a6b3a';g.beginPath();g.ellipse(128,150,74,40,0,0,7);g.fill();g.fillStyle='#4a5a30';g.fillRect(122,112,12,32);g.fillStyle='#d9a37a';g.fillRect(118,92,20,18);
    g.fillStyle='#f1c7a0';g.beginPath();g.ellipse(128,76,20,24,0,0,7);g.fill();g.fillStyle='#f4f4f0';g.beginPath();g.ellipse(128,62,25,22,0,Math.PI,0);g.fill();g.fillRect(103,60,6,22);g.fillRect(147,60,6,22);
    g.fillStyle='#c0392b';g.fillRect(124,40,8,22);g.fillStyle='#ffd23a';g.fillRect(104,58,48,3);
    g.fillStyle='#1a1a22';g.beginPath();g.ellipse(119,74,8,5,0,0,7);g.ellipse(137,74,8,5,0,0,7);g.fill();g.fillStyle='#c9a040';g.fillRect(126,72,4,1.5);g.fillStyle='#5a6a8a';g.fillRect(114,71,4,2);g.fillRect(132,71,4,2);
    g.strokeStyle='#8a4a3a';g.lineWidth=1.6;g.beginPath();g.arc(128,86,7,.2,Math.PI-.2);g.stroke();g.fillStyle='#fff';g.fillRect(123,88,10,2);
    g.fillStyle='#5a5f68';g.beginPath();g.ellipse(100,92,6,8,.5,0,7);g.fill();
    fsub(g,u<.55?'FALCON':'TOWER',u<.55?'Tower, this is Falcon. Requesting permission to go fast.':'Denied, Falcon.')}},
  // take-off: down the runway at dusk and up on the afterburner
  {d:5,f(g,u,T){fsky(g,'#241a40','#a0405a','#e89050');fmount(g,0,112,30,'#3a2a4a','#c8c0d8',7);g.fillStyle='#2a2a30';g.fillRect(0,112,FW,32);g.fillStyle='#f4f4f0';
    for(let x=((-T*120)%24+24)%24-24;x<FW;x+=24)g.fillRect(x,126,12,2);for(let x=((-T*120)%32+32)%32;x<FW;x+=32){g.fillStyle='#ffd23a';g.fillRect(x,114,2,2);g.fillRect(x,140,2,2)}
    const k=ease(clamp(u/.95)),x=30+k*170,lift=clamp((u-.5)/.5),y=120-lift*lift*80;fjet(g,x,y,.85,1,{ab:1,t:T,tilt:-lift*.35});
    fsub(g,'FALCON',u<.4?'Copy, Tower.':'Going fast.')}},
  // Falcon and Frost in formation over the snowy mountains
  {d:6,f(g,u,T){fsky(g,'#2e6fb0','#8fc4e8','#d8ecf8');fclouds(g,T*30,24,'rgba(255,255,255,.8)',5,8);fmount(g,T*20,120,56,'#5a6a80','#f4f8fc',3);fmount(g,T*45,144,34,'#3a4a5e','#e8f0f8',9);
    fjet(g,96,58+Math.sin(T*2)*2,.85,1,{ab:1,t:T});fjet(g,150,40+Math.sin(T*2+1)*2,.75,1,{ab:1,t:T});
    fsub(g,u<.5?'FROST':'FALCON',u<.5?'Stay on my wing this time, Falcon.':'Right behind you. Mostly.')}},
  // the radar: two bandits coming in from the north
  {d:5,f(g,u,T){g.fillStyle='#04140a';g.fillRect(0,0,FW,FH);const cx=128,cy=64;g.strokeStyle='#1f6a3a';g.lineWidth=1;for(const r of[16,32,48]){g.beginPath();g.arc(cx,cy,r,0,7);g.stroke()}
    g.beginPath();g.moveTo(cx-52,cy);g.lineTo(cx+52,cy);g.moveTo(cx,cy-52);g.lineTo(cx,cy+52);g.stroke();const a=T*3;g.strokeStyle='#5fe08a';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*50,cy+Math.sin(a)*50);g.stroke();
    for(const[dx,b]of[[-10,0],[12,.4]]){const y=cy-46+u*30;g.fillStyle=(T*4|0)%2?'#ff3b2f':'#a02018';g.fillRect(cx+dx-2,y-2+b*6,4,4)}g.fillStyle='#5fe08a';g.fillRect(cx-2,cy-2,4,4);
    ftext(g,'N',cx,cy-54,'bold 7px monospace','#5fe08a');ftext(g,'BANDITS: 2',214,20,'bold 8px monospace','#ff3b2f');fsub(g,'COMMAND','Two bandits inbound from the north. Weapons free.')}},
  // the dogfight: a bandit closing in on Falcon's tail through the clouds
  {d:7,f(g,u,T){fsky(g,'#3a7ac0','#9fd0f0','#e8f4fc');fclouds(g,T*160,30,'rgba(255,255,255,.9)',6,10);fclouds(g,T*260,90,'rgba(255,255,255,.7)',5,7);
    g.strokeStyle='rgba(255,255,255,.6)';for(let i=0;i<8;i++){const y=(i*19+T*30)%FH,x=((i*71-T*400)%FW+FW)%FW;g.beginPath();g.moveTo(x,y);g.lineTo(x+20,y);g.stroke()}
    fjet(g,150+Math.sin(T*1.7)*14,66+Math.sin(T*2.3)*16,.85,1,{ab:1,t:T,tilt:Math.sin(T*2.3)*.25});fjet(g,20+u*70,72+Math.sin(T*2.3-.6)*14,.75,1,{bandit:1,ab:1,t:T,tilt:Math.sin(T*2.3-.6)*.25});
    if(u>.35)for(let i=0;i<4;i++){const k=((T*5+i*.25)%1);g.fillStyle='#ffd23a';g.fillRect(60+u*70+k*80,74+Math.sin(T*2.3-.6)*14-k*6,3,1)}
    fsub(g,u<.5?'FROST':'FALCON',u<.5?'Falcon! You\'ve got one on your six!':'I see him. Hold on to something.')}},
  // the brakes: Falcon slows, and the bandit shoots straight past him
  {d:5,f(g,u,T){fsky(g,'#3a7ac0','#9fd0f0','#e8f4fc');fclouds(g,T*60,36,'rgba(255,255,255,.85)',5,9);const k=ease(clamp(u/.8));
    fjet(g,150-k*60,70,.85,1,{t:T,tilt:-.08*k});g.fillStyle='#6a7684';if(u>.1&&u<.9){g.fillRect(150-k*60+14,62,2,5)}
    fjet(g,-30+ease(clamp((u-.15)/.6))*330,66,.8,1,{bandit:1,ab:1,t:T});g.strokeStyle='rgba(255,255,255,.7)';for(let i=0;i<6;i++){const x=((i*53-T*300)%FW+FW)%FW;g.beginPath();g.moveTo(x,20+i*20);g.lineTo(x+24,20+i*20);g.stroke()}
    fsub(g,'FALCON',u<.45?'Hit the brakes...':'...and he flies right by.')}},
  // through Falcon's HUD: the bandit ahead, the box closing in, LOCK, and a missile away
  {d:6,f(g,u,T){fsky(g,'#4a8ac8','#a8d8f4','#eef8fc');fclouds(g,T*40,40,'rgba(255,255,255,.85)',5,9);const bx=128+Math.sin(T*1.6)*30,by=58+Math.cos(T*1.2)*10;
    const hit=u>.86;if(!hit)fjet(g,bx-12,by,.55,1,{bandit:1,ab:1,t:T});const sz=40-clamp(u/.5)*28,col='#7fff9a';g.strokeStyle=col;g.lineWidth=1;g.strokeRect(bx-sz/2+8,by-sz/2-2,sz,sz);
    g.beginPath();g.arc(128,72,26,0,7);g.moveTo(128,40);g.lineTo(128,52);g.moveTo(128,92);g.lineTo(128,104);g.moveTo(96,72);g.lineTo(108,72);g.moveTo(148,72);g.lineTo(160,72);g.stroke();
    for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(30,72+i*14);g.lineTo(40,72+i*14);g.moveTo(216,72+i*14);g.lineTo(226,72+i*14);g.stroke()}ftext(g,'450',22,75,'bold 7px monospace',col);ftext(g,'12000',236,75,'bold 7px monospace',col);
    if(u>.5&&!hit&&(T*6|0)%2)ftext(g,'LOCK',128,30,'bold 10px monospace','#ff3b2f');
    if(u>.66&&!hit){const k=clamp((u-.66)/.2),mx=128+(bx+8-128)*k,my=140+(by-140)*k;for(let i=1;i<8;i++){g.fillStyle=`rgba(230,230,230,${.5-i*.06})`;g.beginPath();g.arc(128+(bx+8-128)*k*(1-i*.1),140+(by-140)*k*(1-i*.1),2+i*.6,0,7);g.fill()}fmissile(g,mx,my,Math.atan2(by-140,bx+8-128))}
    if(hit)fboom(g,bx+8,by,clamp((u-.86)/.14)*.6);fsub(g,'FALCON',u<.6?'Come on... come on...':'Fox two!')}},
  // splash one: the smoke clears and a parachute drifts down
  {d:5,f(g,u,T){fsky(g,'#4a8ac8','#a8d8f4','#eef8fc');fclouds(g,T*20,60,'rgba(255,255,255,.85)',5,9);fboom(g,150,50,.35+u*.6);
    const px=110-u*10,py=30+u*50;g.strokeStyle='#5a5f68';g.lineWidth=.6;g.beginPath();g.moveTo(px-9,py);g.lineTo(px,py+14);g.lineTo(px+9,py);g.stroke();
    g.fillStyle='#f4f4f0';g.beginPath();g.ellipse(px,py,10,6,0,Math.PI,0);g.fill();g.fillStyle='#c0392b';g.fillRect(px-2,py-6,4,6);g.fillStyle='#2b2f36';g.fillRect(px-1,py+13,2,5);
    fsub(g,'FROST',u<.5?'Splash one!':'And he got out. Nice flying, Falcon.')}},
  // the other bandit runs for home
  {d:5,f(g,u,T){fsky(g,'#d08040','#f0b070','#f8d8a0');fmount(g,T*10,124,40,'#7a5a6a','#f4e0e8',4);const k=ease(u),s=.7-k*.6;fjet(g,120+k*90,60-k*20,s,1,{bandit:1,ab:1,t:T});
    fjet(g,40,90+Math.sin(T*2)*2,.8,1,{ab:1,t:T});fsub(g,'FALCON',u<.5?'The other one\'s running home.':'Let him go. Let him tell them about us.')}},
  // the flyby: low past the control tower, and the tower is not happy
  {d:6,f(g,u,T){fsky(g,'#3a2a5a','#d06a50','#f4a860');fmount(g,0,110,26,'#4a3a5a','#e0d0e0',6);g.fillStyle='#2a2a30';g.fillRect(0,114,FW,30);
    g.fillStyle='#5a5f68';g.fillRect(186,60,22,54);g.fillStyle='#3a3d44';g.fillRect(180,46,34,16);g.fillStyle='#8fd0ff';g.fillRect(183,49,28,8);
    const shake=u>.38&&u<.6?Math.sin(T*80)*1.5:0;g.fillStyle='#2b2f36';g.fillRect(195+shake,51,4,6);g.fillStyle='#f1c7a0';g.fillRect(195+shake,49,4,3);
    const x=-60+ease(clamp((u-.15)/.4))*380;fjet(g,x,92,1,1,{ab:1,t:T});
    if(u>.45){const k=clamp((u-.45)/.4);g.fillStyle='#f4f4f0';g.fillRect(212+k*30,52-k*10+k*k*40,4,4);g.fillStyle='#6b4423';g.fillRect(213+k*30,52-k*10+k*k*40,2,1)}
    fsub(g,u<.6?'TOWER':'FALCON',u<.6?'FALCON!':'Sorry, Tower. Couldn\'t hear you.')}},
  // off into the sunset, and THE END
  {d:6,f(g,u,T){fsky(g,'#2a1040','#d0506a','#ffb860');fsun(g,128,104,18,'#ffd88a');fmount(g,T*4,124,34,'#3a1e4a',null,8);fmount(g,T*9,140,22,'#24122e',null,1);
    const k=ease(u),s=.7-k*.5;fjet(g,100+k*24,80-k*14,s,1,{ab:1,t:T});fjet(g,136+k*6,70-k*12,s*.92,1,{ab:1,t:T});
    if(u>.5){g.globalAlpha=clamp((u-.5)/.2);ftext(g,'THE END',128,46,'bold 18px serif','#fff3e0');g.globalAlpha=1}}},
  // the credits roll
  {d:9,f(g,u){g.fillStyle='#000';g.fillRect(0,0,FW,FH);const L=['STORMWING','','FALCON','Jack Rivers','','FROST','Lena Nord','','TOWER','Bertil Mattsson','','COMMAND','Ulla Strand','','Flying sequences','The Northern Air Wing','','Filmed on location','in the skies over the North','','A NORTHWIND PICTURE','','No tower controllers were','harmed in the making of this film.'];
    const y0=FH+10-u*(L.length*11+FH);L.forEach((l,i)=>ftext(g,l,128,y0+i*11,i==0||/^[A-Z ]+$/.test(l)&&l.length>2?'bold 8px serif':'8px serif',i==0?'#ffd23a':/^[A-Z ]+$/.test(l)?'#9fc0e0':'#e8e8e8'))}}];
const FILM_LEN=SCENES.reduce((a,s)=>a+s.d,0);
// draw the film as it is t seconds in
function filmFrame(g,t){let a=0;for(const s of SCENES){if(t<a+s.d||s==SCENES[SCENES.length-1]){const T=Math.min(t-a,s.d),u=T/s.d;g.save();s.f(g,u,T);g.restore();
  // a quick fade between scenes, and a little film grain
  const fa=1-Math.min(clamp(T/.35),clamp((s.d-T)/.35));if(fa>0){g.fillStyle=`rgba(0,0,0,${fa})`;g.fillRect(0,0,FW,FH)}break}a+=s.d}
  for(let i=0;i<14;i++){g.fillStyle=`rgba(255,255,255,${.05+((i*7+(t*24|0))%5)*.01})`;g.fillRect((i*67+(t*24|0)*31)%FW,(i*41+(t*24|0)*17)%FH,1,1)}}
// ---- at the cinema: a seat (or Otto's counter) and the ticket
function watchFilm(){if(ME.cash<4){say('A ticket is $4, and you don\'t have enough money of your own.',4000);return}ME.cash-=4;FILM.t=0;FILM.paused=false;FILM.ended=false;startPlay('film');FILM.last=performance.now();requestAnimationFrame(filmLoop)}
function filmLoop(now){if(START!='film')return;const dt=Math.min(.1,(now-FILM.last)/1000);FILM.last=now;if(!FILM.paused)FILM.t+=dt;
  const c=startEl.querySelector('#filmc');if(c){const g=c.getContext('2d');g.setTransform(2,0,0,2,0,0);filmFrame(g,Math.min(FILM.t,FILM_LEN));if(FILM.paused){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,FW,FH);ftext(g,'PAUSED',128,76,'bold 12px monospace','#fff')}}
  if(FILM.t>=FILM_LEN+1.5){closeStart();say('The lights come up. What a picture!',4000);return}requestAnimationFrame(filmLoop)}
PLAYS.film={
  render(){startEl.innerHTML=gameHead('STORMWING','now showing')+`<div class="film"><canvas id="filmc" width="${FW*2}" height="${FH*2}" aria-label="The film STORMWING playing"></canvas></div><p class="note">Space pauses &middot; Escape leaves the cinema</p>`;
    wire();const g=startEl.querySelector('#filmc').getContext('2d');g.setTransform(2,0,0,2,0,0);filmFrame(g,FILM.t)},
  act(){},
  key(k){if(k==' '||k=='p'||k=='P'){FILM.paused=!FILM.paused;return true}return/^Arrow|^[wasde]$/i.test(k)}};
