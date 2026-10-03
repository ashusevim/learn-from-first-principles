export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Model',
  'Part II — The Mechanics',
  'Part III — The Ecosystem',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-ui-as-a-function',
    order: 1,
    title: 'UI as a Function of State',
    blurb:
      'The declarative bet: stop mutating the DOM, describe the result. Build: the same counter imperatively and React-ively, side by side.',
    part: 'Part I — The Model',
    written: true,
  },
  {
    slug: '02-vdom-reconciliation',
    order: 2,
    title: 'The Virtual DOM & Reconciliation',
    blurb:
      'Why diff two trees instead of mutating one? Build: a virtual DOM with diff and patch in ~60 lines.',
    part: 'Part I — The Model',
    written: true,
  },
  {
    slug: '03-components-composition',
    order: 3,
    title: 'Components & Composition',
    blurb:
      'Functions that return UI trees, composed like functions compose. Build: components over your own vdom from Chapter 2.',
    part: 'Part I — The Model',
    written: true,
  },
  {
    slug: '04-usestate-demystified',
    order: 4,
    title: 'Hooks: useState Demystified',
    blurb:
      'State isn’t in the function — it’s in the renderer, keyed by call order. Build: useState from scratch on your Chapter 3 renderer.',
    part: 'Part I — The Model',
    written: true,
  },
  {
    slug: '05-useeffect-sync',
    order: 5,
    title: 'Effects: Synchronizing With the Outside',
    blurb:
      'Effects aren’t lifecycle callbacks — they’re “keep the world in sync” declarations. Build: an effect scheduler with cleanup.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '06-context-prop-drilling',
    order: 6,
    title: 'Context & Prop Drilling',
    blurb:
      'How a value reaches depth-7 components without 6 hop-throughs. Build: a toy context provider.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '07-keys-lists-diff',
    order: 7,
    title: 'Keys, Lists & Why the Diff Algorithm Cares',
    blurb:
      'The famous key warning is a diff-algorithm contract. Build: keyed vs unkeyed list diffing — watch state jump between rows.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '08-fiber-conceptually',
    order: 8,
    title: 'Fiber, Conceptually: Interruptible Rendering',
    blurb:
      'React 16 rewrote its stack into a heap so rendering could pause. Build: a time-sliced diff that yields.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '09-state-management',
    order: 9,
    title: 'State Management: Lifting, Stores & Signals',
    blurb:
      'Redux, Zustand, signals — the same problem, different granularity. Build: a 30-line store that beats prop drilling.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '10-server-components-suspense',
    order: 10,
    title: 'Server Components & Suspense',
    blurb:
      'Rendering on the server, streaming to the client. Build: a Suspense-style streaming skeleton demo.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '11-react-vs-signals',
    order: 11,
    title: 'React vs Signals vs Svelte',
    blurb:
      'Fine-grained reactivity vs vdom diffing — one primitive, two strategies. Build: the same app both ways, update-counted.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '12-final-boss-own-react',
    order: 12,
    title: 'Final Boss: Your Own React in ~200 Lines',
    blurb:
      'vdom + diff + hooks + function components, one file. The course ends with React you built yourself.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: React on One Page',
    blurb:
      'State, the diff, hooks and the scheduler on one page — the model, the rules, and the pitfalls with their chapters.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on your own React from Chapter 12 — diff, hooks, keys, scheduling. Each is checkable by you alone.',
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
