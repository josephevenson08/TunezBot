---
tags:
  - command
  - discovery
aliases:
  - /tartist
---

# /tartist

`/tartist <artist name>` — turn on [[Artist Mode]]. The queue stops ever running out.

## Two things at once

1. `artistModes.set(guildId, artist)` — the mode is on for this server
2. Immediately search `<artist> official audio` and play the first hit

Doing both means the command has visible effect right away. Setting a mode that only manifests when the queue happens to empty would feel like nothing happened.

## Set before, cleared on failure

```js
artistModes.set(interaction.guildId, artist);   // before the try block
try { ... } catch (error) {
  artistModes.delete(interaction.guildId);      // rolled back
  await interaction.followUp(`Could not start artist mode: ${error.message}`);
}
```

The rollback is the careful part. Without it, a failed first search would leave the mode silently **on** — and the next time the queue emptied, music by an artist nobody asked for would start. Failing loudly and completely beats failing halfway.

## No validation of the name

Whatever string is typed goes to YouTube search. `/tartist asdfgh` gets whatever YouTube returns for that. There is no artist database and no fuzzy matching — this bot only knows what search gives it, which is exactly the honest scope for a project built on [[yt-dlp]].

Related: [[tstopartist]] · [[tskip]] · [[trelated]] · [[Artist Mode]]
