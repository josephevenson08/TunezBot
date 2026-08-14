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

## The implementation, third attempt

```js
if (existingQueue && !existingQueue.deleted && existingQueue.currentTrack) {
  const searchResult = await withRetry(() => player.search(query, { requestedBy: interaction.user }));
  const track = searchResult?.tracks?.[0];
  await withRetry(() => existingQueue.node.play(track, { queue: false }));
  return;
}
// nothing playing: no connection to preserve, start one normally
```

`{ queue: false }` means "play this now, do not queue it" — which is precisely what the command means. [[trandom]] has done it this way since it was written.

## Two wrong versions first, both instructive

**Save → delete → rebuild → restore.** Captured the upcoming tracks, called `existingQueue.delete()`, played the new track, re-added the saved ones. It produced the right *result* and had a serious side effect: `queue.delete()` triggers `leaveOnStop`, so **the bot dropped out of the voice channel and immediately rejoined on every `/tplay`**. Visible in Discord if you were watching rather than reading logs — and that rejoin was what kept timing out as an `AbortError` from `discord-voip`. The mystery error of 2026-08-14 was self-inflicted by this function.

**Insert at the front, then skip.** `existingQueue.insertTrack(track, 0)` followed by `node.skip()`. Kept the connection up, played the wrong song: `insertTrack` **appends** rather than inserting at index 0, so with a song already queued the skip landed on that one instead. Play A, queue B, `/tplay` C, hear B.

## What both mistakes have in common

Each assumed a method did what its name implied. `delete()` reads as "remove this object", not "and also hang up the call". `insertTrack(track, 0)` reads as "insert at position 0". Neither was checked before shipping.

The working version is also the shortest, and it uses a call that was already in this file doing this exact job. **Before reaching for a new primitive, look at what the codebase already does.**

Related: [[2026-08-14 Site vault and Pi deployment]]

## The trade-off

There is no way to say "clear everything and play this." That is `/tstop` then `/tplay`, or `/tclear` then `/tplay`. Two commands for the rarer intention, one for the common one — the right way round.

Related: [[tplay]] · [[tclear]] · [[tstop]] · [[Guild Queue]]
