---
layout: ../../layouts/Chapter.astro
title: 'Concurrency ≠ Parallelism (And the GIL)'
description: 'Concurrency is structure, parallelism is speed. Build: the same word-count concurrent (1 core) and parallel (N cores), timed.'
part: 'Part III — Many Cores'
written: true
---

Eleven chapters in, a confession is due: almost nothing we've built so far runs
*simultaneously* on multiple cores — and that was fine, because concurrency was never
about speed. This chapter splits the two concepts that are constantly conflated, times
them on real cores, and explains the GIL — the most complained-about lock in existence —
as a direct consequence of ideas you already own.

## The lie you were told

> "Concurrent code runs faster because it does many things at once."

Rob Pike's line is exact: **concurrency is about dealing with lots of things at once;
parallelism is about doing lots of things at once.** Different axes:

```text
Concurrency (structure): interleaved handling of multiple tasks — works on 1 core
Parallelism (speed):     simultaneous execution on N cores      — needs N cores

threads on 1 core  = concurrency, zero parallelism (round-robin, Ch 1's scheduler)
4 threads, 4 cores = concurrency AND parallelism (finally: speed)
```

Chapters 5–8's event loop and green threads: pure concurrency, one core, and *better*
for it (waiting got cheap). Speed requires **cores** — and cores bring Chapter 9's
memory-ordering baggage, which is why "just add threads" is never free.

## The GIL, as a consequence not a villain

Python's Global Interpreter Lock: **one lock around the interpreter**, so only one
thread runs Python bytecode at any instant. Given your new toolkit, you can derive it
instead of resenting it: CPython's objects (reference counts!) aren't atomic (Chapter 1),
and protecting every `dict` and refcount with fine-grained locks was, in 1991, a bigger
risk than one big lock. Consequences:

```text
I/O-bound tasks  + threads:  FINE — the GIL releases during blocking I/O (Ch 6's problem!)
CPU-bound tasks  + threads:  NO speedup — threads take turns on the bytecode lock
CPU-bound tasks  + processes: FULL speedup — each process has its own interpreter+GIL
```

(That's also why asyncio and Chapter 5's C10K math matter so much in Python-land: the
event loop doesn't need parallelism for waiting. And why Go/Java/Rust don't have a GIL:
their runtimes made objects safe without one global lock.)

## Prove it to yourself

**1. The GIL, timed — CPU-bound, threads vs processes:**

```sh
python3 - <<'EOF'
import time, threading, multiprocessing

def burn(n):                      # pure CPU: sum squares (no I/O to release the GIL)
    return sum(i*i for i in range(n))

N = 10_000_000
t = time.time(); burn(N); burn(N); print(f"sequential 2x: {time.time()-t:.2f}s")
t = time.time()
ts = [threading.Thread(target=burn, args=(N,)) for _ in range(2)]
[th.start() for th in ts]; [th.join() for th in ts]
print(f"2 threads:     {time.time()-t:.2f}s   ← SAME, or slower (lock contention)")
t = time.time()
ps = [multiprocessing.Process(target=burn, args=(N,)) for _ in range(2)]
[p.start() for p in ps]; [p.join() for p in ps]
print(f"2 processes:   {time.time()-t:.2f}s   ← ~2x faster: real parallelism")
EOF
```

Threads: no gain (GIL serializes bytecode). Processes: ~2× (real cores). **The axis was
never threads-vs-no-threads; it was cores-vs-no-cores.**

**2. I/O-bound threads DO win** — the other half of the theorem:

```python
import time, threading, urllib.request
urls = ["https://example.com"] * 10
t = time.time()
ts = [threading.Thread(target=urllib.request.urlopen, args=(u,)) for u in urls]
[th.start() for th in ts]; [th.join() for th in ts]
print(f"10 fetches, 10 threads: {time.time()-t:.2f}s   ← ~1 fetch worth: GIL released while waiting")
```

While a thread waits on the network, it **releases the GIL** — other threads run.
I/O-bound + threads is the sweet spot the GIL never ruined.

## The build: word count, three ways, timed

```python
# wordcount.py — the same work: sequential / concurrent / parallel
import sys, time, re, threading, multiprocessing, collections

def count(text):                             # the CPU-bound unit of work
    return collections.Counter(re.findall(r"\w+", text.lower()))

def merge(counters):                         # combine partial counts
    total = collections.Counter()
    for c in counters: total.update(c)
    return total

if __name__ == "__main__":
    chunks = [open(f, encoding="utf8", errors="ignore").read()
              for f in sys.argv[1:]] or [open(__file__).read() * 500]

    t = time.time(); s = merge(count(c) for c in chunks)
    print(f"sequential:   {time.time()-t:.3f}s ({len(s)} distinct)")

    t = time.time()
    ts = [threading.Thread(target=lambda c=c: count(c)) for c in chunks]
    [th.start() for th in ts]; [th.join() for th in ts]
    print(f"threaded:     {time.time()-t:.3f}s (GIL: same wall — pure CPU)")

    t = time.time()
    with multiprocessing.Pool() as p: p.map(count, chunks)
    print(f"processes:    {time.time()-t:.3f}s (N cores: real parallelism)")
```

Run it on a multi-core machine with big inputs and watch the three lines tell the whole
story: threads ≈ sequential (GIL), processes ≈ N× (parallelism). *Structure* and
*speed*, separated at last.

## What you now know

- **Concurrency = interleaved structure (works on 1 core); parallelism = simultaneous
  execution (needs cores).** You need to name which one your problem actually is.
- The GIL is one coarse lock (Chapter 2's disease, Chapter 1's cure) — harmless for
  I/O-bound (released while waiting), fatal for CPU-bound threads.
- CPU-bound parallelism costs either processes (Python) or a runtime without a global
  lock (Go/Java/Rust) — the bill shows up somewhere, always.
- Course complete-circle: Chapter 1's race, Chapter 6's loop, Chapter 9's ordering —
  all three reappear in one timing script.

Next, the finale: every real server is a *hybrid* — the event loop owns the sockets
(waiting), a thread pool owns the CPU work (computing). Build your own mini-Tokio and
close the course.
