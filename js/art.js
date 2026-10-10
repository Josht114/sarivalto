// ---- Detailed pixel-art renderer (modern 2D pixel style). Only the maps listed in ART2 use it; every other map still
// uses the placeholder tiles in game.js. Each map is drawn once to a cached canvas (ground, shorelines, buildings); water,
// boats, trees, props, people, smoke, flags and snowfall are drawn every frame on top.
const ART2=new Set(['village','harbour']);
const OUT='#262330',SNOW='#f3f7fa',SNOWD='#d3dfe9';
const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const RGB={},rgb=h=>RGB[h]??=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
// shade(colour, k): k>0 mixes toward white, k<0 toward black.
const shade=(h,k)=>'#'+rgb(h).map(v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,k)=>{const A=rgb(a),B=rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')};
// Smooth value noise in 0..1 (for snow drifts, wavy edges).
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),
  a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}
// Draws fn(r) on a w x h canvas with a 1px margin, then outlines everything opaque. Draw the result at (x-1, y-1).
function mk(w,h,fn){const W=w+2,H=h+2,c=cnv(W,H),g=c.getContext('2d');fn((col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x+1,y+1,a,b)});
  const d=g.getImageData(0,0,W,H),p=d.data,o=rgb(OUT),A=i=>p[i*4+3]>160,add=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(p[i*4+3])continue;
    if((x>0&&A(i-1))||(x<W-1&&A(i+1))||(y>0&&A(i-W))||(y<H-1&&A(i+W)))add.push(i)}
  add.forEach(i=>{p.set(o,i*4);p[i*4+3]=255});g.putImageData(d,0,0);return c}
// Tiny 3x5 pixel font for signs.
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',F:'111100110100100',H:'101101111101101',
  I:'111010010010111',O:'010101101101010',R:'110101110101101',S:'011100010001110','.':'000000000000010',' ':'000000000000000'};
const ptext=(r,s,x,y,col)=>[...s].forEach((ch,i)=>{const f=FONT[ch];for(let k=0;k<15;k++)if(f[k]=='1')r(col,x+i*4+k%3,y+(k/3|0))});

// ---- Ground: snow, cobbled paths, dock planks, and the rocky bank and foam where land meets water.
// Water pixels stay transparent so the animated water shows through from underneath.
const CLS=ch=>'~b'.includes(ch)?'w':'pF'.includes(ch)?'d':',E'.includes(ch)?'p':'#d'.includes(ch)?'h':'s';
const land=k=>k=='s'||k=='p'||k=='h';
const STONE=['#a39d95','#b1aba2','#978f88','#aaa39a'],PLANK=['#9a7049','#8c6542','#a5794f'];
function groundLayer(m){
  const M=MAPS[m],h=M.length,w=M[0].length,W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data;
  const cl=(x,y)=>CLS(M[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))]);
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){
    const k=cl(tx,ty),n=cl(tx,ty-1),s=cl(tx,ty+1),wv=cl(tx-1,ty),e=cl(tx+1,ty),ch=M[ty][tx];
    const tuft=ch=='.'&&hash(tx,ty,9)>.86,tox=2+(hash(tx,ty,10)*11|0),toy=4+(hash(tx,ty,11)*9|0);
    for(let ly=0;ly<16;ly++)for(let lx=0;lx<16;lx++){const X=tx*16+lx,Y=ty*16+ly;let col=null,a=255;
      if(k=='w'){
        if(land(wv)&&lx<4)col=lx<2?(lx?'#77828e':'#5c6773'):hash(X,Y,4)>(lx==2?.3:.65)?(lx==2?'#e6f3fa':'#bfdcec'):null;
        if(land(e)&&lx>11)col=lx>13?(lx==15?'#5c6773':'#77828e'):hash(X,Y,4)>(lx==13?.3:.65)?(lx==13?'#e6f3fa':'#bfdcec'):col;
        if(land(s)&&ly>12)col=ly>13?(ly==15?'#46505b':'#77828e'):hash(X,Y,5)>.35?'#e6f3fa':col;
        if(land(n)){const fh=4+(vnoise(X/3,0,6)>.55?1:0);
          if(ly==0)col=SNOWD;else if(ly<fh){const t=hash(X>>2,(Y>>1)+((X>>2)&1),5);col=ly==1?'#8f99a4':t>.6?'#77828e':t>.2?'#5c6773':'#46505b'}
          else if(ly==fh&&hash(X,7)>.25)col='#e6f3fa';else if(ly==fh+1&&hash(X,8)>.55)col='#bfdcec'}
        if(wv=='d'&&lx<3&&!col){col='#0a2236';a=80}
        if(n=='d'){const pst=lx%12==2||lx%12==3;
          if(ly<3)col=ly==0?'#6e4d30':'#4a321f';else if(pst&&ly<8)col=lx%12==2?'#5a3e27':'#3b2818';else if(ly<7){col='#0a2236';a=85}}}
      else if(k=='d'){const bd=X>>2,sm=(Y+bd*7)%24;
        col=(X&3)==3||sm==0?'#4d3624':PLANK[hash(bd,(Y+bd*7)/24|0,6)*3|0];
        if((X&3)==0&&sm)col=shade(col,.06);if((X&3)==1&&(sm==3||sm==20))col='#2f2219';
        else if((X&3)!=3&&sm&&hash(X,Y,12)>.96)col=shade(col,-.08);
        if(hash(X,Y,13)>.993)col='#e8eff5';
        if((n=='w'&&ly==0)||(wv=='w'&&lx==0)||(e=='w'&&lx==15))col='#3b2818'}
      else if(k=='p'){const row=Y/5|0,ry=Y%5,sx=X+row*3,seg=sx/6|0,l6=sx%6;
        col=STONE[hash(seg,row,14)*4|0];
        if(ry==4||l6==5)col=hash(X,Y,15)>.6?'#dde6ee':'#77716b';else if(ry==0)col=shade(col,.15);else if(ry==3||l6==4)col=shade(col,-.1);
        // snow lying over the path's edges, with a little shadow under the lip
        const lip=(q,side,dist)=>{const dep=vnoise(q/4,side,16)*3|0;if(dist<dep)col=hash(X,Y,17)>.85?'#ffffff':'#e8eff5';else if(dist==dep)col='#8a857f'};
        const op=v=>v!='p'&&v!='d';
        if(op(n))lip(X,1,ly);if(op(s))lip(X,2,15-ly);if(op(wv))lip(Y,3,lx);if(op(e))lip(Y,4,15-lx)}
      else{const nz=vnoise(X/14,Y/14,1)*.7+vnoise(X/5,Y/5,2)*.3;
        col=nz>.64?'#f6f9fc':nz<.36?'#d8e3ec':'#e8eff5';if(hash(X,Y,3)>.988)col='#ccd9e5';
        if(ch=='T')col=mix(col,'#9fb3c6',.3);
        if(n=='h'&&ly<3)col=mix(col,'#b4c4d4',.85-ly*.2);
        if(wv=='h'&&lx<5)col=mix(col,'#b4c4d4',.7-lx*.12);
        if(tuft){const dx=lx-tox,dy=ly-toy;if((dy==0&&(dx==0||dx==2||dx==4))||(dy==-1&&(dx==1||dx==3))||(dy==-2&&dx==2))col=dy==0?'#5e6b45':'#7c8a5c'}
        if(ch=='.'&&hash(tx,ty,18)>.9&&lx==toy&&ly==tox)col='#8a929b'}
      if(col){const i=(Y*W+X)*4;p.set(rgb(col),i);p[i+3]=a}}}
  g.putImageData(img,0,0);return c}

