---
layout: ../../layouts/Chapter.astro
title: 'What Is Search, Really?'
description: 'grep is a search engine that dies at scale. Build the naive version, watch it collapse, and name the three machines every search engine is built from.'
part: 'Part I — The Crawler'
written: true
---

You already own a search engine. This one:

```sh
grep -i "bayesian network" *.txt
```

It answers queries over a corpus. It's even *correct*. The entire discipline of search
engines is the list of ways `grep` fails as the corpus grows from ten files to ten
billion pages — and the three machines invented to fix it. This chapter builds the
naive version properly, breaks it with arithmetic, and names the machines. Everything
after this chapter is making those three fast, smart, and honest.

## The lie you were told

> "A search engine is a program that finds pages containing your words."

Finding pages containing your words is `grep` — solved since 1974. A search engine is
three separate machines stacked:

```text
1. CRAWLER   — fetches the corpus (the web crawls itself; you must go get it)
2. INDEX     — pre-computes "which documents contain which word" so queries
               never scan anything (the databases course's index, flipped)
3. RANKER    — orders the 14,000 matching documents by "how likely is THIS
               the page you meant" (TF-IDF, PageRank — Chapters 6–7)
```

grep only does step 2 badly. Google is steps 1–3 at planetary scale. Keep the three
machines separate in your head; the course builds each one.

## The arithmetic of doom

`grep` reads every document for every query. The cost model:

```text
query time = corpus size × read speed

your laptop, 10 MB of notes:    10 MB ÷ 1 GB/s   ≈ 0.01s     ✓ fine
one web server, 10 GB:          10 GB ÷ 1 GB/s   ≈ 10s       ✗ painful
the indexed web, ~100 PB:       100 PB ÷ 1 GB/s  ≈ 3 years   ✗ done
```

And it's worse than sequential: **every user pays the full cost again**, in parallel.
100 queries/second against a 10 GB corpus = 1 TB/s of reads. No disk does that. The
only escape is to *never scan* — to pre-compute, before any query exists, a structure
that answers "which documents contain word W?" by lookup. That structure is the
**inverted index** (Chapter 4), and it's the most consequential data structure you've
never built.

## The second problem: 14,000 answers

Even with instant lookup, a query like `python tutorial` matches millions of pages.
Returning them in random order is useless — users click the first three results or
nothing. So a search engine isn't "find documents", it's **rank documents**:

```text
grep:    returns all matches, unordered        — a finder
search:  returns the top 10 of 14,000, ordered — a ranker
```

Ranking is where the famous ideas live: TF-IDF ("a word matters if it's common *here*
and rare *everywhere*", Chapter 6), PageRank ("a page is important if important pages
link to it", Chapter 7). Both are formulas you'll compute by hand.

## Prove it to yourself

**1. Feel the O(n) collapse** — the naive engine, timed as the corpus grows:

```python
# naive.py — grep as a Python object, so we can watch it die
import time

def build_corpus(n_docs):
    docs = {}
    for i in range(n_docs):
        docs[f"doc{i}.txt"] = (
            f"the quick fox jumps {i} times. " * 50
            + ("bayesian networks for fun " * 10 if i % 1000 == 0 else ""))
    return docs

def search(docs, term):
    return [name for name, text in docs.items() if term in text]  # ← the O(n) scan

for n in (10_000, 100_000, 1_000_000):
    docs = build_corpus(n)
    t = time.time(); hits = search(docs, "bayesian")
    print(f"{n:>9,} docs: {len(hits):>3} hits in {time.time()-t:.3f}s")
```

Linear slope, every time. Now imagine 100 users querying per second — multiply the
whole table. This is the collapse, measured.

**2. Feel the ranking gap** — same query, two engines:

```sh
grep -il "python" *.md | head -3     # three files that MENTION python, any order
# a search engine would return: the tutorial, then the docs, then the mention
```

Both are "correct". Only one is useful — because **ranking is the product**.

**3. The three machines, spotted in the wild:**

```sh
# Elasticsearch is literally the three machines with dashboards:
#   crawler:   your app pushes/indexes documents      (machine 1, by proxy)
#   index:     Lucene's inverted index                (machine 2)
#   ranker:    BM25 scoring per query                 (machine 3, Chapter 6's cousin)
```

## The build: the spec for the course

Your mini-Google — built over the course — must do what `grep` cannot:

1. **Fetch** a small corner of the web itself (Chapter 2: the crawler, with manners).
2. **Answer** "which pages contain this word?" by lookup, not scan (Chapter 4: the
   inverted index — O(1)-ish, built once, queried forever).
3. **Order** results by relevance (Chapters 6–7: TF-IDF layered on PageRank).
4. **Show** why each result matches (Chapter 10: snippets with highlighted terms).
5. **Survive** 100 queries/second without breaking a sweat — because it never scans.

Keep `naive.py` around. Chapter 4 opens by indexing the same corpus, and the speedup
is the course's first receipt.

## What you now know

- A search engine = **crawler + inverted index + ranker**. grep is machine 2, done
  badly, with no corpus.
- Scanning dies by arithmetic: **corpus × queries = unavoidable collapse**; the
  inverted index replaces scanning with lookup.
- Returning matches is easy; **returning the top 10 in order is the product** —
  ranking is where search is won.
- The course's target: crawl, index, rank, serve — ~300 lines, tested against the
  naive engine.

Next: machine 1 — how you get a corpus when the corpus is the web. Crawlers, and the
surprisingly deep ethics of "please wait 5 seconds between requests."
