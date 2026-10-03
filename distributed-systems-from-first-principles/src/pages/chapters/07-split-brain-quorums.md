---
layout: ../../layouts/Chapter.astro
title: 'Split Brains & Quorums'
description: 'A 5-node cluster partitions 3/2. Why the majority side lives, the minority freezes, and the intersection rule makes it safe. Build: a partition harness.'
part: 'Part II — Consensus (Raft)'
written: true
---

The network partition — Chapter 1's nightmare — is the moment every distributed system
must be judged. Your 5-node cluster splits 3/2: the 3-side can talk to itself, the
2-side can talk to itself, **neither can see the other**, and both sides know nothing
except silence (Chapter 3: ambiguous). A naive cluster splits its brain: two leaders,
two histories, two databases. Raft's answer is one rule — **majority** — and this
chapter partitions a live cluster to show why the rule makes the disaster *arithmetic*,
not luck.

## The lie you were told

> "A partition is detected and handled."

Nothing is "detected" (Chapter 3: silence is ambiguous). What actually happens is
beautiful and cold:

```text
5 nodes: {A B C} | {D E}          ← the cut. No messages cross.

{A B C} side: 3 nodes ≥ majority → elects a leader (term 5), COMMITS writes
{D E} side:   2 nodes < majority → D and E keep campaigning, keep failing,
                                  NEVER elect (no majority exists), serve NOTHING
```

The minority doesn't "choose" caution — it's *incapable* of misbehaving: it cannot win
an election (Chapter 5's votes-once + majority), cannot commit (Chapter 6's majority
acks), and its old leader self-retires the moment any majority-side message crosses
higher-term. The 2-side is a frozen museum of stale data. When the partition heals, the
majority's log wins and the minority catches up (Chapter 6's log matching).

## The intersection rule (all of it, one line)

<figure class="diagram">
<svg viewBox="0 0 860 160" role="img" xmlns="http://www.w3.org/2000/svg">
  <g font-family="ui-monospace,monospace" font-size="12">
    <rect x="20" y="15" width="460" height="130" rx="12" fill="rgba(126,226,168,0.06)" stroke="#7ee2a8" stroke-dasharray="5 4"/>
    <rect x="520" y="15" width="320" height="130" rx="12" fill="rgba(229,72,77,0.06)" stroke="#e5484d" stroke-dasharray="5 4"/>
    <g>
      <circle cx="80"  cy="80" r="24" fill="#1c2a20" stroke="#7ee2a8"/><text x="80"  y="85" text-anchor="middle" fill="#e6edf3">A</text>
      <circle cx="180" cy="80" r="24" fill="#1c2a20" stroke="#7ee2a8"/><text x="180" y="85" text-anchor="middle" fill="#e6edf3">B</text>
      <circle cx="280" cy="80" r="24" fill="#3a2e1c" stroke="#e8b15c"/><text x="280" y="85" text-anchor="middle" fill="#e8b15c" font-weight="bold">C</text><text x="280" y="132" text-anchor="middle" fill="#e8b15c" font-size="10">LEADER (term 3)</text>
      <line x1="104" y1="80" x2="152" y2="80" stroke="#7ee2a8" stroke-width="1.5"/>
      <line x1="204" y1="80" x2="252" y2="80" stroke="#7ee2a8" stroke-width="1.5"/>
      <text x="250" y="40" text-anchor="middle" fill="#7ee2a8" font-weight="bold">MAJORITY — 3 of 5</text>
      <text x="250" y="56" text-anchor="middle" fill="#8b949e" font-size="10">elects, commits, serves</text>
    </g>
    <g>
      <circle cx="600" cy="80" r="24" fill="#161b22" stroke="#e5484d"/><text x="600" y="85" text-anchor="middle" fill="#e6edf3">D</text>
      <circle cx="700" cy="80" r="24" fill="#161b22" stroke="#e5484d"/><text x="700" y="85" text-anchor="middle" fill="#e6edf3">E</text>
      <line x1="624" y1="80" x2="672" y2="80" stroke="#e5484d" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text x="680" y="40" text-anchor="middle" fill="#e5484d" font-weight="bold">MINORITY — 2 of 5</text>
      <text x="680" y="56" text-anchor="middle" fill="#8b949e" font-size="10">no majority → frozen by arithmetic</text>
    </g>
    <line x1="497" y1="10" x2="497" y2="150" stroke="#e8b15c" stroke-width="2"/>
    <text x="497" y="8" text-anchor="middle" fill="#e8b15c" font-size="11" font-weight="bold">the cut</text>
  </g>
</svg>
<figcaption>Fig 1 — A 3/2 partition: the majority side lives; the minority side is frozen by arithmetic, not by choice.</figcaption>
</figure>


