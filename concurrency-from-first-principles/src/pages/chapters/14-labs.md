---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the pool and event-loop server from Chapter 12 — races, deadlocks, benchmarks. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in numbers you read off your own terminal, using
`minitokio.py` from Chapter 12. Nothing here is new theory — locks (Ch 2–3), the
bounded buffer (Ch 4), the loop (Ch 6), the hybrid (Ch 12). What is new is
*consequence*: by the last lab you will have caused every failure this course names.

## How the labs work

Every lab has four fields: **Goal**, **Do this**, **You'll know it works when**
(the expected output — diff yours against it), and **Where it comes from**.
Your instruments, all from Chapter 12:

| Tool | What it proves |
|---|---|
| `pool = ThreadPoolExecutor(max_workers=4)` | the worker side |
| `on_readable(sock)` + `pool.submit(cpu_task, sock)` | the handoff |
| `time nc 127.0.0.1 8080 <<< "work"` | one client, one hash job |
| a second client in another terminal | whether the loop survived |

## Warm-ups

**Lab 1.1 — Count the losses**
**Goal:** the race from Chapter 1, reproduced on your cores.
**Do this:**
```python
import threading
count = 0
def bump():
    global count
    for _ in range(100_000):
        count += 1
ts = [threading.Thread(target=bump) for _ in range(4)]
[t.start() for t in ts]; [t.join() for t in ts]
print(count)
```
**You'll know it works when:** five runs print five answers, all below `400000`.
Each missing increment is a read-add-write that interleaved.
**Where it comes from:** Chapter 1 — Two Threads, One Counter: The Race, On Camera.

**Lab 1.2 — Freeze the count with a lock**
**Goal:** the cheapest protocol that holds.
**Do this:** wrap the increment in a single shared `threading.Lock()`, rerun Lab 1.1.
**You'll know it works when:** five runs, five times `400000` — and the wall clock
roughly doubles, because four threads now queue through one gate.
**Where it comes from:** Chapter 2 — Locks from Scratch.

**Lab 1.3 — Deadlock in six lines**
**Goal:** the cycle (Chapter 3) as a hang you can point at.
**Do this:**
```python
import threading
a, b = threading.Lock(), threading.Lock()
def ab():            # order: a then b
    with a: input();  with b: pass
def ba():            # order: b then a
    with b: input();  with a: pass
```
Run `ab` and `ba` in two threads; press Enter in the first window, then the second.
**You'll know it works when:** the second thread never returns. Then swap `ba`'s
order to `a` then `b` and watch the hang vanish — ordering was the whole bug.
**Where it comes from:** Chapter 3 — Mutexes, Deadlocks & Lock Ordering.

## Builds

**Lab 2.1 — The queue blocks both ends**
**Goal:** the bounded buffer (Chapter 4) as mini-Tokio's task queue.
**Do this:** submit 20 `cpu_task`-shaped sleeps to a 4-worker pool from one
thread while a second thread submits 20 more:
```python
from concurrent.futures import ThreadPoolExecutor
import time
def job(n): time.sleep(0.2); return n
t = time.time()
with ThreadPoolExecutor(max_workers=4) as p:
    print(sorted(p.map(job, range(40))))
print(f"{time.time() - t:.1f}s")          # 40 jobs, 4 lanes — do the arithmetic
```
**You'll know it works when:** the wall reads ~2.0s — forty 0.2s jobs across four
threads, no more, no less. The queue absorbed the burst; nothing was lost.
**Where it comes from:** Chapter 4 — Condition Variables & the Bounded Buffer.

**Lab 2.2 — Block the loop, punish everyone**
**Goal:** feel Lab 2's cost inside a live server: one slow callback, all clients pay.
**Do this:** in `minitokio.py`, call `cpu_task` *directly* inside `on_readable`
instead of `pool.submit`; connect two clients seconds apart and time both replies.
**You'll know it works when:** client two's reply arrives only after client one's
hash finishes — serialized, ~0.5s plus ~0.5s. Revert to `pool.submit` and watch the
two replies overlap. Direct call vs submit is the entire Chapter 5 argument.
**Where it comes from:** Chapter 5 — Blocking Is Expensive: Thread-per-Client Dies at 10k, and Chapter 12.

