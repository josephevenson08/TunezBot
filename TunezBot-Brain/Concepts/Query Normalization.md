---
tags:
  - concept
---

# Query Normalization

Turning whatever a person typed into something playable. Two functions: `normalizePlayQuery()` cleans, `resolveToUrl()` decides.

## The mess it has to handle

People paste things, and Discord mangles them on the way:

| Input | Why it happens |
| --- | --- |
| `[Song Name](https://youtu.be/abc)` | Discord markdown link |
| `<https://youtube.com/watch?v=abc>` | Angle brackets suppress the embed |
| `https://youtu.be/abc123` | Share button short link |
| `...watch?v=abc&list=PL...&index=4` | Copied from inside a playlist |
| `daft punk one more time` | Plain text, the common case |

## What it does

1. Strip Discord markdown wrapping — regex for `[text](url)`, then for `<url>`
2. Try to parse the result as a URL
3. If the host is `youtube.com`, `music.youtube.com` or `youtu.be`, pull out the video ID and **rebuild a canonical URL**: `https://www.youtube.com/watch?v=ID`
4. If it does not parse as a URL, the `catch` treats it as search text and passes it through untouched

Step 3 is the one that fixes a real annoyance: pasting a link copied from within a playlist would otherwise queue the entire playlist. Rebuilding from the video ID alone drops `&list=` and `&index=` and plays the one song you meant.

Step 4 uses an empty `catch` as control flow — `new URL()` throwing *is* the signal that this is search text, not a link. Unusual, but the comment says so, and the alternative (a URL-shaped regex) is worse at exactly the strings people actually type.

## Then the fork

```js
if (/^https?:\/\//i.test(normalized)) return normalized;   // real link, use it
const [url] = await searchYoutube(normalized, 1);          // text, search it
if (!url) throw new Error('No results found for that search.');
```

Links go straight through. Text goes to [[yt-dlp]]'s `ytsearch` → [[Search through yt-dlp not Innertube]]. Every playback command funnels through here, so the "did you paste a link or type words?" question is answered in exactly one place.

Related: [[tplay]] · [[tqueue]] · [[Interaction Router]]
