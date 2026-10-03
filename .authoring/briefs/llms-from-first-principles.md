# Task: write the two capstone chapters for `llms-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/llms-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/llms-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/llms-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: LLMs on One Page'
description: 'Tokens, attention, training and serving on one page — the model, the shapes, the sampling knobs, and the costs.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/llms-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini-GPT from Chapter 12 — tokenize, attend, train, sample. Each is checkable by you alone.'
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
| 1 | `01-what-is-an-llm` | What Is an LLM, Really? | Part I — Tokens & Meaning |
| 2 | `02-tokenizers-bpe` | Tokens: Words Too Big, Characters Too Small | Part I — Tokens & Meaning |
| 3 | `03-embeddings` | Embeddings: Meaning as Geometry | Part I — Tokens & Meaning |
| 4 | `04-attention` | Attention: The Core Idea | Part II — The Transformer |
| 5 | `05-multihead-positional` | Multi-Head Attention & Positional Encoding | Part II — The Transformer |
| 6 | `06-transformer-block` | The Transformer Block | Part II — The Transformer |
| 7 | `07-training` | Training: Next-Token Loss | Part II — The Transformer |
| 8 | `08-generation-sampling` | Generation: Sampling, Temperature & Top-k | Part III — Using & Serving |
| 9 | `09-prompting-context` | Prompting & Context Windows | Part III — Using & Serving |
| 10 | `10-finetuning-rlhf` | Fine-tuning & RLHF, Conceptually | Part III — Using & Serving |
| 11 | `11-serving-kv-cache` | Serving: KV Caches & Inference Speed | Part III — Using & Serving |
| 12 | `12-final-boss-mini-gpt` | Final Boss: A Mini-GPT in ~300 Lines | Part III — Using & Serving |
| 13 | `13-cheat-sheet` | Cheat Sheet: LLMs on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
