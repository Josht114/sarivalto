// ---- Island data: id:[name,w,h,theme,[features: x,y,w,h,tile,label]]. Edit freely; layouts are placeholders.
const TH={interior:['f','W'],snow:['.','T'],sand:['s','~'],rock:['r','R'],farm:['a','T'],harbour:['.','~'],deck:['p','~']};
const L={
oilrig:['Oil Rig',16,12,'deck',[[3,3,4,3,'#','Drill Tower'],[9,8,4,2,'#','Crew Quarters']]],
oilhq:['Diversified Petroleum HQ',18,14,'snow',[[3,2,10,4,'#','Diversified Petroleum HQ'],[2,9,4,3,'#','Depot']]],
fishing:['Frostholm',26,16,'snow',[[3,3,5,4,'#','Cottage'],[9,3,3,4,'#','Cottage'],[18,3,5,4,'#','Net Shed'],[3,10,6,4,'#','Smokehouse'],[17,11,5,3,'#','Cottage']]],
north:['North Road',22,14,'snow',[[2,2,4,3,'T'],[16,9,4,3,'T']]],
volcano:['Volcano',26,16,'rock',[[9,2,8,5,'v','Crater'],[2,10,4,3,'R'],[19,10,4,3,'R']]],
mountains:['Mountains',22,16,'rock',[[3,3,4,4,'R'],[14,9,4,4,'R']]],
cathedral:['Mountain-Top Cathedral',20,16,'rock',[[5,2,10,6,'#','Cathedral']]],
east:['East Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
farm:['East Farm',22,16,'farm',[[3,3,6,4,'#','Farmhouse'],[13,3,5,3,'#','Barn']]],
palace:['Royal Palace',20,16,'snow',[[4,2,12,6,'#','Royal Palace'],[2,10,3,3,'T'],[15,10,3,3,'T']]],
town:['Kingsgrad',30,22,'snow',[[3,2,6,4,'#','Party Office'],[20,7,6,3,'#','Shops'],[3,16,6,4,'#','Houses'],[22,18,5,3,'#','Market']]],
colahq:['Kelp Cola HQ',18,14,'snow',[[3,2,10,5,'#','Kelp Cola HQ'],[3,9,4,3,'#','Parking']]],
shuttle:['Shuttle Bus',22,8,'snow',[[9,1,5,2,'#','Bus Stop']]],
colafactory:['Kelp Cola Factory',24,16,'snow',[[3,1,12,6,'#','Kelp Cola Factory'],[17,10,5,4,'#','Warehouse']]],
second:['Eastbrook',26,18,'snow',[[3,3,6,5,'#','Houses'],[17,3,6,5,'#','Houses'],[3,12,6,4,'#','Union Hall'],[17,12,6,4,'#','Shops']]],
south:['South Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
southwest:['South West Road',14,22,'snow',[[2,3,3,4,'T'],[9,13,3,4,'T']]],
west:['West Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
beach:['Beach',12,22,'sand',[[1,1,3,20,'~'],[4,1,7,2,'~'],[11,0,1,22,'T'],[4,21,7,1,'T'],[4,4,1,1,'R'],[9,17,2,1,'R'],[4,15,1,1,'R']]],
village:['Saltwick',44,24,'snow',[
[2,3,9,8,'#','Fish Processing Plant','plant'],[6,10,1,1,'d'],
[16,4,10,7,'#','Communist Party HQ','hq'],[20,10,1,1,'d'],
[31,2,10,9,'#','Apartment Block','apt'],[35,10,1,1,'d'],
[2,14,8,5,'#','Bar (flat above)','bar'],[5,18,1,1,'d'],
[12,14,6,5,'#','Fish Shop','shop'],[14,18,1,1,'d'],
[20,14,4,5,'#',"Tom's House",'h1'],[21,18,1,1,'d'],
[26,14,4,5,'#',"Sam's House",'h2'],[27,18,1,1,'d'],
[32,14,4,5,'#',"Bob's House",'h3'],[33,18,1,1,'d'],
[38,14,4,5,'#',"Kate's House",'h4'],[39,18,1,1,'d'],
[6,11,1,1,','],[20,11,1,1,','],[35,11,1,1,','],[2,19,40,1,','],[10,13,1,6,','],[36,13,1,6,',']]],
plant:['Fish Processing Plant',20,12,'interior',[[3,2,14,2,'g','Processing Line'],[2,6,3,2,'x','Fish Crates'],[15,6,3,2,'x','Ice Crates'],[8,6,4,1,'c','Packing Bench']]],
hq:['Communist Party HQ',20,14,'interior',[[2,2,5,2,'u','Desk'],[13,2,5,2,'u','Desk'],[6,6,8,2,'u','Meeting Table'],[2,9,2,3,'y','Files'],[16,9,2,3,'y','Archive']]],
apartments:['Apartment Block',24,14,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u'],[1,8,3,1,'y','Mailboxes'],[18,10,3,2,'x','Boxes']]],
bar:['Bar',20,12,'interior',[[3,1,10,1,'y','Bottles'],[3,3,10,1,'c','Bar Counter'],[3,7,3,2,'u','Table'],[9,7,3,2,'u','Table'],[15,7,3,2,'u','Table'],[16,2,1,1,'z','Stairs up']]],
barflat:['Bar Flat',12,8,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[10,1,1,1,'z','Stairs down']]],
fishshop:['Fish Shop',14,10,'interior',[[2,1,10,1,'y','Shelves'],[3,3,8,1,'c','Counter'],[2,6,3,2,'x','Fresh Fish'],[9,6,3,2,'x','Smoked Fish']]],
house_tom:["Tom's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,2,'x','Fishing Nets']]],
house_sam:["Sam's House",10,9,'interior',[[6,1,2,2,'e','Bed'],[2,3,2,2,'u','Table'],[2,1,3,1,'y','Shelf'],[8,4,1,1,'i','Stove']]],
house_bob:["Bob's House",10,9,'interior',[[2,5,2,2,'e','Bed'],[4,2,3,2,'u','Table'],[1,1,2,1,'i','Stove'],[7,5,2,1,'y','Shelf']]],
house_kate:["Kate's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[5,1,2,1,'i','Stove']]],
harbour:['West Saltwick Harbour',24,14,'harbour',[[1,1,9,12,'~'],[2,5,10,4,'p'],[2,2,4,2,'b','Fishing Boat'],[2,10,3,2,'b','Fishing Boat'],[6,10,4,2,'b','Fishing Boat'],[13,4,2,2,'k','Fish Pile'],[15,2,6,3,'#','Warehouse','whs']]],
gated:['Hope Springs Gated Community',26,18,'snow',[[3,3,7,5,'#','Villa'],[17,3,7,5,'#','Villa'],[3,12,7,4,'#','Villa'],[17,12,7,4,'#','Club']]],
privbeach:['Private Beach',18,12,'sand',[]],
privharbour:['South Private Harbour',18,12,'harbour',[[1,1,8,10,'~'],[2,4,8,3,'p']]],
barracks:['Army Barracks',32,22,'snow',[[2,3,10,6,'#','Barracks Block A','barrA'],[20,3,10,6,'#','Barracks Block B','barrB'],[12,1,3,3,'#','Guard Post','gp'],
[2,13,9,6,'#','Armoury','arm'],[21,13,9,6,'#',"Officers' HQ",'offhq']]],
radio:['Radio Tower',18,14,'snow',[[7,2,4,4,'#','Radio Tower','mast'],[2,9,4,3,'#','Transmitter Hut','hut'],[9,6,1,1,',']]],
kalanharbour:['North Frostholm Harbour',24,14,'harbour',[[1,1,22,6,'~'],[4,3,12,4,'p'],[3,8,5,3,'#','Boat Shed'],[16,8,5,3,'#','Fish Market']]],
savilaharbour:['Eastbrook Harbour',24,14,'harbour',[[14,1,9,12,'~'],[10,5,10,4,'p'],[2,2,6,3,'#','Customs Shed'],[2,9,6,3,'#','Warehouse']]]};
// Links from the sketch: "A side B side". Order of links sets the order of exits along a side.
const LINKS=['oilrig R oilhq L','oilhq R fishing L','fishing B north T','volcano B north T','north R town L','west R town L',
'mountains B east T','mountains R cathedral L','east L town R','east R farm L','palace B town T','town R colahq L','colahq R shuttle L',
'shuttle R colafactory L','colafactory B second T','south L town R','south R second L','beach R west L','beach B village T',
'west B village T','village L harbour R','town B southwest T','southwest B gated T','southwest L barracks R','gated R privbeach L','gated L privharbour R','village R radio L','fishing T kalanharbour B','second R savilaharbour L'];

// ---- Overview-map layout (used only by tools/build-map.js): id:[x, y, kind]. Kinds: town, road, site, nature, harbour.
const POS={oilrig:[169,236,'harbour'],oilhq:[353,239,'site'],fishing:[545,234,'town'],kalanharbour:[545,140,'harbour'],
volcano:[758,256,'nature'],mountains:[1005,256,'nature'],cathedral:[1159,256,'site'],north:[604,370,'road'],east:[956,377,'road'],
farm:[1162,380,'nature'],palace:[793,424,'site'],town:[755,487,'town'],colahq:[873,498,'site'],shuttle:[1000,498,'road'],
colafactory:[1162,484,'site'],second:[1162,632,'town'],savilaharbour:[1330,632,'harbour'],south:[961,592,'road'],west:[557,532,'road'],
beach:[334,465,'nature'],village:[455,668,'town'],harbour:[213,674,'harbour'],radio:[500,610,'site'],barracks:[610,600,'site'],southwest:[735,592,'road'],gated:[758,694,'town'],
privharbour:[540,700,'harbour'],privbeach:[936,712,'nature']};

// ---- Factions shown on the overview map (used only by tools/build-map.js): id:[name, colour, short badge]
const FACTIONS={communist:['Communist Party','#c0392b','COM','Allies of the Soviet Union.'],democrat:['Democratic Party','#2e86c1','DEM','A democratic political party, based in the main town.'],royal:['Royal Family','#7d3c98','ROY','The family of the island\'s previous king.'],
cola:['Kelp Cola','#2e9d57','KC','A cola company.'],oil:['Diversified Petroleum','#37474f','DP','An oil drilling company.'],syndicate:['Crime Syndicate','#8d5524','SYN','An organised crime syndicate. Its boss lives in the gated community.'],church:['Orthodox Church','#e0a100','CH','The northern orthodox church.']};
// Where each faction is based: location id -> faction id. Unlisted locations are unassigned.
const FACTION_AT={village:'communist',town:'democrat',gated:'syndicate',palace:'royal',cathedral:'church',
colahq:'cola',colafactory:'cola',shuttle:'cola',oilhq:'oil',oilrig:'oil'};

// ---- Districts: id:[name, map colour]. DISTRICT_OF puts every place on the overview map in one; interiors take their building's.
const DISTRICTS={central:['Central','#f3d9a4'],north:['North','#d9c8ea'],northeast:['North East','#c4dcef'],northwest:['North West','#c9e3c4'],
southwest:['South West','#f2c9bf'],south:['South','#eadbb6'],southeast:['South East','#c3e6dc']};
const DISTRICT_OF={palace:'central',town:'central',colahq:'central',shuttle:'southeast',
southwest:'south',barracks:'south',gated:'south',privbeach:'south',privharbour:'south',
east:'northeast',mountains:'northeast',cathedral:'northeast',farm:'northeast',
colafactory:'southeast',south:'southeast',second:'southeast',savilaharbour:'southeast',
west:'southwest',radio:'southwest',village:'southwest',beach:'southwest',harbour:'southwest',
oilhq:'northwest',oilrig:'northwest',fishing:'northwest',kalanharbour:'northwest',
volcano:'north',north:'northwest'};

// ---- Boat routes. BOATS lists, for each place with boat landings, the places you can sail to (one berth each, in this order).
// South Private Harbour is deliberately not part of the boat network: nobody can sail to it, and it has no boat landings.
const BOATS={harbour:['kalanharbour','savilaharbour','oilrig'],kalanharbour:['harbour','savilaharbour','oilrig'],
savilaharbour:['harbour','kalanharbour','oilrig'],oilrig:['harbour','kalanharbour','savilaharbour']};
// FERRY: id:[x, y, stepX, stepY, arriveDX, arriveDY]. Berths start at (x,y) and step along; you arrive one tile in.
const FERRY={harbour:[2,5,0,1,1,0],kalanharbour:[4,3,0,1,1,0],savilaharbour:[19,5,0,1,-1,0],oilrig:[1,3,0,1,1,0]};
// ---- Named characters standing in the world (placeholders: no dialogue yet). Every NPC needs:
// name, job, faction (a FACTIONS id, or 'none' if unaligned), loc (main location id) and home (the building they live in:
// an interior listed in DOORS). m, x, y: where they stand now. dir: 0 down, 1 up, 2 left, 3 right
const NPCS=[{m:'harbour',x:6,y:8,dir:0,name:'Tom',home:'house_tom',loc:'harbour',job:'Fisherman',faction:'none',body:'#d9a520',hair:'#b5b5b5',hat:'#c0392b'},
{m:'harbour',x:12,y:5,dir:3,name:'Sam',home:'house_sam',loc:'harbour',job:'Fisherman',faction:'communist',body:'#2f6f8f',hair:'#5a3a22',hat:'#3d5a40'},
{m:'plant',x:6,y:4,dir:1,name:'Bob',home:'house_bob',loc:'plant',job:'Fishmonger',faction:'none',body:'#e8e8e8',hair:'#7a5a3a'},
{m:'plant',x:13,y:4,dir:1,name:'Kate',home:'house_kate',loc:'plant',job:'Fishmonger',faction:'communist',body:'#5b8fb9',hair:'#caa05a'},
{m:'apartments',x:4,y:5,dir:0,name:'Anna',home:'apartments',loc:'apartments',job:'Union leader',faction:'communist',body:'#a33333',hair:'#6b4a2a'},
{m:'harbour',x:10,y:6,dir:2,name:'Mike',home:'apartments',loc:'harbour',job:'Fisherman',faction:'communist',body:'#8c2f2f',hair:'#222222'},
{m:'apartments',x:20,y:5,dir:0,name:'Helen',home:'apartments',loc:'apartments',job:'Party member',faction:'communist',body:'#b84a4a',hair:'#d9c9a0'},
{m:'bar',x:5,y:2,dir:0,name:'Ray',home:'barflat',loc:'bar',job:'Bartender',faction:'none',body:'#4a3a2a',hair:'#222222'}];

// ---- Building doors: [outerId, doorX, doorY, frontDX, frontDY, innerId, innerDoorX?, innerDoorY?, innerArriveDX?, innerArriveDY?]
// The inner door defaults to the bottom centre of the interior. Walk onto a door tile to go in (or out).
const DOORS=[['village',6,10,0,1,'plant'],['village',20,10,0,1,'hq'],['village',35,10,0,1,'apartments'],['village',5,18,0,1,'bar'],
['village',14,18,0,1,'fishshop'],['village',21,18,0,1,'house_tom'],['village',27,18,0,1,'house_sam'],
['village',33,18,0,1,'house_bob'],['village',39,18,0,1,'house_kate'],['bar',16,2,0,1,'barflat',10,1,0,1]];
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
barrA:{kind:'flat',wall:'#6b7a4f',roof:'#4a5438',trim:'#2f3828',win:'#a9c7da',deco:'mil'},
barrB:{kind:'flat',wall:'#8a8466',roof:'#5d5a44',trim:'#3a382a',win:'#a9c7da',deco:'mil'},
arm:{kind:'flat',wall:'#5d6068',roof:'#3a3d44',trim:'#25282e',win:'#7d8696',deco:'mil'},
offhq:{kind:'flat',wall:'#7a8a6a',roof:'#505c42',trim:'#e0dcc0',win:'#f2d16b',deco:'mil'},
gp:{kind:'gable',wall:'#6b7a4f',roof:'#3a3d44',trim:'#2f3828',win:'#f2d16b'},
whs:{kind:'gable',wall:'#7d8a96',roof:'#5b636c',trim:'#3d4650',win:'#a9c7da',deco:'whs',tex:'metal'},
mast:{kind:'mast'},
hut:{kind:'flat',wall:'#9aa0a6',roof:'#6b7178',trim:'#4a5058',win:'#a9c7da',deco:'hut'},
h4:{kind:'gable',wall:'#aebfd0',roof:'#2e5f9a',trim:'#9fb4c4',win:'#bcd9ea',chim:.8,porch:1}};

// ---- Small objects standing in the world (drawn by js/art.js): [mapId, x, y, kind]. All are solid except those in PROP_PASS.
const PROPS=[['village',12,11,'lamp'],['village',27,11,'lamp'],['village',8,13,'lamp'],['village',24,13,'lamp'],['village',40,13,'lamp'],
['village',23,11,'bench'],['village',11,9,'barrel'],['village',11,10,'crate'],['village',12,10,'crate'],['village',2,20,'barrel'],['village',3,20,'barrel'],
['village',24,17,'woodpile'],['village',30,17,'woodpile'],['village',22,20,'mailbox'],['village',28,20,'mailbox'],['village',34,20,'mailbox'],['village',40,20,'mailbox'],
['village',31,13,'phone'],['village',17,21,'snowman'],['village',15,20,'sled'],['village',5,22,'bush'],['village',26,22,'bush'],['village',42,22,'bush'],['village',42,4,'bush'],['village',41,8,'bush'],
['harbour',21,4,'barrel'],['harbour',22,4,'barrel'],['harbour',22,3,'crate'],['harbour',19,5,'crate'],['harbour',20,5,'crate'],['harbour',16,6,'lamp'],['harbour',20,8,'lamp'],
['harbour',9,5,'bollard'],['harbour',4,8,'bollard'],['harbour',9,8,'bollard'],['harbour',7,6,'rope'],['harbour',15,10,'net'],['harbour',16,10,'net'],
['harbour',18,10,'trap'],['harbour',19,11,'trap'],['harbour',21,11,'buoy'],['harbour',12,11,'anchor'],['harbour',22,1,'bush'],['harbour',11,12,'bush'],
['beach',8,8,'firepit'],['beach',9,6,'driftwood'],['beach',5,13,'driftwood'],['beach',7,9,'lifebuoy'],['beach',7,12,'sign'],['beach',4,7,'seaweed'],['beach',4,18,'seaweed'],
['beach',10,14,'shell'],['beach',8,19,'seaweed'],
['west',13,5,'signpost'],['west',15,4,'fence'],['west',16,4,'fence'],['west',17,4,'fence'],['west',18,4,'fence'],['west',19,4,'fence'],['west',20,4,'fence'],
['west',11,5,'lamp'],['west',14,7,'lamp'],['west',2,9,'bush'],['west',21,3,'bush'],['west',9,9,'bush'],['west',5,8,'rock'],['west',19,10,'rock'],['west',21,9,'woodpile'],
['radio',8,6,'warn'],['radio',12,9,'gen'],['radio',13,9,'barrel'],['radio',13,10,'barrel'],['radio',14,4,'spool'],['radio',10,8,'lamp'],['radio',15,7,'dish'],
['radio',2,3,'bush'],['radio',15,12,'bush'],['radio',6,12,'crate']];
const PROP_PASS=['sled','rope','anchor','seaweed','shell'];

// ---- Which weeks each faction has quests (see docs/quest-schedule.md)
const QUEST_WEEKS={communist:[4,8,11,14,18,19],royal:[3,7,11,13,16,19],cola:[2,6,10,13,17,19],oil:[1,5,9,14,17,19],syndicate:[3,6,9,12,15,18],democrat:[2,5,8,12,16,19],church:[1,4,7,10,15,19]};
