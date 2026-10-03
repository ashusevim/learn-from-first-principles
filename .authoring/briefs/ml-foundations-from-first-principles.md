# Task: write the two capstone chapters for `ml-foundations-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/ml-foundations-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/ml-foundations-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/ml-foundations-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Machine Learning on One Page'
description: 'Loss, gradients, backprop and training dynamics on one page — the model, the failure modes, and the fixes.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/ml-foundations-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the autograd engine from Chapter 12 — gradients, networks, overfitting, convolutions. Each is checkable by you alone.'
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
| 1 | `01-what-is-learning` | What Is Learning, Really? | Part I — The Learning Machine |
| 2 | `02-loss-gradient-descent` | Loss & Gradient Descent | Part I — The Learning Machine |
| 3 | `03-overfitting-split` | Overfitting & the Train/Test Split | Part I — The Learning Machine |
| 4 | `04-from-line-to-network` | From Line to Network: Neurons & Activations | Part II — The Neural Network |
| 5 | `05-backpropagation` | Backpropagation: The Chain Rule, Mechanized | Part II — The Neural Network |
| 6 | `06-training-dynamics` | Training Dynamics: Rates, Batches & Schedules | Part II — The Neural Network |
| 7 | `07-classification-softmax` | Classification & Softmax | Part III — Beyond Basics |
| 8 | `08-regularization` | Regularization: Dropout & Weight Decay | Part III — Beyond Basics |
| 9 | `09-convolutions` | Convolutions: Kernels That See | Part III — Beyond Basics |
| 10 | `10-embeddings-attention-recap` | Embeddings & Attention, Recast as Learning | Part III — Beyond Basics |
| 11 | `11-the-dl-stack` | Why Frameworks Exist: The Autograd Contract | Part III — Beyond Basics |
| 12 | `12-final-boss-autograd` | Final Boss: A Tiny Autograd Engine in ~200 Lines | Part III — Beyond Basics |
| 13 | `13-cheat-sheet` | Cheat Sheet: Machine Learning on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
