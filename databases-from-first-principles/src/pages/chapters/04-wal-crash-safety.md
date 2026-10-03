---
layout: ../../layouts/Chapter.astro
title: 'WAL: Crash Safety in One Idea'
description: 'Log the change before you make it. Build: an append-only log + replay that survives a simulated crash.'
part: 'Part I — Data on Disk'
written: true
---

Chapter 1 showed the original sin: crash mid-write, torn record, silent corruption. Every
durable system you've ever used — every database, every journaling filesystem, even
Kafka — solves it with **one idea**: *describe the change in an append-only log before
you make the change itself.* Appends are sequential and cheap; a torn append is detectable;
and after a crash, replaying the log rebuilds anything the main files lost. That file is
the write-ahead log, and it is the actual durability of every database you've ever used.

## The lie you were told

> "Databases are safe because they write data to disk."

Data files on disk are allowed to be **stale, scattered, and torn** — the database doesn't
have to keep them safe, because the *log* has the truth. The contract is only:

1. Write the log record ("set x=5") and **fsync it**.
2. *Then* change the data pages, lazily, whenever convenient (the "checkpoint").

Crash between 1 and 2? Replay the log: anything committed is re-applied, anything
uncommitted is discarded. The data files were just a cache of the log's eventual result.

## Why appends change everything

