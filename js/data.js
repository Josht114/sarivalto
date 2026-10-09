// ---- Island data: id:[name,w,h,theme,[features: x,y,w,h,tile,label]]. Edit freely; layouts are placeholders.
const TH={snow:['.','T'],sand:['s','~'],rock:['r','R'],farm:['a','T'],harbour:['.','~'],deck:['p','~']};
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
village:['Pula Harbour Village',24,16,'snow',[[3,3,5,4,'#','Cottage'],[10,3,5,4,'#','Cottage'],[17,3,5,4,'#','Party Hall'],[15,10,5,4,'#','Cottage']]],
harbour:['Pula Harbour',24,14,'harbour',[[1,1,9,12,'~'],[2,5,10,4,'p','Dock'],[15,2,6,3,'#','Warehouse']]],
gated:['Hope Springs Gated Community',26,18,'snow',[[3,3,7,5,'#','Villa'],[17,3,7,5,'#','Villa'],[3,12,7,4,'#','Villa'],[17,12,7,4,'#','Club']]],
privbeach:['Private Beach',18,12,'sand',[]],
privharbour:['Private Harbour',18,12,'harbour',[[1,1,8,10,'~'],[2,4,8,3,'p','Private Dock']]],
radio:['Radio Tower',18,14,'snow',[[7,2,4,4,'#','Radio Tower'],[2,9,4,3,'#','Transmitter Hut']]],
kalanharbour:['Kalan Harbour',24,14,'harbour',[[1,1,22,6,'~'],[10,2,4,8,'p','Dock'],[3,8,5,3,'#','Boat Shed'],[16,8,5,3,'#','Fish Market']]],
savilaharbour:['Savila Harbour',24,14,'harbour',[[14,1,9,12,'~'],[10,5,10,4,'p','Dock'],[2,2,6,3,'#','Customs Shed'],[2,9,6,3,'#','Warehouse']]]};
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
