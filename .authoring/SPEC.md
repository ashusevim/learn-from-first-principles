# Chapter Authoring Spec — The First Principles Project

You are writing the final two "capstone" chapters of an existing, finished course.
The course teaches a technology from first principles and ends with a "Final Boss"
build. Your two chapters are what a reader does **after** the finale: a one-page
reference, and a set of labs.

## Files you may touch

ONLY the two markdown files named in your brief. Do not edit `chapters.ts`, layouts,
components, READMEs, `package.json`, or the existing chapters. Do not create `code/`
files. Do not run `npm install` or `npm run build`.

## Frontmatter — reproduce byte-for-byte from your brief (including single quotes)

```
---
layout: ../../layouts/Chapter.astro
title: '<title from your brief>'
description: '<description from your brief>'
part: '<part from your brief>'
written: true
---
```

Then one blank line, then the body. No `<h1>` — the layout renders the title.

## Voice & conventions (match the existing chapters)

Read two existing chapters first (`01-*.md` and the `12-final-boss-*.md`) to absorb the
voice, then match it:

- Second person, direct, confident, zero filler. No "In this chapter we will…".
- Short declarative paragraphs. The key claim in **bold**.
- `## ` h2 sections only. Put a blank line before and after every heading and table.
- At least **3 fenced code blocks** with language tags (`sh`, `python`, `javascript`,
  `c`, `go`, `sql`, `html`, `text`, …). Each must be correct and runnable, and the
  non-obvious lines get a trailing `# comment`.
- At least **3 markdown tables**. Escape any `|` inside a table cell as `\|`.
- Reference sibling chapters by number and title: "(Chapter 3)", "(Chapters 7–8)".
- Never invent APIs, flags, or tools the course does not already use.
- Word count: **700–1000 words** per chapter.
- Em dashes written as `—`. Ellipses as `…`. Prefer typographic apostrophes `’`.
- End the chapter with a single sentence beginning `Next: ` that points onward.

## Chapter 1 — the cheat sheet (`NN-cheat-sheet.md`)

Purpose: a reader who finished the course can re-find any decision in 60 seconds.

1. Opening paragraph (3–6 lines): what this page is, how to use it.
2. `## The one-page model` — the smallest mental model of the whole subject: an ASCII
   diagram or table plus 2–4 sentences. This is what to remember if you remember
   nothing else.
3. `## The <domain> you actually use` — the reference table: 8–14 rows of the real
   commands / APIs / operators / primitives, each with a one-line meaning and a tiny
   `code` example where useful.
4. `## The pitfalls, and the chapter that explains each` — 6–10 rows:
   `Pitfall | What actually breaks | Chapter`. Reference only chapters in your brief's index.
5. `## When to use what` — a decision table for the choices this subject forces on you.
6. `## Prove it to yourself` — 3 numbered, tiny experiments, each with a short runnable
   snippet and the observation that proves the point.
7. `## What you now know` — 4–6 tight bullets.
8. Final line: `Next: ` + a pointer to the labs chapter.

## Chapter 2 — the labs (`NN-labs.md`)

Purpose: 10–12 graded exercises so the reader *does* the course instead of reading it.
Build the labs on the artefacts the course already produced (its toy implementations),
not on new theory.

1. Opening paragraph.
2. `## How the labs work` — 3–6 lines: the four fields of every lab; how to self-grade;
   that hints are directions, never solutions.
3. `## Warm-ups` — 3 labs (1.1–1.3).
4. `## Builds` — 4–5 labs (2.1–2.5).
5. `## Stretch goals` — 3–4 labs (3.1–3.4), open-ended, more than one good answer.
6. `## Self-checking without a grader` — how to verify each class of lab (expected
   output, assertions, timing, a deliberately planted bug).
7. `## What you now know` — 4–6 bullets.
8. Final line: `Next: ` + a concrete onward pointer (the real tool, the spec, the
   next course in the family).

Every lab uses exactly these four fields:

```
**Lab N.N — Title**
**Goal:** one sentence.
**Do this:** one to five lines, with a code block when it helps.
**You'll know it works when:** the expected output.
**Where it comes from:** Chapter X — Title.
```

## Quality bar — self-check before you stop

- [ ] Frontmatter byte-identical to the brief, including quotes and the em dash in `part`.
- [ ] File name matches the slug exactly, lowercase, hyphens, `.md`.
- [ ] 700–1000 words.
- [ ] ≥3 code blocks, ≥3 tables, blank line around every heading and table.
- [ ] Every lab has all four fields, and every "You'll know it works when" is specific
      (real output, not "it works").
- [ ] No h1, no `TODO`, no placeholders, no chapter references outside the index.
- [ ] Ends with a `Next: ` sentence.

## Then verify

Run `wc -w` on both files and `head -8` of each, and report the output.
