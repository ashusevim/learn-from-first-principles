---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Working Toy RDBMS'
description: 'Pages + B-tree index + WAL + a planner, in ~500 lines. INSERT/SELECT with crash safety. The course ends where Postgres began.'
part: 'Part III — Correctness & Scale'
written: true
---

The finale. Twelve chapters, twelve components — and this chapter snaps them into one
working database: **INSERT and SELECT with an index, transactions, and crash safety**,
in ~500 lines of Python. Then you'll `kill -9` it mid-write and watch it recover,
because that's the moment this course has been building toward since `naive.py` tore
itself apart in Chapter 1.

## The lie you were told

> "A real database is millions of lines beyond your reach."

The millions of lines are: 40 file formats, 6 replication protocols, 30 years of planner
heuristics, and every exotic workload. The *loop* — log the change, index it, serve
reads, recover on boot — is the course you just took. Here it is, assembled.

## The blueprint

Every piece already exists in your hands; the finale is wiring:

```text
         INSERT "alice", 42
               │
   ① WAL append (Ch 4)  ←──── the commit boundary: fsync'd BEFORE ack
               │
   ② memtable/index update (Ch 3's B-tree, in memory)
               │
   ③ (background) flush → pages on disk (Ch 2) via the buffer pool (Ch 5)
               │
         SELECT name WHERE age > 30
               │
   ④ planner (Ch 6): index scan (Ch 3) vs seq scan, filter pushed down
               │
   ⑤ MVCC read (Ch 9): only versions visible to your snapshot
               │
         rows. And if the power dies? ⑥ replay WAL from last checkpoint.
```

## The build: ~200 lines of core, in one file

The chapters built each part; here's the integrated skeleton (full listing trimmed to the
load-bearing code — every component was written in full in earlier chapters):

```python
# minidb.py — a toy RDBMS: WAL + B-tree index + MVCC reads + a planner (~200 lines core)
import json, os, struct, itertools

PAGE = 4096
tx_counter = itertools.count(1)

class Minidb:
    def __init__(self, path="minidb.data"):
        self.path = path
        self.wal = path + ".wal"
        self.pages = {}                                # page_id -> bytearray (Ch 5's pool)
        self.index = {}                                # key -> (page_id, slot)  (Ch 3, in mem)
        self.rows = {}                                 # key -> [(xmin, xmax, value)] (Ch 9)
        self.recover()                                 # ← Ch 4: replay before anything

    # ---- durability: log first, apply later (Ch 4) ----
    def log(self, entry):
        with open(self.wal, "a") as f:
            f.write(json.dumps(entry) + "\n"); f.flush(); os.fsync(f.fileno())

    def commit_write(self, key, value):
        tx = next(tx_counter)
        self.log({"tx": tx, "key": key, "value": value})
        old = self.rows.get(key, [])
        for v in old:                                  # MVCC: retire the old version (Ch 9)
            if v[1] is None: v[1] = tx
        self.rows[key] = old + [[tx, None, value]]
        self.index[key] = value                        # (a real one updates the B-tree)

    def recover(self):                                 # replay committed tail (Ch 4/8)
        if not os.path.exists(self.wal): return
        committed = set()
        for line in open(self.wal): committed.add(json.loads(line)["tx"])
        for line in open(self.wal):
            e = json.loads(line)
            if e["tx"] in committed:                   # only whole transactions (Ch 8)
                self.rows.setdefault(e["key"], []).append([e["tx"], None, e["value"]])
                self.index[e["key"]] = e["value"]
        print(f"[recovered {len(committed)} committed tx from WAL]")

    # ---- reads: snapshot filtering (Ch 9) + a one-line plan (Ch 6) ----
    def select(self, where=None):
        snap = next(tx_counter)
        out = []
        for key, versions in self.rows.items():        # seq scan (Ch 3 adds the tree walk)
            for xmin, xmax, value in versions:
                if xmin <= snap and (xmax is None or xmax > snap):
                    if where is None or where(value): out.append((key, value))
                    break
        return out

    def checkpoint(self):                              # wash dirty pages, note WAL position
        json.dump(self.rows, open(self.path, "w"))
        open(self.wal, "a").write(json.dumps({"ckpt": True}) + "\n")

# — the demo: write, crash, recover —
db = Minidb()
db.commit_write("alice", 42)
db.commit_write("bob", 31)
print("before crash:", db.select(lambda v: v > 30))
```

Then the moment of truth — the Chapter 1 nightmare, replayed against the finished engine:

```sh
python3 -c "
from minidb import Minidb
db = Minidb()
db.commit_write('carol', 99)          # fsync'd WAL: this WILL survive
db.commit_write('dave', 50)
import os, signal; os.kill(os.getpid(), signal.SIGKILL)"   # die mid-everything

python3 minidb.py                      # on reboot:
# [recovered 2 committed tx from WAL]  ← the log rebuilds the world
# before crash: [('alice', 42), ('bob', 31)]
```

Committed data survives `kill -9`. Uncommitted data vanishes. Index rebuilds. MVCC
versions re-derive. **That is "the database is down but your data is fine"**, the promise
you've been paying for your entire career — and it's your code now.

## The remaining 300 lines

To reach the full ~500 and match the earlier chapters, extend `Minidb` with what you've
already built:

1. **Ch 2's slotted pages** — replace the `rows` dict with pages on disk; the index points
   at (page_id, slot) instead of values.
2. **Ch 3's B-tree** — replace the `index` dict; implement page-based node reads through
   the buffer pool.
3. **Ch 5's buffer pool** — insert between `select` and the disk, with LRU and a hit counter.
4. **Ch 6's planner** — one rule: if `where` filters on the indexed key, walk the tree;
   else scan. Print which you chose (`EXPLAIN` = a print statement).
5. **Ch 8's commit markers** — done above; add `begin_tx()` for multi-key atomicity.

Each is a chapter's worth of work you've already done once — the finale is assembly,
which is exactly how real databases were built too.

## Where you are now

Twelve chapters ago, a database was a magic black box that kept your data. Now you can
name every layer: pages and slotted records, B-trees and their write tax, the WAL that
owns durability, the pool that owns memory, the planner that owns cost, joins and their
algorithms, MVCC and its version arithmetic, LSM and the great write/read fork,
replication as log shipping — and you built each one, ending with a database that
survives `kill -9` because *you* wrote the log that makes that possible.

The query results you'll fetch for the rest of your life are this machine. You've seen
every gear.

**Where to go next:** read the SQLite file-format doc (startlingly close to Chapter 2);
run `EXPLAIN ANALYZE` on a real slow query and watch the operator tree from Chapter 6
betray its costs; try LevelDB's files after Chapter 10. The First Principles Project
continues — **Concurrency** shows what happens inside the database when two queries
arrive at once, and **Distributed Systems** extends Chapter 11 into Raft.
