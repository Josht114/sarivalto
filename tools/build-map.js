// Generates docs/island-map.svg (and the copy at island-map.svg) from js/data.js. Usage: node tools/build-map.js  (no dependencies)
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),box={};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+';this.L=L;this.LINKS=LINKS;this.POS=POS;this.FACTIONS=FACTIONS;this.FACTION_AT=FACTION_AT;this.BOATS=BOATS;this.DISTRICTS=DISTRICTS;this.DISTRICT_OF=DISTRICT_OF;this.TRAM_STOPS=TRAM_STOPS;this.TRAM_LINE=TRAM_LINE;this.RIVER=RIVER;',box);
const {L,LINKS,POS,FACTIONS,FACTION_AT,BOATS,DISTRICTS,DISTRICT_OF,TRAM_STOPS,TRAM_LINE,RIVER}=box,W=1700,H=860;
const COL={town:'#f6ecc8',road:'#d6cdb8',site:'#f0cfae',nature:'#c3d4a6',harbour:'#bddcea'};
const ids=Object.keys(L).filter(i=>POS[i]),pairs=LINKS.map(s=>{const a=s.split(' ');return[a[0],a[2]]});
const wd=id=>L[id][0].length*7+20,P=id=>POS[id];
// The coast is the convex hull of every inland place, pushed out by CO pixels. Harbours are not used to shape it: each one is
// snapped onto the nearest point of the coast (an anchor marks the spot) and its label sits just out to sea.
// where each district's name is written on the map (picked by hand to sit in open ground)
const DPOS={central:[870,560],north:[810,318],northeast:[1030,328],northwest:[425,310],southwest:[515,474],south:[690,742],southeast:[1065,690]};
const CO=52,isH=i=>P(i)[2]=='harbour'&&i!='oilrig';
const land=ids.filter(i=>i!='oilrig'&&!isH(i)),lp=pairs.filter(([a,b])=>a!='oilrig'&&b!='oilrig');
const pts=land.map(i=>P(i).slice(0,2)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
const half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cr(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p)}h.pop();return h};
const hull=half(pts).concat(half(pts.slice().reverse())),hp=hull.map(p=>p.join(',')).join(' ');
const ctr=hull.reduce((a,p)=>[a[0]+p[0]/hull.length,a[1]+p[1]/hull.length],[0,0]),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
// outward unit normal of hull edge i (from vertex i to i+1)
const enorm=i=>{const a=hull[i],b=hull[(i+1)%hull.length],l=dist(a,b);let n=[(b[1]-a[1])/l,-(b[0]-a[0])/l];
  if(n[0]*((a[0]+b[0])/2-ctr[0])+n[1]*((a[1]+b[1])/2-ctr[1])<0)n=[-n[0],-n[1]];return n};
// nearest point q on the hull to p, and the outward direction n there
function nearHull(p){let best=null,inside=true;
  hull.forEach((a,i)=>{const b=hull[(i+1)%hull.length],e=[b[0]-a[0],b[1]-a[1]],t=Math.max(0,Math.min(1,((p[0]-a[0])*e[0]+(p[1]-a[1])*e[1])/(e[0]**2+e[1]**2))),
    q=[a[0]+e[0]*t,a[1]+e[1]*t],n=enorm(i),d=dist(p,q);if((p[0]-a[0])*n[0]+(p[1]-a[1])*n[1]>0)inside=false;if(!best||d<best.d)best={q,n,d}});
  if(!inside&&best.d>0)best.n=[(p[0]-best.q[0])/best.d,(p[1]-best.q[1])/best.d];return best}
// points every few pixels around the hull, d pixels out to sea
function ring(d){const out=[],m=hull.length;
  for(let i=0;i<m;i++){const n0=enorm((i-1+m)%m),n1=enorm(i),a0=Math.atan2(n0[1],n0[0]);let da=Math.atan2(n1[1],n1[0])-a0;
    while(da>Math.PI)da-=2*Math.PI;while(da<=-Math.PI)da+=2*Math.PI;const st=Math.max(1,Math.ceil(Math.abs(da)/.12));
    for(let k=0;k<=st;k++){const a=a0+da*k/st;out.push([hull[i][0]+Math.cos(a)*d,hull[i][1]+Math.sin(a)*d])}}
  const dense=[];out.forEach((p,i)=>{const q=out[(i+1)%out.length],n=Math.ceil(dist(p,q)/10);for(let k=0;k<n;k++)dense.push([p[0]+(q[0]-p[0])*k/n,p[1]+(q[1]-p[1])*k/n])});
  return dense}
