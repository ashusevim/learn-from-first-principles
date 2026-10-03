---
layout: ../../layouts/Chapter.astro
title: 'Condition Variables & the Bounded Buffer'
description: 'How threads wait for "something happened" without spinning. Build: the producer/consumer pattern, the ancestor of every queue.'
part: 'Part I — One Core, Many Threads'
written: true
---

Locks (Chapters 2–3) let threads *avoid* each other. But the most common relationship
between threads is *cooperation*: a producer generating work, a consumer waiting for it.
Polling in a loop burns CPU; sleeping forever misses the signal. The bridge between
those is the **condition variable** — and the pattern built on it, the **bounded
buffer**, is the ancestor of every queue, channel, and worker pool you've ever used.

## The lie you were told

> "Threads check whether data is ready, in a loop."

That's **busy-waiting** — a thread burning a full core re-asking "now? now? now?" The
right primitive: **sleep until someone signals that the thing you're waiting for may
have changed.** That's a condition variable: a wait-queue attached to a mutex, with one
delicate dance at its core.

## The dance: wait must release the lock

A consumer waiting for data must *not* hold the mutex while asleep (the producer could
never lock it to add data). So `wait()` is atomic in a way no user code can be:

```text
cond_wait(cv, m):
    1. atomically: unlock m  +  put this thread to sleep
    2. (asleep — nothing can be missed in here)
    3. on signal: wake, RE-acquire m, return
```

Steps 1 and 3 must be atomic — if "unlock" and "sleep" were separate, a signal arriving
between them would be **lost**, and the thread would sleep forever (the classic *lost
wakeup*). Only the kernel can make those steps one step; that's why condvars are
primitives and not libraries.

And the check-then-wait must be a `while`, never an `if`:

```c
while (buffer_empty)          // WHILE: after waking, re-check the condition!
    pthread_cond_wait(&cv, &m);
```

Because the waker's signal may have been "stolen" by another consumer, or the wake may
be **spurious** (permitted by POSIX!). `while` re-validates reality; `if` trusts a rumor.

## The bounded buffer: the pattern under every queue

Producers put; consumers take; a fixed-size buffer in between:

```text
           notFull.wait()          notEmpty.wait()
producers ────────► [ ▓ ▓ ▓ ▓ _ ] ────────► consumers
            wait when FULL          wait when EMPTY
            signal notEmpty          signal notFull
```

Two condition variables, one mutex, four rules. This ~40-line pattern is Kafka, Go
channels, `BlockingQueue`, your task queue at work — all of them, structurally.

## Prove it to yourself

**1. Watch busy-wait burn a core vs a condvar sleeping:**

```sh
top -p $(pgrep -f busywait)      # ~100% CPU forever
top -p $(pgrep -f sleeping)      # ~0% CPU while waiting
```

**2. Watch the wakeup flow** — producer prints, consumer wakes, both alternate with the
consumer's "waiting..." lines *between* items. The ordering visible in stdout is the
dance, made visible.

**3. Break it on purpose** — signal *before* anyone waits (the lost wakeup):

```c
pthread_cond_signal(&cv);        // fires into the void: nobody waiting
...
pthread_cond_wait(&cv, &m);      // sleeps forever — the signal is gone
```

Then re-break it with `if` instead of `while` plus a second consumer: occasionally a
consumer wakes to an empty buffer and crashes the invariant. These two failure modes are
*the* reason condvar code looks the way it does.

## The build: a bounded buffer in ~35 lines

```python
# buffer.py — producer/consumer with a bounded buffer (the queue ancestor)
import threading, time, random

buf, CAP = [], 3
mutex = threading.Lock()
not_full  = threading.Condition(mutex)   # both condvars share ONE lock — required!
not_empty = threading.Condition(mutex)

def producer(n):
    for i in range(n):
        with not_full:
            while len(buf) == CAP:                   # while, never if (Ch 3 discipline)
                print("  producer: buffer FULL, sleeping")
                not_full.wait()                      # release lock + sleep + reacquire
            buf.append(i)
            print(f"producer: put {i} (size {len(buf)})")
            not_empty.notify()                       # wake ONE consumer

def consumer(n):
    while True:
        with not_empty:
            while not buf:
                print("  consumer: buffer EMPTY, sleeping")
                not_empty.wait()
            item = buf.pop(0)
            print(f"consumer: took {item} (size {len(buf)})")
            not_full.notify()                        # wake ONE producer

threading.Thread(target=producer, args=(8,), daemon=True).start()
threading.Thread(target=consumer, daemon=True).start()
time.sleep(2)
```

Run it and watch the rhythm: puts, takes, and the "sleeping" lines appearing exactly when
the buffer hits its bounds. Two threads cooperating with **zero busy-waiting and zero
dropped items** — because the wait/signal dance is atomic where it must be.

**One debug superpower unlocked:** when a threaded program hangs, the question "who is
waiting on what?" is answerable — `gdb`'s `thread apply all bt` (or py-spy in Python)
shows the wait chains, and Chapter 3's cycle-hunting applies to condvars too. Sleeping
threads have paper trails.

## What you now know

- Condvar = **sleep-until-signaled**, with the unlock/sleep/relock dance done atomically
  by the kernel (lost wakeups impossible at that level).
- Always re-check in a **`while`**: signals can be stolen or spurious.
- The **bounded buffer** (one mutex + two condvars) is the seed of every queue/channel/
  worker-pool abstraction you will ever use.

Next: cooperation solved for *a few* threads. But what happens when a server spawns one
thread per client and ten thousand clients arrive? The wall called C10K — and the idea
that replaces threads entirely: the event loop.
