---
layout: ../../layouts/Chapter.astro
title: 'Sequencing: Notes to Music'
description: 'Note names, frequencies, tempo, and timing. Build: a sequencer playing a real melody from note names.'
part: 'Part II — The Synthesizer'
written: true
---

The synthesizer has oscillators, envelopes, and mixing — but a *melody* needs a
translator: **note names → frequencies**, and **tempo → durations**. Both are
arithmetic you've already met (Chapter 2's `2^(1/12)` semitone constant). This
chapter builds a sequencer that plays a real melody from note names, with rests and
chords.

## The lie you were told

> "Note frequencies are a lookup table someone made."

They're a **formula**: A4 = 440 Hz, every semitone × 2^(1/12), every octave × 2:

```python
def note_freq(name):                     # "C4", "F#5", "Bb3" → Hz
    SEMITONES = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5,
                 "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    letter, octave = name[:-1], int(name[-1])
    steps = SEMITONES[letter] + 12 * (octave - 4)
    return 440.0 * 2 ** (steps / 12)
```

Every note in Western music from one constant and a spelling. The formula's power:
transposing a melody = adding to the step count.

## Tempo: beats to seconds

Tempo in BPM (beats per minute) → beat duration = 60/BPM seconds. A note's length
is its beat fraction (quarter = 1 beat, eighth = 0.5):

```text
120 BPM → beat = 0.5s → quarter note = 0.5s, eighth = 0.25s
```

## Prove it to yourself

**1. The note table, computed:**

```python
for name in ("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"):
    print(f"{name}: {note_freq(name):.1f} Hz")
# C4: 261.6  D4: 293.7  E4: 329.6  F4: 349.2
# G4: 392.0  A4: 440.0  B4: 493.9  C5: 523.3   ← the octave at exactly 2×
```

## The build: the sequencer

```python
# sequencer.py — note names → melody.wav (~35 lines)
import wave, math, struct
RATE = 44100

def note_freq(name):
    SEMITONES = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4,
                 "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    letter, octave = name[:-1], int(name[-1])
    steps = SEMITONES[letter] + 12 * (octave - 4)
    return 440.0 * 2 ** (steps / 12)

def note(samples_list, freq, beats, bpm=120, shape="square", amp=0.4):
    """append one note's samples (with a mini-ADSR) to the sequence"""
    n = int(RATE * beats * 60 / bpm)
    attack = max(1, int(RATE * 0.005))
    for t in range(n):
        p = freq * t / RATE
        if shape == "square": v = 1.0 if p % 1 < 0.5 else -1.0
        elif shape == "saw":  v = 2 * (p % 1) - 1
        else: v = math.sin(2 * math.pi * p)
        env = min(1.0, t / attack, (n - t) / attack)      # anti-click edges (Ch 2)
        samples_list.append(v * amp * env)

def rest(samples_list, beats, bpm=120):
    samples_list += [0.0] * int(RATE * beats * 60 / bpm)

# "Twinkle Twinkle" — the first phrase, note names and beat counts:
melody = [("C4", 1), ("C4", 1), ("G4", 1), ("G4", 1),
          ("A4", 1), ("A4", 1), ("G4", 2),
          ("F4", 1), ("F4", 1), ("E4", 1), ("E4", 1),
          ("D4", 1), ("D4", 1), ("C4", 2)]

samples = []
for name, beats in melody:
    if name == "r": rest(samples, beats)
    else: note(samples, note_freq(name), beats, bpm=120, shape="square")

with wave.open("twinkle.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in samples))
print(f"wrote twinkle.wav — {len(melody)} notes at 120 BPM, square wave")
```

Play it: Twinkle Twinkle, synthesized from note names by your own sequencer. Change
the shape to "saw", transpose by editing `note_freq`'s octave, speed it to 160 BPM
— the sequencer is an *instrument* now.

## What you now know

- **Note frequencies are one formula**: A440 × 2^(semitones/12); note names decode
  through a spelling table.
- **Tempo converts beats to seconds**: 60/BPM; note durations are beat fractions.
- The sequencer = **notes → (frequency, duration) → oscillator + envelope**, summed
  into one WAV — a tracker/piano-roll in embryo.

Next: you can *make* sound — now *analyze* it. The DFT: an X-ray that shows which
frequencies live inside any signal.