const HB={};ids.filter(isH).forEach(i=>{const{q,n}=nearHull(P(i)),c=[q[0]+n[0]*CO,q[1]+n[1]*CO],off=Math.abs(n[0])*wd(i)/2+Math.abs(n[1])*15+9;
  HB[i]={c,lab:[c[0]+n[0]*off,c[1]+n[1]*off]}});
const NP=i=>HB[i]?HB[i].lab:P(i),RP=i=>HB[i]?HB[i].c:P(i),r1=v=>Math.round(v*10)/10;
const blob=(w,c)=>`<polygon points="${hp}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
// Boat routes run out from each harbour to its own shipping lane around the island and take the shorter way round.
const boats=[];for(const a in BOATS)BOATS[a].forEach(b=>{if(a<b)boats.push([a,b])});
function seaRoute(a,b,d){const R=ring(d),n=R.length,near=p=>R.reduce((bi,q,i)=>dist(q,p)<dist(R[bi],p)?i:bi,0),ia=near(RP(a)),ib=near(RP(b));
  const len=dir=>{let s=0;for(let k=ia;k!=ib;k=(k+dir+n)%n)s+=dist(R[k],R[(k+dir+n)%n]);return s},dir=len(1)<=len(-1)?1:-1,out=[RP(a)];
  for(let k=ia;;k=(k+dir+n)%n){out.push(R[k]);if(k==ib)break}out.push(RP(b));return out}
// Each lane gets a pale halo under a dark dashed line so it stands out from the shallows and its neighbours.
// each route gets its own colour, and says which harbours it joins when you hover over it
const BOATCOL=['#0e4a6e','#b8322a','#6a2c8a','#1e6b3a','#c96a12','#2b2118'];
const boatLines=boats.map(([a,b],k)=>{const d=`M${seaRoute(a,b,CO+28+k*11).map(p=>r1(p[0])+' '+r1(p[1])).join('L')}`;
  return `<g><title>Boat: ${L[a][0]} – ${L[b][0]}</title><path d="${d}" stroke="#f4fbfd" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/><path d="${d}" stroke="${BOATCOL[k%BOATCOL.length]}" stroke-width="2.5" stroke-dasharray="9 6" stroke-linecap="round" stroke-linejoin="round"/></g>`}).join('');
const roads=pairs.map(([a,b])=>{const d=`M${r1(RP(a)[0])} ${r1(RP(a)[1])}L${r1(RP(b)[0])} ${r1(RP(b)[1])}`,pipe=a=='oilrig'||b=='oilrig';
  return pipe?`<path d="${d}" stroke="#3a3a3a" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`
  :`<path d="${d}" stroke="#8a7a5a" stroke-width="7" stroke-linecap="round"/><path d="${d}" stroke="#efe6c8" stroke-width="2.5" stroke-dasharray="7 6"/>`}).join('');
// The river: a smooth curve through its course and the place it ends at, out to the coast there, with a plank bridge where a road crosses.
const rpts=[...RIVER.pts,P(RIVER.end).slice(0,2)];{const{q,n}=nearHull(P(RIVER.end));rpts.push([q[0]+n[0]*(CO+8),q[1]+n[1]*(CO+8)])}
// (Catmull-Rom through the points, as cubic Bezier segments)
const rd='M'+r1(rpts[0][0])+' '+r1(rpts[0][1])+rpts.slice(1).map((p,i)=>{const a=rpts[i-1]||rpts[i],b=rpts[i],d=rpts[i+2]||p;
  return'C'+[b[0]+(p[0]-a[0])/6,b[1]+(p[1]-a[1])/6,p[0]-(d[0]-b[0])/6,p[1]-(d[1]-b[1])/6,p[0],p[1]].map(r1).join(' ')}).join('');
const river=`<path d="${rd}" stroke="#4f8fbf" stroke-width="8" stroke-linecap="round" fill="none"/><path d="${rd}" stroke="#8fc4e4" stroke-width="3" stroke-linecap="round" fill="none"/>`+
  RIVER.bridges.map(([x,y])=>`<rect x="${x-10}" y="${y-6}" width="20" height="12" rx="2" fill="#a8794c" stroke="#4a3b2a" stroke-width="1.5"/><path d="M${x-6} ${y-6}V${y+6}M${x-2} ${y-6}V${y+6}M${x+2} ${y-6}V${y+6}M${x+6} ${y-6}V${y+6}" stroke="#6b4a2e"/>`).join('')+
  `<text transform="translate(${RIVER.label[0]},${RIVER.label[1]}) rotate(${RIVER.label[2]})" text-anchor="middle" font-size="13" font-style="italic" fill="#2f6f9a">${RIVER.name}</text>`;
// The tram line runs alongside the roads it follows (offset to one side so both stay visible); each stop gets a red T badge.
const toff=(a,b)=>{const p=RP(a),q=RP(b),l=dist(p,q)||1;return[-(q[1]-p[1])/l*8,(q[0]-p[0])/l*8]};
const tramLine=TRAM_LINE.slice(1).map((b,i)=>{const a=TRAM_LINE[i],[ox,oy]=toff(a,b),d=`M${r1(RP(a)[0]+ox)} ${r1(RP(a)[1]+oy)}L${r1(RP(b)[0]+ox)} ${r1(RP(b)[1]+oy)}`;
  return`<path d="${d}" stroke="#b8322a" stroke-width="4.5" stroke-linecap="round"/><path d="${d}" stroke="#f4f1e8" stroke-width="1.5" stroke-dasharray="2 6"/>`}).join('');
const tramStops=TRAM_STOPS.map(i=>{const[x,y]=NP(i),w=wd(i);return`<g transform="translate(${r1(x-w/2+2)},${r1(y+14)})"><circle r="8" fill="#b8322a" stroke="#fff" stroke-width="2"/><text y="4" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff" font-family="sans-serif">T</text></g>`}).join('');
// Districts: each inland place (and harbour landing) gets the patch of island nearer to it than to any other place, coloured by
// its district and clipped to the coast; dashed lines mark where two districts meet.
const sites=ids.filter(i=>i!='oilrig').map(i=>({id:i,p:RP(i),d:DISTRICT_OF[i]}));
sites.forEach(s=>{if(!DISTRICTS[s.d])throw new Error(L[s.id][0]+' ('+s.id+') has no district in DISTRICT_OF')});
function cell(si){let E=[[[0,0],[W,0],null],[[W,0],[W,H],null],[[W,H],[0,H],null],[[0,H],[0,0],null]];const a=sites[si].p;
  sites.forEach((o,j)=>{if(j==si)return;const b=o.p,m=[(a[0]+b[0])/2,(a[1]+b[1])/2],d=[b[0]-a[0],b[1]-a[1]],f=q=>(q[0]-m[0])*d[0]+(q[1]-m[1])*d[1];
    const I=(P,Q)=>{const t=f(P)/(f(P)-f(Q));return[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t]},out=[];let ex=null,en=null;
    E.forEach(([P,Q,tg])=>{const ip=f(P)<=0,iq=f(Q)<=0;if(ip&&iq)out.push([P,Q,tg]);else if(ip){ex=I(P,Q);out.push([P,ex,tg],'X')}else if(iq){en=I(P,Q);out.push([en,Q,tg])}});
    E=out.map(e=>e=='X'?[ex,en,j]:e)});return E}
