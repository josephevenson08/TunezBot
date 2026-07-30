---
tags:
  - concept
---

# Interaction Router

The single `Events.InteractionCreate` handler in `index.js` that every slash command flows through. One function, one if-chain, ~400 lines.

## The gate at the top

```js
if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;
```

Anything that is not a slash command, and anything sent in a DM, is dropped immediately. Everything below that line can assume `interaction.guildId` exists.

## The ordering, which is not arbitrary

The chain is in three tiers, and the tiers exist for a reason:

1. **`tplay`, `tartist`, `tstopartist`** — handled first, *before* the queue is fetched. These are the only commands that make sense when nothing is playing yet.
2. **`tqueue`** — handled next, because it has two modes: with text it can start from a partial state, without text it just reports.
3. **Everything else** — sits behind a shared guard:
   ```js
   if (!queue || queue.deleted) → "Nothing is playing right now."
   ```
   Which means `/tskip`, `/tpause`, `/tloop` and the rest never have to check for a missing queue individually. One guard, thirteen commands.

Moving a command across a tier boundary changes its behaviour. That is worth knowing before reordering anything.

## Why a big if-chain and not a command map

For 17 commands in one file with no plugin system, a `Map` of handlers would add indirection without removing anything. The shared queue guard in the middle of the chain is doing real work that a flat dispatch table would have to duplicate into every handler. It is the kind of structure that would need rethinking at 40 commands — not at 17.

Related: [[Commands MOC]] · [[Slash Command Registration]] · [[Per-Guild State]] · [[Retry Wrapper]]