// ---- Animated water: 8 seamless 64x64 frames of two crossing wave trains.
const WATER=Array.from({length:8},(_,f)=>{const c=cnv(64,64),g=c.getContext('2d'),img=g.createImageData(64,64),TAU=Math.PI*2,ph=f/8*TAU;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const v=Math.sin(TAU*(2*x+y)/64+ph)+Math.sin(TAU*(3*y-x)/64-ph),tone=Math.sin(TAU*x/64)*Math.sin(TAU*y/32);
    const col=v>1.93?'#a9d6ef':v>1.72?'#4f8fbf':v<-1.75?'#215480':tone>.4?'#27618f':'#2a6896';img.data.set([...rgb(col),255],(y*64+x)*4)}
  g.putImageData(img,0,0);return c});

// ---- Buildings. s is a BLD entry; dx is the door's column (or -1). Returns the picture and any animated bits.
function bld2(w,h,s,dx){
  const W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),an=[];
  const r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a|0,b|0)};
  const tall=s.kind=='tall',wh=tall?H-10:Math.max(2,Math.round(h*.45))*T,ry=H-wh,dk=shade(s.wall,-.25),lt=shade(s.wall,.15);
  const tex=s.tex||(s.deco=='hq'?'brick':s.kind=='gable'?'siding':'panel'),aw=s.deco=='bar'||s.deco=='shop';
  // wall + texture
  r(s.wall,0,ry,W,wh);
  if(tex=='siding')for(let y=ry+3;y<H;y+=3)r(shade(s.wall,-.12),0,y,W,1);
  if(tex=='brick')for(let y=ry;y<H;y+=4){r(shade(s.wall,.22),0,y,W,1);for(let x=((y/4|0)%2)*4;x<W;x+=8){r(shade(s.wall,.22),x,y,1,4);if(hash(x,y,19)>.7)r(shade(s.wall,-.1),x+1,y+1,7,3)}}
  if(tex=='panel'){for(let x=15;x<W;x+=16)r(shade(s.wall,-.15),x,ry,1,wh);for(let y=ry+20;y<H-4;y+=20)r(shade(s.wall,-.1),0,y,W,1)}
  if(tex=='metal')for(let x=0;x<W;x+=3){r(shade(s.wall,-.18),x,ry,1,wh);r(shade(s.wall,.12),x+1,ry,1,wh)}
  r(lt,0,ry,1,wh);r(dk,W-2,ry,2,wh);
  if(s.kind=='gable'){r(s.trim,1,ry,2,wh);r(s.trim,W-3,ry,2,wh)}
  r('rgba(20,20,40,.28)',0,ry,W,3);
  // awnings over shop fronts
  if(aw){const a1=s.deco=='bar'?'#c0392b':'#2e86c1';for(let x=0;x<W;x++){const col=(x>>2)&1?a1:'#f2f2f2';r(col,x,ry,1,7);if((x&3)==1||(x&3)==2)r(col,x,ry+7,1,1)}
    r('rgba(0,0,0,.18)',0,ry+5,W,2);r('rgba(20,20,40,.25)',0,ry+8,W,2)}
  // big doors that take the place of windows
  const skip=new Set([dx]);
  if(s.deco=='plant'){const bx=W-48,bw=34,bh=wh-8;for(let i=0;i<w;i++)if(i*16+15>=bx&&i*16<=bx+bw)skip.add(i);
    r('#2b2f3a',bx-2,H-bh-5,bw+4,bh+2);for(let y=H-bh-3;y<H-3;y++)r((y&1)?'#76828f':'#8d99a6',bx,y,bw,1);
    for(let y=H-bh-5;y<H-3;y++){const st=((y>>1)&1)?'#e0a100':'#2b2f3a';r(st,bx-4,y,2,1);r(st,bx+bw+2,y,2,1)}}
  if(s.deco=='whs'){const bx=(W>>1)-12;for(let i=0;i<w;i++)if(i*16+15>=bx&&i*16<=bx+24)skip.add(i);
    r('#2b2f3a',bx-1,ry+3,26,1);r('#5d4636',bx,ry+4,24,wh-7);r('#7a5d48',bx,ry+4,24,1);
    for(let k=0;k<wh-7;k++){r('#7a5d48',bx+(k*12/(wh-7)|0),ry+4+k,1,1);r('#7a5d48',bx+23-(k*12/(wh-7)|0),ry+4+k,1,1)}r('#2b2f3a',bx+12,ry+4,1,wh-7)}
  // windows
  const win=(x,y,ww,hh,lit)=>{const gl=lit?'#ffd98a':s.win;
    if(s.sh){r(s.sh,x-4,y-1,2,hh+2);r(s.sh,x+ww+2,y-1,2,hh+2)}
    r(shade(s.trim,-.35),x-2,y-2,ww+4,hh+4);r(s.trim,x-1,y-1,ww+2,hh+2);r(gl,x,y,ww,hh);r(shade(gl,-.22),x,y,ww,2);
    if(lit)r('#fff1c8',x+1,y+2,ww-2,1);else{r('rgba(255,255,255,.55)',x+ww-3,y+2,1,1);r('rgba(255,255,255,.55)',x+ww-4,y+3,1,1);r('rgba(255,255,255,.55)',x+ww-5,y+4,1,1)}
    r(s.trim,x+(ww>>1),y,1,hh);r(s.trim,x,y+(hh>>1),ww,1);r(SNOW,x-2,y+hh+1,ww+4,1);r('rgba(0,0,0,.2)',x-1,y+hh+2,ww+2,1)};
  if(tall){for(let y=16;y<H-T-8;y+=22)for(let x=8;x<W-12;x+=18){win(x,y,12,13,hash(x,y,5)>.62);
      r(shade(s.trim,-.3),x-3,y+15,18,1);for(let k=x-3;k<x+15;k+=3)r(shade(s.trim,-.3),k,y+12,1,3);r(SNOW,x-3,y+14,18,1)}}
  else for(let y=ry+(aw?12:8);y+9<H-6;y+=20)for(let i=0;i<w;i++)if(!skip.has(i))win(i*16+3,y,10,9,hash(i,y,w*h)>.6);
  // foundation and snow banked against it
  r('#6d727a',0,H-3,W,3);r('#8a9099',0,H-3,W,1);
  for(let x=0;x<W;x++){const d=vnoise(x/5,0,w*7+h);if(d>.55){const t=d>.75?3:2;r(SNOW,x,H-t,1,t);r(SNOWD,x,H-1,1,1)}}
  // door
  if(dx>=0){const X=dx*16+2;r(shade(s.trim,-.35),X-1,H-18,14,15);r(s.trim,X,H-17,12,14);r('#5b3a26',X+1,H-16,10,13);
    [[2,-15],[7,-15],[2,-9],[7,-9]].forEach(([a,b])=>r('#6e4930',X+a,H+b,3,4));r('#e8c33a',X+9,H-9,1,1);
    r('#8a9099',X-1,H-3,14,3);r('#a9b0b8',X-1,H-3,14,1);r('#3a3a44',X+13,H-15,1,1);r('#ffd36b',X+13,H-14,2,3);r('#fff1c8',X+13,H-14,1,1)}
  // roof
  if(tall){r(s.roof,0,0,W,10);r(SNOW,0,0,W,4);r(SNOWD,0,3,W,1);r(shade(s.roof,-.3),0,8,W,2)}
  else if(s.kind=='gable'){const rd=shade(s.roof,-.25);r(s.roof,0,0,W,ry);
    if(tex=='metal')for(let x=1;x<W;x+=3){r(rd,x,0,1,ry);r(shade(s.roof,.12),x+1,0,1,ry)}
    else for(let y=3;y<ry;y+=4){r(rd,0,y,W,1);for(let x=((y>>2)&1)*3;x<W;x+=6)r(rd,x,y-3,1,3)}
    for(let x=0;x<W;x++){const d=Math.round(ry*.45+(vnoise(x/6,0,w*13+h)-.5)*8);r(SNOW,x,0,1,d);r(SNOWD,x,d-2,1,2);if(hash(x,3,w)>.8)r('#ffffff',x,1,1,1)}
    r(rd,0,ry-2,W,2);r(OUT,0,ry-1,W,1);
    for(let x=2;x<W-2;x++)if(hash(x,ry,w+h)>.82){r('#dff1fb',x,ry,1,1+(hash(x,1,9)*3|0));r('#ffffff',x,ry,1,1)}}
  else{r(s.roof,0,0,W,ry);r(shade(s.roof,.1),2,2,W-4,ry-8);
    for(let y=2;y<ry-6;y++)for(let x=2;x<W-2;x++){const v=vnoise(x/9,y/9,w*5+h);r(y<4||x<4?SNOWD:v<.3?'#e4ecf3':SNOW,x,y)}
    for(let i=0;i<Math.max(1,w/4|0);i++){const x=8+i*(W-24)/Math.max(1,(w/4|0)-1||1)|0,y=ry>30?ry-20:6;if(s.deco=='plant'&&i<2)continue;
      r(OUT,x-1,y-1,9,8);r('#9aa3ad',x,y,7,6);r('#7d8690',x,y+4,7,2);r(SNOW,x,y,7,2)}
    r(s.trim,0,0,W,2);r(s.trim,0,0,2,ry);r(s.trim,W-2,0,2,ry);r(SNOW,0,0,W,1);
    r(s.trim,0,ry-6,W,6);r(shade(s.trim,-.25),0,ry-2,W,2);r(SNOW,0,ry-6,W,1)}
  // decorations
  if(s.chim!=null){const cx=(W*s.chim)|0,ch=Math.max(8,ry*.35|0);r(OUT,cx-1,2,9,ch+1);r('#7a4234',cx,3,7,ch);r('#94523f',cx,3,2,ch);
    for(let y=6;y<ch;y+=3)r('#5e3228',cx,y,7,1);r('#3a3a44',cx-1,2,9,2);r(SNOW,cx-1,1,9,1);an.push({t:'smoke',x:cx+3,y:0})}
  if(s.attic){const ax=(W>>1)-7,ay=(ry>>1)-6;r(OUT,ax-1,ay-1,16,14);r(s.wall,ax,ay+3,14,9);r(s.roof,ax-1,ay,16,4);r(SNOW,ax-1,ay-1,16,2);win(ax+3,ay+5,8,6,false)}
  if(s.porch&&dx>=0){const X=dx*16;r(OUT,X-3,H-22,22,5);r(s.roof,X-2,H-21,20,3);r(SNOW,X-2,H-22,20,1);r(s.trim,X-1,H-18,1,15);r(s.trim,X+16,H-18,1,15)}
  if(s.deco=='hq'){r('#d5d9de',W>>1,0,1,ry-6);r('#9aa0a8',(W>>1)+1,0,1,ry-6);an.push({t:'flag',x:(W>>1)+2,y:1});
    for(const bx of[30,W-34]){r(OUT,bx-1,ry+2,6,23);r('#c0392b',bx,ry+3,4,20);r('#a52f24',bx+3,ry+3,1,20);r('#ffd23a',bx+1,ry+7,2,2);r(s.wall,bx+1,ry+22,2,1)}
    if(dx>=0){const X=dx*16+8;r('#ffd23a',X-1,H-22,3,1);r('#ffd23a',X,H-23,1,3)}}
  if(s.deco=='plant'){for(const f of[.1,.32]){const x=W*f|0,hh=ry-10;r(OUT,x-1,-1,11,hh+2);r('#9aa3ad',x,0,9,hh);r('#c3cad1',x,0,2,hh);r('#6b737c',x+7,0,2,hh);
      for(let y=4;y<hh;y+=10)r('#c0392b',x,y,9,3);r('#2b2f3a',x,0,9,2);an.push({t:'smoke',x:x+3,y:-2,big:1})}
    ptext(r,'FISH CO.',6,ry-5,'#ffffff')}
  if(s.deco=='bar'){const bx=(W>>1)-13,by=ry-17;r(OUT,bx-1,by-1,28,11);r('#1a1520',bx,by,26,9);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+21,by+9,1,6);r(SNOW,bx-1,by-1,28,1);
    an.push({t:'neon',x:bx+7,y:by+2,s:'BAR'})}
  if(s.deco=='shop'){const bx=(W>>1)-14,by=ry-17;r(OUT,bx-1,by-1,30,11);r('#f2f2f2',bx,by,28,9);r(SNOW,bx-1,by-1,30,1);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+23,by+9,1,6);
    ptext(r,'FISH',bx+2,by+2,'#2e6f9a');r('#8fa6b8',bx+19,by+3,5,3);r('#8fa6b8',bx+24,by+2,2,5);r(OUT,bx+20,by+4,1,1)}
  r(OUT,0,0,W,1);r(OUT,0,0,1,H);r(OUT,W-1,0,1,H);
  return{c,an}}

