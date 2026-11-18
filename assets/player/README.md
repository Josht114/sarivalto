# The player's art

Ready-made pixel art for the player character, to replace the sprite drawn in code (`lookChar` in `js/art.js`). Made in
PixelLab, following `docs/pixellab-player-prompt.md`; starting with one outfit, the one you arrive in (yellow beanie, blue
parka, jeans, brown boots).

What goes here, as PNGs on a transparent background (only the man: no snow or ground behind him), named by direction:
`south.png`, `north.png`, `west.png`, `east.png`. The game uses each as it appears, and draws the rest in code.

- The walking frames for each direction: south (facing the camera), north (facing away), west and east (or west mirrored). For
  each: a standing frame, left foot forward and right foot forward. Separate files or one sheet (3 columns: stand, left
  step, right step; 4 rows: south, north, west, east) are both fine.
- A head-and-shoulders portrait for the conversation box.