const cells=sites.map((s,i)=>cell(i)),coast=ring(CO).map(p=>r1(p[0])+','+r1(p[1])).join(' ');
const districtFill=cells.map((E,i)=>{const c=DISTRICTS[sites[i].d][1],pts=E.map(e=>r1(e[0][0])+','+r1(e[0][1])).join(' ');return`<polygon points="${pts}" fill="${c}" stroke="${c}" stroke-width="1.5"/>`}).join('');
const districtEdges=cells.map((E,i)=>E.filter(e=>e[2]!=null&&e[2]>i&&sites[e[2]].d!=sites[i].d).map(e=>`<path d="M${r1(e[0][0])} ${r1(e[0][1])}L${r1(e[1][0])} ${r1(e[1][1])}"/>`).join('')).join('');
const dc={};sites.forEach(s=>{(dc[s.d]??=[]).push(P(s.id))});
const districtNames=Object.entries(dc).map(([d,ps])=>{const[x,y]=DPOS[d]||[ps.reduce((a,p)=>a+p[0],0)/ps.length,ps.reduce((a,p)=>a+p[1],0)/ps.length];
  return`<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" font-size="19" font-weight="bold" letter-spacing="5" fill="#5a4630" fill-opacity=".42">${DISTRICTS[d][0].toUpperCase()}</text>`}).join('');
