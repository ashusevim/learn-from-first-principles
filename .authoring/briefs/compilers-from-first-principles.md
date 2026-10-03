# Task: write the two capstone chapters for `compilers-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/compilers-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/compilers-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/compilers-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Compilers on One Page'
description: 'The whole pipeline — lexer, parser, VM, closures — on one page: the model, the stages, the invariants, and the classic bugs.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/compilers-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toolchain from Chapter 12 — lex, parse, compile, disassemble. Each is checkable by you alone.'
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
| 1 | `01-what-is-a-compiler` | What Is a Compiler, Really? | Part I — From Text to Structure |
| 2 | `02-the-lexer` | The Lexer: Characters to Tokens | Part I — From Text to Structure |
| 3 | `03-the-parser` | The Parser: Grammar to AST | Part I — From Text to Structure |
| 4 | `04-tree-walking-interpreter` | The Tree-Walking Interpreter | Part II — Making It Run |
| 5 | `05-variables-environments` | Variables & Environments | Part II — Making It Run |
| 6 | `06-control-flow` | Control Flow: If, While & Turing Completeness | Part II — Making It Run |
| 7 | `07-compiling-to-bytecode` | Compiling to Bytecode | Part III — The Bytecode VM |
| 8 | `08-the-stack-machine` | The Stack Machine: Bytecode That Runs | Part III — The Bytecode VM |
| 9 | `09-jumps-and-functions` | Jumps, Control Flow & Functions in the VM | Part III — The Bytecode VM |
| 10 | `10-closures` | Closures: Functions That Remember | Part IV — A Real Language |
| 11 | `11-errors-and-diagnostics` | Errors & Diagnostics: Talking to Humans | Part IV — A Real Language |
| 12 | `12-final-boss-complete-toolchain` | Final Boss: The Complete Toolchain in ~400 Lines | Part IV — A Real Language |
| 13 | `13-cheat-sheet` | Cheat Sheet: Compilers on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
