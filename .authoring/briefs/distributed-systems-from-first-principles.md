# Task: write the two capstone chapters for `distributed-systems-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/distributed-systems-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/distributed-systems-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/distributed-systems-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Distributed Systems on One Page'
description: 'Clocks, quorums, Raft and consistency on one page — the model, the invariants you must hold, and the lies networks tell.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/distributed-systems-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toy Raft from Chapter 12 — elections, partitions, quorums, crashes. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
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
| 1 | `01-two-generals` | Two Generals & Why Networks Lie | Part I — The Ground Rules |
| 2 | `02-clocks-are-a-lie` | Clocks Are a Lie (Use Logical Ones) | Part I — The Ground Rules |
| 3 | `03-failure-detectors` | Failure Detectors: Knowing When a Node Is Dead (You Can’t) | Part I — The Ground Rules |
| 4 | `04-replicated-log` | The Replicated Log: The Problem Everything Solves | Part II — Consensus (Raft) |
| 5 | `05-raft-leader-election` | Raft I: Leader Election | Part II — Consensus (Raft) |
| 6 | `06-raft-log-replication` | Raft II: Log Replication & the Commit Rule | Part II — Consensus (Raft) |
| 7 | `07-split-brain-quorums` | Split Brains & Quorums | Part II — Consensus (Raft) |
| 8 | `08-consistent-hashing` | Consistent Hashing & Sharding the Ring | Part III — Beyond One Cluster |
| 9 | `09-gossip` | Gossip & Anti-Entropy | Part III — Beyond One Cluster |
| 10 | `10-two-phase-commit` | Two-Phase Commit & the Coordinator’s Dilemma | Part III — Beyond One Cluster |
| 11 | `11-vector-clocks` | Vector Clocks & Conflict Resolution | Part IV — The Real World |
| 12 | `12-final-boss-toy-raft` | Final Boss: A Toy Raft in ~400 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Distributed Systems on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
