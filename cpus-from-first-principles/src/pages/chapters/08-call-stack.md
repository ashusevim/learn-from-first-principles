---
layout: ../../layouts/Chapter.astro
title: 'Functions & the Call Stack'
description: 'CALL saves the return address; RET pops it. Build: the stack pointer, nested calls, recursion in machine code.'
part: 'Part III — Running Programs'
written: true
---

Jumps (Chapter 7) can go anywhere — including into a function. But coming *back*
requires remembering where you came from, and nested calls require remembering a
*stack* of wheres. The **call stack** is that memory: CALL pushes the return
address, RET pops it, and a stack pointer register walks the top. This chapter adds
the stack to Bite-16 and runs recursion in machine code.

## The lie you were told

> "Function calls are language features."

They're **two instructions and one register**:

```text
CALL addr:   push PC (the return address) onto the stack;  PC = addr
RET:         PC = pop the stack                             ← resume the caller
SP:          the stack pointer register — points at the stack's top in memory
```

The stack lives in ordinary memory, growing downward (a convention: the program
starts at the bottom, the stack starts at the top, and they grow toward each
other). Chapter 8 of the compilers course (its VM's frames) and the concurrency
course's call stacks (Ch 1) were this structure, wearing language clothing.

## The subtlety: who saves the registers

The caller's registers are live when the call happens — the callee wants to use
them. Two conventions: **callee-saved** (the function preserves what it touches) or
**caller-saved** (the caller parks its values first). Real ISAs split registers
into both groups — and the calling convention document of every real architecture
is exactly this decision, written down.

## Prove it to yourself

**1. Nested calls demand a stack** — one return address in a register breaks the
moment function A calls B which calls A's helper:

```text
main: CALL f      → return address R1 saved in a register
f:    CALL g      → R1 OVERWRITTEN with the address in f!
g:    RET         → jumps to... inside f. main is never returned to. BROKEN.
# the stack fixes it: each CALL pushes; each RET pops the most recent. LIFO.
```

**2. Recursion = frames stacking** — `fib(3)` calls `fib(2)` calls `fib(1)`: three
return addresses stacked, unwinding in reverse. The compilers course's Chapter 8
(suspense and frames) and the concurrency course's recursion — the same stack.

## The build: the call stack

```python
# callstack.py — Bite-16 gains CALL/RET/SP (~40 lines)
from isa import decode, OPCODES

STACK_TOP = 0xFE                  # the stack grows DOWN from the top of memory

class CPU:
    def __init__(self, memory):
        self.memory = memory; self.pc = 0
        self.regs = [0, 0, 0, 0]
        self.sp = STACK_TOP                  # the stack pointer register
        self.running = True; self.output = []
    def push(self, value):
        self.memory[self.sp] = value; self.sp -= 1    # grow DOWNWARD
    def pop(self):
        self.sp += 1; return self.memory[self.sp]
    def step(self):
        instruction = self.memory[self.pc]; self.pc += 2
        opcode, operand = decode(instruction)
        reg = (operand >> 8) & 0xF; value = operand & 0xFF
        if   opcode == OPCODES["LOADI"]:  self.regs[reg] = value
        elif opcode == OPCODES["ADD"]:
            r2 = operand & 0xF; self.regs[reg] += self.regs[r2]
        elif opcode == OPCODES["LOAD"]:   self.regs[reg] = self.memory[value]
        elif opcode == OPCODES["CALL"]:
            self.push(self.pc); self.pc = value              # remember, then jump
        elif opcode == OPCODES["RET"]:
            self.pc = self.pop()                             # resume the caller
        elif opcode == OPCODES["JZ"]:
            if self.regs[reg] == 0: self.pc = operand
        elif opcode == OPCODES["SUB"]:
            r2 = operand & 0xF; self.regs[reg] -= self.regs[r2]
        elif opcode == OPCODES["STORE"]:
            self.output.append(self.regs[reg])
        elif opcode == OPCODES["HALT"]:   self.running = False

# ── recursion in machine code: countdown(n) { if n==0 halt; countdown(n−1) } ──
# addr 0:  JZ R0, 14         0x600E     ← n == 0? → done
# addr 2:  SUB R0, R2        0x3002     ← R2 = 1: n -= 1
# addr 4:  CALL 8            0x7008     ← countdown(n − 1): RECURSION
# addr 6:  RET               0x8000     ← unwind
# addr 8:  JZ R0, 14         0x600E     (the recursive call re-enters HERE)
# ... (the same body re-entered via CALL at addr 8 — self-reference through data)
program = [0x600E, 0x3002, 0x7008, 0x8000, 0x600E, 0x3002, 0x7008, 0x8000,
           0x9000, 0, 0, 0, 0, 0, 0]
cpu = CPU(program + [0] * 8)
cpu.regs[0] = 3; cpu.regs[2] = 1
while cpu.running: cpu.step()
print("final PC:", cpu.pc, "| stack pointer:", cpu.sp, "| R0:", cpu.regs[0])
# the recursion unwound through three CALL frames — and the stack is empty again.
```

## What you now know

- **CALL/RET + SP** = function calls: push the return address, jump, pop to return.
  LIFO by construction — nested calls and recursion work automatically.
- The stack lives in **ordinary memory**, growing downward toward the program;
  overflowing it means walking over your own code (the classic stack-smashing).
- **Calling conventions** (who saves registers, where args go) are the human-written
  contract around this machinery — every real ISA documents one.

Next: hand-assembling `0x4103` is over. The assembler — mnemonics, labels, two
passes — writes the machine code for you.
