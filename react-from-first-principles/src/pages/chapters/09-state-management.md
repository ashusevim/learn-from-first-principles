---
layout: ../../layouts/Chapter.astro
title: 'State Management: Lifting, Stores & Signals'
description: 'Redux, Zustand, signals — the same problem, different granularity. Build: a 30-line store that beats prop drilling.'
part: 'Part III — The Ecosystem'
written: true
---

Chapter 4's state lives per component. Real apps have state *between* components: the
cart that the header badge, the drawer, and the checkout all read. The ecosystem
offers a dozen tools with dramatic names — and they're all answers to two questions:
*where does shared state live?* and *who gets re-rendered when it changes?* This
chapter builds the three fundamental answers in miniature: lifting, a store, and a
signal.

## The lie you were told

> "You need a state management library."

You need **one of three mechanisms**, each ~30 lines:

```text
1. LIFTING:    state lives in the common ancestor; props carry it down (Ch 3).
               Simple, explicit — becomes prop drilling as depth grows (Ch 6's problem).

2. STORE:      state lives OUTSIDE the tree; components subscribe to slices.
               Context-free teleportation; re-render on the slice you read. (Redux/Zustand)

3. SIGNAL:     state is a live cell; DOM bindings update individually — no re-render,
               no diff. Fine-grained: the unit of change IS the unit of update. (SolidJS)
```

Everything else — Redux's reducers, Zustand's selectors, Jotai's atoms, signals —
varies the API over these three shapes. (Chapter 11 compares the update models.)

## The mechanic: subscribe-and-notify

Stores work on the observer pattern — one of the oldest in software, and exactly the
event loop's model (web course, Chapter 7):

```text
store = { state, listeners[] }
setState:  state = next; listeners.forEach(fn => fn(state))    ← notify on write
subscribe: listeners.push(fn); return () => remove(fn)         ← the unsubscribe (Ch 5!)
```

A React hook wraps it: `useSyncExternalStore(subscribe, getSnapshot)` — subscribe on
mount (effect, Ch 5), re-read on notify, cleanup on unmount. Thirty lines total, and
Redux's core semantics (single source of truth, notify on change) are yours.

## Prove it to yourself

**1. Prop drilling costs hops** — count the props a depth-5 component needs vs the
store's zero. Chapter 6 measured the pain; the store is the cure for depth, not for
complexity.

**2. Store updates are surgical** — with a selector (`state => state.cart.length`),
only components reading *that slice* re-render; the rest of the app doesn't hear the
write. Context (Chapter 6) re-renders every consumer on any value change — the
granularity difference between the two mechanisms, measured in render counts.

**3. The tradeoffs are visible in the code** — the store's `getSnapshot` must return
*stable references* (or React re-renders forever): immutable updates. Redux's
immutability discipline wasn't ceremony; it's the change-detection contract.

## The build: a store, a hook, and a signal

```python
# store.py — three answers to shared state: lifting, store, signal
class Store:                                            # mechanism 2: the store
    def __init__(self, initial):
        self.state, self.listeners = initial, []
    def subscribe(self, fn):
        self.listeners.append(fn)
        return lambda: self.listeners.remove(fn)        # unsubscribe (Ch 5's cleanup!)
    def set(self, next):
        self.state = next
        for fn in self.listeners: fn(self.state)        # notify subscribers

store = Store({"cart": [], "user": "ada"})
store.subscribe(lambda s: print(f"  header badge re-renders: cart has {len(s['cart'])}"))
store.subscribe(lambda s: print(f"  drawer re-renders (reads cart too)"))

store.set({"cart": ["milk"], "user": "ada"})
#   header badge re-renders: cart has 1
#   drawer re-renders (reads cart too)

# mechanism 3: the SIGNAL — a cell with direct DOM binding (no re-render at all)
class Signal:
    def __init__(self, value): self.value, self.bindings = value, []
    def set(self, v):
        self.value = v
        for bind in self.bindings: bind(v)              # update ONLY the bound nodes

count = Signal(0)
count.bindings.append(lambda v: print(f"  [DOM] badge text → {v} (one node, no diff)"))
count.set(1)
count.set(2)
#   [DOM] badge text → 1 (one node, no diff)
#   [DOM] badge text → 2 (one node, no diff)
# no re-render, no diff, no reconciliation — the write went straight to the node.
```

Read the output carefully: the **store** notifies *components* (which re-render and
diff — React's model); the **signal** notifies *DOM bindings* (which skip the
framework entirely — SolidJS's model). Same shared state, two update granularities.
That comparison is Chapter 11's whole debate, staged.

## What you now know

- Shared state has exactly three homes: **the common ancestor (lifting), outside the
  tree (store), or live cells (signals)** — every library is one of these with better
  ergonomics.
- Stores = **subscribe/notify** (observer); React integrates via a hook that
  subscribes on mount and cleans up on unmount (Ch 5's effects, again).
- Granularity is the real differentiator: context re-renders all consumers, stores
  re-render readers of a slice, **signals re-render nothing** — they patch nodes.
- Choose by reading *your* update pattern: who reads the value, how often it changes,
  and how much of the tree that invalidates.

Next: rendering isn't only a client act. Server components and Suspense — the web
course's streaming, applied to React's tree.
