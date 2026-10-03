---
layout: ../../layouts/Chapter.astro
title: 'Branches & HEAD: It’s All Just Files'
description: 'A branch is a 41-character text file. HEAD is a pointer file. Build: create and switch branches by writing files.'
part: 'Part I — The Object Database'
written: true
---

The scariest word in Git — "branches" — describes the least significant data in the entire
system. After Chapter 2, you know commits are immutable snapshots in a graph. A branch?
**A 41-character text file containing one hash.** Creating one costs one `fwrite`. Deleting
one costs one `rm`. This chapter will permanently cure branch anxiety.

## The lie you were told

> "Creating a branch copies the project."

Nothing is copied. The object database (all your snapshots) sits untouched; a branch is
just a *name for one commit hash*, written in `.git/refs/heads/`:

```sh
cat .git/refs/heads/main
# a1b2c3d4e5f6...   ← the entire contents of "main": one hash
```

Compare: SVN copied the tree (expensive). Mercurial tracked branches in a database. Git
outsourced branches to the *filesystem* — a directory listing of `.git/refs/heads/` **is**
your branch list.

## HEAD: the cursor

So which branch are you "on"? `.git/HEAD` is another text file, saying which pointer:

```sh
cat .git/HEAD
# ref: refs/heads/main
```

When you commit, Git: writes the new commit object, then **updates the file HEAD points
to**. That's all. "Checking out a branch" = repointing HEAD + syncing your worktree to
that commit's tree. (And `checkout <hash>` directly writes a raw hash into HEAD — the
famous "detached HEAD": you're not broken, HEAD just isn't aiming at a branch file.)

## Prove it to yourself

**1. Watch the ref file move as you commit:**

```sh
git init demo && cd demo
echo v1 > f.txt && git add f.txt && git commit -m one
cat .git/refs/heads/main        # hash A
echo v2 > f.txt && git add f.txt && git commit -m two
cat .git/refs/heads/main        # hash B — the FILE changed, that was the commit
```

**2. Branches are files — create one with `echo`:**

```sh
echo $(git rev-parse main) > .git/refs/heads/feature
git branch                      # feature exists. You made it with echo.
git log --oneline feature       # same history as main — same hash, of course
```

**3. HEAD is a file — switch with `echo`:**

```sh
echo "ref: refs/heads/feature" > .git/HEAD
git status | head -1            # On branch feature
```

(You wouldn't *work* this way — `git switch` also syncs the worktree — but you'll never
wonder what a branch "is" again.)

## The build: the whole branch dance, file-operations only

```sh
#!/bin/sh
# handmade-branch.sh — branch, "checkout", commit, merge-forward — no porcelain
set -e
git init demo && cd demo
echo v1 > f.txt && git add f.txt && git commit -m one

main=$(git rev-parse HEAD)                          # where main points
echo "$main" > .git/refs/heads/feature              # 1. create branch = write file
echo "ref: refs/heads/feature" > .git/HEAD          # 2. "checkout" = repoint HEAD

echo v2 > f.txt && git add f.txt                    # 3. commit on feature
git commit -m two
feature=$(git rev-parse HEAD)

echo "ref: refs/heads/main" > .git/HEAD             # 4. back to main
git merge feature --ff-only                         # fast-forward: just move the file
cat .git/refs/heads/main                            # == $feature. main moved. That's a merge.
```

The fast-forward "merge" at the end is the reveal: when the target branch is a direct
ancestor, merging is *moving one pointer file forward*. No objects created. Merge anxiety
starts dying here, and Chapter 8 finishes it.

## What you now know

- A branch = **one text file in `.git/refs/heads/`** containing one commit hash.
- **HEAD** = a file saying which ref you're on; committing = moving that ref file forward.
- Creating/deleting branches is O(1) file I/O — the fear is unfounded by construction.
- Detached HEAD isn't an error — it's HEAD containing a hash instead of a ref name.

Next: between your worktree and the database sits one more file — the index. Staging is
not a UI concept; it's a file you can read.
