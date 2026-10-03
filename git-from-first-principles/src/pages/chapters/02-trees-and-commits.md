---
layout: ../../layouts/Chapter.astro
title: 'Trees & Commits: Snapshots, Not Diffs'
description: 'A commit points at a tree, a tree points at blobs. Build: craft a commit with plumbing commands, no git add in sight.'
part: 'Part I — The Object Database'
written: true
---

"A commit is a set of changes." No. This single misconception causes half of all Git
confusion — rebase fear, merge confusion, the whole "what will it do to my files" anxiety.
A commit is a **snapshot of the entire project** at an instant, and it points *backwards*
to its parent. Diffs are computed later, for humans, from two snapshots. Let's build a
commit by hand and watch the object graph assemble.

## The lie you were told

> "Git stores the diffs between versions."

Git stores **full snapshots**. Every commit pins down what *every* file looked like at
that moment (files that didn't change are shared blobs — Chapter 1's deduplication doing
the work). Diff tools exist in Git the same way they exist on your disk: as *comparisons*,
computed on demand. Snapshots are the storage; diffs are the reporting.

## Two more object types: tree and commit

The object database from Chapter 1 holds four kinds of objects. You know blobs; here are
the other two that make history:

```text
commit ──► tree ──► blob file.txt
   │          └─────► blob other.txt
   └─ parent: the previous commit (also a commit object)
```

**Tree** — a directory snapshot: a list of `(mode, type, hash, name)`. Not "changes to a
directory" — the directory, whole, at that instant.

**Commit** — a small text object: which tree, which parent(s), who, when, and the message.
That's the whole thing — the "commit" you make is a ~200-byte text file in the database.

## Prove it to yourself

**1. Dissect a real commit:**

```sh
git init demo && cd demo
echo "v1" > file.txt && git add file.txt && git commit -m "first"
git cat-file -p HEAD          # ← print the commit object itself
# tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
# author You <you@x> 1726000000 +0000
#
#     first
```

**2. Follow the arrows** — print the tree the commit points at:

```sh
git cat-file -p HEAD^{tree}
# 100644 blob e96507a9...  file.txt        ← mode, object type, hash, name
git cat-file -p e96507a9         # "v1" — your file's content, from the database
```

Three `cat-file` calls and you've walked the entire graph: commit → tree → blob.

**3. Snapshots, not diffs — check that unchanged files share blobs:**

```sh
echo "v2" >> file.txt && git add file.txt && git commit -m "second"
git ls-tree HEAD~1 HEAD~2 2>/dev/null; git ls-tree HEAD | head -3
# same hash for unchanged files — because they ARE the same blob
```

## The build: a commit with zero porcelain

`git add` and `git commit` are conveniences. Here's the same result using only the
plumbing — you assemble the graph yourself:

```sh
#!/bin/sh
# handmade-commit.sh — build a commit without add/commit
set -e
echo "handmade" > crafted.txt

# 1. store the file in the object database (Chapter 1)
blob=$(git hash-object -w crafted.txt)

# 2. build a tree containing it (mode 100644, type blob, hash, name)
tree=$(printf '100644 blob %s\tcrafted.txt\n' "$blob" | git mktree)

# 3. create a commit object pointing at that tree (parent optional for root)
commit=$(git commit-tree "$tree" -m "a commit built by hand")

# 4. aim a branch at it — a pointer file (next chapter's whole point)
git update-ref refs/heads/handmade "$commit"

git log --oneline handmade     # git log reads it like any other history
```

Four commands, each mapping to one arrow in the diagram: blob → tree → commit → ref.
`git add` is (roughly) steps 1–2 into the index; `git commit` is steps 3–4. There is no
third thing.

## What you now know

- A commit = **tree + parent(s) + author + message** — a ~200-byte text object.
- Trees are **complete directory snapshots**; diffs are computed later, for display.
- `mktree` and `commit-tree` are the "real" names of what add/commit wrap.
- History is a linked list (really a DAG — Chapter 8) of immutable snapshots.

Next: the object graph exists. So what, exactly, is a *branch*? Prepare to be insulted by
how small the answer is.
