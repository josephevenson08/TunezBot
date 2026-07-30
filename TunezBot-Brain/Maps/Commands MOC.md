---
tags:
  - map
---

# Commands MOC

17 slash commands, all prefixed `t` so they never collide with another bot in the same server. Defined in `deploy-commands.js`, handled in the [[Interaction Router]].

## Playback

| Command | Does |
| --- | --- |
| [[tplay]] | Play now, keep the queue |
| [[tpause]] | Pause |
| [[tresume]] | Resume |
| [[tskip]] | Next track |
| [[tstop]] | Stop everything, clear the queue, leave |
| [[tloop]] | Loop the current track |
| [[tstoploop]] | Stop looping |

## Queue

| Command | Does |
| --- | --- |
| [[tqueue]] | With text: add to the end. Without: show the queue |
| [[tremove]] | Remove one queued track by position |
| [[tclear]] | Empty the queue, keep playing the current track |
| [[tnowplaying]] | Current track, progress bar, requester, active modes |

## Discovery

| Command | Does |
| --- | --- |
| [[tartist]] | Artist mode on — never runs out of songs by one artist |
| [[tstopartist]] | Artist mode off |
| [[trelated]] | Queue something stylistically near what is playing |

## Session

| Command | Does |
| --- | --- |
| [[thistory]] | Last 15 tracks this session |
| [[treplay]] | Replay the previous track |
| [[trandom]] | Random pick from this session's history |

## Patterns shared by all of them

- **Voice gate.** Anything that starts audio calls `ensureVoiceChannel()` first — you must be in voice, and if the bot is already in a channel, it must be *your* channel.
- **Defer then follow up.** Anything that hits the network replies `deferReply()` first, because Discord kills an interaction that goes unanswered for 3 seconds and a YouTube lookup regularly takes longer.
- **Ephemeral for scolding.** "Join a voice channel first" is only shown to the person who typed it. Actual results are public.
- **Guard order matters.** The router checks `tplay` / `tartist` / `tstopartist` *before* fetching the queue, because those three are the only ones that make sense with nothing playing.
- **Failure is a message, not a crash.** Every network path is wrapped in try/catch that logs to console and tells the channel what went wrong.

Related: [[Retry Wrapper]] · [[Query Normalization]] · [[Slash Command Registration]]

Up: [[Home]]
