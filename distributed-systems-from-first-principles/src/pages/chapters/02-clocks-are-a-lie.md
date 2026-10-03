---
layout: ../../layouts/Chapter.astro
title: 'Clocks Are a Lie (Use Logical Ones)'
description: 'Physical clocks skew by milliseconds; distributed order can’t be timed into existence. Build: Lamport clocks that order events without wall time.'
part: 'Part I — The Ground Rules'
written: true
---

Chapter 1 proved messages can't be trusted. The next casualty is **time itself**: two
machines' clocks disagree by milliseconds (or seconds, or years), messages arrive after
events they "predate", and "what happened first?" — the question every distributed
database, every log, every conflict resolution asks — cannot be answered with clocks.
The fix is one of the most beautiful ideas in the field: stop measuring time, start
**counting events**.

## The lie you were told

> "Timestamps tell you the order things happened."

A timestamp says what *one machine's* clock read at that instant. Two machines' clocks
skew (NTP only narrows it), and skew + message delay produces nonsense:

```text
node A (clock 10:00:00.010): "balance = 100"   ──message──►   node B (clock 10:00:00.005)
node B: "this update claims it happened 5ms BEFORE my last write — in the future's past?"
```

Worse: two events on different machines with no message between them are **concurrent**
— no timestamp can order them, because no causal relationship exists. "Happened-before"
is a *logical* relation (a → b if a's process did it before sending, or a's message was
received before b), and it has nothing to do with wall clocks.

## Lamport's clock: counting instead of measuring

Lamport's 1978 insight: replace "when" with "in what causal order". Give every node a
counter with three rules:

```text
1. before each local event:        counter += 1
2. before sending a message:       counter += 1,  attach counter to the message
3. on receiving a message:         counter = max(counter, received) + 1
```

Then `a → b` (a happened-before b) implies `L(a) < L(b)` — the counters never contradict
causality. Two rules of the resulting order: it's *consistent* (causal order is always
preserved) but not *complete* (equal or close counters across nodes tell you nothing —
Lamport time can't detect concurrency). Ties broken by node ID give a **total order**
that all nodes agree on — the exact thing a replicated log needs (Chapter 4).

The cost is profound: Lamport time has **no units**. "Count 42" means nothing in
seconds — only "42 events from this causal lineage". Distributed systems run on this
disembodied time.

## Prove it to yourself

**1. Watch real clocks skew** — two clocks, one moment:

```sh
python3 - <<'EOF'
import time, subprocess
a = time.time()
b = float(subprocess.check_output(
    ["python3", "-c", "import time; print(time.time())"]))
print(f"clock gap between two processes on ONE machine: {(b-a)*1000:.2f} ms")
EOF
# now imagine that gap across machines, plus NTP jitter, plus message flight time
```

**2. Make timestamps lie** — Chapter 1's channel, weaponized:

```python
import time, threading
events = []
def node(name, delay):
    time.sleep(delay)
    events.append((time.time(), f"{name} fired"))
threading.Thread(target=node, args=("A", 0)).start()
threading.Thread(target=node, args=("B", 0.001)).start()
time.sleep(0.1)
print(sorted(events))   # order depends on the SCHEDULER, not on causality
```

With real network delays, `sorted(events)` can contradict what actually caused what.
Timestamps describe *when clocks ticked*; they say nothing about causes.

## The build: Lamport clocks over the flaky channel

```python
# lamport.py — three nodes, causally ordered events, no wall clock consulted
from flakychannel import FlakyChannel          # Chapter 1's adversary, reused

class Node:
    def __init__(self, name, channel, peers):
        self.name, self.ch, self.peers = name, channel, peers
        self.clock = 0                         # the Lamport clock: an integer, that's all
        self.log = []

    def local_event(self, what):
        self.clock += 1                        # rule 1
        self.log.append((self.clock, self.name, what))

    def send(self, peer, what):
        self.clock += 1                        # rule 2: tick before sending
        self.log.append((self.clock, self.name, f"send →{peer}: {what}"))
        self.ch.send((self.name, self.clock, what))

    def receive(self):
        msg = self.ch.recv()
        if msg:
            src, their_clock, what = msg
            self.clock = max(self.clock, their_clock) + 1   # rule 3: absorb + tick
            self.log.append((self.clock, self.name, f"recv ←{src}: {what}"))

a = Node("A", FlakyChannel(seed=1), ("B",))
b = Node("B", FlakyChannel(seed=1), ("A",))

a.local_event("user deposits 100")
a.send("B", "balance is now 100")
b.receive()                                    # B learns AFTER the cause
b.local_event("user withdraws 50")
for line in sorted(a.log + b.log):
    print(f"L={line[0]:<3} [{line[1]}] {line[2]}")
```

Read the output's `L` column: B's receive **always** carries a higher clock than A's
send, no matter how the channel delays or reorders. Causality survived the network —
without a single timestamp. (If a flaky `send` gets eaten, B never hears the cause —
Chapter 1's theorem, now with clocks. Protocols retry; clocks just keep counting.)

## What you now know

- Wall-clock timestamps **cannot** order events across machines: skew + delay + concurrency.
- **Happened-before** is logical: Lamport clocks count it with three rules, giving every
  node the same total order (counter + node-ID tiebreak).
- Lamport time is *consistent but not complete* — concurrency is invisible to it
  (vector clocks fix that, Chapter 11).
- The replicated log (next chapter) is exactly "a total order everyone agrees on" —
  you've now seen the raw material.

Next: if messages can't be trusted and clocks can't order events, how does a cluster
ever agree on *one* log? First step: admit you can't even tell if a node is dead.
Failure detectors.
