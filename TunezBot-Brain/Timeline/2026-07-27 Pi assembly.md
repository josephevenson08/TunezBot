---
tags:
  - log
  - hosting
date: 2026-07-27
---

# 2026-07-27 — Pi assembly

Parts arrived. Physical build done, setup paused.

## Done

- Flashed the microSD card with Raspberry Pi OS Lite (64-bit) via Raspberry Pi Imager, configured with hostname, user, locale, SSH on, Wi-Fi blank
- Verification **not** skipped during the write
- Assembled the case, card into the board, lid on
- Ethernet and power connected
- **Successful first boot**

That is steps 1–11 of `RASPBERRY_PI_SETUP.md` → [[Pi setup progress]].

## Stopped

At the SSH step, because this was done away from home internet. `ssh user@tunezbot.local` needs to be on the same network as the Pi — mDNS does not reach across networks.

Nothing to fix. Just the wrong location.

## Also researched

The correct shutdown command:

```
sudo shutdown -h now
```

Looked up deliberately rather than assumed. Pulling power on a running Pi risks corrupting the SD card that holds the entire OS.

## Note on how this got documented

The setup guide was written **as the work happened**, including the stopping point and why. A guide that reads "steps 1–11, then blocked on network location" is more honest and more useful than one that quietly resumes three days later as if nothing happened.

Related: [[Raspberry Pi 4 build]] · [[Parts list]] · [[Timeline MOC]]
