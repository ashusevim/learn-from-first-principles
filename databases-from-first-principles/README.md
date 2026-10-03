# Databases from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a database from first principles — pages, B-trees,
write-ahead logs, a query planner — until Postgres and Cassandra stop being magic boxes
and become named tradeoffs you can reason about.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Git](../git-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Data on Disk**
1. A File Is a Database ✅
2. Pages: The Storage Engine's Currency ✅
3. B-Trees: The Index That Makes It Fast ✅
4. WAL: Crash Safety in One Idea ✅

**Part II — The Query Side**
5. The Buffer Pool: Distrusting the OS ✅
6. SQL Without the Magic: Parse & Plan ✅
7. Joins: Nested Loops to Hash ✅

**Part III — Correctness & Scale**
8. Transactions: ACID Without the Buzzwords ✅
9. MVCC: Databases That Never Block ✅
10. Beyond B-Trees: LSM & the Write Tradeoff ✅
11. Replication & Sharding: The Distributed Tax ✅
12. Final Boss: A Working Toy RDBMS ✅ *(pages + index + WAL + planner, crash-safe)*

All 12 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a slotted-page engine, a B-tree, a crash-surviving WAL,
an LRU buffer pool with hit-ratio telemetry, a SQL parser/planner, both join algorithms
timed, MVCC version chains, an LSM tree with compaction, a primary/replica pair with
staleness accounting — and a toy RDBMS that survives `kill -9`.

## The rules of the course

1. **Start below the abstraction.** Before "how to write SQL", answer "where do the bytes live?"
2. **Nothing is magic.** Indexes, logs, and locks are data structures you can build.
3. **Build a toy version.** The finale: a working toy RDBMS in ~500 lines.
4. **Then the tradeoffs are nameable.** Every database choice becomes a bet you recognize.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/btree.go` (Chapter 3's B-tree — cross-checked against the chapter's Python).
