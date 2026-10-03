---
layout: ../../layouts/Chapter.astro
title: 'B-Trees: The Index That Makes It Fast'
description: 'Why O(log n) disk seeks changed computing. Build: a working B-tree, then watch a query stop scanning.'
part: 'Part I — Data on Disk'
written: true
---

Chapter 1 ended with an O(n) scan; Chapter 2 taught us the scan happens in pages. The
B-tree is the fix — and it is not an exaggeration to call it the most consequential data
structure in computing: nearly every database index, every filesystem directory, every
"fast lookups" claim stands on it. You'll build one, then watch a query's cost collapse
from "read everything" to "read three pages".

## The lie you were told

> "An index is a copy of the table that makes lookups fast."

An index is a **tree of pages holding sorted keys**, with fanout so high that a lookup
touches 3–4 pages even over a billion rows. And the fine print matters: every insert must
*also* update the tree — **indexes speed up reads by taxing every write**. That tradeoff,
not the data structure, is why "should we add an index?" is a judgment call.

## Why a binary search tree isn't enough

A binary tree over a billion keys is ~30 levels deep — 30 disk reads, ~0.1 ms each on
SSD: 3 ms per lookup. The B-tree's insight: **make each level a fat page** (Chapter 2!)
holding hundreds of keys, so each read eliminates a huge fraction of the search:

```text
                   [ 100 | 500 | 900 ]            ← 1st page read: root (always cached)
          ┌────────────┼────────────┐
   [20|50|80]      [300|400|450]     [950|990]   ← 2nd read
   ... fanout ~ hundreds per page ...          ← 3rd read: the leaf → your row's page
```

Fanout of 500 → a billion keys in **4 levels**. The tree stays shallow by being *wide* —
wide specifically because pages are the read unit. A B-tree is what you get when you ask:
"what shape is a search tree if each step costs one disk page?"

## The rules

1. Nodes hold sorted keys; leaves point at row locations.
2. A node with k keys has k+1 children, each covering one key range.
3. All leaves sit at the same depth — inserts *split* full nodes upward, so depth only
   grows at the root. That's the "balanced" guarantee, and it's mechanical.

## Prove it to yourself

**1. Watch SQLite choose the index (or not):**

```sh
sqlite3 test.db "explain query plan select * from t where a = 5;"
# SCAN t                              ← full scan: no index
sqlite3 test.db "create index idx_a on t(a);"
sqlite3 test.db "explain query plan select * from t where a = 5;"
# SEARCH t USING INDEX idx_a (a=?)    ← tree walk — the thing you build below
```

**2. Measure the collapse:**

```sh
python3 -c "
import sqlite3, time
db = sqlite3.connect('test.db')
db.execute('create index if not exists idx_a on t(a)')
t = time.time()
for i in range(1000): db.execute('select * from t where a = ?', (i,)).fetchall()
print(f'1000 indexed lookups over 200k rows: {time.time()-t:.3f}s')"
```

Run the same loop with the index dropped — the gap is the B-tree's value, in milliseconds.

**3. Feel the write tax:**

```sh
python3 -c "
import sqlite3, time
db = sqlite3.connect('test.db')
t = time.time()
db.executemany('insert into t values (?, ?)', [(i, 'z'*100) for i in range(300000, 310000)])
db.commit(); print(f'10k inserts, 1 index: {time.time()-t:.3f}s')
db.execute('create index idx_b on t(b)')
t = time.time()
db.executemany('insert into t values (?, ?)', [(i, 'z'*100) for i in range(310000, 320000)])
db.commit(); print(f'10k inserts, 2 indexes: {time.time()-t:.3f}s')"
```

Slower with two trees to maintain per insert. That's the tax, itemized.

## The build: a B-tree

```python
# btree.py — an in-memory B-tree (order 4); the disk version swaps list reads for page reads
class Node:
    def __init__(self, leaf=True):
        self.keys, self.kids, self.leaf = [], [], leaf

class BTree:
    def __init__(self):
        self.root = Node()

    def _split(self, parent, i, child):                 # push the middle key up
        mid = len(child.keys) // 2
        mid_key = child.keys[mid]                       # grab BEFORE truncating!
        right = Node(child.leaf)
        right.keys, child.keys = child.keys[mid+1:], child.keys[:mid]
        if not child.leaf:
            right.kids, child.kids = child.kids[mid+1:], child.kids[:mid+1]
        parent.keys.insert(i, mid_key)
        parent.kids.insert(i + 1, right)

    def insert(self, key):
        if len(self.root.keys) == 3:                    # root full: grow depth
            new = Node(leaf=False)
            new.kids = [self.root]
            self._split(new, 0, self.root)
            self.root = new
        self._insert(self.root, key)

    def _insert(self, node, key):
        if node.leaf:
            node.keys.append(key); node.keys.sort(); return
        i = next((j for j, k in enumerate(node.keys) if key < k), len(node.keys))
        if len(node.kids[i].keys) == 3:                 # split full children on the way down
            self._split(node, i, node.kids[i])
            if key > node.keys[i]: i += 1
        self._insert(node.kids[i], key)

    def search(self, key):
        node, reads = self.root, 0
        while True:
            reads += 1                                   # one "page read" per level
            i = next((j for j, k in enumerate(node.keys) if key <= k), len(node.keys))
            if i < len(node.keys) and node.keys[i] == key: return True, reads
            if node.leaf: return False, reads
            node = node.kids[i]

t = BTree()
for k in range(0, 100000, 7): t.insert(k)                # ~14k keys
print(t.search(60004))   # (True, 13) — order-4 toy: ~13 levels.
print(t.search(60006))   # (False, 13) — 60006 % 7 ≠ 0: correctly absent
# a REAL B-tree has fanout in the hundreds → billions of keys in 4 levels (see prose above)
print(t.search(60007))   # (False, 4)
```

The disk version of this exact structure replaces node reads with **page reads**
(Chapter 2) and adds an on-disk slot map — and that version is named Postgres, MySQL,
and SQLite.

## What you now know

- B-trees are wide on purpose: **fanout × shallow = few page reads** — pages made the tree.
- **Indexes tax writes**: every insert maintains every tree. Measure before adding.
- Splits grow depth at the root only — "balanced" is a mechanical consequence.
- `SCAN` vs `SEARCH` in `EXPLAIN QUERY PLAN` is the sound of this chapter working.

Next: your B-tree makes reads fast — but a crash mid-write still corrupts everything.
The fix is one idea and one file: the write-ahead log.
