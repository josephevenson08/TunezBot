---
tags:
  - decision
  - hosting
date: 2026-07
status: decided
---

# Pi over cloud VM

**Decision:** run the bot on a Raspberry Pi 4 at home instead of on a cloud VM.

## What was weighed

| | Cloud VM | Raspberry Pi |
| --- | --- | --- |
| Uptime | Independent of home power/internet | Dies with the house |
| Cost | Free tier, then real money | ~$80 once, then pennies of electricity |
| Setup | SSH and go | Buy, assemble, flash, configure |
| **YouTube access** | **Flagged datacenter IP** | **Residential IP** |
| Learning | Standard, transferable | Hardware you can point at |

The first two rows favour the cloud. That is why this was decided *for* the cloud twice before being decided against it.

## The reversal

The bottom-line argument was originally uptime: a Pi depends on home power and internet staying up, a VM does not. That is still true. It just turned out to be the second-most-important variable, because a VM with perfect uptime that cannot reliably search YouTube has *worse* effective uptime than a Pi that occasionally reboots.

The evidence is in [[AWS hosting postmortem]]; the mechanism is [[Datacenter IP reputation]].

## What it costs

Real trade-offs, accepted knowingly:

- A power cut or ISP outage takes the bot down, with no failover
- No snapshots, no one-click rebuild — a corrupted SD card means reflashing
- Home upload bandwidth is now in the path of every stream
- Physical hardware to keep track of

For a bot serving one server of friends, all four are survivable. For anything with users who would notice, none of them would be.

## The route not taken

Oracle Cloud Always Free was the first plan — a genuinely permanent free ARM VM, unlike AWS's 12-month window. It was swapped for AWS on name recognition before ever being deployed. Since the failure was about IP ranges rather than the specific provider, **Oracle would almost certainly have failed the same way.** Switching providers was never going to be the fix.

Related: [[Hosting MOC]] · [[Raspberry Pi 4 build]] · [[The bot cannot run on Cloudflare]]
