# Task: write the two capstone chapters for `concurrency-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/concurrency-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/concurrency-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/concurrency-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Concurrency on One Page'
description: 'Races, locks, event loops and atomics on one page — the model, the primitives, and the failure modes with their chapters.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/concurrency-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the pool and event-loop server from Chapter 12 — races, deadlocks, benchmarks. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
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
| 1 | `01-two-threads-one-counter` | Two Threads, One Counter: The Race, On Camera | Part I — One Core, Many Threads |
| 2 | `02-locks-from-scratch` | Locks from Scratch | Part I — One Core, Many Threads |
| 3 | `03-mutexes-deadlocks` | Mutexes, Deadlocks & Lock Ordering | Part I — One Core, Many Threads |
| 4 | `04-condition-variables` | Condition Variables & the Bounded Buffer | Part I — One Core, Many Threads |
| 5 | `05-c10k-blocking-dies` | Blocking Is Expensive: Thread-per-Client Dies at 10k | Part II — Waiting Efficiently |
| 6 | `06-the-event-loop` | The Event Loop: One Thread, Ten Thousand Sockets | Part II — Waiting Efficiently |
| 7 | `07-async-await` | async/await Demystified | Part II — Waiting Efficiently |
| 8 | `08-green-threads` | Green Threads & Schedulers | Part II — Waiting Efficiently |
| 9 | `09-atomics-memory-ordering` | Atomics & Memory Ordering | Part III — Many Cores |
| 10 | `10-lock-free-structures` | Lock-Free Structures & the ABA Problem | Part III — Many Cores |
| 11 | `11-concurrency-vs-parallelism` | Concurrency ≠ Parallelism (And the GIL) | Part III — Many Cores |
| 12 | `12-final-boss-pool-and-server` | Final Boss: Thread Pool + Event Loop Web Server | Part III — Many Cores |
| 13 | `13-cheat-sheet` | Cheat Sheet: Concurrency on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
