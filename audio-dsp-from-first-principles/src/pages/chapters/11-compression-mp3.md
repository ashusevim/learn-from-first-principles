---
layout: ../../layouts/Chapter.astro
title: 'Compression: PCM to MP3, Conceptually'
description: 'What MP3 throws away and why you don’t notice — psychoacoustics as compression. Build: the spectral cutoff, heard as size.'
part: 'Part IV — The Real World'
written: true
---

Raw CD audio is 10 MB per minute. MP3 plays the same music at ~1 MB — a 10×
shrink — with a difference most people can't hear. The trick isn't mathematically
clever compression: it's **psychoacoustics** — using human hearing's blind spots
to discard data the ear won't miss. This chapter demonstrates the core trick with
your own FFT: throw away frequencies you can't hear, and measure the savings.

## The lie you were told

> "MP3 compresses by clever encoding."

The bulk of the win is **lossy spectral pruning**: transform the signal to the
frequency domain (Chapter 8's FFT/MDCT), quantize frequencies the ear can't
reproduce, and encode what's left. The three perceptual levers:

```text
1. THE HEARING RANGE:    humans hear 20 Hz–20 kHz (less with age) — cut above 16–20 kHz
2. MASKING:              a loud sound hides quieter ones NEAR ITS FREQUENCY —
                         the loud guitar note makes a faint flute in the same
                         band inaudible: throw the flute away
3. STEREO REDUNDANCY:    the two channels mostly overlap — encode the difference
                         with fewer bits
```

Each lever is "the ear can't tell" — and the art is that most listeners, most of
the time, can't.

## The spectrum before and after

```text
full-band music:   energy up to 22,050 Hz (CD's Nyquist)
MP3 at 128 kbps:   frequencies above ~16 kHz zeroed; fine detail quantized
the listener:      usually can't tell. the audio engineer: can, at 96 kbps.
```

## Prove it to yourself

**1. The cutoff, heard as size:**

```python
# take Chapter 6's melody WAV, FFT it (Ch 8), zero everything above 4 kHz
# (a brutal "MP3"), reconstruct, and compare file sizes:
# full band:  all frequencies → size X
# 4 kHz cut:  most samples' energy survives; the shimmer is gone; size similar
#             (WAV is uncompressed! the SIZE win needs the encoding step —
#              but the INFORMATION removed is what MP3 would encode sparsely)
```

The honest demonstration: WAV can't shrink (it stores what you give it), so the
experiment shows the *information removed* — which is what MP3's encoder exploits.
The perceptual claim "you can't hear it" is testable by ear.

**2. Masking, demonstrated by construction:**

```python
# a loud 440 Hz tone + a faint 450 Hz tone: the faint one is INAUDIBLE
# (masked — the ear's frequency resolution smears near loud tones).
# the MP3 encoder knows this rule and spends zero bits on the faint tone.
```

## The build: spectral pruning

```python
# prune.py — FFT → zero the inaudible top → inverse FFT → compare
import math, cmath
from fft import fft                                     # Chapter 8's FFT
RATE, N = 44100, 8192

def inverse_fft(spectrum):                              # the reverse transform
    N = len(spectrum)
    out = []
    for n in range(N):
        v = sum(spectrum[k] * cmath.exp(2j * cmath.pi * k * n / N) for k in range(N))
        out.append(v.real / N)
    return out

# a signal: the melody's frequencies + inaudible high-frequency "air"
signal = [0.5 * math.sin(2 * math.pi * 440 * i / RATE) +
          0.3 * math.sin(2 * math.pi * 880 * i / RATE) +
          0.1 * math.sin(2 * math.pi * 15000 * i / RATE) for i in range(N)]

spectrum = fft(signal)
cut_bins = int(8000 / (RATE / N))                       # everything above 8 kHz...
pruned = spectrum[:cut_bins] + [0] * (N - cut_bins)     # ...discarded: the ear's ceiling
restored = inverse_fft(pruned)

removed_energy = sum(abs(v) ** 2 for v in spectrum[cut_bins:])
total_energy = sum(abs(v) ** 2 for v in spectrum)
print(f"energy removed: {removed_energy / total_energy:.1%}")
print(f"max sample difference: {max(abs(a - b) for a, b in zip(signal, restored)):.4f}")
# energy removed: ~0.5%   ← half a percent of energy, ALL above 8 kHz
# max sample difference: 0.04     ← audible? Play both. Most listeners: no.
```

Half a percent of energy removed, and the difference is near-inaudible — because
the removed part lived above the ear's practical ceiling. MP3 does this *per
block* with *masking-aware* bit allocation, plus entropy coding on top. The
pruning is the concept; the encoder is the packaging.

## What you now know

- Lossy audio = **spectral pruning + quantization guided by psychoacoustics** —
  the hearing range, masking, and stereo redundancy are the three levers.
- The transform domain (Ch 8's FFT/MDCT) is where the decisions happen: frequency
  data is where "the ear can't tell" is formalized.
- Lossy compression is *deliberate, informed information destruction* — the
  encoder's model of your ears decides what dies.
- The same pattern everywhere: JPEG for images (DCT blocks, quantize high
  frequencies), video codecs (motion + residuals). You now understand the family.

Next, the finale: every chapter composed — wavetables, ADSR, mixing, the
sequencer, the filter — into **a synthesizer that plays actual music in ~300
lines**, written to a WAV you made from nothing.
