---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Search Engines on One Page'
description: 'Crawl, index, query and rank on one page — the model, the formulas, the tradeoffs, and the evaluation discipline.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one inversion: **trade a slow scan for a fast lookup** —
pay at write time (crawl, tokenize, index) so read time is a dictionary hit
plus a score. The pipeline, the formulas, and the failure modes each earned.

## The one-page model

```text
  crawl (politeness) → tokenize → inverted index: term → {doc: tf}
     Ch 2                Ch 3            Ch 4
  query → AND/OR of postings → score = tf-idf (× PageRank) → snippet → top-k
          Ch 5                    Ch 6–7                    Ch 10
```

`Index.add` builds the postings; `Ranker.score` walks them. The naive scan
(Chapter 1) is the control group — every chapter exists to beat it, and
`MiniGoogle.search` prints the side-by-side timing that proves it did.

## The search engine you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `crawl(start, max_pages, delay)` | frontier + politeness delay + dedup | 2 |
| robots.txt + delay | the crawler's contract with servers | 2 |
| `tokenize(html)` | strip tags, lowercase, split — the vocabulary decision | 3 |
| stopword / stem decisions | shrink the vocabulary, lose some precision | 3 |
| `Index.add(doc_id, html)` | postings: `term → {doc: tf}` | 4 |
| `postings(term)` | the lookup that replaces the scan | 4–5 |
| AND / OR / phrase query | intersect, union, or position-check the postings | 5 |
| `idf(term)` = log(N/df) | rare terms are worth more | 6 |
| `score(terms, doc)` = Σ tf-idf | relevance as a sum you can hand-compute | 6 |
| PageRank | a link is a vote; the graph ranks authority | 7 |
| cache + dedup | don't re-fetch, don't re-index the same bytes | 8 |
| precision / recall | right answers vs all answers — never both maximal | 9 |
| `snippet(text, terms, w)` | the window that proves the hit | 10 |
| shards + replicas | split by doc, copy for survival | 11 |
| `MiniGoogle.search(query)` | the whole pipeline, one call, timed | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Crawling without delay or dedup | you DDoS a small site with your own politeness failure | Chapter 2 |
| Indexing markup tokens | `div` outranks the document's actual subject | Chapter 3 |
| Query terms ANDed with an empty posting | zero results, no explanation — handle the empty set | Chapter 5 |
| TF without saturation | repetition wins: the spammer's dream, the reader's loss | Chapter 6 |
| PageRank without crawl context | authority ≠ relevance for the query at hand | Chapter 7 |
| Caching unexpired stale pages | yesterday's news ranked confidently | Chapter 8 |
| Optimizing recall only | 10,000 results nobody opens — precision is the product | Chapter 9 |
| Snippets from the wrong window | the match is real; the excerpt proves nothing | Chapter 10 |
| One giant shard | the biggest machine dies slowest and most visibly | Chapter 11 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Any search at all | the inverted index — always the first move | the corpus is tiny — then scan and stop (Ch 1, 4) |
| Better ranking, no links | tf-idf with saturation (BM25's instinct) | you have a link graph — add PageRank (Ch 6–7) |
| Trustworthiness at scale | PageRank as one factor, not the verdict | the graph is gamed — links are votes, votes are bought (Ch 7) |
| Fresh results | crawl budget + cache TTLs per page class | freshness kills politeness — budget it (Ch 2, 8) |
| Provable quality | a judged query set: precision@k, recall | vibes — which is how search stays bad (Ch 9) |
| More documents | shard by document, replicate for reads | one box fits — distribution is a tax (Ch 11) |

## Prove it to yourself

**1. The index beats the scan:**

```python
g.search("python tutorial")   # prints mini-Google vs naive-scan timings —
                              # the gap IS Chapters 4–6, measured
```

**2. idf says what matters:**

```python
r = g.ranker
print(r.idf("the"), r.idf("tokenizer"))  # ~0.0 vs ~2.x — rare words carry queries
```

**3. A spammer's palindrome:**

```python
spam = "<html>crypto crypto crypto crypto real content here</html>"
print(g.ranker.score(["crypto"], g.index.add("spam", spam)))
# saturated scoring barely moves; raw tf-idf runs away — that gap is Ch 6
```

## What you now know

- **Search is a write-time investment:** crawl politely, tokenize sensibly,
  index everything — so queries are dictionary hits, not scans.
- **Ranking is arithmetic you can audit:** tf-idf per term, idf per corpus,
  PageRank per graph — no black box required (Ch 6–7).
- **Precision vs recall is a product decision**, made with a judged set, not
  a mood (Ch 9).
- Scale is sharding plus replicas plus the honesty to measure both (Ch 11).

Next: twelve labs that attack your own mini-Google — spam it, starve it,
shard it, and judge the results like a search engineer.
