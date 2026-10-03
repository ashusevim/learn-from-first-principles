---
layout: ../../layouts/Chapter.astro
title: 'Atomics & Memory Ordering'
description: 'Why your lock-free code works on your machine and explodes on theirs: compilers and CPUs reorder. The memory model, without theology.'
part: 'Part III — Many Cores'
written: true
---

Chapters 2–8 kept one promise quietly: *"the second thread sees what the first did."*
On **multiple cores**, that promise is not free — and it's not even default. Compilers
reorder your instructions; CPUs execute out of order; each core's cache has its own view
of memory. The **memory model** is the contract that says what orderings are possible,
and atomics are the instructions that control it. This is the chapter that explains why
lock-free code "works on my machine" and detonates on a reviewer's ARM laptop.

## The lie you were told

> "If thread 1 writes A then B, thread 2 that sees B will see A."

Not guaranteed. Between the two threads stand three reordering agents:

```text
T1:  data = 42;      // your order
     flag = 1;

T2:  while (!flag) ; // spins...
     print(data);    // may print 0 (!!) — the flag arrived before the data did
```

1. The **compiler** may swap the two stores (both are independent, from its view).
2. The **CPU** may execute them out of order or complete them via store buffers at
   different times (x86 is *strongly ordered* — it still allows store→load reordering;
   ARM is *weakly ordered* — it allows nearly everything).
3. **Caches** propagate changes asynchronously between cores.

Chapter 2's atomics didn't just make one instruction indivisible — they also carry
**ordering semantics** that constrain all three agents. That's the part everyone forgets.

## The contract: acquire and release

You don't need to memorize the formal model. You need two words:

```text
release (on a store): "everything I wrote BEFORE this store must be visible before it"
acquire (on a load):  "everything the releasing thread wrote is visible AFTER I read it"

T1: data = 42;
    flag.store(1, release);      ← release: data is published WITH the flag
T2: if (flag.load(acquire))      ← acquire: reading the flag imports ALL of T1's writes
    print(data);                 // 42. Guaranteed. Every architecture.
```

Think of release/acquire as a **hermetic seal between threads**: whatever's above the
seal in program order travels with it. `memory_order_seq_cst` (the default) adds a
global total order — strongest, slightly slower. `memory_order_relaxed` gives atomicity
with *no* ordering — only for counters that care about the number, never the neighbors.

## Prove it to yourself

**1. Watch the compiler reorder** — the easiest agent to catch red-handed:

```sh
echo 'int x, y;
void f(void) { x = 1; y = 2; x = 3; }' > reorder.c
gcc -O2 -S reorder.c -o - | grep mov
# the compiler deleted x=1 entirely (dead store) and reordered freely.
# YOUR program order is already gone at -O2, even single-threaded.
```

**2. The message-passing litmus test** — run the broken version (plain ints) and the
fixed version (acquire/release) under load:

```c
// msgpass.c — gcc -pthread -O2 -o msgpass msgpass.c && ./msgpass
#include <stdio.h>
#include <stdatomic.h>
#include <pthread.h>

int data = 0;
atomic_int flag = 0;

void *producer(void *x) {
    for (long i = 0; i < 10000000; i++) {
        data = i;                                   // the "payload"
        atomic_store_explicit(&flag, 1, memory_order_release);  // seal: data ships with flag
        atomic_store_explicit(&flag, 0, memory_order_release);
    }
    return NULL;
}
void *consumer(void *x) {
    int seen_zero_data = 0;
    for (long i = 0; i < 10000000; i++) {
        while (!atomic_load_explicit(&flag, memory_order_acquire)) ;  // unseal
        if (data == 0) seen_zero_data++;            // must be impossible... or IS it?
        atomic_load_explicit(&flag, memory_order_acquire);
    }
    printf("saw flag=1 with data=0: %d times\n", seen_zero_data);
    return NULL;
}
/* with release/acquire: "0 times" — the seal holds.
   switch both to memory_order_relaxed and run on a multi-core box:
   data=0 sightings appear — the reorderings become observable. */
```

**3. Read the contract in the wild:** `man 3 pthread_mutex_lock` guarantees visibility
*because* mutex lock/unlock are acquire/release operations internally. Your locks were
memory fences all along.

## The build: message passing that survives reviewers

The pattern above — payload + release-flag / acquire-flag — is **the** foundational
lock-free idiom; every lock-free structure in Chapter 10 is it plus a data structure.
The durable habit:

```text
1. Share plain data only through release/acquire pairs (or locks — they're the same thing).
2. relaxed ONLY for independent counters (stats, IDs) — never for "published" data.
3. seq_cst by default; relax only with a written comment naming the invariant.
4. Test on the weakest machine you ship to (ARM), not just x86.
```

If you cannot state which write pairs with which read, you don't have a memory-ordering
design — you have a hope.

## What you now know

- "Program order" is fiction across cores: **compilers, CPUs, and caches all reorder**.
- **release/acquire** is the practical contract: a store seals prior writes; a load that
  sees it imports them. Locks are these operations plus sleeping.
- `relaxed` = atomic but unordered — counters only. `seq_cst` = default, global order.
- "Works on my machine" is a memory-model statement, not a QA pass.

Next: with atomics and ordering in hand, you can build structures with **no locks at
all** — and meet the subtlest bug in the field, ABA, which will humble you in exactly
the right way.
