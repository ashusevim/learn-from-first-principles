---
layout: ../../layouts/Chapter.astro
title: 'A File Is a Database'
description: 'Append, scan, index the naive way — and watch every problem a real database exists to solve appear in miniature.'
part: 'Part I — Data on Disk'
written: true
---

You already own a database. `echo "alice,42" >> people.csv` is a database — it persists
data across reboots, it answers queries (`grep alice people.csv`), it's even "ACID-ish"
on a good day. The entire discipline of databases is the list of ways that sentence fails
at scale, plus the data structures invented to fix each one. This chapter builds the naive
version *properly* — so every later chapter has something concrete to improve.

## The lie you were told

> "A database is a special program for storing data."

A database is an **index + a log + a set of guarantees**, wrapped in a query language. The
"special program" part is just engineering those three at scale. By the end of this
course you'll have built all three, small.

## The naive store, taken seriously

```python
# naive.py — a "database" with no database
import sys

def insert(record: str):
    with open("data.db", "a") as f:      # append: O(1)! The ONLY cheap operation here.
        f.write(record + "\n")

def find(name: str):
    for line in open("data.db"):         # full scan: O(n) — this is the enemy
        if line.startswith(name + ","):
            return line.strip()
    return None

insert(sys.argv[1] + "," + sys.argv[2])
print(find(sys.argv[1]))
```

This works. It also contains, in embryo, every problem this course solves:

| Naive behavior | The price | Course chapter that fixes it |
|---|---|---|
| `find` reads *every* record | O(n) lookups | B-trees (Ch 3) |
| One byte written per record, at random offsets | disk hates small random writes | pages (Ch 2) |
| Crash mid-write = torn record, silently corrupt | no durability story | WAL (Ch 4) |
| Two writers append simultaneously | interleaved garbage | transactions (Ch 8) |
| `grep` re-reads the file every time | no cache of hot data | buffer pool (Ch 5) |

Read the right column as this course's table of contents. Databases are *that list*,
industrialized.

## The append-only insight

Notice the one thing the naive store does *well*: **appending**. Appends are sequential
writes — the fastest thing a disk does, and the reason log-structured designs (Ch 10's
LSM trees) exist. The whole field constantly negotiates this tradeoff:

```text
reads want sorted, indexed, jumpable data    (→ B-trees, pages)
writes want cheap, sequential appends        (→ logs, LSM)
crashes want "never half-done"               (→ WAL, atomicity)
```

Every database you'll ever use is a position in that triangle, priced for its workload.

## Prove it to yourself

**1. Feel O(n) hurt** — measure the scan growing:

```sh
python3 -c "
import time, naive
for i in range(200000): naive.insert(f'user{i}', i)
t=time.time(); naive.find('user199999'); print(f'scan: {time.time()-t:.3f}s')"
# then imagine 200 million rows. Same slope. That's why indexes exist.
```

**2. Break durability on purpose** — kill it mid-write:

```sh
python3 -c "naive.insert('crashme', 'x' * 4096)" &
kill -9 %1 2>/dev/null; sleep 0.1
tail -c 100 data.db | xxd | tail -2      # a torn, partial record. Permanently.
```

No error, no rollback — just silent corruption that `find` will happily serve. *This* is
the problem the write-ahead log exists to make impossible.

**3. Watch the OS lie to you** — write the file, check "disk" size, then `sync`:

```sh
dd if=/dev/zero of=data.db bs=1M count=10 2>/dev/null; du -h data.db
```

`du` shows it "on disk" before the OS has flushed anything. The gap between "the OS says
it's written" and "the platters have it" is where WAL lives.

## The build: a spec for the course

Your toy database — the one this course builds piece by piece — must do what `naive.py`
cannot:

1. **Store** records in fixed-size pages (Ch 2), not one-blob-per-line.
2. **Find** by key in O(log n) using a B-tree (Ch 3).
3. **Survive** `kill -9` between any two operations (Ch 4: WAL).
4. **Answer** `SELECT name WHERE age > 30` without reading everything (Ch 6: planner).

Keep `naive.py` around. Every chapter opens by breaking it harder, and closes by fixing
it in your engine.

## What you now know

- A database = **index + log + guarantees**; "special program" is just engineering.
- Appends are the disk's cheapest op; everything else is a negotiated tradeoff.
- Full scans, torn writes, and concurrent appends are the three original sins — each gets
  a chapter and a data structure.
- You have a working naive store to torture; the course will fix it piece by piece.

Next: the first fix — stop pretending you read "rows". The disk reads **pages**, and your
engine will speak the same currency.
