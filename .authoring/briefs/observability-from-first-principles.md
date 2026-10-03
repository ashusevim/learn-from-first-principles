# Task: write the two capstone chapters for `observability-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/observability-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/observability-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/observability-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Observability on One Page'
description: 'Logs, metrics, traces and SLOs on one page — the model, the costs, the sampling rules, and the alerting discipline.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/observability-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the observable service from Chapter 12 — logs, metrics, traces, SLOs. Each is checkable by you alone.'
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
| 1 | `01-what-is-observability` | What Is Observability, Really? | Part I — The Three Pillars |
| 2 | `02-structured-logs` | Logs: Events with Context | Part I — The Three Pillars |
| 3 | `03-metrics` | Metrics: Numbers Over Time | Part I — The Three Pillars |
| 4 | `04-traces` | Traces: The Request’s Journey | Part II — Traces & Costs |
| 5 | `05-instrumenting` | Instrumentation: Wiring the Pillars In | Part II — Traces & Costs |
| 6 | `06-cardinality` | Cardinality: The Metric That Kills Your Backend | Part II — Traces & Costs |
| 7 | `07-sampling` | Sampling: You Can’t Keep Everything | Part III — Serving It |
| 8 | `08-alerting` | Alerting: Pages vs Tickets | Part III — Serving It |
| 9 | `09-slos-error-budgets` | SLOs & Error Budgets | Part III — Serving It |
| 10 | `10-opentelemetry` | OpenTelemetry: The Standard | Part IV — The Real World |
| 11 | `11-the-stack` | The Observability Stack: Prometheus, Grafana, Jaeger | Part IV — The Real World |
| 12 | `12-final-boss-observable-service` | Final Boss: The Observable Service in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Observability on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
