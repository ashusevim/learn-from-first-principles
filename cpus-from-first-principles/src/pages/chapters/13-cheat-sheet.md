---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: CPUs on One Page'
description: 'Gates to ISA to running program, on one page — the model, the instruction set, the timing rule, and the bugs that come from real hardware.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course in one claim: **a CPU is a loop that fetches, decodes and
executes** — and everything else is furniture around that loop. The table of who
built what, and the loop you will keep meeting for the rest of the project.

## The one-page model

```text
  electricity → gates → ALU → registers+RAM → ISA → fetch–decode–execute → call stack
     Ch 1–2      Ch 3      Ch 4       Ch 5              Ch 6           Ch 8
                                        └── the assembler translates you (Ch 9)
```

`cpu.py` is the stack with the paint stripped: `step()` fetches one 16-bit word,
`decode` splits it into opcode and operand, `execute` moves bits between registers
and RAM. Nothing in Chapters 10–11 changed that loop — the clock only times it,
and x86 only complicates it.

## The Bite-16 you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `LOAD R, addr` / `STORE R, addr` | register ↔ memory, the only traffic | 4–5 |
| `ADD` / `SUB` | the ALU, called by opcode (Ch 3's gates) | 3, 6 |
| `LOADI R, val` | a constant into a register, no memory trip | 5–6 |
| `JUMP addr` / `JZ R, addr` | set `pc` always / on zero — the only `if` | 7 |
| `CALL f` / `RET` | push `pc`, jump, resume — the stack contract | 8 |
| `HALT` | `running = False`: the loop agrees to die | 6 |
| `assemble(source)` | mnemonics → machine words, two passes | 9 |
| `CPU.step()` | fetch word, `pc += 2`, decode, execute | 6 |
| Fibonacci in Bite-16 assembly | the receipt: it assembles *itself* and runs | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Forgetting `pc += 2` on one path | the loop re-fetches and executes its own tail | Chapter 6 |
| A jump to a data address | instructions are just words; the CPU obeys garbage happily | Chapter 7 |
| `RET` without a matching `CALL` | the stack answers with a stranger's address | Chapter 8 |
| Assembling labels in one pass | forward jumps resolve to air; two passes or nothing | Chapter 9 |
| Assuming gates are instant | propagation delay is why the clock exists at all | Chapters 2, 10 |
| Wider words "for free" | every bus, register and decoder doubles or breaks | Chapter 11 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Do arithmetic | the ALU by opcode, never ad-hoc gates | a new operation — then extend the ALU first (Ch 3) |
| Remember across steps | registers for speed, RAM for room | the value must survive a call — then the stack (Ch 8) |
| Repeat or branch | `JUMP`/`JZ` on `pc`, nothing else exists | a subroutine — `CALL`/`RET` keeps the return (Ch 7–8) |
| Write programs by hand | the assembler's mnemonics, then `assemble()` | you need the machine word itself — read the hex (Ch 9) |
| Make it faster | raise the clock until the slowest gate complains | heat and skew win — then pipeline, not clock (Ch 10) |
| A real ISA | x86's history or RISC-V's cleanliness, same loop inside | you forgot the loop — it is still fetch–decode–execute (Ch 11) |

## Prove it to yourself

**1. The loop, naked:**

```python
cpu = CPU(assemble("LOADI R1, 41\nHALT"))  # your Chapter 9 + 12 machinery
cpu.run()
print(cpu.regs[1])                         # 41 — fetch, decode, execute, stop
```

**2. One `pc` mistake:**

```python
cpu = CPU(assemble("LOADI R1, 1\nJUMP 0")) # no HALT: the loop never agrees to die
cpu.run(max_steps=10)
print(cpu.pc, cpu.regs[1])                 # pc walks 0,2,0,2… — jumps ARE the loop
```

**3. The assembler earns its keep:**

```python
words = assemble("LOADI R1, 5\nLOADI R2, 7\nADD R1, R2\nHALT")
print([hex(w) for w in words])             # 0x4105 … — text became machine words
CPU(words).run()                           # and the machine obeys them
```

## What you now know

- **The loop is the CPU:** fetch a word, split it, obey it, move `pc` (Ch 6).
- **The ISA is a contract**, not hardware: ten opcodes are enough for Fibonacci
  and functions (Ch 5, 8, 12).
- **The assembler is the first program** that writes programs — two passes,
  labels resolved, and suddenly you never hand-assemble again (Ch 9).
- Real hardware adds timing, buses and history — never a different loop (Ch 10–11).

Next: twelve labs that break every stage gently — mangle the gates, lie to the
assembler, and lose the stack on purpose.
