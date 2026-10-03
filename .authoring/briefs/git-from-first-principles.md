# Task: write the two capstone chapters for `git-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/git-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/git-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/git-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Git on One Page'
description: 'The object database, refs, the index and the DAG on one page — the model, the plumbing, and the recovery commands.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/git-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on mini-git from Chapter 12 — objects, refs, merges, recovery. Each is checkable by you alone.'
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
| 1 | `01-key-value-store` | Git Is a Key-Value Store | Part I — The Object Database |
| 2 | `02-trees-and-commits` | Trees & Commits: Snapshots, Not Diffs | Part I — The Object Database |
| 3 | `03-branches-and-head` | Branches & HEAD: It’s All Just Files | Part I — The Object Database |
| 4 | `04-the-index` | The Index: Staging Is a File | Part II — The Mechanics |
| 5 | `05-packfiles-and-deltas` | Packfiles & Deltas: Why .git Is Small | Part II — The Mechanics |
| 6 | `06-status-three-trees` | git status Demystified: The Three Trees | Part II — The Mechanics |
| 7 | `07-remotes-and-the-dag` | Remotes: Copying Objects, Moving Pointers | Part III — Working with Others |
| 8 | `08-merge-three-way` | Merge: Three-Way and the Conflict Markers | Part III — Working with Others |
| 9 | `09-rebase-rewriting-history` | Rebase: Rewriting History | Part III — Working with Others |
| 10 | `10-reflog-recovery` | Reflog: Nothing Is Ever Lost | Part IV — Recovery & Mastery |
| 11 | `11-hooks-worktrees-attributes` | Hooks, Worktrees & Attributes | Part IV — Recovery & Mastery |
| 12 | `12-final-boss-mini-git` | Final Boss: mini-git in ~300 Lines | Part IV — Recovery & Mastery |
| 13 | `13-cheat-sheet` | Cheat Sheet: Git on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