// ---- Trees, props, boats and the fish pile (all outlined sprites).
const pine=v=>{const H=v==2?24:28;return mk(16,H,r=>{
  r('#4a3222',7,H-5,2,5);r('#6b4a30',7,H-5,1,5);
  const tiers=v==2?[[0,9,1,4],[5,15,2,6],[10,H-4,3,7]]:[[0,10,1,4],[6,17,2,6],[12,H-4,3,8]];
  for(let k=tiers.length-1;k>=0;k--){const[t0,t1,a,b]=tiers[k];
    for(let y=t0;y<=t1;y++){const hw=Math.round(a+(b-a)*(y-t0)/(t1-t0)),x0=8-hw,x1=7+hw;
      for(let x=x0;x<=x1;x++){const f=(x-x0)/Math.max(1,x1-x0);let col=f<.3?'#3e7a62':f<.72?'#2b5c4b':'#1d4038';
        if(v==1)col=shade(col,-.08);
        if(y-t0<2+((x*7+k)%3==0?1:0))col=f<.6?SNOW:'#cfdde8';
        if(y==t1&&(x==x0||x==x1||(x+k)%4==0))col='#e4edf4';r(col,x,y)}}}})};
const TREES=[0,1,2].map(pine);
const PA={
lamp:[26,r=>{r('#2f3440',7,8,2,15);r('#4a5262',7,8,1,15);r('#2f3440',5,23,6,3);r('#4a5262',5,23,6,1);r('#2f3440',4,2,8,2);
  r('#ffe08a',5,4,6,4);r('#fff6d0',6,4,2,2);r('#2f3440',4,8,8,1);r(SNOW,4,1,8,1);r('#2f3440',7,0,2,1)}],
barrel:[14,r=>{r('#7a4a2a',3,1,10,13);r('#7a4a2a',2,3,12,9);r('#93603a',3,2,3,11);r('#5e381f',11,2,2,11);r('#3a3a44',2,4,12,1);r('#3a3a44',2,10,12,1);
  r('#a8794c',4,0,8,2);r(SNOW,4,0,8,1)}],
crate:[13,r=>{r('#a8794c',1,1,14,12);r('#8a6038',1,5,14,1);r('#8a6038',1,9,14,1);r('#c49565',2,2,12,1);r('#6e4a2a',1,1,1,12);r('#6e4a2a',14,1,1,12);
  r(SNOW,1,0,14,2);r(SNOWD,3,2,9,1)}],
bench:[11,r=>{r('#7a5232',1,1,14,2);r(SNOW,1,0,14,1);r('#5a3a22',2,3,1,3);r('#5a3a22',13,3,1,3);r('#946640',1,6,14,2);r(SNOW,2,5,12,1);
  r('#3a3a44',2,8,1,3);r('#3a3a44',13,8,1,3)}],
woodpile:[12,r=>{for(const[x,y]of[[1,8],[5,8],[9,8],[13,8],[3,4],[7,4],[11,4],[5,0],[9,0]]){r('#6b4a2e',x-1,y,4,4);r('#d2a86e',x,y+1,2,2);r('#b08850',x,y+1,1,1)}
  r(SNOW,5,0,7,1);r(SNOW,3,4,2,1);r(SNOW,12,4,2,1)}],
snowman:[22,r0=>{const r=(c,x,y,w,h)=>r0(c,x,y+2,w,h);r('#eef4f8',3,11,10,9);r('#eef4f8',2,13,12,5);r('#eef4f8',4,6,8,6);r('#eef4f8',5,1,6,6);r('#cfdbe6',11,12,2,7);r('#cfdbe6',10,7,2,5);r('#cfdbe6',9,2,2,5);
  r('#2a2a33',4,0,8,2);r('#2a2a33',5,-2,6,2);r(OUT,6,3,1,1);r(OUT,9,3,1,1);r('#e8792a',7,4,3,1);r('#c0392b',4,7,8,2);r('#c0392b',9,9,2,3);r(OUT,7,9,1,1);r(OUT,7,12,1,1);r(OUT,7,15,1,1)}],
bush:[12,r=>{r('#2b5c4b',1,3,14,9);r('#2b5c4b',3,1,10,11);r('#3e7a62',3,3,4,6);r('#1d4038',11,4,3,7);r(SNOW,3,1,10,2);r(SNOW,1,3,4,1);r(SNOW,11,3,4,1);r('#cfdde8',9,2,4,1)}],
mailbox:[16,r=>{r('#5a3d2a',7,7,2,9);r('#2e6f9a',3,2,10,6);r('#3d86b8',3,2,10,2);r('#255a7d',3,7,10,1);r('#c0392b',13,2,1,4);r(SNOW,3,1,10,1)}],
phone:[28,r=>{r('#b8322a',2,3,12,25);r('#d4483d',2,3,2,25);r('#8e2620',12,3,2,25);r('#a9c7da',4,8,8,16);r('#cfe3ee',4,8,2,16);r('#8e2620',4,15,8,1);
  r('#f2f2f2',4,4,8,3);r('#2e6f9a',5,5,6,1);r('#8e2620',1,1,14,3);r(SNOW,1,0,14,2);r('#3a3a44',7,18,3,3)}],
trap:[10,r=>{r('#6b4a2e',1,1,14,9);r('#c9b28a',2,2,12,7);for(let x=3;x<14;x+=3)r('#6b4a2e',x,2,1,7);r('#6b4a2e',2,5,12,1);r(SNOW,1,0,14,1)}],
net:[20,r=>{r('#5a3d2a',1,0,2,20);r('#5a3d2a',13,0,2,20);r('#5a3d2a',1,1,14,2);r(SNOW,1,0,14,1);
  for(let y=3;y<16;y++)for(let x=3;x<13;x++)if((x+y)%3==0||(x-y+30)%3==0)r(y>13?'#2f5a48':'#3d6b5a',x,y);r('#e8792a',7,14,2,2)}],
buoy:[12,r=>{r('#c0392b',2,4,7,7);r('#f2f2f2',2,6,7,2);r('#e04a3a',3,4,2,3);r('#e8792a',8,1,6,6);r('#f2f2f2',8,3,6,1);r('#f5a05a',9,1,2,2);r(SNOW,8,0,6,1)}],
bollard:[9,r=>{r('#3a3d44',5,3,6,6);r('#5a5f68',4,1,8,3);r('#7a808a',5,1,3,1);r('#c9a36a',3,5,10,1);r('#c9a36a',11,6,3,1)}],
rope:[6,r=>{r('#c9a36a',2,0,12,6);r('#a8834a',4,1,8,4);r('#8a6a3a',6,2,4,2);r('#e0c08a',3,0,4,1)}],
anchor:[12,r=>{r('#4a4f58',7,0,2,10);r('#4a4f58',4,2,8,1);r('#4a4f58',2,8,2,3);r('#4a4f58',12,8,2,3);r('#4a4f58',3,10,10,2);r('#6a707a',7,0,1,10)}],
sled:[8,r=>{r('#a8323a',1,1,13,4);r('#c94a50',1,1,13,1);r('#3a3a44',0,6,15,1);r('#3a3a44',2,5,1,1);r('#3a3a44',12,5,1,1);r(SNOW,3,0,6,1)}]};
const PCACHE={},propArt=k=>PCACHE[k]??=mk(16,PA[k][0],PA[k][1]);

