---
layout: ../../layouts/Chapter.astro
title: 'Reflog: Nothing Is Ever Lost'
description: 'Every move of HEAD is recorded for 90 days. Build: reset --hard your work into oblivion, then bring it back.'
part: 'Part IV — Recovery & Mastery'
written: true
---

The scariest command in Git is `git reset --hard`. The most comforting file is
`.git/logs/`. This chapter connects them: **every position HEAD has ever held is recorded,
with timestamps, for at least 90 days** — and the commits themselves live in the object
database (Chapter 2) until garbage collection, which is far more conservative than its
name suggests. "Git ate my work" is, in every case I've ever seen, recoverable in one
command. Today you'll try to lose work on purpose — and fail.

## The lie you were told

> "git reset --hard destroyed my changes."

`reset --hard` moved two things: a ref file (Chapter 3) and your worktree. It **deleted no
objects**. The commit your branch used to point at is still in `.git/objects`, still fully
intact — it just has no branch aiming at it ("unreachable"). Unreachable objects are
swept by `git gc` only after **90 days by default** (2 weeks for some cases). The reflog
is your map to all of them.

## The reflog is HEAD's diary

```sh
cat .git/logs/HEAD
# 0000000000... a1b2c3...  You  1726000000 +0000  commit (initial): base
# a1b2c3d4... e5f6a7...   You  1726000300 +0000  commit: add feature
# e5f6a7b8... 1a2b3c...   You  1726000600 +0000  reset: moving to HEAD~1   ← the "disaster"
```

Every entry: from-hash, to-hash, why, when. The syntax `HEAD@{2}` means "where HEAD was,
two moves ago". Every ref has its own diary too (`.git/logs/refs/heads/<branch>`), so a
`reset` that moved a branch is separately recoverable — even if HEAD has moved on since.

Why 90 days? Because Git's designers assumed exactly the panic this chapter treats. The
safety margin is a *default*, not an accident.

## Prove it to yourself (the hard way)

**1. Destroy work — genuinely, with reset --hard:**

```sh
git init demo && cd demo
echo base > f.txt && git add f.txt && git commit -m base
echo "three hours of work" > precious.txt
git add precious.txt && git commit -m "PRECIOUS"
git reset --hard HEAD~1
ls                       # precious.txt is GONE. reset --hard wiped the worktree.
git log --oneline        # history acts like it never happened.
```

**2. Now the one command:**

```sh
git reflog
# a1b2c3d HEAD@{0}: reset: moving to HEAD~1
# e5f6a7b HEAD@{1}: commit: PRECIOUS       ← there. Timestamped. Unharmed.
git reset --hard HEAD@{1}      # or: git reset --hard e5f6a7b
ls                             # precious.txt — back, bit for bit
```

Nothing was recovered *from the worktree* — it was recovered from the **object database**,
where it never left. The reset only moved pointers and files.

**3. Recover a deleted branch the same way:**

```sh
git branch -D feature                    # delete a branch: rm a pointer file (Ch 3)
git reflog                               # find where feature pointed... or just:
git branch feature e5f6a7b               # recreate it at any known hash
```

## The build: a recovery drill you'll never need (until you desperately do)

```sh
#!/bin/sh
# disaster-recovery.sh — break everything, then fix everything
set -e
git init demo && cd demo
for i in 1 2 3 4 5; do echo "work $i" > f.txt; git add f.txt; git commit -qm "work $i"; done

good=$(git rev-parse HEAD)                 # 1. remember nothing — reflog will

git reset --hard HEAD~4                    # 2. "disaster": lose four commits
git branch -D master 2>/dev/null || true   # 3. even delete the branch!
git checkout -q --detach                   # 4. detached HEAD, for maximum drama

echo "--- state: no branch, old history, work gone ---"
git log --oneline

found=$(git reflog | grep 'commit: work 5' | head -1 | awk '{print $1}')
git checkout -q -b master "$found"         # 5. rebuild the branch at the found hash
git log --oneline                          # 6. everything back. Nothing was ever lost.
```

Learn the shape: **find the hash (reflog), aim a ref at it (`branch`/`reset`/`checkout`)**.
That's all recovery ever is, because deletion in Git was never deletion — it was
unreferencing.

## What you now know

- **reset --hard moves pointers and worktree; it deletes no objects.**
- `.git/logs` (the reflog) records every HEAD/ref move for ~90 days — with reasons.
- Any "lost" state = an unreachable object; recovery = find its hash, aim a ref at it.
- `git gc` is the only true reaper, and it's patient by default. Fear less; reflog more.

Next: the last tools before the finale — hooks (they're just scripts in a folder),
worktrees, and attributes. Then you build Git itself.
