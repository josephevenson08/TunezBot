---
tags:
  - command
  - playback
aliases:
  - /tskip
---

# /tskip

Move to the next track. Simple in the normal case, genuinely interesting in one edge case.

## Normal path

```js
const skipped = queue.node.skip();
await interaction.reply(skipped ? 'Skipped.' : 'There was nothing to skip.');
```

## The artist-mode path

With an empty queue, "there is no next track" would normally be the answer. But in [[Artist Mode]] the promise is that there is *always* a next song — so instead:

1. Check for artist mode. Not on → `There is no next track queued.`
2. On → `deferReply()`, fetch a new track by that artist, **then** `queue.node.skip()`
3. Reply `Skipped. Artist mode: <track>`

Order matters. Fetching *before* skipping means a failed lookup leaves the current song playing rather than dumping you into silence. If the fetch fails, the reply explains why and nothing was lost.

## Why this edge case earned the extra code

It is where the feature would be tested. Turn on artist mode, dislike the song, hit skip — if that fails, the mode looks broken even though it works fine when left alone. Features get judged at their friction points.

Related: [[Artist Mode]] · [[tstopartist]] · [[Guild Queue]]
