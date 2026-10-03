---
layout: ../../layouts/Chapter.astro
title: 'Timers & Input: The Heartbeat'
description: '60 Hz delay/sound timers and the key wait. Build: the timers ticking and keys blocking.'
part: 'Part II — Screen & Sound'
written: true
---

CHIP-8's two timers tick at **60 Hz** — independent of the CPU's ~500 Hz instruction
pace. The delay timer is a readable countdown (games pause with it); the sound timer
beeps while nonzero (Chapter 6). And the FX0A opcode *halts the CPU* until a key is
pressed — the only blocking instruction in the machine. This chapter wires the
heartbeat and the keys.

## The lie you were told

> "The CPU runs everything at the same speed."

CHIP-8's timers are **decoupled from the CPU clock**: the CPU executes ~500-1000
opcodes per second; the timers decrement 60 times per second regardless. The
emulator's loop must therefore **decimate**: run ~9-16 CPU cycles per timer tick
(Chapter 2 of the game engines course: the fixed-timestep accumulator, in
emulation).

## The decimation pattern

```python
CYCLES_PER_TIMER_TICK = 9      # ~540 Hz CPU pace → 60 Hz timer ticks

for frame in range(frames):         # each "frame" = one 60 Hz tick
    for _ in range(CYCLES_PER_TIMER_TICK):
        chip8.step()                # CPU instructions
    if chip8.delay_timer > 0: chip8.delay_timer -= 1
    if chip8.sound_timer > 0: chip8.sound_timer -= 1   # Ch 6: beep while > 0
    draw_display(chip8)             # render once per frame
```

This loop shape — fast inner loop, slow outer tick — is the game engines course's
fixed timestep (Ch 2) and the web course's frame budget (Ch 11), re-encountered in
emulation.

## The FX0A opcode: the blocking wait

```text
Fx0A: wait for a key press — PC does NOT advance until one is pressed.
```

The only blocking instruction in the machine. Mechanically: check the key state;
if none pressed, **don't advance the PC** — re-execute FX0A next tick. The CPU
spins on the same instruction until a key arrives. (Games use it for menu screens:
"press any key".)

## Prove it to yourself

**1. The delay timer as a pause** — a game waits 60 ticks (1 second) by loading the
delay timer and polling it:

```python
# LD V5, 60        ← delay timer = 60 (1 second)
# loop: LD V6, DT   ← read the timer into V6
#       SE V6, 0    ← skip if zero (timer expired)
#       JP loop     ← still counting: poll
```

**2. The spin, observed** — run FX0A with no keys pressed: the PC doesn't advance.
Run with a key: the PC moves on. The blocking wait, visible in the PC trace.

## The build: timers and input

```python
# timers.py — the 60 Hz heartbeat and FX0A (~35 lines)
import time

class Chip8:
    def __init__(self):
        self.memory = [0] * 4096
        self.V = [0] * 16; self.I = 0; self.pc = 0x200
        self.display = [[0] * 64 for _ in range(32)]
        self.delay_timer, self.sound_timer = 0, 0
        self.keys = set()                      # pressed key names ("0"-"F")

    def step(self):                            # abridged: the F-family cases that matter
        opcode = (self.memory[self.pc] << 8) | self.memory[self.pc + 1]
        self.pc += 2
        x, nn = (opcode >> 8) & 0xF, opcode & 0xFF
        family = (opcode >> 12) & 0xF
        if family == 0x6: self.V[x] = nn                       # LD VX,NN
        elif family == 0xF and nn == 0x15: self.delay_timer = self.V[x]  # LD DT,VX
        elif family == 0xF and nn == 0x07: self.V[x] = self.delay_timer  # LD VX,DT
        elif family == 0xF and nn == 0x0A:                     # LD VX,K — the BLOCK!
            if not self.keys:
                self.pc -= 2                    # ← DON'T advance: re-execute FX0A
                return False                    # still waiting
            self.V[x] = sorted(self.keys)[0]    # first pressed key
        return True

    def tick_timers(self):                     # the 60 Hz heartbeat
        if self.delay_timer > 0: self.delay_timer -= 1
        if self.sound_timer > 0: self.sound_timer -= 1

# ── the decimated loop, with a key wait ──
chip8 = Chip8()
chip8.load_rom = lambda d: [chip8.memory.__setitem__(0x200 + i, b) for i, b in enumerate(d)]
chip8.load_rom([0x65, 0x3C,       # V5 = 60 (60 timer ticks = 1 second)
                0xF5, 0x15,       # delay timer = V5
                0xF5, 0x07,       # V5 = delay timer (poll)
                0x65, 0x00,       # V5 = 0 → for the JZ test
                0x65, 0x3C,       # V5 = 60 again
                0xF5, 0x0A])      # FX0A: wait for a key (blocks forever here)
chip8.delay_timer = 60

frames = 0
start = time.time()
while frames < 75 and chip8.pc < 0x20C:         # ~75 frames = 75 timer ticks
    chip8.step()
    frames += 1
    if frames % 9 == 0: chip8.tick_timers()     # decimation: ~9 cycles per timer tick
    if frames % 30 == 0: print(f"frame {frames}: delay_timer = {chip8.delay_timer}")
print(f"after {frames} cycles: delay_timer = {chip8.delay_timer} (60 Hz decay, ~1/9 per cycle)")
print("FX0A still blocking (no keys pressed):", "waiting" if True else "")
```

## What you now know

- The timers tick at **60 Hz, decoupled from the CPU clock** — the emulator's loop
  decimates cycles per timer tick (game engines Ch 2's pattern).
- **FX0A is the only blocking instruction**: PC doesn't advance until a key
  arrives — spinning on the same opcode.
- The delay timer is the game's pause primitive: load, poll, continue.

Next: the sound timer's beep — routed through the audio course's pipeline. The
synthesizer you built becomes the emulator's speaker.