**Lab 2.3 — One worker is a queue with a hat**
**Goal:** the pool's scaling law, measured on your machine.
**Do this:** run Chapter 12's benchmark spirit as a sweep:
```python
from concurrent.futures import ThreadPoolExecutor
import time, os
def burn(): return sum(i * i for i in range(3_000_000))
for w in (1, 2, 4, 8):
    t = time.time()
    with ThreadPoolExecutor(max_workers=w) as p:
        list(p.map(burn, range(8)))
    print(f"workers={w}  {time.time() - t:.2f}s")   # improves, then flattens
print("cores:", os.cpu_count())
```
**You'll know it works when:** the wall drops to your core count, then stops —
workers past the cores buy context switches, not speed. That knee is Chapter 11,
priced in seconds.
**Where it comes from:** Chapter 11 — Concurrency ≠ Parallelism (And the GIL), and Chapter 12.

**Lab 2.4 — Lose an update, then forbid it**
**Goal:** the race inside the server: two tasks, one counter, Chapter 12's pool.
**Do this:** give `minitokio.py` a global `served = 0` incremented in `cpu_task`
without a lock; fire 200 `nc` requests (`for i in $(seq 200)`) and read `served`.
**You'll know it works when:** the count reads below 200. Add one lock around the
increment, rerun, and read exactly `200` — Chapter 1's loss, fixed by Chapter 2's
gate, inside Chapter 12's server.
**Where it comes from:** Chapters 1, 2 and 12.

**Lab 2.5 — Async sugar over the same loop**
**Goal:** `async/await` (Chapter 7) changes spelling, not machinery.
**Do this:** rewrite one `on_readable` path as an `async def` coroutine driven by
the same selector loop — await on a socket-ready future instead of a callback.
**You'll know it works when:** the two-client timing from Lab 2.2 is unchanged to
the tenth of a second. Same loop, same readiness, flatter code — sugar is honest.
**Where it comes from:** Chapter 7 — async/await Demystified.

## Stretch goals

**Lab 3.1 — Starve the pool**
**Goal:** find the cliff past the knee of Lab 2.3.
**Do this:** push the sweep to 64 workers on a CPU-bound `burn`, then repeat with
an I/O-bound `job` (sleep 0.2).
**You'll know it works when:** the CPU sweep gets *slower* past the cores while
the I/O sweep keeps improving to dozens of workers. The same knob points opposite
ways — which is why pools are sized by workload, not by hope.
**Where it comes from:** Chapters 5 and 11.

**Lab 3.2 — The GIL on the witness stand**
**Goal:** separate "parallel" from "concurrent" with one experiment (Chapter 11).
**Do this:** time Lab 2.3's CPU `burn` at 4 workers, then time four *processes*
(`multiprocessing.Pool(4)`) on the same work.
**You'll know it works when:** threads show no better than ~1 core of CPU work
while processes scale — the GIL, priced, with the processes as control group.
**Where it comes from:** Chapter 11 — Concurrency ≠ Parallelism (And the GIL).

## Self-checking without a grader

- **Count labs** (1.1, 1.2, 2.4): exact integers are the test — `400000` vs lower,
  `200` vs lower. Rerun five times; flakiness *in the wrong direction* is data.
- **Timing labs** (2.1, 2.2, 2.3, 2.5, 3.1): ratios, not absolutes — `~2.0s`,
  `~4x`, overlap vs serialization. Your silicon differs; the shape must not.
- **Hang lab** (1.3): the proof is non-termination versus clean exit. A hang that
  vanishes when the order is fixed *is* the diagnosis.

## What you now know

- **Every number in this chapter has a cause:** lost increments are interleavings
  (Lab 1.1), the 2.0s wall is four lanes (Lab 2.1), the knee is your core count
  (Lab 2.3).
- **The loop survives only by never waiting:** Lab 2.2 is the one experiment to
  repeat whenever a "fast" server feels slow.
- **Threads vs processes is measurable, not philosophical** (Lab 3.2) — run the
  pair before you argue the point.
- **The hybrid is the answer and these labs are its receipt:** loop for sockets,
  pool for work, locks where they share.

Next: take any server you operate, find its loop-or-pool boundary, and ask which
Lab 2.2 it would fail — then fix the callback before the load finds it.
