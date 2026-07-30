---
tags:
  - command
  - session
aliases:
  - /treplay
---

# /treplay

Play the previous track again.

```js
const previous = queue.history.previousTrack;
if (!previous) → 'There is no previous track to replay.'
await queue.history.previous(false);
```

## Uses the player's history, not the bot's

This is the **only** command that reads `queue.history` from [[discord-player]] rather than the bot's own [[Session History]]. The two are different on purpose:

- `queue.history` — an ordered playback stack. Knows what "previous" means.
- Session History — an unordered record of everything heard. Knows what "we played this already" means.

"Go back one" is a stack operation, so it uses the stack. [[trandom]], which wants the record, uses the record.

## The `false` argument

`previous(false)` — do not preserve the current track in the queue. Replaying replaces what is playing rather than queueing the old song behind it. The alternative reading ("finish this, then replay") is what [[tqueue]] is for.

## Deferred

Wrapped in `deferReply()` and try/catch, because seeking backwards can re-trigger stream extraction — a network call, with all the failure modes in [[Datacenter IP reputation]].

Related: [[trandom]] · [[thistory]] · [[Session History]]
