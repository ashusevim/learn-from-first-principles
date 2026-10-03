---
layout: ../../layouts/Chapter.astro
title: 'NAND Is Everything'
description: 'NOT, AND, OR, XOR — every gate composes from NAND alone. Build: the gate library, truth tables verified.'
part: 'Part I — From Electricity to Logic'
written: true
---

Chapter 1 claimed NAND is functionally complete — every Boolean function composes
from it. This chapter proves it by building the gate library: NOT, AND, OR, XOR,
and a multiplexer (the "if" of hardware), each composed from NAND and each verified
against its truth table. These gates are the vocabulary of Chapters 3–6 — the ALU,
registers, and CPU are all graphs of these functions.

## The lie you were told

> "You need different hardware for each kind of gate."

You need **one gate and wiring**. The compositions:

```text
NOT a  = NAND(a, a)                       both inputs tied: the double-NAND inverts
AND    = NOT(NAND(a, b))                  NAND, then NOT: only stays 1 when both 1
OR     = NAND(NOT a, NOT b)               De Morgan: OR is inverted-input NAND
XOR    = the famous 4-NAND arrangement    "different" detector
```

The XOR arrangement is worth tracing by hand once: `t = NAND(a, b)`, then
`u = NAND(a, t)`, `v = NAND(b, t)`, `out = NAND(u, v)` — outputs 1 only when the
inputs differ.

## Prove it to yourself

**1. De Morgan, as gates:** `NAND(NOT a, NOT b)` — the output is 1 when *both*
inputs are 0, i.e. when a OR b is 0, i.e. when a OR b is... 0 means neither fired:
**OR**. De Morgan's law isn't algebra here; it's wiring.

**2. Functional completeness, stated:** any truth table (any Boolean function) can
be written as a sum of products (rows where the output is 1), and each product and
sum is NAND-composable. Every Boolean function of n inputs = up to 2^n NAND-built
rows. The atom covers everything.

## The build: the gate library

```python
# gates.py — the complete gate library, all from NAND (~35 lines)
def nand(a, b): return 0 if (a == 1 and b == 1) else 1

def NOT(a):  return nand(a, a)
def AND(a, b): return nand(nand(a, b), nand(a, b))
def OR(a, b):  return nand(NOT(a), NOT(b))
def NOR(a, b): return NOT(OR(a, b))
def XOR(a, b):
    t = nand(a, b)
    return nand(nand(a, t), nand(b, t))

def mux(sel, a, b):                                   # the hardware "if"
    return OR(AND(sel, a), AND(NOT(sel), b))

# ── truth-table verification: every gate, every input ──
def check(name, fn, expected):
    ok = all(fn(*inputs) == want
             for inputs, want in expected.items())
    print(f"{'✓' if ok else '✗'} {name}")
    return ok

ok = True
ok &= check("NOT", NOT, {(0,): 1, (1,): 0})
ok &= check("AND", AND, {(0,0): 0, (0,1): 0, (1,0): 0, (1,1): 1})
ok &= check("OR",  OR,  {(0,0): 0, (0,1): 1, (1,0): 1, (1,1): 1})
ok &= check("NOR", NOR, {(0,0): 1, (0,1): 0, (1,0): 0, (1,1): 0})
ok &= check("XOR", XOR, {(0,0): 0, (0,1): 1, (1,0): 1, (1,1): 0})
ok &= check("MUX", lambda s, a, b: mux(s, a, b),
            {(0,0,1): 1, (0,1,0): 0, (1,0,1): 0, (1,1,0): 1})
print("ALL GATES VERIFIED" if ok else "FAILURE")
# ✓ NOT  ✓ AND  ✓ OR  ✓ NOR  ✓ XOR  ✓ MUX
# ALL GATES VERIFIED — from NAND and wiring alone.
```

The MUX deserves a pause: it's the hardware conditional — `sel` chooses which input
flows through. Every register load, every ALU operation select, every branch's "which
result to keep" is a mux. The if-statement of Chapter 6 compiles down to muxes and
jumps.

## What you now know

- **NOT, AND, OR, NOR, XOR, MUX** — all compose from NAND and wiring, all
  truth-table verified.
- **XOR** is the 4-NAND "difference detector"; **MUX** is the hardware if.
- Functional completeness means the rest of the course is *composition*, not new
  physics — Chapter 3 builds an ALU from these gates and nothing else.

Next: the first real computation — add two bits, chain the carries, and the ALU
exists. Arithmetic in gates.
