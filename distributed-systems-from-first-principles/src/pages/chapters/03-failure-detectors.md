---
layout: ../../layouts/Chapter.astro
title: 'Failure Detectors: Knowing When a Node Is Dead (You Can’t)'
description: 'A timeout means "no news" — crashed, slow, or partitioned? Build: a heartbeat detector and enumerate every wrong verdict it can produce.'
part: 'Part I — The Ground Rules'
written: true
---

Consensus needs progress, and progress needs a decision: *"node X is gone; stop waiting
for it."* But Chapter 1 proved that "no reply" is permanently ambiguous — crashed, slow,
or partitioned produce **identical observations**. A failure detector is therefore not a
sensor; it's a **guessing machine** with a known error budget. This chapter builds one,
makes it wrong in every documented way, and names the tradeoff (completeness vs
accuracy) that all of Chapter 5's leader elections inherit.

## The lie you were told

> "The heartbeat timed out, so the node is dead."

A timeout tells you exactly one thing: **no message arrived within T**. Every possible
cause looks identical from outside:

```text
┌───────────────────────────────────────────────────────┐
│ crashed forever      │ heartbeat will never come      │
│ GC pause of 8s       │ heartbeat comes LATE           │
│ network partition    │ heartbeats can't reach you     │
│ congested switch     │ heartbeats come late, then fine│
└───────────────────────────────────────────────────────┘
   all four look like: silence. Your move.
```

If you evict a live-but-slow node, two nodes may believe they're the leader (split
brain — Chapter 7's problem). If you wait forever for a dead one, the cluster stalls.
**The detector's tuning is the cluster's personality.**

## The formal tradeoff: completeness vs accuracy

Theory (Chandra–Toueg) splits the guess into two axes:

- **Completeness** — *eventually* suspect every node that actually died. (Missing a dead
  node = the cluster waits on a corpse.)
- **Accuracy** — never (or rarely) suspect a *live* node. (A wrong suspicion = chaos.)

And the theorem that shapes everything: with an **eventually perfect** detector — one
that makes mistakes but *stops making them if the network stabilizes* — consensus is
solvable. With a perfect detector, it's trivial. With a worse one, it's not (this is
FLP-impossibility territory). Real systems (Akka, Cassandra's **phi accrual
detector**, etcd) all build "eventually perfect": suspicion *rises with the length of
the silence* instead of flipping at one timeout.

## Prove it to yourself

**1. The wrong verdicts, enumerated live** — a heartbeat detector fed every failure mode:

```python
# detector.py — one detector, three scenarios, four wrong verdicts possible
import time

def detector(heartbeat_interval=0.2, timeout=0.5):
    """Suspicion = no heartbeat within `timeout`. That's the whole mechanism."""
    last_beat = time.monotonic()
    def beat(): nonlocal last_beat; last_beat = time.monotonic()
    def is_dead(): return time.monotonic() - last_beat > timeout
    return beat, is_dead

# scenario 1: the node truly crashes → correct verdict (completeness works)
beat, dead = detector()
beat(); time.sleep(0.3); beat()                  # healthy heartbeats
time.sleep(0.7)                                  # ...then silence
print("crashed node detected:", dead())          # True — good

# scenario 2: the node GC-pauses for 0.6s → FALSE POSITIVE
beat, dead = detector()
beat(); time.sleep(0.6)                          # the "pause"
print("paused node 'detected' as dead:", dead()) # True — WRONG. It will come back.
beat()
print("...and it's 'alive' again:", not dead())  # the verdict was reversible. Nothing was.
```

**2. Watch the verdict flip back** — the scariest line in distributed systems is the
one above: *"dead"* then *"alive"* with no action possible in between that was safe in
both worlds. Chapter 7's quorums exist precisely because suspicion is not fact.

**3. Feel the tuning dial** — shrink `timeout` to 0.1 (fast detection, many false
positives) and grow it to 5.0 (few false positives, corpse-waiting). Neither setting is
"correct"; they price the same tradeoff differently. Production clusters make this
tradeoff *visible* (`failure-timeout` in every config file you've ever seen).

## The build: a phi-accrual detector (the honest upgrade)

Instead of a binary timeout, score suspicion on a sliding scale — "how weird is this
silence, historically?":

```python
# phidetect.py — accrual suspicion: heartbeat history → a suspicion LEVEL, not a verdict
import time, math

class PhiDetector:
    def __init__(self, window=10):
        self.intervals = []                      # recent gaps between heartbeats
        self.last = time.monotonic()
        self.window = window

    def beat(self):
        now = time.monotonic()
        self.intervals.append(now - self.last)   # learn the node's NORMAL rhythm
        self.intervals = self.intervals[-self.window:]
        self.last = now

    def phi(self):                               # suspicion: 0 = fine, 1+ = weird, 10+ = gone
        if not self.intervals: return 0.0
        mean = sum(self.intervals) / len(self.intervals)
        silence = time.monotonic() - self.last
        return max(0.0, silence / max(mean, 1e-9)) * 3   # (toy scaling; real phi uses a
                                                         # normal CDF over the samples)

d = PhiDetector()
for _ in range(10): d.beat(); time.sleep(0.2)    # a rhythm: one beat per 200ms
print(f"healthy:      phi={d.phi():.2f}")
time.sleep(0.5);  print(f"0.5s silent:  phi={d.phi():.2f}   ← suspicious, not verdict")
time.sleep(0.5);  print(f"1.0s silent:  phi={d.phi():.2f}   ← strongly suspect")
```

The difference is philosophical and practical: a timeout says "dead: yes/no"; phi says
"suspicion = 4.2" — and *each consumer decides its own threshold*. A load balancer
routes away at phi=2; an election waits for phi=8. One detector, many policies.

## What you now know

- "Timed out" ≠ "dead" — four failure modes produce **identical silence**.
- Detectors trade **completeness** (catch all deaths) against **accuracy** (don't suspect
  the living); "eventually perfect" is the winnable version.
- **Phi-accrual** detection (Cassandra, Akka) replaces the verdict with a suspicion
  score — consumers pick their own thresholds.
- Suspicion is *reversible*, so protocols must survive being wrong — Chapter 5's leader
  elections are built on exactly that assumption.

Next: with clocks (Ch 2) and failure detectors (Ch 3) established as approximations, we
can finally state the problem everything solves: getting a cluster to agree on **one
log**. The replicated state machine.
