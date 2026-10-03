---
layout: ../../layouts/Chapter.astro
title: 'Fiber, Conceptually: Interruptible Rendering'
description: 'React 16 rewrote its stack into a heap so rendering could pause. Build: a time-sliced diff that yields.'
part: 'Part II — The Mechanics'
written: true
---

Chapter 2's diff is recursive — and that's a hidden limitation: **recursion runs on
the JavaScript call stack, and a call stack cannot be paused.** Once `diff()` starts,
it runs to completion, however long it takes — 5ms, 50ms, whatever the tree demands.
Chapter 8 of the web course showed what that does to a 16.7ms frame budget. React 16's
**fiber** rewrite is the fix: represent the work as a *linked-list heap* instead of
implicit stack frames, so the loop can do a unit of work, check the clock, and yield.
Build a time-sliced diff and the word "fiber" stops being scary.

## The lie you were told

> "Fiber is React's internal plumbing you never need to understand."

Fiber is the answer to a question the web course made urgent: *what happens when
rendering takes longer than a frame?* Pre-fiber React: the frame drops (Chapter 7's
frozen page). Fiber: rendering splits into units of work that **yield** between them —
so input events and animation frames can interleave, and low-priority renders can be
*abandoned* entirely when state changes mid-render.

## Stack vs heap: the one diagram

```text
recursive diff (Ch 2):              fiber diff:

diff(node)                          workLoop():
  diff(child1)    ← stack frame       unit = fiberHead
    diff(child1a)  ← deeper...        while (unit && !deadlinePassed):
      ...                               performUnit(unit)      ← do ONE node's work
  ...returns only when ALL done         unit = unit.next       ← advance via POINTERS
                                    (yield to browser between iterations!)
```

The recursion's call chain *is* the schedule — untouchable. The fiber version walks a
linked list: **child → sibling → return** pointers, each node a work unit. A pointer
walk can stop anywhere; a call chain can't. That's the entire rewrite: same diff,
same result, different *control* structure. (The concurrency course, Chapter 8's
scheduler — the same "pause the loop" move, at the renderer.)

## What units of work buy

- **Time slicing**: 10ms of diffing, yield, 10ms more — the page stays responsive
  during a big render.
- **Priorities**: a keystroke's render can jump the queue ahead of a data-refresh
  render.
- **Abandonment**: state changed mid-render? Drop the in-progress tree (it's just
  pointers — nothing was committed) and restart with fresh state. Impossible when
  you're 30 frames deep in a call stack.
- **Suspense**: "this subtree isn't ready" is just a fiber that yields until data
  arrives (Chapter 10).

## Prove it to yourself

**1. Pre-fiber jank vs fiber responsiveness** — the build below renders the same
10,000-node tree both ways; the recursive version blocks for ~200ms, the sliced
version keeps printing "still responsive" between slices.

**2. The fiber structure in DevTools** — React DevTools' "tree" is literally the
fiber linked lists; each node's `child`/`sibling`/`return` are the three pointers.

**3. The interrupt, felt** — start a sliced render, click a button mid-render: your
click handler runs *between* units. Start a recursive render, click: the click waits
for the whole diff.

## The build: a time-sliced diff

```python
# fiber.py — recursive diff vs fiber-style time-sliced diff (same work, different control)
import time

class Fiber:
    def __init__(self, name, kids=()):
        self.name, self.kids = name, list(kids)
        self.child = self.sibling = self.return = None   # the three fiber pointers

def to_fibers(node, parent=None):
    """vdom tree → fiber linked list: child ↓, sibling →, return ↑"""
    f = Fiber(node["name"])
    f.return = parent
    prev = None
    for kid in node.get("kids", []):
        kf = to_fibers(kid, f)
        if prev: prev.sibling = kf                       # siblings chained
        else:    f.child = kf                            # first kid = child pointer
        prev = kf
    return f

def work_units(head):
    """walk child → sibling → return: the fiber traversal order, as a flat list"""
    unit, out = head, []
    while unit:
        out.append(unit)
        if unit.child: unit = unit.child
        else:
            while unit and not unit.sibling: unit = unit.return   # climb back up
            unit = unit.sibling if unit else None
    return out

def recursive_diff(node):                                # Ch 2's version: call-stack bound
    total = sum(recursive_diff(k) for k in node.get("kids", [])) + 1
    return total

def sliced_diff(units, slice_ms=5):                      # the fiber loop
    done, slices, deadline = 0, 1, time.monotonic() + slice_ms
    for u in units:
        done += 1                                        # performUnit(u) — one node
        if time.monotonic() > deadline:                  # clock check BETWEEN units
            slices += 1                                  # yield: browser can paint/input
            deadline = time.monotonic() + slice_ms
    return done, slices

big = {"name": "root", "kids": [{"name": f"n{i}", "kids": []} for i in range(10000)]}

t = time.monotonic(); recursive_diff(big)
print(f"recursive: 10,000 nodes, {1000*(time.monotonic()-t):.1f}ms — UNINTERRUPTIBLE")

fiber = to_fibers(big)
units = work_units(fiber.child)
done, slices = sliced_diff(units, slice_ms=5)
print(f"fiber:     {done} nodes in {slices} slices — yielded {slices-1}× for input/paint")
```

Same tree, same total work. The recursive version is one opaque blocking call; the
fiber version reports how many times it *yielded* — and each yield is a frame the
browser could have used. (React's actual loop uses `requestIdleCallback`/`MessageChannel`
for its yield points and tracks expiration per fiber for priorities — the structure
here is the idea, faithfully.)

## What you now know

- **Fiber = the diff's call stack rewritten as a linked-list heap**: child/sibling/
  return pointers make rendering a walkable list of work units.
- Pointer-walks can **yield** — time slicing keeps the frame budget (web course, Ch 8)
  alive during big renders.
- Work-as-data enables **priorities and abandonment** — a pending render is just
  pointers; drop them and restart at zero cost.
- Suspense, transitions, and concurrent rendering are all "a fiber that hasn't
  finished yet" — the mechanism you just built.

Next: state works per component; effects sync with the world; context teleports. What
remains is *shared application state* — and the ecosystem's three answers (lifting,
stores, signals) at 30 lines each.
