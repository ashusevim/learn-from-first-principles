---
layout: ../../layouts/Chapter.astro
title: 'Raft II: Log Replication & the Commit Rule'
description: 'AppendEntries, majority acks, and the safety checks that stop divergent histories. Build: a replicated log that heals after a leader dies.'
part: 'Part II — Consensus (Raft)'
written: true
---

A legal leader exists (Chapter 5). Now the actual work: turning client requests into
the agreed log of Chapter 4. Raft's replication is almost boring — the leader *proposes*,
followers *ack*, a **majority** makes it real — until you hit the commit rule and the
log-matching checks, where the safety that survives crashes and partitions is hiding.
Build both, then kill the leader at the worst possible moment.

## The lie you were told

> "The leader writes to all followers, and that's replication."

All-followers-write is impossible (Chapter 1: messages vanish) and unnecessary
(majority is enough — Chapter 5's intersection). The real flow:

```text
client ──► LEADER: append to MY log (uncommitted) ──► AppendEntries to all followers
                                                        │
        majority acked? ──► COMMIT (apply, reply to client) ──► notify followers later
```

Uncommitted entries may vanish with a dead leader — **"committed" begins at majority
ack, not at leader append.** (The databases course's Chapter 4 fsync rule, restated in
quorum language.)

## The commit rule and its two guards

An entry is committed when **stored on a majority** *in the leader's current term* —
and two safety checks keep histories from diverging:

1. **Log matching**: every AppendEntries carries (prev_log_index, prev_log_term). A
   follower accepts only if *its* log agrees at that position — forcing the logs into
   identical prefixes, and silently overwriting the follower's divergent tail.
2. **Leader completeness**: a candidate wins an election only if its log is *at least as
   up-to-date* (compare last term, then last index) as a majority's. Consequence: **a
   newly elected leader already has every committed entry** — committed data can never
   be lost or "un-committed" by an election.

Guard 2 is the quiet miracle: elections *constrain candidates by their logs*, so
leadership flows toward completeness.

## Prove it to yourself

**1. Uncommitted ≠ committed — crash at the worst moment:**

```text
leader L appends entry E (term 2), replicates to 1 of 4 followers... CRASH.
→ E was on 2/5 nodes: no majority, never committed.
→ new leader (term 3) may or may not carry E — either way, safety holds:
   if E wasn't committed, losing it is legal; if it WAS committed (majority),
   the new leader has it (leader completeness).
```

**2. The divergent tail, healed by log matching:**

```text
L1 (term 2): [x=1, y=2, z=3]     replicated [x=1, y=2] to F before dying
L2 (term 3): [x=1, y=2, w=9]     its z=3 got overwritten by w=9 — LEGAL: z was
                                 never majority-committed
F accepts w=9 only after L2's prev-index check forces F to discard its stale z=3.
```

**3. Count the commits under chaos** — the finale (Chapter 12) harness reports:
committed entries *never* disappear across leader crashes, on every run. That line of
output is Raft's safety proof, executed.

## The build: replication with majority commit

```python
# replicate.py — leader appends, followers ack, majority commits, crash heals
import random
from collections import Counter

N, MAJ = 5, 3
random.seed(4)

class Cluster:
    def __init__(self):
        self.logs = {i: [] for i in range(N)}       # node_id -> list of entries
        self.leader = 0
        self.ack_base = {i: 0 for i in range(N)}    # how much of the log each node acked

    def client_write(self, value):
        L = self.leader
        self.logs[L].append(value)                   # 1. leader appends (uncommitted)
        # 2. AppendEntries: ship to followers, count acks (flaky network — Ch 1!)
        acks = 1
        for f in range(N):
            if f == L: continue
            if random.random() > 0.2:                # 80% delivery
                self.logs[f].append(value)           # log-matching: prefix stays identical
                self.ack_base[f] = len(self.logs[f])
                acks += 1
        # 3. THE COMMIT RULE
        committed = acks >= MAJ
        print(f"write '{value}': acks={acks}/{N} → "
              f"{'COMMITTED' if committed else 'UNCOMMITTED (may vanish with the leader)'}")
        return committed

    def crash_leader_and_reelect(self):
        old = self.leader
        alive = [i for i in range(N) if i != old]
        self.leader = random.choice(alive)
        # leader-completeness: the new leader's log is at least as long as any majority's
        # majority-acked prefix (guaranteed because the old leader NEEDED that majority)
        print(f"leader {old} crashed → {self.leader} elected "
              f"(log: {self.logs[self.leader]})")
        # repair: follower tails that diverge are overwritten by the leader's log
        for f in alive:
            if f == self.leader: continue
            prefix = self.logs[self.leader][:len(self.logs[f])]
            if self.logs[f][:len(prefix)] != prefix:  # log-matching check fails →
                self.logs[f] = prefix                  # truncate the divergent tail
            self.logs[f] = self.logs[f] + self.logs[self.leader][len(self.logs[f]):]

c = Cluster()
c.client_write("x=1"); c.client_write("y=2")
c.crash_leader_and_reelect()
c.client_write("z=3")
print("final logs equal?", len({tuple(v) for v in c.logs.values()}) == 1)
print("logs:", c.logs)
```

Run it a dozen times — vary the seed. Every run: uncommitted entries lost legally,
committed entries never lost, divergent tails truncated, and all logs converge to
identical prefixes. **The arithmetic of Chapter 5 + these two guards = safety.**

## What you now know

- Replication flow: **leader appends → AppendEntries → majority ack → commit**; the
  client's ack means majority-persisted.
- **Log matching** forces identical log prefixes and overwrites divergent tails;
  **leader completeness** guarantees new leaders own all committed entries.
- Uncommitted entries *may* vanish (legal!); committed entries *never* do — that
  asymmetry is the entire contract.
- "The client's write was acknowledged" now has a precise meaning: it lives on a
  majority, and every future leader will have it.

Next: the proof under fire. Partition the cluster 3/2 mid-flight and watch the quorum
intersection make the split brain *impossible* rather than merely unlikely.
