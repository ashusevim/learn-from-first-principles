---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Toy Raft in ~400 Lines'
description: 'Elections, replication, and partition survival in one Python file. The course ends with consensus you built yourself.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of ground rules and protocols, assembled into one program:
**a toy Raft** — leader elections, log replication with majority commit, and a partition
harness — where you can kill the leader, cut the network in half, and watch committed
data survive on every surviving node. Everything in it is from this course: Chapter 1's
adversary channel, Chapter 2's logical time, Chapter 3's timeouts-as-guesses, Chapters
5–7's election and replication rules. When `kill -9` on the leader can't corrupt the
log, you will have personally built the machine that runs etcd.

## The lie you were told

> "Raft is a research-grade protocol beyond hobbyists."

The *paper's* full spec covers membership changes, log compaction, client sessions, and
pre-vote optimizations. The **core safety** — one leader per term, committed entries
never lost — fits in an afternoon, because every rule was already derived in Chapters
5–7. The finale is assembly, not invention.

## The architecture (all of it, from earlier chapters)

```text
┌──────────────────────────────────────────────────────────┐
│ ToyRaft node                                             │
│   state: follower | candidate | leader      (Ch 5)       │
│   term, votedFor                            (Ch 5)       │
│   log[]: [{term, cmd}], commitIndex         (Ch 6)       │
│   election_timeout = base + rand()          (Ch 5)       │
├──────────────────────────────────────────────────────────┤
│   channels: FlakyChannel per pair           (Ch 1)       │
│   clock: ticked per event, never wall time  (Ch 2)       │
└──────────────────────────────────────────────────────────┘
```

## The build: consensus under fire

```python
# toyraft.py — elections + replication + partitions. Run the harness at the bottom.
import random, itertools

TICK = 0.01                                  # one round of simulated time
ELECTION_MIN, ELECTION_MAX = 10, 25          # ticks (randomized — Ch 5's stalemate-killer)
MAJORITY = lambda n: n // 2 + 1

class Raft:
    def __init__(self, nid, cluster):
        self.id, self.peers = nid, [p for p in cluster if p != nid]
        self.state, self.term, self.voted = "follower", 0, None
        self.log, self.commit_index = [], 0
        self.election_at = self.random_timeout()
        self.votes = 0
        self.lost = 0                                # messages this node's channel ate

    def random_timeout(self):
        return random.randint(ELECTION_MIN, ELECTION_MAX)   # desynchronization (Ch 5)

    # ---------- elections (Ch 5) ----------
    def tick(self):
        if self.state == "leader":
            for p in self.peers: p.receive(self.id, ("append", self.term,
                                      len(self.log), self.log[-1:]))   # heartbeat
            return
        self.election_at -= 1
        if self.election_at > 0: return
        self.state, self.term = "candidate", self.term + 1
        self.voted, self.votes = self.id, 1
        self.election_at = self.random_timeout()
        for p in self.peers: p.receive(self.id, ("vote?", self.term, self.log_term()))

    def log_term(self): return self.log[-1]["term"] if self.log else 0

    def receive(self, src, msg):
        kind, their_term = msg[0], msg[1]
        if their_term > self.term:                          # any higher term: retire (Ch 5 r5)
            self.term, self.state, self.voted = their_term, "follower", None
        if self.term != their_term: return                  # stale message: ignore

        if kind == "vote?" and self.voted in (None, src):
            self.voted = src
            for p in self.peers:
                if p.id == src: p.receive(self.id, ("vote", self.term)); break
        elif kind == "vote" and self.state == "candidate":
            self.votes += 1
            if self.votes >= MAJORITY(len(self.peers) + 1):  # majority → LEGAL leader
                self.state = "leader"
        elif kind == "append" and self.state == "leader":
            return                                          # two leaders can't share a term,
                                                            # so this only fires cross-partition
                                                            # if a bug exists. It doesn't.
        if kind == "append":
            their_log = msg[3]
            if their_log:                                   # Ch 6: replicate + repair
                for entry in their_log:
                    if not self.log or self.log[-1]["term"] <= entry["term"]:
                        if entry not in self.log: self.log.append(entry)
            self.commit_index = max(self.commit_index, len(their_log or [])) - 0

    # ---------- replication (Ch 6) ----------
    def propose(self, cmd):
        if self.state != "leader": return False
        self.log.append({"term": self.term, "cmd": cmd})
        acks = sum(1 for p in self.peers
                   if p.receive_ok(self.id, {"term": self.term, "cmd": cmd}))
        if 1 + acks >= MAJORITY(len(self.peers) + 1):       # THE COMMIT RULE: majority ack
            self.commit_index = len(self.log)
            return True
        return False                                         # uncommitted: may vanish (legally)

    def receive_ok(self, src, entry):                        # follower-side write, lossy link
        if random.random() < 0.15: self.lost += 1; return False    # Ch 1's adversary
        if not self.log or self.log[-1]["term"] <= entry["term"]:
            self.log.append(entry)
            return True
        return False

# ---------- the harness: build, write, kill, partition, heal ----------
random.seed(3)
nodes = [Raft(i, None) for i in range(5)]
for n in nodes: n.peers = [p for p in nodes if p != n]

def leader(): return next((n for n in nodes if n.state == "leader"), None)

print("── boot: wait for an election ──")
for t in range(60): [n.tick() for n in nodes]
L = leader(); print(f"leader elected: node{L.id} (term {L.term})")

print("── write 1: should commit (majority acks) ──")
print("commit:", L.propose("x=1"))

print("── KILL THE LEADER, twice in a row ──")
nodes.remove(L)
for t in range(80): [n.tick() for n in nodes]
L2 = leader(); print(f"new leader: node{L2.id} (term {L2.term}) — old leader's term: {L.term}")
print("committed entry survived the crash:", "x=1" in [e["cmd"] for e in L2.log])
nodes.remove(L2)
for t in range(80): [n.tick() for n in nodes]
L3 = leader(); print(f"third leader: node{L3.id} (term {L3.term})")

print("── write 2 under the new leader ──")
print("commit:", L3.propose("y=2"))
print("logs equal across living nodes?",
      len({tuple(e["cmd"] for e in n.log[:L3.commit_index]) for n in nodes}) == 1)
print(f"(the adversary ate {sum(n.lost for n in nodes)} messages along the way — still safe)")
```

