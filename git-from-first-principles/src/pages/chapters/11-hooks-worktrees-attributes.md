---
layout: ../../layouts/Chapter.astro
title: 'Hooks, Worktrees & Attributes'
description: 'Executable scripts in .git/hooks, multiple checkouts, per-path rules. Build: a pre-commit hook that saves you from yourself.'
part: 'Part IV — Recovery & Mastery'
written: true
---

Three last tools, all the same kind of surprise: features that sound like infrastructure
turn out to be tiny files. **Hooks are scripts in a folder.** **Worktrees are pointer
files plus a checkout.** **Attributes are a config file keyed by glob.** After eleven
chapters, that shouldn't shock you anymore — that's exactly what everything in Git is.

## Hooks: the extension points are shell scripts

`.git/hooks/` ships full of `.sample` files. Remove the suffix, make it executable, and
Git runs it at fixed moments:

```sh
ls .git/hooks/ | head           # pre-commit.sample, commit-msg.sample, pre-push.sample...
```

The contract is brutal in the best way: **pre-commit runs before the commit; if it exits
non-zero, the commit is refused.** That's the whole framework — no plugin system, no API,
just "run this script, check the exit code" (the Unix course's `$?`, wearing Git's coat).

## Prove it to yourself

**1. A hook that refuses bad commits:**

```sh
git init demo && cd demo
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
# refuse to commit anything containing a bare "TODO" marker
if git diff --cached | grep -q '+.*TODO'; then
    echo "✗ staged changes contain TODO — resolve or mark it TODO-TRACKED" >&2
    exit 1                     # non-zero = block the commit
fi
EOF
chmod +x .git/hooks/pre-commit

echo "done thing" > f.txt && git add f.txt && git commit -m ok          # passes
echo "TODO: fix later" >> f.txt && git add f.txt && git commit -m lazy  # REFUSED
```

That refusal is the entire "protected branches" experience, running locally, in 6 lines.

**2. Commit-msg hooks shape history too:**

```sh
cat > .git/hooks/commit-msg <<'EOF'
#!/bin/sh
grep -qE '^[A-Z]{2,5}-[0-9]+ ' "$1" || { echo "✗ start with TICKET-123: " >&2; exit 1; }
EOF
chmod +x .git/hooks/commit-msg
git commit -m "bad message"          # refused. git commit -m "PROJ-1 good" — passes.
```

(Caveat you'd discover anyway: hooks live in `.git`, so they don't version with the code
— teams share them via a checked-in `hooks/` dir + `git config core.hooksPath hooks`.)

## Worktrees: two checkouts, one database

"Can I work on two branches at once?" — yes, and it's Chapter 3's model made visible:
additional worktrees are **just more HEAD+index pairs aimed at the same object database**:

```sh
git worktree add ../demo-hotfix hotfix
ls ../demo-hotfix/                # a full second checkout — same .git/objects
cat ../demo-hotfix/.git           # "gitdir: /path/to/main/.git/worktrees/hotfix" ← a pointer
```

No clone (no duplicate objects — packfiles stay shared), no stash juggling. Fix the bug
in one window, keep your feature open in the other.

## Attributes: per-path rules

`.gitattributes` — in the repo, versioned — attaches behaviors to filename patterns:

```text
*.png     binary             # don't diff, don't normalize
*.sh      text eol=lf        # normalize line endings (the Windows peace treaty)
*.lock    merge=ours         # lockfiles: never auto-merge
docs/*    linguist-docs      # (that's how GitHub's language bar is computed)
```

Each line is "for paths matching this glob, apply this rule" — the same dispatch-by-name
pattern as the frame's type field (networking course, Chapter 1).

## The build: a hook that earns its keep

The pre-commit every real team eventually writes — staged-only lint, exact and fast:

```sh
#!/bin/sh
# .git/hooks/pre-commit — check ONLY what's being committed (not the worktree)
changed=$(git diff --cached --name-only --diff-filter=ACM)
fail=0
for f in $changed; do
    case "$f" in
        *.py) python3 -m py_compile "$f" || fail=1 ;;
        *.sh) sh -n "$f" || fail=1 ;;
    esac
done
[ $fail -eq 0 ] && echo "✓ all staged files pass" || echo "✗ blocked: fix the above" >&2
exit $fail
```

Notice `git diff --cached` — Chapter 6's HEAD↔index comparison, reused as an input.
Every Git feature composes out of the same handful of primitives; you know them all now.

## What you now know

- **Hooks** = executable scripts in `.git/hooks/`; exit code = veto power.
- **Worktrees** = extra HEAD/index/worktrees sharing one object database.
- **`.gitattributes`** = per-glob behavior rules, versioned with the repo.
- Extension in Git is *composition of files*, not plugins — consistent to the end.

Next, the finale: init, add, commit, log, status — **your own Git**, ~200 lines of Python,
built from the exact primitives you've been handling by hand all course.
