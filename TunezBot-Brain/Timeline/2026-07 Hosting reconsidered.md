---
tags:
  - log
  - hosting
date: 2026-07
---

# 2026-07 — Hosting reconsidered

Before buying any Pi hardware, revisited whether a cloud VM was actually the better call.

## The concern that started it

A Pi depends on home power and home internet staying up. A cloud VM does not. For something meant to be available whenever anyone wants music, that looked like the deciding factor.

## Oracle Cloud Always Free

First candidate: a permanently free ARM VM, no hardware to buy. Genuinely free forever rather than free for a while. A full setup guide was written for it.

## Switched to AWS EC2

Reconsidered shortly after in favour of AWS, mainly for being the more standard and recognisable platform — the kind of thing worth having actually done.

The guide was rewritten around AWS's free tier, with one thing flagged **upfront**: AWS's free tier is **12 months from account creation**, not free forever like Oracle's. Writing that down at the time rather than discovering it later is the useful part — it is a real cost difference, not a technical one.

## What happened next

The AWS deployment worked, right up until the first `/tplay` → [[AWS hosting postmortem]].

## The bit worth remembering

Both cloud options were evaluated on uptime, cost, and familiarity. **Neither evaluation asked how YouTube would treat the IP address** — which turned out to be the variable that decided everything → [[Datacenter IP reputation]].

The lesson is not "clouds are bad." It is that the comparison table had the wrong columns, and that only became visible after deploying.

Related: [[Pi over cloud VM]] · [[Timeline MOC]] · [[Hosting MOC]]
