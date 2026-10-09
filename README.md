# Sarivalto

A 2D top-down, Pokémon-style game set in the early 1980s Cold War. The player is a CIA agent on a
fictional island north of Finland, where the king has just died and the island must not fall to the
Soviet Union. Seven factions compete for control.

**Current stage:** map prototype only. Walk around all 26 locations; no characters, dialogue or
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
    js/game.js      map building, rendering, input, movement
    tools/build-map.js  generates docs/island-map.svg from js/data.js (node tools/build-map.js)
    docs/island-map.svg overview map of every location and path

## Editing the map

- `L` in `js/data.js`: one entry per location, `id: [name, width, height, theme, features]`.
  A feature is `[x, y, w, h, tile, label]` (tiles: `#` building, `T` trees, `R` rock, `~` water,
  `p` dock, `v` lava).
- `LINKS` in `js/data.js`: `"A side B side"` (sides are T, B, L, R). Exits are built automatically,
  in the order the links are listed.

- `POS` in `js/data.js`: where each location sits on the overview map (used only by the map generator).
  After changing locations or links, run `node tools/build-map.js` and commit the updated SVG.

## Factions

Communist party, the late king's family, a cola company, an oil drilling company, an organised
crime syndicate, a democratic party, and the northern orthodox church.
