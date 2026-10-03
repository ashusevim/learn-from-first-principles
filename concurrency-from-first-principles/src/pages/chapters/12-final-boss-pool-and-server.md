---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: Thread Pool + Event Loop Web Server'
description: 'The hybrid every real server uses: event loop for sockets, thread pool for CPU work. Build: your own mini-Tokio.'
part: 'Part III — Many Cores'
written: true
---

The finale. Chapters 5–6 showed the event loop winning at waiting (10k sockets, one
thread) and Chapter 11 showed where it loses: CPU-bound work freezes everyone. The
answer — used by nginx, Tokio, Go's netpoller, and every serious server — is not to pick
a model but to **combine two**: the event loop owns *sockets and waiting*, a fixed
**thread pool** owns *blocking and CPU work*, and they hand tasks to each other. Build
your own, then close the course looking at everything you now own.

## The lie you were told

> "Real servers pick a model: event loop or threads."

They layer them. The division of labor is exact:

```text
        ┌──────────────────────────────────────────┐
        │  EVENT LOOP (1 thread)                   │
        │  epoll_wait → accept → read → dispatch   │   ← OWNS: sockets, timers, waiting
        └───────────────┬──────────────────────────┘
                        │ submits CPU/blocking tasks
                        ▼
        ┌──────────────────────────────────────────┐
        │  THREAD POOL (N threads)                 │   ← OWNS: hashing, parsing, disk,
        │  take task → compute → return result     │      anything that must not stall the loop
        └──────────────────────────────────────────┘
```

Why each lives where it lives: the loop's handlers must never block (Chapter 6's one
rule), so anything *slow* is shipped out; the pool's threads are Chapter 5's expensive
objects — so there are exactly as many as cores, not one per task. nginx: `worker`
processes each with an event loop + disk-thread pools. Tokio: core loops + a blocking
pool. Go: netpoller (the loop) + M:N scheduler (Chapter 8). **It's all Chapter 5's
arithmetic and Chapter 6's loop, composed.**

## The pieces you already built

```text
Ch 4: bounded buffer      → becomes the pool's task queue (verbatim!)
Ch 2–3: locks             → guard that queue (as ever)
Ch 5: the C10K wall       → why the loop, not thread-per-client
Ch 6: epoll loop          → the front half
Ch 11: cores vs waiting   → why the pool has exactly N threads
```

The finale is a composition exercise. You have every part.

## The build: mini-Tokio in Python (~60 lines)

An event loop accepting connections on `selectors` (epoll's portable cousin), plus a
thread pool executing CPU work, with the loop staying responsive **while hashes churn**:

```python
# minitokio.py — event loop (sockets) + thread pool (CPU): the hybrid, end to end
import socket, selectors, hashlib, time
from concurrent.futures import ThreadPoolExecutor

sel = selectors.DefaultSelector()                 # Ch 6's epoll, portable
pool = ThreadPoolExecutor(max_workers=4)          # Ch 5's threads — exactly 4, forever

def cpu_task(conn, n=8_000_000):                 # the "slow CPU work" (hashing)
    t = time.time()
    h = hashlib.sha256(str(n).encode()).hexdigest()
    for _ in range(50): h = hashlib.sha256(h.encode()).hexdigest()
    conn.sendall(f"hashed in {time.time()-t:.2f}s on a pool thread\n".encode())
    conn.close()

def on_readable(sock):                           # event-loop handler: NEVER blocks
    if sock is server:                           # new client → register, done in µs
        conn, _ = sock.accept()
        conn.setblocking(False)
        sel.register(conn, selectors.EVENT_READ, on_readable)
    else:                                        # client request → SHIP TO POOL, return
        sel.unregister(sock)
        pool.submit(cpu_task, sock)              # the loop does NOT hash; it returns!

server = socket.socket()
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(("127.0.0.1", 8080)); server.listen(100)
server.setblocking(False)
sel.register(server, selectors.EVENT_READ, on_readable)

print("mini-Tokio on :8080 — loop is accepting while the pool hashes")
while True:                                       # THE LOOP (Ch 6, verbatim shape)
    for key, _ in sel.select():
        on_readable(key.fileobj)
```

The proof it works — responsiveness under load:

```sh
python3 minitokio.py &
# terminal 1: request the CPU-heavy endpoint
time nc 127.0.0.1 8080 <<< "work"                 # takes ~0.5s (pool thread hashing)
# terminal 2, DURING that hash: a brand-new client:
time nc 127.0.0.1 8080 <<< "hello"                # responds in ~1ms — NOT stuck behind
                                                  # the hashing (Chapter 6's rule held:
                                                  # the loop never blocked)
```

That second `nc` returning instantly is the whole architecture: the expensive hash ran
on a pool thread, and the event loop kept accepting, registering, and dispatching
throughout. Freeze the loop (move `cpu_task` inline) and terminal 2 waits half a second —
run both versions and feel the difference the layering makes.

## Where you are now

Twelve chapters ago, "concurrency" was a fog of scary words. Now you've watched a race
disassemble into three instructions (Ch 1), built a spinlock from an atomic (Ch 2),
prevented a deadlock by ordering (Ch 3), slept threads with condvars (Ch 4), counted the
C10K cost of blocking (Ch 5), served 10k sockets on one thread with epoll (Ch 6),
rebuilt async/await from generators (Ch 7), scheduled green threads (Ch 8), tamed
reordering with acquire/release (Ch 9), gone lock-free and met ABA (Ch 10), split
concurrency from parallelism at the GIL (Ch 11) — and composed the hybrid that runs the
world's servers (Ch 12).

Two things ran at once. Now you know exactly how — and exactly what it cost.

**Where to go next:** read Tokio's architecture docs or nginx's internals — you'll
recognize every box. Profile a slow threaded program with `py-spy`/`perf` and name the
lock, the block, or the reordering. And the First Principles Project continues:
**Distributed Systems** takes Chapter 11's "two machines" problem and builds Raft —
consensus from first principles.
