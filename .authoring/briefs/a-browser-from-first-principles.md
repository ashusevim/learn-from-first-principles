# Task: write the two capstone chapters for `a-browser-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/a-browser-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/a-browser-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/a-browser-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: The Browser Pipeline on One Page'
description: 'The whole pipeline from bytes to pixels, compressed: the model, the stages you actually touch, the pitfalls, and where each is explained.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/a-browser-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini browser from Chapter 12 — parse, layout, paint, and break it on purpose. Each is checkable by you alone.'
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
| 1 | `01-what-is-a-browser` | What Is a Browser, Really? | Part I — Reading the Web |
| 2 | `02-tokenizer` | The Tokenizer: HTML as a State Machine | Part I — Reading the Web |
| 3 | `03-tree-builder-dom` | The Tree Builder & the Live DOM | Part I — Reading the Web |
| 4 | `04-css-cascade-engine` | The Cascade Engine: Specificity & Inheritance | Part I — Reading the Web |
| 5 | `05-box-model-block-layout` | The Box Model & Block Layout | Part II — Laying It Out |
| 6 | `06-inline-layout` | Inline Layout & Text Wrapping | Part II — Laying It Out |
| 7 | `07-forms-interactivity` | Forms & Interactivity | Part II — Laying It Out |
| 8 | `08-painting` | Painting: Colors, Borders & Text | Part II — Laying It Out |
| 9 | `09-navigation-history` | Navigation & History | Part III — A Real Browser |
| 10 | `10-urls-security` | The URL Bar: Fetching & the Security Boundary | Part III — A Real Browser |
| 11 | `11-frame-budget` | Performance: The 16ms Frame Budget | Part III — A Real Browser |
| 12 | `12-final-boss-complete-browser` | Final Boss: The Complete Browser | Part III — A Real Browser |
| 13 | `13-cheat-sheet` | Cheat Sheet: The Browser Pipeline on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
