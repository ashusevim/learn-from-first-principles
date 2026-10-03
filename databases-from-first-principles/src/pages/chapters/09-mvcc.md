---
layout: ../../layouts/Chapter.astro
title: 'MVCC: Databases That Never Block'
description: 'Readers never wait for writers — because every row carries its version history. Build: multi-version rows.'
part: 'Part III — Correctness & Scale'
written: true
---

Chapter 8 left the hard problem open: how can a reader get a *consistent* answer while a
writer is mid-change — without either waiting for the other? The answer is the most
elegant trick in the field: **keep the old versions**. Every row carries its birth and
death stamps; every transaction reads the snapshot as of its start. It's called MVCC, and
once you see it, Postgres' weirdest behaviors (vacuum, bloat, transaction ID wraparound)
stop being mysteries and become the price list.

## The lie you were told

> "Readers and writers take turns with locks."

Under MVCC, **writers create new versions; readers read whatever version was current when
they started.** Nobody waits for anybody. There are no reader locks at all. The cost:
old versions pile up on disk until something reaps them — and that something (vacuum) is
why your Postgres table can be "empty but huge".

## The mechanism: rows that remember

Every row version gets two stamps — the tx that **created** it (xmin) and the tx that
**deleted** it (xmax):

```text
UPDATE balance = 200 on row 1  →  does NOT modify row 1. It:
  - marks old version:  xmin=7, xmax=9   (dead as of tx 9)
  - inserts new version: xmin=9, xmax=∞  (current as of tx 9)

a reader whose snapshot is tx 8:  sees version xmin=7  (xmax 9 hasn't "happened" for it)
a reader whose snapshot is tx 10: sees version xmin=9
```

A "snapshot" is just a number: *which txs count as already-happened*. Reads become a
filter over versions — pure arithmetic, zero locking. Writes are appends of new versions.
Everyone proceeds.

## The bill, itemized

- **Old versions accumulate** → tables bloat → Postgres runs **vacuum** to reclaim them.
  (MySQL InnoDB: the "purge thread"; same job.)
- **Long-running transactions freeze their snapshots** → vacuum can't reap → bloat snowballs.
  (The classic incident: one forgotten `BEGIN` from Tuesday, and Saturday's disk is full.)
- **Transaction IDs are finite** (32-bit in Postgres) → wraparound → the dreaded "database
  must be shut down to prevent wraparound". Versions cost numbers, and numbers run out.

None of these are bugs. They're the maintenance contract for "readers never block".

## Prove it to yourself

**1. See the version stamps — on a real database:**

```sh
sqlite3 test.db "pragma journal_mode=wal; create table if not exists t(v text);"
psql -c "create table mv(v text);" 2>/dev/null || echo "(postgres demo optional)"
psql -c "insert into mv values ('before'); update mv set v='after';"
psql -c "select xmin, xmax, v from mv;"     # the stamps, real and visible:
#    xmin    |   xmax    |   v
# 108392     | 108393    | after            ← created by one tx, 'deleted' by the next
```

**2. Watch a snapshot ignore later writers** — two connections:

```sh
# session A:
psql -c "begin; select count(*) from mv;"    # sees the snapshot as of BEGIN
# session B: insert a row, commit.
# session A again:
psql -c "select count(*) from mv;"           # UNCHANGED — B's commit doesn't exist for A
psql -c "commit;"                            # A's snapshot ends
psql -c "select count(*) from mv;"           # now it appears
```

**3. See the bloat bill:**

```sh
psql -c "create table churn(v text); insert into churn values ('x');"
psql -c "update churn set v='y';" ; psql -c "update churn set v='z';"
psql -c "select pg_total_relation_size('churn');"   # 3 versions of a 1-byte row
psql -c "vacuum churn;"                              # the reaper
```

## The build: multi-version rows in ~30 lines

```python
# mvcc.py — every row is a version chain; readers get snapshots; nobody locks
import itertools
tx_counter = itertools.count(1)

class Table:
    def __init__(self):
        self.versions = []                      # each: {xmin, xmax, key, value}

    def write(self, key, value):                # UPDATE = mark old + append new
        tx = next(tx_counter)
        for v in self.versions:
            if v["key"] == key and v["xmax"] is None:
                v["xmax"] = tx                  # old version dies NOW (for future readers)
        self.versions.append({"xmin": tx, "xmax": None, "key": key, "value": value})
        return tx

    def read(self, snapshot_tx):                # a reader: pure filtering, zero locks
        out = {}
        for v in self.versions:
            if v["xmin"] <= snapshot_tx and (v["xmax"] is None or v["xmax"] > snapshot_tx):
                out[v["key"]] = v["value"]      # this version was live in that snapshot
        return out

t = Table()
t.write("balance", 100)                          # tx 1
snapshot = next(tx_counter)                      # a reader starts HERE (tx 2)
t.write("balance", 999)                          # tx 3: a writer, mid-flight
print(t.read(snapshot))                          # {'balance': 100} — writer invisible
print(t.read(next(tx_counter)))                  # {'balance': 999} — future readers see it
print(f"{len(t.versions)} versions stored for 1 logical row — hello, vacuum")
```

Both readers are **always correct**, the writer **never blocked**, and the last line
prints the cost. That's MVCC: correctness by version arithmetic, paid for in storage.

## What you now know

- MVCC = **version-stamped rows + snapshot reads**: readers filter, writers append.
- **No reader locks** is bought with old versions — vacuum/purge is the maintenance bill.
- Long transactions freeze snapshots and stall reaping: the root of most "mystery bloat".
- Postgres' `xmin`/`xmax` are this exact mechanism, exposed in every SELECT.

Next: B-trees rule reads. But what if your workload is 90% *writes*? The other great
data structure — LSM trees — and the bet that separates Postgres from Cassandra.
