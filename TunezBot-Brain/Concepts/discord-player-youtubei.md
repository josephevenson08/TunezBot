---
tags:
  - concept
  - dependency
---

# discord-player-youtubei

The community extractor that teaches [[discord-player]] how to handle YouTube, since v7 dropped official support. Currently on a `3.0.0-beta` release — that "beta" matters.

## What it is actually used for here

Less than it looks like. Registration overrides its stream function outright:

```js
await player.extractors.register(YoutubeExtractor, {
  createStream: createYoutubeStream,   // ← yt-dlp, not the extractor
});
```

And plain-text search was routed around it too → [[Search through yt-dlp not Innertube]].

So the extractor is left doing **track metadata and URL recognition**, while [[yt-dlp]] does the searching and the stream fetching. Two libraries, split by which one is more reliable at which job.

## Why it was routed around

Its search goes through [[Innertube Search]] — YouTube's own internal client API. That endpoint is far more aggressively bot-guarded than a plain video fetch, and it fails on datacenter IPs → [[Datacenter IP reputation]]. Full story: [[AWS hosting postmortem]].

## Registration is fatal on failure

```js
catch (error) { console.error(...); process.exit(1); }
```

Deliberate. A bot that logs in and appears online but cannot play anything is worse than one that visibly refuses to start — the failure has to be loud at boot, not discovered three commands later.

Related: [[discord-player]] · [[yt-dlp]] · [[Retry Wrapper]]
