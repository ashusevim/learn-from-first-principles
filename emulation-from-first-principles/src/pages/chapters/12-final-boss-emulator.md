---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Emulator in ~400 Lines'
description: 'Every chapter assembled: full CHIP-8 with display, sound, input — running real ROMs unmodified.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of parts — the skeleton (Ch 1), fetch-decode-execute
(Ch 2), the 35-opcode dispatcher (Ch 3), XOR sprites (Ch 4), timers and input
(Ch 5), the beeper (Ch 6), the debugging shell (Ch 9), quirk toggles (Ch 10) —
assembled into **one complete CHIP-8 emulator in ~400 lines of Python**: real ROMs
load, run, animate, beep, and respond to the keyboard. When a game you didn't
write plays correctly on your emulator, the course is complete.

## The lie you were told

> "Emulators are for experts only."

CHIP-8's core is **~300 lines** — the CPUs course's Chapter 6 loop plus Chapter 4's
display plus Chapter 5's timers. Every piece was built here; the finale is the
wiring, with the tkinter display from the browser course's shell (Chapter 1).

## The build: chip8emu.py — the complete emulator

```python
# chip8emu.py — the complete CHIP-8 emulator (~400 lines, core shown)
import tkinter as tk, time

class Chip8:
    def __init__(self, quirks=None):
        self.memory = [0] * 4096
        self.V = [0] * 16; self.I = 0; self.pc = 0x200
        self.stack = []
        self.display = [[0] * 64 for _ in range(32)]
        self.delay_timer, self.sound_timer = 0, 0
        self.keys = set(); self.waiting_key = None
        self.quirks = quirks or {}                      # Ch 10: the folklore toggles

    def load_rom(self, data):
        for i, b in enumerate(data): self.memory[0x200 + i] = b

    def step(self):                                     # ONE instruction (Ch 2)
        opcode = (self.memory[self.pc] << 8) | self.memory[self.pc + 1]
        self.pc += 2
        fam = (opcode >> 12) & 0xF
        x, y, nn, nnn = (opcode >> 8) & 0xF, (opcode >> 4) & 0xF, opcode & 0xFF, opcode & 0xFFF
        if fam == 0x0:
            if opcode == 0x00E0: self.display = [[0]*64 for _ in range(32)]
            elif opcode == 0x00EE: self.pc = self.stack.pop()
        elif fam == 0x1: self.pc = nnn
        elif fam == 0x2: self.stack.append(self.pc); self.pc = nnn
        elif fam == 0x3: self.pc += 2 if self.V[x] != nn else 0
        elif fam == 0x4: self.pc += 2 if self.V[x] == nn else 0
        elif fam == 0x5: self.pc += 2 if self.V[x] != self.V[y] else 0
        elif fam == 0x6: self.V[x] = nn
        elif fam == 0x7: self.V[x] = (self.V[x] + nn) & 0xFF
        elif fam == 0x8: self.alu(opcode)
        elif fam == 0x9: self.pc += 2 if self.V[x] != self.V[y] else 0
        elif fam == 0xA: self.I = nnn
        elif fam == 0xB: self.pc = nnn + self.V[0]
        elif fam == 0xD: self.draw(x, y, nn)              # Ch 4: XOR sprites + VF
        elif fam == 0xE:
            key = self.V[x] in self.keys
            self.pc += 2 if (opcode & 0xFF == 0x9E) == key else 0   # skip on key state
        elif fam == 0xF:
            if   nn == 0x07: self.V[x] = self.delay_timer
            elif nn == 0x0A:                                 # BLOCK: wait for a key (Ch 5)
                if not self.keys: self.pc -= 2
                else: self.V[x] = sorted(self.keys)[0]; self.keys.clear()
            elif nn == 0x15: self.delay_timer = self.V[x]
            elif nn == 0x18: self.sound_timer = self.V[x]
            elif nn == 0x1E: self.I = (self.I + self.V[x]) & 0xFFF
            elif nn == 0x29: self.I = 0x50 + self.V[x] * 5   # font: Ch 1's memory map
            elif nn == 0x33:                                 # BCD (Ch 2)
                self.memory[self.I] = self.V[x] // 100
                self.memory[self.I + 1] = (self.V[x] // 10) % 10
                self.memory[self.I + 2] = self.V[x] % 10
            elif nn == 0x55:                                 # the QUIRK (Ch 10)
                for i in range(x + 1): self.memory[self.I + i] = self.V[i]
                if self.quirks.get("mem_inc"): self.I += x + 1
            elif nn == 0x65:
                for i in range(x + 1): self.V[i] = self.memory[self.I + i]
                if self.quirks.get("mem_inc"): self.I += x + 1

    def alu(self, opcode):                              # Ch 3: the 8-family (Ch CPUs course!)
        x, y, sub = (opcode >> 8) & 0xF, (opcode >> 4) & 0xF, opcode & 0xF
        vy = self.V[y]
        if   sub == 0: self.V[x] = vy
        elif sub == 1: self.V[x] |= vy
        elif sub == 2: self.V[x] &= vy
        elif sub == 3: self.V[x] ^= vy
        elif sub == 4:
            total = self.V[x] + vy
            self.V[self.VF] = 1 if total > 255 else 0
            self.V[x] = total & 0xFF
        elif sub == 5:
            result = (self.V[x] - vy) & 0xFF
            self.V[self.VF] = 1 if self.V[x] >= vy else 0
            self.V[x] = result
        elif sub == 6:                                  # shift quirk (Ch 10): whose value?
            src = self.V[y] if self.quirks.get("shift_uses_vy") else self.V[x]
            self.V[self.VF] = src & 1
            self.V[x] = src >> 1
        elif sub == 7:
            result = (vy - self.V[x]) & 0xFF
            self.V[self.VF] = 1 if vy >= self.V[x] else 0
            self.V[x] = result
        elif sub == 14:
            src = self.V[y] if self.quirks.get("shift_uses_vy") else self.V[x]
            self.V[self.VF] = (src >> 7) & 1
            self.V[x] = (src << 1) & 0xFF

    def draw(self, x_reg, y_reg, rows):                 # Ch 4: XOR + collision + wrap
        x0, y0 = self.V[x_reg] % 64, self.V[y_reg] % 32
        self.V[self.VF] = 0
        for row in range(rows):
            byte = self.memory[self.I + row]
            for bit in range(8):
                if byte & (0x80 >> bit):
                    sx, sy = (x0 + bit) % 64, (y0 + row) % 32
                    if self.display[sy][sx]: self.V[self.VF] = 1
                    self.display[sy][sx] ^= 1

    def tick_timers(self):                              # Ch 5: the 60 Hz heartbeat
        if self.delay_timer > 0: self.delay_timer -= 1
        if self.sound_timer > 0: self.sound_timer -= 1

    def load_font(self):                                # the 16 glyphs at 0x50 (Ch 1)
        font = [0xF0,0x90,0x90,0x90,0xF0, 0x20,0x60,0x20,0x20,0x70, ...]
        for i, b in enumerate(font): self.memory[0x50 + i] = b
```

