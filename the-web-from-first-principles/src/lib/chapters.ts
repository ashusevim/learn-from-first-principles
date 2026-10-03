export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Pipe',
  'Part II — The Document',
  'Part III — Fast & Modern',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-one-page-load-traced',
    order: 1,
    title: 'One Page Load, Traced End to End',
    blurb:
      'Follow one URL from your fingers to pixels: DNS, TCP, TLS, HTTP, parse, paint — every hop named, every delay measured.',
    part: 'Part I — The Pipe',
    written: true,
  },
  {
    slug: '02-dns-in-the-browser',
    order: 2,
    title: 'DNS in the Browser: Caches All the Way Down',
    blurb:
      'Browser cache → OS cache → resolver → authority, plus DoH. Build: time each layer and watch the cache hierarchy save you.',
    part: 'Part I — The Pipe',
    written: true,
  },
  {
    slug: '03-tcp-tls-for-the-page',
    order: 3,
    title: 'TCP & TLS: The Connection Tax',
    blurb:
      'Handshakes before bytes: why the first request is slow and keep-alive pays rent. Build: count the round trips with curl timings.',
    part: 'Part I — The Pipe',
    written: true,
  },
  {
    slug: '04-http2-streams',
    order: 4,
    title: 'HTTP/2: One Connection, Many Streams',
    blurb:
      'Multiplexing, HPACK, stream priorities — and the head-of-line blocking it solved (and didn’t). Build: decode a real HTTP/2 session.',
    part: 'Part I — The Pipe',
    written: true,
  },
  {
    slug: '05-html-dom',
    order: 5,
    title: 'HTML Parsing & the DOM Tree',
    blurb:
      'Bytes → tokens → nodes → the live tree. Build: a tokenizer in ~60 lines that survives malformed HTML.',
    part: 'Part II — The Document',
    written: true,
  },
  {
    slug: '06-css-cascade',
    order: 6,
    title: 'CSS: Selectors, Specificity & the Cascade',
    blurb:
      'How one winning style emerges from ten rulesheets. Build: a specificity resolver that predicts every winner.',
    part: 'Part II — The Document',
    written: true,
  },
  {
    slug: '07-js-event-loop',
    order: 7,
    title: 'JavaScript: The Single Thread That Runs Everything',
    blurb:
      'Call stack, task queue, microtasks — the browser as an event loop (the concurrency course, wearing a DOM). Build: trace task order.',
    part: 'Part II — The Document',
    written: true,
  },
  {
    slug: '08-render-pipeline',
    order: 8,
    title: 'The Render Pipeline: Layout, Paint, Composite',
    blurb:
      'Why changing width is expensive and transform is free. Build: a DevTools performance walkthrough of reflow vs composite.',
    part: 'Part II — The Document',
    written: true,
  },
  {
    slug: '09-caching-headers',
    order: 9,
    title: 'Caching: The Headers That Save the World',
    blurb:
      'Cache-Control, ETag, 304s — the protocol’s memory. Build: request twice, watch the second cost nothing.',
    part: 'Part III — Fast & Modern',
    written: true,
  },
  {
    slug: '10-compression-images',
    order: 10,
    title: 'Compression & Images: Bytes on the Wire',
    blurb:
      'gzip, brotli, image formats — 90% of “site speed” is bytes. Build: measure every encoding against the same payload.',
    part: 'Part III — Fast & Modern',
    written: true,
  },
  {
    slug: '11-http3-quic',
    order: 11,
    title: 'HTTP/3 & QUIC: The UDP Gamble',
    blurb:
      'TCP in userspace over UDP: 0-RTT, no head-of-line blocking, migration. Build: compare TCP vs QUIC on a lossy link.',
    part: 'Part III — Fast & Modern',
    written: true,
  },
  {
    slug: '12-final-boss-mini-browser',
    order: 12,
    title: 'Final Boss: A Mini Browser in ~300 Lines',
    blurb:
      'Fetch → parse → style → layout → render to a window. The course ends with you drawing the web yourself.',
    part: 'Part III — Fast & Modern',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: The Web on One Page',
    blurb:
      'One page load, on one page — DNS, TCP and TLS, HTTP, the render pipeline, caching, and the headers that decide everything.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the mini browser from Chapter 12 — DNS, connections, caching, the render pipeline. Each is checkable by you alone.',
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
