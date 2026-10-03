---
layout: ../../layouts/Chapter.astro
title: 'Buses, Clocks & the Real Hardware'
description: 'Gigahertz is loop speed; caches are memory-hierarchy physics. Your simulator mapped to silicon.'
part: 'Part IV — The Real World'
written: true
---

Your simulator executes one instruction per loop iteration. Real silicon executes
billions per second — and the differences between your simulator and an actual chip
are the interesting engineering: **clock speed** (how fast the loop ticks), **buses**
(how the parts talk), and the **cache hierarchy** (why memory isn't all equally
far). This chapter maps your CPU onto the physics.

## The lie you were told

> "3 GHz means 3 billion instructions per second."

3 GHz = the clock ticks 3 billion times per second — and with a pipelined CPU,
*up to* one instruction completes per tick, often fewer (branch misses, cache
misses, dependencies stall). Your simulator executes one instruction per Python
loop iteration; a real CPU pipelines, predicts branches (Chapter 7's jumps!), and
overlaps execution — the same fetch-decode-execute, executed *concurrently*.

## The memory hierarchy: distance is latency

The cruel arithmetic your simulator ignores: the CPU runs at gigahertz, but main
memory responds in *nanoseconds* — ~100 cycles of stall for one main-memory access:

```text
register:   < 1 cycle          the CPU's own flip-flops (Ch 4)
L1 cache:   ~4 cycles          a small, fast copy of hot memory
L2/L3:      ~12–40 cycles      bigger, slower
main RAM:   ~100+ cycles       the actual array (Ch 4's memory, scaled)
disk:       ~100,000 cycles    (the databases course's storage engine lives here)
```

The **cache** is the fix: a small copy of recently-used memory, kept near the CPU
because of locality — the same "keep a hot working set" idea as the databases
course's buffer pool and the LLM course's KV cache. Every memory hierarchy in
computing is this shape.

## The buses: how the parts talk

The CPU, memory, and devices connect over shared buses — address bus (where),
data bus (what), control bus (read/write). Memory-mapped I/O (Chapter 9's LOAD and
STORE addressing devices as memory addresses) is how the CPU talks to everything:
a STORE to a special address *is* "light up the pixel" or "send the network
packet". Your LOAD/STORE instructions were already I/O instructions in disguise.

## Prove it to yourself

**1. The latency numbers, internalized as a table:**

```text
1 clock tick (3 GHz):     0.33 ns     your loop iteration
L1 cache read:            ~1.3 ns     4 ticks
main memory read:         ~100 ns     300 ticks — the CPU IDLES
SSD read:                 ~100 µs     300,000 ticks
```

Your simulator's "one operation per iteration" is honest for the *CPU-internal*
work; the real machine's drama is all in the memory waits.

**2. The cache, experienced through the wall** — Chapter 2 of the compilers course:
a loop over an array row-by-row is fast; column-by-column is slow. Same bytes,
different locality — the cache punishing the stride.

## What you now know

- **Gigahertz = loop speed**; pipelining, branch prediction, and caches decide how
  much of that speed is real.
- The **memory hierarchy** (registers → L1/L2/L3 → RAM → disk) is locality
  management — the same shape as every cache in this project.
- **Memory-mapped I/O** makes LOAD/STORE the universal I/O instruction — devices
  are addresses.
- Your simulator + a clock + a cache hierarchy + I/O addresses = the architecture
  of a real microcontroller (a Raspberry Pi Pico is honestly this scale).

Next: your ISA in context — how x86 and RISC-V took Bite-16's ideas to planetary
scale, and the CISC/RISC split.
