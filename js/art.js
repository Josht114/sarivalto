// ---- Detailed pixel-art renderer (modern 2D pixel style), used for every map and interior. Each map is drawn once to a cached
// canvas (ground, shorelines, buildings); water, boats, trees, props, people, smoke, flags and snowfall are drawn every frame on top.
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
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',
  H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',
  P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',
  X:'101101010101101',Y:'101101010010010',Z:'111001010100111','.':'000000000000010',' ':'000000000000000'};
const ptext=(r,s,x,y,col)=>[...s].forEach((ch,i)=>{const f=FONT[ch];for(let k=0;k<15;k++)if(f[k]=='1')r(col,x+i*4+k%3,y+(k/3|0))});

// ---- Ground: snow, cobbled paths, dock planks, and the rocky bank and foam where land meets water.
// Water pixels stay transparent so the animated water shows through from underneath.
const CLS=ch=>'~b'.includes(ch)?'w':'pF'.includes(ch)?'d':',E'.includes(ch)?'p':'#d'.includes(ch)?'h':'s';
const land=k=>k=='s'||k=='p'||k=='h';
const STONE=['#a39d95','#b1aba2','#978f88','#aaa39a'],PLANK=['#9a7049','#8c6542','#a5794f'];
// Path look per map (default: cobbles). dirt = gravel track, boards = boardwalk, steel = the oil rig's deck plating.
const PATHS={west:'dirt',radio:'dirt',beach:'boards',privbeach:'boards',forest:'dirt',north:'dirt',east:'dirt',south:'dirt',southwest:'dirt',
  volcano:'dirt',mountains:'dirt',farm:'dirt',oilrig:'steel'};
function snowPx(X,Y){const nz=vnoise(X/14,Y/14,1)*.7+vnoise(X/5,Y/5,2)*.3;return hash(X,Y,3)>.988?'#ccd9e5':nz>.64?'#f6f9fc':nz<.36?'#d8e3ec':'#e8eff5'}
function sandPx(X,Y){const nz=vnoise(X/10,Y/10,1)*.7+vnoise(X/4,Y/4,2)*.3;let c=nz>.62?'#e4d8b4':nz<.38?'#cbbb91':'#d9cba4';
  if(hash(X,Y,3)>.982)c='#a89a7a';else if(hash(X,Y,4)>.99)c='#f4efe0';
  const sn=vnoise(X/12,Y/12,5);return sn>.74?mix(c,'#eef3f6',Math.min(.85,(sn-.74)*9)):c}
// Mountain ground: snow with grey rock showing through in patches.
const rockAt=(X,Y)=>vnoise(X/14,Y/14,50)*.75+vnoise(X/5,Y/5,51)*.25,RK=.7;
function rockPx(X,Y){const nz=rockAt(X,Y);if(nz<RK)return hash(X,Y,52)>.985?'#8a929b':snowPx(X,Y);
  // outcrops lit from above: a snowy lip on top, a shadowed lower edge, and broken, cracked stone between
  if(rockAt(X,Y-2)<RK)return nz<RK+.01?'#dfe8ef':'#b1b9c1';if(rockAt(X,Y+2)<RK||rockAt(X+2,Y)<RK)return'#5f666e';
  const t=vnoise(X/3,Y/3,53),k=vnoise(X/2,Y/7,54);return k>.78?'#5f666e':k>.72?'#b1b9c1':t>.62?'#a3abb3':t<.38?'#737b84':'#8d959e'}
// Ploughed field under snow: soft furrow ridges with dark soil showing here and there.
function fieldPx(X,Y){const row=Y%8,nz=vnoise(X/9,Y/9,55);if(row==7)return nz>.58?'#6b5a3a':nz>.45?'#a8a090':'#d8e3ec';
  if(row==6)return nz>.62?'#5a4a30':'#dfe7ee';if(hash(X,Y,56)>.985)return'#c9b06a';return row==0?'#f6f9fc':'#e8eff5'}
function groundLayer(m){
  // the radio mast and the drilling derrick stand on open ground, so their footprints are drawn as plain ground rather than a building
  const base=TH[L[m][3]][0],M=MAPS[m].map(r=>[...r]);FL[m].forEach(([x,y,w,h,,,st])=>{if(st&&BLD[st]&&['mast','derrick','manhole'].includes(BLD[st].kind))for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)M[j][i]=base});
  const h=M.length,w=M[0].length,W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data;
  const ps=PATHS[m]||'cobble',at=(x,y)=>M[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],cl=(x,y)=>{const k=CLS(at(x,y));return ps=='steel'&&k=='p'?'d':k};
  const sandy=ch=>ch=='s'||(base=='s'&&!'~b,EpF'.includes(ch)),
    gpx=(X,Y,ch)=>sandy(ch)?sandPx(X,Y):ch=='a'?fieldPx(X,Y):ch=='r'||(base=='r'&&ch!='.')?rockPx(X,Y):snowPx(X,Y);
  // crater(X,Y) < 1 inside a lava feature's oval (with a wobbly edge), growing outward from it
  const VF=FL[m].filter(f=>f[4]=='v').map(([x,y,w,h])=>[(x+w/2)*16,(y+h/2)*16,w*8,h*8]),
    crater=(X,Y)=>Math.min(99,...VF.map(([cx,cy,rx,ry])=>(((X-cx)/rx)**2+((Y-cy)/ry)**2)*(.92+vnoise(X/6,Y/6,64)*.16)));
  // bridge(x,y): a path tile with water on both sides is a bridge: 'h' if its walkway runs east-west (water north and south),
  // 'v' if it runs north-south. Water flows on underneath, so water tiles treat a bridge next to them as more water.
  const wet=(x,y)=>'~b'.includes(at(x,y)),bridge=(x,y)=>CLS(at(x,y))!='p'?0:wet(x,y-1)&&wet(x,y+1)?'h':wet(x-1,y)&&wet(x+1,y)?'v':0;
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){
    const k=cl(tx,ty),nb=(x,y)=>k=='w'&&bridge(x,y)?'w':cl(x,y),n=nb(tx,ty-1),s=nb(tx,ty+1),wv=nb(tx-1,ty),e=nb(tx+1,ty),ch=M[ty][tx],br=bridge(tx,ty);
    const nS=sandy(at(tx,ty-1)),sS=sandy(at(tx,ty+1)),wS=sandy(at(tx-1,ty)),eS=sandy(at(tx+1,ty)),sd=sandy(ch);
    const tuft=ch=='.'&&hash(tx,ty,9)>.86,tox=2+(hash(tx,ty,10)*11|0),toy=4+(hash(tx,ty,11)*9|0);
    const vert=(n=='p'||s=='p')&&wv!='p'&&e!='p';
    for(let ly=0;ly<16;ly++)for(let lx=0;lx<16;lx++){const X=tx*16+lx,Y=ty*16+ly;let col=null,a=255;
      if(k=='w'){
        // bank colour d pixels out from a land edge: grey rock, or wet sand with turquoise shallows on beaches
        const bank=(d,sn)=>{if(sn){if(d==0)return['#a8966c'];if(d<3)return hash(X,Y,4)>(d==1?.2:.55)?['#e6f3fa']:['#7fc3e2',110];if(d<6)return['#7fc3e2',70-d*8];return null}
          if(d<2)return[d?'#77828e':'#5c6773'];if(d<4)return hash(X,Y,4)>(d==2?.3:.65)?[d==2?'#e6f3fa':'#bfdcec']:null;return null};
        const put=v=>{if(v){col=v[0];a=v[1]??255}};
        if(land(wv))put(bank(lx,wS));if(land(e))put(bank(15-lx,eS));if(land(s))put(bank(15-ly,sS));
        if(land(n)){if(nS)put(bank(ly,true));else{const fh=4+(vnoise(X/3,0,6)>.55?1:0);
          if(ly==0)col=SNOWD;else if(ly<fh){const t=hash(X>>2,(Y>>1)+((X>>2)&1),5);col=ly==1?'#8f99a4':t>.6?'#77828e':t>.2?'#5c6773':'#46505b';a=255}
          else if(ly==fh&&hash(X,7)>.25){col='#e6f3fa';a=255}else if(ly==fh+1&&hash(X,8)>.55){col='#bfdcec';a=255}}}
        if(wv=='d'&&lx<3&&!col){col='#0a2236';a=80}
        if(n=='d'){const pst=lx%12==2||lx%12==3,st=ps=='steel';a=255;
          if(ly<3)col=ly==0?(st?'#5a5f68':'#6e4d30'):(st?'#3a3d44':'#4a321f');else if(pst&&ly<8)col=lx%12==2?(st?'#6b737c':'#5a3e27'):(st?'#3a3d44':'#3b2818');else if(ly<7){col='#0a2236';a=85}}}
      else if(br){
        // a wooden bridge: planks laid across the walkway, with a railing on posts along each side over the water
        const u=br=='h'?X:Y,v=br=='h'?ly:lx,bd=u>>2;
        if(v<3||v>12){col=v==0||v==15?'#3b2818':u%8<2?'#4a321f':v==1||v==14?'#a8794c':'#7a5436';if((v==1||v==14)&&vnoise(u/3,v,72)>.45)col=SNOW}
        else{col=(u&3)==3?'#5a3e27':PLANK[hash(bd,9,70)*3|0];if((u&3)==0)col=shade(col,.08);if((v==5||v==10)&&(u&3)==1)col='#2f2219';
          if(vnoise(X/6,Y/6,71)>.7)col=mix(col,'#e8eff5',.6)}}
      else if(k=='d'&&ps=='steel'){
        // steel deck plates with a raised tread pattern, rivets, drifted snow, and hazard stripes along the edge
        const sx=X&7,sy=Y&7;col=sx==7||sy==7?'#4f555e':sx==0||sy==0?'#9aa3ad':((X+Y)&3)==0&&((X-Y)&7)==0?'#9aa3ad':'#7d858e';
        if((sx==1||sx==6)&&(sy==1||sy==6))col='#5a5f68';
        const sn=vnoise(X/11,Y/11,57)*.6+vnoise(X/3,Y/3,62)*.4;if(sn>.7)col=mix(col,'#e8eff5',Math.min(.8,(sn-.7)*6));
        const ed=Math.min(n=='w'?ly:99,s=='w'?15-ly:99,wv=='w'?lx:99,e=='w'?15-lx:99);if(ed<3)col=ed==0?'#2b2f3a':((X+Y)>>2)&1?'#e0a100':'#2b2f3a'}
      else if(k=='d'){const bd=X>>2,sm=(Y+bd*7)%24;
        col=(X&3)==3||sm==0?'#4d3624':PLANK[hash(bd,(Y+bd*7)/24|0,6)*3|0];
        if((X&3)==0&&sm)col=shade(col,.06);if((X&3)==1&&(sm==3||sm==20))col='#2f2219';
        else if((X&3)!=3&&sm&&hash(X,Y,12)>.96)col=shade(col,-.08);
        if(hash(X,Y,13)>.993)col='#e8eff5';
        if((n=='w'&&ly==0)||(wv=='w'&&lx==0)||(e=='w'&&lx==15))col='#3b2818'}
      else if(k=='p'&&ps=='boards'){
        // boardwalk: boards run across the direction of travel, with a dark beam along open sides
        const u=vert?Y:X,v=vert?lx:ly,bd=u>>2;col=(u&3)==3?'#5a3e27':PLANK[hash(bd,7,24)*3|0];
        if((u&3)==0)col=shade(col,.08);if((v==2||v==13)&&(u&3)==1)col='#2f2219';if(hash(X,Y,25)>.97)col=shade(col,-.1);
        const side=vert?[wv,e]:[n,s],o=vert?lx:ly;if((o==0&&side[0]!='p')||(o==15&&side[1]!='p'))col='#3b2818'}
      else if(k=='p'){
        if(ps=='dirt'){const nz=vnoise(X/6,Y/6,26);col=nz>.6?'#bcae96':nz<.35?'#9f927c':'#ada08a';
          if(hash(X,Y,27)>.9)col='#8a7e6a';else if(hash(X,Y,28)>.95)col='#d2c7b4';
          const sn=vnoise(X/9,Y/9,29);if(sn>.62)col=mix(col,'#e8eff5',Math.min(1,(sn-.62)*6))}
        else{const row=Y/5|0,ry=Y%5,sx=X+row*3,seg=sx/6|0,l6=sx%6;col=STONE[hash(seg,row,14)*4|0];
          if(ry==4||l6==5)col=hash(X,Y,15)>.6?'#dde6ee':'#77716b';else if(ry==0)col=shade(col,.15);else if(ry==3||l6==4)col=shade(col,-.1)}
        // snow (or sand) lying over the path's edges, with a little shadow under the lip
        const lip=(q,sid,dist,gc)=>{const dep=vnoise(q/4,sid,16)*3|0;if(dist<dep)col=gpx(X,Y,gc);else if(dist==dep)col=sandy(gc)?'#a8977a':'#8a857f'};
        const op=v=>v!='p'&&v!='d';
        if(op(n))lip(X,1,ly,at(tx,ty-1));if(op(s))lip(X,2,15-ly,at(tx,ty+1));if(op(wv))lip(Y,3,lx,at(tx-1,ty));if(op(e))lip(Y,4,15-lx,at(tx+1,ty));
        // a level crossing: where a path cuts across a tram track, the rails carry on through it
        if(at(tx-1,ty)=='l'||at(tx+1,ty)=='l'){if(ly==3||ly==11)col='#c9ced4';else if(ly==4||ly==12)col='#6b737c'}}
      else if(ch=='l'){
        // tram track: grey ballast, wooden sleepers across it, and two steel rails running along it
        const nz=vnoise(X/3,Y/3,66);col=nz>.6?'#8a857f':nz<.4?'#6e6a64':'#7d7872';if(ly<2||ly>13)col=mix(col,'#e8eff5',.55);
        if(X%8<3&&ly>1&&ly<14)col=X%8==0?'#6b4a2e':'#5a3e27';if(vnoise(X/7,Y/7,67)>.72&&(ly<4||ly>11||X%8>=3))col='#e8eff5';
        if(ly==3||ly==11)col='#c9ced4';else if(ly==4||ly==12)col='#6b737c'}
      else if(ch=='P'){
        // tram platform: concrete slabs with a yellow safety line along the track edge
        col=(X&15)==15||(Y&15)==15?'#8a9099':hash(X,Y,68)>.97?'#9aa0a6':'#b1b7be';if(ly>=12&&ly<14)col='#e0a100';if(ly>=14)col='#6b7178';
        if(vnoise(X/6,Y/6,69)>.7&&ly<12)col=mix(col,'#e8eff5',.7)}
      else if(ch=='v'&&crater(X,Y)<1){
        // volcanic crater (an oval inside its feature): a dark rocky rim, a cooled crust, then molten lava with darker crust veins
        const q=crater(X,Y),d=(1-Math.sqrt(q))*16+(vnoise(X/4,Y/4,58)*3|0),nz=vnoise(X/5,Y/5,59)*.7+vnoise(X/2,Y/2,60)*.3;
        col=d<3?(hash(X,Y,61)>.5?'#3a3038':'#4a4048'):d<5?(d<4?'#2a2028':'#7a3a2a'):nz>.47&&nz<.52?'#5a2a20':nz>.68?'#ffd23a':nz>.56?'#ff8a3a':'#e8501e'}
      else{col=gpx(X,Y,ch);
        // scorched ash around a crater's rim
        const q=crater(X,Y);if(q<2.2)col=mix(col,hash(X,Y,63)>.8?'#2a2028':'#4a4048',Math.min(.85,(2.2-q)*.75));
        if(ch=='T')col=mix(col,sd?'#9a8c6a':'#9fb3c6',sd?.18:.3);
        if(sd){const dw=Math.min(n=='w'?ly:99,s=='w'?15-ly:99,wv=='w'?lx:99,e=='w'?15-lx:99);if(dw<6)col=mix(col,'#a8966c',(6-dw)/7)}
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
// dx: the main door's column (or -1); more: the columns of any other doors (side or service entrances)
function bld2(w,h,s,dx,more=[]){
  const W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),an=[];
  const r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a|0,b|0)};
  const tall=s.kind=='tall',wh=tall?H-10:Math.max(2,Math.round(h*.45))*T,ry=H-wh,dk=shade(s.wall,-.25),lt=shade(s.wall,.15);
  const tex=s.tex||(s.deco=='hq'?'brick':s.kind=='gable'?'siding':'panel'),aw=s.deco=='bar'||s.deco=='shop'||!!s.awn;
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
  if(aw){const a1=s.awn||(s.deco=='bar'?'#c0392b':'#2e86c1');for(let x=0;x<W;x++){const col=(x>>2)&1?a1:'#f2f2f2';r(col,x,ry,1,7);if((x&3)==1||(x&3)==2)r(col,x,ry+7,1,1)}
    r('rgba(0,0,0,.18)',0,ry+5,W,2);r('rgba(20,20,40,.25)',0,ry+8,W,2)}
  // big doors that take the place of windows
  const skip=new Set([dx,...more]);
  if(s.deco=='plant'){const bx=W-48,bw=34,bh=wh-8;for(let i=0;i<w;i++)if(i*16+15>=bx&&i*16<=bx+bw)skip.add(i);
    r('#2b2f3a',bx-2,H-bh-5,bw+4,bh+2);for(let y=H-bh-3;y<H-3;y++)r((y&1)?'#76828f':'#8d99a6',bx,y,bw,1);
    for(let y=H-bh-5;y<H-3;y++){const st=((y>>1)&1)?'#e0a100':'#2b2f3a';r(st,bx-4,y,2,1);r(st,bx+bw+2,y,2,1)}}
  if(s.deco=='whs'){const bx=(W>>1)-12;for(let i=0;i<w;i++)if(i*16+15>=bx&&i*16<=bx+24)skip.add(i);
    r('#2b2f3a',bx-1,ry+3,26,1);r('#5d4636',bx,ry+4,24,wh-7);r('#7a5d48',bx,ry+4,24,1);
    for(let k=0;k<wh-7;k++){r('#7a5d48',bx+(k*12/(wh-7)|0),ry+4+k,1,1);r('#7a5d48',bx+23-(k*12/(wh-7)|0),ry+4+k,1,1)}r('#2b2f3a',bx+12,ry+4,1,wh-7)}
  if(s.deco=='garage'){const bw=Math.min(W-16,44),bx=(W-bw)>>1,bh=wh-6;for(let i=0;i<w;i++)if(i*16+15>=bx&&i*16<=bx+bw)skip.add(i);
    r('#2b2f3a',bx-2,H-bh-5,bw+4,bh+2);for(let y=H-bh-3;y<H-3;y++)r((y&1)?'#76828f':'#8d99a6',bx,y,bw,1)}
  if(s.deco=='hut')skip.add(1);
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
  for(const di of[dx,...more])if(di>=0){const X=di*16+2;r(shade(s.trim,-.35),X-1,H-18,14,15);r(s.trim,X,H-17,12,14);r('#5b3a26',X+1,H-16,10,13);
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
  for(const cf of[s.chim,s.chim2])if(cf!=null){const cx=(W*cf)|0,ch=Math.max(8,ry*.35|0);r(OUT,cx-1,2,9,ch+1);r('#7a4234',cx,3,7,ch);r('#94523f',cx,3,2,ch);
    for(let y=6;y<ch;y+=3)r('#5e3228',cx,y,7,1);r('#3a3a44',cx-1,2,9,2);r(SNOW,cx-1,1,9,1);an.push({t:'smoke',x:cx+3,y:0})}
  if(s.flag){const fx=s.kind=='gable'?W-16:10;r('#d5d9de',fx,0,1,ry-6);r('#9aa0a8',fx+1,0,1,ry-6);r(OUT,fx-1,ry-7,4,2);an.push({t:'flag',x:fx+2,y:1,col:s.flag})}
  if(s.deco=='mil'){
    // sandbags stacked along the front, and a searchlight on the roof
    for(let x=0;x<W;x+=7){if(dx>=0&&x+7>dx*16-2&&x<dx*16+18)continue;for(const[yy,o]of[[H-6,0],[H-10,3]]){if(o&&x+o+6>W)continue;
      r(OUT,x+o,yy,7,5);r('#b8a878',x+o+1,yy+1,5,3);r('#d0c290',x+o+1,yy+1,5,1);r(SNOW,x+o+1,yy,5,1)}}
    const lx=W-22;r(OUT,lx-1,4,10,8);r('#5a5f68',lx,5,8,6);r('#fff6d0',lx+1,6,6,3);r(SNOW,lx,4,8,1)}
  if(s.attic){const ax=(W>>1)-7,ay=(ry>>1)-6;r(OUT,ax-1,ay-1,16,14);r(s.wall,ax,ay+3,14,9);r(s.roof,ax-1,ay,16,4);r(SNOW,ax-1,ay-1,16,2);win(ax+3,ay+5,8,6,false)}
  if(s.porch&&dx>=0){const X=dx*16;r(OUT,X-3,H-22,22,5);r(s.roof,X-2,H-21,20,3);r(SNOW,X-2,H-22,20,1);r(s.trim,X-1,H-18,1,15);r(s.trim,X+16,H-18,1,15)}
  if(s.deco=='hq'){r('#d5d9de',W>>1,0,1,ry-6);r('#9aa0a8',(W>>1)+1,0,1,ry-6);an.push({t:'flag',x:(W>>1)+2,y:1});
    for(const bx of[30,W-34]){r(OUT,bx-1,ry+2,6,23);r('#c0392b',bx,ry+3,4,20);r('#a52f24',bx+3,ry+3,1,20);r('#ffd23a',bx+1,ry+7,2,2);r(s.wall,bx+1,ry+22,2,1)}
    if(dx>=0){const X=dx*16+8;r('#ffd23a',X-1,H-22,3,1);r('#ffd23a',X,H-23,1,3)}}
  if(s.deco=='plant'){for(const f of[.1,.32]){const x=W*f|0,hh=ry-10;r(OUT,x-1,-1,11,hh+2);r('#9aa3ad',x,0,9,hh);r('#c3cad1',x,0,2,hh);r('#6b737c',x+7,0,2,hh);
      for(let y=4;y<hh;y+=10)r('#c0392b',x,y,9,3);r('#2b2f3a',x,0,9,2);an.push({t:'smoke',x:x+3,y:-2,big:1})}
    ptext(r,s.ptx||'FISH CO.',6,ry-5,'#ffffff')}
  if(s.deco=='bar'){const bx=(W>>1)-13,by=ry-17;r(OUT,bx-1,by-1,28,11);r('#1a1520',bx,by,26,9);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+21,by+9,1,6);r(SNOW,bx-1,by-1,28,1);
    an.push({t:'neon',x:bx+7,y:by+2,s:'BAR'})}
  if(s.deco=='shop'){const bx=(W>>1)-14,by=ry-17;r(OUT,bx-1,by-1,30,11);r('#f2f2f2',bx,by,28,9);r(SNOW,bx-1,by-1,30,1);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+23,by+9,1,6);
    ptext(r,'FISH',bx+2,by+2,'#2e6f9a');r('#8fa6b8',bx+19,by+3,5,3);r('#8fa6b8',bx+24,by+2,2,5);r(OUT,bx+20,by+4,1,1)}
  if(s.sign){const tw=s.sign.length*4-1,bw=tw+6,bx=(W-bw)>>1,by=Math.max(1,ry-15);r(OUT,bx-1,by-1,bw+2,11);r('#f4f1e8',bx,by,bw,9);r(SNOW,bx-1,by-1,bw+2,1);
    if(by+10<ry){r('#3a3a44',bx+3,by+9,1,ry-by-9);r('#3a3a44',bx+bw-4,by+9,1,ry-by-9)}ptext(r,s.sign,bx+3,by+2,s.signc||'#2b2f3a')}
  if(s.deco=='casino'){const tw=23,bx=(W-tw-8)>>1,by=Math.max(1,ry-18);r(OUT,bx-1,by-1,tw+10,13);r('#1a1020',bx,by,tw+8,11);an.push({t:'neon',x:bx+4,y:by+3,s:'CASINO',col:'#ffd23a'});
    for(let x=bx;x<bx+tw+8;x+=3){an.push({t:'bulb',x,y:by-1});an.push({t:'bulb',x,y:by+11})}
    if(dx>=0){const X=dx*16;r('#a8323a',X-6,H-4,28,4);r('#c94a50',X-6,H-4,28,1);r('#c9a040',X-8,H-24,32,3)}}
  if(s.deco=='palace'){for(let i=1;i<w;i++){const x=i*16-2;r(OUT,x-1,ry+2,6,wh-5);r('#fff8e8',x,ry+2,4,wh-5);r('#d8ccb0',x+3,ry+2,1,wh-5);r('#c9a040',x-1,ry+2,6,2)}
    if(dx>=0){const X=dx*16;r('#d8d2c0',X-10,H-3,36,3);r('#e8e2d4',X-10,H-3,36,1);r(OUT,X-1,ry+3,18,8);r('#c9a040',X,ry+4,16,6);r('#7d3c98',X+5,ry+5,6,4);r('#ffd23a',X+6,ry+5,1,1);r('#ffd23a',X+9,ry+5,1,1)}
    const cx=W>>1;r(OUT,cx-13,0,26,ry-5);r('#4a6a9a',cx-12,1,24,ry-7);r('#6a8aba',cx-12,1,6,ry-7);r(SNOW,cx-12,1,24,3);r('#c9a040',cx-1,0,3,2);
    for(const fx of[8,W-10]){r('#d5d9de',fx,0,1,ry-6);an.push({t:'flag',x:fx+1,y:1,royal:1})}}
  if(s.deco=='church'){const cx=W>>1;r(OUT,cx-11,0,22,ry+1);r(s.wall,cx-10,0,20,ry);r(shade(s.wall,-.15),cx+6,0,4,ry);
    for(let y=3;y<ry;y+=4)r(shade(s.wall,.2),cx-10,y,20,1);r('#2a2a33',cx-4,4,8,10);r('#c9a040',cx-1,5,2,8);r('#c9a040',cx-3,7,6,2);r(SNOW,cx-11,0,22,2);
    r(OUT,cx-7,ry+3,14,14);r('#5a3a8a',cx-6,ry+4,12,12);r('#c9a0e0',cx-4,ry+6,8,8);r('#e0c060',cx-1,ry+4,2,12);r('#e0c060',cx-6,ry+9,12,2);
    r(OUT,cx-9,H-21,18,19);r('#5a3a26',cx-8,H-20,16,18);r('#6e4930',cx-8,H-20,7,18);r('#3a2618',cx,H-20,1,18);r('#c9a040',cx-3,H-11,1,2);r('#c9a040',cx+2,H-11,1,2);
    r('#a9b0b8',cx-12,H-3,24,3)}
  if(s.deco=='hut'){const X=18;r(OUT,X-1,H-18,14,15);r('#7d858e',X,H-17,12,14);r('#9aa3ad',X,H-17,2,14);for(let y=H-14;y<H-4;y+=3)r('#6b737c',X+3,y,6,1);r('#e8c33a',X+9,H-10,2,1);
    const tx=3*16+3;r(OUT,tx-1,ry+5,12,11);r('#e0a100',tx,ry+6,10,9);r('#2b2f3a',tx+4,ry+8,2,4);r('#2b2f3a',tx+4,ry+13,2,1);
    r('#5a5f68',W-14,0,1,ry-6);r('#5a5f68',W-17,3,7,1);r('#5a5f68',W-16,6,5,1);r(OUT,10,4,10,7);r('#e8ecef',11,5,8,5);r('#b9c0c7',15,5,4,5);an.push({t:'blink',x:W-14,y:-1})}
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
const PCACHE={},propArt=k=>PCACHE[k]??=(k=='rock'?ROCKS[1]:mk(16,PA[k][0],PA[k][1]));

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

