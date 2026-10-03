export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — One Core, Many Threads',
  'Part II — Waiting Efficiently',
  'Part III — Many Cores',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-two-threads-one-counter',
    order: 1,
    title: 'Two Threads, One Counter: The Race, On Camera',
    blurb:
      'counter++ is three instructions, and two threads interleave them. Build: lose a million updates on camera, then disassemble the crime scene.',
    part: 'Part I — One Core, Many Threads',
    written: true,
  },
  {
    slug: '02-locks-from-scratch',
    order: 2,
    title: 'Locks from Scratch',
    blurb:
      'Test-and-set is one atomic CPU instruction — everything else is ceremony. Build: a spinlock from an atomic swap.',
    part: 'Part I — One Core, Many Threads',
    written: true,
  },
  {
    slug: '03-mutexes-deadlocks',
    order: 3,
    title: 'Mutexes, Deadlocks & Lock Ordering',
    blurb:
      'Deadlocks are circular waits — mechanically preventable. Build: deadlock on demand, then fix it by ordering.',
    part: 'Part I — One Core, Many Threads',
    written: true,
  },
  {
    slug: '04-condition-variables',
    order: 4,
    title: 'Condition Variables & the Bounded Buffer',
    blurb:
      'How threads wait for "something happened" without spinning. Build: the producer/consumer pattern, the ancestor of every queue.',
    part: 'Part I — One Core, Many Threads',
    written: true,
  },
  {
    slug: '05-c10k-blocking-dies',
    order: 5,
    title: 'Blocking Is Expensive: Thread-per-Client Dies at 10k',
    blurb:
      'A blocked thread is a stack plus a kernel object — multiply by 10,000 clients. Build: measure C10K dying, byte by byte.',
    part: 'Part II — Waiting Efficiently',
    written: true,
  },
  {
    slug: '06-the-event-loop',
    order: 6,
    title: 'The Event Loop: One Thread, Ten Thousand Sockets',
    blurb:
      'epoll lets one thread watch 10k sockets and act only when ready. Build: an epoll echo server — the heart of nginx, redis, node.',
    part: 'Part II — Waiting Efficiently',
    written: true,
  },
  {
    slug: '07-async-await',
    order: 7,
    title: 'async/await Demystified',
    blurb:
      'await is a state machine in disguise. Build: async from scratch with Python generators — and the magic is gone.',
    part: 'Part II — Waiting Efficiently',
    written: true,
  },
  {
    slug: '08-green-threads',
    order: 8,
    title: 'Green Threads & Schedulers',
    blurb:
      'Go-style goroutines are user-space threads with tiny stacks. Build: a round-robin scheduler over generators.',
    part: 'Part II — Waiting Efficiently',
    written: true,
  },
  {
    slug: '09-atomics-memory-ordering',
    order: 9,
    title: 'Atomics & Memory Ordering',
    blurb:
      'Why your lock-free code works on your machine and explodes on theirs: compilers and CPUs reorder. The memory model, without theology.',
    part: 'Part III — Many Cores',
    written: true,
  },
  {
    slug: '10-lock-free-structures',
    order: 10,
    title: 'Lock-Free Structures & the ABA Problem',
    blurb:
      'CAS lets threads cooperate without locking — until memory plays tricks. Build: a lock-free stack, then break it with ABA.',
    part: 'Part III — Many Cores',
    written: true,
  },
  {
    slug: '11-concurrency-vs-parallelism',
    order: 11,
    title: 'Concurrency ≠ Parallelism (And the GIL)',
    blurb:
      'Concurrency is structure, parallelism is speed. Build: the same word-count concurrent (1 core) and parallel (N cores), timed.',
    part: 'Part III — Many Cores',
    written: true,
  },
  {
    slug: '12-final-boss-pool-and-server',
    order: 12,
    title: 'Final Boss: Thread Pool + Event Loop Web Server',
    blurb:
      'The hybrid every real server uses: event loop for sockets, thread pool for CPU work. Build: your own mini-Tokio.',
    part: 'Part III — Many Cores',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Concurrency on One Page',
    blurb:
      'Races, locks, event loops and atomics on one page — the model, the primitives, and the failure modes with their chapters.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the pool and event-loop server from Chapter 12 — races, deadlocks, benchmarks. Each is checkable by you alone.',
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
