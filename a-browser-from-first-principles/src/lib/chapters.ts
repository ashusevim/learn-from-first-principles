export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Reading the Web',
  'Part II — Laying It Out',
  'Part III — A Real Browser',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-a-browser',
    order: 1,
    title: 'What Is a Browser, Really?',
    blurb:
      'A fetcher, a parser, a layout engine, and a painter — four programs wearing one icon. Build: the architecture map and the skeleton shell.',
    part: 'Part I — Reading the Web',
    written: true,
  },
  {
    slug: '02-tokenizer',
    order: 2,
    title: 'The Tokenizer: HTML as a State Machine',
    blurb:
      'Tag-open, attribute, text, script-data — a state machine that never rejects input. Build: a spec-shaped tokenizer with error recovery.',
    part: 'Part I — Reading the Web',
    written: true,
  },
  {
    slug: '03-tree-builder-dom',
    order: 3,
    title: 'The Tree Builder & the Live DOM',
    blurb:
      'Implicit tags, self-closing exceptions, foster parenting — the tree assembles itself. Build: a DOM with parents, children, and querying.',
    part: 'Part I — Reading the Web',
    written: true,
  },
  {
    slug: '04-css-cascade-engine',
    order: 4,
    title: 'The Cascade Engine: Specificity & Inheritance',
    blurb:
      'Matched rules compete by (a,b,c), inherited properties flow down. Build: a selector matcher and cascade resolver over your DOM.',
    part: 'Part I — Reading the Web',
    written: true,
  },
  {
    slug: '05-box-model-block-layout',
    order: 5,
    title: 'The Box Model & Block Layout',
    blurb:
      'Every element is a rectangle: content, padding, border, margin. Build: block layout with collapsing margins and real geometry.',
    part: 'Part II — Laying It Out',
    written: true,
  },
  {
    slug: '06-inline-layout',
    order: 6,
    title: 'Inline Layout & Text Wrapping',
    blurb:
      'Text flows, wraps, and shares lines — the hardest layout mode. Build: word-wrapped line boxes with mixed styles.',
    part: 'Part II — Laying It Out',
    written: true,
  },
  {
    slug: '07-forms-interactivity',
    order: 7,
    title: 'Forms & Interactivity',
    blurb:
      'Inputs, buttons, and events — the browser listens back. Build: clickable, typable form elements with submit handling.',
    part: 'Part II — Laying It Out',
    written: true,
  },
  {
    slug: '08-painting',
    order: 8,
    title: 'Painting: Colors, Borders & Text',
    blurb:
      'The layout tree becomes pixels — backgrounds, borders, glyphs, in z-order. Build: a painter over your layout tree.',
    part: 'Part II — Laying It Out',
    written: true,
  },
  {
    slug: '09-navigation-history',
    order: 9,
    title: 'Navigation & History',
    blurb:
      'Links, back/forward stacks, reloads — the browser as a state machine of visits. Build: clickable links with a history stack.',
    part: 'Part III — A Real Browser',
    written: true,
  },
  {
    slug: '10-urls-security',
    order: 10,
    title: 'The URL Bar: Fetching & the Security Boundary',
    blurb:
      'URL grammar, same-origin policy, mixed content — the address bar is the trust anchor. Build: URL parsing and origin checks.',
    part: 'Part III — A Real Browser',
    written: true,
  },
  {
    slug: '11-frame-budget',
    order: 11,
    title: 'Performance: The 16ms Frame Budget',
    blurb:
      'Style → layout → paint, and where your browser spends its milliseconds. Build: instrument every stage of your own pipeline.',
    part: 'Part III — A Real Browser',
    written: true,
  },
  {
    slug: '12-final-boss-complete-browser',
    order: 12,
    title: 'Final Boss: The Complete Browser',
    blurb:
      'Every chapter assembled: URL bar, tokenizer, DOM, cascade, layout, paint, links, history — one file, your browser.',
    part: 'Part III — A Real Browser',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: The Browser Pipeline on One Page',
    blurb:
      'The whole pipeline from bytes to pixels, compressed: the model, the stages you actually touch, the pitfalls, and where each is explained.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the mini browser from Chapter 12 — parse, layout, paint, and break it on purpose. Each is checkable by you alone.',
    part: 'Part IV — Practice & Reference',
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
