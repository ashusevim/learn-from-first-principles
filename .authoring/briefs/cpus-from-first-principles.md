# Task: write the two capstone chapters for `cpus-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/cpus-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/cpus-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/cpus-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: CPUs on One Page'
description: 'Gates to ISA to running program, on one page — the model, the instruction set, the timing rule, and the bugs that come from real hardware.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/cpus-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on Bite-16 from Chapter 12 — gates, the ALU, the ISA, the assembler. Each is checkable by you alone.'
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
| 1 | `01-what-is-a-cpu` | What Is a CPU, Really? | Part I — From Electricity to Logic |
| 2 | `02-nand-everything` | NAND Is Everything | Part I — From Electricity to Logic |
| 3 | `03-the-alu` | The ALU: Arithmetic in Gates | Part I — From Electricity to Logic |
| 4 | `04-memory-registers` | Memory & Registers: Remembering Bits | Part II — The Machine |
| 5 | `05-the-isa` | Designing the Instruction Set | Part II — The Machine |
| 6 | `06-fetch-decode-execute` | Fetch–Decode–Execute: The CPU Loop | Part II — The Machine |
| 7 | `07-jumps-branches` | Jumps & Branches: Teaching the CPU If | Part III — Running Programs |
| 8 | `08-call-stack` | Functions & the Call Stack | Part III — Running Programs |
| 9 | `09-the-assembler` | The Assembler: Mnemonics to Machine Code | Part III — Running Programs |
| 10 | `10-buses-clocks-real-hardware` | Buses, Clocks & the Real Hardware | Part IV — The Real World |
| 11 | `11-bite16-to-x86-riscv` | From Bite-16 to x86 & RISC-V | Part IV — The Real World |
| 12 | `12-final-boss-complete-cpu` | Final Boss: The Complete CPU in ~400 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: CPUs on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
