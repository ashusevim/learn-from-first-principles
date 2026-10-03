---
layout: ../../layouts/Chapter.astro
title: 'Merge: Three-Way and the Conflict Markers'
description: 'The merge base, both tips, and what the <<< markers really mean. Build: provoke a conflict and read its anatomy.'
part: 'Part III — Working with Others'
written: true
---

Merge has the worst reputation in version control. It deserves none of it. Given three
snapshots — the common ancestor (the **merge base**) and both branch tips — Git computes
what each side changed *relative to the base* and combines them. Conflicts aren't Git
failing; they're Git honestly reporting: **"both of you changed the same lines, and I will
not choose for you."** Let's provoke one and dissect it line by line.

## The lie you were told

> "Merge combines two branches."

A two-way comparison can't work — if both sides changed the same line from `a` to `b` and
`c`, which wins? Knowing the two endpoints is meaningless without the starting point. So
Git compares **three** trees:

```text
          base: what both sides started from
       ours:    what we changed it to
       theirs:  what they changed it to

per line:  ours == base?  → take theirs      (they changed it, we didn't)
           theirs == base? → take ours       (we changed it, they didn't)
           both differ from base?          → CONFLICT: refuse to guess
```

That's the whole algorithm (real Git diffs line-by-line within files, but the decision
rule is exactly this). "Clean merge" means "each change happened on one side only".

## The DAG pays off

The **merge base** is found by the commit graph from Chapter 2: the best common ancestor
of both tips. After merging, Git creates a commit with **two parents** — the graph
literally merges. That's the "DAG" (directed acyclic graph) your history always was;
Chapter 2 called it a linked list for simplicity, and now it grows a second edge:

```text
before:   A ── B ── D (main)          after:   A ── B ── D ── M
               └── C (feature)                 └── C ────┘
```

M has two parents. `git log --graph` shows the braid.

## Prove it to yourself

**1. Provoke a conflict, on purpose:**

```sh
git init demo && cd demo
echo "line one" > f.txt && git add f.txt && git commit -m base

git checkout -b feature && echo "feature version" > f.txt
git commit -am feature
git checkout master && echo "master version" > f.txt
git commit -am master
git merge feature          # CONFLICT (content): Merge conflict in f.txt
```

**2. Dissect the markers — all three versions, labeled:**

```sh
cat f.txt
# <<<<<<< HEAD
# master version        ← OURS: our change
# =======
# feature version       ← THEIRS: their change
# >>>>>>> feature
```

**3. The killer proof — Git staged all three versions for you:**

```sh
git ls-files -u
# 100644 <base-hash> 1	f.txt      ← stage 1: the merge BASE's version
# 100644 <ours-hash> 2	f.txt      ← stage 2: OURS
# 100644 <theirs-hash> 3	f.txt  ← stage 3: THEIRS
```

Remember Chapter 4's index having one "stage 0" per path? A conflict puts **three stages
in the index** — base, ours, theirs — literally handing you the full three-way comparison.
`git diff` during a conflict shows the same, colored. The markers in your file are just
the human rendering of those index stages.

## The build: resolve by understanding, not by panic

```sh
# See every version side by side, including the base (diff3 style):
git checkout --conflict=diff3 f.txt && cat f.txt
# <<<<<<< ours / ||||||| base / ======= / >>>>>>> theirs
#  ↑ now the conflict shows what it IS: two edits to a shared starting point

# Edit the file to the correct final content (your job — the one thing Git won't guess),
# then finish the merge — which is just: clear stages, store the result, commit it:
echo "the actual resolution" > f.txt
git add f.txt                 # back to a single stage-0 entry (look: ls-files -u is empty)
git commit                    # the merge commit with TWO parents
git log --graph --oneline -4  # the braid, drawn
```

And the base explains *why* merges usually "just work": two people editing **different
lines** means each line still matches the base on one side — the rule resolves everything
silently. Conflicts are rare by construction, not luck.

## What you now know

- Merge = **three-way comparison** against the merge base; clean merge = one-sided changes.
- Conflict markers are a rendering of the index's **stages 1/2/3**: base, ours, theirs.
- A merge commit has two parents — the DAG braids; `--graph` draws it.
- Resolving = writing the right answer, then `git add` (one stage) + commit. No ritual.

Next: rebase — the command everyone fears — which turns out to be Chapter 2's immutability
plus Chapter 3's pointer files, applied repeatedly.
