---
layout: ../../layouts/Chapter.astro
title: 'Pages: The Storage Engine’s Currency'
description: 'Databases never read rows — they read 4–16 KB pages. Build: a slotted-page writer that stores and fetches records.'
part: 'Part I — Data on Disk'
written: true
---

You think in rows; the database thinks in **pages**. No database on Earth fetches "the row
for alice" from disk — it fetches the 4–16 KB block containing alice's row, plus possibly
a hundred rows you didn't ask for. This single mismatch between your mental model and the
machine explains why `SELECT *` hurts, why row order matters, and what "I/O bound" really
means. Let's build the currency.

## The lie you were told

> "The database reads the row you asked for."

Disks (even SSDs) have a minimum efficient read — a **page**: 4 KB on Postgres, 16 KB on
InnoDB by default. Reading 1 row and reading 50 rows on the same page cost *the same I/O*.
The database's entire storage layer is an exercise in arranging rows so that the rows you
use together **live together**.

## The slotted page

How do you fit variable-length records into a fixed-size page and still find them? The
answer every major database uses — the **slotted page**:

```text
┌────────────────────────────────────────────┐
│ header: #slots, free-space pointer         │
│ slot array: [offset,len] [offset,len] ...  │  ← grows DOWN from the top
├────────────────────────────────────────────┤
│              ...free space...              │
├────────────────────────────────────────────┤
│      record 3   record 2   record 1        │  ← records grow UP from the bottom
└────────────────────────────────────────────┘
```

Slots point at records; records pack against the page's end. Deleting a record frees its
slot (the bytes stay, the slot is nulled) — and *now you know what "vacuum" is for*: pages
full of freed slots need compacting. Every mystery has a byte-level cause.

## Files are arrays of pages

A database file is just pages back to back — so **page N is at byte offset N × page_size**.
That's the whole addressing scheme. An index (Chapter 3) is a machine for turning a key
into a page number in as few disk reads as possible.

## Prove it to yourself

**1. See your database's page size:**

```sh
sqlite3 test.db "pragma page_size;"      # 4096
ls -l test.db                            # file size is a multiple of it
```

**2. Watch layout become cost** — 200k rows, then look up one row cold:

```sh
python3 -c "
import sqlite3, time
db = sqlite3.connect('test.db')
db.execute('create table t(a int, b text)')
db.executemany('insert into t values (?, ?)', [(i, 'x'*100) for i in range(200000)])
db.commit()
t = time.time(); db.execute('select * from t where a = 199999').fetchall()
print(f'one row, full scan: {time.time()-t:.4f}s')"
```

That time is page reads, not "finding" the row. Layout is destiny.

**3. See pages churn on tiny updates** — why big UPDATEs bloat files:

```sh
ls -l test.db
sqlite3 test.db "update t set b = 'y' where a < 100;"
ls -l test.db      # the file grew — whole pages were rewritten for a few bytes
```

## The build: a slotted page, from bytes

This ~40-line Python class is the real storage format of every serious database,
miniaturized:

```python
# page.py — a slotted page: fixed 4096 bytes, slots from top, records from bottom
PAGE_SIZE = 4096

class Page:
    def __init__(self, data=None):
        self.data = bytearray(data or bytes(PAGE_SIZE))
        self.nslots = int.from_bytes(self.data[0:2], "big")   # header: slot count

    def insert(self, record: bytes) -> int:
        if self.nslots == 0:
            rec_off = PAGE_SIZE                                # first record: at the very end
        else:                                                  # below the current last record
            last = 2 + (self.nslots - 1) * 4
            rec_off = int.from_bytes(self.data[last:last+2], "big")
        rec_off -= len(record)                                 # make room at the bottom
        self.data[rec_off:rec_off + len(record)] = record

        slot_off = 2 + self.nslots * 4                         # new slot array entry
        self.data[slot_off:slot_off + 4] = rec_off.to_bytes(2, "big") + len(record).to_bytes(2, "big")
        self.nslots += 1
        self.data[0:2] = self.nslots.to_bytes(2, "big")
        return self.nslots - 1                                 # the record's slot id

    def get(self, slot: int) -> bytes:
        off = 2 + slot * 4
        start = int.from_bytes(self.data[off:off+2], "big")
        length = int.from_bytes(self.data[off+2:off+4], "big")
        return bytes(self.data[start:start + length])

p = Page()
s1 = p.insert(b"alice,42")
s2 = p.insert(b"bob,31")
print(p.get(s1), p.get(s2))          # b'alice,42' b'bob,31' — from ONE 4KB read
open("heap.db", "wb").write(p.data)  # a one-page "database file"
```

`Page.insert` returns a **slot id** — and (page_id, slot_id) is, byte for byte, what real
databases call a **rowid / ctid**. You've just built the address format of every row you've
ever queried.

## What you now know

- The database's I/O unit is the **page** (4–16 KB); row-level reads don't exist on disk.
- **Slotted pages** = slot array down + records up; deletes leave holes; vacuum compacts.
- A file is an array of pages: **page N = offset N × page_size**. That's addressing, done.
- (page_id, slot_id) — the true address of a row — is something you've now built.

Next: a page lookup by key is still a scan if you're unlucky. The data structure that
turns "find by key" into a handful of page reads is the most important structure in
computing: the B-tree.
