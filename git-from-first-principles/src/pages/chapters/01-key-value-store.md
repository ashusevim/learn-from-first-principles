---
layout: ../../layouts/Chapter.astro
title: 'Git Is a Key-Value Store'
description: 'Blobs, SHA-1, and .git/objects. Git is not "version control software" — it is a content-addressed database, and you can talk to it directly.'
part: 'Part I — The Object Database'
written: true
---

Ask people what Git is and you'll get "version control", "a history of changes", "that
thing with rebases". All wrong at the root. **Git is a database** — a content-addressed
key-value store, like Redis's file-based cousin — plus a folder of tiny text files pointing
into it. Everything else, branches and commits and rebases, is bookkeeping over that one
idea. This chapter proves it by talking to the database directly, with no "version control"
layer in between.

## The lie you were told

> "Git records the changes you made between versions."

Git doesn't record *changes*, and it doesn't know what a "version" is. It stores
**complete snapshots of files, each named by its own hash**. That's the entire model. The
hash is derived from the content — same bytes, same hash, forever, in every repo on Earth.
That's why Git can be distributed without coordination: identical content is *identical
objects*, everywhere, by construction.

## The database is a folder

```sh
git init demo && cd demo && find .git -maxdepth 1
# .git/HEAD  .git/config  .git/objects/  .git/refs/   ← the whole system
```

- **`.git/objects/`** — the key-value store. Keys are SHA-1 hashes; values are your files.
- **`.git/refs/`** — the pointers (branches live here — Chapter 3).
- **`.git/HEAD`** — "which pointer am I on" (also Chapter 3).
- **`.git/index`** — the staging area (Chapter 4).

Everything you've ever feared about Git lives in these four things. Let's read them.

## Blobs: the first object type

A **blob** is your file's bytes, plus one header line, hashed and compressed:

```text
key   = sha1("blob 12\0hello world!")
value = zlib("blob 12\0hello world!")
stored at .git/objects/e9/65047798115a3c9f53ba49a46bcccd1b44d914  (first 2 hex chars = dir)
```

Note what's *not* in there: no filename, no timestamp, no author. A blob is content, period.
Two identical files anywhere in history map to the same blob — free deduplication as a
side effect of addressing.

## Prove it to yourself

**1. Put a file in the database, without committing anything:**

```sh
git init demo && cd demo
echo "hello world" > file.txt
git hash-object -w file.txt
# e96507a94c0c8f8cbda48e748687e58e2e64bb32   ← the key. Your file is IN the database.
find .git/objects -type f          # one object, sitting there. No commit was made.
```

**2. Read it back by key:**

```sh
git cat-file -p e96507a94c0c8f8cbda48e748687e58e2e64bb32
# hello world
git cat-file -t e96507a9          # "blob" — its type
```

**3. The punchline — identical content, identical key, provably:**

```sh
echo "hello world" > other-name.txt
git hash-object other-name.txt    # same hash! Content-addressing dedups for free.
```

**4. Not convinced it's just zlib?** Decode it with anything:

```sh
python3 -c "import zlib; print(zlib.decompress(open('.git/objects/e9/65047798115a3c9f53ba49a46bcccd1b44d914','rb').read()))"
# b'blob 12\x00hello world\n'
```

## The build: talk to the store with no porcelain

The `hash-object`/`cat-file` dance, done in pure Python — Git's core read/write path in
~15 lines:

```python
# blobstore.py — python3 blobstore.py            (run inside any git repo)
import hashlib, zlib, os, sys

def store(data: bytes) -> str:
    blob = b"blob %d\x00" % len(data) + data        # the header git prepends
    key = hashlib.sha1(blob).hexdigest()            # content → key
    d = f".git/objects/{key[:2]}"
    os.makedirs(d, exist_ok=True)
    path = f"{d}/{key[2:]}"
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(zlib.compress(blob))            # value = zlib(header + content)
    return key

def load(key: str) -> bytes:
    with open(f".git/objects/{key[:2]}/{key[2:]}", "rb") as f:
        raw = zlib.decompress(f.read())
    return raw.split(b"\x00", 1)[1]                 # strip "blob N\0" header

key = store(sys.argv[1].encode() if len(sys.argv) > 1 else b"hello store")
print("key:", key)
print("read back:", load(key).decode())
```

Run it, then `git cat-file -p <the key it printed>` — **Git reads your object perfectly**,
because you didn't build "something like Git's database". You built Git's database.

## What you now know

- Git = **content-addressed store** (`.git/objects`) + **pointer files** (`.git/refs`).
- A **blob** is zlib(`blob N\0` + bytes), keyed by its own SHA-1 — no name, no history.
- Identical content is the identical object, everywhere — that's why Git is distributed.
- `hash-object`, `cat-file` — you can bypass the "version control" entirely.

Next: a lone blob isn't a snapshot. Who records *which* files existed together, and who
vouches for them? Trees and commits — and yes, you'll write one by hand.
