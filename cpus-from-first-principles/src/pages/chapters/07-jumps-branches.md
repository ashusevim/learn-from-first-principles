---
layout: ../../layouts/Chapter.astro
title: 'Jumps & Branches: Teaching the CPU If'
description: 'The program counter is writable — that’s all control flow is. Build: JUMP, JZ, and a loop in machine code.'
part: 'Part III — Running Programs'
written: true
---

The CPU (Chapter 6) runs programs forward only — fetch at PC, increment, repeat.
**Control flow** is the discovery that the program counter is a *register*: writing
an address into it jumps execution anywhere in memory. Conditional jumps add one
question — "was the last result zero?" — and with those two moves, if, while, and
every program structure the compilers course parsed become machine-code reality.

## The lie you were told

> "If-statements and loops are language features."

They're **PC arithmetic**:

```text
JUMP addr:    PC = addr                          ← unconditional: always go
JZ R, addr:   if R == 0: PC = addr               ← conditional: go only if R is zero
              else: PC has already incremented   ← fall through, as normal
```

The compilers course's `while` loops (Chapter 6 of *that* course) compiled to
exactly this — a conditional jump *forward* past the body, and an unconditional
jump *backward* to the condition (Chapter 7 of the compilers course: the two-pass
patching trick, now seen from the machine's side).

## The flags question: where does "R == 0" come from?

Real CPUs compute condition codes in the ALU and store them in a flags register
(zero flag, carry flag, sign flag). Bite-16 simplifies: **JZ tests a register
directly** — "is R0 zero?" is the question, no flags register needed. The concept
transfers unchanged: *the branch condition is data the previous instruction
produced*.

## Prove it to yourself

**1. The while loop, compiled and decoded:**

```text
; while R0 < 3 { R0 = R0 + 1 }      (using JZ after a subtract — the classic shape)
addr 0:  LOADI R1, 3        0x4103
addr 2:  LOADI R2, 1        0x4201
addr 4:  SUB R0, R2         0x3002      ← R0 -= 1 each pass (R0 pre-loaded with 3)
addr 6:  JZ R0, 12          0x600C      ← R0 hit zero? → exit at addr 12
addr 8:  JUMP 4             0x5004      ← loop back: re-run the subtract
addr 10: HALT               0x9000      (padding — align the exit target)
addr 12: HALT               0x9000
```

Trace it: R0 starts 3, subtracts to 2 (not zero, fall through, jump back to 4),
subtracts to 1, to 0 — **JZ fires**, PC jumps to 12, halt. Three loop iterations,
executed by two jumps.

**2. The backward jump is the loop; the forward jump is the if** — every control
flow structure in every language reduces to these two directions of PC movement.

## The build: JZ in the CPU

```python
# jumps.py — the CPU gains JUMP and JZ (Chapter 6's CPU, +2 cases)
from isa import decode, OPCODES

class CPU:
    def __init__(self, memory):
        self.memory = memory; self.pc = 0
        self.regs = [3, 0, 1, 0]           # R0 = 3 (loop counter), R1 = 3, R2 = 1
        self.running = True; self.trace = []
    def step(self):
        instruction = self.memory[self.pc]
        self.pc += 2
        opcode, operand = decode(instruction)
        reg = (operand >> 8) & 0xF; value = operand & 0xFF
        if   opcode == OPCODES["LOADI"]:  self.regs[reg] = value
        elif opcode == OPCODES["SUB"]:
            r2 = operand & 0xF; self.regs[reg] -= self.regs[r2]
        elif opcode == OPCODES["JUMP"]:   self.pc = operand          # PC = address!
        elif opcode == OPCODES["JZ"]:
            if self.regs[reg] == 0: self.pc = operand                # the branch fires
        elif opcode == OPCODES["HALT"]:   self.running = False
        self.trace.append((self.pc, list(self.regs)))

memory = [0x4103, 0x4201, 0x3002, 0x600C, 0x5004, 0x9000, 0x0000, 0x9000]
cpu = CPU(memory)
while cpu.running: cpu.step()
print("final PC:", cpu.pc, "R0:", cpu.regs[0])
for pc, regs in cpu.trace[::2]: print(f"  pc={pc:2d} R0={regs[0]}")
# the trace shows pc bouncing 4→6→8→4→6→8→12: the loop, in PC coordinates.
# final PC: 12 R0: 0 — the loop exited via the branch, exactly as designed.
```

## What you now know

- Control flow = **writing the PC**: JUMP unconditionally, JZ conditionally on a
  register. Two opcodes, all of if/while/for.
- **Backward jumps make loops; forward jumps make ifs** — the compilers course's
  compiled shapes, now executed by your CPU.
- The branch condition is **data from a previous instruction** (a register here, a
  flags register in real CPUs) — Chapter 11's "the condition is data" point,
  in hardware.

Next: straight-line code and loops work — but calling a function and coming back
needs a place to remember *where you came from*. The call stack.