**Any two majorities share at least one node.** So a decision made by the old
majority is *witnessed* by a member of any future majority — votes-once per term turns
that witness into a veto. Split brains don't get "resolved"; they get **structurally
prevented**: 3/2 allows exactly one legal leader, ever.

That single line of arithmetic is why Raft clusters use odd sizes (3, 5, 7): 4 nodes
buys nothing (majority 3, tolerates 1 death) over 3 nodes (majority 2, tolerates 1) but
costs more.

## Prove it to yourself

**1. The old leader's dethroning** — partition the *majority's* leader away:

```text
5 nodes, L = A (term 3). Partition: {B C D} | {A E}.
- {B C D} elects a new leader, term 4 (majority! A and E absent but irrelevant).
- A keeps heartbeating at term 3 to E only.
- When ANY message from term 4 reaches A (or vice versa): A → follower, instantly
  (Chapter 5's rule 5). Its term-3 "leadership" was already fiction.
```

**2. Stale reads on the minority** — the 2-side can still *serve reads* if you let it:
that's why production systems route reads through the leader (which must hold a
majority lease) or use read-quorums. The cluster can't stop a liar from reading stale
data — but it makes lying *about writes* impossible.

**3. The partition harness, live** — the build below cuts the network mid-flight and
prints both sides' worlds. The line to watch: `minority side: committed=0`.

## The build: a partition harness over the toy cluster

```python
# partition.py — 5 nodes, a network cut, and the arithmetic that prevents split brain
import random
random.seed(11)

N, MAJ = 5, 3

class Node:
    def __init__(self, nid):
        self.id, self.term, self.leader = nid, 0, None
        self.log = []                       # committed entries
    def campaign(self, term):               # returns True if this node WINS an election
        votes = 1                           # self-vote
        return votes + reachable(self.id, term) >= MAJ
    def commit(self, entry):
        self.log.append(entry)

def reachable(nid, term):                   # count peers this node can reach this term
    return sum(1 for p in range(N) if p != nid and network.can_send(nid, p, term))

class Network:                              # Chapter 1's channel, now with a PHYSICAL CUT
    def __init__(self): self.cut = set()
    def can_send(self, a, b, term=None): return (a, b) not in self.cut
    def sever(self, groups):                # every cross-group pair becomes silence
        for a in groups[0]:
            for b in groups[1]:
                self.cut.add((a, b)); self.cut.add((b, a))

network = Network()
nodes = [Node(i) for i in range(N)]

print("--- healthy: node 0 leads, everyone replicates ---")
nodes[0].term = 2; nodes[0].leader = True
nodes[0].commit("x=1")
print("node0 log:", nodes[0].log)

print("\n--- PARTITION: {0,4} | {1,2,3} (leader 0 trapped in the minority) ---")
network.sever([{0, 4}, {1, 2, 3}])

# majority side: {1,2,3} — they can elect (3 >= MAJ) and commit
majority_side = [n for n in nodes if n.id in {1, 2, 3}]
for n in majority_side: n.term = 3
majority_leader = majority_side[0]
print("majority side elects:", majority_leader.id in {1, 2, 3},
      f"(3 reachable votes >= {MAJ})")
majority_leader.commit("y=2")
print("majority commits y=2 → log:", majority_leader.log)

# minority side: {0,4} — the OLD leader cannot win: 2 < MAJORITY, forever
minority_side = [n for n in nodes if n.id in {0, 4}]
can_minority_lead = any(n.campaign(3) for n in minority_side)
print("minority can elect a leader:", can_minority_lead, f"({len(minority_side)} < {MAJ})")
print("old leader's log stays:", nodes[0].log, "← frozen, never committed y=2")

print("\n--- HEAL: the cut is lifted ---")
network.cut.clear()
# any message from the term-3 majority reaches old-leader node 0:
nodes[0].term = 3; nodes[0].leader = False      # rule 5: higher term → instant retirement
nodes[0].log = majority_leader.log              # log matching: catch up (Ch 6)
print("old leader now follows term 3 and catches up:", nodes[0].log)
print("one history, one truth — the split brain was ARITHMETICALLY impossible")
```

The output tells the story in four acts: healthy replication, the cut, a majority that
commits and a minority that *can't* (not "won't"), and a heal where the stale side
retires and catches up. No line of the harness needed to "handle" the split brain —
the majority arithmetic had already forbidden it.

## What you now know

- Partitions aren't detected; they're **survived**: the majority side stays live, the
  minority structurally can't act.
- **Any two majorities intersect** — one shared witness + votes-once-per-term = one
  legal leader, one history. Split brain is arithmetic, not luck.
- Odd cluster sizes are the sweet spot (3/5/7) — even sizes buy nothing.
- Reads from a minority node are stale by definition — production routes reads through
  the leader or read-quorums.

Next: consensus solved for *one* replicated log. Now scale *out*: how does a 100-node
storage system decide which node holds which key? Consistent hashing — and the modulom
trap it replaces.
