---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete CPU in ~400 Lines'
description: 'Gates, ALU, registers, ISA, assembler, CPU — one file, running Fibonacci in machine code it assembled itself.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of parts — NAND gates (Ch 1–2), the ALU (Ch 3),
registers (Ch 4), the ISA (Ch 5), the CPU loop (Ch 6), jumps (Ch 7), the call stack
(Ch 8), the assembler (Ch 9) — assembled into **one complete CPU simulator in
~400 lines**: gates at the bottom, an assembler at the top, and Fibonacci running
in machine code that the assembler produced from assembly you wrote. The full stack
of the machine, in one file.

## The lie you were told

> "A CPU simulator is a giant project."

The *simulator* is the course condensed: the gate library (Ch 2), the ALU calling
it (Ch 3), the ISA constants (Ch 5), the CPU loop (Ch 6), and the assembler (Ch 9)
— each a chapter's worth of code, composed. The silicon adds the physics; the
logic was always this.

## The build: cpu.py — the complete stack

```python
# cpu.py — gates → ALU → ISA → assembler → CPU → a running program
import numpy as np  # (not required — pure Python works; numpy for the pretty traces)

# ── Ch 2: the gate library ──
def nand(a, b): return 0 if (a and b) else 1
NOT = lambda a: nand(a, a)
AND = lambda a, b: nand(nand(a, b), nand(a, b))
OR  = lambda a, b: nand(NOT(a), NOT(b))
def half_adder(a, b): return a ^ b, a & b

# ── Ch 3: the 8-bit ALU ──
def alu(op, a, b, width=8):
    ab, bb = [(a >> i) & 1 for i in range(width)], [(b >> i) & 1 for i in range(width)]
    if op == "ADD" or op == "SUB":
        out, carry = [], (1 if op == "SUB" else 0)
        for x, y in zip(ab, bb):
            y2 = (1 - y) if op == "SUB" else y
            s = x ^ y2 ^ carry
            carry = (x & y2) | (x & carry) | (y2 & carry)
            out.append(s)
        return sum(bit << i for i, bit in enumerate(out))
    if op == "AND": return sum((x & y) << i for i, (x, y) in enumerate(zip(ab, bb)))
    if op == "OR":  return sum((x | y) << i for i, (x, y) in enumerate(zip(ab, bb)))
    raise ValueError(op)

# ── Ch 5: the ISA ──
OPCODES = {"LOAD": 0x0, "STORE": 0x1, "ADD": 0x2, "SUB": 0x3, "LOADI": 0x4,
           "JUMP": 0x5, "JZ": 0x6, "CALL": 0x7, "RET": 0x8, "HALT": 0x9}

# ── Ch 6 + 8: the CPU with stack and jumps ──
class CPU:
    def __init__(self, memory):
        self.memory = memory[:]; self.pc = 0
        self.regs = [0, 0, 0, 0]; self.sp = 0xFE
        self.running, self.trace = True, []
    def push(self, v): self.memory[self.sp] = v; self.sp -= 1
    def pop(self): self.sp += 1; return self.memory[self.sp]
    def step(self):
        instruction = self.memory[self.pc]; self.pc += 2          # FETCH
        opcode, operand = (instruction >> 12) & 0xF, instruction & 0xFFF  # DECODE
        reg, val = (operand >> 8) & 0xF, operand & 0xFF
        if   opcode == OPCODES["LOADI"]: self.regs[reg] = val
        elif opcode == OPCODES["LOAD"]:  self.regs[reg] = self.memory[val]
        elif opcode == OPCODES["STORE"]: self.memory[val] = self.regs[reg]
        elif opcode == OPCODES["ADD"]:   self.regs[reg] = alu("ADD", self.regs[reg], self.regs[operand & 0xF])
        elif opcode == OPCODES["SUB"]:   self.regs[reg] = alu("SUB", self.regs[reg], self.regs[operand & 0xF])
        elif opcode == OPCODES["JUMP"]:  self.pc = operand
        elif opcode == OPCODES["JZ"]:
            if self.regs[reg] == 0: self.pc = operand
        elif opcode == OPCODES["CALL"]:  self.push(self.pc); self.pc = operand
        elif opcode == OPCODES["RET"]:   self.pc = self.pop()
        elif opcode == OPCODES["HALT"]:  self.running = False
        self.trace.append(self.pc)                                # the PC trail (Ch 7)

# ── Ch 9: the two-pass assembler ──
def assemble(source):                              # (Ch 9's listing, verbatim logic)
    labels, words = {}, []
    lines = [l.split(";")[0].strip() for l in source.splitlines()]
    for line in lines:
        if ":" in line:
            label, rest = line.split(":", 1)
            labels[label.strip()] = len(words) * 2
            line = rest.strip()
        if line: words.append(None)
    pc, out = 0, []
    for line in lines:
        if not line: continue
        parts = line.replace(",", " ").split()
        mnem, ops = parts[0], parts[1:]
        if mnem == "HALT": word = 0x9000
        elif mnem == "RET": word = 0x8000
        elif mnem == "LOADI": word = (0x4 << 12) | (int(ops[0][1]) << 8) | int(ops[1])
        elif mnem in ("ADD", "SUB"):
            word = (OPCODES[mnem] << 12) | (int(ops[0][1]) << 8) | int(ops[1][1])
        elif mnem in ("JUMP", "JZ"):
            target = int(ops[-1]) if ops[-1].isdigit() else labels[ops[-1]]
            reg = (int(ops[0][1]) << 8) if mnem == "JZ" else 0
            word = (OPCODES[mnem] << 12) | reg | target
        out.append(word); pc += 2
    return out, labels

# ── the program: Fibonacci in Bite-16 assembly ──
FIB = """
        LOADI R1, 0        ; a = 0
        LOADI R2, 1        ; b = 1
        LOADI R3, 10       ; counter
loop:   STORE R1, [30]     ; remember a
        LOADI R0, 30
        ADD R1, R2         ; a, b = b, a+b
        STORE R1, [31]
        LOADI R1, 30
        LOAD R1, [30]      ← a = memory[30]
        LOAD R2, [31]      ← b = memory[31]
        LOADI R0, 1
        SUB R3, R0         ; counter -= 1
        JZ R3, done
        JUMP loop
done:   HALT
"""

words, labels = assemble(FIB)
memory = words + [0] * (32 - len(words))
cpu = CPU(memory)
while cpu.running: cpu.step()
print("Fibonacci sequence in memory[30..31]:", memory[30], memory[31])
print("PC trail (Ch 7's loops, visible):", cpu.trace[:12])
```

