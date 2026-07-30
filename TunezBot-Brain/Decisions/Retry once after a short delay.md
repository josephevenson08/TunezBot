---
tags:
  - decision
date: 2026-07
status: kept
---

# Retry once after a short delay

**Decision:** wrap every `player.play()` in one retry, 1.5 seconds apart. Not zero, not five. → [[Retry Wrapper]]

## Why one

More retries means more requests at a service that is already deciding whether you are a robot. Escalating retries would have made the [[AWS hosting postmortem]] failure *worse*, not better. And if the cause is not transient, extra attempts only lengthen the wait before the same error.

One retry catches the genuinely transient case and stops.

## Why 1.5 seconds

Measured, not chosen. An immediate second attempt failed about as often as the first — something on YouTube's side needs the gap. A retry with no delay is barely a retry.

It also stays inside the interaction window: commands that can retry have already called `deferReply()`, which buys 15 minutes, so 1.5s costs nothing in user experience.

## The evidence that it does not solve everything

During the AWS attempt, a track failed on **both** the attempt and the retry — for a URL yt-dlp had just resolved correctly. That single data point is what proved the problem was environmental rather than transient, and it is why this note exists as a decision rather than a fix.

A retry wrapper that fails to rescue a call is still telling you something: it distinguishes "flaky" from "blocked."

## Kept anyway

Nothing about it is AWS-specific. Any network call to a service actively looking for automation will occasionally fail. Four lines, no dependencies, no downside.

Related: [[Retry Wrapper]] · [[AWS hosting postmortem]] · [[Datacenter IP reputation]]
