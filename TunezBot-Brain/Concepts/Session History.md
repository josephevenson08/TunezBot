---
tags:
  - concept
---

# Session History

An array of the tracks played in the current voice session, per server. Appended on every `PlayerStart`, capped at the last 50, and destroyed when the bot leaves voice.

```js
history.push(track);
sessionHistories.set(guildId, history.slice(-50));
```

## Separate from the player's own history

[[discord-player]] already keeps `queue.history` — and [[treplay]] uses it. So why a second one?

Because they answer different questions:

| | `queue.history` | Session History |
| --- | --- | --- |
| Owned by | discord-player | the bot |
| Scope | Playback order, for stepping backwards | Everything heard this session |
| Used by | [[treplay]] | [[thistory]], [[trandom]], [[Artist Mode]], [[trelated]] |

The bot's own copy is what makes "don't play something we just heard" possible — [[Artist Mode]] and [[trelated]] both build a `Set` of recent URLs and filter candidates against it:

```js
const recentUrls = new Set(getSessionHistory(guildId).map((t) => t.url));
const fresh = urls.filter((url) => !recentUrls.has(url));
const pool = fresh.length > 0 ? fresh : urls;
```

That last line matters: if *every* candidate is a repeat, it plays a repeat rather than giving up. Preferring novelty, not requiring it.

## Why it dies on disconnect

A voice session is the natural boundary for "this session." Keeping history across a leave-and-rejoin would make `/trandom` pull from a conversation that ended hours ago. The reset is a feature.

Related: [[Per-Guild State]] · [[Voice Connection]] · [[thistory]] · [[trandom]]
