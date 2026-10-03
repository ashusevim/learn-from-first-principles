export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Crawler',
  'Part II — The Index',
  'Part III — Serving & Scale',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-search',
    order: 1,
    title: 'What Is Search, Really?',
    blurb:
      'grep is a search engine that dies at scale. Build the naive version, watch it collapse, and name the three machines every search engine is built from.',
    part: 'Part I — The Crawler',
    written: true,
  },
  {
    slug: '02-the-crawler',
    order: 2,
    title: 'The Crawler: Politeness at Scale',
    blurb:
      'A frontier, robots.txt, deduplication, and rate limits. Build: a ~50-line crawler that respects the rules.',
    part: 'Part I — The Crawler',
    written: true,
  },
  {
    slug: '03-clean-and-index',
    order: 3,
    title: 'Cleaning & Tokenizing Documents',
    blurb:
      'Lowercase, tokenize, stem, stop-words — turning HTML into indexable terms. Build: a text pipeline from raw page to term list.',
    part: 'Part I — The Crawler',
    written: true,
  },
  {
    slug: '04-inverted-index',
    order: 4,
    title: 'The Inverted Index',
    blurb:
      'The data structure at the heart of every search engine: term → document list. Build: one from scratch, watch lookups become O(1).',
    part: 'Part II — The Index',
    written: true,
  },
  {
    slug: '05-query-processing',
    order: 5,
    title: 'Query Processing: AND, OR & Phrases',
    blurb:
      'Set operations over posting lists, phrase positions, fuzzy matching. Build: a boolean query engine over your index.',
    part: 'Part II — The Index',
    written: true,
  },
  {
    slug: '06-ranking-tfidf',
    order: 6,
    title: 'Ranking I: TF-IDF',
    blurb:
      'Why "important words" are rare words. Build: a TF-IDF ranker that puts the right page first.',
    part: 'Part II — The Index',
    written: true,
  },
  {
    slug: '07-pagerank',
    order: 7,
    title: 'Ranking II: PageRank',
    blurb:
      'Links as votes, power iteration on the link graph. Build: PageRank from scratch and watch authority emerge.',
    part: 'Part II — The Index',
    written: true,
  },
  {
    slug: '08-caching-dedup',
    order: 8,
    title: 'Caching, Dedup & Spam Resistance',
    blurb:
      'Duplicate documents, link farms, query caching — the adversarial side of search.',
    part: 'Part III — Serving & Scale',
    written: true,
  },
  {
    slug: '09-evaluation',
    order: 9,
    title: 'Evaluation: Precision, Recall & Judging Results',
    blurb:
      'Is your ranking "better"? Better than what? Build: precision/recall/F1 over a labeled test set.',
    part: 'Part III — Serving & Scale',
    written: true,
  },
  {
    slug: '10-snippets-highlighting',
    order: 10,
    title: 'Snippets & Highlighting',
    blurb:
      'The green text under every result. Build: a snippet generator that finds the best passage.',
    part: 'Part III — Serving & Scale',
    written: true,
  },
  {
    slug: '11-distributed-indexes',
    order: 11,
    title: 'Scale: Shards, Replicas & the Distributed Index',
    blurb:
      'Splitting the index across machines and merging results — the distributed systems course, applied.',
    part: 'Part III — Serving & Scale',
    written: true,
  },
  {
    slug: '12-final-boss-mini-google',
    order: 12,
    title: 'Final Boss: mini-Google in ~300 Lines',
    blurb:
      'Crawl → index → rank → serve: a working search engine over a real corpus, one Python file.',
    part: 'Part III — Serving & Scale',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Search Engines on One Page',
    blurb:
      'Crawl, index, query and rank on one page — the model, the formulas, the tradeoffs, and the evaluation discipline.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on mini-Google from Chapter 12 — crawl, index, query, rank. Each is checkable by you alone.',
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
