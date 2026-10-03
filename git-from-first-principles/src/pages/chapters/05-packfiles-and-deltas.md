---
layout: ../../layouts/Chapter.astro
title: 'Packfiles & Deltas: Why .git Is Small'
description: 'Loose objects get packed, and similar blobs become deltas. Build: verify-pack shows you the compression by hand.'
part: 'Part II — The Mechanics'
written: true
---

Chapter 1 left a landmine: Git stores a *full snapshot* of every file at every commit —
shouldn't a project with 10,000 commits have 10,000 copies of every file? Your `.git` is
megabytes. The resolution is Git's two-phase storage: loose objects for speed now,
**packfiles with delta compression** for size later. And you can audit every byte of it.

## The lie you were told

> "Git keeping every version of everything is wasteful."

Git keeps every version *once* (content-addressing dedupes identical blobs) — and for
similar-but-different versions, it stores **deltas**: "same as object X, except bytes
50–60 now say this". Deltas aren't per-commit either — Git picks *the most similar object
anywhere in history* as the base, regardless of when it appeared. Grandmother snapshot,
recent delta. It's compression, not history.

## The two storage formats

**Loose objects** — what you made in Chapters 1–4: one zlib file per object under
`.git/objects/xx/`. Simple, fast to write, wasteful (a header + zlib block per file).

**Packfiles** — what `git gc` (and every push/fetch) produces: one big `.pack` file full
of objects in delta form, plus an `.idx` index mapping hash → offset:

```text
.pack:  [header][obj: full][obj: delta vs obj 3][obj: delta vs obj 7]...[trailer sha]
.idx:   sorted hash table → byte offsets into the .pack
```

The `.idx` is why lookups stay O(log n) even with a million objects in one pack.

## Prove it to yourself

**1. Watch loose objects become one pack:**

```sh
git init demo && cd demo
for i in 1 2 3 4 5; do echo "version $i" >> f.txt; git add f.txt; git commit -m "v$i"; done
find .git/objects -type f | grep -v pack | wc -l    # loose objects: many
git count-objects -v                                 # count: 10, size: ~1 KB
git gc -q
git count-objects -v                                 # count: 0 loose, 1 pack
ls -lh .git/objects/pack/                            # one .pack + one .idx
```

**2. Audit the deltas — `verify-pack` shows each object's storage form:**

```sh
git verify-pack -v .git/objects/pack/*.idx | grep blob | sort -k3 -n | tail -5
# e96507...  blob  12  28  ...          ← smallest: one full blob ("version 1")
# 8823ab...  blob  100 110 ... [2]      ← [chain length]: a delta, 2 levels deep
```

The middle columns are (uncompressed size, on-disk size). See the deltas costing ~30 bytes
where full blobs cost ~120? That's the whole answer to "why is .git small", measured.

**3. Deltas across "unrelated" files work too:**

```sh
seq 1 10000 > big.txt && git add big.txt && git commit -m big
seq 1 10005 > big.txt && git add big.txt && git commit -m bigger
git gc -q && git verify-pack -v .git/objects/pack/*.idx | grep blob | tail -2
# the second 75KB file stores as a few hundred bytes of delta
```

## The build: measure the compression yourself

No new code to write this chapter — instead, a measurement that *is* the build:

```sh
#!/bin/sh
# pack-audit.sh — watch a repo's storage shape change as history grows
git init packdemo && cd packdemo
echo "the quick brown fox" > story.txt
for i in $(seq 1 50); do
    echo "chapter $i: something happened" >> story.txt
    git add story.txt && git commit -qm "chapter $i"
    if [ $((i % 10)) -eq 0 ]; then
        printf "commits=%2d  " $i
        du -sh --exclude=.git . | awk '{print "worktree:"$1}' | tr -d '\n'
        git gc -q
        du -sh .git | awk '{print "  .git:"$1}'
    fi
done
git verify-pack -v .git/objects/pack/*.idx | grep blob | wc -l
echo "^ total blob objects in ONE pack — including 50 versions of story.txt"
```

Fifty versions of the file, and `.git` stays a few kilobytes — most versions stored as
tiny deltas. You now understand repo size the way you understand file size: as data
structures, not folklore.

## What you now know

- Two formats: **loose objects** (fast, one file each) and **packfiles** (compact, indexed).
- Deltas are chosen by **content similarity**, not history order — old can reference new.
- `git gc`, pushes, and fetches all pack; `.idx` keeps lookups fast inside big packs.
- "Why is .git so small / so big" is now answerable with `count-objects` and `verify-pack`.

Next: the last mystery command standing — `git status`. It's three comparisons between
the three trees you already know.
