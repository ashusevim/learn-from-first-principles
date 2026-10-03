# Task: write the two capstone chapters for `audio-dsp-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/audio-dsp-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/audio-dsp-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/audio-dsp-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Digital Audio on One Page'
description: 'Sound, synthesis and DSP compressed to one page: the model, the units, the pitfalls, and the decisions that separate beeps from music.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/audio-dsp-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the synthesizer from Chapter 12 — oscillators, envelopes, filters, aliasing. Each is checkable by ear or by plot.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the labs structure from the spec (§ "Chapter 2") — 3 warm-ups, 4-5 builds,
3 stretch goals, and 12 labs in total, each with **Goal** / **Do this** /
**You'll know it works when** / **Where it comes from**. Build every lab on artefacts
this course has already built.

## The course's chapter index — reference only these

| # | slug | title | part |
|---|------|-------|------|
| 1 | `01-what-is-sound` | What Is Sound, Really? | Part I — Sound as Data |
| 2 | `02-loudness-pitch` | Loudness & Pitch: Amplitude and Frequency | Part I — Sound as Data |
| 3 | `03-wave-shapes` | Waves: Sine, Square, Saw & Triangle | Part I — Sound as Data |
| 4 | `04-adsr-envelopes` | Envelopes: ADSR — How Notes Breathe | Part II — The Synthesizer |
| 5 | `05-mixing-superposition` | Mixing & Superposition | Part II — The Synthesizer |
| 6 | `06-sequencing` | Sequencing: Notes to Music | Part II — The Synthesizer |
| 7 | `07-dft` | The Frequency Domain: The DFT | Part III — Digital Signal Processing |
| 8 | `08-fft` | The FFT: Divide and Conquer | Part III — Digital Signal Processing |
| 9 | `09-filters` | Filters: Low-pass, High-pass & Beyond | Part III — Digital Signal Processing |
| 10 | `10-aliasing` | Sample Rates & Aliasing | Part IV — The Real World |
| 11 | `11-compression-mp3` | Compression: PCM to MP3, Conceptually | Part IV — The Real World |
| 12 | `12-final-boss-synthesizer` | Final Boss: A Complete Synthesizer in ~300 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Digital Audio on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
