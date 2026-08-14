---
tags:
  - map
  - log
---

# Timeline MOC

Dated entries, oldest first. Append new ones; do not rewrite old ones — being able to see what you believed at the time is the whole value.

## Build phase

Idea → core playback → daily-use features → hardening → first Pi plan. Mapped visually in `tunezbot-process-map.png` in the repo root, and summarised in `PROCESS_MAP.md`. Not broken into notes here because the image is already the artifact.

## July 2026

- [[2026-07 Hosting reconsidered]] — Pi vs cloud VM, first pass. Oracle → AWS.
- [[AWS hosting postmortem]] — the EC2 attempt and the evidence that ended it. *(Filed under Decisions because it is mostly reasoning.)*
- [[2026-07-27 Pi assembly]] — parts arrive, SD card written, board boots, stops at SSH.
- [[2026-07-28 Comment pass]] — `index.js` comment revision, lines 1–53.
- [[2026-07-29 Comment pass]] — comment revision continues to line 112.
- [[2026-07-30 Comment pass into handlers]] — into the command handlers, then the project pauses for two weeks.

## August 2026

- [[2026-08-14 Site vault and Pi deployment]] — this vault, the site, and the Pi finally hosting the bot. The longest day on the project.

## The plan for the rest of July, as stated on the 26th

Worth keeping visible, because most of it took until mid-August:

1. Revisit the TunezBot code and make sure comments are up to date → **still unfinished**
2. Plan the landing page before building it → done differently than planned
3. Update the Pi setup guide as the build happens → **done**, steps 12–18
4. Test launching the bot from the Pi → **done**, and it took four separate fixes
5. Keep adding to `PROCESS_MAP.md` to show the thought process → ongoing

Item 4 was one line in the plan and turned out to be the bulk of the work. Worth noticing as an estimating habit: "test the launch" sounds like a verification step and was actually four undiscovered bugs.

Up: [[Home]]

Up: [[Home]]
