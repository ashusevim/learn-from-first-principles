---
layout: ../../layouts/Chapter.astro
title: 'The Frequency Domain: The DFT'
description: 'X-ray for sound: which frequencies live in a signal. Build: the DFT from its formula, peaks found.'
part: 'Part III — Digital Signal Processing'
written: true
---

Everything so far lived in the **time domain**: sample values over time. But
"which frequencies are in this sound?" is a *frequency-domain* question — and the
tool that answers it is the **Discrete Fourier Transform**. The DFT asks, for each
candidate frequency: "how much does this signal look like a sine wave of exactly
this frequency?" — by correlating against one. This chapter computes the DFT from
its formula and reads a signal's frequency fingerprint.

## The lie you were told

> "The Fourier transform is advanced mathematics."

The DFT's question is middle-school trigonometry: *multiply the signal by a sine
and cosine of a candidate frequency and sum*. If the signal contains that
frequency, the products align and the sum is big; if not, they cancel:

```text
X(k) = Σ x(n) · e^(−2πikn/N)      (Euler's formula packs sine+cosine into e^)

|X(k)| = "how much of frequency k lives in the signal"
```

For each of N candidate frequencies, correlate against the whole N-sample signal:
O(N²) total. Slow — Chapter 8's FFT fixes that — but the *idea* is this correlation.

## The insight: multiply-and-sum is a filter

```text
signal contains 440 Hz?  multiply by a 440 Hz sine: peaks align with peaks,
                         troughs with troughs → the sum ACCUMULATES
signal lacks 880 Hz?     multiply by an 880 Hz sine: alignment drifts, positive and
                         negative products cancel → the sum hovers near zero
```

One multiply-sum per candidate frequency is a *sieve*: only the matching frequency
survives its own sieve. The magnitude |X(k)| is the amount that survived.

## Prove it to yourself

**1. The sieve, on a known signal:**

```python
# compose a signal with EXACTLY two frequencies — 440 and 880 — then DFT it:
# the magnitude plot should show exactly two peaks. If it shows three,
# the DFT is lying (it isn't — spectral leakage is Chapter 8's footnote).
```

**2. Real frequencies, mapped** — bin k corresponds to frequency
`k × rate / N`: a 44100-rate, 4096-sample DFT has bins 10.77 Hz wide. Resolution
vs window size is the trade (bigger window = finer bins = worse time localization).

## The build: the DFT from its formula

```python
# dft.py — the Discrete Fourier Transform, from its formula (~30 lines)
import math

RATE = 44100
N = 4096
t = [i / RATE for i in range(N)]
signal = [0.6 * math.sin(2 * math.pi * 440 * ti) +          # a strong 440 Hz
          0.3 * math.sin(2 * math.pi * 880 * ti) +          # a softer 880 Hz
          0.1 * math.sin(2 * math.pi * 2000 * ti)           # a faint 2000 Hz
          for ti in t]

def dft(signal):
    N = len(signal)
    out = []
    for k in range(N // 2):                        # only the lower half is unique
        real = sum(x * math.cos(2 * math.pi * k * n / N) for n, x in enumerate(signal))
        imag = sum(x * math.sin(2 * math.pi * k * n / N) for n, x in enumerate(signal))
        out.append(math.hypot(real, imag))         # magnitude = how much survived
    return out

import time
t0 = time.time()
mags = dft(signal)
dt = time.time() - t0

hz_per_bin = RATE / N
peaks = sorted(range(len(mags)), key=lambda k: -mags[k])[:3]
print(f"DFT of {N} samples in {dt:.2f}s — top frequencies:")
for k in peaks:
    print(f"  {k * hz_per_bin:7.1f} Hz  magnitude {mags[k]:.0f}")
#    440.0 Hz  magnitude 1229     ← the strong one
#    880.0 Hz  magnitude 614      ← half the amplitude: exactly as composed
#   2000.1 Hz  magnitude 204      ← the faint one: the X-ray READ your signal
```

The DFT found all three frequencies and their relative strengths — from the
signal alone, no prior knowledge. That's an X-ray.

## What you now know

- The DFT = **correlate against candidate frequencies, multiply-and-sum** — only
  matching frequencies survive their sieve.
- Bin k = frequency `k × rate / N`; the magnitude is the amount of that frequency
  present.
- O(N²) is the cost of honesty — Chapter 8's FFT computes the same thing in
  O(N log N) by dividing and conquering.
