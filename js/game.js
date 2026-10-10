const T=16,VW=15,VH=10;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');cv.width=VW*T;cv.height=VH*T;
const hash=(x,y,s=0)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+1,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};

// ---- Build maps and exits
const MAPS={},EX={},NM={},FL={},ends={};
LINKS.forEach(s=>{const[a,sa,b,sb]=s.split(' ');[[a,sa,b],[b,sb,a]].forEach(([m,sd,o])=>{((ends[m]??={})[sd]??=[]).push(o)})});
for(const id in L){const[name,w,h,th,fs]=L[id],[g,b]=TH[th],cx=w>>1,cy=h>>1;NM[id]=name;FL[id]=fs;EX[id]=[];
  const G=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x==0||y==0||x==w-1||y==h-1?b:g));
  fs.forEach(([x,y,fw,fh,c])=>{for(let j=y;j<y+fh;j++)for(let i=x;i<x+fw;i++)G[j][i]=c});
  for(const s in ends[id])ends[id][s].forEach((to,i,a)=>{const v=s=='T'||s=='B',p=Math.floor((v?w:h)*(i+1)/(a.length+1)),
    x=v?p:s=='L'?0:w-1,y=v?(s=='T'?0:h-1):p;
    if(v){for(let j=Math.min(y,cy);j<=Math.max(y,cy);j++)G[j][x]=',';for(let k=Math.min(x,cx);k<=Math.max(x,cx);k++)G[cy][k]=','}
    else{for(let k=Math.min(x,cx);k<=Math.max(x,cx);k++)G[y][k]=',';for(let j=Math.min(y,cy);j<=Math.max(y,cy);j++)G[j][cx]=','}
    EX[id].push({x,y,s,to})});
  DOORS.filter(d=>d[5]==id).forEach(d=>{const ix=d[6]??(w>>1),iy=d[7]??(h-1);if(G[iy][ix]!='z')G[iy][ix]='m'});
  if(FERRY[id]){const[fx,fy,sx,sy,ix,iy]=FERRY[id];BOATS[id].forEach((to,i)=>EX[id].push({x:fx+i*sx,y:fy+i*sy,s:'F',to,ax:fx+i*sx+ix,ay:fy+i*sy+iy}))}
  EX[id].forEach(e=>G[e.y][e.x]=e.s=='F'?'F':'E');MAPS[id]=G.map(r=>r.join(''))}
DOORS.forEach(([o,dx,dy,fx,fy,i,ix,iy,iax,iay])=>{const[,w,h]=L[i];ix??=w>>1;iy??=h-1;iax??=0;iay??=-1;
  EX[o].push({x:dx,y:dy,s:'O',to:i,ax:dx+fx,ay:dy+fy});EX[i].push({x:ix,y:iy,s:'O',to:o,ax:ix+iax,ay:iy+iay})});
const inw=e=>e.ax!==undefined?[e.ax,e.ay]:[e.x+(e.s=='L'?1:e.s=='R'?-1:0),e.y+(e.s=='T'?1:e.s=='B'?-1:0)];

