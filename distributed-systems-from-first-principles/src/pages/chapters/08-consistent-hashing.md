---
layout: ../../layouts/Chapter.astro
title: 'Consistent Hashing & Sharding the Ring'
description: 'Sharding by modulo collapses when a node joins. Build: a hash ring with virtual nodes — watch keys move 1/N, not all.'
part: 'Part III — Beyond One Cluster'
written: true
---

Raft (Chapters 5–7) keeps *one* dataset safe on 3–7 nodes. But a billion keys don't fit
on 5 machines — you need to **shard**: split keys across many nodes. The naive way,
`node = hash(key) % N`, is a ticking bomb: the day you add node #4, `hash % 3 → % 4`
changes for **~90% of all keys**, and every cache, every database, every CDN in the
system misses at once. **Consistent hashing** — invented for Akamai's CDN in 1997, now
inside Dynamo, Cassandra, Riak, and every cluster — moves only ~1/N of keys. Build both
and measure the difference.

## The lie you were told

> "hash(key) % N distributes keys across N nodes."

It distributes fine — **until N changes.** Adding one node changes every key's
assignment:

```text
hash("alice") = 1234567
  % 3 → node 1        100 keys spread across 3 nodes
  % 4 → node 3        ← after adding node 4: ~75% of keys are now "somewhere else"
```

In a cache fleet, that's a full-cache flush (every miss at once — the thundering herd).
In a storage fleet, it's migrating nearly everything during peak traffic. The problem
isn't the hashing; it's that **the modulo couples every key to the total node count.**

## The ring: decoupling keys from the count

Consistent hashing removes N from the picture. Both keys *and* nodes hash onto one
circular space (say 0–2³²); each key belongs to the **first node clockwise** from it:

```text
        0°
   key:alice(30°)        nodeA(10°)     ← alice → nodeA (first node clockwise)
             key:bob(200°)
        nodeB(150°)              key:carol(310°)
             nodeC(280°)  ← carol → nodeC

adding nodeD at 320°: only carol (310°–320° band) remaps. Everything else stays.
```

Now "the node count" never appears in the key's assignment — only *which node is
next-clockwise*. Adding or removing a node reshuffles only the keys in its arc: exactly
1/N of the ring.

## Virtual nodes: fixing the lumpy ring

Real hashes on a handful of nodes land unevenly — one node might inherit 40% of the
ring. The fix: place each physical node at **100–200 random points** (virtual nodes).
Law of large numbers smooths the distribution, and node failures spread their load
across *everyone* instead of dumping it on one clockwise neighbor. Cassandra calls them
tokens; Dynamo popularized vnodes; same mechanism.

## Prove it to yourself

**1. The modulo bomb, measured:**

```python
import hashlib
keys = [f"user{i}" for i in range(10000)]
h = lambda s: int(hashlib.md5(s.encode()).hexdigest(), 16)
before = {k: h(k) % 3 for k in keys}
after  = {k: h(k) % 4 for k in keys}          # add node 4
moved = sum(before[k] != after[k] for k in keys)
print(f"modulo: {moved/len(keys):.0%} of keys moved when adding ONE node")
# ~75% — three quarters of your fleet invalidated simultaneously
```

**2. The ring, same test** — with the build below: **~25%** (1/4). Run with node
*removal* too: same 1/N, never 75%.

**3. Feel the lumpy-ring problem** — build the ring with `vnodes=1`, look at the
per-node load spread, then flip to `vnodes=100` and watch it tighten. The load
imbalance is *the* reason nobody ships vnode-less rings.

## The build: a consistent hash ring

```python
# ring.py — consistent hashing with virtual nodes, and a movement audit
import hashlib, bisect

def h(s): return int(hashlib.md5(s.encode()).hexdigest(), 16)

class Ring:
    def __init__(self, nodes=(), vnodes=100):
        self.vnodes, self.circle, self.owner = vnodes, [], {}   # sorted vnode positions
        for n in nodes: self.add(n)

    def add(self, node):
        for i in range(self.vnodes):
            pos = h(f"{node}#{i}")                 # each vnode: node + salt, hashed
            bisect.insort(self.circle, pos)
            self.owner[pos] = node

    def remove(self, node):
        dead = [p for p in self.circle if self.owner[p] == node]
        for p in dead: self.circle.remove(p); del self.owner[p]

    def get(self, key):
        pos = h(key)
        i = bisect.bisect(self.circle, pos) % len(self.circle)   # first vnode clockwise
        return self.owner[self.circle[i]]

# — the movement audit —
keys = [f"user{i}" for i in range(10000)]
r3 = Ring(["nodeA", "nodeB", "nodeC"])
r4 = Ring(["nodeA", "nodeB", "nodeC", "nodeD"])    # ONE node joins
moved = sum(r3.get(k) != r4.get(k) for k in keys)
print(f"ring: {moved/len(keys):.1%} of keys moved (theory: ~1/4 = 25%)")

r3v1 = Ring(["nodeA", "nodeB", "nodeC"], vnodes=1)  # lumpy: no virtual nodes
loads = {}
for k in keys: loads[r3v1.get(k)] = loads.get(r3v1.get(k), 0) + 1
print("vnodes=1 load spread:", {k: f"{v/len(keys):.0%}" for k, v in loads.items()})
r3v100 = Ring(["nodeA", "nodeB", "nodeC"], vnodes=100)
loads = {}
for k in keys: loads[r3v100.get(k)] = loads.get(r3v100.get(k), 0) + 1
print("vnodes=100 load spread:", {k: f"{v/len(keys):.0%}" for k, v in loads.items()})
```

Output tells the whole story: ~25% movement on node join (vs 75% modulo), a wildly
lumpy ring at `vnodes=1`, and a near-perfect three-way split at `vnodes=100`. Replication
on top (each key also lives on the next 2 clockwise nodes — the databases course's
replication, arranged by geometry) completes a Dynamo-style system.

## What you now know

- `hash % N` couples every key to the node count — **adding one node invalidates ~N/(N+1)
  of everything**.
- The **ring** assigns keys to the next node clockwise: node changes move only 1/N.
- **Virtual nodes** fix uneven load (law of large numbers) and spread failure load.
- Combined with Raft per shard, the ring *is* the architecture of Dynamo, Cassandra,
  and friends — consensus inside each shard, hashing across them.

Next: a sharded cluster still needs shared knowledge — "is node 7 alive? who owns
which token?" — without a central announcer. The answer spreads like a rumor: gossip.
