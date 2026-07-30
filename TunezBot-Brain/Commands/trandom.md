---
tags:
  - command
  - session
aliases:
  - /trandom
---

# /trandom

Play a random song from what this session has already heard. A shuffle over the last few hours rather than over a library.

```js
const candidates = getSessionHistory(interaction.guildId)
  .filter((track) => track.id !== queue.currentTrack?.id);
```

## The filter is the whole command

Excluding the currently playing track is what makes it feel random. Without it, in a short session, "random" would regularly pick the song already playing — which reads as broken, not random. Two songs in history and no filter means a coin flip on doing nothing visible.

`?.` on `currentTrack` because the queue can exist with nothing playing.

## Plays now, does not queue

```js
await queue.node.play(randomTrack, { queue: false });
```

`queue: false` — play immediately, do not append. Consistent with [[tplay]] and [[treplay]]: anything phrased as "play X" interrupts; only [[tqueue]] appends.

## Depends entirely on the session lasting

Empty history → `No previous session songs to choose from yet.` And history dies on disconnect ([[Session History]]), so after a five-minute gap ([[Idle Timeout]]) this command has nothing to work with. That is a real interaction between two features worth knowing about, not a bug.

Related: [[thistory]] · [[treplay]] · [[Session History]]
