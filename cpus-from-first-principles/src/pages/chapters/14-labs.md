---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on Bite-16 from Chapter 12 — gates, the ALU, the ISA, the assembler. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a register value, a program behavior, or a
trace you read off `cpu.py` from Chapter 12. Nothing here is new — gates (Ch 2),
the ALU (Ch 3), registers (Ch 4), the ISA (Ch 5), the loop (Ch 6), jumps (Ch 7),
the stack (Ch 8), the assembler (Ch 9). What is new is sabotage with a purpose.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when** (the expected
output), and **Where it comes from**. Your whole laboratory is two functions —
`assemble(source)` and `CPU(words).run()` — plus a trace flag whenever the loop
surprises you.

| Tool | What it proves |
|---|---|
| `print(hex(w) for w in assemble(src))` | what the assembler actually emitted |
| `cpu.regs` / `cpu.memory` after `run()` | what the loop actually did |
| `run(max_steps=N)` or trace | where a runaway program spends its steps |
| the Chapter 12 Fibonacci program | the control group every lab compares to |

## Warm-ups

**Lab 1.1 — 41 in a register**
**Goal:** the full chain, shortest possible: text → words → register.
**Do this:**
```python
words = assemble("LOADI R1, 41\nHALT")
CPU(words).run()
```
**You'll know it works when:** `cpu.regs[1]` reads `41` and the run halts on its
own — assemble, load, fetch, decode, execute, stop.
**Where it comes from:** Chapters 5, 6 and 9.

**Lab 1.2 — Read the machine words**
**Goal:** the assembler is deterministic — same text, same words, every time.
**Do this:**
```python
print([hex(w) for w in assemble("LOADI R1, 5\nLOADI R2, 7\nADD R1, R2\nHALT")])
```
**You'll know it works when:** the list starts `0x4105` (opcode 4, R1, value 5) —
you can decode the first word by hand against Chapter 5's encoding table.
**Where it comes from:** Chapter 9 — The Assembler: Mnemonics to Machine Code.

**Lab 1.3 — Subtract on purpose**
**Goal:** the ALU's second guest (Chapter 3) via the only path that reaches it.
**Do this:**
```python
CPU(assemble("LOADI R1, 10\nLOADI R2, 3\nSUB R1, R2\nHALT")).run()
```
**You'll know it works when:** `regs[1]` reads `7`. If it reads something with
many digits, you swapped the operand order — reread the `SUB` row in Chapter 6.
**Where it comes from:** Chapter 3 — The ALU: Arithmetic in Gates.

## Builds

**Lab 2.1 — Loop without `while`**
**Goal:** jumps are the only control flow the machine has (Chapter 7).
**Do this:** write a countdown 5 → 0 using `JZ` and `JUMP` only — no assembler
macros, no Python loop around `step()`.
**You'll know it works when:** a register walks `5,4,3,2,1,0` and the run halts.
Delete the `JZ` and rerun with `max_steps`: it counts below zero forever — the
exit *was* the instruction you deleted.
**Where it comes from:** Chapter 7 — Jumps & Branches: Teaching the CPU If.

**Lab 2.2 — A subroutine that returns**
**Goal:** the stack contract: `CALL` pushes, `RET` resumes (Chapter 8).
**Do this:** factor Lab 2.1's body into a subroutine called three times from a
main that halts after the third return.
**You'll know it works when:** the body runs exactly three times and the program
halts — not twice, not four. Then delete one `RET` and watch the run wander off:
the return address is load-bearing.
**Where it comes from:** Chapter 8 — Functions & the Call Stack.

**Lab 2.3 — The assembler's second pass**
**Goal:** forward labels only resolve because pass one measured everything.
**Do this:** write a program that jumps *forward* over fifty `HALT`s to a label,
assemble it, and decode the emitted jump word by hand.
**You'll know it works when:** the word's address field equals the label's real
position — count the words yourself. One-pass assembly cannot do this; your two
passes can.
**Where it comes from:** Chapter 9 — The Assembler: Mnemonics to Machine Code.

**Lab 2.4 — Store, reload, believe**
**Goal:** registers are fast, RAM is roomy — traffic between them is the program.
**Do this:** compute a value, `STORE` it to an address, clobber every register,
`LOAD` it back, and halt with the original value restored.
**You'll know it works when:** the final register equals the original to the bit.
Then `STORE` to the address of your own next instruction and watch the program
change its mind mid-run — self-modifying proof that code is data (Ch 4's warning).
**Where it comes from:** Chapter 4 — Memory & Registers: Remembering Bits.

**Lab 2.5 — Break Fibonacci, then fix it**
**Goal:** the Chapter 12 receipt, maintained rather than admired.
**Do this:** change the Fibonacci seed from `0,1` to `2,1`, predict the first six
outputs (Lucas numbers), assemble, and run.
**You'll know it works when:** the machine prints `2,1,3,4,7,11` — your prediction,
not the chapter's. You now maintain the program: seeds are configuration.
**Where it comes from:** Chapter 12 — Final Boss: The Complete CPU in ~400 Lines.

## Stretch goals

**Lab 3.1 — A slower clock**
**Goal:** timing is a parameter (Chapter 10), not physics.
**Do this:** add a `hz` argument to the run loop that sleeps `1/hz` per step, and
run Fibonacci at 1 Hz while watching `pc` advance.
**You'll know it works when:** each step ticks once per second and the sequence
still arrives intact. Speed was never correctness — the gates never noticed.
**Where it comes from:** Chapter 10 — Buses, Clocks & the Real Hardware.

**Lab 3.2 — One new instruction**
**Goal:** extend the ISA end to end: encoding, assembler, execute (Chapters 5–6, 9).
**Do this:** add `INC R` (register plus one) — a free opcode number, one assembler
branch, three lines in `step()`.
**You'll know it works when:** a loop written with `INC` produces the same
Fibonacci as Chapter 12's `ADD`-based one, in fewer words. The ISA is yours now:
additions are design decisions.
**Where it comes from:** Chapters 5, 6 and 9.

## Self-checking without a grader

- **Register labs** (1.1, 1.3, 2.4, 2.5): exact integers — `41`, `7`, restored
  bits, `2,1,3,4,7,11`. Any other number names the guilty stage: wrong constant
  (assembler), wrong order (ALU path), wrong address (memory traffic).
- **Behavior labs** (1.2, 2.1, 2.2, 2.3): decode one word by hand, count one loop
  by trace, count three calls, count fifty words. Hand-count agreement is the test.
- **Parameter labs** (3.1, 3.2): change one thing, keep every output. Slower must
  still be right; extended must still run the old programs.

## What you now know

- **Every Bite-16 behavior reduces to the loop:** a surprise in `regs` is a
  surprise in fetch, decode or execute — there is nowhere else to hide.
- **The assembler is a program you can extend** (Labs 2.3, 3.2), which makes every
  ISA decision reversible and therefore fearless.
- **Code is data with an address** (Lab 2.4) — the machine enforces no difference,
  and the stack contract is the only thing keeping subroutines honest.
- The Chapter 12 Fibonacci is no longer a trophy; it is a test suite (Lab 2.5).

Next: pick any real ISA reference — RISC-V fits on a card — and decode one of its
`ADD` words by hand; the fields will feel like a Bite-16 word that grew up.
