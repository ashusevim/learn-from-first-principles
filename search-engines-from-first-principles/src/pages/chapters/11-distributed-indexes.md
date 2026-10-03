---
layout: ../../layouts/Chapter.astro
title: 'Scale: Shards, Replicas & the Distributed Index'
description: 'Splitting the index across machines and merging results — the distributed systems course, applied.'
part: 'Part III — Serving & Scale'
written: true
---

One machine holds your index beautifully — until the corpus hits terabytes and the
queries hit thousands per second. The escape is the distributed systems course's
entire toolkit, applied: **shard** the index across machines, **replicate** each shard
for reliability, **fan out** every query to all shards, and **merge** the ranked
results. This chapter builds a two-shard toy cluster and shows exactly where it can
lie to you.

## The lie you were told

> "A big index needs a big machine."

Vertical scaling dies on price (mainframes) and blast radius (one node = one
fire). The horizontal split has two axes — and they solve different problems:

```text
DOCUMENT SHARDING (default):        TERM SHARDING (rare):
  docs split across shards,           the posting lists themselves split —
  each shard has a FULL index         each machine owns a range of terms
  of its own documents                (hot terms = hot machines; rarely wins)

query → fan out to ALL shards → each returns its TOP-k → merge → global TOP-k
```

Document sharding's elegant property: **each shard ranks its own documents
independently** (TF-IDF needs only shard-local stats, roughly — global IDF is an
approximation), and the merger just sorts the returned top-k lists. No cross-shard
joins, no distributed locks. This is why search sharded cleanly in 2003 while
transactions didn't.

## The costs, itemized

- **Global stats drift**: IDF computed per shard ≠ global IDF — rare-word rankings
  shift slightly per shard. (Real engines ship global stats out-of-band.)
- **The fan-out tax**: one user query = N shard queries — you pay N× the load, and
  the *slowest shard sets your latency* (Chapter 3 of the DS course: timeouts as
  guesses).
- **Rebalancing**: adding a shard re-homes documents — consistent hashing (DS course,
  Chapter 8) exists for exactly this.
- **Replication** (each shard = a Raft group — DS course, Chapters 5–7) buys
  availability, at the usual consistency prices.

## Prove it to yourself

**1. The slowest-shard rule, felt:**

```python
import time
shards = {"s1": 0.01, "s2": 0.01, "s3": 0.05}      # s3 is having a moment (GC? disk?)
t = time.time()
results = []
for name, cost in shards.items():
    time.sleep(cost)                                # fan-out waits for EVERY shard
print(f"query took {time.time()-t:.3f}s — set by the slowest shard, not the average")
```

**2. The merge is trivial *if* shards return top-k with scores** — and *wrong* if they
return unordered lists:

```python
shard_results = {"s1": [("d1", 8.2), ("d5", 6.0)],
                 "s2": [("d9", 9.1), ("d3", 2.2)]}
global_top = sorted((r for rs in shard_results.values() for r in rs),
                    key=lambda x: -x[1])[:3]
print(global_top)   # [('d9', 9.1), ('d1', 8.2), ('d5', 6.0)] — global ranking, merged
```

## The build: a two-shard toy cluster

```python
# sharded.py — doc-sharded index + fan-out query + merge (~40 lines)
from tfidf import Ranker                                # Chapter 6's ranker, per shard

class Shard:
    def __init__(self):
        self.index, self.docs = {}, {}
    def add(self, doc_id, text):
        self.docs[doc_id] = text
        for w in text.split():
            self.index.setdefault(w, {}).setdefault(doc_id, 0)
            self.index[w][doc_id] += 1
    def search(self, query, k=3):
        return Ranker(self.index, self.docs).search(query)[:k], self.docs

class Cluster:
    def __init__(self, n_shards=2):
        self.shards = [Shard() for _ in range(n_shards)]
    def add(self, doc_id, text):
        shard = self.shards[hash(doc_id) % len(self.shards)]   # route by doc (Ch 8's ring, simpler)
        shard.add(doc_id, text)
    def search(self, query, k=3):
        merged = []
        docs = {}
        for shard in self.shards:                       # FAN OUT to all shards
            topk, shard_docs = shard.search(query, k)
            merged += topk
            docs.update(shard_docs)
        merged = sorted(set(merged))[:k]                # MERGE: sort the union, take top-k
        return [(d, docs[d][:40]) for d in merged]

c = Cluster(n_shards=2)
for i, doc in enumerate([
    "python tutorial with examples and exercises",
    "a history of swiss cheese and alpine farms",
    "advanced python patterns for professionals",
    "the french revolution a very short history",
]):
    c.add(f"doc{i}", doc)

for doc_id, preview in c.search("python"):
    print(f"{doc_id}: {preview}...")
# doc0: python tutorial with examples...    ← sharded storage,
# doc2: advanced python patterns...         ← merged ranking, one honest result list
```

The hash routed docs 0/2 to one shard, 1/3 to the other — and the query for "python"
fanned out to both, merged, and returned the right pages in the right order. Twenty
more lines (replicate each Shard with the DS course's Chapter 6 log) and you'd have a
toy Elasticsearch.

## What you now know

- Search scales by **document sharding + fan-out + merge** — shards rank locally, the
  merger sorts globally. No cross-shard joins needed (unlike transactions, Ch 10 of
  the DS course).
- The costs: **latency = slowest shard**, global-IDF approximation, rebalancing pain.
- Replication = DS-course consensus per shard; availability with the usual prices.

Next, the finale: crawler, pipeline, index, TF-IDF, PageRank, snippets — assembled
into **mini-Google in ~300 lines**, then raced against Chapter 1's naive grep engine.
