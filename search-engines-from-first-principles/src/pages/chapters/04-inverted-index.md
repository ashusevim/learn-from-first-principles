---
layout: ../../layouts/Chapter.astro
title: 'The Inverted Index'
description: 'The data structure at the heart of every search engine: term → document list. Build: one from scratch, watch lookups become O(1).'
part: 'Part II — The Index'
written: true
---

Chapter 1's engine scanned every document per query — the arithmetic of doom. The
inverted index is the escape: **flip the world**. Instead of "document → which words it
contains", store "word → which documents contain it", built once before any query
exists. A query becomes a dictionary lookup instead of a scan. This is the databases
course's index chapter, run in reverse — and it's the data structure Elasticsearch,
Lucene, and every search box on Earth is built on.

## The lie you were told

> "Search scans documents for your terms."

Scan-based search dies at scale (Chapter 1's arithmetic). The inverted index pays
once, at write time:

```text
documents:                       inverted index:
doc1: "the quick fox"   ──►      "fox":    [doc1, doc3]
doc3: "fox and dog"     ──►      "quick":  [doc1]
                                 "dog":    [doc3]
query "fox" → lookup → [doc1, doc3]. No scan. Ever.
```

The list after each term is a **posting list** — sorted document ids, so set
operations (Chapter 5) are fast merges. Adding doc frequency counts to each posting
gives you the raw material for ranking (Chapter 6).

## The build cost is the trade

Indexing isn't free — you pay at write time to make reads cheap:

```text
write: tokenize + dictionary update       O(terms in document)
read:  dictionary lookup + list fetch     O(matching docs)   ← independent of corpus size!
```

That asymmetry — expensive writes, constant-ish reads — is the same trade as every
index you've ever created (databases course, Chapter 3). Search engines choose it
because documents are written once and queried billions of times.

## Prove it to yourself

**1. The receipt Chapter 1 promised** — index vs scan, timed:

```python
import time
docs = {f"doc{i}": f"the fox jumps {i}" for i in range(500_000)}
docs["doc7"] = "a bayesian network walks into a bar"

# the Chapter 1 engine: scan everything, every query
t = time.time(); scan = [d for d, txt in docs.items() if "bayesian" in txt]
scan_ms = (time.time() - t) * 1000

# the inverted index: build once...
index = {}
for name, txt in docs.items():
    for w in set(txt.split()): index.setdefault(w, []).append(name)

t = time.time(); lookup = index.get("bayesian", [])
lookup_ms = (time.time() - t) * 1000

print(f"scan:   {scan} in {scan_ms:.1f} ms")
print(f"lookup: {lookup} in {lookup_ms:.4f} ms")
# scan:   ['doc7'] in 38.7 ms     ← paid per query, forever
# lookup: ['doc7'] in 0.0012 ms   ← paid once at build; queries are free
```

Same answer, four orders of magnitude. That ratio *is* the search industry.

## The build: a real inverted index

```python
# index.py — inverted index with posting counts, sized for Chapters 5–7
from pipeline import terms          # Chapter 3's normalizer

class InvertedIndex:
    def __init__(self):
        self.index = {}             # term -> {doc_id: term_frequency}
        self.docs = {}              # doc_id -> raw text (for snippets, Ch 10)
        self.N = 0

    def add(self, doc_id, html):
        self.N += 1
        self.docs[doc_id] = html
        for term in terms(html):                            # Ch 3's pipeline
            postings = self.index.setdefault(term, {})
            postings[doc_id] = postings.get(doc_id, 0) + 1  # count occurrences (Ch 6 uses this)

    def search(self, term):
        return self.index.get(self.normalize(term), {})

    def normalize(self, term): return term.lower()

idx = InvertedIndex()
idx.add("doc1", "<p>The quick brown fox</p>")
idx.add("doc2", "<p>The lazy dog</p>")
idx.add("doc3", "<p>Fox and dog</p>")

print(idx.search("fox"))     # {'doc1': 1, 'doc3': 1}  ← the posting list, with counts
print(idx.search("dog"))     # {'doc2': 1, 'doc3': 1}
```

The posting list is a dict of `{doc_id: count}` — Chapter 5 intersects these lists for
boolean queries, and Chapter 6 multiplies the counts into relevance scores. The
plumbing is deliberately ready for what's coming.

## What you now know

- The inverted index flips document→words into **term→documents**, replacing scans
  with lookups — the same trade as every database index, priced at write time.
- **Posting lists** are sorted doc-id lists (with counts for ranking); set operations
  over them are Chapter 5's queries.
- "Indexing" is the expensive half — that's the deal: write once, query billions.

Next: users don't type single terms. Turning "python AND tutorial" into set algebra
over your posting lists — and why phrases need positions.
