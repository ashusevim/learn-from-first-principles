# React from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds React from scratch — the virtual DOM, the diff,
useState's closure cells, keys — until hooks rules become mechanical consequences and
framework debates become named tradeoffs. The finale: your own React in ~200 lines.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [The Web](../the-web-from-first-principles)).

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

**Part I — The Model**
1. UI as a Function of State ✅
2. The Virtual DOM & Reconciliation ✅
3. Components & Composition ✅
4. Hooks: useState Demystified ✅

**Part II — The Mechanics**
5. Effects: Synchronizing With the Outside ✅
6. Context & Prop Drilling ✅
7. Keys, Lists & Why the Diff Algorithm Cares ✅
8. Fiber, Conceptually: Interruptible Rendering ✅

**Part III — The Ecosystem**
9. State Management: Lifting, Stores & Signals ✅
10. Server Components & Suspense ✅
11. React vs Signals vs Svelte ✅
12. Final Boss: Your Own React in ~200 Lines ✅ *(vdom + diff + hooks, one file)*

All 12 chapters are fully written, each with runnable builds on the course's own toy
React. Things you build along the way: an instrumented vdom diff/patch, components
grown from one renderer line, useState's slot array (broken by index-shift on
purpose), an effect scheduler with cleanup, a context provider stack, keyed vs
unkeyed list diffing with state-jump on camera, a time-sliced fiber diff, a store and
a signal side by side, a Suspense streaming harness, a re-run vs subscribe update
counter — and your own React running a todo app.

## The rules of the course

1. **Start below the abstraction.** Before "learn the hooks rules", answer "what is state, physically?"
2. **Nothing is magic.** Reconciliation, keys, fibers — buildable algorithms.
3. **Build a toy version.** The finale: a working React in ~200 lines.
4. **Then the debates are tradeoffs.** Signals, Svelte, server components: positions you can name.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

React's genre is JavaScript — the chapter code *is* the runnable source. TS ports welcome via PR.
