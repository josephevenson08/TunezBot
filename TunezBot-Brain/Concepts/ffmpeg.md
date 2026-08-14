---
tags:
  - concept
  - dependency
---

# ffmpeg

Transcodes whatever [[yt-dlp]] hands back into the Opus audio Discord requires. Pulled in as `ffmpeg-static`, which ships a prebuilt binary per platform so there is nothing to install by hand.

## Where it sits

```
yt-dlp → direct media URL → ffmpeg → Opus → Voice Connection → Discord
```

[[discord-player]] invokes it; the bot never calls it directly. It is invisible right up until it is missing, at which point playback fails with an error that does not mention ffmpeg at all.

## The two things worth remembering

**It is a real binary, spawned as a child process.** Same constraint as yt-dlp, same consequence → [[The bot cannot run on Cloudflare]].

**It is the CPU cost of this bot.** Everything else — WebSocket, queue bookkeeping, string formatting — is nearly free. Transcoding is not. On a Raspberry Pi 4 with 1GB RAM ([[Parts list]]), one stream is comfortable; this is the component that would decide how many simultaneous streams the hardware could take. Since the bot serves one server and plays one thing at a time, one stream is all it ever needs.

`ffmpeg-static` avoids the classic "works on my machine" failure where ffmpeg is on the Windows PATH but was never installed on the Pi. On the Pi the alternative is `apt install ffmpeg`, which is what the AWS attempt used → [[AWS hosting postmortem]].

## The catch: `ffmpeg-static` cannot resolve hostnames

Found on the Pi, and it is not Pi-specific — it is a property of the binary.

**A statically linked glibc binary cannot do DNS.** glibc looks up hostnames through NSS, and NSS works by dynamically loading `libnss_dns.so` at runtime — which is exactly what a static binary cannot do. So `ffmpeg-static` decodes local files perfectly and cannot open a single URL:

```
Failed to resolve hostname rr1---sn-vgqsrnlk.googlevideo.com: System error
```

Since this bot only ever feeds ffmpeg a **remote URL** from [[yt-dlp]], that makes the bundled binary useless here. It fails silently: zero bytes out, [[discord-player]] reads an empty stream as a finished track, no error event, no log line.

**The fix is `FFMPEG_PATH=/usr/bin/ffmpeg` in `.env`.** `prism-media` checks that variable before reaching for `ffmpeg-static`, and it is per-machine config so Windows keeps using the bundled binary. → [[Environment Secrets]]

## And it needs an Opus encoder alongside it

ffmpeg having `libopus` compiled in is **not** enough. The pipeline is ffmpeg → PCM → Opus encoder → Discord, and that last stage is a separate Node library that `package.json` never listed. Without it, [[Voice Connection]] connects and plays silence.

`@discordjs/voice`'s own diagnostic names it:

```js
require('@discordjs/voice').generateDependencyReport()
```

Related: [[Voice Connection]] · [[Raspberry Pi 4 build]] · [[2026-08-14 Site vault and Pi deployment]]

Related: [[Voice Connection]] · [[Raspberry Pi 4 build]] · [[Architecture MOC]]