// pixel line (used by the radio mast)
const pline=(r,x0,y0,x1,y1,col)=>{const n=Math.max(1,Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0);for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);r(typeof col=='function'?col(x,y):col,x,y)}};
// Radio mast: red and white lattice standing on a concrete pad, rising MAST_UP pixels above its footprint.
const MAST_UP=44;
function mastArt(w,h){const W=w*16,H=h*16+MAST_UP,c=cnv(W,H),g=c.getContext('2d'),r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a,b)};
  const band=(x,y)=>((y/12|0)%2)?'#c0392b':'#eef0f2',cx=W>>1,bt=H-12,lx=x=>x;
  r(OUT,5,H-12,W-10,10);r('#8a9099',6,H-11,W-12,8);r('#a9b0b8',6,H-11,W-12,2);r(SNOW,6,H-11,W-12,1);r('rgba(30,50,80,.25)',6,H-3,W-10,3);
  const L0=[10,bt],R0=[W-11,bt],LT=[cx-3,6],RT=[cx+2,6],at=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t];
  const lv=[0,.18,.36,.54,.72,.88,1];
  for(let i=0;i<lv.length-1;i++){const a1=at(L0,LT,lv[i]),b1=at(R0,RT,lv[i]),a2=at(L0,LT,lv[i+1]),b2=at(R0,RT,lv[i+1]);
    pline(r,a1[0],a1[1],b2[0],b2[1],'#8d959e');pline(r,b1[0],b1[1],a2[0],a2[1],'#8d959e');pline(r,a1[0],a1[1],b1[0],b1[1],band);
    for(let x=Math.round(a1[0]);x<=b1[0];x+=2)r(SNOW,x,a1[1]-1)}
  for(const d of[0,1]){pline(r,L0[0]+d,L0[1],LT[0]+d,LT[1],band);pline(r,R0[0]-d,R0[1],RT[0]-d,RT[1],band)}
  r(OUT,cx-6,5,12,3);r('#5a5f68',cx-5,6,10,1);r('#5a5f68',cx,0,1,6);
  const dish=(x,y)=>{r(OUT,x-4,y-4,9,9);r('#e8ecef',x-3,y-3,7,7);r('#b9c0c7',x+1,y-3,3,7);r('#5a5f68',x,y,1,1)};
  dish(cx-9,H-62);dish(cx+8,H-44);
  return c}
// Oil derrick: a yellow lattice tower over a steel drill floor, rising DER_UP pixels above its footprint, with the drill string down the middle.
const DER_UP=44;
function derrickArt(w,h){const W=w*16,H=h*16+DER_UP,c=cnv(W,H),g=c.getContext('2d'),r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a,b)};
  const cx=W>>1,bt=H-16,L0=[5,bt],R0=[W-6,bt],LT=[cx-5,8],RT=[cx+4,8],at=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t];
  // drill floor
  r(OUT,1,H-18,W-2,16);r('#5a5f68',2,H-17,W-4,14);r('#7d858e',2,H-17,W-4,2);r(SNOW,2,H-17,W-4,1);
  for(let x=2;x<W-2;x++)r(((x>>2)&1)?'#e0a100':'#2b2f3a',x,H-5,1,2);r('rgba(30,50,80,.25)',2,H-3,W-4,3);
  const lv=[0,.16,.32,.48,.64,.8,1];
  for(let i=0;i<lv.length-1;i++){const a1=at(L0,LT,lv[i]),b1=at(R0,RT,lv[i]),a2=at(L0,LT,lv[i+1]),b2=at(R0,RT,lv[i+1]);
    pline(r,a1[0],a1[1],b2[0],b2[1],'#a8862a');pline(r,b1[0],b1[1],a2[0],a2[1],'#a8862a');pline(r,a1[0],a1[1],b1[0],b1[1],'#c99a20');
    for(let x=Math.round(a1[0]);x<=b1[0];x+=2)r(SNOW,x,a1[1]-1)}
  for(const d of[0,1]){pline(r,L0[0]+d,L0[1],LT[0]+d,LT[1],'#e0a100');pline(r,R0[0]-d,R0[1],RT[0]-d,RT[1],'#e0a100')}
  // crown block, drill line, travelling block and the pipe going down the hole
  r(OUT,cx-8,3,16,7);r('#5a5f68',cx-7,4,14,5);r('#7d858e',cx-7,4,14,1);r(SNOW,cx-7,3,14,1);
  r('#2b2f3a',cx-1,9,1,26);r('#2b2f3a',cx+1,9,1,26);r(OUT,cx-4,34,9,9);r('#c0392b',cx-3,35,7,7);r('#e04a3a',cx-3,35,2,7);r('#8a9099',cx,43,2,H-62);
  // a pipe rack on the drill floor
  for(let k=0;k<3;k++){r('#8d959e',6,H-14+k*3,18,2);r('#b9c0c7',6,H-14+k*3,18,1)}
  return c}
