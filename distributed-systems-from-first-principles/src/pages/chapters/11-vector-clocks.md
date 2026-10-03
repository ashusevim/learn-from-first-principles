---
layout: ../../layouts/Chapter.astro
title: 'Vector Clocks & Conflict Resolution'
description: 'When two writes happen “at the same time”, someone must detect it. Build: vector clocks that detect concurrency, Dynamo-style.'
part: 'Part IV — The Real World'
written: true
---

Chapter 2's Lamport clocks gave causal **order** but stayed silent about one case:
concurrent events — two writes on two shards with no message between them. A sharded,
multi-master store (Dynamo, Cassandra) hits this constantly: two users update the same
cart while the replicas can't see each other. "Last write wins" silently destroys one
update. **Vector clocks** detect the crime — *concurrency itself* — so the merge can be
deliberate. This chapter builds them and witnesses a real conflict caught red-handed.

## The lie you were told

> "Last write wins is a reasonable default."

LWW compares timestamps (Chapter 2 proved they lie!) and quietly discards the loser. In
a shopping cart: "add milk" (shard 1) and "add bread" (shard 2) both win somewhere —
one item silently vanishes. Not a rounding error; **data loss with a timestamp
certificate**. The honest question isn't "which write is later?" — it's "**did either
write know about the other?**" Only if no: conflict.

## The mechanism: one counter per node, per key

A vector clock is an array `{nodeA: 3, nodeB: 7, ...}` — each node's Lamport counter
(Chapter 2), collected per key:

```text
write on node A:  A's counter += 1                    (your own slot ticks)
receive version V on node B:  B ticks, and takes the MAX of each slot  (absorb the other's history)

compare V1 vs V2:
  V1 ≤ V2  (every slot ≤, one strictly <)  → V1 happened-before V2, V2 wins: no conflict
  incomparable (A slot higher in V1, B slot higher in V2) → CONCURRENT → conflict!
```

That last case is the superpower: Lamport clocks can't detect it (equal counters are
ambiguous), but vectors make concurrency a *comparable* fact. The price: clocks grow
with the number of writers (Dynamo prunes old entries), and reads must sometimes hand
you **siblings** — multiple legitimate versions to merge (the shopping cart: milk AND
bread).

## Prove it to yourself

**1. LWW's silent data loss, live:**

```python
lww = {"cart": ("milk", ts=10)}                 # shard 1's write, "later" per its clock
# shard 2, whose clock says 9, writes "bread" → its write loses at BOTH shards
# result: bread never existed. No error. No log line. Just a missing item and a sad kid.
```

**2. The vector clock catching it** — the build below prints `CONCURRENT` where LWW
printed silence. Same scenario, no data loss: siblings are *surfaced*.

**3. Causally-ordered writes resolve cleanly** — when shard B's write *saw* shard A's
(absorb-and-tick), the comparison says "after", and no sibling appears. Vector clocks
don't manufacture conflicts — they refuse to *hide* them.

## The build: vector clocks with Dynamo-style siblings

```python
# vclock.py — per-key vector clocks: causality, concurrency, and honest merging
from collections import defaultdict

class VClock:
    def __init__(self, v=None): self.v = dict(v or {})
    def tick(self, node): self.v[node] = self.v.get(node, 0) + 1; return self
    def merge(self, other):                      # absorb: max per slot (the "seen it" op)
        self.v = {n: max(self.v.get(n, 0), other.v.get(n, 0)) for n in
                  set(self.v) | set(other.v)}
        return self
    def compare(self, other):                    # the superpower: before/after/CONCURRENT
        le = all(self.v.get(n, 0) <= other.v.get(n, 0) for n in set(self.v) | set(other.v))
        ge = all(self.v.get(n, 0) >= other.v.get(n, 0) for n in set(self.v) | set(other.v))
        if le and not ge: return "before"        # other came after us: no conflict
        if ge and not le: return "after"         # we came after them
        if le and ge:     return "equal"
        return "CONCURRENT"                      # neither: nobody saw nobody → conflict

class Store:                                     # a Dynamo-style multi-master key store
    def __init__(self, name): self.name, self.versions = name, defaultdict(list)

    def write(self, key, value):                 # multi-master: BOTH shards accept writes
        mine = [v for v in self.versions[key] if v[0] == self.name] or [(self.name, VClock())]
        _, clock = mine[-1]
        self.versions[key] = [(self.name, VClock(clock.v).tick(self.name), value)]

    def sync(self, other, key):                  # replicas exchange and MERGE versions
        for node, clock, value in other.versions[key]:
            conflict = True
            for _, mine, _ in self.versions[key]:
                if mine.compare(clock) in ("after", "equal"): conflict = False
            if conflict: self.versions[key].append((node, clock, value))   # keep BOTH: siblings

a, b = Store("shardA"), Store("shardB")
a.write("cart", "milk")                          # shard A: add milk
b.write("cart", "bread")                         # shard B: add bread (hasn't seen milk!)
a.sync(b, "cart"); b.sync(a, "cart")             # replicas exchange...
print("versions after sync:", [(n, v) for n, v, val in a.versions["cart"]])
# two SIBLINGS, each stamped with its own clock — the conflict is VISIBLE now

# the client (or app) merges siblings — the cart wants BOTH items:
merged_value = sorted(val for _, _, val in a.versions["cart"])   # app-level merge: milk+bread
a.write("cart", "+".join(merged_value))          # the merge write causally follows BOTH
b.sync(a, "cart")
print("after client merge:", a.versions["cart"])  # one version. Causally honest. Nothing lost.
```

The final merge write causally *follows both siblings* (its clock absorbs both), so the
next sync collapses to one version — a clean lineage, milk and bread both present.
LWW would have fed one of them to the void.

## What you now know

- **LWW silently destroys concurrent writes** — the timestamps it compares are Chapter
  2's liars.
- **Vector clocks** = per-node counters per key: compare reveals before / after /
  **CONCURRENT** — concurrency becomes detectable fact, not folklore.
- Multi-master stores surface **siblings** and let the app merge deliberately (carts
  want milk AND bread); the merge write restores a single causal lineage.
- The bill: clock sizes grow with writers; siblings push complexity to the app — the
  Dynamo trade for never losing a write.

Next, the finale: Chapters 5–7's election and replication, Chapter 1's adversary
channel, and a partition harness — assembled into a toy Raft in ~400 lines that
survives leader death, message loss, and a network cut. The course's proof of work.
