// ---- Homes of your own. Sally, the estate agent in Kingsgrad, sells the island's empty homes (HOMES_FOR_SALE in data.js), paid from
// CIA funds or your own money; buying one clears out its boxes and makes it yours ("Your House"). She can also have your equipment
// moved in: the big screen, the radio set, the telephone, the computer and the wardrobe leave the Hidden Radio Room (or the home
// you were in) and come to you as things to put down, and that home becomes your home (HOME): the screen, the telephone and the
// wardrobe work there. Furniture (bought at Nordhem Furniture in Kingsgrad, FURN in data.js) and your equipment are put down in a
// home of yours from the Inventory tab (Place): a ghost of it follows the arrow keys, green where it fits and red where it doesn't;
// Enter puts it down, Escape keeps it. Facing something you've put down, P picks it up again.
// Kept in ME: homes (the homes you own), placed (by home, what you've put down: [x, y, w, h, tile, label, item]), home and moved
// (whether your equipment has left the Hidden Radio Room); applyHomes() builds the homes' maps from that, and takes down the SALE sign
// outside a home once it's yours.
const EQUIP_LABELS=['Big Screen','Radio Equipment','Telephone','Computer','Wardrobe'],EQUIP_ITEM={'Big Screen':'eq_screen','Radio Equipment':'eq_radio',Telephone:'eq_phone',Computer:'eq_computer',Wardrobe:'eq_wardrobe'};
// each home's map as the game began, to build it again from
const ORIG={};for(const id of[...Object.keys(HOMES_FOR_SALE),'hekki_room']){const d=DOORS.find(x=>x[5]==id),out=d&&FL[d[0]].find(([x,y,w,h,c])=>c=='#'&&d[1]>=x&&d[1]<x+w&&d[2]>=y&&d[2]<y+h);
  ORIG[id]={fs:FL[id].map(f=>f.slice()),map:MAPS[id].slice(),name:L[id][0],out,outName:out&&out[5]}}
// each home's SALE sign: the 'forsale' prop beside its front door
const SALE_SIGN={};for(const id in ORIG){const d=DOORS.find(x=>x[5]==id);if(d)SALE_SIGN[id]=PROPS.find(p=>p[0]==d[0]&&p[3]=='forsale'&&Math.abs(p[1]-d[1])<=3&&Math.abs(p[2]-d[2])<=3)||null}
const setTiles=(m,x,y,w,h,ch)=>{for(let j=y;j<y+h;j++)MAPS[m][j]=MAPS[m][j].slice(0,x)+ch.repeat(w)+MAPS[m][j].slice(x+w)};
function removeFeature(m,f){const i=FL[m].indexOf(f);if(i<0)return;FL[m].splice(i,1);setTiles(m,f[0],f[1],f[2],f[3],'f')}
// build the homes' maps from ME: the equipment gone from the Hidden Radio Room, the homes you own cleared and named, and what
// you've put down in them
function applyHomes(){for(const id in ORIG){const o=ORIG[id];FL[id].length=0;o.fs.forEach(f=>FL[id].push(f.slice()));MAPS[id]=o.map.slice();L[id][0]=NM[id]=o.name;if(o.out)o.out[5]=o.outName}
  if(ME.moved){const seen=new Set();for(const f of FL.hekki_room.slice())if(EQUIP_LABELS.includes(f[5])&&!seen.has(f[5])){seen.add(f[5]);removeFeature('hekki_room',f)}}
  for(const id of ME.homes){const villa=/villa/.test(id);for(const f of FL[id].slice())if(f[5]=='Boxes')removeFeature(id,f);L[id][0]=NM[id]=villa?'Your Villa':'Your House';if(ORIG[id].out)ORIG[id].out[5]=NM[id]}
  for(const id in ME.placed)for(const p of ME.placed[id]){const f=p.slice(0,6);FL[id].push(f);setTiles(id,f[0],f[1],f[2],f[3],f[4])}
  // the SALE sign stays up until the home is sold
  for(const id in SALE_SIGN){const p=SALE_SIGN[id];if(!p)continue;const i=PROPS.indexOf(p);if(ownHome(id)&&i>=0)PROPS.splice(i,1);else if(!ownHome(id)&&i<0)PROPS.push(p)}
  HOME=ME.home||'hekki_room';
  for(const id in ORIG){delete SC[id];delete PCACHE[id];const d=DOORS.find(x=>x[5]==id);if(d){delete SC[d[0]];delete PCACHE[d[0]]}}if(typeof showHere=='function'&&ORIG[P.m])here.text=NM[P.m]}
