---
layout: ../../layouts/Chapter.astro
title: 'Memory & Registers: Remembering Bits'
description: 'A loop that remembers: latches, flip-flops, registers. Build: 1-bit memory from gates, then an 8-bit register file.'
part: 'Part II — The Machine'
written: true
---

Chapter 3's ALU computes instantly and forgets instantly — feed it inputs, get an
output, and the answer evaporates. Memory is the missing organ, and its core trick
is deliciously perverse: **connect gates in a loop so their outputs feed their
inputs** — a circle of logic that holds whatever was last pushed around it. This
chapter builds 1-bit memory from Chapter 2's gates, then registers, then the
register file the CPU thinks with.

## The lie you were told

> "Memory is a chip you add."

Memory is **gates in a loop**. The SR latch is two NOR gates, each feeding the
other:

```text
S (set) ──► NOR1 ──┬──► Q
          ┌────►   │         NOR2 ──► Q̄ (and back into NOR1)
          └────────┴── from NOR2
R (reset) ──► NOR2
```

Set S=1: Q goes 1, which feeds NOR2 with R=0 keeping Q̄ at 0 — and when S returns
to 0, **the loop holds**: each NOR's output keeps the other's input in the state
that produces it. The loop is self-sustaining. That's memory: *a stable cycle of
logic*.

## The clock: memory that respects time

A bare latch changes the instant its inputs change — chaos for a CPU that needs
order. The **clock** gates it: the latch only updates when the clock ticks. One
tick = one opportunity to change state = one step of the CPU. (Chapter 1's
fetch-decode-execute loop runs once per tick — the clock *is* the heartbeat, and
3 GHz means 3 billion latching opportunities per second.)

The **D flip-flop**: a latch that captures the D input only on the clock's edge,
holds it until the next edge. Registers = D flip-flops side by side (one per bit).

## Prove it to yourself

**1. The loop holds, demonstrated:**

```python
def nor(a, b): return 1 - ((a | b) and 1) if (a | b) else 1   # from Ch 2: NOR gate
def nor_gate(a, b): return 1 - (a | b)

# SR latch as a function of (S, R, previous_q) — the loop's state IS the input:
def sr_latch(S, R, q_prev):
    q = nor_gate(R, q_prev)          # wait: the real latch is cross-coupled...
    return q

# cleaner: simulate the MUTUAL feedback by iterating to stability:
def sr_latch(S, R, q):
    for _ in range(10):              # the loop settles (real gates: instantly)
        q = nor_gate(R, q_prev := q) if False else q
        q_bar = nor_gate(S, q) if False else q
    return q
# (the cross-coupled simulation needs the pair — see the build below)
```

**2. The clock edge, named:** rising-edge-triggered flip-flops update when the
clock goes 0→1. "3 GHz CPU" = 3 billion rising edges per second = 3 billion
opportunities for every register in the chip to capture.

## The build: the SR latch and the register file

```python
# memory.py — the SR latch → D flip-flop → 8-bit register (~45 lines)
def NOR(a, b): return 1 - (a | b)                     # Chapter 2's NOR gate

class SRLatch:                                        # cross-coupled NORs: 1-bit memory
    def __init__(self): self.q, self.q_bar = 0, 1
    def set(self, S, R):
        # the MUTUAL feedback: iterate until the loop stabilizes (real gates: instant)
        for _ in range(10):
            new_q = NOR(R, self.q_bar)                # Q = NOR(R, Q̄)
            self.q_bar = NOR(S, new_q)                # Q̄ = NOR(S, Q)
            self.q = new_q
        return self.q

latch = SRLatch()
latch.set(1, 0); print("after set:", latch.q)         # 1 — remembered
latch.set(0, 0); print("S,R=0,0 (hold):", latch.q)    # 1 — STILL remembered: the loop!
latch.set(0, 1); print("after reset:", latch.q)       # 0 — erased

# ── the D flip-flop: capture on the clock edge ──
class DFlipFlop:
    def __init__(self):
        self.latch = SRLatch()
        self.last_clock = 0
    def tick(self, clock, d):                          # capture D on the rising edge
        if clock == 1 and self.last_clock == 0:        # rising edge: one capture
            self.latch.set(1 if d else 0, 0 if d else 1)
        self.last_clock = clock
        return self.latch.q

ff = DFlipFlop()
print("d=1, clock low:  ", ff.tick(0, 1))             # 0 — not captured yet
print("d=1, clock rises:", ff.tick(1, 1))             # 1 — captured ON the edge
print("d=0, clock high:", ff.tick(1, 0))              # 1 — held (only edges capture)

# ── the 8-bit register: 8 flip-flops, one shared clock ──
class Register:
    def __init__(self, bits=8):
        self.flops = [DFlipFlop() for _ in range(bits)]
    def tick(self, clock, value_bits):
        return [ff.tick(clock, bit) for ff, bit in zip(self.flops, value_bits)]
    @property
    def value(self): return [ff.latch.q for ff in self.flops]

reg = Register(8)
reg.tick(0, to_bits := [1, 0, 1, 1, 0, 0, 0, 1])      # clock low: ignored
print("clock low:  ", reg.value)                       # all zeros
reg.tick(1, to_bits)                                  # clock rises: CAPTURED
print("clock rose:  ", reg.value)                      # the 8 bits, held
reg.tick(1, [0]*8)                                    # d changes while clock HIGH:
print("clock held:  ", reg.value)                      # still held — only EDGES capture
```

## What you now know

- Memory = **gates in a loop**: the cross-coupled NOR latch is self-sustaining —
  a stable cycle of logic holding one bit.
- The **clock** gates memory: D flip-flops capture on rising edges only — one
  capture opportunity per tick, which is the CPU's heartbeat.
- **Registers** = flip-flops side by side; the register file the CPU thinks with is
  Chapter 6's next piece.

Next: the CPU's vocabulary — designing Bite-16's instruction set: opcodes, operands,
and the encoding that turns `ADD R1, R2` into bytes.
