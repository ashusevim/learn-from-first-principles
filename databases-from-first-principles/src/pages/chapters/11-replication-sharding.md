---
layout: ../../layouts/Chapter.astro
title: 'Replication & Sharding: The Distributed Tax'
description: 'Copying data and splitting data — and the consistency bills both send you. The CAP tradeoff, made concrete.'
part: 'Part III — Correctness & Scale'
written: true
---

Your database works, is crash-safe, serves queries — on one machine. One machine has one
power cord, one disk, one network link, and one CPU's worth of write capacity. The
industry's two answers: **replication** (copy the data) and **sharding** (split the
data). Both are mandatory at scale, and both arrive with itemized bills in consistency,
latency, and operational complexity. This chapter is the invoice.

## The lie you were told

> "Replicas make everything better."

A replica is a machine answering queries using data that was true *some seconds ago*.
Everything hard about distributed databases lives in "some seconds ago":

```text
write → primary (fsync WAL, Ch 4) → ship WAL → replica replays it (Ch 4 again!)
                                              ↑
                            that arrow takes time. Anything read from the replica
                            during the gap is STALE — and stales have consequences.
```

You already know the mechanism: replication is Chapter 4's log, shipped over the network
(networking course, Ch 4's TCP!), replayed by Chapter 9's version rules. **It's your
whole course, connected.** The hard part isn't moving the log — it's deciding what you're
allowed to promise while it's in flight.

## CAP, made concrete (not with a triangle diagram)

The theorem is usually drawn as a triangle; the reality is a **failure-moment decision**.
When the network between primary and replica splits:

- **Stay consistent**: refuse writes (or reads) that can't be checked → unavailable.
- **Stay available**: serve and accept anyway → stale reads, divergent copies to reconcile.

Every product's "consistency setting" is a pre-written answer to that moment. "Eventual
consistency" means: *at the moment of split, we chose availability, and here's how we
paper over the divergence afterwards* (last-write-wins, CRDTs, conflict counters).
None are free; they're different currencies.

## Sharding: splitting is the easy part

Sharding puts different keys on different machines — `user_id % 16` decides server 11.
Lookups become one-machine queries. Then the bill:

- **Cross-shard queries** — "top 10 by score *overall*" hits every shard and merges.
- **Cross-shard transactions** — your Chapter 8 atomicity only covered one machine;
  distributed commits need two-phase protocols (prepare on all, then commit — which can
  *stall* if one coordinator dies).
- **Resharding** — your `% 16` becomes `% 32`; moving half your data while serving traffic
  is the most dangerous week of an infrastructure engineer's life. (Consistent hashing —
  the ring — exists to shrink that week.)

## Prove it to yourself

**1. Replication lag, measured with your own WAL:**

```sh
# primary writes; replica replays the log a beat later — measure the gap:
python3 - <<'EOF'
import json, time, os
# primary: commit now
open("toy.wal", "a").write(json.dumps({"op":"set","key":"lag-test","value":time.time()})+"\n")
# replica: replays only when its copy of the log arrives (simulate 0.2s of network)
time.sleep(0.2)
data = {}
for line in open("toy.wal"): data[json.loads(line)["key"]] = json.loads(line)["value"]
age = time.time() - data["lag-test"]
print(f"replica is serving data that is {age:.2f}s old — multiply by real-world seconds")
EOF
```

**2. The stale-read incident, in miniature** — write to the primary, read from the
replica *immediately*: not there yet. Every "why doesn't my app see my own update?!"
support ticket in history is this demo with production credentials.

**3. CAP at home**: block the "network" (rename the WAL the replica reads from), keep
writing on the primary — now the replica is unavailable (consistent) or serving old data
(available). You *chose*, just now. That choice is the entire theorem.

## The build: a primary/replica pair with lag accounting

```python
# replicate.py — ship the WAL, replay it, and account for staleness (Chapter 4, networked)
import json, os, shutil, time

PRIMARY_LOG = "toy.wal"
REPLICA_DIR = "replica"

class Replica:
    def __init__(self):
        os.makedirs(REPLICA_DIR, exist_ok=True)
        self.applied = 0                              # how many log lines we've replayed
        self.data = {}

    def sync(self, log_path=PRIMARY_LOG):             # "fetch the WAL, replay my copy"
        shutil.copy(log_path, f"{REPLICA_DIR}/toy.wal")
        lines = open(f"{REPLICA_DIR}/toy.wal").read().splitlines()
        for line in lines[self.applied:]:             # replay only the NEW tail (Ch 4!)
            e = json.loads(line)
            if e["op"] == "set": self.data[e["key"]] = e["value"]
        self.applied = len(lines)
        return self.applied

# — the incident, staged —
open(PRIMARY_LOG, "w").close()
r = Replica()
open(PRIMARY_LOG, "a").write(json.dumps({"op":"set","key":"k","value":1})+"\n")
r.sync()
open(PRIMARY_LOG, "a").write(json.dumps({"op":"set","key":"k","value":2})+"\n")
print("primary says:", 2)
print("replica says:", r.data["k"], "   ← STALE: sync hasn't run yet")
r.sync()
print("replica after sync:", r.data["k"])
print(f"applied {r.applied} log records — replication IS log shipping")
```

The comment in `sync` — "replay only the NEW tail" — is literally how Postgres standbys
apply WAL. You have now built, in toy form: replication, staleness, and catch-up.

## What you now know

- **Replication = log shipping** (Ch 4 over the network); the lag is where consistency
  questions live.
- CAP is a **failure-moment choice** between refusing (consistent) and proceeding
  (available) — products just pre-write the answer.
- **Sharding** splits load but bills you for cross-shard queries, distributed commits,
  and resharding pain (consistent hashing exists to shrink the last one).
- Every concept here is a course you've already taken, wired together: WAL, TCP, versions,
  and pointers.

Next, the finale: everything — pages, B-tree, WAL, pool, planner, joins, MVCC — assembled
into one working toy RDBMS with INSERT, SELECT, and crash safety in ~500 lines.
