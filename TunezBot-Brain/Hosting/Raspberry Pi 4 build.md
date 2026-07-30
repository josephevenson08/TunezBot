---
tags:
  - hosting
---

# Raspberry Pi 4 build

The current hosting target: a Raspberry Pi 4 Model B, 1GB, running Raspberry Pi OS Lite (64-bit), on Ethernet, in a case, on home internet.

## Why this machine

Decided in [[Pi over cloud VM]], caused by [[Datacenter IP reputation]]. The Pi's real feature is not its specs — it is its **IP address**.

Secondary reasons: it never sleeps (unlike the Windows PC → [[Local Windows run]]), it costs nothing to run, and it is a physical thing you can point at.

## Is 1GB enough

Yes, and by a wide margin:

- One Node process
- One [[ffmpeg]] transcode at a time — the only real CPU cost
- One [[yt-dlp]] child process, briefly, per lookup
- [[Per-Guild State]] bounded to 50 tracks → [[State stays in memory]]

**Lite (64-bit)** is doing work here: no desktop environment means the whole GUI stack is absent. Bigger RAM would only matter for concurrent streams, and this bot plays one thing in one server.

## Configuration choices

| Choice | Reason |
| --- | --- |
| OS Lite, no desktop | Headless, minimal footprint |
| Ethernet, Wi-Fi left blank | Fewer things between the audio stream and the internet |
| SSH on, password auth | Managed from the Windows PC over PowerShell |
| Hostname `TunezBot` | `ssh user@tunezbot.local` beats memorising an IP |
| Pi Connect off | Not needed; one less service listening |

## What still has to happen

1. Get back on home internet and finish the SSH connection → [[Pi setup progress]]
2. Install Node, clone the repo, `npm install`
3. Recreate `.env` on the Pi — typed by hand, never copied from a document → [[Environment Secrets]]
4. `npm run deploy` once, then `npm start`
5. **Make it survive a reboot** — a `systemd` service, so the bot restarts with the Pi and after a crash. This is the piece that separates "running on a Pi" from "hosted on a Pi" → [[Open questions]]

## Shutdown

```
sudo shutdown -h now
```

Pulling power on a running Pi risks corrupting the SD card. Researched and noted specifically because the temptation to just unplug it is real.

Related: [[Parts list]] · [[Pi setup progress]] · [[Hosting MOC]]
