---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the synthesizer from Chapter 12 — oscillators, envelopes, filters, aliasing. Each is checkable by ear or by plot.'
part: 'Part V — Practice & Reference'
written: true
---

The synthesizer is written; these labs make it yours. Every exercise runs on artefacts the course already produced — the WAV writer, oscillators, ADSR, FFT, filter, and the Chapter 12 `synth.py`. Each ends in something you can hear or a number you can read.

## How the labs work

| Field | What it gives you |
|---|---|
| **Goal** | the claim the lab proves |
| **Do this** | the smallest change that proves it |
| **You'll know it works when** | the expected output |
| **Where it comes from** | the chapter that taught it |

| Section | Labs |
|---|---|
| Warm-ups | 1.1–1.3 |
| Builds | 2.1–2.5 |
| Stretch goals | 3.1–3.4 |

Self-grade by listening (a click, a ghost, a cracking chord) or by plotting (a peak that survives a filter).

## Warm-ups

**Lab 1.1 — Read the header**
**Goal:** see that a WAV is bytes you can inspect.
**Do this:** write a tone, then dump its first bytes.
```sh
python3 sine.py && xxd -l 64 sine.wav   # RIFF....WAVEfmt, then raw samples
```
**You'll know it works when:** the file size equals `rate × 2 × seconds + 44` — the header is 44 bytes.
**Where it comes from:** Chapter 1 — What Is Sound, Really?

**Lab 1.2 — Count the octave**
**Goal:** prove frequency doubling without trusting your ear.
**Do this:** read back `a440.wav` and `a880.wav`; count zero-crossings per second.
**You'll know it works when:** the counts differ by exactly 2 (≈880 against ≈1760).
**Where it comes from:** Chapter 2 — Loudness & Pitch: Amplitude and Frequency.

**Lab 1.3 — Draw the shapes**
**Goal:** see the harmonic recipes as silhouettes.
**Do this:** print each oscillator's samples as a row of block characters.
```python
for name, w in [("sine", lambda p: math.sin(2*math.pi*p)),
                ("saw",  lambda p: 2*(p % 1) - 1)]:
    print(name, "".join("█" if w(i/24) > 0.3 else "▄" for i in range(24)))
```
**You'll know it works when:** the sine row shows smooth hills and the saw row ramps that snap back — one pitch, two silhouettes.
**Where it comes from:** Chapter 3 — Waves: Sine, Square, Saw & Triangle.

## Builds

**Lab 2.1 — A chord that doesn't clip**
**Goal:** hear headroom and normalization solve the same problem differently.
**Do this:** sum C4+E4+G4 naively, count clipped samples, then re-sum each source scaled by ⅓.
```python
naive    = [a + b + c for a, b, c in zip(c4, e4, g4)]     # peaks reach 2.4
headroom = [a/3 + b/3 + c/3 for a, b, c in zip(c4, e4, g4)]
print(sum(abs(s) > 1.0 for s in naive), max(map(abs, headroom)))
```
**You'll know it works when:** the naive mix reports clipped samples and the headroom peak prints below `1.0`.
**Where it comes from:** Chapter 5 — Mixing & Superposition.

**Lab 2.2 — One note, four instruments**
**Goal:** isolate the envelope as the source of personality.
**Do this:** play one oscillator through the piano, organ, and strings ADSR sets.
**You'll know it works when:** three WAVs from one waveform sound like a strike, a hold, and a swell.
**Where it comes from:** Chapter 4 — Envelopes: ADSR — How Notes Breathe.

**Lab 2.3 — X-ray a signal**
**Goal:** recover frequencies you composed but hid.
**Do this:** compose 440 + 880 + 2000 Hz at decreasing amplitudes; run the DFT; print the top three peaks.
**You'll know it works when:** the peaks land near 440, 880, and 2000 Hz with magnitudes in your ratio.
**Where it comes from:** Chapter 7 — The Frequency Domain: The DFT.

**Lab 2.4 — Prove a filter**
**Goal:** replace a claim with a measurement.
**Do this:** compose 200 Hz + 12 kHz; run `one_pole(sig, 0.05)`; FFT before and after.
```python
low = one_pole(signal, 0.05)        # Chapter 9's IIR low-pass
# FFT both: the 12 kHz peak is gone, the 200 Hz peak survives
```
**You'll know it works when:** the 12 kHz peak **vanishes** while the 200 Hz peak remains.
**Where it comes from:** Chapter 9 — Filters: Low-pass, High-pass & Beyond.

**Lab 2.5 — Extend the synth**
**Goal:** compose by editing numbers, not code paths.
**Do this:** in `synth.py`, add a fourth voice — a counter-melody — with its own shape and amplitude.
**You'll know it works when:** `bite-waltz.wav` grows longer and the new line is audible and unclipped.
**Where it comes from:** Chapter 12 — Final Boss: A Complete Synthesizer in ~300 Lines.

## Stretch goals

**Lab 3.1 — Defend against aliasing**
**Goal:** show why recorders filter before they sample.
**Do this:** generate a 30 kHz tone at 44.1k, FFT it, then low-pass **before** sampling and FFT again.
**You'll know it works when:** the unfiltered version shows a ghost near 14.1 kHz and the pre-filtered one doesn't. Any filter that kills it counts.
**Where it comes from:** Chapter 10 — Sample Rates & Aliasing.

**Lab 3.2 — Prune like an encoder**
**Goal:** measure how little you lose cutting the inaudible top.
**Do this:** FFT a melody, zero everything above 8 kHz, inverse-FFT, print the removed energy fraction.
**You'll know it works when:** the fraction is small and the difference is inaudible.
**Where it comes from:** Chapter 11 — Compression: PCM to MP3, Conceptually.

**Lab 3.3 — Add an echo**
**Goal:** build an effect from one feedback loop.
**Do this:** keep a buffer and add `feedback × delayed` sample to the dry signal.
**You'll know it works when:** a note repeats and decays, and `feedback ≥ 1.0` can be made to run away.
**Where it comes from:** Chapter 9 — Filters: Low-pass, High-pass & Beyond.

**Lab 3.4 — Transpose a melody**
**Goal:** turn music theory into arithmetic.
**Do this:** add `n` to every note's step count in `note_freq`.
**You'll know it works when:** a shift of `+12` reproduces the melody one octave up (every frequency doubled).
**Where it comes from:** Chapter 6 — Sequencing: Notes to Music.

## Self-checking without a grader

| Evidence | How you collect it | A pass looks like |
|---|---|---|
| by ear | play two files back to back | the click, crackle, or ghost is gone |
| by assertion | bake the claim into one line | `assert max(map(abs, mix)) <= 1.0` runs clean |
| by plot | reuse the FFT | a peak survives, or fails to appear |
| by construction | plant the failure on purpose | the symptom you predicted shows up |

**Expected output** settles the warm-ups, **assertions** the builds, **the FFT** anything filter-shaped, and **a deliberately planted failure** the stretch goals. If you can write the check, the lab is done.

## What you now know

- Every lab reuses **artefacts you already built** — no new theory, no external tools.
- Sound is self-grading: a click or a ghost is a verdict, not an opinion.
- Numbers grade what the ear can't: clipping counts, energy fractions, frequency ratios.
- Composition is editing parameters — the synth is yours.

Next: take the synth to the real world — wire your WAV generator to a live audio output, and read the Web Audio spec (webaudio.github.io) to hear your math in a browser.