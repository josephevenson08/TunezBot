---
tags:
  - log
  - hosting
date: 2026-08-14
---

# 2026-08-14 — Site, vault, and the Pi finally hosting the bot

The longest working day on this project, and the one that closed the hosting question for good.

## Morning: vault, then site

Deliberate ordering. The site is a *presentation* of the project's thinking, and it is much easier to present thinking that has already been laid out. Building this vault first meant the site's copy came out of real notes instead of being invented at write-time.

Site details in [[Landing page and bot are separate problems]].

While reading `index.js` to write these notes, found the `unknownRejection` bug. It cost the afternoon → [[Open questions]].

## Afternoon: the Pi

Back on home internet, so the SSH step that blocked [[Pi setup progress]] on 2026-07-27 finally worked. Steps 12–18 are written up in `RASPBERRY_PI_SETUP.md`.

### The headline: the AWS theory is now measured, not argued

The question the whole hosting detour was about: **does plain-text search work from a residential IP?**

Ran the bot's own `searchYoutube` path from the Pi against four different queries. **Four for four, first try, no retries.** On EC2 the same path failed repeatedly on different songs, including one that failed on both the attempt and the retry → [[AWS hosting postmortem]].

[[Datacenter IP reputation]] used to end on a well-reasoned theory. It now ends on evidence.

### Four failures between "logged in" and "I can hear it"

Each one hid the next. The recurring feeling was being one fix away while actually being four.

| # | Failure | Fix |
| --- | --- | --- |
| 1 | npm 11 blocks install scripts by default, so the yt-dlp and ffmpeg binaries never downloaded | `npm approve-scripts` per package; approvals now committed in `package.json` |
| 2 | No Opus encoder anywhere in the dependency list | `opusscript` — the native one won't build on ARM64 + Node 24 |
| 3 | `ffmpeg-static` can't resolve hostnames — static glibc can't use NSS | `FFMPEG_PATH=/usr/bin/ffmpeg` |
| 4 | YouTube's JS challenge; yt-dlp fell back to a client whose URLs only work for its own headers | `jsRuntimes: 'node'` in [[yt-dlp]] |

Failure 2 is the interesting one for the project rather than the platform: **`package.json` never listed an Opus library at all.** [[Voice Connection]] cannot encode audio without one. It worked on Windows, so it stayed invisible until a genuinely clean machine. Anyone who had cloned this repo got a bot that resolved tracks and played silence.

### The thing worth actually remembering

**Failures 2, 3 and 4 presented identically:** the bot announced the track, then `Queue finished.` immediately — silence, and *nothing in the terminal*. Three unrelated causes, one symptom, no error message.

The reason there was no error: ffmpeg failed outside the bot's error paths. The stream produced zero bytes, and from [[discord-player]]'s view an empty stream is indistinguishable from a track that finished. `PlayerStart` → `EmptyQueue`, silently.

**What broke the deadlock was running the pipeline by hand, outside the bot.** Resolve a URL with yt-dlp, hand it to ffmpeg, read what ffmpeg says. The bot swallowed the error; the command line printed it in one line.

That is the generalisable move: when a pipeline fails silently, stop debugging the pipeline and run its stages individually. Same technique that isolated the AWS failure a month earlier, where testing search and direct-URL playback *separately* was what turned "YouTube is blocking me" into "one of my two code paths is blocked."

### `noWarnings: true` cost more than it saved

yt-dlp had been printing *"No supported JavaScript runtime could be found… extraction without a JS runtime has been deprecated"* on **every single call**. `createYoutubeStream` was explicitly telling it not to show that.

The message explaining failure 4 was suppressed by an option added to keep output tidy. It only surfaced from running yt-dlp manually. Quiet output is not free.

### The `unknownRejection` bug, confirmed the hard way

First live `/tplay` arrived expired — Discord allows 3 seconds to acknowledge a command, and it was typed before the bot finished logging in. `deferReply` rejected, and because the handler was registered under an event name Node never emits, the rejection escalated to an uncaught exception and the process exited. **One mistyped command took the entire bot offline.**

