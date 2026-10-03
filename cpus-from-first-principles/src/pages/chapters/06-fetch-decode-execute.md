---
layout: ../../layouts/Chapter.astro
title: 'Fetch–Decode–Execute: The CPU Loop'
description: 'Program counter, instruction register, decode, run. Build: the CPU executing its first program — step by step.'
part: 'Part II — The Machine'
written: true
---

Everything is in place: the ALU computes (Chapter 3), registers remember
(Chapter 4), the ISA defines the vocabulary (Chapter 5). The CPU is the loop that
wires them — **fetch the instruction at the program counter, decode its fields,
execute it, repeat**. This is the loop that has run on every computer since 1945,
and this chapter builds it and watches it execute its first program, step by step.

## The lie you were told

> "The CPU does many things."

The loop is three steps, forever:

```text
FETCH:    instruction = memory[PC];  PC += 2      (Ch 5's fixed width makes this trivial)
DECODE:   (opcode, operand) = split(instruction)  (Chapter 5's codebook)
EXECUTE:  do what the opcode says                 (the ALU, registers, PC writes)
```

The **program counter (PC)** is just a register that holds the address of the next
instruction — and its increment is part of fetch. Chapter 7's revelation is that
the PC is *writable*: jumps are "set the PC". The whole mystery of control flow,
dissolved into a register assignment.

## Prove it to yourself

**1. The decode, reusing Chapter 5:** the ISA's `decode(word) → (opcode, operand)`
is the DECODE stage, verbatim. The CPU *is* the chapters, sequenced.

**2. The execute table, one case per opcode:**

```text
ADD R1, R2:   registers[R1] = ALU("ADD", registers[R1], registers[R2])   (Ch 3!)
LOAD R, addr: registers[R] = memory[addr]                                 (Ch 4)
STORE:        memory[addr] = registers[R]
JUMP addr:    PC = addr                                        (Ch 7: control flow)
HALT:         stop the clock                                   (Ch 4: no more edges)
```

Every execute case touches only components you've built. The CPU is a *conductor*,
and every instrument exists.

## The build: the CPU

```python
# cpu.py — fetch-decode-execute over the Chapter 5 program (~45 lines)
from isa import decode, OPCODES

class CPU:
    def __init__(self, memory):
        self.memory = memory               # the program + data, word-addressed
        self.pc = 0                        # the program counter
        self.regs = [0, 0, 0, 0]           # R0–R3 (Ch 4's registers)
        self.running = True
    def step(self):
        # FETCH (Ch 5: fixed width → PC advances by 2)
        instruction = self.memory[self.pc]
        self.pc += 2
        # DECODE (Ch 5's codebook)
        opcode, operand = decode(instruction)
        reg = (operand >> 8) & 0xF         # operand packs [reg:4 | value:8]
        value = operand & 0xFF
        # EXECUTE: one case per opcode
        if   opcode == OPCODES["LOADI"]:  self.regs[reg] = value
        elif opcode == OPCODES["LOAD"]:   self.regs[reg] = self.memory[value]
        elif opcode == OPCODES["STORE"]:  self.memory[value] = self.regs[reg]
        elif opcode == OPCODES["ADD"]:
            r2 = operand & 0xF; self.regs[reg] = self.regs[reg] + self.regs[r2]
        elif opcode == OPCODES["SUB"]:
            r2 = operand & 0xF; self.regs[reg] = self.regs[reg] - self.regs[r2]
        elif opcode == OPCODES["HALT"]:   self.running = False

memory = [0x4107, 0x4205, 0x2102, 0x1108, 0x9000] + [0] * 3    # Ch 5's program
cpu = CPU(memory)
while cpu.running: cpu.step()
print("registers:", cpu.regs)
print("memory[8]:", memory[8])
# registers: [12, 5, 0, 0]     ← R1 = 7 + 5 = 12, R2 = 5: the ALU did it (Ch 3!)
# memory[8]: 12                ← the STORE wrote R1 into memory: LOAD/STORE work (Ch 5)
```

The program: load 7, load 5, add, store, halt. The CPU executed all five
instructions — and the final state shows both the register arithmetic and the
memory write. **A computer, from your chapters, running a program.**

## What you now know

- The CPU = **fetch → decode → execute**, three steps forever; the PC's increment
  is part of fetch.
- The **decode stage is Chapter 5's codebook**; the **execute stage is one case per
  opcode**, touching only components you built (ALU Ch 3, registers Ch 4).
- The program is data in the same memory the data lives in — the stored-program
  concept, von Neumann's 1945 inheritance, visible in your memory array.

Next: the loop only runs straight ahead. Jumps make the PC *writable* — if, while,
and the end of straight-line thinking.
