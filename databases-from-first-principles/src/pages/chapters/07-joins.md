---
layout: ../../layouts/Chapter.astro
title: 'Joins: Nested Loops to Hash'
description: 'Why joining two big tables naively is O(n·m), and what a hash join buys. Build: both, timed.'
part: 'Part II — The Query Side'
written: true
---

`JOIN` looks like one keyword; it's a menu of algorithms with wildly different costs, and
picking wrong is the difference between 5 ms and 5 hours. This chapter builds the two
big ones — nested loop and hash join — and times them on the same data, so the planner's
Chapter 6 decisions stop being abstract and become arithmetic you've personally run.

## The lie you were told

> "JOIN connects two tables."

JOIN is a **specification of which row-pairs match**. The database chooses a procedure.
The two workhorse procedures have completely different shapes:

```text
Nested Loop:  for each row in A:      cost O(|A| × |B|)   — fine if one side is tiny
                for each row in B:
                  if a.key == b.key: emit pair

Hash Join:    build a hash table of B (one pass)           cost O(|A| + |B|)
              probe with each row of A (one pass)          — the join for big × big
```

A third, **merge join**, exploits pre-sorted inputs (usually indexes — Chapter 3!) and
streams both sides in lockstep. The planner picks among these using table sizes and
available indexes — that's the "join order" IQ from Chapter 6, now priced.

## The trap that eats servers

Nested loop's O(n·m) hides inside innocent queries: 50k rows joined to 50k rows is
2.5 *billion* comparisons. Nobody writes that on purpose — but a missing index (Ch 3!)
forces exactly this plan, and the query that "was fine in staging" dies in production
because staging had 500 rows. This is the single most common query-performance bug in
the industry.

## Prove it to yourself

**1. Watch the planner choose:**

```sh
sqlite3 test.db "create table big(a int, b text); create table small(a int, c text);"
python3 -c "
import sqlite3
db = sqlite3.connect('test.db')
db.executemany('insert into big values (?, ?)', [(i, 'x'*50) for i in range(100000)])
db.executemany('insert into small values (?, ?)', [(i % 100, 'y'*50) for i in range(100)])
db.commit()"
sqlite3 test.db "explain query plan select * from big, small where big.a = small.a;"
# SCAN small / SEARCH big USING INDEX ...   ← small side drives, index on big absorbs it
sqlite3 test.db "drop index if exists idx_a;"
sqlite3 test.db "explain query plan select * from big, small where big.a = small.a;"
# SCAN big / SCAN small                     ← forced nested loop over 100k × 100
```

**2. Time the cliff:**

```sh
time sqlite3 test.db "select count(*) from big, small where big.a = small.a;"
# then drop the index and re-run — feel the O(n·m) tax arrive in seconds
```

## The build: both joins, on the same data, timed

```python
# joins.py — nested loop vs hash join over identical inputs
import time, random

random.seed(7)
A = [(i, f"name{i}") for i in range(20000)]                    # 20k "users"
B = [(random.randint(0, 19999), f"event{i}") for i in range(20000)]  # 20k "events"

def nested_loop(A, B):                                          # O(n·m)
    out = []
    for a in A:
        for b in B:
            if b[0] == a[0]:
                out.append((a, b))
    return out

def hash_join(A, B):                                            # O(n + m)
    table = {}
    for b in B:                                                 # build phase: one pass
        table.setdefault(b[0], []).append(b)
    out = []
    for a in A:                                                 # probe phase: one pass
        out.extend((a, b) for b in table.get(a[0], ()))
    return out

for fn in (nested_loop, hash_join):
    t = time.time()
    n = len(fn(A, B))
    print(f"{fn.__name__:12s}: {n:6d} pairs in {time.time()-t:7.3f}s")
# nested_loop:  20000 pairs in ~  8-12 s
# hash_join  :  20000 pairs in ~  0.03 s     ← same answer, ~300× faster
```

Same inputs, same output, three orders of magnitude. That gap *is* the hash join's
reason to exist — and the reason the planner builds one whenever both sides are big and
no usable index exists. (The memory bill: the hash table must fit — when it doesn't,
databases "grace-hash" it into partitions. Same idea, more files.)

## What you now know

- JOIN = which pairs match; the **algorithm** (nested loop / hash / merge) is chosen by
  the planner from sizes and indexes.
- **Nested loop is fine when one side is tiny or indexed** — and catastrophic otherwise.
- **Hash join pays one pass to build + one to probe** — the big×big default.
- "Query was fine yesterday" usually means "the plan changed" — sizes and indexes moved.

Next: reads are fast, writes are logged, plans are priced. The last wall: correctness
when two things happen at once. Transactions — ACID without the buzzwords.
