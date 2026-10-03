---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on your own React from Chapter 12 — diff, hooks, keys, scheduling. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in numbers or visible behavior from your
own-react (Chapter 12) — `h`, `mount`, `reconcile`, `useState`, `useEffect`,
`afterCommit`. Nothing here is new: the diff (Ch 2), components (Ch 3), the
hooks array (Ch 4), effects (Ch 5), context (Ch 6), keys (Ch 7), fibers (Ch 8).
What is new is *instrumentation*: counters on your own machinery until the
abstractions confess their costs.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Load `own-react.js` plus the todo app; keep a patch counter
handy — it is the star of half this chapter.

| Tool | What it proves |
|---|---|
| patch/instantiate counters | what each state change actually cost |
| `hookCursor` logging | the positional contract, live |
| the todo app with/without keys | identity deciding correctness |
| `scheduled` flag + timestamps | batching, by observation |

## Warm-ups

**Lab 1.1 — Count the patches**
**Goal:** "minimal DOM edits" as a number, not a slogan.
**Do this:**
```javascript
let patches = 0;                    // bump inside your patch() from Ch 2
setText("same"); setText("same"); setText("changed");
console.log(patches);               // expect: 1 — identical vdom costs nothing
```
**You'll know it works when:** three `setText` calls produce exactly one patch.
Description → diff → delta: the machine only pays for *changes*.
**Where it comes from:** Chapter 2 — The Virtual DOM & Reconciliation.

**Lab 1.2 — Log the hook cursor**
**Goal:** useState's slot addressing, visible.
**Do this:**
```javascript
// inside useState: console.log(currentInstance._name, hookCursor);
// then render the todo app once and read the sequence 0,1,2…
```
**You'll know it works when:** the cursor resets per component and increments
per hook, in call order — the array from Chapter 4, narrating itself.
**Where it comes from:** Chapter 4 — Hooks: useState Demystified.

**Lab 1.3 — Effects after commit**
**Goal:** the DOM agrees *before* effects run (Chapter 5's ordering promise).
**Do this:**
```javascript
useEffect(() => console.log("dom says:", container.textContent.length));
console.log("render done");
```
**You'll know it works when:** "render done" prints before "dom says: …" — the
effect queue (`afterCommit`) flushes after the patch, always. Ordering is the
contract; now you've seen it hold.
**Lab 2.1 — Break the rules, watch state jump**
**Goal:** the rule of hooks as machinery, not etiquette (Chapter 4).
**Do this:** wrap your todo app's second `useState` in `if (items.length > 2)`,
then delete items down to two and read the `hookCursor` log from Lab 1.2.
**You'll know it works when:** the third hook's slot is claimed by whoever runs
next — state visibly teleports between hooks. Restore the order; teleportation
stops. The linter was never being fussy.
**Where it comes from:** Chapter 4.

**Lab 2.2 — Keys decide who survives**
**Goal:** identity in list diffs, with state as the witness (Chapter 7).
**Do this:** render todos *without* keys; toggle item 1's "done", delete item
0, re-render. Repeat *with* keys.
**You'll know it works when:** without keys the checkmark jumps to the wrong
row (index identity); with keys it stays home (data identity). Same diff code,
two realities — the key was the difference.
**Where it comes from:** Chapter 7 — Keys, Lists & Why the Diff Algorithm Cares.

**Lab 2.3 — Race keyed vs unkeyed**
**Goal:** keys cost patches; measure the tradeoff (Chapter 7).
**Do this:** with 100 todos, prepend one item and re-render both ways, reading
the patch counter.
**You'll know it works when:** unkeyed patches ~100 rows (everything shifts),
keyed patches ~2 (one insert, one shift). Keys are not free — they are cheaper
than being wrong.
**Where it comes from:** Chapter 7.

**Lab 2.4 — Batch the storm**
**Goal:** scheduling collapses bursts into one render (Chapter 8).
**Do this:** call three different setters synchronously in one handler, with a
render counter in the component body.
**You'll know it works when:** the counter prints **one** render for three
state changes — the `scheduled` flag coalesced them. Three renders would be the
naive runtime; batching is the upgrade.
**Where it comes from:** Chapter 8 — Fiber, Conceptually: Interruptible Rendering.

**Lab 2.5 — Context without drilling**
**Goal:** ambient state beats 3-deep prop tunnels (Chapter 6).
**Do this:** thread a `theme` through your todo app as props to depth 3, count
the touched components; then switch to Context and count again.
**You'll know it works when:** only the provider and the consumer change under
Context — the middle layer stops existing. Note what you paid: every consumer
re-renders on theme change, which Chapter 9's stores then refine.
**Where it comes from:** Chapter 6 — Context & Prop Drilling.

## Stretch goals

**Lab 3.1 — Memoize the expensive child**
**Goal:** skip work only where measurement said so (Chapter 8).
**Do this:** give one todo row a deliberately slow render (`while` loop of
~5ms), render 50 rows, and re-render on an unrelated state change. Then memoize
that row on stable props.
**You'll know it works when:** unkeyed-and-unmemoized, every keystroke costs
~250ms; memoized, it costs one row. Quote both numbers — memoization justified
by data is engineering; by vibes is superstition.
**Where it comes from:** Chapters 2 and 8.

**Lab 3.2 — Signals, in your runtime**
**Goal:** push vs re-run-and-diff, measured side by side (Chapter 11).
**Do this:** add a 20-line signal (get/set/sub) beside your React, wire the
todo count to it directly, and compare update cost vs the vdom path.
**You'll know it works when:** the signal updates the one text node with zero
diffs and zero renders — correct, cheaper, and *less flexible*. Write down what
you gave up (composition, time-slicing) and you have written Chapter 11.
**Where it comes from:** Chapter 11 — React vs Signals vs Svelte.

## Self-checking without a grader

- **Counter labs** (1.1, 2.3, 2.4, 3.1, 3.2): patch counts, render counts,
  milliseconds. Your instrumentation is the grader — build it once, trust it
  forever.
- **Ordering labs** (1.2, 1.3, 2.1): the cursor sequence, the post-commit
  effect, the slot shift. Sequences either match the contract or they don't.
- **Witness labs** (2.2, 2.5, 3.2): state teleporting, layers vanishing, the
  zero-diff update. Behavior with/without the feature, side by side.

## What you now know

- **Your React is now an instrumented runtime** (Labs 1.1, 2.3): every claim in
  every framework debate is one counter away from evidence.
- **The rule of hooks is a memory layout** (Lab 2.1) — and the linter is its
  chaperone.
- **Keys are correctness, then performance** (Labs 2.2–2.3): identity decides
  what survives; the patch count is the receipt.
- Scheduling, memoization, and signals are all answers to "what is the
  cheapest correct update?" — measured, not guessed (Labs 2.4, 3.1–3.2).

Next: swap your `diff` for a keyed-only variant, re-run the whole todo app, and
write the two-paragraph design note — that note is how framework READMEs start.
