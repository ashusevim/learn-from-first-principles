---
layout: ../../layouts/Chapter.astro
title: 'Loudness & Pitch: Amplitude and Frequency'
description: 'Two dials, one oscillator. Build: A440, octave doubling, amplitude fades — heard by reading the samples.'
part: 'Part I — Sound as Data'
written: true
---

Chapter 1's sine formula — `A·sin(2πft/RATE)` — has exactly two musical dials:
**amplitude A** (loudness) and **frequency f** (pitch). This chapter turns both,
derives the octave relationship from arithmetic (double the frequency = same note,
next octave), and builds amplitude fades — the primitive every DAW automation is
made of.

## The lie you were told

> "Loudness and pitch are complicated psychoacoustics."

The *perception* is psychoacoustic (human loudness is roughly logarithmic — that's
why decibels exist), but the *production* is two parameters in one formula:

```text
A (amplitude):    the wave's height  → louder sound      (0..1, or it clips!)
f (frequency):    the wave's speed   → higher pitch      (Hz: cycles per second)
```

## The octave: the one music-theory fact you derive

Double the frequency and you get the "same note, higher" — A440 (A above middle C)
doubled to A880 is *the next A*. All of Western music's note names repeat at
doubling; the arithmetic:

```text
A440 → A880 → A1760:  octaves
each semitone:  × 2^(1/12) ≈ × 1.05946   ← 12 equal steps per octave (equal temperament)
A440 → the next E:  440 × 2^(7/12) ≈ 659.25   (7 semitones up = a perfect fifth)
```

That `2^(1/12)` is Western music's atomic constant — every melody's frequencies are
powers of it.

## Loudness: amplitude and the fade

Amplitude scales the wave linearly — but *perceived* loudness scales with the
square-ish root of amplitude, which is why fades feel nonlinear. The primitive:

```python
amplitude(t) = start + (end − start) × t / duration     # a linear fade
```

Fades are also protection: a wave that starts and stops abruptly *clicks* — the
discontinuity is itself a burst of frequencies (Chapter 7's DFT will show it).
Every note you synthesize needs its edges softened.

## Prove it to yourself

**1. Octaves in the samples — count the waves:**

```python
# read both WAVs and count zero-crossings (wave periods) per second:
# A440's samples cross zero ~880 times/sec (twice per cycle); A880: ~1760.
# exactly 2×. The octave, counted in your own file.
```

**2. The click, generated then cured:**

```python
import wave, math, struct
RATE = 44100
def tone(freq, seconds, amp, fade=0.0):
    frames = bytearray()
    n = int(RATE * seconds)
    for t in range(n):
        a = amp
        if fade:                                    # soften the edges over `fade` seconds
            fade_samples = int(RATE * fade)
            if t < fade_samples: a *= t / fade_samples
            if n - t < fade_samples: a *= (n - t) / fade_samples
        sample = a * math.sin(2 * math.pi * freq * t / RATE)
        frames += struct.pack("<h", int(sample * 32767))
    return frames

with wave.open("click.wav", "w") as w:              # no fade: the abrupt ends CLICK
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(tone(440, 0.25, 0.8, fade=0))
with wave.open("smooth.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(tone(440, 0.25, 0.8, fade=0.01))  # 10ms fade: the click is gone
```

Play both — the first clicks at start and end, the second doesn't. The fade is
your first *envelope* (Chapter 4's ADSR is its full development).

## The build: the two dials, turned

```python
# dials.py — amplitude and frequency, demonstrated in one file
import wave, math, struct
RATE = 44100

def write(name, samples):
    with wave.open(name, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in samples))

def sine(freq, seconds, amp=0.8):
    n = int(RATE * seconds)
    return [amp * math.sin(2 * math.pi * freq * t / RATE) for t in range(n)]

def fade(samples, seconds=0.01):
    f = int(RATE * seconds)
    return [s * min(1.0, t / f, (len(samples) - t) / f) for t, s in enumerate(samples)]

write("a440.wav",  fade(sine(440, 0.5)))        # A440: the reference
write("a880.wav",  fade(sine(880, 0.5)))        # one octave up: SAME note, higher
write("a220.wav",  fade(sine(220, 0.5)))        # one octave down
write("quiet.wav", fade(sine(440, 0.5, 0.2)))   # same pitch, quieter (20% amplitude)
print("wrote a440/a880/a220/quiet — play them and hear the two dials")
```

Play all four back to back: up an octave, down an octave, then quieter. The two
dials of all music, demonstrated from one formula.

## What you now know

- **Amplitude = loudness, frequency = pitch** — the sine formula's two dials.
- The **octave is frequency doubling**; semitones are `2^(1/12)` steps — Western
  music's frequencies are powers of an atomic constant.
- Abrupt wave edges **click** — fades (and later, ADSR envelopes) are the cure,
  and they're your first amplitude-over-time automation.

Next: the sine is one voice among four. Square, saw, and triangle — and why they
sound different when they're all "the same wave" (spoiler: harmonics).
