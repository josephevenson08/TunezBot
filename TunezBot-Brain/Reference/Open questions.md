---
tags:
  - reference
---

# Open questions

Unresolved threads. Not a backlog of features — things that are genuinely undecided or genuinely wrong.

## Fixed, kept here because the reasoning is worth having

**`process.on('unknownRejection')` never fired.** ~~`index.js` line 19.~~ **Fixed 2026-08-14.**

Node emits `unhandledRejection`, not `unknownRejection`. The 2026-07-28 rename changed the event name along with the message, silently unregistering the handler.

It was not theoretical. On the first live run on the Pi, an expired interaction rejected inside `deferReply`, the rejection escalated to an uncaught exception, and `process.exit(1)` took the whole bot offline. One mistyped command, one dead bot.

Fixing the name was **not sufficient** — a rejected promise from an async event listener does not reliably reach that handler anyway, because discord.js routes it through the client's `error` event. The real fix was making the router a named function with `.catch()` attached at registration → [[Interaction Router]].

**Lesson:** renaming for readability is safe on your own words and unsafe on names an API owns. And a global error handler is a backstop, not a substitute for catching errors where they happen.

## Reliability

**Searches are not retried.** [[Retry Wrapper]] only wraps `player.play()`. The [[yt-dlp]] search that runs first — the more fragile half, per [[AWS hosting postmortem]] — gets one attempt. Wrapping it is a one-line change; the hesitation is that retrying a search adds request volume, which is what the AWS failure was sensitive to. Genuinely undecided.

**No drift check between the two files.** A handler in `index.js` with no builder in `deploy-commands.js` is invisible; the reverse appears but does nothing. Nothing catches either. → [[Slash Command Registration]]

**7 npm audit warnings** (1 low, 5 moderate, 1 high), deliberately untouched until the bot had run properly at least once. That has now happened, so this is safe to revisit — carefully. `npm audit fix --force` warns about breaking changes, and `discord-player-youtubei` is on a beta release, so a forced bump is a good way to break playback.

## Behaviour

**`deferReply()` is outside the `try` block** in `tplay`, `tqueue`, `tartist`, `tskip`, `treplay`, `trandom` and `trelated`. The router-level catch now stops the crash, but those handlers still can't tell the user their command died — the error only reaches the console. Moving it inside is the proper fix.

**`/tplay` silently cancels artist mode.** Correct behaviour, invisible to the user. A line in the reply would cost nothing. → [[tplay]]

**`/tclear` during artist mode instantly refills.** Clearing fires `EmptyQueue`, which refills. Technically correct, definitely surprising. → [[tclear]]

**No permission model.** Anyone who can use slash commands can control playback. Fine for a private server, the first thing to fix for anything larger. → [[TunezBot]]

## Platform

**`opusscript` instead of the native encoder.** The pure-JS encoder uses more CPU than `@discordjs/opus`. Fine for one stream on a Pi 4. If it ever isn't, dropping to Node 22 would probably get a prebuilt native binary — but measure with `htop` before assuming. → [[2026-08-14 Site vault and Pi deployment]]

**No monitoring.** `systemd` restarts the bot, but nothing tells you it restarted. A bot that silently crash-loops looks identical to a bot nobody is using.

## Scale, only if it ever matters

**The `Map`s are never cleaned per-guild except on disconnect.** A slow leak at many servers; a non-issue at one. → [[Per-Guild State]]

**No persistence.** Deliberate → [[State stays in memory]]. Revisit if cross-session playlists are ever wanted.

## Project

**Finish the comment pass** — `/trandom` through `/trelated`, the utility functions, and login. Paused since 2026-07-30. → [[2026-07-30 Comment pass into handlers]]

**Deploy the landing page** to Cloudflare. Built and tested, not yet live. → [[Landing page and bot are separate problems]]

Related: [[Home]] · [[Decisions MOC]]
