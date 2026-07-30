---
tags:
  - concept
  - dependency
---

# discord-player

`discord-player` v7 — the playback engine. It owns the [[Guild Queue]], the voice connection lifecycle, the progress timestamps, and the event stream the bot reacts to.

## What it handles so the bot does not have to

- Joining and leaving voice channels
- Queue ordering, skipping, looping (`QueueRepeatMode`)
- Track history (`queue.history.previous()` — used by [[treplay]])
- Progress bars and timestamps → [[Bot Activity Status]]
- Idle disconnection via `leaveOnEndCooldown` → [[Idle Timeout]]

## The events the bot listens to

| Event | Bot's reaction |
| --- | --- |
| `PlayerStart` | Announce the track, push to [[Session History]], start the activity interval |
| `AudioTracksAdd` | Report how many tracks a playlist added |
| `EmptyQueue` | Try [[Artist Mode]]; otherwise announce and clear the interval |
| `Error` / `PlayerError` | Log to console, report to the channel, do not crash |
| `Disconnect` | Wipe all per-guild state for that server |

`Disconnect` is the important one for correctness: it is what makes a voice session a real boundary rather than state accumulating forever → [[Per-Guild State]].

## The v7 catch

**v7 removed official YouTube support.** That is not a footnote — it is why [[discord-player-youtubei]] exists in the dependency list at all, and it is the root of the entire fragility chain documented in [[AWS hosting postmortem]]. The engine is stable; the YouTube path bolted onto it is where things break.

Related: [[Voice Connection]] · [[ffmpeg]] · [[Architecture MOC]]
