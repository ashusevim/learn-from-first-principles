# Task: write the two capstone chapters for `blockchain-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/blockchain-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/blockchain-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/blockchain-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Blockchain on One Page'
description: 'The chain, proof of work, signatures and forks on one page — the model, the invariants, and the ways naive chains break.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/blockchain-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the chain from Chapter 12 — mining, tampering, double-spends, forks. Each is checkable by you alone.'
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
| 1 | `01-what-is-blockchain` | What Is a Blockchain, Really? | Part I — The Chain |
| 2 | `02-the-block` | The Block: Hashes Chain History | Part I — The Chain |
| 3 | `03-proof-of-work` | Proof of Work: Making Forging Expensive | Part I — The Chain |
| 4 | `04-decentralization` | Decentralization: No Single Point of Trust | Part II — Trust Without Trust |
| 5 | `05-transactions-signatures` | Transactions & Digital Signatures | Part II — Trust Without Trust |
| 6 | `06-mempool-validation` | The Mempool & Block Validation | Part II — Trust Without Trust |
| 7 | `07-double-spend` | Double-Spend & the Longest-Chain Rule | Part III — Beyond the Basics |
| 8 | `08-merkle-trees` | Merkle Trees: Efficient Verification | Part III — Beyond the Basics |
| 9 | `09-wallets-addresses` | Wallets & Addresses | Part III — Beyond the Basics |
| 10 | `10-real-blockchains` | What Real Blockchains Add | Part IV — The Real World |
| 11 | `11-energy-alternatives` | The Energy Question & Proof of Stake | Part IV — The Real World |
| 12 | `12-final-boss-complete-chain` | Final Boss: The Complete Blockchain in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Blockchain on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
