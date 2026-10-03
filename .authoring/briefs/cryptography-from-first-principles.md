# Task: write the two capstone chapters for `cryptography-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/cryptography-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/cryptography-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/cryptography-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Cryptography on One Page'
description: 'Hashes, ciphers, MACs and key exchange on one page — the model, the primitives, the combinations that are safe, and the ones that are not.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/cryptography-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the secure channel from Chapter 12 — hashes, ciphers, MACs, handshakes. Each is checkable by you alone.'
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
| 1 | `01-what-is-cryptography` | What Is Cryptography, Really? | Part I — Foundations |
| 2 | `02-hashes-one-way-functions` | Hashes: One-Way Functions | Part I — Foundations |
| 3 | `03-entropy-passwords-kdf` | Entropy, Passwords & Key Derivation | Part I — Foundations |
| 4 | `04-xor-one-time-pad` | XOR & the One-Time Pad | Part II — Secret-Key Cryptography |
| 5 | `05-stream-ciphers` | Stream Ciphers: Expanding a Small Key | Part II — Secret-Key Cryptography |
| 6 | `06-block-ciphers-modes` | Block Ciphers & Modes: ECB Is a Meme | Part II — Secret-Key Cryptography |
| 7 | `07-integrity-macs` | Integrity: MACs & the Length-Extension Trap | Part II — Secret-Key Cryptography |
| 8 | `08-diffie-hellman` | Diffie–Hellman: Sharing Secrets Publicly | Part III — Public-Key Cryptography |
| 9 | `09-rsa-trapdoors` | RSA: Trapdoors from Factoring | Part III — Public-Key Cryptography |
| 10 | `10-signatures-certificates` | Signatures & Certificates | Part III — Public-Key Cryptography |
| 11 | `11-tls-putting-it-together` | TLS: The Whole Course in One Handshake | Part IV — The Real World |
| 12 | `12-final-boss-secure-channel` | Final Boss: A Secure Channel in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Cryptography on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
