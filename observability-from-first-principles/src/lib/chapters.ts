export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Three Pillars',
  'Part II — Traces & Costs',
  'Part III — Serving It',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-observability',
    order: 1,
    title: 'What Is Observability, Really?',
    blurb:
      'Three data types — logs, metrics, traces — answering three questions. Build: print to JSON lines, the structured logger born.',
    part: 'Part I — The Three Pillars',
    written: true,
  },
  {
    slug: '02-structured-logs',
    order: 2,
    title: 'Logs: Events with Context',
    blurb:
      'Levels, correlation ids, structured fields — logs as events, not strings. Build: a JSON-lines logger with correlation ids.',
    part: 'Part I — The Three Pillars',
    written: true,
  },
  {
    slug: '03-metrics',
    order: 3,
    title: 'Metrics: Numbers Over Time',
    blurb:
      'Counters, gauges, histograms — the three metric types. Build: a metrics registry and read a real histogram.',
    part: 'Part I — The Three Pillars',
    written: true,
  },
  {
    slug: '04-traces',
    order: 4,
    title: 'Traces: The Request’s Journey',
    blurb:
      'Spans, parent-child, timing per stage. Build: a trace model that shows where a request’s milliseconds went.',
    part: 'Part II — Traces & Costs',
    written: true,
  },
  {
    slug: '05-instrumenting',
    order: 5,
    title: 'Instrumentation: Wiring the Pillars In',
    blurb:
      'Logs, metrics, and traces on one real handler — correlated by ids. Build: the three pillars on one code path.',
    part: 'Part II — Traces & Costs',
    written: true,
  },
  {
    slug: '06-cardinality',
    order: 6,
    title: 'Cardinality: The Metric That Kills Your Backend',
    blurb:
      'A label per user id = millions of time series. Build: cardinality growth, measured.',
    part: 'Part II — Traces & Costs',
    written: true,
  },
  {
    slug: '07-sampling',
    order: 7,
    title: 'Sampling: You Can’t Keep Everything',
    blurb:
      'Head sampling, tail sampling — keep the interesting, drop the rest. Build: both strategies on a trace stream.',
    part: 'Part III — Serving It',
    written: true,
  },
  {
    slug: '08-alerting',
    order: 8,
    title: 'Alerting: Pages vs Tickets',
    blurb:
      'Alert fatigue is a design failure. Build: threshold vs SLO-burn alerts on synthetic metrics.',
    part: 'Part III — Serving It',
    written: true,
  },
  {
    slug: '09-slos-error-budgets',
    order: 9,
    title: 'SLOs & Error Budgets',
    blurb:
      'Reliability as a number you spend. Build: SLI → SLO → error budget, computed.',
    part: 'Part III — Serving It',
    written: true,
  },
  {
    slug: '10-opentelemetry',
    order: 10,
    title: 'OpenTelemetry: The Standard',
    blurb:
      'OTel’s model — your builds, standardized: the SDK, the protocol, the semantic conventions.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-the-stack',
    order: 11,
    title: 'The Observability Stack: Prometheus, Grafana, Jaeger',
    blurb:
      'Pull vs push, time-series databases, and the UIs — every tool mapped to your systems.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-observable-service',
    order: 12,
    title: 'Final Boss: The Observable Service in ~300 Lines',
    blurb:
      'A service with all three pillars wired, an incident injected — and debugged through the telemetry.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Observability on One Page',
    blurb:
      'Logs, metrics, traces and SLOs on one page — the model, the costs, the sampling rules, and the alerting discipline.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the observable service from Chapter 12 — logs, metrics, traces, SLOs. Each is checkable by you alone.',
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
