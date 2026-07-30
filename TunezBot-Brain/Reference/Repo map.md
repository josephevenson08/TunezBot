---
tags:
  - reference
---

# Repo map

What is in `TunezBot/` and what each thing is for.

## Code

| File | Purpose |
| --- | --- |
| `index.js` | The bot. ~800 lines, one process → [[Interaction Router]] |
| `deploy-commands.js` | Registers the 17 slash commands → [[Slash Command Registration]] |
| `package.json` | 8 dependencies, 3 scripts: `start`, `deploy`, `check` |
| `package-lock.json` | Exact dependency versions — commit it |
| `.env.example` | Placeholder secrets, safe to commit → [[Environment Secrets]] |
| `.gitignore` | Keeps `.env` and `node_modules/` out |

`npm run check` runs `node --check` on both JS files — a syntax check with no test framework. Cheap, catches typos before a deploy.

## Documentation

| File | Purpose |
| --- | --- |
| `README.md` | Setup and command reference. The front door. |
| `PROCESS_MAP.md` | The narrative "why" log. Canonical; this vault is its linked view. |
| `RASPBERRY_PI_SETUP.md` | Live build guide → [[Pi setup progress]] |
| `tunezbot-process-map.png` | Visual map of the build phase |
| `TunezbotFlowChartForLocal.html` | Animated CRT-terminal walkthrough of a local run → [[Local Windows run]] |

## Assets

| File | Purpose |
| --- | --- |
| `assets/tunezbot-t-avatar.svg` | The T monogram — white ground, blurple `#5865F2` outline |
| `assets/tunezbot-t-avatar.png` | Raster version for Discord |
| `assets/pixilart-drawing.png` | Hand-drawn pixel-art T, newer icon concept |

`#5865F2` is Discord blurple, and it is the site's primary accent too → [[Landing page and bot are separate problems]].

## Other

| Path | Purpose |
| --- | --- |
| `site/` | The static landing page — `index.html`, `styles.css`, `script.js` |
| `TunezBot-Brain/` | This vault → [[Start Here]] |

## Where things are documented

Three layers, deliberately not merged:

1. **`README.md`** — how to use it. For anyone.
2. **`PROCESS_MAP.md`** — why it is like this, as a narrative. Append-only.
3. **This vault** — the same reasoning, linked and navigable rather than chronological.

Related: [[Home]] · [[External links]] · [[TunezBot]]
