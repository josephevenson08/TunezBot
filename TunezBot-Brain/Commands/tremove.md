---
tags:
  - command
  - queue
aliases:
  - /tremove
---

# /tremove

`/tremove <position>` — drop one song from the queue without touching anything else.

## The off-by-one

Positions shown to people are **1-based**; the array underneath is **0-based**:

```js
const removed = queue.node.remove(position - 1);
```

The `- 1` is the entire bridge between the two. `/tqueue`'s numbered list is the contract — whatever number is displayed there is what gets typed here.

## Validation before action

```js
if (position < 1 || position > tracks.length) { ... }
```

Two different messages, because they are two different mistakes:

- Queue has songs, bad number → `Give a position between 1 and 5.`
- Queue is empty → `There are no queued songs to remove.`

Both ephemeral — a correction only the person who typed it needs to see. Also enforced at the Discord level with `.setMinValue(1)` in [[Slash Command Registration]], so the client rejects `0` before it ever reaches the bot. Validating in both places is not redundant: the client-side check is UX, the server-side check is correctness.

## Cannot remove the current track

Only queued songs. To skip what is playing, that is [[tskip]].

Related: [[tqueue]] · [[tclear]] · [[Guild Queue]]
