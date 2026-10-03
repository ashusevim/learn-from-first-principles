---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the CHIP-8 emulator from Chapter 12 — opcodes, sprites, timers, quirks. Each is checkable against real ROMs.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in pixels, a beep, or a trace you compare
against a real ROM running in `Chip8` from Chapter 12. Nothing here is new —
decode (Ch 3), sprites (Ch 4), timers (Ch 5), quirks (Ch 10). What is new is
*someone else's software* as the test suite: PONG, BRIX, and TETRIS judge you.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Download one public-domain ROM set (the course's Chapter 8
links) into `roms/`; every lab names its witness ROM.

| Tool | What it proves |
|---|---|
| `step()` + pc/opcode trace | what the CPU actually executed |
| `display` pixel dumps | what the game actually drew |
| `delay_timer` / `sound_timer` reads | what time actually passed |
| a second emulator (or screenshots) | what correct looks like |

## Warm-ups

**Lab 1.1 — Boot to a blank screen**
**Goal:** the reset state is exact: pc at 0x200, empty display, silent timers.
**Do this:**
```python
emu = Chip8()
print(hex(emu.pc), sum(sum(r) for r in emu.display))
print(emu.delay_timer, emu.sound_timer, emu.V)
```
**You'll know it works when:** `0x200`, `0`, `0 0`, and sixteen zeroes. Any other
boot state is a bug wearing a trench coat.
**Where it comes from:** Chapter 12 — Final Boss: The Complete Emulator in ~400 Lines.

**Lab 1.2 — Clear means clear**
**Goal:** opcode `0x00E0` empties the framebuffer from any state.
**Do this:** draw garbage (any `0xDxyn`), execute one `0x00E0`, dump the pixel sum.
**You'll know it works when:** the sum reads `0` — every pixel off, no
stragglers. XOR garbage in, clear it out: the framebuffer keeps no history.
**Where it comes from:** Chapter 4 — Graphics: The 64×32 Display.

**Lab 1.3 — One second is sixty ticks**
**Goal:** timers tick at 60 Hz regardless of step speed.
**Do this:** set `delay_timer = 60`, run 600 `step()`s as fast as Python allows,
read the timer.
**You'll know it works when:** it reads near `60 - (elapsed_seconds * 60)` —
wall-clock time, not step count, decided. If it reads `0`, your timer is counting
steps: decouple it.
**Where it comes from:** Chapter 5 — Timers & Input: The Heartbeat.

## Builds

**Lab 2.1 — Draw, collide, erase**
**Goal:** XOR semantics plus VF, the whole sprite contract in one lab.
**Do this:** draw an 8×5 test sprite at (10,10), draw it again at (12,11), then
draw it a third time at (12,11).
**You'll know it works when:** first draw VF = 0, second VF = 1 (overlap pixels
flipped off), third VF = 1 again and the sprite is gone from that spot. Three
draws, two flags, zero pixels left — XOR keeps perfect books.
**Where it comes from:** Chapter 4.

**Lab 2.2 — PONG plays itself**
**Goal:** a real ROM as an integration test.
**Do this:** `load_rom(open("roms/PONG").read_bytes())`, run 30,000 steps with
no input, and dump the display:

```python
emu = Chip8()
emu.load_rom(open("roms/PONG", "rb").read())
for _ in range(30_000):
    emu.step()
print(sum(sum(r) for r in emu.display), "pixels lit")
```

**You'll know it works when:** paddles and ball are on screen and the score
area is sane — compare against any screenshot. A wrong opcode family shows as
garbage; a wrong timer shows as frozen. PONG convicts precisely.
**Where it comes from:** Chapter 8 — ROMs: Loading Real Software.

**Lab 2.3 — Catch the keypress**
**Goal:** `Fx0A` blocks until a key arrives — input as control flow.
**Do this:** run a ROM that waits for input (or hand-assemble `F500 600A`),
press nothing for 5 seconds, then press a mapped key.
**You'll know it works when:** `pc` does not advance during the wait (trace it),
then advances exactly past the wait on the press — with the right key number in
V5. Spinning or skipping are both failures with different chapter addresses.
**Where it comes from:** Chapter 5.

**Lab 2.4 — Hear the beep**
**Goal:** `sound_timer > 0` means tone, and the duration is exact.
**Do this:** set `sound_timer = 30`, start the window, and time the beep with
your phone.
**You'll know it works when:** it sounds for ~0.5s (30/60) and stops dead. A
0.1s chirp means your loop ticks timers per step; a drone means it never ticks
them. Ears are debuggers too.
**Where it comes from:** Chapter 6 — Sound: The Beeper.

**Lab 2.5 — Write a five-instruction game**
**Goal:** Chapter 7's promise: you can author for the machine you emulate.
**Do this:** hand-assemble a ROM that clears the screen, draws one sprite,
waits for a key, then jumps to the start (five opcodes, counted):

```text
00E0        ; clear
A300        ; I = sprite data
D005        ; draw 5 rows at (0,0)
F500        ; wait for key into V5
1206        ; jump back to the draw
```

**You'll know it works when:** it runs on your emulator *and* on any reference
emulator unchanged — your encoding (Ch 3) and their decoder agree. Authoring is
the strictest test of decoding.
**Where it comes from:** Chapter 7 — Writing CHIP-8 Programs.

## Stretch goals

**Lab 3.1 — Quirk roulette**
**Goal:** one ROM, three machines: feel Chapter 10's incompatibility directly.
**Do this:** pick a ROM with shifting sprites, run it under each quirk flag
combination, and screenshot all three.
**You'll know it works when:** at least two screenshots differ — and you can
name the flag (shift/clip/jump) responsible for each difference. "CHIP-8" is a
family feud; the flags are the peace treaty.
**Where it comes from:** Chapter 10 — Why Emulation Is Hard: The Quirks.

**Lab 3.2 — The 60 Hz contract**
**Goal:** decouple step rate from tick rate properly (Chapter 12's real loop).
**Do this:** run TETRIS with steps-per-frame at 8, 11, and 15; play ten seconds
of each (or script input) and note fall speed and input feel.
**You'll know it works when:** 11 feels right and the others feel wrong in
*opposite* directions — too floaty vs too frantic. The number 11 is not magic;
it is the original machine's speed wearing your frame loop.
**Where it comes from:** Chapter 12.

## Self-checking without a grader

- **State labs** (1.1–1.3, 2.1): exact numbers — `0x200`, pixel sums, timer
  math, VF flags. The machine state is small enough to print whole; print it.
- **ROM labs** (2.2–2.5, 3.1–3.2): screenshots and behavior vs a reference
  emulator. Pixels don't negotiate — diff them.
- **Timing labs** (1.3, 2.4, 3.2): wall-clock measurements with a phone. If the
  beep is 0.5s and the fall feels right, the loops are decoupled.

## What you now know

- **Real software is the only complete test:** hand-tests pass and ROMs fail —
  PONG convicts what unit tests acquit (Labs 2.2, 3.1).
- **State is printable and therefore debuggable:** pc, VF, timers, pixel sums —
  the trace tells, the pixels only show (Labs 1.x, 2.1).
- **Time is two clocks or it is broken:** steps run hot, timers tick at 60 Hz,
  and your ears audit the contract (Labs 1.3, 2.4, 3.2).
- **Compatibility is a menu, not a boolean** (Lab 3.1) — which is the entire
  second half of the emulation discipline in one screenshot trio.

Next: pick one NES test ROM (the community's `nestest` is the canonical gauntlet),
read what it checks, and map each check to a lab above — that map is your study
plan for Chapter 11's bigger machine.
