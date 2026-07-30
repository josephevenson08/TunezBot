---
tags:
  - map
---

# Decisions MOC

The reasoning layer. Each note holds a choice, the option it beat, and the evidence — so none of it gets relitigated from scratch later.

## Hosting

- [[Pi over cloud VM]] — residential IP beats datacenter IP for this specific workload
- [[AWS hosting postmortem]] — the attempt that produced that conclusion, in full
- [[The bot cannot run on Cloudflare]] — persistent process ≠ serverless request handler
- [[Landing page and bot are separate problems]] — one of them *does* fit Cloudflare

## Code

- [[Search through yt-dlp not Innertube]] — swap a beta search path for a mature one
- [[Retry once after a short delay]] — absorb transient extraction failures
- [[tplay preserves the queue]] — "play this now" should not mean "throw away my queue"
- [[State stays in memory]] — no database for a single-server bot
- [[Guild-scoped command deploy]] — instant registration during development

## The pattern across all of them

Three of these decisions — [[Search through yt-dlp not Innertube]], [[Retry once after a short delay]], [[Pi over cloud VM]] — came out of the *same* investigation. Two were kept after the third was reverted, because they turned out to be improvements independent of the environment that prompted them.

Worth remembering as a habit: when you back out of an experiment, sort the changes into "this was scaffolding for the experiment" and "this was a real improvement I only noticed because of the experiment." Throwing out both is the easy mistake.

Up: [[Home]]
