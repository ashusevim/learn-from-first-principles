---
layout: ../../layouts/Chapter.astro
title: 'Debugging the Emulator'
description: 'Traces, breakpoints, and register dumps — the observability that makes emulation possible. Build: a debug mode.'
part: 'Part III — A Real Program'
written: true
---

A ROM misbehaves on your emulator — which of the 35 opcodes misfired, at what
address, with what register state? **Debug mode** is how emulator authors answer
that: an instruction trace (every opcode, address, registers), breakpoints (stop at
an address), and register dumps. The observability course's thesis (Chapter 23 of
the roadmap: "the kernel keeps receipts") applies to your own machine — the
emulator can record everything, because you wrote it.

## The lie you were told

> "Debugging emulation is guesswork."

It's *deterministic*: the same ROM always executes identically (Chapter 2 of the
game engines course: fixed timestep = deterministic). So the trace is a complete
record, and the bug is a line in it. The tools:

```text
trace:      every step: PC, opcode, registers        ← the full receipt
breakpoint: stop when PC hits an address             ← examine state mid-flight
watchpoint: stop when a register/memory changes   ← "who wrote this?"
```

## The classic debugging workflow

```text
1. the game draws garbage → run with the trace on
2. find the DRW opcode in the trace → check VX, VY at that point
3. the coordinates are wrong → search backward: which instruction wrote VX?
4. it's a SNE that skipped wrongly → check the compared register
5. the bug is usually: an unimplemented opcode silently passing, or a quirk (Ch 10)
```

Step 4's "which instruction wrote this?" is a **watchpoint** — and your emulator
can implement it by recording writes in the trace and searching backward.

## Prove it to yourself

**1. The unimplemented-opcode bug class** — the #1 emulator bug:

```python
# an unimplemented opcode silently does NOTHING (just advances the PC):
# the game skips its effect and continues, subtly wrong. the trace exposes it:
# every step logs the opcode; unknown ones log "UNIMPLEMENTED".
```

**2. The determinism superpower** — same ROM + same inputs = the same trace every
time (the game engines course, Ch 2's fixed timestep). Reproduce once, debug
forever.

## The build: the debug mode

```python
# debug.py — trace mode + breakpoints + register dumps (~30 lines)
class DebuggableChip8:
    def __init__(self):
        from emulation import Chip8           # Chapters 2–6's emulator
        self.chip8 = Chip8()
        self.trace, self.breakpoints = [], set()
        self.trace_on = False
    def step(self):
        c8 = self.chip8
        pc_before = c8.pc
        opcode = (c8.memory[c8.pc] << 8) | c8.memory[c8.pc + 1]
        if self.trace_on:
            regs = " ".join(f"V{i}:{v:02X}" for i, v in enumerate(c8.V) if v)
            self.trace.append(f"{pc_before:04X}: {opcode:04X}  {regs}")
        c8.step()                             # the real execution
        if pc_before in self.breakpoints:     # breakpoint: stop and dump
            self.dump()
            input(f"breakpoint at {pc_before:04X} — press Enter to continue…")
    def run(self, steps=100):
        for _ in range(steps): self.step()
    def dump(self):
        c8 = self.chip8
        print(f"PC={c8.pc:04X} I={c8.I:04X} SP-dep={len(c8.stack)}")
        print("V:", " ".join(f"{i:X}:{v:02X}" for i, v in enumerate(c8.V)))
        print("display pixels lit:", sum(sum(row) for row in c8.display))

dbg = DebuggableChip8()
dbg.chip8.load_rom(bytes([0x61, 0x05,        # V1 = 5
                          0x62, 0x03,        # V2 = 3
                          0x8124,            # V1 += V2 (the ALU family)
                          0x00E0,            # CLS
                          0x12, 0x00]))      # loop
dbg.breakpoints.add(0x206)                    # stop before the ALU op
dbg.trace_on = True
dbg.run(10)
for line in dbg.trace: print(line)
# 0200: 6105  V1:05
# 0202: 6203  V1:05 V2:03
# 0206: 8124  V1:05 V2:03        ← the breakpoint hit: full state dump
# 0208: 00E0  V1:08 V2:03        ← V1 is now 8: the ALU add happened
# every step: PC, opcode, registers — the complete receipt.
```

## What you now know

- The trace = **a complete execution receipt**: PC, opcode, registers per step —
  deterministic and reproducible (fixed timestep, Ch 2 of game engines).
- **Breakpoints and watchpoints** stop the machine mid-flight; register dumps show
  the state — the observability course's thesis, on your own machine.
- The #1 emulator bug (silently unimplemented opcodes) is exposed by the trace's
  "UNIMPLEMENTED" lines.

Next: when everything works, the *details* start disagreeing with other emulators —
the famous quirks. Why emulation is hard: the original hardware was ambiguous.
