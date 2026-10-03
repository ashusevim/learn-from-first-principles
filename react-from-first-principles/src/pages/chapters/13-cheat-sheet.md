---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: React on One Page'
description: 'State, the diff, hooks and the scheduler on one page — the model, the rules, and the pitfalls with their chapters.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one contract: **UI = f(state), re-run `f` cheaply**. The
virtual DOM makes re-running safe, hooks make state survive re-runs, and every
rule below is the machinery protecting one of those two jobs.

## The one-page model

```text
  setState → schedule → run component(s) → new vdom → diff vs old → patch DOM → effects
             Ch 8           Ch 3–4            Ch 2         Ch 2, 7        Ch 5
```

Your own-react (Chapter 12) is this row in ~200 lines: `h` builds vdom nodes,
`reconcile` diffs and patches, `useState` reads `hooks[hookCursor++]`, and
`afterCommit` runs effects after the DOM agrees. Everything else in the
ecosystem is this loop wearing different clothes (Chapter 11).

## The React you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `h(type, props, ...kids)` | one vdom node — a description, not a DOM node | 2 |
| `diff(old, new)` / patch | minimal DOM edits; same-type reuse, else replace | 2 |
| function components | `f(props) → vdom`, composed by calling | 3 |
| `useState(initial)` | `hooks[i]` slot, addressed by call order | 4 |
| hook rules (order, top level) | the cursor is positional; conditional hooks shift slots | 4 |
| `useEffect(fn, deps)` | sync with the outside after commit; cleanup on change | 5 |
| Context | ambient values down the tree, without prop drilling | 6 |
| `key` on lists | identity for the diff — reorder ≠ recreate | 7 |
| fiber, conceptually | interruptible diff; the unit of scheduling | 8 |
| lifting state / stores / signals | where state lives when components grow apart | 9 |
| server components + Suspense | render off-client; stream the gaps | 10 |
| signals vs vdom | push updates vs re-run and diff — both correct | 11 |
| your ~200-line React | the whole table, assembled and running a todo app | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Hooks inside conditions/loops | slots shift; state "jumps" between hooks | Chapter 4 |
| Mutating state in place | same reference, no diff — the UI silently stays stale | Chapters 2, 4 |
| Missing `key` on lists | index-identity: edits teleport state across rows | Chapter 7 |
| Index as `key` | inserting at the top rewrites every row's identity | Chapter 7 |
| Effects without cleanup | subscriptions pile up; timers multiply | Chapter 5 |
| Effects with lying deps | stale closures read yesterday's props | Chapter 5 |
| Deriving state in `useState` | duplicate truth that drifts from its source | Chapters 4, 9 |
| Prop drilling past 3 levels | every middle component a rewrite risk | Chapter 6 |
| Assuming the diff is free | re-render everything, pay for everything — memoize knowingly | Chapters 2, 8 |
| "The vdom IS the speed" | the diff is the cost; correctness is the product | Chapters 2, 11 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Local UI state | `useState` — one slot, one component | many components need it — lift or store (Ch 9) |
| Ambient config (theme, locale) | Context, low-frequency values | it changes per keystroke — then props/memo (Ch 6) |
| Lists with identity | stable `key` from the data | order never changes — index is fine, knowingly (Ch 7) |
| Outside-world sync | `useEffect` + real cleanup | it can be derived during render — derive it (Ch 5) |
| Expensive subtrees | memoize on stable props | the diff was already cheap — measured first (Ch 8) |
| State across many owners | a store or signals — the Chapter 9 menu | state is one screen's — `useState` still wins (Ch 9, 11) |

## Prove it to yourself

**1. The diff is minimal:**

```javascript
patchCount = 0;   // increment inside your Chapter 12 patch()
setText("same");  setText("same");   // same vdom → zero patches
setText("new");                      // one patch — describe, diff, pay for deltas
```

**2. The hook cursor is positional:**

```javascript
// add one useState above the others inside an if — the todo list's state
// now lands in the wrong slot. The rule is the machinery showing itself (Ch 4).
```

**3. Keys keep state home:**

```javascript
// todo list: toggle "done" on item 1, delete item 0, re-render *without* keys:
// the checkmark jumps. With keys: it stays. Same diff, different identity (Ch 7).
```

## What you now know

- **UI = f(state), twice:** describe the screen, then diff descriptions —
  mutations only ever happen in the patch (Ch 1–2).
- **Hooks are an array and a cursor** (Ch 4): every "rule of hooks" is that
  sentence wearing a linter.
- **Keys are identity, effects are synchronization, fibers are scheduling**
  (Ch 5, 7–8) — three separable concerns that ship as one runtime.
- Signals, stores, server components are re-answers to the same question:
  *when the state changes, what is the cheapest correct response?* (Ch 9–11).

Next: twelve labs that instrument your own React — count the patches, break
the hooks, and race the keyed diff on camera.