const ownHome=m=>ME.homes.includes(m);
// ---- Sally, at the estate agent's: buying a home, and moving your things into one
const where=id=>HOMES_FOR_SALE[id][1],price=id=>HOMES_FOR_SALE[id][0],aHome=id=>/villa/.test(id)?'the villa in '+where(id):'the house in '+where(id);
function estateConvo(n){if(n.m!=n.loc)return{start:'a',nodes:{a:{say:"Come and see me at the office in Kingsgrad, in the daytime. I've some lovely properties on my books."}}};
  const nodes={},forSale=Object.keys(HOMES_FOR_SALE).filter(id=>!ownHome(id)),mine=ME.homes.filter(id=>id!=HOME);
  nodes.a={say:ME.homes.length?"Back again! How's the new place? Anything else I can do for you?":"Sally, Sarivalto Homes! Looking for a place of your own while you're on the island? I've some lovely properties on my books.",
    opts:[...forSale.map(id=>[`${aHome(id)[0].toUpperCase()+aHome(id).slice(1)} (${money(price(id))})`,'h_'+id]),...mine.map(id=>[`Move my things into my ${/villa/.test(id)?'villa':'house'} in ${where(id)}`,'m_'+id,()=>moveInto(id)]),
      ...(ME.homes.length&&HOME!='hekki_room'?[['Move my things back to the radio tower','m_back',()=>moveInto('hekki_room')]]:[]),['Just looking.',null]]};
  for(const id of forSale){const p=price(id);nodes['h_'+id]={say:HOMES_FOR_SALE[id][2]+` It's ${money(p)}. How would you like to pay?`,
    opts:[...(ME.cia>=p?[[`Pay ${money(p)} from CIA funds`,'b_'+id,()=>buyHome(id,'cia')]]:[]),...(ME.cash>=p?[[`Pay ${money(p)} of my own money`,'b_'+id,()=>buyHome(id,'cash')]]:[]),
      [ME.cia<p&&ME.cash<p?"I can't afford it.":'Not today.',null]]};
    nodes['b_'+id]={say:"Congratulations! The keys are yours, and I've had the boxes cleared out. Shall I have your things moved over? Your screen, your radio, all that.",opts:[['Yes, move my things in.','m_'+id,()=>moveInto(id)],['Not yet.',null]]}}
  for(const id of[...ME.homes,...Object.keys(HOMES_FOR_SALE)])nodes['m_'+id]={say:"Consider it done. Hekki's on his way with a handcart: your screen, the radio set, the telephone, the computer and your wardrobe will be waiting for you. Put them wherever you like."};
  nodes.m_back={say:"Back to the radio tower? Well, it's your money. Hekki will take everything back over this afternoon."};
  return{start:'a',nodes}}
function buyHome(id,how){const p=price(id);if(ME[how]<p)return;ME[how]-=p;ME.homes.push(id);applyHomes();say(`${aHome(id)[0].toUpperCase()+aHome(id).slice(1)} is yours.`,4000)}
// moving your equipment: out of the home it's in (the Hidden Radio Room, or a home of yours, where it's picked up), to you as
// things to put down; back to the radio tower, it goes back where it was
function moveInto(id){if(HOME==id)return;
  if(HOME=='hekki_room')ME.moved=true;
  else{const pl=ME.placed[HOME]||[];for(const p of pl.filter(p=>/^eq_/.test(p[6]))){pl.splice(pl.indexOf(p),1);give(p[6])}}
  if(id=='hekki_room'){ME.moved=false;for(const k of Object.values(EQUIP_ITEM))while(has(k))take(k)}else for(const k of Object.values(EQUIP_ITEM))if(!has(k)&&!Object.values(ME.placed).flat().some(p=>p[6]==k))give(k);
  ME.home=id;applyHomes()}
