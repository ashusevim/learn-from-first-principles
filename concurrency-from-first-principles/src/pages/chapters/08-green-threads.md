---
layout: ../../layouts/Chapter.astro
title: 'Green Threads & Schedulers'
description: 'Go-style goroutines are user-space threads with tiny stacks. Build: a round-robin scheduler over generators.'
part: 'Part II — Waiting Efficiently'
written: true
---

async/await (Chapter 7) made pausable functions *writable*, but you still pepper code
with `await` — the programmer manages the pauses. Go asked: what if threads were just...
cheap? A **goroutine** is a real thread — blocking calls, plain code, no `await` — that
lives in user space with a ~2 KB stack, scheduled by the language runtime instead of the
kernel. Millions can exist. This chapter builds a toy scheduler and names the trade
between the three great models: threads, event loop, green threads.

## The lie you were told

> "Goroutines are a runtime miracle you can't replicate."

The runtime's job is two things: **tiny stacks** (grow on demand, instead of the kernel's
8 MB reservation — Chapter 5's arithmetic inverted) and a **user-space scheduler** (a
loop that picks which paused task to resume — same shape as Chapter 7's loop, minus the
`await` noise). When a goroutine blocks on I/O, the runtime parks it and runs another;
your code stays linear. Not magic — a scheduler, and you'll write one.

## The three models, finally side by side

| Model | Pauses are... | State cost | Code shape | The tax |
|---|---|---|---|---|
| **Kernel threads** (Ch 5) | involuntary (OS preempts) | ~64 KB–8 MB | plain | dies at 10k waiting |
| **Event loop / async** (Ch 6–7) | voluntary (`await`) | ~100 B | state machines (or `await`) | one block stalls all |
| **Green threads** (here) | runtime-managed | ~2 KB | plain | runtime complexity |

Green threads keep the plain-code ergonomics of threads with the state-cost of the event
loop — at the price of the *runtime* doing stack management and preemption (Go inserts
preemption points at function calls; that's why a tight loop without calls can hog a P
in older Go versions).

## Prove it to yourself

**1. Millions of goroutines, verified:**

```go
// go version — each goroutine: plain blocking code, no await, no callback
for i := 0; i < 1000000; i++ {
    go func(n int) { time.Sleep(1 * time.Minute) }(i)   // a MILLION "threads"
}
time.Sleep(10 * time.Second)      // RSS: a few hundred MB total — Chapter 5 math inverted
```

Do the same with OS threads (Chapter 5's script) at 10k and watch it already struggle.
The delta is the runtime's stack trick.

**2. Blocking code, no awaits — in the toy scheduler below**, each task reads like
linear code, yet three of them interleave. That ergonomics gap between Chapter 7 and
this is *the* Go pitch.

**3. Scheduling, observed** — the toy prints the schedule; fairness is visible as
round-robin order, not as an OS black box.

## The build: a round-robin green-thread scheduler

```python
# greensched.py — user-space scheduling over generators: round-robin, with sleeps
import time

class Scheduler:
    def __init__(self):
        self.tasks = []                          # [(wake_time, task_id, generator)]

    def spawn(self, coro):
        self.tasks.append([0, len(self.tasks), coro])   # ready at t=0

    def run(self):
        while self.tasks:
            now = time.monotonic()
            ready, waiting = [], []
            for entry in self.tasks:
                (ready if entry[0] <= now else waiting).append(entry)
            if not ready and waiting:            # nothing runnable: nap to the nearest wake
                time.sleep(min(w[0] for w in waiting) - now + 0.001)
                continue
            for entry in ready:                  # round-robin: one step each
                _, tid, coro = entry
                try:
                    wake = coro.send(None)       # resume the "thread" until its next pause
                    entry[0] = wake              # it told us when it wants to run next
                    waiting.append(entry)
                except StopIteration:
                    pass                         # the "thread" finished
            self.tasks = waiting

S = Scheduler()

def worker(name, n):                             # PLAIN code: no await, no callbacks
    for i in range(n):
        print(f"{name} step {i}")
        wake = time.monotonic() + 0.1            # "block" for 0.1s — like time.Sleep in Go
        while time.monotonic() < wake: pass
        yield wake                               # ...the one concession to the toy

S.spawn(worker("A", 3))
S.spawn(worker("B", 3))
S.spawn(worker("C", 3))
S.run()
# A0 B0 C0 / A1 B1 C1 / A2 B2 C2 — three "threads", one OS thread, round-robin, fair
```

Read `worker`: it's plain linear code. The interleave comes from the *scheduler*
resuming whoever's ready — the Chapter 7 loop, minus `await`-everywhere, plus fairness.
That's the green-thread pitch in 30 lines. (Real runtimes additionally switch *stacks*
— `ucontext`/`boost.context`/Go's assembly — so pauses can happen at any function call,
not just explicit yields. Same scheduler, deeper pause points.)

## What you now know

- Green threads = **user-space stacks + user-space scheduler**: plain code, tiny state.
- The scheduler is Chapter 7's loop with **fairness** instead of I/O events — one `while`
  and a `send()`.
- The model triangle is now complete: **threads** (OS preempts, heavy), **async**
  (you pause, tiny), **green** (runtime pauses, small + plain).
- Every server runtime you've heard of — Go, Erlang, Java's Loom — is a point in that
  triangle, not a new idea.

Next: one gap remains. Everything so far ran on **one core** (round-robin is not speed).
When tasks run on *many cores at the same instant*, a new species of problem appears:
memory ordering — the reason your correct-looking code fails only on someone else's
machine. Chapter 9.
