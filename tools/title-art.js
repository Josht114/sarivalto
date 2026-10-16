// The title screen's picture (img/title.png), drawn by tools/make-title.html, in the style of an 80s neon poster. He is a
// premade pixel-art cut-out (tools/title-figure.png): a dirty-blond man with a moustache, in a white suit and a pink shirt, with
// aviator sunglasses (and, drawn on him here, a wad of cash in his breast pocket), a Kelp Cola raised in one hand and a hot dog in the other, a cigarette in the corner of his mouth. Behind
// him, drawn here: a hot-pink sky with a striped sunset, the aurora, snowy peaks, the island's town lit in neon (the casino, Kelp
// Cola, Polar Burger), the radio tower, the palace dome, the lighthouse, pines, a jet crossing the sky, and islanders out on the
// street: Buttons juggling, Kelpy waving, a Syndicate man, a woman in a fur coat, a police officer, a fisherman with his catch, a
// palace guard, faces at the windows. SARIVALTO in hot pink with an orange edge and a purple drop. titleArt draws the scene at
// 480x320 at a moment t (milliseconds); makeTitle turns it into the 240x160 pixel-art picture, with him and the words on top.
const TLW=480,TLH=320;
const TSTARS=Array.from({length:70},(_,i)=>[(i*97.3)%TLW,(i*53.7)%(TLH*.4),(i%5)/5]);
const TFLAKES=Array.from({length:80},(_,i)=>[(i*71.3)%TLW,(i*37.9)%TLH,.4+(i%4)*.25,(i%7)/7]);
// ---- behind him
function titleBack(g,s){
  // a hot-pink sky over purple night, stars, and the aurora in pink and cyan
  let gr=g.createLinearGradient(0,0,0,TLH);gr.addColorStop(0,'#0e0420');gr.addColorStop(.38,'#3a0a52');gr.addColorStop(.6,'#a0186e');gr.addColorStop(.72,'#ff4f8a');gr.addColorStop(1,'#ff9a5a');g.fillStyle=gr;g.fillRect(0,0,TLW,TLH);
  TSTARS.forEach(([x,y,k])=>{g.fillStyle=`rgba(255,240,255,${.4+.5*Math.abs(Math.sin(s*1.3+k*9))})`;g.fillRect(x,y,1.3,1.3)});
  for(let b=0;b<2;b++){g.beginPath();for(let x=0;x<=TLW;x+=8){const y=40+b*16+Math.sin(x/70+s*.4+b)*12;x?g.lineTo(x,y):g.moveTo(x,y)}for(let x=TLW;x>=0;x-=8)g.lineTo(x,40+b*16+Math.sin(x/70+s*.4+b)*12+22);
    g.closePath();g.fillStyle=['rgba(95,240,255,.18)','rgba(255,95,200,.16)'][b];g.fill()}
  // the striped sunset
  const sx=300,sy=170,R=70;gr=g.createLinearGradient(0,sy-R,0,sy+R);gr.addColorStop(0,'#fff27a');gr.addColorStop(.5,'#ff9a4a');gr.addColorStop(1,'#ff2f8a');g.fillStyle=gr;g.beginPath();g.arc(sx,sy,R,0,7);g.fill();
  for(let k=0;k<7;k++){const y=sy+4+k*k*1.6+k*5;g.fillStyle='#c0207a';g.fillRect(sx-R,y,R*2,1.5+k*.7)}
  // a jet crossing the sky every so often (the cinema's STORMWING)
  const jt=(s%14)/5;if(jt<1){const x=-40+jt*(TLW+80),y=30+jt*16;g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1;g.beginPath();g.moveTo(x-90,y-8);g.lineTo(x,y);g.stroke();
    g.fillStyle='#f4e8ff';g.beginPath();g.moveTo(x,y);g.lineTo(x-12,y-3);g.lineTo(x-12,y+1);g.closePath();g.fill()}
  // the peaks, snow on them catching the pink
  g.fillStyle='#2a0a3e';g.beginPath();g.moveTo(0,205);[[40,152],[95,188],[150,140],[205,186],[262,160],[330,192],[392,146],[444,182],[480,162],[480,320],[0,320]].forEach(p=>g.lineTo(...p));g.fill();
  g.fillStyle='#ffc0e8';[[150,140],[392,146],[40,152],[262,160]].forEach(([x,y])=>{g.beginPath();g.moveTo(x,y);g.lineTo(x+10,y+10);g.lineTo(x-10,y+10);g.fill()});
  // the radio tower with its red light, the palace dome, the lighthouse and its beam
  g.strokeStyle='#14061e';g.lineWidth=2.5;g.beginPath();g.moveTo(26,262);g.lineTo(40,104);g.lineTo(54,262);g.moveTo(31,210);g.lineTo(49,210);g.moveTo(34,166);g.lineTo(46,166);g.moveTo(30,236);g.lineTo(50,186);g.stroke();
  g.fillStyle='#ff2040';g.beginPath();g.arc(40,102,3,0,7);g.fill();g.fillStyle='rgba(255,32,64,.3)';g.beginPath();g.arc(40,102,8,0,7);g.fill();
  g.fillStyle='#1e0830';g.fillRect(250,214,64,60);g.beginPath();g.arc(282,214,24,Math.PI,0);g.fill();g.fillRect(280,180,4,12);g.fillStyle='#ffd23a';g.fillRect(281,176,2,4);
  const ang=s*1.1%(Math.PI*2),bx=Math.cos(ang);gr=g.createLinearGradient(463,150,463+bx*200,140);gr.addColorStop(0,'rgba(255,250,200,.5)');gr.addColorStop(1,'rgba(255,250,200,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(463,152);g.lineTo(463+bx*220,126);g.lineTo(463+bx*220,176);g.closePath();g.fill();
  g.fillStyle='#f4e8f8';g.beginPath();g.moveTo(452,262);g.lineTo(458,158);g.lineTo(468,158);g.lineTo(474,262);g.fill();g.fillStyle='#e0206a';g.fillRect(455,190,16,9);g.fillRect(454,224,18,9);g.fillStyle='#14061e';g.fillRect(455,146,16,12);g.fillStyle='#fffac8';g.fillRect(457,149,12,6);
  // the town at night: dark blocks with lit windows and neon on top
  const bld=[[296,226,62,94,'#1a0628'],[360,208,52,112,'#160a2e'],[414,236,38,84,'#200626'],[200,250,50,70,'#1a0628']];
  bld.forEach(([x,y,w,h,c])=>{g.fillStyle=c;g.fillRect(x,y,w,h);g.fillStyle='#ffd0f0';g.fillRect(x-2,y-3,w+4,4);
    for(let j=y+12;j<TLH-18;j+=13)for(let i=x+6;i<x+w-6;i+=11){const k=(i*7+j*3)%9;g.fillStyle=k<2?'#ffe066':k<3?'#5ff0ff':k<4?'#ff7ad8':'#2e1040';g.fillRect(i,j,6,7)}});
  // pines, black against the sky
  const pine=(x,y,h)=>{g.fillStyle='#0c0414';for(let k=0;k<4;k++){const w=h*(.18+k*.1);g.beginPath();g.moveTo(x,y-h+k*h*.2);g.lineTo(x+w,y-h*.55+k*h*.2);g.lineTo(x-w,y-h*.55+k*h*.2);g.fill()}g.fillRect(x-2,y-6,4,8)};
  pine(8,300,70);pine(470,300,64);pine(242,296,40);
  // the snow on the ground, catching the pink
  g.fillStyle='#f2d8f4';g.beginPath();g.moveTo(0,294);for(let x=0;x<=TLW;x+=20)g.lineTo(x,290+Math.sin(x/37)*4);g.lineTo(TLW,TLH);g.lineTo(0,TLH);g.fill();g.fillStyle='#d8b0e0';g.fillRect(0,312,TLW,8);
  for(const x of[258,446]){g.fillStyle='#14061e';g.fillRect(x,244,3,48);g.fillStyle='#fffac8';g.fillRect(x-3,240,9,5);g.fillStyle='rgba(255,250,200,.22)';g.beginPath();g.arc(x+1,244,16,0,7);g.fill()}
  titleCrowd(g,s)}
// ---- the islanders out on the street behind him, each about 40 pixels tall standing on the snow at (x, y): Buttons the jester
// juggling, a Syndicate man in a pinstripe suit and fedora, a woman in a pink fur coat, a police officer, a fisherman in yellow
// oilskins with his catch, and a palace guard in a bearskin by the palace; and people at the lit windows
function figure(g,x,y,o,s){const sk=o.skin||'#f1c7a0',h=o.h||40,k=h/40;g.save();g.translate(x,y);g.scale(k,k);g.lineJoin='round';g.strokeStyle='#12061a';g.lineWidth=1.6;
  const shape=(c,f)=>{g.fillStyle=c;g.beginPath();f();g.fill();g.stroke()};
  shape(o.legs||'#2a2a33',()=>{g.rect(-6,-14,5,14);g.rect(1,-14,5,14)});shape('#14061e',()=>{g.rect(-7,-3,6,3);g.rect(1,-3,6,3)});
  shape(o.coat,()=>{g.moveTo(-9,-30);g.lineTo(9,-30);g.lineTo(o.long?11:9,o.long?-8:-13);g.lineTo(o.long?-11:-9,o.long?-8:-13);g.closePath()});
  if(o.trim)shape(o.trim,()=>g.rect(-2,-30,4,o.long?22:17));
  const arm=(sx,ex,ey)=>shape(o.coat,()=>{g.moveTo(sx,-29);g.lineTo(ex-2,ey);g.lineTo(ex+2,ey);g.lineTo(sx+(sx<0?4:-4),-29)});
  if(o.armsUp){arm(-8,-13,-40);arm(8,13,-40)}else{arm(-8,-11,-15);arm(8,11,-15)}
  shape(sk,()=>g.arc(0,-35,5.5,0,7));if(o.hair)shape(o.hair,()=>{g.arc(0,-37,5.8,Math.PI,0);g.lineTo(5.8,-35);g.lineTo(-5.8,-35)});o.extra?.(g,shape,s);g.restore()}
function titleCrowd(g,s){
  // people at the lit windows
  for(const[x,y]of[[307,238],[373,221],[389,247],[427,249],[207,262]]){g.fillStyle='#ffe066';g.fillRect(x-1,y-1,8,9);g.fillStyle='#2a0a3e';g.beginPath();g.arc(x+3,y+3,2,0,7);g.fill();g.fillRect(x,y+5,6,3)}
  // a palace guard in a bearskin, small by the palace
  figure(g,302,254,{h:20,coat:'#c0203a',legs:'#14061e',trim:'#ffd23a',extra:(g,sh)=>{sh('#14061e',()=>{g.ellipse(0,-42,6.5,9,0,0,7)})}},s);
  // Buttons the jester, juggling
  figure(g,280,290,{coat:'#e8a000',legs:'#2e6fb0',armsUp:true,trim:'#e0203a',hair:'#e04a3a',extra:(g,sh,s)=>{sh('#e0203a',()=>{g.moveTo(-6,-39);g.lineTo(0,-45);g.lineTo(-11,-46);g.closePath()});sh('#2e6fb0',()=>{g.moveTo(0,-39);g.lineTo(6,-39);g.lineTo(12,-46);g.closePath()});
    sh('#ffd23a',()=>g.arc(-11,-46,2,0,7));sh('#ffd23a',()=>g.arc(12,-46,2,0,7));
    for(let b=0;b<3;b++){const a=s*5+b*2.1;sh(['#5ff0ff','#ff4fc0','#5fffa0'][b],()=>g.arc(Math.cos(a)*10,-54-Math.abs(Math.sin(a))*12,2.4,0,7))}}},s);
  // a Syndicate man: pinstripe suit, fedora, cigar
  figure(g,352,288,{coat:'#2a2a3a',legs:'#2a2a3a',long:true,trim:'#f4f4f0',extra:(g,sh)=>{g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=.6;for(let i=-8;i<=8;i+=3){g.beginPath();g.moveTo(i,-30);g.lineTo(i*1.2,-8);g.stroke()}
    g.strokeStyle='#12061a';g.lineWidth=1.6;sh('#3a3a4a',()=>g.rect(-9,-41,18,2));sh('#3a3a4a',()=>{g.rect(-5,-47,10,6)});sh('#c0203a',()=>g.rect(-5,-43,10,1.5));sh('#8a5a30',()=>g.rect(4,-34,6,1.6))}},s);
  // a woman in a pink fur coat, red hair up, a handbag
  figure(g,392,288,{coat:'#ff7ad8',legs:'#f1c7a0',long:true,hair:'#e0403a',extra:(g,sh)=>{for(let i=-9;i<=9;i+=3)sh('#ffc0ee',()=>g.arc(i,-29,2,0,7));sh('#e0403a',()=>g.arc(0,-43,4,0,7));sh('#14061e',()=>g.rect(9,-20,6,5))}},s);
  // a police officer in a navy uniform and peaked cap
  figure(g,430,290,{coat:'#1f3a6f',legs:'#14204a',trim:'#ffd23a',extra:(g,sh)=>{sh('#14204a',()=>{g.rect(-6,-43,12,4)});sh('#14061e',()=>g.rect(-7,-39.5,14,1.6));sh('#ffd23a',()=>g.rect(-1,-42,2,2))}},s);
  // a fisherman in yellow oilskins, holding up his catch
  figure(g,30,292,{coat:'#ffd23a',legs:'#e8b800',long:true,hair:'#8a8a8a',extra:(g,sh)=>{sh('#ffd23a',()=>{g.moveTo(-7,-40);g.quadraticCurveTo(0,-48,7,-40);g.lineTo(9,-37);g.lineTo(-9,-37);g.closePath()});
    sh('#8ab8d8',()=>{g.ellipse(16,-22,7,3,.5,0,7)});sh('#8ab8d8',()=>{g.moveTo(21,-17);g.lineTo(25,-14);g.lineTo(22,-20);g.closePath()})}},s);
  // Kelpy, Kelp Cola's cup, waving from the snow
  {const x=318,y=266,w=Math.sin(s*4)*.5;g.fillStyle='#e0203a';g.beginPath();g.moveTo(x-9,y);g.lineTo(x+9,y);g.lineTo(x+6,y+22);g.lineTo(x-6,y+22);g.fill();g.fillStyle='#f4f4f0';g.fillRect(x-10,y-3,20,4);g.fillRect(x-8,y+10,16,3);
    for(let k=0;k<4;k++){g.fillStyle=k%2?'#f4f4f0':'#e0203a';g.fillRect(x+3,y-10+k*2,2,2)}g.fillStyle='#1a1a1e';g.fillRect(x-4,y+4,2,2);g.fillRect(x+2,y+4,2,2);g.fillRect(x-2,y+7,4,1);
    g.save();g.translate(x+9,y+6);g.rotate(-1+w);g.fillStyle='#e0203a';g.fillRect(0,-1.5,9,3);g.fillStyle='#f4f4f0';g.beginPath();g.arc(10,0,2.5,0,7);g.fill();g.restore()}}
// the whole scene behind him, and the snow falling over it
function titleArt(g,t){const s=t/1000;titleBack(g,s);
  TFLAKES.forEach(([x,y,sp,ph])=>{const fy=(y+s*24*sp)%TLH,fx=(x+Math.sin(s+ph*6)*10+TLW)%TLW;g.fillStyle=`rgba(255,240,255,${.55+sp*.4})`;g.beginPath();g.arc(fx,fy,sp*1.4,0,7);g.fill()})}
// the game's 3x5 pixel font (a copy of FONT in js/art.js)
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',
  H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',
  P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',
  X:'101101010101101',Y:'101101010010010',Z:'111001010100111','.':'000000000000010',' ':'000000000000000','-':'000000111000000',
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001',
  '5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111'};
