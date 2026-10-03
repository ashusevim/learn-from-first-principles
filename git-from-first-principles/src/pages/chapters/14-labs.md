---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on mini-git from Chapter 12 — objects, refs, merges, recovery. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a hash, a file, or a recovered commit from
mini-git (`store`, `load`, `cmd_init/add/commit/log/status`) in Chapter 12.
Nothing here is new — objects (Ch 1), refs (Ch 3), the index (Ch 4), merges
(Ch 8), the reflog (Ch 10). What is new is operating on the plumbing with your
own hands until the porcelain feels thin.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Work in `/tmp/mglab` (mini-git repos are disposable); keep real
`git` beside mini-git — agreement between the two is the verdict.

| Tool | What it proves |
|---|---|
| `store("blob", data)` / `load(key)` | the object round-trip |
| `cmd_add` / `cmd_commit` / `cmd_log` | the write path, end to end |
| `git hash-object` / `git cat-file` | the reference implementation agrees |
| `ls .git/refs`, `cat .git/HEAD` | pointers are files you can read |

## Warm-ups

**Lab 1.1 — Same bytes, same name**
**Goal:** content addressing is deterministic — the hash *is* the identity.
**Do this:**
```python
a = store("blob", b"hello\n")
b = store("blob", b"hello\n")
print(a == b, load(a))
```
**You'll know it works when:** `True` and `b'hello\n'` — one object, two writes,
zero duplicates. Then check with real git: `git hash-object` on the same bytes
prints the same 40 hex.
**Where it comes from:** Chapter 1 — Git Is a Key-Value Store.

**Lab 1.2 — Read any object raw**
**Goal:** nothing is hidden — objects are files with a tiny header.
**Do this:** pick any hash from Lab 1.1, open
`objects/<first-2>/<rest-38>`, `zlib.decompress` it, and print the bytes.
**You'll know it works when:** you see `blob 6\0hello\n` — kind, length, NUL,
data. The format fits in one line because it *is* one line.
**Where it comes from:** Chapters 1 and 5.

**Lab 1.3 — A branch is a file**
**Goal:** refs are 41 bytes, editable with `echo`.
**Do this:** `cmd_commit` twice on `main`, `cat` the ref file, then move it back
one commit with `echo <first-hash> > <ref-file>`.
**You'll know it works when:** `cmd_log` shows one commit — and the second is
still in `objects/`, orphaned but intact. Moving history is moving a pointer.
**Where it comes from:** Chapter 3 — Branches & HEAD: It's All Just Files.

## Builds

**Lab 2.1 — Stage exactly one hunk**
**Goal:** the index is a *proposed* tree, not a mirror (Chapter 4).
**Do this:** edit two lines in one file, `cmd_add` the file, edit a third line,
then inspect the index vs the worktree.
**You'll know it works when:** the committed tree (after `cmd_commit`) holds two
changed lines while the worktree holds three — the index froze the proposal at
`add` time. Commit early, commit partial: the index allows both.
**Where it comes from:** Chapter 4 — The Index: Staging Is a File.

**Lab 2.2 — Status from three diffs**
**Goal:** `cmd_status` as pairwise comparison: HEAD↔index, index↔worktree.
**Do this:** craft one file staged-but-uncommitted and one modified-after-staging,
then read `cmd_status` line by line against the two diffs computed by hand:

```sh
python3 minigit.py status        # HEAD<->index lines vs index<->worktree lines
python3 -c "from minigit import *; print(index_diff(), worktree_diff())"
```

**You'll know it works when:** every status line traces to exactly one of the
two diffs — no line unexplained, no diff unreported. Status demystified is
status trusted.
**Where it comes from:** Chapter 6 — git status Demystified: The Three Trees.

**Lab 2.3 — Merge without drama**
**Goal:** three-way merge over a real base, in objects you can inspect.
**Do this:** branch from commit B, change line 10 on `main`, change line 20 on
the branch, merge by hand: base B + ours + theirs.
**You'll know it works when:** both changes survive in one commit with two
parents — and `load()` of the merge shows the base hash recorded. Convergent
edits merge themselves; the base is what makes it safe.
**Where it comes from:** Chapter 8 — Merge: Three-Way and the Conflict Markers.

**Lab 2.4 — Conflict, then read the markers**
**Goal:** the same line edited twice — the merge stops and asks.
**Do this:** repeat Lab 2.3 with both sides editing line 10 differently, and
open the conflicted file:

```text
<<<<<<< main
score = wins + 1
=======
score = wins + 2
>>>>>>> feature
```

**You'll know it works when:** `<<<<<<<` / `=======` / `>>>>>>>` mark the two
versions with their commit names — resolve by editing to one version, `cmd_add`,
commit. The markers are the UI; the DAG never broke.
**Where it comes from:** Chapter 8.

**Lab 2.5 — Rebase moves the label**
**Goal:** same diffs, new parents — hashes change, content doesn't.
**Do this:** record a branch tip's tree hash, rebase it onto a newer `main`,
and compare tree hashes before/after:

```sh
python3 minigit.py log --format='%H %T' feature   # commit hash + tree hash, before
python3 minigit.py rebase main
python3 minigit.py log --format='%H %T' feature   # commits differ, trees match
```

**You'll know it works when:** commit hashes changed, tree hashes match — the
*snapshots* are identical, only the *history* is new. That sentence is the whole
of Chapter 9's safety lecture in one experiment.
**Where it comes from:** Chapter 9 — Rebase: Rewriting History.

## Stretch goals

**Lab 3.1 — Lose everything, recover everything**
**Goal:** the reflog as the receipt drawer (Chapter 10), end to end.
**Do this:** `reset --hard` three commits back, delete the branch, then recover
the tip from the reflog and re-create the branch at exactly that hash.
**You'll know it works when:** `cmd_log` shows all three commits again,
byte-identical hashes. Nothing was ever deleted — only the label moved, twice.
**Where it comes from:** Chapter 10 — Reflog: Nothing Is Ever Lost.

**Lab 3.2 — Pack the attic**
**Goal:** deltas against similar objects (Chapter 5), measured.
**Do this:** commit a 1 MB text file ten times with one-line changes, then pack
(the course's pack path or real `git gc`), and compare `.git` size before/after.
**You'll know it works when:** ~10 MB collapses toward ~1 MB — the deltas
stored ten edits, not ten files. Loose objects are the truth; packs are the rent.
**Where it comes from:** Chapter 5 — Packfiles & Deltas: Why .git Is Small.

## Self-checking without a grader

- **Hash labs** (1.1, 1.2, 2.5): 40-hex agreement — mini-git vs real git, before
  vs after. Hashes match or something lied; there is no third option.
- **State labs** (1.3, 2.1, 2.2): file contents after moves — one commit shown,
  two lines committed, every status line sourced. Read the files; they confess.
- **Recovery labs** (2.3, 2.4, 3.1, 3.2): merge results, resolved markers,
  restored tips, shrunken bytes. The DAG is small enough to walk whole — walk it.

## What you now know

- **Every porcelain command is plumbing you can run:** status is two diffs,
  merge is base+ours+theirs, rebase is new nodes plus a moved label.
- **Deletion is a label move** until GC runs (Labs 1.3, 3.1) — which reframes
  every "lost work" panic as a lookup problem.
- **History edits are social, not technical** (Lab 2.5): the hashes change
  mechanically; the breakage is everyone else's base moving.
- You can now read any git disaster thread and prescribe: reflog first, pointers
  second, panic never.

Next: `git cat-file -p` your way through a real repository's history — every
object you meet will have a mini-git cousin, and the big tool will feel small.
