// ---- Proof of concept 3: a modern, detailed Frostholm (?modern), in the style of current top-down pixel art: soft shading lit
// from the upper left, textured materials, three-quarter-view buildings with snowy flat roofs and rooftop clutter, recessed
// windows, shopfronts under awnings, buildings casting soft shadows on paving and snow, and detailed street furniture.
// Add &night for the night-time version (windows and signs lit). Shown only with ?modern; the rest of the game is unchanged.
const MODERN=typeof location!='undefined'&&/[?&]modern\b/.test(location.search),MOD=m=>MODERN&&m=='fishing';
const MEXT=14;  // how far a building's roof clutter (tanks, antennas, billboards, flags) may rise above its footprint

// ---- Ground: concrete paving slabs with joints, salt stains and a dusting of snow that drifts against the kerbs, soft snow
// elsewhere (with sparkle and the odd dry tuft), and soft shadows cast down and to the right by every building.
function modernGround(m){const M=MAPS[m],h=M.length,w=M[0].length,W=w*16,H=h*16,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data;
  const at=(x,y)=>M[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],paved=ch=>ch==','||ch=='E'||ch=='#'||ch=='d';
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const tx=X>>4,ty=Y>>4,lx=X&15,ly=Y&15,ch=at(tx,ty);let col;
    if(paved(ch)){const row=Y>>3,sx=X+(row&1?8:0),jx=sx%16,jy=Y%8,k=hash(sx>>4,row,501);
      col=['#a9b0b8','#a1a8b1','#b1b8bf','#9ca3ab'][k*4|0];if(jy==0||jx==0)col='#7b838c';else if(jy==1||jx==1)col=shade(col,.12);
      if(hash(X,Y,502)>.97)col=shade(col,-.08);if(vnoise(X/7,Y/7,503)>.72)col=mix(col,'#d8dde2',.5);  // salt stains
      // snow drifting onto the paving from any edge that isn't paved, thinning away from it
      let d=99;for(const[ox,oy,dd]of[[0,-1,ly],[0,1,15-ly],[-1,0,lx],[1,0,15-lx]])if(!paved(at(tx+ox,ty+oy)))d=Math.min(d,dd);
      const n=vnoise(X/4,Y/4,504);if(d<3||n>.8&&d<7)col=d<1?'#c9ced4':n>.5||d<2?'#eef3f8':'#dfe6ee';else if(n>.74)col=mix(col,'#eef3f8',.6)}
    else{const n=vnoise(X/16,Y/16,511)*.65+vnoise(X/5,Y/5,512)*.35;col=n>.62?'#f7fafc':n>.4?'#eaf0f6':'#dbe4ee';
      if(vnoise(X/9,Y/9,513)<.25)col=shade(col,-.04);if(hash(X,Y,514)>.992)col='#ffffff';else if(hash(X,Y,515)>.993)col='#b8c8dc'}
    const i=(Y*W+X)*4;p.set(rgb(col),i);p[i+3]=255}
  // dry grass poking through the snow
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){if(paved(at(tx,ty))||hash(tx,ty,520)<.7)continue;const x=tx*16+3+(hash(tx,ty,521)*10|0),y=ty*16+5+(hash(tx,ty,522)*8|0);
    for(const[a,b,cc]of[[0,0,'#8a8460'],[1,-1,'#a49c70'],[2,0,'#8a8460'],[1,-2,'#b8ae80'],[3,-1,'#a49c70']]){const i=((y+b)*W+x+a)*4;if(i>=0&&i<p.length){p.set(rgb(cc),i);p[i+3]=255}}}
  // building shadows, cast down and to the right: a soft band along each building's right side and a little under its front
  const dark=(X,Y,k)=>{if(X<0||Y<0||X>=W||Y>=H)return;const i=(Y*W+X)*4;for(let j=0;j<3;j++)p[i+j]=p[i+j]*(1-k)+[40,52,78][j]*k};
  FL[m].forEach(([x,y,bw,bh,ch,,st])=>{if(ch!='#'||!MBLD[st])return;const X1=(x+bw)*16,Y0=y*16+10,Y1=(y+bh)*16;
    for(let Y=Y0;Y<Y1+6;Y++)for(let k=0;k<12;k++){const fade=(1-k/12)*.32*Math.min(1,(Y-Y0)/14)*(Y>Y1?1-(Y-Y1)/6:1);dark(X1+k,Y,fade)}
    for(let X=x*16+2;X<X1;X++)for(let k=0;k<4;k++)dark(X,Y1+k,.22*(1-k/4))});
  g.putImageData(img,0,0);return c}