// a line of the pixel font, n pixels to a font pixel, centred on x: fill (a colour, or a colour for each row of the letters),
// then an outline round it and a drop shadow (dx, dy) under that, either left out with null
function pixText(g,s,x,y,n,fill,outline,drop){const w=s.length*4*n-n,x0=Math.round(x-w/2),dot=(c,X,Y)=>{g.fillStyle=c;g.fillRect(X,Y,n,n)};
  const each=f=>[...s].forEach((ch,i)=>{const F=FONT[ch];if(F)for(let k=0;k<15;k++)if(F[k]=='1')f(x0+i*4*n+(k%3)*n,y+(k/3|0)*n,k/3|0)});
  if(drop)for(let d=drop[0];d>=1;d--)each((X,Y)=>{g.fillStyle=drop[1];g.fillRect(X+d,Y+d,n,n)});
  if(outline)each((X,Y)=>{g.fillStyle=outline;g.fillRect(X-1,Y-1,n+2,n+2)});each((X,Y,row)=>dot(typeof fill=='function'?fill(row):fill,X,Y))}
// the picture: the scene drawn at 960x640, sampled down to 240x160 (one sample in the middle of each 4x4 block, so no blurred
// edges) and cut down to ten levels a channel (so gradients fall into flat bands); then him (fig, the cut-out in
// tools/title-figure.png) standing at FIG_AT with his feet off the bottom, the cash in his pocket, a few snowflakes falling in front of him, and the
// words: SARIVALTO in hot pink with an orange edge and a purple drop, 30 DAYS IN in slanted cyan chrome at the top left, and the neon signs
const FIG_AT=[16,47];
// what he's carrying on top of the cut-out, drawn pixel by pixel (x, y are pixels of the cut-out): a wad of green banknotes
// sticking up out of his breast pocket where the pocket square was
function figExtras(g){const[ox,oy]=FIG_AT,px=(c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(ox+x,oy+y,w,h)},INK='#14061e';
  // the wad of cash: three banknotes fanned up out of the pocket, then the pocket's edge across them
  [[68,75,'#4f8f3a'],[71,73,'#6fb050'],[74,75,'#5aa045']].forEach(([x,y,c])=>{px(INK,x-1,y-1,6,9);px(c,x,y,4,8);px('#a8d890',x+1,y+1,2,1);px('#a8d890',x+1,y+3,2,2);px('#2e5a26',x+3,y,1,8)});
  px('#e0402a',68,78,10,1);px('#e3e3e3',67,81,12,3);px('#a89c88',67,81,12,1)}
