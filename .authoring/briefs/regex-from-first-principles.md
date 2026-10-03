# Task: write the two capstone chapters for `regex-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/regex-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/regex-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/regex-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Regex on One Page'
description: 'The mini-language, the automata and the engines on one page — the model, the operators, and the trap that costs you.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/regex-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the engine from Chapter 12 — NFA, captures, greediness, ReDoS. Each is checkable by you alone.'
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
| 1 | `01-what-is-regex` | What Is a Regex, Really? | Part I — The Matcher |
| 2 | `02-metacharacters` | Metacharacters: The Mini-Language | Part I — The Matcher |
| 3 | `03-backtracking-trap` | The Backtracking Trap | Part I — The Matcher |
| 4 | `04-thompson-construction` | Thompson’s Construction: Regex to NFA | Part II — The Theory That Saves |
| 5 | `05-nfa-simulation` | Simulating the NFA: Linear Time, Always | Part II — The Theory That Saves |
| 6 | `06-subset-construction` | DFAs: The Subset Construction | Part II — The Theory That Saves |
| 7 | `07-capture-groups` | Capture Groups & Submatches | Part III — Beyond Matching |
| 8 | `08-the-assembled-engine` | The Engine, Assembled: Find, Search, Match All | Part III — Beyond Matching |
| 9 | `09-greedy-vs-lazy` | Greedy vs Lazy: Who Eats What | Part III — Beyond Matching |
| 10 | `10-real-engine-internals` | Real Engine Internals: PCRE vs RE2 | Part IV — The Real World |
| 11 | `11-redos` | Security: ReDoS — The Regex Denial of Service | Part IV — The Real World |
| 12 | `12-final-boss-complete-engine` | Final Boss: The Complete Regex Engine in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Regex on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