// ---- Pixel art (procedural placeholders)
const cache={};
function art(k,fn){if(!cache[k]){const c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');fn((col,x,y,w=1,h=1)=>{g.fillStyle=col;g.fillRect(x,y,w,h)});cache[k]=c}return cache[k]}
function bld(w,h,s,dx){
  const W=w*T,Hh=h*T,c=document.createElement('canvas');c.width=W;c.height=Hh;const g=c.getContext('2d');
  const r=(col,x,y,a,b)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a,b)},tall=s.kind=='tall',wh=tall?Hh:Math.max(2,Math.round(h*.4))*T,ry=Hh-wh;
  r(s.wall,0,ry,W,wh);
  if(ry>0){r(s.roof,0,0,W,ry);r('rgba(0,0,0,.2)',0,ry-5,W,5);r('#f4f8fb',0,0,W,3);
    if(s.kind=='gable')for(let y=8;y<ry-6;y+=8)r('rgba(0,0,0,.16)',0,y,W,2);
    else{r(s.trim,0,3,W,2);r(s.trim,0,ry-8,W,2);for(let x=10;x<W-14;x+=18)r('rgba(0,0,0,.2)',x,12,10,4)}}
  if(tall){r(s.roof,0,0,W,9);r('#f4f8fb',0,0,W,3);
    for(let y=16;y<Hh-T-6;y+=22)for(let x=8;x<W-12;x+=18){r(s.trim,x-1,y-1,14,16);r(hash(x,y,5)>.55?'#f2d16b':s.win,x,y,12,14);r(s.trim,x,y+7,12,1);r('#444444',x-2,y+15,16,2)}}
  else for(let i=0;i<w;i++){if(i==dx)continue;const x=i*T+3,y=ry+((s.deco=='bar'||s.deco=='shop')?11:5);
    r(s.trim,x-1,y-1,12,11);r(hash(i,w,h)>.45?'#f2d16b':s.win,x,y,10,9);if(s.sh){r(s.sh,x-3,y,2,9);r(s.sh,x+11,y,2,9)}}
  if(s.chim!=null){const cx=(W*s.chim)|0;r('#6b3b2b',cx,2,8,Math.max(8,ry*.55));r('#f4f8fb',cx-1,2,10,3)}
  if(s.attic){r(s.trim,W/2-6,ry/2-5,12,11);r(s.win,W/2-4,ry/2-3,8,7)}
  if(s.porch&&dx>=0)r('#6d7f90',dx*T-3,Hh-T-4,22,4);
  if(s.deco=='hq'){r('#dddddd',W/2,5,2,ry-14);r('#c0392b',W/2+2,6,15,9);r('#ffd23a',W/2+8,9,3,3);r(s.trim,2,ry+2,3,wh-2);r(s.trim,W-5,ry+2,3,wh-2)}
  if(s.deco=='plant'){for(const f of[.12,.62]){r('#4a5560',W*f,0,9,ry-8);r('#2b2f3a',W*f-1,0,11,3)}
    r('#3d4852',W*.66,ry+6,34,wh-6);for(let y=ry+8;y<Hh-2;y+=5)r('#e0a100',W*.66,y,34,1);
    g.fillStyle='#ffffff';g.font='bold 7px monospace';g.fillText('FISH CO.',6,ry+wh-5)}
  if(s.deco=='bar'||s.deco=='shop'){const bar=s.deco=='bar';for(let x=0;x<W;x+=8)r(bar?((x/8|0)%2?'#c0392b':'#f2f2f2'):((x/8|0)%2?'#2e86c1':'#f2f2f2'),x,ry,8,9);
    r(bar?'#111111':'#ffffff',W/2-16,12,32,13);g.font='bold 8px monospace';g.fillStyle=bar?'#ff5fa8':'#2e6f9a';g.fillText(bar?'BAR':'FISH',W/2-(bar?9:11),22)}
  if(s.deco=='mil'){for(let x=8;x<W-10;x+=16)r('rgba(0,0,0,.35)',x,ry/2-3,7,6);r('#3a3320',0,Hh-4,W,4);r('#c9b04a',0,Hh-4,W,1)}
  if(dx>=0){r('#4a3320',dx*T+3,Hh-15,10,15);r('#e8c33a',dx*T+11,Hh-8,1,1);r('#e4edf2',dx*T+1,Hh-2,14,2)}
  return c}
