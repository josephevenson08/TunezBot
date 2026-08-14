---
tags:
  - concept
  - dependency
aliases:
  - youtube-dl-exec
---

# yt-dlp

The workhorse. Reached through the `youtube-dl-exec` npm wrapper, which shells out to a real `yt-dlp` binary as a child process. Does **two** jobs here.

> **Rewritten 2026-08-14.** Job 1 below describes the *old* design — asking for a URL and handing it to [[ffmpeg]]. That was the cause of the silent-playback bug: ffmpeg fetching the URL is a **separate request that does not inherit yt-dlp's session**, and YouTube answers it 403. The bot now pipes audio out of yt-dlp instead. See *Piping* below.

## Job 1 — get a stream URL *(superseded)*

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

The trailing `.split(/\r?\n/)[0]` handles yt-dlp occasionally returning more than one line, and the `\r?\n` handles Windows line endings — this runs on Windows and on Linux on the [[Raspberry Pi 4 build]].

### `jsRuntimes: 'node'` — the option that makes the URL usable

**YouTube guards playback URLs with a JavaScript challenge.** yt-dlp needs a real JS engine to solve it, and only enables `deno` by default. Without one it falls back to a client (`ANDROID_VR`) whose URLs are bound to yt-dlp's own request headers — so [[ffmpeg]] fetching that same URL gets a **403**, produces zero bytes, and [[discord-player]] reads the empty stream as a finished track.

Symptom: the bot announces the song, then `Queue finished.` immediately. Silence, and nothing logged anywhere.

Since Node is already running the bot, pointing yt-dlp at it costs nothing. Confirmed at the command line: `--get-url` then ffmpeg = 403; `--js-runtimes node --get-url` then ffmpeg = decodes fine.

**`noWarnings: true` hid this for hours.** yt-dlp prints *"No supported JavaScript runtime could be found"* on every call, and this function explicitly suppresses warnings. The message explaining the failure was being silenced by an option added to keep the output tidy. → [[2026-08-14 Site vault and Pi deployment]]

## Piping — the current design

```js
youtubeDl.exec(track.url, {
  output: '-',              // audio to stdout
  format: 'bestaudio',
  jsRuntimes: 'node',       // load-bearing, see below
  noCacheDir: true,
  noProgress: true,
});
```

yt-dlp writes audio to stdout, [[ffmpeg]] reads bytes off a pipe, and **ffmpeg never contacts YouTube at all**. That removes four problems at once: the 403 handoff, URL expiry, IP binding, and the 5–9 second stall (resolving blocked before anything could start; spawning a pipe takes 11ms).

Three tests that settled it, same video, same minute:

| | Result |
| --- | --- |
| yt-dlp downloads it itself | 3,433,755 bytes |
| `--get-url` then ffmpeg | **403 Forbidden** |
| `-o -` piped | 3,433,755 bytes |

### `jsRuntimes: 'node'` is required

YouTube guards playback with a JavaScript challenge; yt-dlp needs a JS engine to solve it and only enables `deno` by default. Node is already running the bot, so it costs nothing. Without it: `without flag: FAILED / with flag: OK`.

I once concluded this flag was inert, from a test that compared a value identical either way. It wasn't. → [[Open questions]]

### One yt-dlp at a time

Piping made yt-dlp long-lived — it stays connected for the whole song instead of five seconds. And **YouTube refuses two simultaneous media fetches from one address**, taking down both:

| | Result |
| --- | --- |
| One fetch alone | 4,000,874 bytes |
| Two started together | 0 and 0 |

So every new track collided with the previous song's still-running process. The fix is killing it first — this bot plays one thing at a time, so a surviving process belongs to the song we just left. A retry sits behind that as a genuine safety net.

**The tell was that the retry fired on *every* track, not occasionally.** A safety net catching everything means everything is falling.

Related: [[ffmpeg]] · [[2026-08-14 Site vault and Pi deployment]]

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
