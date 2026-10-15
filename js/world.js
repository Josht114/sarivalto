// ---- The world's tile maps, exits and doors, built from js/data.js. Used by the game (art.js, game.js) and by tools/build-wiki.js.
// ---- Build maps and exits
const MAPS={},EX={},NM={},FL={},ends={};
LINKS.forEach(s=>{const[a,sa,b,sb]=s.split(' ');[[a,sa,b],[b,sb,a]].forEach(([m,sd,o])=>{((ends[m]??={})[sd]??=[]).push(o)})});
for(const id in L){const[name,w,h,th,fs]=L[id],[g,b]=TH[th],cx=w>>1,cy=h>>1;NM[id]=name;FL[id]=fs;EX[id]=[];
  const G=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x==0||y==0||x==w-1||y==h-1?b:g));
  fs.forEach(([x,y,fw,fh,c])=>{for(let j=y;j<y+fh;j++)for(let i=x;i<x+fw;i++)G[j][i]=c});
  for(const s in ends[id])ends[id][s].forEach((to,i,a)=>{const v=s=='T'||s=='B',p=(typeof EXIT_AT!='undefined'&&EXIT_AT[id]?.[to])??Math.floor((v?w:h)*(i+1)/(a.length+1)),
    x=v?p:s=='L'?0:w-1,y=v?(s=='T'?0:h-1):p;
    if(v){for(let j=Math.min(y,cy);j<=Math.max(y,cy);j++)G[j][x]=',';for(let k=Math.min(x,cx);k<=Math.max(x,cx);k++)G[cy][k]=','}
    else{for(let k=Math.min(x,cx);k<=Math.max(x,cx);k++)G[y][k]=',';for(let j=Math.min(y,cy);j<=Math.max(y,cy);j++)G[j][cx]=','}
    EX[id].push({x,y,s,to})});
  if(th=='interior')DOORS.filter(d=>d[0]==id).forEach(d=>{if(G[d[2]][d[1]]=='W')G[d[2]][d[1]]='m'});
  DOORS.filter(d=>d[5]==id).forEach(d=>{const ix=d[6]??(w>>1),iy=d[7]??(h-1);if(G[iy][ix]!='z')G[iy][ix]='m'});
  if(FERRY[id]){const[fx,fy,sx,sy,ix,iy]=FERRY[id];BOATS[id].forEach((to,i)=>EX[id].push({x:fx+i*sx,y:fy+i*sy,s:'F',to,ax:fx+i*sx+ix,ay:fy+i*sy+iy}))}
  EX[id].forEach(e=>G[e.y][e.x]=e.s=='F'?'F':'E');MAPS[id]=G.map(r=>r.join(''))}
DOORS.forEach(([o,dx,dy,fx,fy,i,ix,iy,iax,iay])=>{const[,w,h]=L[i];ix??=w>>1;iy??=h-1;iax??=0;iay??=-1;
  EX[o].push({x:dx,y:dy,s:'O',to:i,ax:dx+fx,ay:dy+fy});EX[i].push({x:ix,y:iy,s:'O',to:o,ax:ix+iax,ay:iy+iay})});
const inw=e=>e.ax!==undefined?[e.ax,e.ay]:[e.x+(e.s=='L'?1:e.s=='R'?-1:0),e.y+(e.s=='T'?1:e.s=='B'?-1:0)];
