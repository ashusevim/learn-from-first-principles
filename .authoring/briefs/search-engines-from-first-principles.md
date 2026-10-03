# Task: write the two capstone chapters for `search-engines-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/search-engines-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/search-engines-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/search-engines-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Search Engines on One Page'
description: 'Crawl, index, query and rank on one page — the model, the formulas, the tradeoffs, and the evaluation discipline.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/search-engines-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on mini-Google from Chapter 12 — crawl, index, query, rank. Each is checkable by you alone.'
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
| 1 | `01-what-is-search` | What Is Search, Really? | Part I — The Crawler |
| 2 | `02-the-crawler` | The Crawler: Politeness at Scale | Part I — The Crawler |
| 3 | `03-clean-and-index` | Cleaning & Tokenizing Documents | Part I — The Crawler |
| 4 | `04-inverted-index` | The Inverted Index | Part II — The Index |
| 5 | `05-query-processing` | Query Processing: AND, OR & Phrases | Part II — The Index |
| 6 | `06-ranking-tfidf` | Ranking I: TF-IDF | Part II — The Index |
| 7 | `07-pagerank` | Ranking II: PageRank | Part II — The Index |
| 8 | `08-caching-dedup` | Caching, Dedup & Spam Resistance | Part III — Serving & Scale |
| 9 | `09-evaluation` | Evaluation: Precision, Recall & Judging Results | Part III — Serving & Scale |
| 10 | `10-snippets-highlighting` | Snippets & Highlighting | Part III — Serving & Scale |
| 11 | `11-distributed-indexes` | Scale: Shards, Replicas & the Distributed Index | Part III — Serving & Scale |
| 12 | `12-final-boss-mini-google` | Final Boss: mini-Google in ~300 Lines | Part III — Serving & Scale |
| 13 | `13-cheat-sheet` | Cheat Sheet: Search Engines on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
