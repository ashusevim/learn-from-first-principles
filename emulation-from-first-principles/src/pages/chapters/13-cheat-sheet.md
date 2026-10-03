---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Emulation on One Page'
description: 'Fetch–decode–execute for someone else’s CPU on one page — the model, the opcode rules, the quirks, and the debug loop.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one loop with a translation table: **fetch two bytes, split
into nibbles, dispatch, tick the timers**. The opcode map, the timing rules, and
every quirk that separates "runs my test ROM" from "runs real ROMs".

## The one-page model

```text
  2 bytes at pc → opcode → fam nibble → handler → pc += 2 (unless jumped)
       timers tick at 60 Hz (delay, sound) — independent of instruction speed
       display: 64x32 XOR pixels; collide → VF = 1
```

`Chip8.step()` is fetch–decode–execute with someone else's encoding (Chapter 2),
`load_rom` puts programs at `0x200` because history says so (Chapter 8), and the
screen is a framebuffer you XOR into (Chapter 4). The CPU you built in the CPUs
course runs *your* ISA; this one rents out its loop to a dead machine.

## The CHIP-8 you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `memory[0x200 + i] = b` (`load_rom`) | programs start at 0x200; below is interpreter space | 8 |
| `opcode = mem[pc] << 8 \| mem[pc+1]` | every instruction is two bytes, big-endian | 2–3 |
| `fam / x / y / nn / nnn` nibbles | the opcode split four ways before dispatch | 3 |
| `0x00E0` / `0x00EE` | clear screen / return from subroutine | 3 |
| `0x1nnn` / `0x2nnn` | jump / call (push pc, jump) | 3 |
| `0x3xnn`–`0x5xy0` skips | conditional `pc += 2`: the only `if` | 3 |
| `0x6xnn` / `0x7xnn` | set / add-immediate (8-bit wrap) | 3 |
| `0x8...` ALU family | register ops dispatched to `alu()` | 3 |
| `0xAnnn` (`I = nnn`) | the index register points at sprite/data | 3–4 |
| `0xDxyn` (draw) | XOR `n` sprite bytes at (Vx,Vy); VF = collision | 4 |
| `delay_timer` / `sound_timer` | tick down at 60 Hz; sound beeps while > 0 | 5 |
| `keys` + `waiting_key` | hex keypad state; `Fx0A` blocks for a press | 5 |
| the quirk flags | shift/clip/jump offsets vary per original machine | 10 |
| `EmulatorWindow` | tkinter display + key bindings + 60 Hz loop | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Forgetting `pc += 2` on non-jumps | the same instruction executes forever | Chapter 2 |
| Drawing with OR instead of XOR | sprites smear; collision flag never fires | Chapter 4 |
| Ignoring VF on draw | games can't detect hits — gameplay silently wrong | Chapter 4 |
| Timers tied to instruction speed | fast machines beep briefly, slow ones drone | Chapter 5 |
| `Fx0A` polling instead of blocking | the program spins past the keypress it wanted | Chapter 5 |
| Loading the ROM at 0x000 | the program overwrites font/interpreter space | Chapter 8 |
| One quirk flag for all ROMs | a game written for VIPER breaks on COSMAC rules | Chapter 10 |
| Assuming cycle accuracy | CHIP-8 forgives; the NES (Ch 11) will not | Chapter 11 |
| Debugging by staring at pixels | the trace (pc, opcode, regs) tells; pixels only show | Chapter 9 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Step one instruction | `step()` + pc/opcode trace | you need full speed — then the timed loop (Ch 12) |
| See what broke | the debugger: breakpoints on pc, register dumps | it draws wrong — then the display inspector (Ch 9) |
| Run an unknown ROM | the quirk menu first, defaults second | it is a known-good ROM — quirks off (Ch 10) |
| Smooth animation | 60 Hz display refresh, decoupled from step rate | authenticity — originals ran nearer 500 Hz steps (Ch 12) |
| Sound that beeps | `sound_timer > 0` → tone on, else off | silence for debugging — mute, keep the timer (Ch 6) |
| A bigger machine next | the NES path: cycles, mappers, PPU timing | you want easy — CHIP-8 is the easy one (Ch 11) |

## Prove it to yourself

**1. The opcode splits four ways:**

```python
op = 0xDAB5
print(hex((op >> 12) & 0xF), hex((op >> 8) & 0xF))  # 0xd 0xa — draw, Vx=VA
print(hex((op >> 4) & 0xF), hex(op & 0xFFF))        # 0xb 0xab5 — Vy, height/nnn
```

**2. XOR draws and undraws:**

```python
emu.draw_sprite(0, 0, [0xFF])   # eight pixels on, VF = 0 (no collision)
emu.draw_sprite(0, 0, [0xFF])   # same sprite: pixels OFF, VF = 1
print(emu.V[0xF], sum(sum(row) for row in emu.display))  # 1, 0 — collision, blank
```

**3. The timer ignores your speed:**

```python
emu.delay_timer = 60
for _ in range(600): emu.step()      # as fast as Python goes…
print(emu.delay_timer)               # …and the 60 Hz ticker decides the rest
```

## What you now know

- **The loop is rented, not owned:** fetch–decode–execute runs *their*
  encoding, and the nibble split is the whole decoder (Ch 2–3).
- **Pixels are XOR with a flag:** draw semantics *are* collision detection —
  one instruction does both jobs (Ch 4).
- **Time has two speeds:** instructions run hot, timers tick at 60 Hz, and
  confusing them breaks sound first (Ch 5).
- **Quirks are compatibility:** no single CHIP-8 exists — flags choose which
  dead machine you resurrect (Ch 10).

Next: twelve labs that earn the "runs real ROMs" sticker — sprites, timers,
quirks, and a game you didn't write playing itself on your screen.
