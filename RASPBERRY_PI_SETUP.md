# Raspberry Pi 24/7 Hosting Setup

This guide is for running TunezBot on a Raspberry Pi so your Windows PC and VS Code do not need to stay open.

## Why A Pi Instead Of A Cloud VM

YouTube's bot-detection treats requests from datacenter IP ranges (AWS, Oracle Cloud, GCP, Azure) with a lot more suspicion than requests from an ordinary home internet connection. In practice that showed up as search and playback intermittently failing when this bot was hosted on AWS. A Raspberry Pi on your home network uses a residential IP, which YouTube does not flag the same way, so it's the more reliable host for a bot whose entire job is pulling audio from YouTube.

## What I bought w/ the amount 

- HighPi Raspberry Pi Case for Pi4, White (1)
- Sandisk Ultra MicroSDHC - 32GB - Class 10 - BLANK (1)
- Raspberry Pi 4 Model B/1GB (1)
- USB-C Power Supply, 5.1V 3.0A, Black, UL Listed (1)

## Where did I order from?
- I tried ordering off amazon but the were sold out so the list above is in reference to https://www.pishop.us/
- I went with this site because nothing was availablr on amazon at the time, you can order whatever you want, just double check compatiability between parts and make sure you get enough hardware capability for what you are going to use it for, since this project will not be drawing out usage so much, this is why I went with what I went.

## Steps I took once I had the Parts ordered
1. Pulled up the .env file so that I have the Discord_token,client_id, and guild_ids on deck
2. Downloaded and installed Raspberry Pu Imager from https://www.raspberrypi.com/software/ for Windows and accepted default settings.
3. Opened and inserted my 32GB microSD card into my laptop
4. 
- Opened Raspberry Pi Imager and followed setup guide
- I selected Raspberry Pi 4 for Device 
- Raspberry Pi OS (Other) into Raspberry Pi OS Lite (64-bit) for OS
- The SDHC Card that I interserted for the Storage
- TunezBot as the hostname
- Selected my personal settings for Localisation
- Set my username and password accordingly
- Left the wifi blank because I went with Ethernet
- Toggled the Enable SSH to on with "Use password authentication" option
- Left the "Enable Raspberry Pi Connect" to toggled off
- Pressed Write on the Write Image screen
- Finally pressed "I understand, erase and write" because this is a new SD card.
5. Wait for the writing in process to finish. (I did not press the Skip Verifitication button)
6. Eject the microSD from the PC safely.
7. Take off the case topper and insert the microSD card into the Pi board.
8. Put the board into the case that was ordered and put the lid to the case back on.
9. Plug the ethernet into the ethernet port.
10. Plug in the USB-C power supply and wait around 2 minutes to get a fully boot or at least thats what I did.
11. I opened powershell on your windows PC and typed in "ssh myusername@tunezbot.local", fill in yhe "myusername" with the username you set.
- Had to stop here the first time because I was not on my own internet. The ".local" name only works when your PC and the Pi are on the same network, so this step has to happen at home.

12. Got back on my own internet and connected.
- The username I set in the Imager is **josephevenson**, so the command is `ssh josephevenson@tunezbot.local`. Writing it down here because I forgot it and had to guess at it. The password does NOT go in this file.
- First connection asks "The authenticity of host ... can't be established" and shows a fingerprint. Type "yes". That is just my laptop saving the Pi's identity so it can warn me if it ever changes, and it only happens once.
- The password prompt shows nothing at all while you type, no dots or stars. That is normal, it is not frozen.
- Success looks like the prompt changing to `josephevenson@TunezBot:~ $`. From that point every command runs on the Pi, not on my laptop. Type `exit` to come back.
- On my network tunezbot.local resolved to an IPv6 address instead of the usual 192.168.x.x. That is fine, it still works.
- If it ever fails to resolve, find the Pi's IP on the router's connected devices page and use `ssh josephevenson@<that ip>` instead.
- If I had not been able to guess the username, it is recoverable by putting the SD card back in the PC and reading custom.toml or userconf.txt on the small bootfs partition. Windows will offer to format the other partition when the card goes in — do NOT do that, that is the Linux install.

13. Updated the OS before installing anything.

