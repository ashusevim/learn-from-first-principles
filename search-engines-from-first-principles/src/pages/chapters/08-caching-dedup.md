---
layout: ../../layouts/Chapter.astro
title: 'Caching, Dedup & Spam Resistance'
description: 'Duplicate documents, link farms, query caching — the adversarial side of search.'
part: 'Part III — Serving & Scale'
written: true
---

Your engine assumes an honest corpus. The real web is ~60% duplicates (syndicated
articles, mirrored docs, boilerplate), littered with link farms built to poison
Chapter 7's PageRank, and hammered with repeated queries. This chapter builds the
immune system: **deduplication** (near-duplicate detection via shingling), **spam
resistance** (why damping + trust seeds help), and the **query cache** (Chapter 9 of
the web course's never-send-the-request, applied to search).

## The lie you were told

> "Duplicates are exact copies."

Exact duplicates die with a hash (Chapter 1 of the Git course: content-addressing).
The killers are **near-duplicates** — the same article republished with a new
headline, changed ads, and one edited paragraph. Byte hashes miss them completely.
The classic detector: **shingling** — hash overlapping word-windows and compare the
*sets*:

```text
doc → {shingles} = {"the quick brown", "quick brown fox", "brown fox jumps", ...}
Jaccard(A, B) = |A ∩ B| / |A ∪ B|     → 0.9+ means near-duplicate
```

Word-order changes barely move the shingle set; genuinely different documents share
almost no 3-word windows. One number, robust to small edits.

## Spam vs the ranker

Chapter 7's damping already defangs naive link farms (circular low-rank votes stay
low-rank). The adversarial counter-moves and the defenses:

| Spam move | Defense |
|---|---|
| Link farms (thousands of pages, all linking up) | damping + trust seeds (start iteration from a curated trusted set) |
| Keyword stuffing (TF-IDF poisoning) | content-quality signals, TF saturation (BM25) |
| Duplicate content everywhere | dedup: keep one canonical copy, merge its links |
| Cookie-cutter affiliate pages | near-duplicate clustering at crawl time (Chapter 2 saves the bandwidth) |

None are perfect — search is an arms race. But each defense is a mechanism, not magic.

## Prove it to yourself

**1. Byte-hash misses the near-duplicate, shingles catch it:**

```python
art1 = "the quick brown fox jumps over the lazy dog and runs away fast"
art2 = "the quick brown fox jumps over the lazy dog and runs away slowly today"  # edited!
print(art1 == art2)                                    # False — "not a duplicate"?!

def shingles(text, k=3):
    words = text.split()
    return {tuple(words[i:i+k]) for i in range(len(words) - k + 1)}

s1, s2 = shingles(art1), shingles(art2)
print(f"Jaccard similarity: {len(s1 & s2) / len(s1 | s2):.2f}")   # ~0.7-0.9: same article
```

**2. The query cache, timed** — the web course's Chapter 9, in search terms:

```python
import time
queries = {}
def cached_search(q):
    if q in queries: return queries[q]           # the repeat query: ~0 cost
    queries[q] = f"results for {q}"              # (real systems: TTL'd, like DNS Ch 2)
    return queries[q]
cached_search("python tutorial")                 # pays Chapter 6's ranking cost
cached_search("python tutorial")                 # ~free — and 20-30% of real queries ARE repeats
```

## The build: near-duplicate detection

```python
# dedup.py — shingling + Jaccard over a corpus, keeping one canonical copy
def shingles(text, k=3):
    words = text.split()
    return {tuple(words[i:i + k]) for i in range(max(len(words) - k + 1, 1))}

def jaccard(a, b):
    return len(a & b) / len(a | b)

def dedup(corpus, threshold=0.5):
    """corpus: {doc_id: text} → keep the FIRST of each near-duplicate cluster."""
    kept, fingerprints = [], []
    for doc_id, text in corpus.items():
        sig = shingles(text)
        if any(jaccard(sig, fp) >= threshold for fp in fingerprints):
            print(f"  duplicate: {doc_id} — dropped")
            continue
        fingerprints.append(sig)
        kept.append(doc_id)
    return kept

corpus = {
    "original":  "python tutorial covering lists dictionaries and loops with examples",
    "syndicated":"python tutorial covering lists dictionaries and loops with more examples!",
    "different": "a history of swiss cheese making in the alpine valleys",
}
print("kept:", dedup(corpus))
#   duplicate: syndicated — dropped
#   kept: ['original', 'different']
```

The syndicated copy (one word changed, an exclamation added) scores high Jaccard and
dies. The cheese article survives. That's the immune system working — and it ran at
crawl time, so the index (Chapter 4) never stored the junk.

## What you now know

- **Exact duplicates**: content hashes. **Near-duplicates**: shingling + Jaccard —
  robust to edits, cheap to compute.
- Spam resistance is layered: PageRank's **damping** defangs naive farms; trust seeds
  and content signals (BM25's saturation) handle the rest; the arms race never ends.
- The **query cache** absorbs the 20–30% of traffic that repeats — Chapter 9 of the
  web course, with a TTL.
- Dedup at *crawl* time saves index space, ranking quality, and the user's patience.

Next: "your ranking improved" — how would you *know*? Precision, recall, and the
numbers that turn opinions into engineering.
