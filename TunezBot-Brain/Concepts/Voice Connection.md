---
tags:
  - concept
---

# Voice Connection

The UDP audio stream into a Discord voice channel, managed by `@discordjs/voice` underneath [[discord-player]]. Separate from the [[Discord Gateway]] — the Gateway carries commands, this carries sound.

## The voice gate

Every command that starts audio calls `ensureVoiceChannel()` first, which enforces two rules:

1. **You must be in a voice channel.** Otherwise there is nowhere to play.
2. **If the bot is already in a channel, it must be yours.** Otherwise someone in another channel could hijack playback for people they cannot hear.

Rule 2 is the interesting one. It is not a technical requirement — the bot *could* switch channels. It is a social one: whoever is currently listening should not have the music yanked away by someone who is not in the room.

Failures reply ephemerally: only the person who typed it sees "Join the same voice channel as the bot first."

## Session options

```js
{
  metadata: channel,          // the TEXT channel, for replies
  leaveOnEmpty: true,         // last human leaves → bot leaves
  leaveOnEnd: true,
  leaveOnEndCooldown: 300000, // → Idle Timeout
  leaveOnStop: true,
  selfDeaf: false,
  volume: 70,
}
```

`metadata` holding the *text* channel is a small trick worth noticing: it is how a `PlayerStart` event, which only receives a queue, knows where to post "Now playing." The queue carries its own reply address.

`selfDeaf: false` means the bot joins undeafened. Purely cosmetic — it presents as a participant rather than a lurker.

## The clean-up rule

On `Disconnect`, [[Per-Guild State]] for that server is wiped: [[Session History]], [[Artist Mode]] and the [[Bot Activity Status]] interval all go. Leaving voice ends the session; the next join starts fresh.

Related: [[Idle Timeout]] · [[Guild Queue]] · [[ffmpeg]]
