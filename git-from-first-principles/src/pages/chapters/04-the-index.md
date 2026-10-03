---
layout: ../../layouts/Chapter.astro
title: 'The Index: Staging Is a File'
description: 'The staging area is not a concept — it is a binary file you can read. Build: decode .git/index with ls-files --stage.'
part: 'Part II — The Mechanics'
written: true
---

"The staging area" is where Git tutorials get hand-wavy: "files you've marked for commit".
Here's the truth: it's a **single binary file** — `.git/index` — containing a sorted list
of `(mode, hash, path)`. It's a *proposed next tree*. Every staging mystery ("why did my
half-done edit get committed?") dissolves once you see the file.

## The lie you were told

> "git add adds files to Git."

`git add` touches neither history nor the object database's visible state — it **writes
rows into the index file** (and stores the file's blob, Chapter 1). Staging is bookkeeping:
the index *is* "what the next commit's tree will be". Committing (Chapter 2) turns the
index into a tree object, wholesale.

## The three trees, stated plainly

Every Git command that "seems philosophical" is arithmetic between three trees:

```text
HEAD        ← the last commit's tree          (the database)
index       ← the proposed next tree          (.git/index)
worktree    ← your actual files               (the disk)
```

- `git add` → copies worktree state *into the index*.
- `git commit` → writes the index *out as a tree*, points HEAD at it.
- `git checkout <ref>` → copies a tree *out into the index and worktree*.

Chapter 6 turns this into `git status` decomposed. Keep the triangle in your head.

## The file itself

Binary, but transparently structured — a header, then sorted entries (mode, SHA-1, path),
then a checksum:

```sh
git ls-files --stage
# 100644 e96507a9... 0	file.txt       ← mode, blob hash, stage, path
xxd .git/index | head -2            # "DIRC" magic, version, entry count — it's a file
```

That third column, stage 0, is normally boring — except during merge conflicts, when the
same path appears **three times** (stages 1/2/3). Chapter 8 pays that off.

## Prove it to yourself

**1. Watch index rows appear:**

```sh
git init demo && cd demo
echo a > a.txt && echo b > b.txt
git ls-files --stage                 # empty — no rows
git add a.txt
git ls-files --stage                 # one row: a.txt
```

**2. Staging is a proposal, not history:**

```sh
echo changed >> a.txt                # worktree now differs from index
git status --short                   # "MM a.txt": staged change + unstaged change
```

`MM` = the worktree and the index disagree. Nothing about your *commit* changed — the
database is untouched.

**3. The index survives checkout, and checkout rewrites it:**

```sh
git stash list >/dev/null            # (nothing up our sleeves)
git ls-files --stage > /tmp/before
git checkout HEAD -- a.txt           # copy HEAD's tree into index+worktree
git ls-files --stage | diff - /tmp/before
```

## The build: commit without `git commit`, revisited properly

Chapter 2's handmade commit used `hash-object` + `mktree`. With the index, you skip
`mktree` — the index *is* the tree builder:

```sh
#!/bin/sh
# index-commit.sh — stage and commit using only index plumbing
set -e
echo "index-made" > crafted.txt

git update-index --add crafted.txt        # ← this IS git add (to the index file)
git ls-files --stage                      # your row is there

tree=$(git write-tree)                    # index → tree object (Chapter 2!)
commit=$(git commit-tree "$tree" -m "committed straight from the index")
git update-ref refs/heads/main "$commit"

git log --oneline                         # real history, from the real file
```

`update-index` (add), `write-tree` (snapshot the index), `commit-tree` (wrap it),
`update-ref` (move the branch file). **Four plumbing commands are the entire commit
pipeline** — add and commit are just the friendly faces of those steps.

## What you now know

- The staging area is **`.git/index`**: a binary list of (mode, hash, path) — a proposed tree.
- `git add` = write a blob + an index row; `git commit` = index → tree → commit → move ref.
- All Git state questions are comparisons among **HEAD / index / worktree**.
- Merge conflicts will reuse this file with stages 1/2/3 — now you know where to look.

Next: full snapshots forever must mean enormous repos — yet .git is tiny. Packfiles and
deltas are the trick, and you'll audit the compression yourself.
