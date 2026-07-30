---
tags:
  - map
---

# Home

**TunezBot** is a personal Discord music bot for one server. It takes a YouTube link or a search phrase and streams the audio into a voice channel. One Node process, no database, everything in memory.

> New here? Read [[Start Here]] first.

## The five ways in

| Map | What it answers |
| --- | --- |
| [[Architecture MOC]] | What are the moving parts, and how does audio actually get from YouTube into a voice channel? |
| [[Commands MOC]] | All 17 slash commands, grouped by what they are for |
| [[Decisions MOC]] | Why is it built this way and not some other way? |
| [[Hosting MOC]] | Where does it run, and why did that change twice? |
| [[Timeline MOC]] | What happened when |

## The one-paragraph version

[[TunezBot]] logs into Discord over a persistent [[Discord Gateway]] WebSocket. Slash commands are registered ahead of time by `deploy-commands.js` (see [[Slash Command Registration]]) and arrive at the [[Interaction Router]] in `index.js`. Playback is handled by [[discord-player]], with [[discord-player-youtubei]] as the YouTube extractor — but the actual stream URL and *all* searching go through [[yt-dlp]] instead of the extractor's built-in [[Innertube Search]], because that path gets blocked on cloud IPs (see [[Datacenter IP reputation]]). Audio is transcoded by [[ffmpeg]] and pushed over a [[Voice Connection]]. Per-server state — the [[Guild Queue]], [[Session History]], [[Artist Mode]] — lives in [[Per-Guild State]] maps that vanish on restart.

## The three things worth knowing

1. **The whole project is one process holding one WebSocket open.** That single fact drives every hosting decision in [[Hosting MOC]], including [[The bot cannot run on Cloudflare]].
2. **Search is the fragile part, not playback.** [[AWS hosting postmortem]] is the story of finding that out the expensive way.
3. **Nothing is persisted.** Restart the bot and the queue, history and artist mode are gone. That is a deliberate call — see [[State stays in memory]].

## Currently

- Pi hardware is assembled and boots; setup paused at the SSH step. → [[Pi setup progress]]
- Landing page rebuilt from scratch. → [[2026-07-30 Landing page and vault]]
- Comment revision pass through `index.js` is in progress. → [[2026-07-29 Comment pass]]
- Open threads live in [[Open questions]].
