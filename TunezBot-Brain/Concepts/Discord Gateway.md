---
tags:
  - concept
---

# Discord Gateway

The persistent WebSocket connection between the bot and Discord. Opened once by `client.login()` and held open for the entire life of the process.

## Why it matters more than it sounds like it does

This one connection is the reason every hosting conversation on this project went the way it did. A Gateway connection is **not** a request/response API — Discord pushes events *to* the bot down an open socket. If the socket closes, the bot is offline. There is no "wake on request."

That single property rules out every serverless platform → [[The bot cannot run on Cloudflare]] — and is what a [[Raspberry Pi 4 build]] is actually buying: a machine that never sleeps.

## Intents

The client asks for exactly two:

```js
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
```

- `Guilds` — server, channel and role data. Needed to know where commands came from.
- `GuildVoiceStates` — who is in which voice channel. Needed for `ensureVoiceChannel()`, and for the [[Voice Connection]] to work at all.

Notably absent: `MessageContent`. The bot never reads messages, because it only takes slash commands. Fewer intents means fewer permissions to justify and a smaller blast radius if the token leaks → [[Environment Secrets]].

## What arrives over it

Every interaction, every voice state change, and the `ClientReady` event that triggers extractor registration. All of them land in [[Interaction Router]] or a `player.events` handler.

Related: [[Voice Connection]] · [[Slash Command Registration]] · [[Architecture MOC]]
