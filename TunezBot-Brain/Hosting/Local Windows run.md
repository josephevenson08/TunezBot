---
tags:
  - hosting
---

# Local Windows run

How the bot runs today: a PowerShell window on the Windows PC.

```powershell
npm install      # once, or after package.json changes
npm run deploy   # only when commands change
npm start        # every time you want the bot online
```

## The rules

- **The PowerShell window running `npm start` must stay open.** That window *is* the bot.
- VS Code can be closed. The terminal cannot.
- Close it, sleep the machine, or lose internet, and the bot drops offline.
- Every restart wipes [[Per-Guild State]] → [[State stays in memory]].

## Why it is not the answer

It works perfectly and it is completely impractical. The PC has to stay awake indefinitely for a bot to be available — which means never sleeping the machine, and the bot dying every time you shut down.

That is the whole motivation for [[Raspberry Pi 4 build]]: not performance, just a computer whose job is to stay on.

## Why it is still worth keeping

**This is the development environment.** Editing `index.js` and restarting locally is a several-second loop; doing the same over SSH on the Pi is not. Keeping local runs working means:

- Code changes get tested here before going near the Pi
- The Pi can stay on a known-good commit
- If the Pi dies, there is a working fallback in one command

Two environments, and both should keep working. The `\r?\n` split in [[yt-dlp]]'s stream helper exists precisely because of that — the same code has to handle Windows and Linux line endings.

Related: [[Raspberry Pi 4 build]] · [[Hosting MOC]] · [[Repo map]]
