// Generates docs/island-map.svg from js/data.js. Usage: node tools/build-map.js  (no dependencies)
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..'),box={};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+';this.L=L;this.LINKS=LINKS;this.POS=POS;',box);
const {L,LINKS,POS}=box,W=1440,H=820;
const COL={town:'#f6ecc8',road:'#d6cdb8',site:'#f0cfae',nature:'#c3d4a6',harbour:'#bddcea'};
const ids=Object.keys(L),pairs=LINKS.map(s=>{const a=s.split(' ');return[a[0],a[2]]});
const wd=id=>L[id][0].length*7+20,P=id=>POS[id];
const land=ids.filter(i=>i!='oilrig'),lp=pairs.filter(([a,b])=>a!='oilrig'&&b!='oilrig');
const pts=land.map(i=>P(i).slice(0,2)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
const half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cr(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p)}h.pop();return h};
const hp=half(pts).concat(half(pts.slice().reverse())).map(p=>p.join(',')).join(' ');
const blob=(w,c)=>`<polygon points="${hp}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`+lp.map(([a,b])=>`<line x1="${P(a)[0]}" y1="${P(a)[1]}" x2="${P(b)[0]}" y2="${P(b)[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`).join('')+
  land.map(i=>`<circle cx="${P(i)[0]}" cy="${P(i)[1]}" r="${w/2}" fill="${c}"/>`).join('');
const roads=pairs.map(([a,b])=>{const d=`M${P(a)[0]} ${P(a)[1]}L${P(b)[0]} ${P(b)[1]}`,pipe=a=='oilrig'||b=='oilrig';
  return pipe?`<path d="${d}" stroke="#3a3a3a" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`
  :`<path d="${d}" stroke="#8a7a5a" stroke-width="7" stroke-linecap="round"/><path d="${d}" stroke="#efe6c8" stroke-width="2.5" stroke-dasharray="7 6"/>`}).join('');
const nodes=ids.map(i=>{const[x,y,k]=P(i),w=wd(i);return`<rect x="${x-w/2}" y="${y-15}" width="${w}" height="30" rx="7" fill="${COL[k]}" stroke="#4a3b2a" stroke-width="1.5"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-size="13" fill="#2b2118">${L[i][0]}</text>`}).join('');
const grid=Array.from({length:12},(_,i)=>`<line x1="${(i+1)*120}" y1="0" x2="${(i+1)*120}" y2="${H}"/>`).join('')+Array.from({length:7},(_,i)=>`<line x1="0" y1="${(i+1)*110}" x2="${W}" y2="${(i+1)*110}"/>`).join('');
const legend=Object.entries({town:'Settlement',road:'Road',site:'Notable site',nature:'Wilderness',harbour:'Harbour / sea'}).map(([k,t],i)=>
  `<rect x="${60+i*150}" y="768" width="22" height="16" rx="4" fill="${COL[k]}" stroke="#4a3b2a"/><text x="${90+i*150}" y="781" font-size="13" fill="#2b2118">${t}</text>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif">
<title>Sarivalto island map</title><desc>Overview map of all ${ids.length} locations and the paths between them.</desc>
<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4ecf4"/><stop offset="1" stop-color="#a6d0e2"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sea)"/><g stroke="#ffffff" stroke-opacity=".35" stroke-width="1">${grid}</g>
${blob(170,'#e3f3f6')}${blob(140,'#cfe6ea')}${blob(112,'#9a8a62')}${blob(104,'#dfe0b4')}
<g fill="none">${roads}</g>${nodes}
<text x="60" y="68" font-size="44" font-weight="bold" fill="#2b2118" letter-spacing="6">SARIVALTO</text>
<text x="62" y="94" font-size="16" font-style="italic" fill="#3d3226">An island north of Finland &#183; early 1980s</text>
<g transform="translate(1340,120)"><polygon points="0,-46 11,0 0,-9 -11,0" fill="#2b2118"/><polygon points="0,46 11,0 0,9 -11,0" fill="#f6ecc8" stroke="#2b2118"/>
<text y="-54" text-anchor="middle" font-size="18" font-weight="bold" fill="#2b2118">N</text></g>
${legend}<rect x="8" y="8" width="${W-16}" height="${H-16}" fill="none" stroke="#2b2118" stroke-width="3"/></svg>`;
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/island-map.svg'),svg);console.log('wrote docs/island-map.svg ('+ids.length+' locations, '+pairs.length+' links)');