```bash
sudo apt update && sudo apt full-upgrade -y
```

- Asks for the password again. That is `sudo`, not SSH.
- If it pulls a new kernel, `sudo reboot`, wait about 30 seconds, and SSH back in.

14. Installed what the bot needs.

```bash
sudo apt install -y git python3 ffmpeg
```

- **git** to clone the repo.
- **python3** because yt-dlp is a Python program. The binary npm downloads is a Python zipapp and will not run without it.
- **ffmpeg** — I thought this was belt-and-braces since the project ships `ffmpeg-static`. It turned out to be the only ffmpeg that works here. See the problems section below.

Then Node, from NodeSource rather than nvm:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v && which node
```

- I used nvm on the AWS attempt. NodeSource is the better choice here because it puts node at `/usr/bin/node`, and the systemd service in step 18 needs an absolute path that does not change every time Node updates. nvm hides node inside a versioned folder in my home directory and systemd cannot find it.
- Got v24.19.0 and `/usr/bin/node`. Write that path down, step 18 needs it.
- If `setup_24.x` 404s, use `setup_22.x`. Anything 18 or newer runs this bot.

15. Cloned the repo and installed the dependencies.

```bash
cd ~ && git clone https://github.com/josephevenson08/TunezBot.git && cd TunezBot
free -h
npm install
```

- `free -h` first because this is a 1GB board and `npm install` is the heaviest moment. Mine showed 748Mi available plus 904Mi of swap, which is plenty. The number to read is **available**, not **free** — the buff/cache column is memory the kernel hands back the moment something needs it.
- If `npm install` prints `Killed` or just stops dead, that is the out-of-memory killer, not a broken package. Raise swap with `sudo dphys-swapfile swapoff`, set `CONF_SWAPSIZE=1024` in `/etc/dphys-swapfile`, then `sudo dphys-swapfile setup && sudo dphys-swapfile swapon` and install again.
- Do NOT run npm with sudo. It leaves root-owned files in node_modules that break later updates.

16. Made the `.env` file.

```bash
nano .env
```

Four lines:

```
DISCORD_TOKEN=your token
CLIENT_ID=your application id
GUILD_IDS=your server id
FFMPEG_PATH=/usr/bin/ffmpeg
```

`Ctrl+O`, Enter, `Ctrl+X` to save and exit.

- The token is the only one of the three you cannot look up again. Discord shows it once. If you do not have it saved, go to the Developer Portal, Bot tab, **Reset Token**, and copy it right then. Resetting is free and it invalidates the old one.
- CLIENT_ID is the Application ID on the General Information page.
- GUILD_IDS is the server ID. Turn on Developer Mode in Discord settings under Advanced, then right click the server icon and Copy Server ID.
- FFMPEG_PATH is a Pi-specific line and is explained in the problems section.
- Check it worked with `ls -la .env && git status --short`. `.env` should exist and git should say nothing about it. If git lists `.env` as untracked, stop — the token is one `git add -A` away from being public.

17. Registered the commands and ran it.

```bash
npm run deploy
npm start
```

- `npm run deploy` should say it deployed 17 commands to 1 server.
- `npm start` should print `Logged in as TunezBot#....`
- **Wait for that line before typing anything in Discord.** Discord only gives the bot 3 seconds to acknowledge a command, so a `/tplay` typed before the bot is listening arrives already expired and comes back as `DiscordAPIError[10062] Unknown interaction`. I lost a while to this thinking it was a real bug.
- Then join a voice channel first, then run `/tplay never gonna give you up`.

18. Made it survive reboots with systemd. This is the step that turns "running on a Pi" into "hosted on a Pi".

Stop the manually started bot with `Ctrl+C` first, otherwise there will be two copies running and they will fight over every command.

```bash
sudo nano /etc/systemd/system/tunezbot.service
```

```
[Unit]
Description=TunezBot Discord music bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=josephevenson
WorkingDirectory=/home/josephevenson/TunezBot
ExecStart=/usr/bin/node /home/josephevenson/TunezBot/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable tunezbot && sudo systemctl start tunezbot
systemctl status tunezbot
```

Want to see `enabled` and `active (running)`. Press `q` to get out of that screen.

