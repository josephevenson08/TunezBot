---
tags:
  - hosting
---

# Parts list

Ordered from **pishop.us** in late July 2026.

| Part | Qty |
| --- | --- |
| Raspberry Pi 4 Model B / 1GB | 1 |
| HighPi Raspberry Pi Case for Pi4, White | 1 |
| SanDisk Ultra microSDHC 32GB Class 10 (blank) | 1 |
| USB-C Power Supply, 5.1V 3.0A, Black, UL Listed | 1 |

## Why pishop and not Amazon

Amazon was sold out. pishop.us is a specialist supplier and had everything in stock.

The general point, worth keeping: **check compatibility yourself and size the hardware to the actual workload.** This project does not draw much, so the 1GB board is right — paying for 8GB would buy nothing → [[Raspberry Pi 4 build]].

## The three parts people skip

**The power supply.** 5.1V 3.0A, UL listed — not a spare phone charger. An underpowered Pi does not fail cleanly; it browns out under load, corrupts the SD card, and produces intermittent problems that look like software bugs. Buying the official-spec supply removes an entire class of mystery.

**The case.** A bare board on a desk collects dust and shorts on anything metal. This one runs continuously, so it needs to be enclosed.

**The card.** Class 10, 32GB. Everything runs off it, including the OS. It is the most likely component to fail — which is a background reason [[State stays in memory]] is the right call: nothing is being written to it constantly.

Related: [[Raspberry Pi 4 build]] · [[Pi setup progress]]
