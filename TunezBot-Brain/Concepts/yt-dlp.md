---
tags:
  - concept
  - dependency
aliases:
  - youtube-dl-exec
---

# yt-dlp

The workhorse. Reached through the `youtube-dl-exec` npm wrapper, which shells out to a real `yt-dlp` binary as a child process. Does **two** jobs here.

## Job 1 — get a stream URL

```js
const output = await youtubeDl(track.url, {
  getUrl: true,
  format: track.live ? 'best[height<=360]' : 'bestaudio',
  noWarnings: true,
  noProgress: true,
});
return String(output).trim().split(/\r?\n/)[0];
```

`getUrl` returns a direct media URL without downloading anything. `bestaudio` skips the video stream entirely — no reason to pull video data that gets discarded. Live streams are the exception: they get a capped-height video format because a pure audio track is not always offered.

The trailing `.split(/\r?\n/)[0]` handles yt-dlp occasionally returning more than one line, and the `\r?\n` handles Windows line endings — this runs on Windows now and Linux on the [[Raspberry Pi 4 build]] later.

## Job 2 — search

```js
await youtubeDl(`ytsearch${count}:${query}`, { dumpSingleJson: true, flatPlaylist: true });
```

`ytsearch8:daft punk` returns 8 results as JSON. `flatPlaylist` skips fetching full metadata for each hit — only the video IDs are needed to build URLs. This was added to replace [[Innertube Search]] → [[Search through yt-dlp not Innertube]].

Used by [[Query Normalization]], [[Artist Mode]] and [[trelated]].

## Why it is a child process and not a library

Because `yt-dlp` is a Python program. That is not a stylistic detail — spawning binaries is exactly what serverless platforms will not let you do → [[The bot cannot run on Cloudflare]]. It is also why the [[Raspberry Pi 4 build]] needs a real OS underneath.

## Maintenance reality

yt-dlp breaks when YouTube changes its site, and gets fixed fast — usually within days. `npm update` is the whole fix. This is a dependency that must be kept current, not pinned and forgotten.

Related: [[ffmpeg]] · [[Datacenter IP reputation]] · [[Retry Wrapper]]
