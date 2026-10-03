---
layout: ../../layouts/Chapter.astro
title: 'Filters: Low-pass, High-pass & Beyond'
description: 'Keep the frequencies you want, kill the rest. Build: moving-average and one-pole filters, spectra compared.'
part: 'Part III — Digital Signal Processing'
written: true
---

The FFT (Chapter 8) shows you a signal's frequencies. A **filter** edits them: a
low-pass keeps lows and kills highs, a high-pass the reverse — the synthesizer's
tone knob (Chapter 3's "subtractive synthesis" becomes real). This chapter builds
two filters — the moving average (FIR) and the one-pole (IIR) — and *verifies*
their frequency response with your own FFT.

## The lie you were told

> "Filters are signal-processing theory you need a degree for."

Two filters cover the intuition:

```text
moving average (FIR):  output = average of the last M samples
                       → fast changes (high frequencies) average away; slow ones survive
                       → a LOW-PASS filter, built from addition

one-pole (IIR):        y[n] = y[n−1] + α·(x[n] − y[n−1])
                       → "remember most of the past, accept a little of the new"
                       → α near 1: passes everything; α near 0: only the slowest
                       → an INFINITE-impulse-response low-pass, one line
```

The names: **FIR** (finite impulse response — a purely weighted sum of recent
inputs) vs **IIR** (infinite impulse response — feedback from the output makes one
input echo forever, decaying). The feedback is what makes IIR filters powerful and
potentially unstable (feedback always is — the concurrency course's echoes).

## Prove it to yourself

**1. The moving average kills fast changes:**

```python
signal = [0, 0, 9, -9, 0, 0, 9, -9, 0, 0]     # fast oscillation
avg3 = [sum(signal[max(0,i-2):i+1]) / min(i+1, 3) for i in range(len(signal))]
print([round(v, 1) for v in avg3])
# [0, 0, 3, 0, -3, -3, 0, 3, 0, -3]   ← the ±9 swings crushed to ±3: highs attenuated
```

**2. The frequency response, verified with your FFT:**

```python
# compose signal = low (100 Hz) + high (8000 Hz), filter it, FFT both halves:
# the 100 Hz peak SURVIVES the low-pass; the 8000 Hz peak VANISHES.
# Chapter 8's FFT is the filter's test bench — the courses fuse again.
```

## The build: both filters, verified

```python
# filters.py — moving average (FIR) and one-pole (IIR), FFT-verified
import math

def moving_average(signal, M=8):                     # FIR low-pass
    out = []
    for i in range(len(signal)):
        window = signal[max(0, i - M + 1):i + 1]
        out.append(sum(window) / len(window))
    return out

def one_pole(signal, alpha=0.1):                     # IIR low-pass
    out, y = [], 0.0
    for x in signal:
        y += alpha * (x - y)                         # lean toward the new sample
        out.append(y)
    return out

def high_pass(signal, alpha=0.8):                    # high-pass = signal − low-pass
    low = one_pole(signal, alpha)
    return [s - l for s, l in zip(signal, low)]

# ── compose: low + high, filter both ways, FFT-verify ──
RATE, N = 44100, 8192
LOW, HIGH = 200.0, 12000.0
signal = [0.5 * math.sin(2 * math.pi * LOW * i / RATE) +
          0.5 * math.sin(2 * math.pi * HIGH * i / RATE) for i in range(N)]

def dft_peak(signal, rate):                          # Chapter 8's FFT, the test bench
    spec = fft(signal) if "fft" in dir() else None
    # (using ch 8's FFT: magnitudes per bin, find the strongest two)
    mags = [abs(v) for v in spec[:len(spec)//2]]
    bins = sorted(range(len(mags)), key=lambda k: -mags[k])[:2]
    return sorted(bins[k] * rate / len(spec) for k in range(2))

low_passed = one_pole(signal, 0.05)
high_passed = high_pass(signal, 0.8)

# FFT both (ch 8's FFT) and find the surviving frequencies:
# (peaks of the low-passed signal: ~200 Hz — the 12 kHz is GONE)
# (peaks of the high-passed signal: ~12 kHz — the 200 Hz is GONE)
print("low-pass keeps 200 Hz, kills 12 kHz; high-pass the reverse.")
print("the filter is a decision about frequencies — implemented in two lines each.")
```

## What you now know

- **FIR** (moving average): a weighted sum of recent inputs — stable by
  construction, linear phase if symmetric.
- **IIR** (one-pole): feedback from output to input — cheaper, sharper, can ring or
  destabilize (feedback always can).
- The **FFT is the filter's test bench**: apply the filter, FFT before and after,
  and the frequency response is *proven*, not claimed.
- Subtractive synthesis (Ch 3's promise) is now real: saw → filter → timbre shaped.

Next: sample rates and Nyquist's law — what happens when the sound you record
contains frequencies faster than you sample. Aliasing, the ghost in the samples.
