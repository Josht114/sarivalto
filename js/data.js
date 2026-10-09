// ---- Island data: id:[name,w,h,theme,[features: x,y,w,h,tile,label]]. Edit freely; layouts are placeholders.
const TH={interior:['f','W'],snow:['.','T'],sand:['s','~'],rock:['r','R'],farm:['a','T'],harbour:['.','~'],deck:['p','~']};
const L={
oilrig:['Oil Rig',16,12,'deck',[[3,3,4,3,'#','Drill Tower'],[9,8,4,2,'#','Crew Quarters']]],
oilhq:['Diversified Petroleum HQ',18,14,'snow',[[3,2,10,4,'#','Diversified Petroleum HQ'],[2,9,4,3,'#','Depot']]],
fishing:['Kalan Fishing Village',26,16,'snow',[[3,3,5,4,'#','Cottage'],[9,3,3,4,'#','Cottage'],[18,3,5,4,'#','Net Shed'],[3,10,6,4,'#','Smokehouse'],[17,11,5,3,'#','Cottage']]],
north:['North Road',22,14,'snow',[[2,2,4,3,'T'],[16,9,4,3,'T']]],
volcano:['Volcano',26,16,'rock',[[9,2,8,5,'v','Crater'],[2,10,4,3,'R'],[19,10,4,3,'R']]],
mountains:['Mountains',22,16,'rock',[[3,3,4,4,'R'],[14,9,4,4,'R']]],
cathedral:['Mountain-Top Cathedral',20,16,'rock',[[5,2,10,6,'#','Cathedral']]],
east:['East Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
farm:['East Farm',22,16,'farm',[[3,3,6,4,'#','Farmhouse'],[13,3,5,3,'#','Barn']]],
palace:['Royal Palace',20,16,'snow',[[4,2,12,6,'#','Royal Palace'],[2,10,3,3,'T'],[15,10,3,3,'T']]],
town:['Linal Town',30,22,'snow',[[3,2,6,4,'#','Party Office'],[20,7,6,3,'#','Shops'],[3,16,6,4,'#','Houses'],[22,18,5,3,'#','Market']]],
colahq:['Kelp Cola HQ',18,14,'snow',[[3,2,10,5,'#','Kelp Cola HQ'],[3,9,4,3,'#','Parking']]],
shuttle:['Shuttle Bus',22,8,'snow',[[9,1,5,2,'#','Bus Stop']]],
colafactory:['Kelp Cola Factory',24,16,'snow',[[3,1,12,6,'#','Kelp Cola Factory'],[17,10,5,4,'#','Warehouse']]],
second:['Savila Town',26,18,'snow',[[3,3,6,5,'#','Houses'],[17,3,6,5,'#','Houses'],[3,12,6,4,'#','Union Hall'],[17,12,6,4,'#','Shops']]],
south:['South Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
west:['West Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
beach:['Beach',12,22,'sand',[]],
village:['Pula Harbour Village',44,24,'snow',[
[2,3,9,8,'#','Fish Processing Plant','plant'],[6,10,1,1,'d'],
[16,4,10,7,'#','Communist Party HQ','hq'],[20,10,1,1,'d'],
[31,2,10,9,'#','Apartment Block','apt'],[35,10,1,1,'d'],
[2,14,8,5,'#','Bar (flat above)','bar'],[5,18,1,1,'d'],
[12,14,6,5,'#','Fish Shop','shop'],[14,18,1,1,'d'],
[20,14,4,5,'#',"Eino's House",'h1'],[21,18,1,1,'d'],
[26,14,4,5,'#',"Toivo's House",'h2'],[27,18,1,1,'d'],
[32,14,4,5,'#',"Aarne's House",'h3'],[33,18,1,1,'d'],
[38,14,4,5,'#',"Kerttu's House",'h4'],[39,18,1,1,'d']]],
plant:['Fish Processing Plant',20,12,'interior',[[3,2,14,2,'g','Processing Line'],[2,6,3,2,'x','Fish Crates'],[15,6,3,2,'x','Ice Crates'],[8,6,4,1,'c','Packing Bench']]],
hq:['Communist Party HQ',20,14,'interior',[[2,2,5,2,'u','Desk'],[13,2,5,2,'u','Desk'],[6,6,8,2,'u','Meeting Table'],[2,9,2,3,'y','Files'],[16,9,2,3,'y','Archive']]],
apartments:['Apartment Block',24,14,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u'],[1,8,3,1,'y','Mailboxes'],[18,10,3,2,'x','Boxes']]],
bar:['Bar',20,12,'interior',[[3,1,10,1,'y','Bottles'],[3,3,10,1,'c','Bar Counter'],[3,7,3,2,'u','Table'],[9,7,3,2,'u','Table'],[15,7,3,2,'u','Table'],[16,2,1,1,'z','Stairs up']]],
barflat:['Bar Flat',12,8,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[10,1,1,1,'z','Stairs down']]],
fishshop:['Fish Shop',14,10,'interior',[[2,1,10,1,'y','Shelves'],[3,3,8,1,'c','Counter'],[2,6,3,2,'x','Fresh Fish'],[9,6,3,2,'x','Smoked Fish']]],
house_eino:["Eino's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,2,'x','Fishing Nets']]],
house_toivo:["Toivo's House",10,9,'interior',[[6,1,2,2,'e','Bed'],[2,3,2,2,'u','Table'],[2,1,3,1,'y','Shelf'],[8,4,1,1,'i','Stove']]],
house_aarne:["Aarne's House",10,9,'interior',[[2,5,2,2,'e','Bed'],[4,2,3,2,'u','Table'],[1,1,2,1,'i','Stove'],[7,5,2,1,'y','Shelf']]],
house_kerttu:["Kerttu's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[5,1,2,1,'i','Stove']]],
harbour:['Pula Harbour',24,14,'harbour',[[1,1,9,12,'~'],[2,5,10,4,'p'],[2,2,4,2,'b','Fishing Boat'],[2,10,3,2,'b','Fishing Boat'],[6,10,4,2,'b','Fishing Boat'],[13,4,2,2,'k','Fish Pile'],[15,2,6,3,'#','Warehouse']]],
gated:['Hope Springs Gated Community',26,18,'snow',[[3,3,7,5,'#','Villa'],[17,3,7,5,'#','Villa'],[3,12,7,4,'#','Villa'],[17,12,7,4,'#','Club']]],
privbeach:['Private Beach',18,12,'sand',[]],
privharbour:['Private Harbour',18,12,'harbour',[[1,1,8,10,'~'],[2,4,8,3,'p']]],
radio:['Radio Tower',18,14,'snow',[[7,2,4,4,'#','Radio Tower'],[2,9,4,3,'#','Transmitter Hut']]],
kalanharbour:['Kalan Harbour',24,14,'harbour',[[1,1,22,6,'~'],[4,3,12,4,'p'],[3,8,5,3,'#','Boat Shed'],[16,8,5,3,'#','Fish Market']]],
savilaharbour:['Savila Harbour',24,14,'harbour',[[14,1,9,12,'~'],[10,5,10,4,'p'],[2,2,6,3,'#','Customs Shed'],[2,9,6,3,'#','Warehouse']]]};
// Links from the sketch: "A side B side". Order of links sets the order of exits along a side.
const LINKS=['oilrig R oilhq L','oilhq R fishing L','fishing B north T','volcano B north T','north R town L','west R town L',
'mountains B east T','mountains R cathedral L','east L town R','east R farm L','palace B town T','town R colahq L','colahq R shuttle L',
'shuttle R colafactory L','colafactory B second T','south L town R','south R second L','beach R west L','beach B village T',
'west B village T','village L harbour R','town B gated T','gated R privbeach L','gated L privharbour R','village R radio L','fishing T kalanharbour B','second R savilaharbour L'];

// ---- Overview-map layout (used only by tools/build-map.js): id:[x, y, kind]. Kinds: town, road, site, nature, harbour.
const POS={oilrig:[169,236,'harbour'],oilhq:[353,239,'site'],fishing:[545,234,'town'],kalanharbour:[545,140,'harbour'],
volcano:[758,256,'nature'],mountains:[1005,256,'nature'],cathedral:[1159,256,'site'],north:[604,370,'road'],east:[956,377,'road'],
farm:[1162,380,'nature'],palace:[793,424,'site'],town:[755,487,'town'],colahq:[873,498,'site'],shuttle:[1000,498,'road'],
colafactory:[1162,484,'site'],second:[1162,632,'town'],savilaharbour:[1330,632,'harbour'],south:[961,592,'road'],west:[557,532,'road'],
beach:[334,465,'nature'],village:[367,674,'town'],harbour:[213,674,'harbour'],radio:[500,610,'site'],gated:[758,694,'town'],
privharbour:[540,700,'harbour'],privbeach:[936,712,'nature']};

// ---- Factions shown on the overview map (used only by tools/build-map.js): id:[name, colour, short badge]
const FACTIONS={communist:['Communist Party','#c0392b','COM'],democrat:['Democratic Party','#2e86c1','DEM'],royal:['Royal Family','#7d3c98','ROY'],
cola:['Kelp Cola','#2e9d57','KC'],oil:['Diversified Petroleum','#37474f','DP'],syndicate:['Crime Syndicate','#8d5524','SYN'],church:['Orthodox Church','#e0a100','CH']};
// Where each faction is based: location id -> faction id. Unlisted locations are unassigned.
const FACTION_AT={village:'communist',town:'democrat',gated:'syndicate',palace:'royal',cathedral:'church',
colahq:'cola',colafactory:'cola',shuttle:'cola',oilhq:'oil',oilrig:'oil'};

// ---- Boats between harbours. Every harbour is joined to every other by a boat landing (berth) on its dock.
const HARBOURS=['harbour','kalanharbour','savilaharbour','privharbour'];
// FERRY: id:[x, y, stepX, stepY, arriveDX, arriveDY]. One berth per other harbour (in HARBOURS order), stepping from (x,y).
const FERRY={harbour:[2,5,0,1,1,0],kalanharbour:[4,3,0,1,1,0],savilaharbour:[19,5,0,1,-1,0],privharbour:[2,4,0,1,1,0]};
// ---- Named characters standing in the world (placeholders: no dialogue yet). dir: 0 down, 1 up, 2 left, 3 right
const NPCS=[{m:'harbour',x:6,y:8,dir:0,name:'Eino',role:'Fisherman',body:'#d9a520',hair:'#b5b5b5'},
{m:'harbour',x:12,y:5,dir:3,name:'Toivo',role:'Fisherman',body:'#2f6f8f',hair:'#5a3a22'},
{m:'plant',x:6,y:4,dir:1,name:'Aarne',role:'Fishmonger',body:'#e8e8e8',hair:'#7a5a3a'},
{m:'plant',x:13,y:4,dir:1,name:'Kerttu',role:'Fishmonger',body:'#5b8fb9',hair:'#caa05a'},
{m:'apartments',x:4,y:5,dir:0,name:'Aino',role:'Communist',body:'#a33333',hair:'#6b4a2a'},
{m:'apartments',x:12,y:5,dir:0,name:'Veikko',role:'Communist',body:'#8c2f2f',hair:'#222222'},
{m:'apartments',x:20,y:5,dir:0,name:'Helmi',role:'Communist',body:'#b84a4a',hair:'#d9c9a0'},
{m:'bar',x:5,y:2,dir:0,name:'Reino',role:'Bartender',body:'#4a3a2a',hair:'#222222'}];

// ---- Building doors: [outerId, doorX, doorY, frontDX, frontDY, innerId, innerDoorX?, innerDoorY?, innerArriveDX?, innerArriveDY?]
// The inner door defaults to the bottom centre of the interior. Walk onto a door tile to go in (or out).
const DOORS=[['village',6,10,0,1,'plant'],['village',20,10,0,1,'hq'],['village',35,10,0,1,'apartments'],['village',5,18,0,1,'bar'],
['village',14,18,0,1,'fishshop'],['village',21,18,0,1,'house_eino'],['village',27,18,0,1,'house_toivo'],
['village',33,18,0,1,'house_aarne'],['village',39,18,0,1,'house_kerttu'],['bar',16,2,0,1,'barflat',10,1,0,1]];
// ---- How each building looks from outside (feature style key -> look). kind: gable, flat or tall
const BLD={
plant:{kind:'flat',wall:'#8c98a4',roof:'#5d6b78',trim:'#3d4852',win:'#a9c7da',deco:'plant'},
hq:{kind:'flat',wall:'#a8473a',roof:'#6f2d25',trim:'#f0e6d0',win:'#f2d16b',deco:'hq'},
apt:{kind:'tall',wall:'#b9b3a6',roof:'#6b6b66',trim:'#555555',win:'#7fa7c0',deco:'apt'},
bar:{kind:'gable',wall:'#5a3a26',roof:'#2f2a36',trim:'#2b1d14',win:'#f2d16b',deco:'bar'},
shop:{kind:'gable',wall:'#cfe6ee',roof:'#2e6f9a',trim:'#e8f4f8',win:'#a9d4e8',deco:'shop'},
h1:{kind:'gable',wall:'#e3c36a',roof:'#8a4b2a',trim:'#ffffff',win:'#bcd9ea',chim:.25},
h2:{kind:'gable',wall:'#7aa57a',roof:'#3b4f3b',trim:'#e8f0e0',win:'#bcd9ea',chim:.7,sh:'#2f5a2f'},
h3:{kind:'gable',wall:'#c97b5a',roof:'#555a60',trim:'#f4e2d0',win:'#bcd9ea',chim:.5,attic:1},
h4:{kind:'gable',wall:'#aebfd0',roof:'#2e5f9a',trim:'#9fb4c4',win:'#bcd9ea',chim:.8,porch:1}};