// ---- A modern city building in three-quarter view: a flat roof seen from above (parapet, membrane, snow, rooftop units, and
// tanks, antennas or a billboard rising above), a cornice, then the front: glass curtain wall, brick, concrete, tile or stone,
// floor by floor, with recessed windows on snowy sills, a drainpipe, and at street level either a shopfront under an awning or a
// canopied entrance. s: an MBLD look; dx: the door's column.
function modernArt(w,h,s,dx){const W=w*16,FH=h*16,H=FH+MEXT,an=[],lights=[],X=dx*16+8;
  const tall=h>=6,top=MEXT,fy=top+Math.round(FH*(tall?.26:.38)),OUTL='#20232c',trim=s.trim||'#c9ced4',wall=s.wall||'#9aa3ad',shopTop=s.shop?H-24:H;
  const c=mk(W,H,r=>{
    // ---- roof: parapet, membrane with seams, snow lying on it (deepest against the far parapet)
    r(shade(trim,-.15),0,top,W,fy-top);r(shade(trim,.25),0,top,W,1);
    for(let y=top+3;y<fy-2;y++)for(let x=3;x<W-3;x++){const n=vnoise(x/6,y/5,W+h*7),edge=Math.min(y-top,x)/10;let col=(x%9==0||y%7==0)?'#6b737c':'#7d858e';
      if(n>.42-(1-Math.min(1,edge))*.3)col=n>.6?'#f4f8fb':'#e2eaf2';else if(n>.36)col='#c9d4de';r(col,x,y)}
    r('rgba(20,28,48,.35)',3,top+3,W-6,2);r('rgba(20,28,48,.2)',3,top+3,2,fy-top-5);
    // rooftop clutter (not where a billboard stands): an air-con unit, vent stacks, and on brick buildings a water tank
    const unit=(ux,uy)=>{r(OUTL,ux-1,uy-1,13,10);r('#b4bcc4',ux,uy,11,8);r('#8a9299',ux,uy+6,11,2);r('#d8dee4',ux,uy,11,1);for(let k=0;k<4;k++)r('#5f666e',ux+2+k*2,uy+2,1,4);r(SNOW,ux,uy-1,11,1);r('rgba(20,28,48,.3)',ux+11,uy+1,3,8)};
    if(!s.bill){unit(4+(hash(w,h,601)*(W-22)|0),top+4);if(W>70)unit(W-20,top+(fy-top>20?11:4));
      for(let k=0;k<2;k++){const vx=6+(hash(w,k,602)*(W-14)|0),vy=fy-9;r(OUTL,vx-1,vy-1,5,6);r('#9aa3ad',vx,vy,3,4);r('#5f666e',vx,vy,3,1)}}
    if(s.mat=='brick'&&!s.bill&&w>=4){const tx=W-16,ty=1;r(OUTL,tx-1,ty-1,12,14);r('#8a5a3a',tx,ty,10,10);for(let y=ty+2;y<ty+10;y+=3)r('#6b4a2e',tx,y,10,1);r('#a87a4c',tx,ty,2,10);r(SNOW,tx,ty-1,10,2);
      for(const lx of[tx+1,tx+8])r(OUTL,lx,ty+10,1,top-ty-6)}
    if(s.antenna){const ax=Math.round(W*.7);r('#5f666e',ax,0,1,top+6);r('#5f666e',ax-3,4,7,1);r('#5f666e',ax-2,8,5,1);an.push({t:'blink',x:ax,y:-1,c:'#ff4040'})}
    if(s.flag){const fx=8;r('#d5d9de',fx,0,1,top+5);r('#9aa0a8',fx+1,0,1,top+5);an.push({t:'flag',x:fx+2,y:1,col:s.flag})}
    if(s.bill){const[t,bg,fg]=s.bill,bw=Math.min(W-10,t.length*4+12),bx=(W-bw)>>1,by=1;for(const lx of[bx+6,bx+bw-8]){r(OUTL,lx-1,by+12,4,top-by-6);r('#5a5f68',lx,by+12,2,top-by-6)}
      r(OUTL,bx-1,by-1,bw+2,14);r(bg,bx,by,bw,12);r(shade(bg,.25),bx,by,bw,1);r(shade(bg,-.3),bx,by+11,bw,1);r(SNOW,bx-1,by-1,bw+2,1);ptext(r,t,bx+((bw-t.length*4+1)>>1),by+4,fg);
      an.push({t:'blink',x:bx+1,y:by-3,c:'#ffe08a'},{t:'blink',x:bx+bw-3,y:by-3,c:'#ffe08a'})}
    // ---- cornice: a projecting ledge with snow on top and its shadow on the wall below
    r(OUTL,0,fy-1,W,1);r(SNOW,0,fy,W,2);r(trim,0,fy+2,W,2);r(shade(trim,-.3),0,fy+4,W,1);
    // ---- the front, by material
    const wt=fy+5,wb=H-2;
    for(let y=wt;y<wb;y++)for(let x=0;x<W;x++){let col;
      if(s.mat=='glass'){const fl=(y-wt)%14,cx=x%8;const u=(y-wt)/(wb-wt),refl=((x+y*.7)%46)<9;col=mix(shade(s.glass,.45),s.glass,u);if(refl)col=shade(col,.22);
        if(cx==0||fl<2)col=fl<2?shade(trim,-.1):OUTL;else if(cx==1)col=shade(col,.1)}
      else if(s.mat=='brick'){const row=((y-wt)/3)|0,sx=x+(row%2)*3,lx=sx%6,ly=(y-wt)%3,k=hash((sx/6)|0,row,610+W);col=lx==0||ly==0?shade(wall,.35):[wall,shade(wall,-.08),shade(wall,.06),shade(wall,-.14)][k*4|0]}
      else if(s.mat=='stone'){const row=((y-wt)/6)|0,sx=x+(row%2)*6,lx=sx%12,ly=(y-wt)%6,k=hash((sx/12)|0,row,611+W);col=lx==0||ly==0?shade(wall,-.18):[wall,shade(wall,.05),shade(wall,-.05)][k*3|0];if((lx==1||ly==1)&&lx&&ly)col=shade(col,.1)}
      else if(s.mat=='tile'){col=((x>>2)+((y-wt)>>2))&1?wall:shade(wall,-.06);if(x%4==0||(y-wt)%4==0)col=shade(wall,-.14)}
      else{col=(x%16==0||(y-wt)%12==0)?shade(wall,-.16):hash(x>>2,y>>2,612)>.9?shade(wall,-.05):wall;if(vnoise(x/3,y/9,613)>.78)col=shade(col,-.07)}  // concrete, with streaks
      r(col,x,y)}
    // floor bands, a drainpipe down one side, and grime gathering at the foot of the wall
    if(s.mat!='glass')for(let y=wt+16;y<shopTop-6;y+=16){r(shade(trim,.15),0,y,W,1);r(trim,0,y+1,W,1);r('rgba(20,28,48,.25)',0,y+2,W,1)}
    const px=W-5;r(OUTL,px-1,wt,4,wb-wt);r('#8a9299',px,wt,2,wb-wt);r('#b4bcc4',px,wt,1,wb-wt);for(let y=wt+6;y<wb;y+=12)r('#5f666e',px-1,y,4,1);
    for(let y=wb-6;y<wb;y++)r(`rgba(30,30,40,${((y-wb+6)/6*.25).toFixed(2)})`,0,y,W,1);
    // ---- windows: recessed, in a frame, sky reflected in the glass, a snowy sill; some lit (at night, most are)
    if(s.mat!='glass')for(let y=wt+4;y+11<shopTop-4;y+=16)for(let i=0;i<w;i++){const x0=i*16+4,lit=NIGHT?hash(i,y,W+9)>.25:hash(i,y,W+9)>.85;
      if(!s.shop&&y+11>H-24&&Math.abs(x0+4-X)<12)continue;
      r(OUTL,x0-1,y-1,10,12);r(shade(trim,.1),x0,y,8,10);const gl=lit?'#ffd98a':'#6a90b8';
      for(let yy=1;yy<9;yy++)for(let xx=1;xx<7;xx++){let cc=lit?gl:mix('#a8c8e4',gl,yy/9);if(!lit&&xx+yy<5)cc=shade(cc,.25);r(cc,x0+xx,y+yy)}
      r('rgba(20,28,48,.45)',x0+1,y+1,6,1);r('rgba(20,28,48,.3)',x0+1,y+2,1,7);r(shade(trim,-.2),x0+4,y+1,1,8);
      if(lit&&hash(i,y,W+10)>.5)r('rgba(120,60,40,.45)',x0+1,y+1,2,8);
      r(shade(trim,.2),x0-1,y+10,10,2);r(SNOW,x0-1,y+10,10,1);if(lit)lights.push({x:x0+4,y:y+5,r:18,col:'255,200,120',f:1})}
    // balconies: a slab and railing under every other window
    if(s.balc)for(let y=wt+15;y<shopTop-8;y+=32)for(let i=0;i<w;i+=2){const x0=i*16+2;r(OUTL,x0-1,y-1,14,5);r(shade(trim,-.1),x0,y,12,2);r(SNOW,x0,y-1,12,1);for(let k=0;k<12;k+=3)r('#2b2f3a',x0+k,y-6,1,6);r('#2b2f3a',x0,y-6,12,1)}
    // ---- street level
    if(s.shop){const sy=H-24;
      // shop windows, full width but for slim piers, with goods and a reflection, and the door
      for(let x=0;x<W;x++){const pier=x%16<2;for(let y=sy+6;y<wb;y++){let cc=pier?shade(trim,-.15):(y<sy+8?'#2b2f3a':mix('#b8d4ea','#4a6a8a',(y-sy-6)/16));
        if(!pier&&((x+y)%23<3))cc=shade(cc,.2);r(cc,x,y)}}
      for(let x=4;x<W-4;x+=6){if(Math.abs(x-X)<9)continue;const col=['#e86a5a','#5aa0e8','#f4d03f','#8ad06a','#c08ad8'][hash(x,w,620)*5|0];r(col,x,wb-7,4,5);r(shade(col,-.3),x,wb-3,4,1)}
      r(OUTL,X-6,wb-16,12,16);r('#9aa3ad',X-5,wb-15,10,15);r('#b8d4ea',X-4,wb-14,8,13);r('#e8f2fa',X-4,wb-14,2,13);r('#3a3d44',X-4,wb-8,8,1);
      // awning: stripes, folds shaded, scalloped edge, its shadow on the glass
      if(s.awn){for(let x=0;x<W;x++){const cc=(x>>2)&1?s.awn:'#f4f1e8';for(let y=sy;y<sy+6;y++)r(y<sy+2?shade(cc,.12):y>sy+4?shade(cc,-.15):cc,x,y);if((x&3)==1||(x&3)==2)r(shade(cc,-.15),x,sy+6,1,1)}
        r(SNOW,0,sy-1,W,1);r('rgba(20,28,48,.3)',0,sy+7,W,2)}
      else{r(shade(trim,-.2),0,sy,W,6);r(shade(trim,.2),0,sy,W,1)}}
    else{// a canopied entrance: glass doors, steps, and a canopy (gold for the hotel) with lamps
      r(OUTL,X-9,wb-18,18,18);r('#9aa3ad',X-8,wb-17,16,17);for(const ex of[X-7,X+1]){r('#b8d4ea',ex,wb-16,6,15);r('#e8f2fa',ex,wb-16,2,15)}r('#3a3d44',X-1,wb-9,2,1);
      r('#c9ced4',X-11,wb-1,22,2);r('#e0e4e8',X-11,wb-1,22,1);
      const cc=s.canopy||shade(trim,-.1);r(OUTL,X-13,wb-23,26,5);r(cc,X-12,wb-22,24,3);r(shade(cc,.3),X-12,wb-22,24,1);r(SNOW,X-13,wb-24,26,1);r('rgba(20,28,48,.3)',X-12,wb-19,24,2);
      for(const lx of[X-12,X+11]){r('#2b2f3a',lx,wb-19,1,2);r(NIGHT?'#ffd27a':'#f0c060',lx-1,wb-17,3,3);if(NIGHT)lights.push({x:lx,y:wb-16,r:22,col:'255,200,120',f:1})}}
    // columns across the front of a stately building
    if(s.cols)for(let x=6;x<W-4;x+=14){if(Math.abs(x+2-X)<12)continue;r(OUTL,x-1,wt+2,7,wb-wt-2);r('#efeae0',x,wt+2,5,wb-wt-2);r('#d8d2c4',x+3,wt+2,2,wb-wt-2);r('#c9c2b0',x-1,wt+2,7,2);r('#c9c2b0',x-1,wb-2,7,2)}
    // a marquee over the door, ringed with chasing bulbs
    if(s.marquee){const t=s.marquee,mw=t.length*4+9,mx=Math.max(1,Math.min(W-mw-1,X-(mw>>1))),my=H-(s.shop?36:38);r(OUTL,mx-1,my-1,mw+2,14);r('#f4f1e8',mx,my,mw,12);r('#c9a040',mx,my,mw,1);r('#c9a040',mx,my+11,mw,1);ptext(r,t,mx+5,my+4,'#2b2f3a');
      for(let x=mx+1;x<mx+mw-1;x+=3){an.push({t:'bulb',x,y:my-1});an.push({t:'bulb',x,y:my+12})}lights.push({x:mx+mw/2,y:my+6,r:40,col:'255,220,140',f:1})}
    // the sign: a lit box sign with bevelled edges, high on the front (over the awning on a shop)
    if(s.sign){const t=s.sign,tw=t.length*4+7,sx=Math.max(1,(W-tw)>>1),sy=s.shop?H-36:fy+8;if(!(s.marquee&&!s.shop)){
      r(OUTL,sx-1,sy-1,tw+2,12);r('#1a1c24',sx,sy,tw,10);r('#3a3d48',sx,sy,tw,1);ptext(r,t,sx+4,sy+3,s.signc||'#ffffff');r('rgba(20,28,48,.35)',sx+1,sy+11,tw,2);
      lights.push({x:sx+tw/2,y:sy+5,r:Math.max(26,tw*.7),col:rgbs(s.signc||'#ffffff'),f:1})}}
    // the edges of the building, so neighbours read as separate
    r(OUTL,0,top,1,H-top);r(OUTL,W-1,top,1,H-top);r(shade(wall,.18),1,wt,1,wb-wt);
  });
  return{c,an,lights}}

