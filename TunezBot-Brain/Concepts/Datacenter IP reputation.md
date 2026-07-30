---
tags:
  - concept
  - hosting
---

# Datacenter IP reputation

The single most important thing learned on this project, and the one least likely to appear in any tutorial.

## The finding

**YouTube treats requests from cloud provider IP ranges differently from requests from home internet connections.** AWS, GCP, Azure, Oracle and DigitalOcean ranges are all well-documented as flagged. A residential ISP address is not.

It is not a block. It is a graduated suspicion — some endpoints work, some fail, and which is which depends on how heavily guarded the endpoint is and how many requests you have made recently.

## How it presented

Not as "403 Forbidden." As **intermittent, inconsistent failure**:

- `/tplay <direct URL>` — worked, 3 for 3
- `/tplay <search text>` — failed repeatedly, on different songs, sometimes on both attempt and retry
- The same URL that failed via search had been resolved correctly by [[yt-dlp]] moments earlier

Everything about that pattern reads like a bug in your own code. It was not.

## Why the search path specifically

The direct-URL path fires 2 requests at YouTube. The search path fires 3 — one extra search call immediately before the metadata and stream calls. On a flagged IP, that extra request was enough to trip something the shorter path did not. Compounded by [[Innertube Search]] hitting a more guarded endpoint than a plain video fetch.

Request *volume* and request *reputation* multiply. Neither alone was fatal.

## What follows from it

- Hosting moved home → [[Pi over cloud VM]]
- Search moved to yt-dlp → [[Search through yt-dlp not Innertube]]
- Full evidence → [[AWS hosting postmortem]]

## The transferable version

**Some workloads are IP-reputation-sensitive, and no amount of code quality fixes that.** Before assuming a cloud VM is a strictly better host than a machine at home, ask what the workload talks to and how that service feels about datacenters. For anything scraping or streaming from a consumer platform, a residential IP is a genuine technical advantage — which is the exact opposite of the usual advice.

Related: [[Hosting MOC]] · [[Raspberry Pi 4 build]] · [[Retry Wrapper]]
