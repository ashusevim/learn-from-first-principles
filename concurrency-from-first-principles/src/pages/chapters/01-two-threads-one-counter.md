---
layout: ../../layouts/Chapter.astro
title: 'Two Threads, One Counter: The Race, On Camera'
description: 'counter++ is three instructions, and two threads interleave them. Build: lose a million updates on camera, then disassemble the crime scene.'
part: 'Part I — One Core, Many Threads'
written: true
---

Every concurrency horror story — the race, the mutex, the event loop, async/await —
starts from the same single fact, and this chapter makes you *watch* it: **a statement
that looks atomic in your code is several instructions on the CPU, and the scheduler may
swap threads between any two of them.** That's the whole foundation. Everything else in
this course is managing that gap.

## The lie you were told

> "`counter += 1` is one operation."

It's three:

```text
1. LOAD   counter → register     (read)
2. ADD    register, 1            (modify)
3. STORE register → counter      (write)
```

If thread A finishes step 1, then the scheduler pauses it and runs thread B through all
three steps, thread A resumes with a **stale register** and its store erases B's work.
Not rarely — *deterministically often*, as you'll see. The bug isn't random bad luck;
it's the interleave pattern of those three instructions. Races are physics, not fate.

## The crime scene, on camera

Two threads, one shared counter, a million increments each:

```c
// race.c — gcc -pthread -o race race.c && ./race
#include <stdio.h>
#include <pthread.h>

long counter = 0;

void *million(void *arg) {
    for (long i = 0; i < 1000000; i++)
        counter = counter + 1;      // deliberately NOT ++: same 3 instructions
    return NULL;
}

int main(void) {
    pthread_t a, b;
    pthread_create(&a, NULL, million, NULL);
    pthread_create(&b, NULL, million, NULL);
    pthread_join(a, NULL);
    pthread_join(b, NULL);
    printf("expected 2000000, got %ld — lost %ld updates\n", counter, 2000000 - counter);
    return 0;
}
```

```sh
./race
# expected 2000000, got 1214377 — lost 785623 updates
```

Run it ten times: ten different numbers, all wrong. **You just lost ~40% of a million
updates** with code that compiles without a warning and looks obviously fine.

## Why "just run it again" never fixes it

The number changes per run because the *interleaving* changes — how the OS scheduler
sliced the two threads across cores, where cache lines landed. The bug is a property of
the **instruction schedule**, not your logic. That's why races are:

- **Non-deterministic** — "it passed the tests" means "the interleaving didn't bite today".
- **Heisenbuggy** — adding a print (which takes time!) changes the schedule and hides it.
- **Fundamental** — no amount of correctness elsewhere fixes three unguarded instructions.

## Prove it to yourself

**1. See the three instructions** — the actual machine code:

```sh
gcc -pthread -O0 -S race.c -o - | grep -A3 'counter' | head -12
# movq    counter(%rip), %rax    ← LOAD
# addq    $1, %rax               ← ADD
# movq    %rax, counter(%rip)    ← STORE
```

There it is: your one line, three instructions, three chances to be interrupted. The
compiler even warned the truth in machine code.

**2. Watch the loss scale with contention** — two threads fight over ONE cache line:

```sh
./race && ./race && ./race
# three different numbers, all < 2000000
```

**3. Make the race vanish with one line** (the appetizer for Chapter 2):

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
...
pthread_mutex_lock(&lock);
counter = counter + 1;
pthread_mutex_unlock(&lock);
// now: expected 2000000, got 2000000. Every run.
```

The mutex works by making the three instructions **indivisible** — and Chapter 2 opens
the box to show what that "lock" actually is (spoiler: one atomic CPU instruction and a
loop; you'll build it yourself).

## The build: measure the gap between your code and the CPU

The deepest habit this course can teach: **never trust an atomic-looking statement**.
Write the probe once, keep it forever:

```sh
#!/bin/sh
# race-probe.sh — does THIS statement have a race? measure, don't assume
gcc -pthread -O2 -o probe probe.c     # note -O2: the compiler may ALSO reorder your code
for i in 1 2 3 4 5; do ./probe; done  # five runs; any variance = interleaving exists
```

If the output varies between runs of a *deterministic* computation, something in it is
shared and unguarded. That's not a style opinion — it's a detector, and it costs five
seconds to run.

## What you now know

- "Atomic-looking" statements are **3-instruction sequences**; the scheduler may split them.
- Races are **deterministic given an interleave** — only the interleave is random.
- A mutex makes the sequence indivisible — and Chapter 2 builds one from raw instructions.
- The probe habit: variance across runs of deterministic code = unguarded sharing.

Next: open the mutex. It's one atomic instruction — test-and-set — and a loop. You'll
build a working lock from raw CPU primitives in a dozen lines.
