---
tags:
  - map
---

# Architecture MOC

How a typed message becomes sound in a voice channel.

## The signal chain

```
you type /tplay in Discord
        ↓
Discord Gateway  (persistent WebSocket)
        ↓
Interaction Router  (index.js, one big if-chain)
        ↓
Query Normalization  →  yt-dlp search  →  a real YouTube URL
        ↓
discord-player  →  discord-player-youtubei  →  yt-dlp stream URL
        ↓
ffmpeg  (transcode to Opus)
        ↓
Voice Connection  (UDP)
        ↓
sound
```

Every box is a note: [[Discord Gateway]] → [[Interaction Router]] → [[Query Normalization]] → [[yt-dlp]] → [[discord-player]] → [[discord-player-youtubei]] → [[ffmpeg]] → [[Voice Connection]].

## The two files

| File | Runs when | Does |
| --- | --- | --- |
| `deploy-commands.js` | `npm run deploy`, only when commands change | Tells Discord the 17 commands exist → [[Slash Command Registration]] |
| `index.js` | `npm start`, stays running forever | Everything else |

They share nothing but `.env` ([[Environment Secrets]]). See [[Repo map]].

## State

All of it is in memory, keyed by guild ID: [[Per-Guild State]].

- [[Guild Queue]] — what is playing and what is next (owned by discord-player)
- [[Session History]] — last 50 tracks, capped, feeds `/trandom` and `/thistory`
- [[Artist Mode]] — a single artist name per server, refills the queue forever
- [[Bot Activity Status]] — a 3-second interval per server updating the bot's "Listening to…" line

Restart wipes all four. That is on purpose → [[State stays in memory]].

## The safety nets

- [[Retry Wrapper]] — every `player.play()` gets one retry after 1.5s
- [[Idle Timeout]] — 5 minutes of nothing and the bot leaves voice on its own
- Guarded voice checks — you must be in the same channel as the bot before most commands do anything
- Errors reply in the channel *and* log to console instead of crashing the process

## What the architecture is bad at

- One process = one point of failure. No supervisor, no restart-on-crash yet → [[Open questions]]
- No persistence, so a crash mid-session is indistinguishable from a fresh boot
- Search depends on YouTube not changing its mind → [[Datacenter IP reputation]]

Up: [[Home]]
