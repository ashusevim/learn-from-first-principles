---
layout: ../../layouts/Chapter.astro
title: 'Beyond CHIP-8: NES, Cycle Accuracy & Recompilation'
description: 'Timing-critical hardware, mid-scanline effects, dynamic recompilation — the emulation hierarchy.'
part: 'Part IV — The Real World'
written: true
---

CHIP-8 is emulation on easy mode: no timing-critical hardware, no mid-scanline
effects, no custom chips. Each step up — NES, Game Boy, Sega Genesis, N64 — adds a
layer of difficulty that's really one theme: **the emulated components interact in
timing-sensitive ways**, so "run the opcodes in any order" stops working. This
chapter maps the hierarchy from your CHIP-8 upward.

## The lie you were told

> "Emulating a console = emulating its CPU."

The CPU is the easy part. Consoles are **timing-critical systems**: the graphics
chip reads the framebuffer *while it's being generated* (mid-scanline effects!),
sound channels run on their own clocks, and games exploit the exact timing:

```text
CHIP-8 (your course):   opcodes only — no timing-sensitive hardware
NES:                    the PPU (graphics) must be cycle-accurate — games change
                        scroll/palettes MID-SCANLINE, exploiting exact timing
Genesis:                the CPU and video chip run on DIFFERENT clocks, sync quirks
N64/PS1:                3D pipelines, microcode, RSP — multiple processors racing
```

## The levels of emulation fidelity

1. **Instruction-level** (your CHIP-8): run one instruction, update everything —
   fine when nothing is timing-critical.
2. **Cycle-level**: each instruction costs its exact cycle count; hardware advances
   in lockstep — needed when the display reads mid-frame (NES).
3. **Scanline/component-level**: emulate per display line, per component tick —
   the NES/Genesis standard.
4. **Cycle-accurate per component**: every chip's internal clock — museum grade.
5. **Dynamic recompilation**: translate emulated code to host code *at run time*
   (the compilers course's JIT!) — how N64/PS2 emulators reach full speed.

Dynamic recompilation is the compilers course's backend (Chapter 7's bytecode
compiler), re-targeted: instead of compiling Bite to VM bytecode, compile MIPS to
x86. The recognition: the emulated code's *basic blocks* can be cached as native
code — the JIT pattern from every JS engine (the web course's V8).

## Prove it to yourself

**1. The mid-scanline effect, understood:**

```python
# a NES game writes a scroll register mid-frame:
# scanlines 0-100: scroll = 0    (the top of the level)
# scanlines 101+:  scroll = 48   (a status bar stops scrolling)
# a naive emulator renders WHOLE frames from end-of-frame state: the effect breaks.
# the fix: emulate per scanline, checking register writes between lines.
```

**2. The recompilation idea, in one thought:**

```text
emulated instruction "ADD r1, r2" → native instruction "add r1, r2" (×1000 speed)
blocks of emulated code → compiled native blocks, cached by PC address
= the JIT compilers from the web course (V8), pointed at a foreign ISA.
```

## What you now know

- The emulation hierarchy: **instruction-level → cycle-level → scanline-level →
  cycle-accurate per component → dynamic recompilation** — each level forced by
  timing-sensitive hardware interactions.
- Mid-scanline effects are why **NES emulation is per-scanline** — games wrote
  registers mid-frame deliberately.
- **Dynamic recompilation** = the compilers course's JIT, re-targeted at a foreign
  ISA — the compilers course completes the loop.
- Your CHIP-8 is instruction-level — and honestly, that's where every emulator
  author starts.

Next, the finale: every chapter assembled into **the complete CHIP-8 emulator in
~400 lines** — display, sound, input, debugging — running real ROMs.
