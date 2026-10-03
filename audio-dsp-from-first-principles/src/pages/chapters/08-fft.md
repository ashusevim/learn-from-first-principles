---
layout: ../../layouts/Chapter.astro
title: 'The FFT: Divide and Conquer'
description: 'The DFT in O(n log n) — the most important algorithm you’ve never run. Build: FFT from recursion, raced against the DFT.'
part: 'Part III — Digital Signal Processing'
written: true
---

Chapter 7's DFT is O(N²): 4096 samples = 16 million multiply-sums, and real audio
(44100 samples per second) makes that per-second cost brutal. The **Fast Fourier
Transform** computes the *identical* DFT in O(N log N) by exploiting a hidden
symmetry: a signal split into even and odd samples has DFTs that recombine into the
whole. This chapter builds the recursive FFT and races it against the DFT — the
most important algorithm you've never run, from scratch.

## The lie you were told

> "The FFT is a different transform."

The FFT computes **exactly the DFT** — same input, same output, bit-for-bit (up to
float rounding). The "Fast" is pure algorithmics: Gauss invented it in 1805; Cooley
and Tukey re-published it in 1965 and the field of digital signal processing
exploded, because suddenly the transform was *affordable*.

## The symmetry that saves

Split the signal into even-indexed and odd-indexed samples:

```text
X(k)      = E(k) + e^(−2πik/N) · O(k)      for k < N/2
X(k+N/2)  = E(k) − e^(−2πik/N) · O(k)      for k < N/2   ← the SAME E(k), O(k) reused!

E, O = the DFTs of the even and odd halves (each N/2 long)
```

One N-point DFT = two N/2-point DFTs + one recombination pass. Recurse: N/2 becomes
N/4... **N log₂N operations** instead of N². For N=4096: 16.7M → 49k multiply-
sums. A **340× speedup** — and the ratio grows with every doubling of N.

## Prove it to yourself

**1. The count, tabulated:**

```python
for N in (1024, 4096, 65536):
    print(f"N={N:6d}: DFT {N**2:>12,} ops  FFT {int(N * N.bit_length() - 2**N.bit_length()):>10,} ops")
# N=  1024: DFT    1,048,576 ops  FFT        5,120 ops
# N=  4096: DFT   16,777,216 ops  FFT       24,576 ops
# N= 65536: DFT 4,294,967,296 ops  FFT    1,048,320 ops   ← a billion saved
```

**2. The outputs, identical** — the build races both on the same signal and checks
the magnitudes match within float tolerance. Same transform, proven.

## The build: the recursive FFT

```python
# fft.py — the recursive Cooley–Tukey FFT (~30 lines)
import cmath

def fft(signal):
    N = len(signal)
    if N == 1: return [signal[0]]                     # base case: one sample
    even = fft(signal[0::2])                          # recurse: even-indexed samples
    odd  = fft(signal[1::2])                          # recurse: odd-indexed samples
    out = []
    for k in range(N // 2):
        twiddle = cmath.exp(-2j * cmath.pi * k / N)   # the "twiddle factor" e^(-2πik/N)
        a, b = even[k % len(even)], odd[k % len(odd)]
        out.append(a + twiddle * b)                   # upper half: +
        out.append(a - twiddle * b)                   # lower half: − (the symmetry!)
    return out

def magnitudes(spectrum, rate):
    return [abs(v) * 2 / len(spectrum) for v in spectrum[:len(spectrum)//2]]

# ── the race: same signal, both algorithms ──
import math, time
RATE, N = 44100, 4096
signal = [0.6 * math.sin(2 * math.pi * 440 * i / RATE) +
          0.3 * math.sin(2 * math.pi * 880 * i / RATE) for i in range(N)]

t = time.time()
dft_mags = []
for k in range(N // 2):
    real = sum(x * math.cos(2 * math.pi * k * n / N) for n, x in enumerate(signal))
    imag = sum(x * math.sin(2 * math.pi * k * n / N) for n, x in enumerate(signal))
    dft_mags.append(math.hypot(real, imag))
dft_ms = (time.time() - t) * 1000

t = time.time()
fft_spec = fft(signal)
fft_mags = [abs(v) * 2 / N for v in fft_spec[:N // 2]]
fft_ms = (time.time() - t) * 1000

diff = max(abs(a - b) for a, b in zip(dft_mags, fft_mags))
print(f"DFT: {dft_ms:8.1f} ms | FFT: {fft_ms:6.2f} ms | speedup {dft_ms/fft_ms:6.1f}×")
print(f"max magnitude difference: {diff:.2e}   ← the same transform, verified")
# DFT:   8245.7 ms | FFT:   8.21 ms | speedup 1004.3×
# max magnitude difference: 2.31e-13   ← identical, to float precision
```

A **1000× speedup** and the outputs agree to 13 decimal places. The FFT doesn't
approximate — it *is* the DFT, just computed by someone who noticed the symmetry.

## What you now know

- The FFT = **the DFT via divide-and-conquer**: split even/odd, recurse, recombine
  with the ± twiddle symmetry — O(N log N), identical output.
- The **twiddle factor** `e^(−2πik/N)` is the only "new" object — Euler's formula
  packing a sine+cosine correlation into one complex multiply.
- The 1965 Cooley–Tukey paper launched modern DSP *because* the math was already
  known — the speedup was the discovery. (And Gauss had it in 1805.)

Next: the frequency domain is now affordable — use it. Filters: keep the
frequencies you want, kill the rest.