// Frostholm's buildings in the modern proof of concept
const MBLD={
  petrotower:{mat:'glass',glass:'#3d6a8f',trim:'#2b2f3a',sign:'PETRO',signc:'#3bd0ff',antenna:1},
  hotel:{mat:'brick',wall:'#7a3442',trim:'#d8c49a',canopy:'#c9a040',sign:'HOTEL AURORA',signc:'#ffd23a',balc:1},
  skyapt:{mat:'glass',glass:'#4a6a8a',trim:'#7d858e',sign:'SKYLINE',signc:'#ff5fa8',balc:1},
  nordbank:{mat:'stone',wall:'#d8d4cc',trim:'#9a9284',cols:1,sign:'NORDBANK',signc:'#7fb8e8',flag:'#2e5f8f'},
  casino:{mat:'concrete',wall:'#3a2a4a',trim:'#c9a040',marquee:'CASINO',canopy:'#a8323a'},
  repub:{mat:'stone',wall:'#ece6da',trim:'#c9c2b0',sign:'REPUBLICAN',signc:'#ff5a6a',flag:'#a3123a'},
  hifi:{mat:'concrete',wall:'#5a5f68',trim:'#c9ced4',shop:1,awn:'#e0a100',sign:'ELECTRONICS',signc:'#3bd0ff'},
  arcade:{mat:'concrete',wall:'#2a2c3e',trim:'#8a8fa8',shop:1,awn:'#7f5fd0',sign:'ARCADE',signc:'#ff3bd0'},
  jazz:{mat:'brick',wall:'#4a3040',trim:'#c9a040',shop:1,awn:'#5a1a2a',marquee:'LIVE JAZZ',sign:'MIDNIGHT NOTE',signc:'#7fb0ff'},
  burger:{mat:'tile',wall:'#f4e6c0',trim:'#c0392b',shop:1,awn:'#c0392b',bill:['POLAR BURGER','#c0392b','#ffd23a']},
  nordmart:{mat:'concrete',wall:'#e8e2d4',trim:'#9aa3ad',shop:1,awn:'#2e86c1',sign:'NORDMART',signc:'#5ab8ff'},
  fhouse:{mat:'brick',wall:'#8a5a4a',trim:'#e8e2d4'}};

