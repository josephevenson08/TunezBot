---
tags:
  - command
  - discovery
aliases:
  - /tstopartist
---

# /tstopartist

Turn [[Artist Mode]] off. Three lines, and one of the more considered commands in the bot.

```js
artistModes.delete(interaction.guildId);
await interaction.reply('Artist mode stopped.');
```

## Handled before the queue guard

It sits in the **first tier** of the [[Interaction Router]] — alongside [[tplay]] and [[tartist]], before `if (!queue || queue.deleted)`.

That is deliberate. Artist mode is stored in [[Per-Guild State]], *not* in the queue. If this command sat behind the queue guard, then after playback ended you would get "Nothing is playing right now" — while artist mode stayed on, waiting to ambush the next session. The mode outlives the queue, so the command that clears it must too.

## Safe to run twice

`Map.delete()` on a missing key is a no-op. No check, no error message, same reasoning as [[tstoploop]]: undo commands should never punish you for being unsure.

## Current playback is untouched

Stopping the mode does not stop the music. The current song finishes, the queue drains, and then [[Idle Timeout]] takes over normally. To stop *now*, that is [[tstop]].

Related: [[tartist]] · [[Interaction Router]] · [[Per-Guild State]]
