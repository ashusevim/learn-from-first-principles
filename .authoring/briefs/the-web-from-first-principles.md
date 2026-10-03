# Task: write the two capstone chapters for `the-web-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/the-web-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/the-web-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/the-web-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: The Web on One Page'
description: 'One page load, on one page — DNS, TCP and TLS, HTTP, the render pipeline, caching, and the headers that decide everything.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/the-web-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini browser from Chapter 12 — DNS, connections, caching, the render pipeline. Each is checkable by you alone.'
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
| 1 | `01-one-page-load-traced` | One Page Load, Traced End to End | Part I — The Pipe |
| 2 | `02-dns-in-the-browser` | DNS in the Browser: Caches All the Way Down | Part I — The Pipe |
| 3 | `03-tcp-tls-for-the-page` | TCP & TLS: The Connection Tax | Part I — The Pipe |
| 4 | `04-http2-streams` | HTTP/2: One Connection, Many Streams | Part I — The Pipe |
| 5 | `05-html-dom` | HTML Parsing & the DOM Tree | Part II — The Document |
| 6 | `06-css-cascade` | CSS: Selectors, Specificity & the Cascade | Part II — The Document |
| 7 | `07-js-event-loop` | JavaScript: The Single Thread That Runs Everything | Part II — The Document |
| 8 | `08-render-pipeline` | The Render Pipeline: Layout, Paint, Composite | Part II — The Document |
| 9 | `09-caching-headers` | Caching: The Headers That Save the World | Part III — Fast & Modern |
| 10 | `10-compression-images` | Compression & Images: Bytes on the Wire | Part III — Fast & Modern |
| 11 | `11-http3-quic` | HTTP/3 & QUIC: The UDP Gamble | Part III — Fast & Modern |
| 12 | `12-final-boss-mini-browser` | Final Boss: A Mini Browser in ~300 Lines | Part III — Fast & Modern |
| 13 | `13-cheat-sheet` | Cheat Sheet: The Web on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
