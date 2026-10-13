# Town aesthetics

Each of the island's five towns has its own look. Use this guide when adding buildings (`BLD` in `js/data.js`),
interiors (`INT` in `js/art.js`), props (`PROPS`) or new pixel art, so that each town is recognisable at a glance.
It is still the early 1980s everywhere, and still snowy. There are no roads on the island, so no cars, buses or road furniture.

| Town | Places | In one line |
|---|---|---|
| Eastbrook | `second`, `savilaharbour`, `millroad`, its interiors | Hipster town: Portland by way of a lumber town |
| Frostholm | `fishing`, `kalanharbour`, its interiors | Corporate and urban: advertising and neon everywhere |
| Saltwick | `village`, `harbour`, its interiors | Run down and weathered |
| Hope Springs | `gated`, `privbeach`, `privharbour`, its villas | Very fancy: flowers everywhere, well-kept paths |
| Kingsgrad | `town`, its interiors | A generic city |

## Eastbrook: Portland by way of a lumber town

An old timber town gone hip, like Portland. Think coffee roasters, a record shop, vintage clothes, food carts, the local
paper, murals, bicycles everywhere, and pine trees growing right up to the houses. Mill Road leads west to the lumber mill
that the town grew up around.

- **Layout:** three brick streets (Upper Street, the main street and Tram Street) joined by Alder Lane down the middle; a
  brick-paved food-cart plaza and a little park between the main street and Tram Street; the tram along the bottom.
- **Buildings:** gable roofs, wooden siding (`tex:'siding'`), porches, chimneys with smoke. Small and individual; no two alike.
- **Palette:** mustard, slate blue, teal, oxblood, forest green, timber brown, with pink and orange accents. Warm yellow
  window light (`#f2d16b`).
- **Signs:** hand-painted wooden boards with puns (SLOW DRIP, INK AND PINE, VINYL RESTING PLACE, FLANNEL AND FOLK) and
  chalkboards, not plastic or neon. The Kelp Cola Museum, being the company's, has a brass plaque.
- **Props:** bicycles, chalkboard signs, timber planters, cafe tables, string lights, woodpiles, stumps, mailboxes, a hot
  dog cart, and the KEEP EASTBROOK WEIRD board in the park.
- **Murals:** the record shop's front is painted with a sunset over the mountains, pines and a bird (`mural`).
- **Interiors:** wood floors, exposed brick, plants, bookcases, record shelves, mismatched furniture, warm rugs.
- **Harbour:** working but tidy: timber pilings, crab pots, a fish-and-chips hut.
- **Avoid:** flat concrete roofs, neon, chrome, anything that looks like a chain.

## Frostholm: corporate and urban

The company town. Diversified Petroleum's headquarters is next door, and the money shows: glass, steel, and brand names
fighting for attention. The neon glows against the snow and the long northern nights.

- **Buildings:** tall and flat-roofed (`kind:'tall'` / `'flat'`), glass-and-steel fronts (`tex:'metal'`), rows of identical windows.
- **Palette:** steel grey, glass blue, black, with saturated neon accents (hot pink, cyan, electric yellow, Kelp Cola green).
- **Signs:** neon (the `neon` animation already used on bars), billboards, illuminated logos, rooftop signs. Every building has one.
  Advertise the island's companies: Diversified Petroleum, Kelp Cola, Polar Burger.
- **Props:** billboards, street lamps, phone boxes, newspaper boxes, bins and hydrants.
- **Interiors:** tiled or carpeted floors, office desks, filing cabinets, fluorescent light, branded posters.
- **Harbour:** container cranes, a fuel dock, company crates.
- **Avoid:** cottages, timber and anything homely or hand-made.

## Saltwick: run down and weathered

A tired fishing village. The Communist Party's support comes from the people who live here, and it looks it.

- **Buildings:** peeling paint, faded colours, patched roofs, boarded-up windows, sagging gutters, rust streaks (`tex:'metal'` rusted).
- **Palette:** washed-out and dirty: faded red, grey-green, rust, damp brown, grimy white. Cold, dim window light.
- **Signs:** faded, cracked, missing letters, one hanging crooked.
- **Props:** rusty barrels, broken crates, old tyres, piles of nets, broken fences, litter, stray cats.
- **Interiors:** worn floorboards, stained wallpaper, bare bulbs, mismatched secondhand furniture.
- **Harbour:** old wooden boats with chipped hulls, rotting pilings, rusty chains.
- **Avoid:** fresh paint, flowers, anything shiny or new.

## Hope Springs: very fancy

Where the rich and powerful live, behind a gate. Everything is clipped, swept and in bloom despite the cold.

