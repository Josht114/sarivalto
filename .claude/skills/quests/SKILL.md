---
name: quests
description: Add, change or plan a quest in Sarivalto - a faction's main quest, George's evening job, or a side quest - including its steps, choices, faction points, conversations, plan file and wiki. Use whenever the user asks for a new quest, wants to build one from quest-plan/, or change how an existing quest plays.
---

# Quests

A quest is one entry in `QUESTS` in `js/data.js`. The engine is in `js/game.js` under `// ---- Quests`. Read the field guide in
the comment just above `const QUESTS=` in `js/data.js` before starting: it lists every step type. This skill covers how to put
one together.

## Before you write anything

1. **Find the plan.** Main quests are planned in `quest-plan/<faction>/<Title>.txt` (side quests in `quest-plan/side-quests/`).
   The user's notes under "Plan:" are what they want: follow them, including the points and endings they ask for.
2. **Check the day.** `QUEST_DAYS`, `QUEST_TITLES` and `QUEST_EVENINGS` in `js/data.js`, and `docs/quest-schedule.md`. The schedule
   is the user's own plan: don't move a quest to another day or rename one unless they say so. If a quest isn't in the plan
   yet, ask where it goes.
3. **Check the people.** Every name you use (giver, talk, to, speaker) must be in `NPCS`, spelt exactly the same. Look at their
   card in `personalities/` and their entry in `content/notes.js` so they sound like themselves. If the quest needs someone
   new, use the `npcs` skill first.
4. **Check what's already there.** Read a finished quest of the same kind as a model:
   - `samples` (Free Samples!): a main quest with many people, a choice and endings.
   - `fairpay` (Fair Day's Pay): flags, things to look at (`looks`), and a choice worked out from two flags.
   - `flatcola` (Flat Cola): one of George's evening jobs (`evening:true`, `call:true`, `pick`).
   - `tattoo`, `beans`, `pizza`: small side quests.
5. If the plan leaves a real decision open (how many points, what the endings are), ask. Don't guess.

## The shape of a quest

```js
// Title (Faction, D September): one or two plain sentences on what happens, the choices and the points.
myquest:{title:'Title',giver:'Name',main:true,day:13,seq:true,
  choices:{good:'what the good ending is',bad:'what the bad ending is'},
  text:"What the Quests tab says the quest is about: who wants what, and where to go. Name places the way the island does.",
  offer:"What the giver says offering it. Ends with a question the player can accept.",
  accept:"What they say when you accept: the first place to go, in a sentence.",
  wait:"What they say if you come back before it's done.",
  done:[
    {talk:'Someone',what:'Talk to Someone, at the place',chat:{start:'a',nodes:{...}},said:'What happens next.'},
    {if:'good',talk:'Name',points:{cola:1},chat:GOOD_CHAT,what:'Tell Name how it went'},
    {if:'bad',talk:'Name',points:{cola:-1},chat:BAD_CHAT,what:'Tell Name how it went'}],
  thanks:"One line said when the quest is complete."},
```

- **Main or side.** `main:true` + `day`: offered by the giver that morning only, and the player can't move on to the evening until
  it's done. `evening:true`: offered on its day after dark (George's CIA jobs). Neither: a side quest, offered from `from` or once
  `opens` places are open. `call:true`: offered on the video call in the player's room (Chuck by day, George by night).
  `ring` + `caller`: comes in on the telephone in the player's room. `given:true`: only handed out by another quest (`gives`).
- **Steps** (`done`): with `seq:true` they happen in order. Each has a `what` (shown on the Quests tab, starting with a verb and
  saying where) and one action: `talk`, `give`/`to`, `bring`/`to`, `use`/`m`, `spot`, `enter`/`speaker`, `pick`, `tour`/`price`,
  `event`. Extras on a step: `said` (what happens once it's met), `ok:q=>...` (whether the conversation got what it needs),
  `points:{faction:n}`, `gift` (an item), `takes` (items taken), `gives` (more quest ids), `flag`, `orChoice`, `last`, `days` +
  `arrives` (wait that many days), `note` (a few words for the wiki).
- **Choices.** List them in `choices`. A conversation option calls `questChoice('id','good')`; then every step with an `if`
  that doesn't match falls away. `if` can be one choice or a list.
- **Flags.** `qFlag('id','name')` from a conversation, or `flag:'name'` on a step. Use flags for things a step needs later, for
  `meet` and `aftermath`, and to work out a choice from several decisions (see `fpSettle` for Fair Day's Pay).
- **Points.** Faction ids from `FACTIONS`. Put the points on the step that ends the quest, and say them in that conversation in
  brackets: "(Kelp Cola: +1 point.)". The usual sizes are +1/-1 for a good/bad ending and -2 for betraying the giver.
- **People who move.** `meet:[{name,m,x,y,dir, after|if|flag}]` puts someone somewhere while the quest is yours.
  `aftermath:[{flag|open, name, say, m,x,y,dir, hat}]` changes what someone says (or where they stand) because of the quest.
- **Things to look at.** `looks:[{spot:{m,x,y},flag,what,say,again,gift}]`: facing that tile and pressing E reads `say` and sets
  the flag.

## Conversations

```js
{start:'a',nodes:{
  a:{say:"(Stage direction.) What they say.",opts:[
    ["What the player says.",'b'],
    ["Another reply, which makes a choice.",'c',()=>questChoice('myquest','good')],
    ["A reply shown only sometimes.",'d',null,()=>has('cola')],
    ["Goodbye.",null]]},
  b:{say:"..."}, ...}}
```

- An option is `[label, next node or null to end, function to run, condition to show it]`.
- Long conversations, or ones used in several places, go in a `const` just above `const QUESTS=` (named with the quest's
  initials, like `SF_PHIL`, `FP_TOPICS`), with a `//` comment saying what it is.
- When many people take part (like the seven factions in Free Samples!), build their conversations with a function and use
  `talk` with a getter plus `chats` (see `samples`), rather than writing one step per person.
- The player's lines are short (15 words at most). Everyone else speaks in 1 to 3 sentences, British spelling, dry and warm.
  The player is "the journalist" to everyone but Hekki, Chuck and George. Don't make the conversation decide the ending for
  the player: give them the choice.

## New items

A quest item goes in `ITEMS` (`{name, desc, actions:[]}`) and needs a sprite in `ITEM_ART` in `js/art.js` (copy a similar one).

## After writing it

1. **Update the plan file** in `quest-plan/` if the quest changed from it, and the `QUEST_TITLES` entry if it's new (only as the
   user directs).
2. **Wiki:** if a person's role changed, add to their note in `content/notes.js` (don't reword what's there). Then
   `node tools/build-wiki.js`; the Quests page builds itself from `QUESTS`.
3. **Syntax check:** `node -e "new Function(require('fs').readFileSync('js/data.js','utf8'))"`.
4. **Play it through** in the preview: open `/?new&day=N` for the quest's day (add `&night` for an evening job). Use the
   JavaScript tool to jump ahead where walking would take long: `ME.quests`, `qOf('id')`, `meet(q,i)`, `questChoice`,
   `qFlag`, and moving the player with `place(m,[x,y],dir)`. Check every ending: each one completes, gives the right
   points (`FP.pts`), and nothing is left open on the Quests tab. Look at the console for errors.
5. Tell the user which endings you tested and anything you couldn't.

## Rules

- Never remove or reword existing quest text or dialogue without asking.
- Don't change the schedule (days, titles, which faction has which day) unless the user asks.
- Keep to the code style: dense one-line JS, with a plain-English comment above each quest.