The three lines that matter:

- **WorkingDirectory** — dotenv reads `.env` relative to the working directory. Without this line systemd starts in `/` and none of the four values load.
- **User** — runs as me, not root. node_modules belongs to me and a music bot has no reason to be root.
- **Restart=always** — the actual point. Crash, power cut, reboot, it comes back on its own. Paired with `enable` it also starts at boot with nobody logged in.

Watching the log, this replaces the `npm start` output:

```bash
journalctl -u tunezbot -f
```

`Ctrl+C` leaves the log view without stopping the bot.

Updating the bot from now on:

```bash
cd ~/TunezBot && git pull && sudo systemctl restart tunezbot
```

Final test: close the SSH window completely, then run `/tplay` from Discord. Music with no terminal open anywhere means it is genuinely hosted.

**Then do the power-cut test, because it is the one that actually proves it.** Unplug the Pi, plug it back in, wait about two minutes, and run `/tplay` without touching a keyboard. I did this and the song played. Nothing was logged into, no terminal was open, and nothing was started by hand — systemd brought it back on its own.

That single test covers every line of the unit file at once: `enable` started it at boot with nobody logged in, `After=network-online.target` made it wait for the network instead of failing to reach Discord, and `WorkingDirectory` meant dotenv still found `.env` on a cold boot. If any one of those were wrong, the bot would be silently offline right now and I would not find out until the next time I wanted music.

## Problems I hit on the Pi that never happened on Windows

All three of these only show up on a clean machine on ARM. None of them are in the README because nothing on x64 ever hits them.

**1. npm blocked the install scripts, so two binaries never downloaded.**

`npm install` said it succeeded, but ended with a warning that `ffmpeg-static` and `youtube-dl-exec` had install scripts "not yet covered by allowScripts". npm 11 does not run package install scripts by default anymore. Those two scripts are exactly what download the yt-dlp and ffmpeg binaries, so neither existed. The bot would have started fine and failed on the first `/tplay` with a confusing file-not-found.

Fix, one package at a time — `npm approve-scripts --allow-scripts-pending` only lists them, it does not approve anything:

```bash
npm approve-scripts youtube-dl-exec
npm approve-scripts ffmpeg-static
npm approve-scripts esbuild
rm -rf node_modules && npm install
```

The approvals get written into `package.json`, so this is now committed and nobody cloning this repo has to do it again.

Check it worked:

```bash
ls -la node_modules/youtube-dl-exec/bin/ node_modules/ffmpeg-static/
```

yt-dlp should be about 3MB and ffmpeg about 51MB, both executable.

**2. No Opus encoder, so the bot played silence.**

Tracks resolved, the bot announced "Now playing", and then "Queue finished" landed immediately with no sound and nothing in the terminal. `@discordjs/voice` cannot encode audio without an Opus library and `package.json` never listed one.

The diagnostic that names it:

```bash
node -e "console.log(require('@discordjs/voice').generateDependencyReport())"
```

The native encoder `@discordjs/opus` will not install on this board: there is no prebuilt binary for ARM64 on Node 24, and the source build fails compiling an ARM NEON file (`implicit declaration of function 'celt_inner_prod_neon'`). That is upstream, not fixable from here.

The pure-JavaScript encoder works with no compiler involved:

```bash
npm install opusscript
```

It uses more CPU than the native one, which is fine for the single stream this bot ever plays. If it ever is not, dropping to Node 22 would probably get a prebuilt binary.

**3. ffmpeg-static cannot resolve hostnames.**

Same silent symptom. Running the pipeline by hand is what found it:

```bash
URL=$(./node_modules/youtube-dl-exec/bin/yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
./node_modules/ffmpeg-static/ffmpeg -i "$URL" -t 5 -f null -
```

```
Failed to resolve hostname rr1---sn-vgqsrnlk.googlevideo.com: System error
```

`ffmpeg-static` ships a statically linked binary, and a statically linked glibc cannot use NSS, which is how glibc looks up hostnames. It can decode a local file perfectly and cannot reach a single URL. The system ffmpeg from step 14 is dynamically linked and works.

