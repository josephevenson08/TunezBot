# TunezBot

A small personal Discord music bot for one server. It accepts YouTube links and YouTube search text.

YouTube support comes from the community `discord-player-youtubei` extractor because Discord Player v7 no longer includes official YouTube playback.

## Commands

Use these commands in Discord while you are in a voice channel:

```text
/tplay <YouTube URL or search>
/tqueue <YouTube URL or search>
/tqueue
/tskip
/tpause
/tresume
/tnowplaying
/treplay
/tstop
```

Typical flow:

```text
/tplay first song
/tqueue second song
/tskip
```

`/tplay` starts music. `/tqueue` with a song adds it after the current song. `/tqueue` with no song shows what is playing and what is up next. `/tskip` moves to the next queued song.

## 1. Create the Discord app

1. Go to <https://discord.com/developers/applications>.
2. Click **New Application** and name it `TunezBot`.
3. Open **Bot**, click **Reset Token**, and copy the token.
4. Keep the token private. Anyone with it can control your bot.
5. Open **General Information** and copy the **Application ID**. That is your `CLIENT_ID`.

## 2. Get your server ID

1. In Discord, open **User Settings > Advanced**.
2. Turn on **Developer Mode**.
3. Right-click your server icon and click **Copy Server ID**. That is your `GUILD_ID`.

## 3. Configure this project

Copy `.env.example` to `.env`, then fill it in:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_discord_server_id_here
```

## 4. Invite the bot

In the Developer Portal, open **OAuth2 > URL Generator**.

Select these scopes:

- `bot`
- `applications.commands`

Select these bot permissions:

- `View Channels`
- `Send Messages`
- `Connect`
- `Speak`
- `Use Voice Activity`

Open the generated URL and choose your server. You need permission to add apps/bots to that server.

## 5. Register commands and run

From this folder:

```powershell
npm run deploy
npm start
```

Run `npm run deploy` when slash commands are added or changed. You do not need it every time.

Run `npm start` whenever you want the bot online. The PowerShell window running `npm start` must stay open. VS Code can be closed, but if the terminal closes, your computer sleeps, or your internet disconnects, the bot goes offline.

After the queue finishes, the bot waits 2 minutes for another song. If nothing starts during that time, it leaves the voice channel automatically.

Anyone in your server who can use the slash commands can control the bot while it is online.

Join a voice channel in your server and try:

```text
/tplay never gonna give you up
/tplay https://www.youtube.com/watch?v=dQw4w9WgXcQ
/tqueue https://www.youtube.com/watch?v=dQw4w9WgXcQ
/tqueue
/tskip
/tstop
```

## Notes

Music extractors can break when providers change their sites. If YouTube links stop resolving later, update dependencies with:

```powershell
npm update
```

Your `.env` file contains your private bot token and should not be shared.
