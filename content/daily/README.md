# Daily conversations

Everyone on the island has their own conversation for each day of September they can be reached. The conversations here are
bundled into `js/daily.js` by `node tools/build-daily.js`. The game uses them in `dailyConvo()` in `js/game.js`.

- One file per person: `content/daily/<slug>.js` (the slug and file are in `ROSTER.md`, made by `node tools/daily-roster.js`).
- Write every day from the person's `first` day (in `ROSTER.md`) to day 30. On days before that, the game has them just say
  their name. `content/daily/ruby.js` is the example to follow.
- Check your files with `node tools/build-daily.js <slug> <slug> ...`. That checks only the files you name and writes nothing.
  Running it with no names rebuilds `js/daily.js` from every file.

## Format

```js
// Name, job and where (faction). Threads: the running threads you're keeping across their month.
DAILY['Name']={
4:["What they open with.",[
  ["Your reply.","Their answer."],
  ["Your reply.",["Their answer, which goes on.",[
    ["A further reply.","Their answer."],
    ["Another.","Their answer."]]]],
  ["Your reply.","Their answer."]],
 "What they say if you talk to them again today."],
5:[ ... ],
};
```

- The name in `DAILY['...']` must be spelt exactly as in the roster. The day number is the day of September.
- Every day needs an opener, **at least three** replies, each with an answer, and a closing line. More replies and deeper
  branches are welcome when they're worth it, for example a secret, a hint or an argument. Use them on perhaps one day in four.
- Once the player hears an answer to the end, that day's conversation is done, and they only hear the closing line until the
  next day. So the closing line is short, and it ends the day: "Mind the ice on the steps." Not a question.
- The code is plain JavaScript strings in double quotes. Escape any `"` inside as `\"`, or use single quotes for quoted speech.
  Don't use backticks or `${}`. Apostrophes are fine.

## Information: summaries, and what the player has heard

Every conversation the player hears goes into the menu's Information tab, under its day, as `'Name:day'` (for example
`'Elin:2'`). Three optional parts use it:

```js
3:["What they open with.",[
  ["A reply everyone gets.","Their answer."],
  ["A reply only if you heard Elin on the 2nd.","Their answer.","Elin:2"],
  ["A reply only if you didn't.","Their answer.","!Elin:2"]],
 "What they say if you talk to them again today.",
 "A one-line summary for the Information tab: what the player learned.",
 {"Elin:2":"What they open with instead, if you heard Elin on the 2nd."}],
```

- **The summary** (fourth part) is one or two short sentences of what the player learned, in the third person: "Elin, Phil's
  secretary at Kelp Cola, lives with Mats, a clerk at Diversified Petroleum." Without one, the tab shows what the player asked.
  Days 1 to 3 have summaries so far.
- **Another opener** (fifth part, after a summary) replaces the first line when the player has heard one of the named
  conversations; the first one heard wins. Use it when an opener assumes you've met ("You again.").
- **A reply's third part** shows it only if the player has heard that conversation (`'Elin:2'`) or hasn't (`'!Elin:2'`).
  Join several with `|` for "any of these" (`'Kurt:2|Kurt:6'`), or, after `!`, "none of these" (`'!Kurt:2|Kurt:6'`).
  Pair them so there are always at least three replies. Use it whenever a reply mentions something from another day.

## Every day stands on its own

A player won't talk to everyone every day. So no conversation may rely on an earlier one having been heard:

- **A reply** that picks up a thread from an earlier day ("How are the pigeons?") needs the days that mention it
  (`'Kurt:2|Kurt:6|Kurt:9'`), and beside it a reply for a player who heard none of them (`'!Kurt:2|Kurt:6|Kurt:9'`), whose
  answer brings the thread up from the start ("What do you do when there's no work?" "Pigeons. Twelve of them, on my roof...").
- **An opener** that names someone or something from an earlier day says who or what it is, in a few words: "Annika, my
  daughter in Turku", "Bertha, the projector". Or it gets another opener for those who heard (the fifth part).
- **A reply** can't lean on another reply's answer on the same day: the player sees all the replies before any answer.
- Check with `node tools/daily-continuity.js <slug>`. It lists the replies and openers that use a distinctive word this person
  only said on an earlier day. Fix each one, or, if it's fine as it is, run it with `--ok` to add it to
  `continuity-ok.txt` (the lines already looked at), so only new ones show.
- `node tools/build-daily.js` checks that every `'Name:day'` named is a real conversation.
- The wiki's Information page lists every conversation that changes a later one, and how many days have summaries.

## Voice and content

- **Setting:** September 198-, on Sarivalto, a snowy, fictional island in the Baltic north of Finland, in the Cold War. The
  old king has just died, and seven factions compete to decide the island's future. They are the Communist Party (wants it in
  the Soviet Union), the Royal Family (Prince Leopold for king), Kelp Cola (business), Diversified Petroleum (oil), the
  Orthodox Church (wants pious Prince Augustus), the Crime Syndicate, and the Democratic Party (wants a vote). There's no
  internet and no mobile phones. People have telephones, radios, newspapers (the Eastbrook Gazette), trams and boats.
- **The player:** everyone thinks the player is a British reporter, from a London paper, come to cover the king's death. They're
  really NIGHTJAR, a CIA agent, but only Hekki (and Chuck and George, off-island) know that. Nobody else may hint that they know.
- **Replies:** the three replies should feel different. For example, one is friendly or chatty, one asks as a reporter, and one
  is blunt, joking or provocative. The player speaks in short lines, 15 words at most. Don't make the player promise or do
  anything: quests handle that.
- **Answers:** 1 to 3 sentences. Stage directions go in brackets, as in the existing game: "(She lifts the needle off the record.)"
  Keep a dry, warm, slightly wry tone. Use British spelling.
- **Every day different:** no conversation may repeat or rephrase an earlier one. Give each person 2 to 4 running threads that
  move on through the month (their work, family, partner, a worry, a hobby, a grudge, a secret), and touch the day's events.
  Let them mention and gossip about other people on the island by name. Use their card (bio, partner, home, job) and the wiki
  notes in `content/notes.js`. Stay true to who they are and what they believe.
- **Calendar:** `ROSTER.md` lists each day's quests and events. People can talk about what's in the air: a faction's big day
  coming up, rumours, the weather getting colder. But never state how a quest turned out, because the player decides that.
  Talk about plans, hopes, fears and rumours, not results. Fixed events everyone knows about:
  - Days 1 to 7: the snow clears and the roads open, a district at a time (`first` days).
  - Day 10: the late king's funeral, in the Royal Chapel at the palace in Kingsgrad.
  - Day 14: a gathering of the whole island. Keep it vague: "the big day on the fourteenth", what people expect and feel. No
    specifics.
  - From about day 17 the ground shakes now and then, and there's steam from the volcano in the north. Day 21: the volcano erupts
    (ash, fear, lava in the north, nobody killed). After that it's cleaning up, ash on everything, and sitting out the
    aftershocks.
  - Days 28 and 29: every faction's biggest push. Day 30: the last day, when the island's future is settled. Keep it to
    nerves and hopes, with no outcome.
- **Never mind the time:** you might talk to someone by day at work or in the evening at home. Avoid "good morning" or "tonight
  at the bar", unless it's about another day.
- **No anachronisms**, and nothing later than the early 1980s.

## Who writes what

Each writer takes a set of people, named in their brief. Only touch those people's files.