// A glass bus shelter with a bench, an advert panel and a bus-stop sign. Drawn 12 pixels taller than its tiles.
function shelterArt(w,h,txt='BUS'){const W=w*16,H=h*16+12;return mk(W,H,r=>{
  r('#8a9099',0,H-10,W,9);r('#a9b0b8',0,H-10,W,2);r(SNOW,0,H-10,W,1);
  const x0=6,x1=Math.min(W-22,x0+52);
  r('#9fc6e0',x0,8,x1-x0,H-20);r('#cfe6f2',x0,8,x1-x0,3);for(let k=x0+4;k<x1-6;k+=11){r('#e8f4fa',k,14,1,6);r('#e8f4fa',k+1,13,1,4)}
  r('#7a5232',x0+4,H-19,x1-x0-18,3);r('#946640',x0+4,H-19,x1-x0-18,1);r('#3a3a44',x0+6,H-16,1,4);r('#3a3a44',x1-17,H-16,1,4);
  r('#f2f2f2',x1-12,10,10,H-24);r('#2e9d57',x1-11,12,8,5);ptext(r,'KC',x1-10,19,'#2e9d57');
  r('#3a3d44',x0-2,4,2,H-13);r('#3a3d44',x1,4,2,H-13);r('#2e9d57',x0-4,2,x1-x0+8,5);r('#3d9a5e',x0-4,2,x1-x0+8,1);r(SNOW,x0-4,1,x1-x0+8,2);
  const sx=W-12,bw=txt.length*4+3,bx=Math.min(sx-6,W-bw);r('#5a5f68',sx,6,2,H-14);r('#2e86c1',bx,0,bw,9);r('#3d96d1',bx,0,bw,1);ptext(r,txt,bx+2,2,'#ffffff');r(SNOW,bx,0,bw,1)})}
// A red and cream tram with a pantograph on its roof, seen from the side. Its wheels sit 13 pixels into its rail row.
const TRAM_UP=23,tramArt=mk(96,36,r=>{
  for(let i=0;i<7;i++){r('#3a3d44',42+i,1+i,1,1);r('#3a3d44',53-i,1+i,1,1)}r('#3a3d44',38,0,20,1);r('#3a3d44',44,7,8,1);
  r('#8d959e',3,8,90,4);r('#b9c0c7',3,8,90,1);r('#6b737c',30,9,8,2);r('#6b737c',58,9,8,2);
  r('#efe6cf',1,12,94,11);r('#b8322a',1,23,94,10);r('#e04a3a',1,23,94,1);r('#8a2a22',1,31,94,2);
  for(let x=4;x<90;x+=11){if((x>=12&&x<26)||(x>=70&&x<84))continue;r('#2b2f3a',x,14,9,7);r('#9fc6e0',x+1,15,7,5);r('#cfe6f2',x+1,15,7,1)}
  for(const dx of[14,74]){r('#2b2f3a',dx,13,10,20);r('#8a2a22',dx+1,14,8,18);r('#9fc6e0',dx+2,15,2,6);r('#9fc6e0',dx+6,15,2,6);r('#c9a040',dx+4,24,1,3)}
  ptext(r,'KELP COLA',30,26,'#efe6cf');r('#ffe08a',1,25,2,2);r('#ffe08a',93,25,2,2);
  r('#2b2f3a',6,33,18,3);r('#2b2f3a',72,33,18,3);r('#5a5f68',9,34,3,2);r('#5a5f68',18,34,3,2);r('#5a5f68',75,34,3,2);r('#5a5f68',84,34,3,2)});
const tramPole=mk(6,30,r=>{r('#5a5f68',2,0,2,30);r('#7d858e',2,0,1,30);r('#3a3d44',0,0,6,2);r(SNOW,0,0,6,1);r('#3a3d44',1,28,4,2)});
// A fast-food van seen from the side: a serving hatch under a striped awning, a menu, a sign on the roof and a steaming vent.
// Drawn 10 pixels taller than its tiles.
function vanArt(w,h){const W=w*16,H=h*16+10;return mk(W,H,r=>{
  const top=10,bot=H-6;r('#f2efe6',2,top,W-4,bot-top);r('#ffffff',2,top,W-4,2);r('#c0392b',2,bot-9,W-4,4);r('#e0a100',2,bot-5,W-4,2);
  r('#d8d2c0',W-14,top+2,10,bot-top-12);r('#9fc6e0',W-12,top+4,6,6);r('#cfe6f2',W-12,top+4,6,1);r('#e0a100',W-5,bot-4,3,2);
  // hatch with a counter, an awning above it and a menu beside it
  r('#3a2a20',8,top+6,W-26,bot-top-17);r('#ffd98a',9,top+7,W-28,3);r('#a8794c',6,bot-12,W-22,3);r('#c49565',6,bot-12,W-22,1);
  for(let x=5;x<W-15;x++){const c=(x>>2)&1?'#c0392b':'#f2f2f2';r(c,x,top+2,1,4);if((x&3)==1)r(c,x,top+6,1,1)}
  r('#f2f2f2',13,bot-11,3,2);r('#e0a100',17,bot-11,4,2);r('#c0392b',22,bot-11,2,2);
  // roof sign and vent
  r('#2b2f3a',6,1,W-30,8);r('#e0a100',7,2,W-32,6);ptext(r,'HOT FOOD',9,3,'#c0392b');r('#5a5f68',W-16,4,5,6);r('#7d858e',W-16,4,5,1);r(SNOW,2,top-1,W-4,1);
  // wheels
  for(const x of[10,W-20]){r('#1a1c22',x,bot-2,10,8);r('#5a5f68',x+3,bot+1,4,3)}})}
// A frozen fountain: a stone basin of ice around a pillar with a snowy bowl on top. Drawn 16 pixels taller than its tiles.
function fountainArt(w,h){const W=w*16,H=h*16+16;return mk(W,H,r=>{
  for(let y=14;y<H-1;y++)for(let x=0;x<W;x++){const q=((x-W/2+.5)/(W/2))**2+((y-H+16)/14)**2;if(q<1)r(q>.62?(y<H-10?'#c9ced4':'#8a9099'):q>.5?'#6b737c':hash(x,y,80)>.93?'#ffffff':(x+y)%7==0?'#cfe6f2':'#9fc6e0',x,y)}
  const cx=W>>1;r('#a9b0b8',cx-3,6,6,16);r('#c9ced4',cx-3,6,2,16);r('#8a9099',cx-9,4,18,4);r('#c9ced4',cx-9,4,18,1);r(SNOW,cx-9,3,18,2);r('#cfe6f2',cx-7,8,2,6);r('#cfe6f2',cx+5,8,2,5);
  r('#a9b0b8',cx-1,0,2,4);r(SNOW,cx-2,0,4,1)})}
// A cast-iron manhole cover, lightly dusted with snow.
const manholeArt=mk(14,14,r=>{for(let y=0;y<14;y++)for(let x=0;x<14;x++){const d=Math.hypot(x-6.5,y-6.5);if(d>6.8)continue;
  r(d>5.6?'#3a3d44':((x+y)%3==0?'#2b2f3a':'#555a62'),x,y)}r('#7a808a',4,4,2,1);r(SNOW,2,3,2,1);r(SNOW,9,10,3,1)});
// A canvas tent with its flap open at door column dx.
function tentArt(w,h,dx){const W=w*16,H=h*16+8,cx=dx>=0?dx*16+8:W>>1;return mk(W,H,r=>{
  for(let y=0;y<H-1;y++){const hw=Math.min(W/2,3+y*(W/2-3)/(H-6));for(let x=Math.max(0,Math.round(W/2-hw));x<Math.min(W,Math.round(W/2+hw));x++){
    let col=x<W/2-hw/3?'#6f8c58':x>W/2+hw/3?'#4a663a':'#5e7a4a';if(y<3)col=SNOW;else if(y%6==0)col=shade(col,-.12);r(col,x,y)}}
  for(let y=H-14;y<H-1;y++){const hw=Math.round((y-(H-14))*.45);r('#2a2a22',cx-hw,y,hw*2+1,1)}
  r('#5a3d2a',0,H-2,2,2);r('#5a3d2a',W-2,H-2,2,2);r('#c9b28a',2,H-6,4,1);r('#c9b28a',W-6,H-6,4,1)})}
const rockArt=v=>mk(16,12,r=>{for(let y=0;y<12;y++)for(let x=0;x<16;x++){const q=((x-7.5)/(7.5-v))**2+((y-7)/5.2)**2;if(q>1)continue;
  let col=x+y<11?'#a3abb3':x+y>17?'#5f666e':'#868e97';if(y<2+((x*5+v)%3==0?1:0)+(v==1?1:0))col=y<1?SNOW:'#dfe8ef';r(col,x,y)}});
const ROCKS=[0,1,2].map(rockArt);
Object.assign(PA,{
driftwood:[8,r=>{r('#8a7a62',0,3,15,4);r('#a8987c',0,3,15,1);r('#6b5d48',0,6,15,1);r('#8a7a62',10,0,2,4);r('#a8987c',10,0,1,3);r('#c9bfae',2,4,1,1);r('#c9bfae',8,5,2,1)}],
firepit:[9,r=>{for(const[x,y]of[[1,4],[4,6],[8,7],[12,5],[13,2],[2,1]])r('#7a828a',x,y,3,3);r('#3a2a20',4,2,8,4);r('#6b4a2e',3,3,10,2);r('#8a6a45',5,1,6,1)}],
lifebuoy:[22,r=>{r('#6b4a2e',7,0,2,22);r('#8a6a45',7,0,1,22);r(SNOW,6,0,4,1);for(let y=0;y<9;y++)for(let x=0;x<9;x++){const d=Math.hypot(x-4,y-4);if(d<=4.3&&d>=2)r(Math.atan2(y-4,x-4)*2/Math.PI+4&1?'#e04a3a':'#f2f2f2',x+3,y+5)}}],
sign:[16,r=>{r('#6b4a2e',3,6,2,10);r('#6b4a2e',11,6,2,10);r('#a8794c',0,1,16,7);r('#c49565',0,1,16,1);r('#8a6038',0,7,16,1);r(SNOW,0,0,16,1);r('#5a3d2a',3,3,10,1);r('#5a3d2a',3,5,7,1)}],
seaweed:[5,r=>{r('#3d5a2e',1,2,6,2);r('#4f7a3a',3,1,5,2);r('#3d5a2e',8,3,6,2);r('#5e8f48',10,2,3,1);r('#2f4a24',5,4,5,1)}],
shell:[5,r=>{r('#f0d8c8',5,1,5,4);r('#e0b8a0',6,1,1,4);r('#e0b8a0',8,1,1,4);r('#fff2e8',5,1,5,1);r('#d8d0e0',11,3,3,2)}],
signpost:[24,r=>{r('#6b4a2e',7,4,2,20);r('#8a6a45',7,4,1,20);r('#c49565',1,3,12,5);r('#a8794c',13,4,2,3);r('#c49565',3,10,12,5);r('#a8794c',1,11,2,3);r(SNOW,1,2,12,1);r(SNOW,3,9,12,1);
  r('#5a3d2a',3,5,8,1);r('#5a3d2a',5,12,8,1);r(SNOW,6,3,4,1)}],
fence:[12,r=>{r('#6b4a2e',1,0,2,12);r('#6b4a2e',13,0,2,12);r('#8a6a45',0,3,16,2);r('#8a6a45',0,8,16,2);r('#a8794c',0,3,16,1);r('#a8794c',0,8,16,1);r(SNOW,0,2,16,1);r(SNOW,0,7,16,1);r(SNOW,1,0,2,1);r(SNOW,13,0,2,1)}],
warn:[18,r=>{r('#5a5f68',7,8,2,10);r('#e0a100',1,0,14,10);r('#f0c040',2,1,12,1);r('#2b2f3a',7,2,2,5);r('#2b2f3a',7,8,2,1);r(SNOW,1,0,14,1)}],
gen:[14,r=>{r('#3d6b4f',0,2,16,11);r('#4f8a64',0,2,16,2);r('#2f5a40',0,11,16,2);for(let x=2;x<9;x+=2)r('#2a4a36',x,5,1,5);r('#2b2f3a',11,5,3,3);r('#ffd23a',12,6,1,1);r(SNOW,0,1,16,2);r('#3a3a44',13,0,2,2)}],
spool:[13,r=>{r('#8a6038',0,0,4,13);r('#8a6038',12,0,4,13);r('#3a3a44',4,2,8,9);for(let y=3;y<11;y+=2)r('#555a62',4,y,8,1);r('#a8794c',0,0,4,1);r('#a8794c',12,0,4,1);r(SNOW,0,0,16,1)}],
forsale:[18,r=>{r('#6b4a2e',3,6,2,12);r('#f2f2f2',0,0,16,8);r('#c0392b',0,0,16,2);ptext(r,'SALE',1,2,'#c0392b');r(SNOW,0,0,16,1)}],
hay:[12,r=>{r('#c9a040',1,2,14,10);r('#e0bc5a',1,2,14,2);r('#a8862a',1,9,14,1);r('#8a6a20',4,2,1,10);r('#8a6a20',11,2,1,10);r(SNOW,1,1,14,2);r(SNOWD,3,3,10,1)}],
drum:[14,r=>{r('#2b2f3a',3,1,10,13);r('#3a3f4a',3,1,3,13);r('#e0a100',3,4,10,2);r('#e0a100',3,10,10,1);r('#1a1c22',11,1,2,13);r('#5a5f68',4,0,8,2);r(SNOW,4,0,8,1)}],
pipes:[10,r=>{for(const y of[6,3,0]){const o=y==0?3:y==3?1:0;r('#8d959e',o,y+1,16-o,3);r('#b9c0c7',o,y+1,16-o,1);r('#5a5f68',o,y+3,16-o,1);r('#2b2f3a',o,y+1,2,3)}r(SNOW,3,0,13,1)}],
cone:[10,r=>{r('#e8792a',6,1,4,7);r('#e8792a',5,4,6,4);r('#f2f2f2',5,4,6,1);r('#f2f2f2',6,2,4,1);r('#2b2f3a',3,8,10,2);r(SNOW,7,0,2,1)}],
cart:[12,r=>{r('#7a5232',1,2,12,6);r('#946640',1,2,12,1);r('#5a3a22',1,7,12,1);r('#3a3a44',3,8,4,4);r('#5a5f68',4,9,2,2);r('#6b4a2e',13,4,3,1);r(SNOW,2,1,10,2)}],
buffer:[14,r=>{r('#5a5f68',2,8,12,6);r('#7d858e',2,8,12,1);for(let x=1;x<15;x++)r(((x>>1)&1)?'#c0392b':'#f2f2f2',x,2,1,6);r('#2b2f3a',1,1,14,1);r(SNOW,1,0,14,1);
  r('#3a3d44',3,4,3,3);r('#3a3d44',10,4,3,3);r('#ffd23a',4,5,1,1);r('#ffd23a',11,5,1,1)}],
hedge:[14,r=>{r('#2b5c4b',0,2,16,12);r('#3e7a62',1,3,14,3);r('#1d4038',0,11,16,3);for(let x=1;x<15;x+=3)r('#4f8a72',x,6+(x%2),1,1);r(SNOW,0,1,16,3);r(SNOWD,0,4,16,1)}],
statue:[26,r=>{r('#8a9099',3,20,10,6);r('#a9b0b8',3,20,10,1);r('#c9ced4',5,8,6,12);r('#e8ecef',5,8,2,12);r('#c9ced4',4,10,8,6);r('#c9ced4',6,2,4,6);r('#e8ecef',6,2,1,6);
  r('#c9ced4',11,6,2,6);r('#a9b0b8',12,2,1,5);r(SNOW,6,1,4,1);r(SNOW,3,19,10,1)}],
flowers:[8,r=>{r('#5a3d2a',0,4,16,4);r('#6b4a2e',0,4,16,1);for(let x=1;x<15;x+=3){r('#2b5c4b',x,1,2,3);r(['#c0392b','#e07a9a','#7d3c98'][x%3],x,0,2,2)}r(SNOW,0,3,16,1);r(SNOW,3,0,1,1);r(SNOW,10,0,2,1)}],
vent:[6,r=>{r('#4a4048',1,1,14,4);r('#2a2028',3,2,10,2);r('#e8501e',6,2,3,1);r('#ff8a3a',7,2,1,1);r('#5a5058',2,0,4,1);r('#5a5058',10,0,4,1)}],
dish:[18,r=>{r('#5a5f68',7,10,2,8);r('#5a5f68',4,16,8,2);for(let y=0;y<11;y++)for(let x=0;x<14;x++){if(((x-6.5)/6.5)**2+((y-5)/5)**2<1)r(x>8?'#b9c0c7':'#e8ecef',x+1,y)}r('#5a5f68',7,4,2,2);r(SNOW,3,0,8,1)}]});
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

