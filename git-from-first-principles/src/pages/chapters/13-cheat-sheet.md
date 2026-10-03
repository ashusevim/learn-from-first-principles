---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Git on One Page'
description: 'The object database, refs, the index and the DAG on one page — the model, the plumbing, and the recovery commands.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one sentence: **Git is a content-addressed filesystem with a
garbage-collection-resistant log on top**. Commits point to trees, trees point
to blobs, refs point to commits — and every command you type moves a pointer,
writes an object, or (rarely) both.

## The one-page model

```text
  working tree → index (the proposed tree) → commit (tree + parents + message)
       files         .git/index              objects/ + refs/heads/<branch>
```

`HEAD` says where you are, the index says what goes next, branches are 41-byte
files holding a SHA-1. The DAG never rewrites — new commits only *add* nodes,
and "history rewriting" adds different nodes while moving the label (Ch 9).

## The Git you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `objects/xx/rest` = `zlib(kind + len + \0 + data)` | every object, one format, named by hash | 1 |
| blob / tree / commit / tag | file bytes / directory listing / snapshot+parents / label | 1–2 |
| `store(kind, data)` → SHA-1 | write the object, get its name | 12 |
| `load(key)` | read any object by hash — nothing is hidden | 12 |
| branch = file with one hash | moving it is a one-line write | 3 |
| `HEAD` (usually `ref: refs/heads/...`) | which branch the next commit extends | 3 |
| the index | the staged tree, a flat list of (path, hash, mode) | 4 |
| packfiles + deltas | old objects compressed against similar ones | 5 |
| `status` = diff HEAD↔index↔worktree | the three trees, compared pairwise | 6 |
| fetch = copy objects, move remote refs | nothing merges until you say so | 7 |
| merge = three-way over the base | base + ours + theirs, hunk by hunk | 8 |
| rebase = new nodes, moved label | same diffs, different parents — hashes change | 9 |
| reflog | every move HEAD ever made, with timestamps | 10 |
| hooks / worktrees / attributes | scripts on events, many trees, per-path rules | 11 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Editing history others pulled | their DAG and yours diverge; merges resurrect the "deleted" | Chapter 9 |
| Committing secrets, then "removing" them | the blob lives in history — removal needs a rewrite + rotation | Chapters 2, 9 |
| Assuming a merge keeps "your" version | three-way picks hunks, not sides — read the markers | Chapter 8 |
| `checkout` with dirty work, carelessly | the worktree is not the index; files can be overwritten | Chapters 4, 6 |
| Deleting the "only" branch | the commits stay until GC — reflog first, panic never | Chapter 10 |
| Force-pushing a shared branch | everyone else's base moves under them | Chapters 7, 9 |
| Trusting `status` to show everything | ignored/untracked rules hide files by design | Chapters 6, 11 |
| One giant commit "to be safe" | the DAG loses the story; bisect and revert die with it | Chapters 2, 6 |
| Rebasing merge commits by default | the topology flattens; the true history folds away | Chapter 9 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Save work privately | a commit on a branch — cheap, local, complete | it must be found — push the ref (Ch 7) |
| Combine two lines | merge for truth, rebase for a clean story | it is shared — never rebase it (Ch 8–9) |
| Undo safely | revert (new commit) or a branch move with reflog backup | it is unpushed — reset freely (Ch 10) |
| Move work between machines | fetch, then merge/rebase deliberately | you want their state exactly — reset to their ref (Ch 7) |
| Automate policy | hooks on commit/push, attributes per path | the team must agree — hooks don't sync (Ch 11) |
| Two checkouts at once | a worktree, not a second clone | disk is dear — one tree, stashes (Ch 11) |

## Prove it to yourself

**1. A branch is 41 bytes:**

```sh
git rev-parse main > /tmp/h && wc -c /tmp/h   # 41: 40 hex + newline
cat .git/refs/heads/main                       # the same 40 hex — that IS the branch
```

**2. Objects are just files:**

```sh
echo hello | git hash-object --stdin          # a SHA-1, computed, stored nowhere
echo hello | git hash-object -w --stdin       # same SHA-1 — NOW it is stored
find .git/objects -type f | head -3           # xx/rest — keyed exactly so (Ch 1)
```

**3. The reflog remembers:**

```sh
git reset --hard HEAD~1 --quiet && git log --oneline -1   # "lost" a commit…
git reflog -3                                              # …there it is, with a timestamp
```

## What you now know

- **Four objects, three trees, one DAG:** blobs/trees/commits/tags; HEAD,
  index, worktree; parents make history a graph you can walk.
- **Commands move pointers or write objects** — classify any new command that
  way and its danger level follows.
- **Nothing is ever lost until GC**, and the reflog is the receipt drawer (Ch 10).
- Sharing rules are social: rebase-private, merge-public, force-push never.

Next: twelve labs that operate mini-git like a surgeon — corrupt nothing, lose
nothing, and recover everything at least once.