function boatArt(w,h,v){const W=w*16,H=h*16,hc=['#b5402f','#2f5f8f','#3d7a5a'][v*3|0],top=6,bot=H-8,bow=Math.min(12,W/4|0);
  return mk(W,H-1,r=>{
    for(let y=top;y<H-2;y++){const u=(y-top)/(H-3-top),tp=Math.round(bow*Math.pow(Math.abs(u-.45)/.55,1.5)),x0=2+(u<.1||u>.9?1:0),x1=W-2-tp;
      for(let x=x0;x<x1;x++){let col;
        if(y<bot)col=y==top||x==x0||x==x1-1||y==bot-1?'#e9e4da':(y-top)%3==2?'#8a6644':'#a07a52';
        else col=y==bot?'#e9e4da':y>=H-4?shade(hc,-.35):x<x0+2?shade(hc,.12):hc;r(col,x,y)}}
    const cx=5,cw=Math.round(W*.28);r('#eef0f2',cx,3,cw,top+7);r('#cfd4da',cx+cw-2,3,2,top+7);r('#2b4a6a',cx+2,5,cw-5,3);r('#7fb0d0',cx+2,5,2,1);
    r('#b9bec5',cx-1,1,cw+2,3);r(SNOW,cx-1,0,cw+2,2);
    const mx=Math.round(W*.6);r('#5a3d2a',mx,0,1,top+6);r('#c9a36a',mx+1,1,Math.round(W*.22),1);
    r('#3d6b5a',mx+3,top+3,Math.round(W*.16),4);r('#5e8f78',mx+4,top+4,2,1);r('#5e8f78',mx+7,top+5,1,1);r('#e8792a',mx-4,top+4,2,2)})}
