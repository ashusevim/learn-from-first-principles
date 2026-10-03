# Task: write the two capstone chapters for `databases-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/databases-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/databases-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/databases-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Databases on One Page'
description: 'Storage, indexes, WAL, transactions and MVCC on one page — the model, the tradeoffs, and the failure modes with their chapters.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/databases-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toy RDBMS from Chapter 12 — pages, B-trees, WAL, MVCC. Each is checkable by you alone.'
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
| 1 | `01-a-file-is-a-database` | A File Is a Database | Part I — Data on Disk |
| 2 | `02-pages-and-storage` | Pages: The Storage Engine’s Currency | Part I — Data on Disk |
| 3 | `03-btrees` | B-Trees: The Index That Makes It Fast | Part I — Data on Disk |
| 4 | `04-wal-crash-safety` | WAL: Crash Safety in One Idea | Part I — Data on Disk |
| 5 | `05-buffer-pool` | The Buffer Pool: Distrusting the OS | Part II — The Query Side |
| 6 | `06-parse-and-plan` | SQL Without the Magic: Parse & Plan | Part II — The Query Side |
| 7 | `07-joins` | Joins: Nested Loops to Hash | Part II — The Query Side |
| 8 | `08-transactions-acid` | Transactions: ACID Without the Buzzwords | Part III — Correctness & Scale |
| 9 | `09-mvcc` | MVCC: Databases That Never Block | Part III — Correctness & Scale |
| 10 | `10-beyond-btrees` | Beyond B-Trees: LSM & the Write Tradeoff | Part III — Correctness & Scale |
| 11 | `11-replication-sharding` | Replication & Sharding: The Distributed Tax | Part III — Correctness & Scale |
| 12 | `12-final-boss-toy-rdbms` | Final Boss: A Working Toy RDBMS | Part III — Correctness & Scale |
| 13 | `13-cheat-sheet` | Cheat Sheet: Databases on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
