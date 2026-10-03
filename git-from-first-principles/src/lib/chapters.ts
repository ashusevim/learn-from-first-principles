export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Object Database',
  'Part II — The Mechanics',
  'Part III — Working with Others',
  'Part IV — Recovery & Mastery',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-key-value-store',
    order: 1,
    title: 'Git Is a Key-Value Store',
    blurb:
      'Blobs, SHA-1, and .git/objects. Git is not "version control software" — it is a content-addressed database, and you can talk to it directly.',
    part: 'Part I — The Object Database',
    written: true,
  },
  {
    slug: '02-trees-and-commits',
    order: 2,
    title: 'Trees & Commits: Snapshots, Not Diffs',
    blurb:
      'A commit points at a tree, a tree points at blobs. Build: craft a commit with plumbing commands, no git add in sight.',
    part: 'Part I — The Object Database',
    written: true,
  },
  {
    slug: '03-branches-and-head',
    order: 3,
    title: 'Branches & HEAD: It’s All Just Files',
    blurb:
      'A branch is a 41-character text file. HEAD is a symlink-by-convention. Build: create and switch branches by writing files.',
    part: 'Part I — The Object Database',
    written: true,
  },
  {
    slug: '04-the-index',
    order: 4,
    title: 'The Index: Staging Is a File',
    blurb:
      'The staging area is not a concept — it is a binary file you can read. Build: decode .git/index with ls-files --stage.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '05-packfiles-and-deltas',
    order: 5,
    title: 'Packfiles & Deltas: Why .git Is Small',
    blurb:
      'Loose objects get packed, and similar blobs become deltas. Build: verify-pack shows you the compression by hand.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '06-status-three-trees',
    order: 6,
    title: 'git status Demystified: The Three Trees',
    blurb:
      'HEAD, index, worktree — every status line is a comparison between two of them. Build: compute status with plumbing.',
    part: 'Part II — The Mechanics',
    written: true,
  },
  {
    slug: '07-remotes-and-the-dag',
    order: 7,
    title: 'Remotes: Copying Objects, Moving Pointers',
    blurb:
      'fetch/push are just "copy missing objects + update remote refs". Build: push to a bare repo and inspect both sides.',
    part: 'Part III — Working with Others',
    written: true,
  },
  {
    slug: '08-merge-three-way',
    order: 8,
    title: 'Merge: Three-Way and the Conflict Markers',
    blurb:
      'The merge base, both tips, and what the <<< markers really mean. Build: provoke a conflict and read its anatomy.',
    part: 'Part III — Working with Others',
    written: true,
  },
  {
    slug: '09-rebase-rewriting-history',
    order: 9,
    title: 'Rebase: Rewriting History',
    blurb:
      'Commits are immutable, so rebase builds new ones and moves your branch. Build: watch every hash change, then understand the golden rule.',
    part: 'Part III — Working with Others',
    written: true,
  },
  {
    slug: '10-reflog-recovery',
    order: 10,
    title: 'Reflog: Nothing Is Ever Lost',
    blurb:
      'Every move of HEAD is recorded for 90 days. Build: reset --hard your work into oblivion, then bring it back.',
    part: 'Part IV — Recovery & Mastery',
    written: true,
  },
  {
    slug: '11-hooks-worktrees-attributes',
    order: 11,
    title: 'Hooks, Worktrees & Attributes',
    blurb:
      'Executable scripts in .git/hooks, multiple checkouts, per-path rules. Build: a pre-commit hook that saves you from yourself.',
    part: 'Part IV — Recovery & Mastery',
    written: true,
  },
  {
    slug: '12-final-boss-mini-git',
    order: 12,
    title: 'Final Boss: mini-git in ~300 Lines',
    blurb:
      'init/add/commit/log/status — a working content-addressed VCS in one Python file. The course ends with you owning git.',
    part: 'Part IV — Recovery & Mastery',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Git on One Page',
    blurb:
      'The object database, refs, the index and the DAG on one page — the model, the plumbing, and the recovery commands.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on mini-git from Chapter 12 — objects, refs, merges, recovery. Each is checkable by you alone.',
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
