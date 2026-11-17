# Prompt: the player character's art for Sarivalto

Copy everything below the line into the image-generating AI. It follows the wiki's Art Assets page (People, Portraits, Items,
Minigames). It covers every hairstyle, facial hair and piece of clothing the game has: the 24 clothes in `CLOTHES` (js/data.js),
`HAIR_STYLES`, `BEARD_STYLES` and the 12 tattoos.

The tile size isn't decided yet. This prompt asks for the double size (32 px tiles). For the 16 px size, halve every size in it:
16×20 frames, 48×80 sheets, 16×16 icons, 32×32 portraits, 12×12 tattoos.

---

## The job

Make the complete set of pixel-art image assets for the player character of **Sarivalto**. Sarivalto is a 2D top-down pixel-art
game, seen from above and a little in front, like a classic 16-bit RPG. The player is a CIA agent posing as a British newspaper
reporter. They spend September 198- on a small, snowy, fictional island north of Finland. The look is early 1980s Nordic: practical
winter clothes, wool, tweed and oilskin. Nothing later than the early 1980s.

The game builds the player from **layers** stacked on top of each other: a body, then trousers, shoes, a top, hair, facial hair
and a hat. That way any combination can be worn. Deliver every layer as a separate PNG, packed into **one zip file** with the
exact folder layout and file names given at the end.

## Rules for every image

- **True pixel art.** Hard-edged pixels at exactly the stated size: no blur, no anti-aliasing, no soft shadows, no gradients wider
  than a few colours. Don't draw large and scale down. Each image must be exactly its stated pixel size.
- **Transparent background** (PNG with alpha) on everything except where stated.
- **Light comes from the upper left.** The left and top edges are lighter, the right and bottom darker. Don't paint a shadow on the
  ground under the figure: the game draws its own.
- **Palette:** one shared, limited palette of about 48 to 64 colours, cold and muted (snow whites, blue-greys, pine greens, weathered
  wood browns), with red and ochre accents. Use the exact colours given below for each piece of clothing (shade them lighter and
  darker from that base).
- **A 1 px darker outline** around each figure and part, in a darker shade of that part's own colour, not pure black.
- Every image in one set must line up exactly with the others, pixel for pixel. This matters most of all.

## The sprite sheet layout (used by every body and clothing layer)

- One **frame** is **32×40 px**: one tile wide and a little taller. The feet stand on the bottom 8 px, and the head rises above the tile.
- Each sheet is **3 columns × 4 rows = 96×160 px**.
- **Columns** (left to right): standing still, left foot forward, right foot forward (a walk cycle: stand, step, stand, step).
- **Rows** (top to bottom): facing **down** (towards the viewer), facing **up** (away, back of the head), facing **left**, facing **right**.
  The right row may be the left row mirrored.
- **Every layer is a full 96×160 sheet**, transparent wherever that layer has nothing. The figure stands in exactly the same place
  in every layer, so the layers stack perfectly. Draw each piece of clothing so it fits over the base body in every frame,
  including the arm and leg movement of the walk.

## 1. The base body: 1 sheet

`player/body.png`: an adult of slim, average build in plain dark underclothes (a dark grey vest and shorts), so nothing shows
through if a layer is missing. It has a simple face: two dark eyes, a hint of a mouth and nose; the back of the head shows no face.

- Skin: base **#f1c7a0**, shadow **#d9a37a**.
- Hands are visible at the ends of the arms.
- No hair (the hair layers add it) and no shoes (bare feet in skin colour, which the shoe layers cover).

Layer order, bottom to top: **body → trousers → shoes → top → hair → facial hair → hat**. A long coat's skirt (trench coat, pea
coat) hangs over the top of the trousers. Ears and the sides of the face stay visible.

## 2. Hair: 7 sheets, drawn in light grey for tinting

The game tints hair to any of 10 colours (black, dark brown, brown, chestnut, auburn, ginger, blonde, platinum, grey, white).
So draw every hair layer in **light neutral greys only**: a mid grey of about #c8c8c8, with lighter and darker greys for shading,
and no colour. Show the hair from the front, the back and the side in the right rows.

| File | Style | Notes |
|---|---|---|
| `player/hair/short.png` | Short | Neat short back and sides, the ears showing |
| `player/hair/long.png` | Long | Straight, falls past the shoulders at the sides and back |
| `player/hair/bob.png` | Bob | Chin length all round, with a fringe |
| `player/hair/ponytail.png` | Ponytail | Pulled back, the tail hanging at the back (visible from behind and the side) |
| `player/hair/curly.png` | Curly | Full, rounded and tightly curled, a little wider than the head |
| `player/hair/buzz.png` | Buzz cut | A very short, close crop: just a thin layer over the scalp |
| `player/hair/bald.png` | Bald | Only a short fringe of hair above and behind the ears; the crown is the body's bare skin |

