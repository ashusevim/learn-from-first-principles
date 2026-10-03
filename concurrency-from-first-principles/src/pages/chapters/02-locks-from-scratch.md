---
layout: ../../layouts/Chapter.astro
title: 'Locks from Scratch'
description: 'Test-and-set is one atomic CPU instruction — everything else is ceremony. Build: a spinlock from an atomic swap.'
part: 'Part I — One Core, Many Threads'
written: true
---

Chapter 1 ended with a mutex fixing the race, and left a mystery: what *is* a lock,
physically? Prepare to be underwhelmed in the best way: a mutex is **one byte of memory
plus one atomic CPU instruction**. Everything else — futexes, priority inheritance, the
"mutex" class in your language — is ceremony around that seed. You'll build a working
lock in a dozen lines and race-test it against Chapter 1's crime scene.

## The lie you were told

> "Mutexes are OS magic handed to you by clever people."

The lock's *core* doesn't involve the OS at all. It's a CPU guarantee: **some
instructions are indivisible** — typically "read-modify-write a memory location in one
step" (x86's `XCHG`/`LOCK CMPXCHG`, ARM's `LDREX/STREX`). The hardware makes them atomic
by locking the cache line. The OS's involvement comes *later* (sleeping waiting threads —
Chapter 4's business). The lock itself is yours to build.

## Why the obvious lock is itself a race

You can't fix Chapter 1's race with a naive check — because the check is the same bug:

```c
if (lock == 0)          // thread A: sees 0...
    lock = 1;           // ...and gets PREEMPTED here. Thread B also sees 0. Both "acquire".
```

Check-then-act across two instructions has the exact LOAD/STORE gap from Chapter 1.
**The fix must be one instruction that both reads and writes** — so no gap exists to
interleave into. That's **test-and-set**: "give me the old value, and write 1, as one
uninterruptible step."

## The spinlock

With test-and-set available, a lock is three lines of intent:

```text
acquire:  while (test_and_set(lock) == 1) ;   // spin until WE set it first
release:  lock = 0;                            // just let go
```

The spinning thread burns CPU re-attempting — hence **spinlock**: right for held-for-
nanoseconds critical sections (kernel code, your counter), wrong for held-for-milliseconds
ones (that's when the OS futex machinery parks you, which `pthread_mutex_lock` does
automatically after a brief spin — a hybrid).

## Prove it to yourself

**1. The atomic instruction, in the metal:**

```sh
gcc -pthread -O2 -S spinlock.c -o - | grep -B1 -A1 'xchg\|lock' | head -8
# lock xchg %ax, (%rdi)    ← "lock": the cache line is exclusive during this. No gap.
```

**2. See pthread's hybrid nature:**

```sh
strace -f ./your_program 2>&1 | grep futex     # pthread_mutex_lock ends here:
# futex(FUTEX_WAIT, ...)                        ← sleep (only when contended!)
```

 uncontended pthread mutexes never syscall — the whole acquire is the one atomic
instruction in userland. `futex` appears only when someone actually has to sleep.

## The build: a spinlock that fixes Chapter 1

```c
// spinlock.c — gcc -pthread -O2 -o spinlock spinlock.c && ./spinlock
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>

atomic_flag lock = ATOMIC_FLAG_INIT;      // the lock: ONE atomic flag
long counter = 0;

void acquire(void) {                      // test-and-set until WE were the setter
    while (atomic_flag_test_and_set(&lock)) {
        /* spin — burn CPU, but burn it CORRECTLY */
    }
}
void release(void) {
    atomic_flag_clear(&lock);             // let go (a plain store, done in the right order)
}

void *million(void *arg) {
    for (long i = 0; i < 1000000; i++) {
        acquire();
        counter = counter + 1;            // Chapter 1's 3-instruction crime, now guarded
        release();
    }
    return NULL;
}

int main(void) {
    pthread_t a, b;
    pthread_create(&a, NULL, million, NULL);
    pthread_create(&b, NULL, million, NULL);
    pthread_join(a, NULL); pthread_join(b, NULL);
    printf("expected 2000000, got %ld\n", counter);   // 2000000. Every run. Forever.
    return 0;
}
```

The *entire* mutex, from raw primitives: a flag, a test-and-set loop, a clear. Swap in
`pthread_mutex_lock` and nothing changes numerically — because underneath, it's the same
idea plus a nap (Chapter 4).

**Homework that cements it:** replace `atomic_flag` with your own CAS loop —
`while (!atomic_compare_exchange_weak(&lock, &expected, 1));` — and check the assembly
again. Same `lock` prefix. That instruction is the atom everything else in this course
is built from.

## What you now know

- A lock = **one memory flag + one indivisible read-modify-write instruction**.
- Naive check-then-set has the Chapter 1 gap; **atomicity closes the gap by construction**.
- **Spinlocks** fit tiny critical sections; `pthread_mutex` spins briefly then futex-sleeps.
- Uncontended locks cost no syscalls — the common case is just one atomic instruction.

Next: your lock works — until a thread holds two locks and grabs them in opposite
orders. Deadlocks aren't bad luck; they're cycles, and next chapter you build one on
purpose and then prevent it mechanically.
