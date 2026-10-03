export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — From Text to Structure',
  'Part II — Making It Run',
  'Part III — The Bytecode VM',
  'Part IV — A Real Language',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-a-compiler',
    order: 1,
    title: 'What Is a Compiler, Really?',
    blurb:
      'Four programs in a chain: lexer, parser, evaluator/compiler, runtime. Build: the pipeline map and our language “Bite” — its syntax tour.',
    part: 'Part I — From Text to Structure',
    written: true,
  },
  {
    slug: '02-the-lexer',
    order: 2,
    title: 'The Lexer: Characters to Tokens',
    blurb:
      'Numbers, strings, identifiers, keywords, operators — with line tracking for errors. Build: Bite’s complete lexer, token stream inspected.',
    part: 'Part I — From Text to Structure',
    written: true,
  },
  {
    slug: '03-the-parser',
    order: 3,
    title: 'The Parser: Grammar to AST',
    blurb:
      'Recursive descent: one function per grammar rule, precedence by layering. Build: Bite’s parser producing a printable AST.',
    part: 'Part I — From Text to Structure',
    written: true,
  },
  {
    slug: '04-tree-walking-interpreter',
    order: 4,
    title: 'The Tree-Walking Interpreter',
    blurb:
      'Walk the AST, compute results — the language RUNS. Build: an evaluator that turns Bite into a calculator, then more.',
    part: 'Part II — Making It Run',
    written: true,
  },
  {
    slug: '05-variables-environments',
    order: 5,
    title: 'Variables & Environments',
    blurb:
      'Names live in environments — linked hash maps that also ARE scoping. Build: define, assign, and watch scope shadows work.',
    part: 'Part II — Making It Run',
    written: true,
  },
  {
    slug: '06-control-flow',
    order: 6,
    title: 'Control Flow: If, While & Turing Completeness',
    blurb:
      'Conditionals and loops make the language universal. Build: if/else and while in the interpreter — recursion works for free.',
    part: 'Part II — Making It Run',
    written: true,
  },
  {
    slug: '07-compiling-to-bytecode',
    order: 7,
    title: 'Compiling to Bytecode',
    blurb:
      'The tree walk is slow; compile the AST to a flat instruction list. Build: Bite’s compiler emitting stack-machine bytecode.',
    part: 'Part III — The Bytecode VM',
    written: true,
  },
  {
    slug: '08-the-stack-machine',
    order: 8,
    title: 'The Stack Machine: Bytecode That Runs',
    blurb:
      'Push, pop, add — the VM is 40 instructions from being Python. Build: the VM executing Chapter 7’s bytecode, speed compared.',
    part: 'Part III — The Bytecode VM',
    written: true,
  },
  {
    slug: '09-jumps-and-functions',
    order: 9,
    title: 'Jumps, Control Flow & Functions in the VM',
    blurb:
      'Loops become backwards jumps; calls become frames. Build: if/while/functions compiled and running on the stack machine.',
    part: 'Part III — The Bytecode VM',
    written: true,
  },
  {
    slug: '10-closures',
    order: 10,
    title: 'Closures: Functions That Remember',
    blurb:
      'A function capturing its birth environment — the deepest idea in language design. Build: closures working in the VM.',
    part: 'Part IV — A Real Language',
    written: true,
  },
  {
    slug: '11-errors-and-diagnostics',
    order: 11,
    title: 'Errors & Diagnostics: Talking to Humans',
    blurb:
      '“Syntax error” is a failure of care. Build: line-numbered errors, caret pointers, and a REPL.',
    part: 'Part IV — A Real Language',
    written: true,
  },
  {
    slug: '12-final-boss-complete-toolchain',
    order: 12,
    title: 'Final Boss: The Complete Toolchain in ~400 Lines',
    blurb:
      'Lexer → parser → compiler → VM, one file — Bite runs programs, with functions, closures, and errors that point at your typos.',
    part: 'Part IV — A Real Language',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Compilers on One Page',
    blurb:
      'The whole pipeline — lexer, parser, VM, closures — on one page: the model, the stages, the invariants, and the classic bugs.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the toolchain from Chapter 12 — lex, parse, compile, disassemble. Each is checkable by you alone.',
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
