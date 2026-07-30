---
tags:
  - command
  - playback
aliases:
  - /tstop
---

# /tstop

Full stop. The one command that ends everything.

```js
artistModes.delete(interaction.guildId);
queue.delete();
await interaction.reply('Stopped playback and cleared the queue.');
```

## Order matters

[[Artist Mode]] is cleared **before** the queue is deleted. Reversed, `queue.delete()` could fire `EmptyQueue` while artist mode was still set — and the handler would dutifully start fetching another song for a queue that is being destroyed. Best case a wasted network call, worst case a track starting playback in a deleted session.

Two lines, and the order between them is load-bearing.

## The cascade

`queue.delete()` triggers `leaveOnStop`, which disconnects, which fires `Disconnect`, which wipes the rest of [[Per-Guild State]]: [[Session History]] gone, [[Bot Activity Status]] interval cleared, presence reset.

So the three-line command actually resets six things. One explicit deletion plus a chain of event handlers doing their own clean-up — which is why the `Disconnect` handler exists in the first place, rather than every command cleaning up after itself.

## Reach for /tclear instead

Most of the time "stop" means "clear what is queued," not "leave and forget the session." [[tclear]] keeps the bot in voice and keeps history alive for [[trandom]] and [[thistory]].

Related: [[tclear]] · [[Idle Timeout]] · [[Voice Connection]]
