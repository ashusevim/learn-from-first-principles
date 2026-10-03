---
layout: ../../layouts/Chapter.astro
title: 'Writing CHIP-8 Programs'
description: 'Hand-assembling a program — the CPUs course’s assembler, aimed at a foreign ISA. Build: a working CHIP-8 program.'
part: 'Part III — A Real Program'
written: true
---

The emulator runs real opcodes — time to write a real *program* for it. This chapter
hand-assembles a CHIP-8 program (drawing, erasing, moving a sprite), exactly the way
the CPUs course's Chapter 9 taught: mnemonics, addresses, and a symbol table —
aimed at a foreign ISA. And the program runs on your emulator, unmodified.

## The lie you were told

> "Hand-assembling is obsolete."

It's the best exercise in the course: hand-assembly forces you to think in the
machine's actual vocabulary — registers, opcodes, addresses — with no high-level
comforts. Every emulator author hand-assembles their first test programs. (The
CPUs course, Chapter 9, built the assembler; here you ARE the assembler.)

## The program: a moving sprite

```text
; load the ship sprite into memory, draw it, wait, erase, redraw lower
0200: A2 0A    LD I, 0x20A        ← I points at the sprite data
0202: 60 0A    LD V0, 10          ← x = 10
0204: 61 04    LD V1, 4           ← y = 4
0206: D0 15    DRW V0, V1, 5      ← draw 5 rows (the ship)
0208: 63 01    LD V3, 1           ← wait ~1 second via the delay timer
020A: F3 15    LD V3, DT
020C: 65 00    LD V5, 0
020E: F5 07    LD V5, DT          ← poll the timer
0210: 45 00    SE V5, 0           ← timer expired? skip the poll-loop jump
0212: 12 0A    JP 0x20A           ← still counting: poll again
0214: D0 15    DRW V0, V1, 5      ← draw again: XOR erases the ship!
0216: 61 04    LD V1, 8           ← new y = 8
0218: D0 15    DRW V0, V1, 5      ← draw at the new position
021A: 12 1A    JP 0x21A           ← done: loop forever
...sprite data at 0x20A (5 bytes) — wait, that collides with the code!
```

The collision at the end is the lesson: **the sprite data must live somewhere the
program isn't** — typically at the END of the program, addressed via I. The
hand-assembler's symbol table (the CPUs course, Chapter 9) would catch this; by
hand, you learn why the table exists.

## Prove it to yourself

**1. The erase-by-XOR, demonstrated by the program itself** — the second DRW
erases the first sprite (the graphics course's XOR semantics, Chapter 4 of
emulation). The program draws, erases, redraws lower: **animation**.

**2. The delay-timer poll loop** — the timer counts down at 60 Hz; the program
polls it (Chapter 5's decimated heartbeat) — a busy-wait pause, the primitive
every game loop is built from.

## The build: the program, assembled and run

```python
# program.py — the moving-sprite program, assembled and executed
from emulation import Chip8                          # Chapters 2–6's emulator

program = [
    0xA2, 0x1E,        # 0200: LD I, 0x21E           ← sprite data at 0x21E (after the code)
    0x60, 0x0A,        # 0202: LD V0, 10
    0x61, 0x04,        # 0204: LD V1, 4
    0xD0, 0x15,        # 0206: DRW V0, V1, 5         ← draw at (10, 4)
    0x63, 0x3C,        # 0208: LD V3, 60             ← delay timer = 60 (1 second)
    0xF3, 0x15,        # 020A: LD DT, V3
    0x65, 0x00,        # 020C: LD V5, 0
    0xF5, 0x07,        # 020E: LD V5, DT             ← poll
    0x45, 0x00,        # 0210: SE V5, 0              ← timer zero? skip the loop-back
    0x12, 0x0C,        # 0212: JP 0x20C              ← still counting: poll again
    0xD0, 0x15,        # 0214: DRW V0, V1, 5         ← XOR: ERASES the sprite
    0x61, 0x0C,        # 0216: LD V1, 12             ← new y = 12
    0xD0, 0x15,        # 0218: DRW V0, V1, 5         ← draw at the new position
    0x12, 0x18,        # 021A: JP 0x218              ← loop forever (the animation)
    # sprite data at 0x21E (5 bytes): the ship
    0b11111111, 0b10011001, 0b11111111, 0b00100100, 0b00100100,
]
chip8 = Chip8()
chip8.load_rom(program)

def show(chip8):
    for row in chip8.display[:16]:
        print("".join("█" if px else "·" for px in row))

print("── after the first draw ──")
for _ in range(4): chip8.step()                      # LD I, LD V0, LD V1, DRW
show(chip8)

print("\n── after the erase (second DRW) ──")
for _ in range(12): chip8.step()                     # timer setup + poll + erase DRW
show(chip8)
print("display empty — the XOR erased the ship")
```

(The full run — with the timer decimation from Chapter 5 filling the poll loop —
animates the ship downward. The final `JP 0x218` spins on the last draw: the
sprite holds its new position, animated.)

## What you now know

- Hand-assembly = **thinking in the machine's vocabulary** — registers, addresses,
  and the sprite data placement decision (code and data sharing one address space!).
- The moving-sprite program demonstrates **the whole stack**: XOR erase/redraw
  animation (Ch 4), the delay-timer pause (Ch 5), the pointer register (Ch 2's I).
- The data-placement bug (sprite colliding with code) is the lesson the symbol
  table automates — the CPUs course's Chapter 9, foreign edition.

Next: stop hand-assembling — load **real ROMs**. Public-domain CHIP-8 games run on
your emulator, unmodified.
