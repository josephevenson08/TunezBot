# TunezBot

A small personal Discord music bot for one server. It accepts YouTube links and YouTube search text.

YouTube support comes from the community `discord-player-youtubei` extractor because Discord Player v7 no longer includes official YouTube playback.

## Commands

Use these commands in Discord while you are in a voice channel:

```text
/tplay <YouTube URL or search>
/tqueue <YouTube URL or search>
/tqueue
/tremove <position>
/tskip
/tloop
/tstoploop
/tpause
/tresume
/tnowplaying
/treplay
/trandom
/thistory
/tartist <artist name>
/tstopartist
/trelated
/tclear
/tstop
```

Typical flow:

```text
/tplay first song
/tqueue second song
/tskip
```

`/tplay` starts music. `/tqueue` with a song adds it after the current song. `/tqueue` with no song shows what is playing and what is up next. `/tskip` moves to the next queued song.

Command notes:

- `/tplay` replaces the current song while keeping the existing queue.
- `/tqueue` adds a song to the queue, or shows the queue if no song is provided.
- `/tremove` removes one song from the queue by its position, using the numbers shown by `/tqueue`.
- `/tskip` skips to the next queued song.
- `/tloop` loops the current song.
- `/tstoploop` turns looping off so the queue can continue.
- `/treplay` replays the previous song.
- `/trandom` plays a random song from the current voice session history.
- `/thistory` lists the songs played so far this session.
- `/tartist` keeps queueing more songs by an artist whenever the queue runs out.
- `/tstopartist` turns artist mode off.
- `/trelated` finds and queues a song related to what's currently playing.
- `/tclear` clears queued songs without stopping the current song.
- `/tstop` stops playback and clears the queue.
- `/tnowplaying` shows the current song, progress, requester, and any active modes.

## 1. Create the Discord app

1. Go to <https://discord.com/developers/applications>.
2. Click **New Application** and name it `TunezBot`.
3. Open **Bot**, click **Reset Token**, and copy the token.
4. Keep the token private. Anyone with it can control your bot.
5. Open **General Information** and copy the **Application ID**. That is your `CLIENT_ID`.

## 2. Get your server ID

1. In Discord, open **User Settings > Advanced**.
2. Turn on **Developer Mode**.
3. Right-click your server icon and click **Copy Server ID**. That is one of your `GUILD_IDS`.

## 3. Configure this project

Copy `.env.example` to `.env`, then fill it in:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_IDS=your_discord_server_id_here
```

`GUILD_IDS` accepts a comma-separated list if you deploy commands to more than one server (for example a test server and your real one).

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

Requires Node.js 18 or newer. From this folder:

```powershell
npm install
npm run deploy
npm start
```

`npm install` only needs to be run once, or again after pulling changes that touch `package.json`.

Run `npm run deploy` when slash commands are added or changed. You do not need it every time.

Run `npm start` whenever you want the bot online. The PowerShell window running `npm start` must stay open. VS Code can be closed, but if the terminal closes, your computer sleeps, or your internet disconnects, the bot goes offline.

After the queue finishes, the bot waits 5 minutes for another song. If nothing starts during that time, it leaves the voice channel automatically.

While a song is playing, the bot updates its Discord activity with the song name and timestamp. The bot joins voice undeafened.

Anyone in your server who can use the slash commands can control the bot while it is online.

Join a voice channel in your server and try:

```text
/tplay never gonna give you up
/tplay https://www.youtube.com/watch?v=dQw4w9WgXcQ
/tqueue https://www.youtube.com/watch?v=dQw4w9WgXcQ
/tqueue
/tskip
/tloop
/tstoploop
/trandom
/tclear
/tstop
```

## Notes

Music extractors can break when providers change their sites. TunezBot uses `discord-player-youtubei` and `youtube-dl-exec` for YouTube playback. If YouTube links stop resolving later, update dependencies with:

```powershell
npm update
```

Your `.env` file contains your private bot token and should not be shared.
