---
tags:
  - concept
---

# Slash Command Registration

Discord has to be told a command exists before anyone can type it. That is `deploy-commands.js`, run separately from the bot itself.

## How it works

`SlashCommandBuilder` describes each command — name, description, options, whether each option is required. The array is serialised with `.toJSON()` and PUT to Discord's REST API, once per guild ID in `GUILD_IDS`.

```js
await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commands });
```

`PUT` replaces the whole set. Remove a command from the array and it disappears from Discord on the next deploy — no separate delete step.

## Two separate jobs, deliberately

| | `deploy-commands.js` | `index.js` |
| --- | --- | --- |
| Run | Only when commands change | Every time the bot runs |
| Knows | Names, descriptions, option types | What the commands actually *do* |
| Needs | `CLIENT_ID`, `GUILD_IDS`, token | Token only |

The cost of splitting them is real: **the two files can drift.** Add a handler in `index.js` without adding a builder here and the command is invisible; add a builder without a handler and it appears but does nothing. Nothing enforces the match — see [[Open questions]].

## Guild-scoped, not global

`applicationGuildCommands` rather than `applicationCommands`. Guild commands appear within about a minute; global commands can take an hour to propagate. For a single-server bot under active development, that is a straight win → [[Guild-scoped command deploy]].

`GUILD_IDS` is comma-separated, so a test server and the real server can both be targeted in one run.

Related: [[Interaction Router]] · [[Commands MOC]] · [[Environment Secrets]]