## 3. Facial hair: 4 sheets, drawn in light grey for tinting

The same light neutral greys as the hair (the game tints these too). They show only from the front and the side; the back row
is empty.

| File | Style |
|---|---|
| `player/beard/stubble.png` | Stubble: a light, speckled shadow on the jaw and upper lip |
| `player/beard/moustache.png` | Moustache: a full 1970s moustache |
| `player/beard/goatee.png` | Goatee: a small beard on the chin with a joined moustache |
| `player/beard/beard.png` | Full beard: covers the jaw and chin, with a moustache |

(Clean-shaven needs no file.)

## 4. Clothes: 29 sheets, in their real colours

Draw each piece of clothing in its own colour (no tinting), shaded from the base colour given. Each covers the whole body in every
frame. Tops include the sleeves down to the wrists, and trousers come down to the ankles.

### Hats (9). Each sits over every hairstyle; long hair, bobs and ponytails still show below the hat.

| File | Name | Base colour | Look |
|---|---|---|---|
| `player/hat/beanie_yellow.png` | Yellow beanie | #e8c33a | Close-fitting knitted wool hat with a turned-up cuff |
| `player/hat/beanie.png` | Navy wool beanie | #2a3a5e | The same beanie, navy |
| `player/hat/watchcap.png` | Red watch cap | #c0392b | The same knitted cap, a sailor's red |
| `player/hat/flatcap.png` | Tweed flat cap | #7a6a4a | A flat cap with a short peak, flecked tweed |
| `player/hat/ushanka.png` | Fur ushanka | #6b4a2e | A fur hat with ear flaps down at the sides |
| `player/hat/beret.png` | Black beret | #2a2a33 | A soft beret tilted to one side |
| `player/hat/fedora.png` | Grey fedora | #5a5f68 | A brimmed fedora with a dark band |
| `player/hat/stetson.png` | Stetson | #c8a46a | A tall, wide-brimmed Texan cowboy hat |
| `player/hat/souwester.png` | Sou'wester | #f0c020 | A fisherman's oilskin rain hat, its wide brim longer at the back |

### Tops (9)

| File | Name | Base colour | Look |
|---|---|---|---|
| `player/top/parka_blue.png` | Blue parka | #2a5db0 | A padded hooded winter parka, a cream fur trim at the neck, a zip down the front |
| `player/top/oilskin.png` | Yellow oilskin | #f0c020 | A fisherman's shiny waterproof jacket, the same cut as the parka |
| `player/top/sweater_grey.png` | Grey jumper | #7a7f88 | A plain wool jumper with ribbed cuffs, collar and hem |
| `player/top/sweater.png` | Fisherman's jumper | #3d6a4a | A thick green wool jumper with a ribbed hem |
| `player/top/cableknit.png` | Cable-knit jumper | #1e2a50 | A navy jumper with vertical cable patterns |
| `player/top/shirt.png` | Flannel shirt | #b03a2e | A red check flannel shirt (dark lines making a tartan grid), a collar at the neck |
| `player/top/suit.png` | Tailored suit | #2b2f3a | A dark suit jacket over a white shirt and a red tie (front); lapels; a white collar shows from the side |
| `player/top/trench.png` | Trench coat | #b8a070 | A long belted beige trench coat with lapels; its skirt hangs to the knees, over the trousers |
| `player/top/peacoat.png` | Pea coat | #1e2a44 | A navy double-breasted wool coat, with the same long cut as the trench |

### Trousers (5)

| File | Name | Base colour | Look |
|---|---|---|---|
| `player/legs/jeans_blue.png` | Jeans | #2d3046 | Dark denim with a lighter seam down each leg |
| `player/legs/khakis.png` | Khaki trousers | #8a7a5a | Plain cotton trousers |
| `player/legs/slacks.png` | Black trousers | #1e1e24 | Smart suit trousers, slightly longer in the leg |
| `player/legs/cords.png` | Brown corduroys | #6b4a2e | Corduroy with darker vertical ribs |
| `player/legs/dungarees.png` | Dungarees | #3a5a8a | Denim work dungarees: the bib and straps show over the chest when no top covers them (draw the bib; the top layer covers it) |

### Shoes (6)

| File | Name | Base colour | Look |
|---|---|---|---|
| `player/shoes/boots_brown.png` | Brown boots | #3b2a22 | Ankle-high leather work boots |
| `player/shoes/cowboyboots.png` | Cowboy boots | #a0703a | Tan Western boots with a heel and a pointed toe |
| `player/shoes/wellies.png` | Green wellies | #2e5a2e | Rubber wellington boots to mid-calf |
| `player/shoes/snowboots.png` | Snow boots | #5a5f68 | Chunky padded boots with a cream fleece cuff at the top |
| `player/shoes/sneakers.png` | White sneakers | #e8e8e4 | White canvas trainers with a grey rubber sole |
| `player/shoes/oxfords.png` | Black Oxfords | #1a1a1e | Polished black lace-up shoes, with a small highlight on the toe |