**Correction — FFMPEG_PATH does not work.** I first "fixed" this by putting `FFMPEG_PATH=/usr/bin/ffmpeg` in `.env`, on the assumption that prism-media checks that variable first. It does not. prism-media 1.3.5 looks for `ffmpeg-static` **before** anything else and never reads `FFMPEG_PATH` at all. Proved it:

```bash
node -r dotenv/config -e "console.log(process.env.FFMPEG_PATH);const {FFmpeg}=require('prism-media');console.log(FFmpeg.getInfo().command)"
```

```
/usr/bin/ffmpeg
/home/josephevenson/TunezBot/node_modules/ffmpeg-static/ffmpeg
```

The env var was set and being ignored. The bot used the broken binary for hours while I thought this was solved.

Temporary patch on the pi, which `npm install` will undo:

```bash
mv node_modules/ffmpeg-static/ffmpeg node_modules/ffmpeg-static/ffmpeg.static-broken
ln -s /usr/bin/ffmpeg node_modules/ffmpeg-static/ffmpeg
```

**Done — `ffmpeg-static` has been removed from package.json entirely.** Every platform now uses an OS-installed ffmpeg (`sudo apt install ffmpeg` here, `winget install ffmpeg` on Windows). With the package gone, prism-media falls through to `ffmpeg` on PATH, which is the working one. The symlink workaround above is no longer needed — `git pull && npm install` removes the package and the symlink with it.

The lesson: setting a config value is not the same as the program reading it. `FFmpeg.getInfo().command` was one line and would have caught this immediately.

**4. YouTube's JavaScript challenge (this one is not Pi-specific).**

With the system ffmpeg the error changed from a DNS failure to `403 Forbidden`. YouTube protects playback URLs with a JavaScript challenge and yt-dlp needs a JS engine to solve it. Without one it falls back to a client whose URLs only work for yt-dlp's own headers, so ffmpeg gets refused. yt-dlp had been printing a warning about this the whole time and `noWarnings: true` in the code was hiding it.

**`jsRuntimes: 'node'` is required and it does work.** I wrote a correction here earlier saying it was inert and never reached yt-dlp. **That correction was itself wrong** — I am leaving this note rather than quietly deleting it, because the way I got it wrong is the useful part.

I "tested" the flag by asking for a URL with and without it and comparing the `c=` parameter. Both said `ANDROID_VR`, so I concluded the flag did nothing. But `c=` is `ANDROID_VR` either way — that test could not distinguish anything, and I drew a confident conclusion from it regardless.

Testing the thing that actually matters, whether the download succeeds:

```
without flag: FAILED
with flag:    OK    (3,433,755 bytes)
```

The flag is load-bearing. Without it YouTube answers 403.

**Lesson:** a test that cannot fail is not a test. Check that your discriminator actually discriminates before you trust what it tells you.

**5. DNS was the real problem, and it caused most of the day.**

Every uncached hostname lookup took exactly 5.029 seconds — the glibc resolver timeout:

```bash
for i in 1 2 3; do echo -n "lookup $i: "; ( time getent ahosts discord.com >/dev/null ) 2>&1 | grep real; sleep 12; done
```

```
lookup 1: 0.017s   <- cached
lookup 2: 5.029s
lookup 3: 5.029s
```

Split by family and each query is fast on its own:

```
v4: 0.063s
v6: 0.022s
both together: 5.029s
```

glibc sends the A and AAAA queries in parallel on one socket, and this router mishandles that, so the resolver waits out the full timeout every time. Discord allows 3 seconds to acknowledge a command, so `deferReply` was dead before its request left the pi. Same for voice endpoints, which is where the `AbortError` came from.

Fix, through NetworkManager because it regenerates `/etc/resolv.conf`:

```bash
sudo nmcli con mod "Wired connection 1" ipv4.dns-options "single-request-reopen"
sudo systemctl restart NetworkManager
```

Lookups went from 5.029s to 0.041s. `single-request-reopen` makes glibc send the two queries sequentially on separate sockets instead of in parallel on one.

**This is the most transferable thing on this page.** "Works, then does not, then does" on a home network is very often DNS, and `getent ahosts` versus `ahostsv4`/`ahostsv6` catches it in thirty seconds.

