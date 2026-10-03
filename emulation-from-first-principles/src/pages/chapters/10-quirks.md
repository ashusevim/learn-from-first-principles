---
layout: ../../layouts/Chapter.astro
title: 'Why Emulation Is Hard: The Quirks'
description: 'Every CHIP-8 implementation disagrees on details — because the original hardware did. VF reset, shifting, memory pointer quirks.'
part: 'Part IV — The Real World'
written: true
---

Your emulator runs real ROMs — and then a game breaks that works on *other*
emulators. Welcome to **quirks**: documented behavioral differences that every
emulator must choose between, because the original CHIP-8 hardware implementations
(there were several!) disagreed with each other. The quirks are the deepest lesson
in emulation: **when the spec is ambiguous, behavior becomes folklore** — and
compatibility means choosing whose folklore to honor.

## The lie you were told

> "The ISA spec fully defines behavior."

The CHIP-8 "spec" was reverse-engineered from original hardware that had real
implementation variations (the original interpreter shipped on different machines
with different quirks!). The famous quirks:

```text
VF RESET:       does the ALU's ADD reset VF? The 8xy1/2/3 logic ops DO reset VF —
                but some implementations also reset it on FX55/FX65 memory ops.
SHIFT:          8xy6 (VX >>= VY): does it shift VX by VY... or shift VY into VX?
                Original hardware used a VF-containing shift register — modern
                interpretations differ.
MEMORY POINTER: FX55/FX65 — does I increment by x+1 after the copy? Some
                originals did; modern ROMs assume it doesn't.
LOAD/STORE regs: does the range include VX? Off-by-one variants exist.
```

Each quirk is a coin flip that a *significant ROM* depends on — so emulators ship
quirk toggles ("VF reset: on/off"), and compatibility profiles per game.

## The deeper lesson: specs are written after the fact

CHIP-8 was never formally specified — behavior was observed, documented, and
disputed by the emulator community decades later. Compare with your other courses:
the networking course's TCP had RFCs; the CPUs course's RISC-V has a ratified spec.
CHIP-8's "spec" is the *consensus of emulators*, cross-referenced against 1970s
hardware behavior. When you design a system without a spec, you are writing
behavior that someone will have to reverse-engineer.

## Prove it to yourself

**1. The quirk, broken both ways:**

```python
# FX55 (store V0..VX to memory), x=3:
# interpretation A: memory[I..I+3] = V0..V3; I unchanged
# interpretation B: same copy, AND I += x + 1      ← the original hardware did this!
# a ROM written on hardware B reads I incrementally — breaks on emulator A.
# your emulator must PICK, and the pick must match the ROM's assumption.
```

**2. The quirk toggle, built:**

```python
class Quirks:
    def __init__(self, vf_reset_on_store=False, shift_uses_vy=True,
                 memory_pointer_increments=False):
        ...
# (a real emulator's config file: the folklore, parameterized. Cosmac VIP vs
#  CHIP-48 vs SUPER-CHIP: three hardware generations, three quirk profiles.)
```

## The build: quirk toggles in the dispatcher

```python
# quirks.py — the FX55 memory-store quirk, both interpretations
class Chip8:
    def __init__(self, memory_increment_quirk=False):
        self.memory = [0] * 4096
        self.V = [0] * 16; self.I = 0; self.pc = 0x200
        self.quirk_mem = memory_increment_quirk   # the toggle: whose folklore?

    def FX55(self, x):                              # store V0..VX at memory[I]
        for i in range(x + 1):
            self.memory[self.I + i] = self.V[i]
        if self.quirk_mem:                          # the ORIGINAL hardware quirk:
            self.I += x + 1                         # I advances past the copied range
        # (modern interpretation: I stays put. Both have ROMs that depend on them!)

chip8 = Chip8(memory_increment_quirk=True)
chip8.V[0], chip8.V[1], chip8.V[2] = 10, 20, 30
chip8.I = 0x400
chip8.FX55(2)                                       # store V0..V2
print("memory[0x400..402]:", chip8.memory[0x400:0x403])
print("I after FX55:", hex(chip8.I), "(quirk: advanced by 3)")
chip8.quirk_mem = False; chip8.I = 0x400
chip8.FX55(2)
print("I after FX55 (modern):", hex(chip8.I), "(unchanged)")
# the same opcode, two behaviors — and each is correct for SOME ROM.
```

## What you now know

- Emulator **quirks = documented behavioral ambiguity** from unspecified original
  hardware — VF resets, shift semantics, memory pointer increments.
- Real emulators ship **quirk toggles** and compatibility profiles, because
  different ROMs assume different folklore.
- The meta-lesson: **systems without specs accumulate folklore as spec** — the
  strongest argument for writing things down (every other course in this project
  had an RFC or standard to lean on).

Next: beyond CHIP-8 — cycle accuracy, mid-scanline effects, and dynamic
recompilation. The emulation hierarchy, from toy to museum-grade.
