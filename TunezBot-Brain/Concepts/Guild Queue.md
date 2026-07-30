---
tags:
  - concept
---

# Guild Queue

One queue object per server, owned by [[discord-player]] and fetched with `player.nodes.get(guildId)`. Holds the current track, the upcoming tracks, the repeat mode and the playback node.

## Reading it safely

Discord Player stores tracks in its own collection type, which has changed shape across versions. The bot normalises it once:

```js
function queuedTracks(queue) {
  if (typeof queue.tracks.toArray === 'function') return queue.tracks.toArray();
  return queue.tracks.store || [];
}
```

Every command that touches the queue goes through this instead of reaching into `queue.tracks` directly — so a library upgrade breaks one function rather than seven commands. Cheap insurance against a dependency that already made one breaking change ([[discord-player]] v7 dropping YouTube).

## `deleted` is not `null`

A queue object can outlive its usefulness. The check throughout is:

```js
if (!queue || queue.deleted) → "Nothing is playing right now."
```

Both halves are needed. `queue.delete()` marks the object dead but `player.nodes.get()` may still hand it back. Checking only for `null` would happily operate on a corpse.

## Who mutates it

| Command | Effect |
| --- | --- |
| [[tplay]] | Deletes and rebuilds it, re-adding the saved tracks → [[tplay preserves the queue]] |
| [[tqueue]] | Appends |
| [[tremove]] | Removes one by index |
| [[tclear]] | Empties upcoming, keeps the current track |
| [[tstop]] | Deletes the queue entirely |
| [[tskip]] | Advances |
| [[Artist Mode]] | Refills it on `EmptyQueue` |

Related: [[Per-Guild State]] · [[Interaction Router]] · [[Session History]]
