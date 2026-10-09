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
  EX[id].forEach(e=>G[e.y][e.x]='E');MAPS[id]=G.map(r=>r.join(''))}
const inw=e=>[e.x+(e.s=='L'?1:e.s=='R'?-1:0),e.y+(e.s=='T'?1:e.s=='B'?-1:0)];

// ---- Pixel art (procedural placeholders)
const cache={};
function art(k,fn){if(!cache[k]){const c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');fn((col,x,y,w=1,h=1)=>{g.fillStyle=col;g.fillRect(x,y,w,h)});cache[k]=c}return cache[k]}
const BASE={'.':'#e4edf2',',':'#b8aa94',E:'#b8aa94',s:'#e3d3a0',r:'#7d838a',a:'#6b5a2e',p:'#8a6a45','~':'#2d5f8f',T:'#e4edf2',R:'#4f5559',v:'#c4421a','#':'#8b3a2f'};
const SP={'.':['#fff','#cdd9e2'],T:['#fff','#cdd9e2'],',':['#d0c3ab','#9d8f78'],E:['#d0c3ab','#9d8f78'],s:['#f0e4b8','#c9b97f'],r:['#9aa0a6','#666c72']};
const tile=(ch,v)=>art(ch+v,r=>{r(BASE[ch],0,0,16,16);const sp=SP[ch];
  if(sp)for(let i=0;i<6;i++)r(sp[i&1],(hash(i,v,1)*16)|0,(hash(v,i,2)*16)|0);
  if(ch=='~'){r('#6fa3d0',2+v*4,4,5,1);r('#6fa3d0',9-v*4,11,4,1)}
  if(ch=='p'){r('#6d5233',0,5,16,1);r('#6d5233',0,11,16,1)}
  if(ch=='a'){r('#54461f',0,3,16,1);r('#54461f',0,9,16,1);r('#54461f',0,15,16,1)}
  if(ch=='R'){r('#6b7176',2,3,7,5);r('#3b4044',8,9,7,6)}
  if(ch=='v'){r('#ff8a3a',3,4,4,3);r('#ffd23a',10,10,3,2)}
  if(ch=='T'){r('#4a3320',7,12,2,3);r('#1f4d2b',6,1,4,3);r('#1f4d2b',4,4,8,4);r('#1f4d2b',3,8,10,4);r('#fff',6,1,2,1);r('#fff',4,4,2,1)}
  if(ch=='#'){r('#6f2d25',0,12,16,4);r('#f2f6f8',0,0,16,3)}});
function sprite(px,py,d,fr){
  const r=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(px+a,py+b,w,h)};
  r('rgba(0,0,0,.25)',3,13,10,3);
  r('#2b2f4a',5,11,3,fr==1?2:3);r('#2b2f4a',8,11,3,fr==2?2:3);
  r('#2a5db0',4,6,8,6);r('#2a5db0',3,7,1,4);r('#2a5db0',12,7,1,4);
  if(d==0)r('#e8c33a',7,6,2,6);
  r('#e0b080',5,1,6,5);
  if(d==0){r('#4a2e1a',5,0,6,2);r('#222',6,3,1,1);r('#222',9,3,1,1)}
  else if(d==1)r('#4a2e1a',5,0,6,5);
  else{const f=d==2;r('#4a2e1a',5,0,6,2);r('#4a2e1a',f?9:5,2,2,3);r('#222',f?6:9,3,1,1)}
}

// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
const sel=document.getElementById('jump');for(const id in L)sel.add(new Option(L[id][0],id));
function go(id){P.m=id;[P.x,P.y]=inw(EX[id][0]);P.rx=P.x;P.ry=P.y;P.mv=null;sel.value=id}
go('village');
sel.onchange=()=>{go(sel.value);sel.blur()};
const solid=(m,x,y)=>{const t=MAPS[m][y]?.[x];return !t||'#TR~v'.includes(t)};
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
const tx=(s,x,y,al)=>{ctx.textAlign=al;ctx.fillStyle='#000';ctx.fillText(s,x+.5,y+.5);ctx.fillStyle='#fff';ctx.fillText(s,x,y)};
function draw(t){
  const M=MAPS[P.m],mh=M.length,mw=M[0].length;
  ctx.fillStyle='#0b120a';ctx.fillRect(0,0,cv.width,cv.height);
  const cx=cam(P.rx*T+T/2-cv.width/2,mw*T,cv.width),cy=cam(P.ry*T+T/2-cv.height/2,mh*T,cv.height),fw=(t/600)|0;
  for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const ch=M[y][x];
    ctx.drawImage(tile(ch,ch=='~'?((x+y+fw)&1):((hash(x,y,3)*4)|0)),x*T-cx,y*T-cy)}
  sprite(Math.round(P.rx*T-cx),Math.round(P.ry*T-cy),P.dir,P.mv?1+P.par:0);
  ctx.font='6px monospace';
  FL[P.m].forEach(([x,y,w,h,c,lb])=>{if(lb)tx(lb,(x+w/2)*T-cx,(y+h/2)*T-cy+2,'center')});
  EX[P.m].forEach(e=>{const[ix,iy]=inw(e),lb=(e.s=='R'?'':'\u2192 ')+NM[e.to]+(e.s=='R'?' \u2192':'');
    tx(lb,e.s=='L'?ix*T-cx:e.s=='R'?(ix+1)*T-cx:(ix+.5)*T-cx,iy*T-cy+10,e.s=='L'?'left':e.s=='R'?'right':'center')});
  ctx.fillStyle='rgba(100,140,200,.07)';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.font='8px monospace';ctx.fillStyle='rgba(11,18,10,.75)';ctx.fillRect(0,0,cv.width,12);
  tx(NM[P.m]+'  ('+P.x+','+P.y+')',4,9,'left');
}
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);requestAnimationFrame(loop)})(0);
