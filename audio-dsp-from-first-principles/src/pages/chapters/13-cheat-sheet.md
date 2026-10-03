---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Digital Audio on One Page'
description: 'Sound, synthesis and DSP compressed to one page: the model, the units, the pitfalls, and the decisions that separate beeps from music.'
part: 'Part V — Practice & Reference'
written: true
---

Finished the course, wrote the synth, and the sound is *almost* right. This page is the lookup table for the last 5%: the signal chain to keep in your head, the units and constants your code actually uses, the pitfalls that flatten peaks and fold ghosts, and three experiments that turn a claim into a measurement.

## The one-page model

```text
note name ─2^(1/12)─▶ frequency ─oscillator─▶ wave ─ADSR─▶ note
notes ─sum (superposition)─▶ mix ─filter─▶ shaped mix ─▶ samples ─▶ WAV
analysis: samples ─DFT/FFT─▶ spectrum;   sampling: any f > rate/2 folds to rate−f
```

Every sound is a **number stream** — samples at a fixed rate, bounded to ±1. Synthesis walks left to right; analysis runs the same row backwards. One law ties the halves together: **frequencies add, samples sum, and anything above `rate/2` folds back as a ghost.**

## The units you actually use

| Unit | Meaning | Tiny example |
|---|---|---|
| sample rate (Hz) | measurements per second | `RATE = 44100` |
| amplitude | sample height, −1..1 | `0.8 * math.sin(...)` |
| Nyquist | `rate / 2`, the capture ceiling | `44100 / 2 = 22050` |
| semitone | `× 2^(1/12) ≈ ×1.0595` | `440 * 2 ** (7/12)` |
| octave | ×2 in frequency | `440 → 880` |
| BPM | beats per minute → `60/BPM` s | `n = RATE * beats * 60 / bpm` |
| ADSR | four numbers over a note’s life | `adsr(t, note_len, a, d, s, r)` |
| α (one-pole) | filter memory, 0..1 | `y += alpha * (x - y)` |
| bin k | frequency `k × rate / N` | `k * RATE / N` |
| twiddle | `e^(−2πik/N)`, recombining the FFT | `cmath.exp(-2j*pi*k/N)` |

Two of these are constants of the universe for your code: `rate/2` closes the sampling theorem, and `2^(1/12)` opens all of Western music.

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| a note that clicks at both ends | a discontinuity is a burst of frequencies — fade it | Chapter 2 |
| a “square” that sounds like a sine | odd harmonics at 1/n are the shape, not a drawing | Chapter 3 |
| a piano that sounds like an organ | ADSR is instrument personality, not wave shape | Chapter 4 |
| a chord crackling into fuzz | sums exceed ±1 and clip — headroom or normalize | Chapter 5 |
| a melody transposing wrong by a step | one semitone is `2^(1/12)`, not `+1 Hz` | Chapter 6 |
| a spectrum with unexpected peaks | bin k is `k × rate / N`; window size sets resolution | Chapter 7 |
| a transform too slow to use | recurse even/odd with the ± twiddle — O(N log N) | Chapter 8 |
| a filter that rings or explodes | IIR feeds output back into input | Chapter 9 |
| a high tone that plays back low | `f > rate/2` aliases to `rate − f`; filter first | Chapter 10 |
| a “cut” that shrank nothing | WAV stores what you give it; pruning removes *information* | Chapter 11 |

## When to use what

| Decision | Choose | Because |
|---|---|---|
| adding voices | headroom up front, or normalize after | both are one multiply on opposite ends |
| sounding like an instrument | shape the envelope first | ADSR moves perception more than harmonics |
| analyzing or editing | DFT for clarity, FFT for speed | the FFT *is* the DFT, symmetry exploited |
| taming a bright saw | one-pole (IIR) to carve, moving average (FIR) to be safe | feedback is cheap and can be unstable |
| sampling with high content | analog low-pass before the ADC | after sampling the ghost is identical |
| shrinking a file | prune what the ear can’t hear | psychoacoustics, not clever encoding |

## Prove it to yourself

**1. The octave is a constant, not a table:**

```python
print(round(440 * 2 ** (12 / 12)))     # 880 — an octave up is exactly ×2
print(round(440 * 2 ** (7 / 12), 2))   # 659.26 — a fifth, from the same constant
```

**2. The alias, computed before it is heard:**

```python
RATE = 44100
for f in (23000, 30000, 66150):
    a = f % RATE; a = RATE - a if a > RATE / 2 else a   # fold past Nyquist
    print(f, "→", a)   # 23000→21100.0  30000→14100.0  66150→22050.0
```

**3. The FFT agrees with the DFT:**

```python
# x-ray a signal with both Chapter 7's DFT and Chapter 8's FFT, then compare:
# max(abs(a - b) for a, b in zip(dft_mags, fft_mags)) ≈ 1e-13 — the same transform.
```

## What you now know

- Everything is **samples at a rate, bounded to ±1** — synthesis writes them, analysis reads them.
- **`rate/2` and `2^(1/12)`** are the two constants every chapter leans on.
- The synthesis chain is **oscillator → envelope → sum → filter**; the analysis chain is the FFT in reverse.
- Aliasing and lossy compression are the same lesson twice — what you sample or keep is a decision, and the ghost never announces itself.

Next: leave the theory and play — twelve labs on the Chapter 12 synthesizer, each checkable by ear or by plot.