---
layout: ../../layouts/Chapter.astro
title: 'Two Generals & Why Networks Lie'
description: 'Messages get lost, delayed, and reordered — and no protocol can fix it. Build: a flaky channel and your first taste of irreducible doubt.'
part: 'Part I — The Ground Rules'
written: true
---

Everything hard about distributed systems fits inside one thought experiment from 1975.
Two generals must attack a city *together* — each alone loses. They can only communicate
by messengers through hostile territory, where messengers may be **captured** (message
lost) or **delayed forever** (message eventually arrives, with unknown delay). The
shocking result: **no protocol, however clever, guarantees they can coordinate.** This
chapter makes you *feel* why — because every protocol in this course (Raft, quorums,
gossip) is a strategy for living inside that impossibility, not escaping it.

## The lie you were told

> "The network delivers messages between servers."

It delivers messages *usually*, with **no bound on loss, delay, or reordering**. The
kindergartner's instinct applies: any "acknowledged" agreement can be undone by a lost
final message. TCP (networking course, Chapter 4) hides loss *on one connection* — it
cannot hide node crashes, partitions, or the fact that "no reply" means "dead, slow, or
message lost", forever indistinguishable.

## The impossibility, concretely

Suppose the generals have *any* protocol. Consider its last message M — the one that, if
received, makes general A commit to attacking:

```text
A ──M──► B : B now commits
```

But M may be lost. So B can't commit on M alone... it must ack M. But that ack may be
lost, so A can't commit before receiving the ack... which needs its own ack... **the
regress never ends.** Any finite protocol has a last message; a lost last message leaves
one side unsure; agreeing to attack anyway risks disaster. The uncertainty is not an
engineering gap — it's a proof.

The way out is not to solve it, but to **change the question**: with *more* generals, a
**majority** can act safely even if some messages vanish (Chapter 7's quorums); with
retries, protocols get "eventually" guarantees with probabilistic tails. Raft is not an
escape from Two Generals — it's a beautiful negotiation with it.

## Prove it to yourself

**1. Watch a perfect protocol fail:**

```python
# generals.py — any protocol you write; the channel is the adversary
import random, time

random.seed(42)                      # the adversary is DETERMINISTIC — still undefeated

def send(msg):                       # the hostile territory: 30% loss, unbounded delay
    return msg if random.random() > 0.3 else None

def general_a():
    for attempt in range(1, 10):
        ack = send(f"ATTACK attempt {attempt}")
        if ack is not None:
            return f"A: attack confirmed on attempt {attempt}"
        print(f"A: attempt {attempt} lost")
    return "A: never confirmed — do I attack? I CANNOT KNOW"

def general_b():
    # B's dilemma: even if it receives "ATTACK", was A told? Even with an ack...
    # ...can A ever be SURE the ack arrived? (No. That's the theorem.)
    return "B: awaiting orders — and even 'no orders' is ambiguous"

print(general_a()); print(general_b())
```

Every fix you add — acks, acks-of-acks, retries with backoff — has a last message. Add
it to the sim, watch the adversary eat it.

**2. Feel "no reply" ambiguity — the real-world version:**

```sh
# is this node dead, slow, or unreachable? ALL THREE look identical from outside:
timeout 2 curl -s http://10.0.0.5:8080/health || echo "? dead | slow | partitioned — SAME SIGNAL"
```

Chapter 3 builds its whole theory on this ambiguity; Chapter 1 is where you stop
trusting timeouts.

**3. The database connection** — you've already met this enemy: databases course,
Chapter 11's replication. A primary that replicates its WAL to a replica is General A
shipping messages through hostile territory. Every "consistency setting" in every
database is a pre-written answer to "what do we do when messages vanish?"

## The build: an adversary channel, kept forever

```python
# flakychannel.py — a message channel with EVERY network vice, for testing protocols
import random, itertools

class FlakyChannel:
    """Drop, delay, reorder, duplicate. The four horsemen of distributed systems."""
    def __init__(self, loss=0.2, delay_prob=0.2, dup=0.1, seed=None):
        self.loss, self.delay_prob, self.dup = loss, delay_prob, dup
        self.inbox, self.rng = [], random.Random(seed)
        self.clock = itertools.count()          # for deterministic reordering

    def send(self, msg):                        # sender's view: "I called send()"
        if self.rng.random() < self.loss: return            # LOST: no error, just gone
        arrivals = 1 + (self.rng.random() < self.dup)       # DUPLICATED
        for _ in range(arrivals):
            delay = self.rng.random() * 10 if self.rng.random() < self.delay_prob else 0
            self.inbox.append((next(self.clock) + delay * 1000, msg))
        self.inbox.sort()                       # REORDERED: arrival order ≠ send order

    def recv(self):
        if not self.inbox: return None
        return self.inbox.pop(0)[1]

# — the four horsemen, demonstrated —
ch = FlakyChannel(seed=7)
for m in ["a", "b", "c", "d", "e"]:
    ch.send(m)
delivered = list(iter(lambda: ch.recv(), None))
print("sent: a b c d e")
print("delivered:", delivered)   # duplicates, gaps, wrong order — and 'send()' never failed
```

Keep this class. Every protocol in the rest of the course — elections, log replication,
gossip — will be tested against it, and the ones that survive are the ones worth
knowing.

## What you now know

- **No finite protocol guarantees agreement over an unreliable channel** — the last
  message always has a missing ack. (The Two Generals theorem.)
- "No reply" is permanently ambiguous: crashed / slow / partitioned. Timeouts are
  guesses, not facts.
- The industry's answer isn't a solution — it's *reformulated questions*: majorities
  (Ch 7), eventual consistency (Ch 9), conflict merge (Ch 11).
- You now own an adversary channel — the test harness for every protocol ahead.

Next: "which happened first?" is the next casualty. Clocks lie too — and the fix
(Lamport clocks) is one of the most beautiful ideas in the field.
