# Regex from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a regex engine from first principles — the naive
backtracking matcher, its catastrophic blowup, Thompson's NFA construction, linear-
time simulation, subset construction to DFAs — until "why is my regex hanging?" and
"what does .*? really do" become automata theory you've personally implemented.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Compilers](../compilers-from-first-principles), [The Web](../the-web-from-first-principles),
[LLMs](../llms-from-first-principles), [Cryptography](../cryptography-from-first-principles)).

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

**Part I — The Matcher**
1. What Is a Regex, Really? ✅
2. Metacharacters: The Mini-Language ✅
3. The Backtracking Trap ✅

**Part II — The Theory That Saves**
4. Thompson's Construction: Regex to NFA ✅
5. Simulating the NFA: Linear Time, Always ✅
6. DFAs: The Subset Construction ✅

**Part III — Beyond Matching**
7. Capture Groups & Submatches ✅
8. The Engine, Assembled: Find, Search, Match All ✅
9. Greedy vs Lazy: Who Eats What ✅

**Part IV — The Real World**
10. Real Engine Internals: PCRE vs RE2 ✅
11. Security: ReDoS — The Regex Denial of Service ✅
12. Final Boss: The Complete Regex Engine in ~300 Lines ✅ *(parse → NFA → linear sim → finditer)*

All 12 chapters are fully written, each with runnable builds and measured outputs.
Things you build along the way: the classic recursive matcher, the catastrophic
backtracking blowup measured on camera, Thompson's NFA construction, the linear
set-of-states simulation (Chapter 3's killer input neutralized), a subset-construction
DFA, a threaded backtracker with captures, a complete finditer engine, greedy vs lazy
demonstrated as loop direction, the PCRE-vs-RE2 comparison, and the ReDoS attack with
its immune counter.

## The rules of the course

1. **Start below the abstraction.** Before "use re.match", answer "what does .* actually do?"
2. **Break the naive engine.** Catastrophic backtracking, measured — then made impossible.
3. **Build the theory.** Thompson's construction, NFA simulation, subset construction.
4. **Assemble the engine.** The finale: your own regex engine, ~300 lines.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
