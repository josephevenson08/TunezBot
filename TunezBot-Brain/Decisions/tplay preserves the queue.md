---
tags:
  - decision
date: 2026-07
status: decided
---

# tplay preserves the queue

**Decision:** `/tplay` interrupts the current song but keeps everything queued behind it.

## The problem

"Play this now" has two plausible meanings:

1. Replace everything — this song, then nothing
2. Replace only what is audible — this song, then whatever was already lined up

Most bots do (1) because it is trivial. (2) is what people actually mean when three songs are already queued and someone wants to show you one thing.

## The implementation

```js
const preservedTracks = existingQueue && !existingQueue.deleted ? queuedTracks(existingQueue) : [];
if (existingQueue && !existingQueue.deleted) existingQueue.delete();

const result = await withRetry(() => player.play(channel, query, { ... }));

if (preservedTracks.length > 0) result.queue.addTrack(preservedTracks);
```

Save → destroy → rebuild → restore. Not elegant, but it is what [[discord-player]] allows: there is no "replace current track, keep queue" primitive, so the queue is torn down and reassembled around the new track.

## The details that make it safe

- `!existingQueue.deleted` is checked **twice**, because reading tracks off a dead queue and calling `.delete()` on one are both errors → [[Guild Queue]]
- Tracks are captured *before* the delete, obviously, but it is the kind of ordering that breaks silently if the lines get rearranged
- Restore happens after `player.play()` resolves, so `result.queue` is the new queue, not the old one
- The whole thing is inside try/catch — a failed play leaves the user with a message rather than a destroyed queue and no music

## The trade-off

There is no way to say "clear everything and play this." That is `/tstop` then `/tplay`, or `/tclear` then `/tplay`. Two commands for the rarer intention, one for the common one — the right way round.

Related: [[tplay]] · [[tclear]] · [[tstop]] · [[Guild Queue]]