// ---- Interiors: a back wall with windows and pictures, a floor per building, and detailed furniture.
// fl: floor (wood, tile, check, carpet) and its colours f; wall/wall2/pap: wallpaper; deco: [tileX, kind] along the back wall;
// rug: colour of a rug under the table; quilt: bed cover colour; curtain: window curtains.
const INT={
default:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c4b48c',pap:'stripe',deco:[]},
plant:{fl:'tile',f:['#b4bcc0','#a7b0b5'],wall:'#e4ebee',wall2:'#9fc3d6',pap:'tiles',base:'#4a5058',deco:[[2,'win'],[6,'safety'],[9,'clock'],[12,'win'],[16,'win']]},
hq:{fl:'carpet',f:['#8e2f2a','#a8433a'],wall:'#e8dcc0',wall2:'#9a7049',pap:'panel',deco:[[2,'win'],[5,'portrait'],[9,'banner'],[10,'banner'],[14,'portrait'],[17,'win']]},
apartments:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c9b994',pap:'stripe',curtain:'#a33b2f',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic'],[7,'clock']]},
bar:{fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#2f4a3a',wall2:'#294232',pap:'stripe',curtain:'#7a2a2a',deco:[[1,'win'],[14,'dart'],[17,'neon'],[18,'win']]},
barflat:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c9b48a',wall2:'#bba67c',pap:'stripe',curtain:'#3d6b5a',quilt:'#7a5a8a',deco:[[1,'win'],[5,'pic'],[7,'win']]},
fishshop:{fishCounter:1,fl:'check',f:['#e8eef2','#5b8fb9'],wall:'#cfe6ee',wall2:'#a9d4e8',pap:'tiles',base:'#4a5058',deco:[[12,'win'],[1,'poster']]},
house_tom:{fl:'wood',f:['#b08658','#a37a4e','#bb9062'],wall:'#e8d9a8',wall2:'#d9c690',pap:'flower',rug:'#2e6f9a',quilt:'#c0392b',curtain:'#c0392b',deco:[[2,'win'],[5,'pic']]},
house_sam:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c8dcc0',wall2:'#b4ccaa',pap:'stripe',rug:'#a33b2f',quilt:'#2e86c1',curtain:'#2e6f9a',deco:[[5,'win'],[8,'clock']]},
house_bob:{fl:'wood',f:['#b8946a','#aa865c','#c29e72'],wall:'#ecd2c0',wall2:'#dcbea8',pap:'flower',rug:'#3d7a5a',quilt:'#c9822a',curtain:'#3d7a5a',deco:[[4,'win'],[7,'pic'],[8,'win']]},
palacehall:{fl:'check',f:['#efe6cf','#5e2a75'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#8a6a45',deco:[[2,'portrait'],[8,'rbanner'],[10,'win'],[14,'win'],[16,'rbanner'],[22,'portrait'],[17,'clock']]},
throne:{fl:'carpet',f:['#8e2f2a','#c9a040'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#8a6a45',deco:[[2,'win'],[4,'rbanner'],[7,'portrait'],[12,'portrait'],[15,'rbanner'],[17,'win']]},
royalrooms:{fl:'carpet',f:['#5e2a75','#7d3c98'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',quilt:'#7d3c98',curtain:'#5e2a75',base:'#8a6a45',deco:[[1,'pic'],[3,'win'],[6,'clock'],[10,'portrait'],[12,'win'],[18,'pic'],[20,'win']]},
dining:{fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',rug:'#5e2a75',curtain:'#5e2a75',base:'#8a6a45',deco:[[3,'portrait'],[7,'win'],[10,'rbanner'],[12,'win'],[16,'portrait']]},
kitchen:{fl:'tile',f:['#d8d2c0','#c8c2b0'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',base:'#4a5058',deco:[[7,'clock'],[13,'win']]},
winecellar:{fl:'stone',f:[],wall:'#6b5a48',wall2:'#4a3f34',pap:'brick',base:'#3a3530',deco:[[13,'win']]},
library:{fl:'wood',f:['#7a5432','#6e4a2c','#866038'],wall:'#3d5a4a',wall2:'#34503f',pap:'stripe',rug:'#8e2f2a',base:'#5a3d2a',deco:[[5,'portrait'],[10,'clock'],[15,'portrait']]},
vault:{fl:'stone',f:[],wall:'#7d858e',wall2:'#5a5f68',pap:'brick',base:'#3a3d44',deco:[]},
villa_phil:{fl:'wood',f:['#c29e72','#b8946a','#cca87c'],wall:'#f2ede0',wall2:'#e2dccb',pap:'panel',rug:'#2e9d57',quilt:'#2e6f4a',curtain:'#2e9d57',deco:[[1,'win'],[4,'pic'],[9,'win'],[14,'clock']]},
villa_dario:{fl:'wood',f:['#7a5a3a','#6e5034','#866444'],wall:'#d8dce2',wall2:'#c8ccd4',pap:'stripe',rug:'#37474f',quilt:'#37474f',curtain:'#37474f',deco:[[6,'pic'],[9,'win'],[11,'portrait'],[14,'win']]},
villa_gustavo:{fl:'check',f:['#e8e2d4','#2a2a33'],wall:'#5a2a2a',wall2:'#4a2222',pap:'stripe',rug:'#c9a040',quilt:'#8a1a1a',curtain:'#8a1a1a',deco:[[4,'portrait'],[12,'pic'],[15,'win']]},
house_thyme:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#e8e2d4',wall2:'#d8d0c0',pap:'panel',rug:'#5a3a8a',quilt:'#5a3a8a',curtain:'#5a3a8a',deco:[[1,'win'],[4,'cross'],[8,'win']]},
shack_hekki:{fl:'wood',f:['#7a6048','#6e5640','#866a50'],wall:'#8a7a62',wall2:'#7a6a52',pap:'stripe',quilt:'#5a6a4a',curtain:'#5a6a4a',deco:[[3,'pic'],[6,'win']]},
tent_pat:{fl:'sand',f:[],wall:'#5e7a4a',wall2:'#53703f',pap:'stripe',base:'#3d5030',quilt:'#7a3a2a',deco:[]},
gunshop:{fl:'wood',f:['#6b5a48','#5e4f40','#766450'],wall:'#8a7a5a',wall2:'#7a6a4a',pap:'stripe',deco:[[1,'win'],[10,'win']]},
supermarket:{fl:'tile',f:['#e8eef2','#dfe6ea'],wall:'#f2f2f2',wall2:'#cfe8d8',pap:'tiles',base:'#2e9d57',deco:[[7,'win'],[17,'clock']]},
citybar:{fl:'wood',f:['#5e4128','#6b4a2e','#74513a'],wall:'#5a2e2a',wall2:'#4a2622',pap:'stripe',curtain:'#2f2a36',deco:[[11,'dart'],[13,'neon'],[1,'win']]},
tailor:{fl:'carpet',f:['#c9b8d8','#b8a6c8'],wall:'#efe6f2',wall2:'#d8c8e0',pap:'flower',curtain:'#7d3c98',deco:[[5,'pic'],[11,'win']]},
casino:{fl:'carpet',f:['#5a1a2a','#c9a040'],wall:'#2a1a3a',wall2:'#c9a040',pap:'panel',base:'#c9a040',deco:[[9,'neon'],[10,'portrait'],[19,'clock']]},
bookshop:{fl:'wood',f:['#7a5432','#6e4a2c','#866038'],wall:'#3d5a4a',wall2:'#34503f',pap:'stripe',deco:[[5,'win'],[11,'clock']]},
fishingshop:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#cfe6ee',wall2:'#a9d4e8',pap:'stripe',deco:[[6,'poster'],[11,'win']]},
estateagent:{fl:'carpet',f:['#5b6b7a','#6b7b8a'],wall:'#f2ede0',wall2:'#e2dccb',pap:'panel',deco:[[5,'listing'],[7,'listing'],[11,'win']]},
sewers:{fl:'stone',f:[],wall:'#6b5a48',wall2:'#4a3f34',pap:'brick',base:'#3a3530',deco:[]},
house_frank:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#d8c8a8',wall2:'#c8b898',pap:'stripe',rug:'#4a5a3a',quilt:'#4a5a3a',curtain:'#4a5a3a',deco:[[2,'win'],[5,'pic']]},
house_lisa:{fl:'wood',f:['#b08658','#a37a4e','#bb9062'],wall:'#d8ecd8',wall2:'#c4dcc4',pap:'flower',rug:'#2e9d57',quilt:'#e8792a',curtain:'#2e9d57',deco:[[5,'win'],[8,'clock']]},
house_eddie:{fl:'wood',f:['#7a5432','#6e4a2c','#866038'],wall:'#e8d0c0',wall2:'#d8bea8',pap:'stripe',rug:'#8a3a2a',quilt:'#2e5f8f',curtain:'#8a3a2a',deco:[[4,'win'],[7,'pic'],[8,'win']]},
house_grace:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#ece0f0',wall2:'#dccee4',pap:'flower',rug:'#7d3c98',quilt:'#c94a8a',curtain:'#7d3c98',deco:[[3,'pic'],[8,'win'],[1,'win']]},
house_vince:{fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#3a2a4a',wall2:'#2f2240',pap:'stripe',rug:'#c9a040',quilt:'#5a1a2a',curtain:'#5a1a2a',deco:[[2,'win'],[5,'pic']]},
house_mary:{fl:'wood',f:['#b8946a','#aa865c','#c29e72'],wall:'#f2e8d8',wall2:'#e4d8c4',pap:'flower',rug:'#8a3a2a',quilt:'#3d5a4a',curtain:'#8a3a2a',deco:[[5,'win'],[8,'clock']]},
house_jack:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#cfe0ea',wall2:'#bcd0dc',pap:'stripe',rug:'#2e6f9a',quilt:'#e0a100',curtain:'#2e6f9a',deco:[[4,'win'],[7,'poster'],[8,'win']]},
house_sally:{fl:'wood',f:['#c29e72','#b8946a','#cca87c'],wall:'#f2ede0',wall2:'#e2dccb',pap:'panel',rug:'#2e6f9a',quilt:'#e07a9a',curtain:'#2e6f9a',deco:[[3,'pic'],[8,'win'],[1,'win']]},
house_forsale:{fl:'wood',f:['#9a8a72','#8e7e68','#a6967c'],wall:'#d8d4cc',wall2:'#c8c4bc',pap:'stripe',deco:[[2,'win'],[7,'win']]},
hekki_room:{fl:'wood',f:['#5e4f40','#544638','#685848'],wall:'#4a4a40',wall2:'#3e3e35',pap:'stripe',base:'#2b2b25',deco:[[2,'map'],[10,'map'],[13,'clock']]},
transhut:{fl:'carpet',f:['#3a4a5a','#4a5a6a'],wall:'#9aa0a6',wall2:'#7d858e',pap:'tiles',base:'#4a5058',deco:[[6,'onair'],[10,'clock'],[15,'poster']]},
chapel:{fl:'check',f:['#e8e2d4','#c9c2b0'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',curtain:'#5e2a75',base:'#8a6a45',deco:[[2,'win'],[4,'portrait'],[7,'cross'],[10,'portrait'],[12,'win']]},
crypt:{fl:'stone',f:[],wall:'#6b6458',wall2:'#4a443c',pap:'brick',base:'#3a3530',deco:[[3,'cross'],[7,'rbanner'],[12,'cross']]},
tram:{fl:'tile',f:['#7d858e','#737b84'],wall:'#efe6cf',wall2:'#b8322a',pap:'panel',base:'#5a5f68',curtain:null,deco:[[2,'win'],[5,'win'],[8,'win'],[12,'win'],[15,'win']]},
monks:{fl:'stone',f:[],wall:'#b8b2a6',wall2:'#8a8478',pap:'brick',base:'#5a564f',quilt:'#6b4a2e',deco:[[3,'win'],[12,'cross'],[14,'clock'],[20,'cross'],[23,'win']]},
monchurch:{fl:'check',f:['#e8e2d4','#8a6a45'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#5a3d2a',deco:[[2,'win'],[4,'portrait'],[7,'portrait'],[11,'cross'],[14,'portrait'],[17,'portrait'],[19,'win']]},
house_pekka:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#f2e2c0',wall2:'#e4d2ac',pap:'stripe',rug:'#c0392b',quilt:'#e0a100',curtain:'#c0392b',deco:[[2,'win'],[5,'pic']]},
servants:{fl:'wood',f:['#9a8a72','#8e7e68','#a6967c'],wall:'#e8e0cc',wall2:'#d8ceb4',pap:'stripe',rug:'#5e2a75',quilt:'#7d3c98',curtain:'#5e2a75',deco:[[3,'win'],[6,'clock'],[9,'pic'],[12,'win']]},
house_kate:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d6e0ec',wall2:'#c2cfe0',pap:'flower',rug:'#7d3c98',quilt:'#d86a8a',curtain:'#7d3c98',deco:[[3,'pic'],[8,'win'],[1,'win']]}};
function floorPx(X,Y,f){
  if(f.fl=='wood'){const row=Y>>2,sx=X+(hash(row,1,40)*32|0),seg=sx>>5,c=f.f[hash(seg,row,41)*f.f.length|0];
    return(Y&3)==3||(sx&31)==0?shade(c,-.28):(Y&3)==0?shade(c,.07):hash(X,Y,42)>.94?shade(c,-.1):c}
  if(f.fl=='sand')return sandPx(X,Y);
  if(f.fl=='stone'){const row=Y>>3,sx=X+(row&1)*4;return(Y&7)==7||(sx&7)==7?'#4a4f50':hash(sx>>3,row,44)>.5?'#7a7f80':'#6e7374'}
  if(f.fl=='tile')return(X&7)==7||(Y&7)==7?'#8a9398':((X>>3)+(Y>>3))&1?f.f[1]:f.f[0];
  if(f.fl=='check'){const c=((X>>3)+(Y>>3))&1?f.f[1]:f.f[0];return(X&7)==7||(Y&7)==7?shade(c,-.12):c}
  return(X%6==0&&Y%6==0)||((X+3)%6==0&&(Y+3)%6==0)?f.f[1]:f.f[0]}
function wallPx(X,fy,f){if(f.pap=='brick'){const row=fy>>2;return(fy&3)==3||((X+(row&1)*4)&7)==7?f.wall2:f.wall}
  if(f.pap=='stripe')return(X>>2)&1?f.wall:f.wall2;if(f.pap=='tiles')return(X&3)==3||(fy&3)==3?f.wall2:f.wall;
  if(f.pap=='flower')return(X%6==2&&fy%6==2)||(X%6==5&&fy%6==5)?f.wall2:f.wall;if(f.pap=='panel'&&fy>5)return fy==6?shade(f.wall2,.2):f.wall2;return f.wall}
// The back wall is drawn WU pixels taller than its tile row, reaching above the map (game.js lets the camera show it).
const WU=16;
function interiorLayer(m){
  const M=MAPS[m],h=M.length,w=M[0].length,W=w*T,H=h*T+WU,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data,f=INT[m]||INT.default;
  const at=(x,y)=>(M[y]&&M[y][x])||'W',isW=(x,y)=>at(x,y)=='W',bb=f.base||'#5a3d2a';
  const dpx=(lx,y)=>lx==2||lx==13||y==0?'#3b2818':lx==7||lx==8?'#4a3222':(lx==6||lx==9)&&y==15?'#c9a040':y%7==3?'#6b4a2e':'#8a5a36';
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){const ch=M[ty][tx],bd=ty==0&&ch=='m',wall=ch=='W'||bd,face=wall&&ty<h-1&&!isW(tx,ty+1),capH=ty==0?0:6;
    if(ty==0)for(let ly=0;ly<WU;ly++)for(let lx=0;lx<16;lx++){const X=tx*16+lx,col=!face||ly<3?(ly==2&&face?'#54443a':'#3d3029'):shade(wallPx(X,ly-3,f),ly<5?-.2:0),i=(ly*W+X)*4;p.set(rgb(bd&&lx>=2&&lx<=13&&ly>=4?dpx(lx,ly-4):col),i);p[i+3]=255}
    for(let ly=0;ly<16;ly++)for(let lx=0;lx<16;lx++){const X=tx*16+lx,Y=ty*16+ly;let col;
      if(wall&&face){if(ly<capH)col=ly==capH-1?'#54443a':'#3d3029';else if(ly>=14)col=ly==14?shade(bb,.18):bb;
        else{const fy=ty==0?ly+WU-3:ly-capH;col=wallPx(X,fy,f);if(fy<2)col=shade(col,-.2)}
        if(bd&&lx>=2&&lx<=13&&ly<14)col=dpx(lx,ly+WU-4)}
      else if(wall){col='#3d3029';if((lx==15&&!isW(tx+1,ty))||(lx==0&&!isW(tx-1,ty))||(ly==0&&!isW(tx,ty-1)))col='#54443a'}
      else if(ch=='~'){const e=(at(tx,ty-1)!='~'&&ly<3)||(at(tx,ty+1)!='~'&&ly>12);col=e?'#3a3f3a':(Y+(X>>3))%5==0?'#5a7060':hash(X,Y,45)>.97?'#7a9070':'#3d5244'}
      else{col=floorPx(X,Y,f);
        if(isW(tx,ty-1)&&ly<4)col=mix(col,'#000000',.3-ly*.07);if(isW(tx-1,ty)&&lx<3)col=mix(col,'#000000',.22-lx*.07);if(isW(tx+1,ty)&&lx>13)col=mix(col,'#000000',.12);
        if(ch=='m'&&lx>1&&lx<14&&ly>2&&ly<14)col=lx==2||lx==13||ly==3||ly==13?'#6b3a2a':(ly>>1)&1?'#8a4a3a':'#9a5a44';
        if(ch=='m'&&ly>13)col=mix(col,'#ffffff',.18)}
      const i=((Y+WU)*W+X)*4;p.set(rgb(col),i);p[i+3]=255}}
  g.putImageData(img,0,0);
  // r draws in map coordinates (the canvas is shifted down by WU)
  const r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,(y|0)+WU,a,b)};
  // a rug under the (first) table
  if(f.rug)FL[m].filter(q=>q[4]=='u').slice(0,1).forEach(([x,y,ww,hh])=>{const X=x*16-6,Y=y*16-4,RW=ww*16+12,RH=hh*16+10;r(shade(f.rug,-.3),X,Y,RW,RH);r(f.rug,X+1,Y+1,RW-2,RH-2);
    r(shade(f.rug,.35),X+3,Y+3,RW-6,1);r(shade(f.rug,.35),X+3,Y+RH-4,RW-6,1);for(let k=X+2;k<X+RW-2;k+=2){r('#f2e6c8',k,Y-1);r('#f2e6c8',k,Y+RH)}});
  // back-wall decorations
  const an=[];
  f.deco.forEach(([x,k])=>{const X=x*16;
    if(k=='win'){r(OUT,X+1,-9,14,20);r('#f2efe6',X+2,-8,12,18);r('#9cc6e0',X+3,-7,10,14);r('#cfe6f2',X+3,-7,10,4);r('#ffffff',X+3,4,10,3);r('#2b5c4b',X+4,0,2,4);r('#2b5c4b',X+3,2,4,2);r('#2b5c4b',X+10,-1,2,5);r('#2b5c4b',X+9,2,4,2);
      r('#f2efe6',X+8,-7,1,14);r('#f2efe6',X+3,-1,10,1);r('#d8d2c0',X,11,16,2);r(SNOW,X+1,11,14,1);if(f.curtain){r(f.curtain,X-1,-10,3,21);r(f.curtain,X+14,-10,3,21);r(shade(f.curtain,.2),X-1,-10,1,21);r(shade(f.curtain,-.2),X-2,-11,20,2)}
      for(let y=16;y<44;y++){const a=(y-16)/5;g.fillStyle='rgba(255,250,235,.08)';g.fillRect(X+3-a|0,y+WU,10+a*2|0,1)}}
    if(k=='pic'){r(OUT,X+2,-6,12,11);r('#8a6038',X+3,-5,10,9);r('#9cc6e0',X+4,-4,8,7);r('#5e8f48',X+4,0,8,3);r('#7aa860',X+6,-1,4,1);r('#f2f2f2',X+5,-3,3,1)}
    if(k=='portrait'){r(OUT,X+3,-8,10,16);r('#c9a040',X+4,-7,8,14);r('#3a2a20',X+5,-6,6,12);r('#e0b080',X+6,-4,4,4);r('#5a3a26',X+6,-5,4,1);r('#2a2a33',X+5,1,6,5);r('#c0392b',X+7,1,2,2)}
    if(k=='banner'){r('#5a3d2a',X+3,-10,10,1);r('#c0392b',X+4,-9,8,21);r('#a52f24',X+11,-9,1,21);r('#ffd23a',X+7,-5,2,4);r('#ffd23a',X+5,-4,6,2);r(f.wall2,X+7,11,2,1)}
    if(k=='clock'){r(OUT,X+3,-5,10,10);r('#8a6038',X+4,-4,8,8);r('#f4f4f0',X+5,-3,6,6);r('#2a2a33',X+8,-2,1,3);r('#2a2a33',X+8,0,2,1)}
    if(k=='safety'){r(OUT,X+2,-6,12,11);r('#2e9d57',X+3,-5,10,9);r('#ffffff',X+7,-4,2,7);r('#ffffff',X+5,-2,6,2)}
    if(k=='dart'){r(OUT,X+3,-6,10,10);r('#2a2a33',X+4,-5,8,8);r('#c0392b',X+5,-4,6,6);r('#f2e6c8',X+6,-3,4,4);r('#2e9d57',X+7,-2,2,2)}
    if(k=='poster'){r(OUT,X+2,-9,12,18);r('#f4f4f0',X+3,-8,10,16);r('#c0392b',X+4,-6,8,2);r('#5b8fb9',X+4,-1,6,3);r('#5b8fb9',X+10,-2,2,5);r(OUT,X+5,0,1,1);r('#9cc6e0',X+4,4,8,2)}
    if(k=='rbanner'){r('#5a3d2a',X+3,-10,10,1);r('#7d3c98',X+4,-9,8,21);r('#5e2a75',X+11,-9,1,21);r('#ffd23a',X+5,-4,6,3);r('#ffd23a',X+5,-6,1,2);r('#ffd23a',X+7,-6,2,2);r('#ffd23a',X+10,-6,1,2);r(f.wall,X+7,11,2,1)}
    if(k=='cross'){r('#c9a040',X+7,-8,2,16);r('#c9a040',X+4,-4,8,2);r('#e8c860',X+7,-8,1,16)}
    if(k=='listing')for(let i=0;i<4;i++){const x=X+1+(i&1)*7,y=-8+(i>>1)*9;r(OUT,x,y,7,8);r('#f4f4f0',x+1,y+1,5,6);r(['#c88a7a','#9ab8c8','#e8c88a','#b8d0a8'][i],x+2,y+4,3,3);r('#4a4f58',x+2,y+2,3,2)}
    if(k=='neon'){r('#1a1520',X,-5,16,10);an.push({t:'neon',x:X+2,y:-2,s:'BAR'})}
    if(k=='onair'){r(OUT,X-6,-6,29,11);r('#1a1520',X-5,-5,27,9);an.push({t:'neon',x:X-3,y:-3,s:'ON AIR',col:'#ff3b2f'})}
    if(k=='map'){r(OUT,X,-9,16,18);r('#e8dcc0',X+1,-8,14,16);r('#9cc6e0',X+1,-8,14,16);r('#e8eff5',X+3,-6,9,11);r('#d8e3ec',X+4,-3,7,6);
      r('#c0392b',X+5,-4,2,2);r('#c0392b',X+9,1,2,2);r('#2e6f9a',X+7,-1,2,2);r('#2b2f3a',X+6,-3,4,1);r('#2b2f3a',X+8,-2,1,3);r('#e0a100',X+11,-7,2,2)}});
  c.an=an;return c}
// Furniture for one feature: the outlined picture, how far it reaches above its tiles (oy), and an optional animation.
function furn(ch,w,h,lb,f,v){const W=w*16,H=h*16,l=(lb||'').toLowerCase();
  if(ch=='e'){const q=f.quilt||['#b33333','#2e6f9a','#3d7a5a','#c9822a'][v*4|0],oy=4,TT=H+oy,wd='#6b4a2e';return{oy,c:mk(W,TT,r=>{
    r(wd,0,0,W,7);r('#8a6a45',1,1,W-2,1);r(wd,0,7,2,TT-7);r(wd,W-2,7,2,TT-7);r('#f2f2f2',2,6,W-4,TT-8);r('#ffffff',3,7,W-6,5);r('#d8dfe6',3,11,W-6,1);
    r(q,2,13,W-4,TT-15);for(let y=17;y<TT-2;y+=4)r(shade(q,-.15),2,y,W-4,1);r(shade(q,.25),2,13,W-4,2);r(wd,0,TT-2,W,2)})}}
  if(ch=='u'&&/card|roulette/.test(l)){const oy=5,TT=H+oy+6,seats=[];for(let x=8;x<W;x+=16)seats.push(x);return{oy,c:mk(W,TT,r=>{
    const chair=(cx,y,back)=>{if(back){r('#5a1a2a',cx-3,y,6,3);r('#7a2a3a',cx-3,y,6,1)}r('#8a2a3a',cx-3,y+3,6,3);r('#5a1a2a',cx-3,y+5,6,1)};seats.forEach(x=>chair(x,0,true));
    r('#5a3d2a',0,oy,W,H-4);r('#2e7d4a',2,oy+2,W-4,H-8);r('#3d9a5e',2,oy+2,W-4,1);r(shade('#5a3d2a',-.3),0,oy+H-4,W,2);
    if(l.includes('roulette')){const cx=W-14,cy=oy+(H>>1)-2;for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const d=Math.hypot(x,y);if(d<=6.5)r(d>5?'#5a3d2a':d<2?'#c9a040':(Math.atan2(y,x)*3|0)&1?'#c0392b':'#1a1a22',cx+x,cy+y)}
      for(let x=6;x<W-24;x+=5)r('#f2e6c8',x,oy+5,3,6)}
    else{for(let k=0;k<4;k++){r('#f2f2f2',6+k*7,oy+5,4,6);r('#c0392b',7+k*7,oy+6,1,1)}r('#c0392b',W-12,oy+H-10,3,2);r('#2e86c1',W-8,oy+H-10,3,2);r('#e0a100',W-10,oy+H-12,3,2)}
    seats.forEach(x=>chair(x,oy+H-1,false))})}}
  if(ch=='u'&&l.includes('pew')){const oy=5,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    // a wooden pew: a carved back rail with the seat in front of it
    r('#5a3d2a',0,0,W,6);r('#7a5436',0,0,W,1);for(let x=3;x<W-2;x+=8)r('#4a3222',x,2,2,3);
    r('#8a5a36',0,6,W,TT-9);r('#a87a4c',0,6,W,1);r('#6b4a2e',0,TT-4,W,1);r('#4a3222',1,TT-3,2,3);r('#4a3222',W-3,TT-3,2,3)})}}
  if(ch=='u'&&l.includes('mixing')){const oy=6,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    // a radio mixing desk: rows of faders and knobs, with VU meters along the back (animated)
    r('#3a3d44',0,0,W,8);r('#4a4f58',0,0,W,1);r('#2b2f3a',0,8,W,TT-10);r('#5a5f68',0,8,W,1);r('#1a1c22',1,TT-2,2,2);r('#1a1c22',W-3,TT-2,2,2);
    for(let x=4;x<W-6;x+=12){r('#0e1a14',x,2,8,4);an.push({t:'vu',x,y:2,w:8,h:4})}
    for(let x=3;x<W-3;x+=4){r('#1a1c22',x+1,11,1,TT-16);r('#d0d4d8',x,11+hash(x,1,v*9)*(TT-18)|0,3,2);r(['#c0392b','#e0a100','#2e86c1'][x%3],x,TT-5,2,2)}});
    return{oy,c,an}}
  if(ch=='u'&&l.includes('microphone')){const oy=10,TT=H+oy+6;return{oy,c:mk(W,TT,r=>{
    // a studio table with a microphone on a boom, headphones, and a chair in front
    r('#5a3d2a',0,oy,W,H-4);r('#7a5436',0,oy,W,1);r('#4a3222',0,oy+H-4,W,2);
    const mx=W>>1;r('#5a5f68',mx,2,1,oy+2);r('#5a5f68',mx-8,2,9,1);r('#2b2f3a',mx-11,0,4,7);r('#8d959e',mx-10,1,2,5);r('#1a1c22',mx-2,oy+2,5,2);
    r('#2b2f3a',6,oy+4,8,2);r('#c0392b',5,oy+3,3,4);r('#c0392b',12,oy+3,3,4);r('#f4f4f0',W-14,oy+3,8,6);r('#d0d4d8',W-13,oy+5,6,1);
    r('#2b2f3a',mx-4,oy+H-1,8,3);r('#3a3d44',mx-4,oy+H-1,8,1);r('#1a1c22',mx-1,oy+H+2,2,4)})}}
  if(ch=='u'){const desk=l.includes('desk'),meet=l.includes('meeting'),oy=desk?0:5,TT=H+oy+6,seats=[];for(let x=8;x<W;x+=16)seats.push(x);
    return{oy,c:mk(W,TT,r=>{const chair=(cx,y,back)=>{if(back){r('#5a3d2a',cx-3,y,6,3);r('#7a5436',cx-3,y,6,1)}r('#8a6a45',cx-3,y+3,6,3);r('#6b4a2e',cx-3,y+5,6,1)};
      if(!desk)seats.forEach(x=>chair(x,0,true));
      const tc=desk?'#8a5a36':'#a87a4c';r(tc,0,oy,W,H-4);r(shade(tc,.15),0,oy,W,1);r(shade(tc,-.25),0,oy+H-4,W,2);r('#5a3d2a',1,oy+H-2,2,2);r('#5a3d2a',W-3,oy+H-2,2,2);
      if(desk){r('#3a3d44',3,oy+3,11,7);r('#555a62',4,oy+4,9,3);for(let x=4;x<13;x+=2)r('#d0d4d8',x,oy+8,1,1);r('#f4f4f0',5,oy+1,7,3);
        r('#f4f4f0',W-15,oy+4,9,7);r('#d0d4d8',W-14,oy+6,7,1);r('#d0d4d8',W-14,oy+8,6,1);r('#2e6f4a',W-27,oy+2,7,3);r('#5a5f68',W-25,oy+5,2,5);r('#c0392b',(W>>1)-3,oy+5,7,5)}
      else{seats.forEach(x=>{if(H-4>=10){r('#f2f2f2',x-3,oy+2,6,4);r('#d8dfe6',x-2,oy+3,4,2)}r('#cfe8f0',x+3,oy+2,2,3)});
        if(meet){for(let x=12;x<W-12;x+=14)r('#f4f4f0',x,oy+(H>>1)-3,6,5);r('#7d838a',W>>1,oy+3,4,3)}
        else if(W>=32){r('#f4e6c0',(W>>1)-1,oy+(H>>1)-4,2,4);r('#ffd23a',(W>>1)-1,oy+(H>>1)-6,2,2)}}
      seats.forEach(x=>chair(x,oy+H-1,false))})}}
  if(ch=='y'&&/gun|cloth|rail|fridge|rods|tackle|slot|pipes/.test(l)){const oy=12,TT=H+oy-2;let an=null;const c=mk(W,TT,r=>{
    if(l.includes('gun')){r('#8a7a5a',0,0,W,TT);for(let y=2;y<TT;y+=4)for(let x=2;x<W;x+=4)r('#7a6a4a',x,y);
      for(let y=3;y<TT-4;y+=6)for(let x=2;x<W-14;x+=16){r('#6b4a2e',x,y+1,5,2);r('#2a2a33',x+5,y+1,9,1);r('#2a2a33',x+5,y,2,1)}}
    else if(l.includes('cloth')){r('#5a3d2a',0,TT-3,W,3);for(let x=1;x<W-3;x+=5){const col=['#c0392b','#2e6f9a','#e0a100','#3d7a5a','#7d3c98','#e8e8e8'][hash(x,1,v*7)*6|0];r(col,x,2,4,TT-5);r(shade(col,.3),x,2,4,1);r(shade(col,-.2),x+3,3,1,TT-6)}}
    else if(l.includes('rail')){r('#9aa3ad',0,2,W,1);r('#6b737c',1,2,1,TT-2);r('#6b737c',W-2,2,1,TT-2);for(let x=3;x<W-4;x+=4){const col=['#3a3d44','#8a3a2a','#2e5f8f','#c9b28a','#3d5a4a'][hash(x,2,v*5)*5|0];r('#c9ced4',x+1,1,1,2);r(col,x,3,4,TT-8);r(shade(col,.2),x,3,1,TT-8)}}
    else if(l.includes('fridge')){r('#d8dfe6',0,0,W,TT);for(let x=1;x<W-1;x+=16){r('#a9d4e8',x+1,2,13,TT-5);for(let y=4;y<TT-4;y+=6)for(let k=0;k<4;k++)r(['#c0392b','#2e9d57','#f2f2f2','#e0a100'][(k+y)%4],x+2+k*3,y,2,4);r('#f2f2f2',x+12,TT/2|0,1,4)}}
    else if(l.includes('rods')){r('#8a7a5a',0,TT-4,W,4);for(let x=2;x<W-1;x+=3){r('#5a3d2a',x,0,1,TT-4);r('#9aa3ad',x-1,TT-10,3,2)}}
    else if(l.includes('tackle')){r('#8a7a5a',0,0,W,TT);for(let y=3;y<TT-2;y+=5)for(let x=2;x<W-2;x+=4){r('#c9ced4',x+1,y-1,1,1);r(['#e8792a','#c0392b','#e0a100','#2e86c1'][(x+y)%4],x,y,3,2)}}
    else if(l.includes('slot')){for(let x=0;x<W;x+=16){r('#8a1a2a',x+1,0,14,TT);r('#c9a040',x+1,0,14,2);r('#1a1520',x+3,4,10,6);r('#f2f2f2',x+4,5,2,4);r('#f2f2f2',x+7,5,2,4);r('#f2f2f2',x+10,5,2,4);
      r('#c0392b',x+4,6,1,1);r('#e0a100',x+8,7,1,1);r('#2e86c1',x+11,6,1,1);r('#5a0a1a',x+3,13,10,4);r('#9aa3ad',x+14,6,1,6);r('#c0392b',x+13,5,3,2)}an={t:'blink',x:5,y:1,c:'#ffd23a'}}
    else{for(let y=2;y<TT-2;y+=6){r('#6b737c',0,y,W,4);r('#8d959e',0,y,W,1);r('#4a4f58',0,y+3,W,1);for(let x=6;x<W;x+=14){r('#c0392b',x,y-1,3,6)}}}});
    return{oy,c,an}}
  if(ch=='q')return furn('y',w,h,'Bookcase',f,v);
  if(ch=='o'){const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    // tram seats: a red cushion on a chrome frame for each tile, with a grab handle on the back
    for(let x=0;x<W;x+=16){r('#8a2a22',x+1,0,14,8);r('#b8322a',x+2,1,12,6);r('#d4483d',x+2,1,12,1);r('#c9ced4',x+7,0,2,2);
      r('#8a2a22',x+1,8,14,H-4);r('#c0392b',x+2,9,12,H-7);r('#e04a3a',x+2,9,12,1);r('#9aa3ad',x+2,TT-4,2,4);r('#9aa3ad',x+12,TT-4,2,4)}})}}
  if(ch=='y'&&l.includes('route')){const oy=12,TT=H+oy-2;return{oy,c:mk(W,TT,r=>{
    // the route map: the tram line drawn as a red loop on a dark board, with a dot for each stop
    r('#5a5f68',0,0,W,TT);r('#2b2f3a',1,1,W-2,TT-8);r('#b8322a',3,4,1,TT-16);r('#b8322a',W-4,4,1,TT-16);r('#b8322a',3,4,W-6,1);r('#b8322a',3,TT-12,W-6,1);
    for(const[x,y]of[[3,4],[W-4,4],[W-4,TT-12],[3,TT-12]]){r('#ffffff',x-1,y-1,3,3);r('#b8322a',x,y,1,1)}r('#e0a100',2,TT-6,W-4,4);r('#2b2f3a',5,TT-5,W-10,2)})}}  // the secret door in Hekki's shack looks like any other bookcase
  if(ch=='y'&&l.includes('jewel')){const oy=12,TT=H+oy-2;return{oy,an:{t:'blink',x:W>>1,y:5,c:'#fff2a0'},c:mk(W,TT,r=>{
    // the crown jewels in a glass case on a velvet stand
    r('#5a3d2a',0,TT-6,W,6);r('#7a5436',0,TT-6,W,1);r('#5e2a75',1,4,W-2,TT-10);r('#cfe6f2',1,0,W-2,4);r('#e8f4fa',2,1,3,1);
    const cx=W>>1;r('#ffd23a',cx-6,8,12,4);r('#ffd23a',cx-6,5,2,3);r('#ffd23a',cx-1,4,2,4);r('#ffd23a',cx+4,5,2,3);r('#c0392b',cx-1,9,2,2);r('#2e86c1',cx-5,9,2,2);r('#2e9d57',cx+3,9,2,2);
    r('#c9a040',4,10,3,5);r('#ffd23a',4,9,3,1);r('#e8e8e8',W-8,9,4,4);r('#c9a040',W-7,13,2,2)})}}
  if(ch=='y'&&l.includes('screen')){const oy=14,TT=H+oy-2,an=[];const c=mk(W,TT,r=>{
    // a rack of CRT monitors, two high, each showing something different (animated)
    r('#3a3d44',0,0,W,TT);r('#4a4f58',0,0,W,1);
    for(let x=1;x+14<=W;x+=15)for(const y of[1,(TT>>1)+1]){const hh=(TT>>1)-3;r('#8d959e',x,y,14,hh);r('#b9c0c7',x,y,14,1);r('#0e1a14',x+2,y+2,10,hh-4);an.push({t:'screen',x:x+2,y:y+2,w:10,h:hh-4,k:(x+y)%3})}});
    return{oy,c,an}}
  if(ch=='y'&&l.includes('tape')){const oy=12,TT=H+oy-2,an=[];const c=mk(W,TT,r=>{
    // reel-to-reel tape recorders: two spinning reels above a row of buttons
    for(let x=0;x+16<=W;x+=16){r('#6b737c',x+1,0,15,TT);r('#8d959e',x+1,0,15,1);
      for(const cx of[x+5,x+12]){r('#2b2f3a',cx-3,2,7,7);r('#c9ced4',cx-2,3,5,5);an.push({t:'reel',x:cx,y:5})}
      r('#2b2f3a',x+4,10,10,1);for(let k=0;k<4;k++)r(['#c0392b','#e8e8e8','#e8e8e8','#2e9d57'][k],x+3+k*3,TT-6,2,2)}});
    return{oy,c,an}}
  if(ch=='y'&&/radio|transmit/.test(l)){const oy=10,TT=H+oy-2;return{oy,an:{t:'blink',x:W-6,y:4,c:'#ff8a3a'},c:mk(W,TT,r=>{r('#4a4f58',0,0,W,TT);r('#5a5f68',0,0,W,2);
    for(let x=2;x<W-4;x+=11){r('#2b2f3a',x,4,9,8);r('#7fd0a0',x+1,5,7,3);r('#d0d4d8',x+2,9,2,2);r('#d0d4d8',x+6,9,2,2)}r('#6b4a2e',0,TT-8,W,8);r('#8a6a45',0,TT-8,W,1);r('#2b2f3a',4,TT-12,6,4);r('#d0d4d8',W-12,TT-13,1,5)})}}
  if(ch=='y'){
    if(l.includes('file')||l.includes('archive')){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{for(let x=0;x<W;x+=16){r('#8d959e',x+1,0,14,TT);r('#a9b0b8',x+1,0,14,2);r('#6b737c',x+13,0,2,TT);
      for(let y=4;y<TT-4;y+=10){r('#6b737c',x+1,y+8,14,1);r('#d0d4d8',x+5,y+3,6,1);r('#f4f4f0',x+6,y+5,4,2)}}})}}
    if(l.includes('mailbox')){const oy=10,TT=H+oy-4;return{oy,c:mk(W,TT,r=>{r('#8d959e',0,0,W,TT);r('#a9b0b8',0,0,W,1);
      for(let y=2;y<TT-6;y+=7)for(let x=2;x<W-6;x+=8){r('#a9b0b8',x,y,7,6);r('#3a3d44',x+1,y+1,5,1);r('#e8c33a',x+5,y+4,1,1)}})}}
    const oy=12,TT=H+oy-2,kind=l.includes('bottle')?'b':l.includes('shelves')?'c':'k';return{oy,c:mk(W,TT,r=>{r('#5a3d2a',0,0,W,TT);r('#4a3222',1,1,W-2,TT-2);
      [[1,8],[10,17],[19,TT-3]].forEach(([a,b],ri)=>{for(let x=2;x<W-2;){const k2=hash(x,ri,v*9+3);
          if(kind=='b'){const col=['#2e7d4a','#8a3a1e','#c9a040','#2e5f8f','#e8e8e8'][k2*5|0],hh=b-a;r(col,x,a+3,2,hh-3);r(col,x,a+1,1,2);r('rgba(255,255,255,.5)',x,a+4,1,2);x+=3}
          else if(kind=='c'){const col=['#c0392b','#2e86c1','#e0a100','#3d7a5a'][k2*4|0];r(col,x,b-5,3,5);r('#f2f2f2',x,b-4,3,1);x+=4}
          else if(k2>.85){r('#5e8f48',x,b-6,3,3);r('#a8693a',x,b-3,3,3);x+=4}
          else{const col=['#a33b2f','#2e6f9a','#3d7a5a','#c9a040','#7d3c98'][k2*5|0],hh=4+(k2*3|0);r(col,x,b-hh,2,hh);r(shade(col,.3),x,b-hh,2,1);x+=k2>.6?3:2}}
        r('#8a6a45',0,b,W,2);r('#a8855a',0,b,W,1)})})}}
  if(ch=='c'){
    if(l.includes('bar')){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#4a2e1e',0,0,W,7);r('#6e4a32',0,0,W,1);r('#5a3a26',0,7,W,TT-7);
      for(let x=0;x<W;x+=16){r('#6e4a32',x+2,9,12,TT-12);r('#4a2e1e',x+3,10,10,TT-14)}r('#c9a040',0,TT-4,W,1);
      for(let x=6;x<W-4;x+=11){r('#cfe8f0',x,1,2,4);r('#ffffff',x,1,1,1)}for(let x=20;x<W-20;x+=40)r('#c9a040',x,0,4,3)})}}
    if(l.includes('packing')){const oy=4,TT=H+oy-2;return{oy,c:mk(W,TT,r=>{r('#b9c0c7',0,4,W,6);r('#dfe4e8',0,4,W,1);r('#7d858e',0,10,W,2);r('#5a5f68',1,12,2,TT-12);r('#5a5f68',W-3,12,2,TT-12);
      r('#c9a36a',6,0,12,7);r('#a8834a',6,3,12,1);r('#c9a36a',W-22,1,10,6);r('#e8e8e8',W-36,5,8,3)})}}
    if(!f.fishCounter){const oy=6,TT=H+oy,cas=l.includes('cashier'),top=cas?'#c9a040':'#a87a4c',fr=cas?'#5a1a2a':'#7a5432';return{oy,c:mk(W,TT,r=>{
      r(top,0,4,W,5);r(shade(top,.2),0,4,W,1);r(fr,0,9,W,TT-9);for(let x=0;x<W;x+=16)r(shade(fr,.15),x+2,11,12,TT-14);
      r('#3a3d44',W-15,0,11,8);r('#7fd0a0',W-13,1,7,3);r('#555a62',W-14,5,9,2);if(l.includes('checkout')){r('#2b2f3a',2,6,W-20,2);r('#f2f2f2',6,3,4,3);r('#c0392b',12,4,3,2)}})}}
    const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#4a5058',0,6,W,TT-6);r('#e8eef2',0,6,W,3);r('#a9d4e8',1,9,W-2,TT-12);r('#e8f6fc',1,TT-6,W-2,3);
      for(let x=4;x<W-20;x+=8){r('#9fb3c4',x,TT-9,5,2);r('#d8e4ee',x,TT-8,5,1);r('#7d93a6',x+5,TT-9,2,2)}r('rgba(255,255,255,.5)',3,10,1,4);r('rgba(255,255,255,.5)',4,10,1,2);
      r('#3a3d44',W-15,0,11,8);r('#7fd0a0',W-13,1,7,3);r('#555a62',W-14,5,9,2)})}}
  if(ch=='x'&&l.includes('tomb')){const oy=6,TT=H+oy,king=l.includes('king');return{oy,c:mk(W,TT,r=>{
    // a stone sarcophagus seen from above: a carved lid with a cross (or, for the late king, a purple pall and gold crown)
    r('#6e6a62',0,4,W,TT-4);r('#5a564f',0,TT-5,W,5);for(let x=3;x<W-3;x+=6)r('#4a463f',x,TT-4,3,3);
    r('#9a948a',1,0,W-2,TT-7);r('#b1aca2',1,0,W-2,2);r('#7a756c',1,TT-9,W-2,2);
    if(king){r('#5e2a75',3,3,W-6,TT-13);r('#7d3c98',3,3,W-6,2);r('#c9a040',3,TT-11,W-6,1);
      const cx=W>>1;r('#c9a040',cx-5,8,10,4);r('#ffd23a',cx-5,6,2,2);r('#ffd23a',cx-1,5,2,3);r('#ffd23a',cx+3,6,2,2);r('#c0392b',cx-1,9,2,2)}
    else{const cx=W>>1;r('#7a756c',cx-1,4,2,TT-15);r('#7a756c',cx-4,8,8,2)}})}}
  if(ch=='x'&&/barrel|gold|chest/.test(l)){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    if(l.includes('barrel'))for(let x=0;x+15<=W;x+=16)for(let y=0;y+15<=TT-2;y+=14){
      // a wine barrel lying on its side on a rack, its round end facing out
      r('#4a3222',x+1,y+12,14,3);for(let yy=0;yy<12;yy++)for(let xx=0;xx<14;xx++){const d=Math.hypot(xx-6.5,yy-5.5);if(d<6.3)r(d>5.2?'#3a3a44':d>4.4?'#7a4a2a':(xx+yy)%4==0?'#6b4a2e':'#8a5a36',x+1+xx,y+yy)}
      r('#5a2a20',x+7,y+5,2,2);r('#c9a040',x+4,y+2,1,1)}
    // gold bars stacked in a pyramid, three, two, then one
    else if(l.includes('gold'))for(let row=0;row<3;row++)for(let k=0;k<3-row;k++){const x=((W-(3-row)*13)>>1)+k*13,y=TT-7-row*5;r('#a8862a',x,y,12,6);r('#ffd23a',x+1,y,10,2);r('#fff2a0',x+2,y,3,1)}
    // a treasure chest per tile: an iron-bound box with its lid ajar on a glint of gold
    else for(let x=0;x+15<=W;x+=16)for(let y=TT-14;y>=0;y-=16){r('#5a3a22',x+1,y+4,14,10);r('#7a5232',x+1,y+4,14,1);r('#3a3a44',x+1,y+8,14,1);r('#3a3a44',x+3,y+4,1,10);r('#3a3a44',x+12,y+4,1,10);
      r('#ffd23a',x+6,y+7,4,3);r('#c9a040',x+7,y+8,2,2);r('#8a5a36',x+1,y,14,4);r('#a87a4c',x+1,y,14,1);r('#ffd23a',x+3,y+3,10,1);r('#e04a3a',x+11,y+3,1,1)}})}}
  if(ch=='x'){const oy=4,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    if(l.includes('net')){for(let y=0;y<TT;y++)for(let x=0;x<W;x++){const q=((x-W/2)/(W/2))**2+((y-TT*.6)/(TT*.55))**2;if(q<1)r((x+y)%3?(q<.5?'#3d6b5a':'#2f5a48'):'#5e8f78',x,y)}
      r('#e8792a',W*.3|0,H*.5|0,3,3);r('#e8792a',W*.7|0,H*.6|0,3,3);return}
    if(/ammo|bait|junk/.test(l)){for(let x=0;x<W;x+=16)for(let y=0;y<H;y+=16){const Y=y+oy;
        if(l.includes('ammo')){r('#4a5a3a',x+1,Y,14,12);r('#5e7048',x+1,Y,14,2);r('#3a4a2a',x+1,Y+6,14,1);r('#e0c060',x+4,Y+3,8,2)}
        else if(l.includes('bait')){r('#2e6f9a',x+2,Y,12,12);r('#3d86b8',x+2,Y,12,2);r('#6b4a2e',x+4,Y+1,8,2);r('#c97a7a',x+5,Y+1,2,1);r('#c97a7a',x+9,Y+2,2,1)}
        else{r('#6b737c',x+1,Y+2,8,10);r('#8d959e',x+1,Y+2,8,2);r('#7a5432',x+8,Y+5,7,7);r('#5a3d2a',x+8,Y+8,7,1);r('#4a5a3a',x+3,Y-2,5,4)}}return}
    if(l.includes('box')){[[1,10,14,TT-10],[16,12,14,TT-12],[31,8,15,TT-8],[8,1,14,10]].forEach(([x,y,ww,hh])=>{if(x+ww>W)return;r('#c9a36a',x,y,ww,hh);r('#e0bc82',x,y,ww,2);r('#a8834a',x+(ww>>1),y,1,hh);r('#d8c8a0',x,y+3,ww,1)});return}
    for(let x=0;x<W;x+=16)for(let y=0;y<H;y+=16){const Y=y+oy;r('#a8794c',x+1,Y,14,14);r('#8a6038',x+1,Y+6,14,1);r('#6e4a2a',x+14,Y,1,14);
      if(l.includes('ice'))for(let k=0;k<5;k++)r(k%2?'#e8f6fc':'#c8e6f4',x+2+k*2,Y-3+(k%2),3,4);
      else{const sm=l.includes('smoked');for(let k=0;k<3;k++){const fx=x+2+k*4,fy=Y-3+(k%2)*2;r(sm?'#b0763a':'#9fb3c4',fx,fy,5,2);r(sm?'#d8a058':'#d8e4ee',fx,fy+1,5,1);r(sm?'#8a5a2a':'#7d93a6',fx+5,fy,1,2)}}}})}}
  if(ch=='g'){const oy=4,TT=H+oy,bw=W-30;return{oy,an:{t:'belt',x:0,y:oy+4,w:bw,h:H-8},c:mk(W,TT,r=>{r('#5a5f68',2,TT-4,2,4);r('#5a5f68',bw-4,TT-4,2,4);r('#9aa3ad',0,oy,bw,4);r('#c3cad1',0,oy,bw,1);
    r('#2b2f3a',0,oy+4,bw,H-8);r('#9aa3ad',0,oy+H-6,bw,3);r('#5b8fb9',bw,0,30,TT);r('#7fb0d0',bw,0,30,2);r('#3d6b8f',W-4,0,4,TT);r('#2b2f3a',bw+6,6,14,8);r('#7fd0a0',bw+8,8,3,2);r('#e8321e',bw+13,8,3,2);r('#e0a100',bw+2,TT-8,26,2)})}}
  if(ch=='i'){const oy=18,bw=W>16?W-8:12,bx=(W-bw)>>1;return{oy,an:{t:'stove',x:bx+2,y:oy+4,w:bw-4},c:mk(W,H+oy,r=>{r('#3a3d44',bx+(bw>>1)-2,0,4,oy+2);r('#555a62',bx+(bw>>1)-2,0,1,oy+2);
    r('#2b2f3a',bx,oy+1,bw,12);r('#4a4f58',bx-1,oy,bw+2,3);r('#1a1c22',bx+2,oy+4,bw-4,6);r('#2b2f3a',bx+1,oy+13,2,2);r('#2b2f3a',bx+bw-3,oy+13,2,2)})}}
  if(ch=='t'&&l.includes('altar')){const oy=12,TT=H+oy;return{oy,an:[4,W-6].map(x=>({t:'candle',x:x+1,y:-1})),c:mk(W,TT,r=>{
    // an altar under a white cloth with a purple and gold runner, a cross and two tall candles
    r('#d8d2c0',0,8,W,TT-8);r('#b8b2a0',0,TT-3,W,3);r('#f4f1e8',1,6,W-2,TT-11);r('#ffffff',1,6,W-2,1);
    const cx=W>>1;r('#5e2a75',cx-5,6,10,TT-9);r('#c9a040',cx-5,TT-6,10,1);r('#c9a040',cx-1,TT-12,2,4);r('#c9a040',cx-2,TT-11,4,1);
    r('#c9a040',cx-1,0,2,7);r('#c9a040',cx-3,2,6,2);
    for(const x of[4,W-6]){r('#f2f2f2',x,2,3,6);r('#d8d2c0',x+2,2,1,6);r('#c9a040',x-1,8,5,2)}})}}
  if(ch=='t'){const oy=14,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#c9a040',4,0,W-8,TT-6);r('#e8c860',4,0,2,TT-6);r('#a8323a',7,3,W-14,TT-13);r('#c94a50',7,3,3,TT-13);
    r('#ffd23a',(W>>1)-3,0,6,2);r('#ffd23a',(W>>1)-1,-1+1,2,1);r('#a8323a',3,TT-11,W-6,5);r('#c94a50',3,TT-11,W-6,1);r('#c9a040',1,TT-13,4,9);r('#c9a040',W-5,TT-13,4,9);
    r('#8a6a45',0,TT-4,W,4);r('#a8855a',0,TT-4,W,1)})}}
  if(ch=='n'){const oy=8,col=['#7d3c98','#2e6f9a','#c0392b'][v*3|0];return{oy,c:mk(W,H+oy,r=>{r('#3a3d44',4,H+oy-2,8,2);r('#5a5f68',7,13,2,H+oy-15);
    r(col,4,6,8,9);r(shade(col,.2),4,6,2,9);r(col,3,7,1,5);r(col,12,7,1,5);r('#e8dcc0',6,1,4,5);r('#d8ccb0',9,1,1,5);r('#c9a040',7,8,1,1);r('#c9a040',7,11,1,1)})}}
  if(ch=='z'){const dn=l.includes('down');return{oy:0,c:mk(W,H,r=>{for(let k=0;k<5;k++){const y=k*3+1,c=shade('#8a6a45',dn?-k*.12:.15-k*.08);r(c,1,y,14,3);r(shade(c,-.3),1,y+2,14,1)}
    r('#5a3d2a',0,0,1,16);r('#5a3d2a',15,0,1,16)})}}
  return null}

