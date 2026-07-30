---
tags:
  - concept
aliases:
  - the bot
---

# TunezBot

A personal Discord music bot for one server. Node 18+, CommonJS, no build step, no database, no framework beyond `discord.js`.

## What it is for

Playing music in a voice call with friends without paying for a bot, without a web dashboard, and without a queue full of other people's servers. Scope is deliberately one server — see [[State stays in memory]] and [[Guild-scoped command deploy]] for how that scope simplified two separate decisions.

## Shape of the thing

- **~800 lines** in `index.js`, one file, one process
- **17 commands**, all `t`-prefixed → [[Commands MOC]]
- **8 dependencies**, of which the interesting ones are [[discord-player]], [[discord-player-youtubei]], [[yt-dlp]] and [[ffmpeg]]
- **Two entry points**: `npm run deploy` ([[Slash Command Registration]]) and `npm start`

## Defaults chosen and why

| Setting | Value | Reason |
| --- | --- | --- |
| `volume` | 70 | 100 clips on most tracks |
| `selfDeaf` | `false` | The bot joins undeafened — it looks less like a lurker |
| `leaveOnEndCooldown` | 300000 ms | Five minutes to decide on a next song → [[Idle Timeout]] |
| Activity refresh | 3000 ms | Fast enough to look live, slow enough not to hammer the API → [[Bot Activity Status]] |
| History cap | 50 tracks | Bounded memory → [[Session History]] |

## The honest limitation

Anyone in the server who can use slash commands can control it while it is online. There is no permission model. For a private server with friends, that is a feature; for anything larger, it would be the first thing to fix.

Related: [[Architecture MOC]] · [[Home]] · [[Repo map]]
