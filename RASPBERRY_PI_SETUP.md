# Raspberry Pi 24/7 Hosting Setup

This guide is for running TunezBot on a Raspberry Pi so your Windows PC and VS Code do not need to stay open.

## Why A Pi Instead Of A Cloud VM

YouTube's bot-detection treats requests from datacenter IP ranges (AWS, Oracle Cloud, GCP, Azure) with a lot more suspicion than requests from an ordinary home internet connection. In practice that showed up as search and playback intermittently failing when this bot was hosted on AWS. A Raspberry Pi on your home network uses a residential IP, which YouTube does not flag the same way, so it's the more reliable host for a bot whose entire job is pulling audio from YouTube.

## What I bought w/ the amount 

- HighPi Raspberry Pi Case for Pi4, White (1)
- Sandisk Ultra MicroSDHC - 32GB - Class 10 - BLANK (1)
- Raspberry Pi 4 Model B/1GB (1)
- USB-C Power Supply, 5.1V 3.0A, Black, UL Listed (1)

## Whats next? Instructions still WiP, will fill out as i do the set up