const ferryArt=mk(14,9,r=>{r('#f2f2f2',1,3,12,5);r('#f2f2f2',0,4,14,3);r('#2e6f9a',0,6,14,1);r('#c9ced4',2,4,10,2);r('#2b4a6a',8,1,3,3);r('#7fb0d0',8,1,1,1);r('#c0392b',2,3,2,1)});
const fishPile=mk(30,30,r=>{
  r('#a8794c',0,14,14,14);r('#8a6038',0,19,14,1);r('#8a6038',0,24,14,1);r('#6e4a2a',13,14,1,14);
  r('#a8794c',16,17,13,12);r('#8a6038',16,22,13,1);r('#6e4a2a',28,17,1,12);r('#e8f6fc',17,15,11,3);
  const fish=(x,y,f)=>{r('#9fb3c4',x,y,5,2);r('#d8e4ee',x,y+1,5,1);r('#7d93a6',f?x-2:x+5,y,2,2);r(OUT,f?x+4:x,y,1,1)};
  [[3,10,0],[7,8,1],[2,6,1],[6,4,0],[9,12,1],[4,13,0],[18,13,0],[22,14,1]].forEach(([x,y,f])=>fish(x,y,f));
  r('#f2f2f2',21,10,5,3);r('#9aa3ad',22,10,3,1);r('#f2f2f2',25,8,2,2);r('#e8b33a',27,9,1,1);r('#e8792a',22,13,1,2);r('#e8792a',24,13,1,2)});

