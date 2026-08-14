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
/tstop
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

## 5. Install ffmpeg, register commands, and run

**ffmpeg has to be installed on the machine.** It is what converts the audio into the format Discord accepts, and it is not an npm package.

```powershell
winget install ffmpeg
```

On a Raspberry Pi or any Debian/Ubuntu machine:

```bash
sudo apt install -y ffmpeg
```

Confirm it's on your PATH — you should get a version number, not "not recognized":

```powershell
ffmpeg -version
```

*(This project used to bundle `ffmpeg-static` so there was nothing to install. That was removed: its Linux build is statically linked, and a statically linked glibc binary cannot resolve hostnames — so it can decode a local file but cannot open a single URL, which is all this bot ever asks it to do. It failed silently, producing a bot that announced songs and played nothing. Details in [Raspberry Pi Setup](RASPBERRY_PI_SETUP.md).)*

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

## 6. Using it in another server

The bot keeps its queue, history and artist mode separately per server, so it can sit in several at once without them interfering.

**Add a server:**

1. **Invite the bot.** Developer Portal → **OAuth2 → URL Generator**, same scopes and permissions as step 4, then open the URL and pick the server.
2. **Copy the new server ID.** Developer Mode on, right-click the server icon, **Copy Server ID**.
3. **Add it to `GUILD_IDS`** in `.env`, comma-separated:

   ```env
   GUILD_IDS=111111111111111111,222222222222222222
   ```

4. **Redeploy:**

   ```powershell
   npm run deploy
   ```

Commands appear in the new server within about a minute.

**Move to a different server** instead of adding: replace the old ID rather than appending, then redeploy.

**You do not need to restart the bot.** `index.js` only reads `DISCORD_TOKEN`. `CLIENT_ID` and `GUILD_IDS` are used solely by `deploy-commands.js`, so changing which servers get the commands doesn't affect a running bot.

**Removing a server is not just deleting the ID.** `npm run deploy` only touches servers listed in `GUILD_IDS`, so a server you drop from the list keeps its commands and the bot will still answer them while it's a member. To actually stop serving a server, kick the bot from it.

Commands are registered per-server rather than globally on purpose: they appear in about a minute that way, versus up to an hour for global registration. The trade-off is that a new server needs a redeploy.

## Notes

**Audio needs an Opus encoder.** `opusscript` is in the dependency list for this reason — without an Opus library, `@discordjs/voice` connects to voice and plays silence, with no error. For better performance you can additionally install the native encoder, which `@discordjs/voice` prefers automatically when present:

```powershell
npm install @discordjs/opus
```

It's optional, and it does not build on ARM64 with Node 24 — see [Raspberry Pi Setup](RASPBERRY_PI_SETUP.md) if you're deploying there.

**npm 11 and newer blocks package install scripts by default.** `youtube-dl-exec` uses its install script to download the yt-dlp binary, so without it the bot installs cleanly and then fails at playback. The approvals are committed in `package.json` under `allowScripts`, so a normal `npm install` handles it. If you ever see a warning about scripts "not yet covered by allowScripts", approve them by name and reinstall:

```powershell
npm approve-scripts youtube-dl-exec
rm -r node_modules
npm install
```

Music extractors can break when providers change their sites. TunezBot uses `discord-player-youtubei` and `youtube-dl-exec` for YouTube playback. If YouTube links stop resolving later, update dependencies with:

```powershell
npm update
```

Your `.env` file contains your private bot token and should not be shared.

## What is in this repo

| Path | What it is |
| --- | --- |
| `index.js` | The bot. One file, one process, all 17 commands. |
| `deploy-commands.js` | Registers the slash commands with Discord. Run it when commands change. |
| `.env.example` | Placeholder secrets. Copy to `.env` and fill in your own. |
| `site/` | The landing page — three static files, no build step. |
| `TunezBot-Brain/` | An Obsidian vault mapping how the project is wired and why. |
| `assets/` | Bot avatar and icon concepts. |
| `PROCESS_MAP.md` | The running record of the reasoning behind the decisions. |
| `RASPBERRY_PI_SETUP.md` | Hardware parts list and the Pi build, written as it happens. |
| `TunezbotFlowChartForLocal.html` | Animated walkthrough of what happens on a local run. |

### The landing page

`site/` holds `index.html`, `styles.css` and `script.js`. It is fully self-contained — no build step, no dependencies, no external assets. To deploy, drop those three files onto a static host such as [Cloudflare Drop](https://www.cloudflare.com/drop/), keeping `index.html` at the root. To preview it locally, open `site/index.html` in a browser.

### The Obsidian vault

`TunezBot-Brain/` is a linked note network — 65 notes covering the architecture, every command, the hosting decisions and the timeline. Install [Obsidian](https://obsidian.md), choose **Open folder as vault**, point it at `TunezBot-Brain`, and start at `Home.md`. Press `Ctrl+G` for the graph view.

It is not a second copy of this README. This file covers *how to use* the bot; the vault covers *why it is built this way*, including the things that went wrong.

## Where to go next?

- **[Raspberry Pi Setup](RASPBERRY_PI_SETUP.md)** — the parts I bought and how I set up the hardware to run this thing around the clock.
- **[Process Map](PROCESS_MAP.md)** — the running log of decisions and the reasoning behind them, including the AWS hosting attempt that got reverted and why.
- **`TunezBot-Brain/`** — the same reasoning as a navigable graph, if you would rather explore it by subject than by date.
