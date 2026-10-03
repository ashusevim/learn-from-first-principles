export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — From Electricity to Logic',
  'Part II — The Machine',
  'Part III — Running Programs',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-a-cpu',
    order: 1,
    title: 'What Is a CPU, Really?',
    blurb:
      'A fetch-decode-execute loop over instructions in memory — plus switches that compute. Build: the transistor-as-switch model and NAND from it.',
    part: 'Part I — From Electricity to Logic',
    written: true,
  },
  {
    slug: '02-nand-everything',
    order: 2,
    title: 'NAND Is Everything',
    blurb:
      'NOT, AND, OR, XOR — every gate composes from NAND alone. Build: the gate library, truth tables verified.',
    part: 'Part I — From Electricity to Logic',
    written: true,
  },
  {
    slug: '03-the-alu',
    order: 3,
    title: 'The ALU: Arithmetic in Gates',
    blurb:
      'Half-adder → full adder → 8-bit ripple carry, plus logic ops. Build: an ALU that adds, subtracts, and compares — in gates.',
    part: 'Part I — From Electricity to Logic',
    written: true,
  },
  {
    slug: '04-memory-registers',
    order: 4,
    title: 'Memory & Registers: Remembering Bits',
    blurb:
      'A loop that remembers: latches, flip-flops, registers. Build: 1-bit memory from gates, then an 8-bit register file.',
    part: 'Part II — The Machine',
    written: true,
  },
  {
    slug: '05-the-isa',
    order: 5,
    title: 'Designing the Instruction Set',
    blurb:
      'Bite-16: opcodes, operands, and the encoding. Build: the ISA table and a machine-code listing decoded by hand.',
    part: 'Part II — The Machine',
    written: true,
  },
  {
    slug: '06-fetch-decode-execute',
    order: 6,
    title: 'Fetch–Decode–Execute: The CPU Loop',
    blurb:
      'Program counter, instruction register, decode, run. Build: the CPU executing its first program — step by step.',
    part: 'Part II — The Machine',
    written: true,
  },
  {
    slug: '07-jumps-branches',
    order: 7,
    title: 'Jumps & Branches: Teaching the CPU If',
    blurb:
      'The program counter is writable — that’s all control flow is. Build: JUMP, JZ, and a loop in machine code.',
    part: 'Part III — Running Programs',
    written: true,
  },
  {
    slug: '08-call-stack',
    order: 8,
    title: 'Functions & the Call Stack',
    blurb:
      'CALL saves the return address; RET pops it. Build: the stack pointer, nested calls, recursion in machine code.',
    part: 'Part III — Running Programs',
    written: true,
  },
  {
    slug: '09-the-assembler',
    order: 9,
    title: 'The Assembler: Mnemonics to Machine Code',
    blurb:
      'Two passes: resolve labels, encode instructions. Build: an assembler for Bite-16 assembly.',
    part: 'Part III — Running Programs',
    written: true,
  },
  {
    slug: '10-buses-clocks-real-hardware',
    order: 10,
    title: 'Buses, Clocks & the Real Hardware',
    blurb:
      'Gigahertz is loop speed; caches are memory-hierarchy physics. Your simulator mapped to silicon.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-bite16-to-x86-riscv',
    order: 11,
    title: 'From Bite-16 to x86 & RISC-V',
    blurb:
      'CISC vs RISC, registers vs stacks, the real encodings — your ISA’s ideas at planetary scale.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-complete-cpu',
    order: 12,
    title: 'Final Boss: The Complete CPU in ~400 Lines',
    blurb:
      'Gates, ALU, registers, ISA, assembler, CPU — one file, running Fibonacci in machine code it assembled itself.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: CPUs on One Page',
    blurb:
      'Gates to ISA to running program, on one page — the model, the instruction set, the timing rule, and the bugs that come from real hardware.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on Bite-16 from Chapter 12 — gates, the ALU, the ISA, the assembler. Each is checkable by you alone.',
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
