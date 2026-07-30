---
tags:
  - reference
---

# Open questions

Unresolved threads. Not a backlog of features — things that are genuinely undecided or genuinely wrong.

## Confirmed bug

**`process.on('unknownRejection')` never fires.** `index.js` line 19.

Node emits `unhandledRejection`, not `unknownRejection`. The rename on 2026-07-28 changed the **event name** along with the comment, so the handler is now dead code — an unhandled promise rejection produces no log at all.

```js
process.on('unknownRejection', (reason) => {   // ← never fires
  console.error('Unknown rejection:', reason);
});
```

The fix is renaming the event string back to `'unhandledRejection'`. The *comment* wording ("unknown") can stay — the intent was to reword the message, not the API. Context: [[2026-07-28 Comment pass]].

## Reliability

**No process supervisor on the Pi.** Nothing restarts the bot after a crash or a reboot. A `systemd` unit with `Restart=always` is the missing piece between "running on a Pi" and "hosted on a Pi." → [[Raspberry Pi 4 build]]

**Searches are not retried.** [[Retry Wrapper]] only wraps `player.play()`. The [[yt-dlp]] search that runs first — the more fragile half, per [[AWS hosting postmortem]] — gets one attempt. Wrapping it too is a one-line change; the reason to hesitate is that retrying a search adds request volume, which is exactly what the AWS failure was sensitive to. Genuinely undecided.

**No drift check between the two files.** A handler in `index.js` with no builder in `deploy-commands.js` is invisible; the reverse appears but does nothing. Nothing catches either. → [[Slash Command Registration]]

## Behaviour

**`/tplay` silently cancels artist mode.** Correct behaviour, invisible to the user. A line in the reply — "artist mode stopped" — would cost nothing. → [[tplay]]

**`/tclear` during artist mode instantly refills.** Clearing fires `EmptyQueue`, which refills. Technically correct, definitely surprising. → [[tclear]]

**No permission model.** Anyone who can use slash commands can control playback. Fine for a private server, the first thing to fix for anything larger. → [[TunezBot]]

## Scale, only if it ever matters

**The `Map`s are never cleaned per-guild except on disconnect.** A slow leak at many servers; a non-issue at one. → [[Per-Guild State]]

**No persistence.** Deliberate → [[State stays in memory]]. Revisit if cross-session playlists are ever wanted.

## Project

**Finish the comment pass** — `/trandom` through `/trelated`, the utility functions, and login. → [[2026-07-30 Landing page and vault]]

**Get back on home internet** and finish from step 11. → [[Pi setup progress]]

Related: [[Home]] · [[Decisions MOC]]
