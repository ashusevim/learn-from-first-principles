---
layout: ../../layouts/Chapter.astro
title: 'What Is Emulation, Really?'
description: 'A foreign CPU is just data and a loop. Build: the CHIP-8 spec tour — memory, registers, and the emulator skeleton.'
part: 'Part I — The Machine'
written: true
---

An emulator runs software written for a machine you don't have — and the secret is
that there's nothing mystical about it. A CPU (the compilers and CPUs courses built
two!) is **memory + registers + a fetch-decode-execute loop**. An emulator is the
same loop, executing *someone else's* instruction set. This chapter introduces CHIP-8
— the classic first emulator target, a virtual machine from 1977 with 35 opcodes —
and builds the skeleton every later chapter fills.

## The lie you were told

> "Emulators are wizardry that requires hardware knowledge."

An emulator needs: the target's **memory map**, its **registers**, its **instruction
formats**, and its **quirks**. That's documentation work plus one loop. CHIP-8 is the
perfect first target because the documentation fits on a few pages and the whole
machine is: 4KB memory, 16 8-bit registers, a 64×32 monochrome display, a 16-level
stack, two 60 Hz timers, and 16 keys.

## The CHIP-8 spec, in one table

```text
memory:    4 KB (4096 bytes), programs load at 0x200
registers: V0–VF (16 × 8-bit; VF doubles as the flag register)
I:         a 16-bit memory pointer register (for sprite drawing)
stack:     16 levels deep (for CALL/RET — the CPUs course, Ch 8)
display:   64×32 monochrome pixels (XOR-drawn sprites)
timers:    delay timer + sound timer, both decrement at 60 Hz
input:     16 keys (hexadecimal 0–F)
opcodes:   35 instructions, all 2 bytes, big-endian
```

Compare with the CPUs course's Bite-16 (Ch 5): same anatomy, different numbers.
The emulator is the CPUs course's Chapter 6 loop, parameterized differently.

## Prove it to yourself

**1. Foreign machine code is just data** — the CPUs course proved programs are data;
an emulator reads data that *happens to be instructions* for another machine:

```python
rom = [0x00, 0xE0,          # 00E0: clear the screen
       0x61, 0x01,          # 6101: V1 = 1
       0x12, 0x00]          # 1200: jump to 0x200 (loop forever)
# to a text editor: 7 bytes. to your emulator: a program. Same bytes, same deal
# as the compilers course's "programs are data" — one level deeper.
```

**2. The emulator's test: real ROMs** — the finale runs public-domain ROMs
unmodified. If a real game's code runs correctly, the emulator is correct. No
unit test is as strong as "the software works".

## The build: the emulator skeleton

```python
# skeleton.py — memory, registers, and the loop shell (~35 lines)
class Chip8:
    def __init__(self):
        self.memory = [0] * 4096
        self.V = [0] * 16               # V0–VF
        self.I = 0                      # the pointer register
        self.pc = 0x200                 # programs load at 0x200
        self.stack = []                 # 16 levels (Ch 8 of CPUs course)
        self.display = [[0] * 64 for _ in range(32)]
        self.delay_timer = 0            # Ch 5: the 60 Hz heartbeat
        self.sound_timer = 0
        self.keys = set()               # Ch 5: pressed keys

    def load_rom(self, data):           # ROM bytes → memory at 0x200
        for i, byte in enumerate(data):
            self.memory[0x200 + i] = byte

    def tick(self):                     # ONE cycle: fetch-decode-execute
        pc = self.pc
        opcode = (self.memory[pc] << 8) | self.memory[pc + 1]   # big-endian 16-bit
        self.pc += 2                    # all CHIP-8 instructions are 2 bytes
        self.execute(opcode)            # Ch 2–3: the 35 cases
        # timers tick at 60 Hz (Ch 5): the real loop decimates — one timer tick
        # per ~9 CPU cycles (Ch 2's 500 Hz-ish pace ÷ 60)

    def execute(self, opcode):
        pass                            # ← 35 opcodes: Chapters 2–3's whole subject

chip8 = Chip8()
chip8.load_rom([0x00, 0xE0, 0x61, 0x01, 0x12, 0x00])
for _ in range(3): chip8.tick()
print("V1:", chip8.V[1], "| pc:", hex(chip8.pc))   # ran 3 instructions of a foreign ISA
```

## What you now know

- An emulator = **the CPUs course's fetch-decode-execute loop, parameterized by the
  target's memory map, registers, and opcode formats**.
- CHIP-8: 4KB memory, 16 registers, 64×32 display, 2-byte big-endian opcodes, 60 Hz
  timers — a spec on one page.
- The ultimate test is **real ROMs running unmodified** — stronger than any unit
  test.

Next: fill `execute()` — the fetch-decode-execute loop running its first opcodes,
with the CPUs course looking over your shoulder.
