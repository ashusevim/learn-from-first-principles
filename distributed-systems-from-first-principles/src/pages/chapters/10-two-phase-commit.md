---
layout: ../../layouts/Chapter.astro
title: 'Two-Phase Commit & the Coordinator’s Dilemma'
description: 'The simplest multi-node transaction protocol — and why its coordinator crash can freeze everything. Build: 2PC, then break it.'
part: 'Part III — Beyond One Cluster'
written: true
---

The databases course (Chapters 8, 11) left one door open: a transaction touching data on
*two machines*. Chapter 8's atomicity worked because one WAL guarded everything; across
machines, there is no single log — so how can both machines commit *together, or not at
all*? The oldest answer is **two-phase commit (2PC)**, and this chapter builds it, then
crashes its coordinator at the precise moment that reveals why 2PC is called a
*blocking* protocol — and why Raft (Chapter 5's majority) is the modern escape.

## The lie you were told

> "The database handles distributed transactions for you."

There is no magic: 2PC is a **lockstep negotiation** with a boss:

```text
Phase 1 (voting):   coordinator → all:  "PREPARE: can you commit tx7?"
                    each participant: locks the rows, writes undo records,
                                      answers YES (promising to be able to commit
                                      or roll back FOREVER) or NO
Phase 2 (decision): if all YES:  coordinator → all: "COMMIT tx7"
                    if any NO / timeout:          "ROLLBACK tx7"
```

The participant's YES is the fateful step: after saying it, the node **cannot unilaterally
decide anything anymore** — it must hold its locks and wait for the coordinator's
verdict. It has surrendered its autonomy to survive the transaction.

## The dilemma: a crash with no safe move

Crash the coordinator *between* phase 1 and phase 2. The participants all answered YES,
locked everything, and now wait. What can any of them do?

- Commit unilaterally? If the coordinator was about to say ROLLBACK (another node voted
  NO), you just violated atomicity.
- Roll back unilaterally? If the verdict was COMMIT, same crime, opposite sign.
- Wait? The locks stay held, the data is frozen — **forever**, if the coordinator's log
  is lost.

That's the dilemma: *after YES, the participant's safest action is to wait for a process
that may never return.* 2PC is **blocking**: its liveness depends on the coordinator's
survival. (Real systems: the coordinator's decision is itself written to a durable log
— databases course Chapter 4 — and participants eventually elect a new coordinator;
that's 3PC territory and its own bugs. The modern answer, Ch 5's Raft, makes each
shard's decision a consensus instead.)

## Prove it to yourself

**1. The happy path, live:**

```sh
# the build below with --no-crash: PREPARE → YES ×2 → COMMIT → both apply. Clean.
```

**2. The freeze, on demand:**

```sh
# the build with --crash-coordinator (crashes after phase 1):
# participant A: "prepared, holding locks, awaiting verdict..."
# participant B: "prepared, holding locks, awaiting verdict..."
# (silence. forever. Ctrl-C does not apply — the DATA is what's waiting.)
```

**3. Feel the cost even when it works** — during phase 1→2, both shards hold locks on
your rows (Chapter 8's isolation machinery): every other transaction touching them
waits. 2PC doesn't just risk blocking; it *always* blocks for the round-trip duration.

## The build: 2PC with a crash switch

```python
# twopc.py — two participants, one coordinator, one fatal crash switch
import json, os

class Participant:
    def __init__(self, name, undo_log=""):
        self.name, self.prepared, self.decided = name, None, None
        self.data = {}
        self.undo = undo_log + name + ".undo"

    def prepare(self, tx, writes):                 # phase 1: promise, then hold
        with open(self.undo, "w") as f:            # durable undo records (databases Ch 8)
            json.dump({"tx": tx, "old": self.data}, f)
        self.prepared = tx                         # ← from here, no unilateral decisions
        return "YES"

    def decide(self, tx, verdict):                 # phase 2: obey the coordinator
        assert self.prepared == tx, "never decided an unprepared tx!"
        if verdict == "COMMIT": self.data.update(writes_for(tx))
        self.decided, self.prepared = verdict, None
        os.remove(self.undo)                       # promise fulfilled, undo record gone
        return f"{self.name}: {verdict}"

WRITES = {"tx7": {"balance": 500}}
def writes_for(tx): return WRITES[tx]

class Coordinator:
    def __init__(self, participants): self.ps = participants; self.crash_after_phase1 = False

    def run(self, tx):
        votes = [p.prepare(tx, WRITES[tx]) for p in self.ps]      # PHASE 1
        print("votes:", votes)
        if self.crash_after_phase1:
            os._exit(1)                                            # THE DILEMMA: dies here —
                                                                   # participants hold locks forever
        verdict = "COMMIT" if all(v == "YES" for v in votes) else "ROLLBACK"
        return [p.decide(tx, verdict) for p in self.ps]           # PHASE 2

a, b = Participant("A"), Participant("B")
c = Coordinator([a, b])
print(c.run("tx7")) if "--no-crash" in os.sys.argv else c.run("tx7")
# run with the crash, then inspect: both participants prepared=True, decided=None —
# their locks are held and NOTHING may safely proceed without the coordinator.
```

Run it twice — `--no-crash` for the clean path, plain for the freeze. The frozen run's
state (`prepared`, `decided=None`) is exactly what a real database's recovery scan finds
after a coordinator crash: prepared-but-unresolved transactions, resolved only by the
coordinator's log (or a human).

## The escape: turn decisions into consensus

The disease: a *single* node's survival gates the group. The cure pattern of this whole
course: **make the decision itself replicated**. Instead of one coordinator, run Raft
(Chapters 5–7) over the transaction decisions — a leader proposes "COMMIT tx7", a
majority logs it, and any new leader inherits the verdict. That's precisely how
Spanner, CockroachDB, and TiDB commit cross-shard transactions: 2PC *inside*, but each
participant's vote is protected by a Raft group, and leadership failures route around
the dilemma. You built every ingredient in Chapters 5–7.

## What you now know

- 2PC: **prepare (promise + lock) → decide (commit/rollback)** — correct, simple, and
  *blocking*: a coordinator crash after phase 1 freezes every participant.
- The participant's YES is a **surrender of autonomy** — undo records make any verdict
  executable, but only the coordinator's can be chosen.
- Real systems fix it with durable coordinator logs, 3PC (its own problems), or — the
  modern route — **consensus over the decision** (Spanner-style: 2PC + Raft per shard).
- Cross-shard transactions are expensive *always* (lock duration) and dangerous
  *sometimes* (the freeze). Design your data model to avoid needing them.

Next: consensus agrees; replication copies; but when two shards accept writes for the
same key *concurrently*, someone must detect the crime. Vector clocks — Dynamo's answer
to "who wrote first?" (trick question: neither).
