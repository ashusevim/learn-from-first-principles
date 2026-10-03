---
layout: ../../layouts/Chapter.astro
title: 'async/await Demystified'
description: 'await is a state machine in disguise. Build: async from scratch with Python generators — and the magic is gone.'
part: 'Part II — Waiting Efficiently'
written: true
---

Chapter 6's event loop has a human cost: handlers must "do a step, save state, return"
— code that reads like a crash site. async/await fixes the *ergonomics*, not the
mechanics: your function still pauses and resumes, but the compiler writes the state
machine. This chapter proves that claim by building **async/await from generators** —
you will run two "async" functions interleaved on a hand-rolled event loop, and the
magic will be exactly zero.

## The lie you were told

> "async/await runs your code on multiple threads."

Wrong, twice. `async` functions run **on the same single thread** as the Chapter 6 event
loop — that's the point (no stacks, no locks). And `await` is not new machinery: it is
**`yield`** — "pause me here, return control to the loop, resume me when the event I'm
waiting for fires." Same primitive Python's generators always had, dressed as syntax.

## The one primitive: pause and resume

A generator already does it:

```python
def counter():
    for i in range(3):
        yield i          # PAUSE here, hand control back, keep local state
        # ...resumes exactly here when .send() is called

g = counter()
print(next(g))           # 0  (paused after yield)
print(next(g))           # 1  (resumed — its local i is intact!)
```

`next(g)`/`g.send(v)` resumes the function *with all its locals preserved* — that's a
pauseable function, the entire primitive. An `async` function is a function compiled
into such a state machine; every `await` is a `yield` to the event loop.

## The translation, stated once

```text
async def fetch(url):                 def fetch(url):
    data = await read sock                data = yield read(sock)   ← pause here
    parse(data)                           parse(data)
    return result                         return result

loop:  resume tasks whose event fired — send() into the generator until the next yield
```

`await` ≈ `yield`: "I'm waiting on this event; run someone else; wake me when it's done."
The event loop (Chapter 6) calls `.send()` on every task whose socket became ready.
asyncio's `Task`, `await asyncio.sleep()`, `gather` — all bookkeeping over this loop.

## Prove it to yourself

**1. Interleaving with zero threads:**

```python
import asyncio, time

async def worker(name):
    for i in range(3):
        print(f"{name} step {i}")
        await asyncio.sleep(0.1)        # ← the yield: control returns to the loop

async def main():
    await asyncio.gather(worker("A"), worker("B"))   # both on ONE thread

asyncio.run(main())
# A step 0 / B step 0 / A step 1 / B step 1 / A step 2 / B step 2 — interleaved!
```

Add `threading.active_count()` — it's 1. The interleave is *cooperative*: each function
chooses to pause at `await`.

**2. See the state machine:**

```python
c = worker("A")
print(c.send(None))      # manual stepping — you ARE the event loop now
print(c.send(None))
```

Every `send()` resumes until the next `await`/`yield`. asyncio's loop is literally a
`while` calling `send()` on the tasks whose timers/fds fired.

**3. Where it breaks** — the one rule from Chapter 6 still applies:

```python
async def bad():
    time.sleep(1)        # BLOCKING sleep inside the loop: everyone freezes for 1s
async def good():
    await asyncio.sleep(1)   # yields to the loop instead
```

## The build: rebuild asyncio's core in ~40 lines

A real event loop driving real coroutines — timers included:

```python
# miniasync.py — a working async/await core: Task + loop, no asyncio
import time, heapq

class Task:
    def __init__(self, coro):
        self.coro = coro; self.wake_at = 0      # when this task wants resuming
        self.done = False
    def step(self):
        try:
            wake = self.coro.send(None)          # resume until next await/yield
            self.wake_at = wake                  # the yielded value = wake time
        except StopIteration:
            self.done = True

loop_queue = []                                  # (wake_at, seq, task) — a timer wheel

def sleep_until(t):                              # the "awaitable": yield a wake time
    return t

def run(*coros):
    tasks = [Task(c) for c in coros]
    for t in tasks: t.step()                     # start everyone
    now = time.monotonic()
    while any(not t.done for t in tasks):
        soonest = min(t.wake_at for t in tasks if not t.done)
        if soonest > now:                        # nothing ready: sleep until the timer
            time.sleep(min(soonest - now, 0.05))
            now = time.monotonic()
        for t in tasks:
            if not t.done and t.wake_at <= now:
                t.step()                          # resume whoever's event fired
        now = time.monotonic()

def mini_worker(name):
    for i in range(3):
        print(f"{name} step {i}")
        wake = time.monotonic() + 0.1
        while time.monotonic() < wake:            # (real loop: this IS the yield)
            pass
        yield sleep_until(wake)                   # ← await, from scratch

run(mini_worker("A"), mini_worker("B"))           # interleaved on ONE thread
```

`yield`-to-pause, a timer per task, a loop that `send()`s ready tasks — **that is
asyncio's core**, minus protocol polish. When you now read `await`, translate:
"pause this state machine; the loop resumes me when my event fires."

## What you now know

- `await` = **`yield` to the event loop**: pause, keep locals, resume on event. One
  thread, cooperative, zero locks — Chapter 6 with better ergonomics.
- `async def` compiles to a **state machine**; the loop drives it with `.send()`.
- The blocking-call trap persists: one `time.sleep` freezes every task on the loop.
- asyncio's API surface (Task, gather, sleep) is scheduling bookkeeping over this core.

Next: Python's generator-stack trick has limits — Go runs *millions* of real, preemptable
threads with 2 KB stacks. Green threads and user-space schedulers, next.
