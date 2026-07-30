---
tags:
  - command
  - queue
aliases:
  - /tnowplaying
---

# /tnowplaying

The status dashboard. The one command that reports every active mode at once.

```
Now playing: **Daft Punk - One More Time** (requested by @joseph)
▬▬▬▬▬▬🔘▬▬▬▬▬▬▬ 1:24 / 3:47
Looping this track.
Artist mode: **Daft Punk**
3 songs queued next.
```

## Built by concatenation, not branching

Every line after the first is an empty string when it does not apply:

```js
const loopLine   = queue.repeatMode === QueueRepeatMode.TRACK ? '\nLooping this track.' : '';
const artistLine = artist ? `\nArtist mode: **${artist}**` : '';
const queueLine  = upcomingCount > 0 ? `\n${upcomingCount} song${upcomingCount === 1 ? '' : 's'} queued next.` : '';
```

Five optional pieces, one template literal, no branching. The `song`/`songs` pluralisation is the same one-liner used in [[tclear]] — small, but "1 songs queued next" is the kind of detail that makes something feel unfinished.

## Why it exists

State that is invisible gets forgotten. [[Artist Mode]] and [[tloop]] both silently change what happens when the current track ends, and neither is visible in Discord's UI. This is the one place to check *"why does it keep playing music?"* and get a real answer.

The [[Bot Activity Status]] line covers the track name and timestamp passively; this covers the modes.

Related: [[tqueue]] · [[thistory]] · [[Guild Queue]]
