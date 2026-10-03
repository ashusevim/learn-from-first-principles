export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Sound as Data',
  'Part II — The Synthesizer',
  'Part III — Digital Signal Processing',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-sound',
    order: 1,
    title: 'What Is Sound, Really?',
    blurb:
      'Pressure waves sampled into numbers; sample rate, Nyquist, and the WAV format. Build: a sine wave written from raw bytes — no libraries.',
    part: 'Part I — Sound as Data',
    written: true,
  },
  {
    slug: '02-loudness-pitch',
    order: 2,
    title: 'Loudness & Pitch: Amplitude and Frequency',
    blurb:
      'Two dials, one oscillator. Build: A440, octave doubling, amplitude fades — heard by reading the samples.',
    part: 'Part I — Sound as Data',
    written: true,
  },
  {
    slug: '03-wave-shapes',
    order: 3,
    title: 'Waves: Sine, Square, Saw & Triangle',
    blurb:
      'Every wave is sine harmonics stacked differently — that’s timbre. Build: all four shapes, spectra compared.',
    part: 'Part I — Sound as Data',
    written: true,
  },
  {
    slug: '04-adsr-envelopes',
    order: 4,
    title: 'Envelopes: ADSR — How Notes Breathe',
    blurb:
      'Attack, decay, sustain, release: amplitude over time. Build: an ADSR envelope shaping raw oscillators into notes.',
    part: 'Part II — The Synthesizer',
    written: true,
  },
  {
    slug: '05-mixing-superposition',
    order: 5,
    title: 'Mixing & Superposition',
    blurb:
      'Sounds add — and clip at ±1. Build: chords from summed oscillators, headroom and normalization.',
    part: 'Part II — The Synthesizer',
    written: true,
  },
  {
    slug: '06-sequencing',
    order: 6,
    title: 'Sequencing: Notes to Music',
    blurb:
      'Note names, frequencies, tempo, and timing. Build: a sequencer playing a real melody from note names.',
    part: 'Part II — The Synthesizer',
    written: true,
  },
  {
    slug: '07-dft',
    order: 7,
    title: 'The Frequency Domain: The DFT',
    blurb:
      'X-ray for sound: which frequencies live in a signal. Build: the DFT from its formula, peaks found.',
    part: 'Part III — Digital Signal Processing',
    written: true,
  },
  {
    slug: '08-fft',
    order: 8,
    title: 'The FFT: Divide and Conquer',
    blurb:
      'The DFT in O(n log n) — the most important algorithm you’ve never run. Build: FFT from recursion, raced against the DFT.',
    part: 'Part III — Digital Signal Processing',
    written: true,
  },
  {
    slug: '09-filters',
    order: 9,
    title: 'Filters: Low-pass, High-pass & Beyond',
    blurb:
      'Keep the frequencies you want, kill the rest. Build: moving-average and one-pole filters, spectra compared.',
    part: 'Part III — Digital Signal Processing',
    written: true,
  },
  {
    slug: '10-aliasing',
    order: 10,
    title: 'Sample Rates & Aliasing',
    blurb:
      'Sample too slowly and high frequencies disguise as low ones — Nyquist’s law. Build: the disguise, demonstrated.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-compression-mp3',
    order: 11,
    title: 'Compression: PCM to MP3, Conceptually',
    blurb:
      'What MP3 throws away and why you don’t notice — psychoacoustics as compression. Build: the spectral cutoff, heard as size.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-synthesizer',
    order: 12,
    title: 'Final Boss: A Complete Synthesizer in ~300 Lines',
    blurb:
      'Wavetables + ADSR + sequencer + effects, writing a WAV of actual music. The course ends with sound you made.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Digital Audio on One Page',
    blurb:
      'Sound, synthesis and DSP compressed to one page: the model, the units, the pitfalls, and the decisions that separate beeps from music.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the synthesizer from Chapter 12 — oscillators, envelopes, filters, aliasing. Each is checkable by ear or by plot.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
];

export function chapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chapterNeighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : undefined,
    next: i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : undefined,
  };
}
