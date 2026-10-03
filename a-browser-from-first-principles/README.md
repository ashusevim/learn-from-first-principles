# A Browser from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a web browser from first principles — a spec-shaped
tokenizer, an error-recovering DOM, the CSS cascade, block and inline layout,
painting, navigation, history — one stage per chapter, until Chrome's pipeline is a
program you've personally written.

The deep sibling of [The Web from First Principles](../the-web-from-first-principles)
(traces one page load byte-by-byte; this course *builds the machine that does it*).
Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Reading the Web**
1. What Is a Browser, Really? ✅
2. The Tokenizer: HTML as a State Machine ✅
3. The Tree Builder & the Live DOM ✅
4. The Cascade Engine: Specificity & Inheritance ✅

**Part II — Laying It Out**
5. The Box Model & Block Layout ✅
6. Inline Layout & Text Wrapping ✅
7. Forms & Interactivity ✅
8. Painting: Colors, Borders & Text ✅

**Part III — A Real Browser**
9. Navigation & History ✅
10. The URL Bar: Fetching & the Security Boundary ✅
11. Performance: The 16ms Frame Budget ✅
12. Final Boss: The Complete Browser ✅ *(URL bar → pipeline → links → history)*

All 12 chapters are fully written, each with runnable Python builds over real pages.
Things you build along the way: a state-machine tokenizer with script-data handling,
a recovery-driven tree builder, a selector matcher with specificity arithmetic, block
layout with the full box model, word-wrapped inline fragments, hit testing and forms,
a display-list painter, the two-stack history, URL parsing with origin checks, a
stage-by-stage frame profiler — and the complete browser navigating real pages.

## The rules of the course

1. **Start below the abstraction.** Before "view source", answer "how did those bytes become pixels?"
2. **Nothing is magic.** Every pipeline stage is a program you can write and instrument.
3. **Build the real thing.** Real pages, real recovery, real clicks.
4. **Then the spec is readable.** The course ends where the HTML/CSS standards begin.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
