---
layout: ../../layouts/Chapter.astro
title: 'Waves: Sine, Square, Saw & Triangle'
description: 'Every wave is sine harmonics stacked differently — that’s timbre. Build: all four shapes, spectra compared.'
part: 'Part I — Sound as Data'
written: true
---

A pure sine is mathematically clean and musically *boring* — it's a whistle. Real
instruments sound different from whistles because their waves contain **harmonics**:
sine waves stacked at integer multiples of the base frequency, each quieter. The
wave *shape* is the harmonic recipe, and that recipe is what makes a violin a
violin. This chapter builds all four classic shapes and shows the harmonic recipe
each one hides.

## The lie you were told

> "Different wave shapes are just different ways to draw a cycle."

The shape **is the sound**. Fourier's insight (Chapter 7 formalizes it): every
periodic wave is a sum of sine waves at the fundamental frequency and its integer
multiples:

```text
sine:      the fundamental only                    → pure whistle
square:    odd harmonics only, each at 1/n volume  → hollow, clarinet-like
saw:       ALL harmonics, each at 1/n volume       → bright, brassy, string-like
triangle:  odd harmonics only, each at 1/n² volume → softer square, flute-like
```

A saw contains every harmonic — which is why subtractive synthesis starts from saws:
there's material for the filter to carve (Chapter 9).

## The formulas

```text
square(t)   = sign(sin(2πft))                    −1 or +1, snapping between
saw(t)      = 2(ft mod 1) − 1                    ← ramps up, drops, ramps again
triangle(t) = 2·|saw(t)| − 1                     ← the saw, folded
```

## Prove it to yourself

**1. The shapes, drawn:**

```python
import math
for name, wave in [
    ("sine ", lambda p: math.sin(2 * math.pi * p)),
    ("square", lambda p: 1.0 if p % 1 < 0.5 else -1.0),
    ("saw  ", lambda p: 2 * (p % 1) - 1),
    ("tri  ", lambda p: 2 * abs(2 * (p % 1) - 1) - 1),
]:
    row = "".join("█" if wave(i / 24) > 0.3 else
                  "▄" if wave(i / 24) > 0 else
                  "▁" if wave(i / 24) > -0.3 else "░" for i in range(24))
    print(f"{name} {row}")
# sine   ▄▄█▄▄░░░░░▁▁░░░░▄▄█▄▄       smooth hills
# square ████████░░░░░░████████       cliffs
# saw   ▄▄▄▄▄▄▄▄▁▁▁▁▁▁▁▁▄▄▄▄▄▄       ramps and drops
# tri   ▄▄▄▄▄▄░░▁▁▁▁▄▄▄▄▄▄░░         ramps up AND down
```

**2. The harmonics, verified by ear** — play sine vs saw at the same pitch: same
note, wildly different character. That difference is the harmonic stack, audible.

## The build: four oscillators

```python
# waves.py — the four oscillator shapes (~30 lines)
import wave, math, struct
RATE = 44100

def write(name, samples, amp=0.6):
    with wave.open(name, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s * amp * 32767)) for s in samples))

def osc(shape, freq, seconds):
    n = int(RATE * seconds)
    out = []
    for t in range(n):
        p = freq * t / RATE                     # phase: the wave's position, 0..1 per cycle
        if shape == "sine":   v = math.sin(2 * math.pi * p)
        elif shape == "square": v = 1.0 if p % 1 < 0.5 else -1.0
        elif shape == "saw":    v = 2 * (p % 1) - 1
        elif shape == "triangle": v = 2 * abs(2 * (p % 1) - 1) - 1
        out.append(v)
    return out

for shape in ("sine", "square", "saw", "triangle"):
    write(f"{shape}.wav", osc(shape, 220, 1.0))   # all at A220: same pitch, different timbre
print("wrote sine/square/saw/triangle.wav — same note, four instruments")
```

Play all four at 220Hz: same pitch, four different *timbres*. The square's hollow
clarity, the saw's bright buzz, the triangle's soft flute — each one a harmonic
recipe your ears parse instantly.

## What you now know

- Wave shape = **harmonic recipe**: square (odd, 1/n), saw (all, 1/n), triangle
  (odd, 1/n²) — Fourier's insight, audible.
- **The saw is the subtractive synthesizer's source**: every harmonic present, so
  the filter has material to carve (Chapter 9).
- Same frequency + same amplitude + different shape = different instrument. Timbre
  is harmonic architecture.

Next: raw oscillators start and stop like light switches — clicks again (Chapter
2's fade). The full cure is the ADSR envelope: how notes breathe.
