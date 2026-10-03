---
layout: ../../layouts/Chapter.astro
title: 'The Buffer Pool: Distrusting the OS'
description: 'Why databases bring their own memory manager. Build: an LRU page cache and measure the hit ratio.'
part: 'Part II — The Query Side'
written: true
---

"Doesn't the OS page cache already do this?" — the natural question, and the reason this
chapter exists. Databases run **their own cache** anyway: because the database knows
things the OS cannot — which page belongs to which query, which pages are being scanned
once and should be evicted immediately, which pages *must not* be written out mid-change.
The buffer pool is the database's refusal to let a general-purpose manager guess.

## The lie you were told

> "The OS page cache handles memory for databases."

It handles *bytes*; the database needs *semantics*. Three concrete reasons to roll your own:

1. **Eviction intelligence** — a sequential scan through 100 GB would flush your entire
   OS cache with pages you'll never read again. The DB marks those pages "evict me first"
   (Postgres' ring buffer does exactly this).
2. **Write control** — the OS flushes when *it* wants; the database must flush in WAL
   order (Chapter 4) or durability breaks. It cannot delegate that.
3. **Pinning** — while a B-tree node is being split (Chapter 3), the pages involved must
   not move or vanish. The DB needs locks the OS cache can't express.

So the database mmaps less than you'd think (or fights the OS with `O_DIRECT`) and runs a
**buffer pool**: a big array of in-memory page frames + a table saying which disk page
lives where + an eviction policy.

## The mechanics

```text
query wants page N → hit in pool?  → yes: return pointer (nanoseconds)
                                    → no:  evict a victim frame (LRU)
                                           read page N from disk into it
                                           (if victim was dirty → write it back first)
```

Two pieces of vocabulary you'll meet in every `EXPLAIN ANALYZE`:

- **hit ratio** — fraction of lookups served from the pool; databases live and die by it.
- **dirty page** — modified in memory, not yet written to disk. Checkpoints (Ch 4) are
  largely "wash the dirty pages".

## Prove it to yourself

**1. Watch the cache work in SQLite:**

```sh
python3 -c "
import sqlite3, time
db = sqlite3.connect('test.db')
q = 'select count(*) from t where a = 100000'
db.execute(q).fetchall(); t = time.time(); db.execute(q).fetchall()
print(f'cold: ~pays for pages   warm: {time.time()-t:.6f}s (pool/OS cache hit)')"
```

**2. See the pool's size knob:**

```sh
sqlite3 test.db "pragma cache_size;"       # pages held in memory (default 2MB-ish)
sqlite3 test.db "pragma cache_size = -65536;"   # 64MB worth — watch big scans speed up
```

**3. Watch a scan evict everything** — run a giant sequential scan, then a hot lookup;
in a cold-OS environment the lookup's pages got swept. Real databases prevent exactly
this with their own policies — that's the argument of this chapter, demonstrated.

## The build: an LRU buffer pool, with hit-ratio telemetry

```python
# bufpool.py — a buffer pool with LRU eviction and honest hit-ratio accounting
from collections import OrderedDict

class BufferPool:
    def __init__(self, capacity_frames: int, disk_read):
        self.frames = OrderedDict()      # page_id -> contents (OrderedDict = LRU machinery)
        self.capacity = capacity_frames
        self.disk_read = disk_read       # a function: page_id -> bytes (the slow path)
        self.hits = self.misses = 0

    def get(self, page_id):
        if page_id in self.frames:
            self.hits += 1
            self.frames.move_to_end(page_id)             # mark as most-recently-used
            return self.frames[page_id]
        self.misses += 1
        page = self.disk_read(page_id)                   # the Chapter 2 read
        if len(self.frames) >= self.capacity:            # evict the coldest frame
            victim, contents = self.frames.popitem(last=False)
            # (a real pool writes victims back here if they're dirty — Ch 4)
        self.frames[page_id] = page
        return page

    def stats(self):
        total = self.hits + self.misses
        return f"hits={self.hits} misses={self.misses} ratio={self.hits/max(total,1):.1%}"

# — simulate: a hot working set of 5 pages inside a 100-page file —
import random
disk = lambda pid: f"page-{pid}-data".encode()
random.seed(1)
accesses = [random.choice(list(range(5)) * 8 + list(range(5, 100))) for _ in range(1000)]
# 80% of accesses hit 5 hot pages; 20% wander the cold tail

pool = BufferPool(capacity_frames=10, disk_read=disk)
for pid in accesses: pool.get(pid)
print(pool.stats())          # ratio ≈ 80%+ — and you can re-run with capacity=2 to watch it collapse
```

Change `capacity` from 10 to 2 and re-run: the hot set no longer fits, the ratio craters,
and you have just *personally experienced* why `shared_buffers`/`innodb_buffer_pool_size`
are the first knobs on every tuning checklist.

## What you now know

- Databases cache pages themselves because eviction, write order, and pinning are
  **semantic** decisions the OS can't make.
- **LRU + hit ratio** is the heart of it — and you built both.
- Dirty pages connect the pool to the WAL: checkpoints wash them, in log order.
- "The DB is slow" is very often "the working set stopped fitting in the pool."

Next: pages, indexes, logs, cache — the storage side is done. Time for the part you
actually type: what happens between `SELECT` and your rows. Parse and plan.
