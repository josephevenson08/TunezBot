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

Still open in [[Open questions]]: finish the comment pass, `deferReply` outside the try block in seven handlers, the npm audit warnings, and deploying the landing page.

Related: [[Timeline MOC]] · [[Hosting MOC]] · [[Home]]