// ---- People: 16x20, outlined, 4 directions, 2 walking frames. hat gives a beanie; stripe is a scarf.
const CH={};
function char2(d,fr,body,hair,stripe,hat){const key=[d,fr,body,hair,stripe,hat].join();if(CH[key])return CH[key];
  const sk='#f1c7a0',skd='#d9a37a',pt='#2d3046',bt='#3b2a22',bl=shade(body,.18),bd=shade(body,-.28),arm=shade(body,-.35),side=d>1;
  return CH[key]=mk(16,20,r0=>{const r=(c,x,y,w=1,h=1)=>r0(c,d==3?16-x-w:x,y,w,h);
    // legs and boots
    if(!side){const a=fr==1?1:0,b=fr==2?1:0;r(pt,5,15,2,3-a);r(pt,9,15,2,3-b);r(bt,5,18-a,2,2);r(bt,9,18-b,2,2)}
    else if(fr==1){r(pt,4,15,2,3);r(pt,9,15,2,3);r(bt,3,18,3,2);r(bt,9,18,3,2)}
    else{const l=fr==2?1:0;r(pt,6,15,2,3-l);r(pt,8,15,2,3);r(bt,5,18-l,3,2);r(bt,8,18,3,2)}
    // body
    r(body,4,9,8,6);r(bl,4,9,1,6);r(bd,10,9,2,6);r(bd,4,14,8,1);if(d==0)r(bd,7,10,1,4);
    if(stripe){r(stripe,4,9,8,1);if(d==0)r(stripe,9,10,1,2);if(side)r(stripe,10,10,1,2)}
    // arms
    if(!side){const s=fr==1?-1:fr==2?1:0;r(arm,3,10+s,1,4);r(sk,3,14+s,1,1);r(arm,12,10-s,1,4);r(sk,12,14-s,1,1)}
    else{const s=fr==1?-1:fr==2?1:0;r(arm,7+s,10,2,4);r(sk,7+s,14,2,1)}
    // head
    r(sk,4,2,8,6);r(sk,5,1,6,1);r(sk,5,8,6,1);if(!side)r(skd,11,2,1,6);
    const hl=shade(hair,.25);
    if(d==0){r(hair,4,1,8,3);r(hair,5,0,6,1);r(hair,4,4,1,2);r(hair,11,4,1,2);r(hl,6,1,2,1);r(OUT,6,5,1,2);r(OUT,9,5,1,2);r('#e9a28f',5,7,1,1);r('#e9a28f',10,7,1,1)}
    else if(d==1){r(hair,4,1,8,7);r(hair,5,0,6,1);r(shade(hair,-.3),5,8,6,1);r(hl,6,1,3,1)}
    else{r(hair,4,1,8,3);r(hair,5,0,6,1);r(hair,9,4,3,3);r(hair,10,7,2,1);r(hl,5,1,2,1);r(OUT,5,5,1,2);r(skd,8,5,1,2)}
    if(hat){r(hat,4,1,8,2);r(hat,5,0,6,1);r(shade(hat,-.25),4,3,8,1);r('#f2f2f2',7,0,2,1);r(shade(hat,.2),5,1,2,1)}})}
