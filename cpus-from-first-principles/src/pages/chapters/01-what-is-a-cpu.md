---
layout: ../../layouts/Chapter.astro
title: 'What Is a CPU, Really?'
description: 'A fetch-decode-execute loop over instructions in memory — plus switches that compute. Build: the transistor-as-switch model and NAND from it.'
part: 'Part I — From Electricity to Logic'
written: true
---

A CPU is two things, and this course builds both: a **fetch-decode-execute loop**
(the Compilers course's VM, in hardware) and the **switches that compute** —
billions of transistors acting as voltage-controlled on/off gates. This chapter
builds the switch abstraction, derives the most important gate from it, and sets
the course's promise: by Chapter 12, a CPU assembled from these gates runs
Fibonacci.

## The lie you were told

> "CPUs are billions of components too complex to understand."

The *count* is industrial; the *parts list* is four items: switches that compute
(gates), places that remember (registers/memory — Chapter 4), wires that carry
addresses (buses, Chapter 10), and a clock that says "now" (Chapter 10). A 1970s
undergraduate built a working CPU from these. You will too — simulated in Python,
where the "voltage" is a boolean and the physics is honest at the abstraction that
matters: **what computes what**.

## The transistor: a voltage-controlled switch

```text
NMOS transistor:  gate HIGH → current flows (switch CLOSED)
                  gate LOW  → current blocked (switch OPEN)
```

Two arrangements give the two fundamental behaviors:

```text
PULL-DOWN:  input HIGH connects output to GROUND → output goes LOW (inverts!)
PULL-UP:    input LOW connects output to VCC     → output goes HIGH
```

The magic of CMOS: combine one pull-up and one pull-down, and the output is always
driven to the opposite of the input — a clean, always-powered inverter.

## Prove it to yourself

**1. The inverter, as switches:**

```python
def nmos(gate): return gate            # HIGH when gate HIGH (conducts)
def pmos(gate): return not gate        # conducts when gate LOW

def inverter(input_bit):
    return nmos(1) and not input_bit   # pull-up conducts unless input is HIGH
# inverter(0) = 1, inverter(1) = 0 — the NOT gate, from one transistor's behavior
# (a real CMOS inverter: PMOS to VCC, NMOS to ground, output where they meet)
```

## The build: NAND — the everything gate

```python
# nand.py — the transistor model → NAND, the atom of computation
def nand(a, b):
    """NAND: output LOW only when BOTH inputs are HIGH.
    CMOS:  two PMOS in parallel (pull up), two NMOS in series (pull down)."""
    return 0 if (a == 1 and b == 1) else 1

# ── the truth table, verified ──
for a in (0, 1):
    for b in (0, 1):
        print(f"NAND({a},{b}) = {nand(a,b)}")
# NAND(0,0) = 1   NAND(0,1) = 1   NAND(1,0) = 1   NAND(1,1) = 0
# LOW only when both HIGH: the complete definition.
```

## Why NAND is the atom

NAND is **functionally complete** — every other gate, every adder, every register,
the entire CPU, composes from NAND alone. Chapter 2 proves it by building NOT, AND,
OR, and XOR from nothing else:

```text
NOT  a       = NAND(a, a)              ← feed it the same input twice
AND  a b     = NAND(NAND(a,b), NAND(a,b))    ← NAND, then invert
OR   a b     = NAND(NOT a, NOT b)      ← De Morgan: invert the inputs, NAND them
```

Three compositions from one gate. The course's promise, made concrete: **everything
digital is NANDs plus memory plus time** — and you'll trace every layer.

## What you now know

- The CPU = **fetch-decode-execute loop** (Ch 5–6) built from **switches that
  compute** (Ch 2–3) and **memory that remembers** (Ch 4).
- The transistor is a **voltage-controlled switch**; CMOS pairs make clean
  inverters; NAND falls out of four transistors.
- **NAND is functionally complete** — the atom from which the whole course composes.
- Our simulation: voltage → boolean, physics → logic. The right abstraction.

Next: prove functional completeness — build NOT, AND, OR, and XOR from NAND alone,
with truth tables verifying every one.