const bcache={};
const bldArt=(m,x,y,w,h,st)=>{const k=m+x+','+y;if(!bcache[k]){const row=MAPS[m][y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;bcache[k]=bld(w,h,BLD[st],dx)}return bcache[k]};
const BASE={'.':'#e4edf2',',':'#b8aa94',E:'#b8aa94',s:'#e3d3a0',r:'#7d838a',a:'#6b5a2e',p:'#8a6a45','~':'#2d5f8f',T:'#e4edf2',R:'#4f5559',v:'#c4421a','#':'#8b3a2f',b:'#2d5f8f',k:'#e4edf2',F:'#8a6a45',d:'#8b3a2f',W:'#5b4636',f:'#8e6f48',m:'#8e6f48',e:'#8e6f48',c:'#8e6f48',u:'#8e6f48',x:'#8e6f48',y:'#8e6f48',g:'#8e6f48',i:'#8e6f48',z:'#8e6f48'};
const SP={'.':['#fff','#cdd9e2'],T:['#fff','#cdd9e2'],',':['#d0c3ab','#9d8f78'],E:['#d0c3ab','#9d8f78'],s:['#f0e4b8','#c9b97f'],r:['#9aa0a6','#666c72']};
const tile=(ch,v)=>art(ch+v,r=>{r(BASE[ch],0,0,16,16);const sp=SP[ch];
  if(sp)for(let i=0;i<6;i++)r(sp[i&1],(hash(i,v,1)*16)|0,(hash(v,i,2)*16)|0);
  if(ch=='~'){r('#6fa3d0',2+v*4,4,5,1);r('#6fa3d0',9-v*4,11,4,1)}
  if(ch=='p'||ch=='F'){r('#6d5233',0,5,16,1);r('#6d5233',0,11,16,1)}
  if(ch=='F'){r('#7a4a1e',3,5,10,6);r('#a8693a',3,5,10,2);r('#e8e8e8',4,9,8,1)}
  if(ch=='b'){r('#6fa3d0',2+v*4,2,5,1);r('#7a4a1e',0,4,16,8);r('#a8693a',0,4,16,2);r('#e8e8e8',0,9,16,1);r('#2c4a6a',3,6,3,2)}
  if(ch=='k'){r('#8fa6b8',2,9,12,4);r('#b8c9d6',3,6,10,4);r('#8fa6b8',5,4,6,3);r('#222',4,10,1,1);r('#222',6,7,1,1);r('#8fa6b8',13,8,2,3)}
  if(ch=='a'){r('#54461f',0,3,16,1);r('#54461f',0,9,16,1);r('#54461f',0,15,16,1)}
  if(ch=='R'){r('#6b7176',2,3,7,5);r('#3b4044',8,9,7,6)}
  if(ch=='v'){r('#ff8a3a',3,4,4,3);r('#ffd23a',10,10,3,2)}
  if(ch=='T'){r('#4a3320',7,12,2,3);r('#1f4d2b',6,1,4,3);r('#1f4d2b',4,4,8,4);r('#1f4d2b',3,8,10,4);r('#fff',6,1,2,1);r('#fff',4,4,2,1)}
  if('fmecuxygiz'.includes(ch)){r('#7a5d3a',0,7,16,1);r('#7a5d3a',0,15,16,1)}
  if(ch=='W'){r('#7a6049',0,0,16,5);r('#3f3126',0,13,16,3)}
  if(ch=='m'){r('#5a3a22',2,3,12,10);r('#7a5436',3,4,10,8)}
  if(ch=='e'){r('#b33333',1,2,14,12);r('#eeeeee',1,2,14,4);r('#8a2222',1,10,14,2)}
  if(ch=='c'){r('#6b4a2a',0,4,16,9);r('#a8855a',0,4,16,3)}
  if(ch=='u'){r('#4a3220',1,3,14,11);r('#c9a064',1,3,14,8)}
  if(ch=='x'){r('#9a7b4f',1,2,14,12);r('#6d5233',1,7,14,1);r('#cfd8df',4,4,4,2);r('#cfd8df',9,10,4,2)}
  if(ch=='y'){r('#6d5233',0,2,16,12);r('#a8855a',0,2,16,2);r('#4f3a28',0,8,16,1);r('#c0392b',2,4,3,3);r('#2e86c1',8,4,3,3);r('#e0a100',3,10,3,3);r('#7aa57a',10,10,3,3)}
  if(ch=='g'){r('#6b7b8a',0,3,16,10);r('#8fa0b0',0,3,16,3);r('#2b2f3a',0,8,16,2);r('#e0a100',12,5,3,2)}
  if(ch=='i'){r('#2b2f3a',2,3,12,11);r('#555555',3,2,10,2);r('#e8321e',5,7,6,3);r('#ffb01c',7,8,2,1)}
  if(ch=='z'){r('#6d5233',2,2,12,3);r('#8a6a45',2,6,12,3);r('#a8855a',2,10,12,3)}
  if(ch=='#'||ch=='d'){r('#6f2d25',0,12,16,4);r('#f2f6f8',0,0,16,3)}
  if(ch=='d'){r('#4a3320',4,4,8,12);r('#e8c33a',10,10,1,1)}});
function sprite(px,py,d,fr,body='#2a5db0',hair='#4a2e1a',stripe='#e8c33a'){
  const r=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(px+a,py+b,w,h)};
  r('rgba(0,0,0,.25)',3,13,10,3);
  r('#2b2f4a',5,11,3,fr==1?2:3);r('#2b2f4a',8,11,3,fr==2?2:3);
  r(body,4,6,8,6);r(body,3,7,1,4);r(body,12,7,1,4);
  if(d==0&&stripe)r(stripe,7,6,2,6);
  r('#e0b080',5,1,6,5);
  if(d==0){r(hair,5,0,6,2);r('#222',6,3,1,1);r('#222',9,3,1,1)}
  else if(d==1)r(hair,5,0,6,5);
  else{const f=d==2;r(hair,5,0,6,2);r(hair,f?9:5,2,2,3);r('#222',f?6:9,3,1,1)}
}

// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
const sel=document.getElementById('jump');for(const id in L)sel.add(new Option(L[id][0],id));
function go(id){P.m=id;[P.x,P.y]=inw(EX[id][0]);P.rx=P.x;P.ry=P.y;P.mv=null;sel.value=id}
go('village');
sel.onchange=()=>{go(sel.value);sel.blur()};
const SOLID='#TR~vbkWecuxygi';
const solid=(m,x,y)=>{const t=MAPS[m][y]?.[x];return !t||SOLID.includes(t)||NPCS.some(n=>n.m==m&&n.x==x&&n.y==y)||
  PROPS.some(p=>p[0]==m&&p[1]==x&&p[2]==y&&!PROP_PASS.includes(p[3]))};
const press=d=>{if(!stack.includes(d))stack.push(d)},release=d=>{stack=stack.filter(k=>k!==d)};
addEventListener('keydown',e=>{if(e.target==sel)return;const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY){press(KEY[k]);e.preventDefault()}});
addEventListener('keyup',e=>{const k=e.key.length==1?e.key.toLowerCase():e.key;if(k in KEY)release(KEY[k])});
document.querySelectorAll('#pad button').forEach(b=>{const d=+b.dataset.d;
  b.addEventListener('pointerdown',e=>{e.preventDefault();press(d)});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>release(d)))});
