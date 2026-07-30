---
tags:
  - concept
---

# Idle Timeout

`leaveOnEndCooldown: 300000` — five minutes. When the queue finishes, the bot stays in the voice channel that long waiting for another song, then leaves on its own.

## Why five minutes

The number is a compromise between two annoyances:

- **Too short** (30s): the bot vanishes during the pause where someone is deciding what to play next. Rejoining resets [[Session History]], so `/trandom` and `/thistory` are empty afterwards. The session boundary lands in the middle of a conversation.
- **Too long** (an hour): the bot sits silently in an empty channel looking like it is doing something. On a shared voice channel that is genuinely confusing.

Five minutes covers "what should we play next" without covering "we're done."

## The other exits

| Option | Trigger |
| --- | --- |
| `leaveOnEmpty` | Last human leaves the channel |
| `leaveOnEnd` + cooldown | Queue finished, nothing added within 5 min |
| `leaveOnStop` | `/tstop` |

All three converge on `Disconnect`, which wipes [[Per-Guild State]] for that server. Leaving is a state boundary, not just a disconnect.

## Interaction with artist mode

[[Artist Mode]] effectively disables this — the queue never empties, so the countdown never starts. That is the intended behaviour and also the reason `/tstopartist` exists as a separate command: without it, the only way to stop an artist-mode session would be `/tstop`.

Related: [[Voice Connection]] · [[Guild Queue]] · [[tstop]]
