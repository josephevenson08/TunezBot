---
tags:
  - command
  - discovery
aliases:
  - /trelated
---

# /trelated

Queue something stylistically near what is playing. The closest thing to a recommendation engine here, built out of search phrasing.

## How "related" is defined

Not by any similarity model — by asking YouTube a question phrased the way a person would:

```js
const RELATED_SEARCH_TEMPLATES = [
  (author) => `${author} mix`,
  (author) => `${author} radio`,
  (author) => `songs like ${author}`,
];
```

One template chosen at random per invocation. These are phrases whose results *humans have already curated* — a "songs like X" video exists because someone made it. The recommendation quality is borrowed from YouTube's own ecosystem rather than computed.

`seedTrack.author || seedTrack.title` — falls back to the title when no author is exposed, which happens with unofficial uploads.

## Filters

Candidates exclude the seed track itself **and** everything in [[Session History]]:

```js
const candidates = urls.filter((url) => url !== seedTrack.url && !recentUrls.has(url));
```

Then a random pick from up to 8. Same layered-variation approach as [[Artist Mode]] — but stricter: if nothing survives filtering, it gives up and says so rather than replaying something. Artist mode falls back to a repeat because it must produce a track to keep its promise; this command has no such obligation.

## Different from artist mode

| | `/trelated` | `/tartist` |
| --- | --- | --- |
| Scope | One song, once | Continuous |
| Seeded by | What is currently playing | A name you typed |
| Ends | Immediately | `/tstopartist` |

Related: [[tartist]] · [[Session History]] · [[yt-dlp]]
