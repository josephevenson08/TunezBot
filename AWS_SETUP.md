# AWS 24/7 Hosting Setup

This guide is for running TunezBot on an AWS EC2 instance so your Windows PC and VS Code do not need to stay open, and you are not depending on your home internet or power staying up.

## Why AWS, and one important caveat

- TunezBot only transcodes one audio stream at a time and has no database, so a small instance (`t2.micro` or `t3.micro`, 1 vCPU / 1GB RAM) is enough.
- Your bot's audio streaming uses AWS's bandwidth instead of your home upload bandwidth.
- **Caveat:** AWS's EC2 free tier only lasts 12 months from when your AWS account was created, unlike Oracle's Always Free tier. If your account is already older than 12 months, or once those 12 months run out, a `t3.micro` running 24/7 costs roughly $7-8/month on-demand (less if you buy a Reserved Instance or Savings Plan). Check **Billing > Free Tier** in the AWS Console to see how much free-tier time you have left.

## 1. Create an AWS Account

1. Go to <https://aws.amazon.com/> and sign up if you do not already have an account.
2. A credit card is required, and normal billing applies once free-tier eligibility ends.
3. Sign in to the AWS Console.

## 2. Launch the EC2 Instance

1. In the Console, go to **EC2 > Instances > Launch instances**.
2. Name: `tunezbot`.
3. **Application and OS Images**: choose **Ubuntu Server 24.04 LTS**, make sure it's marked **Free tier eligible**.
4. **Instance type**: `t2.micro` or `t3.micro`, whichever shows **Free tier eligible** for your account/region.
5. **Key pair**: click **Create new key pair**, name it `tunezbot-key`, type **RSA**, format **.pem**. Download and save the file.
6. **Network settings**: leave "Allow SSH traffic from" set to **My IP**. No other inbound ports are needed — the bot only makes outbound connections to Discord and YouTube.
7. **Configure storage**: default 8GB gp3 is fine (free tier covers up to 30GB).
8. Click **Launch instance**.
9. Once it's running, open the instance and copy its **Public IPv4 address**.

## 3. Connect To The Instance

Move the downloaded key somewhere permanent:

```powershell
mkdir -Force "$env:USERPROFILE\.ssh"
Move-Item "$env:USERPROFILE\Downloads\tunezbot-key.pem" "$env:USERPROFILE\.ssh\tunezbot-key.pem"
```

On Windows, restrict the key's permissions so SSH will accept it. Use `$env:USERPROFILE`, not `~` — `icacls` is a plain Windows executable and does not expand `~` as your home folder the way PowerShell cmdlets do:

```powershell
icacls "$env:USERPROFILE\.ssh\tunezbot-key.pem" /inheritance:r
icacls "$env:USERPROFILE\.ssh\tunezbot-key.pem" /grant:r "$($env:USERNAME):(R)"
```

Then connect from PowerShell:

```powershell
ssh -i "$env:USERPROFILE\.ssh\tunezbot-key.pem" ubuntu@<public_ip>
```

(Username is `ubuntu` for the Ubuntu AMI.)

## 4. Install System Packages

On the instance:

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

## 6. Get The Bot Onto The Instance

Since the bot is already on GitHub, clone it directly:

```bash
git clone https://github.com/josephevenson08/TunezBot.git
cd TunezBot
npm install
```

## 7. Configure The Bot

`.env` is not in git, so create it on the instance:

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

## A Note On The Public IP

The instance's public IP can change if you ever stop and start it (a reboot alone keeps the same IP). This does not affect the bot itself, since it only makes outbound connections — it just means you may need to look up the new IP the next time you SSH in. If you want a fixed IP, allocate an **Elastic IP** in the EC2 console and associate it with the instance; it's free as long as it stays attached to a running instance.

## Updating The Bot Later

Since the instance has its own git clone, updating is a simple pull:

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
