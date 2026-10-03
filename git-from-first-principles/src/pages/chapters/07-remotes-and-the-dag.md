---
layout: ../../layouts/Chapter.astro
title: 'Remotes: Copying Objects, Moving Pointers'
description: 'fetch/push are just "copy missing objects + update remote refs". Build: push to a bare repo and inspect both sides.'
part: 'Part III — Working with Others'
written: true
---

push and fetch are where Git stops feeling like a local tool and starts feeling like
"network stuff" — which is where most people stop understanding it. Remove the mystery:
**fetch = copy objects you're missing from them + record their branch pointers locally.
push = the same in reverse, plus permission to move *their* branch files.** That's the
whole protocol shape. You'll prove it on two directories you can see both sides of.

## The lie you were told

> "push uploads my commits to the server."

There's no "server logic". A remote repo has exactly what you have: an object database and
ref files. Pushing walks the commit graph, sends every object the remote lacks, then asks
the remote to update its ref file (`refs/heads/main`) to your new hash. A rejected push
("non-fast-forward") isn't a network error — it's the remote *declining to move a pointer
backwards*, because that would hide commits people may have.

## Remotes are addresses + a local mirror

`.git/config` holds the addresses; `.git/refs/remotes/` holds **local copies of their
pointers**:

```sh
git remote add origin https://github.com/x/y.git   # just a config entry
git fetch origin                                    # copy objects + update refs/remotes/origin/*
cat .git/refs/remotes/origin/main                   # their main, as of your last fetch
```

Crucial: `origin/main` is **your stale snapshot of their pointer**, frozen at fetch time.
`git status`'s "your branch is behind origin/main" is comparing your `main` file to your
`origin/main` file — two local text files. The network finished seconds ago; everything
after is local.

## Bare repos: a repo that's all database

A **bare** repo (`git init --bare`) is `.git`'s contents with no worktree — used as a
meeting point precisely because nobody can edit files there, so the only truth is objects
and refs:

```text
your repo:  objects + refs + index + worktree   (you work here)
bare repo:  objects + refs                       (everyone pushes/pulls here)
```

GitHub *is* a bare repo with a website in front of it. Now you know what GitHub stores:
snapshots and pointer files. The PR is a proposal to move one pointer file.

## Prove it to yourself

**1. Build a remote out of a folder and watch both sides:**

```sh
git init --bare remote.git                          # the "server"
git clone remote.git work && cd work
echo v1 > f.txt && git add f.txt && git commit -m one
git push origin master
ls ../remote.git/refs/heads/                        # master exists over there now
cat ../remote.git/refs/heads/master                 # same hash as your local file
```

**2. Fetch without merging, and see the two pointer files:**

```sh
# (from another clone, push a new commit) then, back here:
git fetch origin
git log --oneline origin/master -1                  # their new tip — local file, updated
git log --oneline master -1                         # yours — still behind. Fetch moved NOTHING of yours.
```

**3. Force the non-fast-forward refusal:**

```sh
git push origin HEAD~1:master --force=false 2>&1 | tail -2
# rejected — the remote refuses to move master backwards past commits it already has
```

## The build: be the network by hand

Do a fetch's two jobs manually — copy the object, move the mirror ref:

```sh
#!/bin/sh
# handmade-fetch.sh — what git fetch actually does, step by step
set -e
git init --bare remote.git && git clone -q remote.git work && cd work
echo v1 > f.txt && git add f.txt && git commit -qm one && git push -q origin master
cd ../remote.git && git update-ref refs/heads/extras $(git rev-parse master)  # make "new" history
cd ../work && echo v2 >> f.txt && git add f.txt && git commit -qm two && git push -q origin master

cd .. && git init -q learner && cd learner
git fetch ../remote.git master:refs/remotes/origin/master   # 1. copy objects + 2. record THEIR ref
git log --oneline origin/master                             # you have their history, no merge
git merge --ff-only origin/master                           # 3. move YOUR ref — when you choose
```

Every line maps to a job description: *copy objects the remote lacks, mirror their refs,
integrate when you decide*. Pull = fetch + merge (or rebase) — now that sentence is a
description of mechanics, not a memorized slogan.

## What you now know

- fetch/push = **copy missing objects + update ref files** (locally mirrored, or remote with permission).
- `origin/main` is a **stale local copy** of their pointer — status compares local files, not networks.
- **Bare repos** are database-only meeting points; GitHub is one with a UI.
- A rejected push is the remote protecting its pointer from moving backwards.

Next: two people have diverged the same pointer. Merge — the command whose "magic" is
actually a three-way comparison you can fully dissect.
