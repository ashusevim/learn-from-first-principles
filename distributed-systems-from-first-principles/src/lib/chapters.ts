export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Ground Rules',
  'Part II — Consensus (Raft)',
  'Part III — Beyond One Cluster',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-two-generals',
    order: 1,
    title: 'Two Generals & Why Networks Lie',
    blurb:
      'Messages get lost, delayed, and reordered — and no protocol can fix it. Build: a flaky channel and your first taste of irreducible doubt.',
    part: 'Part I — The Ground Rules',
    written: true,
  },
  {
    slug: '02-clocks-are-a-lie',
    order: 2,
    title: 'Clocks Are a Lie (Use Logical Ones)',
    blurb:
      'Physical clocks skew by milliseconds; distributed order can’t be timed into existence. Build: Lamport clocks that order events without wall time.',
    part: 'Part I — The Ground Rules',
    written: true,
  },
  {
    slug: '03-failure-detectors',
    order: 3,
    title: 'Failure Detectors: Knowing When a Node Is Dead (You Can’t)',
    blurb:
      'A timeout means "no news" — crashed, slow, or partitioned? Build: a heartbeat detector and enumerate every wrong verdict it can produce.',
    part: 'Part I — The Ground Rules',
    written: true,
  },
  {
    slug: '04-replicated-log',
    order: 4,
    title: 'The Replicated Log: The Problem Everything Solves',
    blurb:
      'Every distributed database is a state machine + an agreed log. Build: state machines that diverge without agreement.',
    part: 'Part II — Consensus (Raft)',
    written: true,
  },
  {
    slug: '05-raft-leader-election',
    order: 5,
    title: 'Raft I: Leader Election',
    blurb:
      'Terms, votes, majorities, and why randomized timeouts end stalemates. Build: a toy election that survives node crashes.',
    part: 'Part II — Consensus (Raft)',
    written: true,
  },
  {
    slug: '06-raft-log-replication',
    order: 6,
    title: 'Raft II: Log Replication & the Commit Rule',
    blurb:
      'AppendEntries, majority acks, and the safety checks that stop divergent histories. Build: a replicated log that heals after a leader dies.',
    part: 'Part II — Consensus (Raft)',
    written: true,
  },
  {
    slug: '07-split-brain-quorums',
    order: 7,
    title: 'Split Brains & Quorums',
    blurb:
      'A 5-node cluster partitions 3/2. Why the majority side lives, the minority freezes, and the intersection rule makes it safe. Build: a partition harness.',
    part: 'Part II — Consensus (Raft)',
    written: true,
  },
  {
    slug: '08-consistent-hashing',
    order: 8,
    title: 'Consistent Hashing & Sharding the Ring',
    blurb:
      'Sharding by modulo collapses when a node joins. Build: a hash ring with virtual nodes — watch keys move 1/N, not all.',
    part: 'Part III — Beyond One Cluster',
    written: true,
  },
  {
    slug: '09-gossip',
    order: 9,
    title: 'Gossip & Anti-Entropy',
    blurb:
      'How Cassandra learns cluster state with no coordinator: rumor spreads like disease. Build: an epidemic dissemination simulator.',
    part: 'Part III — Beyond One Cluster',
    written: true,
  },
  {
    slug: '10-two-phase-commit',
    order: 10,
    title: 'Two-Phase Commit & the Coordinator’s Dilemma',
    blurb:
      'The simplest multi-node transaction protocol — and why its coordinator crash can freeze everything. Build: 2PC, then break it.',
    part: 'Part III — Beyond One Cluster',
    written: true,
  },
  {
    slug: '11-vector-clocks',
    order: 11,
    title: 'Vector Clocks & Conflict Resolution',
    blurb:
      'When two writes happen “at the same time”, someone must merge. Build: vector clocks that detect concurrency, Dynamo-style.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-toy-raft',
    order: 12,
    title: 'Final Boss: A Toy Raft in ~400 Lines',
    blurb:
      'Elections, replication, and partition survival in one Python file. The course ends with consensus you built yourself.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Distributed Systems on One Page',
    blurb:
      'Clocks, quorums, Raft and consistency on one page — the model, the invariants you must hold, and the lies networks tell.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the toy Raft from Chapter 12 — elections, partitions, quorums, crashes. Each is checkable by you alone.',
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