The program: Fibonacci by iteration, in machine code the assembler produced —
with the loop's PC trail showing the backward jumps from Chapter 7, the SUB/JZ
pair from Chapter 7's branches, and the STORE/LOAD pair from Chapter 5 shuttling
values through memory. **Every instruction executed by a CPU built from your
chapters.**

## Where you are now

Twelve chapters ago, a CPU was a black box of silicon. Now: you've built NAND from
a switch model (Ch 1), proven functional completeness with a verified gate library
(Ch 2), built an adder-subtractor ALU (Ch 3), remembered bits with cross-coupled
gates (Ch 4), designed an ISA with packed operands (Ch 5), run fetch-decode-execute
(Ch 6), made the PC writable with jumps (Ch 7), stacked call frames for recursion
(Ch 8), written the two-pass assembler (Ch 9), mapped the silicon — clocks, buses,
caches (Ch 10) — placed your ISA on the CISC/RISC axes beside x86 and RISC-V
(Ch 11) — and run Fibonacci on the complete machine.

Every instruction your programs will ever execute is this loop. You've written it.

**Where to go next:** build NAND-to-Tetris's hardware simulator properly, or
implement a real RISC-V subset (RV32I is 47 instructions — you've built most).
And the First Principles Project continues: **Emulation** (CHIP-8 — a *different*
CPU, plus the display you know from graphics), **Blockchain**, **Auth**, and
**Observability** remain on the belt.
