---
layout: ../../layouts/Chapter.astro
title: 'Rebase: Rewriting History'
description: 'Commits are immutable, so rebase builds new ones and moves your branch. Build: watch every hash change, then understand the golden rule.'
part: 'Part III — Working with Others'
written: true
---

Rebase is the command that makes people quit Git. So here's the whole truth up front:
**rebase does not edit anything — it can't.** Commits are immutable (Chapter 2: they're
named by their own hash; change a byte and it's a different object). What rebase actually
does is *copy* your commits into new ones, replayed on a new base, then move your branch
file (Chapter 3) to the new copies. The old commits still exist. Once you watch the hashes
change in slow motion, the fear has nothing left to stand on.

## The lie you were told

> "Rebase rewrites your commits."

Nothing is rewritten. Watch what actually exists after a rebase:

```text
before:   A ── B ── C ── D (feature)
                   └── E ── F (main)        ← main moved while you worked

after:    A ── B ── E ── F
                   └── C' ── D' (feature)   ← NEW commits: same changes, new parents, new hashes
                   └── C ── D               ← the originals: still in the database, orphaned
```

C′ and D′ are *different objects* — same tree contents, same messages, but different
parents, hence different hashes (the hash covers everything, Chapter 1). Your branch file
was repointed. The originals are reachable only through the reflog (Chapter 10's
lifeline), until garbage collection eventually cleans them.

## The mechanism, step by step

`git rebase main` (on feature) does this:

1. Find the common ancestor of both branches (Chapter 8's merge base).
2. Save the diffs of *your* commits since then — B..D as a replay list.
3. Move the branch pointer... no: rewind feature to main's tip (E–F).
4. **Cherry-pick** each saved diff onto it, creating C′, D′ — fresh immutable objects.
5. Move the `feature` ref file to D′. Done.

So rebase = rewind + `cherry-pick` in a loop + `update-ref`. Three things you already
know the plumbing names of.

## The golden rule, derived (not memorized)

"Never rebase a pushed branch" — why? Because *the person who pulled your old C and D has
them in their history*. You now have C′ and D′. Two divergent histories describing "the
same work" — every future merge/rebase/push is a reconciliation nightmare. The rule isn't
a commandment; it's a consequence of immutability: **copies with different hashes are
different commits, and sharing requires agreeing on which hashes are real.** Rebase your
own unpushed work freely; it's the cleanest history tool there is.

## Prove it to yourself

**1. Watch every hash change:**

```sh
git init demo && cd demo
echo base > f.txt && git add f.txt && git commit -m base
git checkout -b feature
echo feat > g.txt && git add g.txt && git commit -m "feature work"
git log --oneline                       # note feature's hash
git checkout master && echo main >> f.txt && git commit -am "main work"
git checkout feature && git rebase master
git log --oneline                       # same message — DIFFERENT hash
```

**2. Prove the old commits still exist:**

```sh
git reflog | head -3                    # the pre-rebase tip is recorded
git cat-file -p HEAD@{1}                # the OLD commit object, still in the database
```

**3. Show rebase is cherry-pick in a loop** — do it manually:

```sh
git cherry-pick main          # (on the old-shaped branch) — one copied commit, new hash
# rebase is exactly this, for every commit since the base, automatically
```

## The build: rebase by hand, with plumbing

The whole spell, using only what Chapters 2–4 taught:

```sh
#!/bin/sh
# handmade-rebase.sh — rewind, replay, repoint — with plumbing only
set -e
git init demo && cd demo
echo base > f.txt && git add f.txt && git commit -qm base

git checkout -qb feature
echo feat > g.txt && git add g.txt && git commit -qm "feat: one"
echo more >> g.txt && git add g.txt && git commit -qm "feat: two"

main=$(git rev-parse master 2>/dev/null || git rev-parse main)

# 1. rewind: point feature at master's tip (the worktree/index too)
git checkout -q master && git checkout -q feature && git reset -q --hard "$main"

# 2. replay each saved diff as a NEW commit (cherry-pick, by hand):
git cherry-pick feature@{1} 2>/dev/null || true   # reflog holds the originals (Ch 10!)

# 3. repoint the branch file — Chapter 3's fwrite:
git update-ref refs/heads/feature "$(git rev-parse HEAD)"
git log --oneline                                 # new hashes, clean linear history
```

The machinery is three moves — rewind, replay, repoint — each of which you've already
built by hand in earlier chapters. There is no fourth move hiding in `git rebase`.

## What you now know

- Rebase = **copy commits (cherry-pick loop) + move the branch pointer**. Nothing is edited.
- New parents ⇒ new hashes ⇒ **genuinely different commits** — that's why the golden rule
  exists, and why it's a consequence, not a law.
- The originals survive in the database via reflog — nothing was "lost".
- Linear history is a pointer-file arrangement, not a different universe of commits.

Next: "I destroyed my work with reset --hard" — no, you didn't, and next chapter you'll
prove it to yourself the hard way.
