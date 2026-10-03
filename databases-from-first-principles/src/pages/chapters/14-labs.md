---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toy RDBMS from Chapter 12 — pages, B-trees, WAL, MVCC. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in recovered rows, a replayed log, or a timing
you read off `Minidb` from Chapter 12. Nothing here is new — pages (Ch 2),
B-trees (Ch 3), the WAL (Ch 4), the pool (Ch 5), transactions (Ch 8). What is new
is *violence*: you will kill the database mid-sentence and demand it remember.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Keep two shells: one running the database, one holding the knife
(`kill -9`).

| Tool | What it proves |
|---|---|
| `commit_write(k, v)` | the durable path, end to end |
| `kill -9 <pid>` mid-write | what "durable" actually promised |
| `Minidb(path)` on reboot | `recover()` replaying the tail |
| `checkpoint()` | where history gets truncated |

## Warm-ups

**Lab 1.1 — Write, kill, remember**
**Goal:** the Chapter 12 demo as muscle memory.
**Do this:**
```python
db = Minidb("/tmp/lab11.data")
db.commit_write("a", "1")
```
`kill -9` the process, reopen `Minidb("/tmp/lab11.data")`, and select:

```python
db2 = Minidb("/tmp/lab11.data")   # recover() replays on boot, prints its count
print(db2.select("a"))
```

**You'll know it works when:** `[recovered 1 committed tx from WAL]` prints and
`a` reads `1`. The page file is stale; the log is the truth.
**Where it comes from:** Chapter 12 — Final Boss: A Working Toy RDBMS.

**Lab 1.2 — The uncommitted ghost**
**Goal:** replay commits, never intentions.
**Do this:** `db.log({"tx": 4242, "key": "ghost", "val": "x"})` with no commit
marker, kill, reopen:

```python
db3 = Minidb("/tmp/lab11.data")
print([r for r in db3.select() if r[0] == "ghost"])
```

**You'll know it works when:** the list is empty — no `ghost`. The bytes are in the
log; the transaction is not *committed*, so the replay skips them — the whole of
Chapter 8 in one missing row.
**Where it comes from:** Chapter 8 — Transactions: ACID Without the Buzzwords.

**Lab 1.3 — Count the fsyncs**
**Goal:** durability has a price tag in syscalls.
**Do this:** `strace -c -e fsync python3 demo.py` around ten `commit_write` calls:

```sh
strace -c -e fsync python3 demo.py 2>&1 | grep fsync
```

**You'll know it works when:** the count reads exactly ten `fsync`s. One commit,
one flush — batching them (group commit) is the first optimization every real
engine adds, and now you know what it optimizes.
**Where it comes from:** Chapter 4 — WAL: Crash Safety in One Idea.

## Builds

**Lab 2.1 — Kill it mid-checkpoint**
**Goal:** the checkpoint is atomic in effect even when it is not atomic in time.
**Do this:** load 10,000 keys, call `checkpoint()`, and `kill -9` halfway through
the wash (sleep inside the flush loop to widen the window).
**You'll know it works when:** reopening recovers *all* 10,000 keys — the
checkpoint mark either landed (short replay) or it didn't (long replay), but no
key is half-written. Crash-safety composes.
**Where it comes from:** Chapters 4 and 12.

**Lab 2.2 — The pool evicts, the log forgives**
**Goal:** eviction is safe only because the log is complete.
**Do this:** shrink the pool to 2 pages, write 100 keys, force evictions, kill,
reopen.
**You'll know it works when:** all 100 keys survive — dirty evictions flushed
first (Ch 5's rule), and whatever didn't flush replays from the WAL. Two
mechanisms, one guarantee.
**Where it comes from:** Chapter 5 — The Buffer Pool: Distrusting the OS.

**Lab 2.3 — Readers never wait**
**Goal:** MVCC's promise on camera: a long scan plus concurrent writes, no blocking.
**Do this:** start a full `select()` scan, and from a second process (or thread)
`commit_write` ten new keys mid-scan.
**You'll know it works when:** the scan returns the pre-write snapshot — ten keys
missing, zero errors, zero waiting. The new versions exist; the old reader simply
doesn't see them yet.
**Where it comes from:** Chapter 9 — MVCC: Databases That Never Block.

**Lab 2.4 — The join order matters**
**Goal:** Chapter 7's lesson with a stopwatch: plan shape decides cost.
**Do this:** time a two-table join with the small table outside vs the large
table outside (swap the loop order in your join).
**You'll know it works when:** the small-outside plan wins by roughly the size
ratio — and you can state the ratio before running. The planner (Ch 6) exists to
make this choice without you.
**Where it comes from:** Chapter 7 — Joins: Nested Loops to Hash.

**Lab 2.5 — Shard it and feel the tax**
**Goal:** distribution's bill, itemized (Chapter 11).
**Do this:** split keys across two `Minidb` instances by hash, then run one
query that needs both ("count keys matching X").
**You'll know it works when:** the answer is right — and you can list the three
new problems (scatter, gather, partial failure) that the single-box version never
had. That list *is* Chapter 11's table of contents.
**Where it comes from:** Chapter 11 — Replication & Sharding: The Distributed Tax.

## Stretch goals

**Lab 3.1 — Corrupt a page, recover anyway**
**Goal:** the log outranks the data file — prove it with sabotage.
**Do this:** after clean writes, flip bytes in the middle of `minidb.data` with
`dd`, then reopen.
**You'll know it works when:** committed keys still read correctly — replay
overwrites the corruption from the log. (If your toy trusts pages over log,
you've found a real bug to fix: replay must win.)
**Where it comes from:** Chapters 2, 4 and 12.

**Lab 3.2 — Group commit**
**Goal:** the optimization every engine ships, built by you.
**Do this:** batch N `commit_write`s behind one `fsync` (one flush for the group),
then re-run Lab 1.3's `strace` count.
**You'll know it works when:** N commits cost 1 `fsync` — throughput multiplied,
with the honest caveat written down: a crash loses the *group*, never half of it.
**Where it comes from:** Chapter 4.

## Self-checking without a grader

- **Crash labs** (1.1, 1.2, 2.1, 2.2, 3.1): the test is key counts after reopen —
  all committed keys present, zero uncommitted keys present. Any other answer is
  a replay bug, and the WAL file is small enough to read by eye.
- **Count labs** (1.3, 3.2): `strace` counts don't argue — 10 commits, 10
  fsyncs; grouped, 1. The optimization is real when the number moves.
- **Behavior labs** (2.3–2.5): snapshot contents, timing ratios, the three-item
  tax list. Write the prediction *before* running; the gap is the lesson.

## What you now know

- **`kill -9` is a test harness**, not a disaster: a database that fears it is
  unfinished (Labs 1.1, 2.1, 3.1).
- **The WAL is the database; pages are a cache** — every lab re-proved it from a
  different angle, because every production incident will too.
- **Performance work starts at the fsync count** (Labs 1.3, 3.2): measure first,
  batch second, checkpoint third.
- **Scale is a list of new problems** (Lab 2.5), not a bigger box — and you can
  now name each one before it bills you.

Next: point the same three experiments — kill mid-write, count the fsyncs, shard
one query — at whatever database you use at work, and read its docs with new eyes.
