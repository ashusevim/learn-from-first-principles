export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Matcher',
  'Part II — The Theory That Saves',
  'Part III — Beyond Matching',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-regex',
    order: 1,
    title: 'What Is a Regex, Really?',
    blurb:
      'A tiny language for describing sets of strings — matched by recursion. Build: the naive matcher for literals and the dot.',
    part: 'Part I — The Matcher',
    written: true,
  },
  {
    slug: '02-metacharacters',
    order: 2,
    title: 'Metacharacters: The Mini-Language',
    blurb:
      '*, +, ?, [], |, ^, $ — six symbols that describe infinite string sets. Build: the recursive matcher handling them all.',
    part: 'Part I — The Matcher',
    written: true,
  },
  {
    slug: '03-backtracking-trap',
    order: 3,
    title: 'The Backtracking Trap',
    blurb:
      '(a+)+b against "aaaaaaaaaaaaaaaaaaaa!" — exponential time, on camera. Build: the blowup, measured.',
    part: 'Part I — The Matcher',
    written: true,
  },
  {
    slug: '04-thompson-construction',
    order: 4,
    title: 'Thompson’s Construction: Regex to NFA',
    blurb:
      'Every regex operator becomes a tiny machine; composition builds the whole. Build: regex → NFA, piece by piece.',
    part: 'Part II — The Theory That Saves',
    written: true,
  },
  {
    slug: '05-nfa-simulation',
    order: 5,
    title: 'Simulating the NFA: Linear Time, Always',
    blurb:
      'Track a SET of states instead of one — and backtracking becomes impossible. Build: the simulation that kills Chapter 3’s blowup.',
    part: 'Part II — The Theory That Saves',
    written: true,
  },
  {
    slug: '06-subset-construction',
    order: 6,
    title: 'DFAs: The Subset Construction',
    blurb:
      'Precompute the state sets into a machine with one deterministic edge per input. Build: NFA → DFA, tables compared.',
    part: 'Part II — The Theory That Saves',
    written: true,
  },
  {
    slug: '07-capture-groups',
    order: 7,
    title: 'Capture Groups & Submatches',
    blurb:
      'Which text did each group match? The hardest problem in regex engines. Build: captures via a threaded backtracker.',
    part: 'Part III — Beyond Matching',
    written: true,
  },
  {
    slug: '08-the-assembled-engine',
    order: 8,
    title: 'The Engine, Assembled: Find, Search, Match All',
    blurb:
      'Parse → compile → simulate → find overlaps. Build: the complete finditer over real text.',
    part: 'Part III — Beyond Matching',
    written: true,
  },
  {
    slug: '09-greedy-vs-lazy',
    order: 9,
    title: 'Greedy vs Lazy: Who Eats What',
    blurb:
      'Why .* grabs everything and .*? grabs nothing — preference order, not magic. Build: both behaviors side by side.',
    part: 'Part III — Beyond Matching',
    written: true,
  },
  {
    slug: '10-real-engine-internals',
    order: 10,
    title: 'Real Engine Internals: PCRE vs RE2',
    blurb:
      'Backtracking (PCRE, Python) vs automata (RE2, Go/Rust): two philosophies, one guarantee difference.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-redos',
    order: 11,
    title: 'Security: ReDoS — The Regex Denial of Service',
    blurb:
      'A 30-character input can freeze a server for years of compute. Build: the attack, then the immune engine.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-complete-engine',
    order: 12,
    title: 'Final Boss: The Complete Regex Engine in ~300 Lines',
    blurb:
      'Parser → Thompson NFA → linear simulation → captures → finditer. The course ends with your own regex engine.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Regex on One Page',
    blurb:
      'The mini-language, the automata and the engines on one page — the model, the operators, and the trap that costs you.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the engine from Chapter 12 — NFA, captures, greediness, ReDoS. Each is checkable by you alone.',
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
