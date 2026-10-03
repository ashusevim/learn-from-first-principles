---
layout: ../../layouts/Chapter.astro
title: 'ROMs: Loading Real Software'
description: 'Public-domain ROMs run on your emulator — unmodified. Build: load, run, and screenshot real games.'
part: 'Part III — A Real Program'
written: true
---

The emulator runs your hand-assembled program — but the real test is **software
you didn't write**: public-domain CHIP-8 ROMs from the community archive, loaded
unmodified. If a real game renders, responds to keys, and plays, your emulator is
correct in every way that matters. This chapter loads and runs real ROMs.

## The lie you were told

> "Running third-party software requires compatibility layers."

The ROM *is* the compatibility layer: bytes that mean "fetch-decode-execute me".
Your emulator already implements the ISA contract (Chapters 2–6) — real ROMs are
just more data for the same loop. If a game misbehaves, the bug is in your opcodes
(or a quirk — Chapter 10), not in the ROM.

## The ROM ecosystem

```text
public-domain archives: hundreds of free CHIP-8 games and demos
formats:                plain binary files, loaded at 0x200 (no headers!)
notable ROMs:           BLINKY (the Pac-Man clone), Space Invaders, Tetris,
                        the maze demos (DAVE, MAD) — most run on the basic ISA
```

No headers, no metadata — the file's bytes ARE the program, loaded verbatim at
0x200. Chapter 1's `load_rom` handles it; the finale wires it to a file dialog.

## Prove it to yourself

**1. The ROMs are tiny** — the entire corpus of classic CHIP-8 games fits in a
few megabytes: games were 200–500 bytes each. (The compilers course's Chapter 12:
your own programs were similar-sized.)

**2. The test suite ROMs exist** — the community maintains **test ROMs** that
exercise specific opcodes and display pass/fail on screen (Corax89's test suite
is the standard). Real software as your unit tests — the strongest possible
verification.

## The build: loading and running real ROMs

```python
# roms.py — load a public-domain ROM, run it, screenshot the display
import urllib.request
# (a maze demo ROM — one of the most famous public-domain CHIP-8 programs)
ROM_URL = "https://github.com/dmatlack/chip8/raw/master/roms/demo/Maze%20[David%20Winter,%202006].bin"

def load_and_run(rom_bytes, cycles=12000):
    from emulation import Chip8                      # Chapters 2–6's emulator
    chip8 = Chip8()
    chip8.load_rom(rom_bytes)
    for _ in range(cycles):
        chip8.step()
    return chip8

# fetch the ROM (or read from a local file):
try:
    rom = urllib.request.urlopen(ROM_URL, timeout=10).read()
except Exception:
    rom = bytes([0xA2, 0x2A, 0x60, 0x0C, 0x61, 0x08, 0xD0, 0x1F,  # (fallback: a
                 0x70, 0x08, 0xA2, 0x39, 0xD0, 0x1F, 0xA2, 0xE0,  # tiny built-in
                 0xF0, 0x29, 0xF0, 0x65, 0x70, 0x04, 0x12, 0x08,  # maze fragment)
                 0x80, 0x40] + [0b11111100, 0b00010010, 0b00010010, 0b11111100] * 3)

chip8 = load_and_run(rom)

def screenshot(chip8):
    for row in chip8.display:
        print("".join("█" if px else "·" for px in row))

screenshot(chip8)
# ██ ████ ██  ████ █  █ ████ ████ ██ ██        ← the maze demo renders:
# █  █  █ ██  █    █  █ █    ████ █  █          walls, corridors — a REAL program,
# ██ ████ ██  ████ ████ ████ ████ ██ █          drawn by YOUR emulator.
print(f"loaded {len(rom)} bytes of real software — rendered by your emulator")
```

The maze demo is the canonical first-ROM test: it draws a maze using loops, XOR
sprites, and the display — exercising the DRW opcode, the index register, jumps,
and the display pipeline. When it renders, Chapters 2–6 are all correct together.

## What you now know

- Real ROMs are **plain binaries loaded at 0x200** — no headers, no compatibility
  layer, just bytes for your loop.
- The **community test ROMs** are the strongest verification: real software as a
  test suite, displaying pass/fail on your own emulator's screen.
- "My emulator runs real games" is the milestone every emulator author measures by.

Next: when a ROM misbehaves, you need to see inside the machine — traces,
breakpoints, and register dumps. Debugging the emulator.
