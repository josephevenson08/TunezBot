---
tags:
  - map
---

# Start Here

This folder is an **Obsidian vault** — a thought network for the TunezBot project. It is not documentation of *what the code does* (the code and `README.md` already do that). It is a map of **how the project is wired together and why it ended up this way**.

## Opening it

1. Install Obsidian → <https://obsidian.md>
2. Open Obsidian → **Open folder as vault**
3. Pick the `TunezBot-Brain` folder (the one this file is in)
4. Open [[Home]]
5. Press `Ctrl+G` for the **graph view** — that is the "brain"

The graph is pre-configured with colour groups, so nodes are grouped by type on first open:

| Colour | Type | Tag |
| --- | --- | --- |
| Blurple | Slash commands | `#command` |
| Teal | Concepts / moving parts | `#concept` |
| Amber | Decisions and their reasoning | `#decision` |
| Red | Hosting and hardware | `#hosting` |
| White | Maps of content | `#map` |
| Grey | Dated log entries | `#log` |

## How it is organised

- **Maps/** — hub notes. Start at one of these, not at a leaf.
- **Concepts/** — one moving part per note. The Gateway, the queue, artist mode, IP reputation.
- **Commands/** — one note per slash command. All 17 of them.
- **Decisions/** — a choice that was made, what it was weighed against, and why. These are the notes worth re-reading.
- **Hosting/** — the Pi build, the parts, where the setup got to.
- **Timeline/** — dated entries. Append, never rewrite.
- **Reference/** — repo file map, external links, unresolved questions.

## Conventions

- Every note answers one question and links out to the notes it depends on.
- Links are `[[wikilinks]]`. A link to a note that does not exist yet is a *deliberate* placeholder — it shows up in the graph as an unresolved node, which is a to-do list you can see.
- Decision notes keep the losing option in them. The point is not to be right, it is to not relitigate the same thing in three months.
- Dated notes get an absolute date in the title. "Last week" is useless a year from now.

Related: [[Home]] · [[Repo map]] · [[Open questions]]
