# PixelLab: the player, in the arrival outfit (a 40-image budget)

One outfit first, to settle the look and the size before spending images on the rest: short brown hair, clean-shaven,
yellow beanie, blue parka, jeans and brown boots (`PLAYER.look` in `js/data.js`). When this one's right, the other clothes
and hairstyles can follow the same recipe (see `docs/player-art-prompt.md` for the full list).

## Settings

- **View:** top-down, three-quarter view from above and in front (low top-down), like a 16-bit RPG.
- **Size:** 32 px wide and 40 px tall if PixelLab allows a custom canvas. If it only offers squares, use **48×48**, keep the
  character about 32 px wide and 40 px tall, standing on the bottom of the canvas, and crop afterwards.
- **Outline:** a thin dark outline. **Shading:** basic or medium. **Detail:** medium (it's small).
- **Background:** transparent (turn on PixelLab's no-background or transparent option). Don't mention snow, ground or
  scenery in the description: it draws them in. The game draws the ground; the sprite must be only the man.
- **Colours:** if it takes a palette or reference colours, give it the hex codes below.

## The description (paste this)

```
A man in his thirties, a British newspaper reporter in the early 1980s.
Short brown hair, clean-shaven, friendly and alert face.
Yellow knitted beanie with a turned-up cuff.
Blue padded winter parka with a cream fur trim at the collar, zipped up.
Dark blue jeans. Brown leather ankle boots.
Plain standing pose, arms at his sides.
Cold muted palette, crisp pixels, light from the upper left, no shadow on the ground, transparent background.
```

**Negative (if it has a field for it):** `blurry, anti-aliasing, gradient, background, scenery, snow, ground, floor, ground shadow, text, weapon, bag, hat brim, modern clothes`

**Colours:**

| Part | Colour |
|---|---|
| Skin | `#f1c7a0`, shadow `#d9a37a` |
| Hair | `#4a2e1a` |
| Beanie | `#e8c33a` |
| Parka | `#2a5db0`, with cream trim `#e8dcc0` |
| Jeans | `#2d3046` |
| Boots | `#3b2a22` |

## How to spend the 40 images

| Step | What to make | Images |
|---|---|---|
| 1 | **The look.** Generate the description above, facing **south** (towards the viewer). Try a few, and pick the one that looks right at game size. | 6 |
| 2 | **Four directions.** Using the chosen one as the reference, make it face **north** (back of the head), **west** and **east**. East can be west mirrored if it's close enough: then skip it. | 4 |
| 3 | **Walk cycle.** For each direction, a short walk: you need a standing frame and two steps (left foot forward, right foot forward). Animate from the chosen sprite with a prompt like `walking, slow steady pace`. | 12 |
| 4 | **Portrait.** The same man, head and shoulders, facing slightly right, 64×64, for the conversation box. Say it's the same character, with the same beanie and parka. | 4 |
| 5 | **Spare.** For retries: a direction that came out wrong, a walk frame where the parka changes colour, and so on. | 14 |

## What to check before moving on

- **Game size:** at real size, does he read as one person? Is the yellow beanie clear? Is he obviously in a blue parka?
- **Same man in every frame:** the same height, colours and face in all four directions and every walk frame.
- **The feet:** they sit on the same row in every frame, so he doesn't bob up and down when the frames are stacked.
- **No soft edges:** no glow round the outline and no stray half-transparent pixels. Clean these up in Aseprite or LibreSprite.

## What to send back

The chosen frames as PNGs (or one sheet: 3 columns for stand, left step and right step; 4 rows for south, north, west and
east), plus the portrait. The game can then be switched over to use them, and the next outfit made the same way.
