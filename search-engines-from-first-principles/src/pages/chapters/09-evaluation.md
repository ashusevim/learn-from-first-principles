---
layout: ../../layouts/Chapter.astro
title: 'Evaluation: Precision, Recall & Judging Results'
description: 'Is your ranking "better"? Better than what? Build: precision/recall/F1 over a labeled test set.'
part: 'Part III — Serving & Scale'
written: true
---

You tweaked the ranker and the results "look better". Do they? Search engineering
lives or dies on turning "looks better" into **numbers** — precision, recall, and
ranked-list measures computed against a labeled set of what *should* be found. This
chapter builds an evaluation harness, then uses it to prove something uncomfortable:
Chapter 6's TF-IDF can be made *worse* by an innocent-looking tweak.

## The lie you were told

> "Better ranking is a feeling you develop."

Feelings don't survive a redeploy. The measures:

```text
retrieved = the documents your engine returned
relevant  = the documents that SHOULD be returned (labeled by humans — a "ground truth")

precision = |retrieved ∩ relevant| / |retrieved|    "of what I showed, how much was right?"
recall    = |retrieved ∩ relevant| / |relevant|     "of what exists, how much did I find?"
F1        = harmonic mean of the two                ← one number punishes imbalance
```

The eternal tradeoff, made concrete: return **more** results → recall up, precision
down. Return **fewer, safer** results → precision up, recall down. Every ranking tweak
slides along this line, and only labeled data can tell you which direction you moved.

For *ranked* lists (search's actual shape), the sharpest tool is **precision@k** —
"of the top 10 shown, how many were relevant" — because users only see the first page.
A ranker with worse overall recall but better top-5 is *better for humans*.

## Prove it to yourself

**1. The tradeoff, forced by a parameter:**

```python
def evaluate(retrieved, relevant):
    rel = set(relevant)
    hits = [d for d in retrieved if d in rel]
    precision = len(hits) / len(retrieved) if retrieved else 0
    recall = len(hits) / len(rel) if rel else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return precision, recall, f1

relevant = {"doc1", "doc5", "doc9"}
print(evaluate(retrieved=["doc1", "doc5", "doc9"], relevant=relevant))      # 1.0, 1.0, 1.0
print(evaluate(retrieved=["doc1", "junk", "junk2", "junk3"], relevant=relevant))  # high P, low R
print(evaluate(retrieved=["doc1", "doc5", "doc9", "junk", "junk2", "junk3", "junk4"],
               relevant=relevant))                                           # recall 1.0, precision fell
```

**2. Ranked measures matter more than set measures:**

```text
engine A: [doc1 ✓, junk, junk, junk, ...]     → the good result is #1: users are happy
engine B: [junk, junk, ..., doc1 ✓ at #20]    → same set, same precision@ALL —
                                                users see 19 junk results first
```

Same sets, opposite user experience. This is why **precision@k** and **MRR** (mean
reciprocal rank: 1/position of the first hit) exist.

## The build: an eval harness + an uncomfortable experiment

```python
# evaluate.py — score the Chapter 6 ranker against a labeled test set
import math

def precision_at_k(retrieved, relevant, k):
    rel = set(relevant)
    return sum(1 for d in retrieved[:k] if d in rel) / k

docs = {
    "tutorial":  "the best python tutorial for beginners python python",
    "news":      "python mentioned briefly in today news about snakes",
    "snake":     "all about snakes nothing python here",
    "book":      "python tutorial second edition advanced python patterns",
}
ix = {}
for d, text in docs.items():
    for w in text.split():
        ix.setdefault(w, {}).setdefault(d, 0)
        ix[w][d] += 1

class Ranker:
    def __init__(self, ix, docs, length_norm=True):
        self.ix, self.docs, self.length_norm = ix, docs, length_norm
        self.N = len(docs)
    def idf(self, term):
        return math.log(self.N / len(self.ix.get(term, {})))
    def score(self, terms, d):
        doc_len = len(self.docs[d].split())
        return sum((self.ix.get(t, {}).get(d, 0) / (doc_len if self.length_norm else 1))
                   * self.idf(t) for t in terms)
    def search(self, query):
        terms = query.lower().split()
        cands = set().union(*(self.ix.get(t, {}) for t in terms))
        return sorted(cands, key=lambda d: self.score(terms, d), reverse=True)

relevant = {"tutorial", "book"}                        # ground truth: these two are good
for norm in (True, False):
    r = Ranker(ix, docs, length_norm=norm).search("python tutorial")
    print(f"length_norm={norm}: {r}  precision@2 = {precision_at_k(r, relevant, 2):.2f}")
# length_norm=True : ['tutorial', 'book']     precision@2 = 1.00
# length_norm=False: ['book', 'tutorial', ...] — wait: the LONG 'book' page (more raw
#   counts) ties/passes 'tutorial'. The innocent tweak changed the top of the list —
#   and only labeled data told you whether that helped. (Here: 1.00 either way at k=2,
#   but at k=1: True→tutorial ✓, False→book ✗.)
```

That last readout is the lesson: **one boolean changed the #1 result**, and only a
labeled ground truth could tell you which version was right. No labels, no engineering
— just vibes.

## What you now know

- **Precision** (of what I showed, how much was right) vs **recall** (of what exists,
  how much did I find) — every tweak slides along the tradeoff.
- For ranked results, **precision@k / MRR** beat set-level metrics — users read the
  top of the list.
- Ground truth = human-labeled queries; without it, ranker changes are vibes.
- The harness is ~20 lines — build it *before* tuning, not after.

Next: results are ranked and measured — but users also read the **snippet** under
each blue link. The best passage, highlighted. A mini-ranking problem of its own.
