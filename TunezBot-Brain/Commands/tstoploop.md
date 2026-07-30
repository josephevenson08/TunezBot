---
tags:
  - command
  - playback
aliases:
  - /tstoploop
---

# /tstoploop

Turn looping off.

```js
queue.setRepeatMode(QueueRepeatMode.OFF);
```

## The reply is the feature

> Loop stopped. The queue will continue after this song.

Not "Loop stopped." The second sentence answers the question that would otherwise be asked next: *does the current song get cut off?* No — it finishes, then the queue resumes.

## No guard, on purpose

Unlike [[tloop]], this does not check whether anything is playing or whether looping was even on. Setting repeat mode to `OFF` when it is already `OFF` is harmless, and an error message for "you turned off something that was already off" is noise. Commands that undo things should be safe to run twice.

Same reasoning as [[tstopartist]].

Related: [[tloop]] · [[Idle Timeout]] · [[Commands MOC]]
