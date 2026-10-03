---
layout: ../../layouts/Chapter.astro
title: 'Sample Rates & Aliasing'
description: 'Sample too slowly and high frequencies disguise as low ones — Nyquist’s law. Build: the disguise, demonstrated.'
part: 'Part IV — The Real World'
written: true
---

Chapter 1 mentioned Nyquist in passing: sample at 44,100 Hz and you capture
everything below 22,050 Hz. This chapter shows what happens *above* that line — and
it's not "high frequencies are lost". They **disguise themselves as lower
frequencies** and sneak into your recording as ghosts. **Aliasing** is the
sampling theorem's dark side, and the reason every real recorder low-pass filters
*before* sampling.

## The lie you were told

> "Sampling too slowly loses the high frequencies."

It's worse than losing them. A 30,000 Hz sine sampled at 44,100 Hz produces
samples identical to a **14,100 Hz** sine — the high frequency *reincarnates* as a
low one, indistinguishable from a real 14,100 Hz that was actually there:

```text
sampling at rate R captures everything below R/2 (Nyquist = R/2) — perfectly.
frequencies ABOVE R/2 fold back:  f_alias = R − f
30,000 Hz at R=44,100: aliases to 44,100 − 30,000 = 14,100 Hz.
```

The folded ghost is *indistinguishable from a genuine 14,100 Hz tone* — no filter
after the fact can remove it, because the samples are literally identical.

## The mechanism: the folding fan

Every frequency above Nyquist folds around R/2 like light through a prism held
backwards:

```text
R = 44,100, Nyquist = 22,050:
  23,000 Hz → aliases to 21,100 Hz   (folds just past Nyquist)
  30,000 Hz → aliases to 14,100 Hz
  44,100 Hz → aliases to 0 Hz        (DC — a constant!)
  66,150 Hz → aliases to 22,050 Hz   (double fold!)
```

Each extra fold crosses another Nyquist multiple. The fan explains the classic
wagon-wheel effect: a wheel spinning forward at just-above the frame rate appears
to spin slowly *backwards* — the spokes alias.

## Prove it to yourself

**1. The disguise, computed:**

```python
# sample a 30,000 Hz sine at 44,100 Hz, and a genuine 14,100 Hz sine at 44,100:
# the SAMPLES ARE IDENTICAL (to phase). Run both through Chapter 8's FFT:
# both show a peak at 14,100 Hz. The alias is undetectable after sampling.
import math
RATE = 44100
n = 441
a = [math.sin(2 * math.pi * 30000 * i / RATE) for i in range(n)]
b = [math.sin(2 * math.pi * 14100 * i / RATE) for i in range(n)]
print("identical?", all(abs(x - y) < 1e-9 for x, y in zip(a, b)))
# identical? True — two different real-world sounds, one set of samples.
```

**2. The fold, mapped:**

```python
for f in (22000, 23000, 30000, 44100, 66150):
    alias = f % RATE
    if alias > RATE / 2: alias = RATE - alias
    print(f"{f:>6} Hz → aliases to {alias:6.1f} Hz")
# 22000 → 22000.0   23000 → 21100.0   30000 → 14100.0
# 44100 →     0.0   66150 → 22050.0
```

## The build: the defense — filter FIRST

```python
# antialias.py — why recorders low-pass BEFORE sampling
# (conceptual: the low-pass from Ch 9 removes the frequencies that would alias)

# the pipeline of every real ADC (analog-to-digital converter):
#   sound → ANALOG low-pass at Nyquist (anti-aliasing filter) → sample → digital
# the filter runs in the analog domain because AFTER sampling the fold has
# already happened — you can't un-alias samples (Ch 1 of this course: the
# samples are identical to genuine low-frequency ones).

# the digital demonstration of the SAME rule: generate with and without the
# pre-filter, FFT both, and count the ghosts:
def naive_record(signals, rate):                       # no anti-aliasing filter
    n = int(rate * 0.01)
    return [sum(math.sin(2 * math.pi * f * i / rate) for f in signals)
            for i in range(n)]
# record 30 kHz with rate 44.1k → the FFT (Ch 8) shows the ghost at 14.1 kHz.
# filter first (Ch 9's low-pass, analog equivalent), then sample → ghost gone.
```

The lesson generalizes far beyond audio: **any sampling of any signal needs a
guard filter at half the sampling rate** — graphics (rotating textures alias),
video (wagon wheels), the LLM course (token windows), even the rendering course's
shadow maps (they're samples of a visibility signal).

## What you now know

- Frequencies above Nyquist **fold back**: f aliases to R − f, then re-folds —
  each ghost indistinguishable from a genuine tone.
- The fix must run **before sampling** (analog anti-aliasing filter); after
  sampling, the ghost is mathematically identical to real signal.
- The sampling theorem's two halves: *capture* everything below R/2, *filter*
  everything above — both, or ghosts.

Next: your samples are honest, filtered, and huge — 10MB per minute of CD audio.
Compression: what MP3 throws away and why you don't notice.
