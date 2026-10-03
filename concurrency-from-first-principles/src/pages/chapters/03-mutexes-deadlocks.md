---
layout: ../../layouts/Chapter.astro
title: 'Mutexes, Deadlocks & Lock Ordering'
description: 'Deadlocks are circular waits — mechanically preventable. Build: deadlock on demand, then fix it by ordering.'
part: 'Part I — One Core, Many Threads'
written: true
---

Deadlocks have a reputation as the unknowable horror of concurrent programming. Here's
the liberating truth: **a deadlock is a cycle in a "who waits for whom" graph** — a
visible, mechanical structure with four known preconditions, preventable by breaking any
one of them. In this chapter you'll build a deadlock on demand, watch two threads hang
forever, and then make it impossible with one line of discipline.

## The lie you were told

> "Deadlocks are random races you can't predict."

A race is nondeterministic; a deadlock is the *opposite* — when the wrong interleaving
happens, both threads stop **deterministically, forever**. And the pattern is fully
classified. A deadlock needs all four of the **Coffman conditions**:

1. **Mutual exclusion** — a resource is held by one thread at a time (locks, by design).
2. **Hold and wait** — a thread holds one lock while waiting for another.
3. **No preemption** — locks can't be snatched away; only the holder releases.
4. **Circular wait** — T1 waits for a lock T2 holds; T2 waits for one T1 holds.

The first three are properties of locks themselves. The fourth — the **cycle** — is the
one your code controls. Break the cycle, and deadlocks become impossible *by
construction*, not by vigilance.

## The crime, in slow motion

Two threads, two locks, **opposite acquisition orders**:

```text
T1: lock(A) ✓        T2: lock(B) ✓
T1: lock(B) …waits   T2: lock(A) …waits
      ↑ both wait forever — the cycle: T1→B→T2→A→T1
```

Neither thread is buggy in isolation. Both are correct "acquire what you need" citizens.
The deadlock lives in the *combination* — which is why it sails through code review and
unit tests (single-threaded ones), then hangs production on a Tuesday.

## Prove it to yourself

**1. Build the deadlock on demand:**

```c
// deadlock.c — gcc -pthread -O2 -o deadlock deadlock.c && ./deadlock   (it hangs!)
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

pthread_mutex_t A = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t B = PTHREAD_MUTEX_INITIALIZER;

void *t1(void *x) {
    pthread_mutex_lock(&A);
    sleep(0.1);  printf("t1: got A, waiting for B\n");
    pthread_mutex_lock(&B);                       // blocks forever
    printf("t1: got both (never printed)\n");
    return NULL;
}
void *t2(void *x) {
    pthread_mutex_lock(&B);
    sleep(0.1);  printf("t2: got B, waiting for A\n");
    pthread_mutex_lock(&A);                       // blocks forever
    printf("t2: got both (never printed)\n");
    return NULL;
}
int main(void) {
    pthread_t a, b;
    pthread_create(&a, NULL, t1, NULL); pthread_create(&b, NULL, t2, NULL);
    pthread_join(a, NULL); pthread_join(b, NULL);
}
```

Run it: both "waiting for" lines print, then silence. The process hangs, threads alive,
CPU idle — the signature of a deadlock (races burn CPU; deadlocks are statues).

**2. See the cycle in a debugger** (second terminal):

```sh
gdb -p $(pgrep deadlock) -ex "thread apply all bt 3" -ex detach -ex quit | grep lock
# thread 2: ... pthread_mutex_lock ... t1 (lock B)
# thread 3: ... pthread_mutex_lock ... t2 (lock A)
```

Both threads sit inside `pthread_mutex_lock`, each waiting for the lock the other holds.
That backtrace pair *is* the wait-for graph cycle, printed.

**3. Break the cycle — swap four lines:**

```c
// t2 acquires in the SAME order: A first, then B
void *t2(void *x) {
    pthread_mutex_lock(&A);            // ← was B
    sleep(0.1);  printf("t2: got A, waiting for B\n");
    pthread_mutex_lock(&B);            // ← was A
    ...
}
```

No hang — ever. Because with a global order, **no cycle can exist**: if everyone waits
"upward", the thread holding the highest lock never waits. Cycles require someone waiting
"downward". The discipline is the fix.

## The build: a deadlock-proof account transfer

The classic case — moving money between two accounts — and the two mechanical cures:

```c
// transfer.c — gcc -pthread -O2 -o transfer transfer.c && ./transfer
#include <stdio.h>
#include <pthread.h>

typedef struct { pthread_mutex_t m; long balance; int id; } Account;

int transfer(Account *from, Account *to, long amount) {
    /* cure 1: lock ordering — always acquire the lower id first */
    Account *first  = from->id < to->id ? from : to;
    Account *second = from->id < to->id ? to   : from;
    pthread_mutex_lock(&first->m);
    pthread_mutex_lock(&second->m);

    from->balance -= amount;
    to->balance   += amount;

    pthread_mutex_unlock(&second->m);
    pthread_mutex_unlock(&first->m);
    return 0;
    /* cure 2 (alternative): pthread_mutex_lock(&a); pthread_mutex_lock(&b);
       using std::scoped_lock(a, b) in C++ — it acquires BOTH atomically,
       avoiding hold-and-wait entirely. Never use pthread_mutex_trylock
       retry loops as a "clever" cure; they cause livelock. */
}

Account acc[2] = {{.m = PTHREAD_MUTEX_INITIALIZER, .balance = 1000, .id = 0},
                  {.m = PTHREAD_MUTEX_INITIALIZER, .balance = 1000, .id = 1}};

void *worker(void *n) {
    for (int i = 0; i < 100000; i++)
        transfer(&acc[i % 2], &acc[(i + 1) % 2], 1);   // transfers BOTH directions
    return NULL;
}

int main(void) {
    pthread_t a, b;
    pthread_create(&a, NULL, worker, NULL);
    pthread_create(&b, NULL, worker, NULL);
    pthread_join(a, NULL); pthread_join(b, NULL);
    printf("balances: %ld %ld (sum must be 2000)\n", acc[0].balance, acc[1].balance);
    return 0;
}
```

Transfers flow in *both* directions between the same two accounts — the exact scenario
that deadlocks naive code — and this version can't hang, because the ordering rule holds
no matter which direction the money moves.

## What you now know

- Deadlock = **circular wait**; the four Coffman conditions name it, breaking any one
  prevents it.
- **Global lock ordering** is the practical cure — cheap, mechanical, reviewable.
- Deadlocked processes are idle statues (races burn CPU) — and gdb prints the cycle.
- "One deadlock in a codebase" usually means "no documented lock order in a codebase".

Next: your threads can now share state safely. But sharing-by-sleeping — one thread
waiting for another to produce something — needs one more primitive: condition variables,
and the bounded buffer that hides inside every queue you've ever used.
