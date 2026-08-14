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