const anchors=Object.values(HB).map(({c})=>`<g transform="translate(${r1(c[0])},${r1(c[1])})"><circle r="8" fill="#1f6f9a" stroke="#fff" stroke-width="2"/><path d="M0 -4.5V4.5M-3 -1.5H3M-4 1.5Q0 6 4 1.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`).join('');
// each place is a link to its wiki page (tools/build-wiki.js points these at the right page, and its map viewer opens a plan of the place instead)
const nodes=ids.map(i=>{const[x,y]=NP(i).map(r1),k=P(i)[2],w=wd(i),f=FACTION_AT[i]&&FACTIONS[FACTION_AT[i]],sw=f?3.5:1.5;
  return`<a class="loc" href="../wiki/locations/${i}.html" data-loc="${i}"><title>${L[i][0]}</title>`+(f?`<rect x="${x-w/2-7}" y="${y-22}" width="${w+14}" height="44" rx="12" fill="${f[1]}" fill-opacity=".30"/>`:'')+
  `<rect x="${x-w/2}" y="${y-15}" width="${w}" height="30" rx="7" fill="${COL[k]}" stroke="${f?f[1]:'#4a3b2a'}" stroke-width="${sw}"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="13" fill="#2b2118">${L[i][0]}</text>`+
  (f?`<rect x="${x+w/2-34}" y="${y-25}" width="40" height="15" rx="7.5" fill="${f[1]}" stroke="#fff" stroke-width="1.5"/><text x="${x+w/2-14}" y="${y-14}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${f[2]}</text>`:'')+'</a>'}).join('');
