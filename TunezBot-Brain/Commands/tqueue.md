---
tags:
  - command
  - queue
aliases:
  - /tqueue
---

# /tqueue

Two commands in one, split on whether the optional `query` was given.

## `/tqueue <song>` — add to the end

Requires something already playing:

> Start a song with `/tplay` first, then use `/tqueue` to add the next one.

That restriction is a design choice, not a limitation. `/tplay` starts, `/tqueue` extends — keeping the two verbs distinct means neither is ambiguous about whether it will interrupt.

Otherwise the same path as [[tplay]]: voice gate → defer → [[Query Normalization]] → [[Retry Wrapper]] → confirm.

## `/tqueue` — show the queue

```
Now: **Daft Punk - One More Time**
1. Justice - Genesis
2. Chromeo - Fancy Footwork
```

Capped at 10 upcoming. Longer than that and the message gets unreadable; Discord's 2000-character limit is also real. The numbers shown are exactly what [[tremove]] takes as its position.

## Why one command and not two

Because `/tqueue` reads naturally as both "queue this" and "show the queue," and Discord's optional arguments make the split free. The alternative — `/tqueueadd` and `/tqueuelist` — is more typing for no clarity.

Related: [[tremove]] · [[tclear]] · [[Guild Queue]] · [[tnowplaying]]