**6. The silent failure that cost the most: handing ffmpeg a URL.**

`createYoutubeStream` used to ask yt-dlp for a URL and give that URL to ffmpeg. yt-dlp can fetch its own URL fine, but ffmpeg fetching it is a **separate request that does not inherit yt-dlp's session**, and YouTube answers it 403. ffmpeg produced zero bytes, and discord-player cannot tell an empty stream from a track that finished — so the bot announced the song, said "Queue finished" immediately, and logged nothing at all.

Three tests, same video, same minute:

```
yt-dlp downloads it itself      works, 3,433,755 bytes
yt-dlp --get-url then ffmpeg    403 Forbidden
yt-dlp -o -  piped              works, 3,433,755 bytes
```

So the bot now pipes: yt-dlp writes audio to stdout and ffmpeg reads bytes off a pipe, never talking to YouTube at all. That removed the 403, the URL expiry, the IP binding **and** the stall — resolving a URL blocked for 5–9 seconds before anything could start, and spawning a pipe takes 11ms.

**7. YouTube refuses two simultaneous fetches from one address.**

A consequence of piping. Asking for a URL meant yt-dlp ran for five seconds and exited; piping means it stays connected for the whole song, so tracks overlap where they never used to. Measured:

```
one fetch alone       4,000,874 bytes
two started together  0 bytes and 0 bytes
```

It takes down *both*, not just the later one. This is why queue advances were the flakiest thing of all.

First fix was a retry: if a stream produces no bytes at all, spawn it again after 2 seconds, up to three attempts. It worked — but the log then showed attempt 1 failing on **every single track** rather than occasionally, which meant whatever it collided with was always present.

It was the previous song's yt-dlp, still connected. So the real fix is to kill it: this bot plays one thing at a time, so any yt-dlp still running when a new track starts belongs to the song we just left and is doing nothing but holding a connection against us.

That took a track from ~14 seconds to audio (6s wasted extraction + 2s backoff + 6s real extraction) back down to ~6, and turned the retry into what it was meant to be — a safety net for the occasional genuine failure, rather than a toll paid on every track.

**Worth noticing as a pattern:** "fails occasionally" and "fails every time" are different diagnoses. A retry that always fires is not resilience, it is a fixed cost hiding a bug. If a safety net catches everything, look at why everything is falling.

## Moving the bot to another server, or adding a second one

The bot is per-server by design, and all of its state — queue, history, artist mode — is keyed by server ID, so it can sit in more than one at a time without them interfering.

**1. Invite the bot to the new server.**

Developer Portal → your application → **OAuth2** → **URL Generator**. Scopes `bot` and `applications.commands`. Permissions: View Channels, Send Messages, Connect, Speak, Use Voice Activity. Open the generated URL and pick the server. You need permission to add bots to that server.

**2. Get the new server's ID.**

Discord → Settings → Advanced → Developer Mode on. Right click the server icon → Copy Server ID.

**3. Add it to GUILD_IDS.**

```bash
nano ~/TunezBot/.env
```

Comma separated, no spaces needed:

```
GUILD_IDS=111111111111111111,222222222222222222
```

To *move* rather than add, just replace the old ID.

**4. Redeploy the commands.**

```bash
cd ~/TunezBot && npm run deploy
```

Commands show up in the new server within about a minute.

**No restart is needed.** `index.js` only ever reads `DISCORD_TOKEN`; `CLIENT_ID` and `GUILD_IDS` are used solely by `deploy-commands.js`. So changing which servers the commands go to does not affect the running bot at all.

**The gotcha when removing a server.** Deleting an ID from `GUILD_IDS` does not remove the commands from that server. The deploy only touches servers in the list, so a server you dropped keeps its commands and the bot will still answer them as long as it is a member. To actually stop serving a server, kick the bot from it.

Also worth knowing: commands are registered per server on purpose. They appear in about a minute that way, versus up to an hour for global registration. The trade is that a new server needs a redeploy, which for a personal bot is the right way round.

## Shutting the Pi down

```bash
sudo shutdown -h now
```

Pulling the power on a running Pi risks corrupting the SD card that holds the whole OS. With systemd set up, a reboot is fine — the bot comes back on its own.