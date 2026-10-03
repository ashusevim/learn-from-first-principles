---
layout: ../../layouts/Chapter.astro
title: 'JavaScript: The Single Thread That Runs Everything'
description: 'Call stack, task queue, microtasks — the browser as an event loop (the concurrency course, wearing a DOM). Build: trace task order.'
part: 'Part II — The Document'
written: true
---

The DOM is a tree; JavaScript is the only thing that can touch it — from **one
thread**. The concurrency course (Chapters 6–7) already built this machine: an event
loop, a call stack, queues of ready tasks. The browser's version has one famous twist —
**microtasks jump the queue** — and one famous consequence: a long script freezes the
page. This chapter traces task order until the classic interview puzzle becomes
arithmetic.

## The lie you were told

> "JavaScript handles concurrent work with threads."

There is **one thread per tab** (Chapter 11 of the concurrency course: the JS model by
design). "Concurrent" work — timers, network, clicks — lives in the *browser*; JS only
gets callbacks handed to it in queues:

```text
┌─ call stack ────────────────┐   the JS code running NOW (one frame at a time)
├─ microtask queue ───────────┤   promise callbacks — DRAINED COMPLETELY after each task
├─ task queue (macrotasks)    │   timers, events, I/O — ONE per loop iteration
└─ rendering ─────────────────┘   style/layout/paint (Ch 8) — between tasks, ~16ms cadence

the loop: run ONE task → drain ALL microtasks → (maybe render) → next task → ...
```

## The twist: microtasks vs macrotasks

Two queues, one cruel rule: after each task, the **entire microtask queue drains** —
including microtasks spawned by microtasks — before any rendering or the next task.

The canonical puzzle:

```javascript
console.log("1: sync");
setTimeout(() => console.log("4: macrotask (timer)"), 0);
Promise.resolve().then(() => console.log("3: microtask (promise)"));
console.log("2: sync end");
// output: 1, 2, 3, 4  — ALWAYS, regardless of the 0ms timer
```

Why: the synchronous code runs as the first task; the timer callback is *queued* as a
macrotask (0 means "next iteration", not "now"); the promise callback is a microtask,
which drains **before the loop may even consider** the timer. `setTimeout(fn, 0)` can't
beat one microtask — the queues have different authority.

## The consequence: one bad function freezes the page

Since rendering happens *between* tasks, a 3-second script = 3 seconds of frozen
input, no paint, no scrolling (the tab may offer to kill itself — "page unresponsive").
This is why long tasks are the enemy of feel (Chapter 8's frame budget: 16.7ms), why
`requestAnimationFrame` exists (align with the render slot), and why heavy work gets
shipped to Workers — *real* threads with **no DOM access** (the price of the single
thread: the DOM can't have two writers).

## Prove it to yourself

**1. The order puzzle, plus a twist:**

```javascript
setTimeout(() => console.log("timer"), 0);
Promise.resolve()
  .then(() => console.log("micro 1"))
  .then(() => console.log("micro 2"));      // a microtask SPAWNING a microtask
console.log("sync");
// sync → micro 1 → micro 2 → timer
// micro 2 runs BEFORE the timer even though it was created LATER — the drain is total.
```

**2. The freeze, measured:**

```javascript
const start = performance.now();
let x = 0;
while (performance.now() - start < 2000) x++;   // a 2-second task
// try scrolling during those 2 seconds. The tab is a statue. That's the single thread.
```

**3. Timers lie by at least one frame:**

```javascript
const t = performance.now();
setTimeout(() => console.log(performance.now() - t), 0);
// prints 0.x ms sometimes, but under load: 20, 50, 200+ — 0 is a MINIMUM,
// and rendering may legally interleave before the timer task. Never a clock.
```

## The build: a browser-faithful event loop in Python

The concurrency course (Chapter 7) built a loop with timers. Here's the browser
variant — **two queues with different authority**:

```python
# miniloop.py — the browser event loop: tasks, microtasks, and the render slot
import time

class BrowserLoop:
    def __init__(self):
        self.tasks = []          # macrotasks: timers, events (ONE per iteration)
        self.microtasks = []     # promises: drained COMPLETELY after each task

    def schedule(self, fn):            self.tasks.append(fn)     # like setTimeout(fn, 0)
    def micro(self, fn):               self.microtasks.append(fn) # like Promise.then
    def sync(self, fn):                fn()                       # runs immediately (the stack)

    def run(self):
        while self.tasks or self.microtasks:
            if self.tasks:
                task = self.tasks.pop(0)          # take exactly ONE task
                task()                            # run it on the "stack"
                while self.microtasks:            # ← DRAIN ALL microtasks fully,
                    self.microtasks.pop(0)()      #   including newly spawned ones
                self.render()                     # only THEN may the screen update
            time.sleep(0.001)

    def render(self): print("   [render: the page paints here]")

loop = BrowserLoop()
loop.sync(lambda: print("1: sync"))
loop.schedule(lambda: print("4: timer task"))
loop.micro(lambda: print("3: microtask"))
loop.sync(lambda: print("2: sync end"))
loop.run()
# 1: sync / 2: sync end / 3: microtask / [render] / 4: timer task / [render]
```

The output is the JavaScript puzzle, replicated: microtasks between sync end and the
timer; renders *between tasks, never during*. Adjust the loop and you adjust the
browser's guarantees — and its pathologies.

## What you now know

- JS is **one thread per tab**; the browser does the waiting and hands back callbacks
  via queues (concurrency course Ch 6–7, wearing a DOM).
- After each task: **drain all microtasks** (promises) — then render, then next task.
  This ordering decides every "which logs first" puzzle.
- `setTimeout(fn, 0)` is a macrotask: minimum, never immediate; microtasks always
  outrank it.
- Long tasks block rendering — the origin of jank, Workers, and code splitting (Ch 8's
  frame budget).

Next: the styled, scripted tree becomes pixels — style → layout → paint → composite,
and why `transform` is free while `width` is a bomb.
