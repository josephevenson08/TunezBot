---
tags:
  - decision
date: 2026-07
status: kept
---

# Search through yt-dlp not Innertube

**Decision:** all plain-text search goes through [[yt-dlp]]'s `ytsearch`, not through [[discord-player-youtubei]]'s built-in [[Innertube Search]].

## Why

Innertube is YouTube's internal client API — heavily bot-guarded, and it fails on datacenter IPs while a plain yt-dlp video fetch from the same machine at the same moment succeeds. Discovered in [[AWS hosting postmortem]].

## How

```js
async function searchYoutube(query, count = 1) {
  const output = await youtubeDl(`ytsearch${count}:${query}`, {
    dumpSingleJson: true,
    flatPlaylist: true,
    noWarnings: true,
    noProgress: true,
  });
  const parsed = typeof output === 'string' ? JSON.parse(output) : output;
  return (parsed.entries || [])
    .filter((entry) => entry && entry.id)
    .map((entry) => `https://www.youtube.com/watch?v=${entry.id}`);
}
```

One function, used by [[Query Normalization]], [[Artist Mode]] and [[trelated]] — so the whole bot has exactly one search implementation.

`flatPlaylist` avoids fetching full metadata for every result; only IDs are needed to build URLs. Fewer requests is both faster and, given the above, safer.

## Kept after the revert

The Pi does not need this — a residential IP would have been fine with Innertube. It stayed anyway:

- yt-dlp is mature and actively maintained; `discord-player-youtubei` is on a `3.0.0-beta` release
- Search and stream extraction now go through **the same tool**, so a YouTube-side change breaks one dependency instead of two, and `npm update` fixes both
- It costs nothing to keep

Choosing the more boring dependency when both work is usually right.

## The gap

The search call itself is not wrapped in [[Retry Wrapper]] — only the `player.play()` that follows it is. A failed search is a hard failure. → [[Open questions]]

Related: [[yt-dlp]] · [[Innertube Search]] · [[Datacenter IP reputation]]