// ---- Snowy pines: tiers of needles shaded from the upper left, with snow lying thick on each tier and a little at the foot.
function snowPine(v){const W=22,H=38;return mk(W,H,r=>{r('#4a3222',10,30,3,8);r('#6b4a30',10,30,1,8);r('#e8eff5',5,36,13,2);
  const tiers=v==2?[[2,14,6],[9,22,8],[16,31,10]]:[[0,12,5],[7,20,7],[13,27,9],[19,32,10]];
  for(let t=tiers.length-1;t>=0;t--){const[y0,y1,hwMax]=tiers[t];for(let y=y0;y<=y1;y++){const hw=Math.round(1+(hwMax-1)*(y-y0)/(y1-y0));
    for(let x=11-hw;x<11+hw;x++){const f=(x-(11-hw))/(hw*2),L=1-f-(y-y0)/(y1-y0)*.3;let col=L>.7?'#3e8a6e':L>.45?'#2b6a56':L>.25?'#1f5444':'#163d33';
      if(y-y0<2+((x*7+t)%3==0?1:0)||(y==y1&&hash(x,t,v)>.4))col=L>.4?'#f4f8fb':'#cfdce8';r(col,x,y)}}}})}
let MTREES=null;const mtrees=()=>MTREES??=[0,1,2].map(snowPine);

