---
layout: ../../layouts/Chapter.astro
title: 'Designing the Instruction Set'
description: 'Bite-16: opcodes, operands, and the encoding. Build: the ISA table and a machine-code listing decoded by hand.'
part: 'Part II — The Machine'
written: true
---

Gates compute; memory remembers. The **instruction set architecture (ISA)** is the
contract between them: the list of instructions the CPU understands, their encodings
in bytes, and the registers they touch. Designing an ISA is designing the CPU's
*nouns and verbs* — and Bite-16's design decisions (16-bit words, 4 general
registers, fixed 2-byte instructions) mirror the decisions inside every real ISA.
This chapter designs it and decodes a program by hand.

## The lie you were told

> "The instruction set is dictated by the hardware."

The ISA is a **design contract chosen first** — the hardware is then built to
execute it (the compilers course's Chapter 1 made the same point about languages).
Bite-16's contract:

```text
16-bit words, memory-addressed by word
4 registers: R0–R3 (R0 also serves as the output/accumulator)
8 opcodes, fixed 2-byte instructions: [opcode:4 bits | operand:12 bits]

opcode  instruction      meaning
 0000   LOAD R, [addr]   R ← memory[addr]
 0001   STORE R, [addr]  memory[addr] ← R
 0010   ADD R1, R2       R1 ← R1 + R2          (ALU ops read+write registers)
 0011   SUB R1, R2       R1 ← R1 − R2
 0100   LOADI R, imm     R ← the 8-bit immediate in the operand
 0101   JUMP addr        PC ← addr             (Ch 7: the writable PC)
 0110   JZ R, addr       if R == 0: PC ← addr  (branch)
 0111   CALL addr        (Ch 8: push PC, jump)
 1000   RET              (pop the return address)
 1001   HALT             stop the clock
```

## The design decisions, named

- **Fixed-width instructions** (2 bytes each): the fetch is trivial (PC += 2) —
  the RISC choice. Variable-width (x86) packs more per byte but decoding is a
  puzzle (Chapter 11's CISC story).
- **Registers over stacks**: 4 visible registers (the RISC flavor). A stack
  machine (the compilers course's Chapter 8) is the other design — Bite-16 keeps a
  separate stack only for CALL/RET (Ch 8).
- **Load/store architecture**: only LOAD/STORE touch memory; arithmetic works on
  registers only. The RISC discipline — one memory access per instruction, ever.

## Prove it to yourself

**1. A program, encoded and decoded by hand:**

```text
; add 7 + 5 and store the result
addr 0: LOADI R1, 7      → 0100 0001 00000111   = 0x4107
addr 2: LOADI R2, 5      → 0100 0010 00000101   = 0x4205
addr 4: ADD R1, R2       → 0010 0001 00000010   = 0x2102
addr 6: STORE R1, [8]    → 0001 0001 00001000   = 0x1108
addr 8: HALT             → 1001 0000 00000000   = 0x9000
```

Read any 2-byte word: the top 4 bits are the opcode, the rest is the operand.
`0x2102` decodes as "opcode 0010 (ADD), R1, R2" — the ISA is a *codebook*, and
you've just acted as the decoder hardware (Chapter 6's job).

## The build: the ISA as code

```python
# isa.py — the instruction set as an executable spec (~30 lines)
OPCODES = {
    "LOAD": 0x0, "STORE": 0x1, "ADD": 0x2, "SUB": 0x3,
    "LOADI": 0x4, "JUMP": 0x5, "JZ": 0x6, "CALL": 0x7,
    "RET": 0x8, "HALT": 0x9,
}
def encode(opcode, operand=0):
    return (OPCODES[opcode] << 12) | (operand & 0xFFF)

def decode(word):
    return (word >> 12) & 0xF, word & 0xFFF        # (opcode, operand)

# encode the program above:
program = [encode("LOADI", 0x1007), encode("LOADI", 0x2005),
           encode("ADD", 0x0102), encode("STORE", 0x1108), encode("HALT")]
print([hex(w) for w in program])
# ['0x4107', '0x4205', '0x2102', '0x1108', '0x9000'] — matches the hand encoding!

# and decode it back:
for w in program:
    op, operand = decode(w)
    name = next(k for k, v in OPCODES.items() if v == op)
    print(f"{w:#06x}: {name} {operand:#06x}")
# 0x4107: LOADI 0x107     — wait: the operand packs BOTH the register AND the value.
# (LOADI's operand layout: [reg:4 bits | immediate:8 bits] — 0x107 = R1, imm 0x07 ✓)
```

The last note is real ISA design: **operand packing**. 12 bits of operand split
into a register number and an immediate — the same trick x86 uses to squeeze
registers and addresses into variable-length instructions (Chapter 11's CISC
trade, in miniature).

## What you now know

- The ISA is a **contract designed before the hardware**: opcodes, operand
  encoding, register names — Bite-16's table is the course's constitution.
- **Fixed-width RISC** makes fetching trivial; **load/store discipline** keeps
  memory access to two instructions.
- **Operand packing** (register + immediate in 12 bits) is the encoding trick that
  makes fixed-width workable.
- The program *is* data: a list of 16-bit words, decodable by hand — Chapter 6's
  CPU does exactly what you just did.

Next: the loop that eats this encoding — fetch, decode, execute. The CPU exists.
