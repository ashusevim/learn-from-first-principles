---
layout: ../../layouts/Chapter.astro
title: 'Sampling: You Can’t Keep Everything'
description: 'Head sampling, tail sampling — keep the interesting, drop the rest. Build: both strategies on a trace stream.'
part: 'Part III — Serving It'
written: true
---

Traces (Chapter 4) are the most expensive pillar — full detail per request. At
scale you can't keep them all: **sampling** decides which to keep. Two strategies:
**head sampling** (decide at the trace's start — cheap, but you might drop the
interesting one) and **tail sampling** (decide after completion — keep all errors
and slow traces, sample the boring ones). This chapter builds both and shows the
trade.

## The lie you were told

> "Sample randomly to reduce load."

Random head sampling reduces load uniformly — and drops exactly the slow,
error-filled traces you'll want during an incident. The strategies differ in when
they decide and what they value:

```text
HEAD sampling:  decide at trace start (probability p)   — cheap, uniform, blind
TAIL sampling:  decide at trace end                     — keep all errors/slow,
                                                          sample the healthy
                                                          (needs buffering: cost)
```

The production pattern: head-sample aggressively (1-10%), **but always keep
errors** — the tail decision applied to the errors' parents (trace-aware tail
sampling: if any span errored, keep the whole trace).

## Prove it to yourself

**1. The blind spot, demonstrated:**

```python
# head sampling at 10%: 100 traces, 5 contain errors.
# kept: ~10 traces, of which ~0.5 contain errors → the incident's traces are GONE
# tail sampling: all 5 error traces kept + a sample of healthy ones. The incident is debuggable.
```

**2. The cost, compared:**

```python
# head: no buffering, immediate decision — O(1) per trace
# tail: buffer the whole trace until completion — memory + latency per trace
# the trade is storage/compute vs completeness — Chapter 7 of the databases
# course's sampling-for-sketches, same trade.
```

## The build: both sampling strategies

```python
# sampling.py — head vs tail sampling on a trace stream (~30 lines)
import random
random.seed(42)

traces = []
for i in range(200):
    traces.append({"id": f"trace{i}", "error": i % 40 == 0,      # 5% error traces
                   "duration_ms": 2000 if i % 40 == 0 else 50})  # errors are slow too

def head_sample(traces, p=0.1):
    return [t for t in traces if random.random() < p]    # decide at the START

def tail_sample(traces, keep_error=True, p_healthy=0.1):
    kept = []
    for t in traces:                                     # decide at the END
        if t["error"] and keep_error: kept.append(t)     # errors: always keep
        elif random.random() < p_healthy: kept.append(t) # healthy: sample
    return kept

for name, kept in [("head 10%", head_sample(traces)),
                   ("tail (keep errors)", tail_sample(traces))]:
    errors_kept = sum(1 for t in kept if t["error"])
    print(f"{name:20s}: kept {len(kept):3d}/{len(traces)} traces, "
          f"{errors_kept} error traces retained")
# head 10%            : kept  21/200 traces, 1 error traces retained    ← blind
# tail (keep errors)  : kept  26/200 traces, 5 error traces retained    ← all errors!
```

## What you now know

- **Head sampling** decides blind at the start — cheap, uniform, drops incidents.
- **Tail sampling** buffers until completion, keeps all errors and slow traces,
  samples the healthy — completeness at the cost of buffering.
- The production pattern: head-sample the bulk, **always keep errors**, and let
  the tail decision use the trace's own facts.
- The cost is real buffering — the same "decide when you know more" trade as the
  compilers course's two-pass assembler.

Next: metrics collected, traces sampled — when does someone get *paged*? Alerts,
and the fatigue that kills on-call rotations.