// ---- Street furniture, standing in for Frostholm's own (same tiles, so collisions are unchanged)
Object.assign(PA,{
mlamp:[34,r=>{r('#2b2f3a',6,30,6,4);r('#4a4f5a',6,30,6,1);r('#3a3d48',8,6,2,24);r('#5a5f6a',8,6,1,24);r('#3a3d48',8,3,8,2);r('#2b2f3a',12,5,6,3);
  r(NIGHT?'#fff1c8':'#e8eef4',13,8,4,1);r(SNOW,8,2,9,1)}],
mbin:[16,r=>{r('#2e5a3a',3,4,10,11);r('#3d7a4e',3,4,3,11);r('#1f3f28',11,4,2,11);for(let y=6;y<14;y+=3)r('#24482e',3,y,10,1);r('#1a1c24',2,2,12,3);r('#3a3d48',2,2,12,1);r(SNOW,2,1,12,1)}],
mhydrant:[14,r=>{r('#c0392b',5,4,6,9);r('#e05a4a',5,4,2,9);r('#8e2620',10,4,1,9);r('#c0392b',3,7,10,3);r('#8e2620',3,9,10,1);r('#e0b040',6,2,4,3);r('#9aa3ad',4,13,8,1);r(SNOW,6,1,4,1)}],
mnews:[18,r=>{r('#2e6f9a',3,4,10,12);r('#3d86b8',3,4,3,12);r('#24587a',11,4,2,12);r('#cfe6f4',4,6,8,5);r('#ffffff',4,6,3,2);r('#2b2f3a',5,8,6,1);r('#2b2f3a',5,10,4,1);r('#1a1c24',3,16,10,2);r(SNOW,3,3,10,1)}],
mphone:[30,r=>{r('#2b2f3a',2,2,12,28);r('#9cc8e6',4,6,8,20);r('#cfe6f4',4,6,3,20);r('#4a6a8a',9,6,3,20);r('#c0392b',2,2,12,4);r('#f2f2f2',4,3,8,1);r('#3a3d48',6,16,4,4);r(SNOW,2,1,12,1)}],
mvend:[26,r=>{r('#2a2c3e',1,2,14,24);r('#3a3d50',1,2,3,24);r('#ffd23a',3,4,10,2);for(let y=7;y<19;y+=4)for(let x=3;x<12;x+=3)r(['#e86a5a','#5aa0e8','#8ad06a','#f4d03f'][(x+y)%4],x,y,2,3);
  r('#1a1c24',3,20,10,3);r('#7fd0e8',12,8,1,6);r(SNOW,1,1,14,1)}]});
const MPROP={slamp:'mlamp',bin:'mbin',hydrant:'mhydrant',newsbox:'mnews',phone:'mphone',vending:'mvend'};
