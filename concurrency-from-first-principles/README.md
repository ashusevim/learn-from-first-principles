# Concurrency from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that demystifies the scariest vocabulary in software — race conditions,
deadlocks, event loops, async/await — by building each one from instructions and syscalls
up, until "two things at once" is mechanics, not folklore.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Git](../git-from-first-principles), [Databases](../databases-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — One Core, Many Threads**
1. Two Threads, One Counter: The Race, On Camera ✅
2. Locks from Scratch ✅
3. Mutexes, Deadlocks & Lock Ordering ✅
4. Condition Variables & the Bounded Buffer ✅

**Part II — Waiting Efficiently**
5. Blocking Is Expensive: Thread-per-Client Dies at 10k ✅
6. The Event Loop: One Thread, Ten Thousand Sockets ✅
7. async/await Demystified ✅
8. Green Threads & Schedulers ✅

**Part III — Many Cores**
9. Atomics & Memory Ordering ✅
10. Lock-Free Structures & the ABA Problem ✅
11. Concurrency ≠ Parallelism (And the GIL) ✅
12. Final Boss: Thread Pool + Event Loop Web Server ✅ *(your own mini-Tokio)*

All 12 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a measured race with disassembled crime scene, a spinlock
from atomic test-and-set, a deadlock on demand and its ordered cure, a bounded buffer, a
C10K measurement, an epoll echo server, async/await rebuilt from generators, a green-thread
scheduler, acquire/release message passing, a lock-free stack (and its ABA autopsy), a
three-way word-count timing, and a thread pool + event loop hybrid server.

## The rules of the course

1. **Start below the abstraction.** Before "use a mutex", answer "what did the CPU do?"
2. **Nothing is magic.** Races, locks, and event loops are watchable instructions.
3. **Build a toy version.** Spinlock, epoll server, async-from-generators, a thread pool.
4. **Then the tools are obvious.** async/await and goroutines become named patterns.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/spinlock.go` (Chapter 2's lock from an atomic CAS).
