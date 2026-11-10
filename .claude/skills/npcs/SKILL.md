---
name: npcs
description: Add, change or move a person (NPC) on Sarivalto - their entry in NPCS, look, faction and group, home and routine, character card, wiki note and daily conversations. Use whenever the user wants a new character, or to change who someone is, where they work or live, or how they look.
---

# NPCs

Everyone on the island is one entry in `NPCS` in `js/data.js`. The comment just above `const NPCS=` lists the fields. A person
also has a character card, a wiki note and a conversation for every day of September, so adding one touches several files.

## Before you add someone

1. **Gender.** New people move the cast towards 50/50. Count first:
   `node -e "const fs=require('fs'),vm=require('vm'),b={};vm.createContext(b);vm.runInContext(fs.readFileSync('js/data.js','utf8')+';this.N=NPCS',b);const g={};b.N.forEach(n=>g[n.gender]=(g[n.gender]||0)+1);console.log(b.N.length,g)"`
   Pick the gender that's behind unless the user or the plan says otherwise, and tell the user the new count.
2. **Faction and group.** `faction` is one id from `FACTIONS` (or `'none'`). `also` is at most **one** group from `GROUPS`.
   Never two groups.
3. **Name.** It must be unique across `NPCS` (quests and daily conversations find people by name). Names on the island are
   a mix of plain English ones (Tom, Kate, Helen) and Nordic and Finnish ones (Dagny, Hekki, Aino), with a few Italian and
   Russian ones for incomers. Check the name isn't already used.
4. **Where they work and live.** `loc` is a place id from `L`. `home` is a building interior that's listed in `DOORS` and has
   beds (or `'none'`). Look at who else works there and lives there, so the place isn't overcrowded.

## The entry

```js
// One line on who they are and why they're here.
{m:'mill_in',x:19,y:4,dir:2,name:'Dagny',home:'skyapts',loc:'mill_in',job:'Owner of the Eastbrook Lumber Company',
 faction:'proprietors',gender:'female',body:'#3a3d4a',hair:'#b5b5b5'},
```

- `m, x, y, dir`: where they stand at work (usually `m` is the same as `loc`). The tile must be floor they can stand on: not a
  wall, furniture, prop or exit, and not in anyone else's spot. `dir`: 0 down, 1 up, 2 left, 3 right.
- `body` is their clothes colour, `hair` their hair colour (grey `#b5b5b5`, black `#222222`, brown `#5a3a22`, blond `#caa05a`).
  `hat` (optional) gives them a beanie of that colour. Their sprite is drawn from these and `gender`.
- Optional: `partner` (the name of their partner, who must name them back), `evening:{m,x,y,dir}` (where they are in the
  evening instead of at home), `costume`.
- Routine is automatic: by day at `m/x/y`, at night beside a bed in their `home`. People working somewhere open only at night
  (`NIGHT_ONLY`) are the other way round. Someone who works days and nights goes in `EVENING_STAFF`.
- A shopkeeper also needs an entry in `SHOPS` under their name.
- Put the entry with the other people of the same place, not at the end.

## The other files

1. **Character card:** `personalities/factions/<faction folder>/<slug>.txt` if they're in a main faction, otherwise
   `personalities/groups/<group folder>/<slug>.txt`. The slug is the name in lowercase with hyphens (`Father Thyme` ->
   `father-thyme`). Copy the layout of an existing card (Name, Gender, Faction, Group, Partner, Job, Home, then `Bio:`), lines
   wrapped at about 40 characters. The bio is 3 to 6 short lines: what they do, what they're like, what they want, who they
   love or can't stand.
2. **Wiki note:** add `slug:{work:'<loc>',note:"..."}` under `npcs:` in `content/notes.js`, written like the others (job,
   where they work and live, faction and group, partner). If they matter to a place or faction, **add** a sentence to that
   place's or faction's note too. Don't reword the existing text.
3. **Faction chart:** if they're a leader or an important member, add them to `FACTION_TREE` (ask the user where they sit).
4. **A partner:** if they're paired with an existing person, add `partner` to both entries and both cards.
5. **Daily conversations:** run `node tools/daily-roster.js` to get their row in `content/daily/ROSTER.md` (their file and
   their `first` day). Write `content/daily/<slug>.js` following `content/daily/README.md` exactly: every day from `first` to
   30, an opener, at least three replies, and a closing line. Add them to `content/daily/authors.json` with the model that wrote
   them (`"opus"` or `"sonnet"`). Check with `node tools/build-daily.js <slug>`, then rebuild with `node tools/build-daily.js`.
   This is a lot of writing: say so, and ask the user whether to do it now or leave it for later.
6. **Wiki:** `node tools/build-wiki.js`. It stops with an error if a required field is missing or `home` isn't a real
   interior. Their page appears in `wiki/npcs/`.

## Checking

- Syntax: `node -e "new Function(require('fs').readFileSync('js/data.js','utf8'))"`.
- In the preview, open `/?new&day=N` (a day their district is open) and go to their place. Find them with the JavaScript tool,
  `NPCS.find(n=>n.name=='Name')`, and check they're standing where they should be, look right, and talk. Then check their home
  at night (`?night`) to see they have a bed.
- Look at the console for errors.

## Changing someone

- Moving someone to another job or home: update `loc`, `m/x/y`, `home`, their card, their wiki note, and anything that names
  their old place. Their daily conversations may mention the old job: tell the user rather than rewriting them.
- Never remove or reword existing dialogue, cards or notes without asking. Adding is fine.
- Removing a person breaks every quest and conversation that names them: search for the name in `js/`, `content/` and
  `quest-plan/` first and tell the user what depends on them.
