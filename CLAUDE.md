# Sarivalto

A 2D top-down pixel-art game in plain JavaScript (no build step, no dependencies). A CIA agent, posing as a British reporter,
spends the 30 days of September 198- on Sarivalto, a snowy fictional island north of Finland, while seven factions fight over
its future after the old king's death. See `README.md` for the full picture.

## Running and checking

- Serve the folder: the `sarivalto` entry in `.claude/launch.json` (`python tools/serve.py 8765`). Use the preview tools, not Bash.
  It keeps saves as files in `saves/` (the user commits them to carry them between machines): don't commit test saves.
- Test starts: `?new` (a fresh game), `?day=N` (start on day N of September), `?night`. These skip the title screen.
- tools/serve.py tells the browser not to cache, but a page loaded before an edit can still hold old files: after editing,
  re-fetch the changed files with `{cache:'reload'}` and reload before checking.
- Quick syntax check of a file: `node -e "new Function(require('fs').readFileSync('js/data.js','utf8'))"`.

## Where things are

- `js/data.js`: nearly all game data: places (`L`, `LINKS`, `DOORS`, `BLD`), people (`NPCS`, `FACTIONS`, `GROUPS`,
  `FACTION_TREE`), items and shops (`ITEMS`, `SHOPS`), quests (`QUESTS`, `QUEST_DAYS`, `QUEST_TITLES`), music (`TRACK_INFO`,
  `MUSIC_AT`) and tapes (`TAPES`).
- `js/game.js`: the engine: movement, talking, quests, routines, saving. `js/art.js`: all pixel art, drawn in code.
- `content/notes.js`: hand-written wiki text. `content/daily/`: everyone's daily conversations (see its README), bundled into
  `js/daily.js` by `node tools/build-daily.js`. Never hand-edit `js/daily.js`.
- `personalities/`: a character card for every person. `quest-plan/`: a text file for every planned quest.
- `docs/quest-schedule.md`: which factions have quests on which day.
- `wiki/` is generated: run `node tools/build-wiki.js` after changing data, and commit the result. Never hand-edit `wiki/`.
  (Most wiki files show as modified after a rebuild only because of line endings; that's harmless.)

## Rules

- **Don't remove or reword existing game text** (dialogue, quest text, notes, cards) without asking first. Adding is fine.
- **The quest schedule is the user's own plan.** `QUEST_DAYS`, `QUEST_EVENTS`, `QUEST_TITLES` and `quest-plan/` change only as
  the user directs.
- **New people move the cast towards 50/50 male/female.** Check the current count before choosing a gender.
- **One group per person.** Someone may have a faction and one group (`also`), never two groups.
- Keep the code's own style: dense one-line JavaScript, with a plain-English `//` comment above each piece saying what it is.

## Writing style for game text

- British spelling. Short, plain sentences. Dry, warm, slightly wry.
- Stage directions in brackets: "(She lifts the needle off the record.)"
- The player speaks in short lines (15 words at most). Everyone thinks the player is a reporter; only Hekki, Chuck and George
  know otherwise.
- Nothing later than the early 1980s: no internet, no mobile phones. Telephones, radios, the Eastbrook Gazette, trams, boats.

## Commits

- Commit straight to `main` when asked, and push when asked.
- Messages follow the existing ones: one long line saying what was added, in game terms (who, where, what the player does,
  the points), then a short "Wiki:" note if the wiki changed.

## Skills

- `quests`: adding or changing a quest. `npcs`: adding or changing a person on the island.
