// ---- Detailed pixel-art renderer (modern 2D pixel style), used for every map and interior. Each map is drawn once to a cached
// canvas (ground, shorelines, buildings); water, boats, trees, props, people, smoke, flags and snowfall are drawn every frame on top.
const OUT='#262330',SNOW='#f3f7fa',SNOWD='#d3dfe9';
const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const RGB={},rgb=h=>RGB[h]??=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
// shade(colour, k): k>0 mixes toward white, k<0 toward black.
const shade=(h,k)=>'#'+rgb(h).map(v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,k)=>{const A=rgb(a),B=rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')};
// ---- Proof of concept: a gothic redesign of Eastbrook in the spirit of Blasphemous and The Last Faith, shown only when the page
// is opened with ?gothic. Eastbrook's ground is colour-graded to a moonlit night (its brick streets to blood red), its buildings are
// redrawn as gothic stone with stained glass (GBLD), its props and trees are swapped for gothic ones (GPROP, DEADTREES), and a
// lighting pass leaves it dark except around windows, lamps and fires, under drifting fog and falling ash.
const GOTHIC=typeof location!='undefined'&&/[?&]gothic\b/.test(location.search),GOTH=m=>GOTHIC&&m=='second';
// Steampunk proof of concept for Kingsgrad (?steam): see steamArt
const STEAM=typeof location!='undefined'&&/[?&]steam\b/.test(location.search),STM=m=>STEAM&&m=='town';
// Kingsgrad's look: its own buildings with steampunk touches laid over them (see steamTouch), and a sepia haze. ?classic shows
// the town as it was before, and ?steam the full steampunk proof of concept instead. (?steam2 starts the game in Kingsgrad.)
const qs=typeof location!='undefined'?location.search:'',STEAM2=/[?&]steam2\b/.test(qs),CLASSIC=/[?&]classic\b/.test(qs),STM2=m=>m=='town'&&!STEAM&&!CLASSIC;
// gradient maps: a pixel's brightness picks a colour along a ramp (slate for most things, crimson for reddish ones)
const RAMP_SLATE=['#0a0910','#191824','#2a2938','#424256','#62677e','#8a92a8'],RAMP_BLOOD=['#120608','#2e0c10','#541619','#7c2a22','#a8503a','#c9844e'];
function gradeImage(p){const at=(R,k)=>{const f=Math.max(0,Math.min(.999,k))*(R.length-1),i=f|0,u=f-i,a=rgb(R[i]),b=rgb(R[i+1]);return[0,1,2].map(j=>a[j]+(b[j]-a[j])*u)};
  for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const r=p[i],g=p[i+1],b=p[i+2],L=(.3*r+.59*g+.11*b)/255,red=r>g+28&&r>b+20;
    const c=at(red?RAMP_BLOOD:RAMP_SLATE,red?L*1.15:L*.92);p[i]=c[0];p[i+1]=c[1];p[i+2]=c[2]}}
// ---- Weather by region (outdoor places only). snow: deep snow, as the north and the south-west have; medium: Kingsgrad and the
// rest of the centre and south, with grass showing through; autumn: the south-east, olive grass, fallen leaves and trees turning,
// with only the last patches of snow; curated: Hope Springs, a mown lawn and clipped trees with no snow at all.
const WEATHER_IN={southeast:'autumn',central:'medium',south:'medium'},WEATHER_AT={gated:'curated',privbeach:'curated',privharbour:'curated'};
const weatherOf=m=>WEATHER_AT[m]||WEATHER_IN[DISTRICT_OF[m]]||'snow',WXSNOW={snow:1,medium:.45,autumn:.12,curated:0};
// While a scene is built (see scene()), WMAP recolours what is drawn: in snow-free weather the snow on roofs, sills, props and
// rocks is dropped (null), leaving what lies under it. WXID names the weather, so sprites are cached per weather.
const MELT={'#f3f7fa':null,'#d3dfe9':null,'#e4ecf3':null,'#dff1fb':null,'#cfdde8':null,'#e4edf4':null,'#e8eff5':null,'#dfe8ef':null,'#eef4f8':null};
let WMAP=null,WXID='';
// ---- Neon Frostholm. By day it is a neon-trimmed city; by night (?night) it sinks into a purple dusk where neon does the
// lighting and the wet streets reflect it. Its buildings carry neon tubes along their
// rooflines (BLD tube), its streets are wet and reflect the signs, billboards flicker like screens, steam rises from grates and
// cables sag overhead. CYB marks the places it applies to; CYBING is set while one of them is being built.
const CYB=m=>(m=='fishing'||m=='kalanharbour')&&!(typeof MOD=='function'&&MOD(m)),CYBERLOOK={dark:'rgba(28,10,56,.46)',fog:'190,80,220',fogA:.06};let CYBING=false;
const rgbs=h=>rgb(h).join(',');
// Smooth value noise in 0..1 (for snow drifts, wavy edges).
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),
  a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}
// Draws fn(r) on a w x h canvas with a 1px margin, then outlines everything opaque. Draw the result at (x-1, y-1).
function mk(w,h,fn){const W=w+2,H=h+2,c=cnv(W,H),g=c.getContext('2d');fn((col,x,y,a=1,b=1)=>{if(WMAP&&col in WMAP){col=WMAP[col];if(!col)return}g.fillStyle=col;g.fillRect(x+1,y+1,a,b)});
  const d=g.getImageData(0,0,W,H),p=d.data,o=rgb(OUT),A=i=>p[i*4+3]>160,add=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(p[i*4+3])continue;
    if((x>0&&A(i-1))||(x<W-1&&A(i+1))||(y>0&&A(i-W))||(y<H-1&&A(i+W)))add.push(i)}
  add.forEach(i=>{p.set(o,i*4);p[i*4+3]=255});g.putImageData(d,0,0);return c}
// Tiny 3x5 pixel font for signs.
const FONT={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',
  H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',
  P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',
  X:'101101010101101',Y:'101101010010010',Z:'111001010100111','.':'000000000000010',' ':'000000000000000','-':'000000111000000',
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001',
  '5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111'};
const ptext=(r,s,x,y,col)=>[...s].forEach((ch,i)=>{const f=FONT[ch];for(let k=0;k<15;k++)if(f[k]=='1')r(col,x+i*4+k%3,y+(k/3|0))});

// ---- Ground: snow, cobbled paths, dock planks, and the rocky bank and foam where land meets water.
// Water pixels stay transparent so the animated water shows through from underneath.
const CLS=ch=>'~b'.includes(ch)?'w':'pF'.includes(ch)?'d':',E'.includes(ch)?'p':'#d'.includes(ch)?'h':'s';
const land=k=>k=='s'||k=='p'||k=='h';
const STONE=['#a39d95','#b1aba2','#978f88','#aaa39a'],PLANK=['#9a7049','#8c6542','#a5794f'];
// Path look per map (default: cobbles). dirt = gravel track, boards = boardwalk, steel = the oil rig's deck plating.
// pave = Frostholm's concrete paving slabs, worn = Saltwick's broken cobbles, flag = Hope Springs' swept flagstones (no snow on them),
// brick = Eastbrook's red brick.
const PATHS={west:'dirt',radio:'dirt',beach:'boards',privbeach:'boards',forest:'dirt',north:'dirt',east:'dirt',south:'dirt',southwest:'dirt',
  volcano:'dirt',mountains:'dirt',farm:'dirt',oilrig:'steel',fishing:'wet',kalanharbour:'wet',village:'worn',harbour:'worn',gated:'flag',privharbour:'flag',
  second:'brick',savilaharbour:'boards',millroad:'dirt'};
// Saltwick's snow is trodden grey and brown with slush.
const SLUSH={village:1,harbour:1};
function snowPx(X,Y){const nz=vnoise(X/14,Y/14,1)*.7+vnoise(X/5,Y/5,2)*.3;return hash(X,Y,3)>.988?'#ccd9e5':nz>.64?'#f6f9fc':nz<.36?'#d8e3ec':'#e8eff5'}
// medium snow: snow with patches of tired grass showing through, a slushy rim round each
// ---- Snow-free zones inside a snowy place, warmed from below: [x, y, w, h] in tiles. The volcano is bare from its first cliff
// upwards; only its lower slopes keep their snow. Ground there is volcanic rock, and snow is stripped from props and rocks.
const BARE={volcano:[0,0,30,13]},inBare=(m,x,y)=>{const b=BARE[m];return!!b&&x>=b[0]&&y>=b[1]&&x<b[0]+b[2]&&y<b[1]+b[3]};
function volcPx(X,Y){const n=vnoise(X/10,Y/10,660)*.7+vnoise(X/3,Y/3,661)*.3,h=hash(X,Y,662);let c=n>.62?'#6e6258':n<.36?'#4a423c':'#5c524a';
  if(h>.97)c='#2e2826';else if(h>.94)c='#7a6c60';if(vnoise(X/6,Y/6,663)>.72)c=mix(c,'#8a4a32',.35);
  // a few patches of snow still lying where the heat doesn't reach
  const sn=vnoise(X/13,Y/13,664)*.75+vnoise(X/4,Y/4,665)*.25;if(sn>.74)c=sn>.78?snowPx(X,Y):mix(c,'#c9d2d8',.5);return c}
// draw something (a prop or rock) with its snow stripped off, cached separately
function bareOf(fn){const sv=[WMAP,WXID];WMAP=MELT;WXID='bare';try{return fn()}finally{[WMAP,WXID]=sv}}
function mediumPx(X,Y){const s=snowPx(X,Y),n=vnoise(X/16,Y/16,601)*.7+vnoise(X/5,Y/5,602)*.3;if(n>.47)return s;
  const e=hash(X,Y,604)>.93?'#5a5f44':vnoise(X/7,Y/7,603)>.5?'#7a8458':'#6a744c';return n>.42?mix(e,'#c9d2d8',.55):e}
// autumn: olive and gold grass, bare earth, fallen leaves, and the last few patches of snow
function autumnPx(X,Y){const n=vnoise(X/14,Y/14,611)*.65+vnoise(X/5,Y/5,612)*.35,h=hash(X,Y,613);let c=n>.6?'#8a9440':n<.35?'#6e7a34':'#7c8a3a';
  if(vnoise(X/9,Y/9,614)>.68)c=mix(c,'#8a6a3a',.55);
  if(h>.965)c=['#d0782a','#b0402a','#d8a030','#8a5a2a'][(h*1000|0)%4];else if(h>.94)c=shade(c,-.15);
  const sn=vnoise(X/12,Y/12,615);if(sn>.84)c=mix(c,'#e8eff5',Math.min(.8,(sn-.84)*8));return c}
// curated: a striped, freshly mown lawn
function lawnPx(X,Y){const b=hash(X,Y,621);let c=((X+Y)>>4)&1?'#62bc50':'#55ad46';if(b>.97)c=shade(c,.08);else if(b<.03)c=shade(c,-.06);return c}
const WXGROUND={snow:(X,Y)=>snowPx(X,Y),medium:mediumPx,autumn:autumnPx,curated:lawnPx};
function sandPx(X,Y,dry){const nz=vnoise(X/10,Y/10,1)*.7+vnoise(X/4,Y/4,2)*.3;let c=nz>.62?'#e4d8b4':nz<.38?'#cbbb91':'#d9cba4';
  if(hash(X,Y,3)>.982)c='#a89a7a';else if(hash(X,Y,4)>.99)c='#f4efe0';
  const sn=vnoise(X/12,Y/12,5);return sn>.74&&!dry?mix(c,'#eef3f6',Math.min(.85,(sn-.74)*9)):c}
// Mountain ground: snow with grey rock showing through in patches.
const rockAt=(X,Y)=>vnoise(X/14,Y/14,50)*.75+vnoise(X/5,Y/5,51)*.25,RK=.7;
function rockPx(X,Y){const nz=rockAt(X,Y);if(nz<RK)return hash(X,Y,52)>.985?'#8a929b':snowPx(X,Y);
  // outcrops lit from above: a snowy lip on top, a shadowed lower edge, and broken, cracked stone between
  if(rockAt(X,Y-2)<RK)return nz<RK+.01?'#dfe8ef':'#b1b9c1';if(rockAt(X,Y+2)<RK||rockAt(X+2,Y)<RK)return'#5f666e';
  const t=vnoise(X/3,Y/3,53),k=vnoise(X/2,Y/7,54);return k>.78?'#5f666e':k>.72?'#b1b9c1':t>.62?'#a3abb3':t<.38?'#737b84':'#8d959e'}
// Ploughed field under snow: soft furrow ridges with dark soil showing here and there.
function fieldPx(X,Y){const row=Y%8,nz=vnoise(X/9,Y/9,55);if(row==7)return nz>.58?'#6b5a3a':nz>.45?'#a8a090':'#d8e3ec';
  if(row==6)return nz>.62?'#5a4a30':'#dfe7ee';if(hash(X,Y,56)>.985)return'#c9b06a';return row==0?'#f6f9fc':'#e8eff5'}
function groundLayer(m){if(DET(m))return detailedGround(m);if(typeof MOD=='function'&&MOD(m))return modernGround(m);
  // the weather: which ground, and how much snow lies on paths (sth raises a snow threshold out of reach as the snow thins)
  const wx=weatherOf(m),sk=WXSNOW[wx],sth=t=>t+(1-sk)*.6,gnd=WXGROUND[wx],bareAt=(X,Y)=>inBare(m,X>>4,Y>>4);
  // the radio mast and the drilling derrick stand on open ground, so their footprints are drawn as plain ground rather than a building
  const base=TH[L[m][3]][0],M=MAPS[m].map(r=>[...r]);FL[m].forEach(([x,y,w,h,,,st])=>{if(st&&BLD[st]&&['mast','derrick','manhole'].includes(BLD[st].kind))for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)M[j][i]=base});
  const h=M.length,w=M[0].length,W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data;
  const ps=PATHS[m]||'cobble',at=(x,y)=>M[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],cl=(x,y)=>{const k=CLS(at(x,y));return ps=='steel'&&k=='p'?'d':k};
  const sandy=ch=>ch=='s'||(base=='s'&&!'~b,EpF'.includes(ch)),
    gpx=(X,Y,ch)=>sandy(ch)?sandPx(X,Y,sk<.5):ch=='a'?fieldPx(X,Y):ch==';'?mix(gnd(X,Y),'#8a7a5a',hash(X>>1,Y>>1,91)>.72?.13:hash(X>>2,Y>>2,92)>.6?.05:0):ch=='r'||(base=='r'&&ch!='.')?(bareAt(X,Y)?volcPx(X,Y):rockPx(X,Y)):gnd(X,Y);
  // crater(X,Y) < 1 inside a lava feature's oval (with a wobbly edge), growing outward from it
  const VF=FL[m].filter(f=>f[4]=='v').map(([x,y,w,h])=>[(x+w/2)*16,(y+h/2)*16,w*8,h*8]),
    crater=(X,Y)=>Math.min(99,...VF.map(([cx,cy,rx,ry])=>(((X-cx)/rx)**2+((Y-cy)/ry)**2)*(.92+vnoise(X/6,Y/6,64)*.16)));
  // bridge(x,y): a path tile with water on both sides is a bridge: 'h' if its walkway runs east-west (water north and south),
  // 'v' if it runs north-south. Water flows on underneath, so water tiles treat a bridge next to them as more water.
  const wet=(x,y)=>'~b'.includes(at(x,y)),bridge=(x,y)=>CLS(at(x,y))!='p'?0:wet(x,y-1)&&wet(x,y+1)?'h':wet(x-1,y)&&wet(x+1,y)?'v':0;
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){
    const k=cl(tx,ty),nb=(x,y)=>k=='w'&&bridge(x,y)?'w':cl(x,y),n=nb(tx,ty-1),s=nb(tx,ty+1),wv=nb(tx-1,ty),e=nb(tx+1,ty),ch=M[ty][tx],br=bridge(tx,ty);
    const nS=sandy(at(tx,ty-1)),sS=sandy(at(tx,ty+1)),wS=sandy(at(tx-1,ty)),eS=sandy(at(tx+1,ty)),sd=sandy(ch);
    const tuft=ch=='.'&&wx!='curated'&&hash(tx,ty,9)>.86,tox=2+(hash(tx,ty,10)*11|0),toy=4+(hash(tx,ty,11)*9|0);
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
          const sn=vnoise(X/9,Y/9,29);if(sn>sth(.62))col=mix(col,'#e8eff5',Math.min(1,(sn-sth(.62))*6))}
        else if(ps=='pave'){const sx=X&15,sy=Y&15;col=sx==15||sy==15?'#868c93':hash(X>>4,Y>>4,30)>.5?'#b9bec4':'#b1b6bc';if(sx==0||sy==0)col=shade(col,.1);
          if(hash(X,Y,31)>.985)col='#9aa0a6';const sn=vnoise(X/8,Y/8,32);if(sn>sth(.74))col=mix(col,'#e8eff5',Math.min(.8,(sn-sth(.74))*6))}
        else if(ps=='wet'){const sx=X&15,sy=Y&15,pd=vnoise(X/10,Y/10,640);col=sx==15||sy==15?'#3a404c':hash(X>>4,Y>>4,641)>.5?'#565e6c':'#4e5664';if(sx==0||sy==0)col=shade(col,.08);
          if(pd>.6){col=pd>.66?'#343c4c':'#3e4656';if(hash(X,Y,642)>.97)col='#9ab0d0'}
          const sn=vnoise(X/8,Y/8,32);if(sn>sth(.8))col=mix(col,'#c8d0dc',Math.min(.6,(sn-sth(.8))*5))}
        else if(ps=='flag'){const row=Y>>3,sx=X+(row&1)*6,sg=(sx/12|0);col=['#e6dccb','#ddd2bf','#eee5d6'][hash(sg,row,33)*3|0];
          if((Y&7)==7||sx%12==11)col='#b8ab94';else if((Y&7)==0)col=shade(col,.06)}
        else if(ps=='brick'){const row=Y>>2,sx=X+(row&1)*4;col=['#a0523a','#8e4632','#b05e44'][hash(sx>>3,row,34)*3|0];
          if((Y&3)==3||(sx&7)==7)col='#c9b8a8';const sn=vnoise(X/9,Y/9,35);if(sn>sth(.7))col=mix(col,'#e8eff5',Math.min(.85,(sn-sth(.7))*6))}
        else{const row=Y/5|0,ry=Y%5,sx=X+row*3,seg=sx/6|0,l6=sx%6;col=STONE[hash(seg,row,14)*4|0];
          if(ry==4||l6==5)col=hash(X,Y,15)>.6&&sk>.5?'#dde6ee':'#77716b';else if(ry==0)col=shade(col,.15);else if(ry==3||l6==4)col=shade(col,-.1);
          // worn: stones missing, leaving mud and grey slush in the gaps
          if(ps=='worn'){const hole=vnoise(X/5,Y/5,36);if(hole>.64)col=hole>.72?(hash(X,Y,37)>.5?'#6e604e':'#7a6a55'):(hash(X,Y,38)>.4?'#9aa4ac':'#8a939b');if(hash(X,Y,39)>.992)col='#4a4038'}}
        // snow (or sand) lying over the path's edges, with a little shadow under the lip
        const lip=(q,sid,dist,gc)=>{const dep=vnoise(q/4,sid,16)*3|0;if(dist<dep)col=gpx(X,Y,gc);else if(dist==dep)col=sandy(gc)?'#a8977a':'#8a857f'};
        const op=v=>v!='p'&&v!='d';
        // flagstones are swept clean: a dressed stone kerb along the edge instead of a lip of snow
        if(ps=='flag'){const d=Math.min(op(n)?ly:99,op(s)?15-ly:99,op(wv)?lx:99,op(e)?15-lx:99);if(d<2)col=d?'#c9bba0':'#9a8c70'}
        else{if(op(n))lip(X,1,ly,at(tx,ty-1));if(op(s))lip(X,2,15-ly,at(tx,ty+1));if(op(wv))lip(Y,3,lx,at(tx-1,ty));if(op(e))lip(Y,4,15-lx,at(tx+1,ty))}
        // a level crossing: where a path cuts across a tram track, the rails carry on through it
        if(at(tx-1,ty)=='l'||at(tx+1,ty)=='l'){if(ly==3||ly==11)col='#c9ced4';else if(ly==4||ly==12)col='#6b737c'}}
      else if(ch=='l'){
        // tram track: grey ballast, wooden sleepers across it, and two steel rails running along it
        const nz=vnoise(X/3,Y/3,66);col=nz>.6?'#8a857f':nz<.4?'#6e6a64':'#7d7872';if((ly<2||ly>13)&&sk>.5)col=mix(col,'#e8eff5',.55);
        if(X%8<3&&ly>1&&ly<14)col=X%8==0?'#6b4a2e':'#5a3e27';if(vnoise(X/7,Y/7,67)>sth(.72)&&(ly<4||ly>11||X%8>=3))col='#e8eff5';
        if(ly==3||ly==11)col='#c9ced4';else if(ly==4||ly==12)col='#6b737c'}
      else if(ch=='P'){
        // tram platform: concrete slabs with a yellow safety line along the track edge
        col=(X&15)==15||(Y&15)==15?'#8a9099':hash(X,Y,68)>.97?'#9aa0a6':'#b1b7be';if(ly>=12&&ly<14)col='#e0a100';if(ly>=14)col='#6b7178';
        if(vnoise(X/6,Y/6,69)>sth(.7)&&ly<12)col=mix(col,'#e8eff5',.7)}
      else if(ch=='C'){
        // a cliff face: rock laid down in strata, split by cracks, with a snowy lip where it meets the level above, a shadowed foot
        // where it meets the level below, and its sides lit or shaded where it turns a corner
        const up=at(tx,ty-1)!='C',dn=!'CS'.includes(at(tx,ty+1)),lf=at(tx-1,ty)!='C',rt=at(tx+1,ty)!='C',band=((Y+(hash(X>>3,0,81)*3|0))/4|0);
        col=['#6e6056','#5e5248','#7a6b5e','#655850'][band%4];if(Y%4==0)col='#4a3f38';if((X&3)==0&&hash(X>>2,band,82)>.78)col='#3e342e';
        if(up&&ly<3)col=bareAt(X,Y)?(ly==0?'#9a8a78':'#7a6b5e'):ly==0?SNOW:ly==1?'#b9c4cc':'#8a7a6a';if(dn&&ly>11)col=mix(col,'#1e1a18',(ly-11)*.2);
        if(lf&&lx<2)col=shade(col,.14);if(rt&&lx>13)col=shade(col,-.28)}
      else if(ch=='S'){
        // stairs cut into the cliff: stone steps with lit treads and shadowed risers, between the cut rock on either side
        const st=ly%4,lf=at(tx-1,ty)!='S',rt=at(tx+1,ty)!='S';col=st==0?'#bdb4a8':st==3?'#5e5248':'#8e8478';if(st==0&&hash(X,Y,83)>.7&&!bareAt(X,Y))col=SNOW;else if(hash(X,Y,84)>.95)col=shade(col,-.1);
        if(lf&&lx<2||rt&&lx>13)col='#4a3f38'}
      else if(ch=='v'&&crater(X,Y)<1){
        // volcanic crater (an oval inside its feature): a dark rocky rim, a cooled crust, then molten lava with darker crust veins
        const q=crater(X,Y),d=(1-Math.sqrt(q))*16+(vnoise(X/4,Y/4,58)*3|0),nz=vnoise(X/5,Y/5,59)*.7+vnoise(X/2,Y/2,60)*.3;
        col=d<3?(hash(X,Y,61)>.5?'#3a3038':'#4a4048'):d<5?(d<4?'#2a2028':'#7a3a2a'):nz>.47&&nz<.52?'#5a2a20':nz>.68?'#ffd23a':nz>.56?'#ff8a3a':'#e8501e'}
      else{col=gpx(X,Y,ch);if(SLUSH[m]&&!sd){const sl=vnoise(X/11,Y/11,40)*.7+vnoise(X/4,Y/4,41)*.3;if(sl>.58)col=mix(col,sl>.66?'#8a8072':'#a39c90',Math.min(.75,(sl-.58)*5))}
        // scorched ash around a crater's rim
        const q=crater(X,Y);if(q<2.2)col=mix(col,hash(X,Y,63)>.8?'#2a2028':'#4a4048',Math.min(.85,(2.2-q)*.75));
        if(ch=='T')col=mix(col,sd?'#9a8c6a':sk>.5?'#9fb3c6':'#3e4a2a',sd?.18:sk>.5?.3:.22);
        if(sd){const dw=Math.min(n=='w'?ly:99,s=='w'?15-ly:99,wv=='w'?lx:99,e=='w'?15-lx:99);if(dw<6)col=mix(col,'#a8966c',(6-dw)/7)}
        if(n=='h'&&ly<3)col=mix(col,'#b4c4d4',.85-ly*.2);
        if(wv=='h'&&lx<5)col=mix(col,'#b4c4d4',.7-lx*.12);
        if(tuft){const dx=lx-tox,dy=ly-toy;if((dy==0&&(dx==0||dx==2||dx==4))||(dy==-1&&(dx==1||dx==3))||(dy==-2&&dx==2))col=dy==0?'#5e6b45':'#7c8a5c'}
        if(ch=='.'&&hash(tx,ty,18)>.9&&lx==toy&&ly==tox)col='#8a929b'}
      if(col){const i=(Y*W+X)*4;p.set(rgb(col),i);p[i+3]=a}}}
  if(GOTH(m))gradeImage(p);
  if(STM(m)||STM2(m))sepiaImage(p);
  g.putImageData(img,0,0);return c}
// the steampunk town's ground: every pixel pulled towards a sepia of its own brightness
function sepiaImage(p){for(let i=0;i<p.length;i+=4){const l=(p[i]*.3+p[i+1]*.59+p[i+2]*.11)/255,sp=[46+l*176,32+l*140,20+l*96];for(let j=0;j<3;j++)p[i+j]=p[i+j]*.35+sp[j]*.65}}

// ---- Animated water: 8 seamless 64x64 frames of two crossing wave trains.
const WATER=Array.from({length:8},(_,f)=>{const c=cnv(64,64),g=c.getContext('2d'),img=g.createImageData(64,64),TAU=Math.PI*2,ph=f/8*TAU;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const v=Math.sin(TAU*(2*x+y)/64+ph)+Math.sin(TAU*(3*y-x)/64-ph),tone=Math.sin(TAU*x/64)*Math.sin(TAU*y/32);
    const col=v>1.93?'#a9d6ef':v>1.72?'#4f8fbf':v<-1.75?'#215480':tone>.4?'#27618f':'#2a6896';img.data.set([...rgb(col),255],(y*64+x)*4)}
  g.putImageData(img,0,0);return c});

// ---- Shop signs: a picture of what each shop sells, cut out of painted wood or tin, hanging from a wrought-iron bracket at
// one corner of the shop front (BLD icon). Each is drawn in an 18 x 18 box and outlined.
const heartAt=(x,y)=>{const X=(x-8.5)/7.4,Y=(8.5-y)/7.1;return Math.pow(X*X+Y*Y-1,3)-X*X*Y*Y*Y<=0};
const ICON_ART={
  // a coffee mug with a smiling face, steam curling off the top
  mug:r=>{for(const[x,y]of[[5,3],[6,2],[5,1],[6,0],[10,3],[9,2],[10,1],[9,0]])r('rgba(255,255,255,.6)',x,y,1,1);r('#f4efe4',2,5,12,13);r('#d8d0c0',12,5,2,13);r('#5a3a26',3,5,10,2);r('#7a5232',3,5,10,1);
    for(let y=8;y<15;y++){r('#f4efe4',14,y,1,1);r('#f4efe4',17,y,1,1)}r('#f4efe4',14,8,4,1);r('#f4efe4',14,14,4,1);r('#e0a100',2,15,12,2);
    r(OUT,5,9,2,2);r(OUT,9,9,2,2);r('#ffffff',5,9,1,1);r('#ffffff',9,9,1,1);r('#f2a0b0',3,11,2,1);r('#f2a0b0',11,11,2,1);r(OUT,5,12,1,1);r(OUT,6,13,4,1);r(OUT,10,12,1,1)},
  // a vinyl record with an orange label
  vinyl:r=>{for(let y=0;y<18;y++)for(let x=0;x<18;x++){const d=Math.hypot(x-8.5,y-8.5);if(d<=8.6)r(d<1?'#f4efe4':d<3.4?'#ff8a3a':d>7.6?'#1a1a1e':(d|0)%2?'#26262c':'#1a1a1e',x,y)}
    r('#7a7a86',4,3,3,1);r('#7a7a86',3,4,1,2);r('#ffd23a',8,6,2,1)},
  // a tattoo-flash heart with a scroll across it
  // a yellow sou'wester, its long brim at the back
  souwester:r=>{r('#f0c020',5,4,9,7);r('#ffe070',6,4,3,2);r('#c89810',11,5,3,6);r('#f0c020',1,10,16,3);r('#c89810',1,12,16,1);r('#f0c020',13,13,4,3);r('#c89810',4,8,10,1);r('#7a5a10',8,13,2,4)},
  heart:r=>{for(let y=0;y<17;y++)for(let x=0;x<18;x++)if(heartAt(x,y))r(y<4&&x<8?'#e85a5a':'#c0392b',x,y);r('#efe2c4',0,7,18,4);r('#d8c8a0',0,10,18,1);r('#c9a87a',0,7,2,4);r('#c9a87a',16,7,2,4);
    for(let x=3;x<15;x+=2)r('#2a2a30',x,8,1,2)},
  // a red and black check flannel shirt
  flannel:r=>{const sh=(x,y)=>((x>>2)+(y>>2))&1?'#b33333':'#8e2626';for(let y=4;y<18;y++)for(let x=3;x<15;x++)r((x&3)==0||(y&3)==0?'#2a1a1a':sh(x,y),x,y);
    for(let y=4;y<11;y++){r((y&3)==0?'#2a1a1a':'#b33333',0,y,3,1);r((y&3)==0?'#2a1a1a':'#b33333',15,y,3,1)}r('#f4efe4',6,3,6,2);r('#2a1a1a',8,5,2,3);for(let y=8;y<17;y+=3)r('#efe2c4',8,y,2,1)},
  // flames leaping over a grill
  grill:r=>{for(const[x,h]of[[3,9],[8,12],[13,8]])for(let k=0;k<h;k++){const hw=Math.max(0,Math.round(Math.sin(Math.PI*k/h)*2.6));r(k<h*.35?'#ffd23a':k<h*.7?'#ff8a3a':'#e8321e',x-hw,12-h+k,hw*2+2,1)}
    r('#3a3d44',0,12,18,3);for(let x=1;x<18;x+=3)r('#6b737c',x,12,1,3);r('#2b2f3a',3,15,2,3);r('#2b2f3a',13,15,2,3)},
  // a foaming mug of beer
  beer:r=>{r('#e0a100',3,6,10,12);r('#ffd23a',4,7,2,10);r('#c98a00',11,6,2,12);for(let y=9;y<16;y++){r('#d8e4ee',13,y,1,1);r('#d8e4ee',16,y,1,1)}r('#d8e4ee',13,9,4,1);r('#d8e4ee',13,15,4,1);
    for(const[x,y]of[[3,3],[6,2],[9,2],[12,3],[2,5],[13,5],[5,4],[10,4]])r('#ffffff',x,y,3,3);r('#ffffff',3,5,10,2);r('#e8eef2',4,6,8,1);r('#ffffff',13,6,2,3)},
  // a Kelp Cola bottle
  cola:r=>{r('#c0392b',7,0,4,2);r('#2e9d57',7,2,4,4);r('#2e9d57',6,6,6,1);r('#2e9d57',5,7,8,1);r('#2e9d57',4,8,10,10);r('#5fc48a',5,8,2,10);r('#1f7a42',12,8,2,10);
    r('#f4efe4',4,11,10,4);r('#c0392b',4,12,10,1);r('#2e9d57',6,13,6,1)},
  // Kingsgrad's picture signs
  // a blue shield with a gold band and seal, for the Civil Service Bureau
  crest:r=>{for(let y=1;y<17;y++){const hw=y<11?7:Math.max(0,7-(y-10)*1.2|0);r('#2e4a7a',9-hw,y,hw*2,1)}r('#c9a040',2,1,14,1);r('#c9a040',2,6,14,2);r('#4a6aa0',3,2,3,4);
    for(let y=9;y<14;y++)for(let x=6;x<12;x++)if(Math.hypot(x-8.5,y-11)<=2.8)r('#c9a040',x,y);r('#8a6a20',8,10,2,2)},
  // a revolver, for the gun shop
  pistol:r=>{r('#3a3d44',0,5,11,3);r('#6b737c',0,5,11,1);r('#2a2a30',1,4,2,1);r('#4a4f58',9,3,6,7);r('#6b737c',9,3,6,1);for(const y of[4,6,8])r('#2a2a30',10,y,4,1);
    r('#3a3d44',8,9,4,3);r('#2a2a30',9,10,2,1);for(let k=0;k<7;k++)r(k%2?'#6a4428':'#8a5a36',12+(k>>1),10+k,4,1);r('#c9a040',15,9,2,1)},
  // a wicker basket of groceries, for the supermarket
  basket:r=>{for(let x=4;x<14;x++){const y=Math.round(6-Math.sin((x-4)/9*Math.PI)*5);r('#7a5232',x,y,1,2)}r('#c0392b',4,6,4,4);r('#e85a4a',5,6,1,1);r('#d89a4a',9,5,6,4);r('#a8642a',10,6,4,1);r('#5a9a3a',7,4,2,3);
    for(let y=9;y<17;y++){const i=y-9;r('#c9822a',1+(i>>2),y,16-(i>>1),1);for(let x=2+(i>>2);x<16-(i>>2);x+=3)r('#8a5a2a',x+(y%2),y,1,1)}r('#7a5232',1,9,16,1)},
  // a pair of open scissors, for the tailor
  scissors:r=>{for(let k=0;k<10;k++){r('#c3cad1',3+k,k,2,1);r('#c3cad1',13-k,k,2,1)}r('#2a2a30',8,8,2,2);
    for(const cx of[4,13])for(let y=10;y<18;y++)for(let x=cx-4;x<=cx+4;x++){const d=Math.hypot(x-cx,y-13.5);if(d<=3.6&&d>=2.2)r('#7d3c98',x,y)}},
  // an open book, for the book shop
  book:r=>{r('#5a3a26',0,5,18,11);r('#f4efe4',1,3,7,12);r('#f4efe4',10,3,7,12);r('#e0d8c4',7,4,1,11);r('#e0d8c4',10,4,1,11);r('#3a2a1a',8,3,2,13);
    for(let y=5;y<13;y+=2){r('#8a8070',2,y,5,1);r('#8a8070',11,y,5,1)}r('#c0392b',13,3,2,6)},
  // a film reel with a curl of film, for the cinema
  reel:r=>{for(let y=0;y<17;y++)for(let x=0;x<17;x++){const d=Math.hypot(x-8,y-8);if(d<=8.2)r(d>7.2?'#2a2a30':'#7a8088',x,y)}
    for(const[a,b]of[[7,2],[12,5],[11,11],[4,11],[2,5]])r('#1a1a1e',a,b,3,3);r('#c9a040',7,7,3,3);r('#2a2a30',8,8,1,1);r('#1a1a1e',13,14,5,2);r('#3a3a44',14,16,4,2)},
  // a little house, for the estate agent
  // a chair: a ladder back, a seat and legs
  chair:r=>{r('#7a5232',3,1,2,16);r('#7a5232',12,1,2,16);for(const y of[2,5,8])r('#8a6a45',5,y,7,2);r('#a07a50',2,10,13,3);r('#5a3d24',3,13,2,4);r('#5a3d24',12,13,2,4)},
  house:r=>{for(let k=0;k<8;k++)r('#2e6f9a',8-k,1+k,2+k*2,1);r('#1f4a6a',1,8,16,1);r('#f2ede0',3,9,12,9);r('#d8d0c0',3,9,12,1);r('#5b3a26',8,12,3,6);r('#bcd9ea',4,11,3,3);r('#bcd9ea',12,11,2,3);r('#7a4234',12,2,2,4)},
  // a fish on a hook, for the fishing shop
  fish:r=>{r('#9aa3ad',13,0,1,6);for(let x=12;x<15;x++)r('#9aa3ad',x,6,1,1);r('#9aa3ad',11,5,1,1);
    for(let y=8;y<16;y++)for(let x=1;x<15;x++){const dx=(x-7)/6,dy=(y-11.5)/3.4;if(dx*dx+dy*dy<=1)r(y<11?'#5b8fb9':'#a9d4e8',x,y)}
    for(let k=0;k<4;k++)r('#2e6f9a',13+k,10-k,1,3+k*2);r('#1a1a1e',3,10,1,1);r('#2e6f9a',5,8,1,7)},
  // a gold six-pointed star, for the police
  badge:r=>{for(let y=0;y<18;y++)for(let x=0;x<18;x++){const X=x-8.5,Y=y-8.5,a=Math.atan2(Y,X),d=Math.hypot(X,Y),rad=5+3.6*Math.pow(Math.abs(Math.cos(a*3)),3);if(d<=rad)r(d<4?'#e8c860':'#c9a040',x,y)}
    r('#8a6a20',7,7,4,4);r('#1f3a5f',8,8,2,2)},
  // a slice of pizza, for the pizzeria
  pizza:r=>{r('#d89a4a',1,1,16,3);r('#b8763a',1,3,16,1);for(let y=4;y<17;y++){const hw=Math.round((17-y)*.62);r('#f2c230',9-hw,y,hw*2,1)}for(const[x,y]of[[5,5],[10,7],[7,10]])r('#c0392b',x,y,3,3);r('#5a9a3a',12,5,2,1);r('#5a9a3a',6,13,2,1)},
  // a red cross on a white disc, for the doctor
  cross:r=>{for(let y=0;y<18;y++)for(let x=0;x<18;x++)if(Math.hypot(x-8.5,y-8.5)<=8.6)r('#f4f4f0',x,y);r('#c0392b',7,3,4,12);r('#c0392b',3,7,12,4);r('#e85a4a',7,3,1,12)}};
const ICONS={},iconArt=k=>ICONS[k]??=mk(18,18,ICON_ART[k]);
// ---- Neon logos for Frostholm's businesses (BLD nlogo): a picture of what each one does, bent out of neon tube, standing on the
// shop's name sign. One character per pixel ('.' is clear): a is the main tube, b the second colour.
const NEON_LOGO={
  // a music note, for the jazz club
  note:[['#3b8bff','#9fd0ff'],`
....aaaaaaaa
....a......a
....aaaaaaaa
....a......a
....a......a
....a......a
..aaa....aaa
.abba...abba
.abba...abba
..aa.....aa.`],
  // a space invader, for the arcade
  invader:[['#ff3bd0','#ffffff'],`
..a.....a..
...a...a...
..aaaaaaa..
.aabaaabaa.
aaaaaaaaaaa
a.aaaaaaa.a
a.a.....a.a
...aa.aa...`],
  // a television with its aerial, for the electronics store
  tv:[['#3bd0ff','#ff5fa8'],`
...a.....a...
....a...a....
.....a.a.....
aaaaaaaaaaaaa
a...........a
a.bbbbbbbbb.a
a.b.......b.a
a.b.......b.a
a.bbbbbbbbb.a
a...........a
aaaaaaaaaaaaa
.a.........a.`],
  // a coin with a dollar sign, for the bank
  coin:[['#3bd0ff','#b05fff'],`
...aaaaaa...
..a......a..
.a...b....a.
a...bbbb...a
a..b.b.....a
a...bbb....a
a....b.b...a
a..bbbb....a
.a...b....a.
..a......a..
...aaaaaa...`],
  // a spade from a deck of cards, for the casino
  spade:[['#ff3b5c','#ffd23a'],`
.....a.....
....aaa....
...aa.aa...
..aa...aa..
.aa.....aa.
aa.......aa
aa..bbb..aa
.aaa.b.aaa.
.....b.....
....bbb....`],
  // a cheeseburger, for Polar Burger
  burger:[['#ff5a3a','#ffd23a'],`
...aaaaaa...
.aa......aa.
a..b..b..b.a
aaaaaaaaaaaa
.bbbbbbbbbb.
aaaaaaaaaaaa
a..........a
.aaaaaaaaaa.`],
  // a shopping trolley, for Nordmart
  cart:[['#3bd0ff','#ffd23a'],`
aa...........
.a...........
.aaaaaaaaaaaa
.a.a..a..a..a
..a.a..a..a.a
..aaaaaaaaaaa
..a..........
..aaaaaaaaaa.
...bb....bb..
...bb....bb..`],
  // a star, for Hotel Aurora
  star:[['#ffd23a','#ff5fa8'],`
.....a.....
....aba....
aaaaabaaaaa
.abbbbbbba.
..abbbbba..
..abbabba..
.aba...aba.
.aa.....aa.`],
  // a fuel pump, for the fuel dock
  pump:[['#e0a100','#3bd0ff'],`
aaaaaa....
a....a.aa.
a.bb.a..a.
a.bb.a..a.
a....a..a.
a....aaaa.
a....a....
a....a....
aaaaaaa...`]};
// a neon logo's pixels, as [x, y, colour]; and its width and height
const NL={},neonLogo=k=>NL[k]??=(()=>{const[[a,b],art]=NEON_LOGO[k],rows=art.trim().split('\n'),px=[];rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch=='a'||ch=='b')px.push([x,y,ch=='a'?a:b])}));
  return{px,w:Math.max(...rows.map(r=>r.length)),h:rows.length,col:a}})();
// A projecting shop sign: the picture hangs on two short chains from a wrought-iron bracket bolted to the building near its
// corner, so it sticks out over the gap beside the shop. right: the side it sticks out on. Drawn 30 x 29: the wall plate is at
// x 0-3 (26-29 on the left), and the picture hangs at x 4-23 (6-25), 8 pixels down.
function signArt(k,right){const c=cnv(30,29),g=c.getContext('2d'),r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(right?x:30-x-a,y,a,b)};
  r(OUT,0,0,4,9);r('#3a3d44',1,1,2,7);r('#6b737c',1,1,1,7);r('#c3cad1',2,2,1,1);r('#c3cad1',2,6,1,1);
  r(OUT,3,1,22,3);r('#2b2f3a',3,2,22,1);r(OUT,23,0,4,4);r('#2b2f3a',24,1,2,2);r(SNOW,4,1,20,1);
  for(let k=0;k<6;k++){r(OUT,3+k,7-k,2,1);r('#2b2f3a',3+k,7-k,1,1)}r('#2b2f3a',9,3,3,1);
  for(const x of[7,20]){r('#3a3a44',x,4,1,1);r('#7d858e',x,5,1,1);r('#3a3a44',x,6,1,1);r('#7d858e',x,7,1,1)}
  g.drawImage(iconArt(k),right?4:6,8);return c}
// ---- Buildings. s is a BLD entry; dx is the door's column (or -1). Returns the picture and any animated bits.
// dx: the main door's column (or -1); more: the columns of any other doors (side or service entrances)
function bld2(w,h,s,dx,more=[]){
  const sd=parseInt(s.wall?.slice(1)||'0',16)%9973,W=w*T,H=h*T,c=cnv(W,H),g=c.getContext('2d'),an=[];
  const r=(col,x,y,a=1,b=1)=>{if(WMAP&&col in WMAP){col=WMAP[col];if(!col)return}g.fillStyle=col;g.fillRect(x|0,y|0,a|0,b|0)};let nt=null;
  const tall=s.kind=='tall',wh=tall?H-10:Math.max(2,Math.round(h*.45))*T,ry=H-wh,dk=shade(s.wall,-.25),lt=shade(s.wall,.15);
  const tex=s.tex||(s.deco=='hq'?'brick':s.kind=='gable'?'siding':'panel'),aw=s.deco=='bar'||s.deco=='shop'||!!s.awn;
  // wall + texture
  r(s.wall,0,ry,W,wh);
  if(tex=='siding')for(let y=ry+3;y<H;y+=3)r(shade(s.wall,-.12),0,y,W,1);
  if(tex=='brick')for(let y=ry;y<H;y+=4){r(shade(s.wall,.22),0,y,W,1);for(let x=((y/4|0)%2)*4;x<W;x+=8){r(shade(s.wall,.22),x,y,1,4);if(hash(x,y,19)>.7)r(shade(s.wall,-.1),x+1,y+1,7,3)}}
  if(tex=='panel'){for(let x=15;x<W;x+=16)r(shade(s.wall,-.15),x,ry,1,wh);for(let y=ry+20;y<H-4;y+=20)r(shade(s.wall,-.1),0,y,W,1)}
  if(tex=='metal')for(let x=0;x<W;x+=3){r(shade(s.wall,-.18),x,ry,1,wh);r(shade(s.wall,.12),x+1,ry,1,wh)}
  // wear (0..1): peeling paint showing the undercoat, damp (or rust) streaks running down from the eaves, and grime splashed up from the street
  if(s.wear){const k=s.wear,n=Math.round(W*wh/170*k);
    // blotchy, sun-and-salt-faded paint
    for(let y=ry;y<H-3;y++)for(let x=0;x<W;x++){const v=vnoise(x/7,y/5,sd+W+h*3);if(v>1-.45*k)r(v>1-.2*k?'rgba(70,60,50,.22)':'rgba(235,230,220,.16)',x,y)}
    for(let i=0;i<n;i++){const px=hash(i,1,sd+W+h)*W|0,py=ry+5+(hash(i,2,sd+W+h)*(wh-10)|0),pw=2+(hash(i,3,sd+W)*5|0),ph=1+(hash(i,4,sd+W)*3|0);
      r(shade(s.wall,-.4),px-1,py-1,pw+2,ph+2);r(s.under||shade(s.wall,.5),px,py,pw,ph)}
    const st=tex=='metal'?'rgba(140,70,30,.45)':'rgba(50,40,30,.28)';
    for(let x=2;x<W-2;x+=3)if(hash(x,5,sd+W)<k*.45)r(st,x,ry+2,hash(x,7,sd+W)>.6?2:1,4+(hash(x,6,sd+W)*wh*.6|0));
    for(let y=H-14;y<H-3;y++)r(`rgba(60,48,36,${((y-H+14)/11*.35*k).toFixed(3)})`,0,y,W,1)}
  r(lt,0,ry,1,wh);r(dk,W-2,ry,2,wh);
  if(s.kind=='gable'){r(s.trim,1,ry,2,wh);r(s.trim,W-3,ry,2,wh)}
  r('rgba(20,20,40,.28)',0,ry,W,3);
  // a neon tube along the roofline and down both corners
  if(s.tube){r(shade(s.tube,-.45),0,ry+1,W,1);r(s.tube,0,ry,W,1);r(shade(s.tube,.55),0,ry,W,1);r(s.tube,1,ry,1,wh-4);r(s.tube,W-2,ry,1,wh-4);
    for(let x=12;x<W;x+=24)an.push({t:'tube',x,y:ry,col:s.tube})}
  // awnings over shop fronts
  if(aw){const a1=s.awn||(s.deco=='bar'?'#c0392b':'#2e86c1');for(let x=0;x<W;x++){const col=(x>>2)&1?a1:'#f2f2f2';r(col,x,ry,1,7);if((x&3)==1||(x&3)==2)r(col,x,ry+7,1,1)}
    r('rgba(0,0,0,.18)',0,ry+5,W,2);r('rgba(20,20,40,.25)',0,ry+8,W,2)}
  // string lights swagged along under the eaves (or the awning)
  if(s.lights)for(let x=1;x<W-1;x++){const y=ry+(aw?11:4)+Math.round(Math.sin(Math.PI*(x%24)/24)*3);r('#3a3a44',x,y,1,1);
    if(x%6==3)an.push({t:'lbulb',x,y:y+1,c:s.lights[(x/6|0)%s.lights.length],k:x/6|0})}
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
  if(s.deco=='church'&&s.gothic)for(let i=0;i<w;i++)if(Math.abs(i*16+8-(W>>1))<20)skip.add(i);
  // mural: the front wall painted with a sunset over a snowy peak and pines, with a bird on top (in place of the windows)
  if(s.mural){const m=s.mural,top=ry+(aw?10:4),bot=H-5,mh=bot-top;for(let i=0;i<w;i++)if(!skip.has(i)){const x0=i*16+1,x1=i*16+15;
      for(let y=top;y<bot;y++){const f=(y-top)/mh;r(f<.3?m[0]:f<.55?m[1]:m[2],x0,y,x1-x0,1)}
      for(let x=x0;x<x1;x++){const pk=top+Math.round(mh*.25+Math.abs(((x+i*7)%28)-14)*mh*.04);r('#5a6a8a',x,pk,1,bot-pk);if(pk<top+mh*.4)r('#f2f2f2',x,pk,1,2)}
      for(let x=x0+2;x<x1-1;x+=5){const th=Math.round(mh*.35)+(hash(x,1,sd)*4|0);for(let k=0;k<th;k++){const hw=Math.max(0,Math.round(k/3));r('#1d4038',x-hw,bot-th+k,hw*2+1,1)}}
      for(let x=x0;x<x1;x+=2)r('#c9a040',x,top-1,1,1)}
    const bx=(W>>1)-3,by=top+3;r(OUT,bx,by,7,4);r(m[3]||'#2e86c1',bx+1,by+1,5,2);r(m[3]||'#2e86c1',bx+5,by,2,1);r('#ffd23a',bx+6,by+1,1,1);r('#ffd23a',bx+2,by+3,1,2);r('#ffd23a',bx+4,by+3,1,2)}
  // windows. On a worn building some are boarded up and some cracked; planter: a window box of flowers under each one.
  const win=(x,y,ww,hh,lit)=>{const wr=s.wear?hash(x,y,sd+W+31)/s.wear:9;if(wr<.75||s.dark)lit=false;const gl=lit?'#ffd98a':s.win;
    if(s.sh){r(s.sh,x-4,y-1,2,hh+2);r(s.sh,x+ww+2,y-1,2,hh+2)}
    r(shade(s.trim,-.35),x-2,y-2,ww+4,hh+4);r(s.trim,x-1,y-1,ww+2,hh+2);r(gl,x,y,ww,hh);r(shade(gl,-.22),x,y,ww,2);
    if(lit&&CYBING)an.push({t:'wlight',x:x+(ww>>1),y:y+(hh>>1)});
    if(lit)r('#fff1c8',x+1,y+2,ww-2,1);else{r('rgba(255,255,255,.55)',x+ww-3,y+2,1,1);r('rgba(255,255,255,.55)',x+ww-4,y+3,1,1);r('rgba(255,255,255,.55)',x+ww-5,y+4,1,1)}
    r(s.trim,x+(ww>>1),y,1,hh);r(s.trim,x,y+(hh>>1),ww,1);r(SNOW,x-2,y+hh+1,ww+4,1);r('rgba(0,0,0,.2)',x-1,y+hh+2,ww+2,1);
    if(wr<.42){r('#2a241e',x,y,ww,hh);for(const py of[y+1,y+hh-4,y+(hh>>1)-1]){r('#7d6a50',x-2,py,ww+4,3);r('#957f60',x-2,py,ww+4,1);r('#3a3a44',x-1,py+1,1,1);r('#3a3a44',x+ww,py+1,1,1)}}
    else if(wr<.75){const cx=x+(hash(x,y,sd+W+32)*(ww-2)|0)+1;pline(r,cx,y,cx-2,y+hh-1,'#f4f4f4');pline(r,cx,y+3,cx+3,y+5,'#f4f4f4')}
    if(s.planter){r('#5a3d2a',x-2,y+hh+2,ww+4,4);r('#7a5232',x-2,y+hh+2,ww+4,1);
      for(let k=x-1;k<x+ww+1;k+=2){r('#2b5c4b',k,y+hh,2,2);r(s.planter[(k>>1)%s.planter.length],k,y+hh-1+((k>>1)&1),1,1)}}};
  if(s.glass){
    // a curtain wall: rows of tinted glass panes between steel mullions, with a diagonal sheen; a few offices have the lights on
    for(let i=0;i<w;i++){if(skip.has(i))continue;for(let y=tall?14:ry+(aw?12:6);y+10<H-5;y+=13){const x=i*16+2,lit=!s.dark&&hash(i,y,w*h+7)>.82;if(lit&&CYBING)an.push({t:'wlight',x:x+6,y:y+5});
      r(shade(s.trim,-.3),x-1,y-1,14,12);for(let yy=0;yy<10;yy++)for(let xx=0;xx<12;xx++){const d=((x+xx)+(y+yy)*.6|0)%26;
        r(lit?(yy<2?'#ffe9b0':'#ffd98a'):d<3?shade(s.win,.45):yy<3?shade(s.win,.15):s.win,x+xx,y+yy)}r(SNOW,x-1,y+10,14,1)}}}
  else if(tall){for(let y=16;y<H-T-8;y+=22)for(let x=8;x<W-12;x+=18){win(x,y,12,13,hash(x,y,5)>.62);
      r(shade(s.trim,-.3),x-3,y+15,18,1);for(let k=x-3;k<x+15;k+=3)r(shade(s.trim,-.3),k,y+12,1,3);r(SNOW,x-3,y+14,18,1)}}
  // gothic: a tall pointed lancet in each bay, in a moulded stone surround; stained glass (s.stained) or leaded clear panes,
  // some lit from within, with snow on the sill
  else if(s.gothic)for(let i=0;i<w;i++){if(skip.has(i))continue;const x=i*16+4,top=ry+(aw?12:5),bot=H-6,lit=hash(i,w,h*3)>.55;
    for(let y=top-1;y<bot+1;y++){const k=y-top,hw=k<5?Math.round(Math.sqrt(Math.max(0,k+1)/6)*5):5;r(shade(s.trim,-.3),x+4-hw,y,hw*2,1)}
    for(let y=top;y<bot;y++){const k=y-top,hw=k<5?Math.round(Math.sqrt((k+1)/6)*4):4;for(let xx=x+4-hw;xx<x+4+hw;xx++){
      const lead=xx==x+4||(k>4&&(k-5)%6==0);let c=s.stained?['#8a2a4a','#2a4a8a','#c9a040','#3a6a4a'][((xx>>1)+(k/6|0)+i)%4]:lit?'#ffd98a':s.win;
      if(!s.stained&&!lead&&((xx+k)%4==0))c=shade(c,-.18);if(s.stained&&lit)c=shade(c,.25);r(lead?'#2a2a33':c,xx,y)}}
    r(shade(s.trim,-.3),x-1,bot,10,2);r(SNOW,x-1,bot,10,1)}
  else if(!s.mural)for(let y=ry+(aw?12:8);y+9<H-6;y+=20)for(let i=0;i<w;i++)if(!skip.has(i))win(i*16+3,y,10,9,hash(i,y,w*h)>.6);
  // gothic: stepped stone buttresses between the bays (not beside a door), each topped by a little pinnacle at the eaves
  if(s.gothic)for(let i=1;i<w;i++){if([dx,...more].some(d=>d>=0&&(i==d||i==d+1)))continue;if(s.deco=='church'&&Math.abs(i*16-(W>>1))<22)continue;
    const x=i*16-2,mid=ry+((H-ry)>>1),face=shade(s.wall,-.08),hi=shade(s.wall,.2),lo=shade(s.wall,-.35);
    r(OUT,x-1,ry-1,6,mid-ry+1);r(face,x,ry,4,mid-ry);r(hi,x,ry,1,mid-ry);r(lo,x+3,ry,1,mid-ry);
    r(OUT,x-2,mid-1,8,H-mid-2);r(face,x-1,mid,6,H-mid-3);r(hi,x-1,mid,1,H-mid-3);r(lo,x+4,mid,1,H-mid-3);r(SNOW,x-2,mid-1,8,1);
    for(let k=0;k<7;k++){const hw=Math.max(0,3-Math.round(k/2.4));r(k<2?SNOW:face,x+2-hw,ry-1-k,hw*2,1)}r(OUT,x+1,ry-9,2,2)}
  // foundation and snow banked against it
  r('#6d727a',0,H-3,W,3);r('#8a9099',0,H-3,W,1);
  for(let x=0;x<W;x++){const d=vnoise(x/5,0,w*7+h);if(d>.55){const t=d>.75?3:2;r(SNOW,x,H-t,1,t);r(SNOWD,x,H-1,1,1)}}
  // door
  for(const di of[dx,...more])if(di>=0){const X=di*16+2;r(shade(s.trim,-.35),X-1,H-18,14,15);r(s.trim,X,H-17,12,14);r('#5b3a26',X+1,H-16,10,13);
    [[2,-15],[7,-15],[2,-9],[7,-9]].forEach(([a,b])=>r('#6e4930',X+a,H+b,3,4));r('#e8c33a',X+9,H-9,1,1);
    r('#8a9099',X-1,H-3,14,3);r('#a9b0b8',X-1,H-3,14,1);r('#3a3a44',X+13,H-15,1,1);r('#ffd36b',X+13,H-14,2,3);r('#fff1c8',X+13,H-14,1,1);
    if(s.gothic)for(let k=0;k<7;k++){const hw=Math.round(Math.sqrt((k+1)/7)*7);r(shade(s.trim,-.35),X+6-hw,H-25+k,hw*2,1);if(k>1)r('#5b3a26',X+7-hw,H-25+k,hw*2-2,1)}}
  // roof
  if(tall){r(s.roof,0,0,W,10);r(SNOW,0,0,W,4);r(SNOWD,0,3,W,1);r(shade(s.roof,-.3),0,8,W,2)}
  else if(s.kind=='gable'){const rd=shade(s.roof,-.25);r(s.roof,0,0,W,ry);
    if(tex=='metal')for(let x=1;x<W;x+=3){r(rd,x,0,1,ry);r(shade(s.roof,.12),x+1,0,1,ry)}
    else for(let y=3;y<ry;y+=4){r(rd,0,y,W,1);for(let x=((y>>2)&1)*3;x<W;x+=6)r(rd,x,y-3,1,3)}
    for(let x=0;x<W;x++){const d=Math.round(ry*.45+(vnoise(x/6,0,w*13+h)-.5)*8);r(SNOW,x,0,1,d);r(SNOWD,x,d-2,1,2);if(hash(x,3,w)>.8)r('#ffffff',x,1,1,1)}
    r(rd,0,ry-2,W,2);r(OUT,0,ry-1,W,1);
    if(s.gothic)for(let x=3;x<W-3;x+=5){r('#3a3a44',x,0,1,4);r('#3a3a44',x-1,1,3,1)}
    for(let x=2;x<W-2;x++)if(hash(x,ry,w+h)>.82){r('#dff1fb',x,ry,1,1+(hash(x,1,9)*3|0));r('#ffffff',x,ry,1,1)}
    // a worn roof is patched with odd boards and sheets of tin, and its gutter sags
    if(s.wear){for(let i=0;i<Math.round(W/22*s.wear)+1;i++){const pw=6+(hash(i,1,sd+W+5)*8|0),px=hash(i,2,sd+W+5)*(W-pw)|0,py=Math.round(ry*.5)+(hash(i,3,sd+W+5)*(ry*.5-6)|0);
        const pc=hash(i,4,sd+W)>.5?'#8a5a3a':shade(s.roof,.25);r(OUT,px-1,py-1,pw+2,6);r(pc,px,py,pw,4);r(shade(pc,.2),px,py,pw,1);r('#3a3a44',px+1,py+1,1,1);r('#3a3a44',px+pw-2,py+1,1,1)}
      for(let x=0;x<W;x++){const sg=Math.round(Math.sin(Math.PI*x/W)*2*s.wear);r('#5a5f68',x,ry-1+sg,1,1)}}}
  else{r(s.roof,0,0,W,ry);r(shade(s.roof,.1),2,2,W-4,ry-8);
    for(let y=2;y<ry-6;y++)for(let x=2;x<W-2;x++){const v=vnoise(x/9,y/9,w*5+h);r(y<4||x<4?SNOWD:v<.3?'#e4ecf3':SNOW,x,y)}
    // a billboard standing on the roof, facing the street
    if(s.bill&&ry>=30){const B=s.bill,tw=Math.max(...B.t.map(l=>l.length*4-1)),bw=Math.min(W-8,tw+12),bx=(W-bw)>>1,bh=B.t.length*7+3,by=Math.max(1,ry-9-bh);nt=by-1;
      for(const lx of[bx+6,bx+bw-8]){r(OUT,lx-1,by+bh,4,ry-6-by-bh);r('#5a5f68',lx,by+bh,2,ry-6-by-bh)}
      r(OUT,bx-1,by-1,bw+2,bh+2);r(B.bg,bx,by,bw,bh);r(shade(B.bg,.25),bx,by,bw,1);r(SNOW,bx-1,by-1,bw+2,1);
      B.t.forEach((l,i)=>ptext(r,l,bx+((bw-l.length*4+1)>>1),by+3+i*7,B.fg));an.push({t:'blink',x:bx+1,y:by-3,c:'#ffe08a'},{t:'blink',x:bx+bw-3,y:by-3,c:'#ffe08a'})}
    for(let i=0;i<Math.max(1,w/4|0);i++){const x=8+i*(W-24)/Math.max(1,(w/4|0)-1||1)|0,y=ry>30?ry-20:6;if(s.deco=='plant'&&i<2||s.bill)continue;
      r(OUT,x-1,y-1,9,8);r('#9aa3ad',x,y,7,6);r('#7d8690',x,y+4,7,2);r(SNOW,x,y,7,2)}
    r(s.trim,0,0,W,2);r(s.trim,0,0,2,ry);r(s.trim,W-2,0,2,ry);r(SNOW,0,0,W,1);
    r(s.trim,0,ry-6,W,6);r(shade(s.trim,-.25),0,ry-2,W,2);r(SNOW,0,ry-6,W,1);
    // a worn flat roof: grubby slush where the snow has half melted, and rust running down the parapet
    if(s.wear){for(let y=4;y<ry-6;y++)for(let x=4;x<W-2;x++)if(vnoise(x/7,y/7,w*3+h)>1-.35*s.wear)r(vnoise(x/3,y/3,9)>.5?'#9a958a':'#aaa69c',x,y);
      for(let x=3;x<W-3;x+=5)if(hash(x,ry,sd+W)<s.wear*.5)r('rgba(140,70,30,.4)',x,ry-6,1,4+(hash(x,1,sd+W)*4|0))}}
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
  if(s.deco=='bar'){const bx=(W>>1)-13,by=ry-17;nt=by-1;r(OUT,bx-1,by-1,28,11);r('#1a1520',bx,by,26,9);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+21,by+9,1,6);r(SNOW,bx-1,by-1,28,1);
    an.push({t:'neon',x:bx+7,y:by+2,s:'BAR',fl:s.wear?1:0})}
  if(s.deco=='shop'){const bx=(W>>1)-14,by=ry-17;nt=by-1;r(OUT,bx-1,by-1,30,11);r('#f2f2f2',bx,by,28,9);r(SNOW,bx-1,by-1,30,1);r('#3a3a44',bx+4,by+9,1,6);r('#3a3a44',bx+23,by+9,1,6);
    ptext(r,'FISH',bx+2,by+2,'#2e6f9a');r('#8fa6b8',bx+19,by+3,5,3);r('#8fa6b8',bx+24,by+2,2,5);r(OUT,bx+20,by+4,1,1)}
  // the sign over the front. signk: 'wood' (a hand-painted board), 'brass' (an engraved plaque), 'neon' (glowing letters in signc
  // on a dark board), or a plain printed board. On a worn building letters have fallen off and the board hangs crooked.
  if(s.sign){const tw=s.sign.length*4-1,bw=tw+6,bx=(W-bw)>>1,by=Math.max(1,ry-15),k=s.signk;nt=by-1;
    const txt=s.wear?[...s.sign].map((ch,i)=>hash(i,9,sd+W)<s.wear*.25?' ':ch).join(''):s.sign;
    const bg=k=='wood'?'#7a5232':k=='brass'?'#c9a040':k=='neon'?'#1a1520':'#f4f1e8',fg=k=='wood'?'#f2e6c8':k=='brass'?'#3a2a14':s.signc||'#2b2f3a';
    const sc=cnv(bw+2,11),sg=sc.getContext('2d'),sr=(col,x,y,a=1,b=1)=>{sg.fillStyle=col;sg.fillRect(x,y,a,b)};
    sr(OUT,0,0,bw+2,11);sr(bg,1,1,bw,9);if(k=='wood'){for(let y=4;y<10;y+=3)sr(shade(bg,-.15),1,y,bw,1);sr(shade(bg,.2),1,1,bw,1)}
    if(k=='brass'){sr(shade(bg,.35),1,1,bw,1);sr(shade(bg,-.3),1,9,bw,1)}sr(SNOW,0,0,bw+2,1);if(k!='neon')ptext(sr,txt,4,3,fg);
    if(by+10<ry){r('#3a3a44',bx+3,by+9,1,ry-by-9);r('#3a3a44',bx+bw-4,by+9,1,ry-by-9)}
    const tilt=s.wear?(hash(3,3,sd+W)-.5)*s.wear*.14:0;for(let i=0;i<bw+2;i++)g.drawImage(sc,i,0,1,11,bx-1+i,by-1+Math.round(i*tilt),1,11);
    if(k=='neon')an.push({t:'neon',x:bx+3,y:by+2,s:txt,col:s.signc,fl:s.wear?1:0})}
  // blade: a tall neon sign down the left of the front, one letter above the next
  if(s.blade){const[t,col]=s.blade,bh=t.length*6+3,by=ry+4;r(OUT,3,by-1,9,bh+2);r('#1a1520',4,by,7,bh);r(SNOW,3,by-1,9,1);r('#5a5f68',12,by+3,2,1);r('#5a5f68',12,by+bh-4,2,1);
    an.push({t:'neon',x:6,y:by+2,s:t,col,v:1})}
  // marquee: a cinema's lit board over the entrance, ringed with chasing bulbs
  if(s.marquee&&dx>=0){const mw=s.marquee.length*4+9,mx=Math.max(1,Math.min(W-mw-1,dx*16+8-(mw>>1))),my=H-35;
    r(OUT,mx-1,my-1,mw+2,14);r('#f4f1e8',mx,my,mw,12);r('#c9a040',mx,my,mw,1);r('#c9a040',mx,my+11,mw,1);ptext(r,s.marquee,mx+5,my+4,'#2b2f3a');
    for(let x=mx+1;x<mx+mw-1;x+=3){an.push({t:'bulb',x,y:my-1});an.push({t:'bulb',x,y:my+12})}}
  // columns between the windows (palace-style, in the colour given)
  if(s.cols)for(let i=1;i<w;i++){if(skip.has(i)||skip.has(i-1))continue;const x=i*16-2;r(OUT,x-1,ry+2,6,wh-5);r(s.cols,x,ry+2,4,wh-5);r(shade(s.cols,-.15),x+3,ry+2,1,wh-5);r('#c9a040',x-1,ry+2,6,2);r('#c9a040',x-1,H-5,6,2)}
  if(s.deco=='casino'){const tw=23,bx=(W-tw-8)>>1,by=Math.max(1,ry-18);nt=by-1;r(OUT,bx-1,by-1,tw+10,13);r('#1a1020',bx,by,tw+8,11);an.push({t:'neon',x:bx+4,y:by+3,s:'CASINO',col:'#ffd23a'});
    for(let x=bx;x<bx+tw+8;x+=3){an.push({t:'bulb',x,y:by-1});an.push({t:'bulb',x,y:by+11})}
    if(dx>=0){const X=dx*16;r('#a8323a',X-6,H-4,28,4);r('#c94a50',X-6,H-4,28,1);r('#c9a040',X-8,H-24,32,3)}}
  if(s.deco=='palace'){for(let i=1;i<w;i++){const x=i*16-2;r(OUT,x-1,ry+2,6,wh-5);r('#fff8e8',x,ry+2,4,wh-5);r('#d8ccb0',x+3,ry+2,1,wh-5);r('#c9a040',x-1,ry+2,6,2)}
    if(dx>=0){const X=dx*16;r('#d8d2c0',X-10,H-3,36,3);r('#e8e2d4',X-10,H-3,36,1);r(OUT,X-1,ry+3,18,8);r('#c9a040',X,ry+4,16,6);r('#7d3c98',X+5,ry+5,6,4);r('#ffd23a',X+6,ry+5,1,1);r('#ffd23a',X+9,ry+5,1,1)}
    const cx=W>>1;r(OUT,cx-13,0,26,ry-5);r('#4a6a9a',cx-12,1,24,ry-7);r('#6a8aba',cx-12,1,6,ry-7);r(SNOW,cx-12,1,24,3);r('#c9a040',cx-1,0,3,2);
    for(const fx of[8,W-10]){r('#d5d9de',fx,0,1,ry-6);an.push({t:'flag',x:fx+1,y:1,royal:1})}}
  if(s.deco=='church'){const cx=W>>1;r(OUT,cx-11,0,22,ry+1);r(s.wall,cx-10,0,20,ry);r(shade(s.wall,-.15),cx+6,0,4,ry);
    for(let y=3;y<ry;y+=4)r(shade(s.wall,.2),cx-10,y,20,1);
    if(s.gothic){for(const bx of[cx-7,cx+2])for(let y=5;y<17;y++){const k=y-5,hw=k<3?Math.round(Math.sqrt((k+1)/4)*2.5):3;r('#2a2a33',bx+3-hw,y,hw*2,1);if(k>3&&k%3==1)r(shade(s.wall,-.2),bx,y,6,1)}
      r(SNOW,cx-11,0,22,2);const ry0=ry+11;r(OUT,cx-9,ry0-9,18,18);for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const d=Math.hypot(x,y);if(d>8.4)continue;
        const a=Math.atan2(y,x),k=((a+Math.PI)/(Math.PI/4))|0;r(d>7.3?shade(s.wall,-.3):d<2?'#e0c060':(Math.abs(x)<1||Math.abs(y)<1||Math.abs(Math.abs(x)-Math.abs(y))<1||d>6.3)?'#2a2a33':k%2?'#8a2a4a':'#2a4a8a',cx+x,ry0+y)}}
    else{r('#2a2a33',cx-4,4,8,10);r('#c9a040',cx-1,5,2,8);r('#c9a040',cx-3,7,6,2);r(SNOW,cx-11,0,22,2);
    r(OUT,cx-7,ry+3,14,14);r('#5a3a8a',cx-6,ry+4,12,12);r('#c9a0e0',cx-4,ry+6,8,8);r('#e0c060',cx-1,ry+4,2,12);r('#e0c060',cx-6,ry+9,12,2)}
    r(OUT,cx-9,H-21,18,19);r('#5a3a26',cx-8,H-20,16,18);r('#6e4930',cx-8,H-20,7,18);r('#3a2618',cx,H-20,1,18);r('#c9a040',cx-3,H-11,1,2);r('#c9a040',cx+2,H-11,1,2);
    if(s.gothic)for(let k=0;k<9;k++){const hw=Math.round(Math.sqrt((k+1)/9)*10);r(OUT,cx-hw,H-30+k,hw*2,1);if(k>0)r(shade(s.wall,-.15),cx-hw+1,H-30+k,hw*2-2,1);if(k>2)r('#5a3a26',cx-hw+3,H-30+k,hw*2-6,1)}
    r('#a9b0b8',cx-12,H-3,24,3)}
  if(s.deco=='hut'){const X=18;r(OUT,X-1,H-18,14,15);r('#7d858e',X,H-17,12,14);r('#9aa3ad',X,H-17,2,14);for(let y=H-14;y<H-4;y+=3)r('#6b737c',X+3,y,6,1);r('#e8c33a',X+9,H-10,2,1);
    const tx=3*16+3;r(OUT,tx-1,ry+5,12,11);r('#e0a100',tx,ry+6,10,9);r('#2b2f3a',tx+4,ry+8,2,4);r('#2b2f3a',tx+4,ry+13,2,1);
    r('#5a5f68',W-14,0,1,ry-6);r('#5a5f68',W-17,3,7,1);r('#5a5f68',W-16,6,5,1);r(OUT,10,4,10,7);r('#e8ecef',11,5,8,5);r('#b9c0c7',15,5,4,5);an.push({t:'blink',x:W-14,y:-1})}
  r(OUT,0,0,W,1);r(OUT,0,0,1,H);r(OUT,W-1,0,1,H);
  return{c,an,ry,nt:nt??ry-8}}

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
// the farm's crops: a pair of cabbages, a row of wheat, potato plants on their ridge, a pair of pumpkins
cabbage:[11,r=>{r('#4a3020',0,8,16,3);r('#6b4a2e',0,8,16,1);for(const x of[0,8]){r('#2e5a26',x,3,8,6);r('#3e7a3a',x+1,2,6,7);r('#5a9a4a',x,4,1,3);r('#5a9a4a',x+7,4,1,3);r('#9cc87a',x+2,3,4,4);r('#c8e8a0',x+3,3,2,2);r('#6a9a4a',x+4,5,1,2);r('#2e5a26',x+2,7,4,1)}}],
wheat:[16,r=>{r('#4a3020',0,13,16,3);r('#6b4a2e',0,13,16,1);for(let x=0;x<16;x+=2){const t=1+((x*7)%5),lean=((x*5)%3)-1;r('#a8862a',x,t+4,1,13-t-4+1);r('#c9a040',x,t+4,1,2);r('#e8c86a',x+(lean>0?1:0),t,1,4);r('#f4dc8a',x+(lean>0?1:0),t,1,1);r('#b8963a',x+(lean>0?1:0),t+3,1,1)}for(let x=1;x<16;x+=4)r('#8a7a3a',x,9,1,4)}],
potato:[11,r=>{r('#4a3020',0,7,16,4);r('#6b4a2e',1,6,14,2);r('#7a5636',3,6,10,1);for(const x of[1,6,11]){r('#2e5a26',x,2,5,5);r('#4a8a3a',x,1,4,4);r('#6aaa4a',x+1,1,2,2);r('#2e5a26',x+2,4,1,3)}r('#f4f4f0',3,1,1,1);r('#c8a8e0',8,0,1,1);r('#f4f4f0',13,1,1,1);r('#e8c840',8,1,1,1)}],
pumpkin:[11,r=>{r('#4a3020',0,8,16,3);r('#6b4a2e',0,8,16,1);r('#3e7a3a',0,6,16,1);r('#4a8a3a',2,4,3,2);r('#4a8a3a',12,3,3,2);r('#6aaa4a',3,4,1,1);for(const[x,w]of[[1,7],[9,6]]){r('#c0661e',x,3,w,6);r('#e8964a',x+1,3,w-2,5);for(let k=x+1;k<x+w-1;k+=2)r('#c0661e',k,3,1,6);r('#f4b06a',x+1,4,1,2);r('#5a3e1e',x+(w>>1),1,1,3)}}],
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
// A prop's sprite is 16 pixels wide unless its entry gives a width (PA[k][2]): a wide one covers that many tiles, centred on its own tile.
const PCACHE={},propArt=k=>PCACHE[k+(WMAP?'|'+WXID:'')]??=(k=='rock'?rocksNow()[1]:mk(PA[k][2]||16,PA[k][0],PA[k][1])),propSpan=k=>Math.round((PA[k]?.[2]||16)/16);

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
function derrickArt(w,h,dx=-1){const W=w*16,H=h*16+DER_UP,c=cnv(W,H),g=c.getContext('2d'),r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a,b)};
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
  // the door into the drill floor: a steel door in a frame striped in hazard yellow and black
  if(dx>=0){const X=dx*16+3;for(let y=H-17;y<H-2;y++)r(((y>>1)&1)?'#e0a100':'#2b2f3a',X-1,y,12,1);r('#3a3d44',X+1,H-15,8,13);r('#5a5f68',X+1,H-15,8,1);r('#2a2a30',X+2,H-12,6,3);r('#c9ced4',X+7,H-8,1,2)}
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
// A newsstand kiosk: a blue roof over a hatch stacked with newspapers, with racks of magazines across the front. Drawn 14 pixels taller than its tiles.
// s (its BLD entry) can give the roof colour (roof); wear makes it a tired one: dirty paint, rust streaks, a letter gone from its sign.
function kioskArt(w,h,s={}){const W=w*16,H=h*16+14,rf=s.roof||'#2e6f9a',wr=s.wear;return mk(W,H,r=>{
  r(wr?'#d8ccb0':'#efe6cf',2,6,W-4,H-9);r(wr?'#bfb294':'#d8d0bc',W-5,6,3,H-9);r('#5a5f68',1,H-3,W-2,3);
  r(rf,0,2,W,5);r(shade(rf,.18),0,2,W,1);r(SNOW,0,1,W,2);for(let x=1;x<W;x+=4)r(shade(rf,-.3),x,6,2,1);
  r(wr?'#e2d8c0':'#f4f1e8',(W>>1)-9,8,18,7);ptext(r,wr?'NE S':'NEWS',(W>>1)-7,9,rf);
  if(wr){for(let k=0;k<26;k++){const x=2+(hash(k,1,W+70)*(W-4)|0),y=6+(hash(k,2,W+70)*(H-12)|0);r(hash(k,3,70)>.5?'#a89878':'#8a7a62',x,y,hash(k,4,70)>.7?2:1,1)}
    for(const x of[4,W-7])r('rgba(140,70,30,.45)',x,7,1,9);r('#6b5a48',W-9,4,5,2)}
  r('#3a2a20',4,16,W-8,9);r('#ffd98a',5,17,W-10,2);r('#a8794c',2,25,W-4,2);r('#c49565',2,25,W-4,1);
  for(let x=5;x<W-6;x+=5){r('#f4f4f0',x,22,4,3);r('#9aa3ad',x+1,23,2,1)}
  for(let x=4;x<W-4;x+=4)for(const y of[29,35]){r(['#c0392b','#2e86c1','#e0a100','#2e9d57','#7d3c98'][(x+y)%5],x,y,3,4);r('#f4f4f0',x,y+1,3,1)}})}
// A hot dog cart: a steel cart on two wheels under a striped umbrella. Drawn 14 pixels taller than its tiles.
// s (its BLD entry) can give the cart's colour (col), the umbrella's two stripes (um) and the word painted on its side (txt).
function cartArt(w,h,s={}){const W=w*16,H=h*16+14,cc=s.col||'#c0392b',um=s.um||['#e0a100','#c0392b'],txt=s.txt||'HOT';return mk(W,H,r=>{
  const cx=W>>1;r('#9aa3ad',cx-1,8,2,H-26);
  for(let y=0;y<9;y++){const hw=Math.round(3+y*(W/2-4)/8);for(let x=cx-hw;x<cx+hw;x++)r(y<1?SNOW:((x-cx+40)>>2)&1?um[0]:um[1],x,y+1)}
  r('#c9ced4',3,H-22,W-6,3);r('#e8ecef',3,H-22,W-6,1);r(cc,3,H-19,W-6,11);r(shade(cc,.15),3,H-19,W-6,1);r(shade(cc,-.3),3,H-9,W-6,1);
  ptext(r,txt,cx-((txt.length*4-1)>>1),H-17,'#ffd23a');r('#e0a100',5,H-12,W-10,2);r('#5a5f68',W-3,H-17,3,1);
  for(const x of[6,W-14]){r('#1a1a1e',x,H-8,8,7);r('#9aa3ad',x+3,H-5,2,2)}})}
// The circus big top: a cone of red and cream stripes over a scalloped yellow valance and striped walls, with the entrance at
// door column dx and a flagpole on top. Drawn 20 pixels taller than its tiles.
function bigtopArt(w,h,dx){const W=w*16,H=h*16+20,cx=W>>1,ry=Math.round(H*.48);return mk(W,H,r=>{
  r('#5a3d2a',cx,0,1,8);
  for(let y=6;y<ry;y++){const hw=Math.max(1,Math.round((W/2)*(y-6)/(ry-6)));for(let x=cx-hw;x<cx+hw;x++){const k=Math.floor((x-cx)/hw*6+6);
    let col=k&1?'#f2e6c8':'#c0392b';if(y<10+(x%3))col=y<9?'#ffffff':shade(col,.35);r(col,x,y)}}
  for(let y=ry;y<H-1;y++)for(let x=0;x<W;x++)r(((x/6)|0)&1?'#f2e6c8':'#b5302a',x,y);
  for(let x=0;x<W;x++){const d=Math.round(4-Math.abs((x%8)-3.5));r('#e0a100',x,ry,1,d);r('#a8862a',x,ry+d,1,1)}
  const X=dx*16+8;for(let y=0;y<20;y++){const hw=Math.round(4+y*.3);r(y<2?'#a8862a':'#2a1a20',X-hw,H-21+y,hw*2,1)}
  r('#f2e6c8',X-11,H-21,4,20);r('#f2e6c8',X+7,H-21,4,20);r('#e0a100',X-12,H-22,24,2)})}
// A painted circus caravan: a curved roof with a stovepipe, a round window, a door with steps, and big spoked wheels. c: its
// colour (col) and trim. Drawn 10 pixels taller than its tiles.
function wagonArt(w,h,c){const W=w*16,H=h*16+10,cx=W>>1;return mk(W,H,r=>{
  for(let x=1;x<W-1;x++){const t=Math.round(((x-cx)/(W/2))**2*5)+2;r(shade(c.col,-.3),x,t,1,9-t);r(SNOW,x,t,1,2)}
  r(c.col,2,9,W-4,H-20);r(shade(c.col,.2),2,9,W-4,1);r(c.trim,2,10,W-4,1);r(c.trim,2,H-13,W-4,2);
  for(let x=5;x<W-5;x+=6)r(c.trim,x,H-16,2,2);
  r(c.trim,5,13,9,9);r('#ffd98a',6,14,7,7);r(c.trim,9,14,1,7);r(c.trim,6,17,7,1);
  r(shade(c.trim,-.4),cx-6,H-30,12,19);r('#5a3a26',cx-5,H-29,10,18);r('#c9a040',cx+2,H-20,1,2);r('#7a5232',cx-6,H-11,12,2);r('#7a5232',cx-5,H-9,10,2);
  r('#3a3d44',W-12,0,3,6);r('#5a5f68',W-12,0,1,6);
  for(const wx of[8,W-9])for(let a=0;a<16;a++){const an=a/16*6.283;r('#4a3222',Math.round(wx+Math.cos(an)*5),Math.round(H-7+Math.sin(an)*5),1,1);if(a%4==0)pline(r,wx,H-7,Math.round(wx+Math.cos(an)*5),Math.round(H-7+Math.sin(an)*5),'#7a5232')}})}
// ---- Gothic Eastbrook (the ?gothic proof of concept). A building is a dressed-stone front split into bays by buttresses, a steep
// slate gable with an iron finial over each bay, a tall lancet window of stained glass in each (lit crimson and amber, or dark),
// an arched door between two candles, and optionally a bell tower, a rose window, crimson banners and a carved sign. It rises
// GEXT pixels above its footprint. Returns the picture, its animations and its light sources (all relative to the picture).
// ---- The drill floor's machines (furniture labelled for them): the rotary table with the drill pipe rising out of it, a mud
// pump with its pistons and gauge, the drawworks drum wound with cable, a yellow generator with a smoking exhaust, the driller's
// console of dials, buttons and levers, and a rack of drill pipe seen end on. All of it filthy with oil.
function machineArt(l,W,H){const oil=(r,n,sd)=>{for(let i=0;i<n;i++){const x=hash(i,1,sd)*W|0,y=hash(i,2,sd)*H|0;r('#141210',x,y,2+(hash(i,3,sd)*4|0),1+(hash(i,4,sd)*2|0))}};
  if(/rotary table/.test(l)){const oy=30,TT=H+oy,cx=W>>1,cy=oy+(H>>1);return{oy,c:mk(W,TT,r=>{
    r('#2b2f3a',0,oy,W,H);r('#3a3d44',2,oy+2,W-4,H-4);for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++){const d=Math.hypot(x,y);if(d<=12&&d>9)r('#7d858e',cx+x,cy+y);else if(d<=9&&d>4)r('#5a5f68',cx+x,cy+y)}
    r('#141210',cx-4,cy-4,8,8);r('#9aa3ad',cx-3,0,6,cy);r('#c9ced4',cx-3,0,1,cy);for(let y=4;y<cy;y+=9)r('#6b737c',cx-4,y,8,2);
    r('#e0a100',0,oy,W,2);for(let x=0;x<W;x+=6)r('#2b2f3a',x,oy,3,2);oil(r,10,61)})}}
  if(/mud pump/.test(l)){const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    r('#2e4a3e',0,oy,W,H);r('#3e5a4a',1,oy+1,W-2,H-6);r('#4f6b5a',1,oy+1,W-2,2);
    for(let k=0;k<3;k++){const x=4+k*14;r('#7a8088',x,0,8,oy+10);r('#9aa3ad',x,0,2,oy+10);r('#2a2a30',x,oy+10,8,2)}
    r('#8a5a2a',0,oy+H-8,W,4);r('#c08040',0,oy+H-8,W,1);for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(Math.hypot(x,y)<=3.3)r(Math.hypot(x,y)>2.4?'#2a2a30':'#f4f4f0',W-9+x,oy+8+y);r('#c0392b',W-9,oy+6,1,3);oil(r,8,62)})}}
  if(/drawworks/.test(l)){const oy=10,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    r('#e0a100',0,oy,W,H);r('#b88400',0,oy+H-3,W,3);r('#3a3d44',6,oy-6,W-12,H);for(let y=oy-5;y<oy+H-2;y+=2)r('#2a2a30',7,y,W-14,1);r('#9aa3ad',7,oy-5,W-14,1);
    r('#2a2a30',0,oy+3,6,6);r('#2a2a30',W-6,oy+3,6,6);r('#5a5f68',1,oy+4,4,4);r('#5a5f68',W-5,oy+4,4,4);oil(r,6,63)})}}
  if(/generator/.test(l)){const oy=10,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    r('#e0a100',0,oy,W,H);r('#ffc94a',0,oy,W,2);r('#b88400',0,oy+H-3,W,3);for(let x=4;x<W-12;x+=3)r('#2a2a30',x,oy+5,1,H-11);
    r('#3a3d44',W-9,0,4,oy+4);r('#5a5f68',W-9,0,1,oy+4);r('#2a2a30',W-10,0,6,2);r('#c0392b',W-8,oy+6,3,3);oil(r,6,64)});
    an.push({t:'smoke',x:W-7,y:-2});an.push({t:'blink',x:W-7,y:oy+7,c:'#2ecc40'});return{oy,c,an}}
  if(/driller/.test(l)){const oy=12,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    r('#3a3d44',0,0,W,TT);r('#5a5f68',0,0,W,2);r('#2a2a30',2,3,W-4,TT-6);
    for(let k=0;k<3;k++){const cx=7+k*14,cy=9;for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const d=Math.hypot(x,y);if(d<=4.3)r(d>3.3?'#9aa3ad':'#f4f4f0',cx+x,cy+y)}r('#c0392b',cx,cy-3,1,3)}
    r('#c0392b',5,TT-8,3,3);r('#2ecc40',11,TT-8,3,3);r('#e0a100',17,TT-8,3,3);for(const x of[W-14,W-9])r('#c9ced4',x,TT-12,1,7);r('#c0392b',W-15,TT-13,3,2);r('#c0392b',W-10,TT-13,3,2)});
    an.push({t:'blink',x:W-5,y:TT-8,c:'#ff3b2f'});return{oy,c,an}}
  // pipe rack
  {const oy=12,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#5a3e27',0,TT-3,W,3);r('#e0a100',0,0,2,TT);r('#e0a100',W-2,0,2,TT);
    for(let row=0;row<4;row++)for(let x=3+(row&1)*3;x<W-5;x+=6){const y=TT-8-row*7;for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++){const d=Math.hypot(xx,yy);if(d<=3.2)r(d>2.2?'#9aa3ad':d>1.2?'#5a5f68':'#141210',x+xx,y+yy)}}})}}}
// ---- A lighthouse (BLD kind lighthouse): a tapering tower in red and white bands on a stone base, a gallery with a railing,
// the glass lantern room with its lamp, and a red domed cap; drawn LHX pixels taller than its footprint. Its beam sweeps at night.
const LHX=44,LHTOP=26;
function lighthouseArt(w,h){const W=w*16,H=h*16+LHX,cx=W>>1;return mk(W,H,r=>{
  r('#6b737c',2,H-9,W-4,9);r('#9aa3ad',2,H-9,W-4,1);for(let x=5;x<W-4;x+=7)r('#4a5058',x,H-8,1,8);
  const top=LHTOP,bot=H-9;for(let y=top;y<bot;y++){const f=(y-top)/(bot-top),hw=Math.round(6+f*7),band=((y-top)/10|0)%2;r(band?'#c0392b':'#f4f4f0',cx-hw,y,hw*2,1);r(band?'#8a2a1e':'#c9ced4',cx+hw-3,y,3,1);r(band?'#d85a4a':'#ffffff',cx-hw,y,1,1)}
  r('#2a3a4a',cx-2,top+12,4,5);r('#9fc3d6',cx-2,top+12,1,2);r('#2a3a4a',cx-2,top+32,4,5);r('#9fc3d6',cx-2,top+32,1,2);
  r('#3a2414',cx-4,bot-13,8,13);r('#5b3a26',cx-3,bot-12,6,12);r('#c9a040',cx+1,bot-6,1,1);
  r('#2a2a30',cx-10,top-2,20,3);r('#2a2a30',cx-10,top-7,20,1);for(let x=cx-10;x<=cx+9;x+=3)r('#2a2a30',x,top-7,1,5);
  r('#2a2a30',cx-6,top-17,12,15);r('#fff3c0',cx-5,top-16,10,13);r('#ffd23a',cx-3,top-13,6,7);r('#ffffff',cx-2,top-12,2,3);r('#2a2a30',cx-5,top-9,10,1);r('#2a2a30',cx,top-16,1,13);
  for(let k=0;k<6;k++)r(k<2?'#8a2a1e':'#a83a2a',cx-7+k,top-18-k,14-2*k,1);r('#2a2a30',cx,top-26,1,3)})}
// ---- Steampunk touches (Kingsgrad's look; not with ?classic or ?steam), laid over a building b drawn by bld2 (same size): copper on a few roofs (copper),
// smoking soot-black chimney stacks and a brass ridge on every roof, copper pipes with valve wheels down the corners, and a
// brass-bound plank door on a few (door). s is its BLD look, dx its door's column, sd a number to vary things by.
function steamTouch(b,w,h,s,dx,sd,copper,door){const c=b.c,g=c.getContext('2d'),W=c.width,H=c.height,ry=b.ry,r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a|0,b|0)};
  // copper: the roof's own colours (lighter and darker) turned verdigris, keeping their shading; snow, signs and trim untouched
  if(copper&&s.roof){const im=g.getImageData(0,0,W,Math.max(1,ry)),p=im.data,fam=[-.45,-.35,-.25,-.15,0,.1,.2,.3].map(k=>rgb(shade(s.roof,k))),V=['#1f4a40','#2e6a5c','#3f8a76','#5aa892','#86c8b2'];
    for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const near=fam.some(f=>Math.abs(f[0]-p[i])+Math.abs(f[1]-p[i+1])+Math.abs(f[2]-p[i+2])<34);if(!near)continue;
      const l=(p[i]*.3+p[i+1]*.59+p[i+2]*.11)/255,v=rgb(V[Math.min(4,Math.max(0,Math.round(l*6-.6)))]);p[i]=v[0];p[i+1]=v[1];p[i+2]=v[2]}
    g.putImageData(im,0,0)}
  // a brass ridge cap along the top of the roof, and chimney stacks of soot-black brick with copper caps, smoking
  r('#c9a040',2,1,W-4,1);const an=[];
  for(const f of(w>=6?[.18,.82]:[hash(w,h,sd)>.5?.22:.78])){const x=Math.round(W*f)-4,top=0,bot=Math.min(ry-3,20);if(bot-top<6)continue;
    r('#1a1410',x-1,top,10,bot-top+1);r('#4a2a22',x,top+1,8,bot-top-1);r('#5e3428',x,top+1,2,bot-top-1);for(let y=top+4;y<bot;y+=3)r('#2e1c16',x,y,8,1);r('#1a1410',x-2,top,12,3);r('#2e5e54',x-1,top,10,2);r('#5aa08e',x-1,top,10,1);r('#2a2a33',x+2,top,4,1);an.push({t:'smoke',x:x+4,y:top-2})}
  // copper pipes down both corners from the eaves, each with a valve wheel
  for(const px of[1,W-4]){r('#5a3a1a',px-1,ry+1,5,H-ry-5);r('#8a5a2a',px,ry+1,3,H-ry-5);r('#c08040',px,ry+1,1,H-ry-5);
    for(let y=ry+6;y<H-6;y+=9)r('#5a3a1a',px,y,3,1);const vy=ry+5+(hash(px,1,sd)*Math.max(1,H-ry-16)|0);r('#c9a040',px-1,vy,5,1);r('#c9a040',px+1,vy-2,1,5);r('#7a2a1a',px+1,vy,1,1)}
  // a heavy plank door bound in brass, in place of the painted one
  if(door&&dx>=0){const X=dx*16+2;r('#1a1410',X-1,H-18,14,15);r('#4a2e1a',X,H-17,12,14);for(let x=X+2;x<X+12;x+=3)r('#3a2214',x,H-16,1,13);
    r('#c9a040',X-1,H-18,14,1);r('#c9a040',X,H-13,12,1);r('#c9a040',X,H-7,12,1);for(const y of[H-13,H-7])for(const x of[X+1,X+10])r('#ffe08a',x,y,1,1);r('#ffd23a',X+9,H-10,1,2)}
  b.an.push(...an)}
// ---- Steampunk buildings (?steam, Kingsgrad only). s is the building's BLD look (for its kind and sign); dx its door's column.
// Drawn SEXT pixels taller than the building, for the chimney stacks. Returns the picture and its animations (smoke, gears).
const SEXT=24;
function steamArt(w,h,s,dx){const W=w*16,H=h*16+SEXT,c=cnv(W,H),g=c.getContext('2d'),an=[],sd=(W*31+h*7+(s.sign||s.wall||'').length*13)%997;
  const r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x|0,y|0,a|0,b|0)};
  const tall=s.kind=='tall',home=!s.sign&&!s.deco&&!tall&&!s.marquee,big=w>=6&&!home,rt=SEXT+2,ry=SEXT+(tall?8:Math.max(14,Math.round(h*16*.3))),base=H,pl=base-7;
  // chimney stacks: soot-black brick with copper caps, smoking
  const stacks=tall?[.2,.5,.8]:home?[.7]:[.25,.75];
  for(const f of stacks){const x=Math.round(W*f)-3,top=2+(hash(x,2,sd)*6|0);r('#1a1410',x-1,top-1,8,rt-top+2);r('#4a2a22',x,top,6,rt-top);for(let y=top+3;y<rt;y+=4)r('#2e1c16',x,y,6,1);
    r('#2e5e54',x-1,top,8,2);r('#5aa08e',x-1,top,8,1);an.push({t:'smoke',x:x+3,y:top-2})}
  // roof: verdigris copper sheets with darker seams, a brass ridge along the top
  r('#1a1410',0,rt-1,W,ry-rt+2);for(let y=rt;y<ry;y++)for(let x=1;x<W-1;x++)r(x%8==0?'#2e5e54':(y-rt)%5==0?'#3c7466':hash(x>>1,y>>1,sd)>.92?'#5aa08e':'#4a8a7a',x,y,1,1);
  r('#c9a040',0,rt,W,1);r('#8a6a20',0,rt+1,W,1);
  // walls: soot-dark brick with dark mortar, an iron plinth studded with brass rivets along the bottom
  // (each building's bricks lean a little towards its usual wall colour, so the street isn't all one brown)
  const b1=mix('#5a3226',s.wall||'#5a3226',.3),b2=mix('#6e3e2c',s.wall||'#6e3e2c',.3),b3=mix('#3e2420',s.wall||'#3e2420',.2);
  for(let y=ry;y<pl;y++)for(let x=0;x<W;x++){const row=(y-ry)>>2,mortar=((x+(row&1)*4)%8==0)||((y-ry)%4==0);r(mortar?'#2e1e18':hash(x>>3,row,sd)>.82?b2:hash(x>>3,row,sd+1)>.9?b3:b1,x,y,1,1)}
  r('#2e2c2a',0,pl,W,7);r('#4a4642',0,pl,W,1);for(let x=3;x<W;x+=6)r('#c9a040',x,pl+3,1,1);r('#1a1410',0,ry,1,base-ry);r('#1a1410',W-1,ry,1,base-ry);
  // a copper pipe along the eaves, and down the corners with valve wheels
  r('#8a5a2a',0,ry,W,2);r('#c08040',0,ry,W,1);
  for(const px of[2,W-5]){r('#8a5a2a',px,ry+2,3,pl-ry-2);r('#c08040',px,ry+2,1,pl-ry-2);const vy=ry+6+(hash(px,1,sd)*Math.max(1,pl-ry-14)|0);r('#c9a040',px-1,vy,5,1);r('#c9a040',px+1,vy-2,1,5);r('#7a2a1a',px+1,vy,1,1)}
  // windows: brass-rimmed portholes with a cross bar, most warmly lit
  const rows=tall?Math.max(1,Math.floor((pl-ry-6)/14)):1;
  for(let k=0;k<rows;k++){const cy=ry+9+k*14;if(cy+5>pl)break;for(let i=0;i<w;i++){if(i==dx&&k==rows-1)continue;const cx=i*16+8;if(cx<9||cx>W-9)continue;const lit=hash(i,k,sd+3)>.3;
    for(let yy=-5;yy<=5;yy++)for(let xx=-5;xx<=5;xx++){const d=Math.hypot(xx,yy);if(d<=5.2)r(d>4.1?'#c9a040':d>3.6?'#8a6a20':lit?(yy<-1?'#ffe2a0':'#ffbf5a'):'#2a2a33',cx+xx,cy+yy,1,1)}
    r('#8a6a20',cx-3,cy,7,1);r('#8a6a20',cx,cy-3,1,7)}}
  // the door: heavy planks bound in brass, under a brass arch
  if(dx>=0){const X=dx*16+3;r('#1a1410',X-1,base-18,12,18);r('#4a2e1a',X,base-17,10,17);for(let x=X+2;x<X+10;x+=3)r('#3a2214',x,base-16,1,16);
    r('#c9a040',X-1,base-18,12,1);r('#c9a040',X,base-12,10,1);r('#c9a040',X,base-5,10,1);r('#ffd23a',X+7,base-9,1,2)}
  // a brass name plaque on the roof's front edge, and a clock on the grand buildings
  let nt=ry-10;if(s.sign){const t=s.sign.slice(0,Math.floor((W-10)/4)),tw=t.length*4-1,bx=(W-tw-4)>>1,py=ry-9;r('#1a1410',bx-1,py-1,tw+6,9);r('#c9a040',bx,py,tw+4,7);r('#ffe08a',bx,py,tw+4,1);ptext(r,t,bx+2,py+1,'#2a1a10');nt=py-1}
  if(s.cols||s.flag||tall){const cx=W>>1,cy=rt+((ry-rt)>>1)-(s.sign?3:0);for(let yy=-6;yy<=6;yy++)for(let xx=-6;xx<=6;xx++){const d=Math.hypot(xx,yy);if(d<=6.3)r(d>5.2?'#c9a040':'#f4ead0',cx+xx,cy+yy,1,1)}
    an.push({t:'sclock',x:cx,y:cy})}
  // a big brass gear turning on the roof of the larger buildings
  if(big)an.push({t:'gear',x:hash(w,h,sd)>.5?12:W-12,y:rt+((ry-rt)>>1),r:7});
  return{c,an,ry,nt}}
const GEXT=26;
function gothicArt(w,h,s,dx){const W=w*16,H=h*16+GEXT,an=[],lights=[],ry=GEXT+Math.round(h*16*.3),gold='#c9a040';
  const st=s.wall,sd=shade(st,-.38),sl=shade(st,.2),bays=Math.max(1,Math.round(W/28)),bw=W/bays,X=dx*16+8;
  const c=mk(W,H,r=>{
    // bell tower behind the roofline
    if(s.tower){const tx=(W>>1)-8;r(st,tx,10,16,ry-6);r(sd,tx,10,1,ry-6);r(sd,tx+15,10,1,ry-6);for(let y=0;y<12;y++){const hw=Math.max(1,Math.round(9*y/12));r(y%3?s.roof:'#14131c',(W>>1)-hw,y,hw*2,1)}
      r('#14131c',(W>>1)-3,15,6,9);r('#e8a040',(W>>1)-2,17,4,6);r('#ffd890',(W>>1)-1,18,2,2);lights.push({x:W>>1,y:20,r:30,col:'255,170,80',f:1});r(gold,(W>>1)-1,0,2,2)}
    // roof: a steep slate gable over each bay, crowned with an iron finial
    for(let i=0;i<bays;i++){const x0=Math.round(i*bw),x1=Math.round((i+1)*bw),mx=(x0+x1)>>1,top=Math.max(9,Math.round(ry-(x1-x0)*.95));
      for(let y=top;y<ry;y++){const hw=(x1-x0)/2*(y-top)/(ry-top)+1;for(let x=Math.round(mx-hw);x<Math.round(mx+hw);x++)r(((x+(y>>1))%5==0)||(y%4==0)?'#16151e':s.roof,x,y)}
      r('#3a3a48',mx-1,top-8,2,9);r(gold,mx-3,top-5,6,1);r(gold,mx-1,top-9,2,2)}
    // walls of dressed stone, flecked
    r(st,0,ry,W,H-ry);for(let y=ry;y<H;y+=5){r(sd,0,y,W,1);for(let x=((y/5|0)%2)*6;x<W;x+=12)r(sd,x,y,1,5)}
    for(let x=0;x<W;x++)for(let y=ry;y<H;y++)if(hash(x,y,W+7)>.975)r(sl,x,y);
    r('#0e0d14',0,ry,W,2);
    // a lancet window in each bay: stained glass between lead lines, lit or dark; the middle bay can hold a rose window instead
    const wy0=ry+(s.sign?13:6),wy1=H-23;
    for(let i=0;i<bays;i++){const mx=Math.round((i+.5)*bw);if(Math.abs(mx-X)<10&&wy1-wy0<14)continue;
      const lit=hash(i,w,h+st.length)>.25,rose=s.rose&&i==(bays>>1);
      if(rose){const cy=wy0+9;for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const d=Math.hypot(x,y);if(d>8.4)continue;const a=Math.atan2(y,x),k=((a+Math.PI)/(Math.PI/4))|0;
          r(d>7.4?'#14131c':d<2?gold:(Math.abs(x)<1||Math.abs(y)<1||d>6.4)?'#1b1a24':k%2?'#8a1a1a':'#2a3a7a',mx+x,cy+y)}lights.push({x:mx,y:cy,r:36,col:'220,60,50',f:1});continue}
      const ww=8,top=wy0,bot=Math.max(wy0+10,wy1);
      for(let y=top;y<bot;y++){const k=y-top,hw=k<6?Math.round(Math.sqrt(k/6)*4):4;r('#14131c',mx-hw-1,y,hw*2+2,1);
        for(let x=mx-hw;x<mx+hw;x++){const u=(y-top)/(bot-top),glass=lit?(u<.45?'#8a1a1a':u<.7?'#c2402a':'#e8a040'):(u<.5?'#1e2230':'#2a3450');r((x==mx||(y-top)%5==4)?'#14131c':glass,x,y)}}
      r(sl,mx-6,bot,12,2);if(lit)lights.push({x:mx,y:(top+bot)>>1,r:22,col:'240,120,60',f:1})}
    // buttresses between the bays
    for(let i=0;i<=bays;i++){const x=Math.round(i*bw)-2;r(sd,x,ry-3,5,H-ry+3);r(sl,x,ry-3,1,H-ry+3);r('#0e0d14',x+4,ry-3,1,H-ry+3);r(sl,x-1,ry-5,7,2);r(sd,x-1,H-10,7,10)}
    // crimson banners with a gold sun, hung from the buttresses
    if(s.banner)for(let i=1;i<bays;i++){const x=Math.round(i*bw)-3;r('#14131c',x-1,ry+2,9,1);r('#7a1418',x,ry+3,7,16);r('#9a2020',x,ry+3,2,16);r(gold,x,ry+3,7,1);r(gold,x+2,ry+9,3,3);r('#7a1418',x+1,ry+19,2,2);r('#7a1418',x+4,ry+19,2,2)}
    // the sign, carved and gilded, under the eaves
    if(s.sign){const tw=s.sign.length*4+5,sx=(W-tw)>>1;r('#0e0d14',sx-1,ry+2,tw+2,10);r('#1b1a24',sx,ry+3,tw,8);r(gold,sx,ry+3,tw,1);ptext(r,s.sign,sx+3,ry+5,gold)}
    // the door: a pointed arch of iron-banded oak in a stone surround, with steps and a candle either side
    for(let y=0;y<22;y++){const hw=y<6?Math.round(Math.sqrt(y/6)*8):8;r(sl,X-hw-2,H-24+y,hw*2+4,1)}
    for(let y=0;y<19;y++){const hw=y<5?Math.round(Math.sqrt(y/5)*6):6;r('#2a1810',X-hw,H-21+y,hw*2,1)}
    r('#5a5f68',X-6,H-14,12,1);r('#5a5f68',X-6,H-8,12,1);r('#14131c',X,H-19,1,17);r(gold,X+2,H-11,2,2);
    r('#4a4858',X-10,H-3,20,3);r('#5e5c70',X-10,H-3,20,1);
    for(const cx of[X-12,X+11]){r('#e8dcc0',cx,H-9,2,6);r('#c9b28a',cx+1,H-9,1,6);an.push({t:'candle',x:cx+1,y:H-10});lights.push({x:cx+1,y:H-11,r:15,col:'255,180,90',f:1})}
  });
  return{c,an,lights}}
// Gothic Eastbrook's looks for each of its buildings
const GBLD={eb1:{wall:'#3b3846',roof:'#262433'},eb2:{wall:'#463c3a',roof:'#2a2430'},
  community:{wall:'#5a4a3e',roof:'#2a2430',tower:1,rose:1,banner:1,sign:'COMMUNITY'},gazette:{wall:'#3b3846',roof:'#262433',sign:'GAZETTE'},
  coffee:{wall:'#4a3a34',roof:'#2a2430',sign:'COFFEE'},tattoo:{wall:'#3a2a30',roof:'#221c26',sign:'TATTOO',banner:1},
  cedargrill:{wall:'#4a3a34',roof:'#2a2430',sign:'GRILL',banner:1},tavern:{wall:'#463c3a',roof:'#2a2430',sign:'TAVERN',banner:1},
  eblofts:{wall:'#3b3846',roof:'#262433',tower:1,sign:'LOFTS'},kcmuseum:{wall:'#5a4a3e',roof:'#2a2430',rose:1,banner:1,sign:'MUSEUM'},
  records:{wall:'#3a2a30',roof:'#221c26',sign:'RECORDS'},clothes:{wall:'#463c3a',roof:'#2a2430',sign:'CLOTHES',banner:1}};
// A dead tree: a twisted black trunk and bare, crooked branches.
const deadTree=v=>mk(16,30,r=>{const tk='#14131c',br='#24222e';r(tk,7,12,3,18);r(br,7,12,1,18);r(tk,6,27,5,3);
  const B=[[8,14,2,6],[9,12,13,5],[8,18,3,11],[9,17,14,10],[8,9,5,2],[9,8,12,1],[8,5,8,0]];B.forEach(([x0,y0,x1,y1],i)=>{if((i+v)%4==3)return;pline(r,x0,y0,x1,y1,i%2?tk:br)});
  r(tk,7,4,2,9);r('#a9b1c6',4,6,2,1);r('#a9b1c6',12,4,2,1)});
const DEADTREES=[0,1,2].map(deadTree);
// Gothic props, standing in for Eastbrook's own (same tiles, so collisions are unchanged)
Object.assign(PA,{
glamp:[30,r=>{r('#14131c',7,9,2,19);r('#2a2836',7,9,1,19);r('#14131c',5,27,6,3);r('#14131c',3,7,10,2);r('#1b1a24',4,0,8,8);r('#f0b050',5,2,6,5);r('#ffe0a0',6,3,2,3);r('#14131c',7,2,1,5);r('#3a3a48',7,0,2,1)}],
gbench:[11,r=>{r('#3a3846',1,2,14,3);r('#4f4c5e',1,2,14,1);r('#26242f',2,5,2,6);r('#26242f',12,5,2,6);r('#3a3846',1,6,14,2)}],
brazier:[18,r=>{r('#14131c',3,10,2,8);r('#14131c',11,10,2,8);r('#14131c',7,12,2,6);r('#2a2836',2,6,12,5);r('#3a3a48',2,6,12,1);r('#e8501e',4,5,8,2);r('#ffb040',6,4,4,1)}],
gravestone:[16,r=>{r('#3e3d4e',3,3,10,13);r('#3e3d4e',4,1,8,2);r('#5a5970',4,1,3,12);r('#26252f',11,3,2,13);r('#1b1a24',7,4,2,7);r('#1b1a24',5,6,6,2);r('#2e3a2a',3,13,4,3);r('#4a4a5e',2,15,12,1)}],
penitent:[32,r=>{r('#3a3846',4,28,8,4);r('#4f4c5e',4,28,8,1);for(let y=0;y<14;y++){const hw=Math.max(1,Math.round(y*0.4));r(y<2?'#7a7f96':'#5a5970',8-hw,y,hw*2,1)}
  r('#14131c',6,9,4,2);for(let y=14;y<28;y++){const hw=3+Math.round((y-14)*0.25);r('#4a4a5e',8-hw,y,hw*2,1);r('#3a3846',8+hw-2,y,2,1)}r('#26252f',7,16,2,10);r('#c9a040',7,20,2,2)}],
shrine:[24,r=>{r('#3e3d4e',2,6,12,18);r('#5a5970',2,6,12,1);for(let y=0;y<6;y++){const hw=Math.round(7*y/6);r('#262433',8-hw,y,hw*2,1)}r('#c9a040',7,0,2,2);
  r('#14131c',4,9,8,10);r('#c9a040',6,10,4,5);r('#7a1418',7,11,2,3);r('#e8dcc0',7,16,2,3)}],
thorns:[12,r=>{for(let k=0;k<7;k++)pline(r,1+k*2,11,(k*5)%15,1+(k%3)*2,k%2?'#14131c':'#2a2033');for(const[x,y]of[[3,4],[9,3],[12,6],[6,7]])r('#9a1a1a',x,y,1,1)}],
candles:[10,r=>{r('#3a3846',1,6,14,4);r('#4f4c5e',1,6,14,1);for(const[x,h]of[[3,5],[6,7],[9,4],[12,6]]){r('#e8dcc0',x,6-h,2,h);r('#c9b28a',x+1,6-h,1,h)}}]});
const GPROP={lamp:'glamp',bench:'gbench',planter:'brazier',mailbox:'gravestone',woodpile:'gravestone',snowman:'penitent',phone:'shrine',bush:'thorns',chalk:'candles',cafetable:'candles',bike:'thorns'};
// light sources and flames on the gothic props: [y offset from the sprite's top, radius, colour, flame animation]
const GLIGHT={glamp:[4,36,'255,170,80'],brazier:[4,42,'255,110,40','fire'],shrine:[16,18,'255,180,90','candle'],candles:[0,20,'255,180,90','candles']};
// The lighting pass: darkness over the whole view, cut away around each light (which flickers), a warm glow added on top,
// and banks of fog drifting through.
let LIGHTC=null;
function gothLight(S,cx,cy,t,o={dark:'rgba(5,5,14,.8)',fog:'140,150,185',fogA:.13}){const vw=cv.width,vh=cv.height;if(!LIGHTC||LIGHTC.width!=vw||LIGHTC.height!=vh)LIGHTC=cnv(vw,vh);const g=LIGHTC.getContext('2d');
  g.globalCompositeOperation='source-over';g.clearRect(0,0,vw,vh);g.fillStyle=o.dark;g.fillRect(0,0,vw,vh);g.globalCompositeOperation='destination-out';
  const ls=S.lights.concat([{x:P.rx*16+8,y:P.ry*16+6,r:26}]),fl=l=>l.f?1+Math.sin(t/110+l.x)*.05+(hash(l.x|0,t/140|0,l.y|0)-.5)*.1:1;
  for(const l of ls){const X=l.x-cx,Y=l.y-cy,R=l.r*fl(l);if(X<-R||Y<-R||X>vw+R||Y>vh+R)continue;const gr=g.createRadialGradient(X,Y,0,X,Y,R);
    gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.45,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(X-R,Y-R,R*2,R*2)}
  ctx.drawImage(LIGHTC,0,0);ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of S.lights){const X=l.x-cx,Y=l.y-cy,R=l.r*.75*fl(l);if(X<-R||Y<-R||X>vw+R||Y>vh+R)continue;const gr=ctx.createRadialGradient(X,Y,0,X,Y,R);
    gr.addColorStop(0,`rgba(${l.col},.28)`);gr.addColorStop(1,`rgba(${l.col},0)`);ctx.fillStyle=gr;ctx.fillRect(X-R,Y-R,R*2,R*2)}
  ctx.restore();
  for(let i=0;i<6;i++){const R=90+(i%3)*30,X=(((i*211+t*.006*(i%2?1:-1)*16-cx*.4)%(vw+2*R))+vw+2*R)%(vw+2*R)-R,Y=((i*137-cy*.4)%(vh+R)+vh+R)%(vh+R)-R/2;
    const gr=ctx.createRadialGradient(X,Y,0,X,Y,R);gr.addColorStop(0,`rgba(${o.fog},${o.fogA})`);gr.addColorStop(1,`rgba(${o.fog},0)`);ctx.fillStyle=gr;ctx.fillRect(X-R,Y-R,R*2,R*2)}}

// ---- Proof of concept 2: a more detailed Eastbrook (?detailed), in the style of lush top-down pixel art: textured grass with
// tufts and flowers, pale cobbles with grass creeping over their edges, tiled-roof cottages with gables, chimneys, framed windows
// and arched doors, leafy trees and hand-made props. Add &night for the night-time version: windows lit, lanterns glowing,
// fireflies, under the same lighting pass as the gothic proof of concept.
const DETAILED=typeof location!='undefined'&&/[?&]detailed\b/.test(location.search),DET=m=>DETAILED&&m=='second';
// Night time: every outdoor place has a night version (see drawWorld2). It starts on with ?night, and the game toggles it.
let NIGHT=typeof location!='undefined'&&/[?&]night\b/.test(location.search);
// the night everywhere but Frostholm (which has its own purple neon dusk) and the proofs of concept: moonlit blue
const MOONLOOK={dark:'rgba(10,16,46,.58)',fog:'120,140,200',fogA:.05};
const NIGHTLOOK={dark:'rgba(14,18,48,.74)',fog:'110,130,190',fogA:.07};
function grassPx(X,Y){const n=vnoise(X/18,Y/18,201)*.6+vnoise(X/6,Y/6,202)*.4,b=hash(X,Y,203);let c=n>.62?'#78b850':n<.38?'#5a9a3e':'#68aa48';
  if(b>.94)c='#4c8a36';else if(b>.9)c='#86c460';return c}
function cobblePx(X,Y){const row=(Y/6)|0,sx=X+(row&1?3:0),cx=(sx/7)|0,lx=sx%7,ly=Y%6,k=hash(cx,row,211);
  if(lx==0||ly==0||(lx==1&&ly==1)||(lx==6&&ly==5))return hash(cx,row,212)>.75?'#6a9e48':'#a3957c';
  const base=['#e8dfcd','#ddd2bc','#d3c6ac','#e2d6c0'][k*4|0];return lx==1||ly==1?shade(base,.25):lx==6||ly==5?shade(base,-.14):base}
function detailedGround(m){const M=MAPS[m],h=M.length,w=M[0].length,W=w*16,H=h*16,c=cnv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),p=img.data;
  const at=(x,y)=>M[Math.max(0,Math.min(h-1,y))][Math.max(0,Math.min(w-1,x))],path=ch=>ch==','||ch=='E',hard=ch=>path(ch)||ch=='l'||ch=='P';
  const put=(X,Y,col)=>{if(X<0||Y<0||X>=W||Y>=H)return;const i=(Y*W+X)*4;p.set(rgb(col),i);p[i+3]=255};
  for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const tx=X>>4,ty=Y>>4,lx=X&15,ly=Y&15,ch=at(tx,ty);let col;
    if(path(ch)){col=cobblePx(X,Y);
      // grass creeping over the edge of the path in a ragged fringe, with a little shadow under it
      const dep=u=>2+((hash(u>>1,tx*31+ty,91)*3)|0),side=[[!hard(at(tx,ty-1)),ly,X],[!hard(at(tx,ty+1)),15-ly,X],[!hard(at(tx-1,ty)),lx,Y],[!hard(at(tx+1,ty)),15-lx,Y]];
      for(const[open,d,u]of side)if(open){const k=dep(u);if(d<k)col=d==k-1?'#3e7a2c':grassPx(X,Y);else if(d==k)col=shade(col,-.18)}}
    else if(ch=='l'){const nz=vnoise(X/3,Y/3,66);col=nz>.6?'#9a8a76':nz<.4?'#7e705e':'#8c7d6a';if(X%8<3&&ly>1&&ly<14)col=X%8==0?'#7a5232':'#5e3e24';
      if(ly==3||ly==11)col='#d8dde2';else if(ly==4||ly==12)col='#6b737c'}
    else if(ch=='P'){col=(X&15)==15||(Y&15)==15?'#8f8676':hash(X>>4,Y>>4,213)>.5?'#c9c0b0':'#bfb6a4';if(ly>=12&&ly<14)col='#e0b020';if(ly>=14)col='#7a7262'}
    else col=grassPx(X,Y);
    const i=(Y*W+X)*4;p.set(rgb(col),i);p[i+3]=255}
  // scattered over the grass: tufts, little flowers, pebbles and the odd mushroom
  for(let ty=0;ty<h;ty++)for(let tx=0;tx<w;tx++){if(hard(at(tx,ty)))continue;const X0=tx*16,Y0=ty*16;
    for(let k=0;k<3;k++){const x=X0+2+(hash(tx,ty,220+k)*11|0),y=Y0+4+(hash(tx,ty,230+k)*10|0);put(x,y,'#3e7a2c');put(x+2,y,'#3e7a2c');put(x+1,y-1,'#3e7a2c');put(x+1,y-2,'#9ad06a');put(x-1,y-1,'#9ad06a')}
    const f=hash(tx,ty,240);
    if(f>.82){const x=X0+3+(hash(tx,ty,241)*9|0),y=Y0+3+(hash(tx,ty,242)*9|0),pc=['#e86aa0','#f4d03f','#f2f2f2','#f08a3a','#9a7ad8'][hash(tx,ty,243)*5|0];
      put(x,y+3,'#3e7a2c');put(x,y+2,'#3e7a2c');put(x-1,y,pc);put(x+1,y,pc);put(x,y-1,pc);put(x,y+1,pc);put(x,y,'#f4d03f');
      if(f>.9){put(x+4,y+3,'#3e7a2c');put(x+3,y+2,pc);put(x+5,y+2,pc);put(x+4,y+1,pc);put(x+4,y+2,'#f4d03f')}}
    else if(f>.77){const x=X0+4+(hash(tx,ty,244)*8|0),y=Y0+6+(hash(tx,ty,245)*7|0);put(x,y,'#8a8f98');put(x+1,y,'#a9b0b8');put(x,y+1,'#5f666e');put(x+1,y+1,'#6e7680')}
    else if(f>.755){const x=X0+5+(hash(tx,ty,246)*6|0),y=Y0+6+(hash(tx,ty,247)*6|0);put(x,y+2,'#efe0c0');put(x,y+1,'#efe0c0');put(x-1,y,'#c0392b');put(x,y,'#c0392b');put(x+1,y,'#c0392b');put(x,y-1,'#d84a3a');put(x,y,'#f2f2f2')}}
  g.putImageData(img,0,0);return c}
// A detailed building, seen from the front in three-quarter view: a tiled roof with a ridge beam over the whole footprint, a
// cream gable with an attic window, a stone chimney, then walls of stone, brick or timber-framed plaster with framed windows,
// an arched plank door with a lantern, an optional striped awning and a hanging wooden sign. Rises DEXT pixels above its footprint.
const DEXT=12;
function detailedArt(w,h,s,dx){const W=w*16,H=h*16+DEXT,cx=W>>1,ry=DEXT+Math.round(h*16*.5),an=[],lights=[],X=dx*16+8,OUTL='#3a2418';
  const c=mk(W,H,r=>{
    // walls
    const wt=ry+3,wb=H-4;
    for(let y=wt;y<wb;y++)for(let x=0;x<W;x++){let col;
      if(s.mat=='stone'){const row=((y-wt)/5)|0,sx=x+(row%2)*4,bx=(sx/9)|0,lx=sx%9,ly=(y-wt)%5,k=hash(bx,row,301+W);
        col=lx==0||ly==0?'#4a505c':['#7c8494','#6e7684','#858d9c','#727a88'][k*4|0];if((lx==1||ly==1)&&lx&&ly)col=shade(col,.18)}
      else if(s.mat=='brick'){const row=((y-wt)/4)|0,sx=x+(row%2)*4,lx=sx%8,ly=(y-wt)%4,k=hash((sx/8)|0,row,302+W);
        col=lx==0||ly==0?'#c9b8a8':['#b0563a','#a04c34','#ba6042'][k*3|0];if(ly==1&&lx)col=shade(col,.12)}
      else{col=s.plaster||'#f2e6c8';if(hash(x,y,303)>.96)col=shade(col,-.05);
        if(x%16<2||(y-wt)%14<2&&y-wt<28)col=x%16==0||(y-wt)%14==0?'#5a3a22':'#7a5232'}
      r(col,x,y)}
    r('#1a1210',0,wt,W,1);r('rgba(30,20,10,.25)',0,wt+1,W,2);
    // plinth
    for(let x=0;x<W;x++){r(x%10==0?'#9a9284':'#c9c0b0',x,wb,1,4)}r('#e0d8c8',0,wb,W,1);
    // windows (lit at night), skipping the door
    const rows=Math.max(1,Math.floor((wb-wt-4)/20));
    for(let k=0;k<rows;k++){const y0=wb-14-k*20;if(y0<wt+3)continue;
      for(let i=0;i<w;i++){const x0=i*16+3;if(k==0&&Math.abs(x0+5-X)<11)continue;const lit=NIGHT&&hash(i,k,W+7)>.3,gl=lit?'#ffd98a':'#7fb0e0';
        r(OUTL,x0-1,y0-1,12,11);r('#8a5a36',x0,y0,10,9);r(gl,x0+1,y0+1,8,7);r(lit?'#fff1c8':'#cfe6f8',x0+1,y0+1,3,2);r(lit?'#fff1c8':'#cfe6f8',x0+2,y0+3,1,1);
        r('#8a5a36',x0+5,y0+1,1,7);r('#8a5a36',x0+1,y0+4,8,1);r('#c9b28a',x0-1,y0+9,12,2);r('#a8906a',x0-1,y0+10,12,1);
        if(lit)lights.push({x:x0+5,y:y0+4,r:22,col:'255,200,110',f:1})}}
    // awning over the shop front
    if(s.awn){const ay=wb-22;for(let x=0;x<W;x++){const cc=(x>>2)&1?s.awn:'#f2efe6';r(cc,x,ay,1,5);if((x&3)==1||(x&3)==2)r(cc,x,ay+5,1,1)}r(shade(s.awn,-.3),0,ay,W,1);r('rgba(30,20,10,.25)',0,ay+6,W,2)}
    // the door: an arched plank door in a stone surround, with a step and a lantern
    for(let y=0;y<18;y++){const hw=y<4?Math.round(Math.sqrt(y/4)*7):7;r('#c9c0b0',X-hw-1,wb-18+y,hw*2+2,1);r('#e0d8c8',X-hw-1,wb-18+y,1,1)}
    for(let y=0;y<16;y++){const hw=y<4?Math.round(Math.sqrt(y/4)*5):5;for(let x=X-hw;x<X+hw;x++)r(((x-X+10)>>1)&1?'#8a5a36':'#7a4e2e',x,wb-16+y)}
    r('#3a3d44',X-5,wb-12,4,1);r('#3a3d44',X-5,wb-5,4,1);r('#e0b040',X+2,wb-8,2,2);r('#9a9284',X-7,wb,14,2);
    const lx=X+8;r('#2a2a33',lx,wb-17,4,6);r(NIGHT?'#ffd27a':'#f0c060',lx+1,wb-16,2,4);r('#2a2a33',lx+1,wb-18,2,1);if(NIGHT)lights.push({x:lx+2,y:wb-14,r:26,col:'255,190,100',f:1});
    // roof: rows of tiles over the whole footprint, a ridge beam down the middle, overhanging eaves
    for(let y=DEXT;y<ry+3;y++){const row=((y-DEXT)/3)|0,yy=(y-DEXT)%3;for(let x=0;x<W;x++){const left=x<cx,base=left?s.roof:shade(s.roof,-.12),sx=(x+(row&1)*2)%4;
      r(yy==2?shade(base,-.32):yy==0&&sx==1?shade(base,.22):sx==3?shade(base,-.12):base,x,y)}}
    r(OUTL,0,ry+2,W,1);r(shade(s.roof,-.45),0,ry+1,W,1);r('#6b3a22',cx-1,DEXT,3,ry-DEXT+2);r('#8a5a36',cx-1,DEXT,1,ry-DEXT+2);
    // the gable: cream plaster in a timber frame, with an attic window
    const ay=DEXT+Math.round((ry-DEXT)*.32),gw=Math.round(W*.3);
    for(let y=ay;y<ry+2;y++){const hw=Math.round(gw*(y-ay)/(ry+2-ay));for(let x=cx-hw;x<=cx+hw;x++)r(hash(x,y,304)>.95?'#e2d2b0':s.plaster||'#efe0c0',x,y);
      r('#8a5a36',cx-hw-2,y,2,1);r('#8a5a36',cx+hw+1,y,2,1);r(OUTL,cx-hw-3,y,1,1);r(OUTL,cx+hw+3,y,1,1)}
    if(ry-ay>14){const aw=8,ah=6,ax=cx-4,ayy=ry-ah-3;r(OUTL,ax-1,ayy-1,aw+2,ah+2);r('#8a5a36',ax,ayy,aw,ah);const lit=NIGHT;r(lit?'#ffd98a':'#7fb0e0',ax+1,ayy+1,aw-2,ah-2);r('#8a5a36',ax+3,ayy+1,1,ah-2);if(lit)lights.push({x:cx,y:ayy+3,r:16,col:'255,200,110',f:1})}
    for(let x=6;x<W-4;x+=10)if(Math.abs(x-cx)>gw+2){r('#5a3a22',x,ry+3,3,2)}
    // chimney
    if(w>=4){const chx=Math.round(W*.2);r(OUTL,chx-1,0,10,DEXT+9);for(let y=1;y<DEXT+8;y++)for(let x=0;x<8;x++)r((y%4==0||(x+(y>>2)*3)%6==0)?'#4a505c':y<3?'#5f6674':'#7c8494',chx+x,y);r('#2a2a33',chx+2,1,4,2);an.push({t:'smoke',x:chx+4,y:-2})}
    // the sign, a wooden board hung on chains below the eaves
    if(s.sign){const tw=s.sign.length*4+5,sx=(W-tw)>>1,sy=ry+6;r('#3a3d44',sx+3,sy-3,1,3);r('#3a3d44',sx+tw-4,sy-3,1,3);r(OUTL,sx-1,sy-1,tw+2,11);r('#a8794c',sx,sy,tw,9);r('#c49565',sx,sy,tw,1);r('#8a5a36',sx,sy+8,tw,1);ptext(r,s.sign,sx+3,sy+2,'#3a2418')}
  });
  return{c,an,lights}}
// Eastbrook's buildings in the detailed proof of concept
const DBLD={eblofts:{roof:'#b8483a',mat:'stone',plaster:'#efe0c0',sign:'TIMBER LOFTS'},eb1:{roof:'#c0503a',mat:'stone',plaster:'#efe0c0'},
  kcmuseum:{roof:'#3d7a5a',mat:'brick',plaster:'#e8f0e0',sign:'KELP COLA MUSEUM'},eb2:{roof:'#a8582e',mat:'timber',plaster:'#f2e6c8'},
  community:{roof:'#7a3a2a',mat:'brick',plaster:'#efe0c0',sign:'COMMUNITY CENTRE'},cedargrill:{roof:'#c0503a',mat:'stone',plaster:'#efe0c0',sign:'CEDAR GRILL',awn:'#3d7a5a'},
  coffee:{roof:'#8a4a2a',mat:'timber',plaster:'#f2e6c8',sign:'COFFEE',awn:'#7a2a1e'},records:{roof:'#3a4a6a',mat:'brick',plaster:'#e8e8f0',sign:'RECORDS',awn:'#2f4a5a'},
  tattoo:{roof:'#4a3a4a',mat:'stone',plaster:'#e8e0e8',sign:'TATTOO',awn:'#7a1e2a'},clothes:{roof:'#b8483a',mat:'timber',plaster:'#f2e6c8',sign:'CLOTHES',awn:'#c9822a'},
  gazette:{roof:'#3a5a7a',mat:'brick',plaster:'#e8eef2',sign:'GAZETTE'},tavern:{roof:'#8a3a2a',mat:'timber',plaster:'#f2e6c8',sign:'TAVERN'}};
// Leafy trees: a round canopy of leaf clusters lit from the upper left (v=1 bears apples), or v=2 a dark teal conifer.
function leafyTree(v){const W=24,H=34;return mk(W,H,r=>{
  r('#5a3a22',10,22,4,12);r('#7a5232',10,22,1,12);r('#4a2e1a',13,22,1,12);r('#5a3a22',7,31,10,3);r('#7a5232',7,31,3,1);
  if(v==2){for(let y=0;y<28;y++){const hw=Math.round(2+y*.38+(y%5==4?-1:0));for(let x=12-hw;x<12+hw;x++){const L=(12-x)/hw*.5+.5-(y/40);r(L>.75?'#4a9a82':L>.5?'#2e7a6a':L>.3?'#22604f':'#173f36',x,y)}}return}
  const blobs=[[12,12,9],[6,15,5],[18,15,5],[7,8,5],[17,8,5],[12,4,5],[12,18,6]];
  for(let y=0;y<27;y++)for(let x=0;x<W;x++){if(!blobs.some(([bx,by,br])=>Math.hypot(x-bx,y-by)<br+hash(x,y,v*13+5)*1.4))continue;
    const L=((24-x)+(27-y))/51+(vnoise(x/3,y/3,v*7+300)-.5)*.45;let col=L>.8?'#9ad06a':L>.62?'#76b850':L>.45?'#5a9a3e':L>.3?'#3f7a30':'#2e5e26';
    if(hash(x>>1,y>>1,v+31)>.86)col=shade(col,.14);r(col,x,y)}
  if(v==1)for(const[x,y]of[[7,10],[15,8],[12,15],[18,13],[9,17],[14,4],[5,13]]){r('#d8322a',x,y,2,2);r('#ff8a7a',x,y,1,1)}})}
let DTREES=null;const dtrees=()=>DTREES??=[0,1,2].map(leafyTree);  // built on first use: hash() lives in game.js, which loads after this file
// detailed props, standing in for Eastbrook's own (same tiles, so collisions are unchanged)
Object.assign(PA,{
dlamp:[32,r=>{r('#5a5f68',5,28,6,4);r('#7d858e',5,28,6,1);r('#7a4a2a',7,4,2,24);r('#9a6a3a',7,4,1,24);r('#7a4a2a',1,4,14,2);r('#9a6a3a',1,4,14,1);
  for(const x of[1,11]){r('#2a2a33',x+1,6,1,2);r('#2a2a33',x,8,4,7);r(NIGHT?'#ffd27a':'#f0c060',x+1,9,2,4);r(NIGHT?'#fff1c8':'#f8d890',x+1,9,1,1);r('#2a2a33',x,15,4,1)}}],
dbench:[12,r=>{r('#7a4a2a',1,1,14,2);r('#9a6a3a',1,1,14,1);r('#5a3a22',2,3,1,3);r('#5a3a22',13,3,1,3);r('#8a5a36',1,6,14,2);r('#a87a4c',1,6,14,1);r('#4a2e1a',2,8,2,4);r('#4a2e1a',12,8,2,4)}],
dbush:[14,r=>{for(let y=0;y<14;y++)for(let x=0;x<16;x++){if(((x-7.5)/7.6)**2+((y-7.5)/6.8)**2>1+hash(x,y,401)*.2)continue;const L=((16-x)+(14-y))/30+(hash(x>>1,y>>1,402)-.5)*.3;r(L>.75?'#86c460':L>.55?'#5a9a3e':L>.38?'#3f7a30':'#2e5e26',x,y)}
  r('#e86aa0',4,4,1,1);r('#f2f2f2',10,6,1,1);r('#e86aa0',7,9,1,1)}],
dflowers:[10,r=>{r('#6b4a2e',0,5,16,5);r('#8a6040',0,5,16,1);for(let x=1;x<15;x+=3){r('#3e7a2c',x+1,3,1,3);const pc=['#e86aa0','#f4d03f','#f2f2f2','#9a7ad8','#f08a3a'][x%5];r(pc,x,1,3,2);r(pc,x+1,0,1,4);r('#f4d03f',x+1,1,1,1)}}],
dmailbox:[18,r=>{r('#6b4a2e',7,8,2,10);r('#8a5a36',7,8,1,10);r('#c0392b',3,2,10,7);r('#e04a3a',3,2,10,2);r('#8e2620',3,8,10,1);r('#2a2a33',5,5,6,1);r('#e0b040',12,3,1,3)}],
dlogs:[12,r=>{for(const[x,y]of[[1,6],[6,6],[11,6],[3,1],[8,1]]){r('#7a5232',x,y,5,5);r('#d8b07a',x+1,y+1,3,3);r('#a8804a',x+2,y+2,1,1);r('#5a3a22',x,y+4,5,1)}}],
dmush:[14,r=>{r('#efe0c0',6,8,4,6);r('#d8c8a8',8,8,2,6);r('#c0392b',2,3,12,6);r('#d84a3a',3,2,10,2);r('#8e2620',2,8,12,1);for(const[x,y]of[[4,4],[8,3],[11,5],[6,6]]){r('#f8f4ee',x,y,2,2)}
  r('#efe0c0',13,11,2,3);r('#c0392b',12,9,4,2);r('#f8f4ee',13,9,1,1)}],
dnotice:[24,r=>{r('#6b4a2e',2,8,2,16);r('#6b4a2e',12,8,2,16);r('#8a5a36',0,2,16,10);r('#a8794c',0,2,16,1);r('#5a3a22',0,11,16,1);
  r('#f4f1e8',2,4,5,6);r('#f2e6a0',8,3,6,4);r('#f4f1e8',9,8,5,3);r('#c0392b',4,4,1,1);r('#2e6f9a',11,3,1,1);for(const[x,y]of[[3,6],[3,8],[9,5],[10,9]])r('#8a8f98',x,y,3,1)}],
dbarrel:[16,r=>{r('#8a5a36',2,2,12,13);r('#a8794c',3,2,3,13);r('#6b4a2e',11,2,2,13);r('#3a3d44',2,4,12,1);r('#3a3d44',2,11,12,1);r('#c49565',3,0,10,3);r('#8a5a36',4,1,8,1)}],
dcrate:[14,r=>{r('#a8794c',1,2,14,12);r('#8a5a36',1,2,14,1);r('#8a5a36',1,13,14,1);r('#8a5a36',1,2,1,12);r('#8a5a36',14,2,1,12);pline(r,2,3,13,12,'#8a5a36');r('#c49565',2,3,12,1)}],
drock:[14,r=>{for(let y=0;y<14;y++)for(let x=0;x<16;x++){if(((x-7.5)/7.4)**2+((y-8)/6)**2>1)continue;const L=((16-x)+(14-y))/30;r(L>.75?'#c9ced4':L>.55?'#9aa3ad':L>.38?'#7d858e':'#5f666e',x,y)}r('#5f666e',7,6,4,1)}]});
const DPROP={lamp:'dlamp',bench:'dbench',planter:'dflowers',bush:'dbush',mailbox:'dmailbox',woodpile:'dlogs',snowman:'dmush',phone:'dnotice',chalk:'dnotice',cafetable:'dbarrel',bike:'dcrate',rock:'drock',crate:'dcrate',barrel:'dbarrel'};
// A hot spring pool: steaming turquoise water in a ring of dark volcanic stones, with snow on the stones round the edge.
function poolArt(w,h){const W=w*16,H=h*16,c=cnv(W,H),g=c.getContext('2d'),r=(col,x,y,a=1,b=1)=>{g.fillStyle=col;g.fillRect(x,y,a,b)};
  const rx=W/2-.5,ry=H/2-.5;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot((x-rx)/rx,(y-ry)/ry),wob=(vnoise(x/4,y/4,w*7+h)-.5)*.12;
    if(d>1+wob)continue;if(d>.8+wob){const st=vnoise(x/3,y/3,w+h*5);r(st>.62?'#7a7066':st>.38?'#5a5048':'#463e38',x,y);if(y<ry&&st>.55&&d>.88+wob)r(SNOW,x,y)}
    else{const k=d/(.8+wob);r(k<.45?'#1f8f94':k<.75?'#2fa9a8':'#56c9bd',x,y);if(hash(x,y,w*3+h)>.985)r('#c8f4ec',x,y)}}
  for(let y=4;y<H-4;y+=5)for(let x=6;x<W-6;x+=9)if(Math.hypot((x-rx)/rx,(y-ry)/ry)<.6)r('rgba(220,255,250,.45)',x+(y%3),y,4,1);return c}
// A church spire: an octagonal slated spire with little lucarnes, snow caught on its ribs and a gold cross on top. Drawn 22 x 40.
const spireArt=(roof)=>mk(22,40,r=>{for(let y=6;y<40;y++){const hw=Math.max(1,Math.round((y-6)/34*10));for(let x=11-hw;x<11+hw;x++)r(x==11-hw||x==10+hw?shade(roof,-.3):(x==11||x==10)?shade(roof,.15):(y%4==0?shade(roof,-.15):roof),x,y);
    if(y%7==3)r(SNOW,11-hw,y,2,1)}r('#c9a040',10,0,2,7);r('#c9a040',8,2,6,2);r('#e8c860',10,0,1,7);for(const ly of[24,32])r('#2a2a33',10,ly,2,3)});
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
// Autumn trees: a round crown turning orange, rust, gold or still green (v 0-4), or a green pine with no snow (v 5).
const AUTUMN_LEAVES=[['#f0a040','#d87a2a','#b0581e','#7a3a18'],['#d0683a','#a8482a','#7e3220','#4e2214'],['#ecc050','#c89a30','#9a7020','#6a4a14'],
  ['#8ab04a','#6a943a','#4a742a','#2e5020'],['#c8a040','#a0702a','#7a5020','#4e3418']];
function autumnTree(v){if(v==5)return pine(0);const P=AUTUMN_LEAVES[v];return mk(16,28,r=>{r('#5a3a22',7,18,2,10);r('#7a5232',7,18,1,10);r('#4a2e1a',5,26,6,2);
  for(let y=0;y<21;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-10)+(hash(x,y,v+700)-.5)*1.6;if(d>7.6)continue;
    const L=((15-x)+(20-y))/35+(vnoise(x/3,y/3,v*5+710)-.5)*.5;r(P[L>.72?0:L>.5?1:L>.32?2:3],x,y)}
  for(const[x,y]of[[2,26],[12,27],[9,27]])r(P[1],x,y)})}
// Curated trees: a clipped lollipop on a straight stem (v 0, 2) or a trim cypress cone (v 1), suspiciously perfect.
function curatedTree(v){return mk(16,28,r=>{r('#6b4a2e',7,14,2,12);r('#8a6a45',7,14,1,12);r('#7a5a3a',4,25,8,3);r('#9a7a50',4,25,8,1);
  if(v==1){for(let y=0;y<24;y++){const hw=Math.max(1,Math.round(y*.3));for(let x=8-hw;x<8+hw;x++)r(x<8-hw/3?'#7ad65a':x<8+hw/3?'#5cbf4a':'#3e9a38',x,y)}return}
  const R=v==2?5.5:6.5;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5);if(d>R)continue;const L=((15-x)+(15-y))/30;r(d>R-1?'#2a7a2e':L>.72?'#8ae06a':L>.5?'#5cbf4a':'#3e9a38',x,y)}})}
const WXTREES={},treesFor=wx=>wx=='autumn'?WXTREES.a??=[0,1,2,3,4,5].map(autumnTree):wx=='curated'?WXTREES.c??=[0,1,2].map(curatedTree):TREES;
const RCACHE={},rocksNow=()=>WMAP?RCACHE[WXID]??=[0,1,2].map(rockArt):ROCKS;
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
// A billboard on two steel legs over a little catwalk: lines of text t on colour bg, with an optional logo drawn at the left.
function bbArt(t,bg,fg,logo){return[34,r=>{for(const x of[10,36]){r('#5a5f68',x,19,2,15);r('#7d858e',x,19,1,15)}r('#3a3d44',4,19,40,2);r('#5a5f68',4,18,40,1);
  r('#2b2f3a',0,0,48,19);r(bg,1,1,46,17);r(shade(bg,.25),1,1,46,1);r(shade(bg,-.25),1,16,46,2);const x0=logo?11:1,aw=logo?36:46;
  t.forEach((l,i)=>ptext(r,l,x0+((aw-l.length*4+1)>>1),(t.length==1?7:4)+i*7,fg));if(logo)logo(r);r(SNOW,0,0,48,1);r('#ffe08a',12,20,2,1);r('#ffe08a',34,20,2,1)},48]}
// A shipping container: corrugated steel with doors at one end, a stencilled mark and snow on the roof.
const contArt=(col,mk2)=>[18,r=>{r(col,0,3,32,15);for(let x=1;x<32;x+=3)r(shade(col,-.18),x,4,1,13);r(shade(col,.2),0,3,32,1);r(shade(col,-.35),0,16,32,2);
  r(shade(col,-.3),24,4,1,12);r('#c9ced4',26,7,1,5);r('#c9ced4',29,7,1,5);ptext(r,mk2,4,8,'#f2f2f2');r(SNOW,0,1,32,3);r(SNOWD,0,4,32,1)},32];
Object.assign(PA,{
// Frostholm (the city): street furniture, billboards and shipping containers
slamp:[30,r=>{r('#3a3d44',5,27,6,3);r('#5a5f68',7,3,2,25);r('#7d858e',7,3,1,25);r('#5a5f68',8,2,6,2);r('#3a3d44',10,3,5,3);r('#ffcf6b',10,6,5,1);r('#fff1c8',11,6,2,1);r(SNOW,8,1,6,1)}],
newsbox:[14,r=>{r('#2e6f9a',2,2,12,10);r('#3d86b8',2,2,12,1);r('#f4f4f0',4,4,8,4);r('#3a3a44',5,5,6,1);r('#3a3a44',5,6,4,1);r('#c9a040',11,9,2,1);r('#3a3d44',3,12,2,2);r('#3a3d44',11,12,2,2);r(SNOW,2,1,12,1)}],
bin:[13,r=>{r('#3a3d44',4,3,8,10);r('#5a5f68',4,3,2,10);for(let y=5;y<12;y+=3)r('#2b2f3a',6,y,6,1);r('#2b2f3a',3,1,10,2);r(SNOW,3,0,10,1)}],
hydrant:[12,r=>{r('#c0392b',5,3,6,9);r('#e04a3a',5,3,2,9);r('#a52f24',4,1,8,3);r('#a52f24',3,6,2,2);r('#a52f24',11,6,2,2);r('#e0a100',7,0,2,1);r(SNOW,5,0,2,1)}],
bb_cola:bbArt(['KELP COLA','ICE COLD'],'#2e9d57','#ffffff',r=>{r('#5a2a14',4,6,3,9);r('#5a2a14',5,3,1,3);r('#f2f2f2',4,9,3,2)}),
bb_oil:bbArt(['DIVERSIFIED','PETROLEUM'],'#37474f','#e0a100'),
bb_burger:bbArt(['POLAR','BURGER'],'#c0392b','#ffd23a',r=>{r('#e0a100',3,5,7,3);r('#f0c040',4,5,4,1);r('#5a3a26',3,8,7,2);r('#3d9a5e',2,10,9,1);r('#e0a100',3,11,7,2)}),
bb_mart:bbArt(['NORDMART','OPEN LATE'],'#1a1c22','#3bd0ff'),
cont_r:contArt('#b5402f','DP'),cont_b:contArt('#2e5f8f','DP'),cont_g:contArt('#2e7d4a','KC'),
// Saltwick (run down): junk, tyres, a stray cat
tyre:[8,r=>{r('#2a2a30',1,2,14,6);r('#2a2a30',3,1,10,1);r('#45454e',2,3,12,1);r('#1a1a1e',5,4,6,2);r('#45454e',5,6,6,1);r(SNOW,3,1,6,1)}],
junk:[12,r=>{r('#8a6038',1,6,9,6);r('#6e4a2a',1,8,9,1);r('#a8794c',2,6,2,1);r('#3a2a20',5,6,2,6);r('#6b737c',8,2,7,10);r('#8d959e',8,2,7,1);r('#8a4a2a',9,4,2,6);r('#8a4a2a',12,7,2,4);r(SNOW,1,5,4,1);r(SNOW,8,1,4,1)}],
cat:[9,r=>{r('#2a2a30',4,3,7,6);r('#2a2a30',3,1,4,4);r('#2a2a30',3,0,1,1);r('#2a2a30',6,0,1,1);r('#e0c040',4,2,1,1);r('#2a2a30',11,5,3,1);r('#2a2a30',13,3,1,2);r('#3a3a44',5,8,2,1)}],
litter:[5,r=>{r('#f2f2f2',1,2,3,2);r('#d8d2c0',2,1,2,1);r('#c0392b',8,2,2,3);r('#9aa3ad',8,1,2,1);r('#c9b28a',12,3,3,1)}],
bfence:[12,r=>{r('#6b5a48',1,0,2,12);r('#6b5a48',12,4,2,8);r('#6b5a48',14,3,1,1);r('#7d6a52',0,3,8,2);r('#5a4a38',8,4,2,1);r('#7d6a52',5,8,11,2);r('#958066',5,8,11,1);r(SNOW,0,2,8,1);r(SNOW,1,0,2,1)}],
trashbin:[15,r=>{r('#5a6050',3,4,10,11);r('#6b7260',3,4,2,11);r('#8a4a2a',9,8,2,4);r('#4a4f44',2,2,9,2);r('#4a4f44',10,1,3,2);r('#f2f2f2',11,3,3,2);r('#c9a040',5,1,2,2);r('#c0392b',8,0,2,2);r(SNOW,3,1,4,1)}],
oldboat:[12,r=>{for(let y=0;y<9;y++){const hw=Math.round(13-Math.abs(y-2)*.6);r(y<1?SNOW:y%3==2?'#4a5a5a':'#5a6a6a',16-hw,y,hw*2,1)}r('#8a4a2a',6,3,5,3);r('#c9c2b0',20,4,4,2);
  r('#6b5a48',4,9,4,3);r('#6b5a48',24,9,4,3)},32],
// Hope Springs (the rich): ornate lamps, stone urns, topiary, flower beds, sun loungers and gate pillars
lamp2:[28,r=>{r('#1a1a22',4,24,8,4);r('#c9a040',4,24,8,1);r('#1a1a22',7,9,2,15);r('#c9a040',6,15,4,1);r('#1a1a22',4,2,8,2);r('#ffe9a8',5,4,6,5);r('#fff6d0',6,4,2,3);r('#1a1a22',7,4,1,5);
  r('#c9a040',4,9,8,1);r('#c9a040',7,0,2,2);r(SNOW,4,1,8,1)}],
urn:[14,r=>{r('#c9ced4',6,11,4,3);r('#a9b0b8',5,13,6,1);r('#e8ecef',3,6,10,5);r('#c9ced4',4,10,8,1);r('#ffffff',4,6,2,4);r('#2b5c4b',3,4,10,2);
  for(const[x,y,c]of[[4,2,'#c0392b'],[7,1,'#e07a9a'],[10,2,'#ffd23a'],[6,3,'#f2f2f2'],[11,4,'#e07a9a']])r(c,x,y,2,2)}],
topiary:[26,r=>{r('#a8794c',5,21,6,5);r('#c49565',5,21,6,1);r('#7a5232',6,18,4,3);for(const[y,hw]of[[12,5],[13,6],[14,6],[15,6],[16,5],[17,4],[4,3],[5,4],[6,4],[7,4],[8,3],[9,2],[0,1],[1,2],[2,2],[3,1]])r(y%5==1?'#3e7a62':'#2b5c4b',8-hw,y,hw*2,1);
  r(SNOW,4,12,8,1);r(SNOW,5,4,6,1);r(SNOW,7,0,2,1)}],
roses:[8,r=>{r('#d8d2c0',0,5,16,3);r('#e8e2d4',0,5,16,1);r('#5a3d2a',1,3,14,2);for(let x=1;x<15;x+=2){r('#2b5c4b',x,1,2,3);r(['#e07a9a','#f2f2f2','#c0392b','#ffd23a'][(x>>1)%4],x,(x>>1)&1,2,2)}}],
lounger:[8,r=>{r('#f2efe6',1,4,14,2);r('#d8d2c0',1,5,14,1);r('#f2efe6',10,0,5,4);r('#d8d2c0',11,1,1,3);r('#d8d2c0',13,1,1,3);r('#a8794c',2,6,1,2);r('#a8794c',13,6,1,2);r('#2e86c1',2,3,7,1)}],
gatepost:[26,r=>{r('#e8e2d4',3,7,10,19);r('#d8d0c0',10,7,3,19);for(let y=10;y<25;y+=5)r('#c9c2b0',3,y,10,1);r('#d8d2c0',2,5,12,3);r('#f2ede0',2,5,12,1);r('#c9a040',6,1,4,4);r('#e8c860',6,1,2,2);r(SNOW,2,4,12,1)}],
// Eastbrook (Pacific Northwest): bikes, chalkboards, timber planters, cafe tables
bike:[12,r=>{for(const cx of[3,12])for(let a=0;a<12;a++){const x=Math.round(cx+Math.cos(a/12*6.283)*3),y=Math.round(8+Math.sin(a/12*6.283)*3);r('#2a2a30',x,y,1,1)}
  pline(r,3,8,7,8,'#c0392b');pline(r,7,8,10,4,'#c0392b');pline(r,5,4,10,4,'#c0392b');pline(r,3,8,5,4,'#c0392b');pline(r,10,4,12,8,'#c0392b');r('#3a2a20',4,3,3,1);r('#5a5f68',10,2,3,1)}],
chalk:[16,r=>{r('#7a5232',2,1,12,13);r('#946640',2,1,12,1);r('#2f3a32',3,2,10,10);r('#f2f2f2',4,4,6,1);r('#f2f2f2',4,6,8,1);r('#e07a9a',4,8,4,1);r('#ffd23a',9,8,2,1);r('#f2f2f2',4,10,5,1);
  r('#7a5232',2,14,2,2);r('#7a5232',12,14,2,2);r(SNOW,2,0,12,1)}],
planter:[16,r=>{r('#7a5232',1,10,14,6);r('#946640',1,10,14,1);r('#5a3a22',1,13,14,1);r('#5a3a22',5,10,1,6);r('#5a3a22',10,10,1,6);
  for(const[y,hw]of[[1,1],[2,2],[3,2],[4,3],[5,4],[6,3],[7,5],[8,6],[9,6]])r(y%3==1?'#3e7a62':'#2b5c4b',8-hw,y,hw*2,1);r(SNOW,6,2,4,1);r(SNOW,4,5,4,1);r(SNOW,3,8,4,1)}],
weird:[30,r=>{for(const x of[6,56]){r('#5a3d2a',x,14,3,16);r('#7a5232',x,14,1,16)}r('#7a5232',0,0,64,15);r('#946640',0,0,64,1);for(let y=4;y<15;y+=4)r('#6b4a2e',0,y,64,1);
  r(SNOW,0,0,64,1);ptext(r,'KEEP EASTBROOK',(64-55)>>1,2,'#f2e6c8');ptext(r,'WEIRD',(64-19)>>1,8,'#ffd23a');r('#e07a9a',4,9,3,3);r('#7fd0a0',57,9,3,3)},64],
logs:[16,r=>{for(const[x,y]of[[1,9],[11,9],[21,9],[6,4],[16,4],[11,0]]){r('#5a3d2a',x,y,10,7);r('#7a5232',x,y,10,1);r('#c9a36a',x+7,y+1,3,5);r('#e0c08a',x+8,y+2,1,3)}
  r(SNOW,6,4,20,1);r(SNOW,11,0,10,1)},32],
stump:[10,r=>{r('#5a3d2a',3,4,10,6);r('#6b4a2e',3,9,10,1);r('#c9a36a',3,2,10,3);r('#e0c08a',5,3,6,1);r('#a8834a',7,3,2,1);r('#4a3222',2,9,2,1);r('#4a3222',12,9,2,1);r(SNOW,4,2,4,1)}],
axe:[14,r=>{r('#5a3d2a',3,6,10,8);r('#c9a36a',3,4,10,3);r('#e0c08a',5,5,6,1);r('#8a6a45',8,0,1,7);r('#9aa3ad',6,0,3,3);r('#c9ced4',6,0,1,3)}],
cafetable:[12,r=>{r('#3a3d44',7,5,2,7);r('#2b2f3a',5,11,6,1);r('#5a3d2a',3,3,10,2);r('#7a5436',3,3,10,1);r('#f2f2f2',6,1,2,2);r('#8a5a36',9,2,2,1);
  for(const x of[0,13]){r('#3a3d44',x,4,3,1);r('#3a3d44',x,7,3,1);r('#3a3d44',x+(x?2:0),4,1,8)}}]});
Object.assign(PA,{
scarecrow:[28,r=>{r('#7a5232',7,10,2,18);r('#8a6a45',7,10,1,18);r('#7a5232',1,13,14,2);r('#d8b040',0,12,2,3);r('#d8b040',14,12,2,3);r('#c9a030',1,15,1,2);r('#c9a030',14,15,1,2);
  r('#3a4a6a',4,12,8,10);r('#2e3a56',10,12,2,10);r('#c9a040',5,15,3,3);r('#3a4a6a',3,21,2,2);r('#3a4a6a',8,21,2,3);r('#d8b040',6,22,1,2);
  for(let y=0;y<10;y++)for(let x=0;x<14;x++){if(((x-7)/6.5)**2+((y-5.5)/4.6)**2>1)continue;r(x<4||x>10?'#c0601e':x%4==1?'#d06a22':'#e8822a',x+1,y)}
  r('#5a7a2a',7,0,2,2);r('#3a2418',5,4,2,2);r('#3a2418',9,4,2,2);r('#3a2418',6,7,4,1);r('#ffd27a',6,5,1,1)}],
pumpkins:[10,r=>{for(const[x,w]of[[0,8],[8,7]]){for(let y=3;y<10;y++)for(let i=0;i<w;i++){if(((i-w/2+.5)/(w/2))**2+((y-6.5)/3.6)**2>1)continue;r(i%3==1?'#d06a22':i<1||i>w-2?'#c0601e':'#e8822a',x+i,y)}r('#5a7a2a',x+w/2-1|0,1,2,3)}
  r('#4a7a2a',6,2,3,1)}]});
Object.assign(PA,{
vending:[22,r=>{r('#1f7a44',2,0,12,22);r('#2e9d57',2,0,10,22);r('#3dba6a',2,0,10,1);r('#d8fff0',4,3,6,11);for(let y=4;y<13;y+=3)for(let x=5;x<10;x+=2)r(['#5a2a14','#c0392b','#f2f2f2'][(x+y)%3],x,y,1,2);
  r('#14121c',4,15,6,3);r('#9aa3ad',11,6,1,3);ptext(r,'KC',4,18,'#f2f2f2');r(SNOW,2,0,12,1)}],
steamgrate:[4,r=>{r('#2a2e38',1,0,14,4);for(let x=2;x<15;x+=2)r('#14161c',x,1,1,2);r('#4a505c',1,0,14,1)}],
neonpole:[30,r=>{r('#14121c',7,9,2,21);r('#2a2836',7,9,1,21);r('#14121c',5,28,6,2);r('#14121c',0,0,16,10);r('#24202e',1,1,14,8);r(SNOW,0,0,16,1)}]});
// Neon billboards: a dark panel on steel legs whose lettering is neon (drawn each frame, so it glows and flickers), lighting the
// street below at night. NB: the lines of text and the neon colour.
const NB={nb_burger:[['POLAR','BURGER'],'#ff8a3a']};
for(const k in NB){const col=NB[k][1];PA[k]=[34,r=>{for(const x of[10,36]){r('#3a3d44',x,19,2,15);r('#5a5f68',x,19,1,15)}r('#2b2f3a',4,19,40,2);r('#3a3d44',4,18,40,1);
  r('#2b2f3a',0,0,48,19);r('#120e1c',1,1,46,17);r(shade(col,-.55),2,2,44,1);r(shade(col,-.55),2,16,44,1);r(shade(col,-.55),2,2,1,15);r(shade(col,-.55),45,2,1,15);r(SNOW,0,0,48,1)},48]}
// weather swaps for props that only make sense in the snow
const WXPROP={autumn:{snowman:'scarecrow',sled:'pumpkins'},curated:{snowman:'topiary',sled:'roses'}};
// ---- People: 16x20, outlined, 4 directions, 2 walking frames, drawn from who they are (NPCS in data.js): their clothes, hair and
// hat colours (body, hair, hat), and from their name, gender and job a look of their own. Picked from the name (so it's always the
// same) unless the person sets it: a skin tone (skin: 0 fairest to 3), a hairstyle (style: short, side, curly, buzz or bald; long,
// bob, ponytail or bun for women), facial hair (beard: beard, moustache, stubble or 'none'), and for women a skirt (skirt: true or
// false). Monks, farmers, fishermen and the strongman have beards; cooks, vendors and bar staff wear aprons; soldiers and police
// wear peaked caps. Faces have brows and a mouth (women lashes and lipstick), torsos are lit from the upper left, with a collar and
// a belt.
const CH={},SKINS=['#f1c7a0','#ebbb92','#dca57e','#b07a52'],PANTS=['#2d3046','#3a2e28','#4a4a52','#5a5040','#2a3a4a'],SHOES=['#3b2a22','#2a2a33','#5a3a26'];
const nameHash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
function looksOf(n){const H=nameHash(n.name||''),f=n.gender=='female',job=n.job||'',body=n.body||'#5a6a4a',hair=n.hair||'#5a3a22';
  const grey=['#b5b5b5','#e8e8e8','#7a7a7a','#cfcfcf'].includes(hair);
  const sk=SKINS[n.skin??[0,0,0,0,1,1,2,3][H%8]];
  let style=n.style??(f?['long','bob','ponytail','bun','long','bob'][(H>>>3)%6]:['short','side','curly','short','buzz','side'][(H>>>3)%6]);if(n.style==null&&!f&&grey&&(H>>>5)%3==0)style='bald';
  const beard=n.beard?(n.beard=='none'?null:n.beard):!f&&(/monk|abbot|prior|farmer|fisherman|strongman/i.test(job)||(H>>>7)%5==0)?['beard','moustache','stubble'][(H>>>8)%3]:null;
  const skirt=(n.skirt??(f&&(H>>>11)%3!=0&&!/soldier|sentry|police|sergeant|loader|worker|rig|dock|depot|farmer|acrobat/i.test(job)))?shade(body,-.32):null;
  return{f,sk,skd:shade(sk,-.14),style,beard,pants:PANTS[(H>>>9)%5],skirt,tights:'#3a3238',shoe:SHOES[(H>>>13)%3],
    apron:/cook|chef|baker|fishmonger|roaster|vendor|bartender|laundress|burger/i.test(job),capJob:/soldier|sentry|sergeant|corporal|colonel|police/i.test(job),
    hat:n.hat,body,bl:shade(body,.2),bd:shade(body,-.28),arm:shade(body,-.36),hair,hl:shade(hair,.28),hd:shade(hair,-.3)}}
function npcSprite(n,d,fr){const key=[n.name,d,fr,n.body,n.hair,n.hat].join();if(CH[key])return CH[key];const L=looksOf(n),side=d>1;
  return CH[key]=mk(16,20,r0=>{const r=(c,x,y,w=1,h=1)=>r0(c,d==3?16-x-w:x,y,w,h);
    // legs and shoes (a skirt shows dark tights below it)
    const leg=L.skirt?L.tights:L.pants;
    if(!side){const a=fr==1?1:0,b=fr==2?1:0;r(leg,5,15,2,3-a);r(leg,9,15,2,3-b);r(L.shoe,5,18-a,2,2);r(L.shoe,9,18-b,2,2);if(!L.skirt)r(shade(leg,.15),5,15,1,3-a)}
    else if(fr==1){r(leg,4,15,2,3);r(leg,9,15,2,3);r(L.shoe,3,18,3,2);r(L.shoe,9,18,3,2)}
    else{const l=fr==2?1:0;r(leg,6,15,2,3-l);r(leg,8,15,2,3);r(L.shoe,5,18-l,3,2);r(L.shoe,8,18,3,2)}
    // the torso: light from the upper left, a darker right side, a lighter line across the shoulders
    r(L.body,4,9,8,6);r(L.bl,4,9,1,6);r(L.bd,10,9,2,6);r(L.bl,5,9,5,1);
    // a skirt flaring below the waist, or a belt (with a buckle, from the front)
    if(L.skirt){r(L.skirt,4,14,8,2);r(L.skirt,3,16,10,1);r(shade(L.skirt,.18),4,14,1,3);r(shade(L.skirt,-.25),3,17,10,1)}
    else{r(shade(L.pants,-.45),4,14,8,1);if(d==0)r('#c9a040',7,14,2,1)}
    // the collar, and an apron over the front
    if(d==0){r(L.sk,7,9,2,1);r(shade(L.body,-.4),7,10,2,1)}
    if(L.apron&&d!=1){if(d==0){r('#f4f4f0',5,10,6,5);r('#d8d8d8',5,10,6,1);r('#d8d8d8',10,10,1,5)}else r('#f4f4f0',4,10,3,5)}
    // arms, swinging as they walk, with hands
    const s=fr==1?-1:fr==2?1:0;
    if(!side){r(L.arm,3,10+s,1,4);r(L.sk,3,14+s,1,1);r(L.arm,12,10-s,1,4);r(L.sk,12,14-s,1,1)}
    else{r(L.arm,7+s,10,2,4);r(L.sk,7+s,14,2,1)}
    // the head and face: brows, eyes, a mouth (lipstick and lashes for women) and rosy cheeks; from the side, a nose
    r(L.sk,4,2,8,6);r(L.sk,5,1,6,1);r(L.sk,5,8,6,1);if(!side)r(L.skd,11,2,1,6);
    const lip=L.f?'#c0505a':mix(L.sk,'#7a2a2a',.5);
    if(d==0){r(L.hd,5,4,2,1);r(L.hd,9,4,2,1);r(OUT,6,5,1,2);r(OUT,9,5,1,2);if(L.f){r(OUT,5,5,1,1);r(OUT,10,5,1,1)}r(lip,7,7,2,1);r('#e9a28f',5,7,1,1);r('#e9a28f',10,7,1,1)}
    else if(side){r(L.hd,5,4,2,1);r(OUT,5,5,1,2);r(L.sk,3,6,1,1);r(L.skd,9,5,1,2);r(lip,4,7,1,1)}
    // facial hair
    if(L.beard&&d!=1){const bc=L.hair,st=mix(L.sk,bc,.3);
      if(d==0){if(L.beard=='stubble'){r(st,5,7,6,1);r(st,6,8,4,1);r(lip,7,7,2,1)}else if(L.beard=='moustache')r(bc,6,6,4,1);else{r(bc,4,5,1,3);r(bc,11,5,1,3);r(bc,5,6,6,3);r(mix(L.sk,'#7a2a2a',.5),7,7,2,1)}}
      else{if(L.beard=='stubble')r(st,4,7,4,2);else if(L.beard=='moustache')r(bc,4,6,2,1);else r(bc,4,6,5,3)}}
    // hair, by style: a cap over the top, and how far down the sides (and the back) it falls
    const H=L.hair,st=L.style,len={short:4,side:4,curly:5,buzz:2,bald:4,long:12,bob:8,ponytail:4,bun:4}[st]||4;
    if(st=='buzz'){const c=mix(H,L.sk,.35);r(c,5,0,6,1);r(c,4,1,8,1);if(d==1)r(c,4,1,8,6)}
    else if(st=='bald'){if(d==1)r(H,4,4,8,2);else if(side)r(H,9,4,3,2);else{r(H,4,4,1,2);r(H,11,4,1,2)}}
    else{r(H,5,0,6,1);r(H,4,1,8,2);
      if(d==0){r(H,4,3,1,len-2);r(H,11,3,1,len-2);if(st=='long'||st=='bob'){r(H,3,2,1,len-1);r(H,12,2,1,len-1)}if(st=='side')r(H,5,3,4,1);if(st=='curly'){r(H,3,1,1,3);r(H,12,1,1,3)}}
      else if(d==1){const bl=Math.max(len,7);r(H,4,1,8,Math.min(bl,8));if(st=='long'||st=='bob')r(H,3,2,10,len-1);r(L.hd,5,Math.min(bl,8),6,1)}  // (from behind, hair covers the head down to the nape)
      else{r(H,8,1,4,Math.min(len,8));if(st=='long'||st=='bob')r(H,8,2,5,len-1)}
      if(st=='ponytail'){if(d==1)r(H,7,8,2,4);else if(side){r(H,12,2,2,2);r(H,13,4,1,4)}}
      if(st=='bun'){if(side)r(H,11,1,3,3);else if(d==1)r(H,6,2,4,3);else r(H,6,-1,4,2)}
      if(st=='curly')for(let x=4;x<12;x+=2)r(L.hl,x,(x>>1)%2,1,1);else if(d!=1)r(L.hl,6,0,2,1)}
    // a hat: a peaked uniform cap for soldiers and police, otherwise a knitted hat; a jester's cap ('jester|a|b'), split between
    // its two colours, with a drooping point on each side ending in a bell
    const hat=L.hat;
    if(hat&&hat.startsWith('jester')){const[,a,b]=hat.split('|'),bell='#ffd23a';
      if(!side){r(a,4,0,4,3);r(b,8,0,4,3);r(shade(a,-.25),4,3,4,1);r(shade(b,-.25),8,3,4,1);r(shade(a,.2),5,0,2,1);
        r(a,2,1,2,2);r(a,1,3,2,1);r(a,1,4,1,1);r(bell,0,5,2,2);r(b,12,1,2,2);r(b,13,3,2,1);r(b,14,4,1,1);r(bell,14,5,2,2)}
      else{r(a,4,0,5,3);r(b,9,0,3,3);r(shade(a,-.25),4,3,8,1);r(shade(a,.2),5,0,2,1);r(b,12,1,2,2);r(b,13,3,2,1);r(b,14,4,1,2);r(bell,14,6,2,2)}}
    else if(hat&&L.capJob){r(hat,4,0,8,3);r(shade(hat,.2),5,0,5,1);if(d==0)r(shade(hat,-.4),3,3,10,1);else if(side)r(shade(hat,-.4),1,3,5,1);r('#c9a040',7,1,2,1)}
    else if(hat){r(hat,4,1,8,2);r(hat,5,0,6,1);r(shade(hat,-.25),4,3,8,1);r('#f2f2f2',7,0,2,1);r(shade(hat,.2),5,1,2,1)}})}
// ---- The player, dressed as chosen at the wardrobe (a look: hair and hairCol, beard and beardCol, and the CLOTHES ids worn as
// hat, top, legs and shoes). 16x20, laid out like the NPCs (npcSprite); cached by look.
const LK={},HAIRS={
  // each style's hair as rectangles [x,y,w,h], seen from the front (f), back (b) and side (s)
  short:{f:[[4,1,8,3],[5,0,6,1],[4,4,1,2],[11,4,1,2]],b:[[4,1,8,7],[5,0,6,1]],s:[[4,1,8,3],[5,0,6,1],[9,4,3,3],[10,7,2,1]]},
  long:{f:[[4,1,8,3],[5,0,6,1],[3,2,2,8],[11,2,2,8]],b:[[4,1,8,3],[5,0,6,1],[3,2,10,8]],s:[[4,1,8,3],[5,0,6,1],[8,3,4,7],[12,4,1,5]]},
  bob:{f:[[4,1,8,2],[5,0,6,1],[3,2,2,6],[11,2,2,6]],b:[[4,1,8,3],[5,0,6,1],[3,2,10,6]],s:[[4,1,8,3],[5,0,6,1],[8,3,4,5]]},
  ponytail:{f:[[4,1,8,3],[5,0,6,1],[4,4,1,2],[11,4,1,2]],b:[[4,1,8,7],[5,0,6,1],[7,8,2,4]],s:[[4,1,8,3],[5,0,6,1],[9,4,3,3],[12,3,2,2],[13,5,1,4]]},
  curly:{f:[[3,0,10,3],[3,3,2,3],[11,3,2,3]],b:[[3,0,10,8]],s:[[3,0,10,4],[9,4,4,4]]},
  buzz:{f:[[5,0,6,1],[4,1,8,1]],b:[[5,0,6,1],[4,1,8,6]],s:[[5,0,6,1],[4,1,8,1],[9,2,3,4]]},
  bald:{f:[[4,4,1,2],[11,4,1,2]],b:[[4,4,8,3]],s:[[9,4,3,2]]}};
const wearing=lk=>({hat:CLOTHES[lk.hat]||CLOTHES.nohat,top:CLOTHES[lk.top]||CLOTHES.parka_blue,legs:CLOTHES[lk.legs]||CLOTHES.jeans_blue,shoes:CLOTHES[lk.shoes]||CLOTHES.boots_brown});
function lookChar(d,fr,lk){const key=d+','+fr+','+JSON.stringify(lk);if(LK[key])return LK[key];const w=wearing(lk);
  const sk='#f1c7a0',skd='#d9a37a',side=d>1,v=d==0?'f':d==1?'b':'s',tc=w.top.col,pt=w.legs.col,sh=w.shoes,hair=lk.hairCol,bc=lk.beardCol;
  return LK[key]=mk(16,20,r0=>{const r=(c,x,y,ww=1,h=1)=>r0(c,d==3?16-x-ww:x,y,ww,h);
    // legs and feet, each [leg x, leg width, leg length, foot x, foot width, foot top]: boots and snow boots are two rows high (snow
    // boots with a fleece top), sneakers white with a grey sole, and shoes one row under a longer trouser leg
    let ft;if(!side){const a=fr==1?1:0,b=fr==2?1:0;ft=[[5,2,3-a,5,2,18-a],[9,2,3-b,9,2,18-b]]}
    else if(fr==1)ft=[[4,2,3,3,3,18],[9,2,3,9,3,18]];else{const l=fr==2?1:0;ft=[[6,2,3-l,5,3,18-l],[8,2,3,8,3,18]]}
    const low=sh.style=='shoes';
    for(const[lx,lw,lh,fx,fw,fy]of ft){r(pt,lx,15,lw,lh+(low?1:0));
      if(w.legs.style=='jeans')r(shade(pt,.2),lx,15,1,lh);if(w.legs.style=='cords')r(shade(pt,-.28),lx+1,15,1,lh);
      if(sh.style=='boots')r(sh.col,fx,fy,fw,2);
      else if(sh.style=='snowboots'){r(sh.col,fx,fy,fw,2);r(shade(sh.col,-.3),fx,fy+1,fw,1);r('#e8dcc0',fx,fy-1,fw,1)}
      else if(sh.style=='sneakers'){r(sh.col,fx,fy,fw,1);r('#9aa3ad',fx,fy+1,fw,1)}
      else{r(sh.col,fx,fy+1,fw,1);r(shade(sh.col,.45),fx,fy+1,1,1)}}
    // the top: a trench coat's skirt hangs over the legs
    const bl=shade(tc,.18),bd=shade(tc,-.28),arm=shade(tc,-.35),st=w.top.style;
    if(st=='trench'){r(tc,4,15,8,2);r(bd,4,16,8,1);if(d==0)r(bd,7,15,1,2)}
    r(tc,4,9,8,6);r(bl,4,9,1,6);r(bd,10,9,2,6);r(bd,4,14,8,1);r(bl,5,9,5,1);if(st!='trench'){r(shade(pt,-.45),4,14,8,1);if(d==0)r('#c9a040',7,14,2,1)}
    if(st=='parka'){if(d==0)r(bd,7,10,1,4);r('#e8dcc0',4,9,8,1)}
    if(st=='sweater'){r(shade(tc,-.22),4,14,8,1);if(d!=1)r(shade(tc,-.22),6,9,4,1)}
    if(st=='flannel'){for(const x of[5,8,11])r(shade(tc,-.4),x,9,1,6);for(const y of[11,13])r(shade(tc,-.4),4,y,8,1);if(d==0)r(shade(tc,.3),7,9,2,1)}
    if(st=='suit'){if(d==0){r('#f2f2f2',6,9,4,2);r('#c0392b',7,10,2,3);r(shade(tc,.18),6,11,1,3);r(shade(tc,.18),9,11,1,3)}else if(side)r('#f2f2f2',4,9,2,1)}
    if(st=='trench'){r(shade(tc,-.4),4,12,8,1);if(d==0){r(bd,6,9,1,3);r(bd,9,9,1,3)}}
    // arms
    if(!side){const s=fr==1?-1:fr==2?1:0;r(arm,3,10+s,1,4);r(sk,3,14+s,1,1);r(arm,12,10-s,1,4);r(sk,12,14-s,1,1)}
    else{const s=fr==1?-1:fr==2?1:0;r(arm,7+s,10,2,4);r(sk,7+s,14,2,1)}
    // the head and face
    r(sk,4,2,8,6);r(sk,5,1,6,1);r(sk,5,8,6,1);if(!side)r(skd,11,2,1,6);
    if(d==0){r(shade(hair,-.3),5,4,2,1);r(shade(hair,-.3),9,4,2,1);r(OUT,6,5,1,2);r(OUT,9,5,1,2);r(mix(sk,'#7a2a2a',.5),7,7,2,1);r('#e9a28f',5,7,1,1);r('#e9a28f',10,7,1,1)}
    else if(side){r(shade(hair,-.3),5,4,2,1);r(OUT,5,5,1,2);r(sk,3,6,1,1);r(skd,8,5,1,2);r(mix(sk,'#7a2a2a',.5),4,7,1,1)}
    // facial hair (not seen from behind)
    const B=lk.beard,stb=mix(sk,bc,.45);
    if(d==0){if(B=='stubble'){r(stb,5,7,6,1);r(stb,6,8,4,1)}if(B=='moustache'||B=='goatee')r(bc,6,7,4,1);if(B=='goatee')r(bc,7,8,2,1);
      if(B=='beard'){r(bc,4,5,1,3);r(bc,11,5,1,3);r(bc,5,7,6,2);r('#8a4a3a',7,7,2,1)}}
    else if(side){if(B=='stubble'){r(stb,4,7,4,1);r(stb,5,8,3,1)}if(B=='moustache'||B=='goatee')r(bc,4,7,2,1);if(B=='goatee')r(bc,4,8,2,1);
      if(B=='beard'){r(bc,4,7,5,2);r(bc,7,5,2,2)}}
    // hair, a buzz cut showing the scalp through it
    const hc=lk.hair=='buzz'?mix(hair,sk,.35):hair;(HAIRS[lk.hair]||HAIRS.short)[v].forEach(([x,y,ww,h])=>r(hc,x,y,ww,h));
    if(lk.hair=='short'&&d==1)r(shade(hair,-.3),5,8,6,1);
    if(!['bald','buzz'].includes(lk.hair)&&d!=1)r(shade(hair,.25),d==0?6:5,lk.hair=='curly'?0:1,2,1);
    if(lk.hair=='curly')for(const[x,y]of[[4,1],[8,0],[11,2],[6,2]])r(shade(hair,.25),x,y,1,1);
    // headwear
    const ht=w.hat,c=ht.col;
    if(ht.style=='beanie'){r(c,4,1,8,2);r(c,5,0,6,1);r(shade(c,-.25),4,3,8,1);r('#f2f2f2',7,0,2,1);r(shade(c,.2),5,1,2,1)}
    if(ht.style=='flatcap'){r(c,4,1,8,2);r(c,5,0,6,1);r(shade(c,.15),6,1,3,1);if(side)r(shade(c,-.3),2,3,5,1);else r(shade(c,-.3),4,3,8,1)}
    if(ht.style=='ushanka'){r(c,3,0,10,3);r(shade(c,.3),3,2,10,1);r(shade(c,.15),5,0,3,1);if(d==0){r(c,3,3,2,4);r(c,11,3,2,4)}else if(side)r(c,8,3,3,4);else r(c,3,3,10,3)}
    if(ht.style=='fedora'){r(c,5,0,6,2);r(shade(c,-.45),5,2,6,1);r(shade(c,-.15),2,3,12,1);r(shade(c,.2),6,0,2,1)}
    if(ht.style=='souwester'){r(c,4,0,8,3);r(shade(c,.25),5,0,3,1);r(shade(c,-.25),2,3,12,1);if(d==1)r(c,3,4,10,3);else if(side)r(c,9,3,5,4);else{r(c,2,3,2,2);r(c,12,3,2,2)}}
    if(ht.style=='beret'){r(c,3,1,9,2);r(c,4,0,6,1);r(shade(c,-.3),4,3,8,1);r(shade(c,.25),5,1,2,1)}})}
function dressed(px,py,d,fr,lk){ctx.fillStyle='rgba(20,30,55,.28)';ctx.fillRect(px+3,py+14,10,3);ctx.fillRect(px+4,py+13,8,5);ctx.drawImage(lookChar(d,fr,lk),px-1,py-5)}
// Costumes: someone in a giant Kelp Cola cup (kind 'cup'), seen from the front, side or back. 16x26, cached.
const COST={};
function costume(kind,d,fr){const key=kind+d+fr;if(COST[key])return COST[key];const side=d>1,back=d==1,f=d==3?(x,w=1)=>16-x-w:(x)=>x;
  return COST[key]=mk(16,26,r0=>{const r=(c,x,y,w=1,h=1)=>r0(c,f(x,w),y,w,h);
    // straw (red and white stripes) and lid
    for(let y=0;y<6;y++)r(y%2?'#f2f2f2':'#c0392b',back?6:9,y,2,1);r('#e8e8e8',2,5,12,3);r('#ffffff',3,5,9,1);r('#c9ced4',2,7,12,1);
    // the cup: red, tapering towards the bottom, with a white band and a green KC badge
    for(let y=8;y<21;y++){const hw=6-Math.floor((y-8)/5);r(y%4==0?'#a52f24':'#c0392b',8-hw,y,hw*2,1);r('#e04a3a',8-hw,y,1,1)}
    r('#f2f2f2',3,15,10,2);if(!back){r('#2e9d57',side?9:6,15,4,2);r('#f2f2f2',side?10:7,15,1,1)}
    // a hole for the face
    if(!back){const fx=side?8:5;r('#2a1a12',fx,9,6,5);r('#f1c7a0',fx+1,10,4,3);r('#2a1a12',fx+1,11,1,1);r('#2a1a12',fx+3,11,1,1)}
    // stubby arms in white gloves (one waving), legs and big shoes
    const wave=fr;if(!side){r('#c0392b',1,11,2,4);r('#f2f2f2',0,wave?9:14,3,2);r('#c0392b',13,11,2,4);r('#f2f2f2',13,14,3,2)}else{r('#c0392b',9,12,2,4);r('#f2f2f2',9,15,3,2)}
    r('#2d3046',5,21,2,3);r('#2d3046',9,21,2,3);r('#f2f2f2',4,24,4,2);r('#f2f2f2',8,24,4,2);r('#c9ced4',4,25,4,1);r('#c9ced4',8,25,4,1)})}
function costumed(px,py,d,kind,t){ctx.fillStyle='rgba(20,30,55,.28)';ctx.fillRect(px+3,py+14,10,3);ctx.fillRect(px+4,py+13,8,5);ctx.drawImage(costume(kind,d,d==0?(t/450|0)%2:0),px-1,py-11)}
// Draws a person whose tile's top-left is (px, py).
// a quest star: a five-pointed star, outlined, centred on (X,Y): gold for a main quest, silver for a side quest
const QSTAR=['...#...','...#...','..###..','#######','.#####.','..###..','.##.##.','##...##'];
function qstar(X,Y,side){const x0=X-3,y0=Y-4;QSTAR.forEach((row,y)=>[...row].forEach((c,x)=>{if(c=='#'){ctx.fillStyle='#4a2e00';ctx.fillRect(x0+x-1,y0+y-1,3,3)}}));
  QSTAR.forEach((row,y)=>[...row].forEach((c,x)=>{if(c=='#'){ctx.fillStyle=side?(y<3?'#ffffff':'#c4ccd8'):(y<3?'#fff2a0':'#ffd23a');ctx.fillRect(x0+x,y0+y,1,1)}}))}
// A snow bank across a road (28x24, standing on its tile with the drift heaped up behind) and a DANGER sign on a post (28x30)
let SBA=null,DSA=null;
function snowBankArt(){return SBA??=mk(28,24,r=>{for(let y=0;y<24;y++){const u=y/23,hw=Math.round(Math.min(13,4+u*14+Math.sin(u*7)*1.5));const c=y<6?'#ffffff':y<17?SNOW:SNOWD;r(c,14-hw,y,hw*2,1)}
  r('#ffffff',6,7,6,2);r('#ffffff',16,4,5,2);r(SNOWD,4,19,20,2);r('#c8d6e2',8,12,4,1);r('#c8d6e2',17,14,5,1);r('#e8f2f8',10,2,4,1)})}
function dangerSignArt(){return DSA??=mk(28,30,r=>{r('#4a3020',13,13,2,17);r('#6b4a2e',13,13,1,17);r(SNOWD,9,28,10,2);
  r('#f4f4f0',1,0,26,15);r('#c0392b',1,0,26,1);r('#c0392b',1,14,26,1);r('#c0392b',1,0,1,15);r('#c0392b',26,0,1,15);
  ptext(r,'DANGER',3,2,'#c0392b');ptext(r,'SNOW',7,8,'#2a2a33');r(SNOW,2,0,24,1)})}
// Draws someone (an NPC) whose tile's top-left is (px, py), with their shadow
function person(px,py,d,fr,n){ctx.fillStyle='rgba(20,30,55,.28)';ctx.fillRect(px+3,py+14,10,3);ctx.fillRect(px+4,py+13,8,5);ctx.drawImage(npcSprite(n,d,fr),px-1,py-5)}

// ---- A head-and-shoulders portrait of someone for conversations, in their clothes, hair and hat colours (28x28, outlined)
// Women have hair falling past the face (long to the shoulders, or a chin-length bob, picked by name), finer brows with lashes,
// a little blush, fuller lips and small earrings.
// The skin tone, hairstyle and facial hair are the ones their sprite has (looksOf): hair worn long falls past the shoulders, a bob
// to the jaw, and a ponytail or bun is pulled back (with a bun on top); a bald head keeps its sides; a beard, moustache or stubble.
function portrait(n){const L=looksOf(n),sk=L.sk,skd=shade(sk,-.12),body=n.body||'#5a6a4a',hair=n.hair||'#5a3a22',fem=n.gender=='female',
    long=fem&&L.style=='long',back=fem&&(L.style=='ponytail'||L.style=='bun'),hd=shade(hair,-.25);
  return mk(28,28,r=>{r(body,2,21,24,7);r(shade(body,.18),2,21,24,1);r(shade(body,-.28),20,22,6,6);r(shade(body,-.35),13,22,2,6);
    // her hair behind the head and neck, down over the shoulders (long) or to the jaw (a bob)
    if(fem&&!back){if(long){r(hair,6,4,16,15);r(hair,5,8,3,17);r(hair,20,8,3,17);r(hair,4,19,3,6);r(hair,21,19,3,6);r(hd,4,24,3,1);r(hd,21,24,3,1);r(hd,7,17,1,8);r(hd,20,17,1,8);r(shade(hair,.2),5,10,1,8)}
      else{r(hair,6,4,16,13);r(hd,6,16,4,1);r(hd,18,16,4,1)}}
    r(skd,11,17,6,5);r(sk,12,21,4,2);
    r(sk,8,5,12,13);r(sk,9,4,10,1);r(sk,9,18,10,1);r(skd,19,6,1,11);r(sk,7,10,1,3);r(sk,20,10,1,3);
    if(L.style=='bald'){r(hair,7,8,2,4);r(hair,19,8,2,4)}
    else if(L.style=='buzz'){const c=mix(hair,sk,.35);r(c,8,3,12,2);r(c,7,5,2,4);r(c,19,5,2,4)}
    else{r(hair,8,2,12,4);r(hair,7,4,2,7);r(hair,19,4,2,7);r(shade(hair,.2),10,2,6,1);if(L.style=='curly')for(let x=8;x<20;x+=3)r(shade(hair,.25),x,1+(x%2),2,1);if(L.style=='bun')r(hair,11,0,6,3)}
    // her hair framing the face: a side-swept fringe and locks down both cheeks
    if(fem&&!back){r(hair,8,5,5,2);r(hair,8,7,2,1);r(hair,7,4,2,long?13:11);r(hair,19,4,2,long?13:11);r(shade(hair,.2),9,3,3,1);r(shade(hair,.2),7,8,1,4)}
    if(n.hat&&n.hat.startsWith('jester')){const[,a,b]=n.hat.split('|');r(a,7,0,7,5);r(b,14,0,7,5);r(shade(a,.2),8,0,4,1);r(shade(a,-.25),7,5,7,1);r(shade(b,-.25),14,5,7,1);
      r(a,4,2,3,3);r(a,2,5,3,2);r(a,1,7,2,2);r('#ffd23a',0,9,3,3);r(b,21,2,3,3);r(b,23,5,3,2);r(b,25,7,2,2);r('#ffd23a',25,9,3,3)}
    else if(n.hat){r(n.hat,7,0,14,5);r(shade(n.hat,.2),8,0,12,1);r(shade(n.hat,-.25),7,5,14,1)}
    if(fem){r(hd,11,8,2,1);r(hd,10,9,1,1);r(hd,15,8,2,1);r(hd,17,9,1,1)}else{r(hd,10,8,3,1);r(hd,15,8,3,1)}
    r('#2a2a33',11,10,2,2);r('#2a2a33',15,10,2,2);r('#ffffff',11,10,1,1);r('#ffffff',15,10,1,1);
    if(fem){r('#1a1a22',10,10,1,1);r('#1a1a22',17,10,1,1);r('#1a1a22',11,9,2,1);r('#1a1a22',15,9,2,1);r('#f0a8a0',10,13,2,1);r('#f0a8a0',16,13,2,1);
      r(skd,14,11,1,2);r('#b8404a',12,15,4,1);r('#d8606a',13,16,2,1);r('#ffd23a',7,14,1,1)}
    else{r(skd,14,11,1,3);r('#a0524a',12,15,4,1)}
    // facial hair
    if(L.beard=='beard'){r(hair,8,12,2,5);r(hair,18,12,2,5);r(hair,9,14,10,4);r(hair,10,18,8,1);r(shade(hair,.2),10,15,2,1);r('#a0524a',12,15,4,1)}
    else if(L.beard=='moustache'){r(hair,11,14,6,1);r(hd,11,14,1,1);r(hd,16,14,1,1)}
    else if(L.beard=='stubble'){r(mix(sk,hair,.3),9,14,10,4);r(mix(sk,hair,.3),10,18,8,1);r('#a0524a',12,15,4,1)}})}
// ---- Interiors: a back wall with windows and pictures, a floor per building, and detailed furniture.
// fl: floor (wood, tile, check, carpet) and its colours f; wall/wall2/pap: wallpaper; deco: [tileX, kind] along the back wall;
// rug: colour of a rug under the table; quilt: bed cover colour; curtain: window curtains.
const INT={
default:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c4b48c',pap:'stripe',deco:[]},
plant:{grime:1,fl:'tile',f:['#b4bcc0','#a7b0b5'],wall:'#e4ebee',wall2:'#9fc3d6',pap:'tiles',base:'#4a5058',deco:[[2,'win'],[6,'safety'],[9,'clock'],[12,'win'],[16,'win']]},
hq:{grime:1,fl:'carpet',f:['#8e2f2a','#a8433a'],wall:'#e8dcc0',wall2:'#9a7049',pap:'panel',deco:[[2,'win'],[5,'portrait'],[9,'banner'],[10,'banner'],[14,'portrait'],[17,'win']]},
apartments:{grime:2,fl:'wood',f:['#8a6a48','#7a5d3e','#947250'],wall:'#c6b892',wall2:'#ad9f78',pap:'stripe',curtain:'#7a3a32',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic'],[7,'clock']]},
apartments3:{grime:2,fl:'wood',f:['#8a6a48','#7a5d3e','#947250'],wall:'#c6b892',wall2:'#ad9f78',pap:'stripe',curtain:'#7a3a32',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic'],[7,'clock']]},
apartments2:{grime:2,fl:'wood',f:['#8a6a48','#7a5d3e','#947250'],wall:'#c6b892',wall2:'#ad9f78',pap:'stripe',curtain:'#7a3a32',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic'],[7,'clock']]},
bar:{grime:1,fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#2f4a3a',wall2:'#294232',pap:'stripe',curtain:'#7a2a2a',deco:[[1,'win'],[14,'dart'],[17,'neon'],[18,'win']]},
barflat:{grime:1,fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c9b48a',wall2:'#bba67c',pap:'stripe',curtain:'#3d6b5a',quilt:'#7a5a8a',deco:[[1,'win'],[5,'pic'],[7,'win']]},
outfitters_in:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#2e5a7a',wall2:'#24486a',pap:'panel',base:'#1e2a3a',rug:'#e0a100',curtain:'#e0a100',deco:[[1,'win'],[5,'map'],[8,'pic'],[14,'win']]},
fishshop:{grime:1,fishCounter:1,fl:'check',f:['#e8eef2','#5b8fb9'],wall:'#cfe6ee',wall2:'#a9d4e8',pap:'tiles',base:'#4a5058',deco:[[12,'win'],[1,'poster']]},
house_tom:{grime:1,fl:'wood',f:['#b08658','#a37a4e','#bb9062'],wall:'#e8d9a8',wall2:'#d9c690',pap:'flower',rug:'#2e6f9a',quilt:'#c0392b',curtain:'#c0392b',deco:[[2,'win'],[5,'pic']]},
house_sam:{grime:1,fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c8dcc0',wall2:'#b4ccaa',pap:'stripe',rug:'#a33b2f',quilt:'#2e86c1',curtain:'#2e6f9a',deco:[[5,'win'],[8,'clock']]},
house_bob:{grime:1,fl:'wood',f:['#b8946a','#aa865c','#c29e72'],wall:'#ecd2c0',wall2:'#dcbea8',pap:'flower',rug:'#3d7a5a',quilt:'#c9822a',curtain:'#3d7a5a',deco:[[4,'win'],[7,'pic'],[8,'win']]},
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
clubroom:{fl:'carpet',f:['#5a1a2a','#4a1522'],wall:'#2f3d4a',wall2:'#c9a040',pap:'panel',base:'#c9a040',rug:'#7a2a3a',curtain:'#5a1a2a',deco:[[3,'win'],[7,'portrait'],[12,'clock'],[16,'win']]},
electro:{fl:'tile',f:['#d8dfe6','#c9d1d8'],wall:'#3a3d44',wall2:'#2b2f3a',pap:'tiles',base:'#e0a100',deco:[[3,'poster'],[9,'neon','TV','#3bd0ff']]},
arcadein:{fl:'carpet',f:['#2a1a3a','#ff3bd0'],wall:'#1a1c2a',wall2:'#2b2f3a',pap:'stripe',base:'#ff3bd0',deco:[[7,'neon','ARCADE','#ff3bd0']]},
mart:{fl:'tile',f:['#e8eef2','#dfe6ea'],wall:'#f2f2f2',wall2:'#cfe0f0',pap:'tiles',base:'#2e86c1',deco:[[7,'win'],[17,'clock']]},
cinemain:{fl:'carpet',f:['#5a1a2a','#3a1520'],wall:'#2a1a3a',wall2:'#c9a040',pap:'panel',base:'#c9a040',deco:[[2,'poster'],[8,'neon','NOW SHOWING','#ffd23a'],[15,'poster']]},
cafe:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',deco:[[2,'win'],[6,'pic'],[10,'win']]},
tavern:{fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#3d5a4a',wall2:'#34503f',pap:'stripe',curtain:'#7a2a1e',deco:[[1,'win'],[8,'pic'],[12,'dart'],[16,'win']]},
kcmuseum_in:{fl:'check',f:['#e8f2ea','#2e9d57'],wall:'#e8f2ea',wall2:'#9fd6c0',pap:'stripe',base:'#2e5a3a',rug:'#c0392b',deco:[[2,'poster'],[6,'neon','KELP COLA','#2e9d57'],[12,'pic'],[15,'poster'],[19,'win']]},
clothes_in:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#3d5a4a',wall2:'#2f4a3c',pap:'stripe',base:'#2f2a26',rug:'#c0392b',curtain:'#e0a100',deco:[[1,'win'],[4,'pic'],[9,'poster'],[12,'win']]},
records_in:{fl:'check',f:['#2a2a30','#e8e2d4'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#2f2a26',rug:'#7a1e2a',deco:[[1,'poster'],[4,'poster'],[7,'neon','VINYL','#ff8a3a'],[11,'poster']]},
mill_in:{grime:1,fl:'wood',f:['#7a5232','#6b4a2e','#8a5a36'],wall:'#8a6a45',wall2:'#6b4a2e',pap:'panel',base:'#3a2a20',deco:[[2,'win'],[6,'safety'],[11,'clock'],[16,'win'],[21,'win']]},
spa_in:{fl:'wood',f:['#b08658','#a37a4e','#bb9062'],wall:'#8a6a45',wall2:'#6b4a2e',pap:'panel',base:'#3a2a20',rug:'#3d7a7a',deco:[[2,'win'],[6,'pic'],[11,'clock'],[15,'win'],[19,'win']]},
cedargrill:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',rug:'#3d5a4a',curtain:'#3d5a4a',deco:[[12,'pic'],[16,'win']]},
tattoo:{fl:'check',f:['#2a2a30','#e8e2d4'],wall:'#2a2a30',wall2:'#3a3a44',pap:'stripe',base:'#7a1e2a',quilt:'#1a1a22',deco:[[1,'pic'],[3,'poster'],[5,'pic'],[7,'poster'],[10,'win']]},
skyapts:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',base:'#5a5f68',quilt:'#2e86c1',curtain:'#3a3d44',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'poster'],[15,'clock']]},
skyapts4:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',base:'#5a5f68',quilt:'#2e86c1',curtain:'#3a3d44',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'poster'],[15,'clock']]},
skyapts3:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',base:'#5a5f68',quilt:'#2e86c1',curtain:'#3a3d44',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'poster'],[15,'clock']]},
skyapts2:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',base:'#5a5f68',quilt:'#2e86c1',curtain:'#3a3d44',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'poster'],[15,'clock']]},
eblofts:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',quilt:'#3d7a5a',curtain:'#7a2a1e',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic']]},
eblofts4:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',quilt:'#3d7a5a',curtain:'#7a2a1e',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic']]},
eblofts3:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',quilt:'#3d7a5a',curtain:'#7a2a1e',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic']]},
eblofts2:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',quilt:'#3d7a5a',curtain:'#7a2a1e',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[15,'pic']]},
hsresid:{fl:'check',f:['#efe6cf','#c9c2b0'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#8a6a45',quilt:'#7d3c98',curtain:'#5e2a75',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'portrait'],[15,'portrait']]},
hsresid2:{fl:'check',f:['#efe6cf','#c9c2b0'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#8a6a45',quilt:'#7d3c98',curtain:'#5e2a75',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'portrait'],[15,'portrait']]},
kgapts:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c9b994',pap:'stripe',curtain:'#2e6f9a',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[7,'clock']]},
kgapts4:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c9b994',pap:'stripe',curtain:'#2e6f9a',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[7,'clock']]},
kgapts3:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c9b994',pap:'stripe',curtain:'#2e6f9a',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[7,'clock']]},
kgapts2:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d9cba8',wall2:'#c9b994',pap:'stripe',curtain:'#2e6f9a',deco:[[5,'win'],[13,'win'],[21,'win'],[1,'pic'],[7,'clock']]},
doctor:{fl:'tile',f:['#e8eef2','#dfe6ea'],wall:'#f2f2f2',wall2:'#cfe8d8',pap:'tiles',base:'#2e9d57',quilt:'#f2f2f2',deco:[[3,'clock'],[10,'poster'],[14,'win']]},
police:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#d8dfe6',wall2:'#9aa8b8',pap:'tiles',base:'#3a4a6a',quilt:'#5a5f68',deco:[[4,'clock'],[10,'map'],[17,'win']]},
commcentre:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',rug:'#2e86c1',deco:[[2,'win'],[6,'dbanner'],[13,'dbanner'],[17,'win'],[10,'poster']]},
hotel_lobby:{fl:'carpet',f:['#6a3442','#5a2a38'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#8a6a45',rug:'#c9a040',deco:[[2,'win'],[7,'clock'],[10,'neon','AURORA','#ffd23a'],[14,'portrait'],[18,'win']]},
hotel_floor:{fl:'carpet',f:['#6a3442','#5a2a38'],wall:'#e8dcc0',wall2:'#d8ccb0',pap:'flower',quilt:'#6a3442',curtain:'#6a3442',deco:[[1,'pic'],[5,'win'],[10,'pic'],[13,'win'],[18,'map']]},
crewq:{fl:'tile',f:['#8d959e','#7d858e'],wall:'#d8dce0',wall2:'#e8792a',pap:'panel',base:'#4a5058',quilt:'#e8792a',deco:[[3,'win'],[9,'clock'],[13,'win']]},
dphq_office:{fl:'wood',f:['#6b4a2e','#5e4128','#74513a'],wall:'#3a2e28',wall2:'#2a201a',pap:'panel',base:'#1f1814',rug:'#7a1a1a',deco:[[4,'map'],[9,'portrait'],[14,'win'],[18,'map']]},
dphq_in:{fl:'carpet',f:['#37474f','#455a64'],wall:'#d8dce2',wall2:'#8a9aa8',pap:'panel',base:'#37474f',rug:'#e0a100',deco:[[2,'win'],[6,'map'],[10,'clock'],[13,'map'],[17,'win']]},
depot_in:{fl:'stone',f:[],wall:'#7d8a96',wall2:'#5b636c',pap:'tiles',base:'#2b2f3a',deco:[[4,'safety'],[11,'win']]},
repubhq:{fl:'carpet',f:['#2b3a5a','#33456a'],wall:'#ece6da',wall2:'#9aa8b8',pap:'panel',base:'#2b2f3a',rug:'#a3123a',deco:[[2,'win'],[6,'rbanner'],[10,'portrait'],[13,'rbanner'],[17,'win']]},
petro_in:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#9aa8b8',pap:'tiles',base:'#37474f',deco:[[2,'win'],[6,'poster'],[10,'neon','PETRO','#3bd0ff'],[17,'win']]},
bank_in:{fl:'check',f:['#e8e2d4','#c9c2b0'],wall:'#e8ecef',wall2:'#9aa8b8',pap:'panel',base:'#2b2f3a',rug:'#2e5f8f',deco:[[2,'win'],[6,'clock'],[13,'portrait'],[17,'win']]},
farmhouse_in:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#e8dcc0',wall2:'#d8cab0',pap:'flower',rug:'#a33b2f',quilt:'#a33b2f',curtain:'#a33b2f',deco:[[3,'win'],[7,'pic'],[11,'win']]},
barn_in:{fl:'wood',f:['#8a6a45','#7a5d3c','#94754e'],wall:'#a33b2f',wall2:'#8a3026',pap:'stripe',base:'#4a3222',deco:[[9,'win']]},
civil_in:{fl:'check',f:['#d8d4cc','#b8b2a6'],wall:'#e8e2d4',wall2:'#c9c2b0',pap:'panel',base:'#3a3d44',deco:[[3,'clock'],[9,'portrait'],[15,'win']]},
kchq2:{fl:'carpet',f:['#1f4a32','#245638'],wall:'#5a3a22',wall2:'#3e2816',pap:'panel',base:'#c9a040',rug:'#7a1e2a',curtain:'#2e9d57',deco:[[2,'win'],[4,'kcad',2],[6,'portrait'],[8,'clock'],[11,'win'],[13,'kcad',0]]},
kchq_in:{fl:'tile',f:['#e8f2ea','#d8e8dc'],wall:'#e8f2ea',wall2:'#2e9d57',pap:'tiles',base:'#2e9d57',rug:'#2e9d57',deco:[[2,'kcad',0],[4,'kcad',1],[6,'win'],[8,'kcad',2],[11,'neon','KELP COLA','#2e9d57'],[14,'kcad',3],[16,'win'],[19,'clock']]},
kcfac_in:{fl:'tile',f:['#b4bcc0','#a7b0b5'],wall:'#e8f2ea',wall2:'#9fd6c0',pap:'tiles',base:'#2e5a3a',deco:[[2,'win'],[7,'safety'],[12,'clock'],[17,'win'],[21,'win']]},
kcwhs_in:{fl:'stone',f:[],wall:'#8aa898',wall2:'#6b8a7a',pap:'tiles',base:'#2e5a3a',deco:[[9,'win']]},
whs_in:{grime:1,fl:'stone',f:[],wall:'#76808a',wall2:'#5b636c',pap:'tiles',base:'#3a3530',deco:[[9,'win']]},
barrA_in:{fl:'wood',f:['#7a6a52','#6e5f4a','#86765c'],wall:'#b8b8a0',wall2:'#9a9a84',pap:'panel',base:'#3a4a2a',quilt:'#4a5a3a',deco:[[3,'win'],[9,'clock'],[16,'win']]},
barrB_in:{fl:'tile',f:['#b8b8a0','#a8a890'],wall:'#d8d8c0',wall2:'#9a9a84',pap:'tiles',base:'#3a4a2a',deco:[[13,'clock'],[17,'win']]},
gp_in:{fl:'wood',f:['#7a6a52','#6e5f4a','#86765c'],wall:'#b8b8a0',wall2:'#9a9a84',pap:'panel',base:'#3a4a2a',deco:[[5,'win']]},
arm_in:{fl:'stone',f:[],wall:'#5d6068',wall2:'#3a3d44',pap:'brick',base:'#25282e',deco:[[9,'safety']]},
offhq_in:{fl:'carpet',f:['#4a5a3a','#5a6a48'],wall:'#e0dcc0',wall2:'#7a8a6a',pap:'panel',base:'#3a4a2a',rug:'#7a2a2a',deco:[[3,'map'],[10,'portrait'],[13,'map'],[17,'win']]},
fuel_in:{fl:'stone',f:[],wall:'#8a9aa8',wall2:'#37474f',pap:'tiles',base:'#2b2f3a',deco:[[2,'safety'],[11,'win']]},
port_in:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#9aa8b8',pap:'tiles',base:'#37474f',deco:[[6,'map'],[12,'win']]},
customs_in:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#7a5a3a',wall2:'#6b4e32',pap:'stripe',base:'#2f2a26',deco:[[6,'clock'],[12,'win']]},
ebwhs_in:{fl:'wood',f:['#8a6a45','#7a5d3c','#94754e'],wall:'#4f6b4a',wall2:'#3f5a3a',pap:'stripe',base:'#2f2a26',deco:[[9,'win']]},
bigtop_in:{fl:'sand',f:[],wall:'#c0392b',wall2:'#f2e6c8',pap:'stripe',base:'#e0a100',deco:[[4,'poster'],[12,'neon','CIRCUS','#ffd23a'],[19,'poster']]},
caravan1_in:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c0392b',wall2:'#a3302a',pap:'stripe',base:'#5a3a26',quilt:'#e0a100',curtain:'#e0a100',deco:[[2,'poster'],[6,'win']]},
caravan2_in:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#2e6f9a',wall2:'#255a7d',pap:'stripe',base:'#5a3a26',quilt:'#e07a9a',curtain:'#f2e6c8',deco:[[2,'win'],[6,'pic']]},
caravan3_in:{fl:'carpet',f:['#5e2a75','#7d3c98'],wall:'#3a2a4a',wall2:'#c9a040',pap:'flower',base:'#c9a040',quilt:'#7d3c98',curtain:'#c9a040',deco:[[2,'portrait'],[6,'win']]},
pizzeria_in:{fl:'check',f:['#efe6d4','#a8322a'],wall:'#e8dcc0',wall2:'#2e6f3a',pap:'stripe',base:'#5a3a26',rug:'#2e6f3a',curtain:'#c0392b',deco:[[3,'pic'],[8,'clock'],[14,'pic']]},
langley:{fl:'granite',f:['#d8dade','#cfd2d6','#e2e4e7'],wall:'#ecebe6',wall2:'#cfccc2',pap:'panel',base:'#7a7a76',seal:[176,104,34],deco:[[4,'verse'],[8,'stars'],[9,'stars'],[10,'stars'],[11,'stars'],[12,'stars'],[13,'stars'],[16,'clock']]},
langley_hall:{fl:'carpet',f:['#3a4a5e','#33425a'],wall:'#e6e0d0',wall2:'#7a5232',pap:'panel',base:'#4a3020',deco:[[2,'pic'],[11,'cseal'],[17,'pic']]},
langley_cafe:{fl:'tile',f:['#e8e4da','#d8d2c4'],wall:'#e6e0d0',wall2:'#8a9aac',pap:'stripe',base:'#5a5f68',deco:[[5,'clock'],[11,'cseal'],[17,'win']]},
langley_george:{fl:'carpet',f:['#3a2e28','#33281f'],wall:'#4a4038',wall2:'#2f2620',pap:'panel',base:'#1f1814',rug:'#5a1a1a',deco:[[4,'map'],[10,'portrait']]},
langley_basement:{grime:2,fl:'tile',f:['#5a5f66','#50555c'],wall:'#6a6e72',wall2:'#4a4e52',pap:'panel',base:'#2b2f3a',deco:[[12,'clock']]},
langley_cover:{fl:'carpet',f:['#5a3a4a','#4e3240'],wall:'#e6e0d0',wall2:'#5a3a4a',pap:'stripe',base:'#3a2430',rug:'#2a3a5a',deco:[[4,'pic'],[8,'clock'],[14,'pic']]},
langley_office:{fl:'carpet',f:['#3a4a5e','#33425a'],wall:'#e6e0d0',wall2:'#7a5232',pap:'panel',base:'#4a3020',rug:'#7a2a2a',deco:[[6,'cseal'],[9,'portrait'],[11,'map'],[15,'win']]},
oldbarn_in:{grime:2,fl:'wood',f:['#5a3e27','#4e3622','#64462c'],wall:'#5a3d2a',wall2:'#4a3020',pap:'panel',base:'#2e2016',quilt:'#5a5a4a',deco:[[4,'win'],[13,'win']]},
derrick_in:{grime:2,oil:1,fl:'tile',f:['#4a4f58','#3e434b'],wall:'#5a6068',wall2:'#e0a100',pap:'stripe',base:'#2b2f3a',deco:[[2,'safety'],[7,'clock'],[12,'safety']]},
lighthouse_in:{fl:'wood',f:['#8a6a48','#7a5d3e','#947250'],wall:'#e8e4dc',wall2:'#c0392b',pap:'stripe',base:'#2e4a6a',rug:'#2e4a6a',curtain:'#2e4a6a',quilt:'#2e5f8f',deco:[[2,'win'],[5,'map'],[8,'clock']]},
jazz_in:{fl:'carpet',f:['#1a1c3a','#24264a'],wall:'#2a1a2e',wall2:'#5a2a3a',pap:'panel',base:'#c9a040',rug:'#7a1e2a',curtain:'#7a1e2a',deco:[[2,'neon','BAR','#ff5fa8'],[10,'neon','JAZZ','#3b8bff'],[17,'poster']]},
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
house_forsale_eb:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#c9b8a8',wall2:'#9a5040',pap:'brick',deco:[[2,'win'],[7,'win']]},
house_forsale_fh:{fl:'tile',f:['#c9d1d8','#bcc4cb'],wall:'#e8eef2',wall2:'#b9c8d0',pap:'tiles',deco:[[2,'win'],[7,'win']]},
villa_forsale:{fl:'wood',f:['#c29e72','#b8946a','#cca87c'],wall:'#f2ede0',wall2:'#e2dccb',pap:'panel',deco:[[1,'win'],[4,'win'],[9,'win'],[13,'win']]},
hekki_room:{fl:'wood',f:['#5e4f40','#544638','#685848'],wall:'#4a4a40',wall2:'#3e3e35',pap:'stripe',base:'#2b2b25',quilt:'#5a6a4a',rug:'#6b4a2e',deco:[[2,'map'],[10,'map'],[13,'clock'],[15,'map'],[16,'calendar']]},
transhut:{fl:'carpet',f:['#3a4a5a','#4a5a6a'],wall:'#9aa0a6',wall2:'#7d858e',pap:'tiles',base:'#4a5058',deco:[[6,'onair'],[10,'clock'],[15,'poster']]},
chapel:{fl:'check',f:['#e8e2d4','#c9c2b0'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',curtain:'#5e2a75',base:'#8a6a45',deco:[[2,'win'],[4,'portrait'],[7,'cross'],[10,'portrait'],[12,'win']]},
crypt:{fl:'stone',f:[],wall:'#6b6458',wall2:'#4a443c',pap:'brick',base:'#3a3530',deco:[[3,'cross'],[7,'rbanner'],[12,'cross']]},
tram:{fl:'tile',f:['#7d858e','#737b84'],wall:'#efe6cf',wall2:'#b8322a',pap:'panel',base:'#5a5f68',curtain:null,deco:[[2,'win'],[5,'win'],[8,'win'],[12,'win'],[15,'win']]},
monks:{fl:'stone',f:[],wall:'#b8b2a6',wall2:'#8a8478',pap:'brick',base:'#5a564f',quilt:'#6b4a2e',deco:[[3,'win'],[12,'cross'],[14,'clock'],[20,'cross'],[23,'win']]},
monchurch:{fl:'check',f:['#e8e2d4','#8a6a45'],wall:'#efe6cf',wall2:'#c9a040',pap:'panel',base:'#5a3d2a',deco:[[2,'win'],[4,'portrait'],[7,'portrait'],[11,'cross'],[14,'portrait'],[17,'portrait'],[19,'win']]},
house_pekka:{fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#a8794c',wall2:'#946640',pap:'stripe',rug:'#c0392b',quilt:'#e0a100',curtain:'#c0392b',deco:[[2,'win'],[5,'pic']]},
servants:{fl:'wood',f:['#9a8a72','#8e7e68','#a6967c'],wall:'#e8e0cc',wall2:'#d8ceb4',pap:'stripe',rug:'#5e2a75',quilt:'#7d3c98',curtain:'#5e2a75',deco:[[3,'win'],[6,'clock'],[9,'pic'],[12,'win']]},
burgerbar:{fl:'check',f:['#f2f2f2','#c0392b'],wall:'#f4e6c0',wall2:'#e8d4a0',pap:'stripe',base:'#c0392b',deco:[[1,'win'],[4,'neon','OPEN','#ff3bd0'],[14,'win']]},
newsroom:{fl:'wood',f:['#8a5a36','#7a5032','#946640'],wall:'#9a5040',wall2:'#c9b8a8',pap:'brick',base:'#3a2a20',rug:'#3d5a4a',deco:[[5,'clock'],[9,'map'],[12,'win'],[16,'win']]},
house_henrik:{fl:'wood',f:['#9a7049','#8c6542','#a5794f'],wall:'#a8794c',wall2:'#946640',pap:'stripe',rug:'#2e5f8f',quilt:'#5a5f68',curtain:'#2e5f8f',deco:[[1,'win'],[4,'pic'],[8,'win']]},
house_nora:{fl:'wood',f:['#b08658','#a37a4e','#bb9062'],wall:'#b8885a',wall2:'#a87a4e',pap:'stripe',rug:'#c9822a',quilt:'#3d7a5a',curtain:'#c9822a',deco:[[3,'pic'],[8,'win'],[1,'win']]},
house_kate:{grime:1,fl:'wood',f:['#a87d52','#9a7049','#b08658'],wall:'#d6e0ec',wall2:'#c2cfe0',pap:'flower',rug:'#7d3c98',quilt:'#d86a8a',curtain:'#7d3c98',deco:[[3,'pic'],[8,'win'],[1,'win']]}};
function floorPx(X,Y,f){
  if(f.fl=='wood'){const row=Y>>2,sx=X+(hash(row,1,40)*32|0),seg=sx>>5,c=f.f[hash(seg,row,41)*f.f.length|0];
    return(Y&3)==3||(sx&31)==0?shade(c,-.28):(Y&3)==0?shade(c,.07):hash(X,Y,42)>.94?shade(c,-.1):c}
  if(f.fl=='granite'){const c=f.f[hash(X>>5,Y>>5,47)*f.f.length|0];return(X&31)==31||(Y&31)==31?shade(c,-.16):hash(X,Y,48)>.92?shade(c,-.12):hash(X,Y,49)>.96?shade(c,.2):c}
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
  // seal: [x,y,radius] in pixels, the Agency's seal set into the floor: a dark ring lettered in pale dots, a blue field, the
  // sixteen-pointed compass star and the shield at its heart
  if(f.seal){const[cx,cy,R]=f.seal;for(let y=-R;y<=R;y++)for(let x=-R;x<=R;x++){const d=Math.hypot(x,y);if(d>R+.3)continue;let c;
    if(d>R-1.2)c='#3a3d44';else if(d>R-8)c=d>R-2.2||d<R-6.8?'#e8e6e0':(hash(Math.round(Math.atan2(y,x)*30),1,77)>.45&&d>R-5.5&&d<R-3.5?'#c8ccd2':'#4a4f58');
    else{c=d>R-9.2?'#e8e6e0':'#2e4a6e';const q=Math.atan2(y,x)/(Math.PI/8),fr=q-Math.round(q),lim=(R-9)*((Math.round(q)&1)?.62:.95)*(1-2*Math.abs(fr))*.85+(R-9)*.12;
      if(d<lim)c=fr>0?'#f4f4f0':'#c8ccd2'}
    if(d<5.5)c=d>4.5?'#c9a040':y<-1?'#2e4a6e':(x+8)%2?'#c0392b':'#f4f4f0';r(c,cx+x,cy+y)}}
  // grime: water stains running down the back wall, torn wallpaper, and scuffed, stained floorboards
  if(f.grime){for(let x=0;x<w*16;x+=5)if(hash(x,1,w*7)<.35)r('rgba(90,70,40,.2)',x,-12,1+(hash(x,2,w)>.5?1:0),6+(hash(x,3,w)*16|0));
    for(let i=0;i<w;i++)if(hash(i,4,w)<.3){const x=i*16+(hash(i,5,w)*10|0),y=-8+(hash(i,6,w)*10|0);r(shade(f.wall,-.35),x,y,5,4);r(shade(f.wall,.25),x+1,y+1,3,2)}
    for(let i=0;i<w*h/5;i++){const x=hash(i,7,w)*w*16|0,y=16+(hash(i,8,h)*(h-2)*16|0);r('rgba(60,45,30,.2)',x,y,4+(hash(i,9,w)*10|0),2+(hash(i,10,h)*5|0))}
    // oil: black, glossy puddles of crude across the floor
    if(f.oil)for(let i=0;i<w*h/3;i++){const x=hash(i,41,w)*w*16|0,y=16+(hash(i,42,h)*(h-2)*16|0),ow=6+(hash(i,43,w)*14|0),oh=3+(hash(i,44,h)*5|0);r('#141210',x,y,ow,oh);r('#141210',x+2,y-1,ow-4,oh+2);r('rgba(120,130,160,.35)',x+2,y+1,Math.max(2,ow>>2),1)}
    // grime 2, a run-down place: cracks and damp patches on the back wall, missing and broken floorboards, and darker, bigger stains
    if(f.grime>1){for(let i=0;i<w;i++){const k=hash(i,11,w);
        if(k<.35){let x=i*16+(hash(i,12,w)*12|0),y=-12;for(let n=0;n<6+(hash(i,13,w)*5|0);n++){r('rgba(40,30,20,.55)',x,y,1,2);x+=hash(i,14+n,w)>.5?1:-1;y+=2}}
        else if(k<.6){const x=i*16+(hash(i,15,w)*6|0);r('rgba(70,80,60,.22)',x,-11,10,8);r('rgba(70,80,60,.16)',x+2,-3,7,4)}}
      for(let i=0;i<w*h/7;i++){const tx=hash(i,21,w)*w|0,ty=1+(hash(i,22,h)*(h-2)|0);if(M[ty]?.[tx]!='f')continue;const x=tx*16,y=ty*16+(hash(i,23,w)*4|0)*4;
        if(hash(i,24,w)<.5){r('#2a1d12',x+1,y,9+(hash(i,25,w)*5|0),2);r('#1a120a',x+2,y+1,6,1)}else{r('rgba(30,20,10,.45)',x+3,y,7,1);r('rgba(30,20,10,.45)',x+9,y-1,1,2)}}
      for(let i=0;i<w*h/9;i++){const x=hash(i,31,w)*w*16|0,y=16+(hash(i,32,h)*(h-2)*16|0);r('rgba(45,35,22,.28)',x,y,8+(hash(i,33,w)*12|0),5+(hash(i,34,h)*7|0))}}}
  // back-wall decorations
  const an=[];
  f.deco.forEach(d=>{const[x,k]=d,X=x*16;
    if(k=='win'){r(OUT,X+1,-9,14,20);r('#f2efe6',X+2,-8,12,18);r('#9cc6e0',X+3,-7,10,14);r('#cfe6f2',X+3,-7,10,4);r('#ffffff',X+3,4,10,3);r('#2b5c4b',X+4,0,2,4);r('#2b5c4b',X+3,2,4,2);r('#2b5c4b',X+10,-1,2,5);r('#2b5c4b',X+9,2,4,2);
      r('#f2efe6',X+8,-7,1,14);r('#f2efe6',X+3,-1,10,1);r('#d8d2c0',X,11,16,2);r(SNOW,X+1,11,14,1);if(f.curtain){r(f.curtain,X-1,-10,3,21);r(f.curtain,X+14,-10,3,21);r(shade(f.curtain,.2),X-1,-10,1,21);r(shade(f.curtain,-.2),X-2,-11,20,2)}
      for(let y=16;y<44;y++){const a=(y-16)/5;g.fillStyle='rgba(255,250,235,.08)';g.fillRect(X+3-a|0,y+WU,10+a*2|0,1)}}
    // a vintage Kelp Cola advert (d[2] picks the design): a bottle with an ICE COLD banner, Kelpy the cup, a sunburst with a bottle
    // cap, or a bottle riding a wave; on yellowed paper in a thin frame, its corners curling a little
    if(k=='kcad'){const v=d[2]||0,P='#efe2c0';r(OUT,X+1,-11,14,21);r(P,X+2,-10,12,19);r('#d8c8a0',X+2,8,12,1);r('#2e9d57',X+2,-10,12,3);r('#f4f4f0',X+4,-9,8,1);
      const bottle=(bx,by)=>{r('#c0392b',bx+2,by,2,1);r('#2e9d57',bx+2,by+1,2,3);r('#2e9d57',bx+1,by+4,4,6);r('#5fc48a',bx+1,by+4,1,6);r('#f4f4f0',bx+1,by+6,4,2);r('#c0392b',bx+1,by+7,4,1)};
      if(v==0){bottle(X+5,-6);r('#c0392b',X+3,5,10,3);r('#f4f4f0',X+4,6,8,1)}
      if(v==1){for(let y=-6;y<3;y++){const hw=y<-4?4:3+((y+4)>>2);r((y&1)?'#c0392b':'#f4f4f0',X+8-hw,y,hw*2,1)}r('#2a2a33',X+6,-3,1,1);r('#2a2a33',X+9,-3,1,1);r('#2a2a33',X+7,0,2,1);r('#f2c230',X+10,-9,1,4);r('#2e9d57',X+5,4,6,2)}
      if(v==2){for(let k2=0;k2<8;k2++){const q=k2*Math.PI/4;for(let d2=3;d2<7;d2++)r('#f2c230',X+8+Math.round(Math.cos(q)*d2),-1+Math.round(Math.sin(q)*d2),1,1)}for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(Math.hypot(x,y)<=3.2)r(Math.hypot(x,y)>2.2?'#8a2a1e':'#c0392b',X+8+x,-1+y,1,1);r('#2e9d57',X+4,6,8,2)}
      if(v==3){r('#5b8fb9',X+2,2,12,6);for(let x=X+2;x<X+14;x+=4)r('#9cc6e0',x,2,2,1);bottle(X+5,-7);r('#f2c230',X+11,-8,2,2)}
      r('#d8c8a0',X+13,-10,1,2);r('#b8a880',X+2,8,2,1)}
    // the Memorial Wall: white marble carved with rows of black stars, one for each officer who died in the Agency's service
    if(k=='stars'){r('#f4f3ee',X,-12,16,23);r('#e2e0d8',X,10,16,1);for(const[sx,sy]of[[3,-9],[10,-9],[6,-4],[13,-4],[2,1],[9,1]]){r('#2a2a33',X+sx,sy,3,1);r('#2a2a33',X+sx+1,sy-1,1,3);r('#2a2a33',X+sx,sy+2,1,1);r('#2a2a33',X+sx+2,sy+2,1,1)}}
    // a marble plaque carved with a verse in gilt letters (two tiles wide)
    if(k=='verse'){r('#b8b4a8',X-1,-11,34,19);r('#f4f3ee',X,-10,32,17);for(let y=-7;y<5;y+=3)for(let x=X+3;x<X+29;x+=1+(hash(x,y,93)>.7?1:0))if(hash(x,y,94)>.3)r('#b8963a',x,y,1,1)}
    // the Agency's seal on a plaque: the compass star on blue in a gold ring
    if(k=='cseal'){for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const d=Math.hypot(x,y);if(d<=7.3)r(d>6.3?'#c9a040':d>5.2?'#e8e6e0':'#2e4a6e',X+8+x,-1+y)}r('#f4f4f0',X+7,-5,2,9);r('#f4f4f0',X+4,-2,9,2);r('#f4f4f0',X+5,-4,1,1);r('#f4f4f0',X+11,-4,1,1);r('#f4f4f0',X+5,2,1,1);r('#f4f4f0',X+11,2,1,1)}
    if(k=='pic'){r(OUT,X+2,-6,12,11);r('#8a6038',X+3,-5,10,9);r('#9cc6e0',X+4,-4,8,7);r('#5e8f48',X+4,0,8,3);r('#7aa860',X+6,-1,4,1);r('#f2f2f2',X+5,-3,3,1)}
    if(k=='portrait'){r(OUT,X+3,-8,10,16);r('#c9a040',X+4,-7,8,14);r('#3a2a20',X+5,-6,6,12);r('#e0b080',X+6,-4,4,4);r('#5a3a26',X+6,-5,4,1);r('#2a2a33',X+5,1,6,5);r('#c0392b',X+7,1,2,2)}
    if(k=='banner'){r('#5a3d2a',X+3,-10,10,1);r('#c0392b',X+4,-9,8,21);r('#a52f24',X+11,-9,1,21);r('#ffd23a',X+7,-5,2,4);r('#ffd23a',X+5,-4,6,2);r(f.wall2,X+7,11,2,1)}
    if(k=='clock'){r(OUT,X+3,-5,10,10);r('#8a6038',X+4,-4,8,8);r('#f4f4f0',X+5,-3,6,6);r('#2a2a33',X+8,-2,1,3);r('#2a2a33',X+8,0,2,1)}
    if(k=='safety'){r(OUT,X+2,-6,12,11);r('#2e9d57',X+3,-5,10,9);r('#ffffff',X+7,-4,2,7);r('#ffffff',X+5,-2,6,2)}
    if(k=='dart'){r(OUT,X+3,-6,10,10);r('#2a2a33',X+4,-5,8,8);r('#c0392b',X+5,-4,6,6);r('#f2e6c8',X+6,-3,4,4);r('#2e9d57',X+7,-2,2,2)}
    if(k=='poster'){r(OUT,X+2,-9,12,18);r('#f4f4f0',X+3,-8,10,16);r('#c0392b',X+4,-6,8,2);r('#5b8fb9',X+4,-1,6,3);r('#5b8fb9',X+10,-2,2,5);r(OUT,X+5,0,1,1);r('#9cc6e0',X+4,4,8,2)}
    if(k=='rbanner'){r('#5a3d2a',X+3,-10,10,1);r('#7d3c98',X+4,-9,8,21);r('#5e2a75',X+11,-9,1,21);r('#ffd23a',X+5,-4,6,3);r('#ffd23a',X+5,-6,1,2);r('#ffd23a',X+7,-6,2,2);r('#ffd23a',X+10,-6,1,2);r(f.wall,X+7,11,2,1)}
    if(k=='rbanner'){r('#5a3d2a',X+3,-10,10,1);r('#a3123a',X+4,-9,8,21);r('#7e0e2d',X+11,-9,1,21);for(const[dx,dy,w]of[[3,-8,1],[3,-7,1],[0,-6,7],[1,-5,5],[2,-4,3],[1,-3,2],[4,-3,2],[0,-2,1],[6,-2,1]])r('#ffffff',X+4+dx,dy,w,1);r(f.wall2,X+7,11,2,1)}
    if(k=='dbanner'){r('#5a3d2a',X+3,-10,10,1);r('#2e86c1',X+4,-9,8,21);r('#1f6a9a',X+11,-9,1,21);r('#ffffff',X+7,-5,2,6);r('#ffffff',X+5,-3,6,2);r(f.wall2,X+7,11,2,1)}
    // a tear-off wall calendar: the month (SEP, or AUG before it) across a red header, today's date below it (drawn each frame, so it follows DAY)
    if(k=='calendar'){r('#3a3a44',X+4,-11,1,2);r('#3a3a44',X+11,-11,1,2);r(OUT,X,-9,16,20);r('#f4f1e8',X+1,-8,14,18);r('#c0392b',X+1,-8,14,6);ptext(r,typeof DAY!='undefined'&&DAY<1?'AUG':'SEP',X+3,-7,'#ffffff');
      r('#d8d2c0',X+1,9,14,1);an.push({t:'calendar',x:X+1,y:-1})}
    if(k=='cross'){r('#c9a040',X+7,-8,2,16);r('#c9a040',X+4,-4,8,2);r('#e8c860',X+7,-8,1,16)}
    if(k=='listing')for(let i=0;i<4;i++){const x=X+1+(i&1)*7,y=-8+(i>>1)*9;r(OUT,x,y,7,8);r('#f4f4f0',x+1,y+1,5,6);r(['#c88a7a','#9ab8c8','#e8c88a','#b8d0a8'][i],x+2,y+4,3,3);r('#4a4f58',x+2,y+2,3,2)}
    if(k=='neon'){const s=d[2]||'BAR',nw=s.length*4+3;r('#1a1520',X+8-(nw>>1),-5,nw,10);an.push({t:'neon',x:X+10-(nw>>1),y:-2,s,col:d[3]})}
    if(k=='onair'){r(OUT,X-6,-6,29,11);r('#1a1520',X-5,-5,27,9);an.push({t:'neon',x:X-3,y:-3,s:'ON AIR',col:'#ff3b2f'})}
    if(k=='map'){r(OUT,X,-9,16,18);r('#e8dcc0',X+1,-8,14,16);r('#9cc6e0',X+1,-8,14,16);r('#e8eff5',X+3,-6,9,11);r('#d8e3ec',X+4,-3,7,6);
      r('#c0392b',X+5,-4,2,2);r('#c0392b',X+9,1,2,2);r('#2e6f9a',X+7,-1,2,2);r('#2b2f3a',X+6,-3,4,1);r('#2b2f3a',X+8,-2,1,3);r('#e0a100',X+11,-7,2,2)}});
  c.an=an;return c}
// Furniture for one feature: the outlined picture, how far it reaches above its tiles (oy), and an optional animation.
function furn(ch,w,h,lb,f,v){const W=w*16,H=h*16,l=(lb||'').toLowerCase();
  if(/rotary table|mud pump|drawworks|generator|driller|pipe rack/.test(l))return machineArt(l,W,H);
  // an American flag on a brass pole, its stripes hanging in folds, on a heavy base
  if(l=='flag'){const oy=24,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#c9a040',7,0,2,2);r('#8a6a2a',7,2,2,TT-4);r('#3a3d44',3,TT-3,10,3);
    for(let y=4;y<TT-12;y++){r(((y>>1)%2)?'#f4f4f0':'#c0392b',1,y,6,1);r(((y>>1)%2)?'#e8e8e4':'#a52f24',9,y,6,1);if((y>>1)&1){r('rgba(0,0,0,.12)',3,y,1,1);r('rgba(0,0,0,.12)',12,y,1,1)}}
    r('#1f3a6f',9,4,6,7);for(let y=5;y<11;y+=2)for(let x=10;x<15;x+=2)r('#f4f4f0',x,y,1,1);r('#c9a040',0,TT-13,7,1);r('#c9a040',9,TT-13,7,1)})}}
  // the Book of Honor: the book of the fallen lying open in a glass case on a black marble stand
  if(l=='book of honor'){const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#2a2a30',6,11,W-12,TT-11);r('#3a3a44',6,11,W-12,1);r('#2a2a30',3,9,W-6,3);
    r('#9fc0cc',3,1,W-6,8);r('#cfe6f2',4,1,W-8,1);r('#f4efe4',9,4,7,4);r('#f4efe4',16,4,7,4);r('#8a8478',15,4,2,4);for(let y=5;y<8;y++){r('#b8b4a8',10,y,5,1);r('#b8b4a8',17,y,5,1)}r('#1f3a6f',8,8,16,1)})}}
  // a bronze statue of a man in a long coat on a granite plinth
  if(l=='statue'){const oy=20,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#7a7a76',1,TT-10,14,10);r('#9a9a96',1,TT-10,14,1);r('#5a5a56',1,TT-1,14,1);r('#c9a040',5,TT-6,6,2);
    r('#5a4028',6,1,4,5);r('#7a5a38',7,1,2,2);r('#4a3420',4,6,8,TT-17);r('#6b4a2e',5,6,2,TT-17);r('#4a3420',3,8,2,8);r('#4a3420',11,8,2,8);r('#3a2818',5,TT-11,2,1);r('#3a2818',9,TT-11,2,1)})}}
  // a long wooden bench on black iron legs
  if(l=='bench'){const oy=4,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#2a2a30',3,9,2,TT-9);r('#2a2a30',W-5,9,2,TT-9);r('#2a2a30',(W>>1)-1,9,2,TT-9);for(const y of[3,6]){r('#8a6038',1,y,W-2,3);r('#a57a4a',1,y,W-2,1)}})}}
  // a potted plant: a broad-leaved fern in a white pot
  if(l=='plant'){const oy=12,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#e8e6e0',3,TT-9,10,9);r('#c8c6c0',3,TT-9,10,1);r('#5a3e27',4,TT-10,8,1);
    for(const[x,y,w,h]of[[2,6,4,3],[10,6,4,3],[5,2,3,8],[8,3,3,7],[1,11,4,2],[11,11,4,2],[6,9,4,4]]){r('#2e6a2e',x,y,w,h);r('#4a9a3a',x+1,y,Math.max(1,w-2),1)}})}}
  // a tall wooden wardrobe with two panelled doors, brass knobs and a carved top
  if(l=='wardrobe'){const oy=22,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#5a3d24',1,1,W-2,TT-3);r('#3a2414',0,0,W,3);r('#7a5636',0,0,W,1);
    r('#4a3020',(W>>1)-1,4,1,TT-8);for(const x of[3,(W>>1)+1]){r('#6b4a2e',x,5,(W>>1)-4,TT-12);r('#7a5636',x,5,(W>>1)-4,1);r('#4a3020',x,TT-8,(W>>1)-4,1)}
    r('#c9a040',(W>>1)-3,TT>>1,1,2);r('#c9a040',(W>>1)+1,TT>>1,1,2);r('#3a2414',2,TT-2,2,2);r('#3a2414',W-4,TT-2,2,2);r('#3a2414',1,TT-4,W-2,1)})}}
  // a brown leather Chesterfield sofa, buttoned
  if(l=='sofa'){const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#5a2e1a',0,0,W,TT-2);r('#7a4228',2,1,W-4,8);for(let x=5;x<W-4;x+=6)r('#4a2414',x,4,1,1);r('#8a4e30',2,10,W-4,TT-14);r('#a05a38',2,10,W-4,1);r('#5a2e1a',0,0,3,TT-2);r('#5a2e1a',W-3,0,3,TT-2);r('#3a1e10',2,TT-2,2,2);r('#3a1e10',W-4,TT-2,2,2)})}}
  // a glass display case of Kelp Cola bottles from over the years: a dark wooden cabinet, three glass shelves of bottles in their
  // old shapes and colours, a little lamp lighting them, and a brass plaque
  if(/bottle display/.test(l)){const oy=14,TT=H+oy,cols=['#2e9d57','#3a7a5a','#6a4a2a','#cfe0d8','#1f6a42'];return{oy,c:mk(W,TT,r=>{
    r('#4a2e1a',0,0,W,TT);r('#6b4a2e',0,0,W,2);r('#cfe8f0',2,3,W-4,TT-8);r('#e8f6fa',2,3,W-4,1);
    for(let row=0;row<3;row++){const sy=4+row*((TT-8)/3|0),sh=(TT-8)/3|0;r('#9fc0cc',2,sy+sh-1,W-4,1);
      for(let x=4,i=0;x<W-5;x+=5,i++){const c=cols[(i+row*2)%cols.length],bh=Math.min(sh-3,6+((i+row)%3));const by=sy+sh-1-bh;
        r('#c0392b',x+1,by,1,1);r(c,x+1,by+1,1,2);r(c,x,by+3,3,bh-3);r(shade(c,.3),x,by+3,1,bh-3);if((i+row)%2)r('#f4f4f0',x,by+4,3,1)}}
    r('#ffe9a8',(W>>1)-3,3,6,1);r('#c9a040',(W>>1)-5,TT-4,10,2);r('#3a2414',0,TT-2,W,2)})}}
  // a hydroponic grow bed: a black tray on legs, a row of cannabis plants in net pots, feed tubing along its front, and a grow lamp
  // hanging on chains above, its warm light spilling over the leaves
  if(/grow bed/.test(l)){const oy=20,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    r('#2a2a30',1,TT-12,W-2,6);r('#3a3d44',1,TT-12,W-2,1);r('#1a1a1e',3,TT-6,2,6);r('#1a1a1e',W-5,TT-6,2,6);r('#2e86c1',1,TT-8,W-2,1);
    // each plant: fan leaves of spiky leaflets spreading from the stem, in tiers, the top ones lighter
    const PL=['...L...','.L.L.L.','L.LGL.L','.LGGGL.','..GGG..','L..D..L','LG.D.GL','.GGDGG.','..GDG..','G..D..G','GGGDGGG','.GGDGG.'],PC={L:'#7ac85a',G:'#4f9a38',D:'#3e7a2e'};
    for(let x=2;x<W-8;x+=8){r('#3a3d44',x+1,TT-14,5,3);PL.forEach((row,y)=>[...row].forEach((ch,i)=>{if(PC[ch])r(PC[ch],x+i,TT-26+y,1,1)}))}
    r('#5a5f68',2,0,1,5);r('#5a5f68',W-3,0,1,5);r('#2a2a30',0,4,W,3);r('#fff3c0',1,7,W-2,1);
    for(let y=8;y<TT-14;y++)r('rgba(255,236,170,'+(0.22*(1-(y-8)/(TT-22))).toFixed(3)+')',1,y,W-2,1)})}}
  // a water tank: a blue drum with a lid, a level gauge and feed tubing running off it
  if(/water tank/.test(l)){const oy=8,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#1f5a8a',1,2,W-2,TT-3);r('#2e86c1',2,2,W-6,TT-3);r('#5ab0e0',2,2,2,TT-3);r('#174870',0,0,W,3);r('#9fd0f0',W-4,6,2,TT-10);r('#1a1a1e',W-4,TT-10,2,2);r('#2e86c1',W-1,TT-6,1,4)})}}
  // drums of nutrients: green, blue and orange plastic drums with white labels
  if(/nutrient drums/.test(l)){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{['#2e9d57','#2e6f9a','#d0782a'].forEach((c,i)=>{const x=1+i*16;r(c,x,1,13,TT-2);r(shade(c,.25),x,1,3,TT-2);r(shade(c,-.25),x,1,13,2);r('#f4f4f0',x+3,TT/2-2|0,7,4);r('#8a8478',x+4,TT/2-1|0,5,1)})})}}
  // a floor fan: a grey cage on a stand, its blades a blur
  if(/^fan$/.test(l)){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{const cx=W>>1,cy=8;for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const d=Math.hypot(x,y);if(d<=7.2)r(d>6.2?'#5a5f68':((Math.atan2(y,x)*3/Math.PI+3)|0)%2?'#9aa3ad':'#c9ced4',cx+x,cy+y)}r('#2a2a30',cx-1,cy-1,2,2);r('#5a5f68',cx,cy+7,1,TT-cy-9);r('#3a3d44',cx-4,TT-2,8,2)})}}
  // a copper moonshine still: a domed copper pot over a small fire, its pipe coiling down into a barrel
  if(/copper still/.test(l)){const oy=14,TT=H+oy,an=[];const c=mk(W,TT,r=>{r('#3a3a44',2,TT-6,18,6);r('#2a2a33',2,TT-6,18,1);
    for(let y=0;y<16;y++){const hw=Math.round(Math.sqrt(Math.max(0,1-((15-y)/15)**2))*9);r(y<4?'#d8904a':'#b8703a',11-hw,TT-22+y,hw*2,1)}r('#e8a860',6,TT-20,3,6);r('#8a5a2a',10,TT-30,2,9);r('#b8703a',10,TT-30,10,2);
    for(let k=0;k<4;k++)r('#b8703a',W-14,TT-27+k*4,8,2);r('#6b4a2e',W-16,TT-12,12,12);r('#4a2e1a',W-16,TT-8,12,1);r('#4a2e1a',W-16,TT-4,12,1)});an.push({t:'fire',x:11,y:TT-6});return{oy,c,an}}
  // a wood-fired pizza oven: a brick dome with an arched mouth, a fire burning inside, and logs stacked beside it
  if(/pizza oven/.test(l)){const oy=12,TT=H+oy,cx=W>>1,an=[];const c=mk(W,TT,r=>{r('#7a5a48',0,TT-8,W,8);r('#9a7a68',0,TT-8,W,1);
    for(let y=0;y<TT-8;y++){const hw=Math.round(Math.sqrt(Math.max(0,1-((TT-8-y)/(TT-8))**2))*(W/2-1));if(hw>0){r('#a8523a',cx-hw,y,hw*2,1);if((y&3)==0)for(let x=cx-hw+((y>>2)&1)*3;x<cx+hw;x+=6)r('#7a3a2a',x,y,1,1)}}
    r('#1a1210',cx-7,TT-18,14,10);r('#1a1210',cx-5,TT-20,10,2);r('#3a2a20',cx-7,TT-9,14,1);for(let k=0;k<3;k++){r('#6a4428',2,TT-6+k*2,8,2);r('#8a5a36',2,TT-6+k*2,8,1)}});
    an.push({t:'fire',x:cx,y:TT-10});return{oy,c,an}}
  // a printing press: a black cast-iron frame on legs, an ink roller across the bed, a stack of blank paper going in and a
  // printed sheet coming out, red-painted trim, and a big flywheel on its side that turns (the gear animation)
  if(/printing press/.test(l)){const oy=10,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    r('#2a2a30',2,TT-6,4,6);r('#2a2a30',W-10,TT-6,4,6);r('#3a3d44',0,8,W-6,TT-14);r('#4a4f58',0,8,W-6,2);r('#1e1e24',0,TT-8,W-6,2);
    r('#a83a2a',2,10,W-10,1);r('#a83a2a',2,TT-10,W-10,1);
    r('#6b737c',4,13,W-14,6);r('#8a929b',4,13,W-14,1);r('#2a2a33',6,15,W-18,2);r('#9aa0a6',4,19,W-14,1);
    r('#c9ced4',5,3,10,6);r('#e8e8e0',5,3,10,1);r('#f4f1e8',W-26,TT-12,14,7);for(let y=TT-11;y<TT-6;y+=2)r('#8a8478',W-24,y,10,1);r('#1a1a1a',W-24,TT-11,6,1);
    r('#2a2a30',W-8,4,4,TT-10);r('#5a5f68',W-7,4,1,TT-10)});
    an.push({t:'gear',x:W-5,y:oy+3,r:7});return{oy,c,an}}
  if(ch=='e'){const q=f.quilt||['#b33333','#2e6f9a','#3d7a5a','#c9822a'][v*4|0],oy=4,TT=H+oy,wd='#6b4a2e';return{oy,c:mk(W,TT,r=>{
    r(wd,0,0,W,7);r('#8a6a45',1,1,W-2,1);r(wd,0,7,2,TT-7);r(wd,W-2,7,2,TT-7);r('#f2f2f2',2,6,W-4,TT-8);r('#ffffff',3,7,W-6,5);r('#d8dfe6',3,11,W-6,1);
    r(q,2,13,W-4,TT-15);for(let y=17;y<TT-2;y+=4)r(shade(q,-.15),2,y,W-4,1);r(shade(q,.25),2,13,W-4,2);r(wd,0,TT-2,W,2)})}}
  if(ch=='u'&&/card|roulette|poker/.test(l)){const oy=5,TT=H+oy+6,seats=[];for(let x=8;x<W;x+=16)seats.push(x);return{oy,c:mk(W,TT,r=>{
    const chair=(cx,y,back)=>{if(back){r('#5a1a2a',cx-3,y,6,3);r('#7a2a3a',cx-3,y,6,1)}r('#8a2a3a',cx-3,y+3,6,3);r('#5a1a2a',cx-3,y+5,6,1)};seats.forEach(x=>chair(x,0,true));
    r('#5a3d2a',0,oy,W,H-4);r('#2e7d4a',2,oy+2,W-4,H-8);r('#3d9a5e',2,oy+2,W-4,1);r(shade('#5a3d2a',-.3),0,oy+H-4,W,2);
    if(l.includes('roulette')){const cx=W-14,cy=oy+(H>>1)-2;for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const d=Math.hypot(x,y);if(d<=6.5)r(d>5?'#5a3d2a':d<2?'#c9a040':(Math.atan2(y,x)*3|0)&1?'#c0392b':'#1a1a22',cx+x,cy+y)}
      for(let x=6;x<W-24;x+=5)r('#f2e6c8',x,oy+5,3,6)}
    else{for(let k=0;k<4;k++){r('#f2f2f2',6+k*7,oy+5,4,6);r('#c0392b',7+k*7,oy+6,1,1)}r('#c0392b',W-12,oy+H-10,3,2);r('#2e86c1',W-8,oy+H-10,3,2);r('#e0a100',W-10,oy+H-12,3,2)}
    seats.forEach(x=>chair(x,oy+H-1,false))})}}
  // a grand piano in three-quarter view: a glossy black body, straight on the left and curving in to its tail on the right, the
  // lid propped open on its stick to show the gold frame and strings, the keyboard across the front, and three legs
  if(ch=='u'&&l.includes('piano')){const oy=12,TT=H+oy,bt=oy+2,bb=H+oy-12,body=y=>{const u=(y-bt)/(bb-bt);return Math.round(9+(W-11)*Math.sqrt(Math.max(0,u)))};
    return{oy,c:mk(W,TT,r=>{
      // the body, and the gold frame and strings showing inside it
      for(let y=bt;y<bb;y++){const xr=body(y);r('#16141c',1,y,xr,1);if(y>bt+2&&y<bb-1){r('#c9a040',3,y,xr-4,1);for(let x=4;x<xr-2;x+=2)r('#8a6a2a',x,y,1,1)}}
      for(let y=bt+3;y<bb-1;y+=5)r('#e8c860',3,y,body(y)-4,1);
      // the lid, propped up over the bass side, glossy with a highlight, and its stick
      for(let y=0;y<oy+6;y++){const xr=Math.round(4+(W*.55)*(y/(oy+6)));r('#1c1a24',1,y,xr,1);r('#3a3848',1+Math.round(xr*.3),y,2,1)}
      r('#5a5f68',Math.round(W*.6),3,1,bt);r('#2a2830',W*.6|0,2,2,2);
      // the keyboard: a black key slip, then white keys with black ones in twos and threes
      const ky=bb;r('#16141c',0,ky,W,2);for(let x=1;x<W-1;x++)r(x%3==0?'#b8b0a0':'#f4f1e8',x,ky+2,1,5);
      for(let k=0,x=2;x<W-2;x+=3,k++)if([0,1,3,4,5].includes(k%7))r('#16141c',x+1,ky+2,2,3);r('#2a2830',0,ky+7,W,1);
      // the legs, and a little shine along the case
      for(const lx of[2,W-5])r('#16141c',lx,ky+8,3,H+oy-ky-8);r('#16141c',(W>>1)-1,bb-4,2,4);r('#4a4858',2,bt+1,1,bb-bt-3)})}}
  if(ch=='u'&&l.includes('bowling')){const oy=0;return{oy,c:mk(W,H,r=>{r('#2a2a33',0,0,W,H);r('#3a3d44',0,0,W,3);r('#3a3d44',0,H-3,W,3);
      for(let x=0;x<W;x++)r(x%6<3?'#e0b878':'#d4a96a',x,3,1,H-6);r('#f4e0b0',0,4,W,1);for(let x=0;x<W;x+=3)r('#c4995a',x,(x*7)%(H-8)+4,2,1);
      r('#1a1a22',22,3,1,H-6);for(let k=0;k<5;k++){const y=6+k*((H-12)/4);r('#5a3a26',70-Math.abs(k-2)*4,y,3,1);r('#5a3a26',71-Math.abs(k-2)*4,y-1,1,3)}
      const px0=W-26,cy=H>>1;[[0,0],[5,-3],[5,3],[10,-6],[10,0],[10,6],[15,-9],[15,-3],[15,3],[15,9]].forEach(([dx,dy])=>{r('#f4f4f0',px0+dx,cy+dy-1,3,3);r('#c0392b',px0+dx+1,cy+dy-1,1,1)});
      r('#1a1a22',W-6,3,6,H-6);r('#4a4f58',2,H-10,14,7);r('#2a2a33',3,H-9,12,5);r('#1f3a6f',4,H-8,4,4);r('#7a1a1a',9,H-8,4,4);r('#ffffff',5,H-8,1,1);r('#ffffff',10,H-8,1,1)})}}
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
  if(ch=='y'&&/gun|cloth|rail|wig|mirror|passport|cigarette|wiretap|forged|recording|milkshake|samples|fridge|rods|tackle|slot|pipes/.test(l)){const oy=12,TT=H+oy-2;let an=null;const c=mk(W,TT,r=>{
    if(l.includes('gun')){r('#8a7a5a',0,0,W,TT);for(let y=2;y<TT;y+=4)for(let x=2;x<W;x+=4)r('#7a6a4a',x,y);
      for(let y=3;y<TT-4;y+=6)for(let x=2;x<W-14;x+=16){r('#6b4a2e',x,y+1,5,2);r('#2a2a33',x+5,y+1,9,1);r('#2a2a33',x+5,y,2,1)}}
    else if(l.includes('cloth')){r('#5a3d2a',0,TT-3,W,3);for(let x=1;x<W-3;x+=5){const col=['#c0392b','#2e6f9a','#e0a100','#3d7a5a','#7d3c98','#e8e8e8'][hash(x,1,v*7)*6|0];r(col,x,2,4,TT-5);r(shade(col,.3),x,2,4,1);r(shade(col,-.2),x+3,3,1,TT-6)}}
    else if(l.includes('rail')){r('#9aa3ad',0,2,W,1);r('#6b737c',1,2,1,TT-2);r('#6b737c',W-2,2,1,TT-2);for(let x=3;x<W-4;x+=4){const col=['#3a3d44','#8a3a2a','#2e5f8f','#c9b28a','#3d5a4a'][hash(x,2,v*5)*5|0];r('#c9ced4',x+1,1,1,2);r(col,x,3,4,TT-8);r(shade(col,.2),x,3,1,TT-8)}}
    // the Cover Story Department: wigs on stands, a gilt dressing mirror with bulbs, shelves of passports
    else if(l.includes('wig')){r('#6b4a2e',0,TT-4,W,4);r('#6b4a2e',0,TT-16,W,2);for(let x=2;x<W-6;x+=8){const col=['#e8c86a','#2a1a12','#c0392b','#b5b5b5','#8a5a3a'][hash(x,3,v*3)*5|0];for(const y0 of[TT-26,TT-13])if(y0>=0){r('#e8d8c0',x+1,y0+3,6,7);r(col,x,y0,8,4);r(col,x,y0+3,2,7);r(col,x+6,y0+3,2,7)}}}
    // a one-way mirror: dark glass in a plain steel frame
    else if(l.includes('one-way')){r('#7d838a',0,0,W,TT-2);r('#1a2028',2,2,W-4,TT-6);r('#2e3a48',4,3,4,TT-9);r('#3a4656',W-10,5,2,6)}
    // the cigarette machine: red, with rows of packs behind glass, the price and a coin slot
    // oil samples: a shelf of glass jars of crude, each labelled
    else if(l.includes('samples')){r('#5a3d2a',0,0,W,TT);for(let y=2;y<TT-3;y+=8){r('#3a2a1a',1,y+6,W-2,1);for(let x=2;x<W-4;x+=5){r('#d8e4ea',x,y,4,6);r(['#1a1410','#2a1e14','#3a2a12'][(x+y)%3],x,y+2,4,4);r('#f4f0e0',x,y+3,4,1);r('#9aa3ad',x,y-1,4,1)}}}
    else if(l.includes('milkshake')){r('#5a3d2a',0,TT-6,W,6);r('#7a5436',0,TT-6,W,1);r('#d8dde2',3,2,W-14,TT-9);r('#f4f6f8',4,2,W-16,2);r('#9aa3ad',W-12,2,1,TT-9);r('#c0392b',3,TT-10,W-14,2);
      for(let k=0;k<3;k++){const x=6+k*((W-20)/3|0);r('#b8c0c8',x,6,5,3);r('#5a5f68',x+2,9,1,4);r('#c9ced4',x,13,5,TT-20);r('#e8ecef',x,13,1,TT-20)}
      r('#f4f4f0',W-9,TT-16,5,10);r('#f2a6c0',W-8,TT-14,3,7);r('#ffffff',W-8,TT-16,3,2);r('#c0392b',W-7,TT-19,1,3);r('#e8e8e8',W-5,TT-18,1,8)}
    else if(l.includes('cigarette')){r('#8a1a1a',1,0,W-2,TT);r('#c0392b',2,1,W-4,2);r('#1a1a22',3,4,W-12,TT-9);for(let y=5;y<TT-6;y+=5)for(let x=4;x<W-11;x+=4)r(['#e8e8e8','#c0392b','#2e86c1','#e0a100'][(x+y)%4],x,y,3,3);
      r('#c9ced4',W-8,5,4,6);r('#1a1a22',W-7,7,2,1);r('#ffd23a',W-8,13,4,2);r('#2a2a33',3,TT-4,W-6,2)}
    // George's office: wiretap gear (reels and a headset on a bench), forged papers (stamps, passports, a lamp)
    else if(l.includes('wiretap')||l.includes('recording')){r('#5a3d2a',0,TT-5,W,5);r('#3a3d44',1,2,W-2,TT-8);for(const x of[4,W-10]){r('#c9ced4',x,4,6,6);r('#2a2a33',x+2,6,2,2)}r('#1a1a22',2,TT-8,W-4,2);r('#2ecc71',W>>1,4,2,2)}
    else if(l.includes('forged')){r('#5a3d2a',0,TT-5,W,5);r('#f4f4f0',2,TT-9,8,4);r('#1f3a6f',12,TT-9,5,4);r('#7a1e2a',18,TT-9,5,4);r('#c0392b',4,TT-8,3,2);r('#2a2a33',W-6,2,2,TT-9);r('#ffd23a',W-8,1,6,3)}
    else if(l.includes('mirror')){r('#c9a040',1,0,W-2,TT-6);r('#a8c8d8',3,2,W-6,TT-10);r('#d8eef8',5,3,3,TT-14);r('#e8f6fc',W-12,4,2,6);r('#6b4a2e',0,TT-6,W,6);for(let x=3;x<W-2;x+=5)r('#fff3c0',x,1,2,2)}
    else if(l.includes('passport')){r('#5a3d2a',0,0,W,TT);for(let y=2;y<TT-3;y+=6){r('#3a2a1a',1,y+4,W-2,1);for(let x=2;x<W-3;x+=4)r(['#1f3a6f','#7a1e2a','#2e5a3a','#3a3a44'][hash(x,y,v)*4|0],x,y,3,4)}}
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
  if(ch=='y'&&l.includes('bars')){const oy=14,TT=H+oy;return{oy,c:mk(W,TT,r=>{
    // a cell front: steel bars between a top and bottom rail, with a lock on the door
    r('#3a3d44',0,0,W,2);r('#3a3d44',0,TT-2,W,2);for(let x=1;x<W;x+=3){r('#6b737c',x,2,2,TT-4);r('#9aa3ad',x,2,1,TT-4)}
    const lx=(W>>1)-2;r('#2b2f3a',lx,TT/2-2|0,5,5);r('#c9a040',lx+2,TT/2|0,1,1)})}}
  if(ch=='y'&&l.includes('jewel')){const oy=12,TT=H+oy-2;return{oy,an:{t:'blink',x:W>>1,y:5,c:'#fff2a0'},c:mk(W,TT,r=>{
    // the crown jewels in a glass case on a velvet stand
    r('#5a3d2a',0,TT-6,W,6);r('#7a5436',0,TT-6,W,1);r('#5e2a75',1,4,W-2,TT-10);r('#cfe6f2',1,0,W-2,4);r('#e8f4fa',2,1,3,1);
    const cx=W>>1;r('#ffd23a',cx-6,8,12,4);r('#ffd23a',cx-6,5,2,3);r('#ffd23a',cx-1,4,2,4);r('#ffd23a',cx+4,5,2,3);r('#c0392b',cx-1,9,2,2);r('#2e86c1',cx-5,9,2,2);r('#2e9d57',cx+3,9,2,2);
    r('#c9a040',4,10,3,5);r('#ffd23a',4,9,3,1);r('#e8e8e8',W-8,9,4,4);r('#c9a040',W-7,13,2,2)})}}
  // a desktop PC on a wooden desk: a beige CRT monitor (its screen animated with the tracker's bars), a tower with drive slots and
  // a green power light, a keyboard and a mouse
  if(ch=='y'&&l=='computer'){const oy=16,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    r('#5e3e24',1,TT-16,W-2,13);r('#4a3020',1,TT-16,W-2,1);r('#7a5232',4,TT-13,12,5);r('#946640',4,TT-13,12,1);r('#c9a040',9,TT-11,2,1);r('#3a2414',1,TT-3,3,3);r('#3a2414',W-4,TT-3,3,3);
    r('#7a5232',0,TT-26,W,10);r('#946640',0,TT-26,W,1);
    r('#d8d0b8',2,1,20,19);r('#eee8d4',2,1,20,1);r('#b8b098',2,19,20,1);r('#2a2a30',4,3,16,14);r('#0e1a14',5,4,14,12);r('#b8b098',8,20,8,3);r('#d8d0b8',6,22,12,2);r('#5fe08a',19,17,1,1);
    r('#d8d0b8',23,6,8,20);r('#eee8d4',23,6,8,1);r('#b8b098',30,6,1,20);r('#5a5550',24,9,6,2);r('#5a5550',24,13,6,1);r('#5a5550',24,16,6,1);r('#5fe08a',25,22,1,1);r('#b8b098',24,24,6,1);
    r('#d8d0b8',3,TT-22,17,5);r('#b8b098',3,TT-18,17,1);for(let y=0;y<2;y++)for(let x=0;x<7;x++)r('#8a8478',4+x*2+y,TT-21+y*2,1,1);r('#5a5550',8,TT-18,8,1);
    r('#d8d0b8',22,TT-21,3,4);r('#b8b098',22,TT-18,3,1);r('#5a5550',23,TT-24,1,3)});
    an.push({t:'pcscreen',x:5,y:4,w:14,h:12});return{oy,c,an}}
  // the big screen on the back wall, for video calls to CIA headquarters: a wide dark display in a steel frame with a camera on top,
  // showing the Agency's seal and LINK READY while no call is on, above a low cabinet with speakers and the call console
  if(ch=='y'&&l=='big screen'){const oy=34,TT=H+oy,an=[];const c=mk(W,TT,r=>{
    r('#2b2f3a',0,2,W,32);r('#4a4f58',0,2,W,1);r('#1a1c22',0,33,W,1);r('#0b1a33',3,5,W-6,26);r('#3a3d44',(W>>1)-4,0,8,3);r('#0b0b10',(W>>1)-1,1,2,1);
    const cx=W>>1,cy=15;for(let y=-8;y<=8;y++)for(let x=-8;x<=8;x++){const d=Math.hypot(x,y);if(d<=8.3)r(d>7.2?'#c9a040':d>6.4?'#1f3a5f':'#2e5a8a',cx+x,cy+y)}
    r('#f4f4f0',cx-3,cy-3,6,5);r('#1f3a5f',cx-1,cy-2,2,3);r('#c9a040',cx-2,cy+3,4,1);ptext(r,'CIA',4,7,'#9fc0e0');ptext(r,'HQ',W-12,7,'#9fc0e0');
    ptext(r,'LINK READY',(W-39)>>1,25,'#5fe08a');
    r('#3a3d44',2,34,W-4,TT-35);r('#4a4f58',2,34,W-4,1);for(const x of[5,W-14])for(let y=37;y<TT-3;y+=2)r('#1a1c22',x,y,9,1);
    r('#1a1c22',22,37,20,6);r('#c0392b',24,39,2,2);r('#2e9d57',28,39,2,2);r('#d0d4d8',32,39,8,1);r('#d0d4d8',32,41,6,1)});
    an.push({t:'vcall',x:(W>>1)-1,y:1,sx:4-(W>>1),sy:4,w:W-6,h:26});return{oy,c,an}}
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
  // a wooden shelf stacked with folded towels in soft colours
  if(ch=='y'&&l.includes('towel')){const oy=12,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#7a5232',0,0,W,TT);r('#946640',0,0,W,1);
    for(const sy of[2,12,22]){r('#5a3a22',1,sy+8,W-2,2);for(let x=3,i=0;x<W-8;x+=8,i++){const c=['#f4efe4','#9fd6c0','#f2c4c4','#cfe0f0','#f4efe4'][(i+sy)%5];
      for(let k=0;k<3;k++){r(c,x,sy+6-k*2,6,2);r(shade(c,-.15),x,sy+7-k*2,6,1)}}}})}}
  if(ch=='y'){
    if(l.includes('file')||l.includes('archive')||l.includes('locker')){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{for(let x=0;x<W;x+=16){r('#8d959e',x+1,0,14,TT);r('#a9b0b8',x+1,0,14,2);r('#6b737c',x+13,0,2,TT);
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
  // an armchair: a high back, cushions and rolled arms, on short legs, in one of a few fabrics
  if(ch=='x'&&l=='armchair'){const oy=10,TT=H+oy,c=['#7a2a2a','#2e5a8a','#3d6a4a','#8a6a3a'][v*4|0];return{oy,c:mk(W,TT,r=>{
      r(shade(c,-.25),1,1,W-2,11);r(shade(c,.1),2,1,W-4,2);r(c,1,11,W-2,TT-14);r(shade(c,.2),3,11,W-6,2);
      r(shade(c,-.15),0,6,4,TT-9);r(shade(c,-.15),W-4,6,4,TT-9);r(shade(c,.15),0,6,4,2);r(shade(c,.15),W-4,6,4,2);r('#3a2414',2,TT-3,2,3);r('#3a2414',W-4,TT-3,2,3)})}}
  // a standard lamp: a cream shade on a tall brass stem, on a round base
  if(ch=='x'&&l=='lamp'){const oy=18,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#e8d8b0',4,0,8,2);r('#e8d8b0',3,2,10,5);r('#d8c49a',3,6,10,1);r('#fff3c0',5,7,6,1);r('#c9a040',7,7,2,TT-10);r('#8a6a2a',4,TT-3,8,3);r('#c9a040',5,TT-3,6,1)})}}
  if(ch=='x'&&l.includes('telephone')){const oy=6,TT=H+oy;return{oy,c:mk(W,TT,r=>{r('#6b4a2e',2,9,12,TT-12);r('#8a6a45',2,9,12,2);r('#4a3020',3,TT-3,2,3);r('#4a3020',11,TT-3,2,3);
      r('#1a1a22',4,5,8,5);r('#2a2a33',5,4,6,1);r('#c9ced4',6,6,4,3);r('#1a1a22',7,7,2,1);r('#1a1a22',3,2,10,2);r('#1a1a22',3,4,2,1);r('#1a1a22',11,4,2,1);r('#3a3a44',5,2,6,1);r('#1a1a22',12,8,1,4)})}}
  if(ch=='x'&&l.includes('tomb')){const oy=6,TT=H+oy,king=l.includes('king');return{oy,c:mk(W,TT,r=>{
    // a stone sarcophagus seen from above: a carved lid with a cross (or, for the late king, a purple pall and gold crown)
    r('#6e6a62',0,4,W,TT-4);r('#5a564f',0,TT-5,W,5);for(let x=3;x<W-3;x+=6)r('#4a463f',x,TT-4,3,3);
    r('#9a948a',1,0,W-2,TT-7);r('#b1aca2',1,0,W-2,2);r('#7a756c',1,TT-9,W-2,2);
    if(king){r('#5e2a75',3,3,W-6,TT-13);r('#7d3c98',3,3,W-6,2);r('#c9a040',3,TT-11,W-6,1);
      const cx=W>>1;r('#c9a040',cx-5,8,10,4);r('#ffd23a',cx-5,6,2,2);r('#ffd23a',cx-1,5,2,3);r('#ffd23a',cx+3,6,2,2);r('#c0392b',cx-1,9,2,2)}
    else{const cx=W>>1;r('#7a756c',cx-1,4,2,TT-15);r('#7a756c',cx-4,8,8,2)}})}}
  // a sunken bath of hot spring water, in a rim of dark stone, steaming
  if(/bath|pool/.test(l)){const c=mk(W,H,r=>{r('#5a5048',0,0,W,H);r('#7a7066',0,0,W,2);r('#3a3430',0,H-2,W,2);r('#1f8f94',3,3,W-6,H-6);r('#2fa9a8',4,4,W-8,H-9);r('#56c9bd',4,4,W-8,2);
      for(let x=8;x<W-8;x+=10)r('rgba(220,255,250,.5)',x,(x*7)%(H-12)+6,4,1)});
    return{oy:0,c,an:Array.from({length:Math.max(2,w)},(_,i)=>({t:'steam',ph:i/w,x:8+i*(W-16)/Math.max(1,w-1),y:8+(i%2)*(H-20)}))}}
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
  if(ch=='x'&&/drum|hay|sack|timber|cola|safe|pot/.test(l)){const oy=4,TT=H+oy;return{oy,c:mk(W,TT,r=>{for(let x=0;x+15<=W;x+=16)for(let y=0;y<H;y+=16){const Y=y+oy-2;
    if(l.includes('drum')){r('#2b2f3a',x+2,Y+1,12,14);r('#3a3f4a',x+2,Y+1,3,14);r('#e0a100',x+2,Y+4,12,2);r('#e0a100',x+2,Y+10,12,1);r('#5a5f68',x+3,Y,10,2)}
    else if(l.includes('hay')){r('#c9a040',x+1,Y+2,14,12);r('#e0bc5a',x+1,Y+2,14,2);r('#a8862a',x+1,Y+11,14,1);r('#8a6a20',x+4,Y+2,1,12);r('#8a6a20',x+11,Y+2,1,12)}
    else if(l.includes('sack')){r('#b8a070',x+2,Y+3,12,11);r('#d0b888',x+3,Y+3,10,2);r('#8a7448',x+6,Y+1,4,3);r('#8a7448',x+2,Y+12,12,2)}
    else if(l.includes('timber'))for(let k=0;k<3;k++){r('#8a5a36',x+1,Y+2+k*4,14,3);r('#a87a4c',x+1,Y+2+k*4,14,1);r('#d2a86e',x+13,Y+2+k*4,2,3)}
    else if(l.includes('cola')){r('#2e7d4a',x+1,Y+4,14,10);r('#3d9a5e',x+1,Y+4,14,2);r('#f2f2f2',x+4,Y+8,8,2);for(let k=0;k<4;k++){r('#5a2a14',x+2+k*3,Y,2,5);r('#f2f2f2',x+2+k*3,Y+1,2,1)}}
    else if(l.includes('safe')){r('#5a5f68',x+1,Y+1,14,13);r('#7d858e',x+1,Y+1,14,2);r('#3a3d44',x+3,Y+4,10,8);r('#c9a040',x+7,Y+7,2,2)}
    else{r('#6b4a2e',x+1,Y+3,14,10);r('#c9b28a',x+2,Y+4,12,8);for(let k=3;k<14;k+=3)r('#6b4a2e',x+k,Y+4,1,8)}}})}}
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
  if(ch=='g'&&l.includes('saw')){const oy=10,TT=H+oy,bw=W;return{oy,an:{t:'belt',x:0,y:oy+4,w:bw,h:H-8,log:1},c:mk(W,TT,r=>{r('#5a5f68',2,TT-4,2,4);r('#5a5f68',bw-4,TT-4,2,4);
    r('#8a6a45',0,oy,bw,4);r('#a8834a',0,oy,bw,1);r('#2b2f3a',0,oy+4,bw,H-8);r('#8a6a45',0,oy+H-6,bw,3);
    const cx=W>>1,cy=oy+4;for(let y=-9;y<=0;y++)for(let x=-9;x<=9;x++){const d=Math.hypot(x,y);if(d<=9.4)r(d>8?((x+y)&1?'#f4f4f4':'#9aa3ad'):d<2.5?'#3a3d44':(x*y>0?'#c3cad1':'#aab2ba'),cx+x,cy+y)}
    r('#c0392b',cx-11,cy-12,22,3);r('#e04a3a',cx-11,cy-12,22,1);r('#8e2620',cx-11,cy-10,2,6);r('#8e2620',cx+9,cy-10,2,6);r('#e0a100',cx-14,TT-8,28,2)})}}
  if(ch=='g'){const oy=4,TT=H+oy,bw=W-30;return{oy,an:{t:'belt',x:0,y:oy+4,w:bw,h:H-8,bot:l.includes('bottl')},c:mk(W,TT,r=>{r('#5a5f68',2,TT-4,2,4);r('#5a5f68',bw-4,TT-4,2,4);r('#9aa3ad',0,oy,bw,4);r('#c3cad1',0,oy,bw,1);
    r('#2b2f3a',0,oy+4,bw,H-8);r('#9aa3ad',0,oy+H-6,bw,3);r('#5b8fb9',bw,0,30,TT);r('#7fb0d0',bw,0,30,2);r('#3d6b8f',W-4,0,4,TT);r('#2b2f3a',bw+6,6,14,8);r('#7fd0a0',bw+8,8,3,2);r('#e8321e',bw+13,8,3,2);r('#e0a100',bw+2,TT-8,26,2)})}}
  // a fireplace: a stone surround and mantelpiece, a fire in the hearth
  if(ch=='i'&&l=='fireplace'){const oy=14,TT=H+oy,bw=W-6;return{oy,an:{t:'stove',x:6,y:oy+5,w:W-12},c:mk(W,TT,r=>{r('#8a8278',0,0,W,TT);for(let y=2;y<TT;y+=4)for(let x=(y%8?0:3);x<W;x+=7)r('#76706a',x,y,6,1);
      r('#5a3d2a',0,0,W,3);r('#7a5436',0,0,W,1);r('#1a1410',5,oy,W-10,TT-oy-1);r('#3a2a1e',4,TT-2,W-8,2)})}}
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
  const wx=L[m][3]=='interior'?'snow':weatherOf(m);WXID=wx;WMAP=WXSNOW[wx]<.5&&!DET(m)?MELT:null;CYBING=L[m][3]!='interior';try{return SC[m]=sceneOf(m,wx)}finally{WMAP=null;WXID='';CYBING=false}}
// In neon Frostholm, turn a building's animations into light sources: neon signs and tubes glow in their own colour (and are
// reflected in the wet street below the building, at rb), lit windows glow warm or neon-tinted, marquee bulbs glow gold.
function cyberLights(b,x,y,h,lights,refl,dark){const rb=refl?(y+h)*16:0;let nb=0;
  return b.an.filter(a=>{const X=a.x+x*16,Y=a.y+y*16;
    if(dark){if(['neon','bulb','lbulb','blink'].includes(a.t))a.off=1;return a.t!='wlight'&&a.t!='tube'}
    if(a.t=='neon'){const n=a.s.length;lights.push(a.v?{x:X+1,y:Y+n*3,r:30,col:rgbs(a.col||'#ff5fa8'),f:1,rb}:{x:X+n*2,y:Y+2,r:Math.max(26,n*3.4),col:rgbs(a.col||'#ff5fa8'),f:1,rb})}
    if(a.t=='tube')lights.push({x:X,y:Y,r:30,col:rgbs(a.col),f:0,rb});
    if(a.t=='wlight'){lights.push({x:X,y:Y,r:16,col:refl?['255,210,150','120,220,255','255,120,220'][hash(X,Y,650)*3|0]:'255,205,140',f:0});return false}
    if(a.t=='bulb'&&nb++%5==0)lights.push({x:X,y:Y,r:14,col:'255,210,90',f:1});
    return true})}
function sceneOf(m,wx){
  const M=MAPS[m],inside=L[m][3]=='interior',an=[],boats=[],ents=[],lights=[],c=inside?interiorLayer(m):groundLayer(m),g=c.getContext('2d');
  if(c.an)an.push(...c.an);
  // doors between rooms, in every interior (the flats in the apartment blocks, the hotel rooms, the royal apartments, the monks'
  // cells, your own room): a floor tile in a gap in a wall (walls either side of it), across a doorway
  if(inside)for(let y=1;y<M.length-1;y++)for(let x=1;x<M[0].length-1;x++){if(M[y][x]!='f')continue;
    const h=M[y][x-1]=='W'&&M[y][x+1]=='W'&&M[y-1][x]!='W'&&M[y+1][x]!='W',v=M[y-1][x]=='W'&&M[y+1][x]=='W'&&M[y][x-1]!='W'&&M[y][x+1]!='W';
    if(h||v)an.push({t:'adoor',x:x*16,y:y*16,v})}
  const put=(k,X,Y,pic,sh,tx,ty)=>ents.push({k,X,Y,c:pic,sh,sx:tx*16+2,sy:(ty+1)*16-3});
  const signs=[],iconTop={},spires=[];
  // at night, the buildings whose business is shut (a door into a DAY_ONLY place, or a DAY_ONLY_STALLS stall) have their lights off
  const shutTonight=(x,y,w,h,st)=>NIGHT&&typeof DAY_ONLY!='undefined'&&(DOORS.some(d=>d[0]==m&&d[1]>=x&&d[1]<x+w&&d[2]>=y&&d[2]<y+h&&DAY_ONLY.includes(d[5]))||DAY_ONLY_STALLS.some(([p,k])=>p==m&&k==st));
  FL[m].forEach(([x,y,w,h,ch,lb,st])=>{
    if(inside){const fu=furn(ch,w,h,lb,INT[m]||INT.default,hash(x,y,43));if(fu){put(y+h-1,x*16-1,y*16-fu.oy-1,fu.c);[].concat(fu.an||[]).forEach(a=>an.push({...a,x:x*16+a.x,y:y*16-fu.oy+a.y}))}return}
    if(typeof MOD=='function'&&MOD(m)&&MBLD[st]){const row=M[y+h-1];let dx=w>>1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;const b=modernArt(w,h,MBLD[st],dx),ox=x*16-1,oy=y*16-MEXT-1;
      put(y+h-1,ox,oy,b.c);b.an.forEach(a=>an.push({...a,x:a.x+ox+1,y:a.y+oy+1}));b.lights.forEach(l=>lights.push({...l,x:l.x+ox+1,y:l.y+oy+1}));return}
    if(DET(m)&&DBLD[st]){const row=M[y+h-1];let dx=w>>1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;const b=detailedArt(w,h,DBLD[st],dx),ox=x*16-1,oy=y*16-DEXT-1;
      g.fillStyle='rgba(20,40,20,.28)';g.fillRect(x*16+2,(y+h)*16-1,w*16-2,4);put(y+h-1,ox,oy,b.c);b.an.forEach(a=>an.push({...a,x:a.x+ox+1,y:a.y+oy+1}));b.lights.forEach(l=>lights.push({...l,x:l.x+ox+1,y:l.y+oy+1}));return}
    if(STM(m)&&st&&BLD[st]&&!['shelter','manhole','wagon','fountain'].includes(BLD[st].kind)){const row=M[y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;
      const b=steamArt(w,h,BLD[st],dx),ox=x*16,oy=y*16-SEXT;g.fillStyle='rgba(20,10,0,.35)';g.fillRect(x*16+2,(y+h)*16-1,w*16-2,4);put(y+h-1,ox,oy,b.c);b.an.forEach(a=>an.push({...a,x:a.x+ox,y:a.y+oy}));return}
    if(GOTH(m)&&GBLD[st]){const row=M[y+h-1];let dx=w>>1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;const b=gothicArt(w,h,GBLD[st],dx),ox=x*16-1,oy=y*16-GEXT-1;
      g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x*16+2,(y+h)*16-1,w*16-2,4);put(y+h-1,ox,oy,b.c);b.an.forEach(a=>an.push({...a,x:a.x+ox+1,y:a.y+oy+1}));b.lights.forEach(l=>lights.push({...l,x:l.x+ox+1,y:l.y+oy+1}));return}
    if(st&&BLD[st]&&BLD[st].kind=='manhole'){g.drawImage(manholeArt,x*16,y*16);return}
    if(st&&BLD[st]&&BLD[st].kind=='tent'){const row=M[y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;g.drawImage(tentArt(w,h,dx),x*16-1,y*16-9);return}
    if(st&&BLD[st]&&BLD[st].kind=='mast'){put(y+h-1,x*16,y*16-MAST_UP,mastArt(w,h));an.push({t:'blink',x:x*16+w*8-1,y:y*16-MAST_UP-1});return}
    if(st&&BLD[st]&&BLD[st].kind=='derrick'){const row=M[y+h-1];let dx=-1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;put(y+h-1,x*16,y*16-DER_UP,derrickArt(w,h,dx));an.push({t:'blink',x:x*16+w*8-1,y:y*16-DER_UP+2});return}
    // the van and shelters stand taller than their tiles, so they are sorted with people (who can pass behind them) rather than painted on the ground
    if(st&&BLD[st]&&BLD[st].kind=='van'){g.fillStyle='rgba(30,50,80,.25)';g.fillRect(x*16+6,(y+h)*16-2,w*16-8,3);put(y+h-1,x*16-1,y*16-11,vanArt(w,h));an.push({t:'smoke',x:(x+w)*16-14,y:y*16-8});return}
    if(st&&BLD[st]&&(BLD[st].kind=='kiosk'||BLD[st].kind=='cart')){const cart=BLD[st].kind=='cart',a=cart?cartArt(w,h,BLD[st]):kioskArt(w,h,BLD[st]);
      g.fillStyle='rgba(30,50,80,.25)';g.fillRect(x*16+4,(y+h)*16-2,w*16-6,3);put(y+h-1,x*16-1,y*16-15,a);if(cart)an.push({t:'smoke',x:x*16+w*8-6,y:(y+h)*16-24});return}
    if(st&&BLD[st]&&BLD[st].kind=='bigtop'){const row=M[y+h-1];let dx=w>>1;for(let i=0;i<w;i++)if(row[x+i]=='d')dx=i;
      g.fillStyle='rgba(30,50,80,.22)';g.fillRect(x*16+2,(y+h)*16-2,w*16-2,3);put(y+h-1,x*16-1,y*16-21,bigtopArt(w,h,dx));an.push({t:'flag',x:x*16+w*8+1,y:y*16-20,col:'#e0a100'});return}
    if(st&&BLD[st]&&BLD[st].kind=='wagon'){g.fillStyle='rgba(30,50,80,.25)';g.fillRect(x*16+4,(y+h)*16-2,w*16-6,3);put(y+h-1,x*16-1,y*16-11,wagonArt(w,h,BLD[st]));an.push({t:'smoke',x:x*16+w*16-11,y:y*16-11});return}
    if(st&&BLD[st]&&BLD[st].kind=='hotspring'){g.drawImage(poolArt(w,h),x*16,y*16);for(let i=0;i<Math.max(2,w*h/3|0);i++)an.push({t:'steam',ph:hash(i,3,x*7+y),x:x*16+10+hash(i,1,x*7+y)*(w*16-20),y:y*16+16+hash(i,2,x*7+y)*(h*16-22)});return}
    if(st&&BLD[st]&&BLD[st].kind=='fountain'){put(y+h-1,x*16-1,y*16-17,fountainArt(w,h));return}
    if(st&&BLD[st]&&BLD[st].kind=='lighthouse'){const ox=x*16-1,oy=y*16-LHX-1,lx=x*16+w*8,ly=y*16-LHX+LHTOP-9;put(y+h-1,ox,oy,lighthouseArt(w,h));
      an.push({t:'beam',x:lx,y:ly});lights.push({x:lx,y:ly,r:70,col:'255,232,160',f:0});return}
    if(st&&BLD[st]&&BLD[st].kind=='shelter'){put(y+h-1,x*16-1,y*16-13,shelterArt(w,h,BLD[st].stop));return}
    if(ch=='v'){an.push({t:'lava',x:(x+w/2)*16,y:(y+h/2)*16,rx:w*8-6,ry:h*8-6});for(let k=0;k<3;k++)an.push({t:'smoke',x:x*16+w*4+k*w*4,y:y*16+8,big:1});return}
    if(st&&BLD[st]){const row=M[y+h-1],ds=[];for(let i=0;i<w;i++)if(row[x+i]=='d')ds.push(i);
      // the door nearest the middle is the main entrance; any others are side doors
      ds.sort((a,b)=>Math.abs(a-(w-1)/2)-Math.abs(b-(w-1)/2));let dx=ds.length?ds[0]:-1;
      // buildings you can't go into still get a (locked) front door, unless their look already has a big door
      if(dx<0&&!['church','hut','whs','garage'].includes(BLD[st].deco))dx=w>>1;
      g.fillStyle='rgba(60,80,115,.22)';g.fillRect(x*16+4,(y+h)*16,w*16+1,2);
      const dark=shutTonight(x,y,w,h,st),b=bld2(w,h,dark?{...BLD[st],dark:1}:BLD[st],dx,ds.slice(1));
      // Kingsgrad's steampunk touches: copper roofs on a few (the Civil Service Bureau, the Police Station, the Supermarket and the Book Shop), brass-bound doors on about a third
      if(STM2(m))steamTouch(b,w,h,BLD[st],dx,x*7+y*13,['civilservice','police','supermarket','bookshop'].includes(st),hash(x,y,78)<.35);
      g.drawImage(b.c,x*16,y*16);cyberLights(b,x,y,h,lights,CYB(m),dark).forEach(a=>an.push({...a,x:a.x+x*16,y:a.y+y*16}));
      if(BLD[st].spire)spires.push({x:x*16+w*8-10,y:y*16-37,roof:BLD[st].roof,row:y+h-1});
      if(BLD[st].icon)signs.push({x,y,w,h,k:BLD[st].icon,ry:b.ry,nt:b.nt,hang:BLD[st].hang})
      if(BLD[st].nlogo){const L0=neonLogo(BLD[st].nlogo),X=x*16+((w*16-L0.w)>>1),Y=y*16+b.nt-L0.h-4;
        for(const px of[X+2,X+L0.w-3]){g.fillStyle=OUT;g.fillRect(px-1,Y+L0.h,3,4);g.fillStyle='#3a3d44';g.fillRect(px,Y+L0.h,1,3)}
        an.push({t:'nlogo',k:BLD[st].nlogo,x:X,y:Y,off:dark?1:0});if(!dark)lights.push({x:X+L0.w/2,y:Y+L0.h/2,r:Math.max(28,L0.w*2.2),col:rgbs(L0.col),f:1,rb:CYB(m)?(y+h)*16:0})}}
    else if(ch=='b')boats.push({x,y,c:boatArt(w,h,hash(x,y,21)),ph:hash(x,y,22)*6})
    else if(ch=='k')g.drawImage(fishPile,x*16,y*16)});
  spires.forEach(({x,y,roof,row})=>put(row,x-1,y-1,spireArt(roof)));
  // most shops' pictures stand on top of their name sign; a hanging one (BLD hang) sticks out on whichever side of the shop has a clear gap (not one another shop's sign already hangs in), and no door
  // at that corner; more room wins. They hang just under the eaves.
  const taken=new Set(),clear=(cx,y0,y1)=>cx>0&&cx<M[0].length-1&&[y0,y1].every(r=>M[r]&&!'#T'.includes(M[r][cx]));
  signs.forEach(({x,y,w,h,k,ry,nt,hang})=>{
    if(!hang){const X=x*16+w*8-10,Y=y*16+nt-21;iconTop[x+','+y]=Y;for(const px of[X+6,X+13]){g.fillStyle=OUT;g.fillRect(px-1,Y+18,3,4);g.fillStyle='#3a3d44';g.fillRect(px,Y+18,1,3)}
      g.drawImage(iconArt(k),X,Y);return}
    const room=(cx,dir)=>{let n=0;while(n<3&&clear(cx+dir*n,y+h-2,y+h-1))n++;return n},door=i=>M[y+h-1][x+i]=='d';
    const opts=[[true,x+w,room(x+w,1)-(door(w-1)?1:0)],[false,x-1,room(x-1,-1)-(door(0)?1:0)]].filter(o=>!taken.has(o[1]+','+(y+h-1))).sort((a,b)=>b[2]-a[2]);
    const[right,gc]=opts[0]||[true,x+w];taken.add(gc+','+(y+h-1));
    g.drawImage(signArt(k,right),right?(x+w)*16-8:x*16-22,y*16+ry-3)});
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
    if(ch=='T'){const set=GOTH(m)?DEADTREES:DET(m)?dtrees():typeof MOD=='function'&&MOD(m)?mtrees():treesFor(wx),t=set[hash(x,y,31)*set.length|0];put(y,(DET(m)?-4:0)+x*16+Math.round(hash(x,y,32)*2-1)-1,(y+1)*16-t.height+1,t,1,x,y)}
    if(ch=='R'){const t=(inBare(m,x,y)?bareOf(rocksNow):rocksNow())[hash(x,y,33)*3|0];put(y,x*16-1,(y+1)*16-t.height,t,1,x,y)}}));
  // tram lines: each row with a run of track gets overhead-wire poles along its far side and a wire for the tram's pantograph.
  // The tram stops level with the middle of the platform in front of (below) the track; a line that ends inside the map is a terminus.
  const trams=[];if(!inside)M.forEach((row,y)=>{const a=row.indexOf('l'),b=row.lastIndexOf('l');if(a<0||b-a<6)return;
    const pl=[...(M[y+1]||'')].map((c,i)=>c=='P'?i:-1).filter(i=>i>=0),mid=pl.length?(pl[0]+pl[pl.length-1]+1)*8:(a+b+1)*8;
    trams.push({y,a:a*16,b:(b+1)*16,stop:mid-48,from:a>0?'R':'L',through:a==0&&b==row.length-1,plat:pl.length?pl:null})});
  trams.forEach(({y:ty,a,b})=>{const wc=cnv(b,ty*16),wg=wc.getContext('2d');wg.fillStyle='#2b2f3a';wg.fillRect(a,ty*16-TRAM_UP,b-a,1);ents.push({k:99,X:0,Y:0,c:wc});
    for(let x=a/16+1;x<b/16;x+=5)if(!'#T'.includes(M[ty-1][x]))put(ty-1,x*16+5,ty*16-30,tramPole,0,x,ty-1)});
  const ferries=EX[m].filter(e=>e.s=='F').map(e=>({x:e.ax>e.x?e.x-1:e.x+1,y:e.y,ph:hash(e.x,e.y,23)*6}));
  PROPS.filter(p=>p[0]==m).forEach(([,x,y,k0])=>{const k=GOTH(m)&&GPROP[k0]||DET(m)&&DPROP[k0]||typeof MOD=='function'&&MOD(m)&&MPROP[k0]||WXPROP[wx]?.[k0]||k0,t=inBare(m,x,y)?bareOf(()=>propArt(k)):propArt(k),pass=PROP_PASS.includes(k),sp=propSpan(k);put(pass?y-.5:y,(x-((sp-1)>>1))*16-1,(y+1)*16-t.height+1,t,!pass&&sp==1,x,y);
    if(k=='firepit')an.push({t:'fire',x:x*16+8,y:y*16+11});
    if(NB[k]){const[lines,col]=NB[k],ox=(x-1)*16,oy=(y+1)*16-t.height+2;lines.forEach((s,i)=>an.push({t:'neon',x:ox+1+((46-s.length*4+1)>>1),y:oy+(lines.length==1?7:4)+i*7,s,col}));
      lights.push({x:x*16+8,y:oy+9,r:48,col:rgbs(col),f:1,rb:(y+1)*16})}
    {const top=(y+1)*16-t.height+1;
      if(k=='lamp'||k=='lamp2')lights.push({x:x*16+8,y:top+5,r:32,col:'255,210,130',f:0});
      if(k=='firepit')lights.push({x:x*16+8,y:top+4,r:44,col:'255,140,60',f:1});
      if(k=='slamp')lights.push({x:x*16+12,y:top+6,r:34,col:'255,190,140',f:0});
      if(k=='vending')lights.push({x:x*16+7,y:top+8,r:24,col:'140,255,190',f:1});
      if(k.startsWith('bb_')){lights.push({x:x*16+8,y:top+9,r:44,col:rgbs(PA[k]&&k=='bb_cola'?'#2e9d57':k=='bb_oil'?'#e0a100':k=='bb_burger'?'#ff5a3a':'#3bd0ff'),f:1});an.push({t:'scan',x:x*16-16,y:top+1,w:46,h:17})}
      if(k=='steamgrate')an.push({t:'smoke',x:x*16+8,y:top-2,big:1});
      if(k=='neonpole'){an.push({t:'neon',x:x*16,y:top+3,s:'OPEN',col:'#3bd0ff'});lights.push({x:x*16+8,y:top+5,r:28,col:'59,208,255',f:1})}}
    if(k=='dlamp'&&NIGHT){const top=(y+1)*16-t.height+1;lights.push({x:x*16+2,y:top+12,r:34,col:'255,190,100',f:1},{x:x*16+12,y:top+12,r:34,col:'255,190,100',f:1})}
    if(GLIGHT[k]){const[oy,r,col,fx]=GLIGHT[k],top=(y+1)*16-t.height+1;lights.push({x:x*16+8,y:top+oy,r,col,f:1});
      if(fx=='fire')an.push({t:'fire',x:x*16+8,y:top+6});if(fx=='candle')an.push({t:'candle',x:x*16+8,y:top+oy});
      if(fx=='candles')for(const[cx,h]of[[3,5],[6,7],[9,4],[12,6]])an.push({t:'candle',x:x*16-1+cx+1,y:top+5-h})}if(k=='vent')an.push({t:'smoke',x:x*16+7,y:y*16+8});if(k=='gen')an.push({t:'blink',x:x*16+13,y:y*16+7,c:'#7fd0a0'})});
  // lit stalls, the circus big top and caravans, and the tram shelters
  if(!inside)FL[m].forEach(([x,y,w,h,,,st])=>{const kd=BLD[st]?.kind;if(['van','kiosk','cart','bigtop','wagon','shelter'].includes(kd)&&!shutTonight(x,y,w,h,st))lights.push({x:(x+w/2)*16,y:(y+h/2)*16,r:kd=='bigtop'?64:30,col:'255,200,120',f:1})});
  // power cables sagging across Frostholm's boulevard (sorted just in front of its north side, so the billboards and anyone further
  // down the street are drawn over them and no cable runs across a billboard's lettering)
  if(m=='fishing'&&!(typeof MOD=='function'&&MOD(m))){const wc=cnv(M[0].length*16,M.length*16),wg=wc.getContext('2d'),wr=(col,x,y)=>{wg.fillStyle=col;wg.fillRect(x|0,y|0,1,1)};
    for(const[x0,y0,x1,y1,sag]of[[3,6,13,10,10],[17,6,24,10,8],[31,6,36,10,9],[0,7,39,7,14],[6,6,24,6,12]]){const S0=[x0*16+8,y0*16+2],S1=[x1*16+8,y1*16+2],n=Math.ceil(Math.hypot(S1[0]-S0[0],S1[1]-S0[1])/2);let p=null;
      for(let k=0;k<=n;k++){const u=k/n,q=[S0[0]+(S1[0]-S0[0])*u,S0[1]+(S1[1]-S0[1])*u+sag*4*u*(1-u)];if(p)pline(wr,p[0],p[1],q[0],q[1],'#14121c');p=q}}
    ents.push({k:7.5,X:0,Y:0,c:wc})}
  return{c,an,boats,ferries,trams,ents,lights,inside,top:inside?WU:0,iconTop}}

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
const GULLS={harbour:[15,6],beach:[5,6],kalanharbour:[10,4],savilaharbour:[17,6],privharbour:[5,5],privbeach:[9,4],oilrig:[8,5]};
// ---- Per-frame drawing. cx, cy: camera offset in pixels. frame: player walking frame (0 idle, 1, 2).
// Black Tide at the oil rig: on 8 September the sea round the rig is black with oil (an oily sheen shifting on it) and oil has
// splashed onto the west of the deck, until it's cleaned up; if it's set alight the sea burns that day, and the west of the deck
// stays scorched from then on
function spillFx(m,cx,cy,t,px){if(m!='oilrig'||typeof qOf!='function')return;const q=qOf('blacktide'),fl=q?.flags||{},M=MAPS[m],today=DAY==8;
  const water=(fn)=>M.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch=='~')fn(x*16-cx,y*16-cy,x,y)}));
  // a puddle (or a scorch mark) of a few overlapping blobs, its shape set by the tile, with a glint
  const puddle=(X,Y,x,y,col,glint)=>{ctx.fillStyle=col;for(let k=0;k<3;k++){const h=hash(x*7+k,y*3,11),h2=hash(x,y*5+k,12);ctx.beginPath();ctx.ellipse(X+4+h*9,Y+4+h2*9,3+h2*4,2+h*3,h*3,0,7);ctx.fill()}px(glint,X+6+(hash(x,y,13)*5|0),Y+6,2,1)};
  const deckWest=(fn)=>{for(let y=6;y<=10;y++)for(let x=1;x<=4;x++)if(M[y][x]=='p'||M[y][x]==',')fn(x*16-cx,y*16-cy,x,y)};
  if(today&&!fl.cleaned&&!fl.fired){water((X,Y,x,y)=>{px('rgba(14,12,20,.82)',X,Y,16,16);for(let k=0;k<3;k++){const h=hash(x*3+k,y,(t/400|0)%5);if(h>.55)px(['rgba(120,60,160,.5)','rgba(40,120,140,.5)','rgba(160,140,60,.45)'][k],X+(h*13|0),Y+((h*97|0)%14),3,1)}});
    deckWest((X,Y,x,y)=>{if(hash(x,y,9)>.45)puddle(X,Y,x,y,'rgba(14,12,20,.72)','rgba(120,100,170,.35)')})}
  // the work lamp, hanging on the west rail by the slick (until it goes into the water, or the spill is cleaned up), glowing
  if(today&&!fl.cleaned&&!fl.fired){const X=16-cx,Y=8*16-cy;px('#3a3d44',X,Y-14,2,16);px('#3a3d44',X,Y-14,6,2);px('#1a1a22',X+4,Y-12,1,3);px('#2a2a33',X+2,Y-9,5,6);px('#ffe08a',X+3,Y-8,3,4);ctx.fillStyle='rgba(255,220,120,.18)';ctx.beginPath();ctx.arc(X+4,Y-6,9+Math.sin(t/300),0,7);ctx.fill()}
  if(fl.fired){deckWest((X,Y,x,y)=>{if(hash(x,y,4)>.3)puddle(X,Y,x,y,'rgba(24,18,14,.7)','rgba(70,50,36,.45)')})}
  if(today&&fl.fired){water((X,Y,x,y)=>{px('rgba(30,14,8,.8)',X,Y,16,16);for(let k=0;k<4;k++){const h=hash(x*5+k,y,(t/120|0)%7),fx=X+(h*14|0),fh=4+(h*9|0);px('#ff8a3a',fx,Y+14-fh,2,fh);px('#ffd23a',fx,Y+15-fh/2,1,fh/2)}
      if(hash(x,y,(t/600|0)%9)>.8)px('rgba(60,60,64,.45)',X+4,Y-6-((t/80)%10),8,6)})}}
function drawWorld2(m,cx,cy,t,frame){
  const S=scene(m),M=MAPS[m],mh=M.length,mw=M[0].length,vw=cv.width,vh=cv.height,wf=WATER[(t/200|0)%8],px=(c,x,y,w=1,h=1)=>{ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w,h)};
  if(!S.inside){const x0=Math.max(0,Math.floor(cx/16)),x1=Math.min(mw-1,Math.floor((cx+vw)/16)),y0=Math.max(0,Math.floor(cy/16)),y1=Math.min(mh-1,Math.floor((cy+vh)/16));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(CLS(M[y][x])=='w')ctx.drawImage(wf,(x*16)&63,(y*16)&63,16,16,x*16-cx,y*16-cy,16,16)}
  ctx.drawImage(S.c,-cx,-cy-S.top);
  if(typeof spillFx=='function')spillFx(m,cx,cy,t,px);
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
  // snow banks blocking the roads into places not open yet, each with its DANGER sign
  if(typeof snowBlocks=='function')snowBlocks(m).forEach(b=>{Ls.push([b.y,.9,()=>ctx.drawImage(snowBankArt(),b.x*16-cx-6,b.y*16-cy-8)]);Ls.push([b.sy,.9,()=>ctx.drawImage(dangerSignArt(),b.sx*16-cx-6,b.sy*16-cy-14)])});
  if(typeof placeFx=='function')placeFx(m,cx,cy,t,px,Ls);
  if(typeof phoneRinging=='function'&&m==HOME&&phoneRinging()){const f=FL[m].find(([,,,,,l])=>l=='Telephone');if(f&&((t/180)|0)%2){const X=f[0]*16-cx,Y=f[1]*16-cy-6;
    Ls.push([f[1]+.5,3,()=>{for(const[dx,s]of[[-3,-1],[17,1]])for(let k=0;k<3;k++)px('#ffd23a',X+dx+s*k,Y+2+k*3,1,2);px('#1a1a22',X+3,Y-1,10,2)}])}}
  NPCS.filter(n=>n.m==m).forEach((n,i)=>{const b=Math.sin(t/700+i*1.7)>.85?1:0;Ls.push([n.y,1,()=>{n.costume?costumed(n.x*16-cx,n.y*16-cy+b,n.dir,n.costume,t):person(n.x*16-cx,n.y*16-cy+b,n.dir,0,n);
    // someone with a quest to give you: a gold star bobbing over their head
    {const qid=typeof offerOf=='function'&&offerOf(n);if(qid)qstar(n.x*16-cx+8,n.y*16-cy-25+Math.round(Math.sin(t/260)*1.5),!QUESTS[qid].main)}}])});
  Ls.push([P.ry,1,()=>{const X=Math.round(P.rx*16-cx),Y=Math.round(P.ry*16-cy);
    // holding the fishing rod: drawn behind when you face away, in front otherwise
    const rod=typeof ME!='undefined'&&ME.equipped=='fishrod'&&(()=>{const[h,t]=[[[11,9],[18,-7]],[[3,8],[-3,-8]],[[6,9],[-7,-5]],[[9,9],[22,-5]]][P.dir];
      ctx.strokeStyle='#5a3a22';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X+h[0],Y+h[1]);ctx.lineTo(X+t[0],Y+t[1]);ctx.stroke();
      ctx.strokeStyle='rgba(240,240,240,.7)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(X+t[0],Y+t[1]);ctx.lineTo(X+t[0],Y+t[1]+7);ctx.stroke();ctx.fillStyle='#c9a040';ctx.fillRect(X+h[0]+(t[0]-h[0])*.15-1,Y+h[1]+(t[1]-h[1])*.15-1,2,2)});
    if(rod&&P.dir==1)rod();dressed(X,Y,P.dir,frame,typeof ME!='undefined'?ME.look:PLAYER.look);if(rod&&P.dir!=1)rod();
    if(typeof ME!='undefined'&&ME.equipped=='cigarettes'){const m=[[9,3,1],null,[3,2,-1],[12,2,1]][P.dir];if(m){const[mx,my,d]=m;ctx.fillStyle='#f4f4f0';ctx.fillRect(X+mx-(d<0?3:0),Y+my,3,1);
        ctx.fillStyle=(t/300|0)%3?'#ff8a3a':'#ffd23a';ctx.fillRect(X+mx+(d<0?-4:3),Y+my,1,1)}
      const sx=X+(m?m[0]+(m[2]<0?-4:3):8),sy=Y+(m?m[1]:-2);for(let k=0;k<3;k++){const u=((t/1400+k/3)%1);ctx.fillStyle=`rgba(230,230,235,${.5*(1-u)})`;ctx.fillRect(Math.round(sx+Math.sin(u*6+k)*2+u*3),Math.round(sy-2-u*12),1+(u>.5?1:0),1+(u>.5?1:0))}}}]);
  Ls.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).forEach(e=>e[2]());
  // smoke, flags, signs, lights, fires and machines
  S.an.forEach(a=>{const X=a.x-cx,Y=a.y-cy;
    // steam off hot water: soft white wisps rising straight up and swaying, each spot out of step with the next (ph)
    if(a.t=='steam')for(let k=0;k<7;k++){const g=(t/3400+k/7+(a.ph||0))%1,s=3+Math.round(g*6);
      px(`rgba(248,252,255,${(.6*Math.sin(Math.PI*Math.min(1,g*1.3))*(1-g*.5)).toFixed(2)})`,X+Math.sin(g*6+k*1.7)*3-s/2,Y-g*18-s/2,s,s)}
    if(a.t=='smoke')for(let k=0;k<6;k++){const g=(t/2600+k/6)%1,s=(a.big?3:2)+Math.round(g*3);
      px(`rgba(236,241,246,${(.6*(1-g)).toFixed(2)})`,X+Math.sin(g*5+k)*2+g*10-s/2,Y-g*24-s/2,s,s)}
    if(a.t=='flag')for(let c=0;c<12;c++){const dy=Math.round(Math.sin(t/220-c*.7)*c/8),sh=Math.sin(t/220-c*.7)>.3,fc=a.col||(a.royal?'#7d3c98':'#c0392b');
      px(sh?shade(fc,-.2):fc,X+c,Y+dy,1,8);if(a.col)px('#f2f2f2',X+c,Y+dy+3,1,2);else if(c>=3&&c<=5)px('#ffd23a',X+c,Y+dy+(c==4?2:3),1,c==4?3:1)}
    if(a.t=='lava')for(let k=0;k<8;k++){
      // bubbles swell and pop at random spots inside the crater's oval
      const ph=t/1400+hash(k,1,a.x),n=ph|0,g=ph%1,an=hash(k,n,a.y)*6.283,rr=Math.sqrt(hash(k,n+7,a.y))*.7,bx=X+Math.cos(an)*a.rx*rr|0,by=Y+Math.sin(an)*a.ry*rr|0,s=g<.7?1+(g*3|0):3;
      if(g<.85)px(g<.6?'#ffd23a':'#fff2a0',bx,by,s,s);else px('#5a2a20',bx-1,by+1,4,1)}
    // the PC's screen: the Faction Tracker's bars in each faction's colour, rising and falling a little, and a blinking cursor
    if(a.t=='pcscreen'){const cols=['#c0392b','#2e86c1','#7d3c98','#2e9d57','#5a6a74','#a0522d','#e0a020'];
      cols.forEach((c,i)=>{const h=3+Math.round((Math.sin(t/900+i*1.3)+1)*2.5);px(c,X+1+i*2,Y+a.h-1-h,1,h)});px('#3a6a4a',X+1,Y+a.h-1,a.w-2,1);if(((t/500)|0)%2)px('#7fd0a0',X+a.w-3,Y+1,2,1)}
    // the big screen: the camera's light blinking red, and a slow line rolling down the display
    if(a.t=='vcall'){if(((t/600)|0)%2)px('#ff3b2f',X,Y,2,1);px('rgba(159,192,224,.12)',X+a.sx,Y+a.sy+((t/60)|0)%a.h,a.w,1);
      // Chuck calling: the screen flashes red with INCOMING CALL across it
      if(typeof chuckCalling=='function'&&chuckCalling()&&((t/400)|0)%2){const sx=X+a.sx,sy=Y+a.sy;px('#7a1020',sx,sy,a.w,a.h);
        [['INCOMING',sy+6],['CALL',sy+14]].forEach(([w,y])=>{const x0=sx+((a.w-w.length*4+1)>>1);[...w].forEach((ch,i)=>{const f=FONT[ch];for(let k=0;k<15;k++)if(f[k]=='1')px('#ffffff',x0+i*4+k%3,y+(k/3|0),1,1)})})}}
    if(a.t=='screen'){const k=a.k;
      // monitor content: 0 a scrolling waveform, 1 lines of text being typed, 2 a radar sweep
      if(k==0)for(let x=0;x<a.w;x++)px('#5fe08a',X+x,Y+(a.h>>1)+Math.round(Math.sin(x*.9+t/150)*Math.min(2,a.h/3)),1,1);
      else if(k==1){const n=(t/400|0)%(a.h+2);for(let y=0;y<Math.min(n,a.h);y+=2)px('#7fd0a0',X+1,Y+y,1+(hash(y,t/2400|0,a.x)*(a.w-2)|0),1)}
      else{const an=t/600,cx=X+(a.w>>1),cy=Y+(a.h>>1);px('#1f5a3a',cx,Y,1,a.h);px('#1f5a3a',X,cy,a.w,1);
        for(let r=0;r<4;r++)px('#5fe08a',cx+Math.round(Math.cos(an)*r*a.w/8),cy+Math.round(Math.sin(an)*r*a.h/8),1,1);if(((t/600)|0)%3==0)px('#ff3b2f',cx+2,cy-1,1,1)}}
    if(a.t=='reel'){const an=t/180;for(const o of[0,2.09,4.19])px('#5a5f68',X+Math.round(Math.cos(an+o)*2),Y+Math.round(Math.sin(an+o)*2),1,1);px('#2b2f3a',X,Y,1,1)}
    if(a.t=='vu')for(let i=0;i<a.w;i+=2){const hh=1+(hash(i,t/110|0,a.x)*a.h|0);px(hh>=a.h?'#ff3b2f':hh>a.h/2?'#ffd23a':'#5fe08a',X+i,Y+a.h-hh,1,hh)}
    if(a.t=='candle'){const f=hash(a.x,t/120|0,8);px('rgba(255,200,90,.22)',X-2,Y-3,5,6);px(f>.3?'#ffd23a':'#ff8a3a',X,Y-1,1,2);if(f>.6)px('#fff2a0',X,Y-2,1,1)}
    if(a.t=='scan'){const yy=(t/40|0)%a.h;px('rgba(255,255,255,.22)',X,Y+yy,a.w,1);if(hash(t/200|0,a.x|0,7)>.93)px('rgba(255,60,200,.3)',X+2,Y+(hash(t/90|0,a.x|0,8)*a.h|0),a.w-4,2)}
    if(a.t=='calendar'&&typeof DAY!='undefined'){const s=String(DAY<1?31+DAY:DAY),w=s.length*8-2,x0=X+((14-w)>>1);
      [...s].forEach((ch,i)=>{const f=FONT[ch];for(let k=0;k<15;k++)if(f[k]=='1')px('#2a2a33',x0+i*8+(k%3)*2,Y+(k/3|0)*2,2,2)})}
    if(a.t=='bulb')px(!a.off&&((t/250|0)+(a.x>>1))%3?'#ffe9a8':'#8a6a2a',X,Y,1,1);
    if(a.t=='nlogo'){const L0=neonLogo(a.k),on=!a.off&&hash(t/90|0,5,11+a.x)<.97;
      if(on){const[R,G,B]=rgb(L0.col);ctx.fillStyle=`rgba(${R},${G},${B},.2)`;ctx.fillRect(X-2,Y-2,L0.w+4,L0.h+4);for(const[x,y]of L0.px)px(`rgba(${R},${G},${B},.35)`,X+x-1,Y+y-1,3,3)}
      for(const[x,y,c]of L0.px)px(on?c:shade(c,a.off?-.3:-.65),X+x,Y+y,1,1)}
    // neon letters (v: stacked vertically). fl: a failing tube that keeps cutting out.
    if(a.t=='neon'){const c0=a.col||'#ff5fa8',on=a.off?false:a.fl?hash(t/140|0,3,7+a.x)<.72:hash(t/90|0,3,7)<.96,col=on?c0:shade(c0,a.off?-.3:-.65);  // (a sign switched off for the night stays readable: unlit glass, not a dead flicker)
      if(on){const[R,G,B]=rgb(c0);ctx.fillStyle=`rgba(${R},${G},${B},.28)`;if(a.v)ctx.fillRect(X-2,Y-2,7,a.s.length*6+3);else ctx.fillRect(X-2,Y-2,a.s.length*4+3,9)}
      if(a.v)[...a.s].forEach((ch,i)=>ptext(px,ch,X,Y+i*6,col));else ptext(px,a.s,X,Y,col)}
    // a flat's door: shut (a panelled door filling the doorway) unless the player is within a step of it, when it stands open
    // against the frame
    if(a.t=='adoor'){const open=typeof P!='undefined'&&Math.abs(P.rx*16-a.x)<=20&&Math.abs(P.ry*16-a.y)<=20,wood='#7a5232',dk='#4a3020',lt='#9a6a42';
      if(!a.v){if(open){px(dk,X,Y,3,16);px(wood,X+1,Y,1,16)}else{px(dk,X,Y+4,16,8);px(wood,X+1,Y+5,14,6);px(lt,X+1,Y+5,14,1);px(dk,X+5,Y+6,1,4);px(dk,X+10,Y+6,1,4);px('#c9a040',X+12,Y+8,1,1)}}
      else{if(open){px(dk,X,Y,16,3);px(wood,X,Y+1,16,1)}else{px(dk,X+5,Y,6,16);px(wood,X+6,Y+1,4,14);px(lt,X+6,Y+1,1,14);px('#c9a040',X+8,Y+11,1,1)}}}
    // a brass gear turning (steampunk Kingsgrad)
    if(a.t=='gear'){const R=a.r,an0=t/1400;for(let k=0;k<10;k++){const q=an0+k*Math.PI/5;px('#8a6a20',X+Math.cos(q)*(R+1)-1,Y+Math.sin(q)*(R+1)-1,3,3)}
      for(let k=0;k<28;k++){const q=k*Math.PI/14;px('#c9a040',X+Math.cos(q)*R,Y+Math.sin(q)*R,1,1);px('#c9a040',X+Math.cos(q)*(R-1),Y+Math.sin(q)*(R-1),1,1)}
      for(let k=0;k<4;k++){const q=an0+k*Math.PI/2;for(let d=1;d<R-1;d++)px('#a8802a',X+Math.cos(q)*d,Y+Math.sin(q)*d,1,1)}px('#ffe08a',X-1,Y-1,2,2)}
    // a clock's hands (steampunk Kingsgrad): they really go round
    if(a.t=='sclock'){const q1=t/60000*Math.PI*2,q2=t/5000*Math.PI*2;for(let d=0;d<4;d++)px('#2a1a10',X+Math.sin(q1)*d,Y-Math.cos(q1)*d,1,1);for(let d=0;d<5;d++)px('#7a2a1a',X+Math.sin(q2)*d,Y-Math.cos(q2)*d,1,1);px('#2a1a10',X,Y,1,1)}
    // a lighthouse's lamp: a soft glow by day; at night a bright glow and a beam sweeping slowly round
    if(a.t=='beam'){if(!NIGHT){px('rgba(255,240,170,.35)',X-3,Y-2,6,5);}else{const q=t/1600;px('rgba(255,240,180,.55)',X-5,Y-4,10,9);
      for(const sg of[-1,1])for(let d=4;d<110;d+=2){const bx=X+Math.cos(q)*d*sg,by=Y+Math.sin(q)*d*sg*.4,wd=1+d*.18;px(`rgba(255,240,180,${(.32*(1-d/110)).toFixed(3)})`,bx-wd/2,by-wd*.2,wd,Math.max(1,wd*.4))}}}
    if(a.t=='lbulb'){const on=!a.off&&((t/700|0)+a.k)%7!=0;if(on){px('rgba(255,230,160,.22)',X-1,Y-1,3,3);px(a.c,X,Y,1,1)}else px(shade(a.c,-.55),X,Y,1,1)}
    if(a.t=='blink'){const on=!a.off&&((t+a.x*7)/700|0)%2;if(on){px('rgba(255,80,60,.3)',X-1,Y-1,4,4);px(a.c||'#ff3b2f',X,Y,2,2)}else px('#5a2020',X,Y,2,2)}
    if(a.t=='fire'){px('rgba(255,160,60,.16)',X-9,Y-10,18,14);for(let k=0;k<5;k++){const hh=2+(hash(k,t/90|0,3)*5|0);px(['#e8321e','#ff8a3a','#ffd23a','#ff8a3a','#e8321e'][k],X-5+k*2,Y-hh,2,hh)}}
    if(a.t=='stove')for(let k=0;k<a.w;k++){const hh=2+(hash(k,t/110|0,5)*4|0);px('#e8321e',X+k,Y+6-hh,1,hh);if(hh>3)px('#ffb01c',X+k,Y+7-hh,1,hh-3)}
    if(a.t=='belt'){const off=(t/45|0)%6;for(let x=off;x<a.w;x+=6)px('#3d4250',X+x,Y,1,a.h);
      for(let i=0;i<a.w/24;i++){const fx=X+((t/35+i*24)%(a.w-4)),fy=Y+3+(i%2)*4;if(a.log){px('#7a5232',fx,fy-1,9,3);px('#c9a36a',fx+8,fy-1,2,3)}else if(a.bot){px('#5a2a14',fx,fy-2,2,4);px('#f2f2f2',fx,fy-1,2,1)}else{px('#9fb3c4',fx,fy,5,2);px('#d8e4ee',fx,fy+1,5,1)}}}});
  if(!S.inside){
    // seagulls circling over the harbours and beaches
    const gl=GULLS[m];if(gl)for(let i=0;i<2;i++){const an=t/2600+i*Math.PI,X=gl[0]*16-cx+Math.cos(an)*70,Y=gl[1]*16-cy+Math.sin(an)*30-26,up=(t/170+i*3|0)%2;
      px('rgba(20,40,60,.18)',X-2,Y+34,5,1);px('#f2f2f2',X-1,Y,3,2);px('#e8b33a',X+(Math.cos(an+Math.PI/2)>0?2:-2),Y,1,1);
      if(up){px('#f2f2f2',X-3,Y-1,2,1);px('#f2f2f2',X+2,Y-1,2,1);px('#5a5f68',X-4,Y-2,1,1);px('#5a5f68',X+4,Y-2,1,1)}
      else{px('#f2f2f2',X-4,Y,3,1);px('#f2f2f2',X+2,Y,3,1);px('#5a5f68',X-5,Y+1,1,1);px('#5a5f68',X+5,Y+1,1,1)}}
    // falling snow
    const md=(v,n)=>((v%n)+n)%n;
    const wx=weatherOf(m);
    if(!DET(m)&&wx!='curated')flakes().forEach((f,i)=>{if(wx=='medium'&&i%2||wx=='autumn'&&i%3)return;const p=f.big?1.2:.6,X=md(f.x*vw+Math.sin(t/1300+f.ph)*6+t*.004-cx*p,vw),Y=md(f.y*vh+t*f.sp*(f.big?1.4:1)-cy*p,vh);
      if(wx=='autumn'&&!GOTH(m)){const c=['#d0782a','#b0402a','#d8a030','#8a5a2a'][i%4],w=Math.sin(t/260+f.ph)>0;px(c,X,Y,2,1);px(c,X+(w?1:0),Y+1,1,1);return}
      if(BARE[m]&&inBare(m,(X+cx)>>4,(Y+cy)>>4)){px('rgba(70,62,60,.7)',X,Y,f.big?2:1,1);return}  // ash, not snow, over the warm ground
      px(GOTH(m)?(f.big?'rgba(255,120,50,.8)':'rgba(160,150,170,.6)'):f.big?'rgba(255,255,255,.7)':'rgba(255,255,255,.85)',X,Y,f.big?2:1,f.big?2:1)});
    if(GOTH(m))gothLight(S,cx,cy,t);
    if(STM(m)||STM2(m)){ctx.fillStyle='rgba(110,64,20,.16)';ctx.fillRect(0,0,vw,vh);
      for(let i=0;i<14;i++){const sp=.006+hash(i,3,700)*.006,X=((hash(i,1,700)*vw*1.4+Math.sin(t/2300+i)*14-cx*.3)%(vw+60)+vw+60)%(vw+60)-30,Y=((hash(i,2,700)*vh-t*sp-cy*.3)%(vh+60)+vh+60)%(vh+60)-30,s0=10+hash(i,4,700)*14;
        ctx.fillStyle='rgba(236,226,206,.07)';ctx.fillRect(X-s0/2,Y-s0/3,s0,s0*.66);ctx.fillRect(X-s0/3,Y-s0/2,s0*.66,s0)}
      // the airship (only in the full ?steam proof of concept)
      if(!STM2(m)){const ax=((t/90)%(vw+160))-80,ay=12+Math.sin(t/3000)*3;
      px('#3a2a1a',ax-23,ay-6,46,13);px('#8a5a2a',ax-22,ay-5,44,11);px('#a8703a',ax-22,ay-5,44,3);for(let k=-18;k<20;k+=6)px('#6a4220',ax+k,ay-5,1,11);
      px('#3a2a1a',ax+21,ay-7,6,4);px('#3a2a1a',ax+21,ay+4,6,4);px('#3a2a1a',ax-6,ay+6,1,4);px('#3a2a1a',ax+6,ay+6,1,4);px('#3a2a1a',ax-8,ay+10,17,5);px('#c9a040',ax-7,ay+11,15,1);
      if(((t/120)|0)%2)px('#d8d0c0',ax-26,ay-1,3,2)}}
    // Frostholm by night (?night): purple dusk, every light glowing, and neon reflected in the wet street
    if(CYB(m)&&NIGHT){gothLight(S,cx,cy,t,CYBERLOOK);ctx.save();ctx.globalCompositeOperation='lighter';
      // neon reflected in the wet street below each lit building, shimmering
      for(const l of S.lights){if(!l.rb)continue;const X=l.x-cx+Math.sin(t/300+l.x)*1.5,Y=l.rb-cy,w=l.r*.45;if(X<-w||X>vw+w||Y>vh||Y<-40)continue;
        const gr=ctx.createLinearGradient(0,Y,0,Y+34);gr.addColorStop(0,`rgba(${l.col},.2)`);gr.addColorStop(1,`rgba(${l.col},0)`);ctx.fillStyle=gr;ctx.fillRect(X-w/2,Y,w,34)}
      ctx.restore()}
    if(NIGHT&&!GOTH(m)&&!DET(m)&&!CYB(m))gothLight(S,cx,cy,t,typeof MOD=='function'&&MOD(m)?NIGHTLOOK:MOONLOOK);
    if(DET(m)&&NIGHT){gothLight(S,cx,cy,t,NIGHTLOOK);
      for(let i=0;i<26;i++){const X=((hash(i,1,500)*vw+Math.sin(t/1700+i)*30-cx*.15)%vw+vw)%vw,Y=((hash(i,2,500)*vh+Math.cos(t/2100+i*2)*20-cy*.15)%vh+vh)%vh,on=Math.sin(t/400+i*1.7)>.2;
        if(on){px('rgba(200,255,120,.25)',X-1,Y-1,3,3);px('#e8ff90',X,Y,1,1)}}}}
  if(!(DET(m)&&!NIGHT))ctx.drawImage(vignette(),0,0);if(GOTH(m))ctx.drawImage(vignette(),0,0)}

// ---- Item sprites for the inventory: one character per pixel ('.' is clear), coloured by the palette after it.
// itemIcon(id) gives a data URL of the sprite, drawn 4x.
const ITEM_ART={
notebook:[`
...kkkkkkkkkkk..
..skRRRRRRRRRRk.
...kRRRRRRRRRRk.
..skRwwwwwwwRRk.
...kRwggggwwRRk.
..skRwwwwwwwRRk.
...kRRRRRRRRRRk.
..skRRRRRRRRRRk.
...kRRRRRRRRRRk.
..skRRRRRRRRRRk.
...kRRRRRRRRRRk.
..skRRRRRRRRRRk.
...kRRRRRRRRRRk.
...kdddddddddRk.
....kkkkkkkkkkk.`,{k:'#262330',R:'#a8322a',d:'#6e1e18',w:'#f1ead6',g:'#8a8478',s:'#c8ccd0'}],
camera:[`
................
................
................
................
.kkkkkkkkkkkkkk.
.kSSSSSSSSSSSSk.
.kSssssssssddSk.
.kSswwssssdddSk.
.kSswwssssssssk.
.kggggggggggggk.
.kSssssssssssSk.
.kSSSSSSSSSSSSk.
.kkkkkkkkkkkkkk.`,{k:'#262330',S:'#e2e6ea',s:'#b8bec6',w:'#4a6a8a',d:'#3a3a44',g:'#7a8088'}],
film:[`
................
.....kkkkk......
.....kgggk......
...kkkkkkkkk....
...kYYYYYYYkkkk.
...kYYYYYYYkbbk.
...kKKKKKKKkbbk.
...kYYYYYYYkbbk.
...kYYYYYYYkbbk.
...kKKKKKKKkbbk.
...kYYYYYYYkkkk.
...kkkkkkkkk....
.....kgggk......
.....kkkkk......`,{k:'#262330',Y:'#f2c230',K:'#c0392b',g:'#9aa0a8',b:'#5a3a22'}],
codebook:[`
................
..kkkkkkkkkkk...
..kBBBBBBBBBkk..
..kBBBBBBBBBkwk.
..kBrrrrrrrBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kBBByyyBBBkwk.
..kBByBBByBBkwk.
..kBBByyyBBBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kkkkkkkkkkkwk.
...kwwwwwwwwwwk.
....kkkkkkkkkkk.`,{k:'#262330',B:'#2e3a2a',r:'#c0392b',y:'#c9a040',w:'#e8e2d0'}],
lockpicks:[`
................
............kk..
...........kSk..
..........kSk...
.........kSk....
..kk....kSk.....
.kSSk..kSk......
..kSSkkSk.......
...kSSSk........
....kSSk........
...kHHkSk.......
..kHHk.kSSk.....
.kHHk...kSSk....
.kHk.....kk.....
..k.............`,{k:'#262330',S:'#c8ccd0',H:'#6a4428'}],
flashlight:[`
................
................
................
................
...........kkk..
.kkkkkkkkkkwwyk.
.kDDDDDDDkkwyyyk
.kDdrDDDDkkwyyyk
.kDDDDDDDkkwyyyk
.kddddddddkkwwyk
.kkkkkkkkkk.kkk.`,{k:'#262330',D:'#8a9098',d:'#5a6068',r:'#c0392b',w:'#fff6c8',y:'#f2d24a'}],
// things the shops sell
beer:[`
.......kk.......
......kGGk......
......kBBk......
......kBBk......
.....kBBBBk.....
....kBBBBBBk....
....kBBBBBBk....
....kLLLLLLk....
....kLRRRRLk....
....kLLLLLLk....
....kBBBBBBk....
....kBBBBBBk....
....kBBBBBBk....
.....kkkkkk.....`,{k:'#262330',B:'#6a3a1a',G:'#c9a040',L:'#f1ead6',R:'#c0392b'}],
whisky:[`
................
................
................
...kkkkkkkkkk...
...kwwwwwwwwk...
...kwwwwwwwwk...
...kwIIwwwwwk...
...kAIIAAAAAk...
...kAAAAIIAAk...
...kAAAAIIAAk...
...kAAAAAAAAk...
...kwwwwwwwwk...
....kkkkkkkk....`,{k:'#262330',w:'#cfe6ee',A:'#d08a2a',I:'#ffffff'}],
cigarettes:[`
................
................
....kkkkkkk.....
....kwkwkwk.....
...kkkkkkkkk....
...kRRRRRRRk....
...kRwwwwwRk....
...kRwGGGwRk....
...kRwwwwwRk....
...kRRRRRRRk....
...kRRRRRRRk....
...kRRRRRRRk....
...kRRRRRRRk....
...kkkkkkkkk....`,{k:'#262330',w:'#f4f1e8',R:'#c0392b',G:'#c9a040'}],
book:[`
................
..kkkkkkkkkkk...
..kBBBBBBBBBkk..
..kBBBBBBBBBkwk.
..kBGGGGGGGBkwk.
..kBBBBBBBBBkwk.
..kBBGGGGGBBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kBBBBBBBBBkwk.
..kkkkkkkkkkkwk.
...kwwwwwwwwwwk.
....kkkkkkkkkkk.`,{k:'#262330',B:'#2a4a7a',G:'#c9a040',w:'#f1ead6'}],
islandmap:[`
................
................
................
..kkkkkkkkkkkk..
..kSSSSGGGSSSk..
..kSSGGGGGGSSk..
..kSGGGgGGGGSk..
..kSSGGGGGrSSk..
..kSSSGGGGGSSk..
..kSSSSGGSSSSk..
..kSSSSSSSSSSk..
..kkkkkkkkkkkk..`,{k:'#262330',S:'#a6d0e2',G:'#cfe0b0',g:'#8aa86a',r:'#c0392b'}],
burger:[`
................
................
................
....kkkkkkkk....
...kBBBBBBBBk...
..kBBwBBBwBBBk..
..kBBBBBwBBBBk..
..kGGGGGGGGGGk..
..kMMMMMMMMMMk..
..kYYYYYYYYYYk..
..kBBBBBBBBBBk..
...kkkkkkkkkk...`,{k:'#262330',B:'#d89a4a',w:'#f6e8c0',G:'#5a9a3a',M:'#6a3a1a',Y:'#f2c230'}],
cola:[`
.......kk.......
......kRRk......
......kGGk......
......kGGk......
.....kGGGGk.....
.....kGGGGk.....
....kGGGGGGk....
....kwwwwwwk....
....kwRRRRwk....
....kwwwwwwk....
....kGGGGGGk....
....kGGGGGGk....
....kGGGGGGk....
.....kkkkkk.....`,{k:'#262330',G:'#3a7a5a',R:'#c0392b',w:'#f1ead6'}],
hose:[`
................
................
.....kkkkkk.....
....kGGGGGGk....
...kGkkkkkkGk...
...kGk....kGk...
...kGk....kGk...
...kGk....kGk...
...kGGkkkkGGk...
....kGGGGGGk....
.....kkkkkGk....
..........kGk...
...........kk...
................`,{k:'#262330',G:'#3a6a3a'}],
motor:[`
................
................
....kkkkkkk.....
...kMMMMMMMk....
...kMmMmMmMkkk..
...kMMMMMMMkSSk.
...kMmMmMmMkkk..
...kMMMMMMMk....
....kkkkkkk.....
.....kk..kk.....
....kkkkkkkk....
................`,{k:'#262330',M:'#5a6a7a',m:'#3a4a5a',S:'#c9ced4'}],
floats:[`
................
................
..k........k....
.kFk..kk..kFk...
.kFkkkFFkkkFk...
..k.kFFFFk.k....
.....kFFk.......
......kk........
..kk......kk....
.kFFkkkkkkFFk...
..kk......kk....
................`,{k:'#262330',F:'#d8a85a'}],
beans:[`
................
.....kkkkkk.....
....kTTTTTTk....
.....kkkkkk.....
....kSSSSSSk....
...kSSSSSSSSk...
..kSSBSSSSBSSk..
..kSSSSBBSSSSk..
..kSSSSSSSSSSk..
..kSBSSSSSBSSk..
..kSSSSBSSSSSk..
...kSSSSSSSSk...
....kkkkkkkk....`,{k:'#262330',T:'#8a6a3a',S:'#c9a878',B:'#4a2e1a'}],
coffee:[`
................
.....s..s.......
......s..s......
.....s..s.......
................
...kkkkkkkkk....
...kWCCCCCWkkk..
...kWWWWWWWk.k..
...kWWWWWWWk.k..
...kWWWWWWWkkk..
...kWWWWWWWk....
....kkkkkkk.....`,{k:'#262330',s:'#cfd6dc',W:'#f1ead6',C:'#5a3a22'}],
bun:[`
................
................
................
................
....kkkkkkkk....
...kDDDDDDDDk...
..kDLLLLLLLLDk..
..kDLDDDDDDLDk..
..kDLDLLLLDLDk..
..kDLDLDDLDLDk..
..kDLLLLLLDLDk..
...kDDDDDDDDk...
....kkkkkkkk....`,{k:'#262330',D:'#a8642a',L:'#e8b878'}],
meal:[`
................
................
................
................
...kkkkkkkkkk...
..kwwwwwwwwwwk..
.kwwMMMMMwGGwwk.
.kwMMMMMMMGGGwk.
.kwMMMMMMMwYYwk.
.kwwMMMMMwwYYwk.
..kwwwwwwwwwwk..
...kkkkkkkkkk...`,{k:'#262330',w:'#f4f1e8',M:'#7a3a22',G:'#5a9a3a',Y:'#f2c230'}],
shirt:[`
................
....kkk..kkk....
..kkRRkkkkRRkk..
.kRRRrRRRRrRRRk.
.kRrrrRrrRrrrRk.
.kRRRrRRRRrRRRk.
..kkRrRRRRrRkk..
...kRrRRRRrRk...
...krrrrrrrrk...
...kRrRRRRrRk...
...kRrRRRRrRk...
...kkkkkkkkkk...`,{k:'#262330',R:'#a8322a',r:'#5a1a18'}],
beanie:[`
................
................
.......kk.......
......kWWk......
.....kkkkkk.....
...kkBBBBBBkk...
..kBBBBBBBBBBk..
..kBBBBBBBBBBk..
..kBBBBBBBBBBk..
..kbbbbbbbbbbk..
..kbBbBbBbBbBk..
..kkkkkkkkkkkk..`,{k:'#262330',B:'#2a4a7a',b:'#1a2a4a',W:'#f1ead6'}],
suit:[`
................
.....kkkkkk.....
...kkGkwwkGkk...
..kGGGkwwkGGGk..
.kGGGGkwrwkGGGk.
.kGGGGGkrkGGGGk.
.kGGkGGkrkGGkGk.
.kGGkGGGkGGGkGk.
.kGGkGGGGGGGkGk.
.kGGkGGGkGGGkGk.
.kkkkGGGGGGGkkk.
....kGGGkGGGk...
....kkkkkkkkk...`,{k:'#262330',G:'#2b2f3a',w:'#f4f1e8',r:'#a8322a'}],
radio:[`
................
.............k..
............k...
...........k....
..kkkkkkkkkkkk..
..kCCCCCCCCCCk..
..kCggggCCwwCk..
..kCgdgdCCwwCk..
..kCggggCCCCCk..
..kCgdgdCCddCk..
..kCggggCCddCk..
..kCCCCCCCCCCk..
..kkkkkkkkkkkk..`,{k:'#262330',C:'#e8dcc0',g:'#8a8478',d:'#3a3a44',w:'#f2c230'}],
batteries:[`
................
.....k.....k....
....kgk...kgk...
...kkkkk.kkkkk..
...kYYYk.kYYYk..
...kYYYk.kYYYk..
...kYYYk.kYYYk..
...kDDDk.kDDDk..
...kDDDk.kDDDk..
...kDDDk.kDDDk..
...kDDDk.kDDDk..
...kDDDk.kDDDk..
...kkkkk.kkkkk..`,{k:'#262330',Y:'#c9a040',D:'#2a2a30',g:'#c8ccd0'}],
fishrod:[`
..............kk
.............kSk
............kSk.
...........kSk.l
..........kSk..l
.........kSk...l
........kSk....l
.......kSk.....l
......kSk......l
....kkkk.......l
...kRRRk.......l
..kRRCk.......kl
..kRkCk.......k.
..kkCCk.........
...kCk..........
....k...........`,{k:'#262330',S:'#8a5a2a',C:'#c9a070',R:'#9aa0a8',l:'#cfd6dc'}],
smokedfish:[`
................
................
................
................
..........kkk...
.kk.....kkFFFk..
.kFk..kkFFFFFFk.
.kFFkkFFFFFFFdFk
.kFFFFFFFFFFFFFk
.kFFkkFfFfFfFFk.
.kFk..kkfFfFFk..
.kk.....kkkkk...`,{k:'#262330',F:'#c8822a',f:'#8a5a1a',d:'#1a1a1a'}],
pistol:[`
................
................
................
................
..kkkkkkkkkkkk..
..kGGGGGGGGGGGk.
..kGgGGGGGGGGGk.
..kkkkkkkGGGGGk.
........kGkkGGk.
........kk.kGGk.
...........kHHk.
...........kHHk.
...........kHHk.
...........kkkk.`,{k:'#262330',G:'#3a3a44',g:'#6a6a74',H:'#6a4428'}],
ammo:[`
................
................
....k.k.k.k.....
...kYkYkYkYk....
...kYkYkYkYk....
..kkkkkkkkkkk...
..kGGGGGGGGGk...
..kGwwwwwwwGk...
..kGwGGGGGwGk...
..kGwwwwwwwGk...
..kGGGGGGGGGk...
..kGGGGGGGGGk...
..kkkkkkkkkkk...`,{k:'#262330',Y:'#d8b040',G:'#4a5a2a',w:'#f1ead6'}],
souvenir:[`
..........kk....
.........kRk....
.........kRk....
...kkkkkkkRkkk..
...kWWWWWWWWWk..
...kGGGGGGGGGk..
....kGwwwwwGk...
....kGwdwdwGk...
....kGwwwwwGk...
....kGwdddwGk...
.....kGGGGGk....
.....kGGGGGk....
.....kkkkkkk....`,{k:'#262330',R:'#c0392b',W:'#f4f1e8',G:'#3a7a5a',w:'#f1ead6',d:'#1a1a1a'}],
bread:[`
................
................
................
................
................
....kkkkkkkk....
..kkLLLLLLLLkk..
.kLLDLLDLLDLLLk.
.kLLLDLLDLLDLLk.
.kLLLLLLLLLLLLk.
.kDDDDDDDDDDDDk.
..kkkkkkkkkkkk..`,{k:'#262330',L:'#d89a4a',D:'#a8642a'}],
record:[`
................
....kkkkkkk.....
...kKKKKKKKk....
..kKKgKKKKKKk...
.kKKgKKKKKKKKk..
.kKgKKRRRKKKKk..
.kKKKRRwRRKKKk..
.kKKKRwwwRKKKk..
.kKKKRRwRRKKKk..
.kKKKKRRRKKgKk..
.kKKKKKKKKgKKk..
..kKKKKKKgKKk...
...kKKKKKKKk....
....kkkkkkk.....`,{k:'#262330',K:'#1a1a22',g:'#4a4a5a',R:'#c0392b',w:'#f1ead6'}],
newspaper:[`
................
................
..kkkkkkkkkkkk..
..kwwwwwwwwwwk..
..kwddddddddwk..
..kwwwwwwwwwwk..
..kwggggwmmmwk..
..kwwwwwwmmmwk..
..kwggggwmmmwk..
..kwwwwwwwwwwk..
..kwggggwggggk..
..kwwwwwwwwwwk..
..kkkkkkkkkkkk..`,{k:'#262330',w:'#f1ead6',d:'#1a1a1a',g:'#8a8478',m:'#6a7a8a'}],
hotdog:[`
................
................
................
................
................
..kkkkkkkkkkkk..
.kBBBBBBBBBBBBk.
kSSYSSSYSSSYSSSk
kSSSYSSSYSSSYSSk
.kBBBBBBBBBBBBk.
..kkkkkkkkkkkk..`,{k:'#262330',B:'#d89a4a',S:'#a83a22',Y:'#f2c230'}],
pizza:[`
................
................
.......kk.......
......kYYk......
.....kYrYYk.....
.....kYYYrk.....
....kYrYYYYk....
....kYYYgYYk....
...kYYrYYYrYk...
...kYgYYYYYYk...
..kYYYYrYYgYYk..
..kCCCCCCCCCCk..
..kkkkkkkkkkkk..`,{k:'#262330',Y:'#f2c230',r:'#c0392b',g:'#5a9a3a',C:'#d89a4a'}],
wine:[`
.......kk.......
......kRRk......
......kGGk......
......kGGk......
.....kGGGGk.....
....kGGGGGGk....
....kGGGGGGk....
....kwwwwwwk....
....kwRRRRwk....
....kwwwwwwk....
....kGGGGGGk....
....kGGGGGGk....
.....kkkkkk.....`,{k:'#262330',G:'#4a1a2a',R:'#c0392b',w:'#f1ead6'}],
};
// the fish (FISH in data.js): one fish shape in each one's colours (body B, belly b, fin and stripe f), and the boot and the kelp
const FISH_SHAPE=`
................
................
................
................
.........kkk....
.kk....kkBBBkk..
.kBk.kkBBBBBBBk.
.kBBkBBfBfBBBoBk
.kBBBBBBBBBBBBBk
.kBBkbbbbbbbbbk.
.kBk.kkbbbbbkk..
.kk....kkkkk....`;
{const C={herring:['#c8d4dc','#eef4f8','#8a9aa8'],cod:['#a8946a','#e8e0c8','#7a6a48'],salmon:['#c8d0d8','#f2c8b8','#e07a5a'],halibut:['#8a7a5a','#d8ccb0','#5a4a34'],perch:['#8ab040','#e8e0a0','#3a5a20'],
  burbot:['#6a5a3a','#a8946a','#4a3a24'],pike:['#5a8a4a','#d8e0b0','#2e4a24'],char:['#7a8a7a','#e86a3a','#4a5a4a']};
  for(const k in C)ITEM_ART[k]=[FISH_SHAPE,{k:'#262330',B:C[k][0],b:C[k][1],f:C[k][2],o:'#1a1a1a'}];
  ITEM_ART.boot=[`
................
................
................
....kkkkk.......
....kBBBk.......
....kBbBk.......
....kBBBk.......
....kBBBk.......
....kBBBkkkkk...
...kBBBBBBBBBk..
...kBBBBBBBBBk..
...kkkkkkkkkkk..`,{k:'#262330',B:'#5a3a22',b:'#8a6a4a'}];
  ITEM_ART.kelp=[`
................
.......k........
......kGk.k.....
.....kGgkkGk....
.....kGgGkGk....
......kGgGGk....
...k..kGGgk.....
..kGk.kGgGk.....
..kGgkGGgk......
...kGGgGGk......
....kGGgk.......
.....kkk........`,{k:'#262330',G:'#3a7a3a',g:'#6aa85a'}]}
const ITEM_ICONS={};
function itemIcon(id){if(ITEM_ICONS[id])return ITEM_ICONS[id];
  if(!ITEM_ART[id]&&typeof FURN!='undefined'&&FURN[id]){const[w,h,ch,lb]=FURN[id],fu=furn(ch,w,h,lb,INT.default||{},.3),c=cnv(64,64),g=c.getContext('2d');g.imageSmoothingEnabled=false;
    if(fu){const s=Math.min(60/fu.c.width,60/fu.c.height);g.drawImage(fu.c,(64-fu.c.width*s)/2,(64-fu.c.height*s)/2,fu.c.width*s,fu.c.height*s)}return ITEM_ICONS[id]=c.toDataURL()}
  if(!ITEM_ART[id]&&CLOTHES[id]){const c=cnv(64,64),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(lookChar(0,0,{...PLAYER.look,[CLOTHES[id].slot]:id}),8,2,48,60);return ITEM_ICONS[id]=c.toDataURL()}const[art,pal]=ITEM_ART[id]||ITEM_ART.notebook,rows=art.trim().split('\n'),c=cnv(64,64),g=c.getContext('2d');
  rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(pal[ch]){g.fillStyle=pal[ch];g.fillRect(x*4,(y+(16-rows.length>>1))*4,4,4)}}));
  return ITEM_ICONS[id]=c.toDataURL()}
