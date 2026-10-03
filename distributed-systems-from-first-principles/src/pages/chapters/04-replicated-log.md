---
layout: ../../layouts/Chapter.astro
title: 'The Replicated Log: The Problem Everything Solves'
description: 'Every distributed database is a state machine + an agreed log. Build: state machines that diverge without agreement.'
part: 'Part II — Consensus (Raft)'
written: true
---

Here is the punchline of fifty years of distributed-systems research, and it's one
sentence: **a replicated state machine = a deterministic state machine + an agreed-upon
log of operations.** etcd, ZooKeeper, Kafka, your database's binlog, a blockchain — all
of them are *this sentence*. The log is the hard part: getting N machines to agree on
one order of operations despite Chapter 1–3's chaos. This chapter shows why order is
everything, by breaking it and watching replicas diverge.

## The lie you were told

> "Replication means sending each operation to all replicas."

Sending operations to everyone is the *easy* part — they arrive (or don't) in **different
orders**, at **different times** (Chapter 1's reordering), and replicas that apply them
as they arrive end up as **different databases**. Replication without an agreed order is
just coordinated divergence.

## The state machine abstraction

A **deterministic state machine**: a set of states, and an `apply(op)` function where
the same op sequence always produces the same state (no wall-clock, no randomness, no
thread interleaving — Chapter 2's clocks are banned from the logic):

```text
apply("SET x=1") → apply("SET y=2") → apply("SET x=x+1")   → state {x: 2, y: 2}   everywhere
apply("SET x=1") → apply("SET x=x+1") → apply("SET y=2")   → state {x: 2, y: 2}   — wait, no:
                                                                 {x: 1, y: 2} if x+1 used a snapshot!
```

Commutative ops forgive reordering; most real ops (transfer 50 from A to B) don't.
**Order is semantic.** If two replicas apply the same ops in different orders, they're
not "temporarily different" — they're *different databases that will never converge*
without intervention.

## Prove it to yourself

**1. Two replicas, two orders, two universes:**

```python
# diverge.py — same ops, different order, different final state
def apply(state, op):                      # a deterministic state machine
    if op[0] == "put":  state[op[1]] = op[2]
    if op[0] == "add":  state[op[1]] = state.get(op[1], 0) + op[2]
    return state

ops_a = [("put", "x", 1), ("add", "x", 10)]        # replica A's arrival order
ops_b = [("add", "x", 10), ("put", "x", 1)]        # replica B's arrival order (reordered!)

sa = apply(apply({}, *ops_a[:1]), ops_a[1])
sb = apply(apply({}, *ops_b[:1]), ops_b[1])
print("replica A:", sa)     # {'x': 11}
print("replica B:", sb)     # {'x': 1}   ← same operations, different databases
```

The `put` clobbered the `add` on B. Neither replica is "wrong" — **there is no truth
without an order.** This is why "just ship my writes to all nodes" is not replication.

**2. The fix's shape — agree on indices, not content:**

```python
# if both replicas apply op #0 first, then op #1... they're identical forever:
for i in range(len(ops_a)):
    sa = apply(sa, ops_a[i]); sb = apply(sb, ops_b[i] if i < len(ops_b) else ops_a[i])
# the entire problem of consensus: WHO DECIDES WHAT op #i IS?
```

## The log is the system

Once one sequence of ops is agreed, everything else is boring:

```text
     agreed log:  [0: SET x=1] [1: ADD x=10] [2: DEL y]
                          │  applied in index order, on every replica
                          ▼
     identical state machines, forever — even after crashes
     (rebuild state = replay log — the databases course's WAL, networked!)
```

Every famous system is an agreed log wearing different clothes:

| System | The log is called... |
|---|---|
| etcd / Kubernetes | Raft log |
| Kafka | the topic partition (literally the product) |
| Postgres streaming replication | WAL shipping (databases course, Ch 11!) |
| ZooKeeper | ZXID sequence |
| Bitcoin | the blockchain |

And the databases course's Chapter 4 returns with a twist: the local WAL guaranteed
*crash* safety with one writer. Now there are N writers and the question "which entry
is log position i?" needs **consensus** — the next two chapters.

## The build: a state machine that heals from the log

```python
# smr.py — a state machine that rebuilds itself from its log (and only its log)
import json, os

class StateMachine:
    def __init__(self, path="smr.log"):
        self.path, self.state, self.log = path, {}, []     # the log IS the source of truth

    def propose(self, op):                    # in a real system, consensus runs HERE (Ch 5–7)
        with open(self.path, "a") as f:
            f.write(json.dumps(op) + "\n"); f.flush(); os.fsync(f.fileno())
        self.log.append(op)

    def apply_all(self):                      # rebuild state by replaying — deterministically
        self.state = {}
        for op in self.log: apply(self.state, op)
        return self.state

def apply(state, op):
    if op[0] == "put": state[op[1]] = op[2]
    if op[0] == "add": state[op[1]] = state.get(op[1], 0) + op[2]

sm = StateMachine()
sm.propose(("put", "x", 1)); sm.propose(("add", "x", 10))
sm.state = {}                                 # simulate total crash: memory gone
print("after recovery:", sm.apply_all())      # {'x': 11} — the log rebuilt the world
```

Recovery-by-replay is Chapter 4's WAL trick, unchanged. What changed is the politics:
when five machines each *propose* entries for slot 3, someone must win — and everyone
must eventually agree on who won, even across crashes and partitions.

## What you now know

- **Replicated state machine = deterministic apply + agreed log.** The log carries all
  the difficulty.
- Reordered ops = **divergent, never-converging replicas** — order is semantic, not
  cosmetic.
- Kafka/etcd/Postgres/bitcoin: agreed logs in different costumes.
- The open question, now precisely stated: *how do N machines agree on entry i, while
  crashing, partitioning, and lying about time?* Answer: elect a leader. Raft, Chapter 5.

Next: consensus, step by step. First half of Raft — how a cluster picks exactly one
leader per term, using nothing but majorities and randomized timeouts.
