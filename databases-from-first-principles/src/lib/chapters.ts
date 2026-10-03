export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Data on Disk',
  'Part II — The Query Side',
  'Part III — Correctness & Scale',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-a-file-is-a-database',
    order: 1,
    title: 'A File Is a Database',
    blurb:
      'Append, scan, index the naive way — and watch every problem a real database exists to solve appear in miniature.',
    part: 'Part I — Data on Disk',
    written: true,
  },
  {
    slug: '02-pages-and-storage',
    order: 2,
    title: 'Pages: The Storage Engine’s Currency',
    blurb:
      'Databases never read rows — they read 4–16 KB pages. Build: a slotted-page writer that stores and fetches records.',
    part: 'Part I — Data on Disk',
    written: true,
  },
  {
    slug: '03-btrees',
    order: 3,
    title: 'B-Trees: The Index That Makes It Fast',
    blurb:
      'Why O(log n) disk seeks changed computing. Build: a working B-tree in ~100 lines, then watch a query stop scanning.',
    part: 'Part I — Data on Disk',
    written: true,
  },
  {
    slug: '04-wal-crash-safety',
    order: 4,
    title: 'WAL: Crash Safety in One Idea',
    blurb:
      'Log the change before you make it. Build: an append-only log + replay that survives a simulated crash.',
    part: 'Part I — Data on Disk',
    written: true,
  },
  {
    slug: '05-buffer-pool',
    order: 5,
    title: 'The Buffer Pool: Distrusting the OS',
    blurb:
      'Why databases bring their own memory manager (and evict your page cache’s assumptions). Build: an LRU page cache.',
    part: 'Part II — The Query Side',
    written: true,
  },
  {
    slug: '06-parse-and-plan',
    order: 6,
    title: 'SQL Without the Magic: Parse & Plan',
    blurb:
      'SELECT/WHERE/ORDER BY as scan → filter → sort operators. Build: a toy planner over your storage engine.',
    part: 'Part II — The Query Side',
    written: true,
  },
  {
    slug: '07-joins',
    order: 7,
    title: 'Joins: Nested Loops to Hash',
    blurb:
      'Why joining two big tables naively is O(n·m), and what a hash join buys. Build: both, timed.',
    part: 'Part II — The Query Side',
    written: true,
  },
  {
    slug: '08-transactions-acid',
    order: 8,
    title: 'Transactions: ACID Without the Buzzwords',
    blurb:
      'Atomicity, isolation, durability — each as a concrete mechanism, not an acronym. Build: a mini transaction wrapper on your WAL.',
    part: 'Part III — Correctness & Scale',
    written: true,
  },
  {
    slug: '09-mvcc',
    order: 9,
    title: 'MVCC: Databases That Never Block',
    blurb:
      'Readers never wait for writers — because every row carries its version history. Build: multi-version rows.',
    part: 'Part III — Correctness & Scale',
    written: true,
  },
  {
    slug: '10-beyond-btrees',
    order: 10,
    title: 'Beyond B-Trees: LSM & the Write Tradeoff',
    blurb:
      'Why Postgres and Cassandra make opposite bets. Build: a toy LSM tree — memtable, flush, compaction.',
    part: 'Part III — Correctness & Scale',
    written: true,
  },
  {
    slug: '11-replication-sharding',
    order: 11,
    title: 'Replication & Sharding: The Distributed Tax',
    blurb:
      'Copying data and splitting data — and the consistency bills both send you. The CAP tradeoff, made concrete.',
    part: 'Part III — Correctness & Scale',
    written: true,
  },
  {
    slug: '12-final-boss-toy-rdbms',
    order: 12,
    title: 'Final Boss: A Working Toy RDBMS',
    blurb:
      'Pages + B-tree index + WAL + a planner, in ~500 lines. INSERT/SELECT with crash safety. The course ends where Postgres began.',
    part: 'Part III — Correctness & Scale',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Databases on One Page',
    blurb:
      'Storage, indexes, WAL, transactions and MVCC on one page — the model, the tradeoffs, and the failure modes with their chapters.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the toy RDBMS from Chapter 12 — pages, B-trees, WAL, MVCC. Each is checkable by you alone.',
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
