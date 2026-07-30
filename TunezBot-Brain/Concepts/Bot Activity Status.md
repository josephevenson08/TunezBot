---
tags:
  - concept
---

# Bot Activity Status

The "Listening to **Song Name 1:24 / 3:47**" line under the bot's name in the Discord member list. Updated every 3 seconds while something plays.

## How it runs

```js
updateBotActivity(queue);                    // immediately, on PlayerStart
clearInterval(activityIntervals.get(guildId));
activityIntervals.set(guildId, setInterval(() => updateBotActivity(queue), 3000));
```

The immediate call before the interval is deliberate — without it, a new track shows the *previous* track's name for up to 3 seconds. Small detail, very visible.

`clearInterval` before setting a new one is the bug-prevention half: skipping tracks quickly would otherwise stack intervals, each writing a different track name to the same presence, several times a second.

## Where the numbers come from

`queue.node.getTimestamp()` gives pre-formatted `current` and `total` labels. `formatDuration()` exists purely as a fallback for when it does not — it converts milliseconds to `m:ss` and returns `0:00` for anything non-finite or negative, so a weird duration produces an ugly label instead of `NaN:NaN`.

## Why 3 seconds

Fast enough that the counter reads as live; slow enough to stay far from Discord's presence rate limits. 1 second would look better and risk throttling; 10 would look broken.

## Clean-up

Cleared on `EmptyQueue` and on `Disconnect`, with presence reset to plain "online." An orphaned interval is not just a leak — it is an interval holding a reference to a dead queue, writing a stale song title forever.

Related: [[Per-Guild State]] · [[Voice Connection]] · [[tnowplaying]]
