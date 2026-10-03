---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: mini-git in ~200 Lines'
description: 'init/add/commit/log/status — a working content-addressed VCS in one Python file. The course ends with you owning git.'
part: 'Part IV — Recovery & Mastery'
written: true
---

The finale. Every chapter of this course handled Git's internals by hand: blobs (Ch 1),
trees and commits (Ch 2), ref files (Ch 3), the index (Ch 4). Now we snap them together
into **a working version control system in ~200 lines of Python** — init, add, commit,
log, status — that you can actually use on a real project for a week. When it survives,
you will own Git: not the command list, the *model*.

## The lie you were told

> "Git is millions of lines you could never replicate."

The *idea* of Git — content-addressed snapshots + pointer files + one index file — fits in
an afternoon. The other millions of lines are performance (packfiles, Ch 5), protocols
(Ch 7), and porcelain conveniences. The core is the course you just took, in code.

## The design, in one diagram

Every piece maps to a chapter:

```text
.minigit/
├── objects/       ← Ch 1: zlib(kind + len + \0 + data), keyed by SHA-1
├── refs/master    ← Ch 3: one text file holding the tip commit's hash
└── index          ← Ch 4: "path blob-hash" rows — the proposed next tree

worktree ──add──► index ──commit──► commit(tree(blobs)) ──► refs/master
```

Commands: `add` copies file → blob + index row. `commit` turns index rows → tree →
commit → move ref. `log` walks parent pointers. `status` compares worktree/index (Ch 6).
That's the entire feature list, and it's *real version control*.

## The build

```python
#!/usr/bin/env python3
# minigit.py — a working content-addressed VCS in ~200 lines
import hashlib, os, sys, zlib

ROOT = ".minigit"

# ---- the object database (Ch 1) -------------------------------------------
def store(kind: str, data: bytes) -> str:
    raw = f"{kind} {len(data)}\0".encode() + data
    key = hashlib.sha1(raw).hexdigest()
    d = f"{ROOT}/objects/{key[:2]}"
    os.makedirs(d, exist_ok=True)
    p = f"{d}/{key[2:]}"
    if not os.path.exists(p):
        with open(p, "wb") as f:
            f.write(zlib.compress(raw))
    return key

def load(key: str):
    raw = zlib.decompress(open(f"{ROOT}/objects/{key[:2]}/{key[2:]}", "rb").read())
    header, _, body = raw.partition(b"\x00")
    return header.split(b" ")[0].decode(), body

def blob_hash(path: str) -> str:
    return store("blob", open(path, "rb").read())   # (real git hashes without writing)

# ---- commands --------------------------------------------------------------
def cmd_init(_):
    os.makedirs(f"{ROOT}/objects", exist_ok=True)
    os.makedirs(f"{ROOT}/refs", exist_ok=True)
    open(f"{ROOT}/HEAD", "w").write("ref: refs/master\n")
    print(f"initialized empty minigit repo in {ROOT}/")

def read_index():
    if not os.path.exists(f"{ROOT}/index"):
        return {}
    return dict(reversed([l.split(" ", 1) for l in open(f"{ROOT}/index").read().splitlines()]))

def cmd_add(files):
    rows = read_index()
    for path in files:
        rows[path] = blob_hash(path)
    with open(f"{ROOT}/index", "w") as f:
        for path, key in sorted(rows.items()):
            f.write(f"{key} {path}\n")
    print("staged:", ", ".join(files))

def cmd_commit(msg_parts):
    msg = " ".join(msg_parts) or "(no message)"
    rows = read_index()
    tree = store("tree", "".join(f"blob {k}\t{p}\n" for p, k in sorted(rows.items())).encode())

    ref = f"{ROOT}/refs/master"
    parent = open(ref).read().strip() if os.path.exists(ref) else None
    body = f"tree {tree}\n" + (f"parent {parent}\n" if parent else "")
    body += f"\n{msg}\n"
    key = store("commit", body.encode())
    open(ref, "w").write(key + "\n")
    print(f"[master {key[:7]}] {msg}")

def cmd_log(_):
    key = open(f"{ROOT}/refs/master").read().strip()
    while key:
        kind, body = load(key)
        head, _, msg = body.decode().partition("\n\n")
        parents = [l.split()[1] for l in head.splitlines() if l.startswith("parent")]
        print(f"commit {key}\n\n    {msg.strip()}\n")
        key = parents[0] if parents else None

def cmd_status(_):
    rows = read_index()
    for path, key in sorted(rows.items()):
        cur = blob_hash(path) if os.path.exists(path) else "deleted"
        if cur != key:
            print(f"  modified: {path}")
    tracked = set(rows)
    for f in sorted(os.listdir(".")):
        if os.path.isfile(f) and not f.startswith(".") and f not in tracked:
            print(f"  untracked: {f}")

# ---- dispatch ---------------------------------------------------------------
COMMANDS = {"init": cmd_init, "add": cmd_add, "commit": cmd_commit,
            "log": cmd_log, "status": cmd_status}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        sys.exit("usage: minigit.py init | add <files> | commit <msg> | log | status")
    COMMANDS[sys.argv[1]](sys.argv[2:])
```

## The proof: use it for real

```sh
mkdir project && cd project && python3 ../minigit.py init
echo "v1" > main.py && python3 ../minigit.py add main.py
python3 ../minigit.py commit "initial version"
echo "# v2" >> main.py && python3 ../minigit.py status     # modified: main.py
python3 ../minigit.py add main.py && python3 ../minigit.py commit "v2"
python3 ../minigit.py log                                   # two commits, chained by parents
```

Then the real test: break it on purpose. Delete a file, `status` tells you. Commit, `log`
remembers. Hash a file two ways — same key. **It's Git.** Slower, fewer features, no
packfiles or protocols or merges — and *identical at the core*.

## Where you are now

Twelve chapters ago Git was 40 commands and a prayer. Now: you've stored blobs by hand,
crafted commits with plumbing, made branches with `echo`, read the index, audited the
packfiles, rederived status, pushed to a bare repo, resolved conflicts by understanding
stages 1/2/3, watched rebase copy commits without touching anything, recovered "destroyed"
work from the reflog, wired up hooks — and built a working VCS on the same principles.

Nothing in Git is magic. It's a hash database and a folder of pointers, and you've held
every piece.

**Where to go next:** `git cat-file` your way through real repos; read `git help glossary`
(now it reads like plain English); try `git log --graph --oneline --all` and *see* the DAG.
The First Principles Project continues — **Databases** takes this same "content-addressed
files + logs" idea and turns it into the machines that run the world.
