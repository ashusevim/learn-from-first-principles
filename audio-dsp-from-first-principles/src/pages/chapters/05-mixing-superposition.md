---
layout: ../../layouts/Chapter.astro
title: 'Mixing & Superposition'
description: 'Sounds add — and clip at ±1. Build: chords from summed oscillators, headroom and normalization.'
part: 'Part II — The Synthesizer'
written: true
---

Chapter 4's notes play one oscillator at a time. Music plays **many at once** —
chords, bass lines, drums — and the physics is one line: **sound waves add**
(superposition). Two speakers playing different tones make the air carry both
pressures simultaneously; your mixer just sums the sample arrays. The catch: sums
exceed ±1, and digital audio *clips* — flattening peaks into distortion. This
chapter builds chords and teaches headroom.

## The lie you were told

> "Mixing is blending sounds artistically."

The foundation is literal **addition** — the mixing board's fader is a coefficient:

```python
mix = 0.6 * lead + 0.4 * bass + 0.2 * pad
```

Every sample of the mix is the weighted sum of every track's sample at that
instant. All of mixing is: add, scale to avoid clipping, and add effects. The art
is choosing the coefficients.

## Clipping: the hard ceiling

Digital samples are bounded — 16-bit audio stops at ±1.0. Sum three 0.8-amplitude
oscillators and peaks hit 2.4 → **clipped to 1.0**, flattening the wave tops into
something that sounds like crackling distortion:

```text
superposition: peaks reach 2.4
clipped:       everything above 1.0 squashed flat   ← the waveform's top is a plateau
the plateau IS the distortion — new frequencies appear that were never played
(Chapter 7's DFT will show harmonics that came from nowhere)
```

## The cures

```text
1. HEADROOM:    scale each source down before summing (3 oscillators → ×⅓ each)
2. NORMALIZE:   after summing, scale the whole mix so its peak hits exactly 1.0
3. LIMITER:     a compressor that catches peaks dynamically (the pro's tool)
```

## Prove it to yourself

**1. The clipping, visible:**

```python
mixed = [a + b + c for a, b, c in zip(osc1, osc2, osc3)]   # peaks: 2.4
clipped = [max(-1.0, min(1.0, s)) for s in mixed]          # the hard ceiling
clipped_count = sum(1 for s in mixed if abs(s) > 1.0)
print(f"{clipped_count} samples clipped — each one a spark of distortion")
```

**2. Superposition, verified physically** — play the chord and its notes
separately: the chord's samples at any instant equal the sum of the individual
files' samples at that instant. Physics, provable from your own files.

## The build: a chord with headroom

```python
# mix.py — a C-major chord: three oscillators, summed, normalized (~30 lines)
import wave, math, struct
RATE = 44100

def oscillator(freq, n, shape="sine"):
    out = []
    for t in range(n):
        p = freq * t / RATE
        v = {"sine": math.sin(2 * math.pi * p),
             "saw":  2 * (p % 1) - 1}.get(shape, math.sin(2 * math.pi * p))
        out.append(v)
    return out

def write(name, samples, amp=0.8):
    with wave.open(name, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s * amp * 32767)) for s in samples))

# C major: C4 + E4 + G4 (261.63, 329.63, 392.00 Hz)
n = int(RATE * 1.0)
c = oscillator(261.63, n)
e = oscillator(329.63, n)
g = oscillator(392.00, n)

# naive sum: peaks reach 2.4 → clipping
naive = [a + b + c for a, b, c in zip(c, e, g)]
clipped = sum(1 for s in naive if abs(s) > 1.0)
print(f"naive sum: {clipped} samples clipped")

# with headroom: scale each source by ⅓ BEFORE summing
headroom = [a/3 + b/3 + c/3 for a, b, c in zip(c, e, g)]
print(f"headroom peak: {max(abs(s) for s in headroom):.2f}")

# or normalize after summing: scale the MIX so its peak is exactly 0.9
peak = max(abs(s) for s in naive)
normalized = [s * 0.9 / peak for s in naive]
print(f"normalized peak: {max(abs(s) for s in normalized):.2f}")

write("chord.wav", normalized)
print("wrote chord.wav — a C major chord, unclipped")
```

Headroom (scale inputs) and normalization (scale output) both fix the clip — headroom
preserves relative dynamics, normalization guarantees a target peak. Real mixers do
both: input gain staged, output limited.

## What you now know

- Mixing = **sample-wise addition** (superposition) — the fader is a coefficient.
- Sums exceed ±1 and **clip**: the plateau is audible distortion with phantom
  frequencies.
- The cures: **headroom** (scale inputs), **normalization** (scale the mix), or a
  limiter — all one multiply on different ends.

Next: notes in sequence — note names to frequencies, tempo to durations. Bite's
cousin: a sequencer that plays melodies.