// Draws a person whose tile's top-left is (px, py).
function person(px,py,d,fr,body,hair,stripe,hat){ctx.fillStyle='rgba(20,30,55,.28)';ctx.fillRect(px+3,py+14,10,3);ctx.fillRect(px+4,py+13,8,5);
  ctx.drawImage(char2(d,fr,body,hair,stripe,hat),px-1,py-5)}

// ---- Scene: everything that never changes is baked into one canvas per map.
const SC={};
function scene(m){if(SC[m])return SC[m];
  const M=MAPS[m],c=groundLayer(m),g=c.getContext('2d'),an=[],trees=[],boats=[],props=[];
  FL[m].forEach(([x,y,w,h,ch,lb,st])=>{
    if(st&&BLD[st]){const row=M[y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;
      g.fillStyle='rgba(60,80,115,.22)';g.fillRect(x*16+4,(y+h)*16,w*16+1,2);
      const b=bld2(w,h,BLD[st],dx);g.drawImage(b.c,x*16,y*16);b.an.forEach(a=>an.push({...a,x:a.x+x*16,y:a.y+y*16}))}
    else if(ch=='b')boats.push({x,y,c:boatArt(w,h,hash(x,y,21)),ph:hash(x,y,22)*6})
    else if(ch=='k')g.drawImage(fishPile,x*16,y*16)});
  M.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch=='T')trees.push({x,y,c:TREES[hash(x,y,31)*3|0],ox:Math.round(hash(x,y,32)*2-1)})}));
  const ferries=EX[m].filter(e=>e.s=='F').map(e=>({x:e.ax>e.x?e.x-1:e.x+1,y:e.y,ph:hash(e.x,e.y,23)*6}));
  PROPS.filter(p=>p[0]==m).forEach(([,x,y,k])=>props.push({x,y,k,c:propArt(k)}));
  return SC[m]={c,an,trees,boats,ferries,props}}

// ---- Snowfall and vignette
let FLAKES=null;  // built on first use, because hash() lives in game.js which loads after this file
const flakes=()=>FLAKES??=Array.from({length:80},(_,i)=>({x:hash(i,1,77),y:hash(i,2,77),sp:.006+hash(i,3,77)*.01,big:hash(i,4,77)>.82,ph:hash(i,5,77)*6}));
let VIG=null;
function vignette(){if(VIG&&VIG.width==cv.width&&VIG.height==cv.height)return VIG;VIG=cnv(cv.width,cv.height);const g=VIG.getContext('2d'),w=cv.width,h=cv.height,
  gr=g.createRadialGradient(w/2,h/2,h*.45,w/2,h/2,w*.75);gr.addColorStop(0,'rgba(15,25,50,0)');gr.addColorStop(1,'rgba(15,25,50,.38)');g.fillStyle=gr;g.fillRect(0,0,w,h);return VIG}

