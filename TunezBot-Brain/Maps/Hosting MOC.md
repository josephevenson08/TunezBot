---
tags:
  - map
  - hosting
---

# Hosting MOC

The question that has taken the most thinking on this project: *where does a process that must never stop actually live?*

## What the bot needs from a host

1. A process that stays alive indefinitely — [[Discord Gateway]] is a WebSocket, not a request/response API
2. Real child processes — [[ffmpeg]] and [[yt-dlp]] are binaries, not libraries
3. Outbound UDP for the [[Voice Connection]]
4. An IP address YouTube does not treat as a robot — [[Datacenter IP reputation]]

Requirement 4 is the one that is invisible until it bites.

## The route it took

| Stage | Host | Outcome |
| --- | --- | --- |
| 1 | Windows PC, terminal open | Works, but only while the terminal stays open → [[Local Windows run]] |
| 2 | Oracle Cloud Always Free | Planned, guide written, never deployed |
| 3 | AWS EC2 `t3.micro` | Deployed. Search failed intermittently → [[AWS hosting postmortem]] |
| 4 | Raspberry Pi 4 on home internet | Current plan → [[Raspberry Pi 4 build]] |

Stage 2 → 3 was a swap for name recognition, at the cost of the free tier being 12 months instead of forever. Stage 3 → 4 was forced by evidence.

## Current status

Parts arrived from pishop.us ([[Parts list]]), the Pi is assembled, the SD card is written, and it boots. Setup is paused at the SSH step because it needs to happen on home internet → [[Pi setup progress]].

## The separate, easier problem

The landing page is static HTML — no process, no sockets, no binaries. It goes on Cloudflare and costs nothing. That is not a contradiction of [[The bot cannot run on Cloudflare]]; it is the point of [[Landing page and bot are separate problems]].

Up: [[Home]]
