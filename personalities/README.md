# Personalities

A card for every character (name, gender, faction, group, partner, job and home, then a `Bio:` to write their story under), one
text file each, named like their wiki page.

- `factions/<faction>/`: everyone with one of the main factions (the ones that can win), in that faction's folder. Someone who is also in a group is still filed under their faction; their card lists the group.
- `groups/<group>/`: everyone who is only in a group (the CIA, the Republican Party, the Union, the Circus, the Shopkeepers and so on).
- `unaligned/`: anyone with neither (nobody, at the moment).

The factions and groups are `FACTIONS` and `GROUPS` in `js/data.js`.
