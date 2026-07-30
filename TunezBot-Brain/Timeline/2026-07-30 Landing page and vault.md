---
tags:
  - log
date: 2026-07-30
---

# 2026-07-30 — Comment pass, landing page and vault

Three things: the comment pass reached the command handlers, then this Obsidian vault, then the landing page.

## Comment pass — from the line 112 marker into the handlers

Picked up where [[2026-07-29 Comment pass]] stopped:

- `/tstopartist` → [[tstopartist]]
- `/tloop` and `/tstoploop` → [[tloop]]
- `/tskip` — the function itself, then its sub-paths: the catch, what gets shown, and the fallbacks → [[tskip]]
- `/treplay` — the function, the catch block, the string showing what is played, and error handling → [[treplay]]

Still remaining: `/trandom` through `/trelated`, the utility functions, and login.

## Why the vault came first

Deliberate ordering. The site is a *presentation* of the project's thinking — and it is much easier to present thinking that has been laid out and linked first. Building the map before the brochure meant the site's copy came from real notes rather than being invented at write-time.

## The site restart

The earlier landing page was deleted and started again from scratch. The reasoning, recorded at the time:

> the purpose of this project is to review and refresh on this process of making a project, not generating content

So the second attempt is grounded in the actual commands, the actual setup steps, and the actual hosting story → [[Landing page and bot are separate problems]].

Visual direction pulls from three references — Nothing's technical minimalism (dot-matrix type, precise labels, hard grid), Blizzard's cinematic dark hero and section rhythm, and shirtz.cool's playful motion. Landed on a **DJ booth console**: ink-navy ground, Discord blurple from the bot's own avatar, tape-deck amber, phosphor-teal oscilloscope. Ships as three static files for Cloudflare.

## Where the project stands

| Thread | Status |
| --- | --- |
| Bot code | Working. Comment pass now through `/treplay` |
| Hosting | Pi assembled and booting, blocked on network location → [[Pi setup progress]] |
| Landing page | Rebuilt, ready to deploy |
| This vault | Built |
| `PROCESS_MAP.md` | Still the canonical narrative; this vault is the linked view of it |

## Open threads

Collected in [[Open questions]] — including one real bug found while reading `index.js` for this vault.

Related: [[Timeline MOC]] · [[Home]] · [[Start Here]]