function update(dt){
  if(P.mv){const m=P.mv;m.t+=dt/.16;const k=Math.min(m.t,1);P.rx=m.fx+(m.tx-m.fx)*k;P.ry=m.fy+(m.ty-m.fy)*k;
    if(m.t>=1){P.mv=null;const e=EX[P.m].find(e=>e.x==P.x&&e.y==P.y);
      if(e){const b=EX[e.to].find(q=>q.to==P.m);P.m=e.to;[P.x,P.y]=inw(b);P.rx=P.x;P.ry=P.y;sel.value=P.m}}}
  if(!P.mv&&stack.length){const d=stack[stack.length-1],[dx,dy]=DIR[d];P.dir=d;
    const nx=P.x+dx,ny=P.y+dy;if(!solid(P.m,nx,ny)){P.mv={fx:P.x,fy:P.y,tx:nx,ty:ny,t:0};P.x=nx;P.y=ny;P.par^=1}}
}
const cam=(p,len,view)=>len<=view?-((view-len)>>1):Math.max(0,Math.min(len-view,Math.round(p)));
// Labels are drawn on a second, full-resolution canvas laid over the game so text stays sharp at any size.
const ov=document.getElementById('ov'),og=ov.getContext('2d');let LB=[];
const tx=(s,x,y,al,k)=>{LB.push([s,x,y,al,k])};
const rr=(x,y,w,h,r)=>{og.beginPath();og.moveTo(x+r,y);og.arcTo(x+w,y,x+w,y+h,r);og.arcTo(x+w,y+h,x,y+h,r);og.arcTo(x,y+h,x,y,r);og.arcTo(x,y,x+w,y,r);og.closePath()};
function drawLabels(){
  const r=cv.getBoundingClientRect(),d=globalThis.devicePixelRatio||1,w=Math.round(r.width*d),h=Math.round(r.height*d);
  if(ov.width!=w||ov.height!=h){ov.width=w;ov.height=h}
  og.clearRect(0,0,w,h);const f=w/cv.width;og.lineJoin='round';og.textBaseline='middle';og.textAlign='left';
  for(const[s,x,y,al,k]of LB){const fs=Math.round((k=='h'?14:12)*d);og.font='bold '+fs+'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const m=og.measureText(s).width,pad=5*d,Y=y*f-fs*.4,X=x*f;let x0=al=='left'?X:al=='right'?X-m:X-m/2;x0=Math.max(pad+1,Math.min(w-m-pad-1,x0));
    if(k=='s'){og.lineWidth=3.5*d;og.strokeStyle='rgba(11,18,10,.9)';og.strokeText(s,x0,Y);og.fillStyle='#ffffff';og.fillText(s,x0,Y);continue}
    og.fillStyle=k=='x'?'rgba(11,26,43,.9)':'rgba(11,18,10,.82)';rr(x0-pad,Y-fs*.68,m+pad*2,fs*1.36,fs*.5);og.fill();
    og.fillStyle=k=='x'?'#9fe870':k=='n'?'#ffe9a8':'#ffffff';og.fillText(s,x0,Y)}
  LB=[]}
function draw(t){
  const M=MAPS[P.m],mh=M.length,mw=M[0].length,a2=ART2.has(P.m);
  ctx.fillStyle='#0b120a';ctx.fillRect(0,0,cv.width,cv.height);
  const cx=cam(P.rx*T+T/2-cv.width/2,mw*T,cv.width),cy=cam(P.ry*T+T/2-cv.height/2,mh*T,cv.height),fw=(t/600)|0;
  if(a2)drawWorld2(P.m,cx,cy,t,P.mv?1+P.par:0);
  else{for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const ch=M[y][x];
      ctx.drawImage(tile(ch,ch=='~'?((x+y+fw)&1):((hash(x,y,3)*4)|0)),x*T-cx,y*T-cy)}
    FL[P.m].forEach(([x,y,w,h,c,lb,st])=>{if(st)ctx.drawImage(bldArt(P.m,x,y,w,h,st),x*T-cx,y*T-cy)});
    NPCS.filter(n=>n.m==P.m).forEach(n=>sprite(n.x*T-cx,n.y*T-cy,n.dir,0,n.body,n.hair,null));
    sprite(Math.round(P.rx*T-cx),Math.round(P.ry*T-cy),P.dir,P.mv?1+P.par:0)}
  NPCS.filter(n=>n.m==P.m).forEach(n=>tx(n.name,n.x*T-cx+8,n.y*T-cy-(a2?7:2),'center','n'));
  FL[P.m].forEach(([x,y,w,h,c,lb,st])=>{if(lb)tx(lb,(x+w/2)*T-cx,st?y*T-cy-3:(y+h/2)*T-cy+2,'center',st?'b':'s')});
  EX[P.m].filter(e=>e.s!='O').forEach(e=>{const[ix,iy]=inw(e),s=e.s=='F'?(e.ax>e.x?'L':'R'):e.s,nm=NM[e.to]+(e.s=='F'?' (boat)':''),lb=(s=='R'?'':'\u2192 ')+nm+(s=='R'?' \u2192':'');
    tx(lb,s=='L'?ix*T-cx:s=='R'?(ix+1)*T-cx:(ix+.5)*T-cx,iy*T-cy+10,s=='L'?'left':s=='R'?'right':'center','x')});
  if(!a2){ctx.fillStyle='rgba(100,140,200,.07)';ctx.fillRect(0,0,cv.width,cv.height)}
  tx(NM[P.m]+'  ('+P.x+','+P.y+')',3,15,'left','h');drawLabels();
}
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);requestAnimationFrame(loop)})(0);
