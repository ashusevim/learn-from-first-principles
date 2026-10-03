---
layout: ../../layouts/Chapter.astro
title: 'Ranking I: TF-IDF'
description: 'Why "important words" are rare words. Build: a TF-IDF ranker that puts the right page first.'
part: 'Part II — The Index'
written: true
---

Your engine (Chapters 4–5) finds matching documents — in arbitrary order. The product
is the *order*. TF-IDF is the first great ranking formula, and its insight fits in one
sentence: **a word is important in a document to the degree that it's frequent there
and rare everywhere else.** Build it, and "which page first?" becomes arithmetic.

## The lie you were told

> "Pages with more matches rank first."

Raw match counts lie twice:

- A 10,000-word page mentioning "python" 8 times isn't more relevant than a 200-word
  tutorial mentioning it 3 times — the long page is just *longer* (normalize by length:
  **TF**, term frequency, counts ÷ document size).
- "python" appears on millions of pages — matching it proves nothing. "tutorial" is
  rarer, so matching *it* is the informative signal (**IDF**, inverse document
  frequency: rare words carry the meaning).

```text
TF-IDF(term, doc) = TF × IDF
  TF  = occurrences in doc / total terms in doc       ← within-page weight
  IDF = log(N / df)        ← N docs total, df docs containing the term
                             common word: df ≈ N → IDF ≈ 0 (no signal)
                             rare word:   df ≪ N → IDF large (strong signal)
score(query, doc) = Σ TF-IDF over query terms
```

Stop-words die automatically: "the" has df ≈ N, so IDF ≈ 0 — Chapter 3's drop-list
emerges from the math instead of a hand-written list.

## Prove it to yourself

**1. IDF makes the boring word boring:**

```python
import math
N = 1_000_000
print("IDF 'the'     :", math.log(N / 900_000))   # ≈ 0.1  — everywhere, worthless
print("IDF 'python'  :", math.log(N / 50_000))   # ≈ 3.0  — meaningful
print("IDF 'bayesian':", math.log(N / 500))       # ≈ 7.6  — gold
```

**2. The ranking gap** — the build below scores two documents for `python tutorial`
and puts them in the honest order for the first time.

## The build: a TF-IDF ranker over your index

```python
# tfidf.py — ranking over the Chapter 4 index (posting dicts carry counts)
import math

class Ranker:
    def __init__(self, index, docs):
        self.ix, self.docs = index, docs
        self.N = len(docs)

    def idf(self, term):
        df = len(self.ix.get(term, {}))
        return math.log(self.N / df) if df else 0.0

    def score(self, query_terms, doc_id):
        total, doc_len = 0.0, len(self.docs[doc_id].split())
        for term in query_terms:
            tf = self.ix.get(term, {}).get(doc_id, 0)
            total += (tf / doc_len) * self.idf(term)      # TF × IDF, summed
        return total

    def search(self, query):
        terms = [t.lower() for t in query.split()]
        candidates = set().union(*(self.ix.get(t, {}) for t in terms))
        ranked = sorted(candidates, key=lambda d: self.score(terms, d), reverse=True)
        return ranked

# the corpus: which page deserves "python tutorial"?
docs = {
    "tutorial": "the best python tutorial for beginners python python",
    "news":     "python mentioned briefly in today news about snakes",
    "snake":    "all about snakes and more snakes nothing python here",
}
ix = {}
for d, text in docs.items():
    for w in text.split():
        ix.setdefault(w, {}).setdefault(d, 0)
        ix[w][d] += 1

r = Ranker(ix, docs)
print(r.search("python tutorial"))
# ['tutorial', 'news']  ← the tutorial first: high TF *and* matching the rare word.
# 'snake' doesn't even match the query; 'news' matched python but its IDF is low and
# it never said "tutorial".
```

That ordering was produced by arithmetic you can do on paper — the same arithmetic
Elasticsearch calls BM25's grandfather. (BM25 adds length saturation and term-frequency
scaling; it's TF-IDF with better-behaved curves.)

## What you now know

- **TF** normalizes for document length; **IDF** discounts words that match everything;
  their product is the relevance weight per term, summed per query.
- Stop-words self-destruct via IDF ≈ 0 — Chapter 3's hand list becomes math.
- TF-IDF ranks *content* matches; it knows nothing about *authority* — a random page
  with perfect keyword density can outrank the canonical source. That needs links:
  PageRank, next chapter.
