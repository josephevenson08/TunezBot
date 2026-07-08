# AWS Hosting Attempt — Postmortem

**Date:** July 2026
**Outcome:** Reverted in favor of Raspberry Pi hosting on a home network.

## Summary

TunezBot was deployed to an AWS EC2 instance to get 24/7 uptime without depending on a home PC staying on. The instance itself worked fine — Node, PM2, the Discord connection, all of it. What didn't work reliably was the bot's core feature: resolving a plain-text song request into a playable YouTube stream. This document walks through how that was diagnosed, what was tried, and why the conclusion was to host from a residential IP instead of a cloud VM.

## Goal

Run TunezBot continuously without keeping a Windows PC and terminal open. The initial ask was "is a VM better than a Raspberry Pi for this?" — the reasoning at the time favored a cloud VM for uptime independent of home power/internet, and AWS's EC2 free tier was chosen as the concrete target.

## What Was Set Up

- EC2 `t3.micro`, Ubuntu Server 24.04 LTS, free-tier eligible, `us-east-1`.
- Node.js via `nvm`, `ffmpeg` via `apt`, bot cloned directly from GitHub.
- `.env` configured with real Discord credentials.
- Plan was to run the bot under PM2 for auto-restart and boot persistence, same as the original Raspberry Pi plan.

This all worked exactly as expected. The bot logged in, registered slash commands, and connected to voice with no issues.

## The Problem

The first real test, `/tplay never gonna give you up`, failed:

```
NoResultError: Could not extract stream for this track
    at #throw (.../discord-player/dist/index.js:4034:69)
    at _GuildQueuePlayerNode.play (.../discord-player/dist/index.js:3888:102)
    ...
  code: 'ERR_NO_RESULT'
```

Discord showed: `Track error: Could not extract stream for this track` / `Queue finished.`

## Investigation

1. **Isolated yt-dlp from the extractor.** Ran the bot's `createYoutubeStream` logic directly against a known video URL on the VM:
   ```bash
   node -e "require('youtube-dl-exec')('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {getUrl:true, format:'bestaudio', ...})"
   ```
   This succeeded and returned a valid `googlevideo.com` stream URL. So yt-dlp itself worked fine from this IP — the failure wasn't a blanket network block.

2. **Isolated search from playback.** Tested `/tplay` with a direct YouTube URL instead of search text. The direct URL played correctly. This pointed at the *search* step specifically, not stream extraction.

3. **Traced the search path.** `discord-player-youtubei`'s `YoutubeExtractor` resolves plain-text queries via `youtubei.js`'s Innertube API (YouTube's internal client API), a separate code path from the yt-dlp-based stream fetch. Innertube's search/metadata endpoints are a more heavily bot-detection-guarded surface than a raw video download — and AWS, GCP, Azure, and DigitalOcean IP ranges are widely documented as being flagged by that system (YouTube's 2025-2026 "PoToken" bot-detection rollout specifically targets datacenter IPs).

4. **Ruled out stale dependencies.** Checked whether either library was out of date:
   - `discord-player-youtubei` was already on `3.0.0-beta.4`, ahead of its own `latest` npm tag — no update available.
   - The bundled `yt-dlp` binary (`2026.07.04`) matched the actual latest upstream release.

## First Fix: Reroute Search Through yt-dlp

Since yt-dlp's own extraction worked from this IP even though Innertube search didn't, `/tplay`, `/tqueue`, `/tartist`, and `/trelated` were changed to resolve plain-text queries to a real YouTube URL via yt-dlp's `ytsearch` before ever calling `player.play()`, instead of relying on the extractor's built-in search. Verified in isolation (bypassing a local Windows shell-quoting quirk) that this correctly resolved to the right video.

Deployed to the VM. Search queries began at least partially working, but failures kept recurring — sometimes for a search that had just worked, sometimes for a new one. A retry-once-after-a-short-delay wrapper was added around all five `player.play()` call sites to absorb transient failures. This helped somewhat but didn't fix it.

## What The Data Actually Showed

Across repeated testing:
- **Direct YouTube URL via `/tplay`:** succeeded 3 out of 3 attempts, including immediately after search-based failures.
- **Plain-text search via `/tplay` (post-fix, with retry):** failed on multiple different songs, including one (`ERR_NO_RESULT` on both the initial attempt and the retry) for a query that yt-dlp had *just* resolved correctly to a valid URL moments earlier.

The consistent difference wasn't which video got picked — it was that the search path makes one extra automated request to YouTube (the yt-dlp search call) immediately before the metadata and stream requests. That was apparently enough to trip something the two-request direct-URL path didn't. This is a request-volume/IP-reputation problem, not a logic bug — no further code change was going to reliably fix it.

## Decision

Since typing a search phrase (not pasting a raw URL) is how the bot is actually meant to be used day-to-day, and the instability traced back to AWS's IP range rather than anything fixable in the code, the decision was to move hosting to a Raspberry Pi on a home network. Residential ISP IPs are not subject to the same datacenter-range bot-detection, which removes the problem at its source instead of working around it.

Options considered and set aside:
- **Residential proxy for yt-dlp traffic** — would likely fix it, but adds recurring cost and complexity for a single-server personal bot.
- **Rebuilding track metadata from yt-dlp's search JSON** to cut out the extractor's separate Innertube metadata call — plausible partial improvement, but adds real complexity for an uncertain payoff given the root cause is IP reputation, not request count alone.

## What Was Kept vs. Reverted

- **Kept:** the yt-dlp-based search resolution and the retry wrapper in `index.js`. Neither is AWS-specific — both replace a fragile, beta-quality search dependency with a more mature one, which should hold up at least as well (likely better) on a residential IP.
- **Reverted:** AWS as the hosting target. The EC2 instance was terminated. `AWS_SETUP.md` was removed and replaced with `RASPBERRY_PI_SETUP.md`.

## Status

Raspberry Pi hardware has not been purchased yet. `RASPBERRY_PI_SETUP.md` is written and ready for when it is.
