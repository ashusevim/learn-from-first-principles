---
layout: ../../layouts/Chapter.astro
title: 'Graphics: The 64×32 Display'
description: 'XOR sprites, the collision flag, and why old games flicker. Build: sprite drawing with VF, verified pixel by pixel.'
part: 'Part II — Screen & Sound'
written: true
---

The CHIP-8 display is 64×32 monochrome pixels — and sprites are drawn with **XOR**,
not overwrite: drawing a sprite flips the pixels it covers. Where a sprite pixel
turns a lit pixel OFF, the VF register flags a **collision** — games detect
"bullet hit enemy" by checking that flag. This chapter builds the DRW opcode and
verifies the XOR semantics pixel by pixel.

## The lie you were told

> "Sprites are images drawn onto the screen."

CHIP-8 sprites are **XOR-composited**: each sprite pixel TOGGLES the display pixel.
Drawing the same sprite twice erases it — which is how games erase moving objects
(redraw at the old position to erase, draw at the new to show). And when any toggle
turns a 1 into a 0, VF=1: the collision flag.

## The DRW opcode

```text
Dxyn: draw a sprite at (VX, VY)
  sprite data: memory[I], n rows of 8 bits (one byte per row)
  for each row r, each bit b:
    screen_pixel = (VX + b, VY + r) mod (64, 32)     ← WRAPS around the edges!
    if sprite bit is 1: TOGGLE the screen pixel
    if toggled 1→0: VF = 1                            ← collision
```

The wrap-around is a quirk (Chapter 10): sprites crossing the screen edge wrap to
the other side — authentic 1977 behavior.

## Prove it to yourself

**1. XOR semantics, verified:**

```python
a, b = 1, 1
print(a ^ b)      # 0 — drawing over a lit pixel ERASES it
print(0 ^ 1)      # 1 — drawing over a dark pixel LIGHTS it
# two passes = identity: XOR is its own inverse (the cryptography course, Ch 4!)
```

**2. The collision, detected:**

```python
# a sprite drawn over an already-lit pixel sets VF=1:
# games read VF after DRW to detect "my bullet overlapped something".
# collision detection without a physics engine — one register flag.
```

## The build: the DRW opcode

```python
# drw.py — the XOR sprite drawing, verified pixel by pixel (~35 lines)
class Chip8:
    def __init__(self):
        self.memory = [0] * 4096
        self.V = [0] * 16; self.I = 0; self.pc = 0x200
        self.display = [[0] * 64 for _ in range(32)]
        self.VF = 0xF

    def DRW(self, vx_reg, vy_reg, rows):
        x0, y0 = self.V[vx_reg], self.V[vy_reg]
        self.V[self.VF] = 0                              # reset the collision flag
        for row in range(rows):
            sprite_byte = self.memory[self.I + row]
            for bit in range(8):
                if sprite_byte & (0x80 >> bit):          # sprite bit set?
                    sx = (x0 + bit) % 64                 # WRAPS around (the quirk)
                    sy = (y0 + row) % 32
                    if self.display[sy][sx] == 1:        # erasing a lit pixel:
                        self.V[self.VF] = 1              # ← COLLISION
                    self.display[sy][sx] ^= 1            # XOR: toggle it

    def show(self):
        for row in self.display[:8]:
            print("".join("█" if px else "·" for px in row[:40]))

chip8 = Chip8()
# sprite data: an 8×5 "ship" shape at memory[0x300]:
ship = [0b11111111, 0b10011001, 0b11111111, 0b00100100, 0b00100100]
for i, b in enumerate(ship): chip8.memory[0x300 + i] = b
chip8.I = 0x300
chip8.V[0], chip8.V[1] = 10, 2                        # draw at (10, 2)
chip8.DRW(0, 1, 5)
print("── first draw ──"); chip8.show()
print("VF after first draw:", chip8.V[chip8.VF], "(no collision — dark background)")

chip8.DRW(0, 1, 5)                                    # draw the SAME sprite again
print("── second draw (XOR erases!) ──"); chip8.show()
print("VF after second draw:", chip8.V[chip8.VF], "(collision — erased lit pixels)")
print("display empty again:", all(px == 0 for row in chip8.display for px in row))
# two draws = identity: the sprite erased itself. XOR semantics, proven on your
# own display. This is why CHIP-8 games flicker-free WITHOUT a framebuffer diff.
```

## What you now know

- Sprite drawing = **XOR compositing with wrap-around** — toggle semantics, not
  overwrite.
- The **collision flag (VF)** is the game's physics sensor: bullet hits, wall
  overlaps — one register read.
- Drawing the same sprite twice **erases it** — the erase-and-redraw trick moving
  objects use, built into the display model.

Next: the screen works — now the heartbeat. The 60 Hz timers, the key-wait, and
the beeper that ties to the audio course.
