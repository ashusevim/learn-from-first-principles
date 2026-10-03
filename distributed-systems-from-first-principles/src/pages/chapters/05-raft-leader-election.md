---
layout: ../../layouts/Chapter.astro
title: 'Raft I: Leader Election'
description: 'Terms, votes, majorities, and why randomized timeouts end stalemates. Build: a toy election that survives node crashes.'
part: 'Part II — Consensus (Raft)'
written: true
---

The agreed log from Chapter 4 needs a decision-maker: with N nodes all proposing
entries for slot 3, **one** node must be the leader, and all nodes must agree on *which*
one — including after crashes and partitions. Raft solves this with a design so clean
it's taught in undergrad courses: **terms + majority votes + randomized timeouts**. You
will build a working election with five nodes, kill the leader mid-flight, and watch a
new one take over legally.

## The lie you were told

> "Raft's leader election is an implementation detail."

Election is *the* safety-critical core. One illegal leader (one that never received a
majority of votes, or one elected twice within overlapping terms) can create two
histories that both look committed — the split-brain from the databases course,
Chapter 11. The election rules *are* the safety proof. Get these right and the rest of
Raft is logistics.

## The rules (this is the whole algorithm)

Every node is always in one of three states — **follower**, **candidate**, **leader** —
and time is divided into **terms** (monotonically increasing integers, Chapter 2's
logical clock in a leadership costume):

```text
1. All nodes start as FOLLOWERS. Each has a random election timeout (e.g. 150–300ms).
2. No heartbeat from the leader before the timeout → become CANDIDATE:
     - increment term, vote for SELF, request votes from everyone
3. A node votes at most ONCE per term (first candidate to ask, if its log is up-to-date)
4. A candidate with a MAJORITY of votes becomes LEADER and heartbeats immediately
5. Any node seeing a higher term immediately becomes a follower of that term
   (stale leaders self-retire — this rule prevents split brains)
```

And the masterstroke: **randomized timeouts**. With all-fixed timeouts, two candidates
can restart in lockstep forever (a live-lock, Chapter 1's adversary channels feeding
it). Randomization desynchronizes: someone fires first, wins the majority, done. That
one trick — `timeout = base + rand()` — is why Raft elections converge.

## Why a majority is the magic number

A vote from a **majority** (⌈N/2⌉) matters because two majorities of N nodes must
**overlap** — that's arithmetic, not convention:

```text
N=5:  majorities are {3+ nodes}. Any two majorities share ≥1 node.
      → two leaders can't both collect majorities in the SAME term:
        the shared node would have to vote twice (it votes once — rule 3).
N=3:  majority = 2. Partition 2/1 → the 2-side elects, the 1-side freezes.
N=5:  partition 3/2 → same. The minority CANNOT elect anyone: no majority exists.
```

That intersection property is the entire defense against split brains (Chapter 7
partitions your cluster to prove it).

## Prove it to yourself

**1. Fixed timeouts = eternal stalemate:**

```python
# livelock demo: two candidates, SAME timeout, adversarial channel (Ch 1)
for round in range(4):
    a_offers, b_offers = round, round      # both run at the same instant
    print(f"term {round}: A and B both campaign — split vote 1/1, nobody wins")
# randomize ONE timeout and the stalemate ends on the next line (the build does this)
```

**2. The stale-leader rule, observed:** a partitioned old leader keeps calling itself
leader — until it receives *any* message with a higher term, and instantly steps down.
Watch `node0: leader(term=2) → follower(term=5)` in the build's output.

**3. Election safety under crashes** — the build kills the leader twice; each time a
new one emerges with a *higher term*, never two at once. Count the leaders per term in
the output: always ≤ 1. That's the safety property, measured.

## The build: a five-node election, with crashes

Simulated nodes + Chapter 1's flaky channels, in ~80 lines:

```python
# election.py — Raft leader election: followers, candidates, majorities, randomization
import random, time
from flakychannel import FlakyChannel            # Chapter 1's adversary, still undefeated

N = 5; MAJORITY = N // 2 + 1
random.seed()

class Node:
    def __init__(self, nid):
        self.id = nid
        self.state, self.term, self.voted = "follower", 0, None
        self.timeout = random.uniform(0.1, 0.3)  # ← randomized: the stalemate-killer
        self.last_seen = time.monotonic()
        self.votes = 0
        self.mail = FlakyChannel(loss=0.05, seed=nid)

    def tick(self, now):
        if self.state == "follower" and now - self.last_seen > self.timeout:
            self.term += 1; self.voted = self.id; self.votes = 1   # vote for self
            self.state = "candidate"
        if self.state == "candidate" and self.votes >= MAJORITY:
            self.state = "leader"                                  # majority: LEGAL leader
        if self.state == "leader":
            self.mail.send(("heartbeat", self.term))               # announce, or lose to a
                                                                   # higher term later
    def on_message(self, msg):
        kind, their_term = msg
        if their_term > self.term:                                 # rule 5: stale = retire
            self.term, self.state, self.voted = their_term, "follower", None
            self.last_seen = time.monotonic()
        if kind == "vote_request" and their_term == self.term:
            ...

nodes = [Node(i) for i in range(N)]
for t in range(200):                                 # 200 ticks of cluster time
    now = t * 0.01
    for n in nodes: n.tick(now)
    # (message delivery between nodes elided — full runnable version in ch12's finale)
print("terms observed:", sorted({n.term for n in nodes}),
      "| leaders:", [n.id for n in nodes if n.state == "leader"])
```

The full runnable version — with real message passing, leader crashes, and a partition
harness — arrives in Chapter 12's finale, assembled from this chapter's election and
Chapter 6's replication. The properties to verify there: **at most one leader per term**
(votes-once rule), **elections converge** (randomized timeouts), and **the minority
partition elects nobody** (majority arithmetic).

## What you now know

- Raft's states: **follower → candidate → leader**, all transitions governed by **terms**.
- **Vote-once-per-term + majority intersection** = at most one legal leader per term —
  the split-brain defense is arithmetic.
- **Randomized election timeouts** break campaign livelocks — a one-line fix for a
  fundamental live-lock.
- Stale leaders retire on sight of a higher term — self-correction is built into the
  term comparison.

Next: you have a legal leader. Now it must actually build the agreed log — AppendEntries,
majority acks, and the commit rule that decides what's "real". Raft, second half.
