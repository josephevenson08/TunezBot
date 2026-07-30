---
tags:
  - decision
  - hosting
date: 2026-07
status: decided
---

# The bot cannot run on Cloudflare

**Question asked:** the landing page is hosted free on Cloudflare — why not the bot too?

**Answer:** no. Three independent blockers, any one of which is fatal.

## The blockers

**1. A persistent WebSocket.** [[Discord Gateway]] must stay open for the bot's entire life. Workers and Pages are request-response: code runs when a request arrives and stops when it is answered. There is no request to attach a permanently open socket to.

**2. Child processes.** [[ffmpeg]] and [[yt-dlp]] are real binaries spawned as OS processes. Workers run in a V8 isolate — no process spawning, no filesystem, no shell. This is not a limits issue; the capability does not exist.

**3. Live UDP audio.** The [[Voice Connection]] is a continuous outbound UDP stream. Workers do not offer raw UDP.

## The near-miss

**Cloudflare Containers** *can* run genuinely persistent processes — so the technical objections mostly dissolve there. It still does not fit:

The platform is built around **scaling workloads across regions on demand**. TunezBot needs the opposite: exactly one instance, alive forever, in one place. Two instances of a Discord bot means duplicated commands and two bots fighting over one voice channel. Using a scale-out platform to run a singleton means paying for and configuring around the exact feature that makes it useless here.

Trading a free Pi for a more complex, likely paid setup with no upside.

## The general shape

**Persistent-connection workloads and serverless platforms are a category mismatch, not a configuration problem.** No amount of tuning bridges it. The question to ask is not "can this platform run Node?" but "does this platform let a process stay alive with a socket open?"

Related: [[Landing page and bot are separate problems]] · [[Pi over cloud VM]] · [[Hosting MOC]]
