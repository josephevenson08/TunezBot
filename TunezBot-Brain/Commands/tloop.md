---
tags:
  - command
  - playback
aliases:
  - /tloop
---

# /tloop

Loop the current track forever.

```js
queue.setRepeatMode(QueueRepeatMode.TRACK);
```

`TRACK`, not `QUEUE`. Discord Player supports both — this bot deliberately only exposes single-track looping, because "loop the whole queue" and "loop this song" are two different intentions and the second one is what actually gets wanted. Adding `QUEUE` mode later is a one-line change if that turns out wrong.

## Guard

If nothing is playing, it replies rather than setting a repeat mode on an empty queue. The outer `!queue || queue.deleted` guard in the [[Interaction Router]] catches the no-queue case; this inner check catches the queue-exists-but-idle case.

## Effect on everything else

Looping stops the queue advancing, which means:

- Queued songs sit untouched until [[tstoploop]]
- [[Idle Timeout]] never fires — the queue never empties
- [[Artist Mode]], if on, never gets a chance to refill

The reply for [[tstoploop]] says so explicitly: *"the queue will continue after this song."* Making the interaction visible in the confirmation is cheaper than expecting anyone to remember it.

Related: [[tstoploop]] · [[Guild Queue]] · [[tnowplaying]]