Random writes are the enemy: seek, write, seek, write — and a crash mid-write tears the
record with no way to tell. An append is one sequential write; if it tears, the log ends
mid-record and the next replay knows exactly where truth stops. **Sequential + verified
beats random + assumed.** (Chapter 1 said this; now it's the foundation.)

## The lifecycle of a write

<figure class="diagram">
<svg viewBox="0 0 860 130" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#7ee2a8" stroke-width="1.5"/></marker></defs>
  <g font-family="ui-monospace,monospace" font-size="12">
    <rect x="20" y="40" width="140" height="50" rx="9" fill="#161b22" stroke="#2d333b"/><text x="90" y="62" text-anchor="middle" fill="#e6edf3" font-weight="bold">client writes</text><text x="90" y="78" text-anchor="middle" fill="#8b949e" font-size="10">SET x = 5</text>
    <rect x="230" y="40" width="200" height="50" rx="9" fill="#3a2e1c" stroke="#e8b15c"/><text x="330" y="62" text-anchor="middle" fill="#e8b15c" font-weight="bold">① LOG first (fsync)</text><text x="330" y="78" text-anchor="middle" fill="#8b949e" font-size="10">append-only · sequential · safe</text>
    <rect x="500" y="40" width="180" height="50" rx="9" fill="#161b22" stroke="#2d333b"/><text x="590" y="62" text-anchor="middle" fill="#e6edf3" font-weight="bold">② data pages</text><text x="590" y="78" text-anchor="middle" fill="#8b949e" font-size="10">lazy · allowed to be stale</text>
    <rect x="710" y="40" width="130" height="50" rx="9" fill="#1c2a20" stroke="#7ee2a8"/><text x="775" y="62" text-anchor="middle" fill="#7ee2a8" font-weight="bold">✓ ACK client</text><text x="775" y="78" text-anchor="middle" fill="#8b949e" font-size="10">only after ①</text>
    <line x1="160" y1="65" x2="226" y2="65" stroke="#7ee2a8" stroke-width="1.5" marker-end="url(#arrw)"/>
    <line x1="430" y1="65" x2="496" y2="65" stroke="#7ee2a8" stroke-width="1.5" marker-end="url(#arrw)"/>
    <line x1="680" y1="65" x2="706" y2="65" stroke="#7ee2a8" stroke-width="1.5" marker-end="url(#arrw)"/>
    <text x="430" y="122" text-anchor="middle" fill="#8b949e" font-size="11">crash? → replay the log from the last checkpoint: the log IS the truth</text>
  </g>
</svg>
<figcaption>Fig 1 — Write-ahead logging: describe the change before you make it.</figcaption>
</figure>


```text
commit:  append ("tx1: set alice=42") → fsync → ACK to the client
later:   checkpoint — flush dirty pages, mark the log position applied
crash:   reopen → replay log from last checkpoint → re-apply committed, skip uncommitted
```

The client's "committed" means *exactly* "this record is in the fsynced log". Nothing
more, nothing less. `COMMIT` returning successfully **is** the fsync.

## Prove it to yourself

**1. Meet the log on your own machine** — SQLite keeps one right next to the file:

```sh
sqlite3 test.db "pragma journal_mode=WAL;"     # → wal
ls -l test.db*                                 # test.db, test.db-wal, test.db-shm
```

**2. Watch it absorb a crash** — the kill -9 from Chapter 1, now survivable:

```sh
python3 -c "
import sqlite3, os, signal, time
db = sqlite3.connect('test.db')
db.execute('pragma journal_mode=wal')
db.execute('create table if not exists t(k text primary key, v int)')
db.execute('insert into t values (\'crash-test\', 1)')
db.commit()
pid = os.fork()
if pid == 0:                                   # child: starts a write, dies mid-flight
    db2 = sqlite3.connect('test.db')
    db2.execute('insert into t values (\'dying-write\', 2)')
    os.kill(os.getpid(), signal.SIGKILL)       # never commits
print('surviving rows:', sqlite3.connect('test.db').execute('select * from t').fetchall())
# 'crash-test' present, 'dying-write' absent — torn write made impossible"
```

**3. See the log grow and checkpoint:**

```sh
ls -l test.db-wal                              # grows with writes...
sqlite3 test.db "pragma wal_checkpoint;"       # ...shrinks after checkpoint
ls -l test.db-wal
```

## The build: a WAL that survives kill -9

```python
# wal.py — append-only log + replay: the durability of every database, miniaturized
import json, os, sys

LOG, DATA = "toy.wal", "toy.json"

def log_append(entry: dict):                    # 1. ALWAYS log first
    with open(LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")
        f.flush()
        os.fsync(f.fileno())                    # ...and force it to the platters

def set_key(key, value):
    log_append({"op": "set", "key": key, "value": value})   # log BEFORE data
    data = json.load(open(DATA)) if os.path.exists(DATA) else {}
    data[key] = value                           # the "data page" write (unprotected!)
    json.dump(data, open(DATA, "w"))

def replay():                                   # 2. truth = last committed replay
    data = {}
    try:
        for line in open(LOG):
            e = json.loads(line)                # a torn line raises → we stop there
            if e["op"] == "set": data[e["key"]] = e["value"]
    except (json.JSONDecodeError, EOFError):
        print("torn log tail detected — truncated at last good record (exactly like a real WAL)")
    json.dump(data, open(DATA, "w"))
    return data

if __name__ == "__main__":
    if sys.argv[1] == "set": set_key(sys.argv[2], sys.argv[3])
    if sys.argv[1] == "replay": print(replay())
```

The torture test:

```sh
python3 wal.py set crash-test 1
python3 -c "import wal; wal.set_key('victims', 'lots')" &   # kill it mid-write:
kill -9 %1 2>/dev/null
python3 wal.py replay                       # log replays; torn tail is detected and cut
```

Kill it as hard as you like: the next `replay()` rebuilds a consistent state from the log.
You've implemented the guarantee that makes every database "durable" — it's ~40 lines.

## What you now know

- **Log first, apply later**: the log is the truth; data pages are a cache of it.
- `COMMIT` = the log record hit the disk (fsync). Nothing else qualifies.
- Replay rebuilds state after any crash; torn appends self-identify.
- WAL files you've seen next to real databases (`-wal`, `pg_wal`) are *this*, industrialized.

Next: reading pages from disk on every query is still slow — so the database caches them
itself, with its own eviction opinions. The buffer pool.
