---
layout: ../../layouts/Chapter.astro
title: 'From Bite-16 to x86 & RISC-V'
description: 'CISC vs RISC, registers vs stacks, the real encodings — your ISA’s ideas at planetary scale.'
part: 'Part IV — The Real World'
written: true
---

Bite-16 was a design exercise: 10 opcodes, fixed 2-byte instructions, 4 registers.
The real ISAs made different choices on the same axes — and the famous **CISC vs
RISC** debate is readable as a disagreement about *where complexity should live*.
This chapter maps your ISA's decisions onto x86 (CISC) and RISC-V (RISC), and the
mapping explains most of computer architecture history.

## The lie you were told

> "x86 won because CISC is better." / "RISC won because RISC is better."

Both won, in different decades, because the tradeoff moved:

```text
CISC (x86, 1978→):  complex instructions do MORE per opcode — fewer instructions,
                    scarce memory conserved, but decode is hard.
RISC (MIPS, ARM, RISC-V, 1980s→): simple instructions, executed FASTER and
                    pipelined cleanly — more instructions, but memory got cheap.
```

The 1990s resolution: x86 chips internally *translate* CISC instructions into
RISC-like micro-operations — CISC outside, RISC inside. The debate ended in a
hybrid, because the real currency was always decode complexity vs code density.

## The axes, mapped to your ISA

| Design axis | Bite-16 (your choice) | x86 (CISC) | RISC-V (RISC) |
|---|---|---|---|
| Instruction width | fixed 2 bytes | variable 1–15 bytes | fixed 4 bytes (+compressed 2) |
| Registers | 4 | 16 general (x86-64) | 32 |
| Memory access | LOAD/STORE only | arithmetic CAN touch memory | LOAD/STORE only |
| Operand packing | reg+imm in 12 bits | escape codes, ModRM byte | clean fields |
| Conditionals | JZ R, addr | flags register + Jcc | compare-and-branch |

Your fixed-width choice was the RISC one; your load/store discipline was RISC; your
operand packing was a CISC-flavored compromise. Every real ISA sits on the same
axes, and each axis is a chapter you've lived.

## Prove it to yourself

**1. The same program, three ISAs:**

```text
Bite-16:        LOADI R1, 7; LOADI R2, 5; ADD R1, R2
x86:            mov eax, 7; add eax, 5        (Intel syntax)
RISC-V:         li a0, 7; addi a1, a0, 5      (or: addi a0, zero, 7; ...)
```

Same three moves — load constants, add — in three encodings. The differences are
encoding and register conventions, not concepts.

**2. The RISC-V manual, opened:**

```text
RISC-V base ISA: 47 instructions. LOAD (lw), STORE (sw), ADD, SUB, branches
                 (beq, bne), JAL (jump-and-link = your CALL), JALR (= your RET).
                 Every instruction is a chapter you've built.
```

The "link" in jump-and-link: JAL saves the return address into a register before
jumping — Chapter 8's CALL, with the stack replaced by a register (and real call
stacks built in software on top, exactly as your Ch 8→Ch 9 progression predicted).

## What you now know

- CISC vs RISC = **where complexity lives**: in the instruction set (fewer, richer
  instructions) or in the compiler (many, simple instructions).
- x86's modern answer: **CISC decodes to RISC micro-ops** — the hybrid that ended
  the war.
- Your Bite-16 made the RISC choices (fixed width, load/store, few registers) and
  one CISC compromise (packed operands) — the same axes, toy scale.
- Reading real ISA manuals is now decoding familiar ideas in unfamiliar encodings.

Next, the finale: gates to ALU to ISA to CPU to assembler — the complete toolchain
in one file, running Fibonacci it assembled itself.
