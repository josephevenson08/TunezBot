---
tags:
  - command
  - playback
aliases:
  - /tplay
---

# /tplay

`/tplay <YouTube URL or search>` — play something right now.

The most-used command and the most carefully built one.

## What it does

1. Voice gate — you must be in the bot's channel → [[Voice Connection]]
2. **Clears [[Artist Mode]]** — asking for a specific song means you are done with the artist
3. `deferReply()` — the lookup takes longer than Discord's 3-second window
4. Resolve the input to a real URL → [[Query Normalization]]
5. **Save the upcoming tracks**, delete the queue, play the new track, **re-add the saved tracks**
6. Reply with the resolved title

## Step 5 is the whole design

The obvious implementation of "play this now" destroys the queue. This one does not → [[tplay preserves the queue]]. Your five queued songs survive an interruption.

```js
const preservedTracks = existingQueue && !existingQueue.deleted ? queuedTracks(existingQueue) : [];
if (existingQueue && !existingQueue.deleted) existingQueue.delete();
const result = await withRetry(() => player.play(channel, query, {...}));
if (preservedTracks.length > 0) result.queue.addTrack(preservedTracks);
```

Both `!queue.deleted` checks are load-bearing → [[Guild Queue]].

## Undocumented side effect

Cancelling artist mode is not announced anywhere. If you are in artist mode and use `/tplay`, the mode is silently off. Arguably it should say so → [[Open questions]].

Related: [[tqueue]] · [[Retry Wrapper]] · [[Commands MOC]]
