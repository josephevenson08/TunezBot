---
tags:
  - concept
---

# Environment Secrets

Three values, loaded by `dotenv`, never committed.

| Variable | Used by | What it is |
| --- | --- | --- |
| `DISCORD_TOKEN` | both files | The bot's password. Full control of the bot. |
| `CLIENT_ID` | `deploy-commands.js` | Application ID from the Developer Portal |
| `GUILD_IDS` | `deploy-commands.js` | Comma-separated server IDs → [[Guild-scoped command deploy]] |

## Fail fast, fail loudly

Both entry points check before doing anything:

```js
if (!DISCORD_TOKEN) { console.error('Missing DISCORD_TOKEN in .env'); process.exit(1); }
```

A missing token would otherwise surface as an opaque authentication error from deep inside discord.js. Checking at the top turns a confusing failure into a one-line instruction. Same pattern as the extractor registration in [[discord-player-youtubei]]: if the process cannot possibly work, say why and stop.

## The token is the whole security model

There is no second factor and no scoping. Anyone holding it can run the bot as you, in your server. It has been reset once already on this project — during the AWS attempt, a token was briefly exposed in a document and had to be regenerated in the Developer Portal.

The practical rules that came out of that:

- `.env` is in `.gitignore`; `.env.example` holds placeholders only, and carries a comment saying so
- Never paste a real token into a setup guide, a screenshot, or a commit — including one you plan to fix later
- If it is exposed, **Reset Token** immediately. Regenerating is free; the exposure is not.

Related: [[Slash Command Registration]] · [[Repo map]] · [[Pi setup progress]]
