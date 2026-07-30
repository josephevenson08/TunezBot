---
tags:
  - decision
date: 2026-07
status: decided
---

# State stays in memory

**Decision:** no database, no JSON file, no persistence of any kind. Three `Map`s and whatever [[discord-player]] holds → [[Per-Guild State]].

## What is lost on restart

- The [[Guild Queue]]
- [[Session History]] — so `/trandom` and `/thistory` come back empty
- [[Artist Mode]]
- Whatever was playing

## Why that is acceptable

**The state is inherently session-scoped.** It is already destroyed on `Disconnect` by design ([[Voice Connection]]) — a restart is just a disconnect the bot did not choose. Persisting a queue across a restart would mean the bot rejoins hours later and resumes a song from a conversation that ended.

**The cost of persistence is not the write.** It is the schema, the migration when a Track object changes shape, the disk on the Pi's SD card, the stale-data bugs, and the "restore into what voice channel?" question that has no good answer. Real complexity for a benefit that is close to zero.

**Restarts are rare.** The bot is designed to run for weeks.

## What would change the answer

- Playlists that survive sessions — the first genuinely persistent thing anyone would want
- Per-user preferences or play counts
- More than one server, where sessions overlap and a restart hurts several people
- Any kind of analytics

All of those are *new features*, not fixes. When one of them is actually wanted, this decision gets revisited — and the natural first step is a single JSON file, not a database.

## SD card note

There is a hardware angle: the Pi boots off a microSD card, and constant small writes are the classic way to kill one. Not writing anything is also the friendliest thing for the storage → [[Raspberry Pi 4 build]].

Related: [[Per-Guild State]] · [[Session History]] · [[TunezBot]]
