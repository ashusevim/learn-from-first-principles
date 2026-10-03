---
layout: ../../layouts/Chapter.astro
title: 'Transactions: ACID Without the Buzzwords'
description: 'Atomicity, isolation, durability — each as a concrete mechanism, not an acronym. Build: a mini transaction wrapper on your WAL.'
part: 'Part III — Correctness & Scale'
written: true
---

"ACID-compliant" is marketing; the letters stand for four *separate engineering problems*
with four separate mechanisms — and you've already built two of the mechanisms in this
course. This chapter finishes the set. When you're done, ACID stops being a checkbox in
a vendor's slide deck and becomes a list of things you know how to make true.

## The lie you were told

> "Our database is ACID."

There's no dial called ACID. There are four problems:

| Letter | The problem | The mechanism | Built in |
|---|---|---|---|
| **A**tomicity | half-done multi-step writes | **undo log** (or uncommitted-flag in WAL) | Ch 4 + today |
| **C**onsistency | constraints violated | constraints — mostly *your application's* job | (your code) |
| **I**solation | concurrent writes interleave | locks / MVCC (a whole spectrum!) | Ch 9 |
| **D**urability | power dies after "success" | **fsync'd WAL** | Ch 4 |

"C" is the impostor: the database enforces declared constraints (FKs, unique), but
"consistent" *means* "your data respects your business rules" — the DB can't know those.
A and D are solved by logging; I is the hard one, and gets its own chapter.

## Atomicity: all-or-nothing, mechanically

Your WAL (Chapter 4) already has the pieces. Group writes under one transaction id; mark
the group **committed** with a final commit record. The recovery rule becomes:

```text
replay: apply every change of a tx that has a COMMIT record; discard the rest.
```

A crash mid-transaction? The tx has no commit record — its changes are *never applied*.
Atomicity isn't "the DB was careful"; it's "unfinished work has no witness in the log".

For systems that write in place (undo log instead): record the *old* values first, and
on crash, roll back the half-done tx. Same guarantee, opposite direction.

## Isolation, in one glimpse

Two clients, one counter. Without isolation machinery, interleaving produces a lost
update:

```text
A: read balance=100     B: read balance=100
A: write 100-30=70      B: write 100-20=80      ← B's write clobbers A's. 50 vanished.
```

The fixes are a *spectrum*, not a setting: serial execution (slow, correct), two-phase
locking (blocks readers), snapshot isolation / MVCC (reads see a frozen past — Chapter 9),
or "read uncommitted and pray". **"Isolation level" is the DB asking you which anomalies
you're willing to tolerate** — nothing deeper.

## Prove it to yourself

**1. Atomicity, live:**

```sh
sqlite3 test.db "begin; create table x(v); insert into x values (1);"
sqlite3 test.db "select * from x;"          # empty — another connection can't see it
sqlite3 test.db "rollback;"
sqlite3 test.db "select * from x;"          # still empty: the whole tx vanished. Atomic.
```

**2. Isolation, live:**

```sh
sqlite3 test.db "begin; insert into x values (42);"
sqlite3 test.db "select * from x;"          # doesn't see the uncommitted row
sqlite3 test.db "commit;"
sqlite3 test.db "select * from x;"          # NOW it appears
```

Uncommitted work is invisible to everyone else — that's the baseline isolation contract.

**3. Durability, re-proven:** Chapter 4's kill -9 test. Every "COMMIT succeeded but my
data vanished" story is a database (or app!) skipping the fsync'd log.

## The build: transactions on your WAL

Extend Chapter 4's `wal.py` — one tx id, one commit marker, replay honors both:

```python
# tx.py — atomic multi-key transactions on the Chapter 4 WAL (~30 lines)
import json, os

def begin(): return {"tx": os.getpid(), "ops": []}          # a tx = staged ops

def stage(tx, key, value): tx["ops"].append({"op": "set", "key": key, "value": value})

def commit(tx):                                             # ONE log append: the commit record
    with open("toy.wal", "a") as f:
        for e in tx["ops"]: f.write(json.dumps({**e, "tx": tx["tx"]}) + "\n")
        f.write(json.dumps({"op": "commit", "tx": tx["tx"]}) + "\n")   # the boundary
        f.flush(); os.fsync(f.fileno())                     # atomicity's actual moment

def replay():                                               # Ch 4's replay, tx-aware
    data, committed = {}, set()
    for line in open("toy.wal"):
        e = json.loads(line)
        if e["op"] == "commit": committed.add(e["tx"])      # only whole txs count
        else: e["_tx"] = e["tx"]
    for line in open("toy.wal"):
        e = json.loads(line)
        if e.get("op") == "set" and e["tx"] in committed:
            data[e["key"]] = e["value"]
    return data

# usage: two keys, one fate — kill -9 between them changes nothing
tx = begin(); stage(tx, "a", 1); stage(tx, "b", 2); commit(tx)
print(replay())     # {'a': 1, 'b': 2} — both, or neither. Forever.
```

**The two-pass replay is the tell:** pass 1 finds which txs committed, pass 2 applies only
those. That's the entire trick inside every real recovery algorithm.

## What you now know

- ACID is **four separate mechanisms**: undo/commit records (A), constraints (C),
  locks/MVCC (I), fsync'd WAL (D). You've built A and D.
- Atomicity = *unfinished work has no commit record* — replay skips it, mechanically.
- Isolation is a **spectrum of tolerated anomalies**, chosen per application.
- "Consistent" mostly means *your code* respects your business rules. The DB can't.

Next: the isolation chapter — how databases let readers and writers run together *at
all*. The answer is a gorgeous trick: keep every version of every row.
