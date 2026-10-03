---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Concurrency on One Page'
description: 'Races, locks, event loops and atomics on one page — the model, the primitives, and the failure modes with their chapters.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one argument: **shared state needs a protocol**. Below is that
protocol — the primitives, the failure modes, and which chapter disassembled each.

## The one-page model

```text
  goal                    tool                          chapter
  share without corruption  a lock + a strict lock order   Ch 2–3
  share without blocking    condition + its predicate      Ch 4
  wait on thousands         one event loop, never blocking Ch 5–6
  hide the callbacks        async/await as suspended work  Ch 7–8
  share ONE number fastest  atomics + fences               Ch 9–10
  use the cores             1 thread per core + loop + pool Ch 11–12
```

Two threads and one counter (Chapter 1) fork into two strategies: **make waiting
cheap** (loops, conditions, async) or **make sharing safe** (locks, atomics,
ownership). Confuse the two and you pay the two classic fees — deadlock buys
nothing, and blocking buys a dead server.

## The concurrency you actually use

| Primitive | Contract | In your build |
|---|---|---|
| `threading.Thread` + `join()` | a second stack; join waits for death | Ch 1, 5 |
| a hand-rolled lock (Chapter 2) | acquire = wait, release = wake one | Ch 2 |
| `Lock` + global lock order | same order everywhere → no cycles | Ch 3 |
| `Condition.wait()` in `while not ready:` | the predicate owns truth; wakeup is a hint | Ch 4 |
| bounded buffer / `queue.Queue` | producers block full, consumers block empty | Ch 4 |
| one event loop, non-blocking I/O | the loop never waits; readiness fires callbacks | Ch 5–6 |
| `async def` / `await` | pause here, resume on readiness | Ch 7 |
| green threads / scheduler | many stacks, few cores, cooperative yields | Ch 8 |
| atomic (CAS loop) | retry until yours was the last write | Ch 9 |
| acquire/release fence | which writes others see, in what order | Ch 9 |
| lock-free queue + hazard epoch | reclaim only what nobody reads | Ch 10 |
| `ThreadPoolExecutor` fed by the loop | loop owns sockets, pool owns slow work | Ch 12 |


## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Two threads, one unsynchronized counter | increments vanish; the total lies low | Chapter 1 |
| Locks taken in different orders | the cycle: A holds X waits Y, B holds Y waits X | Chapter 3 |
| `wait()` checked with `if`, not `while` | a stray wakeup acts on a false predicate | Chapter 4 |
| Holding a lock while waiting on an event | the loop stalls; "one thread" is "zero progress" | Chapters 4, 6 |
| One `select` loop doing CPU work | every connection freezes while you hash | Chapter 5 |
| `await` in a "quick" callback that is not | the whole loop inherits your latency | Chapter 7 |
| Assuming threads run on different cores | same-core threads share no speed; the GIL gates | Chapter 11 |
| Atomics as "faster locks" without fences | the write happened, but no provable order | Chapter 9 |
| Reclaiming a node still being read (ABA) | pointer matches, world changed — use-after-free | Chapter 10 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Protect one shared object | a lock and a fixed order | contention rules — shard or go lock-free (Ch 10) |
| Many producers/consumers | a bounded queue with conditions | latency must stay flat — size the bound, shed (Ch 4) |
| Ten thousand idle connections | a single non-blocking loop | any step blocks — pool it, don't callback it (Ch 6) |
| Readable async code | async/await over the loop | you need preemption — green is cooperative (Ch 8) |
| A shared counter or flag | an atomic, narrowest fence that holds | invariant spans two words — take the lock (Ch 9) |
| Full machine throughput | cores = pool threads, waiting = one loop | pure waiting — the pool is dead weight (Ch 11–12) |

## Prove it to yourself

**1. The race, counted:**

```python
import threading
count = 0
def bump():
    global count
    for _ in range(100_000):
        count += 1            # read, add, write — three steps, not one
ts = [threading.Thread(target=bump) for _ in range(4)]
[t.start() for t in ts]; [t.join() for t in ts]
print(count)                  # 400000 almost never; the losses ARE Chapter 1
```

Run five times, keep the lowest. Then guard the increment with a lock and watch the
answer freeze at `400000` — the price of correctness, in seconds.

**2. The pool earns its floor:**

```python
from concurrent.futures import ThreadPoolExecutor
import time
def burn(n=2_000_000):                      # pure CPU work
    return sum(i * i for i in range(n))
for w in (1, 4):
    t = time.time()
    with ThreadPoolExecutor(max_workers=w) as p:
        list(p.map(burn, range(8)))
    print(w, f"{time.time() - t:.2f}s")     # 1 worker costs ~4x the 4-worker wall
```

**3. The loop must never hash:**

```python
import selectors, socket
sel = selectors.DefaultSelector()
srv = socket.socket(); srv.bind(("127.0.0.1", 0)); srv.listen(50)
srv.setblocking(False)
sel.register(srv, selectors.EVENT_READ)     # one thread, fifty sockets, zero waits
print("accepts on", srv.getsockname())      # add burn() here and feel Lab 2's bill
```

## What you now know

- **Sharing needs a protocol:** locks plus order (Ch 3), predicates plus
  conditions (Ch 4), fences plus CAS (Ch 9) — match the tool to the shape.
- **Waiting needs a loop:** threads-per-client dies at ten thousand; readiness
  scales (Ch 5–6), and only while *nothing* in the loop blocks.
- **Cores need a division of labor:** loop for sockets, pool for work — the shape
  every real server converges on (Ch 12).
- The GIL, ABA, and lock ordering are each the bill for assuming the simple
  version holds.

Next: twelve labs that put your own mini-Tokio under load — starve it, race it,
and watch every failure mode from this page happen on camera.
