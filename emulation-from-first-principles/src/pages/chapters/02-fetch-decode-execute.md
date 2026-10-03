---
layout: ../../layouts/Chapter.astro
title: 'Fetch–Decode–Execute, Again — For Someone Else’s CPU'
description: 'The CPUs course’s loop, aimed at a foreign machine. Build: the CHIP-8 fetch-decode-execute skeleton running its first opcodes.'
part: 'Part I — The Machine'
written: true
---

Chapter 1's skeleton has the loop shell; this chapter fills the first real opcodes —
and the interesting part is *recognizing the machinery*: this is the CPUs course's
Chapter 6 loop, running a foreign ISA. Fetch a 16-bit big-endian word, decode by
nibble patterns, execute. You've done all of this; only the numbers changed.

## The lie you were told

> "Emulating a CPU means simulating transistors."

You simulate the **instruction set architecture** — the contract (the CPUs course,
Chapter 5), not the transistors. If the ISA says "opcode 6xNN sets VX to NN", your
emulator sets a list slot to NN. The silicon is irrelevant to observable behavior
(at this abstraction level — Chapter 10 covers where that breaks).

## The first opcodes

```text
00E0  CLS      clear the display
6xNN  LD VX,NN  VX = NN                     (Ch 1's V1 = 1)
7xNN  ADD VX,NN  VX += NN
8xy4  ADD VX,VY  VX += VY (carry into VF)  ← three-nibble decoding!
ANNN  LD I,NNN  I = NNN                    (the pointer register)
1NNN  JP NNN    PC = NNN                   (Ch 7 of the CPUs course: PC is writable)
```

Note the decode shape: the first nibble selects the instruction family, and the
remaining nibbles are operands — x, y, NNN, or NN depending on the family. That's
the "wild encoding" Chapter 3 tames: the first nibble is the dispatch, the rest is
per-family packing.

## Prove it to yourself

**1. The fetch, big-endian:** CHIP-8 stores its 2-byte opcodes big-endian — the
opposite of x86's little-endian:

```python
memory = [0x61, 0x01]                   # 6101: V1 = 1
opcode = (memory[0] << 8) | memory[1]   # 0x6101 — high byte FIRST
# little-endian would read 0x0161 — a completely different (wrong) instruction.
# byte order is the first thing every emulator gets wrong.
```

**2. The self-loop** — Chapter 1's tiny ROM (`1200`: jump to 0x200) spins forever:
the JP opcode writes the PC, exactly as the CPUs course's Chapter 7 taught. Two
instructions and you've executed both data manipulation AND control flow.

## The build: the first real opcodes

```python
# fde.py — the emulator gains its first real opcodes (~35 lines)
class Chip8:
    def __init__(self):
        self.memory = [0] * 4096
        self.V = [0] * 16
        self.I = 0
        self.pc = 0x200
        self.stack = []
        self.display = [[0] * 64 for _ in range(32)]
        self.running = True

    def load_rom(self, data):
        for i, byte in enumerate(data): self.memory[0x200 + i] = byte

    def step(self):
        opcode = (self.memory[self.pc] << 8) | self.memory[self.pc + 1]
        self.pc += 2                                    # FETCH (2 bytes, always)
        x  = (opcode >> 8) & 0xF                        # second nibble: the register
        nn = opcode & 0xFF                              # low byte: an 8-bit constant
        nnn = opcode & 0xFFF                            # 12-bit address
        # DECODE + EXECUTE (the families dispatch on the FIRST nibble — Ch 3):
        family = (opcode >> 12) & 0xF
        if family == 0x0 and opcode == 0x00E0:          # CLS
            self.display = [[0] * 64 for _ in range(32)]
        elif family == 0x6:                             # 6xNN: VX = NN
            self.V[x] = nn
        elif family == 0x7:                             # 7xNN: VX += NN
            self.V[x] = (self.V[x] + nn) & 0xFF
        elif family == 0xA:                             # ANNN: I = NNN
            self.I = nnn
        elif family == 0x1:                             # 1NNN: JP
            self.pc = nnn                               # PC is writable (CPUs Ch 7)
        elif family == 0xF and nn == 0x33:              # FX33: BCD (see Ch 3)
            self.memory[self.I] = self.V[x] // 100
            self.memory[self.I + 1] = (self.V[x] // 10) % 10
            self.memory[self.I + 2] = self.V[x] % 10

chip8 = Chip8()
chip8.load_rom([0x61, 0x01,        # V1 = 1
                0x62, 0x02,        # V2 = 2
                0x71, 0x03,        # V1 += 3
                0xA3, 0x00,        # I = 0x300
                0xF1, 0x33,        # BCD V1 into memory[I]
                0x12, 0x00])       # jump to 0x200 (loop)
for _ in range(5): chip8.step()
print("V1:", chip8.V[1], "| V2:", chip8.V[2], "| I:", hex(chip8.I))
print("BCD at memory[0x300..0x302]:", chip8.memory[0x300:0x303])
# V1: 4 | V2: 2 | I: 0x300
# BCD at memory[0x300..0x302]: [0, 0, 4]   ← V1=4 stored as digits 0,0,4
```

## What you now know

- The emulator's loop = **the CPUs course's Ch 6 loop, foreign ISA edition**: fetch
  big-endian 2 bytes, dispatch on the first nibble, execute per family.
- **Byte order** (big-endian here) is the first thing to get right; **register
  families** dispatch on nibbles, not byte boundaries.
- Five opcode families in, the emulator already runs real CHIP-8 programs — Chapter
  3 adds the remaining 30.

Next: the wild encodings tamed — the full 35-opcode dispatcher, organized by
nibble patterns.
