// ---- Island data: id:[name,w,h,theme,[features: x,y,w,h,tile,label]]. Edit freely; layouts are placeholders.
const TH={interior:['f','W'],snow:['.','T'],sand:['s','~'],rock:['r','R'],farm:['a','T'],harbour:['.','~'],deck:['p','~']};
const L={
oilrig:['Oil Rig',16,12,'deck',[[3,3,4,3,'#','Drill Tower','derrick'],[5,5,1,1,'d'],[9,8,4,2,'#','Crew Quarters','crew'],[11,9,1,1,'d']]],
oilhq:['Diversified Petroleum HQ',18,14,'snow',[[3,2,10,4,'#','Diversified Petroleum HQ','dphq'],[8,5,1,1,'d'],[2,9,4,3,'#','Depot','depot'],[3,11,1,1,'d']]],
fishing:['Frostholm',40,16,'snow',[[1,7,38,3,','],[1,14,38,1,','],[35,10,4,4,'#','House for Sale','fhouse'],[36,13,1,1,'d'],[2,1,5,6,'#','Petro Tower','petrotower'],[4,6,1,1,'d'],[9,1,5,6,'#','Hotel Aurora','hotel'],[11,6,1,1,'d'],[22,2,6,5,'#','Nordbank','nordbank'],[25,6,1,1,'d'],[29,1,6,6,'#','Casino','casino'],[32,6,1,1,'d'],[2,10,6,4,'#','Electronics','hifi'],[15,10,5,4,'#','The Midnight Note','jazz'],[17,13,1,1,'d'],[5,13,1,1,'d'],[10,10,5,4,'#','Arcade','arcade'],[12,13,1,1,'d'],[22,10,6,4,'#','Polar Burger','burger'],[24,13,1,1,'d'],[29,10,6,4,'#','Nordmart','nordmart'],[32,13,1,1,'d'],[15,1,4,6,'#','Skyline Apartments','skyapt'],[17,6,1,1,'d'],[35,1,4,6,'#','Republican Party HQ','repub'],[36,6,1,1,'d']]],
// The Valto River comes down from the north-east, passes under the bridge on the track to Frostholm, and flows out west to Lake Ilmari.
north:['North West Road',22,14,'snow',[[1,9,3,3,'T'],[16,9,4,3,'T'],[15,0,2,5,'~'],[0,3,17,2,'~']]],
// Lake Ilmari, off North West Road: the Valto River runs in from the east and out to the south, towards the beach. A travelling
// circus has pitched its big top and caravans on the east shore.
lake:['Lake Ilmari',40,26,'snow',[[3,2,12,2,'~'],[2,4,16,9,'~'],[3,13,14,3,'~'],[17,5,23,2,'~'],[7,16,2,10,'~'],[15,13,5,1,'p'],[11,10,2,1,'b','Rowboat'],[6,7,2,1,'b','Rowboat'],
[20,1,4,3,'T'],[30,1,5,3,'T'],[1,18,4,4,'T'],[11,20,3,3,'T'],[33,19,4,4,'T'],[22,22,3,2,'T'],[37,22,2,2,'T'],
[26,7,8,5,'#','Big Top','bigtop'],[30,11,1,1,'d'],[22,9,3,2,'#',"Ringmaster's Caravan",'caravan1'],[23,10,1,1,'d'],
[35,9,3,2,'#',"Performers' Caravan",'caravan2'],[36,10,1,1,'d'],[26,16,3,2,'#',"Fortune Teller's Caravan",'caravan3'],[27,17,1,1,'d']]],
// The volcano climbs in terraces (tile C: cliff face, S: stairs cut into it). You arrive on the lower slopes from the Mountains,
// take the stairs on the west side up to the middle ledge, walk east along it to the second stairs, and climb to the summit,
// where a rim runs round the crater.
volcano:['Volcano',30,26,'rock',[[1,1,28,12,'C'],[15,14,1,6,','],[8,20,16,1,','],[6,15,7,5,'#','Hot Springs Spa','spa'],[9,19,1,1,'d'],[17,17,6,3,'#','Hot Spring','hotpool'],[24,15,3,2,'#','Plunge Pool','hotpool'],[3,8,24,3,'r'],[6,1,18,5,'r'],[10,1,10,4,'v','Crater'],[6,11,2,2,'S'],[21,6,2,2,'S'],
[2,20,3,2,'R'],[24,21,4,2,'R'],[12,22,3,1,'R'],[1,14,2,3,'R'],[18,16,2,1,'R']]],
mountains:['Mountains',22,16,'rock',[[3,3,4,4,'R'],[14,9,4,4,'R'],[14,1,4,3,'~'],[12,2,2,1,'~'],[8,1,4,2,'~'],[0,1,8,1,'~']]],
monastery:['Mountain-Top Monastery',20,16,'rock',[[16,2,3,4,'a'],[5,2,10,6,'#','Monastery Church','church'],[10,7,1,1,'d'],[2,10,9,4,'#',"Monks' Quarters",'monkq'],[6,13,1,1,'d'],[14,10,4,4,'#',"Father Thyme's House",'rectory'],[15,13,1,1,'d']]],
east:['North East Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
// East Farm: the yard with the farmhouse, the barn and the Old Barn, and the field below it. The Old Barn's front is padlocked;
// its way in is a loose board in its back wall (the door on its top row, reached from behind), up a faint trodden trail (;)
farm:['East Farm',30,16,'farm',[[1,1,28,6,'.'],[21,2,1,5,';'],[22,2,4,1,';'],[3,3,6,4,'#','Farmhouse','farmhouse'],[6,6,1,1,'d'],[13,3,5,3,'#','Barn','barn'],[14,5,1,1,'d'],[22,3,6,4,'#','Old Barn','oldbarn'],[25,3,1,1,'d']]],
palace:['Royal Palace',24,18,'snow',[[4,1,16,6,'#','Royal Palace','palace'],[12,6,1,1,'d'],[5,6,1,1,'d'],[12,7,1,2,','],[5,7,7,1,','],[3,12,19,1,','],[5,10,1,2,','],[18,10,1,2,','],
[4,8,3,2,'#','Fountain','fountain'],[17,8,3,2,'#','Fountain','fountain'],[1,14,3,3,'T'],[20,14,3,3,'T']]],
town:['Kingsgrad',52,38,'snow',[[1,35,50,1,','],[8,30,7,5,'#','Pizzeria','pizzeria'],[11,34,1,1,'d'],[30,31,3,2,'#','Fountain','fountain'],[1,30,3,3,'T'],[18,30,3,2,'T'],[37,30,3,3,'T'],[43,31,4,2,'T'],[8,5,6,5,'#','Civil Service Bureau','civilservice'],[11,9,1,1,'d'],[15,5,5,5,'#','Gun Shop','gunshop'],[17,9,1,1,'d'],[21,5,5,5,'#','Bar','citybar'],[23,9,1,1,'d'],[8,13,8,7,'#','Supermarket','supermarket'],[11,19,1,1,'d'],[17,15,4,5,'#','Tailor','tailor'],[18,19,1,1,'d'],[22,15,4,5,'#','Book Shop','bookshop'],[23,19,1,1,'d'],[8,23,4,5,'#',"Frank's House",'th1'],[9,27,1,1,'d'],[13,23,4,5,'#',"Lisa's House",'th2'],[14,27,1,1,'d'],[18,23,4,5,'#',"Eddie's House",'th3'],[19,27,1,1,'d'],[22,23,4,5,'#',"Grace's House",'th4'],[23,27,1,1,'d'],[28,1,8,6,'#','Cinema','cinema'],[31,6,1,1,'d'],[37,2,5,5,'#','Estate Agent','estate'],[39,6,1,1,'d'],[28,10,5,5,'#','Fishing Shop','fishingshop'],[30,14,1,1,'d'],[34,10,4,5,'#','House for Sale','th5'],[35,14,1,1,'d'],[39,10,4,5,'#',"Vince's House",'th2'],[40,14,1,1,'d'],[28,17,4,5,'#',"Mary's House",'th4'],[29,21,1,1,'d'],[33,17,4,5,'#',"Jack's House",'th1'],[34,21,1,1,'d'],[38,17,4,5,'#',"Sally's House",'th3'],[39,21,1,1,'d'],[30,28,1,1,'d','Sewer Entrance','manhole'],[40,27,4,2,'T'],[27,24,25,1,'l'],[27,25,18,1,'P'],[34,26,5,2,'#','Tram Stop','tramshelter'],[9,1,8,4,'#','Kingsgrad Apartments','kgapt'],[14,4,1,1,'d'],[18,1,3,2,'T'],[1,1,2,3,'T'],[4,2,2,2,'T'],[1,6,2,2,'T'],[2,13,2,3,'T'],[5,16,1,2,'T'],[1,24,3,2,'T'],[4,27,2,1,'T'],[45,1,6,6,'#','Police Station','police'],[48,6,1,1,'d'],[45,9,6,5,'#',"Doctor's Office",'doctor'],[48,13,1,1,'d'],[48,17,3,3,'T'],[46,26,4,2,'T']]],
colahq:['Kelp Cola HQ',18,14,'snow',[[3,1,10,5,'#','Kelp Cola HQ','kchq'],[8,5,1,1,'d'],[3,9,2,2,'#','Newsstand','newsstand'],[8,9,2,2,'#','Hot Dog Cart','hotdog'],[0,12,18,1,'l']]],
tramstop:['Tram Stop',22,14,'snow',[[0,3,22,1,'l'],[3,4,16,1,'P'],[9,5,5,2,'#','Tram Stop','tramshelter']]],
forest:['Pine Forest',26,18,'snow',[[1,1,5,4,'T'],[8,2,3,3,'T'],[17,1,4,3,'T'],[22,4,3,5,'T'],[2,7,4,3,'T'],[15,6,4,2,'T'],[8,7,4,3,'~'],[7,12,5,3,'T'],[18,11,5,4,'T'],[1,13,3,3,'T'],[13,14,2,2,'T'],[20,9,1,1,'R'],[4,11,1,1,'R']]],
colafactory:['Kelp Cola Factory',26,20,'snow',[[2,1,12,6,'#','Kelp Cola Factory','kcfac'],[8,6,1,1,'d'],[17,1,6,4,'#','Warehouse','kcwhs'],[18,4,1,1,'d'],[3,12,4,2,'#','Food Van','foodvan'],[0,15,26,1,'l'],[15,16,9,1,'P'],[17,17,5,2,'#','Tram Stop','tramshelter']]],
// Eastbrook: a timber town gone hip. Upper Street (row 10), the main street (row 15) and Tram Street (row 20), joined by Alder Lane
// (column 25); between the main street and Tram Street are the food-cart plaza and a little park, and the tram runs along the bottom.
second:['Eastbrook',50,30,'snow',[[2,16,11,4,','],[1,15,48,1,','],[26,10,23,1,','],[26,20,23,1,','],[25,21,1,1,','],[0,22,50,1,'l'],[19,23,12,1,'P'],[23,24,5,2,'#','Tram Stop','tramshelter'],
[2,2,6,7,'#','Timber Lofts','eblofts'],[4,8,1,1,'d'],[10,4,4,5,'#',"Pirkko's House",'eb1'],[11,8,1,1,'d'],[16,2,8,7,'#','Kelp Cola Museum','kcmuseum'],[19,8,1,1,'d'],
[27,4,6,5,'#','Houses','eb2'],[28,8,1,1,'d'],[31,8,1,1,'d'],[35,3,7,6,'#','Community Centre','community'],[38,8,1,1,'d'],
[1,11,6,4,'#','Cedar Grill','cedargrill'],[4,14,1,1,'d'],[8,11,4,4,'#','Coffee Roasters','coffee'],[9,14,1,1,'d'],[13,11,6,4,'#','Record Shop','records'],[15,14,1,1,'d'],
[20,11,4,4,'#','Tattoo Shop','tattoo'],[21,14,1,1,'d'],[27,11,6,4,'#','Clothes Shop','clothes'],[29,14,1,1,'d'],[34,11,6,4,'#','Eastbrook Gazette','gazette'],[36,14,1,1,'d'],
[41,11,7,4,'#','Timberline Tavern','tavern'],[44,14,1,1,'d'],[5,16,2,2,'#','Hot Dog Cart','ebhotdog'],
[1,1,1,1,'T'],[9,1,2,2,'T'],[14,1,1,2,'T'],[44,1,2,3,'T'],[47,1,2,2,'T'],[47,4,2,3,'T'],[43,4,4,5,'#','House for Sale','eb3'],[44,8,1,1,'d'],[34,1,2,1,'T'],[47,16,2,3,'T'],[44,17,1,2,'T'],[29,18,1,1,'T'],
[1,24,4,4,'T'],[6,26,3,2,'T'],[12,26,2,2,'T'],[33,24,3,3,'T'],[40,25,4,3,'T'],[46,24,3,4,'T'],[16,27,2,1,'T']]],
south:['South East Road',24,12,'snow',[[3,2,4,2,'T'],[16,7,4,2,'T'],[0,10,24,1,'l']]],
southwest:['South Road',14,22,'snow',[[2,3,3,4,'T'],[9,13,3,4,'T']]],
west:['South West Road',24,12,'snow',[[3,2,4,2,'T'],[16,8,4,2,'T']]],
beach:['Beach',12,22,'sand',[[1,1,3,20,'~'],[4,1,7,2,'~'],[11,0,1,22,'T'],[4,21,7,1,'T'],[4,4,1,1,'R'],[9,17,2,1,'R'],[4,15,1,1,'R'],[8,4,3,2,'#',"Pat's Camp",'tent'],[9,5,1,1,'d'],[4,15,8,2,'~']]],
village:['Saltwick',44,30,'snow',[
[2,3,9,8,'#','Fish Processing Plant','plant'],[6,10,1,1,'d'],
[16,4,10,7,'#','Communist Party HQ','hq'],[26,9,2,2,'#','Newsstand','swnews'],[20,10,1,1,'d'],
[31,2,10,9,'#','Apartment Block','apt'],[35,10,1,1,'d'],
[2,14,8,5,'#','Bar (flat above)','bar'],[5,18,1,1,'d'],
[12,14,6,5,'#','Fish Shop','shop'],[14,18,1,1,'d'],
[18,22,7,5,'#','Harbour Outfitters','outfitters'],[21,26,1,1,'d'],[17,20,1,8,','],[17,27,5,1,','],
[20,14,4,5,'#',"Tom's House",'h1'],[21,18,1,1,'d'],
[26,14,4,5,'#',"Sam's House",'h2'],[27,18,1,1,'d'],
[32,14,4,5,'#','House for Sale','h3'],[33,18,1,1,'d'],
[38,14,4,5,'#',"Kate's House",'h4'],[39,18,1,1,'d'],
[6,11,1,1,','],[20,11,1,1,','],[35,11,1,1,','],[2,19,40,1,','],[10,13,1,6,','],[36,13,1,6,',']]],
plant:['Fish Processing Plant',20,12,'interior',[[3,2,14,2,'g','Processing Line'],[2,6,3,2,'x','Fish Crates'],[15,6,3,2,'x','Ice Crates'],[8,6,4,1,'c','Packing Bench']]],
hq:['Communist Party HQ',20,14,'interior',[[2,2,5,2,'u','Desk'],[13,2,5,2,'u','Desk'],[6,6,8,2,'u','Meeting Table'],[2,9,2,3,'y','Files'],[16,9,2,3,'y','Archive']]],
// Apartment blocks with five flats: three along the top, a corridor, then two more either side of the entrance passage.
apartments:['Apartment Block',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u'],[1,8,3,1,'y','Mailboxes'],
[2,13,2,2,'e','Bed'],[6,15,2,1,'u'],[1,17,2,1,'x','Boxes'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u'],[21,17,1,1,'i','Stove'],[22,8,1,1,'z','Stairs up']]],
bar:['Bar',20,12,'interior',[[3,1,10,1,'y','Bottles'],[3,3,10,1,'c','Bar Counter'],[3,7,3,2,'u','Table'],[9,7,3,2,'u','Table'],[15,7,3,2,'u','Table'],[16,2,1,1,'z','Stairs up']]],
barflat:['Bar Flat',12,8,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[10,2,1,1,'z','Stairs down']]],
// Harbour Outfitters in Saltwick: clothes for the boats and the cold
outfitters_in:['Harbour Outfitters',16,10,'interior',[[1,1,5,1,'y','Clothes Rail'],[9,1,5,1,'y','Clothes Rail'],[1,4,1,1,'n','Mannequin'],[14,4,1,1,'n','Mannequin'],[4,4,3,1,'y','Clothes Rail'],[9,4,2,1,'y','Cloth'],[10,7,4,1,'c','Counter'],[1,7,3,1,'y','Cloth']]],
fishshop:['Fish Shop',14,10,'interior',[[2,1,10,1,'y','Shelves'],[3,3,8,1,'c','Counter'],[2,6,3,2,'x','Fresh Fish'],[9,6,3,2,'x','Smoked Fish']]],
house_tom:["Tom's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,2,'x','Fishing Nets']]],
house_sam:["Sam's House",10,9,'interior',[[6,1,2,2,'e','Bed'],[2,3,2,2,'u','Table'],[2,1,3,1,'y','Shelf'],[8,4,1,1,'i','Stove']]],
house_bob:['House for Sale',10,9,'interior',[[2,5,2,2,'x','Boxes'],[6,2,2,1,'x','Boxes'],[1,1,2,1,'i','Stove']]],
// The Mill: the Eastbrook Lumber Company's mill and its log yard, on the track from the Pine Forest to Eastbrook
millroad:['Mill',30,14,'snow',[[9,1,10,5,'#','Lumber Mill','mill'],[10,5,1,1,'d'],[1,1,2,2,'T'],[21,1,2,1,'T'],[27,1,2,3,'T'],
[1,10,3,3,'T'],[8,11,2,2,'T'],[14,10,4,3,'T'],[22,10,3,3,'T'],[27,11,2,2,'T']]],
// ---- The Royal Palace's rooms. The Grand Hall is the hub: doors in its back wall lead to the Royal Apartments, the Throne Room and
// the Library, and doors in its side walls to the Dining Room and the Royal Chapel. The Dining Room leads on to the Kitchen, which
// leads to the Servants' Quarters and down to the Wine Cellar; a secret bookcase in the Library opens on the Royal Vault.
palacehall:['Grand Hall',24,12,'interior',[[1,1,3,1,'y','Shelf'],[8,1,2,1,'y','Shelf'],[14,1,2,1,'y','Shelf'],[20,1,3,1,'y','Shelf'],[2,9,2,1,'u','Side Table'],[20,9,2,1,'u','Side Table']]],
throne:['Throne Room',20,12,'interior',[[9,1,2,1,'t','Throne']]],
royalrooms:['Royal Apartments',24,12,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,4,1,'W'],[9,7,3,1,'W'],[13,7,4,1,'W'],[17,7,3,1,'W'],[21,7,2,1,'W'],
[2,1,2,2,'e','Bed'],[5,1,2,1,'y','Shelf'],[5,4,2,2,'u','Desk'],[10,1,2,2,'e','Bed'],[13,1,2,1,'y','Bookcase'],[13,4,2,2,'u','Desk'],[18,1,2,2,'e','Bed'],[21,1,2,1,'y','Shelf'],[21,4,1,1,'n','Mannequin']]],
dining:['Dining Room',20,12,'interior',[[4,4,12,3,'u','Dining Table'],[2,1,4,1,'y','Bottles'],[14,1,4,1,'y','Shelf']]],
kitchen:['Palace Kitchen',18,12,'interior',[[1,1,2,1,'i','Stove'],[4,1,2,1,'i','Stove'],[8,1,4,1,'y','Pantry Shelves'],[15,2,1,1,'z','Stairs down'],
[5,5,6,2,'u','Kitchen Table'],[1,9,2,2,'x','Fresh Fish'],[13,9,2,2,'x','Boxes']]],
winecellar:['Wine Cellar',18,10,'interior',[[1,1,5,1,'y','Wine Bottles'],[7,1,5,1,'y','Wine Bottles'],[1,5,3,2,'x','Wine Barrels'],[6,5,3,2,'x','Wine Barrels'],[11,5,3,2,'x','Wine Barrels'],[16,7,1,1,'z','Stairs up']]],
library:['Royal Library',20,12,'interior',[[1,1,4,1,'y','Bookcase'],[6,1,4,1,'y','Bookcase'],[11,1,4,1,'y','Bookcase'],[16,1,2,1,'y','Bookcase'],[18,1,1,1,'q'],
[2,4,5,1,'y','Bookcase'],[13,4,5,1,'y','Bookcase'],[2,7,5,1,'y','Bookcase'],[13,7,5,1,'y','Bookcase'],[8,5,4,2,'u','Reading Table']]],
vault:['Royal Vault',14,9,'interior',[[1,1,3,2,'x','Gold Bars'],[10,1,3,2,'x','Gold Bars'],[5,1,4,1,'y','Crown Jewels'],[1,5,2,2,'x','Treasure Chests'],[11,5,2,2,'x','Treasure Chests']]],
villa_phil:["Phil's Villa",16,10,'interior',[[2,1,2,2,'e','Bed'],[6,1,2,1,'i','Fireplace'],[10,1,4,1,'y','Bookcase'],[6,4,3,2,'u','Desk'],[11,5,3,2,'u','Table']]],
villa_dario:["Dario's Villa",16,10,'interior',[[12,1,2,2,'e','Bed'],[2,1,4,1,'y','Bookcase'],[7,1,2,1,'i','Fireplace'],[3,5,3,2,'u','Desk'],[9,5,3,2,'u','Table']]],
// The Club in Hope Springs: a bar along the back wall, Gustavo's table by the fire, and card tables for the members.
clubroom:['The Club',20,12,'interior',[[13,4,5,2,'u','Meeting Table'],[1,1,6,1,'y','Bottles'],[1,3,6,1,'c','Bar Counter'],[9,1,2,1,'i','Fireplace'],[13,1,6,1,'y','Bookcase'],
[2,7,3,2,'u','Card Table'],[8,7,3,2,'u','Card Table'],[14,8,3,2,'u','Table']]],
villa_gustavo:["Gustavo's Villa",16,10,'interior',[[2,1,2,2,'e','Bed'],[6,1,6,1,'y','Bottles'],[13,1,2,1,'i','Fireplace'],[6,4,4,2,'u','Meeting Table'],[12,6,2,2,'x','Crates']]],
house_thyme:["Father Thyme's House",10,9,'interior',[[2,1,2,2,'e','Bed'],[5,1,3,1,'y','Bookcase'],[6,4,2,2,'u','Table'],[2,5,1,1,'i','Stove']]],
shack_hekki:["Hekki's Shack",10,7,'interior',[[1,1,2,2,'e','Bed'],[4,1,3,1,'y','Radio Set'],[4,4,2,1,'u','Table'],[8,1,1,1,'q']]],
// The Hidden Radio Room, with a small living space behind a partition on the right (through the doorway at x14, y5)
hekki_room:['Hidden Radio Room',22,9,'interior',[[1,1,4,1,'y','Radio Equipment'],[5,1,4,1,'y','Big Screen'],[9,1,4,1,'y','Radio Equipment'],[1,4,2,1,'y','Tape Recorder'],[5,4,4,2,'u','Desk'],[11,4,2,2,'y','Computer'],[11,7,2,1,'x','Boxes'],[1,7,4,1,'y','Screens'],
[14,1,1,4,'W'],[14,6,1,2,'W'],[16,1,2,2,'e','Bed'],[18,1,1,1,'y','Wardrobe'],[19,1,2,1,'i','Stove'],[16,5,2,1,'u','Table'],[19,4,2,1,'y','Supplies'],[19,7,2,1,'x','Tins']]],
// CIA Headquarters at Langley, Virginia, where the game's story begins: not on the island, and reached only from the Jump to list.
// The lobby has the Agency's seal set in its granite floor, the Memorial Wall of stars between two flags with the Book of Honor in
// its case beneath, a statue, benches, the security desk, the stairs up to the office and down to the basement, and doors to the
// Cover Story Department (left) and the cafeteria (right)
langley:['CIA Headquarters',22,12,'interior',[[1,1,1,1,'x','Plant'],[20,1,1,1,'x','Plant'],[7,1,1,1,'y','Flag'],[14,1,1,1,'y','Flag'],[10,1,2,1,'y','Book of Honor'],[2,4,1,1,'x','Statue'],[1,9,3,1,'x','Bench'],[18,1,1,1,'z','Stairs up'],[4,3,1,1,'z','Stairs down'],[15,8,5,1,'c','Security Desk']]],
// the Cover Story Department, off the left of the lobby: where an officer is given an alias and the look to go with it. Rails
// of clothes, a wig stand, passports, a dressing mirror, two mannequins and Doris's desk
langley_cover:['Cover Story Department',16,10,'interior',[[1,1,4,1,'y','Costume Rail'],[6,1,2,1,'y','Wig Stand'],[9,1,2,1,'y','Passports'],[12,1,2,1,'y','Dressing Mirror'],[2,5,3,2,'u','Desk'],[9,5,1,1,'n','Mannequin'],[11,5,1,1,'n','Mannequin']]],
// the cafeteria, off the right of the lobby: the serving counter, a drinks fridge, a cigarette machine and tables
langley_cafe:['Cafeteria',20,12,'interior',[[1,1,6,1,'c','Serving Counter'],[9,1,2,1,'y','Fridge'],[13,1,2,1,'y','Cigarette Machine'],[3,5,3,2,'u','Table'],[9,5,3,2,'u','Table'],[15,5,3,2,'u','Table'],[3,9,3,2,'u','Table'],[9,9,3,2,'u','Table'],[15,9,3,2,'u','Table']]],
// George's office, off the Upstairs Corridor along from Chuck's: the jobs that don't go in the reports. A gun rack, locked
// files, wiretap gear, forged papers, a shredder, a burn bag, a bag of cash and a safe
langley_george:["George's Office",14,9,'interior',[[1,1,3,1,'y','Gun Rack'],[5,1,2,1,'y','Locked Files'],[8,1,2,1,'y','Wiretap Gear'],[11,1,2,1,'y','Forged Papers'],[5,4,4,2,'u','Desk'],[1,6,1,1,'x','Shredder'],[2,6,1,1,'x','Burn Bag'],[11,6,1,1,'x','Cash Bag'],[12,6,1,1,'x','Safe']]],
// the basement under the lobby: an interrogation room. A bare table and two chairs, a one-way mirror, recording gear and files
langley_basement:['Interrogation Room',16,10,'interior',[[1,1,3,1,'y','Recording Gear'],[5,1,4,1,'y','One-way Mirror'],[11,1,2,1,'y','Files'],[6,4,3,2,'u','Interrogation Table'],[14,7,1,1,'z','Stairs up']]],
// the corridor at the top of the stairs at Langley: Chuck's office and George's office off it, a water cooler and a plant
langley_hall:['Upstairs Corridor',22,6,'interior',[[1,1,1,1,'x','Plant'],[9,1,1,1,'x','Water Cooler'],[19,3,1,1,'z','Stairs down']]],
// the office upstairs at Langley where you are briefed (off the Upstairs Corridor) before you leave for the island: the officer's desk, files and a safe, a
// meeting table, a leather sofa, the Agency's seal and a map of the Baltic on the wall
langley_office:['Langley Office',18,10,'interior',[[1,1,4,1,'y','Files'],[13,1,1,1,'x','Safe'],[7,2,4,2,'u','Desk'],[2,6,4,2,'u','Meeting Table'],[11,7,3,1,'x','Sofa'],[16,6,1,1,'x','Plant']]],
transhut:['Transmitter Hut',16,10,'interior',[[1,1,5,1,'y','Transmitter'],[7,1,3,1,'y','Records'],[12,1,3,1,'y','Tape Recorder'],[3,4,6,2,'u','Mixing Desk'],[11,4,3,2,'u','Microphone Table'],[1,7,2,2,'x','Boxes']]],
tent_pat:["Pat's Camp",8,6,'interior',[[1,1,2,2,'e','Bedroll'],[5,1,2,1,'x','Boxes'],[5,3,1,1,'i','Camp Stove']]],
gunshop:['Gun Shop',12,8,'interior',[[2,1,8,1,'y','Gun Rack'],[3,3,6,1,'c','Counter'],[1,5,2,2,'x','Ammo Crates'],[9,5,2,2,'x','Ammo Crates']]],
supermarket:['Supermarket',18,12,'interior',[[1,1,6,1,'y','Fridge'],[8,1,9,1,'y','Shelves'],[2,4,6,1,'y','Shelves'],[10,4,6,1,'y','Shelves'],[2,7,6,1,'y','Shelves'],[10,7,6,1,'y','Shelves'],[12,9,4,1,'c','Checkout']]],
citybar:['City Bar',16,10,'interior',[[2,1,8,1,'y','Bottles'],[2,3,8,1,'c','Bar Counter'],[3,6,3,2,'u','Table'],[10,6,3,2,'u','Table'],[13,1,2,1,'i','Fireplace']]],
tailor:["Tailor's Shop",12,9,'interior',[[1,1,4,1,'y','Cloth'],[6,1,5,1,'y','Clothes Rail'],[3,3,5,1,'c','Counter'],[1,5,1,1,'n','Mannequin'],[10,5,1,1,'n','Mannequin'],[10,3,1,1,'n','Mannequin']]],
casino:['Casino',20,12,'interior',[[2,1,7,1,'y','Slot Machines'],[11,1,7,1,'y','Slot Machines'],[3,4,4,2,'u','Card Table'],[13,4,4,2,'u','Roulette'],[3,8,4,2,'u','Poker Table'],[13,8,3,1,'c','Cashier']]],
bookshop:['Book Shop',12,9,'interior',[[1,1,4,1,'y','Bookcase'],[7,1,4,1,'y','Bookcase'],[2,4,3,1,'y','Bookcase'],[7,4,3,1,'y','Bookcase'],[8,6,3,1,'c','Counter'],[2,6,2,2,'u','Reading Table']]],
fishingshop:['Fishing Shop',12,9,'interior',[[1,1,5,1,'y','Fishing Rods'],[7,1,4,1,'y','Tackle'],[3,3,6,1,'c','Counter'],[1,5,2,2,'x','Bait'],[9,5,2,2,'x','Fishing Nets']]],
estateagent:['Estate Agent',12,8,'interior',[[1,1,4,1,'y','Files'],[9,1,2,1,'y','Shelf'],[2,3,3,2,'u','Desk'],[7,3,3,2,'u','Desk']]],
sewers:['Sewers',24,12,'interior',[[1,5,22,2,'~'],[6,5,1,2,'f'],[17,5,1,2,'f'],[2,1,2,1,'x','Junk'],[18,8,2,2,'x','Junk'],[9,1,4,1,'y','Pipes']]],
house_frank:["Frank's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,1,'y','Shelf']]],
house_lisa:["Lisa's House",10,9,'interior',[[6,1,2,2,'e','Bed'],[2,3,2,2,'u','Table'],[2,1,3,1,'y','Shelf'],[8,4,1,1,'i','Stove']]],
house_eddie:["Eddie's House",10,9,'interior',[[2,5,2,2,'e','Bed'],[4,2,3,2,'u','Table'],[1,1,2,1,'i','Stove'],[7,5,2,1,'y','Shelf']]],
house_grace:["Grace's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[5,1,2,1,'i','Stove']]],
house_vince:["Vince's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,1,'y','Shelf']]],
house_mary:["Mary's House",10,9,'interior',[[6,1,2,2,'e','Bed'],[2,3,2,2,'u','Table'],[2,1,3,1,'y','Bookcase'],[8,4,1,1,'i','Stove']]],
house_jack:["Jack's House",10,9,'interior',[[2,5,2,2,'e','Bed'],[4,2,3,2,'u','Table'],[1,1,2,1,'i','Stove'],[7,5,2,2,'x','Fishing Nets']]],
house_sally:["Sally's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[5,1,2,1,'i','Stove']]],
house_forsale:['House for Sale',10,9,'interior',[[2,2,2,2,'x','Boxes'],[6,5,2,1,'x','Boxes']]],
// the other towns' empty homes for sale (Saltwick's is Bob's old house, house_bob)
house_forsale_eb:['House for Sale',10,9,'interior',[[6,2,2,2,'x','Boxes'],[2,5,2,1,'x','Boxes'],[7,1,2,1,'i','Stove']]],
house_forsale_fh:['House for Sale',10,9,'interior',[[2,2,3,1,'x','Boxes'],[7,5,2,1,'x','Boxes']]],
villa_forsale:['Villa for Sale',16,10,'interior',[[2,2,2,2,'x','Boxes'],[11,1,3,2,'x','Boxes'],[6,1,2,1,'i','Fireplace'],[7,5,2,1,'x','Boxes']]],
servants:["Servants' Quarters",18,10,'interior',[[1,1,2,2,'e','Bed'],[4,1,2,2,'e','Bed'],[7,1,2,2,'e','Bed'],[10,1,2,2,'e','Bed'],[13,1,2,1,'y','Shelf'],[16,1,1,1,'i','Stove'],
[6,5,5,2,'u','Dining Table'],[1,6,2,2,'x','Laundry'],[14,5,3,1,'y','Bookcase']]],
chapel:['Royal Chapel',16,12,'interior',[[6,1,3,1,'t','Altar'],[14,2,1,1,'z','Stairs down'],[2,4,5,1,'u','Pew'],[9,4,5,1,'u','Pew'],[2,6,5,1,'u','Pew'],[9,6,5,1,'u','Pew'],[2,8,5,1,'u','Pew'],[9,8,5,1,'u','Pew']]],
crypt:['Royal Crypt',16,10,'interior',[[7,1,2,3,'x',"The Late King's Tomb"],[2,2,2,3,'x','Royal Tomb'],[12,2,2,3,'x','Royal Tomb'],[2,6,2,2,'x','Royal Tomb'],[5,6,2,2,'x','Royal Tomb'],[14,7,1,1,'z','Stairs up']]],
// The inside of the tram (tile o: a seat). You get in from a tram stop; walking out of its door puts you back on that stop's platform.
tram:['Tram',20,7,'interior',[[2,1,3,1,'o'],[6,1,3,1,'o'],[11,1,3,1,'o'],[15,1,2,1,'o'],[18,1,1,2,'y','Route Map'],
[2,5,3,1,'o'],[6,5,3,1,'o'],[12,5,3,1,'o'],[16,5,2,1,'o'],[10,6,1,1,'m']]],
house_pekka:["Pirkko's House",10,9,'interior',[[2,2,2,2,'e','Bed'],[6,3,2,2,'u','Table'],[7,1,2,1,'i','Stove'],[2,5,3,1,'y','Shelf']]],
// The Monks' Quarters: the kitchen (left), the refectory you come in to (middle) and the dormitory (right), joined by doorways.
monks:["Monks' Quarters",27,10,'interior',[[9,1,1,3,'W'],[9,5,1,4,'W'],[17,1,1,3,'W'],[17,5,1,4,'W'],
[1,1,2,1,'i','Stove'],[4,1,4,1,'y','Pantry Shelves'],[3,4,3,2,'u','Kitchen Table'],[1,7,2,1,'x','Boxes'],
[11,3,5,2,'u','Refectory Table'],[10,6,2,2,'u','Desk'],[15,1,2,1,'y','Bookcase'],
[18,1,2,2,'e','Bed'],[21,1,2,2,'e','Bed'],[24,1,2,2,'e','Bed'],[18,6,2,2,'e','Bed'],[21,6,2,2,'e','Bed']]],
monchurch:['Monastery Church',22,14,'interior',[[10,1,3,1,'t','Altar'],[1,1,2,1,'y','Bookcase'],[19,1,2,1,'y','Bookcase'],
[2,5,7,1,'u','Pew'],[13,5,7,1,'u','Pew'],[2,7,7,1,'u','Pew'],[13,7,7,1,'u','Pew'],[2,9,7,1,'u','Pew'],[13,9,7,1,'u','Pew']]],
burgerbar:['Polar Burger',16,14,'interior',[[1,5,3,1,'i','Grill'],[5,5,2,1,'i','Fryer'],[8,5,4,1,'y','Menu Board'],[13,5,2,1,'y','Fridge'],[2,7,10,1,'c','Counter'],[2,10,3,2,'u','Table'],[11,10,3,2,'u','Table'],[1,4,6,1,'W'],[8,4,7,1,'W'],[1,1,2,1,'i','Stove'],[4,1,2,1,'i','Stove'],[7,1,3,1,'y','Pantry Shelves'],[11,1,2,1,'x','Sink'],[13,1,2,1,'y','Fridge'],[11,3,3,1,'u','Kitchen Table']]],
// The Eastbrook Gazette: reporters' desks at the front, the editor's desk at the back, and the paper's archive along the wall.
newsroom:['Eastbrook Gazette',18,10,'interior',[[1,1,4,1,'y','Archive'],[6,1,5,1,'y','Bookcase'],[13,1,4,1,'y','Files'],[2,4,3,2,'u','Desk'],[7,4,3,2,'u','Desk'],[13,4,3,2,'u',"Editor's Desk"],
[1,7,2,2,'x','Newspaper Bundles'],[15,7,2,2,'x','Newspaper Bundles'],[11,7,3,2,'x','Printing Press']]],
house_henrik:["Henrik's House",10,9,'interior',[[2,1,2,2,'e','Bed'],[5,1,3,1,'y','Bookcase'],[6,4,2,2,'u','Desk'],[2,5,1,1,'i','Stove']]],
house_nora:["Nora's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Desk'],[2,5,3,1,'y','Bookcase'],[5,1,2,1,'i','Stove']]],
house_kate:["Kate's House",10,9,'interior',[[7,2,2,2,'e','Bed'],[2,2,2,2,'u','Table'],[2,5,3,1,'y','Shelf'],[5,1,2,1,'i','Stove']]],
// Frostholm's shops and Eastbrook's coffee roaster and record shop
electro:['Electronics',12,9,'interior',[[1,1,4,1,'y','TV Screens'],[6,1,5,1,'y','Shelves'],[3,3,6,1,'c','Counter'],[1,5,2,2,'x','Boxes'],[9,5,2,2,'x','Boxes']]],
arcadein:['Arcade',16,10,'interior',[[1,1,6,1,'y','Arcade Screens'],[9,1,6,1,'y','Arcade Screens'],[2,5,3,1,'y','Arcade Screens'],[11,6,4,1,'c','Change Counter']]],
mart:['Nordmart',18,12,'interior',[[1,1,6,1,'y','Fridge'],[8,1,9,1,'y','Shelves'],[2,4,6,1,'y','Shelves'],[10,4,6,1,'y','Shelves'],[2,7,6,1,'y','Shelves'],[10,7,6,1,'y','Shelves'],[12,9,4,1,'c','Checkout']]],
cinemain:['Cinema',18,12,'interior',[[2,3,6,1,'o'],[10,3,6,1,'o'],[2,5,6,1,'o'],[10,5,6,1,'o'],[2,7,6,1,'o'],[10,7,6,1,'o'],[1,9,3,1,'y','Shelves'],[12,9,4,1,'c','Ticket Counter']]],
cafe:['Coffee Roasters',12,13,'interior',[[1,5,4,1,'y','Shelves'],[6,5,2,1,'i','Roaster'],[2,7,6,1,'c','Counter'],[2,10,2,1,'u','Table'],[7,10,3,1,'u','Table'],[1,4,4,1,'W'],[6,4,5,1,'W'],[1,1,2,1,'i','Oven'],[4,1,3,1,'y','Pantry Shelves'],[8,1,2,1,'x','Sink'],[10,1,1,1,'y','Fridge'],[8,3,3,1,'u','Kitchen Table']]],
tattoo:['Tattoo Shop',12,9,'interior',[[1,1,3,1,'y','Inks'],[8,1,3,1,'y','Shelves'],[2,3,2,2,'e','Tattoo Bench'],[7,3,2,2,'e','Tattoo Bench'],[8,6,3,1,'c','Counter']]],
// Kingsgrad Police Station: three cells behind bars along the back wall, a corridor, then the front desk and the officers' desks.
police:['Kingsgrad Police Station',20,12,'interior',[[7,1,1,4,'W'],[13,1,1,4,'W'],[1,1,2,2,'e','Bunk'],[8,1,2,2,'e','Bunk'],[14,1,2,2,'e','Bunk'],
[1,4,6,1,'y','Cell Bars'],[8,4,5,1,'y','Cell Bars'],[14,4,5,1,'y','Cell Bars'],[8,7,5,1,'c','Front Desk'],[2,7,3,2,'u','Desk'],[15,8,3,2,'u','Desk'],[16,6,3,1,'y','Files']]],
// Kingsgrad's doctor's office: files and the reception desk by the door, waiting chairs, and the consulting room behind a partition
doctor:["Doctor's Office",16,10,'interior',[[7,1,1,5,'W'],[1,1,4,1,'y','Files'],[2,4,4,1,'c','Reception'],[1,7,4,1,'o'],[9,1,2,2,'e','Examination Bed'],[12,1,3,1,'y','Medicine Cabinet'],[11,4,3,1,'u','Desk']]],
// Eastbrook Community Centre, the Democratic Party's base: a meeting hall with a long table, a noticeboard and the party's desk
commcentre:['Community Centre',20,12,'interior',[[5,4,10,2,'u','Meeting Table'],[1,1,3,1,'y','Bookcase'],[16,1,3,1,'y','Files'],[15,8,3,2,'u','Desk'],[1,8,2,2,'x','Boxes'],[9,1,2,1,'i','Stove']]],
// Eastbrook's bar and restaurant
tavern:['Timberline Tavern',18,15,'interior',[[2,5,9,1,'y','Bottles'],[2,7,9,1,'c','Bar Counter'],[14,5,2,1,'i','Fireplace'],[3,11,3,2,'u','Table'],[9,11,3,2,'u','Table'],[14,9,3,2,'u','Table'],[1,4,11,1,'W'],[13,4,4,1,'W'],[1,1,2,1,'i','Stove'],[4,1,2,1,'i','Stove'],[7,1,2,1,'x','Sink'],[14,1,2,1,'y','Fridge'],[10,1,3,1,'y','Pantry Shelves'],[2,3,4,1,'u','Kitchen Table']]],
cedargrill:['Cedar Grill',18,15,'interior',[[1,5,2,1,'i','Stove'],[4,5,2,1,'i','Stove'],[7,5,4,1,'y','Pantry Shelves'],[1,7,10,1,'c','Counter'],[14,5,3,1,'y','Bottles'],[3,10,3,2,'u','Table'],[9,10,3,2,'u','Table'],[14,9,3,2,'u','Table'],[1,4,11,1,'W'],[13,4,4,1,'W'],[1,1,2,1,'i','Stove'],[4,1,2,1,'i','Oven'],[7,1,3,1,'y','Pantry Shelves'],[11,1,2,1,'x','Sink'],[14,1,2,1,'y','Fridge'],[3,3,4,1,'u','Kitchen Table']]],
// Hotel Aurora: the lobby, with stairs up to a floor of three guest rooms. The room on the right is the KGB agent's,
// fitted out with radio equipment, monitor screens and a tape recorder like the player's own set-up.
hotel_lobby:['Hotel Aurora',20,12,'interior',[[3,1,6,1,'y','Key Rack'],[3,3,6,1,'c','Reception'],[17,1,1,1,'z','Stairs up'],[11,4,4,2,'u','Table'],[2,8,4,1,'o'],[14,8,4,1,'o']]],
hotel_floor:['Hotel Aurora, upstairs',24,12,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[22,9,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,4,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,4,2,1,'u','Table'],
[17,1,2,2,'e','Bed'],[20,1,3,1,'y','Radio Equipment'],[21,3,2,2,'y','Screens'],[17,5,2,1,'y','Tape Recorder']]],
// Interiors of the island's other buildings: offices, warehouses, the farm, the barracks and the harbour sheds
crewq:['Crew Quarters',16,9,'interior',[[1,1,2,2,'e','Bunk'],[4,1,2,2,'e','Bunk'],[7,1,2,2,'e','Bunk'],[10,1,2,2,'e','Bunk'],[13,1,2,1,'y','Lockers'],[2,5,4,2,'u','Table'],[12,4,2,1,'i','Stove'],[11,6,3,1,'y','Shelves']]],
dphq_in:['Diversified Petroleum HQ',20,12,'interior',[[1,1,4,1,'y','Files'],[15,1,4,1,'y','Files'],[7,1,6,1,'y','Screens'],[7,3,6,1,'c','Reception'],[1,5,3,2,'u','Desk'],[16,5,3,2,'u','Desk'],[1,8,3,2,'u','Desk'],[16,8,3,2,'u','Desk'],[7,6,6,2,'u','Meeting Table']]],
depot_in:['Depot',16,10,'interior',[[1,1,3,2,'x','Oil Drums'],[5,1,6,1,'y','Pipes'],[12,1,3,2,'x','Supply Boxes'],[1,5,2,2,'x','Oil Drums'],[13,5,2,3,'x','Oil Drums'],[5,5,5,1,'u','Workbench']]],
// Frostholm's Republican Party HQ: the leadership election hall, with the podium, the ballot box and a campaign desk for each candidate
repubhq:['Republican Party HQ',20,12,'interior',[[1,1,3,1,'y','Files'],[16,1,3,1,'y','Files'],[8,2,4,1,'c','Podium'],[9,5,2,1,'x','Ballot Box'],[1,4,3,2,'u','Campaign Desk'],[16,4,3,2,'u','Campaign Desk'],[1,8,3,2,'u','Campaign Desk'],[6,8,3,1,'o'],[11,8,3,1,'o'],[16,8,3,2,'x','Leaflets']]],
// the Hot Springs Spa on the volcano's lower slopes: the reception desk, lockers and changing benches, and a hot bath fed from the springs
spa_in:['Hot Springs Spa',22,12,'interior',[[2,2,5,1,'c','Reception Desk'],[1,6,2,3,'y','Lockers'],[4,7,4,1,'o'],[12,2,8,4,'x','Hot Bath'],[17,8,4,1,'o'],[12,8,3,1,'y','Towels']]],
// Eastbrook's new places: the Kelp Cola Museum (the company's history, with a gift shop at the back), a vintage clothes shop,
// a record shop, and the lumber mill at the Mill
kcmuseum_in:['Kelp Cola Museum',22,12,'interior',[[1,1,4,1,'y','Vintage Bottles'],[7,1,7,2,'g','Old Bottling Line'],[16,1,5,1,'y','Bottle Caps'],[1,4,2,2,'x','Kelp Cola Crates'],
[5,4,1,1,'n','Mannequin'],[7,5,3,1,'o'],[14,6,6,1,'c','Gift Shop Counter'],[16,8,5,1,'y','Souvenir Shelves'],[1,8,4,1,'y','Postcard Rack']]],
clothes_in:['Flannel and Folk',14,10,'interior',[[1,1,5,1,'y','Clothes Rail'],[8,1,5,1,'y','Clothes Rail'],[1,4,1,1,'n','Mannequin'],[12,4,1,1,'n','Mannequin'],
[3,4,3,1,'y','Clothes Rail'],[9,4,2,1,'y','Cloth'],[8,7,4,1,'c','Counter'],[1,7,3,1,'y','Cloth']]],
records_in:['Vinyl Resting Place',14,9,'interior',[[1,1,5,1,'y','Record Shelves'],[8,1,5,1,'y','Record Shelves'],[2,4,3,1,'x','Record Crates'],[9,3,3,1,'x','Record Crates'],
[9,6,4,1,'c','Counter'],[1,6,2,1,'u','Listening Desk']]],
mill_in:['Lumber Mill',24,12,'interior',[[2,2,12,2,'g','Saw Line'],[16,1,3,2,'x','Timber Stack'],[20,1,3,2,'x','Timber Stack'],[16,5,3,2,'x','Timber Stack'],
[1,6,3,2,'x','Sawdust Sacks'],[19,8,4,2,'u','Desk'],[1,9,2,1,'y','Lockers']]],
petro_in:['Petro Tower',20,12,'interior',[[7,1,6,1,'y','Shelves'],[7,3,6,1,'c','Reception'],[1,1,4,1,'y','Files'],[15,1,4,1,'y','Files'],[1,5,3,2,'u','Desk'],[16,5,3,2,'u','Desk'],[1,8,3,2,'u','Desk'],[16,8,3,2,'u','Desk'],[8,7,4,1,'o']]],
bank_in:['Nordbank',20,12,'interior',[[1,1,3,1,'y','Files'],[8,1,4,1,'x','Safe'],[16,1,3,1,'y','Files'],[2,3,16,1,'c','Bank Counter'],[2,7,3,1,'o'],[15,7,3,1,'o'],[8,7,4,2,'u','Desk']]],
farmhouse_in:['Farmhouse',14,10,'interior',[[1,1,2,2,'e','Bed'],[4,1,3,1,'y','Shelf'],[9,1,2,1,'i','Stove'],[12,1,1,2,'x','Sacks'],[5,4,4,2,'u','Kitchen Table'],[1,6,2,2,'x','Sacks'],[11,6,2,1,'y','Bookcase']]],
barn_in:['Barn',18,10,'interior',[[1,1,3,2,'x','Hay Bales'],[5,1,3,2,'x','Hay Bales'],[10,1,3,1,'y','Shelves'],[14,1,3,2,'x','Feed Sacks'],[2,5,4,1,'u','Workbench'],[12,5,4,2,'x','Hay Bales']]],
civil_in:['Civil Service Bureau',20,12,'interior',[[1,1,4,1,'y','Files'],[6,1,4,1,'y','Files'],[11,1,4,1,'y','Files'],[16,1,3,1,'y','Archive'],[2,2,3,2,'u','Desk'],[8,2,3,2,'u','Desk'],[14,2,3,2,'u','Desk'],[2,5,16,1,'c','Service Counter'],[2,8,5,1,'o'],[13,8,5,1,'o']]],
kchq_in:['Kelp Cola HQ',22,12,'interior',[[1,1,3,1,'y','Fridge'],[8,1,6,1,'y','Shelves'],[18,1,3,1,'y','Files'],[8,3,6,1,'c','Reception'],[1,5,3,2,'u','Desk'],[1,8,3,2,'u','Desk'],[17,5,4,2,'u','Desk'],[6,7,6,2,'u','Meeting Table'],[15,1,1,1,'z','Stairs up'],[4,1,3,1,'y','Bottle Display'],[15,9,4,1,'y','Bottle Display'],[1,10,2,1,'x','Kelp Cola Crates']]],
// Rosaria's pizzeria in Kingsgrad: the oven, the counter and checked tables in front, and behind a door at the back, a shady back
// room with a card table, a safe, crates and a desk of ledgers, where the Crime Syndicate counts its money
pizzeria_in:['Pizzeria',24,12,'interior',[[1,1,3,1,'y','Safe'],[5,1,4,2,'u','Card Table'],[11,1,3,2,'x','Crates'],[15,1,2,2,'u','Desk'],[1,4,12,1,'W'],[14,4,3,1,'W'],[1,5,3,2,'i','Pizza Oven'],[5,6,6,1,'c','Counter'],[14,5,2,1,'y','Bottles'],[2,8,2,2,'u','Table'],[6,8,2,2,'u','Table'],[12,8,2,2,'u','Table'],[17,1,1,5,'W'],[17,7,1,4,'W'],[18,1,2,1,'i','Stove'],[21,1,2,1,'y','Fridge'],[22,3,1,3,'y','Pantry Shelves'],[19,8,3,1,'u','Kitchen Table'],[18,10,2,1,'x','Sink']]],
// the Old Barn at East Farm, entered through a loose board at the back: someone's hidden cannabis grow room, with four hydroponic
// grow beds under hanging lamps, a water tank, drums of nutrients, a fan and a cot
oldbarn_in:['Old Barn',18,10,'interior',[[2,2,5,2,'x','Grow Bed'],[11,2,5,2,'x','Grow Bed'],[2,5,5,2,'x','Grow Bed'],[11,5,5,2,'x','Grow Bed'],[1,7,1,2,'x','Water Tank'],[3,8,3,1,'x','Nutrient Drums'],[8,8,1,1,'x','Fan'],[14,7,2,2,'e','Cot']]],
// the drill floor inside the oil rig's drill tower: steel plating slick with oil, the rotary table with the drill pipe going down
// through it, a mud pump, the drawworks winch, a generator, the driller's console and a pipe rack
derrick_in:['Drill Floor',16,10,'interior',[[1,1,3,2,'y','Pipe Rack'],[5,1,3,1,'y',"Driller's Console"],[11,1,4,2,'x','Drawworks'],[6,3,3,3,'x','Rotary Table'],[1,5,3,3,'x','Mud Pump'],[12,5,3,2,'x','Generator']]],
// the lighthouse keeper's room at the foot of the tower: the spiral stair up to the lamp, a bed, a table, a stove, tide charts and lamp oil
lighthouse_in:['Lighthouse',10,9,'interior',[[1,1,2,2,'e','Bed'],[4,1,3,1,'y','Lamp Oil'],[7,1,2,2,'y','Spiral Stair'],[3,4,2,2,'u','Table'],[8,5,1,1,'i','Stove'],[1,6,2,1,'y','Tide Charts']]],
// Phil's office, the second floor of Kelp Cola's headquarters: a panelled room with his executive desk, a bookcase, a drinks cabinet,
// a trophy shelf of the company's awards and a table for guests
kchq2:["Phil's Office",16,10,'interior',[[1,1,4,1,'y','Bookcase'],[10,1,4,1,'y','Bottles'],[5,3,5,2,'u','Executive Desk'],[2,6,2,2,'u','Table'],[10,6,4,1,'y','Trophy Shelf'],[14,3,1,1,'z','Stairs down']]],
kcfac_in:['Kelp Cola Factory',24,12,'interior',[[2,2,20,2,'g','Bottling Line'],[1,6,3,2,'x','Kelp Cola Crates'],[20,6,3,2,'x','Kelp Cola Crates'],[8,6,8,1,'c','Packing Bench'],[1,9,2,1,'y','Lockers']]],
kcwhs_in:['Kelp Cola Warehouse',18,10,'interior',[[1,1,3,2,'x','Kelp Cola Crates'],[5,1,3,2,'x','Kelp Cola Crates'],[10,1,3,2,'x','Kelp Cola Crates'],[14,1,3,2,'x','Kelp Cola Crates'],[1,5,3,2,'x','Kelp Cola Crates'],[14,5,3,2,'x','Kelp Cola Crates'],[6,5,6,1,'y','Shelves']]],
whs_in:['Warehouse',18,10,'interior',[[1,1,3,2,'x','Fish Crates'],[5,1,2,2,'x','Ice Crates'],[10,1,3,1,'y','Shelves'],[14,1,3,2,'x','Fishing Nets'],[1,5,3,2,'x','Junk'],[13,6,4,2,'x','Boxes'],[6,5,4,1,'u','Workbench']]],
barrA_in:['Barracks Block A',20,12,'interior',[[1,1,2,2,'e','Bunk'],[4,1,2,2,'e','Bunk'],[7,1,2,2,'e','Bunk'],[10,1,2,2,'e','Bunk'],[13,1,2,2,'e','Bunk'],[16,1,2,2,'e','Bunk'],[1,6,2,2,'e','Bunk'],[4,6,2,2,'e','Bunk'],[14,6,2,2,'e','Bunk'],[17,6,2,2,'e','Bunk'],[7,6,6,1,'y','Lockers']]],
barrB_in:['Barracks Block B',20,12,'interior',[[1,1,2,1,'i','Stove'],[4,1,2,1,'i','Stove'],[7,1,5,1,'y','Pantry Shelves'],[14,1,5,1,'y','Lockers'],[2,4,16,1,'c','Serving Counter'],[2,7,7,2,'u','Mess Table'],[11,7,7,2,'u','Mess Table']]],
gp_in:['Guard Post',10,8,'interior',[[1,1,3,1,'y','Radio Equipment'],[6,1,2,1,'i','Stove'],[2,3,3,2,'u','Desk'],[7,4,2,1,'y','Lockers']]],
arm_in:['Armoury',18,10,'interior',[[1,1,5,1,'y','Gun Rack'],[7,1,5,1,'y','Gun Rack'],[13,1,4,1,'y','Gun Rack'],[1,4,3,2,'x','Ammo Crates'],[14,4,3,2,'x','Ammo Crates'],[6,4,6,1,'c','Counter'],[1,7,2,1,'x','Ammo Crates']]],
offhq_in:["Officers' HQ",20,12,'interior',[[1,1,4,1,'y','Files'],[6,1,3,1,'y','Radio Equipment'],[15,1,4,1,'y','Files'],[6,5,8,2,'u','Meeting Table'],[1,8,3,2,'u','Desk'],[16,8,3,2,'u','Desk']]],
fuel_in:['Fuel Dock',14,9,'interior',[[1,1,3,2,'x','Oil Drums'],[10,1,3,2,'x','Oil Drums'],[5,1,4,1,'y','Shelves'],[4,4,6,1,'c','Counter'],[1,5,2,2,'x','Supply Boxes']]],
port_in:['Port Office',14,9,'interior',[[1,1,4,1,'y','Files'],[9,1,4,1,'y','Radio Equipment'],[3,3,8,1,'c','Counter'],[1,5,3,2,'u','Desk'],[10,5,3,2,'u','Desk']]],
customs_in:['Customs Shed',14,9,'interior',[[1,1,4,1,'y','Files'],[9,1,4,1,'y','Shelves'],[3,3,8,1,'c','Inspection Counter'],[1,5,3,2,'x','Seized Boxes'],[10,5,3,2,'u','Desk']]],
ebwhs_in:['Warehouse',18,10,'interior',[[1,1,3,2,'x','Timber'],[5,1,3,2,'x','Supply Boxes'],[10,1,3,1,'y','Shelves'],[14,1,3,2,'x','Crab Pots'],[1,5,3,2,'x','Fishing Nets'],[13,6,4,2,'x','Supply Boxes'],[6,5,4,1,'u','Workbench']]],
apartments2:['Apartment Block, upstairs',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u'],[11,13,2,2,'x','Boxes'],[22,8,1,1,'z','Stairs up']]],
skyapts2:['Skyline Apartments, upstairs',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,4,2,1,'u','Desk'],[10,1,2,2,'e','Bed'],[13,3,2,2,'u','Desk'],[18,1,2,2,'e','Bed'],[21,1,2,1,'y','Fridge'],[2,13,2,2,'e','Bed'],[5,15,3,1,'u','Desk'],[20,13,2,2,'e','Bed'],[15,15,3,1,'u','Desk'],[11,13,2,2,'x','Boxes'],[22,8,1,1,'z','Stairs up']]],
eblofts2:['Timber Lofts, upstairs',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,1,2,1,'y','Bookcase'],[4,4,3,2,'u','Table'],[10,1,2,2,'e','Bed'],[13,1,2,1,'i','Stove'],[18,1,2,2,'e','Bed'],[21,1,2,1,'y','Records'],[2,13,2,2,'e','Bed'],[5,15,3,2,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,3,2,'u','Table'],[11,13,2,2,'x','Boxes'],[22,8,1,1,'z','Stairs up']]],
kgapts2:['Kingsgrad Apartments, upstairs',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes'],[22,8,1,1,'z','Stairs up']]],
// The circus: the big top's ring, with seats all round, and the troupe's three caravans
bigtop_in:['Big Top',24,16,'interior',[[2,1,8,1,'o'],[14,1,8,1,'o'],[1,3,4,1,'o'],[19,3,4,1,'o'],[1,5,4,1,'o'],[19,5,4,1,'o'],[1,7,4,1,'o'],[19,7,4,1,'o'],[1,9,4,1,'o'],[19,9,4,1,'o'],[11,6,2,2,'x','Juggling Boxes']]],
caravan1_in:["Ringmaster's Caravan",10,7,'interior',[[1,1,2,2,'e','Bunk'],[7,1,2,2,'e','Bunk'],[4,1,2,1,'i','Stove'],[1,4,2,1,'y','Shelf'],[7,4,2,1,'x','Supply Boxes']]],
caravan2_in:["Performers' Caravan",10,7,'interior',[[1,1,2,2,'e','Bunk'],[7,1,2,2,'e','Bunk'],[4,1,2,1,'y','Costume Rail'],[1,4,1,1,'n','Mannequin'],[7,4,2,1,'i','Stove']]],
caravan3_in:["Fortune Teller's Caravan",10,7,'interior',[[1,1,2,2,'e','Bed'],[4,3,2,1,'u','Crystal Ball Table'],[7,1,2,1,'y','Bottles'],[8,4,1,1,'i','Stove']]],
apartments3:['Apartment Block, third floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
skyapts3:['Skyline Apartments, third floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],[22,8,1,1,'z','Stairs up'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
skyapts4:['Skyline Apartments, fourth floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
eblofts3:['Timber Lofts, third floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes'],[22,8,1,1,'z','Stairs up']]],
eblofts4:['Timber Lofts, fourth floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
kgapts3:['Kingsgrad Apartments, third floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],[22,8,1,1,'z','Stairs up'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
kgapts4:['Kingsgrad Apartments, fourth floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
hsresid2:['Hope Springs Residences, second floor',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],[22,10,1,1,'z','Stairs down'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[11,13,2,2,'x','Boxes']]],
// The Midnight Note, Frostholm's jazz club: the bar on the left, the stage and grand piano at the back, candlelit tables
jazz_in:['The Midnight Note',20,12,'interior',[[1,1,5,1,'y','Bottles'],[1,3,5,1,'c','Bar Counter'],[8,1,6,2,'c','Stage'],[15,1,2,2,'u','Grand Piano'],
[3,7,2,2,'u','Table'],[8,7,2,2,'u','Table'],[13,7,2,2,'u','Table'],[17,5,2,2,'u','Table']]],
// Apartment blocks in the other towns: the same plan as Saltwick's (three flats along the top, a corridor and lobby below)
skyapts:['Skyline Apartments',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],
[2,1,2,2,'e','Bed'],[5,4,2,1,'u','Desk'],[10,1,2,2,'e','Bed'],[13,3,2,2,'u','Desk'],[18,1,2,2,'e','Bed'],[21,1,2,1,'y','Fridge'],[1,8,3,1,'y','Mailboxes'],[15,9,4,1,'c','Reception'],
[2,13,2,2,'e','Bed'],[5,15,3,1,'u','Desk'],[1,17,2,1,'y','Fridge'],[20,13,2,2,'e','Bed'],[15,15,3,1,'u','Desk'],[21,17,1,1,'y','Fridge'],[22,8,1,1,'z','Stairs up']]],
eblofts:['Timber Lofts',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],
[2,1,2,2,'e','Bed'],[5,1,2,1,'y','Bookcase'],[4,4,3,2,'u','Table'],[10,1,2,2,'e','Bed'],[13,1,2,1,'i','Stove'],[18,1,2,2,'e','Bed'],[21,1,2,1,'y','Records'],[1,8,3,1,'y','Mailboxes'],
[2,13,2,2,'e','Bed'],[5,15,3,2,'u','Table'],[1,17,2,1,'y','Bookcase'],[20,13,2,2,'e','Bed'],[15,15,3,2,'u','Table'],[21,17,1,1,'i','Stove'],[22,8,1,1,'z','Stairs up']]],
hsresid:['Hope Springs Residences',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],
[2,1,2,2,'e','Bed'],[5,1,2,1,'i','Fireplace'],[10,1,2,2,'e','Bed'],[13,1,2,1,'y','Bookcase'],[18,1,2,2,'e','Bed'],[21,1,2,1,'i','Fireplace'],[1,8,3,1,'y','Mailboxes'],[15,9,4,1,'c','Concierge Desk'],
[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[21,17,1,1,'i','Fireplace'],[22,8,1,1,'z','Stairs up']]],
kgapts:['Kingsgrad Apartments',24,20,'interior',[[8,1,1,6,'W'],[16,1,1,6,'W'],[1,7,3,1,'W'],[5,7,7,1,'W'],[13,7,7,1,'W'],[21,7,2,1,'W'],
[1,11,4,1,'W'],[6,11,5,1,'W'],[13,11,5,1,'W'],[19,11,4,1,'W'],[10,12,1,7,'W'],[13,12,1,7,'W'],
[2,1,2,2,'e','Bed'],[5,3,2,1,'u','Table'],[10,1,2,2,'e','Bed'],[13,3,2,1,'u','Table'],[18,1,2,2,'e','Bed'],[21,3,1,2,'u','Table'],[1,8,3,1,'y','Mailboxes'],
[2,13,2,2,'e','Bed'],[6,15,2,1,'u','Table'],[1,17,2,1,'y','Shelf'],[20,13,2,2,'e','Bed'],[15,15,2,1,'u','Table'],[21,17,1,1,'i','Stove'],[22,8,1,1,'z','Stairs up']]],
harbour:['West Saltwick Harbour',24,14,'harbour',[[1,1,9,12,'~'],[2,5,10,4,'p'],[2,2,4,2,'b','Fishing Boat'],[2,10,3,2,'b','Fishing Boat'],[6,10,4,2,'b','Fishing Boat'],[13,4,2,2,'k','Fish Pile'],[15,2,6,3,'#','Warehouse','whs'],[16,4,1,1,'d']]],
gated:['Hope Springs Gated Community',40,18,'snow',[[32,11,6,4,'#','Villa for Sale','villa4'],[35,14,1,1,'d'],[10,3,7,5,'#',"Phil's Villa",'villa1'],[13,7,1,1,'d'],[24,3,7,5,'#',"Dario's Villa",'villa2'],[27,7,1,1,'d'],[10,12,7,4,'#',"Gustavo's Villa",'villa3'],[13,15,1,1,'d'],[24,12,7,4,'#','Club','club'],[27,15,1,1,'d'],[13,8,1,1,','],[27,8,1,1,','],[17,10,1,7,','],[13,16,4,1,','],[18,11,4,2,'#','Fountain','fountain'],[32,2,6,6,'#','Hope Springs Residences','hsresid'],[34,7,1,1,'d'],[34,8,1,1,',']]],
privbeach:['Private Beach',18,12,'sand',[]],
privharbour:['South Private Harbour',18,12,'harbour',[[1,1,8,10,'~'],[2,4,8,3,'p'],[3,8,4,2,'b','Yacht']]],
barracks:['Army Barracks',32,22,'snow',[[2,3,10,6,'#','Barracks Block A','barrA'],[7,8,1,1,'d'],[20,3,10,6,'#','Barracks Block B','barrB'],[25,8,1,1,'d'],[12,1,3,3,'#','Guard Post','gp'],[13,3,1,1,'d'],
[2,13,9,6,'#','Armoury','arm'],[6,18,1,1,'d'],[21,13,9,6,'#',"Officers' HQ",'offhq'],[25,18,1,1,'d']]],
radio:['Radio Tower',18,14,'snow',[[7,2,4,4,'#','Radio Tower','mast'],[2,3,4,3,'#','Transmitter Hut','hut'],[3,5,1,1,'d'],[9,6,1,1,','],[13,1,4,3,'#',"Hekki's Shack",'shack'],[14,3,1,1,'d']]],
kalanharbour:['North Frostholm Harbour',24,14,'harbour',[[1,1,22,6,'~'],[4,3,12,4,'p'],[17,3,4,2,'b','Fishing Boat'],[3,8,5,3,'#','Fuel Dock','fueldock'],[5,10,1,1,'d'],[16,8,5,3,'#','Port Office','portoffice'],[18,10,1,1,'d']]],
// Eastbrook Harbour: the quay on the west, a long pier out to the boat berths, a jetty with fishing boats, and a lighthouse on a
// rocky spit to the north-east, at the end of the pier
savilaharbour:['Eastbrook Harbour',36,20,'harbour',[[18,1,17,18,'~'],[28,1,6,7,'.'],[14,8,18,4,'p'],[18,13,7,1,'p'],[21,3,4,2,'b','Fishing Boat'],[21,14,4,2,'b','Fishing Boat'],[27,15,4,2,'b','Fishing Boat'],[2,2,6,3,'#','Customs Shed','customs'],[5,4,1,1,'d'],[2,14,6,3,'#','Warehouse','ebwhs'],[3,16,1,1,'d'],[30,3,3,4,'#','Lighthouse','lighthouse'],[31,6,1,1,'d']]]};
// Links from the sketch: "A side B side". Order of links sets the order of exits along a side.
const LINKS=['oilrig R oilhq L','oilhq R fishing L','fishing B north T','volcano R mountains L','lake R north L','lake B beach R','north R town L','west R town L',
'mountains B east T','mountains R monastery L','east L town R','east R farm L','palace B town T','town R colahq L','colahq R tramstop L',
'tramstop R colafactory L','colafactory B second T','south L town R','forest R millroad L','millroad R second L','south R second L','beach R west L','beach B village T',
'west B village T','village L harbour R','town B southwest T','southwest B gated T','southwest L barracks R','gated R privbeach L','gated L privharbour R','village R radio L','fishing T kalanharbour B','second R savilaharbour L','tramstop B forest T','south T forest B'];

// ---- Overview-map layout (used only by tools/build-map.js): id:[x, y, kind]. Kinds: town, road, site, nature, harbour.
const POS={oilrig:[169,236,'harbour'],oilhq:[353,239,'site'],fishing:[545,234,'town'],kalanharbour:[545,140,'harbour'],
volcano:[758,256,'nature'],lake:[452,362,'nature'],mountains:[1005,256,'nature'],monastery:[1159,256,'site'],north:[604,370,'road'],east:[956,377,'road'],
farm:[1162,380,'nature'],palace:[788,384,'site'],town:[755,487,'town'],colahq:[873,498,'site'],tramstop:[1000,498,'road'],forest:[1022,545,'nature'],
colafactory:[1162,484,'site'],second:[1162,632,'town'],millroad:[1090,592,'site'],savilaharbour:[1330,632,'harbour'],south:[950,609,'road'],west:[557,532,'road'],
beach:[334,465,'nature'],village:[419,573,'town'],harbour:[213,674,'harbour'],radio:[494,636,'site'],barracks:[610,600,'site'],southwest:[735,592,'road'],gated:[758,694,'town'],
privharbour:[540,700,'harbour'],privbeach:[925,745,'nature']};

// ---- The Valto River on the overview map (used only by tools/build-map.js): its course from its spring in the mountains,
// running past North West Road (where the road bridges it) to the place it ends at, then on to the coast there.
const RIVER={name:'Valto River',pts:[[990,222],[880,192],[760,205],[660,262],[575,300],[500,335],[452,362],[400,440]],end:'beach',bridges:[[575,301]],label:[870,180,-4]};

// ---- Factions shown on the overview map and in the wiki: id:[name, colour, short badge, description]
const FACTIONS={cia:['CIA','#1f3a5f','CIA','The American intelligence agency you work for. Its people on the island are your handler and an informant.'],communist:['Communist Party','#c0392b','COM','Wants Sarivalto to join the Soviet Union, as a Soviet republic. Its leader is Anna.'],democrat:['Democratic Party','#2e86c1','DEM','A democratic political party, based at the Community Centre in Eastbrook.'],royal:['Royal Family','#7d3c98','ROY','The family of the island\'s previous king.'],
cola:['Kelp Cola','#2e9d57','KC','A cola company.'],oil:['Diversified Petroleum','#37474f','DP','An oil drilling company.'],syndicate:['Crime Syndicate','#8d5524','SYN','An organised crime syndicate. Its boss lives in the gated community.'],church:['Orthodox Church','#e0a100','CH','The northern orthodox church.'],
kgb:['KGB','#5c1f1f','KGB','The Soviet intelligence agency. Its man on the island works with the Communist Party.'],
union:['The Union','#d35400','UNI','The island\'s trade union, for the people who work at the Kelp Cola factory, in the fishing trade and at the lumber mill. Its leader is Helen.'],
republican:['Republican Party','#a3123a','REP','A conservative political party, based at its headquarters in Frostholm. Its leadership is vacant, and Kelp Cola, Diversified Petroleum and the Crime Syndicate are each trying to get their own candidate voted in.'],
circus:['The Circus','#e84393','CIR','The travelling circus camped at Lake Ilmari: its ringmaster and performers.'],
farmers:['The Farmers','#7cb342','FRM','The island\'s farmers, who work East Farm.'],
army:['The Army','#556b2f','ARM','The island\'s army, based at the barracks under its colonel.'],
food:['The Food Vendors','#ff8c42','FOOD','The people who feed the island: the street-food carts and van, the café and the restaurants.'],
shops:['The Shopkeepers','#20a39e','SHOP','The people who run the island\'s shops and stalls.'],
proprietors:['The Proprietors','#3f51b5','PROP','The people who run the island\'s other businesses: its bars, the jazz club, the cinema, the casino, the arcade, the hotel, the spa, the estate agent and the tattoo parlour.'],
entertainers:['The Entertainers','#9b59b6','ENT','The island\'s performers: its musicians, its radio DJ and the Kelp Cola mascot (the circus has its own group).'],
admin:['The Administrators','#00acc1','ADM',"The people who keep the island's paperwork in order: the civil servant, Nordbank's teller and the harbourmaster."],
unemployed:['The Unemployed','#78909c','UNE',"The island's people without work."],
police:['The Police','#2541b2','POL','The island\'s police, based at the police station in Kingsgrad.'],
palace:['The Palace Workers','#b07d62','PAL','The staff of the Royal Palace, from the butler down to the groundskeeper.'],
reporters:['The Reporters','#6c757d','PRS','The Eastbrook Gazette\'s newspapermen and women, who report on the island\'s politics without taking sides.']};
// ---- Exits pinned to a place along their edge (by the place they lead to), for maps that have grown since their streets were
// laid out; any other exit is spread evenly along its side
const EXIT_AT={village:{harbour:12,radio:12},town:{north:10,west:20,east:7,colahq:15,south:22,palace:26,southwest:26}};
// Groups play a part in the story but cannot win it (the rest are the factions, the only ones that can). The quest schedule
// (QUEST_DAYS) covers the factions only.
const GROUPS=['cia','kgb','republican','union','circus','farmers','army','reporters','palace','food','shops','proprietors','entertainers','police','admin','unemployed'];
// ---- Each faction's hierarchy, shown as a chart on its wiki page: the leader (null when the post is empty, with vacant saying
// why; a list of names puts them side by side at the top together), the important members (top), and who answers to whom (under: anyone in the chart can have people under them). Everyone
// else in the faction answers straight to the leader. joint: the top members share one box, and the next tier (next) and
// everyone else answer to them together. Names are people's names in NPCS, and must belong to the faction.
const FACTION_TREE={
cia:{lead:'Chuck',top:['Hekki']},
communist:{lead:'Anna',top:['Helen','Yuri']},
democrat:{lead:'Erik',top:['Bjarne'],under:{Bjarne:['Knut','Ilse']}},
royal:{lead:'Leopold',top:['Augustus','Daphne'],joint:true,next:['Edmund'],under:{Edmund:['Oskar','Marta']}},
cola:{lead:'Phil',top:['Harald'],joint:true,next:['Kurt','Wilma'],under:{Kurt:['Petra','Aino'],Wilma:['Jaana']}},
oil:{lead:'Dario',top:['Magnus'],joint:true},
syndicate:{lead:'Gustavo',top:['Carlo'],joint:true},
church:{lead:'Father Thyme',top:['Brother Anselm'],under:{'Brother Anselm':['Brother Paavo','Brother Ilja','Brother Teodor','Brother Mikael']}},
kgb:{lead:'Yuri'},
union:{lead:'Helen',top:['Anna']},
circus:{lead:'Bruno'},
farmers:{lead:['Hilda','Olaf']},
army:{lead:'Colonel Halvorsen',top:['Sergeant Rask'],under:{'Sergeant Rask':['Corporal Niemi','Private Aho','Private Koski']}},
food:{lead:null,vacant:'No leader'},
shops:{lead:null,vacant:'No leader'},
proprietors:{lead:null,vacant:'No leader'},
entertainers:{lead:null,vacant:'No leader'},
admin:{lead:null,vacant:'No leader'},
unemployed:{lead:null,vacant:'No leader'},
police:{lead:'Sergeant Hanna'},
palace:{lead:'Edmund',top:['Marta'],under:{Marta:['Elsa']}},
reporters:{lead:'Henrik',top:['Nora']},
republican:{lead:null,vacant:'Leader: vacant (Harald, Magnus and Carlo are standing)',top:['Margit']},
};
// Where each faction is based: location id -> faction id. Unlisted locations are unassigned.
const FACTION_AT={village:'communist',second:'democrat',gated:'syndicate',palace:'royal',monastery:'church',
colahq:'cola',colafactory:'cola',tramstop:'cola',oilhq:'oil',oilrig:'oil',fishing:'republican',lake:'circus',farm:'farmers',barracks:'army',town:'police',beach:'unemployed'};

// ---- Districts: id:[name, map colour]. DISTRICT_OF puts every place on the overview map in one; interiors take their building's.
const DISTRICTS={central:['Central','#f3d9a4'],north:['North','#d9c8ea'],northeast:['North East','#c4dcef'],northwest:['North West','#c9e3c4'],
southwest:['South West','#f2c9bf'],south:['South','#eadbb6'],southeast:['South East','#c3e6dc']};
// ---- When each part of the island opens (the day of September from which it can be reached; it stays open after). OPEN_ON
// is by district; OPEN_AT picks out a place that opens on a day of its own. Before 1 September (on 22 August) you are at CIA
// Headquarters, and nothing on the island is open. Roads into a place that isn't open yet are blocked by a snow bank.
const OPEN_ON={southwest:1,central:2,southeast:4,northeast:5,south:6,northwest:7,north:8},OPEN_AT={colahq:3};
const DISTRICT_OF={millroad:'southeast',palace:'central',town:'central',colahq:'central',tramstop:'southeast',forest:'southeast',
southwest:'south',barracks:'south',gated:'south',privbeach:'south',privharbour:'south',
east:'northeast',mountains:'northeast',monastery:'northeast',farm:'northeast',
colafactory:'southeast',south:'southeast',second:'southeast',savilaharbour:'southeast',
west:'southwest',radio:'southwest',village:'southwest',beach:'southwest',harbour:'southwest',
oilhq:'northwest',oilrig:'northwest',fishing:'northwest',kalanharbour:'northwest',
volcano:'north',north:'northwest',lake:'northwest'};

// ---- Boat routes. BOATS lists, for each place with boat landings, the places you can sail to (one berth each, in this order).
// South Private Harbour is deliberately not part of the boat network: nobody can sail to it, and it has no boat landings.
const BOATS={harbour:['kalanharbour','savilaharbour','oilrig'],kalanharbour:['harbour','savilaharbour','oilrig'],
savilaharbour:['harbour','kalanharbour','oilrig'],oilrig:['harbour','kalanharbour','savilaharbour']};
// ---- The Kelp Cola tram: the stops it calls at, in order (it runs round in a loop), and every place its track passes through (for the overview map).
// Stand on a platform and press E to call the tram; press E again once it has stopped to get on, then choose a stop from inside.
const TRAM_STOPS=['town','tramstop','colafactory','second'];
const TRAM_LINE=['town','colahq','tramstop','colafactory','second','south','town'];
// FERRY: id:[x, y, stepX, stepY, arriveDX, arriveDY]. Berths start at (x,y) and step along; you arrive one tile in.
const FERRY={harbour:[2,5,0,1,1,0],kalanharbour:[4,3,0,1,1,0],savilaharbour:[32,8,0,1,-1,0],oilrig:[1,3,0,1,1,0]};
// ---- Named characters standing in the world (placeholders: no dialogue yet). Every NPC needs:
// name, job, gender ('male' or 'female'; left out where it has not been decided), also (optional: groups they belong to as
// well as their faction, such as the Union), partner (optional: the name of the person they
// are in a relationship with, who names them back), faction (a FACTIONS id, or 'none' if unaligned), loc (main location id) and home (the building they live in:
// an interior listed in DOORS, or 'none' for someone with no fixed home). m, x, y: where they stand now (m:null for someone who is not physically on the island). dir: 0 down, 1 up, 2 left, 3 right
const NPCS=[{m:'harbour',x:6,y:8,dir:0,name:'Tom',home:'house_tom',loc:'harbour',job:'Fisherman',faction:'none',also:['union'],gender:'male',body:'#d9a520',hair:'#b5b5b5',hat:'#c0392b'},
{m:'harbour',x:12,y:5,dir:3,name:'Sam',home:'house_sam',loc:'harbour',job:'Fisherman',faction:'communist',also:['union'],gender:'male',body:'#2f6f8f',hair:'#5a3a22',hat:'#3d5a40'},
{m:'plant',x:6,y:4,dir:1,name:'Bob',home:'apartments',loc:'plant',job:'Fishmonger',faction:'none',also:['union'],gender:'male',partner:'Helen',body:'#e8e8e8',hair:'#7a5a3a'},
{m:'plant',x:13,y:4,dir:1,name:'Kate',home:'house_kate',loc:'plant',job:'Fishmonger',faction:'communist',also:['union'],gender:'female',body:'#5b8fb9',hair:'#caa05a'},
{m:'hq',x:4,y:1,dir:0,name:'Anna',home:'apartments',loc:'hq',job:'Communist Party leader',faction:'communist',also:['union'],gender:'female',body:'#a33333',hair:'#6b4a2a'},
{m:'harbour',x:10,y:6,dir:2,name:'Mike',home:'apartments',loc:'harbour',job:'Fisherman',faction:'communist',also:['union'],gender:'male',partner:'Lucia',body:'#8c2f2f',hair:'#222222'},
{m:'hq',x:15,y:1,dir:0,name:'Helen',home:'apartments',loc:'hq',job:'Union leader',faction:'communist',also:['union'],gender:'female',partner:'Bob',body:'#b84a4a',hair:'#d9c9a0'},
{m:'bar',x:5,y:2,dir:0,name:'Ray',home:'barflat',loc:'bar',job:'Bartender',faction:'proprietors',gender:'female',body:'#4a3a2a',hair:'#222222'},
{m:'kchq2',x:7,y:2,dir:0,name:'Phil',home:'villa_phil',loc:'kchq2',job:'CEO of Kelp Cola',faction:'cola',gender:'male',body:'#2e5a3a',hair:'#8a8a8a'},
{m:'throne',x:10,y:3,dir:0,name:'Leopold',home:'royalrooms',loc:'throne',job:'Prince',faction:'royal',gender:'male',body:'#6a2c8a',hair:'#d9b44a'},
{m:'library',x:9,y:8,dir:0,name:'Augustus',home:'royalrooms',loc:'library',job:"Prince's brother",faction:'royal',also:['church'],gender:'male',body:'#4a2a6a',hair:'#c9a040'},
{m:'monastery',x:11,y:9,dir:0,name:'Father Thyme',home:'house_thyme',loc:'monastery',job:'Abbot',faction:'church',gender:'male',body:'#2a2a33',hair:'#e8e8e8'},
{m:'palace',x:7,y:13,dir:0,name:'Daphne',home:'royalrooms',loc:'palace',job:"Prince's sister",faction:'royal',gender:'female',body:'#9a4ab0',hair:'#e8c86a'},
{m:'oilhq',x:8,y:7,dir:0,name:'Dario',home:'villa_dario',loc:'oilhq',job:'CEO of Diversified Petroleum',faction:'oil',gender:'male',body:'#37474f',hair:'#2a1a12'},
{m:'clubroom',x:15,y:3,dir:0,name:'Gustavo',home:'villa_gustavo',loc:'clubroom',job:'Don',faction:'syndicate',gender:'male',body:'#1a1a22',hair:'#222222'},
{m:'langley_cover',x:6,y:5,dir:0,name:'Doris',home:'none',loc:'langley_cover',job:'CIA cover story officer (at Langley)',faction:'cia',gender:'female',body:'#5a4a6a',hair:'#b5b5b5'},
// George: the CIA's man for the dirty work Chuck won't put his name to, the jobs that need doing after dark. At Langley, eating in
// the cafeteria (his office is off the Langley Office upstairs)
{m:'langley_cafe',x:14,y:5,dir:3,name:'George',home:'none',loc:'langley_cafe',job:'CIA operative (the dirty work, after dark)',faction:'cia',gender:'male',body:'#6b5a40',hair:'#3a2a20'},
{m:'langley_office',x:8,y:1,dir:0,name:'Chuck',home:'none',loc:'langley_office',job:'CIA handler (at Langley; reached by radio from the island)',faction:'cia',gender:'male',body:'#8a7a5a',hair:'#6b4a2a'},
{m:'radio',x:12,y:5,dir:2,name:'Hekki',home:'shack_hekki',loc:'radio',job:'Radio tech (and CIA informant)',faction:'cia',gender:'male',body:'#5a6a4a',hair:'#c9a05a',hat:'#4a4a52'},
{m:'beach',x:7,y:7,dir:0,name:'Pat',home:'tent_pat',loc:'beach',job:'Hobo',faction:'unemployed',gender:'male',body:'#6b5a40',hair:'#7a7a7a',hat:'#7a3a2a'},
{m:'gunshop',x:6,y:2,dir:0,name:'Frank',home:'house_frank',loc:'gunshop',job:'Gun shop owner',faction:'republican',also:['shops'],gender:'male',body:'#4a5a3a',hair:'#3a2a20'},
{m:'supermarket',x:14,y:10,dir:1,name:'Lisa',home:'house_lisa',loc:'supermarket',job:'Supermarket worker',faction:'shops',gender:'female',body:'#2e9d57',hair:'#c9822a'},
{m:'citybar',x:5,y:2,dir:0,name:'Eddie',home:'house_eddie',loc:'citybar',job:'Bartender',faction:'proprietors',gender:'female',body:'#f2f2f2',hair:'#2a1a12'},
{m:'tailor',x:5,y:2,dir:0,name:'Grace',home:'house_grace',loc:'tailor',job:'Tailor',faction:'shops',gender:'female',body:'#7d3c98',hair:'#9a9a9a'},
{m:'casino',x:14,y:9,dir:1,name:'Vince',home:'house_vince',loc:'casino',job:'Casino worker',faction:'proprietors',gender:'male',body:'#2a1a3a',hair:'#1a1a1a'},
{m:'bookshop',x:9,y:7,dir:1,name:'Mary',home:'house_mary',loc:'bookshop',job:'Book shop owner',faction:'shops',gender:'female',body:'#8a3a2a',hair:'#d9c9a0'},
{m:'fishingshop',x:5,y:2,dir:0,name:'Jack',home:'house_jack',loc:'fishingshop',job:'Fishing shop owner',faction:'republican',also:['shops'],gender:'male',body:'#2e6f9a',hair:'#7a5a3a',hat:'#e0a100'},
{m:'estateagent',x:8,y:5,dir:1,name:'Sally',home:'house_sally',loc:'estateagent',job:'Estate agent',faction:'proprietors',gender:'female',body:'#2e6f9a',hair:'#e8c86a'},
{m:'palacehall',x:12,y:5,dir:0,name:'Edmund',home:'servants',loc:'palacehall',job:'Butler',faction:'royal',also:['palace'],gender:'male',body:'#1a1a22',hair:'#b5b5b5',evening:{m:'throne',x:12,y:2,dir:2}},
{m:'palace',x:11,y:7,dir:0,name:'Oskar',home:'servants',loc:'palace',job:'Footman',faction:'royal',also:['palace'],gender:'male',body:'#5e2a75',hair:'#3a2a20',evening:{m:'palacehall',x:10,y:9,dir:0}},
{m:'kitchen',x:2,y:2,dir:1,name:'Marta',home:'servants',loc:'kitchen',job:'Cook',faction:'royal',also:['palace'],gender:'female',body:'#f2f2f2',hair:'#8a5a3a',evening:{m:'dining',x:9,y:3,dir:0}},
{m:'royalrooms',x:10,y:9,dir:0,name:'Ingrid',home:'servants',loc:'royalrooms',job:'Maid',faction:'palace',gender:'female',body:'#3a3d4a',hair:'#d9c9a0',evening:{m:'library',x:4,y:8,dir:1}},
{m:'dining',x:10,y:8,dir:1,name:'Lotta',home:'servants',loc:'dining',job:'Maid',faction:'palace',gender:'female',body:'#3a3d4a',hair:'#6b3a22',evening:{m:'kitchen',x:8,y:2,dir:1}},
{m:'palace',x:16,y:14,dir:2,name:'Viktor',home:'servants',loc:'palace',job:'Groundskeeper',faction:'palace',gender:'male',body:'#5a6a3a',hair:'#7a7a7a',hat:'#3d5a40',evening:{m:'palacehall',x:18,y:4,dir:1}},
{m:'transhut',x:5,y:6,dir:1,name:'Kaisa',home:'apartments',loc:'transhut',job:'Radio DJ',faction:'entertainers',gender:'female',body:'#e8792a',hair:'#3a2a20'},
{m:'colafactory',x:7,y:13,dir:0,name:'Pirkko',home:'house_pekka',loc:'colafactory',job:'Food van owner',faction:'church',also:['food'],gender:'female',body:'#e0a100',hair:'#2a1a12',hat:'#c0392b'},
{m:'monastery',x:13,y:9,dir:0,name:'Brother Anselm',home:'monks',loc:'monastery',job:'Prior',faction:'church',gender:'male',body:'#2a2a33',hair:'#9a9a9a'},
{m:'monastery',x:15,y:6,dir:1,name:'Brother Paavo',home:'monks',loc:'monastery',job:'Monk (gardener)',faction:'church',gender:'male',body:'#5a3a26',hair:'#7a5a3a'},
{m:'monks',x:12,y:7,dir:2,name:'Brother Ilja',home:'monks',loc:'monks',job:'Monk (scribe)',faction:'church',gender:'male',body:'#3a2a20',hair:'#c9a05a'},
{m:'monks',x:2,y:2,dir:1,name:'Brother Teodor',home:'monks',loc:'monks',job:'Monk (cook)',faction:'church',gender:'male',body:'#4a3222',hair:'#2a1a12'},
{m:'monks',x:13,y:2,dir:0,name:'Brother Mikael',home:'monks',loc:'monks',job:'Monk',faction:'church',gender:'male',body:'#3a3d44',hair:'#e8e8e8'},
{m:'newsroom',x:14,y:3,dir:0,name:'Henrik',home:'house_henrik',loc:'newsroom',job:'Newspaper editor',faction:'reporters',gender:'male',body:'#5a5f68',hair:'#9a9a9a'},
{m:'newsroom',x:8,y:6,dir:1,name:'Nora',home:'house_nora',loc:'newsroom',job:'Reporter',faction:'reporters',gender:'female',body:'#c9822a',hair:'#3a2a20'},
{m:'fishshop',x:6,y:2,dir:0,name:'Olga',home:'apartments',loc:'fishshop',job:'Fish shop owner',faction:'shops',gender:'female',body:'#5b8fb9',hair:'#8a8a8a',hat:'#3d5a40'},
{m:'outfitters_in',x:11,y:6,dir:0,name:'Helmi',home:'apartments',loc:'outfitters_in',job:'Outfitter',faction:'shops',gender:'female',body:'#e0a100',hair:'#c8a060'},
{m:'electro',x:5,y:2,dir:0,name:'Nils',home:'skyapts',loc:'electro',job:'Electronics store owner',faction:'republican',also:['shops'],gender:'male',body:'#3a3d44',hair:'#d9c9a0'},
{m:'arcadein',x:12,y:5,dir:0,name:'Toni',home:'kgapts',loc:'arcadein',job:'Arcade attendant',faction:'proprietors',gender:'female',body:'#ff3bd0',hair:'#1a1a1a'},
{m:'mart',x:14,y:10,dir:1,name:'Birgit',home:'skyapts',loc:'mart',job:'Nordmart manager',faction:'shops',gender:'female',body:'#2e86c1',hair:'#e8c86a'},
{m:'cinemain',x:14,y:10,dir:1,name:'Otto',home:'kgapts',loc:'cinemain',job:'Cinema manager',faction:'republican',also:['proprietors'],gender:'male',body:'#5a1a2a',hair:'#5a3a26'},
{m:'burgerbar',x:6,y:6,dir:0,name:'Sanna',home:'skyapts',loc:'burgerbar',job:'Polar Burger cook',faction:'food',gender:'female',body:'#c0392b',hair:'#c9822a'},
{m:'cafe',x:4,y:6,dir:0,name:'Maya',home:'eblofts',loc:'cafe',job:'Coffee roaster',faction:'democrat',also:['food'],gender:'female',body:'#3d5a4a',hair:'#3a2a20',hat:'#c9822a'},
{m:'tattoo',x:4,y:3,dir:2,name:'Jonna',home:'eblofts',loc:'tattoo',job:'Tattoo artist',faction:'democrat',also:['proprietors'],gender:'female',body:'#2f4a5a',hair:'#6b4a2a'},
{m:'commcentre',x:10,y:3,dir:0,name:'Erik',home:'eblofts',loc:'commcentre',job:'Democratic Party leader',faction:'democrat',gender:'male',body:'#2e86c1',hair:'#c9a05a'},
{m:'police',x:10,y:6,dir:0,name:'Sergeant Hanna',home:'kgapts',loc:'police',job:'Desk sergeant',faction:'police',gender:'female',body:'#1f3a5f',hair:'#3a2a20',hat:'#1f3a5f'},
{m:'tavern',x:6,y:6,dir:0,name:'Linnea',home:'eblofts',loc:'tavern',job:'Bartender',faction:'royal',also:['proprietors'],gender:'female',body:'#3d5a4a',hair:'#c9822a'},
{m:'cedargrill',x:5,y:6,dir:0,name:'Arvid',home:'eblofts',loc:'cedargrill',job:'Chef',faction:'royal',also:['food'],gender:'male',body:'#f2f2f2',hair:'#5a3a26'},
{m:'colahq',x:5,y:10,dir:0,name:'Ville',home:'kgapts',loc:'colahq',job:'Newsstand vendor',faction:'shops',gender:'male',body:'#2e6f9a',hair:'#d9c9a0',hat:'#2e6f9a'},
{m:'colahq',x:10,y:10,dir:0,name:'Rosa',home:'kgapts',loc:'colahq',job:'Hot dog vendor',faction:'food',gender:'female',body:'#c0392b',hair:'#2a1a12',hat:'#e0a100'},
{m:'doctor',x:12,y:3,dir:0,name:'Doctor Lind',home:'kgapts',loc:'doctor',job:'Doctor',faction:'republican',gender:'male',body:'#f2f2f2',hair:'#8a8a8a'},
{m:'hotel_floor',x:19,y:4,dir:3,name:'Yuri',home:'hotel_floor',loc:'hotel_floor',job:'KGB agent (posing as a businessman)',faction:'communist',also:['kgb'],gender:'male',body:'#3a3d44',hair:'#2a1a12',hat:'#5a3a26'},
{m:'hotel_lobby',x:6,y:2,dir:0,name:'Greta',home:'skyapts',loc:'hotel_lobby',job:'Hotel receptionist',faction:'proprietors',gender:'female',body:'#6a3442',hair:'#e8c86a'},
{m:'crewq',x:8,y:4,dir:0,name:'Lars',home:'crewq',loc:'crewq',job:'Oil rig worker',faction:'oil',gender:'male',body:'#e8792a',hair:'#c9a05a',hat:'#e0a100'},
{m:'oilrig',x:7,y:4,dir:2,name:'Einar',home:'crewq',loc:'oilrig',job:'Oil rig worker',faction:'oil',gender:'male',body:'#e0a100',hair:'#3a2a20',hat:'#e8792a'},
{m:'dphq_in',x:10,y:2,dir:0,name:'Ruth',home:'skyapts',loc:'dphq_in',job:'Receptionist',faction:'oil',gender:'female',body:'#37474f',hair:'#8a5a3a'},
{m:'depot_in',x:7,y:4,dir:0,name:'Britta',home:'skyapts',loc:'depot_in',job:'Depot worker',faction:'oil',gender:'female',body:'#5a6a4a',hair:'#d9c9a0',hat:'#e8792a'},
{m:'petro_in',x:2,y:7,dir:1,name:'Mats',home:'kgapts',loc:'petro_in',job:'Office clerk',faction:'oil',gender:'male',partner:'Elin',body:'#5a6470',hair:'#3a2a20'},
{m:'bank_in',x:10,y:2,dir:0,name:'Agnes',home:'skyapts',loc:'bank_in',job:'Bank teller',faction:'admin',gender:'female',body:'#2e5f8f',hair:'#e8c86a'},
{m:'farmhouse_in',x:7,y:3,dir:0,name:'Hilda',home:'farmhouse_in',loc:'farmhouse_in',job:'Farmer',faction:'farmers',gender:'female',partner:'Olaf',body:'#a33b2f',hair:'#c9a05a'},
{m:'barn_in',x:4,y:4,dir:0,name:'Olaf',home:'farmhouse_in',loc:'barn_in',job:'Farmer',faction:'farmers',gender:'male',partner:'Hilda',body:'#6b5a40',hair:'#8a8a8a',hat:'#4a5a3a'},
{m:'civil_in',x:6,y:4,dir:0,name:'Bertil',home:'kgapts',loc:'civil_in',job:'Civil servant',faction:'admin',gender:'male',body:'#5a5f68',hair:'#9a9a9a'},
{m:'kchq_in',x:11,y:2,dir:0,name:'Elin',home:'kgapts',loc:'kchq_in',job:'Secretary',faction:'cola',gender:'female',partner:'Mats',body:'#2e9d57',hair:'#2a1a12'},
{m:'kcfac_in',x:12,y:5,dir:1,name:'Kurt',home:'kgapts',loc:'kcfac_in',job:'Factory foreman',faction:'cola',gender:'male',body:'#2e5a3a',hair:'#5a3a26',hat:'#2e9d57'},
{m:'kcwhs_in',x:9,y:4,dir:0,name:'Petra',home:'kgapts',loc:'kcwhs_in',job:'Warehouse worker',faction:'cola',also:['union'],gender:'female',body:'#8aa898',hair:'#c9822a'},
{m:'kcfac_in',x:6,y:4,dir:1,name:'Aino',home:'kgapts',loc:'kcfac_in',job:'Bottling line worker',faction:'cola',also:['union'],gender:'female',body:'#2e9d57',hair:'#e8c86a',hat:'#f2f2f2'},
{m:'whs_in',x:8,y:4,dir:0,name:'Gunnar',home:'apartments',loc:'whs_in',job:'Dock worker',faction:'none',also:['union'],gender:'male',body:'#4a5a5a',hair:'#6b4a2a',hat:'#3a3d44'},
{m:'barrA_in',x:10,y:4,dir:0,name:'Private Aho',home:'barrA_in',loc:'barrA_in',job:'Soldier',faction:'army',gender:'male',body:'#4a5a3a',hair:'#3a2a20',hat:'#3a4a2a'},
{m:'barrB_in',x:6,y:3,dir:0,name:'Corporal Niemi',home:'barrA_in',loc:'barrB_in',job:'Army cook',faction:'army',gender:'male',body:'#f2f2f2',hair:'#8a5a3a'},
{m:'gp_in',x:6,y:3,dir:0,name:'Private Koski',home:'barrA_in',loc:'gp_in',job:'Sentry',faction:'army',gender:'male',body:'#4a5a3a',hair:'#c9a05a',hat:'#3a4a2a'},
{m:'arm_in',x:9,y:3,dir:0,name:'Sergeant Rask',home:'barrA_in',loc:'arm_in',job:'Quartermaster',faction:'army',gender:'male',body:'#5a6a48',hair:'#2a1a12',hat:'#3a4a2a'},
{m:'offhq_in',x:10,y:4,dir:0,name:'Colonel Halvorsen',home:'hsresid',loc:'offhq_in',job:'Army commander',faction:'army',gender:'male',body:'#3a4a2a',hair:'#b5b5b5',hat:'#4a5a3a'},
{m:'fuel_in',x:7,y:3,dir:0,name:'Sven',home:'skyapts',loc:'fuel_in',job:'Fuel dock attendant',faction:'oil',gender:'male',body:'#e0a100',hair:'#5a3a26'},
{m:'port_in',x:6,y:2,dir:0,name:'Ole',home:'skyapts',loc:'port_in',job:'Harbourmaster',faction:'admin',gender:'male',body:'#2e5f8f',hair:'#e8e8e8',hat:'#1f3a5f'},
{m:'lighthouse_in',x:6,y:3,dir:0,name:'Signe',home:'lighthouse_in',loc:'lighthouse_in',job:'Lighthouse keeper',faction:'admin',gender:'female',body:'#2e4a6a',hair:'#c9a05a',hat:'#2e4a6a'},
{m:'pizzeria_in',x:7,y:5,dir:0,name:'Rosaria',home:'kgapts',loc:'pizzeria_in',job:'Pizzeria owner',faction:'syndicate',also:['food'],gender:'female',body:'#f4f1e8',hair:'#2a1a12'},
{m:'customs_in',x:6,y:2,dir:0,name:'Liv',home:'eblofts',loc:'customs_in',job:'Customs officer',faction:'communist',gender:'female',body:'#2e5f8f',hair:'#3a2a20'},
{m:'ebwhs_in',x:8,y:4,dir:0,name:'Tor',home:'eblofts',loc:'ebwhs_in',job:'Warehouseman',faction:'communist',gender:'male',body:'#7a2a1e',hair:'#c9a05a',hat:'#3d5a4a'},
// the travelling circus at Lake Ilmari
{m:'lake',x:32,y:12,dir:0,name:'Bruno',home:'caravan1_in',loc:'lake',job:'Ringmaster',faction:'circus',gender:'male',body:'#a3123a',hair:'#2a1a12',hat:'#1a1a22'},
{m:'lake',x:24,y:16,dir:0,name:'Buttons',home:'caravan2_in',loc:'lake',job:'Jester',faction:'circus',gender:'male',partner:'Meg',body:'#e0a100',hair:'#e04a3a',hat:'jester|#c0392b|#2e86c1'},
{m:'bigtop_in',x:8,y:6,dir:3,name:'Meg',home:'caravan2_in',loc:'bigtop_in',job:'Acrobat',faction:'circus',gender:'female',partner:'Buttons',body:'#e07a9a',hair:'#2a1a12'},
{m:'bigtop_in',x:15,y:7,dir:2,name:'Igor',home:'caravan1_in',loc:'bigtop_in',job:'Strongman',faction:'circus',gender:'male',body:'#5a3a26',hair:'#1a1a1a'},
{m:'caravan3_in',x:5,y:2,dir:0,name:'Madame Zora',home:'caravan3_in',loc:'caravan3_in',job:'Fortune teller',faction:'circus',gender:'female',body:'#7d3c98',hair:'#2a1a12',hat:'#c9a040'},
// Jaana, inside Kelpy: the Kelp Cola Museum's mascot, waving visitors in from the street (costume: drawn as a giant cola cup)
{m:'second',x:17,y:9,dir:0,name:'Jaana',home:'eblofts',loc:'kcmuseum_in',job:'Kelp Cola Museum mascot (Kelpy the cup)',faction:'cola',also:['entertainers'],gender:'female',body:'#c0392b',hair:'#7a5a3a',costume:'cup'},
{m:'village',x:28,y:10,dir:0,name:'Hannu',home:'apartments',loc:'village',job:'Newsstand vendor',faction:'shops',gender:'male',body:'#6b5a48',hair:'#8a8a8a',hat:'#3a3d44'},
{m:'jazz_in',x:3,y:2,dir:0,name:'Sid',home:'skyapts',loc:'jazz_in',job:'Owner and bartender of The Midnight Note',faction:'proprietors',gender:'male',body:'#1a1a22',hair:'#b5b5b5'},
{m:'jazz_in',x:10,y:3,dir:0,name:'Leo',home:'skyapts',loc:'jazz_in',job:'Saxophonist',faction:'entertainers',gender:'male',body:'#2b2f3a',hair:'#2a1a12',hat:'#1a1a22'},
{m:'jazz_in',x:12,y:3,dir:0,name:'Rita',home:'skyapts',loc:'jazz_in',job:'Jazz singer',faction:'entertainers',gender:'female',body:'#7a1e2a',hair:'#1a1a1a'},
{m:'spa_in',x:4,y:1,dir:0,name:'Saga',home:'kgapts',loc:'spa_in',job:'Spa attendant',faction:'proprietors',gender:'female',body:'#3d7a7a',hair:'#e8c86a'},
{m:'servants',x:3,y:7,dir:2,name:'Elsa',home:'servants',loc:'servants',job:'Laundress',faction:'palace',gender:'female',body:'#7a8a9a',hair:'#caa05a',evening:{m:'royalrooms',x:18,y:9,dir:2}},
// Eastbrook's new faces: the hot dog vendor, the Kelp Cola Museum's curator, the clothes and record shop owners, and the lumber mill's crew
{m:'second',x:7,y:16,dir:0,name:'Dex',home:'eblofts',loc:'second',job:'Hot dog vendor',faction:'democrat',also:['food'],gender:'male',body:'#c0392b',hair:'#3a2a20',hat:'#e0a100'},
{m:'kcmuseum_in',x:16,y:5,dir:0,name:'Wilma',home:'eblofts',loc:'kcmuseum_in',job:'Museum curator and gift shop clerk',faction:'cola',also:['shops'],gender:'female',body:'#2e9d57',hair:'#c9822a'},
{m:'clothes_in',x:9,y:6,dir:0,name:'Juniper',home:'eblofts',loc:'clothes_in',job:'Clothes shop owner',faction:'church',also:['shops'],gender:'female',body:'#7a2a3a',hair:'#e8c86a',hat:'#3d5a4a'},
{m:'records_in',x:10,y:5,dir:0,name:'Ruby',home:'eblofts',loc:'records_in',job:'Record shop owner',faction:'democrat',also:['shops'],gender:'female',body:'#2a2a30',hair:'#6b4a2a'},
{m:'mill_in',x:20,y:7,dir:0,name:'Bjarne',home:'eblofts',loc:'mill_in',job:'Lumber mill foreman',faction:'democrat',gender:'male',body:'#a33b2f',hair:'#b5b5b5',hat:'#e8792a'},
{m:'mill_in',x:8,y:4,dir:1,name:'Knut',home:'eblofts',loc:'mill_in',job:'Sawyer',faction:'democrat',also:['union'],gender:'male',body:'#3d5a4a',hair:'#c9a05a',hat:'#e0a100'},
{m:'millroad',x:6,y:5,dir:1,name:'Ilse',home:'eblofts',loc:'millroad',job:'Log loader',faction:'democrat',also:['union'],gender:'female',body:'#c0392b',hair:'#e8c86a',hat:'#2f4a3c'},
// the Crime Syndicate's people working the towns, one in each
{m:'fishing',x:24,y:8,dir:0,name:'Nico',home:'skyapts',loc:'fishing',job:'Syndicate bookie',faction:'syndicate',gender:'male',body:'#3a2a2a',hair:'#2a1a12',hat:'#3a3d44'},
{m:'second',x:24,y:17,dir:0,name:'Paolo',home:'eblofts',loc:'second',job:'Syndicate bookie',faction:'syndicate',gender:'male',body:'#2a2a33',hair:'#5a3a26'},
{m:'police',x:11,y:3,dir:0,name:'Mario',home:'police',loc:'police',job:'Syndicate bookie (in jail)',evening:{m:'police',x:11,y:3,dir:0},faction:'syndicate',gender:'male',body:'#2a2a33',hair:'#5a3a26'},
{m:'village',x:27,y:6,dir:0,name:'Lucia',home:'apartments',loc:'village',job:'Syndicate enforcer',faction:'syndicate',gender:'female',partner:'Mike',body:'#3a2a2a',hair:'#2a1a12',hat:'#3a3d44'},
// two out-of-work women from the apartment block: by day they hang about by the bench on the main street, and they spend the
// evening in the bar (evening: where they are at night instead of at home)
{m:'village',x:22,y:11,dir:3,name:'Sirpa',home:'apartments',loc:'village',job:'Unemployed',faction:'unemployed',gender:'female',body:'#7a5a8a',hair:'#3a2a20',evening:{m:'bar',x:4,y:9,dir:1}},
{m:'village',x:24,y:11,dir:2,name:'Tiina',home:'apartments',loc:'village',job:'Unemployed',faction:'unemployed',gender:'female',body:'#5a7a6a',hair:'#c9822a',hat:'#a33b2f',evening:{m:'bar',x:10,y:9,dir:1}},
// two out-of-work women from the Kingsgrad Apartments: by day they hang about by the bench at the west end of town, and they
// spend the evening in the City Bar
{m:'town',x:2,y:8,dir:3,name:'Eila',home:'kgapts',loc:'town',job:'Unemployed',faction:'unemployed',gender:'female',body:'#8a4a5a',hair:'#d9c9a0',evening:{m:'citybar',x:4,y:8,dir:1}},
{m:'town',x:4,y:8,dir:2,name:'Marjut',home:'kgapts',loc:'town',job:'Unemployed',faction:'unemployed',gender:'female',body:'#4a5a7a',hair:'#2a1a12',hat:'#c9822a',evening:{m:'citybar',x:11,y:8,dir:1}},
// two out-of-work people from the Timber Lofts: by day they hang about by the bench in Eastbrook's square, and they spend the
// evening in the Timberline Tavern
{m:'second',x:31,y:17,dir:3,name:'Veikko',home:'eblofts',loc:'second',job:'Unemployed',faction:'unemployed',gender:'male',body:'#6a5a3a',hair:'#3a2a20',hat:'#3d5a4a',evening:{m:'tavern',x:4,y:10,dir:0}},
{m:'second',x:33,y:17,dir:2,name:'Hely',home:'eblofts',loc:'second',job:'Unemployed',faction:'unemployed',gender:'female',body:'#a8642a',hair:'#e8c86a',evening:{m:'tavern',x:10,y:10,dir:0}},
// two out-of-work people from the Skyline Apartments: by day they hang about by the phone box at the west end of Frostholm's
// boulevard, and they spend the evening in The Midnight Note
{m:'fishing',x:5,y:7,dir:3,name:'Arto',home:'skyapts',loc:'fishing',job:'Unemployed',faction:'unemployed',gender:'male',body:'#3a3d44',hair:'#2a1a12',hat:'#b05fff',evening:{m:'jazz_in',x:3,y:9,dir:1}},
{m:'fishing',x:7,y:7,dir:2,name:'Raili',home:'skyapts',loc:'fishing',job:'Unemployed',faction:'unemployed',gender:'female',body:'#ff5fa8',hair:'#1a1a1a',evening:{m:'jazz_in',x:14,y:9,dir:1}},
{m:'gated',x:19,y:6,dir:0,name:'Paola',home:'hsresid',loc:'gated',job:'Syndicate enforcer',faction:'syndicate',gender:'female',body:'#2b2f3a',hair:'#8a8a8a'},
// the Republican Party's leadership election: the party secretary running it, and the three candidates, each put up by one of the island's powers
{m:'repubhq',x:10,y:1,dir:0,name:'Margit',home:'skyapts',loc:'repubhq',job:'Republican Party secretary (running the leadership election)',faction:'republican',gender:'female',body:'#a3123a',hair:'#b5b5b5'},
{m:'kchq_in',x:19,y:4,dir:0,name:'Harald',home:'hsresid',loc:'kchq_in',job:"Kelp Cola executive and the company's candidate for Republican Party leader",faction:'cola',gender:'male',body:'#2e9d57',hair:'#c9a05a'},
{m:'dphq_in',x:17,y:4,dir:0,name:'Magnus',home:'skyapts',loc:'dphq_in',job:"Diversified Petroleum executive and the company's candidate for Republican Party leader",faction:'oil',gender:'male',body:'#37474f',hair:'#5a3a26'},
{m:'repubhq',x:4,y:8,dir:2,name:'Carlo',home:'hsresid',loc:'repubhq',job:"The Crime Syndicate's candidate for Republican Party leader",faction:'syndicate',gender:'male',body:'#1a1a22',hair:'#2a1a12'}];

// ---- The player at the start of the game (placeholders): the CIA's operating funds, the player's own money, and what they carry
// as [item id, how many] (ids are keys in ITEMS). QUESTS (below) are the quests. Both are shown in the start menu.
const PLAYER={ciaFunds:5000,funds:250,hunger:80,nicotine:70,look:{hair:'short',hairCol:'#4a2e1a',beard:'none',beardCol:'#4a2e1a',hat:'beanie_yellow',top:'parka_blue',legs:'jeans_blue',shoes:'boots_brown'},clothes:['beanie_yellow','parka_blue','sweater_grey','jeans_blue','khakis','boots_brown'],items:[['notebook',1],['camera',1],['film',3],['codebook',1],['lockpicks',1],['flashlight',1]]};
// ---- Items: the name, the description shown in the inventory, and the actions you can take with it (each action is handled in
// game.js; ones it doesn't handle yet say so). Their sprites are ITEM_ART in art.js.
// ITEMS: each thing you can carry: its name, description and what you can do with it (actions); equip:true means it can be held
// in your hand (one thing at a time), which some actions need (the fishing rod must be held to fish).
const ITEMS={
notebook:{name:'Notebook',desc:'Your field notebook, small enough for a jacket pocket: names, places and anything worth remembering, in your own shorthand.',actions:['Read','Write a note']},
camera:{name:'Minox spy camera',desc:'A Minox subminiature camera, no bigger than a finger. It slides open to shoot and is made for photographing documents up close.',actions:['Take a photo','Load film'],equip:true},
film:{name:'Roll of film',desc:'Film cassettes for the Minox, 50 exposures each. Hand the exposed rolls to Chuck to be developed.',actions:['Load into camera']},
codebook:{name:'Radio codebook',desc:'One-time pads and call signs for talking to Chuck over the radio. Burn it before anyone else reads it.',actions:['Read','Burn']},
lockpicks:{name:'Lock picks',desc:'A set of picks and a tension wrench, rolled up in a leather pouch.',actions:['Pick a lock']},
flashlight:{name:'Flashlight',desc:'A steel flashlight with fresh batteries.',actions:['Turn on'],equip:true},
// things the shops sell
beer:{name:'Bottle of beer',desc:'A brown bottle of Sarivalto lager, brewed in Kingsgrad.',actions:['Drink']},
whisky:{name:'Glass of whisky',desc:'A short glass of whisky over ice.',actions:['Drink']},
cigarettes:{name:'Pack of cigarettes',desc:'A red pack of twenty. Offering one round is the quickest way into a conversation. Equip it to smoke as you go.',actions:['Smoke'],equip:true},
book:{name:'Paperback novel',desc:'A well-thumbed spy thriller. The hero always gets away.',actions:['Read']},
islandmap:{name:'Map of Sarivalto',desc:'A folding map of the island with every town, road and harbour.',actions:['Look at']},
burger:{name:'Polar Burger',desc:'A cheeseburger in a sesame bun from Polar Burger.',actions:['Eat']},
cola:{name:'Kelp Cola',desc:'The island\'s own cola, in a green glass bottle. It tastes faintly of the sea.',actions:['Drink']},
beans:{name:'Imported coffee beans',desc:'A sack of fine Colombian coffee beans, brought in through Langley in the diplomatic pouch. For Maya at the Coffee Roasters.',actions:['Look at']},
coffee:{name:'Cup of coffee',desc:'Strong black coffee, roasted in Eastbrook.',actions:['Drink']},
bun:{name:'Cinnamon bun',desc:'A sticky cinnamon bun, still warm.',actions:['Eat']},
meal:{name:'Hot meal',desc:'Steak, potatoes and greens on a plate.',actions:['Eat']},
shirt:{name:'Flannel shirt',desc:'A red checked flannel shirt. In Eastbrook it makes you look like a local. It goes into your wardrobe.',actions:[]},
beanie:{name:'Wool beanie',desc:'A navy knitted hat against the cold. It goes into your wardrobe.',actions:[]},
suit:{name:'Tailored suit',desc:'A dark suit and red tie, cut to fit. It will get you into places a flannel shirt will not. It goes into your wardrobe.',actions:[]},
sweater:{name:"Fisherman's jumper",desc:'A thick green jumper knitted from oiled wool, as worn on the boats. It goes into your wardrobe.',actions:[]},
cords:{name:'Brown corduroys',desc:'Warm brown corduroy trousers. It goes into your wardrobe.',actions:[]},
sneakers:{name:'White sneakers',desc:'Canvas sneakers, very American. It goes into your wardrobe.',actions:[]},
flatcap:{name:'Tweed flat cap',desc:'A brown tweed cap with a short peak. It goes into your wardrobe.',actions:[]},
ushanka:{name:'Fur ushanka',desc:'A fur hat with ear flaps, for the worst of the winter. It goes into your wardrobe.',actions:[]},
snowboots:{name:'Snow boots',desc:'Grey rubber boots lined with fleece. It goes into your wardrobe.',actions:[]},
beret:{name:'Black beret',desc:'A black wool beret, for looking like an artist. It goes into your wardrobe.',actions:[]},
trench:{name:'Trench coat',desc:'A belted tan trench coat with a turned-up collar. It goes into your wardrobe.',actions:[]},
slacks:{name:'Black trousers',desc:'Pressed black trousers to go with a jacket. It goes into your wardrobe.',actions:[]},
oxfords:{name:'Black Oxfords',desc:'Polished black leather shoes. It goes into your wardrobe.',actions:[]},
fedora:{name:'Grey fedora',desc:'A grey felt hat with a black band. It goes into your wardrobe.',actions:[]},
oilskin:{name:'Yellow oilskin',desc:'A stiff yellow oilskin jacket that keeps out the sea spray. It goes into your wardrobe.',actions:[]},
cableknit:{name:'Cable-knit jumper',desc:'A heavy navy jumper in a cable knit. It goes into your wardrobe.',actions:[]},
peacoat:{name:'Pea coat',desc:'A double-breasted navy wool coat, as worn on the bridge. It goes into your wardrobe.',actions:[]},
dungarees:{name:'Dungarees',desc:'Hard-wearing blue work dungarees. It goes into your wardrobe.',actions:[]},
wellies:{name:'Green wellies',desc:'Tall green rubber boots for the quayside. It goes into your wardrobe.',actions:[]},
souwester:{name:"Sou'wester",desc:"A yellow oilskin rain hat with a long brim at the back. It goes into your wardrobe.",actions:[]},
watchcap:{name:'Red watch cap',desc:'A close-fitting red knitted cap, the fisherman\'s favourite. It goes into your wardrobe.',actions:[]},
radio:{name:'Transistor radio',desc:'A pocket radio. It picks up Radio Sarivalto and, at night, stations from across the sea.',actions:['Listen']},
batteries:{name:'Batteries',desc:'A pair of batteries for a flashlight or a radio.',actions:[]},
fishrod:{name:'Fishing rod',desc:'A rod and reel with a good length of line. Equip it to fish.',actions:['Fish'],equip:true},
smokedfish:{name:'Smoked fish',desc:'A whole smoked fish, wrapped in paper.',actions:['Eat']},
pistol:{name:'Pistol',desc:'A small automatic pistol. Better kept hidden.',actions:[],equip:true},
ammo:{name:'Box of bullets',desc:'A box of bullets for the pistol.',actions:[]},
souvenir:{name:'Kelpy figurine',desc:'A little Kelpy the cup, the Kelp Cola mascot, from the museum gift shop.',actions:['Look at']},
bread:{name:'Loaf of bread',desc:'A fresh rye loaf.',actions:['Eat']},
record:{name:'Vinyl record',desc:'A jazz LP in a worn sleeve.',actions:['Look at']},
newspaper:{name:'Newspaper',desc:'Today\'s Eastbrook Gazette.',actions:['Read']},
pizza:{name:'Slice of pizza',desc:'A hot slice of pizza, cheese and pepperoni, from the pizzeria in Kingsgrad.',actions:['Eat']},
wine:{name:'Bottle of wine',desc:'A bottle of red wine.',actions:['Drink']},
hotdog:{name:'Hot dog',desc:'A hot dog with mustard.',actions:['Eat']},
};
// ---- Fish (js/fishing.js): where each bites (the sea, fresh water, or any), how often (w, and at night if it differs), how big the
// green zone is when you reel it in (smaller is harder, and it fights harder too), and what Olga at the fish shop pays for one.
// Junk is caught like a fish but nobody buys it. Each is also an item.
const FISH={
herring:{name:'Herring',where:'sea',w:30,zone:.34,price:2,desc:'A silver herring, the fish the island was built on.'},
cod:{name:'Cod',where:'sea',w:18,zone:.28,price:5,desc:'A fat speckled cod.'},
salmon:{name:'Salmon',where:'sea',w:8,night:14,zone:.2,price:10,desc:'A gleaming sea salmon, heavy in the hand.'},
halibut:{name:'Halibut',where:'sea',w:3,night:6,zone:.14,price:18,desc:'A great flat halibut, both eyes on one side.'},
kelp:{name:'Kelp',where:'sea',w:6,zone:.4,price:0,junk:true,desc:'A dripping clump of kelp. Kelp Cola would be proud.'},
perch:{name:'Perch',where:'fresh',w:30,zone:.34,price:2,desc:'A striped perch with spiny red fins.'},
burbot:{name:'Burbot',where:'fresh',w:10,night:22,zone:.26,price:5,desc:'A slimy, whiskered burbot, which bites best in the dark.'},
pike:{name:'Pike',where:'fresh',w:12,zone:.2,price:8,desc:'A long pike with a mouthful of teeth.'},
char:{name:'Arctic char',where:'fresh',w:4,night:7,zone:.14,price:14,desc:'An Arctic char, red-bellied, from the cold deep water.'},
boot:{name:'Old boot',where:'any',w:5,zone:.4,price:0,junk:true,desc:'A waterlogged old boot. Someone lost it a long time ago.'}};
for(const k in FISH)ITEMS[k]={name:FISH[k].name,desc:FISH[k].desc,actions:['Look at']};
// who buys the fish you catch
const FISH_BUYER='Olga';
// ---- How much each thing you eat or drink fills your hunger (out of 100; js/needs.js)
// ---- How drunk each drink makes you (the alcohol meter goes up by this, out of 100)
const ALCOHOL={beer:15,wine:25,whisky:20};
const FOOD={meal:55,smokedfish:35,burger:35,pizza:30,bread:25,hotdog:25,bun:15,cola:5,coffee:5,beer:5,wine:5,whisky:2};
// ---- Places with somewhere to sit and wait for the evening: face one of their tables (or the hotel lobby's seats) and press E.
const WAIT_AT=['bar','citybar','tavern','burgerbar','cafe','cedargrill','hotel_lobby','casino','hekki_room'];
// ---- Conversations, by the name of the person you talk with: the node it starts at, and its nodes. Each node is what they say
// and your replies as [what you say, the node it leads to]; a node with no replies ends the conversation once you've read it.
const CONVOS={
// Otto sells tickets for the film at the cinema (js/film.js)
Otto:{start:'a',nodes:{a:{say:"Two pictures tonight. STORMWING: the hottest pilots in the North, and one very unhappy control tower. And TOP COMRADE, all the way from the other side of the Iron Curtain: same story, more paperwork. Four dollars a ticket.",opts:[['Watch STORMWING ($4)',null,()=>watchFilm('stormwing')],['Watch TOP COMRADE ($4)',null,()=>watchFilm('topcomrade')],['Maybe later',null]]}}},
George:{start:'a',nodes:{a:{say:"Pull up a chair, NIGHTJAR. Meatloaf's terrible. George. Chuck does the talking in the daytime; I'm the one who does the work after dark. Nothing for you yet. Once you're on the island, call Langley in the evening and you'll get me."}}},
Doris:{start:'a',nodes:{a:{say:"Cover Story Department. Doris. Sit down, let's have a look at you. Hair, clothes, the lot: nobody believes a journalist in a government suit.",opts:[['Make me up.',null,()=>openCover()],['Not now.',null]]}}},
Jonna:{start:'a',nodes:{a:{say:"Welcome to Ink and Pine. Something to remember the island by?",opts:[["I'd like a tattoo.",null,()=>openTattoo()],['Just looking.',null]]}}},
Hekki:{start:'hello',nodes:{
  hello:{say:'So glad you made it.',opts:[['Me too.','metoo'],['This place sucks.','sucks'],['Is anyone on to you?','onto']]},
  metoo:{say:'Woo!'},
  sucks:{say:'Hey!'},
  onto:{say:'No way.'}}},
};
// ---- Opening hours: places open only by day, and places open only at night. Their doors don't open while they're shut, and the
// people who work in a night-only place work at night and are at home by day. Everywhere else is always open. (The street
// stalls have no door: their vendors are simply at home at night.)
const DAY_ONLY=['clothes_in','outfitters_in','kcmuseum_in','records_in','electro','mart','bookshop','fishingshop','gunshop','tailor','fishshop','tattoo','bank_in','estateagent','fuel_in'];
const NIGHT_ONLY=['jazz_in','caravan3_in'];
// the staff of the places open day and night (bars, restaurants, the hotel, the casino, the arcade, the stalls that stay open, and
// the doctor and the police sergeant, on call, the supermarket and the cinema):
// they work evenings too, so they are at work at night as well as by day
const EVENING_STAFF=['Ray','Eddie','Linnea','Sanna','Arvid','Maya','Dex','Hannu','Greta','Vince','Toni','Doctor Lind','Sergeant Hanna','Lisa','Otto','Rosaria'];
// whether someone is at work (true) or at home (false) by day or by night: evening staff are always at work, people who work
// somewhere open only at night are at work at night and at home by day, and everyone else the other way round
const atWorkWhen=(n,night)=>EVENING_STAFF.includes(n.name)||(NIGHT_ONLY.includes(n.loc)?night:!night);
// where someone with an evening is at night (instead of at home), or null
const eveningAt=(n,night)=>night&&n.evening||null;
// street stalls open only by day, as [place, look]: at night they stand dark
const DAY_ONLY_STALLS=[['colahq','newsstand'],['colahq','hotdog'],['colafactory','foodvan']];
// ---- Shops, by the name of the person who runs them: what they sell, as [item, how many, price in dollars]. The shop is open
// when its keeper is at their workplace (their loc); talk to them there to buy. Buying moves the item from their stock to your
// inventory.
// ---- The wardrobe: what you can look like. Hair and facial hair styles and colours are free to change; clothes (CLOTHES, by slot:
// hat, top, legs, shoes) must be owned. You start with PLAYER.clothes; the ones with an entry in ITEMS can be bought in the shops
// and go straight into the wardrobe. style picks how each is drawn (js/art.js lookChar), col its colour.
const HAIR_STYLES=[['short','Short'],['long','Long'],['bob','Bob'],['ponytail','Ponytail'],['curly','Curly'],['buzz','Buzz cut'],['bald','Bald']];
const BEARD_STYLES=[['none','Clean-shaven'],['stubble','Stubble'],['moustache','Moustache'],['goatee','Goatee'],['beard','Full beard']];
const HAIR_COLS=[['#1a1414','Black'],['#3a2418','Dark brown'],['#4a2e1a','Brown'],['#6b4423','Chestnut'],['#8a3a1e','Auburn'],['#c0662a','Ginger'],['#d8b060','Blonde'],['#ece0b0','Platinum'],['#8a8a8a','Grey'],['#e8e8e8','White']];
const CLOTHES={
nohat:{slot:'hat',name:'No hat',style:'none'},
beanie_yellow:{slot:'hat',name:'Yellow beanie',style:'beanie',col:'#e8c33a'},beanie:{slot:'hat',name:'Navy wool beanie',style:'beanie',col:'#2a3a5e'},
flatcap:{slot:'hat',name:'Tweed flat cap',style:'flatcap',col:'#7a6a4a'},ushanka:{slot:'hat',name:'Fur ushanka',style:'ushanka',col:'#6b4a2e'},
beret:{slot:'hat',name:'Black beret',style:'beret',col:'#2a2a33'},fedora:{slot:'hat',name:'Grey fedora',style:'fedora',col:'#5a5f68'},
parka_blue:{slot:'top',name:'Blue parka',style:'parka',col:'#2a5db0'},sweater_grey:{slot:'top',name:'Grey jumper',style:'sweater',col:'#7a7f88'},
shirt:{slot:'top',name:'Flannel shirt',style:'flannel',col:'#b03a2e'},sweater:{slot:'top',name:"Fisherman's jumper",style:'sweater',col:'#3d6a4a'},
suit:{slot:'top',name:'Tailored suit',style:'suit',col:'#2b2f3a'},trench:{slot:'top',name:'Trench coat',style:'trench',col:'#b8a070'},
jeans_blue:{slot:'legs',name:'Jeans',style:'jeans',col:'#2d3046'},khakis:{slot:'legs',name:'Khaki trousers',style:'trousers',col:'#8a7a5a'},
cords:{slot:'legs',name:'Brown corduroys',style:'cords',col:'#6b4a2e'},slacks:{slot:'legs',name:'Black trousers',style:'trousers',col:'#1e1e24'},
boots_brown:{slot:'shoes',name:'Brown boots',style:'boots',col:'#3b2a22'},sneakers:{slot:'shoes',name:'White sneakers',style:'sneakers',col:'#e8e8e4'},
snowboots:{slot:'shoes',name:'Snow boots',style:'snowboots',col:'#5a5f68'},oxfords:{slot:'shoes',name:'Black Oxfords',style:'shoes',col:'#1a1a1e'},
oilskin:{slot:'top',name:'Yellow oilskin',style:'parka',col:'#f0c020'},cableknit:{slot:'top',name:'Cable-knit jumper',style:'sweater',col:'#1e2a50'},peacoat:{slot:'top',name:'Pea coat',style:'trench',col:'#1e2a44'},
dungarees:{slot:'legs',name:'Dungarees',style:'trousers',col:'#3a5a8a'},wellies:{slot:'shoes',name:'Green wellies',style:'boots',col:'#2e5a2e'},
souwester:{slot:'hat',name:"Sou'wester",style:'souwester',col:'#f0c020'},watchcap:{slot:'hat',name:'Red watch cap',style:'beanie',col:'#c0392b'}};
const SHOPS={
Ray:{stock:[['beer',24,2],['whisky',10,4],['cigarettes',10,2]]},
Eddie:{stock:[['beer',24,2],['whisky',12,4],['cigarettes',10,2]]},
Linnea:{stock:[['beer',24,2],['whisky',8,4],['meal',8,9]]},
Sid:{stock:[['whisky',12,5],['beer',20,3],['cigarettes',10,2]]},
Mary:{stock:[['book',6,8],['islandmap',3,5],['newspaper',10,1]]},
Sanna:{stock:[['burger',20,3],['cola',20,1]]},
Maya:{stock:[['coffee',30,1],['bun',12,2]]},
Arvid:{stock:[['meal',10,12],['beer',12,3]]},
Juniper:{stock:[['shirt',5,25],['beanie',6,8],['sweater',4,30],['cords',4,35],['sneakers',3,40],['flatcap',4,12],['ushanka',3,20],['snowboots',3,45],['beret',3,15]]},
Grace:{stock:[['suit',2,120],['trench',2,90],['slacks',3,50],['oxfords',3,60],['fedora',3,35]]},
Nils:{stock:[['radio',3,40],['batteries',20,2],['film',10,6],['flashlight',4,10]]},
Jack:{stock:[['fishrod',3,30],['flashlight',2,10]]},
Olga:{stock:[['smokedfish',12,4]]},
Helmi:{stock:[['oilskin',3,40],['souwester',4,12],['wellies',3,25],['cableknit',4,30],['peacoat',2,60],['dungarees',3,28],['watchcap',5,8]]},
Frank:{stock:[['pistol',2,150],['ammo',10,12]]},
Wilma:{stock:[['souvenir',8,6],['cola',30,1]]},
Birgit:{stock:[['bread',10,1],['cola',24,1],['batteries',12,2],['cigarettes',20,2],['flashlight',3,9]]},
Lisa:{stock:[['bread',15,1],['cola',24,1],['beer',24,2],['cigarettes',20,2]]},
Ruby:{stock:[['record',12,9]]},
Ville:{stock:[['newspaper',20,1],['cigarettes',10,2],['islandmap',5,3]]},
Hannu:{stock:[['newspaper',20,1],['cigarettes',10,2],['islandmap',5,3]]},
Pirkko:{stock:[['burger',20,2],['hotdog',20,1],['coffee',30,1],['cola',20,1]]},
Rosaria:{stock:[['pizza',20,4],['wine',12,6]]},
Rosa:{stock:[['hotdog',30,1],['cola',20,1]]},
Dex:{stock:[['hotdog',30,1],['cola',20,1]]},
};
// Quests. Each has a giver (the person who offers it), a title and what it asks (text), what the giver says offering it (offer),
// when you take it on (accept) and if you come back before it's done (wait), and what happens when it's done (thanks).
// Main quests (main:true) belong to a day (day): their giver offers them that morning, you can take on only one main quest a day
// (taking one withdraws any others offered that day), and you can't sit and wait for the evening until it's done. Side quests
// (the rest) can be taken on and done at any time: from their first day (from), or once the places they need are open (opens:
// place ids, as on the island map). done lists its completion conditions; meeting all of them ends the quest, and with seq:true
// they're met in order, one at a time (or a condition with last:true waits until all the others are met). Each has a what (how
// the Quests tab lists it), optionally said (what happens as it's met), and one of:
//   give:item, to:name   talk to that person with the item in your inventory and agree to hand it over
//   use:label, m:place   face that piece of furniture in that place and press E
//   talk:name            have a conversation with that person (the condition's own chat, or the quest's, is what they say)
//   event:name           something happening in the game (questEvent): 'tattoo', getting a tattoo at Jonna's shop; 'alias',
//                        leaving the Cover Story Department's character creator
//   tour:name, price     pay that person for a tour, from CIA funds (the condition's chat is the tour; its first node's
//                        options are made for you: pay, or not now)
// from: the first day the quest can be offered (any day if left out). call: the giver offers it, and reminds you of it, on a video
// call (the big screen in your home), not in person.
// Someone with a quest to give has a star over their head (gold for a main quest, silver for a side quest), and a star on the
// island map marks where they are.
const QUESTS={
// ---- 22 August, at Langley: your alias, then your briefing. They're yours from the start of a new game (start:true).
alias:{title:'Prepare Your Alias',giver:'Doris',main:true,day:-9,start:true,text:'Before you go anywhere, you need a cover. Go to the Cover Story Department, off the lobby at CIA Headquarters, and have Doris make you up: choose how you look and what you wear.',
  done:[{event:'alias',what:'Choose your look and clothes in the Cover Story Department, off the lobby',gives:'briefing'}],
  thanks:'Your alias is ready: a foreign journalist, come to write about the island. Chuck is waiting to brief you, upstairs in the Langley Office.'},
briefing:{title:'Your Briefing',giver:'Chuck',main:true,day:-9,given:true,text:'Chuck is waiting for you in the Langley Office, up the stairs from the lobby. Go and get your briefing.',
  done:[{talk:'Chuck',what:'Get your briefing from Chuck, in the Langley Office upstairs',chat:{start:'a',nodes:{
    a:{say:"There you are. Sit down. Like the new look. You're going to Sarivalto, an island in the Baltic. Snow, fish, cola and not much else. Its king has just died, and right now nobody knows who's going to run the place.",opts:[['Who wants it?','b']]},
    b:{say:"Everyone. The Communists want the island in the Soviet Union, and Moscow would love a harbour that far north. The royals want the crown kept on Prince Leopold's head. Kelp Cola wants whoever's best for business. The Democrats want a vote. And there's an oil company and a syndicate sniffing around too.",opts:[['And what do we want?','c']]},
    c:{say:"An island that doesn't end up flying a red flag. Your codename is NIGHTJAR. Your cover's a foreign journalist, so ask all the questions you like. Our man there is Hekki, the radio tech: he's fixed you up a room under his shack, at the radio tower, with a radio set and a screen to reach me on.",opts:[['How long have I got?','d']]},
    d:{say:"You fly out for the first of September, and the island's yours for thirty days. Talk to everyone, help the people who'll help us, and call me every morning. Good luck, NIGHTJAR."}}}}],
  thanks:'"Don\'t trust anyone with a better cover than yours." You are ready to fly out on the first of September.'},
meetreds:{title:'Meet the Communists',giver:'Chuck',main:true,day:1,call:true,seq:true,text:'Report in to Chuck on the radio set in the Hidden Radio Room. Then Chuck wants a read on the Communist Party, who want the island to join the Soviet Union: go to their HQ in Saltwick and have a conversation with Anna, the Party leader.',
  offer:"Morning, NIGHTJAR. Glad you made it in one piece. Before anything else, report in properly: use the radio set there in the room, so Langley has it on the record that NIGHTJAR is in place. Then I'll give you your first job.",
  accept:"Good. Radio in and I'll brief you over the set.",wait:'Radioed in yet? Then get over to Saltwick and talk to Anna, at the Communist Party HQ. A friendly chat, nothing more.',
  done:[{use:'Radio Equipment',m:'hekki_room',what:'Report in to Chuck on the radio in the Hidden Radio Room',
      said:'You radio Chuck: NIGHTJAR has arrived safely on Sarivalto. "Good to hear it," crackles the reply. "First job: the Communist Party. They want this island in the Soviet Union, and that\'s exactly what we\'re here to stop. Their leader is a woman called Anna, at their HQ in Saltwick. Go and talk to her. Friendly. Find out where they stand, and don\'t tip your hand."'},
    {talk:'Anna',what:'Have a conversation with Anna, the Communist Party leader',said:'You have the measure of Anna. Report back to Chuck on the big screen in the Hidden Radio Room.'},
    {talk:'Chuck',what:'Report back to Chuck on the big screen in the Hidden Radio Room',chat:{start:'a',nodes:{
      a:{say:"NIGHTJAR. You saw Anna? What's the Party really after?",opts:[['She wants the island in the Soviet Union, and she means it.','b'],['She thinks the Americans want to buy the island.','c']]},
      b:{say:"That's what I was afraid of. A true believer's harder to deal with than a man with a price. Good work. Get some sleep: tomorrow, Kingsgrad."},
      c:{say:"She's not wrong, but don't you tell her that. Good work. Get some sleep: tomorrow, Kingsgrad."}}}}],
  thanks:'Chuck has your report on the Communist Party.',
  chat:{start:'a',nodes:{
    a:{say:"Comrade! Not many come in from the cold to visit us. What brings you to the Party's door?",opts:[['I want to know what the Party stands for.','b'],["I heard about the king. Everyone's talking about it.",'c'],["I'm a journalist, from abroad.",'d']]},
    b:{say:'Bread, work and dignity for the people of Sarivalto. The king is dead, and the crown should be buried with him. This island should join the Soviet Union, as a Soviet republic, and belong to the fishermen, the mill hands and the miners, not to the palace and the cola men.',opts:[['Join the Soviet Union?','e'],['Thank you for your time.',null]]},
    c:{say:'So is everyone. A king dies and the vultures circle: the royals, the Democrats, Kelp Cola, the Syndicate. This month decides who runs the island, and whether it finally takes its place in the Soviet Union.',opts:[['Where does the Party stand?','b'],["I'll keep my ears open.",null]]},
    d:{say:"A journalist! Then write this down: Sarivalto's future lies with the Soviet Union. Moscow will give this island what its kings never did.",opts:[['And what does Moscow get?','e'],['I will.',null]]},
    e:{say:"Friends, comrade. A harbour in the north, and an island that stands with the workers of the world. The Americans would rather we stayed a little kingdom they can buy. Now, I have a meeting. Come back any time."}}}},
// (a talk condition can have its own chat, for a quest with several people to talk to)
meetroyals:{title:'Meet the Royals',giver:'Chuck',main:true,day:2,call:true,text:'The road to Kingsgrad is open. Chuck wants to know the royal household: go to the Royal Palace and talk to each of the royal family and every one of their staff.',
  offer:"Morning, NIGHTJAR. Good work on Anna. The snow's cleared on the road to Kingsgrad, so today it's the palace. The old king's dead, and whoever ends up wearing the crown, or tearing it down, matters to us. Meet the family: Prince Leopold, his brother Augustus and his sister Daphne. And talk to the staff, every one of them. Butlers and maids hear everything.",
  accept:"Good. Be polite, be curious, and remember who said what.",wait:"Still working through the palace? All three royals, and every one of the staff. The maids and the laundress too.",
  done:[
    {talk:'Leopold',what:'Talk to Prince Leopold',chat:{start:'a',nodes:{
      a:{say:"You'll forgive me if I don't stand. My father's chair is larger than it looks. Are you here to offer condolences, or advice? I've had a great deal of both.",opts:[['Condolences, Your Highness.','b'],['Will you be crowned?','c']]},
      b:{say:"Thank you. He was a hard man to be the son of, and a harder one to lose. The island is watching me now, waiting to see whether I'm him."},
      c:{say:"If the island lets me. There are people in Saltwick who'd rather bury the crown with him, and people in Eastbrook who'd sell it. I mean to be crowned. Whether I'm king of anything afterwards is another question."}}}},
    {talk:'Augustus',what:"Talk to Augustus, the prince's brother",chat:{start:'a',nodes:{
      a:{say:"Shh. This is a library. Oh, you're new. Augustus. The other brother. The one who reads.",opts:[['What are you reading?','b'],['How is the family holding up?','c']]},
      b:{say:"The lives of the saints. Father Thyme at the monastery lends them to me. They all suffered beautifully. I've not got the knack of it yet."},
      c:{say:"Leopold talks to everyone and listens to no one. Daphne listens to everyone and tells no one. I pray. Between us we make one decent king."}}}},
    {talk:'Daphne',what:"Talk to Daphne, the prince's sister",chat:{start:'a',nodes:{
      a:{say:"A new face! Walk with me, the gardens are the only place in the palace where the walls don't have ears. Well, Viktor has ears, but he only uses them for birdsong.",opts:[['Who would listen at the walls?','b'],['It must be a difficult time.','c']]},
      b:{say:"Everyone, darling. The Party, the Americans, the cola people, my own brothers. Half the island wants something from this family, and the other half wants it gone. I find it terribly exciting."},
      c:{say:"For Leopold, yes. He has to be Father now. I only have to be charming, which I was going to be anyway."}}}},
    {talk:'Edmund',what:'Talk to Edmund, the butler',chat:{start:'a',nodes:{
      a:{say:"Good morning. Edmund, butler to the household these thirty-one years. If you've business with the family, you have it through me.",opts:[["Just paying my respects.",'b'],['You must know the palace better than anyone.','c']]},
      b:{say:"Very good. The household is in mourning; you'll keep your voice down in the Grand Hall, and your hands off the silver."},
      c:{say:"I know every room, every key and every secret in it, sir. Which is precisely why I keep them."}}}},
    {talk:'Oskar',what:'Talk to Oskar, the footman',chat:{start:'a',nodes:{
      a:{say:"Morning! Oskar, footman. I open the doors, carry the bags and stand very still in the cold. Mostly the cold.",opts:[['Seen anything interesting?','b'],['Busy since the king died?','c']]},
      b:{say:"Visitors I've never seen before, coming up the drive late at night. Men in good coats. Mr Edmund says I didn't see them, so I didn't."},
      c:{say:"Run off my feet. Everyone on the island wants to come and look sorry at the prince."}}}},
    {talk:'Marta',what:'Talk to Marta, the cook',chat:{start:'a',nodes:{
      a:{say:"Out of my way unless you're carrying onions. Marta. I cook for the family, the staff and every hungry fool who wanders into my kitchen.",opts:[['What does the prince like to eat?','b'],['How are the staff taking it?','c']]},
      b:{say:"Herring, like his father. Daphne eats nothing and says it's delicious. Augustus fasts on saints' days, and he's found a lot of saints lately."},
      c:{say:"We cried on Sunday and we cooked on Monday. A palace still has to eat, whoever sits on the throne."}}}},
    {talk:'Ingrid',what:'Talk to Ingrid, the maid',chat:{start:'a',nodes:{
      a:{say:"Oh! I wasn't listening, I was dusting. Ingrid. I keep the royal apartments.",opts:[['What do you hear up here?','b'],['Is it a good place to work?','c']]},
      b:{say:"The prince walking the floor half the night. Letters burned in the grate in the morning. I don't read them. I just notice the ashes."},
      c:{say:"It's warm and the food's good. You keep your head down and your apron clean."}}}},
    {talk:'Lotta',what:'Talk to Lotta, the maid',chat:{start:'a',nodes:{
      a:{say:"Mind the tablecloth, it's just been pressed. Lotta. I set the dining room and clear it again.",opts:[['Who comes to dinner these days?','b'],['Do the family eat together?','c']]},
      b:{say:"A man from Kelp Cola last week, all teeth. And the colonel from the barracks. They talked about the succession over the soup and stopped when I came in with the fish."},
      c:{say:"They sit together. They don't talk together. It's a long table."}}}},
    {talk:'Viktor',what:'Talk to Viktor, the groundskeeper',chat:{start:'a',nodes:{
      a:{say:"Mind the hedges. Viktor. I keep the grounds, such as they are under all this snow.",opts:[['Quiet work?','b'],['Do you see much out here?','c']]},
      b:{say:"Quiet enough to hear a robin a field away. And the front gate creaking at midnight."},
      c:{say:"Everything comes and goes by the front gate, and the front gate goes past my shed. I don't say. Nobody asks a gardener."}}}},
    {talk:'Elsa',what:'Talk to Elsa, the laundress',chat:{start:'a',nodes:{
      a:{say:"You'll want to stand back, this is all starch. Elsa. Every sheet and shirt in the palace comes through this room.",opts:[['You must learn a lot from the laundry.','b'],['Hard work?','c']]},
      b:{say:"Lipstick on a collar that's no one's wife's. Mud from the harbour on the prince's boots. Laundry never lies, love. People do."},
      c:{say:"Hard on the hands, easy on the head. And nobody notices a laundress."}}}},
    // (last: only once you've talked to everyone else)
    {talk:'Chuck',last:true,what:'Report back to Chuck on the big screen in the Hidden Radio Room',chat:{start:'a',nodes:{
      a:{say:"NIGHTJAR. You've been through the whole palace? Tell me what you've got.",opts:[['Leopold means to be crowned, whatever it takes.','b'],['The staff say strange visitors come up the drive at night.','c']]},
      b:{say:"Then he's either our best friend on this island or our biggest headache. We'll find out which. Good work: that's the household on file."},
      c:{say:"Men in good coats at midnight. Find out whose coats, and you'll know who wants that crown. Good work: that's the household on file."}}}}],
  thanks:"Chuck has your report on the royal household."},
meetcola:{title:'Meet the Cola Boys',giver:'Chuck',main:true,day:3,call:true,seq:true,text:'Kelp Cola HQ in Kingsgrad is open. Chuck wants you to meet Phil, the company\'s CEO, in his office upstairs at the HQ, then report back.',
  offer:"Morning, NIGHTJAR. Kelp Cola's headquarters in Kingsgrad is open for business. They bottle half the money on this island, and their man Harald wants to lead the Republicans. Go and meet the CEO, Phil. His office is upstairs at the HQ. Find out what kind of man he is.",
  accept:"Good. Drink whatever he pours you.",wait:"Met Phil yet? Kelp Cola HQ, Kingsgrad. His office is upstairs.",
  done:[
    {talk:'Phil',what:'Meet Phil, the CEO of Kelp Cola, in his office at Kelp Cola HQ',gives:'colatour',said:'Phil wants you to take the tour at the Kelp Cola Museum in Eastbrook and tell him what you thought. Now report back to Chuck on the big screen in the Hidden Radio Room.',chat:{start:'a',nodes:{
      a:{say:"Come in, come in! Phil, Kelp Cola. Sit down, have a cold one. On the house. Now, what brings you up to my office?",opts:[["What do you make of the king's death?",'b'],['How did Kelp Cola get started?','c']]},
      b:{say:"A tragedy. And bad for business: nobody buys when nobody knows who's in charge. This island needs a steady hand, and a steady hand needs a good drink. But you'll never understand us till you've seen where we came from.",opts:[['Where you came from?','d']]},
      c:{say:"Ha! That's a story my mascot tells better than I do.",opts:[['Your mascot?','d']]},
      d:{say:"We've a museum in Eastbrook. Kelpy gives the tour. Once the snow's off the road, go and take it, then come back here and tell me what you thought. I want to know how it plays to a newcomer."}}}},
    {talk:'Chuck',what:'Report back to Chuck on the big screen in the Hidden Radio Room',chat:{start:'a',nodes:{
      a:{say:"NIGHTJAR. You met Phil? What's he like?",opts:[['Friendly. He wants me to take the tour at his museum.','b'],['He thinks the island needs a steady hand.','c']]},
      b:{say:"Then take it, when you can get to Eastbrook. A man who wants you to hear his story wants you on his side. Find out what that's worth to him. Good work."},
      c:{say:"His hand, I'll bet. Kelp Cola wants a say in who runs this island, and Harald's their way in. Keep close to Phil. Good work."}}}}],
  thanks:"Chuck has your report on Phil and Kelp Cola."},
// given: offered by no one (no star); another quest's condition gives it to you (gives: a quest, or a list of them). A condition
// can also wait (days: how many days after the one before it, in a quest in order), give you an item as it's met (gift), and say
// so on the morning it's ready (arrives).
colatour:{title:'The Kelp Cola Tour',giver:'Phil',given:true,seq:true,text:'Phil wants you to take the tour of the Kelp Cola Museum in Eastbrook, given by Kelpy the mascot, once you can get there, then go back to his office at Kelp Cola HQ and tell him what you thought.',
  wait:"Been to the museum yet? Eastbrook, once the road's clear. Kelpy will look after you.",
  done:[
    {tour:'Jaana',price:5,what:'Take the tour of the Kelp Cola Museum in Eastbrook, with Kelpy the mascot',said:'That was the Kelp Cola story, as the company tells it. Now go back to Phil at Kelp Cola HQ and tell him what you thought.',chat:{start:'a',nodes:{
      a:{say:"Hiya, hiya! I'm Kelpy, the Kelp Cola cup! Welcome to the Kelp Cola Museum! The grand tour is five dollars. Ready for the fizz-tory of Kelp Cola?"},
      b:{say:"Follow me! A long, long time ago, before there was any Kelp Cola, there was a beach, and on that beach there was kelp. Lots and lots of kelp! It washed up on the sand after every storm.",opts:[['Go on.','c']]},
      c:{say:"Well, our CEO Phil's grandfather gathered up that kelp from the shore, took it home, and brewed it into a health tonic! Folk swore by it: for colds, for aches, for the long winter blues!",opts:[['A health tonic?','d']]},
      d:{say:"Yes indeedy! And over the years the recipe got better and better: a little less seaweed, a lot more fizz! It's been refined and passed down through the family, all the way to Phil.",opts:[["So what's in it?",'e']]},
      e:{say:"Ooh, nobody knows! The recipe is a closely guarded secret. Only the family knows it, and it's locked away somewhere very, very safe. Not even Kelpy knows, and I'm made of the stuff! Thanks for taking the tour! The gift shop is right this way!"}}}},
    {talk:'Phil',what:'Go back to Phil at Kelp Cola HQ and tell him what you thought of the tour',chat:{start:'a',nodes:{
      a:{say:"You took the tour! Well? What did you think?",opts:[['Seaweed off the beach to all this. Remarkable.','b'],['I was hoping to learn the secret recipe.','c'],["Kelpy's quite something.",'d']]},
      b:{say:"Isn't it? My grandfather started with a cooking pot and a bucket of kelp. If he could see the bottling line now, he'd weep. Proud tears, mind."},
      c:{say:"Ha! Everyone does. That recipe's the best-kept secret on this island, and that includes whatever's in the palace vault. It stays in the family."},
      d:{say:"Best Kelpy we've ever had. Never once taken the head off in public. You'd be amazed how rare that is."}}}}],
  thanks:'"Come back any time. There\'s always a cold one in the fridge for a friend of Kelp Cola."'},
meetdems:{title:'Meet the Democrats',giver:'Chuck',main:true,day:4,call:true,seq:true,text:'Eastbrook is open. Chuck wants you to meet Erik, the Democratic Party leader, at the community centre in Eastbrook, then report back.',
  offer:"Morning, NIGHTJAR. The road into Eastbrook's clear. That's Democrat country: timber, coffee and union cards. Their leader's a man called Erik, and he runs things out of the community centre. Go and meet him. Of everyone on this island, they're the likeliest friends we've got. Find out what they need.",
  accept:"Good. Be useful to him. Useful people get told things.",wait:"Met Erik yet? Community centre, Eastbrook.",
  done:[
    {talk:'Erik',what:'Meet Erik, the Democratic Party leader, at the community centre in Eastbrook',gives:['tattoo','beans'],said:'Erik would be grateful if you helped out two of the Party\'s members: Jonna at the tattoo shop, and Maya at the Coffee Roasters. Now report back to Chuck on the big screen in the Hidden Radio Room.',chat:{start:'a',nodes:{
      a:{say:"Welcome, welcome! Erik, Democratic Party. Mind the boxes, it's leaflet day. You're the foreign journalist everyone's talking about?",opts:[['What do the Democrats stand for?','b'],['How can I help?','c']]},
      b:{say:"A free vote, a fair wage and nobody on this island answering to Moscow, a palace or a cola company. We're mill hands, shopkeepers, roasters, the people who keep Eastbrook running.",opts:[['How can I help?','c']]},
      c:{say:"Help? Now there's a word I like. Two of our members could use a friend. Jonna at the tattoo shop hasn't had a customer since the snow came: if you're brave, sit in her chair. And Maya at the Coffee Roasters can't get decent beans since the harbour master started taxing imports. If you know anyone who can bring something in quietly...",opts:[["I'll see what I can do.",'d']]},
      d:{say:"That's the spirit. Either one, or both if you're feeling generous. Eastbrook remembers its friends."}}}},
    {talk:'Chuck',what:'Report back to Chuck on the big screen in the Hidden Radio Room',chat:{start:'a',nodes:{
      a:{say:"NIGHTJAR. You met Erik? What did he want?",opts:[['Help for his members: a tattoo, and some coffee beans.','b'],['He wants nobody answering to Moscow.','c']]},
      b:{say:"Ha! Cheapest friendship we'll ever buy. If you need the beans brought in, call me: the diplomatic pouch has room. Good work."},
      c:{say:"Then he's our man, or near enough. Help him out, and he'll help us when it counts. And if you need anything brought in, call me. Good work."}}}}],
  thanks:"Chuck has your report on Erik and the Democrats."},
tattoo:{title:"Jonna's First Customer",giver:'Erik',given:true,text:"Erik says Jonna at the tattoo shop in Eastbrook (INK AND PINE) hasn't had a customer since the snow came. Ask her for a tattoo, by day in her shop, and get one done.",
  done:[{event:'tattoo',what:"Get a tattoo at Jonna's tattoo shop in Eastbrook"}],
  thanks:'"Not bad for a first-timer. Tell your friends!" Jonna says.'},
beans:{title:'Beans for Maya',giver:'Erik',given:true,seq:true,text:'Erik says Maya at the Coffee Roasters in Eastbrook can\'t get decent coffee beans since the harbour master started taxing imports. Ask Chuck to have some brought in; they come the next day, and Hekki will give them to you. Then take them to Maya.',
  done:[
    {talk:'Chuck',what:'Ask Chuck on the big screen to have some coffee beans brought in',chat:{start:'a',nodes:{
      a:{say:"Coffee beans? You want me to put coffee beans in the diplomatic pouch?",opts:[["They're for a friend of a friend. A Democrat.",'b']]},
      b:{say:"Fine. The good stuff, from Colombia. It'll come in on tonight's drop, and Hekki will have it for you in the morning. Don't make a habit of this."}}}},
    {talk:'Hekki',days:1,gift:'beans',arrives:'Hekki has a package for you: the coffee beans came in on the night drop.',what:'Collect the coffee beans from Hekki (they come the day after you ask Chuck)',chat:{start:'a',nodes:{
      a:{say:"Package for you, came in on the night drop. Smells like a coffee shop in Rio. Here you go."}}}},
    {give:'beans',to:'Maya',what:'Take the coffee beans to Maya at the Coffee Roasters in Eastbrook'}],
  thanks:"Colombian? Real Colombian beans? Oh, you wonderful person. Your coffee's on the house, forever. Well, for a week."},
pizza:{title:'Pizza for Buttons',giver:'Buttons',opens:['lake','town'],text:'Buttons the jester is starving. Bring him a slice of pizza from the pizzeria in Kingsgrad.',
  offer:"Psst! A jester can't live on laughs alone. Fetch me a slice of pizza from Kingsgrad and I'll be forever in your debt!",
  accept:'Splendid! Pepperoni, if they have it. Hurry back!',wait:'No pizza yet? My stomach is doing somersaults!',
  done:[{give:'pizza',to:'Buttons',what:'Give Buttons a slice of pizza'}],
  thanks:'"Mmm, pizza! You\'re a true friend. Have a free juggle on me!"'}};

// ---- Building doors: [outerId, doorX, doorY, frontDX, frontDY, innerId, innerDoorX?, innerDoorY?, innerArriveDX?, innerArriveDY?]
// The inner door defaults to the bottom centre of the interior. Walk onto a door tile to go in (or out).
const DOORS=[['second',4,8,0,1,'eblofts'],['second',11,8,0,1,'house_pekka'],['second',19,8,0,1,'kcmuseum_in'],['second',28,8,0,1,'house_henrik'],
['second',31,8,0,1,'house_nora'],['second',38,8,0,1,'commcentre'],['second',4,14,0,1,'cedargrill'],['second',9,14,0,1,'cafe'],['second',15,14,0,1,'records_in'],
['second',21,14,0,1,'tattoo'],['second',29,14,0,1,'clothes_in'],['second',36,14,0,1,'newsroom'],['second',44,14,0,1,'tavern'],['millroad',10,5,0,1,'mill_in'],
['village',6,10,0,1,'plant'],['village',20,10,0,1,'hq'],['village',35,10,0,1,'apartments'],['village',5,18,0,1,'bar'],
['village',14,18,0,1,'fishshop'],['village',21,26,0,1,'outfitters_in'],['village',21,18,0,1,'house_tom'],['village',27,18,0,1,'house_sam'],
['village',33,18,0,1,'house_bob'],['village',39,18,0,1,'house_kate'],['bar',16,2,0,1,'barflat',10,2,0,-1],['kchq_in',15,1,0,1,'kchq2',14,3,0,-1],
['palace',12,6,0,1,'palacehall'],['palacehall',5,0,0,1,'royalrooms'],['palacehall',12,0,0,1,'throne'],['palacehall',19,0,0,1,'library'],
['palacehall',0,6,1,0,'dining',19,6,-1,0],['palacehall',23,6,-1,0,'chapel'],['dining',0,6,1,0,'kitchen',17,6,-1,0],['kitchen',0,6,1,0,'servants',17,6,-1,0],['palace',5,6,0,1,'servants'],
['kitchen',15,2,0,-1,'winecellar',16,7,0,1],['library',18,1,0,1,'vault'],['gated',13,7,0,1,'villa_phil'],['gated',27,7,0,1,'villa_dario'],['gated',13,15,0,1,'villa_gustavo'],['gated',27,15,0,1,'clubroom'],
['monastery',15,13,0,1,'house_thyme'],['monastery',6,13,0,1,'monks'],['monastery',10,7,0,1,'monchurch'],['radio',14,3,0,1,'shack_hekki'],['shack_hekki',8,1,0,1,'hekki_room',7,8],['radio',3,5,0,1,'transhut'],['beach',9,5,0,1,'tent_pat'],
['town',17,9,0,1,'gunshop'],['town',23,9,0,1,'citybar'],['town',11,19,0,1,'supermarket'],['town',18,19,0,1,'tailor'],['town',23,19,0,1,'bookshop'],
['town',9,27,0,1,'house_frank'],['town',14,27,0,1,'house_lisa'],['town',19,27,0,1,'house_eddie'],['town',23,27,0,1,'house_grace'],['town',31,6,0,1,'cinemain'],
['town',39,6,0,1,'estateagent'],['town',30,14,0,1,'fishingshop'],['town',35,14,0,1,'house_forsale'],['volcano',9,19,0,1,'spa_in'],['second',44,8,0,1,'house_forsale_eb'],['fishing',36,13,0,1,'house_forsale_fh'],['gated',35,14,0,1,'villa_forsale'],['town',40,14,0,1,'house_vince'],['town',29,21,0,1,'house_mary'],
['town',34,21,0,1,'house_jack'],['town',39,21,0,1,'house_sally'],['town',30,28,0,-1,'sewers'],['town',48,6,0,1,'police'],['town',48,13,0,1,'doctor'],['fishing',17,13,0,1,'jazz_in'],['apartments2',22,8,0,1,'apartments3',22,10,0,-1],['skyapts2',22,8,0,1,'skyapts3',22,10,0,-1],['skyapts3',22,8,0,1,'skyapts4',22,10,0,-1],['eblofts2',22,8,0,1,'eblofts3',22,10,0,-1],['eblofts3',22,8,0,1,'eblofts4',22,10,0,-1],['kgapts2',22,8,0,1,'kgapts3',22,10,0,-1],['kgapts3',22,8,0,1,'kgapts4',22,10,0,-1],['hsresid',22,8,0,1,'hsresid2',22,10,0,-1],['lake',30,11,0,1,'bigtop_in'],['lake',23,10,0,1,'caravan1_in'],['lake',36,10,0,1,'caravan2_in'],['lake',27,17,0,1,'caravan3_in'],['apartments',22,8,0,1,'apartments2',22,10,0,-1],['skyapts',22,8,0,1,'skyapts2',22,10,0,-1],['eblofts',22,8,0,1,'eblofts2',22,10,0,-1],['kgapts',22,8,0,1,'kgapts2',22,10,0,-1],
['town',11,34,0,1,'pizzeria_in',9,11],['oilrig',11,9,0,1,'crewq'],['oilrig',5,5,0,1,'derrick_in'],['oilhq',8,5,0,1,'dphq_in'],['oilhq',3,11,0,1,'depot_in'],['fishing',4,6,0,1,'petro_in'],['fishing',25,6,0,1,'bank_in'],['farm',6,6,0,1,'farmhouse_in'],['farm',14,5,0,1,'barn_in'],['farm',25,3,0,-1,'oldbarn_in',9,0,0,1],['town',11,9,0,1,'civil_in'],['colahq',8,5,0,1,'kchq_in'],['colafactory',8,6,0,1,'kcfac_in'],['colafactory',18,4,0,1,'kcwhs_in'],['harbour',16,4,0,1,'whs_in'],['barracks',7,8,0,1,'barrA_in'],['barracks',25,8,0,1,'barrB_in'],['barracks',13,3,0,1,'gp_in'],['barracks',6,18,0,1,'arm_in'],['barracks',25,18,0,1,'offhq_in'],['kalanharbour',5,10,0,1,'fuel_in'],['kalanharbour',18,10,0,1,'port_in'],['savilaharbour',5,4,0,1,'customs_in'],['savilaharbour',3,16,0,1,'ebwhs_in'],['savilaharbour',31,6,0,1,'lighthouse_in'],['fishing',17,6,0,1,'skyapts'],['fishing',11,6,0,1,'hotel_lobby'],['hotel_lobby',17,1,0,1,'hotel_floor',22,9,0,-1],['langley',18,1,0,1,'langley_hall',19,3,0,-1],['langley_hall',5,0,0,1,'langley_office'],['langley_hall',14,0,0,1,'langley_george'],['langley',0,6,1,0,'langley_cover',15,6,-1,0],['langley',21,6,-1,0,'langley_cafe',0,6,1,0],['langley',4,3,0,-1,'langley_basement',14,7,0,1],['fishing',5,13,0,1,'electro'],['fishing',12,13,0,1,'arcadein'],['fishing',32,13,0,1,'mart'],['fishing',32,6,0,1,'casino'],
['gated',34,7,0,1,'hsresid'],['town',14,4,0,1,'kgapts'],['fishing',24,13,0,1,'burgerbar'],['fishing',36,6,0,1,'repubhq'],['chapel',14,2,0,-1,'crypt',14,7,0,1]];
// Doors into these places only open when the player presses the action key (E) while standing on them, instead of by walking on.
const PRESS_DOORS=new Set(['sewers']);
// ---- How each building looks from outside (feature style key -> look). kind: gable, flat or tall
const BLD={
// Saltwick is run down: wear (0..1) peels the paint, boards up windows, patches the roofs and knocks letters off the signs.
plant:{kind:'flat',wall:'#7d8790',roof:'#55606a',trim:'#3d4852',win:'#8fa6b4',deco:'plant',wear:.6,tex:'metal'},
hq:{kind:'flat',wall:'#94473c',roof:'#5f2d25',trim:'#d8ccb4',win:'#d8b860',deco:'hq',wear:.35},
apt:{kind:'tall',wall:'#a39d90',roof:'#5b5b56',trim:'#4a4a4a',win:'#6f8fa4',deco:'apt',wear:.75},
bar:{kind:'gable',wall:'#4e3a2c',roof:'#2f2a36',trim:'#2b1d14',win:'#c9a850',deco:'bar',wear:.7},
shop:{kind:'gable',wall:'#b4c8cc',roof:'#3a5f78',trim:'#c8d4d8',win:'#8fb4c4',deco:'shop',wear:.6},
h1:{kind:'gable',wall:'#c4ad78',roof:'#6e4a32',trim:'#d8d0c0',win:'#9ab0c0',chim:.25,wear:.7},
h2:{kind:'gable',wall:'#7a9478',roof:'#3b4a3b',trim:'#c8d0c0',win:'#9ab0c0',chim:.7,sh:'#3a4a3a',wear:.8},
h3:{kind:'gable',wall:'#a8806a',roof:'#4a4f54',trim:'#d4c4b4',win:'#9ab0c0',chim:.5,attic:1,wear:.65},
barrA:{kind:'flat',wall:'#6b7a4f',roof:'#4a5438',trim:'#2f3828',win:'#a9c7da',deco:'mil',sign:'BLOCK A',signc:'#3a4a2a'},
barrB:{kind:'flat',wall:'#8a8466',roof:'#5d5a44',trim:'#3a382a',win:'#a9c7da',deco:'mil',sign:'BLOCK B',signc:'#3a4a2a'},
arm:{kind:'flat',wall:'#5d6068',roof:'#3a3d44',trim:'#25282e',win:'#7d8696',deco:'mil',sign:'ARMOURY',signc:'#c0392b',tex:'brick'},
offhq:{kind:'flat',wall:'#7a8a6a',roof:'#505c42',trim:'#e0dcc0',win:'#f2d16b',deco:'mil',sign:'HQ',signc:'#3a4a2a',flag:'#4a5a3a'},
gp:{kind:'gable',wall:'#6b7a4f',roof:'#3a3d44',trim:'#2f3828',win:'#f2d16b'},
whs:{kind:'gable',wall:'#76808a',roof:'#555c64',trim:'#3d4650',win:'#8fa6b4',deco:'whs',tex:'metal',wear:.7},
ebwhs:{kind:'gable',wall:'#4f6b4a',roof:'#3a3530',trim:'#efe2c4',win:'#f2d16b',deco:'whs',tex:'siding'},
mast:{kind:'mast'},
hut:{kind:'flat',wall:'#9aa0a6',roof:'#6b7178',trim:'#4a5058',win:'#a9c7da',deco:'hut'},
palace:{kind:'flat',wall:'#efe6cf',roof:'#4a6a9a',trim:'#c9a040',win:'#bcd9ea',deco:'palace'},
church:{kind:'gable',wall:'#b8b2a6',roof:'#3d4a5a',trim:'#e8e2d4',win:'#c9a0e0',deco:'church',tex:'brick',gothic:1,stained:1,spire:1},
rectory:{kind:'gable',wall:'#cfc8bc',roof:'#4a3a5a',trim:'#f2f2f2',win:'#bcd9ea',chim:.7,gothic:1},
// Hope Springs is immaculate: gold trim, columns, and window boxes full of flowers (planter colours)
villa1:{kind:'gable',wall:'#f7f2e6',roof:'#7a4234',trim:'#c9a040',win:'#a9d4e8',chim:.75,porch:1,planter:['#e07a9a','#c0392b','#f2f2f2']},
villa2:{kind:'flat',wall:'#efe9dc',roof:'#9aa0a6',trim:'#c9a040',win:'#a9d4e8',cols:'#fff8e8',planter:['#ffd23a','#f2f2f2','#e07a9a']},
spa:{kind:'gable',wall:'#5a3a26',roof:'#3a3530',trim:'#efe2c4',win:'#f2d16b',tex:'siding',chim:.8,chim2:.2,porch:1,sign:'HOT SPRINGS SPA',signk:'wood',lights:['#ffd23a','#ff8a3a','#7fd0a0']},
hotpool:{kind:'hotspring'},
villa4:{kind:'gable',wall:'#f2e8e0',roof:'#4a5a6a',trim:'#c9a040',win:'#a9d4e8',chim:.7,porch:1,planter:['#f2f2f2','#e07a9a','#ffd23a']},
villa3:{kind:'gable',wall:'#e2d4b4',roof:'#2f4a3a',trim:'#c9a040',win:'#a9d4e8',chim:.3,porch:1,planter:['#7d3c98','#e07a9a','#f2f2f2']},
hsresid:{kind:'tall',wall:'#f7f2e6',roof:'#4a6a9a',trim:'#c9a040',win:'#a9d4e8',planter:['#e07a9a','#f2f2f2','#ffd23a'],sign:'RESIDENCES',signk:'brass'},
club:{kind:'flat',wall:'#2f3d4a',roof:'#3a3d44',trim:'#c9a040',win:'#f2d16b',cols:'#e8e2d4',sign:'THE CLUB',signk:'brass'},
shack:{kind:'gable',wall:'#7a6048',roof:'#5a5f68',trim:'#4a3a2a',win:'#a9c7da',chim:.2,cable:'#b8322a'},
tent:{kind:'tent'},
manhole:{kind:'manhole'},
civilservice:{icon:'crest',kind:'flat',wall:'#d8d4cc',roof:'#5b636c',trim:'#3a3d44',win:'#bcd9ea',tex:'brick',cols:'#efe9dc',sign:'CIVIL SERVICE',signc:'#2b2f3a',flag:'#2e5f8f'},
gunshop:{icon:'pistol',kind:'gable',wall:'#6b5a48',roof:'#3a3d44',trim:'#2b2f3a',win:'#a9c7da',sign:'GUNS',signc:'#c0392b',awn:'#4a5a3a'},
citybar:{icon:'beer',kind:'gable',wall:'#5a2e2a',roof:'#2f2a36',trim:'#2b1d14',win:'#f2d16b',deco:'bar'},
supermarket:{icon:'basket',kind:'flat',wall:'#e8e2d4',roof:'#9aa0a6',trim:'#2e9d57',win:'#cfe8f0',sign:'MARKET',signc:'#2e9d57',awn:'#2e9d57'},
tailor:{icon:'scissors',kind:'gable',wall:'#d8c8e0',roof:'#5a3a6a',trim:'#f2f2f2',win:'#bcd9ea',sign:'TAILOR',signc:'#7d3c98',awn:'#7d3c98'},
bookshop:{icon:'book',kind:'gable',wall:'#3d5a4a',roof:'#5a3a26',trim:'#e8dcc0',win:'#f2d16b',sign:'BOOKS',signc:'#3d5a4a',awn:'#8a3a2a'},
casino:{nlogo:'spade',kind:'flat',wall:'#2a1a3a',roof:'#3a2a4a',trim:'#c9a040',win:'#f2d16b',deco:'casino',tube:'#ffd23a'},
pizzeria:{icon:'pizza',kind:'gable',wall:'#e8d8b8',roof:'#7a2a1e',trim:'#2e6f3a',win:'#f2d16b',tex:'brick',sign:'PIZZERIA',signc:'#c0392b',awn:'#c0392b'},
estate:{icon:'house',kind:'flat',wall:'#f2ede0',roof:'#8a9099',trim:'#2e6f9a',win:'#bcd9ea',sign:'ESTATE AGENT',signc:'#2e6f9a'},
fishingshop:{icon:'fish',kind:'gable',wall:'#cfe6ee',roof:'#2e6f9a',trim:'#f2f2f2',win:'#a9d4e8',sign:'TACKLE',signc:'#2e6f9a',awn:'#2e6f9a'},
kgapt:{kind:'tall',wall:'#b8735a',roof:'#5b5b56',trim:'#f2ede0',win:'#bcd9ea',tex:'brick'},
doctor:{icon:'cross',kind:'flat',wall:'#f2ede0',roof:'#8a9099',trim:'#c0392b',win:'#bcd9ea',sign:'DOCTOR',signc:'#c0392b'},
police:{icon:'badge',kind:'flat',wall:'#3a4a6a',roof:'#2b2f3a',trim:'#e8ecef',win:'#bcd9ea',tex:'brick',sign:'POLICE',signc:'#1f3a5f',flag:'#1f3a5f'},
th1:{kind:'gable',wall:'#e8c88a',roof:'#7a4234',trim:'#ffffff',win:'#bcd9ea',chim:.25},
th2:{kind:'gable',wall:'#9ab8c8',roof:'#3d4a5a',trim:'#f2f2f2',win:'#bcd9ea',chim:.7,sh:'#2e5f8f'},
th3:{kind:'gable',wall:'#c88a7a',roof:'#4a4f58',trim:'#f4e2d0',win:'#bcd9ea',chim:.5,attic:1},
th4:{kind:'gable',wall:'#b8d0a8',roof:'#3b5a3b',trim:'#ffffff',win:'#bcd9ea',chim:.3,porch:1},
fhouse:{kind:'flat',wall:'#d8dce2',roof:'#5b636c',trim:'#2b2f3a',win:'#7fb0d0',glass:1,tex:'panel'},
eb3:{kind:'gable',wall:'#7a8a5a',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',chim:.7,porch:1,tex:'siding'},
th5:{kind:'gable',wall:'#d8d4cc',roof:'#6b6b66',trim:'#ffffff',win:'#9aa8b4',chim:.6},
chapel:{kind:'gable',wall:'#efe6cf',roof:'#4a6a9a',trim:'#c9a040',win:'#c9a0e0',deco:'church',tex:'brick'},
fountain:{kind:'fountain'},
monkq:{kind:'gable',wall:'#b8b2a6',roof:'#3d4a5a',trim:'#e8e2d4',win:'#bcd9ea',tex:'brick',chim:.2,chim2:.8,gothic:1},
h4:{kind:'gable',wall:'#98a8b4',roof:'#2e4f78',trim:'#8fa0ac',win:'#9ab0c0',chim:.8,porch:1,wear:.75},
derrick:{kind:'derrick'},
crew:{kind:'flat',wall:'#d8dce0',roof:'#8a9099',trim:'#e8792a',win:'#a9c7da',tex:'metal'},
dphq:{kind:'flat',wall:'#8a9aa8',roof:'#37474f',trim:'#37474f',win:'#9fc6e0',sign:'DIVERSIFIED PETROLEUM',signc:'#37474f',flag:'#37474f'},
depot:{kind:'gable',wall:'#7d8a96',roof:'#37474f',trim:'#2b2f3a',win:'#a9c7da',deco:'whs',tex:'metal'},
ck1:{kind:'gable',wall:'#a33b2f',roof:'#3a3d44',trim:'#f2f2f2',win:'#bcd9ea',chim:.3},
ck2:{kind:'gable',wall:'#c9a040',roof:'#5a3a26',trim:'#f2f2f2',win:'#bcd9ea',chim:.6,sh:'#5a3a26'},
ck3:{kind:'gable',wall:'#4a6a8a',roof:'#3a3d44',trim:'#f2f2f2',win:'#bcd9ea',chim:.5,porch:1},
netshed:{kind:'gable',wall:'#6b5a48',roof:'#5b636c',trim:'#3d3228',win:'#a9c7da',deco:'whs',tex:'siding'},
smokehouse:{kind:'gable',wall:'#5a4636',roof:'#3a3530',trim:'#2b2118',win:'#f2d16b',tex:'siding',chim:.2,chim2:.8,sign:'SMOKED FISH',signc:'#5a4636'},
farmhouse:{kind:'gable',wall:'#e8dcc0',roof:'#7a4234',trim:'#a33b2f',win:'#bcd9ea',chim:.3,porch:1},
barn:{kind:'gable',wall:'#a33b2f',roof:'#4a4f58',trim:'#f2f2f2',win:'#a9c7da',deco:'whs',tex:'siding'},
kchq:{kind:'flat',wall:'#e8f2ea',roof:'#4a5a50',trim:'#2e9d57',win:'#9fd6c0',sign:'KELP COLA',signc:'#2e9d57',flag:'#2e9d57'},
newsstand:{kind:'kiosk'},
jazz:{nlogo:'note',kind:'flat',wall:'#1e1a2e',roof:'#2b2f3a',trim:'#c9a040',win:'#f2b04a',awn:'#5a1a2a',sign:'MIDNIGHT NOTE',signk:'neon',signc:'#3b8bff',marquee:'LIVE JAZZ',tube:'#3b8bff'},
swnews:{kind:'kiosk',roof:'#5a6a74',wear:1},
bigtop:{kind:'bigtop'},
caravan1:{kind:'wagon',col:'#c0392b',trim:'#e0a100'},
caravan2:{kind:'wagon',col:'#2e6f9a',trim:'#f2e6c8'},
caravan3:{kind:'wagon',col:'#7d3c98',trim:'#e0a100'},
hotdog:{kind:'cart'},
shelter:{kind:'shelter'},
tramshelter:{kind:'shelter',stop:'TRAM'},
foodvan:{kind:'van'},
kcfac:{kind:'flat',wall:'#d8e4dc',roof:'#4a5a50',trim:'#2e9d57',win:'#a9c7da',deco:'plant',ptx:'KELP COLA'},
kcwhs:{kind:'gable',wall:'#8aa898',roof:'#4a5a50',trim:'#2e5a3a',win:'#a9c7da',deco:'whs',tex:'metal'},
// Eastbrook: Portland by way of a lumber town. Timber siding in mustard, slate blue, teal, oxblood and forest green, hand-painted
// punning signs, string lights, porches, window boxes and a mural on the record shop
eb1:{kind:'gable',wall:'#c9822a',roof:'#3a2f28',trim:'#efe2c4',win:'#f2d16b',chim:.25,porch:1,tex:'siding',planter:['#e07a9a','#f2f2f2','#c0392b']},
eb2:{kind:'gable',wall:'#4a6a7a',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',chim:.75,porch:1,tex:'siding',lights:['#ffd23a', '#ff8a3a', '#e07a9a', '#7fd0a0']},
community:{kind:'flat',wall:'#8e4632',roof:'#4a3a32',trim:'#efe2c4',win:'#f2d16b',tex:'brick',sign:'COMMUNITY CENTRE',signk:'wood',flag:'#2e86c1',lights:['#ffd23a', '#ff8a3a', '#e07a9a', '#7fd0a0'],planter:['#e0a100','#c0392b','#f2f2f2']},
coffee:{icon:'mug',kind:'gable',wall:'#2f5a5a',roof:'#2f2a26',trim:'#e0c890',win:'#f2d16b',tex:'siding',awn:'#c9822a',sign:'SLOW DRIP',signk:'wood',lights:['#ffd23a', '#ff8a3a', '#e07a9a', '#7fd0a0']},
eblofts:{kind:'tall',wall:'#6b4a32',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',tex:'brick',planter:['#e0a100','#c0392b','#f2f2f2'],sign:'TIMBER LOFTS',signk:'wood'},
tavern:{icon:'beer',hang:1,kind:'gable',wall:'#5a3a26',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',tex:'siding',chim:.8,porch:1,lights:['#ffd23a', '#ff8a3a', '#e07a9a', '#7fd0a0'],sign:'TIMBERLINE TAVERN',signk:'wood'},
cedargrill:{icon:'grill',kind:'gable',wall:'#3d5a4a',roof:'#2f2a26',trim:'#e0c890',win:'#f2d16b',tex:'siding',chim:.2,awn:'#7a2a1e',planter:['#e0a100','#f2f2f2','#c0392b'],sign:'CEDAR GRILL',signk:'wood'},
tattoo:{icon:'heart',kind:'gable',wall:'#2a2a30',roof:'#3a3530',trim:'#e07a9a',win:'#f2d16b',tex:'siding',awn:'#7a1e2a',sign:'INK AND PINE',signk:'wood'},
gazette:{kind:'gable',wall:'#4a5f78',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',tex:'siding',chim:.8,sign:'EASTBROOK GAZETTE',signk:'wood'},
records:{icon:'vinyl',kind:'flat',wall:'#6a3a5a',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',tex:'brick',mural:['#ff8a3a','#e07a9a','#7a4a8a','#2e86c1'],sign:'VINYL RESTING PLACE',signk:'wood'},
outfitters:{icon:'souwester',kind:'gable',wall:'#2e5a7a',roof:'#2f2a26',trim:'#e0c890',win:'#f2d16b',tex:'siding',awn:'#e0a100',sign:'HARBOUR OUTFITTERS',signk:'wood'},
clothes:{icon:'flannel',kind:'gable',wall:'#7a2a3a',roof:'#2f2a26',trim:'#e0c890',win:'#f2d16b',tex:'siding',awn:'#2f4a3c',planter:['#e0a100','#f2f2f2','#e07a9a'],sign:'FLANNEL AND FOLK',signk:'wood'},
kcmuseum:{icon:'cola',kind:'flat',wall:'#e8f2ea',roof:'#4a5a50',trim:'#2e9d57',win:'#9fd6c0',tex:'brick',awn:'#2e9d57',flag:'#2e9d57',sign:'KELP COLA MUSEUM - GIFT SHOP',signk:'brass'},
ebhotdog:{kind:'cart',col:'#3d5a4a',um:['#e0a100','#efe2c4'],txt:'DOGS'},
mill:{kind:'gable',wall:'#7a5232',roof:'#5a5f68',trim:'#efe2c4',win:'#f2d16b',tex:'siding',deco:'whs',chim:.85,sign:'EASTBROOK LUMBER CO.',signk:'wood'},
boatshed:{kind:'gable',wall:'#6b7a8a',roof:'#4a4f58',trim:'#2b2f3a',win:'#a9c7da',deco:'whs',tex:'metal'},
fishmkt:{kind:'gable',wall:'#cfe6ee',roof:'#2e6f9a',trim:'#f2f2f2',win:'#a9d4e8',awn:'#2e6f9a',sign:'FISH MARKET',signc:'#2e6f9a'},
// Frostholm is the corporate city: glass towers (glass), neon signs (signk:'neon', blade), rooftop billboards (bill) and a cinema marquee
repub:{kind:'flat',wall:'#e8e4dc',roof:'#5b636c',trim:'#a3123a',win:'#7fb0d0',glass:1,tex:'panel',sign:'REPUBLICAN',signk:'neon',signc:'#ff3b5c',flag:'#a3123a',tube:'#ff3b5c'},
skyapt:{kind:'tall',wall:'#3a4a5a',roof:'#2b2f3a',trim:'#7d858e',win:'#7fb0d0',glass:1,tex:'panel',sign:'SKYLINE',signk:'neon',signc:'#ff5fa8',tube:'#b05fff'},
petrotower:{kind:'tall',wall:'#5a6470',roof:'#37474f',trim:'#2b2f3a',win:'#6fa8c8',glass:1,tex:'panel',sign:'PETRO',signk:'neon',signc:'#3bd0ff',tube:'#3bd0ff'},
hotel:{nlogo:'star',kind:'tall',wall:'#6a3442',roof:'#3a2a30',trim:'#c9a040',win:'#bcd9ea',blade:['HOTEL','#ff5fa8'],sign:'AURORA',signk:'neon',signc:'#ffd23a',tube:'#ff5fa8'},
nordbank:{nlogo:'coin',kind:'flat',wall:'#c9ced4',roof:'#5b636c',trim:'#2b2f3a',win:'#7fb0d0',glass:1,tex:'panel',sign:'NORDBANK',signk:'neon',signc:'#3bd0ff',flag:'#2e5f8f',tube:'#b05fff'},
cinema:{icon:'reel',kind:'flat',wall:'#2a1a3a',roof:'#3a2a4a',trim:'#c9a040',win:'#f2d16b',sign:'CINEMA',signk:'neon',signc:'#ff3b2f',marquee:'NOW SHOWING'},
hifi:{nlogo:'tv',kind:'flat',wall:'#3a3d44',roof:'#2b2f3a',trim:'#e0a100',win:'#7fd0e8',awn:'#e0a100',sign:'ELECTRONICS',signk:'neon',signc:'#3bd0ff',tube:'#3bd0ff'},
arcade:{nlogo:'invader',kind:'flat',wall:'#1a1c2a',roof:'#2b2f3a',trim:'#ff3bd0',win:'#7f5fd0',sign:'ARCADE',signk:'neon',signc:'#ff3bd0',tube:'#ff3bd0'},
burger:{nlogo:'burger',kind:'flat',wall:'#f4e6c0',roof:'#8a9099',trim:'#c0392b',win:'#f2d16b',awn:'#c0392b',bill:{t:['POLAR BURGER'],bg:'#c0392b',fg:'#ffd23a'},tube:'#ff5a3a'},
nordmart:{nlogo:'cart',kind:'flat',wall:'#e8e2d4',roof:'#8a9099',trim:'#2e86c1',win:'#cfe8f0',glass:1,awn:'#2e86c1',sign:'NORDMART',signk:'neon',signc:'#3bd0ff',tube:'#3bd0ff'},
fueldock:{nlogo:'pump',kind:'flat',wall:'#8a9aa8',roof:'#37474f',trim:'#e0a100',win:'#9fc6e0',tex:'metal',sign:'FUEL',signk:'neon',signc:'#e0a100',tube:'#ffd23a'},
portoffice:{kind:'flat',wall:'#c9ced4',roof:'#5b636c',trim:'#2b2f3a',win:'#7fb0d0',glass:1,tex:'panel',sign:'PORT OFFICE',signc:'#2b2f3a',tube:'#3bd0ff'},
lighthouse:{kind:'lighthouse'},
oldbarn:{kind:'gable',wall:'#6b4a3a',roof:'#4a3f38',trim:'#8a7a6a',win:'#5a6a74',deco:'whs',tex:'siding',wear:.9,locked:'The barn doors are padlocked shut.'},
customs:{kind:'gable',wall:'#7a5a3a',roof:'#2f2a26',trim:'#efe2c4',win:'#f2d16b',tex:'siding',sign:'CUSTOMS',signk:'wood',flag:'#2e5f8f'}};

// ---- Small objects standing in the world (drawn by js/art.js): [mapId, x, y, kind]. All are solid except those in PROP_PASS.
const PROPS=[
// Eastbrook: bikes and planters along Upper Street, the food-cart plaza by the hot dog cart, the park with the KEEP EASTBROOK WEIRD
// board, lamps along Tram Street, and woodpiles and stumps where the forest comes in
['second',13,9,'mailbox'],['second',8,9,'bike'],['second',9,6,'woodpile'],['second',8,3,'bush'],['second',21,9,'chalk'],['second',24,9,'lamp'],['second',26,9,'lamp'],
['second',30,9,'mailbox'],['second',34,9,'bench'],['second',40,9,'bike'],['second',42,9,'planter'],['second',33,6,'woodpile'],
['second',3,17,'cafetable'],['second',10,17,'cafetable'],['second',3,19,'cafetable'],['second',9,19,'cafetable'],['second',9,16,'chalk'],
['second',14,17,'bike'],['second',15,17,'bike'],['second',16,17,'bike'],['second',19,16,'planter'],['second',22,16,'planter'],['second',23,19,'phone'],
['second',37,18,'weird'],['second',32,17,'bench'],['second',42,17,'bench'],['second',45,19,'snowman'],['second',29,16,'planter'],
['second',8,21,'lamp'],['second',17,21,'lamp'],['second',33,21,'lamp'],['second',42,21,'lamp'],['second',20,24,'lamp'],['second',30,24,'lamp'],
['second',8,24,'bush'],['second',11,24,'stump'],['second',29,26,'woodpile'],['second',37,25,'bush'],['second',44,27,'stump'],
// the Mill: the log yard by the mill, and stumps where the trees have been felled
['millroad',4,2,'logs'],['millroad',4,4,'logs'],['millroad',22,3,'logs'],['millroad',25,4,'logs'],['millroad',7,3,'axe'],['millroad',20,4,'woodpile'],
['millroad',5,9,'stump'],['millroad',11,9,'stump'],['millroad',19,10,'stump'],['millroad',25,9,'stump'],['millroad',20,6,'lamp'],['monastery',12,12,'woodpile'],['monastery',3,9,'bench'],['monastery',15,1,'barrel'],['monastery',4,14,'bush'],['monastery',12,1,'bush'],
['town',27,24,'buffer'],['town',44,9,'bench'],['town',44,5,'lamp'],['town',45,14,'lamp'],
['town',3,8,'bench'],['town',5,8,'lamp'],['town',4,12,'bush'],['town',4,22,'bench'],['town',2,18,'lamp'],['town',5,25,'bush'],['town',28,26,'lamp'],['town',43,26,'lamp'],['town',31,26,'bench'],['town',41,26,'bench'],
['tramstop',3,5,'lamp'],['tramstop',18,5,'lamp'],['tramstop',6,5,'bench'],['tramstop',16,5,'bench'],['tramstop',15,6,'phone'],['tramstop',2,1,'bush'],['tramstop',19,1,'bush'],['tramstop',3,10,'bush'],['tramstop',18,11,'bush'],['tramstop',12,10,'signpost'],
['colafactory',16,5,'crate'],['colafactory',17,6,'crate'],['colafactory',16,6,'crate'],['colafactory',19,6,'pipes'],['colafactory',20,6,'pipes'],['colafactory',23,6,'drum'],['colafactory',24,6,'drum'],['colafactory',24,2,'gen'],['colafactory',24,4,'spool'],
['colafactory',12,9,'lamp'],['colafactory',16,9,'lamp'],['colafactory',22,11,'lamp'],['colafactory',3,11,'bench'],['colafactory',6,11,'bench'],['colafactory',8,12,'sign'],['colafactory',2,13,'barrel'],['colafactory',9,13,'bush'],
['colafactory',12,14,'warn'],['colafactory',14,14,'warn'],['colafactory',15,17,'lamp'],['colafactory',23,17,'lamp'],['colafactory',1,17,'bush'],['colafactory',24,17,'bush'],



['village',12,11,'lamp'],['village',27,11,'lamp'],['village',8,13,'lamp'],['village',24,13,'lamp'],['village',40,13,'lamp'],
['village',23,11,'bench'],['village',11,9,'barrel'],['village',11,10,'crate'],['village',12,10,'crate'],['village',2,20,'barrel'],['village',3,20,'barrel'],
['village',24,17,'woodpile'],['village',30,17,'woodpile'],['village',22,20,'mailbox'],['village',28,20,'mailbox'],['village',34,20,'mailbox'],['village',40,20,'mailbox'],
['village',31,13,'phone'],['village',14,22,'junk'],['village',25,27,'lamp'],['village',15,20,'tyre'],['village',8,21,'junk'],['village',9,22,'tyre'],['village',4,21,'tyre'],['village',12,13,'tyre'],['village',2,11,'junk'],['village',13,11,'trashbin'],
['village',25,11,'cat'],['village',16,13,'litter'],['village',30,21,'litter'],['village',38,11,'litter'],['village',40,21,'bfence'],['village',41,21,'bfence'],['village',19,13,'trashbin'],['village',36,21,'cat'],['village',5,22,'bush'],['village',26,22,'bush'],['village',42,22,'bush'],['village',42,4,'bush'],['village',41,8,'bush'],
['harbour',21,4,'barrel'],['harbour',22,4,'barrel'],['harbour',22,3,'crate'],['harbour',19,5,'crate'],['harbour',20,5,'crate'],['harbour',16,6,'lamp'],['harbour',20,8,'lamp'],
['harbour',9,5,'bollard'],['harbour',4,8,'bollard'],['harbour',9,8,'bollard'],['harbour',7,6,'rope'],['harbour',15,10,'net'],['harbour',16,10,'net'],
['harbour',18,10,'trap'],['harbour',19,11,'trap'],['harbour',21,11,'buoy'],['harbour',12,11,'anchor'],['harbour',22,1,'bush'],['harbour',11,12,'bush'],
['harbour',16,11,'oldboat'],['harbour',12,8,'tyre'],['harbour',21,9,'junk'],['harbour',13,9,'cat'],['harbour',18,8,'litter'],
['beach',8,8,'firepit'],['beach',10,8,'driftwood'],['beach',5,13,'driftwood'],['beach',7,9,'lifebuoy'],['beach',7,12,'sign'],['beach',4,7,'seaweed'],['beach',4,18,'seaweed'],
['beach',10,14,'shell'],['beach',8,19,'seaweed'],
['west',13,5,'signpost'],['west',15,4,'fence'],['west',16,4,'fence'],['west',17,4,'fence'],['west',18,4,'fence'],['west',19,4,'fence'],['west',20,4,'fence'],
['west',11,5,'lamp'],['west',14,7,'lamp'],['west',2,9,'bush'],['west',21,3,'bush'],['west',9,9,'bush'],['west',5,8,'rock'],['west',19,10,'rock'],['west',21,9,'woodpile'],
['radio',8,6,'warn'],['radio',12,9,'gen'],['radio',13,9,'barrel'],['radio',13,10,'barrel'],['radio',16,5,'spool'],['radio',10,8,'lamp'],['radio',15,7,'dish'],
['town',14,11,'lamp'],['town',21,11,'lamp'],['town',12,21,'lamp'],['town',20,21,'lamp'],['town',33,8,'lamp'],['town',43,8,'lamp'],['town',32,16,'lamp'],
['town',12,27,'mailbox'],['town',17,27,'mailbox'],['town',7,27,'mailbox'],['town',37,16,'forsale'],['village',35,19,'forsale'],['second',46,9,'forsale'],['fishing',37,14,'forsale'],['gated',37,15,'forsale'],['town',27,12,'bench'],['town',7,3,'bush'],['town',43,3,'bush'],
['palace',11,8,'lamp'],['palace',13,8,'lamp'],['palace',11,10,'hedge'],['palace',13,10,'hedge'],['palace',11,11,'hedge'],['palace',13,11,'hedge'],
['palace',11,13,'hedge'],['palace',13,13,'hedge'],['palace',11,14,'hedge'],['palace',13,14,'hedge'],['palace',8,10,'statue'],['palace',16,10,'statue'],
['palace',3,9,'flowers'],['palace',8,8,'flowers'],['palace',16,8,'flowers'],['palace',21,9,'flowers'],['palace',5,14,'flowers'],['palace',8,14,'flowers'],['palace',16,15,'flowers'],['palace',18,14,'flowers'],
['palace',7,11,'bench'],['palace',17,13,'bench'],['palace',2,12,'lamp'],['palace',22,12,'lamp'],['palace',2,4,'bush'],['palace',21,3,'bush'],['radio',2,10,'bush'],['radio',15,12,'bush'],['radio',6,12,'crate'],
['oilrig',10,3,'drum'],['oilrig',11,3,'drum'],['oilrig',8,2,'pipes'],['oilrig',9,2,'pipes'],['oilrig',13,2,'gen'],['oilrig',8,5,'cone'],['oilrig',14,7,'lifebuoy'],
['oilrig',2,8,'drum'],['oilrig',3,8,'drum'],['oilrig',6,9,'spool'],['oilrig',13,10,'crate'],['oilrig',7,7,'lamp'],
['oilhq',2,6,'lamp'],['oilhq',13,8,'lamp'],['oilhq',7,10,'drum'],['oilhq',8,10,'drum'],['oilhq',7,11,'drum'],['oilhq',9,11,'pipes'],['oilhq',10,11,'pipes'],
['oilhq',14,3,'crate'],['oilhq',15,3,'crate'],['oilhq',6,8,'cone'],['oilhq',16,12,'bush'],['oilhq',16,1,'bush'],
['fishing',8,9,'bb_oil'],['fishing',4,9,'slamp'],['fishing',12,9,'slamp'],['fishing',25,9,'slamp'],['fishing',32,9,'bb_mart'],
['fishing',14,6,'newsbox'],['fishing',19,9,'hydrant'],['fishing',15,9,'bb_cola'],['fishing',28,6,'bin'],['fishing',7,6,'phone'],['fishing',9,13,'bin'],['fishing',34,9,'hydrant'],['fishing',8,13,'newsbox'],['fishing',36,9,'nb_burger'],['fishing',8,6,'vending'],['fishing',38,9,'vending'],['fishing',38,8,'vending'],['fishing',38,14,'neonpole'],['fishing',38,7,'neonpole'],
['fishing',6,8,'steamgrate'],['fishing',17,8,'steamgrate'],['fishing',30,8,'steamgrate'],['fishing',27,14,'steamgrate'],['kalanharbour',3,7,'steamgrate'],
['north',8,6,'signpost'],['north',15,5,'fence'],['north',16,5,'fence'],['north',17,5,'fence'],['north',18,5,'fence'],['north',19,5,'fence'],
['north',13,11,'rock'],['north',4,11,'rock'],['north',9,2,'bush'],['north',6,10,'bush'],['north',19,8,'woodpile'],['north',5,6,'snowman'],
['volcano',10,23,'vent'],['volcano',23,22,'vent'],['volcano',4,15,'vent'],['volcano',12,9,'vent'],['volcano',18,9,'vent'],['volcano',8,4,'vent'],['volcano',22,3,'vent'],
['volcano',26,14,'signpost'],['volcano',16,16,'lamp'],['volcano',23,18,'lamp'],['volcano',19,21,'bench'],['volcano',22,21,'bench'],['volcano',25,17,'bench'],['volcano',5,14,'warn'],['volcano',20,9,'warn'],['volcano',13,18,'rock'],['volcano',8,20,'rock'],['volcano',25,9,'rock'],['volcano',4,9,'rock'],
['lake',18,12,'lifebuoy'],['lake',23,15,'firepit'],['lake',24,15,'woodpile'],['lake',22,17,'bench'],['lake',38,12,'signpost'],['lake',34,12,'lamp'],['lake',25,12,'lamp'],
['lake',38,10,'crate'],['lake',38,11,'barrel'],['lake',21,11,'barrel'],['lake',31,16,'crate'],['lake',32,16,'crate'],['lake',27,2,'bush'],['lake',36,2,'rock'],
['lake',5,19,'rock'],['lake',14,17,'driftwood'],['lake',16,22,'rock'],['lake',10,23,'bush'],['lake',3,16,'bush'],['lake',25,23,'rock'],
['mountains',16,5,'rock'],['mountains',6,10,'rock'],['mountains',19,13,'rock'],['mountains',12,9,'signpost'],['mountains',8,4,'bush'],['mountains',18,6,'bush'],
['east',13,5,'signpost'],['east',8,8,'fence'],['east',9,8,'fence'],['east',10,8,'fence'],['east',11,8,'fence'],['east',20,2,'bush'],['east',5,9,'bush'],['east',18,3,'rock'],['east',22,4,'woodpile'],
['farm',21,7,'fence'],['farm',28,7,'fence'],['farm',2,10,'cabbage'],['farm',3,10,'cabbage'],['farm',4,10,'cabbage'],['farm',5,10,'cabbage'],['farm',6,10,'cabbage'],['farm',7,10,'cabbage'],['farm',8,10,'cabbage'],['farm',9,10,'cabbage'],['farm',2,11,'potato'],['farm',3,11,'potato'],['farm',4,11,'potato'],['farm',5,11,'potato'],['farm',6,11,'potato'],['farm',7,11,'potato'],['farm',8,11,'potato'],['farm',9,11,'potato'],['farm',2,12,'cabbage'],['farm',3,12,'cabbage'],['farm',4,12,'cabbage'],['farm',5,12,'cabbage'],['farm',6,12,'cabbage'],['farm',7,12,'cabbage'],['farm',8,12,'cabbage'],['farm',9,12,'cabbage'],['farm',2,13,'pumpkin'],['farm',3,13,'pumpkin'],['farm',4,13,'pumpkin'],['farm',5,13,'pumpkin'],['farm',6,13,'pumpkin'],['farm',7,13,'pumpkin'],['farm',8,13,'pumpkin'],['farm',9,13,'pumpkin'],['farm',16,10,'wheat'],['farm',17,10,'wheat'],['farm',18,10,'wheat'],['farm',19,10,'wheat'],['farm',20,10,'wheat'],['farm',21,10,'wheat'],['farm',22,10,'wheat'],['farm',23,10,'wheat'],['farm',24,10,'wheat'],['farm',25,10,'wheat'],['farm',26,10,'wheat'],['farm',27,10,'wheat'],['farm',16,11,'wheat'],['farm',17,11,'wheat'],['farm',18,11,'wheat'],['farm',19,11,'wheat'],['farm',20,11,'wheat'],['farm',21,11,'wheat'],['farm',22,11,'wheat'],['farm',23,11,'wheat'],['farm',24,11,'wheat'],['farm',25,11,'wheat'],['farm',26,11,'wheat'],['farm',27,11,'wheat'],['farm',16,12,'wheat'],['farm',17,12,'wheat'],['farm',18,12,'wheat'],['farm',19,12,'wheat'],['farm',20,12,'wheat'],['farm',21,12,'wheat'],['farm',22,12,'wheat'],['farm',23,12,'wheat'],['farm',24,12,'wheat'],['farm',25,12,'wheat'],['farm',26,12,'wheat'],['farm',27,12,'wheat'],['farm',16,13,'wheat'],['farm',17,13,'wheat'],['farm',18,13,'wheat'],['farm',19,13,'wheat'],['farm',20,13,'wheat'],['farm',21,13,'wheat'],['farm',22,13,'wheat'],['farm',23,13,'wheat'],['farm',24,13,'wheat'],['farm',25,13,'wheat'],['farm',26,13,'wheat'],['farm',27,13,'wheat'],['farm',19,3,'hay'],['farm',19,4,'hay'],['farm',20,4,'hay'],['farm',11,4,'cart'],['farm',10,7,'mailbox'],['farm',15,1,'woodpile'],['farm',2,2,'bush'],
['farm',1,7,'fence'],['farm',2,7,'fence'],['farm',3,7,'fence'],['farm',4,7,'fence'],['farm',5,7,'fence'],['farm',7,7,'fence'],['farm',8,7,'fence'],
['farm',13,7,'fence'],['farm',14,7,'fence'],['farm',15,7,'fence'],['farm',16,7,'fence'],['farm',17,7,'fence'],['farm',18,7,'fence'],['farm',19,7,'fence'],['farm',20,7,'fence'],
['colahq',2,8,'lamp'],['colahq',13,8,'lamp'],['colahq',16,6,'lamp'],['colahq',14,3,'bench'],['colahq',15,1,'bush'],['colahq',16,10,'bush'],['colahq',13,6,'mailbox'],


['forest',12,5,'signpost'],['forest',15,10,'firepit'],['forest',17,9,'woodpile'],['forest',6,6,'bush'],['forest',20,8,'bush'],['forest',10,16,'bush'],
['forest',5,11,'rock'],['forest',23,13,'rock'],['forest',3,5,'driftwood'],['forest',19,16,'driftwood'],['forest',16,3,'snowman'],




['south',13,5,'signpost'],['south',9,3,'bush'],['south',20,4,'bush'],['south',6,8,'rock'],['south',21,8,'rock'],['south',8,8,'fence'],['south',9,8,'fence'],['south',10,8,'fence'],['south',11,8,'fence'],
['southwest',8,10,'signpost'],['southwest',5,8,'bush'],['southwest',11,3,'bush'],['southwest',3,18,'rock'],['southwest',10,19,'rock'],['southwest',3,9,'snowman'],
['privbeach',12,3,'firepit'],['privbeach',5,4,'lifebuoy'],['privbeach',8,9,'shell'],['privbeach',15,2,'shell'],['privbeach',3,3,'lounger'],['privbeach',6,2,'lounger'],['privbeach',9,2,'lounger'],
['privbeach',9,5,'lamp2'],['privbeach',9,7,'lamp2'],
['privharbour',3,4,'bollard'],['privharbour',7,4,'bollard'],['privharbour',5,4,'rope'],['privharbour',12,2,'crate'],['privharbour',13,2,'crate'],['privharbour',15,9,'barrel'],['privharbour',16,9,'barrel'],
['privharbour',10,3,'lamp2'],['privharbour',10,8,'lamp2'],['privharbour',16,1,'topiary'],['privharbour',13,5,'urn'],['privharbour',13,7,'urn'],['privharbour',12,1,'roses'],['privharbour',13,1,'roses'],['privharbour',14,1,'roses'],
['gated',19,1,'gatepost'],['gated',21,1,'gatepost'],['gated',19,2,'roses'],['gated',21,2,'roses'],
['gated',8,8,'roses'],['gated',9,8,'roses'],['gated',10,8,'lamp2'],['gated',11,8,'roses'],['gated',12,8,'roses'],['gated',14,8,'roses'],['gated',15,8,'roses'],['gated',17,8,'lamp2'],['gated',18,8,'roses'],
['gated',22,8,'roses'],['gated',23,8,'lamp2'],['gated',24,8,'roses'],['gated',25,8,'roses'],['gated',26,8,'roses'],['gated',28,8,'roses'],['gated',29,8,'roses'],['gated',30,8,'lamp2'],
['gated',8,10,'hedge'],['gated',9,10,'hedge'],['gated',10,10,'hedge'],['gated',11,10,'hedge'],['gated',12,10,'hedge'],['gated',13,10,'hedge'],['gated',14,10,'hedge'],['gated',15,10,'hedge'],['gated',16,10,'lamp2'],
['gated',18,10,'lamp2'],['gated',22,10,'lamp2'],['gated',23,10,'hedge'],['gated',24,10,'hedge'],['gated',25,10,'hedge'],['gated',26,10,'hedge'],['gated',27,10,'hedge'],['gated',28,10,'hedge'],['gated',29,10,'hedge'],['gated',30,10,'hedge'],
['gated',16,11,'topiary'],['gated',23,11,'topiary'],['gated',18,14,'urn'],['gated',21,14,'urn'],['gated',19,16,'statue'],['gated',21,16,'statue'],
['gated',8,16,'roses'],['gated',9,16,'roses'],['gated',10,16,'roses'],['gated',11,16,'roses'],['gated',29,16,'roses'],['gated',30,16,'roses'],
['gated',8,2,'topiary'],['gated',31,2,'topiary'],['gated',18,1,'urn'],['gated',22,1,'urn'],
['gated',2,3,'roses'],['gated',3,3,'roses'],['gated',5,3,'roses'],['gated',6,3,'roses'],['gated',4,4,'statue'],['gated',2,6,'roses'],['gated',3,6,'roses'],['gated',5,6,'roses'],['gated',6,6,'roses'],
['gated',1,8,'roses'],['gated',2,8,'roses'],['gated',3,8,'roses'],['gated',4,8,'lamp2'],['gated',5,8,'roses'],['gated',6,8,'roses'],['gated',7,8,'roses'],['gated',1,1,'topiary'],['gated',7,1,'topiary'],
['gated',1,10,'hedge'],['gated',2,10,'hedge'],['gated',3,10,'hedge'],['gated',4,10,'hedge'],['gated',5,10,'hedge'],['gated',6,10,'hedge'],['gated',7,10,'hedge'],
['gated',2,12,'topiary'],['gated',6,12,'topiary'],['gated',4,14,'urn'],['gated',1,16,'roses'],['gated',2,16,'roses'],['gated',3,16,'roses'],['gated',5,16,'roses'],['gated',6,16,'roses'],['gated',7,16,'roses'],
['gated',32,8,'roses'],['gated',33,8,'lamp2'],['gated',35,8,'lamp2'],['gated',36,8,'roses'],['gated',37,8,'roses'],['gated',38,8,'topiary'],['gated',38,2,'urn'],
['gated',32,10,'hedge'],['gated',33,10,'hedge'],['gated',34,10,'hedge'],['gated',35,10,'hedge'],['gated',36,10,'hedge'],['gated',37,10,'hedge'],['gated',38,10,'hedge'],
['gated',38,12,'topiary'],['gated',38,14,'topiary'],['gated',38,11,'statue'],['gated',32,16,'roses'],['gated',33,16,'roses'],['gated',34,16,'roses'],['gated',36,16,'roses'],['gated',37,16,'roses'],['gated',38,16,'roses'],
['barracks',15,2,'warn'],['barracks',12,10,'drum'],['barracks',13,10,'drum'],['barracks',17,9,'crate'],['barracks',18,9,'crate'],['barracks',17,10,'crate'],['barracks',15,9,'lamp'],['barracks',20,12,'lamp'],['barracks',30,10,'gen'],
['kalanharbour',15,3,'bollard'],['kalanharbour',15,5,'bollard'],['kalanharbour',8,3,'bollard'],['kalanharbour',10,4,'rope'],['kalanharbour',2,12,'cont_r'],['kalanharbour',5,12,'cont_b'],['kalanharbour',8,12,'cont_g'],
['kalanharbour',16,12,'cont_b'],['kalanharbour',19,12,'cont_r'],['kalanharbour',20,7,'bb_oil'],['kalanharbour',6,7,'drum'],['kalanharbour',7,7,'drum'],['kalanharbour',11,7,'slamp'],['kalanharbour',13,11,'slamp'],
['savilaharbour',20,8,'lamp'],['savilaharbour',26,8,'lamp'],['savilaharbour',16,7,'lamp'],['savilaharbour',22,11,'bollard'],['savilaharbour',28,11,'bollard'],['savilaharbour',17,11,'bollard'],['savilaharbour',30,11,'lifebuoy'],['savilaharbour',9,13,'crate'],['savilaharbour',10,13,'crate'],['savilaharbour',9,14,'crate'],['savilaharbour',11,17,'barrel'],['savilaharbour',12,17,'barrel'],['savilaharbour',12,4,'net'],['savilaharbour',13,4,'net'],['savilaharbour',10,12,'anchor'],['savilaharbour',12,2,'planter'],['savilaharbour',8,6,'chalk'],['savilaharbour',4,7,'bike'],['savilaharbour',6,7,'bench'],['savilaharbour',14,15,'trap'],['savilaharbour',15,15,'trap'],['savilaharbour',29,5,'rock'],['savilaharbour',33,5,'rock'],['savilaharbour',28,2,'rock'],
];
const PROP_PASS=['cabbage','wheat','potato','pumpkin','steamgrate','sled','rope','anchor','seaweed','shell','vent','litter'];

// ---- The quest schedule over the 30 days of September (see docs/quest-schedule.md and the wiki's Quests page). Weeks run days
// 1-7, 8-14, 15-21 and 22-28, with days 29 and 30 to finish. QUEST_DAYS: for each main faction, the day it is introduced (intro)
// and the days it has quests. QUEST_EVENTS: the days given to the whole island, as [name, the faction that runs it (optional)];
// day 0 is the game's opening, before September begins.
const QUEST_DAYS={communist:{intro:1,days:[11,16,19,23,27,28,29]},royal:{intro:2,days:[10,15,19,22,25,28,29]},cola:{intro:3,days:[9,13,18,22,26,28,29]},oil:{intro:7,days:[8,12,17,23,26,28,29]},church:{intro:5,days:[8,11,15,18,24,28,29]},syndicate:{intro:6,days:[10,13,17,20,24,27,29]},democrat:{intro:4,days:[9,12,16,20,25,28,29]}};
const QUEST_EVENTS={0:['Game intro','cia'],14:['Event 1'],21:['Volcano'],30:['Finale']};
// the quests that have a title so far, by day and faction (the rest are just "Quest")
const QUEST_TITLES={29:{cola:'Republican primary',oil:'Republican primary',syndicate:'Republican primary',royal:'Line of succession',church:'Line of succession',communist:'Friendly rivalry',democrat:'Friendly rivalry'}};
// ---- Background audio, made as it plays by js/music.js: each track's name and what you hear (TRACK_INFO), and the places it
// plays in (MUSIC_AT; a building only where it is listed). Radio Sarivalto, when it is switched on, plays instead, anywhere.
const TRACK_INFO={chant:['Gregorian chant','A small choir of men\'s voices sings the Salve Regina, one line in the Dorian mode, over a low hummed drone, in a long stone-church echo.'],
  jazz:['Jazz','A quartet swings through a medium-tempo tune in F: a walking bass, the ride cymbal and brushes, piano chords on the off-beats, and now and then a breathy tenor sax taking a solo, in a small club\'s echo.'],
  arcade:['Arcade music','An upbeat chiptune in A minor: a thin pulse-wave tune, a bubbling bass and noise drums, with coins, lasers, jumps and explosions going off on the machines all round the hall.'],
  shop:['Shop music','Cheerful easy-listening music from the ceiling speakers (vibraphone, electric piano, a bouncy bass and a shaker), with the till ringing up a sale, the door\'s chime, footsteps and a paper bag rustling at the counter.'],
  regal:['Royal processional','A stately Baroque processional in D major: strings holding the chords over a walking bass, a harpsichord rippling through them, timpani, and two trumpets playing the tune in the dotted rhythms of a grand entrance, in a palace hall\'s long echo.'],
  romani:['Romani music','A travelling band\'s csárdás in D harmonic minor: slow and mournful at first, a violin sliding into its notes over accordion chords and a rolling cimbalom, then breaking into a fast dance with an oom-pah bass, and back again.'],
  mill:['Lumber mill','The motors humming, the conveyor clattering, the big saw whining up to speed and biting into a log, the cut timber thudding onto the stack, metal clanking and air hissing from a valve.'],
  rig:['Oil rig','The drilling pump\'s slow, heavy chug over the motors\' hum, the drill grinding, a chain rattling through, metal clanking, steam hissing, and the sea and the wind around the platform.'],
  plant:['Fish processing plant','The conveyor rattling fish along the line, the refrigeration compressor droning, fish slapping into the bins, a pneumatic pusher thumping, metal clanking and air hissing.'],
  cola:['Bottling line','The Kelp Cola factory and its warehouse: the motors humming, bottles clinking against each other along the line, the filler hissing and the capper thumping, crates of full bottles set down, metal clanking.'],
  casino:['Casino swing','Upbeat big-band swing like a Las Vegas lounge: a walking bass, swinging drums, brass punching out chords and a trumpet riffing over the top, with slot machines paying out, chips clattering and the roulette wheel spinning behind.'],
  cafe:['Coffee shop','People talking at the tables, the espresso machine and its steam wand frothing milk, the grinder, cups on saucers and spoons stirring, the beans popping in the roaster, and an acoustic guitar in the background.'],
  spy:['Ominous','Dark Cold War thriller music: a low drone that never settles, a slow heartbeat pulse, uneasy string chords swelling and fading, lone high piano notes in a long echo and now and then a low brass swell.'],
  woods:['The woods','The snowy woods along the roads and in the Pine Forest: a light breeze in the pines, a branch creaking, snow slumping off one; by day birds singing, a crow far off and a woodpecker drumming, and by night an owl.'],
  army:['Fife and drum','A fife and drum corps of the 1860s plays a march across the parade ground: two fifes in thirds over a snare drum\'s accents, flams and rolls, and a bass drum on every beat.'],
  pizzeria:['Italian waltz','An accordion carries a waltz tune over a trembling mandolin and an oom-pah-pah bass.'],
  ocean:['The sea','Waves roll in every few seconds and break in a hiss of surf, gulls cry now and then from one side or the other, and a bell buoy clangs far out.']};
const MUSIC_AT={chant:['monastery','monchurch','monks','house_thyme'],ocean:['harbour','privharbour','kalanharbour','savilaharbour','beach','privbeach'],jazz:['jazz_in'],regal:['palace','palacehall','throne','royalrooms','dining','library','chapel','crypt','kitchen','servants','winecellar','vault'],romani:['bigtop_in','caravan1_in','caravan2_in','caravan3_in'],mill:['millroad','mill_in'],rig:['oilrig','derrick_in'],plant:['plant'],cola:['kcfac_in','kcwhs_in'],casino:['casino'],cafe:['cafe'],spy:['langley','langley_hall','langley_office','langley_cover','langley_cafe','langley_george','langley_basement','hekki_room'],woods:['north','east','south','southwest','west','forest'],army:['barracks','barrA_in','barrB_in','gp_in','arm_in','offhq_in'],arcade:['arcadein'],pizzeria:['pizzeria_in'],
  shop:['bookshop','clothes_in','tailor','electro','fishingshop','fishshop','outfitters_in','gunshop','kcmuseum_in','mart','supermarket','records_in']};
