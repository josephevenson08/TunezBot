---
tags:
  - concept
---

# Artist Mode

The most opinionated feature in the bot. `/tartist daft punk` stores an artist name for that server, and from then on the queue **never runs out** — every time it empties, another song by that artist is fetched and played.

## The hook

It lives on `EmptyQueue`, which is normally where playback ends:

```js
player.events.on(GuildQueueEvent.EmptyQueue, async (queue) => {
  const artist = artistModes.get(queue.guild.id);
  if (artist) {
    const track = await playArtistTrack(queue, artist);
    if (track) return;   // ← never reaches "Queue finished"
  }
  queue.metadata?.send('Queue finished.');
  ...
});
```

An early `return` on success is the whole trick. The end-of-queue path simply never executes.

## Not getting the same four songs

Two mechanisms, both needed:

**Varied search phrasing** — one of four templates picked at random:
```js
[`${artist} official audio`, `${artist} official music video`, `${artist} songs`, `${artist} lyrics`]
```
YouTube returns meaningfully different result sets for each. A single fixed phrase would loop the same handful of videos forever.

**Filter against what was just played** — candidates are checked against [[Session History]], falling back to the unfiltered pool if everything is a repeat.

Then one of up to 8 results is picked at random. Varied query × filtered results × random pick — three sources of variation stacked, because any one alone still felt repetitive.

## How it ends

- `/tstopartist` — explicit off
- `/tplay` — **implicitly** clears it. Asking for a specific song means you are done with artist mode. Worth knowing, since nothing announces it.
- Disconnect — wiped with the rest of [[Per-Guild State]]

## The edge case that needed handling

`/tskip` with an empty queue would normally say "nothing to skip." In artist mode that is wrong — the whole promise is that there is always a next song. So [[tskip]] fetches one first, *then* skips. Without that, the mode's promise breaks at exactly the moment you would test it.

Related: [[tartist]] · [[tstopartist]] · [[tskip]] · [[yt-dlp]] · [[Retry Wrapper]]
