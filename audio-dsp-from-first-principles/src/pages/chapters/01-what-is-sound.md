---
layout: ../../layouts/Chapter.astro
title: 'What Is Sound, Really?'
description: 'Pressure waves sampled into numbers; sample rate, Nyquist, and the WAV format. Build: a sine wave written from raw bytes — no libraries.'
part: 'Part I — Sound as Data'
written: true
---

Sound is pressure waves in air. Digital audio is those waves **sampled** — measured
thousands of times per second and stored as numbers. That's the entire foundation:
a CD stores 44,100 numbers per second per channel; a synthesizer *generates* those
numbers from math. This chapter writes a real WAV file — a sine wave — from raw
bytes with only the standard library, and establishes the model every later
chapter renders into.

## The lie you were told

> "Audio files are complicated."

The WAV format is the PPM image of sound (the graphics course, Chapter 1): a header
describing the sample rate and bit depth, then **raw samples** — numbers from −1 to
1, scaled to 16-bit integers. Writing one is `open()`, a header, and your samples.
Every format (MP3, FLAC, OGG) is those samples plus compression and metadata.

## The model

```text
sample rate:   measurements per second (44,100 for CD — Nyquist says it captures
               everything below 22,050 Hz, the edge of human hearing)
sample:        one amplitude measurement, −1.0 to +1.0 (16-bit PCM: −32768..32767)
duration:      seconds × rate samples

sine wave:     sample(t) = amplitude × sin(2π × frequency × t / rate)
```

The sine formula is the synthesizer's seed: `t` walks in 1/rate steps, frequency
sets how fast the wave repeats, amplitude sets loudness.

## Prove it to yourself

**1. A WAV is bytes — inspect your own:**

```sh
python3 sine.py && xxd -l 64 sine.wav
# RIFF....WAVEfmt ....    ← the header chunks, readable
# (then the raw 16-bit samples begin — your sine, as integers)
```

**2. The sample math, verified:** 44,100 samples/second × 2 bytes × 1 channel:
one second of mono audio = 88,200 bytes + headers. Check your file size — the
arithmetic *is* the format.

## The build: sine.wav, from raw bytes

```python
# sine.py — a 440 Hz sine wave, 2 seconds, 16-bit mono (stdlib only, ~15 lines)
import wave, math, struct

RATE = 44100
FREQ, SECONDS, AMP = 440.0, 2.0, 0.8      # A440 — the tuning note

with wave.open("sine.wav", "w") as w:
    w.setnchannels(1)                     # mono
    w.setsampwidth(2)                     # 16 bits per sample
    w.setframerate(RATE)
    frames = bytearray()
    for t in range(int(RATE * SECONDS)):
        sample = AMP * math.sin(2 * math.pi * FREQ * t / RATE)
        frames += struct.pack("<h", int(sample * 32767))   # scale to 16-bit
    w.writeframes(frames)

print("wrote sine.wav — play it: this is A440, pure and clean")
```

Play it: a pure tone, the tuning fork of the digital world. The reader exercise:
read it back with the `wave` module, print the first 10 samples, and verify they
match `0.8 × sin(2π × 440 × t/44100)` — the formula, confirmed in your own file.

## What you now know

- Digital audio = **amplitude samples at a fixed rate**; 16-bit PCM scales −1..1
  to −32768..32767.
- **WAV = header + raw samples** — the PPM of sound, provably, in 15 lines.
- The sine formula `A·sin(2πft/RATE)` is the synthesizer's seed — every later
  chapter builds on it.

Next: the sine has two dials — amplitude (loudness) and frequency (pitch). Turn
them, and hear octave relationships emerge from pure arithmetic.