// the tagline at the top left: big pixel letters leaning forward, cyan chrome (white at the top to deep blue), a dark edge, a
// hot-pink drop shadow, two speed stripes under it (pink, then a shorter orange one) and a sparkle at its corner
function tagline(g,s,x,y){const n=2,CH=['#ffffff','#c8faff','#5ff0ff','#2aaee0','#1a6ab0'];
  const each=f=>[...s].forEach((ch,i)=>{const F=FONT[ch];if(F)for(let k=0;k<15;k++)if(F[k]=='1'){const row=k/3|0;f(x+i*4*n+(k%3)*n+((4-row)>>1),y+row*n,row)}});
  each((X,Y)=>{g.fillStyle='#ff3bd0';g.fillRect(X+1,Y+2,n,n)});each((X,Y)=>{g.fillStyle='#14061e';g.fillRect(X-1,Y-1,n+2,n+2)});each((X,Y,row)=>{g.fillStyle=CH[row];g.fillRect(X,Y,n,n)});
  const w=s.length*4*n-n+2;g.fillStyle='#14061e';g.fillRect(x-1,y+5*n+3,w+2,4);g.fillRect(x+7,y+5*n+6,w-14,3);g.fillStyle='#ff3bd0';g.fillRect(x,y+5*n+4,w,2);g.fillStyle='#ffa030';g.fillRect(x+8,y+5*n+7,w-16,1);
  const sx=x+w+3,sy=y;g.fillStyle='#ffffff';g.fillRect(sx,sy-2,1,5);g.fillRect(sx-2,sy,5,1);g.fillStyle='#bff8ff';g.fillRect(sx-1,sy-1,3,3);g.fillStyle='#ffffff';g.fillRect(sx,sy,1,1)}
