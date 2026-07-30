---
tags:
  - command
  - session
aliases:
  - /thistory
---

# /thistory

What has been played this voice session.

```js
const recent = history.slice(-15).reverse();
```

## Two transforms, both intentional

**`slice(-15)`** — the last 15 of the 50 kept in [[Session History]]. Fifteen fills a Discord message without scrolling. The other 35 stay in memory because [[Artist Mode]] and [[trelated]] filter against the full set — displayed and stored limits are different numbers for different reasons.

**`.reverse()`** — newest first. A chat log reads bottom-up; a list you scan reads top-down. Most-recent-first is what gets wanted here.

## The now-playing marker

```js
const nowPlayingMarker = queue.currentTrack?.id === track.id ? ' (now playing)' : '';
```

Because the current track is *in* the history — it was pushed on `PlayerStart`. Without the marker, item 1 would look like a duplicate of whatever is currently audible.

```
1. Justice - Genesis (now playing)
2. Daft Punk - One More Time
3. Chromeo - Fancy Footwork
```

## Session-scoped, and that is the point

Not a listening history. It resets when the bot leaves voice → [[Voice Connection]]. "What have we been playing tonight" is the question it answers.

Related: [[trandom]] · [[tnowplaying]] · [[Session History]]
