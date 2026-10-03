---
layout: ../../layouts/Chapter.astro
title: 'Envelopes: ADSR — How Notes Breathe'
description: 'Attack, decay, sustain, release: amplitude over time. Build: an ADSR envelope shaping raw oscillators into notes.'
part: 'Part II — The Synthesizer'
written: true
---

Chapter 2's fades fixed the click — with a linear ramp. Real notes *breathe*: a
piano note explodes instantly and fades for seconds; a violin swells; an organ holds
steady until released. The model synthesizers use is **ADSR** — four numbers that
draw a note's amplitude over its life:

```text
amplitude
 1.0 ┤     ╭─╮
     │    ╱   ╲________
     │   ╱             ╲___
     │  ╱                  ╲
   0 └─╱─────────────────────╲──── time
     attack decay  sustain  release
     (fast  (spike (held     (fade after
     rise)  down)  level)    key up)
```

- **Attack**: time from silence to peak (piano: 1ms; violin: 200ms)
- **Decay**: time from peak down to the sustain level
- **Sustain**: the level held while the key is *down*
- **Release**: time from key-up to silence

Attack and release cure the click; sustain makes notes holdable; the decay shape is
where "personality" lives.

## Prove it to yourself

**1. The same note, four instruments** — the ADSR is the difference more than the
wave shape: a piano is a 1ms-attack, long-decay saw; an organ is a 5ms-attack,
full-sustain square. Play both ADSR shapes on the *same* oscillator and hear two
instruments.

**2. The click, revisited** — Chapter 2's fade was "attack+release with no
middle". The ADSR generalizes it, and the click-cure is now a parameter.

## The build: the ADSR envelope

```python
# adsr.py — the envelope generator (~30 lines)
import math

def adsr(t, note_len, a=0.01, d=0.1, s=0.7, r=0.2):
    """amplitude at time t (seconds) for a note lasting note_len seconds"""
    if t < a:                                   # ATTACK: 0 → 1.0
        return t / a
    if t < a + d:                               # DECAY: 1.0 → sustain level
        return 1.0 - (1.0 - s) * (t - a) / d
    if t < note_len:                            # SUSTAIN: hold the level
        return s
    if t < note_len + r:                        # RELEASE: sustain → 0
        return s * (1 - (t - note_len) / r)
    return 0.0                                  # the note is over

# ── visualize the shapes ──
for name, params in [("piano", dict(a=0.005, d=0.3, s=0.1, r=0.4)),
                     ("organ", dict(a=0.01, d=0.05, s=0.95, r=0.05)),
                     ("strings", dict(a=0.25, d=0.1, s=0.85, r=0.3))]:
    row = ""
    for step in range(60):
        t = step * 0.05
        row += "█" if adsr(t, 2.0, **params) > 0.66 else \
               "▄" if adsr(t, 2.0, **params) > 0.33 else "▁"
    print(f"{name:8s} {row}")
# piano   ██████▄▄▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁  ← explodes, dies
# organ   ████▄██████████████████████████████  ← on/off like a light
# strings ▁▄▄▄████████████████████████▄▄▁▁▁▁  ← swells
```

The three rows are three instruments — same oscillator behind them. The envelope
*is* the instrument's personality, as much as the wave shape.

## The build: notes that breathe

```python
# notes.py — the oscillator + ADSR, composed (~25 lines)
import wave, math, struct
RATE = 44100

def oscillator(freq, n_samples, shape="saw"):
    out = []
    for t in range(n_samples):
        p = freq * t / RATE
        if shape == "saw": v = 2 * (p % 1) - 1
        elif shape == "square": v = 1.0 if p % 1 < 0.5 else -1.0
        else: v = math.sin(2 * math.pi * p)
        out.append(v)
    return out

def play_note(freq, duration, shape="saw", **env):
    n = int(RATE * duration)
    wave_samples = oscillator(freq, n, shape)
    release = env.get("r", 0.2)
    return [sample * adsr(t / RATE, duration, **env)
            for t, sample in zip(range(n), wave_samples)]

def write(name, samples, amp=0.7):
    with wave.open(name, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(s * amp * 32767)) for s in samples))

write("piano_c.wav", play_note(261.63, 0.8, a=0.005, d=0.35, s=0.1, r=0.3))
write("organ_c.wav", play_note(261.63, 0.8, a=0.01, d=0.05, s=0.95, r=0.05))
print("wrote piano_c.wav and organ_c.wav — same note, two instruments")
```

Play both: the piano explodes and dies; the organ swells and holds. Same
frequency, same wave — the ADSR made them different instruments. (The release
extends past `duration`: the note's tail outlives the key press, exactly like a
real piano's damper.)

## What you now know

- **ADSR** = four numbers drawing a note's life: attack (rise), decay (settle),
  sustain (hold), release (fade after key-up).
- The envelope is **instrument personality as much as wave shape** — piano vs organ
  is four parameters.
- Release tails outlive key presses — the mechanics behind every synth's sustain
  pedal.

Next: one oscillator is lonely. Chords are *summed* oscillators — and summing
teaches the first law of mixing: headroom.