function makeTitle(fig,t=2500){const big=document.createElement('canvas');big.width=960;big.height=640;const bg=big.getContext('2d');bg.setTransform(2,0,0,2,0,0);titleArt(bg,t);
  const src=bg.getImageData(0,0,960,640).data,out=document.createElement('canvas');out.width=240;out.height=160;const og=out.getContext('2d'),img=og.createImageData(240,160),d=img.data,L=10;
  for(let y=0;y<160;y++)for(let x=0;x<240;x++){const i=((y*4+2)*960+x*4+2)*4,o=(y*240+x)*4;for(let c=0;c<3;c++)d[o+c]=Math.min(L-1,Math.floor(src[i+c]/255*(L-1)+.5))*255/(L-1);d[o+3]=255}
  og.putImageData(img,0,0);if(fig){og.drawImage(fig,...FIG_AT);figExtras(og)}
  TFLAKES.filter((f,i)=>i%3==0).forEach(([x,y],i)=>{const X=x/2|0,Y=(y/2+i*7)%160|0;if(X>=FIG_AT[0]&&X<FIG_AT[0]+(fig?.width||0)){og.fillStyle='#ffe8ff';og.fillRect(X,Y,1,1)}});
  pixText(og,'SARIVALTO',176,10,3,r=>['#ffe0f6','#ff9ae0','#ff4fc0','#e0209a','#b0107a'][r],'#ffa030',[3,'#4a0a6a']);
  tagline(og,'30 DAYS IN',6,6);
  pixText(og,'CASINO',163,115,1,'#ffe066','#5a3010');pixText(og,'KELP COLA',193,99,1,'#5fffa0','#0e4a2a');pixText(og,'POLAR',216,111,1,'#ff7ad8','#5a1a3a');pixText(og,'BURGER',216,117,1,'#ff7ad8','#5a1a3a');
  return out}