const grid=Array.from({length:14},(_,i)=>`<line x1="${(i+1)*120}" y1="0" x2="${(i+1)*120}" y2="${H}"/>`).join('')+Array.from({length:7},(_,i)=>`<line x1="0" y1="${(i+1)*110}" x2="${W}" y2="${(i+1)*110}"/>`).join('');
const KEY=Object.entries({town:'Settlement',road:'Road',site:'Notable site',nature:'Wilderness',harbour:'Harbour / sea',anchor:'Harbour landing',boat:'Boat route',river:'River',tram:'Tram line',tstop:'Tram stop',pipe:'Oil pipeline'});
const fk=Object.entries(FACTIONS);
const ky=140+66+fk.length*38+40,panel=`<rect x="1440" y="140" width="240" height="${ky-140+48+KEY.length*28}" rx="10" fill="#f6ecc8" fill-opacity=".92" stroke="#4a3b2a" stroke-width="2"/>
<text x="1462" y="176" font-size="16" font-weight="bold" fill="#2b2118" letter-spacing="2">FACTION BASES</text>`+fk.map(([k,[n,c,sh]],i)=>`<rect x="1462" y="${198+i*38}" width="42" height="18" rx="9" fill="${c}"/><text x="1483" y="${211+i*38}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${sh}</text><text x="1514" y="${212+i*38}" font-size="14" fill="#2b2118">${n}</text>`).join('')+
`<text x="1462" y="${140+66+fk.length*38+16}" font-size="12" font-style="italic" fill="#3d3226">Unmarked places are unassigned.</text>
<text x="1462" y="${ky+20}" font-size="16" font-weight="bold" fill="#2b2118" letter-spacing="2">KEY</text>`+KEY.map(([k,t],i)=>{const y=ky+38+i*28,sym=
  k=='boat'?`<path d="M1462 ${y+8}H1504" stroke="#f4fbfd" stroke-width="6" stroke-linecap="round"/>`+BOATCOL.slice(0,3).map((c,i)=>`<path d="M${1462+i*14} ${y+8}h12" stroke="${c}" stroke-width="2.5" stroke-dasharray="5 3" stroke-linecap="round"/>`).join(''):
  k=='river'?`<path d="M1462 ${y+8}H1504" stroke="#4f8fbf" stroke-width="8" stroke-linecap="round"/><path d="M1462 ${y+8}H1504" stroke="#8fc4e4" stroke-width="3" stroke-linecap="round"/>`:
  k=='tram'?`<path d="M1462 ${y+8}H1504" stroke="#b8322a" stroke-width="4.5" stroke-linecap="round"/><path d="M1462 ${y+8}H1504" stroke="#f4f1e8" stroke-width="1.5" stroke-dasharray="2 6"/>`:
  k=='tstop'?`<circle cx="1483" cy="${y+8}" r="8" fill="#b8322a" stroke="#fff" stroke-width="2"/><text x="1483" y="${y+12}" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff" font-family="sans-serif">T</text>`:
  k=='pipe'?`<path d="M1462 ${y+8}H1504" stroke="#3a3a3a" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`:
  k=='road'?`<path d="M1462 ${y+8}H1504" stroke="#8a7a5a" stroke-width="7" stroke-linecap="round"/><path d="M1462 ${y+8}H1504" stroke="#efe6c8" stroke-width="2.5" stroke-dasharray="7 6"/>`:
  k=='anchor'?`<circle cx="1483" cy="${y+8}" r="8" fill="#1f6f9a" stroke="#fff" stroke-width="2"/>`:
  `<rect x="1462" y="${y}" width="42" height="16" rx="4" fill="${COL[k]}" stroke="#4a3b2a"/>`;return sym+`<text x="1514" y="${y+13}" font-size="14" fill="#2b2118">${t}</text>`}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">
<title>Sarivalto island map</title><desc>Overview map of all ${ids.length} locations and the paths between them.</desc>
<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4ecf4"/><stop offset="1" stop-color="#a6d0e2"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sea)"/><g stroke="#ffffff" stroke-opacity=".35" stroke-width="1">${grid}</g>
${blob(170,'#e3f3f6')}${blob(140,'#cfe6ea')}${blob(112,'#9a8a62')}${blob(104,'#dfe0b4')}
<defs><clipPath id="isl"><polygon points="${coast}"/></clipPath></defs>
<g clip-path="url(#isl)" opacity=".75">${districtFill}</g><g clip-path="url(#isl)" stroke="#6b5a3a" stroke-width="2" stroke-dasharray="6 5" opacity=".55" fill="none">${districtEdges}</g>${river}${districtNames}
<g fill="none">${boatLines}${roads}${tramLine}</g>${anchors}${nodes}${tramStops}
<text x="60" y="68" font-size="44" font-weight="bold" fill="#2b2118" letter-spacing="6">SARIVALTO</text>
<text x="62" y="94" font-size="16" font-style="italic" fill="#3d3226">An island north of Finland &#183; early 1980s</text>
<g transform="translate(1340,120)"><polygon points="0,-46 11,0 0,-9 -11,0" fill="#2b2118"/><polygon points="0,46 11,0 0,9 -11,0" fill="#f6ecc8" stroke="#2b2118"/>
<text y="-54" text-anchor="middle" font-size="18" font-weight="bold" fill="#2b2118">N</text></g>
${panel}<rect x="8" y="8" width="${W-16}" height="${H-16}" fill="none" stroke="#2b2118" stroke-width="3"/></svg>`;
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/island-map.svg'),svg);fs.writeFileSync(path.join(root,'island-map.svg'),svg.split('href="../wiki/').join('href="wiki/'));  // (the copy at the top of the project links to the wiki from there)
console.log('wrote docs/island-map.svg ('+ids.length+' locations, '+pairs.length+' links)');
