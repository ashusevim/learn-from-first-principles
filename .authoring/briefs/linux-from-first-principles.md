# Task: write the two capstone chapters for `linux-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/linux-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/linux-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/linux-from-first-principles/src/pages/chapters/15-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Linux on One Page'
description: 'Boot, syscalls, processes, files and containers on one page — the model, the commands, and the traps with their chapters.'
part: 'Part VI — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/linux-from-first-principles/src/pages/chapters/16-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs from fork to containers — processes, file descriptors, namespaces, cgroups. Each is checkable by you alone.'
part: 'Part VI — Practice & Reference'
written: true
---
```

Body: the labs structure from the spec (§ "Chapter 2") — 3 warm-ups, 4-5 builds,
3 stretch goals, and 12 labs in total, each with **Goal** / **Do this** /
**You'll know it works when** / **Where it comes from**. Build every lab on artefacts
this course has already built.

## The course's chapter index — reference only these

| # | slug | title | part |
|---|------|-------|------|
| 1 | `01-power-button` | What Happens When You Press the Power Button | Part I — The Machine Wakes Up |
| 2 | `02-what-is-a-kernel` | What Is a Kernel, Really? | Part I — The Machine Wakes Up |
| 3 | `03-processes` | Processes: fork, exec, and the Zombie Apocalypse | Part I — The Machine Wakes Up |
| 4 | `04-the-shell` | The Shell Is Just a REPL Over Syscalls | Part II — Talking to the Machine |
| 5 | `05-everything-is-a-file` | Why Everything Is a File | Part II — Talking to the Machine |
| 6 | `06-file-descriptors` | File Descriptors, Redirection & Pipes | Part II — Talking to the Machine |
| 7 | `07-memory` | Memory Is a Lie (And That’s Good) | Part III — The Kernel’s Resources |
| 8 | `08-users-permissions` | Users, Permissions & sudo | Part III — The Kernel’s Resources |
| 9 | `09-dynamic-linking` | Dynamic Linking: Every Binary Is Incomplete | Part III — The Kernel’s Resources |
| 10 | `10-systemd` | systemd & the Birth of Services | Part IV — The Running System |
| 11 | `11-networking` | Networking: Interfaces, Routes & Sockets | Part IV — The Running System |
| 12 | `12-packages` | Packages & Distros: Who Puts Binaries on My Disk? | Part IV — The Running System |
| 13 | `13-observability` | Observability: The Kernel Keeps Receipts | Part V — Power Tools |
| 14 | `14-containers` | Containers from Scratch | Part V — Power Tools |
| 15 | `15-cheat-sheet` | Cheat Sheet: Linux on One Page | Part VI — Practice & Reference | **NEW**
| 16 | `16-labs` | Labs: Prove It Yourself | Part VI — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