Fixing the event name was not sufficient. A rejected promise from an async event listener does not reliably reach `unhandledRejection` anyway — discord.js routes it through the client's `error` event, which had no listener.

So the router became a named function with `.catch()` attached at registration: catch the error where it happens rather than guessing which global handler it lands in. → [[Interaction Router]]

### systemd is the difference between running and hosted

`Restart=always` plus `enable` means crash, power cut and reboot all recover with nobody logged in. Three lines in the unit are load-bearing, `WorkingDirectory` most of all — without it systemd starts in `/`, `dotenv` finds no `.env`, and the bot cannot log in.

## Where this leaves the project

It works. On hardware in this house. With no terminal open anywhere. → [[Raspberry Pi 4 build]]

## Evening: from "hosted" to actually usable

The section above was written while the bot was working. It stopped again half an hour later. Everything below is the second half of the same day.

### The DNS fault that caused most of it

Every uncached hostname lookup took **exactly 5.029 seconds** — the glibc resolver timeout. Each query is fast alone; only together do they stall:

| Query | Time |
| --- | --- |
| IPv4 alone | 0.063s |
| IPv6 alone | 0.022s |
| Both together | **5.029s** |

glibc sends A and AAAA in parallel on one socket and this router mishandles it. Discord allows 3 seconds to acknowledge a command, so `deferReply` was dead before its request left the Pi — every `10062 Unknown interaction`. Voice endpoints paid it too, which is where the `AbortError`s came from.

Fixed with `single-request-reopen` via NetworkManager: 5.029s → 0.041s.

**The transferable bit:** "works, then doesn't, then does" on a home network is very often DNS, and `getent ahosts` versus `ahostsv4`/`ahostsv6` catches it in thirty seconds.

### Three fixes that landed

1. **`ffmpeg-static` removed from the project.** Its Linux build cannot resolve hostnames, and `FFMPEG_PATH` cannot override it because prism-media checks the package first and never reads that variable. ffmpeg is now an OS install on every platform → [[ffmpeg]]
2. **`/tplay` no longer drops the voice connection.** It was deleting the queue to rebuild it, and `queue.delete()` triggers `leaveOnStop` → the bot left the channel and rejoined on every play, and *that rejoin* was the `AbortError` → [[tplay preserves the queue]]
3. **`/tplay` no longer plays the wrong song.** The first attempt at fix 2 used `insertTrack(track, 0)`, which appends rather than inserting at the front.

### The experiment that failed, and what it reframes

Removed the `createStream` override on the theory it was only ever an AWS workaround, and that the extractor's own `youtubei.js` path would work from a residential IP — which would also have saved 5–9 seconds of Python per track.

It fails with `ERR_NO_RESULT`: **the same error the [[AWS hosting postmortem]] attributes to datacenter IP ranges.** So the extractor's built-in streaming is broken here too, and the yt-dlp override was load-bearing rather than a workaround awaiting retirement. That postmortem's conclusion isn't wrong, but the error had two causes and only one was the IP.

### What I kept getting wrong

Three times in one day I assumed an API did what its name suggested and shipped a fix that changed nothing:

- `FFMPEG_PATH` — prism-media never reads it
- `jsRuntimes: 'node'` — `youtube-dl-exec` never passes it through
- `insertTrack(track, 0)` — appends instead of inserting at index 0

Each was checkable in one command. The underlying error was **believing a fix worked because the symptom disappeared** — and half the time it disappeared because a DNS cache was warm.

What actually worked, every time, was measuring: `5.029s`, `110ms on arrival / 5351ms by failure`, `9404ms`, `ANDROID_VR` twice. And one observation that came from watching the bot rather than the logs — noticing it leave the voice channel — which turned out to be the whole `AbortError` mystery.

The working `/tplay` also ended up being the shortest version, using a call already in the same file: `/trandom` had been doing "play this now, don't queue it" correctly the entire time.

Related: [[Timeline MOC]] · [[Hosting MOC]] · [[Home]] · [[Open questions]]
