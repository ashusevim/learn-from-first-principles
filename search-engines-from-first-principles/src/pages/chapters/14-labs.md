---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on mini-Google from Chapter 12 — crawl, index, query, rank. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in timings, rankings, or judged results from
mini-Google (`crawl`, `tokenize`, `Index`, `Ranker`, `snippet`, `MiniGoogle`).
Nothing here is new — politeness (Ch 2), the index (Ch 4), queries (Ch 5),
tf-idf (Ch 6), PageRank (Ch 7), evaluation (Ch 9). What is new is attacking
your own engine like the adversary and the user, on alternating labs.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Crawl one small friendly site (or the course's sample corpus);
keep the naive scan as the control group forever.

| Tool | What it proves |
|---|---|
| `MiniGoogle.search(q)` | the fast path, with printed timings |
| `Ranker.score / idf` | the arithmetic behind every ranking |
| a 20-query judged set (relevant / not) | precision and recall, computed by you |
| hand-made spam documents | the adversary's easiest wins |

## Warm-ups

**Lab 1.1 — Time the inversion**
**Goal:** the index's whole justification in two numbers.
**Do this:**
```python
g.search("python tutorial")     # prints mini-Google vs naive-scan side by side
```
**You'll know it works when:** mini-Google answers in single-digit milliseconds
while the scan reads most of the corpus. The ratio is Chapter 4's invoice.
**Where it comes from:** Chapter 12 — Final Boss: mini-Google in ~300 Lines.

**Lab 1.2 — idf, by hand**
**Goal:** the rare-term bonus as arithmetic you can verify.
**Do this:**
```python
for t in ("the", "page", "tokenizer", "crawl"):
    print(t, len(g.index.postings(t)), round(g.ranker.idf(t), 3))
```
**You'll know it works when:** `the` scores ~0 (in everything) and the rest
climb as df falls — idf is log(N/df), confirmed in your own corpus.
**Where it comes from:** Chapter 6 — Ranking I: TF-IDF.

**Lab 1.3 — Break the empty posting**
**Goal:** AND-queries die on absent terms — meet the edge case.
**Do this:** `g.search("quantum zoology")` (two words you never indexed).
**You'll know it works when:** zero results *and no crash* — an empty posting
intersected politely. If it throws, the empty set is your bug, not the user's.
**Where it comes from:** Chapter 5 — Query Processing: AND, OR & Phrases.

## Builds

**Lab 2.1 — Spam the tf, feel the saturation**
**Goal:** raw tf-idf is bribable; saturation is the antidote (Chapter 6).
**Do this:** index a page that repeats "crypto" 50 times over real content,
search "crypto", and rank it against an honest page under (a) raw tf-idf,
(b) a saturating score like tf/(tf+k).
**You'll know it works when:** raw tf-idf crowns the spam page; the saturating
score demotes it below the honest one. One formula change, one spam economy
closed.
**Where it comes from:** Chapter 6 — Ranking I: TF-IDF.

**Lab 2.2 — PageRank vs the query**
**Goal:** authority and relevance are different axes (Chapter 7).
**Do this:** compute PageRank over your crawled graph, then rank one query
purely by PageRank and purely by tf-idf, and diff the top 10.
**You'll know it works when:** the lists disagree — the "important" page is
sometimes wrong for the query. The fix (multiply, don't replace) is Chapter 7's
whole design lesson.
**Where it comes from:** Chapter 7 — Ranking II: PageRank.

**Lab 2.3 — Judge your own engine**
**Goal:** precision@5 and recall on a set *you* judged first (Chapter 9).
**Do this:** hand-label 20 queries' top results as relevant or not; compute
precision@5 and recall for each.
**You'll know it works when:** you have two honest numbers per query — and at
least one query where improving one number visibly hurt the other. That tension
is the product decision, now yours.
**Where it comes from:** Chapter 9 — Evaluation: Precision, Recall & Judging Results.

**Lab 2.4 — Snippets that prove the hit**
**Goal:** `snippet()` must show the matched words in context (Chapter 10).
**Do this:** search three queries with hits far into the document text; check
whether the matched terms appear in every snippet.
**You'll know it works when:** every snippet contains at least one query term
in context. A snippet that proves nothing is the fastest way to lose a click.
**Where it comes from:** Chapter 10 — Snippets & Highlighting.

**Lab 2.5 — Crawl politely, prove it**
**Goal:** the politeness delay and dedup, caught on the wire.
**Do this:** point `crawl` at a local test server that logs request times and
URLs; run with `delay=0.5` and inspect the log.
**You'll know it works when:** requests arrive ≥0.5s apart and no URL appears
twice. Then set `delay=0` and watch your own crawler become the outage it
could have caused.
**Where it comes from:** Chapter 2 — The Crawler: Politeness at Scale.

## Stretch goals

**Lab 3.1 — Shard the index**
**Goal:** scale's tax, paid by hand (Chapter 11).
**Do this:** split docs across two `Index` instances by hash, run one query
against both, merge scores, and confirm the ranking matches the unsharded
mini-Google.
**You'll know it works when:** top-k results are identical — plus a written
list of the new costs (two lookups, merge logic, one shard down = partial
answers). That list is the price of scale.
**Where it comes from:** Chapter 11 — Scale: Shards, Replicas & the Distributed Index.

**Lab 3.2 — Break freshness**
**Goal:** caches and staleness, staged (Chapter 8).
**Do this:** change a page's content after crawling, search for the new fact,
and observe the stale result; then add a re-crawl policy and re-test.
**You'll know it works when:** the stale answer appears confidently first, and
your re-crawl policy trades politeness budget for freshness. State the tradeoff
in one sentence — that sentence is the whole lab.
**Where it comes from:** Chapter 8 — Caching, Dedup & Spam Resistance.

## Self-checking without a grader

- **Timing labs** (1.1, 2.3): printed milliseconds vs the naive scan, computed
  precision/recall. The numbers are the verdict.
- **Arithmetic labs** (1.2, 2.1, 2.2): idf values, spam demotion, list diffs —
  each reproducible by hand in a notebook.
- **Judgment labs** (1.3, 2.4, 2.5, 3.1, 3.2): zero-result handling, snippet
  honesty, politeness gaps, shard-identical rankings, stated tradeoffs. If you
  can defend the sentence, the lab passed.

## What you now know

- **Every ranking is a formula you can hand-check** (Labs 1.2, 2.1–2.2) — which
  makes ranking bugs boring and spam economies visible.
- **Evaluation is a discipline, not a vibe** (Lab 2.3): your judged set is the
  only instrument that survives disagreement.
- **Politeness and freshness are the same budget** (Labs 2.5, 3.2) spent in
  opposite directions.
- Sharding is merge logic plus failure math (Lab 3.1) — understand both before
  you need either.

Next: read any search engine's public quality guidelines and map each rule to
a lab above — every "should" is a formula, a judgment, or a budget.
