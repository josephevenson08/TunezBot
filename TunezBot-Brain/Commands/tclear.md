---
tags:
  - command
  - queue
aliases:
  - /tclear
---

# /tclear

Empty the queue, keep playing the current song.

```js
const count = queuedTracks(queue).length;
if (count < 1) → 'There are no queued songs to clear.'
queue.clear();
await interaction.reply(`Cleared ${count} queued song${count === 1 ? '' : 's'}.`);
```

## Counting first

The count is taken *before* clearing, so the confirmation can be specific: `Cleared 7 queued songs.` rather than `Queue cleared.`

That matters for a destructive command. If the number is bigger than expected, you know immediately that something got queued you did not know about — and the guessing is over before it starts.

## The distinction from /tstop

| | `/tclear` | `/tstop` |
| --- | --- | --- |
| Current song | Keeps playing | Stops |
| Queue | Emptied | Emptied |
| Artist mode | **Untouched** | Cleared |
| Voice channel | Stays | Leaves |

The artist mode row is the trap. `/tclear` with [[Artist Mode]] on empties the queue, which triggers `EmptyQueue`, which immediately refills it. The queue is cleared and instantly repopulated — technically correct, definitely surprising. Use [[tstopartist]] first.

Related: [[tstop]] · [[tremove]] · [[Guild Queue]] · [[Artist Mode]]