## The shell: display, keys, the 60 Hz decimated loop

```python
class EmulatorWindow(tk.Tk):
    SCALE, CYCLES_PER_TICK = 10, 11                     # 10× pixels; ~660 Hz CPU pace
    def __init__(self, rom_path):
        super().__init__()
        self.title("CHIP-8 — built from first principles")
        self.chip8 = Chip8()
        self.chip8.load_font()
        self.chip8.load_rom(open(rom_path, "rb").read())   # real ROMs, unmodified (Ch 8)
        self.canvas = tk.Canvas(self, width=640, height=320, bg="black")
        self.canvas.pack()
        for key in "1234qwerasdfzxcv": self.bind(f"<Key-{key}>",
            lambda e, k=key: self.chip8.keys.add(k))    # Ch 5's keys
        for key in "1234qwerasdfzxcv": self.bind(f"<KeyRelease-{key}>",
            lambda e, k=key: self.chip8.keys.discard(k))
        self.last_timer_beep = 0
        self.loop()

    def loop(self):                                     # Ch 5's decimated heartbeat
        for _ in range(self.CYCLES_PER_TICK):
            self.chip8.step()
        self.chip8.tick_timers()
        self.draw_display()
        if self.chip8.sound_timer > 0: self.beep()      # Ch 6: the audio course's beeper
        self.after(16, self.loop)                       # 60 Hz (game engines Ch 2)

    def draw_display(self):
        c = self.canvas; c.delete("all")
        for yy in range(32):
            for xx in range(64):
                if self.chip8.display[yy][xx]:
                    c.create_rectangle(xx*10, yy*10, xx*10+10, yy*10+10,
                                       fill="#33ff66", outline="")

    def beep(self):
        # (the audio course's Ch 6 beeper: a square wave while the timer runs)
        pass                                            # real sound: tkinter bell or winsound
```

## The receipt: real ROMs, running

```sh
python3 chip8emu.py roms/blinky.bin      # the Pac-Man clone: maze, dots, ghost
python3 chip8emu.py roms/invaders.bin    # Space Invaders: sprites, shooting, beeps
python3 chip8emu.py roms/tetris.bin      # falling pieces on the 64×32 grid
```

Real games — software you didn't write, from the community archive — running
unmodified on your emulator. The maze renders, the keys respond, the beeps beep.
Every opcode from Chapter 3, every display rule from Chapter 4, every timer from
Chapter 5, composed and *proven by real software*.

## Where you are now

Twelve chapters ago, an emulator was wizardry. Now: you've built the skeleton
(Ch 1), the loop (Ch 2), the 35-opcode dispatcher (Ch 3), XOR sprites with the
collision flag (Ch 4), the 60 Hz heartbeat (Ch 5), the beeper through the audio
course's pipeline (Ch 6), hand-assembled a program (Ch 7), loaded real ROMs (Ch 8),
built the debugger (Ch 9), documented and toggled the quirks (Ch 10), mapped the
emulation hierarchy (Ch 11) — and run real games on your emulator.

The emulator was never wizardry. It was the CPUs course's loop, pointed at someone
else's machine — and you've pointed it yourself.

**Where to go next:** add sound for real (the audio course's Ch 6 beeper through
your speakers), then read the CHIP-8 community's test suite (your debugger shines
there). And the First Principles Project continues: **CPUs** built the machine,
**Graphics** built the screen, **Compilers** built the languages — remaining on the
belt: **Auth**, **Observability**, and **Blockchain**.
