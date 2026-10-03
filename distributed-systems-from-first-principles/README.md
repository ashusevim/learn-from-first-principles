# Distributed Systems from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds distributed systems from first principles — Lamport
clocks, failure detectors, Raft leader election, quorums, consistent hashing — until the
protocols that run etcd, Cassandra, and Dynamo become things you've personally built in
toy form.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Git](../git-from-first-principles), [Databases](../databases-from-first-principles),
[Concurrency](../concurrency-from-first-principles)).

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

**Part I — The Ground Rules**
1. Two Generals & Why Networks Lie ✅
2. Clocks Are a Lie (Use Logical Ones) ✅
3. Failure Detectors: Knowing When a Node Is Dead (You Can't) ✅

**Part II — Consensus (Raft)**
4. The Replicated Log: The Problem Everything Solves ✅
5. Raft I: Leader Election ✅
6. Raft II: Log Replication & the Commit Rule ✅
7. Split Brains & Quorums ✅

**Part III — Beyond One Cluster**
8. Consistent Hashing & Sharding the Ring ✅
9. Gossip & Anti-Entropy ✅
10. Two-Phase Commit & the Coordinator's Dilemma ✅

**Part IV — The Real World**
11. Vector Clocks & Conflict Resolution ✅
12. Final Boss: A Toy Raft in ~400 Lines ✅ *(elections + replication + partitions, one file)*

All 12 chapters are fully written, each with runnable simulations and a hands-on build.
Things you build along the way: a flaky adversary channel, Lamport clocks, a heartbeat
detector with phi-accrual scoring, a diverging-then-healing replicated log, leader
elections that survive crashes, majority-committed logs, a partition harness, a
consistent-hash ring with virtual nodes, an epidemic gossip simulator, 2PC frozen on
camera, vector clocks that surface siblings — and a toy Raft that survives leader
deaths and network cuts.

## The rules of the course

1. **Start below the abstraction.** Before "use etcd", answer "why is agreement hard at all?"
2. **Nothing is magic.** Every protocol is messages between processes you can crash on purpose.
3. **Build a toy version.** Elections, replicated logs, hash rings, a toy Raft.
4. **Then the papers are readable.** The course ends where the Raft paper begins to feel familiar.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/gossip.go` (Chapter 9's epidemic dissemination, with the O(log n) audit).
