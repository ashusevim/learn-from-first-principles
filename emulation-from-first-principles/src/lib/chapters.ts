export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Machine',
  'Part II — Screen & Sound',
  'Part III — A Real Program',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-emulation',
    order: 1,
    title: 'What Is Emulation, Really?',
    blurb:
      'A foreign CPU is just data and a loop. Build: the CHIP-8 spec tour — memory, registers, and the emulator skeleton.',
    part: 'Part I — The Machine',
    written: true,
  },
  {
    slug: '02-fetch-decode-execute',
    order: 2,
    title: 'Fetch–Decode–Execute, Again — For Someone Else’s CPU',
    blurb:
      'The CPUs course’s loop, aimed at a foreign machine. Build: the CHIP-8 fetch-decode-execute skeleton running its first opcodes.',
    part: 'Part I — The Machine',
    written: true,
  },
  {
    slug: '03-opcode-decoding',
    order: 3,
    title: 'Opcode Decoding: The Wild Encodings',
    blurb:
      '35 opcodes decoded by nibble patterns, not byte boundaries. Build: the full opcode dispatcher.',
    part: 'Part I — The Machine',
    written: true,
  },
  {
    slug: '04-display-sprites',
    order: 4,
    title: 'Graphics: The 64×32 Display',
    blurb:
      'XOR sprites, the collision flag, and why old games flicker. Build: sprite drawing with VF, verified pixel by pixel.',
    part: 'Part II — Screen & Sound',
    written: true,
  },
  {
    slug: '05-timers-input',
    order: 5,
    title: 'Timers & Input: The Heartbeat',
    blurb:
      '60 Hz delay/sound timers and the key wait. Build: the timers ticking and keys blocking.',
    part: 'Part II — Screen & Sound',
    written: true,
  },
  {
    slug: '06-sound-beeper',
    order: 6,
    title: 'Sound: The Beeper',
    blurb:
      'The sound timer’s square wave through the audio course’s pipeline. Build: a beeper wired to the timer.',
    part: 'Part II — Screen & Sound',
    written: true,
  },
  {
    slug: '07-writing-programs',
    order: 7,
    title: 'Writing CHIP-8 Programs',
    blurb:
      'Hand-assembling a program — the CPUs course’s assembler, aimed at a foreign ISA. Build: a working CHIP-8 program.',
    part: 'Part III — A Real Program',
    written: true,
  },
  {
    slug: '08-roms-loading',
    order: 8,
    title: 'ROMs: Loading Real Software',
    blurb:
      'Public-domain ROMs run on your emulator — unmodified. Build: load, run, and screenshot real games.',
    part: 'Part III — A Real Program',
    written: true,
  },
  {
    slug: '09-debugging',
    order: 9,
    title: 'Debugging the Emulator',
    blurb:
      'Traces, breakpoints, and register dumps — the observability that makes emulation possible. Build: a debug mode.',
    part: 'Part III — A Real Program',
    written: true,
  },
  {
    slug: '10-quirks',
    order: 10,
    title: 'Why Emulation Is Hard: The Quirks',
    blurb:
      'Every CHIP-8 implementation disagrees on details — because the original hardware did. VF reset, shifting, memory pointer quirks.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-beyond-chip8',
    order: 11,
    title: 'Beyond CHIP-8: NES, Cycle Accuracy & Recompilation',
    blurb:
      'Timing-critical hardware, mid-scanline effects, dynamic recompilation — the emulation hierarchy.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-emulator',
    order: 12,
    title: 'Final Boss: The Complete Emulator in ~400 Lines',
    blurb:
      'Every chapter assembled: full CHIP-8 with display, sound, input — running real ROMs unmodified.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Emulation on One Page',
    blurb:
      'Fetch–decode–execute for someone else’s CPU on one page — the model, the opcode rules, the quirks, and the debug loop.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the CHIP-8 emulator from Chapter 12 — opcodes, sprites, timers, quirks. Each is checkable against real ROMs.',
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
