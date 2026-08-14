---
tags:
  - decision
  - hosting
date: 2026-07
status: decided
---

# Landing page and bot are separate problems

**Decision:** treat the landing page and the bot as two unrelated hosting questions, with two different answers.

## The two problems

| | Landing page | The bot |
| --- | --- | --- |
| Nature | Static files | Persistent process |
| Needs | A CDN | An always-on machine with real binaries |
| State | None | [[Per-Guild State]] in memory |
| Host | Cloudflare, free | [[Raspberry Pi 4 build]] |
| If it goes down | Nobody notices for a while | Music stops mid-song |

They share a name and nothing else.

## Why this needed saying at all

Because "it's all one project, so it should have one deployment" is an intuitive and wrong instinct. Chasing a single unified host would have meant either paying for containers to serve static HTML, or trying to force a WebSocket into a serverless runtime → [[The bot cannot run on Cloudflare]].

Splitting them means each half gets the cheapest correct answer: a free CDN for files, a $80 computer for a process.

## The page itself

Built as a standalone `site/` folder — self-contained HTML, CSS and JS, no build step, no dependencies. It gets dropped onto Cloudflare as static files and is live in seconds.

Visual identity carried over from the DJ-booth direction: ink-navy ground, Discord blurple from the bot's own avatar, tape-deck amber, phosphor-teal oscilloscope accents, monospace display type. Grounded in the real commands and real setup steps from the README rather than placeholder marketing copy — the page has to survive being read by someone who then goes and uses the thing.

History: shipped once as a quick artifact, then deleted and restarted from scratch, because the point of this project is practising the process rather than generating output → [[2026-08-14 Site vault and Pi deployment]].

Related: [[The bot cannot run on Cloudflare]] · [[Hosting MOC]] · [[External links]]
