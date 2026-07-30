---
tags:
  - hosting
  - log
status: paused
---

# Pi setup progress

Live status of the physical build. Full step-by-step lives in `RASPBERRY_PI_SETUP.md` in the repo — this is the summary and the blocker.

## Done — steps 1 to 11

1. `.env` values on hand — token, client ID, guild ID → [[Environment Secrets]]
2. Raspberry Pi Imager installed from raspberrypi.com, default settings
3. 32GB microSD in the laptop
4. Imager configured: Pi 4 → Raspberry Pi OS Lite (64-bit) → the SD card → hostname `TunezBot` → localisation → username and password → **Wi-Fi left blank (Ethernet)** → **SSH on, password auth** → Pi Connect off
5. Written, **verification not skipped**
6. Card ejected safely
7. Card into the board
8. Board into the case, lid on
9. Ethernet connected
10. Power connected, ~2 minutes to first boot
11. `ssh myusername@tunezbot.local` from PowerShell

## Blocked at step 11

**Not on home internet.** `tunezbot.local` resolves via mDNS on the local network — from a different network, there is nothing to resolve. This is not a configuration problem to debug; it is a "be in the right building" problem.

## Next, once back home

- Complete the SSH connection
- `sudo apt update && sudo apt upgrade`
- Install Node 18+ and [[ffmpeg]]
- Clone from GitHub, `npm install`
- **Type `.env` by hand.** Do not paste from any document. A token was exposed once already on this project and had to be reset → [[Environment Secrets]]
- `npm run deploy`, then `npm start`, then a real `/tplay` test
- Set up `systemd` so it survives reboots → [[Open questions]]

## Shutdown, every time

```
sudo shutdown -h now
```

Related: [[Raspberry Pi 4 build]] · [[Parts list]] · [[2026-07-27 Pi assembly]]
