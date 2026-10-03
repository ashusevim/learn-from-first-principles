# Task: write the two capstone chapters for `auth-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/auth-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/auth-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/auth-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Identity on One Page'
description: 'Authentication, sessions, tokens and delegation on one page — the model, the checks you must never skip, and the pitfalls with their chapters.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/auth-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the auth system from Chapter 12 — hashing, sessions, JWT attacks, OAuth. Each is checkable by you alone.'
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
| 1 | `01-what-is-auth` | What Is Auth, Really? | Part I — Identity Foundations |
| 2 | `02-password-storage` | Password Storage Done Right | Part I — Identity Foundations |
| 3 | `03-sessions` | Sessions: The Server Remembers | Part I — Identity Foundations |
| 4 | `04-cookies` | Cookies & the Browser Contract | Part II — Tokens |
| 5 | `05-jwt-from-scratch` | JWT: Signed Claims | Part II — Tokens |
| 6 | `06-jwt-pitfalls` | JWT Pitfalls: alg=none & the Confusion Attacks | Part II — Tokens |
| 7 | `07-oauth2` | OAuth 2.0: The Delegation Problem | Part III — Delegation |
| 8 | `08-openid-connect` | OpenID Connect: Who Are You? | Part III — Delegation |
| 9 | `09-api-keys` | API Keys & Machine Identity | Part III — Delegation |
| 10 | `10-tls-the-channel` | TLS: Auth Without the Channel Is Theater | Part IV — The Real World |
| 11 | `11-attack-catalog` | The Attack Catalog: CSRF, XSS, Fixation & Stuffing | Part IV — The Real World |
| 12 | `12-final-boss-auth-system` | Final Boss: A Complete Auth System in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Identity on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