const give=id=>{const m=has(id);if(m)m.n++;else ME.items.push({id,n:1})};
// ---- Putting things down: the ghost, the keys, and the check that it fits
let PLACE=null;
function startPlace(id){if(!ownHome(P.m)){say('You can only put that down in a home of your own.',3500);return}const[w,h,ch,label]=FURN[id],[dx,dy]=DIR[P.dir];
  PLACE={id,w,h,ch,label,x:Math.max(1,Math.min(MAPS[P.m][0].length-1-w,P.x+dx)),y:Math.max(1,Math.min(MAPS[P.m].length-1-h,P.y+dy))};closeStart()}
function placeOk(){const{x,y,w,h}=PLACE,M=MAPS[P.m],stop=new Set(EX[P.m].map(e=>e.ax!=null?e.ax+','+e.ay:'').concat(P.x+','+P.y));
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){if(M[j]?.[i]!='f'||stop.has(i+','+j))return false}return true}
function putDown(){if(!placeOk()){say("That won't fit there.",2000);return}const{x,y,w,h,ch,label,id}=PLACE;(ME.placed[P.m]??=[]).push([x,y,w,h,ch,label,id]);take(id);PLACE=null;applyHomes();say(`You put the ${ITEMS[id].name.toLowerCase()} down.`,2500)}
addEventListener('keydown',e=>{if(!PLACE)return;const k=e.key.length==1?e.key.toLowerCase():e.key,d={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]}[k];
  e.preventDefault();e.stopImmediatePropagation();if(e.repeat&&!d)return;
  if(d){const M=MAPS[P.m];PLACE.x=Math.max(1,Math.min(M[0].length-1-PLACE.w,PLACE.x+d[0]));PLACE.y=Math.max(1,Math.min(M.length-1-PLACE.h,PLACE.y+d[1]))}
  else if(k=='Enter'||k=='e'||k==' ')putDown();else if(k=='Escape'){PLACE=null;say('You keep it for now.',1500)}},true);
// the ghost: the piece itself, faint, over a green (fits) or red (doesn't) outline
function placeFx(m,cx,cy,t,px,Ls){if(!PLACE||P.m!=m)return;const{x,y,w,h,ch,label}=PLACE,ok=placeOk(),fu=furn(ch,w,h,label,INT[m]||INT.default,.3);
  Ls.push([99,9,()=>{ctx.globalAlpha=.6;if(fu)ctx.drawImage(fu.c,x*16-cx-1,y*16-cy-fu.oy-1);ctx.globalAlpha=1;ctx.fillStyle=ok?'rgba(80,220,120,.25)':'rgba(230,70,60,.3)';ctx.fillRect(x*16-cx,y*16-cy,w*16,h*16);
    ctx.strokeStyle=ok?'#50dc78':'#e6463c';ctx.lineWidth=1;ctx.strokeRect(x*16-cx+.5,y*16-cy+.5,w*16-1,h*16-1)}])}
// what you've put down, in the tile you're facing (P picks it up)
const placedAhead=()=>{if(!ownHome(P.m))return null;const[dx,dy]=DIR[P.dir],x=P.x+dx,y=P.y+dy;return(ME.placed[P.m]||[]).find(([fx,fy,w,h])=>x>=fx&&x<fx+w&&y>=fy&&y<fy+h)||null};
addEventListener('keydown',e=>{if(PLACE||MENU||START||BUSY||CONVO||e.repeat||e.target.tagName=='SELECT'||(e.key!='p'&&e.key!='P'))return;const p=placedAhead();if(!p)return;
  e.preventDefault();ME.placed[P.m].splice(ME.placed[P.m].indexOf(p),1);give(p[6]);applyHomes();say(`You pick up the ${ITEMS[p[6]].name.toLowerCase()}.`,2500)});
applyHomes();