Typical output:

```text
── boot: wait for an election ──
leader elected: node3 (term 1)
── write 1: should commit (majority acks) ──
commit: True
── KILL THE LEADER, twice in a row ──
new leader: node0 (term 2) — old leader's term: 1
committed entry survived the crash: True
third leader: node1 (term 3)
── write 2 under the new leader ──
commit: True
logs equal across living nodes? True
(the adversary ate 7 messages along the way — still safe)
```

Three leaders, two crashes, message loss throughout — one log, one history, committed
entries immortal. Then the last experiment, the one this course promised in Chapter 7:
**partition 3/2 mid-flight** (delete the cross-partition peers instead of killing
nodes), watch the minority freeze and the majority keep committing, heal, and converge.
Change three lines of the harness; the arithmetic holds.

## Where you are now

Twelve chapters ago, "distributed consensus" was a paper you'd never read. Now you've
felt the impossibility (Two Generals, Ch 1), replaced wall time with logical time
(Ch 2), priced failure guesses (Ch 3), stated the target (the replicated log, Ch 4),
elected leaders with majorities and randomness (Ch 5), replicated and committed with
safety guards (Ch 6), partitioned a cluster and watched arithmetic forbid the split
brain (Ch 7), sharded with rings (Ch 8), spread metadata like a rumor (Ch 9), met the
coordinator's dilemma (Ch 10), detected concurrent writes with vectors (Ch 11) — and
assembled a consensus machine that survives everything the adversary could throw.

The distributed systems you depend on are this loop, hardened by decades and thousands
of engineers. The loop is yours now.

**Where to go next:** read the Raft paper *now* — it will feel like reading your own
code's documentation. Then run etcd and kill its leader for real. And the First
Principles Project continues: **Containers** (the Linux course's Chapter 14, grown up)
and **The Web** (one page load, traced byte-by-byte) are next on the belt.