// ---- Scene: everything that never changes is baked into one canvas per map; ents are the things drawn back to front.
const SC={};
function scene(m){if(SC[m])return SC[m];
  const M=MAPS[m],inside=L[m][3]=='interior',an=[],boats=[],ents=[],c=inside?interiorLayer(m):groundLayer(m),g=c.getContext('2d');
  if(c.an)an.push(...c.an);
  const put=(k,X,Y,pic,sh,tx,ty)=>ents.push({k,X,Y,c:pic,sh,sx:tx*16+2,sy:(ty+1)*16-3});
  FL[m].forEach(([x,y,w,h,ch,lb,st])=>{
    if(inside){const fu=furn(ch,w,h,lb,INT[m]||INT.default,hash(x,y,43));if(fu){put(y+h-1,x*16-1,y*16-fu.oy-1,fu.c);[].concat(fu.an||[]).forEach(a=>an.push({...a,x:x*16+a.x,y:y*16-fu.oy+a.y}))}return}
    if(st&&BLD[st]&&BLD[st].kind=='manhole'){g.drawImage(manholeArt,x*16,y*16);return}
    if(st&&BLD[st]&&BLD[st].kind=='tent'){const row=M[y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;g.drawImage(tentArt(w,h,dx),x*16-1,y*16-9);return}
    if(st&&BLD[st]&&BLD[st].kind=='mast'){put(y+h-1,x*16,y*16-MAST_UP,mastArt(w,h));an.push({t:'blink',x:x*16+w*8-1,y:y*16-MAST_UP-1});return}
    if(st&&BLD[st]&&BLD[st].kind=='derrick'){put(y+h-1,x*16,y*16-DER_UP,derrickArt(w,h));an.push({t:'blink',x:x*16+w*8-1,y:y*16-DER_UP+2});return}
    // the van and shelters stand taller than their tiles, so they are sorted with people (who can pass behind them) rather than painted on the ground
    if(st&&BLD[st]&&BLD[st].kind=='van'){g.fillStyle='rgba(30,50,80,.25)';g.fillRect(x*16+6,(y+h)*16-2,w*16-8,3);put(y+h-1,x*16-1,y*16-11,vanArt(w,h));an.push({t:'smoke',x:(x+w)*16-14,y:y*16-8});return}
    if(st&&BLD[st]&&BLD[st].kind=='fountain'){put(y+h-1,x*16-1,y*16-17,fountainArt(w,h));return}
    if(st&&BLD[st]&&BLD[st].kind=='shelter'){put(y+h-1,x*16-1,y*16-13,shelterArt(w,h,BLD[st].stop));return}
    if(ch=='v'){an.push({t:'lava',x:(x+w/2)*16,y:(y+h/2)*16,rx:w*8-6,ry:h*8-6});for(let k=0;k<3;k++)an.push({t:'smoke',x:x*16+w*4+k*w*4,y:y*16+8,big:1});return}
    if(st&&BLD[st]){const row=M[y+h-1],ds=[];for(let i=0;i<w;i++)if(row[x+i]=='d')ds.push(i);
      // the door nearest the middle is the main entrance; any others are side doors
      ds.sort((a,b)=>Math.abs(a-(w-1)/2)-Math.abs(b-(w-1)/2));let dx=ds.length?ds[0]:-1;
      // buildings you can't go into still get a (locked) front door, unless their look already has a big door
      if(dx<0&&!['church','hut','whs','garage'].includes(BLD[st].deco))dx=w>>1;
      g.fillStyle='rgba(60,80,115,.22)';g.fillRect(x*16+4,(y+h)*16,w*16+1,2);
      const b=bld2(w,h,BLD[st],dx,ds.slice(1));g.drawImage(b.c,x*16,y*16);b.an.forEach(a=>an.push({...a,x:a.x+x*16,y:a.y+y*16}))}
    else if(ch=='b')boats.push({x,y,c:boatArt(w,h,hash(x,y,21)),ph:hash(x,y,22)*6})
    else if(ch=='k')g.drawImage(fishPile,x*16,y*16)});
  // cables from a radio mast: armoured cables along the ground to its transmitter hut (and, in their own colour, to any building
  // whose look names a cable colour), and wires slung from the mast's leg to the hut's roof
  const mf=!inside&&FL[m].find(f=>BLD[f[6]]?.kind=='mast'),hf=!inside&&FL[m].find(f=>BLD[f[6]]?.deco=='hut');
  // gcable: three cables lying side by side along the points pts, half buried in snow here and there
  const gcable=(pts,col,hi)=>{for(let k=0;k<3;k++)for(let s=1;s<pts.length;s++){const[a0,b0]=pts[s-1],[a1,b1]=pts[s],n=Math.max(Math.abs(a1-a0),Math.abs(b1-b0))|0,hz=Math.abs(a1-a0)>=Math.abs(b1-b0);
    for(let i=0;i<=n;i++){const u=i/Math.max(1,n),w=Math.sin((hz?a0+(a1-a0)*u:b0+(b1-b0)*u)/5+k)*1.2,x=Math.round(a0+(a1-a0)*u+k*3+(hz?0:w)),y=Math.round(b0+(b1-b0)*u+k*3+(hz?w:0));
      if(vnoise(x/4,y/4,65+k)>.74){g.fillStyle=SNOW;g.fillRect(x-1,y-1,3,3)}else{g.fillStyle=col;g.fillRect(x,y,hz?1:2,hz?2:1);g.fillStyle=hi;g.fillRect(x,y,1,1)}}}};
  if(mf){const[mx,my,mw,mh]=mf,pad=(my+mh)*16-8;
    FL[m].filter(f=>BLD[f[6]]?.cable).forEach(([bx,by,bw,bh,,,st])=>{const right=bx>mx,sx=mx*16+(right?mw*16-8:6),ex=right?bx*16+4:(bx+bw)*16-12,ey=(by+bh)*16-2;
      gcable([[sx,pad],[ex,pad],[ex,ey]],BLD[st].cable,shade(BLD[st].cable,.3))})}
  if(mf&&hf){const[mx,my,mw,mh]=mf,[hx,hy,hw,hh]=hf,left=hx<mx,MW=mw*16,MH=mh*16+MAST_UP,ox=mx*16,oy=my*16-MAST_UP;
    const B=left?[10,MH-12]:[MW-11,MH-12],Tp=left?[(MW>>1)-3,6]:[(MW>>1)+2,6],hut=left?(hx+hw)*16-4:hx*16+4,hwh=Math.max(2,Math.round(hh*.45))*16;
    const wc=cnv(M[0].length*16,M.length*16),wg=wc.getContext('2d'),wr=(col,x,y)=>{wg.fillStyle=col;wg.fillRect(x|0,y|0,1,1)};
    [.22,.36,.5,.64,.78].forEach((t,i)=>{const S=[ox+B[0]+(Tp[0]-B[0])*t,oy+B[1]+(Tp[1]-B[1])*t],E=[hut-(left?1:-1)*i*7,hy*16+(hh*16-hwh)-12+(i&1)*3],sag=8+i*4,n=Math.ceil(Math.abs(E[0]-S[0])/3)+1;
      let p=null;for(let k=0;k<=n;k++){const u=k/n,q=[S[0]+(E[0]-S[0])*u,S[1]+(E[1]-S[1])*u+sag*4*u*(1-u)];if(p)pline(wr,p[0],p[1],q[0],q[1],'#22252c');p=q}
      wr('#e8ecef',E[0],E[1]-1);wr('#e8ecef',S[0],S[1]-1)});
    ents.push({k:99,X:0,Y:0,c:wc});
    gcable([[ox+(left?8:MW-8),(my+mh)*16-5],[left?(hx+hw)*16:hx*16,(hy+hh)*16-8]],'#1a1c22','#3a3d44')}
  if(!inside)M.forEach((row,y)=>[...row].forEach((ch,x)=>{
    if(ch=='T'){const t=TREES[hash(x,y,31)*3|0];put(y,x*16+Math.round(hash(x,y,32)*2-1)-1,(y+1)*16-t.height+1,t,1,x,y)}
    if(ch=='R'){const t=ROCKS[hash(x,y,33)*3|0];put(y,x*16-1,(y+1)*16-t.height,t,1,x,y)}}));
  // tram lines: each row with a run of track gets overhead-wire poles along its far side and a wire for the tram's pantograph.
  // The tram stops level with the middle of the platform in front of (below) the track; a line that ends inside the map is a terminus.
  const trams=[];if(!inside)M.forEach((row,y)=>{const a=row.indexOf('l'),b=row.lastIndexOf('l');if(a<0||b-a<6)return;
    const pl=[...(M[y+1]||'')].map((c,i)=>c=='P'?i:-1).filter(i=>i>=0),mid=pl.length?(pl[0]+pl[pl.length-1]+1)*8:(a+b+1)*8;
    trams.push({y,a:a*16,b:(b+1)*16,stop:mid-48,from:a>0?'R':'L',through:a==0&&b==row.length-1,plat:pl.length?pl:null})});
  trams.forEach(({y:ty,a,b})=>{const wc=cnv(b,ty*16),wg=wc.getContext('2d');wg.fillStyle='#2b2f3a';wg.fillRect(a,ty*16-TRAM_UP,b-a,1);ents.push({k:99,X:0,Y:0,c:wc});
    for(let x=a/16+1;x<b/16;x+=5)if(!'#T'.includes(M[ty-1][x]))put(ty-1,x*16+5,ty*16-30,tramPole,0,x,ty-1)});
  const ferries=EX[m].filter(e=>e.s=='F').map(e=>({x:e.ax>e.x?e.x-1:e.x+1,y:e.y,ph:hash(e.x,e.y,23)*6}));
  PROPS.filter(p=>p[0]==m).forEach(([,x,y,k])=>{const t=propArt(k),pass=PROP_PASS.includes(k);put(pass?y-.5:y,x*16-1,(y+1)*16-t.height+1,t,!pass,x,y);
    if(k=='firepit')an.push({t:'fire',x:x*16+8,y:y*16+11});if(k=='vent')an.push({t:'smoke',x:x*16+7,y:y*16+8});if(k=='gen')an.push({t:'blink',x:x*16+13,y:y*16+7,c:'#7fd0a0'})});
  return SC[m]={c,an,boats,ferries,trams,ents,inside,top:inside?WU:0}}

// ---- Snowfall and vignette
let FLAKES=null;  // built on first use, because hash() lives in game.js which loads after this file
const flakes=()=>FLAKES??=Array.from({length:80},(_,i)=>({x:hash(i,1,77),y:hash(i,2,77),sp:.006+hash(i,3,77)*.01,big:hash(i,4,77)>.82,ph:hash(i,5,77)*6}));
let VIG=null;
function vignette(){if(VIG&&VIG.width==cv.width&&VIG.height==cv.height)return VIG;VIG=cnv(cv.width,cv.height);const g=VIG.getContext('2d'),w=cv.width,h=cv.height,
  gr=g.createRadialGradient(w/2,h/2,h*.45,w/2,h/2,w*.75);gr.addColorStop(0,'rgba(15,25,50,0)');gr.addColorStop(1,'rgba(15,25,50,.38)');g.fillStyle=gr;g.fillRect(0,0,w,h);return VIG}

// The tram at each stop: TRAMS[map] = {ph: 'arrive' | 'wait' | 'leave', t0: when that phase began}. No entry means no tram there.
// tramState(m, t) moves it on to its next phase as time passes and returns {ph, u} (u: 0..1 through the arrive/leave run), or null.
const TRAMS={},TRAM_MOVE=4000,TRAM_WAIT=15000;
function tramState(m,t){const s=TRAMS[m];if(!s)return null;let el=t-s.t0;
  if(s.ph=='arrive'&&el>=TRAM_MOVE){s.ph='wait';s.t0+=TRAM_MOVE;el-=TRAM_MOVE}
  if(s.ph=='wait'&&el>=TRAM_WAIT){s.ph='leave';s.t0+=TRAM_WAIT;el-=TRAM_WAIT}
  if(s.ph=='leave'&&el>=TRAM_MOVE){delete TRAMS[m];return null}
  return{ph:s.ph,u:Math.min(1,el/TRAM_MOVE)}}
// Every tram on map m at time t, as {y: its track row, x: its left edge in pixels}. At a tram stop the tram only comes when called
// (see tramState); elsewhere one runs straight through every 18 seconds. It runs in, waits at the platform, then carries on out
// the far side; at a terminus it goes back the way it came. game.js also uses this to stop the player walking through a tram,
// which blocks its own track row and the row behind it that its body rises over.
function tramsOn(m,t){if(L[m][3]=='interior')return[];const MW=MAPS[m][0].length*16;
  return scene(m).trams.map(({y,stop,from,through,plat})=>{const inX=from=='L'?-110:MW+10,outX=through?MW+10:inX;
    const st=plat?tramState(m,t):(p=>p<4000?{ph:'arrive',u:p/4000}:p<10000?{ph:'wait'}:p<14000?{ph:'leave',u:(p-10000)/4000}:null)(t%18000);
    return st&&{y,x:st.ph=='arrive'?inX+(stop-inX)*(1-(1-st.u)**2):st.ph=='wait'?stop:stop+(outX-stop)*st.u*st.u}}).filter(Boolean)}
// The ride between stops: the tram glides along its track past snowy pines and overhead-wire poles, with the scenery
// scrolling by (u: 0..1 through the ride, which eases in and out).
function drawRide(t,u){const vw=cv.width,vh=cv.height,px=(c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w,h)};
  const sp=u<.25?(u/.25)**2:u>.75?((1-u)/.25)**2:1,s=t*.22*Math.max(.15,sp),gy=vh-44;
  const sky=ctx.createLinearGradient(0,0,0,gy);sky.addColorStop(0,'#9cb8d0');sky.addColorStop(1,'#dfe9f1');ctx.fillStyle=sky;ctx.fillRect(0,0,vw,gy);
  for(let x=0;x<vw;x++){const X=x+s*.15,hh=18+Math.sin(X/37)*7+Math.sin(X/13)*3;px('#b9c8d6',x,gy-hh-14,1,hh+14)}
  for(let i=-1;i<vw/22+2;i++){const X=Math.floor(s*.5/22)+i,tr=TREES[hash(X,1,90)*3|0];ctx.drawImage(tr,X*22-s*.5+hash(X,2,90)*8,gy-tr.height+4)}
  px('#e8eff5',0,gy,vw,vh-gy);for(let x=-(s%8);x<vw;x+=8)px('#5a3e27',x,gy+10,3,8);px('#c9ced4',0,gy+11,vw,1);px('#c9ced4',0,gy+16,vw,1);
  const wy=gy-21;px('#2b2f3a',0,wy,vw,1);for(let x=-(s%90);x<vw;x+=90){ctx.drawImage(tramPole,x,wy-1)}
  for(let i=0;i<40;i++){const X=((hash(i,3,91)*vw-s*1.3)%vw+vw)%vw,Y=((hash(i,4,91)*vh+t*.03)%vh);px('rgba(255,255,255,.8)',X,Y,1,1)}
  ctx.drawImage(tramArt,(vw>>1)-49,gy-21+(Math.sin(t/90)>.6?1:0));ctx.drawImage(vignette(),0,0)}
