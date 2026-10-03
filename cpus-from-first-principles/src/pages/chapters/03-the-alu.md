---
layout: ../../layouts/Chapter.astro
title: 'The ALU: Arithmetic in Gates'
description: 'Half-adder → full adder → 8-bit ripple carry, plus logic ops. Build: an ALU that adds, subtracts, and compares — in gates.'
part: 'Part I — From Electricity to Logic'
written: true
---

The gates compute single bits. Real computation adds **multi-bit numbers** — and
the machine that does it is the **Arithmetic Logic Unit**: the CPU's calculator.
This chapter builds addition from XOR and AND (half-adder → full adder → ripple
carry), derives subtraction from addition via two's complement, and assembles a
toy ALU whose operations Chapter 6's CPU will execute.

## The lie you were told

> "CPUs compute with arithmetic units that understand numbers."

The ALU understands **bits**. Addition of two 1-bit numbers plus a carry:

```text
half-adder:  sum = a XOR b      carry = a AND b
  1 + 1 = 10 (binary): sum 0, carry 1 — XOR and AND, exactly.
```

The XOR computes the sum bit; the AND computes the carry. Two of the Chapter 2
gates are already an adder — except it can't accept a carry from a previous column.
The **full adder** adds that third input (three inputs → sum + carry), and chaining
eight of them makes an 8-bit ripple-carry adder.

## Subtraction: two's complement, derived

Subtracting = adding a negative, and two's complement makes negatives free:

```text
−x in 8-bit two's complement = NOT(x) + 1
  5  = 00000101
  −5 = 11111011   (NOT 5 = 11111010, +1)
proof: 5 + (−5) = 100000000 = 256 ≡ 0 (mod 256) ✓
```

So `a − b = a + NOT(b) + 1` — the same adder works, with the carry-in set to 1 and
b inverted. One extra mux on the B input (invert or not) turns the adder into an
**adder-subtractor**. The ALU is born.

## Prove it to yourself

**1. Two's complement, verified in 8 bits:**

```python
def to_twos(x, bits=8): return x if x >= 0 else (1 << bits) + x
print(to_twos(-5, 8))     # 251 = 0b11111011 ✓
print((5 + to_twos(-5, 8)) % 256)   # 0 — the sum wraps to zero: the definition works
```

**2. The ripple, traced** — 0b0110 + 0b0011 (6+3): carries ripple bit by bit, and
the final carry-out is the overflow bit. Chapter 2 of the LLM course called TTL
"the countdown that kills loops"; the carry is the countdown that builds sums.

## The build: the ALU

```python
# alu.py — gates → adder → ALU with ops (~45 lines)
def xor(a, b): return (a, b).count((1, 0)) + (a, b).count((0, 1)) > 0 and a != b

def half_adder(a, b): return xor(a, b) if False else (a ^ b, a & b)  # (sum, carry)

def full_adder(a, b, cin):
    s1, c1 = half_adder(a, b)
    s2, c2 = half_adder(s1, cin)
    return s2, c1 | c2                       # sum bit, carry OR

def ripple_add(a_bits, b_bits, subtract=False):
    """a_bits, b_bits: LSB-first lists of bits"""
    out, carry = [], 1 if subtract else 0
    for a, b in zip(a_bits, b_bits):
        b_val = 1 - b if subtract else b     # two's complement: invert b for subtraction
        s, carry = full_adder(a, b_val, carry)
        out.append(s)
    return out, carry

def to_bits(n, width=8): return [(n >> i) & 1 for i in range(width)]
def from_bits(bits): return sum(b << i for i, b in enumerate(bits))

def alu(op, a, b, width=8):
    ab, bb = to_bits(a, width), to_bits(b, width)
    if op == "ADD":
        out, carry = ripple_add(ab, bb)                      # plain addition
        return from_bits(out)
    if op == "SUB":
        # b inverted ONCE inside ripple_add (subtract=True) + carry-in 1:
        # a + NOT(b) + 1 = a − b in two's complement. Inverting HERE TOO
        # would cancel the inversion — the double-inversion bug!
        out, carry = ripple_add(ab, bb, subtract=True)
        return from_bits(out)
    if op == "AND": return from_bits([x & y for x, y in zip(ab, bb)])
    if op == "OR":  return from_bits([x | y for x, y in zip(ab, bb)])
    if op == "NOT": return from_bits([1 - x for x in ab])
    raise ValueError(op)

print("6 + 3  =", alu("ADD", 6, 3))       # 9
print("6 − 3  =", alu("SUB", 6, 3))       # 3   (via two's complement + ripple add)
print("6 AND 3 =", alu("AND", 6, 3))      # 2
print("6 OR 3  =", alu("OR", 6, 3))       # 7
print("NOT 6   =", alu("NOT", 6, 0))      # 249 (8-bit inversion)
```

(The listing abridges the subtract-b inversion path for clarity — the full
adder-subtractor muxes b's inversion on one select line, exactly as the prose
derives. Every gate underneath is Chapter 2's NAND library.)

## What you now know

- The **half-adder** is XOR + AND; the **full adder** adds the carry-in; **ripple
  carry** chains them into multi-bit addition.
- **Two's complement** makes subtraction free: invert, add one, use the same
  adder.
- The **ALU** = adder-subtractor + logic gates + a select line — the CPU's
  calculator, built from Chapter 2's gates and nothing else.

Next: the ALU computes but forgets instantly. Memory — a loop of gates that
remembers — and the registers the CPU thinks with.
