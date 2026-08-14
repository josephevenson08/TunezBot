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

## Done — 2026-08-14

All of it. SSH, Node from NodeSource, repo cloned, `.env` written, commands deployed, and a `systemd` unit with `Restart=always` and `enable`d so it comes back from a crash, a reboot or a power cut with nobody logged in.

Full walkthrough in `RASPBERRY_PI_SETUP.md`; the story of what broke on the way is in [[2026-08-14 Site vault and Pi deployment]].

Two platform facts worth carrying forward:

- **The native Opus encoder will not build here.** No prebuilt binary for ARM64 on Node 24, and the source build dies on an ARM NEON compile error. `opusscript` (pure JS) is what runs → [[ffmpeg]]
- **`ffmpeg-static` is useless on this machine** — a statically linked glibc binary cannot resolve hostnames. `FFMPEG_PATH` points at the system ffmpeg instead.

## Operating it

```
journalctl -u tunezbot -f                              # the log
cd ~/TunezBot && git pull && sudo systemctl restart tunezbot   # update
sudo shutdown -h now                                   # never pull the power
```

## Shutdown

```
sudo shutdown -h now
```

Pulling power on a running Pi risks corrupting the SD card. Researched and noted specifically because the temptation to just unplug it is real.

Related: [[Parts list]] · [[Pi setup progress]] · [[Hosting MOC]]
