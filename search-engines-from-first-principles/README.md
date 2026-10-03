# Search Engines from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds search engines from first principles — crawler,
inverted index, TF-IDF, PageRank — until Elasticsearch and Google stop being magic
boxes and become data structures you've personally written in toy form.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [The Web](../the-web-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Crawler**
1. What Is Search, Really? ✅
2. The Crawler: Politeness at Scale ✅
3. Cleaning & Tokenizing Documents ✅

**Part II — The Index**
4. The Inverted Index ✅
5. Query Processing: AND, OR & Phrases ✅
6. Ranking I: TF-IDF ✅
7. Ranking II: PageRank ✅

**Part III — Serving & Scale**
8. Caching, Dedup & Spam Resistance ✅
9. Evaluation: Precision, Recall & Judging Results ✅
10. Snippets & Highlighting ✅
11. Scale: Shards, Replicas & the Distributed Index ✅
12. Final Boss: mini-Google in ~300 Lines ✅ *(crawl → index → rank → serve)*

All 12 chapters are fully written, each with runnable benchmarks and a hands-on build.
Things you build along the way: the naive engine watched dying at scale, a polite
crawler, the normalization pipeline, an inverted index with a four-orders-of-magnitude
speedup receipt, boolean and phrase query engines, TF-IDF and PageRank rankers,
shingle-based dedup, a precision@k evaluation harness, a query-aware snippet
generator, a two-shard cluster with fan-out merge — and mini-Google itself.

## The rules of the course

1. **Start below the abstraction.** Before "use Elasticsearch", answer "what is an index, physically?"
2. **Nothing is magic.** Every ranking claim is a formula you can compute by hand.
3. **Build a toy version.** The finale: crawl → index → rank → serve in ~300 lines.
4. **Then the papers are readable.** The course ends where the PageRank paper begins to feel familiar.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
