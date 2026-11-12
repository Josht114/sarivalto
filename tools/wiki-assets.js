// ---- The Art Assets page of the wiki: every picture the game would need if its art (now all drawn in code, js/art.js) were
// replaced with ready-made images, with the size and the rules for each, to hand to whoever (or whatever) makes them. The lists
// are built from the game data, so they stay current; the rules around them are written by hand here.
// Decisions so far (from the user): the size is still open (16 or 32 pixel tiles, so every size is given both ways); the main
// cast get a sprite sheet each and everyone else is built from layered parts; night stays the game's own lighting for now
// (separate night art noted as an option); and the list covers everything, films and minigames included.
const fs=require('fs'),path=require('path');
module.exports=function(D,root){
const{L,BLD,NPCS,ITEMS,TAPES,QUESTS,FACTION_TREE,FACTIONS,GROUPS,DOORS,POS,PROPS,CLOTHES,FURN,DISTRICT_OF}=D;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const art=fs.readFileSync(path.join(root,'js/art.js'),'utf8'),tat=fs.readFileSync(path.join(root,'js/tattoo.js'),'utf8');
// a size in tiles, as pixels at 16 and at 32 to the tile
const px=(w,h)=>`${w*16}×${h*16}`,px2=(w,h)=>`${w*32}×${h*32}`,both=(w,h)=>`${w}×${h} tiles: ${px(w,h)} px (or ${px2(w,h)})`;
const sz=(w,h)=>`${w}×${h} px (or ${w*2}×${h*2})`;
const table=(head,rows,cls='')=>`<div class="wide"><table class="grid sortable${cls}"><thead><tr>${head.map((h,i)=>`<th data-col="${i}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const count=n=>`<p class="mut"><b>${n}</b> to make.</p>`;
// the weather each outdoor place has (js/art.js WEATHER_IN by district, WEATHER_AT by place; snow otherwise)
const wl=art.match(/const WEATHER_IN=(\{[^}]*\}),WEATHER_AT=(\{[^}]*\})/),WIN=Function('return '+wl[1])(),WAT=Function('return '+wl[2])();
const WX={snow:'deep snow',medium:'patchy snow, grass showing',autumn:'autumn: grass and fallen leaves, no snow',curated:'kept lawns and gardens, no snow'};
const weatherOf=id=>WAT[id]||WIN[DISTRICT_OF[id]]||'snow';
// the props' drawn heights (js/art.js PA and the town sets), and each room's floor and wallpaper (INT)
const propH={};for(const m of art.matchAll(/^\s{0,2}(\w+):\[(\d+),r=>/gm))propH[m[1]]??=+m[2];
const room={};for(const m of art.matchAll(/^(\w+):\{([^\n]*)/gm)){const f=m[2].match(/fl:'(\w+)'/),p=m[2].match(/pap:'(\w+)'/);if(f||p)room[m[1]]={fl:f?.[1]||'wood',pap:p?.[1]||'plain'}}
const outdoor=Object.keys(L).filter(id=>L[id][3]!='interior'),inside=Object.keys(L).filter(id=>L[id][3]=='interior');
const parent=id=>{const d=DOORS.find(d=>d[5]==id);return d&&L[d[0]]?L[d[0]][0]:''};
// ---- the main cast (a sprite sheet each): the CIA, every faction's and group's leader and top members, and everyone who gives a quest
const cast=new Set();NPCS.forEach(n=>{if(n.faction=='cia'||(n.also||[]).includes('cia'))cast.add(n.name)});
Object.values(FACTION_TREE).forEach(t=>{if(t.lead)cast.add(t.lead);(t.top||[]).forEach(x=>cast.add(x))});
Object.values(QUESTS).forEach(q=>{if(q.giver)cast.add(q.giver);if(q.caller)cast.add(q.caller)});
const castN=NPCS.filter(n=>cast.has(n.name)),rest=NPCS.filter(n=>!cast.has(n.name));
const facName=f=>(FACTIONS[f]||GROUPS?.[f]||[f])[0]||f;
// ---- buildings: every look in BLD, the places it stands, its footprint(s) and where its door is
const looks={};for(const id of outdoor)for(const f of L[id][4]||[]){const[x,y,w,h,t,lb,lk]=f;if(!lk||!BLD[lk])continue;
  const d=DOORS.find(d=>d[0]==id&&d[1]>=x&&d[1]<x+w&&d[2]>=y&&d[2]<=y+h);(looks[lk]??=[]).push({id,lb,w,h,door:d?d[1]-x:null})}
const bRows=Object.keys(BLD).map(k=>{const u=looks[k]||[],b=BLD[k],s=[...new Set(u.map(o=>o.w+'×'+o.h))];
  return[`<code>${k}</code>`,esc([...new Set(u.map(o=>o.lb).filter(Boolean))].join(', ')||'(unused)'),esc([...new Set(u.map(o=>L[o.id][0]))].join(', ')),s.map(v=>{const[w,h]=v.split('×');return both(+w,+h)}).join('<br>'),
    [...new Set(u.map(o=>o.door).filter(v=>v!=null))].map(c=>'column '+(c+1)).join(', ')||'—',esc(b.kind||'gable'),esc(b.sign||''),esc([b.signk&&b.signk+' sign',b.wear&&'worn',b.neon&&'neon'].filter(Boolean).join(', '))]});
// ---- furniture: every labelled thing inside a room, by name, with its sizes and how many rooms have it
const fur={};for(const id of inside)for(const f of L[id][4]||[]){const[x,y,w,h,t,lb]=f;if(!lb)continue;const k=lb.toLowerCase();const o=fur[k]??={lb,s:new Set(),n:0,at:new Set()};o.s.add(w+'×'+h);o.n++;o.at.add(L[id][0])}
const fRows=Object.values(fur).sort((a,b)=>a.lb.localeCompare(b.lb)).map(o=>[esc(o.lb),[...o.s].join(', '),o.n,esc([...o.at].slice(0,4).join(', ')+(o.at.size>4?` and ${o.at.size-4} more`:''))]);
// ---- props outdoors: each kind, how many stand on the island, and its drawn height
const pk={};PROPS.forEach(p=>{(pk[p[3]]??={n:0,at:new Set()}).n++;pk[p[3]].at.add(L[p[0]]?.[0]||p[0])});
const pRows=Object.keys(pk).sort().map(k=>[`<code>${k}</code>`,pk[k].n,propH[k]?sz(16,propH[k]):'16 px wide, up to 32 high',esc([...pk[k].at].slice(0,4).join(', ')+(pk[k].at.size>4?' …':''))]);
const tattoos=[...tat.matchAll(/\['(\w+)','([^']+)',(\d+)/g)].map(m=>m[2]);
const items=Object.keys(ITEMS).filter(k=>!CLOTHES[k]&&!FURN[k]);
const S=(t,body)=>`<h2 id="${t.toLowerCase().replace(/[^a-z]+/g,'-')}">${t}</h2>${body}`;
return`<h1>Art Assets</h1>
<p>Everything the game draws today is drawn in code (<code>js/art.js</code> and the minigame files). This page lists every picture the game would need to swap that for ready-made art, with the size and rules for each, so the list can be handed to an artist or an image generator. The lists below are built from the game data, so they stay current as the island grows.</p>
<p><b>Decisions so far:</b> the tile size is not settled yet, so every size is given at <b>16 px</b> to the tile (as now) and at <b>32 px</b> (twice the detail); the <b>main cast</b> (${castN.length} people) get a sprite sheet each, and the other ${rest.length} islanders are built from <b>layered parts</b>; <b>night</b> stays the game's own lighting for now; and the list covers <b>everything</b>, films and minigames included.</p>
<p><b>How many:</b> about ${outdoor.length} outdoor ground maps (built from tile sets), ${Object.keys(BLD).length} building designs, ${inside.length} rooms, ${Object.keys(fur).length} kinds of furniture, ${Object.keys(pk).length} kinds of prop, ${castN.length} character sheets, the layered parts for the rest, ${NPCS.length} portraits, ${items.length+Object.keys(CLOTHES).length+Object.keys(FURN).length} inventory icons, ${tattoos.length} tattoo designs, and the screens, films and games.</p>
<p>Contents: <a href="#rules-for-every-asset">Rules</a> · <a href="#ground-tiles">Ground tiles</a> · <a href="#outdoor-places">Outdoor places</a> · <a href="#buildings">Buildings</a> · <a href="#trees-rocks-and-snow">Trees and rocks</a> · <a href="#props">Props</a> · <a href="#rooms">Rooms</a> · <a href="#furniture">Furniture</a> · <a href="#people">People</a> · <a href="#portraits">Portraits</a> · <a href="#items">Items</a> · <a href="#screens-and-interface">Interface</a> · <a href="#films">Films</a> · <a href="#minigames">Minigames</a> · <a href="#night">Night</a> · <a href="#what-the-code-keeps">Kept in code</a></p>
${S('Rules for every asset',`<ul>
<li><b>Look:</b> top-down pixel art, seen from above at a slight angle (the fronts of buildings, furniture and people show; roofs and tops are seen from above), in the manner of 1990s handheld role-playing games. Early 1980s, Cold War, a snowy island north of Finland. Each town has its own look (<a href="../../docs/town-aesthetics.md">docs/town-aesthetics.md</a>): Eastbrook timber and brick, Frostholm neon, Saltwick a run-down fishing town, Hope Springs wealthy villas, Kingsgrad a light steampunk town of copper roofs and chimney stacks.</li>
<li><b>Grid:</b> everything sits on the tile grid: 16×16 px tiles now, or 32×32 if the art is made at double size. The screen shows 15×10 tiles (240×160 px, or 480×320). Sizes on this page are in tiles, then pixels at 16 and (in brackets) at 32.</li>
<li><b>Pixels:</b> hard-edged pixels at exactly the stated size: no blur, no anti-aliasing, no soft shadows, no gradients wider than a few colours. One pixel of the art is one pixel of the grid; the game scales it up whole.</li>
<li><b>Light:</b> from the upper left, so the left and top edges are lighter and the right and bottom darker. Don't bake in a cast shadow on the ground: the game draws people's shadows itself.</li>
<li><b>Colour:</b> one shared palette for everything (about 48 to 64 colours), cold and muted: snow whites and blue-greys, dark pine greens, weathered wood, red and ochre accents; brighter neon only in Frostholm.</li>
<li><b>Files:</b> PNG, with a transparent background for anything that isn't a full-screen picture. One file per asset, named by the id in the tables below (<code>assets/buildings/diner.png</code>, <code>assets/items/islandmap.png</code>); animations as a strip of frames left to right, all the same size.</li>
<li><b>Snow:</b> most of the island is under snow: roofs carry it, ledges have a white line, things stand in it. A few places have no snow (see <a href="#outdoor-places">Outdoor places</a>): their buildings and trees need a no-snow version.</li>
<li><b>Text:</b> signs and labels are part of the art (the table gives each sign's words); keep text to capital letters a few pixels high, as now.</li>
<li><b>Height:</b> things taller than their footprint (buildings, lamp posts, wardrobes) rise above it: draw the footprint at the bottom of the image and let the rest go up. Each table says how far.</li></ul>`)}
${S('Ground tiles',`<p>The ground is built from tiles, not painted whole. Each terrain needs a tile set: a plain tile or three for variety, and the edges where it meets the ground around it (a 16-piece set: the four sides, four outer corners, four inner corners and the middle; or a 47-piece set for rounder joins). Animated ones are a strip of 4 frames.</p>
${table(['Terrain','Where','Needs'],[
['Snow (deep)','most of the island','plain ×4 variants; footprints optional'],['Patchy snow','central and south districts','plain ×4, edges to snow'],['Autumn grass and leaves','the southeast','plain ×4, edges'],['Kept lawn','Hope Springs, the private beach and harbour, Langley','plain ×2, edges, flower beds'],
['Slush streets','Saltwick, West Saltwick Harbour','plain ×3, edges'],['Paths: dirt, boardwalk, cobbles, paving','every town and road (each town its own)','each: straight, corners, crossings, ends'],
['Rock and cliff face','the north, the volcano, the coast','rock ground, cliff face (2 tiles high), cliff top edge, stairs cut into the cliff'],
['Sea, lake, river','coast, harbours, lakes','4-frame animated water, shore edges (snow, sand, rock), river banks'],['Docks and jetties','harbours','boards, ends, posts, bollard edges'],
['Sand','beaches','plain, wet edge'],['Lava','the volcano','4-frame animated, cooled crust edges'],['Fields','the farms','cabbage rows, wheat, potatoes, ploughed earth under snow'],
['Tram track and platform','along the tram line','track straight and bends, platform edge, buffers'],['Snow banks','roads not open yet','a bank across a road, 2 tiles wide, 28×24 px (or 56×48)'],
['Inside: floors','every room','wood, tile, carpet, check, stone, sand, granite, basalt: plain and edge to wall'],['Inside: walls','every room','the back wall (2 tiles high: 16 px above row 0 and row 0), its top edge, side walls: stripe, panel, tiles, brick, flower, rock, plain']])}`)}
${S('Outdoor places',`<p>Each outdoor place is built from the ground tiles above, so these are not separate pictures; the table is for checking the tile sets cover everything, and for the weather each needs. (A place could instead have one painted backdrop at its full size, but that makes edits to the map much harder.)</p>
${table(['Place','Size','Kind','Weather'],outdoor.map(id=>[esc(L[id][0]),both(L[id][1],L[id][2]),esc(POS[id]?.[2]||L[id][3]),esc(WX[weatherOf(id)]||weatherOf(id))]))}`)}
${S('Buildings',`<p>One picture for each building design (${Object.keys(BLD).length}). The footprint is the building's width and depth on the map; draw the front wall along the bottom of the picture, with the door where the table says (counting columns from the left), and let the roof, chimneys and signs rise up to <b>2 tiles above</b> the footprint (32 px, or 64). The front wall should take about the bottom half of the footprint, the roof the rest. A design used at two sizes needs both. At night the game lights the windows: see <a href="#night">Night</a>.</p>
${table(['Id','Called','Where','Footprint','Door','Kind','Sign','Notes'],bRows)}${count(Object.keys(BLD).length)}`)}
${S('Trees, rocks and snow',`<ul><li><b>Pines</b>, ×3 variants: 1 tile wide, 28 px tall (or 56); snow on the branches.</li><li><b>Bare dead trees</b>, ×3: 16×30 px (or 32×60).</li><li><b>Autumn trees</b>, ×6 (the southeast): 16×28 px.</li><li><b>Garden trees</b>, ×3 (Hope Springs, Langley): 16×28 px.</li><li><b>Leafy tree</b>, ×1: 24×34 px.</li><li><b>Rocks</b>, ×3, in snow and without: 16×16 px.</li><li><b>Danger sign</b> beside snowed-in roads: 28×30 px.</li><li><b>Snow bank</b> blocking a road: 28×24 px.</li></ul>`)}
${S('Props',`<p>Small things standing outdoors: one picture each, 1 tile wide (a few are 2 or 3), standing on the bottom of the image and rising to the height given. Towns with their own look (Eastbrook's detailed and gothic sets, Kingsgrad's steampunk, Frostholm's neon, the gardens of Hope Springs) swap some props for their own version of the same thing, listed in <code>js/art.js</code> (<code>DPROP</code>, <code>GPROP</code>, <code>WXPROP</code>).</p>
${table(['Prop','How many','Size','Where'],pRows)}${count(Object.keys(pk).length+' (plus the town versions)')}`)}
${S('Rooms',`<p>Rooms are built from the floor and wall tiles (<a href="#ground-tiles">Ground tiles</a>) and the furniture below, so they need no picture of their own. The table gives each room's size and its floor and wallpaper, to check the tile sets cover them all. Some rooms also have things hung on the back wall: windows, clocks, maps, pictures, shelves and neon signs, each 1 tile wide and up to 16 px tall, drawn on the wall.</p>
${table(['Room','In','Size','Floor','Walls'],inside.map(id=>[esc(L[id][0]),esc(parent(id)),both(L[id][1],L[id][2]),esc(room[id]?.fl||'wood'),esc(room[id]?.pap||'plain')]))}`)}
${S('Furniture',`<p>One picture for each piece (${Object.keys(fur).length} kinds), seen from the front and a little above. The footprint is in tiles; anything standing against the back wall (shelves, cupboards, machines, the radio set) rises up to 10 px above its footprint (20 px at 32), and wardrobes, clocks and tall cabinets up to a tile. A piece used at several sizes needs each one (or a picture that can be cut into a left end, a middle and a right end, for counters and long tables). Animated pieces (the radio set's lights, screens, reels, the jukebox, the fire in a stove) need a 2 to 4 frame strip of the moving part.</p>
<p>The home furniture sold at Nordhem Furniture, for the player's own homes: ${Object.values(FURN).map(f=>esc(f[3])+' ('+f[0]+'×'+f[1]+')').join(', ')}.</p>
${table(['Furniture','Footprint (tiles)','Rooms','For example'],fRows)}${count(Object.keys(fur).length)}`)}
${S('People',`<p>Every person is 1 tile wide and a little taller: <b>16×20 px</b> (or 32×40), standing on the bottom 4 px of their tile, head above it. Each needs <b>4 directions</b> (facing down, up, left and right; right can be the left one mirrored) and <b>3 frames</b> each (standing, left foot forward, right foot forward), laid out as a sheet of 3 columns × 4 rows: <b>48×80 px</b> (or 96×160), rows in the order down, up, left, right.</p>
<h3>The main cast: a sheet each (${castN.length})</h3><p>The CIA, every faction's and group's leader and top members, and everyone who gives a quest. Each should be recognisable at a glance and match their portrait. The table gives what the game knows of their look: their main colour and hair colour (as now), and their job.</p>
${table(['Name','Job','Faction','Gender','Clothes colour','Hair'],castN.map(n=>[esc(n.name),esc(n.job),esc(facName(n.faction)),esc(n.gender),`<span style="display:inline-block;width:12px;height:12px;background:${n.body};border:1px solid #0004"></span> ${esc(n.body||'')}`,`<span style="display:inline-block;width:12px;height:12px;background:${n.hair};border:1px solid #0004"></span> ${esc(n.hair||'')}${n.hat?' · hat':''}`]))}
<h3>Everyone else: layered parts (${rest.length} people)</h3><p>The other islanders are put together in the game from parts drawn on the same 16×20 sheet layout (every part a full 48×80 sheet, transparent where it has nothing, so they stack exactly). Draw the parts in <b>light grey</b> where they take the person's own colour, so the game can tint them (clothes, hair), and in their real colours where they don't (skin, faces, buttons). The player's wardrobe and the character creator at Langley use the same parts, so they serve both.</p>
<ul><li><b>Bodies:</b> a man and a woman, in 4 skin tones (8 sheets), with faces; legs in trousers, and a woman's legs in dark tights under a skirt.</li>
<li><b>Hair:</b> short, side parting, curly, buzz cut, bald (a fringe at the sides), long, bob, ponytail, bun (9, tinted).</li><li><b>Facial hair:</b> full beard, moustache, stubble (3, tinted).</li>
<li><b>Tops:</b> by style: parka, jumper, flannel shirt, suit, trench coat, and a plain work top (tinted); an apron over it, for cooks, bakers and bar staff.</li>
<li><b>Legs:</b> jeans, trousers, corduroys, dungarees, a skirt (tinted).</li><li><b>Shoes:</b> boots, snow boots, sneakers, shoes, cowboy boots (tinted).</li>
<li><b>Hats:</b> knitted beanie, flat cap, ushanka, beret, fedora, Stetson, sou'wester, a peaked uniform cap (soldiers and police) and a jester's cap with bells in two colours (tinted).</li></ul>
<p>The player's clothes for sale (each needs its part, and an inventory icon): ${Object.values(CLOTHES).filter(c=>c.style!='none').map(c=>esc(c.name)).join(', ')}.</p>
<p><b>Costumes:</b> the few people in a costume (the circus, the mascot) need their own sheet like the main cast.</p>`)}
${S('Portraits',`<p>A head-and-shoulders picture of each person, shown at the top left of a conversation: <b>28×28 px</b> (or 56×56) now, though a portrait can be larger than the world art (64×64 or 96×96 reads better) as long as every one is the same size. Facing slightly to the right, on a plain background the game fills in, in the same palette.</p>
<p>The main cast (${castN.length}) need one each, made to match their sheet. For everyone else either a portrait each (${rest.length} more), or portrait parts layered like their sprites (faces in 4 skin tones for men and women, the 9 hair styles, 3 facial hairs, the hats, a collar per top style): fewer pictures, less character. The player's portrait is built from the parts.</p>${count(NPCS.length+' portraits, or '+castN.length+' and a set of parts')}`)}
${S('Items',`<p>An icon for everything you can carry, shown in the inventory grid and in shops: <b>16×16 px</b> (or 32×32), on a transparent background, the thing seen from the front and a little above, filling most of the square with a 1 px dark outline. The descriptions are the game's own, to say what each looks like.</p>
${table(['Id','Name','What it is'],items.map(k=>[`<code>${k}</code>`,esc(ITEMS[k].name),esc(ITEMS[k].desc||'')]))}
<p>Also an icon for each piece of clothing (${Object.values(CLOTHES).filter(c=>c.style!='none').length}, listed under <a href="#people">People</a>) and each piece of home furniture (${Object.keys(FURN).length}), and the cassette tapes: ${Object.values(TAPES).map(t=>esc(t.name||t.title||'')).filter(Boolean).join(', ')} (each a cassette with its own label colours).</p>${count(items.length+Object.keys(CLOTHES).length-1+Object.keys(FURN).length)}`)}
${S('Screens and interface',`<ul>
<li><b>Title screen:</b> one full picture, 240×160 px (or 480×320), now <code>img/title.webp</code>: "30 Days in Sarivalto", the reporter in front of the island, with room at the bottom for the Continue, New game and Load game buttons.</li>
<li><b>Font:</b> a pixel font for the signs and the text drawn in the world: capital letters, numbers and punctuation, 3×5 px each now (6×10 at double size), or a bitmap font file. The page's own text (conversations, menus) uses a normal font and needs nothing.</li>
<li><b>Quest stars:</b> a gold star (main quest) and a silver star (side quest), 7×8 px, shown over a person's head and on the island map.</li>
<li><b>Island map:</b> the Map tab's picture of the whole island with its towns, roads, harbours and tram line, at about 680×420 px, with a marker for where you are (now drawn from <code>docs/island-map.svg</code>).</li>
<li><b>Meters:</b> the Hunger, Nicotine and Alcohol bars at the top right: a frame and a fill for each, and a small icon (a fork, a cigarette, a glass), 8×8 px.</li>
<li><b>Menu and boxes:</b> optional: a 9-slice frame (corners and edges, 8 px) for the menu, the conversation box, the quest news box and the shop, in the same palette.</li>
<li><b>Map icons:</b> small 18×18 px icons on the island map: a house (your homes), a star, the tram.</li>
<li><b>Calendar:</b> the wall calendar over your bed showing the date: a page with a big day number, 16×16 px.</li>
<li><b>Snow and weather:</b> nothing: falling snow, steam and smoke stay in code.</li></ul>`)}
${S('Films',`<p>The films are drawn at the game's screen size, 240×160 px (or 480×320), as layers that slide past each other: a sky, far and near backdrops wider than the screen (they scroll), and the moving things on top.</p>
<ul><li><b>Opening film</b> (New game, about 19 seconds): driving to work through the Virginia woods in early autumn (sky, far hills, woods, the road, a 1980s American car from the side, 2 frames of wheels); in at the gate (guard hut, barrier, sign); the car park and the doors of CIA Headquarters.</li>
<li><b>The flight</b> (boarding Peggy's seaplane, about 19 seconds): the Langley airstrip at dusk, the seaplane taking off (side view, propeller in 2 to 4 frames); the night sea with stars and moon; dawn, landing on the water beside a fishing boat off Sarivalto.</li>
<li><b>The cinema's two pictures</b>, at 256×144 px (or 512×288): <b>STORMWING</b> (about 80 seconds: two Western fighter pilots, Falcon and Frost, over the frozen North: jets from the side and from behind, MiGs, mountains, cloud layers, cockpits, a carrier, explosions) and <b>TOP COMRADE</b> (about 34 seconds: its Soviet answer: Comrade Sokol and his wingman, a beach volleyball game, MiGs and a parade).</li></ul>`)}
${S('Minigames',`<p>Each opens in the menu panel (about 420×300 px); its art can be drawn at that size, or at the world's pixel size and scaled up.</p><ul>
<li><b>Lock picking:</b> a lock seen face on with its pins (5), a tension wrench and a pick.</li>
<li><b>Safe cracking:</b> a safe door with a dial of 40 numbers that turns, three wheels, a stethoscope meter.</li>
<li><b>Forgery:</b> a desk with paper cards in 3 kinds, ink pots in 3 greens, pens, and the recipe card (real and forged).</li>
<li><b>Radio tuning:</b> the radio set's tuning panel: a dial along a band, a needle, a signal meter, a speaker grille.</li>
<li><b>Fishing:</b> a float on the water, a bite splash, and every catch as an item icon (fish and junk).</li>
<li><b>Poker and blackjack:</b> a card table (green baize), 52 cards and a card back (about 20×28 px each, or 40×56), chips in 4 colours, the dealer's button.</li>
<li><b>Slot machine:</b> the machine's front, and its six symbols: cherries, lemon, bell, Kelp Cola bottle, BAR, seven (each 16×16, or 32×32).</li>
<li><b>Arcade:</b> three cabinets' screens: Snake (snake, kelp to eat, walls), Brick Breaker (bat, ball, bricks in rows of colour) and Invaders (the player's gun, 3 kinds of invader in 2 frames, a saucer, shields).</li>
<li><b>Tattoos:</b> ${tattoos.length} designs at 12×12 px (or 24×24): ${tattoos.map(esc).join(', ')}; and the player's arms, legs, chest and back to show them on.</li>
<li><b>Wardrobe and the Cover Story Department:</b> the player shown large (the 16×20 sprite at 3×), so nothing extra.</li>
<li><b>Faction Tracker:</b> the home computer's screen frame (charts stay in code).</li></ul>`)}
${S('Night',`<p><b>For now, night stays the game's own lighting:</b> it darkens the day art, cuts pools of light around lamps, fires and windows, and makes neon glow and flicker. So the day art is enough, plus two small extras that let the lighting work:</p>
<ul><li><b>Lit windows:</b> for each building, a second picture the same size with only its window panes in a warm yellow (everything else transparent), laid over the building at night.</li>
<li><b>Signs that glow:</b> neon signs as their own layer (letters only), so the game can light them, flicker them and leave a dead letter dark (the D on Aili's Diner).</li>
<li><b>Lights:</b> nothing: lamp posts, braziers and fires already mark where the light comes from.</li></ul>
<p><b>An option for later:</b> separate painted night art: a night version of every ground tile set, building and outdoor prop (Frostholm and its harbour purple neon, everywhere else moonlit blue). It looks richer but nearly doubles the outdoor list, and the game's lighting would still add the lamps on top.</p>`)}
${S('What the code keeps',`<p>These stay drawn in code whatever art is used: falling snow, steam, smoke from chimneys, water shimmer, the lighting, neon flicker, the gulls over the harbours, the tram's movement (its carriage needs a picture: 3 tiles long, from the side, with doors, 2 frames), the boats' bobbing, the oil spill, charts on the Faction Tracker, and the text of every message, menu and conversation.</p>`)}`};
