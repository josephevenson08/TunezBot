---
tags:
  - command
  - playback
aliases:
  - /tresume
---

# /tresume

Resume paused playback.

```js
const resumed = queue.node.resume();
await interaction.reply(resumed ? 'Resumed.' : 'Playback is not paused.');
```

The exact mirror of [[tpause]], down to the boolean-return pattern.

## Why not one toggle command

`/tplaypause` would be fewer commands to remember. Two separate commands were chosen because a toggle is **ambiguous when you cannot see the current state** — in a busy Discord channel, "did someone already pause it?" is a real question, and a toggle turns a wrong guess into the opposite of what you wanted.

Explicit verbs are always safe to run: `/tpause` on a paused track does nothing and says so.

## Note

The [[Bot Activity Status]] interval keeps running while paused, so the timestamp display freezes at the pause point and resumes counting here. That is correct behaviour by accident rather than design — `getTimestamp()` reports the node's real position — but it works.

Related: [[tpause]] · [[tnowplaying]]
