---
tags:
  - hosting
  - log
status: done
---

# Pi setup progress

**Done. The bot is hosted on the Pi.** Full step-by-step lives in `RASPBERRY_PI_SETUP.md`; this is the summary.

## Steps 1–11 — 2026-07-27

SD card written with Pi OS Lite 64-bit via the Imager (hostname `TunezBot`, SSH on, Wi-Fi blank for Ethernet), card into the board, board into the case, powered up, first boot successful. → [[2026-07-27 Pi assembly]]

Blocked at step 11 for two weeks: `ssh …@tunezbot.local` resolves over mDNS, which only works on the same network. Not a configuration problem, a "be in the right building" problem.

## Steps 12–18 — 2026-08-14

Back on home internet. → [[2026-08-14 Site vault and Pi deployment]]

| Step | What |
| --- | --- |
| 12 | SSH connected. Username `josephevenson`, now recorded in the setup guide because it had been forgotten. |
| 13 | `apt update && full-upgrade` |
| 14 | `git`, `python3`, `ffmpeg`, then Node 24 from NodeSource — **not** nvm, so `systemd` gets a stable `/usr/bin/node` |
| 15 | Cloned the repo, `npm install`. 748Mi available + 904Mi swap, no memory trouble. |
| 16 | `.env` typed by hand, plus a Pi-only `FFMPEG_PATH` line → [[Environment Secrets]] |
| 17 | `npm run deploy`, then the first working `/tplay` |
| 18 | `systemd` unit, `enable`d — the step that makes it *hosted* rather than *running* |

## What went wrong on the way

Four failures, each hiding the next, all written up in [[2026-08-14 Site vault and Pi deployment]] and in the setup guide:

1. npm 11 blocks install scripts → yt-dlp and ffmpeg binaries never downloaded
2. No Opus encoder in `package.json` at all → the bot played silence
3. `ffmpeg-static` can't resolve hostnames (static glibc, no NSS) → `FFMPEG_PATH` points at the system binary
4. YouTube's JS challenge → `jsRuntimes: 'node'` in [[yt-dlp]]

## Running it now

```
journalctl -u tunezbot -f          # watch the log
sudo systemctl restart tunezbot    # after a git pull
sudo shutdown -h now               # never pull the power
```

Related: [[Raspberry Pi 4 build]] · [[Parts list]] · [[Hosting MOC]]
