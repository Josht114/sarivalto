# Sarivalto

A 2D top-down, Pokémon-style game set in the early 1980s Cold War. The player is a CIA agent on a
fictional island north of Finland, where the king has just died and the island must not fall to the
Soviet Union. Seven factions compete for control.

**Current stage:** map prototype only. Walk around all 28 locations (plus building interiors); no characters, dialogue or
game mechanics yet. Layouts are placeholders.

![Island map](docs/island-map.svg)

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Controls

Arrows / WASD to move. Use the "Jump to" dropdown to visit any location. Walk onto a labelled
edge exit to cross to the neighbouring area.

## Project layout

    index.html      page shell
    css/style.css   page styling
    js/data.js      the island: location sizes, themes, features, and the links between them
    js/game.js      map building, camera, input, movement
    js/art.js       pixel-art renderer for every location and building interior (building looks are set in BLD
                    in data.js, interior looks per building in INT)
    tools/build-map.js  generates docs/island-map.svg from js/data.js (node tools/build-map.js)
    docs/island-map.svg overview map of every location and path
    docs/quest-schedule.md  which factions have quests in each of the 19 weeks
    content/notes.js    hand-written wiki text (locations, factions, people)
    tools/build-wiki.js generates the wiki/ pages from js/data.js and content/notes.js
    wiki/               wiki-style pages for every location, faction and person (open wiki/index.html)
    assets/logos/       Diversified Petroleum logo (light and dark SVG, light PNG)

## Editing the map

- `L` in `js/data.js`: one entry per location, `id: [name, width, height, theme, features]`.
  A feature is `[x, y, w, h, tile, label, look]` (tiles: `#` building, `T` trees, `R` rock, `~` water,
  `p` dock, `b` moored boat, `v` lava). A building's `look` is a key in `BLD`, which sets its walls, roof, signs and decorations.
- `LINKS` in `js/data.js`: `"A side B side"` (sides are T, B, L, R). Exits are built automatically,
  in the order the links are listed.

- `POS` in `js/data.js`: where each location sits on the overview map (used only by the map generator).
  The coastline is drawn around the inland places; each harbour is moved onto the nearest bit of coast, and boat routes follow
  shipping lanes around the island (each route takes the shorter way round).
  After changing locations or links, run `node tools/build-map.js` and commit the updated SVG.
- `FACTIONS` and `FACTION_AT` in `js/data.js`: faction names and colours, and which location each faction is based in
  (shown on the overview map; unlisted locations are unassigned).
- `DISTRICTS` and `DISTRICT_OF` in `js/data.js`: the seven districts (name and map colour) and which district each place is in.
  Every place on the overview map needs one (both generators stop with an error otherwise); interiors take their building's district.
- `BOATS` and `FERRY` in `js/data.js`: boat routes. `BOATS` lists where you can sail from each place (West Saltwick Harbour, North Frostholm Harbour,
  Eastbrook Harbour and the oil rig are all joined to each other); `FERRY` gives where the boat berths are. South Private Harbour has no
  boat routes at all, by design.
- `NPCS` in `js/data.js`: named characters. Every NPC needs a `name`, `job`, `faction` (a `FACTIONS` id, or `'none'` if unaligned)
  `loc` (main location id) and `home` (the building interior they live in, which must be listed in `DOORS`, or `'none'`); `node tools/build-wiki.js` stops with an error if any are missing. They stand in the world (currently the people of West Saltwick Harbour and Saltwick; no dialogue yet). An optional `hat` colour gives them a beanie.
- `PROPS` in `js/data.js`: small objects (lamps, barrels, benches...) placed on a map. They block movement unless listed in `PROP_PASS`.

## Wiki

`node tools/build-wiki.js` regenerates the wiki in `wiki/` from the game data (run `node tools/build-map.js` first if the island changed).
Open `wiki/index.html`, or `wiki/all-in-one.html` for a single-file version. Add or change text in `content/notes.js`.

## Factions

Communist party, the late king's family, a cola company, an oil drilling company, an organised
crime syndicate, a democratic party, and the northern orthodox church.
