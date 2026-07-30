---
tags:
  - concept
---

# Innertube Search

YouTube's internal client API — the one the actual YouTube app and website talk to. `youtubei.js` wraps it, and [[discord-player-youtubei]] uses it for search and metadata.

## Why it is a separate failure surface

Fetching a video and searching for a video are **different endpoints with different levels of bot protection**. That distinction is the entire finding of [[AWS hosting postmortem]]:

- Direct video URL → yt-dlp → worked, 3 for 3, from a flagged AWS IP
- Plain-text search → Innertube → failed repeatedly from the same IP, same moment

The IP was not blanket-blocked. Only the search path was. Innertube is the more heavily guarded surface, and datacenter ranges are exactly what it is guarding against → [[Datacenter IP reputation]].

## The generalisable lesson

"YouTube is blocking me" was the wrong diagnosis and would have led to the wrong fix (proxies, rotating IPs, backing off). The right diagnosis was "one of the two YouTube code paths I use is blocked" — and that was only findable by testing the paths *separately*.

When something intermittent fails, split it into its independent network calls and test each one alone. The failure almost never lives where the error message points.

Related: [[yt-dlp]] · [[Search through yt-dlp not Innertube]] · [[Retry Wrapper]]
