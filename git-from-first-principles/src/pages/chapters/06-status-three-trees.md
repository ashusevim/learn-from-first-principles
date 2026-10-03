---
layout: ../../layouts/Chapter.astro
title: 'git status Demystified: The Three Trees'
description: 'HEAD, index, worktree — every status line is a comparison between two of them. Build: compute status with plumbing.'
part: 'Part II — The Mechanics'
written: true
---

`git status` is the command everyone runs and nobody understands. Here's the secret: it's
not smart. It's **two comparisons** (plus a listing) between the three trees you've
already met — HEAD (Chapter 2), the index (Chapter 4), and the worktree (your disk). This
chapter rederives every line of status output by hand, and you'll never read it as an
oracle again — you'll read it as arithmetic.

## The lie you were told

> "git status analyzes your repository."

It compares file hashes between three snapshots. That's it:

```text
   HEAD  ──(compare)──  index          = "changes to be committed"   (staged)
   index ──(compare)──  worktree       = "changes not staged"        (unstaged)
   worktree             (files not in index) = "untracked files"
```

Every cryptic two-letter code in `git status --short` is a pair of these comparisons:

```text
   X  = index   vs HEAD      (staged column)
   Y  = worktree vs index    (unstaged column)

   M_  staged modification      _M  unstaged modification
   A_  staged new file          ??  untracked
   D_  staged deletion          _D  unstaged deletion
   MM  staged AND then edited again (the classic "wait what" moment)
```

## The commands behind each comparison

Each status section has a plumbing twin — same data, no formatting:

| Status section | Plumbing equivalent |
|---|---|
| Changes to be committed | `git diff --cached --name-status` (HEAD ↔ index) |
| Changes not staged | `git diff --name-status` (index ↔ worktree) |
| Untracked files | `git ls-files --others --exclude-standard` |
| Deleted (staged) | `git diff --cached --name-status --diff-filter=D` |

`git status` = those four, prettily printed. It has no other sources of truth — there *are*
no other sources of truth (the Linux course's receipts principle, again).

## Prove it to yourself

**1. Reproduce every line of status:**

```sh
git init demo && cd demo
echo a > tracked.txt && git add tracked.txt && git commit -m base
echo b >> tracked.txt                 # unstaged modification
echo c > staged.txt && git add staged.txt   # staged new file
echo d > new.txt                      # untracked

git status --short                    # M_? no wait — read it:
# M  tracked.txt   → hmm, actually:
# M_ won't appear; let's see: "M tracked.txt" (staged col M? no —)
# run the three comparisons yourself:
git diff --cached --name-status       # A  staged.txt      ← the staged column, alone
git diff --name-status                # M  tracked.txt     ← the unstaged column, alone
git ls-files -o --exclude-standard    # new.txt            ← untracked, alone
```

Each status line is exactly one row from exactly one comparison. Cross-check them — they
match, always, by construction.

**2. Manufacture the confusing `MM`:**

```sh
echo edit1 >> tracked.txt && git add tracked.txt   # staged
echo edit2 >> tracked.txt                          # then edited more!
git status --short                                  # MM tracked.txt
```

Column 1: index vs HEAD (edit1 is staged). Column 2: worktree vs index (edit2 isn't).
The "mystery" is two comparisons, read separately.

## The build: your own git status

A 25-line shell script that *is* `git status`, made of plumbing:

```sh
#!/bin/sh
# mystatus.sh — the three comparisons, assembled
echo "On branch $(git symbolic-ref --short HEAD 2>/dev/null || echo '(detached)')"

staged=$(git diff --cached --name-status)
unstaged=$(git diff --name-status)
untracked=$(git ls-files --others --exclude-standard)

[ -n "$staged" ] && { echo; echo "Changes to be committed:"; echo "$staged"; }
[ -n "$unstaged" ] && { echo; echo "Changes not staged for commit:"; echo "$unstaged"; }
[ -n "$untracked" ] && { echo; echo "Untracked files:"; echo "$untracked"; }
[ -z "$staged$unstaged$untracked" ] && echo "nothing to commit, working tree clean"
```

Run it beside `git status` on any repo you have — same sections, same files. When a tool
is 25 lines of comparisons you fully understand, it stops being a source of anxiety.

## What you now know

- `git status` = **HEAD↔index** (staged) + **index↔worktree** (unstaged) + untracked listing.
- `--short` codes are just those two comparison columns, side by side.
- Every section has a plumbing twin you can run yourself — status is a formatter.
- The "three trees" triangle explains add, commit, checkout, reset, and stash alike.

Next: three trees, all local. What happens when a colleague's repo enters the picture?
Remotes — which turn out to be nothing but copying objects and moving pointer files.
