---
tags:
  - command
  - playback
aliases:
  - /tpause
---

# /tpause

Pause playback.

```js
const paused = queue.node.pause();
await interaction.reply(paused ? 'Paused.' : 'Playback is already paused.');
```

## Reporting what happened, not what was asked

`queue.node.pause()` returns a boolean for whether it actually changed state. Using that return value instead of assuming success is a small pattern repeated across the bot — [[tresume]], [[tskip]] and [[tremove]] all do the same.

The difference is between "I sent the command" and "the command did something." Only the second is worth telling a person.

## The bot stays in voice

Pausing does not disconnect and does not start the [[Idle Timeout]] countdown — the queue has not ended, it is suspended. The bot will sit paused indefinitely. `leaveOnEmpty` still applies though: if everyone leaves the voice channel while paused, it disconnects and [[Per-Guild State]] is wiped.

Related: [[tresume]] · [[tstop]] · [[Voice Connection]]
