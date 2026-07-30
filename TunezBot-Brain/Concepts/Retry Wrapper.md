---
tags:
  - concept
---

# Retry Wrapper

A four-line function wrapped around every single `player.play()` call in the bot.

```js
async function withRetry(fn, retries = 1, delayMs = 1500) {
  try { return await fn(); }
  catch (error) {
    if (retries <= 0) throw error;
    await new Promise((r) => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs);
  }
}
```

## The two parameters that matter

**One retry, not five.** If the failure is transient, one retry catches it. If it is not transient — a blocked IP, a deleted video — retrying five times just makes the user wait five times as long for the same error. Escalating retries would also *add* request volume to a system already suspicious of request volume → [[Datacenter IP reputation]].

**A 1.5-second pause, not an immediate retry.** This was the finding, not the guess: an immediate second attempt failed as often as the first. Something on YouTube's side needs the gap. An instant retry is barely a retry at all.

## Where it came from

Added during [[AWS hosting postmortem]] to absorb intermittent extraction failures. It **did not fix** the problem there — search kept failing, and one track failed on both the attempt and the retry. That is what proved the issue was environmental rather than transient, and led to [[Pi over cloud VM]].

It was kept anyway → [[Retry once after a short delay]]. Nothing about it is AWS-specific, and network calls to a service actively trying to detect bots will occasionally fail anywhere.

## Its limit

It only wraps `player.play()`. The [[yt-dlp]] search that runs *before* it is not retried — so a failed search is a hard failure with no second chance, even though search is the more fragile of the two. That gap is deliberate-by-omission rather than deliberate-by-design → [[Open questions]].

Related: [[Innertube Search]] · [[Artist Mode]] · [[Interaction Router]]
