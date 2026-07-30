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

Related: [[Voice Connection]] · [[Raspberry Pi 4 build]] · [[Architecture MOC]]
