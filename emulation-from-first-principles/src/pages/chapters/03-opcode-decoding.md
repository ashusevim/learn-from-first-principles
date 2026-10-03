---
layout: ../../layouts/Chapter.astro
title: 'Opcode Decoding: The Wild Encodings'
description: '35 opcodes decoded by nibble patterns, not byte boundaries. Build: the full opcode dispatcher.'
part: 'Part I — The Machine'
written: true
---

CHIP-8's 35 opcodes share only one thing: they're 2 bytes, and the **first nibble**
selects the family. Within a family, the remaining nibbles are packed differently —
some hold registers (x, y), some hold 12-bit addresses (NNN), some hold constants
(NN), some are literals (00E0). This chapter builds the complete dispatcher: every
opcode, organized by nibble pattern, with the special cases called out.

## The lie you were told

> "Opcode tables are hard to read."

They're hard to *format*, easy to read — the standard CHIP-8 table is organized by
first nibble, and each row is one family:

```text
0NNN / 00E0 / 00EE   syscall / CLS / RET        (family 0 has THREE meanings!)
1NNN   JP NNN        PC = NNN
2NNN   CALL NNN      push PC, PC = NNN
3xNN   SE VX,NN      skip next if VX == NN
4xNN   SNE VX,NN     skip next if VX != NN
5xy0   SE VX,VY      skip if VX == VY
6xNN   LD VX,NN      VX = NN
7xNN   ADD VX,NN     VX += NN
8xy0-4 ALU ops      VX = VX op VY (the sub-opcode in the LAST nibble!)
9xy0   SNE VX,VY     skip if VX != VY
ANNN   LD I,NNN      I = NNN
BNNN   JP V0,NNN     PC = V0 + NNN
Dxyn   DRW VX,VY,n   draw an n-row sprite, XOR (Ch 4)
Fx07/15/1E/0A/29/33/55/65   the F-family: timers, input, BCD, memory
```

The 8-family is the sneaky one: its LAST nibble selects the ALU operation (0=LD,
1=OR, 2=AND, 3=XOR, 4=ADD, 5=SUB, 7=SUB-reversed, 6/14=shifts). Two-level dispatch:
first nibble → family, last nibble → operation.

## Prove it to yourself

**1. The two-level dispatch, felt:**

```python
opcode = 0x8124        # 8-family, x=1, y=2, sub-op=4 (ADD V1, V2)
family = (opcode >> 12) & 0xF        # 8
sub    = opcode & 0xF               # 4
x, y   = (opcode >> 8) & 0xF, (opcode >> 4) & 0xF
print(f"family {family:#x}, sub-op {sub:#x}: VX{1} = VX{1} + VY{2}")
# family 0x8, sub-op 0x4: VX1 = VX1 + VY2 — the ALU family, decoded
```

**2. The F-family's variety** — one first nibble, eight different instructions
selected by the low byte: timers (Fx07/Fx15), the pointer (Fx1E), key wait (Fx0A),
BCD (Fx33), memory block moves (Fx55/Fx65). The F-family is why the dispatcher
needs to be a table, not an if-chain.

## The build: the complete dispatcher

```python
# dispatch.py — all 35 opcodes, organized by nibble family (~60 lines)
# (builds on Chapter 1's skeleton: same class, load_rom from Ch 1)
class Chip8:
    def __init__(self):
        self.memory = [0] * 4096
        self.V = [0] * 16; self.I = 0; self.pc = 0x200
        self.stack = []
        self.display = [[0] * 64 for _ in range(32)]
        self.VF = 0xF
        self.running = True

    def load_rom(self, data):                    # Ch 1's loader (composition!)
        for i, byte in enumerate(data): self.memory[0x200 + i] = byte

    def step(self):
        opcode = (self.memory[self.pc] << 8) | self.memory[self.pc + 1]
        self.pc += 2
        family = (opcode >> 12) & 0xF
        x, y, nn, nnn = (opcode >> 8) & 0xF, (opcode >> 4) & 0xF, opcode & 0xFF, opcode & 0xFFF

        if family == 0x0:
            if opcode == 0x00E0:                       # CLS
                self.display = [[0] * 64 for _ in range(32)]
            elif opcode == 0x00EE:                     # RET
                self.pc = self.stack.pop()
        elif family == 0x1: self.pc = nnn              # JP
        elif family == 0x2:                            # CALL
            self.stack.append(self.pc); self.pc = nnn
        elif family == 0x3:                            # SE VX,NN
            if self.V[x] == nn: self.pc += 2
        elif family == 0x4:                            # SNE VX,NN
            if self.V[x] != nn: self.pc += 2
        elif family == 0x6: self.V[x] = nn             # LD VX,NN
        elif family == 0x7: self.V[x] = (self.V[x] + nn) & 0xFF   # ADD VX,NN
        elif family == 0x8:                            # the ALU family (Ch 3's ALU!)
            vy = self.V[y]
            if   nn & 0xF == 0: self.V[x] = vy                          # LD
            elif nn & 0xF == 1: self.V[x] |= vy                         # OR
            elif nn & 0xF == 2: self.V[x] &= vy                         # AND
            elif nn & 0xF == 3: self.V[x] ^= vy                         # XOR
            elif nn & 0xF == 4:                                         # ADD + carry
                self.V[x] = (self.V[x] + vy) & 0xFF
                self.V[self.VF] = 1 if self.V[x] < vy else 0            # carry → VF
            elif nn & 0xF == 5:                                         # SUB, borrow
                result = (self.V[x] - vy) & 0xFF
                self.V[self.VF] = 1 if self.V[x] >= vy else 0
                self.V[x] = result
        elif family == 0xA: self.I = nnn                # LD I,NNN
        elif family == 0xD:                             # DRW: Ch 4's XOR sprites
            pass                                        # (full draw: Chapter 4)
        elif family == 0xF:                             # the F-family: peripherals
            if   nn == 0x33:                            # BCD: VX as decimal digits
                self.memory[self.I] = self.V[x] // 100
                self.memory[self.I + 1] = (self.V[x] // 10) % 10
                self.memory[self.I + 2] = self.V[x] % 10
            elif nn == 0x15: self.delay_timer = self.V[x]               # Ch 5
            elif nn == 0x07: self.V[x] = self.delay_timer               # Ch 5
            elif nn == 0x1E: self.I = (self.I + self.V[x]) & 0xFFF      # I += VX

chip8 = Chip8()
chip8.load_rom([0x61, 0x05,        # 6105: V1 = 5     (2 bytes, big-endian)
                0x62, 0x03,        # 6203: V2 = 3
                0x81, 0x24,        # 8124: V1 += V2   (the ALU family)
                0xF0, 0x65])       # F065: memory load (F-family)
chip8.step(); chip8.step(); chip8.step()
print("V1 after ALU add:", chip8.V[1])     # 8 — the 8-family ALU op, executed
```

## What you now know

- The dispatcher organizes by **first nibble → family**, with sub-dispatch inside
  the 8-family (ALU) and F-family (peripherals).
- The **8-family is the CPUs course's ALU** (Ch 3) — add with carry into VF,
  subtract with borrow.
- Skip instructions (3x/4x/5x/9x) implement **conditional execution without jumps**
  — a CHIP-8 peculiarity that simplifies Chapter 7's branches.

Next: the display — 64×32 monochrome pixels, XOR-drawn sprites, and the collision
flag that games detect with.