// Where seagulls circle on each map (tile x, y).
const GULLS={harbour:[15,6],beach:[5,6],kalanharbour:[10,4],savilaharbour:[17,6],privharbour:[5,5],privbeach:[9,4],oilrig:[8,5],fishing:[20,10]};
// ---- Per-frame drawing. cx, cy: camera offset in pixels. frame: player walking frame (0 idle, 1, 2).
function drawWorld2(m,cx,cy,t,frame){
  const S=scene(m),M=MAPS[m],mh=M.length,mw=M[0].length,vw=cv.width,vh=cv.height,wf=WATER[(t/200|0)%8],px=(c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w,h)};
  if(!S.inside){const x0=Math.max(0,Math.floor(cx/16)),x1=Math.min(mw-1,Math.floor((cx+vw)/16)),y0=Math.max(0,Math.floor(cy/16)),y1=Math.min(mh-1,Math.floor((cy+vh)/16));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(CLS(M[y][x])=='w')ctx.drawImage(wf,(x*16)&63,(y*16)&63,16,16,x*16-cx,y*16-cy,16,16)}
  ctx.drawImage(S.c,-cx,-cy-S.top);
  // boats bob on the water, with a little foam at the waterline
  const bob=ph=>Math.round(Math.sin(t/650+ph));
  S.boats.forEach(b=>{const X=b.x*16-cx,Y=b.y*16-cy+bob(b.ph),W=b.c.width-2;
    for(let x=4;x<W-6;x+=2)if(hash(x,(t/250|0),b.x)>.4)px('rgba(230,245,252,.65)',X+x,Y+b.c.height-3,2,1);ctx.drawImage(b.c,X-1,Y-1)});
  S.ferries.forEach(f=>{ctx.drawImage(ferryArt,f.x*16-cx,f.y*16-cy+3+bob(f.ph))});
  // trees, rocks, props, furniture and people, back to front
  const Ls=[];
  S.ents.forEach(o=>{const X=o.X-cx,Y=o.Y-cy;if(X>vw||Y>vh||X+o.c.width<0||Y+o.c.height<0)return;
    Ls.push([o.k,0,()=>{if(o.sh)px('rgba(30,50,80,.22)',o.sx-cx,o.sy-cy,13,3);ctx.drawImage(o.c,X,Y)}])});
  tramsOn(m,t).forEach(({y:ty,x})=>{
    // the tram stands on its track and rises over the row behind it (the platform), so it is drawn after anyone standing there
    Ls.push([ty-1,1.5,()=>{const X=Math.round(x)-cx,Y=ty*16-TRAM_UP-cy;px('rgba(30,50,80,.25)',X+4,Y+35,90,3);ctx.drawImage(tramArt,X-1,Y-1)}])});
  NPCS.filter(n=>n.m==m).forEach((n,i)=>{const b=Math.sin(t/700+i*1.7)>.85?1:0;Ls.push([n.y,1,()=>person(n.x*16-cx,n.y*16-cy+b,n.dir,0,n.body,n.hair,null,n.hat)])});
  Ls.push([P.ry,1,()=>person(Math.round(P.rx*16-cx),Math.round(P.ry*16-cy),P.dir,frame,'#2a5db0','#4a2e1a','#e8c33a')]);
  Ls.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).forEach(e=>e[2]());
  // smoke, flags, signs, lights, fires and machines
  S.an.forEach(a=>{const X=a.x-cx,Y=a.y-cy;
    if(a.t=='smoke')for(let k=0;k<6;k++){const g=(t/2600+k/6)%1,s=(a.big?3:2)+Math.round(g*3);
      px(`rgba(236,241,246,${(.6*(1-g)).toFixed(2)})`,X+Math.sin(g*5+k)*2+g*10-s/2,Y-g*24-s/2,s,s)}
    if(a.t=='flag')for(let c=0;c<12;c++){const dy=Math.round(Math.sin(t/220-c*.7)*c/8),sh=Math.sin(t/220-c*.7)>.3,fc=a.col||(a.royal?'#7d3c98':'#c0392b');
      px(sh?shade(fc,-.2):fc,X+c,Y+dy,1,8);if(a.col)px('#f2f2f2',X+c,Y+dy+3,1,2);else if(c>=3&&c<=5)px('#ffd23a',X+c,Y+dy+(c==4?2:3),1,c==4?3:1)}
    if(a.t=='lava')for(let k=0;k<8;k++){
      // bubbles swell and pop at random spots inside the crater's oval
      const ph=t/1400+hash(k,1,a.x),n=ph|0,g=ph%1,an=hash(k,n,a.y)*6.283,rr=Math.sqrt(hash(k,n+7,a.y))*.7,bx=X+Math.cos(an)*a.rx*rr|0,by=Y+Math.sin(an)*a.ry*rr|0,s=g<.7?1+(g*3|0):3;
      if(g<.85)px(g<.6?'#ffd23a':'#fff2a0',bx,by,s,s);else px('#5a2a20',bx-1,by+1,4,1)}
    if(a.t=='screen'){const k=a.k;
      // monitor content: 0 a scrolling waveform, 1 lines of text being typed, 2 a radar sweep
      if(k==0)for(let x=0;x<a.w;x++)px('#5fe08a',X+x,Y+(a.h>>1)+Math.round(Math.sin(x*.9+t/150)*Math.min(2,a.h/3)),1,1);
      else if(k==1){const n=(t/400|0)%(a.h+2);for(let y=0;y<Math.min(n,a.h);y+=2)px('#7fd0a0',X+1,Y+y,1+(hash(y,t/2400|0,a.x)*(a.w-2)|0),1)}
      else{const an=t/600,cx=X+(a.w>>1),cy=Y+(a.h>>1);px('#1f5a3a',cx,Y,1,a.h);px('#1f5a3a',X,cy,a.w,1);
        for(let r=0;r<4;r++)px('#5fe08a',cx+Math.round(Math.cos(an)*r*a.w/8),cy+Math.round(Math.sin(an)*r*a.h/8),1,1);if(((t/600)|0)%3==0)px('#ff3b2f',cx+2,cy-1,1,1)}}
    if(a.t=='reel'){const an=t/180;for(const o of[0,2.09,4.19])px('#5a5f68',X+Math.round(Math.cos(an+o)*2),Y+Math.round(Math.sin(an+o)*2),1,1);px('#2b2f3a',X,Y,1,1)}
    if(a.t=='vu')for(let i=0;i<a.w;i+=2){const hh=1+(hash(i,t/110|0,a.x)*a.h|0);px(hh>=a.h?'#ff3b2f':hh>a.h/2?'#ffd23a':'#5fe08a',X+i,Y+a.h-hh,1,hh)}
    if(a.t=='candle'){const f=hash(a.x,t/120|0,8);px('rgba(255,200,90,.22)',X-2,Y-3,5,6);px(f>.3?'#ffd23a':'#ff8a3a',X,Y-1,1,2);if(f>.6)px('#fff2a0',X,Y-2,1,1)}
    if(a.t=='bulb')px(((t/250|0)+(a.x>>1))%3?'#ffe9a8':'#8a6a2a',X,Y,1,1);
    if(a.t=='neon'){const on=hash(t/90|0,3,7)<.96,col=on?(a.col||'#ff5fa8'):'#5a2a40';
      if(on){ctx.fillStyle=a.col?'rgba(255,210,58,.25)':'rgba(255,95,168,.3)';ctx.fillRect(X-2,Y-2,a.s.length*4+3,9)}ptext(px,a.s,X,Y,col)}
    if(a.t=='blink'){const on=((t+a.x*7)/700|0)%2;if(on){px('rgba(255,80,60,.3)',X-1,Y-1,4,4);px(a.c||'#ff3b2f',X,Y,2,2)}else px('#5a2020',X,Y,2,2)}
    if(a.t=='fire'){px('rgba(255,160,60,.16)',X-9,Y-10,18,14);for(let k=0;k<5;k++){const hh=2+(hash(k,t/90|0,3)*5|0);px(['#e8321e','#ff8a3a','#ffd23a','#ff8a3a','#e8321e'][k],X-5+k*2,Y-hh,2,hh)}}
    if(a.t=='stove')for(let k=0;k<a.w;k++){const hh=2+(hash(k,t/110|0,5)*4|0);px('#e8321e',X+k,Y+6-hh,1,hh);if(hh>3)px('#ffb01c',X+k,Y+7-hh,1,hh-3)}
    if(a.t=='belt'){const off=(t/45|0)%6;for(let x=off;x<a.w;x+=6)px('#3d4250',X+x,Y,1,a.h);
      for(let i=0;i<a.w/24;i++){const fx=X+((t/35+i*24)%(a.w-4)),fy=Y+3+(i%2)*4;px('#9fb3c4',fx,fy,5,2);px('#d8e4ee',fx,fy+1,5,1)}}});
  if(!S.inside){
    // seagulls circling over the harbours and beaches
    const gl=GULLS[m];if(gl)for(let i=0;i<2;i++){const an=t/2600+i*Math.PI,X=gl[0]*16-cx+Math.cos(an)*70,Y=gl[1]*16-cy+Math.sin(an)*30-26,up=(t/170+i*3|0)%2;
      px('rgba(20,40,60,.18)',X-2,Y+34,5,1);px('#f2f2f2',X-1,Y,3,2);px('#e8b33a',X+(Math.cos(an+Math.PI/2)>0?2:-2),Y,1,1);
      if(up){px('#f2f2f2',X-3,Y-1,2,1);px('#f2f2f2',X+2,Y-1,2,1);px('#5a5f68',X-4,Y-2,1,1);px('#5a5f68',X+4,Y-2,1,1)}
      else{px('#f2f2f2',X-4,Y,3,1);px('#f2f2f2',X+2,Y,3,1);px('#5a5f68',X-5,Y+1,1,1);px('#5a5f68',X+5,Y+1,1,1)}}
    // falling snow
    const md=(v,n)=>((v%n)+n)%n;
    flakes().forEach(f=>{const p=f.big?1.2:.6,X=md(f.x*vw+Math.sin(t/1300+f.ph)*6+t*.004-cx*p,vw),Y=md(f.y*vh+t*f.sp*(f.big?1.4:1)-cy*p,vh);
      px(f.big?'rgba(255,255,255,.7)':'rgba(255,255,255,.85)',X,Y,f.big?2:1,f.big?2:1)})}
  ctx.drawImage(vignette(),0,0)}
