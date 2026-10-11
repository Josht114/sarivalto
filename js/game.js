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

// ---- Input + movement
const DIR={0:[0,1],1:[0,-1],2:[-1,0],3:[1,0]},KEY={ArrowDown:0,s:0,ArrowUp:1,w:1,ArrowLeft:2,a:2,ArrowRight:3,d:3};
const P={m:'village',x:0,y:0,rx:0,ry:0,dir:1,mv:null,par:0};let stack=[];
const sel=document.getElementById('jump');for(const id in L)sel.add(new Option(L[id][0],id));
function go(id){P.m=id;[P.x,P.y]=inw(EX[id][0]);P.rx=P.x;P.ry=P.y;P.mv=null;sel.value=id}
go('village');
sel.onchange=()=>{go(sel.value);sel.blur()};
const SOLID='#TR~vbkWecuxygitn';
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
  const M=MAPS[P.m],mh=M.length,mw=M[0].length;
  ctx.fillStyle='#0b120a';ctx.fillRect(0,0,cv.width,cv.height);
  // interiors have a taller back wall reaching WU pixels above the map; let the camera show it
  const top=L[P.m][3]=='interior'?WU:0;
  const cx=cam(P.rx*T+T/2-cv.width/2,mw*T,cv.width),cy=cam(P.ry*T+T/2-cv.height/2+top,mh*T+top,cv.height)-top;
  drawWorld2(P.m,cx,cy,t,P.mv?1+P.par:0);
  NPCS.filter(n=>n.m==P.m).forEach(n=>tx(n.name,n.x*T-cx+8,n.y*T-cy-7,'center','n'));
  FL[P.m].forEach(([x,y,w,h,c,lb,st])=>{if(lb)tx(lb,(x+w/2)*T-cx,st?y*T-cy-3:(y+h/2)*T-cy+2,'center',st?'b':'s')});
  EX[P.m].filter(e=>e.s!='O').forEach(e=>{const[ix,iy]=inw(e),s=e.s=='F'?(e.ax>e.x?'L':'R'):e.s,nm=NM[e.to]+(e.s=='F'?' (boat)':''),lb=(s=='R'?'':'\u2192 ')+nm+(s=='R'?' \u2192':'');
    tx(lb,s=='L'?ix*T-cx:s=='R'?(ix+1)*T-cx:(ix+.5)*T-cx,iy*T-cy+10,s=='L'?'left':s=='R'?'right':'center','x')});
  tx(NM[P.m]+'  ('+P.x+','+P.y+')',3,15,'left','h');drawLabels();
}
let last=0;(function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;update(dt);draw(t);requestAnimationFrame(loop)})(0);
