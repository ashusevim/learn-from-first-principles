---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toy Raft from Chapter 12 — elections, partitions, quorums, crashes. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a leader elected, an entry committed, or a
refusal you can quote — all inside `toyraft.py`'s harness from Chapter 12.
Nothing here is new — timeouts (Ch 3), elections (Ch 5), replication (Ch 6),
quorums (Ch 7). What is new is adversarial operation: you are the partition now.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. The harness is the whole laboratory: submit entries, cut wires,
kill nodes, heal, and read.

| Tool | What it proves |
|---|---|
| `harness.submit(cmd)` + `wait_committed` | the write path, end to end |
| `harness.partition(a, b)` / `heal()` | the network lying on command |
| `harness.kill(name)` | crash faults, no warning |
| `leader()` + node `term`/`log` dumps | who believes what, right now |

## Warm-ups

**Lab 1.1 — Elect someone**
**Goal:** a leader emerges from pure timeouts, no configuration.
**Do this:** start three nodes, tick until `leader()` returns non-None:

```python
h = Harness(3)
while leader(h.nodes) is None:
    h.tick()
print(leader(h.nodes).id, sorted(n.term for n in h.nodes))
```

**You'll know it works when:** exactly one leader, all terms equal — the
randomized timeouts (10–25 ticks) broke the symmetry by themselves.
**Where it comes from:** Chapter 5 — Raft I: Leader Election.

**Lab 1.2 — Commit one entry**
**Goal:** the majority rule as a visible threshold.
**Do this:** submit `x = 1`, wait for commit, then print each node's log length:

```python
h.submit("x = 1"); h.wait_committed("x = 1")
print([len(n.log) for n in h.nodes], h.leader().commit_index)
```

**You'll know it works when:** at least two of three logs hold the entry and
`commit_index` advanced on the leader. One ack would not have been enough —
count the copies.
**Where it comes from:** Chapter 6 — Raft II: Log Replication & the Commit Rule.

**Lab 1.3 — Kill the leader, keep the entry**
**Goal:** committed means kept, even through `kill -9`.
**Do this:** commit `x = 1`, kill the leader node, wait for re-election:

```python
h.submit("x = 1"); h.wait_committed("x = 1")
h.kill("leader"); h.wait_leader()
print(h.read("x"), h.leader().term)
```

**You'll know it works when:** the new leader serves `x = 1` with a higher term.
The entry survived its author's death — that sentence *is* Raft's guarantee.
**Where it comes from:** Chapters 5, 6 and 12.

## Builds

**Lab 2.1 — Halve the network**
**Goal:** the minority side cannot commit; the majority side can.
**Do this:** `partition(["n1"], ["n2","n3"])`, submit `a = 1` via n1 and `b = 2`
via n2, wait, then heal and read both.
**You'll know it works when:** `b = 2` survives and `a = 1` never existed —
n1's write had one copy and zero majorities. Quorum is not a setting; it is
arithmetic.
**Where it comes from:** Chapter 7 — Split Brains & Quorums.

**Lab 2.2 — The stale candidate loses**
**Goal:** the freshness rule (Ch 5) rejecting a has-been.
**Do this:** partition the leader away with an unreplicated tail, let the
majority elect and commit further, heal, and watch the old leader's fate.
**You'll know it works when:** the deposed leader steps down without a fight —
its log is shorter, so it can win no votes. Terms plus freshness, no drama.
**Where it comes from:** Chapter 5 — Raft I: Leader Election.

**Lab 2.3 — Heartbeats are leadership**
**Goal:** silence doubts; packets reassure.
**Do this:** with a stable leader, drop only its *outgoing* heartbeats for 30
ticks (keep client traffic flowing), and count elections.
**You'll know it works when:** at least one new election starts despite a
"healthy" leader — followers doubt what they cannot hear. Leadership is proved
continuously or not at all.
**Where it comes from:** Chapters 3 and 5.

**Lab 2.4 — Flood, then drain**
**Goal:** the log as a queue under burst load.
**Do this:** submit 100 entries as fast as the harness allows, then tick until
all three logs match.
**You'll know it works when:** all logs converge byte-identical and
`commit_index` reaches 100 — replication is a pump, and the pump kept up. Note
the tick count: that is your cluster's replication latency budget.
**Where it comes from:** Chapter 6.

**Lab 2.5 — Gossip heals what Raft can't reach**
**Goal:** anti-entropy repairing a missed update (Chapter 9) outside the log.
**Do this:** isolate n3 for 50 ticks of committed writes, heal, and compare its
digest against the majority before and after the anti-entropy round.
**You'll know it works when:** digests differ before repair and match after —
the log brought the entries, gossip noticed the gap. Two mechanisms, one truth.
**Where it comes from:** Chapter 9 — Gossip & Anti-Entropy.

## Stretch goals

**Lab 3.1 — The coordinator dies (2PC)**
**Goal:** feel why 2PC blocks where Raft proceeds (Chapter 10).
**Do this:** run the two-phase path with the coordinator killed after PREPARE
but before COMMIT, and try to resolve the participants' state.
**You'll know it works when:** they wait — correctly, forever, holding locks.
Write the one-sentence contrast with Lab 1.3: Raft's majority moves on; 2PC's
unanimity cannot.
**Where it comes from:** Chapter 10 — Two-Phase Commit & the Coordinator's Dilemma.

**Lab 3.2 — Concurrent writes, vector verdict**
**Goal:** causality judged locally, without a leader (Chapter 11).
**Do this:** take two writes from opposite sides of a partition, attach vector
clocks, heal, and classify: concurrent or causal?
**You'll know it works when:** the clocks declare them concurrent — and your
merge rule (last-writer or app-level) produces one documented winner. No leader
was consulted; the math sufficed.
**Where it comes from:** Chapter 11 — Vector Clocks & Conflict Resolution.

## Self-checking without a grader

- **Election labs** (1.1, 1.3, 2.2, 2.3): count leaders (exactly one per term),
  compare terms (monotonic, equal at rest). Any second leader in one term is a
  safety bug — stop and find it.
- **Commit labs** (1.2, 2.1, 2.4, 2.5): count copies (majority or nothing), read
  after heal (committed survives, uncommitted vanishes). The log lengths are the
  verdict.
- **Contrast labs** (3.1, 3.2): the output is a sentence you can defend — why
  Raft moved on, why 2PC waited, why the clocks called it concurrent. Say it
  aloud; vagueness is the failing grade.

## What you now know

- **Every guarantee in this course is countable:** majorities (Lab 2.1), terms
  (Lab 1.1), copies (Lab 1.2). Count them in production too.
- **Partitions are a tool, not a disaster:** the harness made the network lie on
  command — keep that habit with chaos tooling, aimed at staging first.
- **The log is the system:** elections choose a log's guardian; commits choose
  what survives; everything else is commentary.
- You can now read any consensus outage postmortem and translate it: "split
  brain" is Lab 2.1, "stale leader" is 2.2, "lost commit" would be a bug in 1.2.

Next: take etcd's or Consul's docs, find their election timeout and quorum
settings, and predict their behavior under your Lab 2.1 partition — then test
one prediction in a three-container staging cluster.
