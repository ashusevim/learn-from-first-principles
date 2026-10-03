---
layout: ../../layouts/Chapter.astro
title: 'Sound: The Beeper'
description: 'The sound timer’s square wave through the audio course’s pipeline. Build: a beeper wired to the timer.'
part: 'Part II — Screen & Sound'
written: true
---

The CHIP-8's sound hardware is the simplest possible: **while the sound timer is
nonzero, a beeper tone plays; when it hits zero, silence.** One bit of state — on or
off. But rendering that bit as audio is exactly the audio course's pipeline: a
square wave (Ch 3), envelope-shaped by the timer decay (Ch 4's ADSR), written to a
WAV (Ch 1). This chapter wires the emulator to the synthesizer you built.

## The lie you were told

> "Game sound requires a sound chip."

CHIP-8's "sound chip" is one bit: beeper on/off. The *tone quality* comes entirely
from the recording side — the emulator synthesizes a square wave while the timer is
nonzero. The audio course's lesson: **a square wave is a legal sound**, and the
envelope shapes it into something bearable.

## The wiring

```python
# the emulator's audio state: sound_timer > 0 → beeper ON
# the audio render, per frame (60 Hz):
#   if beeper ON: append a square-wave sample at 440 Hz (or whatever pitch)
#   else:         append silence
# the envelope: the timer ITSELF decays to zero — the decay IS the ADSR's release.
```

## Prove it to yourself

**1. The one-bit waveform, in samples:**

```python
# 60 timer ticks of beeper-ON at 440 Hz square wave:
# samples: [+amp] × 50, [−amp] × 50, repeating — the audio course's Ch 3 square!
# the emulator doesn't need a synthesizer — the beeper IS a square oscillator
# gated by the sound timer.
```

## The build: the beeper wired to the timer

```python
# beeper.py — the sound timer → square-wave audio (~25 lines)
import wave, math, struct

RATE = 44100
TIMER_HZ = 60
BEEP_FREQ = 440.0

def render_audio(sound_timer_per_frame, frames, amp=0.6):
    """sound_timer_per_frame: the timer value at each frame (60 Hz)"""
    samples = []
    phase = 0.0
    for frame, timer in enumerate(sound_timer_per_frame):
        frame_samples = RATE // TIMER_HZ                 # 735 samples per 60 Hz frame
        for _ in range(frame_samples):
            if timer > 0:
                samples.append(amp if (phase % 1) < 0.5 else -amp)   # square (Ch 3)
                phase += BEEP_FREQ / RATE
            else:
                samples.append(0.0)                      # silence: timer expired
    return samples

# simulate: a game sets the sound timer to 30 (half a second of beep):
timers = [30] * 30 + [0] * 30                     # beep for 30 frames, then silence
audio = render_audio(timers, len(timers))
peak_plateau = sum(1 for s in audio if abs(s) > 0.5)
print(f"{peak_plateau} samples of square-wave beep, {len(audio) - peak_plateau} of silence")
print("decay: the timer's countdown IS the envelope (Ch 4's release phase)")

with wave.open("beep.wav", "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in audio))
print("wrote beep.wav — the emulator's beeper, rendered")
```

The envelope insight: the timer's countdown *is* the release phase of Chapter 4's
ADSR — the beeper turns off exactly when the timer hits zero, giving a natural
hard release. A more musical emulator would add a fade (Ch 4's decay), but the
authentic 1977 behavior is the hard cut.

## What you now know

- The CHIP-8 beeper = **one bit gated by the sound timer** — the audio course's
  square wave, envelope-shaped by the timer countdown.
- The emulator's **audio pipeline** = the audio course composed: square oscillator
  (Ch 3) + timer-decay envelope (Ch 4) + WAV writing (Ch 1).
- The timer decay is the ADSR release phase — the envelope you built, now
  game-driven.

Next: the emulator runs — time to write *programs* for it. Hand-assembling CHIP-8
code: the CPUs course's assembler, aimed at a foreign ISA.
