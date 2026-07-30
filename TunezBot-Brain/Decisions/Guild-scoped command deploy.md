---
tags:
  - decision
date: 2026-07
status: decided
---

# Guild-scoped command deploy

**Decision:** register commands per-guild (`applicationGuildCommands`), not globally (`applicationCommands`).

## The difference

| | Guild | Global |
| --- | --- | --- |
| Propagation | ~1 minute | up to 1 hour |
| Scope | Listed servers only | Every server the bot is in |
| Dev loop | Fast | Painful |

For a bot that lives in one server and is under active development, the choice makes itself. Waiting an hour to find out whether a description typo is fixed is not a workable loop.

## The comma-separated list

```js
const guildIds = GUILD_IDS.split(',').map((id) => id.trim()).filter(Boolean);
```

`.trim()` handles `123, 456` written the way a person writes it. `.filter(Boolean)` handles a trailing comma. Two small guards that turn a confusing failure — deploying to guild ID `" 456"` — into it just working.

Supports a test server and the real server in one run → [[Environment Secrets]].

## What it costs

**The bot cannot be added to a new server without a redeploy.** For a personal bot that is a non-issue; if it were ever shared, global registration would become the right call.

`PUT` also replaces the entire command set per guild, which is a feature: deleting a command from the array removes it from Discord with no separate cleanup step.

Related: [[Slash Command Registration]] · [[TunezBot]] · [[Commands MOC]]