- **Buildings:** large villas, white and cream walls, ornate trim, columns, gold accents (`#c9a040`), big windows.
- **Palette:** cream, white, gold, deep green hedges, with flower colours (pink, red, violet, yellow).
- **Signs:** few, discreet and engraved: brass plaques, the gatehouse sign.
- **Paths:** wide, swept clean, edged with stone, lined with hedges and lamps. No snowdrifts on them.
- **Props:** flower beds (lots), hedges, statues, fountains, ornate lamps, benches, topiary, a gatehouse and gate.
  The Royal Palace's garden props (`flowers`, `hedge`, `statue`, `fountain`) set the standard.
- **Interiors:** marble or checkered floors, chandeliers, portraits, rugs, fireplaces.
- **Harbour and beach:** yachts, polished wooden decking, sun loungers, a boathouse.
- **Avoid:** clutter, rust, crates, anything working-class.

## Kingsgrad: a generic city

The capital and the hub. It should feel like an ordinary city, the baseline the other towns are measured against.

- **Buildings:** a mix of gable shops and flat-roofed blocks in brick and render, moderate colours, standard shop awnings and signs.
- **Palette:** neutral: brick red, beige, grey, muted blues and greens.
- **Signs:** ordinary printed shop signs (`sign:` in `BLD`), with the odd neon one (the casino, the bar).
- **Props:** street lamps, benches, mailboxes, phone boxes, bins, a few trees.
- **Interiors:** standard shops and homes.
- **Avoid:** going too far in any one direction; it is the neutral middle.

## Tools for each look

Building looks (`BLD` in `js/data.js`) take these options on top of the usual walls, roof, trim and windows:

| Option | What it does | Used in |
|---|---|---|
| `wear: 0..1` | Faded, peeling paint, damp or rust streaks, boarded-up and cracked windows, patched roofs, a sagging gutter, signs with missing letters hanging crooked, and a flickering neon | Saltwick |
| `glass: 1` | A curtain wall of tinted glass panes instead of windows | Frostholm |
| `signk: 'neon'` | The sign is glowing neon letters in `signc` on a dark board | Frostholm |
| `blade: [text, colour]` | A tall neon sign down the front, one letter above the next | Frostholm (Hotel Aurora) |
| `bill: {t: [lines], bg, fg}` | A billboard standing on a flat roof | Frostholm (Polar Burger) |
| `marquee: text` | A cinema board over the door, ringed with chasing bulbs | Frostholm (Cinema) |
| `signk: 'wood'` | A hand-painted wooden sign | Eastbrook |
| `lights: [colours]` | String lights swagged under the eaves or awning | Eastbrook |
| `signk: 'brass'` | An engraved brass plaque | Hope Springs (The Club) |
| `cols: colour` | Columns between the windows | Hope Springs |
| `planter: [colours]` | A window box of flowers under each window | Hope Springs, Eastbrook |
| `icon: name` | A hanging picture sign of what the shop sells, on an iron bracket at one corner of the front (away from the door): `mug` (with a face), `vinyl`, `heart`, `flannel`, `grill`, `beer`, `cola`, `gun`, `cart`, `scissors`, `book`, `dice`, `house`, `fishhook`, `fish`, `tv`, `invader`, `burger` (with a face), `bag`, `popcorn`, `cocktail` (`ICON_ART` in `js/art.js`) | Every shop, cafe and bar |
| `mural: [sky, sky, sky, bird]` | The front wall painted with a sunset, a snowy peak, pines and a bird, in place of the windows | Eastbrook (the record shop) |

Interiors (`INT` in `js/art.js`) take `grime: 1` (stained walls and floors, used in Saltwick). Paths are styled per place in
`PATHS` in `js/art.js`: `pave` (Frostholm), `worn` (Saltwick), `flag` (Hope Springs, no snow on them) and `brick` (Eastbrook).
Saltwick's snow is slushy (`SLUSH`).

Props for each town (`PROPS` in `js/data.js`):

- **Frostholm:** `slamp`, `newsbox`, `bin`, `hydrant`, the billboards `bb_cola`, `bb_oil`, `bb_burger`, `bb_mart`, and the
  containers `cont_r`, `cont_b`, `cont_g`. Billboards are three tiles wide and containers two (centred on their tile).
- **Saltwick:** `tyre`, `junk`, `cat`, `litter` (can be walked over), `bfence`, `trashbin`, `oldboat` (two tiles).
- **Hope Springs:** `lamp2`, `urn`, `topiary`, `roses`, `lounger`, `gatepost`, plus the palace's `hedge`, `statue` and `flowers`.
- **Eastbrook:** `bike`, `chalk` (a chalkboard sign), `planter`, `cafetable`, `weird` (the KEEP EASTBROOK WEIRD board, four
  tiles wide), and on Mill Road `logs` (a log pile, two tiles), `stump` and `axe` (an axe in a stump).
