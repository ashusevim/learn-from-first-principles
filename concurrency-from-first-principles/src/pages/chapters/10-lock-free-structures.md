---
layout: ../../layouts/Chapter.astro
title: 'Lock-Free Structures & the ABA Problem'
description: 'CAS lets threads cooperate without locking — until memory plays tricks. Build: a lock-free stack, then break it with ABA.'
part: 'Part III — Many Cores'
written: true
---

Chapter 9 gave you atomics with ordering. Now the payoff: data structures that many
threads mutate **with no locks at all** — where a thread that gets descheduled for an
hour cannot block anyone. The engine is CAS (compare-and-swap, Chapter 2's atomic) driven
in a retry loop. And the price of admission is meeting the subtlest bug in concurrent
programming — **ABA** — which this chapter will make you feel, not just define.

## The lie you were told

> "Lock-free means race-free / it's automatically better."

"Lock-free" has a precise meaning: *some thread always makes progress* — a descheduled
thread holding a lock (Chapter 2) blocks everyone; a lock-free thread merely retries. It
does **not** mean simpler, faster (CAS loops can waste more cycles than a short lock),
or bug-free. It means the *progress guarantee* changed shape. Choose it for the
guarantee, not for vibes.

## The pattern: observe, compute, swap-if-unchanged

```c
do {
    old = atomic_load(&shared);        // 1. observe
    new = compute(old);                // 2. compute (no locks — others may interfere!)
} while (!CAS(&shared, old, new));     // 3. swap ONLY if still `old`; else retry
```

The retry loop replaces mutual exclusion: instead of locking everyone out, each thread
attempts its change and **re-does its work if the world moved underneath it**. Progress
is guaranteed because every failed CAS proves another thread advanced.

## The build: a lock-free stack

The classic — a singly-linked list where "push" and "pop" are single CAS on the head:

```c
/* lfstack.c — gcc -pthread -O2 -o lfstack lfstack.c && ./lfstack
   A lock-free Treiber stack: the head pointer is the only shared thing. */
#include <stdio.h>
#include <pthread.h>
#include <stdatomic.h>

typedef struct Node { struct Node *next; long value; } Node;
_Atomic(Node *) head = NULL;

void push(long v) {
    Node *n = malloc(sizeof *n); n->value = v;
    Node *old_head;
    do {
        old_head = atomic_load(&head);           /* observe */
        n->next = old_head;                      /* compute */
    } while (!atomic_compare_exchange_weak(&head, &old_head, n));
    /* CAS: "set head=n, IF head is still old_head" — retry if another thread won */
}

long pop(void) {
    Node *old_head;
    do {
        old_head = atomic_load(&head);
        if (!old_head) return -1;                /* empty */
    } while (!atomic_compare_exchange_weak(&head, &old_head, old_head->next));
    /* the RACE-WINDOW: between load and CAS, other threads may have popped old_head,
       freed it, AND pushed it back (head is again old_head!). We'd CAS "successfully"
       against a node whose ->next has changed. That is ABA — see below. */
    long v = old_head->value;
    /* free(old_head) here is exactly what triggers ABA under real allocators;
       this toy leaks on purpose so the demo stays safe. */
    return v;
}

void *worker(void *arg) {
    for (long i = 0; i < 1000000; i++) {
        push(i);
        if (pop() == -1) { printf("IMPOSSIBLE: popped from empty\n"); }
    }
    return NULL;
}

int main(void) {
    pthread_t t[4];
    for (int i = 0; i < 4; i++) pthread_create(&t[i], NULL, worker, NULL);
    for (int i = 0; i < 4; i++) pthread_join(t[i], NULL);
    printf("4 threads × 1M push+pop, zero locks, no 'empty' errors\n");
    return 0;
}
```

Four threads, two million lock-free operations, and the `head` CAS loop is the *entire*
synchronization. No mutex in the binary.

## The humbling: ABA

CAS asks only "is it still `old_head`?" — it compares **values, not histories**. Now:

```text
T1: loads head = A (A->next = B)
    ... descheduled for an hour ...
T2: pops A, pops B, pushes A back   (head is A AGAIN — but A->next is now NULL!)
T1: CAS(head, A, B') succeeds — A is "still there"...
    but A->next changed. The stack silently loses every node after B.
```

Value the same; *world* different. That's **ABA**, and it's not theoretical — it's why
real lock-free code uses:

- **Tagged pointers** — pack a counter next to the pointer; every modification bumps it,
  so A-then-A-again differs.
- **Hazard pointers / epochs (RCU)** — defer freeing until every reader has left;
  memory never gets reused mid-operation, so A can't become A.
- Or just... a lock. (Seriously: a well-sized mutex beats a subtly-broken lock-free
  structure every time. Lock-free is for when blocking is *unacceptable* — signal
  handlers, real-time paths — not for general speed.)

The toy above survives only because it leaks (never reuses memory). Replace `malloc`
with a small recycling pool and the ABA window opens. *That* is how you should feel
about lock-free code: correct until the allocator disagrees.

## What you now know

- Lock-free = **progress guarantee** (no blocked thread stops others), via CAS retry
  loops — not a synonym for "faster" or "safer".
- The **Treiber stack**: observe → compute → CAS; the whole structure is one atomic head.
- **ABA**: CAS sees values, not histories; memory reuse makes A→B→A look like no change.
  Tags, epochs, or hazard pointers are the cures.
- Choose locks by default. Go lock-free when blocking is the enemy — and bring evidence.

Next: threads, locks, loops, lock-free — but wait. Does *any* of this make your program
faster on one core? The final distinction: concurrency (structure) vs parallelism
(speed), and what the GIL actually does.
