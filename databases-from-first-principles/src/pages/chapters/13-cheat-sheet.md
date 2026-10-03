---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Databases on One Page'
description: 'Storage, indexes, WAL, transactions and MVCC on one page — the model, the tradeoffs, and the failure modes with their chapters.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one ordering constraint: **durable first, fast second**. Every
structure below exists to honor the write path without paying full price on the
read path. The diagram, the parts, and the traps that each earned a chapter.

## The one-page model

```text
  client → WAL append + fsync → ack → buffer pool (dirty) → flush → checkpoint
  reads:  index (key → page, slot) or seq scan → versions (MVCC) → result
```

The commit boundary is the `fsync`, not the function return (Chapter 4). Everything
after the ack — dirty pages, background flushes, checkpoints — is performance.
Everything before it is the database. Lose that order and you have a fast file
that lies (Chapter 1's warning, Chapter 8's proof).

## The database you actually use

| Piece | Contract | In your build |
|---|---|---|
| page (4–16 KB) | the unit of disk I/O; everything is page traffic | Ch 2 |
| B-tree | ordered keys → (page, slot) in O(log n) seeks | Ch 3 |
| WAL entry + `fsync` | the intent, on disk, before the ack | Ch 4 |
| `commit_write(key, value)` | log it, apply it, then admit it happened | Ch 12 |
| buffer pool (`pages`) | pins hot pages; evicts only clean or flushed | Ch 5 |
| `checkpoint()` | wash dirty pages, note the WAL position | Ch 12 |
| `recover()` | replay only whole committed transactions | Ch 4, 8, 12 |
| `select(where=None)` | seq scan today; the tree walk plugs in here | Ch 3, 12 |
| parse → plan | text becomes the cheapest equivalent operation order | Ch 6 |
| nested-loop → hash join | the join algorithm follows the input sizes | Ch 7 |
| transaction (begin/commit) | all-or-nothing across many writes | Ch 8 |
| version chain (MVCC) | readers see a snapshot; writers never block them | Ch 9 |
| LSM (memtable + SSTables) | writes always win; reads pay the merge | Ch 10 |
| replica / shard key | copies for survival; key ranges for scale | Ch 11 |


## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Ack before `fsync` | the client believed a write the disk never saw | Chapter 4 |
| Replaying uncommitted tail | a half-transaction becomes permanent history | Chapters 4, 8 |
| Evicting a dirty, unflushed page | the only copy of a committed write, gone | Chapter 5 |
| No checkpoint, ever | recovery replays the whole disk of time | Chapters 4, 12 |
| One giant lock for "simplicity" | readers queue behind writers for no reason | Chapter 9 |
| Choosing B-tree for append-only firehoses | every insert seeks; the write rate caps early | Chapter 10 |
| A shard key with a hot prefix | one shard does all the work, the rest idle | Chapter 11 |
| Assuming replicas are caught up | read-your-write fails on the "fresh" replica | Chapter 11 |
| Planning joins in written order | nested loops over millions because the plan was lazy | Chapters 6–7 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Survive `kill -9` mid-write | WAL + fsync + replay on boot | you can re-derive the data — then skip durability (Ch 4) |
| Hot data without disk seeks | a buffer pool with a real eviction rule | the working set fits in RAM — then it is the pool (Ch 5) |
| Ordered reads by key | a B-tree over (page, slot) pointers | writes dominate — LSM trades read cost for ingest (Ch 10) |
| Many writers, live readers | MVCC snapshots, not read locks | transactions are tiny — locks are simpler (Ch 9) |
| Two writes, one truth | a transaction with a commit boundary | it is one key — a single atomic write suffices (Ch 8) |
| More than one machine | replicas for survival, shards for size | one box still fits — distribution is a tax (Ch 11) |

## Prove it to yourself

**1. The `fsync` is the commit:**

```python
db = Minidb("/tmp/proof.data")
db.commit_write("k", "v1")     # returns only after the WAL fsync (Ch 4)
print(open(db.wal).readline()) # the intent is on disk BEFORE any flush
```

Kill the process now (`kill -9` the PID from another shell): reopen, and `k`
is `v1`. The page file never saw it; the log did.

**2. Uncommitted tail stays dead:**

```python
db.log({"tx": 999, "key": "ghost", "val": 1})  # logged, never committed
db2 = Minidb("/tmp/proof.data")                # recover() runs on boot
print(db2.select())                            # no "ghost" anywhere
```

**3. The checkpoint shortens history:**

```python
db.checkpoint()
print(sum(1 for _ in open(db.wal)))   # the log restarts at the checkpoint mark
```

## What you now know

- **Durability is an order, not a feature:** log, `fsync`, ack — then anything.
- **Every structure pays for a different sin:** B-trees for seeks, LSM for
  ingest, MVCC for blocking, replicas for dying machines.
- **Recovery is a program you can read** (`recover()` fits on a screen) — boot
  it after every crash until the replay feels boring.
- The toy is a real database minus two things: a query language with a planner
  worth trusting, and concurrency past one writer. Both are named, neither is magic.

Next: twelve labs that crash your RDBMS on purpose — `kill -9` mid-commit,
replay the tail, and watch every invariant from this page hold.
