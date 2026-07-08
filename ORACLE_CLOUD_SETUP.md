# Oracle Cloud Free Tier 24/7 Hosting Setup

This guide is for running TunezBot on an Oracle Cloud Always Free VM so your Windows PC and VS Code do not need to stay open, and you are not depending on your home internet or power staying up.

## Why Oracle Cloud

- Always Free Ampere A1 (ARM) instances give you up to 4 OCPUs and 24GB RAM total, split across up to 4 VMs, at no cost.
- TunezBot only transcodes one audio stream at a time and has no database, so a small slice of that (1 OCPU / 6GB RAM) is far more than enough.
- Your bot's audio streaming uses Oracle's bandwidth instead of your home upload bandwidth.

Caveat: Oracle can reclaim an Always Free instance if it stays under ~20% CPU, network, and memory utilization for 7 consecutive days. In practice the bot's persistent Discord gateway connection tends to keep enough baseline activity to avoid this, but keep an eye on it for the first couple of weeks.

## 1. Create an Oracle Cloud Account

1. Go to <https://www.oracle.com/cloud/free/> and sign up.
2. A credit card is required for identity verification, but Always Free resources are not charged.
3. Once signed in, go to the Console.

## 2. Create the VM Instance

1. In the Console, go to **Compute > Instances > Create Instance**.
2. Name it `tunezbot`.
3. Under **Image and shape**, click **Edit**.
   - Image: **Canonical Ubuntu** (22.04 or newer).
   - Shape: click **Change shape**, select **Ampere** series, choose **VM.Standard.A1.Flex**, and set 1 OCPU / 6 GB memory. Confirm it's tagged **Always Free eligible**.
4. Under **Add SSH keys**, choose **Generate a key pair for me** and download both the private and public key files (or upload your own public key if you already have one).
5. Leave networking on the default VCN/subnet.
6. Click **Create**.
7. Once it's running, copy the **public IP address** from the instance details page.

## 3. Connect To The VM

Move the downloaded private key somewhere permanent, e.g. `~/.ssh/tunezbot-oracle.key`, then from PowerShell:

```powershell
ssh -i ~/.ssh/tunezbot-oracle.key ubuntu@<public_ip>
```

(Username is `ubuntu` for the Canonical Ubuntu image.)

## 4. Install System Packages

On the VM:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential ffmpeg
```

## 5. Install Node.js

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

## 6. Get The Bot Onto The VM

Since the bot is already on GitHub, clone it directly instead of copying files by hand:

```bash
git clone https://github.com/josephevenson08/TunezBot.git
cd TunezBot
npm install
```

## 7. Configure The Bot

`.env` is not in git, so create it on the VM:

```bash
nano .env
```

Add your real values:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_IDS=your_discord_server_id_here
```

## 8. Deploy Commands And Test

```bash
npm run deploy
npm start
```

In Discord, test:

```text
/tplay never gonna give you up
```

Press `Ctrl+C` after testing.

## 9. Keep It Running With PM2

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

Since the VM has its own git clone, updating is simpler than copying files over:

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