## 5. Inventory icons: one per piece of clothing (29)

`items/clothes/<same id>.png` (for example `items/clothes/stetson.png`): **32×32 px** each, on a transparent background. Each shows
the piece of clothing on its own (not worn), seen from the front and a little above. It should fill most of the square, with a
1 px dark outline, in the same colours as its sprite.

Make one for each of the 29 clothing files above: 9 hats, 9 tops, 5 trousers and 6 shoes.

## 6. Portrait parts: the face shown in conversations

The conversation box shows the player's head and shoulders, put together from layers like the sprite. Every portrait part is
**64×64 px** and transparent. The head and shoulders face slightly to the right. All parts line up exactly.

- `portrait/body.png`: the face, neck and bare shoulders, with the same skin colours and the same simple, friendly, slightly
  wry face.
- `portrait/hair/<style>.png`: the 7 hairstyles above, in light greys for tinting.
- `portrait/beard/<style>.png`: the 4 facial hair styles, in light greys.
- `portrait/hat/<id>.png`: the 9 hats.
- `portrait/top/<id>.png`: the collar and shoulders of each of the 9 tops: the parka's fur hood edge, the jumpers' ribbed necks, the
  flannel collar, the suit's lapels, white shirt and red tie, the trench and pea coat's turned-up collars, and the oilskin's collar.

## 7. Tattoos (for the tattoo parlour)

- `tattoo/designs/<id>.png`: **24×24 px** each, in classic sailor-tattoo style: bold dark outlines with a few flat colours (red,
  green, blue, yellow), on a transparent background. The 12 designs are: `anchor` (Anchor), `heart` (Heart), `rose` (Rose),
  `swallow` (Swallow), `skull` (Skull), `star` (Nautical star), `dagger` (Dagger), `pine` (Pine tree), `snake` (Snake), `eagle`
  (Eagle), `ship` (Sailing ship), `moon` (Moon and stars).
- `tattoo/body/<part>.png`: the player's bare skin as large, plain areas to show a tattoo on, in the same skin colours and on a
  transparent background:
  - `arm_left.png` and `arm_right.png`: a forearm and upper arm, 48×96 px each;
  - `leg_left.png` and `leg_right.png`: a calf, 48×96 px each;
  - `chest.png` and `back.png`: 96×96 px each.

## 8. A preview sheet (to check the set)

`preview.png`: the finished layers stacked into three complete outfits, standing and facing down, each at 4× size on a plain
light grey background, side by side:
1. **The arrival outfit:** short brown hair (#4a2e1a), clean-shaven, yellow beanie, blue parka, jeans, brown boots.
2. **The Texas oil baron disguise:** Stetson, flannel shirt, khaki trousers, cowboy boots.
3. **The Wall Street broker disguise:** slicked-back short black hair (#1a1414), moustache, tailored suit, black trousers, Black Oxfords.

## The zip file

Name it `sarivalto-player-assets.zip`, with exactly this layout (all PNG):

```
player/body.png
player/hair/{short,long,bob,ponytail,curly,buzz,bald}.png
player/beard/{stubble,moustache,goatee,beard}.png
player/hat/{beanie_yellow,beanie,watchcap,flatcap,ushanka,beret,fedora,stetson,souwester}.png
player/top/{parka_blue,oilskin,sweater_grey,sweater,cableknit,shirt,suit,trench,peacoat}.png
player/legs/{jeans_blue,khakis,slacks,cords,dungarees}.png
player/shoes/{boots_brown,cowboyboots,wellies,snowboots,sneakers,oxfords}.png
items/clothes/<each of the 29 clothing ids above>.png
portrait/body.png
portrait/hair/<7 styles>.png
portrait/beard/<4 styles>.png
portrait/hat/<9 hats>.png
portrait/top/<9 tops>.png
tattoo/designs/{anchor,heart,rose,swallow,skull,star,dagger,pine,snake,eagle,ship,moon}.png
tattoo/body/{arm_left,arm_right,leg_left,leg_right,chest,back}.png
preview.png
```

That is 119 images: 41 sprite sheets, 29 icons, 30 portrait parts, 18 tattoo pictures and the preview. Check before zipping:
- every sprite sheet is exactly 96×160;
- every portrait part is 64×64;
- every icon is 32×32;
- the layers stack without any gaps or overlaps showing.
