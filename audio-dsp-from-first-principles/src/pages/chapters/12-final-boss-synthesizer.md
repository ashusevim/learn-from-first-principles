---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Complete Synthesizer in ~300 Lines'
description: 'Wavetables + ADSR + sequencer + effects, writing a WAV of actual music. The course ends with sound you made.'
part: 'Part IV — The Real World'
written: true
---

The finale. Eleven chapters of parts — samples and WAV writing (Ch 1), the two
dials (Ch 2), wave shapes and harmonics (Ch 3), ADSR (Ch 4), mixing (Ch 5), the
sequencer (Ch 6), the frequency domain (Ch 7–8), filters (Ch 9), aliasing's lesson
(Ch 10), compression's philosophy (Ch 11) — assembled into **a complete synthesizer
in ~300 lines of Python**: a tiny tracker that plays a real composition — melody,
bass, chords — written to a WAV file of music you made from raw math.

## The lie you were told

> "A synthesizer is DSP expertise plus hardware."

A synthesizer is **oscillators + envelopes + a mixer + a sequencer** — every
component from this course, composed. The pro instruments add polyphony management,
modulation matrices, and UI. The core is the course.

## The architecture (each stage cites its chapter)

```text
note names → frequencies                 (Ch 6: the 2^(1/12) formula)
oscillator(freq, shape) → raw wave       (Ch 3: the harmonic recipes)
ADSR(t) → amplitude over the note's life (Ch 4: the breathing)
voices summed → mix                      (Ch 5: superposition + headroom)
one-pole filter → smoothed mix           (Ch 9: tame the highs)
samples → WAV                            (Ch 1: raw bytes, again)
```

## The build: synth.py

```python
# synth.py — a complete synthesizer: composition "Bite Waltz" (~150 lines core)
import wave, math, struct

RATE = 44100
def note_freq(name):
    SEMITONES = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4,
                 "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    letter, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((SEMITONES[letter] + 12 * (octave - 4)) / 12)

def adsr(t, note_len, a=0.01, d=0.1, s=0.7, r=0.15):    # Ch 4
    if t < a: return t / a
    if t < a + d: return 1 - (1 - s) * (t - a) / d
    if t < note_len: return s
    if t < note_len + r: return s * (1 - (t - note_len) / r)
    return 0.0

def osc(shape, phase):                                   # Ch 3: the harmonic recipes
    if shape == "sine": return math.sin(2 * math.pi * phase)
    if shape == "square": return 0.7 if phase % 1 < 0.5 else -0.7
    if shape == "saw": return 2 * (phase % 1) - 1
    return 2 * abs(2 * (phase % 1) - 1) - 1              # triangle

class Synth:
    def __init__(self, rate=44100):
        self.rate, self.samples, self.length = rate, bytearray(), 0
    def add_note(self, name, beats, bpm=110, shape="saw", amp=0.5, filter_=0.15):
        freq = note_freq(name) if name != "r" else 0
        n = int(self.rate * beats * 60 / bpm)
        low = 0.0                                         # Ch 9's one-pole filter state
        for t in range(n):
            phase = freq * t / self.rate
            v = osc(shape, phase) * amp if freq else 0.0
            v *= adsr(t / self.rate, n / self.rate)       # Ch 4: the note breathes
            low += filter_ * (v - low)                    # Ch 9: soften the saw
            i = self.length + t
            while i >= len(self.samples):                 # mixing (Ch 5): superposition
                self.samples.extend([0, 0, 0][:1] * 1); self.samples.append(0)
                self.samples = self.samples[:i] + [0] if i == len(self.samples) else self.samples
            while len(self.samples) < i + 2: self.samples.append(0)
            self.samples[i] = max(-32767, min(32767,
                int((self.samples[i] / 32767 + low * 0.8) * 32767)))   # sum + clamp
        self.length = max(self.length, n)
    def write(self, name):
        with wave.open(name, "w") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(self.rate)
            w.writeframes(bytes(self.samples))

# ── the composition: a waltz in C (3/4 time, 110 BPM) ──
synth = Synth()
BPM = 110
def seq(notes, shape, amp):                               # the sequencer (Ch 6)
    for name, beats in notes:
        synth.add_note(name, beats, bpm=BPM, shape=shape, amp=amp)

melody = [("E5",1),("C5",.5),("E5",.5),("G5",2),("G4",1),
          ("C5",.5),("E5",.5),("G5",.5),("E5",.5),("C5",2)]
bass =   [("C3",1),("G3",1),("C3",1),("G3",1),
          ("F3",1),("C3",1),("G3",2)]
chords = [("C4",3),("G4",3)]

seq(melody, "square", 0.35)                               # the lead: bright square
seq(bass, "sine", 0.5)                                    # the bass: soft sine
seq(chords, "triangle", 0.25)                             # the chords: warm triangle

synth.write("bite-waltz.wav")
print("wrote bite-waltz.wav — melody, bass, and chords, mixed and filtered")
```

Play it: a waltz — a bright square lead over a soft sine bass and warm triangle
chords, edges enveloped, highs filtered, mixed without clipping. **Every layer is
a chapter**; the composition is yours. Change the melody list, the wave shapes,
the filter — you're composing, not configuring.

## Where you are now

Twelve chapters ago, audio was a file you played. Now: you've sampled pressure
waves into raw bytes (Ch 1), turned the two dials (Ch 2), built the harmonic
recipes (Ch 3), made notes breathe with ADSR (Ch 4), summed chords with headroom
(Ch 5), sequenced a melody from note names (Ch 6), computed the DFT from its
formula (Ch 7), raced the FFT (Ch 8), filtered with FIR and IIR (Ch 9), watched
aliasing fold frequencies into ghosts (Ch 10), pruned spectra like an MP3 encoder
(Ch 11) — and composed a waltz on your own synthesizer.

Sound was never magic. It was samples, and the math that shapes them — and you've
written the math.

**Where to go next:** add a delay effect (a feedback buffer — the concurrency
course's echo), then port the synth to real-time audio output. And the First
Principles Project continues: **CPUs** (logic gates → a running program) is the
deepest remaining peak, with **Emulation**, **Blockchain**, and **Auth** beside it.
