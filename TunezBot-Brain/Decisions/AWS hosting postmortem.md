---
tags:
  - decision
  - hosting
  - log
date: 2026-07
status: reverted
---

# AWS hosting postmortem

The most instructive failure on this project. Everything worked except the one thing the bot is for.

## The setup

EC2 `t3.micro`, Ubuntu 24.04, free-tier eligible. Node via `nvm`, [[ffmpeg]] via `apt`, repo cloned from GitHub. Login, [[Slash Command Registration]], [[Voice Connection]] — all fine, first try, no surprises.

## The failure

First real test:

```
/tplay never gonna give you up
→ NoResultError: Could not extract stream for this track
  code: 'ERR_NO_RESULT'
```

## The investigation

1. **Ran the yt-dlp stream logic directly against a known video URL on the VM.** Worked, returned a valid stream URL. → *The IP is not blanket-blocked.*
2. **Tested `/tplay` with a direct YouTube URL instead of search text.** Worked. → *The failure is in the search step specifically.*
3. **Traced the search path.** [[discord-player-youtubei]]'s built-in search goes through [[Innertube Search]] — a different code path from the yt-dlp stream fetch, and a far more bot-guarded endpoint. AWS/GCP/Azure/DigitalOcean ranges are widely documented as flagged by it.
4. **Ruled out stale dependencies.** Both the extractor and the bundled yt-dlp binary were already current.

Step 2 is the one that mattered. Testing the two paths *separately* is what turned "YouTube is blocking me" into "one of my two YouTube code paths is blocked."

## The fixes attempted

**Fix 1** — reroute all plain-text search through yt-dlp's own `ytsearch` instead of Innertube, since yt-dlp extraction was proven to work from this IP. Resolved URLs verified correct. Result: searches sometimes worked, failures kept recurring inconsistently.

**Fix 2** — a retry-once-after-a-short-delay wrapper around every `player.play()` call, to absorb transient failures.

## What the data showed after both fixes

- **Direct URL via `/tplay`: 3 for 3**, including immediately after search-based failures
- **Plain-text search via `/tplay`, with retry: failed on multiple different songs** — including one that failed on *both* the initial attempt and the retry, for a URL yt-dlp had resolved correctly moments earlier

The consistent difference was never *which* video got picked. It was that the search path fires **one extra automated request** at YouTube immediately before the metadata and stream requests. Two requests succeeded; three did not.

That is a request-volume and IP-reputation problem. No further code change was going to fix it.

## The decision

Typing a search phrase — not pasting a URL — is how this bot is actually used. A bot that only works when you already have the link is not the bot. Hosting moved to a Raspberry Pi on a residential connection → [[Pi over cloud VM]].

## Kept vs reverted

**Kept**, because neither is AWS-specific and both are genuine improvements:
- [[Search through yt-dlp not Innertube]] — replaced a beta-quality search dependency with a mature one
- [[Retry once after a short delay]] — network calls fail occasionally everywhere

**Reverted:** EC2 instance terminated, `AWS_SETUP.md` deleted, `RASPBERRY_PI_SETUP.md` restored — with a note explaining *why* Pi over cloud, so the question does not get relitigated from zero later.

## The lesson worth keeping

Two of the three changes made under pressure survived the rollback. When an experiment fails, sort the changes into "scaffolding for the experiment" and "real improvement I only found because of the experiment." Throwing out both is the easy mistake.

Related: [[Datacenter IP reputation]] · [[Innertube Search]] · [[Retry Wrapper]] · [[Hosting MOC]]
