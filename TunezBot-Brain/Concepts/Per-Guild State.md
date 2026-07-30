---
tags:
  - concept
---

# Per-Guild State

Three `Map`s at the top of `index.js`, every one of them keyed by guild ID:

```js
const activityIntervals = new Map();   // guildId → setInterval handle
const sessionHistories  = new Map();   // guildId → Track[]
const artistModes       = new Map();   // guildId → artist name
```

Plus the [[Guild Queue]], which [[discord-player]] keys the same way.

## Why keyed and not plain variables

Because a plain `let currentArtist` would be shared across every server the bot is in. Two servers, one artist mode — server B's queue silently fills with server A's artist. The bot is built for one server today, but the *shape* of the state should not be the thing that breaks when a second one is added. Keying by guild ID costs nothing and removes a whole category of bug.

## Lifecycle

| Event | What happens |
| --- | --- |
| First use | Lazily created — `getSessionHistory()` creates the array on demand |
| `Disconnect` | All three wiped for that guild |
| `EmptyQueue` | Activity interval cleared, presence reset |
| Process restart | Everything gone → [[State stays in memory]] |

## The bounded one

`sessionHistories` is the only one that grows, so it is capped:

```js
sessionHistories.set(guildId, history.slice(-50));
```

Trimmed on every track start. Without it, a bot left running for a month accumulates every track object it ever played. Bounded memory is not optional on a Pi with 1GB of RAM → [[Raspberry Pi 4 build]].

The `Map`s themselves are only cleaned per-guild on disconnect, not per-guild-that-left. For a one-server bot that is a non-issue; at scale it would be a slow leak → [[Open questions]].

Related: [[Session History]] · [[Artist Mode]] · [[Bot Activity Status]] · [[Guild Queue]]
