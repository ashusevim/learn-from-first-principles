---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Distributed Systems on One Page'
description: 'Clocks, quorums, Raft and consistency on one page — the model, the invariants you must hold, and the lies networks tell.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one refusal: **there is no now, no dead, no delivered** — only
majorities, timeouts, and logs. The table of who promises what, and the three
rules that make a cluster behave like one machine when the network lies.

## The one-page model

```text
  the lie                     the replacement                    chapter
  "what time is it?"          logical ticks + terms, never walls   Ch 2, 5
  "is it dead?"               timeouts are guesses, majorities vote Ch 3, 5
  "did it arrive?"            the replicated log: send until acked  Ch 4, 6
  "who decides?"              one leader per term; quorum commits   Ch 5–7
  "which copy is newest?"     vector clocks where leaders can't reach Ch 11
```

Safety is "nothing bad happens" (one leader, committed means kept); liveness is
"something good eventually happens" (timeouts, retries, randomized elections).
Raft buys safety first and liveness second — in that order, always.

## The distributed system you actually use

| Piece | Contract | In your build |
|---|---|---|
| `term` (monotonic) | time that only moves forward, voted into office | Ch 5 |
| `state`: follower/candidate/leader | exactly one leader per term, or none for a while | Ch 5 |
| randomized election timeout (10–25 ticks) | stalemates break themselves | Ch 5 |
| vote: one per term, log at least as fresh | stale candidates never win | Ch 5 |
| `log[]: [{term, cmd}]` | the single source of truth, replicated | Ch 6 |
| append + majority ack → `commit_index` | committed means on a majority means kept | Ch 6 |
| heartbeat (`append` with empty tail) | leadership proved continuously, or doubted | Ch 5 |
| quorum (`n//2 + 1`) | any two majorities overlap — the whole trick | Ch 7 |
| `partition(nodes, a, b)` | the harness: cut the wire, keep the clocks | Ch 12 |
| `kill -9` the leader | the test: committed entries must survive | Ch 12 |
| consistent-hash ring | keys move least when nodes join/leave | Ch 8 |
| gossip + anti-entropy | rumors converge; digests repair the rest | Ch 9 |
| 2PC coordinator | commit/abort unanimously — or block forever | Ch 10 |
| vector clock compare | concurrent vs causal, decided locally | Ch 11 |


## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Trusting wall clocks for order | two "simultaneous" writes order differently per node | Chapter 2 |
| Declaring death on one missed heartbeat | flapping leadership on every GC pause | Chapter 3 |
| Fixed election timeouts | synchronized candidates, split votes, no leader ever | Chapter 5 |
| Voting for a stale log | the new leader lacks committed entries — safety gone | Chapter 5 |
| Committing on one ack | the "committed" entry dies with its only copy | Chapter 6 |
| Two leaders, one term | clients write to both; the logs fork forever | Chapters 5, 7 |
| Assuming a partition heals cleanly | both sides served writes; now both claim truth | Chapter 7 |
| Hashing keys mod-N directly | every membership change remaps nearly everything | Chapter 8 |
| Forgetting anti-entropy | gossip spreads, but the one lost update never arrives | Chapter 9 |
| 2PC with a dead coordinator | participants hold locks forever, waiting on a ghost | Chapter 10 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| One truth across crashes | Raft + majority commit | one box survives — consensus is pure overhead (Ch 6) |
| Order without coordination | logical clocks / terms | external ordering exists — then use it (Ch 2) |
| Failure detection | timeouts + suspicion levels, never certainty | the network is synchronous — it isn't (Ch 3) |
| Even key spread, cheap moves | consistent hashing with virtual nodes | the set is static — mod-N is fine (Ch 8) |
| Eventual everything, cheap | gossip + version digests + repair | any write must be linearizable — gossip can't (Ch 9) |
| Multi-shard atomicity | 2PC with a recovery log on the coordinator | partitions are routine — 2PC blocks; Saga compensates (Ch 10) |
| Merge without a leader | vector clocks + last-writer or CRDT rules | merges must never lose — pick the CRDT first (Ch 11) |

## Prove it to yourself

**1. The leader dies, the log lives:**

```python
harness = PartitionHarness(3)
harness.submit("x = 1"); harness.wait_committed("x = 1")
harness.kill("leader")                    # kill -9, mid-everything
harness.heal(); harness.wait_leader()
print(harness.read("x"))                  # still 1 — majorities keep promises
```

**2. The minority cannot commit:**

```python
harness.partition(["n1"], ["n2", "n3"])   # n1 alone with a client
print(harness.submit("y = 2", node="n1")) # refused or uncommitted — no majority
harness.heal()
print(harness.read("y"))                  # absent: it was never committed
```

**3. Terms only rise:**

```python
terms = [n.term for n in harness.nodes]
harness.partition(["n1"], ["n2", "n3"]); harness.tick(50); harness.heal()
print(sorted(n.term for n in harness.nodes))  # every term >= before — never down
```

## What you now know

- **Majorities overlap** — that one sentence is why committed means kept, and
  the only math the whole course needs.
- **Time is a vote and death is a guess:** terms replace clocks, timeouts
  replace failure detectors, and both are honest about what they don't know.
- **The log is the database:** state machines are deterministic replays; commit
  index is the only pointer that matters.
- Everything beyond one cluster — rings, gossip, 2PC, vector clocks — is the
  price of leaving the majority's warm embrace.

Next: twelve labs that torture your toy Raft — kill leaders, halve networks, and
watch committed entries survive everything but your own bugs.