// ---- Per-frame drawing. cx, cy: camera offset in pixels. moving: player walking frame (0 idle, 1, 2).
function drawWorld2(m,cx,cy,t,frame){
  const S=scene(m),M=MAPS[m],mh=M.length,mw=M[0].length,vw=cv.width,vh=cv.height,wf=WATER[(t/200|0)%8],px=(c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w,h)};
  const x0=Math.max(0,Math.floor(cx/16)),x1=Math.min(mw-1,Math.floor((cx+vw)/16)),y0=Math.max(0,Math.floor(cy/16)),y1=Math.min(mh-1,Math.floor((cy+vh)/16));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(CLS(M[y][x])=='w')ctx.drawImage(wf,(x*16)&63,(y*16)&63,16,16,x*16-cx,y*16-cy,16,16);
  ctx.drawImage(S.c,-cx,-cy);
  // boats bob on the water, with a little foam at the waterline
  const bob=ph=>Math.round(Math.sin(t/650+ph));
  S.boats.forEach(b=>{const X=b.x*16-cx,Y=b.y*16-cy+bob(b.ph),W=b.c.width-2;
    for(let x=4;x<W-6;x+=2)if(hash(x,(t/250|0),b.x)>.4)px('rgba(230,245,252,.65)',X+x,Y+b.c.height-3,2,1);ctx.drawImage(b.c,X-1,Y-1)});
  S.ferries.forEach(f=>{ctx.drawImage(ferryArt,f.x*16-cx,f.y*16-cy+3+bob(f.ph))});
  // trees, props and people, back to front
  const L=[];
  S.trees.forEach(o=>{const X=o.x*16-cx+o.ox,Y=(o.y+1)*16-cy;if(X<-20||X>vw+4||Y<0||Y-30>vh)return;
    L.push([o.y,0,()=>{px('rgba(30,50,80,.22)',X+2,Y-3,13,3);ctx.drawImage(o.c,X-1,Y-o.c.height+1)}])});
  S.props.forEach(o=>{const X=o.x*16-cx,Y=(o.y+1)*16-cy;if(PROP_PASS.includes(o.k))L.push([o.y-.5,0,()=>ctx.drawImage(o.c,X-1,Y-o.c.height+1)]);
    else L.push([o.y,0,()=>{px('rgba(30,50,80,.22)',X+2,Y-3,13,3);ctx.drawImage(o.c,X-1,Y-o.c.height+1)}])});
  NPCS.filter(n=>n.m==m).forEach((n,i)=>{const b=Math.sin(t/700+i*1.7)>.85?1:0;L.push([n.y,1,()=>person(n.x*16-cx,n.y*16-cy+b,n.dir,0,n.body,n.hair,null,n.hat)])});
  L.push([P.ry,1,()=>person(Math.round(P.rx*16-cx),Math.round(P.ry*16-cy),P.dir,frame,'#2a5db0','#4a2e1a','#e8c33a')]);
  L.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).forEach(e=>e[2]());
  // smoke, flags and signs
  S.an.forEach(a=>{const X=a.x-cx,Y=a.y-cy;
    if(a.t=='smoke')for(let k=0;k<6;k++){const g=(t/2600+k/6)%1,s=(a.big?3:2)+Math.round(g*3);
      px(`rgba(236,241,246,${(.6*(1-g)).toFixed(2)})`,X+Math.sin(g*5+k)*2+g*10-s/2,Y-g*24-s/2,s,s)}
    if(a.t=='flag')for(let c=0;c<12;c++){const dy=Math.round(Math.sin(t/220-c*.7)*c/8),sh=Math.sin(t/220-c*.7)>.3;
      px(sh?'#a52f24':'#c0392b',X+c,Y+dy,1,8);if(c>=3&&c<=5)px('#ffd23a',X+c,Y+dy+(c==4?2:3),1,c==4?3:1)}
    if(a.t=='neon'){const on=hash(t/90|0,3,7)<.96,col=on?'#ff5fa8':'#5a2a40';
      if(on){ctx.fillStyle='rgba(255,95,168,.3)';ctx.fillRect(X-2,Y-2,a.s.length*4+3,9)}ptext(px,a.s,X,Y,col)}});
  // seagulls over the harbour
  if(m=='harbour')for(let i=0;i<2;i++){const an=t/2600+i*Math.PI,X=15*16-cx+Math.cos(an)*70,Y=6*16-cy+Math.sin(an)*30-26,up=(t/170+i*3|0)%2;
    px('rgba(20,40,60,.18)',X-2,Y+34,5,1);px('#f2f2f2',X-1,Y,3,2);px('#e8b33a',X+(Math.cos(an+Math.PI/2)>0?2:-2),Y,1,1);
    if(up){px('#f2f2f2',X-3,Y-1,2,1);px('#f2f2f2',X+2,Y-1,2,1);px('#5a5f68',X-4,Y-2,1,1);px('#5a5f68',X+4,Y-2,1,1)}
    else{px('#f2f2f2',X-4,Y,3,1);px('#f2f2f2',X+2,Y,3,1);px('#5a5f68',X-5,Y+1,1,1);px('#5a5f68',X+5,Y+1,1,1)}}
  // falling snow
  const md=(v,n)=>((v%n)+n)%n;
  flakes().forEach(f=>{const p=f.big?1.2:.6,X=md(f.x*vw+Math.sin(t/1300+f.ph)*6+t*.004-cx*p,vw),Y=md(f.y*vh+t*f.sp*(f.big?1.4:1)-cy*p,vh);
    px(f.big?'rgba(255,255,255,.7)':'rgba(255,255,255,.85)',X,Y,f.big?2:1,f.big?2:1)});
  ctx.drawImage(vignette(),0,0)}
