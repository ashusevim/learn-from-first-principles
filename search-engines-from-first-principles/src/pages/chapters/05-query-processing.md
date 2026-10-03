---
layout: ../../layouts/Chapter.astro
title: 'Query Processing: AND, OR & Phrases'
description: 'Set operations over posting lists, phrase positions, fuzzy matching. Build: a boolean query engine over your index.'
part: 'Part II — The Index'
written: true
---

Users type `python AND tutorial` (or just `python tutorial` — same thing to Google).
Your index (Chapter 4) stores posting lists per term. Query processing is **set
algebra over those lists**: AND is intersection, OR is union, NOT is difference. And
the sneakiest query — the *phrase* — needs one more thing your index must remember:
positions. Build the boolean engine and the phrase search.

## The lie you were told

> "AND finds pages containing both words."

AND finds pages containing both words *by intersecting sorted posting lists* — and
the intersect algorithm's cost depends on list lengths and merge strategy:

```text
"python" AND "tutorial":
  python:   [d3, d7, d12, d19, ...10⁶ entries]
  tutorial: [d2, d7, d19]

intersection = walk both sorted lists, keeping matches:
  d2? not in python's list. d3? not in tutorial's. d7 ✓ d19 ✓   → [d7, d19]
```

Skipping pointers (jump-ahead links inside long lists) and processing the *shortest
list first* are the classic speedups — Chapter 5 of the databases course's merge-join,
applied to text.

## Phrases: positions, not just presence

`"dog bites man"` must not match a page saying "man bites dog" — all three words are
there! Presence isn't enough; the words must be **adjacent, in order**. So each
posting must remember *where* the term occurred:

```text
"bites": {doc5: [positions: 3, 17], ...}
"man":   {doc5: [positions: 4, 16], ...}

phrase "bites man" matches doc5 — position 3 followed by position 4 ✓ (17,16 ✗)
```

This is why storing positions bloats the index (every occurrence, not every document)
— and why phrase queries are the expensive exception, not the rule.

## Prove it to yourself

**1. The phrase trap, without positions:**

```python
docs = {
    "d1": "dog bites man headline",
    "d2": "man bites dog story",
}
for d, txt in docs.items():
    words = txt.split()
    print(d, all(w in words for w in ["dog", "bites", "man"]))   # both True!
# presence-based search can't tell "dog bites man" from "man bites dog".
# The news desk would like a word.
```

**2. Intersect cost, watched** — shortest-list-first vs naive:

```python
import time
big, small = list(range(0, 1_000_000)), [7, 100_001, 999_999]
t = time.time()
naive = [d for d in big if d in small]        # O(|big| × |small|) membership checks
print(f"naive:  {1000*(time.time()-t):.1f} ms")
t = time.time()
merged = sorted(set(big) & set(small))        # hash/set: O(|big|) with tiny constants
print(f"merged: {1000*(time.time()-t):.1f} ms — and sorted sets merge even faster")
```

## The build: a boolean + phrase query engine

```python
# query.py — AND / OR / phrase over the Chapter 4 index (posting dicts carry positions)
from pipeline import terms

class QueryEngine:
    def __init__(self, index_with_positions):
        self.ix = index_with_positions      # term -> {doc: [positions]}

    def _postings(self, term):
        return self.ix.get(self._norm(term), {})
    def _norm(self, term): return term.lower()

    def AND(self, a, b):
        pa, pb = self._postings(a), self._postings(b)
        return {d: pa[d] & pb[d] if isinstance(pa[d], list) else d
                for d in pa.keys() & pb.keys()}           # set intersection of doc keys

    def OR(self, a, b):
        pa, pb = self._postings(a), self._postings(b)
        out = dict(pa)
        for d, pos in pb.items():
            out[d] = out.get(d, []) + pos
        return out

    def phrase(self, *words):                              # adjacency via positions
        candidates = self.AND(words[0], words[-1])
        hits = {}
        for d in candidates:
            first = self._postings(words[0]).get(d, [])
            rest = [self._postings(w).get(d, []) for w in words[1:]]
            for p in first:
                if all((p + k + 1) in rest[k] for k in range(len(rest))):
                    hits[d] = hits.get(d, 0) + 1
        return hits

ix = {   # positions included: term -> {doc: [occurrence positions]}
    "dog":   {"d1": [0], "d2": [2]},
    "bites": {"d1": [1], "d2": [1]},
    "man":   {"d1": [2], "d2": [0]},
}
qe = QueryEngine(ix)
print(qe.AND("dog", "man"))          # both docs contain both words
print(qe.phrase("dog", "bites", "man"))   # {'d1': 1} ← d2 correctly REJECTED
```

`d2` said "man bites dog" — same words, wrong order — and the position check rejected
it. Presence can't do that; **adjacency can**.

## What you now know

- Boolean queries = **set algebra over sorted posting lists** — intersect/union/
  difference, shortest-list-first, skipping pointers.
- **Phrases require positions** in the index — the cost of adjacency is index bloat.
- Query language design (AND as default, quoted phrases, OR) maps directly onto these
  three primitives.

Next: your engine finds documents — in whatever order the dict gives. Time for the
product: ordering by relevance. TF-IDF, the formula that made search useful.
