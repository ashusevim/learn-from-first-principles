# Audio & DSP from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds digital audio from first principles — samples, WAV
files from raw bytes, oscillators, ADSR envelopes, the DFT computed from its
formula, the FFT raced against it, filters, aliasing — ending with a synthesizer
that plays actual music you wrote.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Graphics](../graphics-from-first-principles), [Compilers](../compilers-from-first-principles),
[LLMs](../llms-from-first-principles), [Cryptography](../cryptography-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Sound as Data**
1. What Is Sound, Really? ✅
2. Loudness & Pitch: Amplitude and Frequency ✅
3. Waves: Sine, Square, Saw & Triangle ✅

**Part II — The Synthesizer**
4. Envelopes: ADSR — How Notes Breathe ✅
5. Mixing & Superposition ✅
6. Sequencing: Notes to Music ✅

**Part III — Digital Signal Processing**
7. The Frequency Domain: The DFT ✅
8. The FFT: Divide and Conquer ✅
9. Filters: Low-pass, High-pass & Beyond ✅

**Part IV — The Real World**
10. Sample Rates & Aliasing ✅
11. Compression: PCM to MP3, Conceptually ✅
12. Final Boss: A Complete Synthesizer in ~300 Lines ✅ *(wavetables + ADSR + sequencer → music)*

All 12 chapters are fully written, each with runnable stdlib-Python builds writing
real WAV files. Things you build along the way: a sine WAV from raw bytes, octave
and amplitude dials demonstrated, the four wave shapes, three instrument ADSRs, a
C major chord with headroom, a sequencer playing Twinkle Twinkle, the DFT from its
formula finding hidden frequencies, the FFT raced at 1000×, FIR and IIR filters
FFT-verified, the aliasing ghost computed, spectral pruning like an MP3 encoder —
and a synthesizer playing a waltz.

## The rules of the course

1. **Start below the abstraction.** Before "use a synth app", answer "what is a sample, physically?"
2. **Nothing is magic.** Waves, envelopes, filters — formulas you compute and verify.
3. **Build the real thing.** Oscillators, ADSR, a sequencer — all stdlib Python.
4. **Then the theory is audible.** Nyquist, aliasing, MP3 — demonstrated in your own files.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
