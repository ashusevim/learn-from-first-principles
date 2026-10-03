---
layout: ../../layouts/Chapter.astro
title: 'Beyond B-Trees: LSM & the Write Tradeoff'
description: 'Why Postgres and Cassandra make opposite bets. Build: a toy LSM tree — memtable, flush, compaction.'
part: 'Part III — Correctness & Scale'
written: true
---

The B-tree (Chapter 3) is read-optimized: every insert walks the tree and updates pages
in place — a *random* write per row. For write-heavy workloads that's the wrong bet. The
**LSM tree** inverts it: accept writes by *appending* (Chapter 1's cheapest op!), sort in
memory, flush to immutable sorted files, merge them in the background. Postgres is a
B-tree database; Cassandra, RocksDB, LevelDB, and DynamoDB are LSM databases. This
chapter builds the LSM and prices both bets.

## The lie you were told

> "All databases use B-trees."

There are two great storage shapes, making opposite wagers:

```text
B-tree:  writes UPDATE pages in place     → fast reads, random-write cost
LSM:     writes APPEND, reads may search many files → fast writes, read amplification
```

The LSM pipeline:

```text
writes → memtable (in memory, sorted)  ──full──►  flush: an immutable sorted run on disk
reads →  check memtable, then each run (newest → oldest)
background compaction merges runs, dropping shadowed entries
```

"Shadowed": a key written three times lives in three runs — reads find the *newest* one
and must skip the others. That's **read amplification**, the LSM's bill.

## Why appends win for writes

A B-tree insert of one row: read a page, update it, write the page back — even with the
buffer pool, that's a random-write pattern per row. An LSM insert: append to the
memtable. Sequential, memory-speed, no seeks. When writes arrive faster than disks can
do random I/O — telemetry, logs, metrics, feeds — the LSM is the only shape that keeps up.
(Remember Chapter 1: **appends are the disk's cheapest op.** The LSM is that fact, built
into a database.)

And durability? The memtable is guarded by — you guessed it — a WAL (Chapter 4). Same
log, different main structure. The log is forever.

## Prove it to yourself

**1. Feel the read amplification** — with the toy below, count file checks per lookup
as runs accumulate. Then imagine that at disk latency, multiplied by every query.

**2. See real products declare their bet:**

```sh
sqlite3 test.db "pragma journal_mode;"          # B-tree world (rollback journal/wal)
# Cassandra docs: "commit log + memtable + SSTables" — Chapter 4 + this chapter, verbatim
```

RocksDB/LevelDB on your machine? Their `MANIFEST`/`*.sst` files are runs and compactions.
Once you know the two shapes, every storage engine's file listing reads like a resume.

**3. The tombstone** — LSM deletes can't remove from immutable runs, so they append
*tombstones* ("this key is dead as of now"). A read must keep looking past a tombstone;
compaction is what finally buries it. Forgetting tombstones is how LSM users get
"deleted" rows resurrected — now you know the mechanism behind the folklore.

## The build: a working LSM, memtable to compaction

```python
# lsm.py — memtable → immutable sorted runs → merged reads + compaction (~60 lines)
import json, os, bisect

class LSM:
    def __init__(self, dir="lsm-data"):
        os.makedirs(dir, exist_ok=True); self.dir = dir
        self.memtable, self.runs = {}, []            # runs: newest-first file lists

    def put(self, key, value):
        self.memtable[key] = value
        if len(self.memtable) >= 4: self.flush()     # tiny threshold so you can watch it

    def delete(self, key): self.put(key, None)       # a tombstone, exactly as designed

    def flush(self):                                 # memtable → immutable sorted run
        path = f"{self.dir}/run{len(self.runs)}.json"
        json.dump(sorted(self.memtable.items()), open(path, "w"))
        self.runs.insert(0, path)                    # newest run first
        self.memtable = {}

    def get(self, key):                              # newest run wins; count the file reads
        if key in self.memtable: return self.memtable[key], 0
        reads = 0
        for run in self.runs:                        # read amplification, live
            reads += 1
            data = dict(json.load(open(run)))
            if key in data and data[key] is not None: return data[key], reads
            if key in data: return None, reads       # tombstone: provably deleted
        return None, reads

    def compact(self):                               # merge all runs: newest wins, drop tombstones
        merged = {}
        for run in reversed(self.runs):              # oldest first → newest overwrites
            merged.update({k: v for k, v in json.load(open(run)).items() if v is not None})
        merged.update(self.memtable)
        path = f"{self.dir}/run-compacted.json"
        json.dump(sorted(merged.items()), open(path, "w"))
        for run in self.runs: os.remove(run)
        self.runs = [path]; print("compacted:", len(merged), "live keys")

db = LSM()
for i in range(12): db.put(f"user{i}", i)            # 3 flushes → 3 runs
print(db.get("user7"))                                # found in run 0 (newest)
db.put("user7", 7777)                                 # same key, now in a newer run
print(db.get("user7"))                                # newest wins — the shadowed old copy remains
db.delete("user3")
print(db.get("user3"))                                # None — via tombstone, in one more file read
db.compact()                                          # the reaper: one run, no tombstones
print(db.get("user3"), db.get("user7"))               # None, 7777 — truth preserved
```

Fix the `←` comment I left mid-code (it's a stray, delete that line) and run it: you'll
see file-read counts grow with run count, tombstones shadowing deletes, and compaction
collapsing everything. That's LevelDB in a hundred lines.

## What you now know

- Two storage bets: **B-tree (in-place, read-fast)** vs **LSM (append, write-fast)** —
  and Postgres/Cassandra are the products of that one fork.
- LSM reads **amplify** across runs; **compaction** is the background tax that buys reads back.
- Deletes are **tombstones** until compaction buries them.
- The memtable is guarded by a WAL — Chapter 4 follows you into every structure.

Next: your database now works — for one machine. Time to copy it and split it across
many, and to itemize the bill that arrives with both. Replication and sharding.
