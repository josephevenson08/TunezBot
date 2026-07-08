# Raspberry Pi 24/7 Hosting Setup

This guide is for running TunezBot on a Raspberry Pi so your Windows PC and VS Code do not need to stay open.

## Why A Pi Instead Of A Cloud VM

YouTube's bot-detection treats requests from datacenter IP ranges (AWS, Oracle Cloud, GCP, Azure) with a lot more suspicion than requests from an ordinary home internet connection. In practice that showed up as search and playback intermittently failing when this bot was hosted on AWS. A Raspberry Pi on your home network uses a residential IP, which YouTube does not flag the same way, so it's the more reliable host for a bot whose entire job is pulling audio from YouTube.

## What To Buy

Recommended minimum:

- Raspberry Pi 4 Model B, 2GB or 4GB
- Official Raspberry Pi power supply
- 32GB or larger microSD card
- Case with cooling
- Ethernet cable, if your router is nearby

Better if buying new:

- Raspberry Pi 5, 4GB
- Official Raspberry Pi 27W USB-C power supply
- Pi 5 case with active cooler
- 32GB or larger microSD card
- Ethernet cable, if possible

Useful links:

- Raspberry Pi 4 Model B: https://www.raspberrypi.com/products/raspberry-pi-4-model-b/
- Raspberry Pi 5: https://www.raspberrypi.com/products/raspberry-pi-5/
- Raspberry Pi Imager: https://www.raspberrypi.com/software/
- Raspberry Pi getting started guide: https://www.raspberrypi.com/documentation/computers/getting-started.html
- CanaKit Pi 4 2GB options: https://www.canakit.com/raspberry-pi-4-2gb.html
- CanaKit Pi 5 options/accessories: https://www.canakit.com/raspberry-pi-5

## 1. Flash Raspberry Pi OS

1. Install Raspberry Pi Imager on your Windows PC.
2. Insert the microSD card.
3. Choose **Raspberry Pi OS Lite 64-bit**.
4. Open the settings/advanced options before writing.
5. Set a username and password.
6. Set your Wi-Fi network if you will use Wi-Fi.
7. Enable SSH.
8. Write the OS to the card.
9. Put the microSD card in the Pi and power it on.

## 2. Connect To The Pi

From PowerShell on your Windows PC:

```powershell
ssh your_pi_username@raspberrypi.local
```

If that does not work, find the Pi IP address from your router, then:

```powershell
ssh your_pi_username@192.168.1.123
```

## 3. Install System Packages

On the Pi:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential ffmpeg
```

## 4. Install Node.js

Install `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
```

Close and reconnect SSH, then:

```bash
nvm install --lts
nvm use --lts
node -v
npm -v
```

## 5. Get The Bot Onto The Pi

Since the bot is already on GitHub, clone it directly:

```bash
git clone https://github.com/josephevenson08/TunezBot.git
cd TunezBot
npm install
```

## 6. Configure The Bot

`.env` is not in git, so create it on the Pi:

```bash
nano .env
```

Add your real values:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_IDS=your_discord_server_id_here
```

## 7. Deploy Commands And Test

```bash
npm run deploy
npm start
```

In Discord, test:

```text
/tplay never gonna give you up
```

Press `Ctrl+C` after testing.

## 8. Keep It Running With PM2

Install PM2:

```bash
npm install -g pm2
```

Start the bot:

```bash
pm2 start index.js --name tunezbot
pm2 save
pm2 startup
```

`pm2 startup` prints one more command. Copy and run that command exactly.

Useful PM2 commands:

```bash
pm2 status
pm2 logs tunezbot
pm2 restart tunezbot
pm2 stop tunezbot
```

## Updating The Bot Later

Since the Pi has its own git clone, updating is a simple pull:

```bash
cd ~/TunezBot
git pull
npm install
pm2 restart tunezbot
```

Only run this if slash commands changed:

```bash
npm run deploy
```
