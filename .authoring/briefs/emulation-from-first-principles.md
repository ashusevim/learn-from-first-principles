# Task: write the two capstone chapters for `emulation-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/emulation-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/emulation-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/emulation-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Emulation on One Page'
description: 'Fetch–decode–execute for someone else’s CPU on one page — the model, the opcode rules, the quirks, and the debug loop.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/emulation-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the CHIP-8 emulator from Chapter 12 — opcodes, sprites, timers, quirks. Each is checkable against real ROMs.'
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
| 1 | `01-what-is-emulation` | What Is Emulation, Really? | Part I — The Machine |
| 2 | `02-fetch-decode-execute` | Fetch–Decode–Execute, Again — For Someone Else’s CPU | Part I — The Machine |
| 3 | `03-opcode-decoding` | Opcode Decoding: The Wild Encodings | Part I — The Machine |
| 4 | `04-display-sprites` | Graphics: The 64×32 Display | Part II — Screen & Sound |
| 5 | `05-timers-input` | Timers & Input: The Heartbeat | Part II — Screen & Sound |
| 6 | `06-sound-beeper` | Sound: The Beeper | Part II — Screen & Sound |
| 7 | `07-writing-programs` | Writing CHIP-8 Programs | Part III — A Real Program |
| 8 | `08-roms-loading` | ROMs: Loading Real Software | Part III — A Real Program |
| 9 | `09-debugging` | Debugging the Emulator | Part III — A Real Program |
| 10 | `10-quirks` | Why Emulation Is Hard: The Quirks | Part IV — The Real World |
| 11 | `11-beyond-chip8` | Beyond CHIP-8: NES, Cycle Accuracy & Recompilation | Part IV — The Real World |
| 12 | `12-final-boss-emulator` | Final Boss: The Complete Emulator in ~400 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Emulation on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
