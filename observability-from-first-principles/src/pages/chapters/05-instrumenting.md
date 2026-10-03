---
layout: ../../layouts/Chapter.astro
title: 'Instrumentation: Wiring the Pillars In'
description: 'Logs, metrics, and traces on one real handler — correlated by ids. Build: the three pillars on one code path.'
part: 'Part II — Traces & Costs'
written: true
---

The three pillars exist separately (Chapters 1–4); the engineering is **wiring them
into one code path, correlated**: every request gets a trace id, the trace times
its spans, the metrics count outcomes, the logs carry the details — all keyed by
the same ids. This chapter instruments one handler with all three pillars, and the
correlation ids make the outputs cross-referenceable.

## The lie you were told

> "Instrumentation clutters the code."

The instrumented handler is *cleaner* than the naked one: the cross-cutting
concerns (timing, logging, error capture) move into decorators and context
managers, leaving the business logic alone. The instrumentation isn't clutter —
it's the separation of concerns that makes the business logic readable.

## The correlation contract

```text
one request:
  trace_id:      generated at the edge, propagated everywhere (Ch 2's correlation)
  span ids:      per stage within the request
  log lines:     carry trace_id + span_id        ← logs JOIN the trace
  metrics:       carry the outcome labels        ← metrics aggregate the outcomes
the incident query: metric spike → find a slow trace by id → read its logs.
```

That query chain — metric → trace → log — is the standard incident workflow, and
it works only when the ids correlate across all three pillars.

## Prove it to yourself

**1. The query chain, walked:**

```python
# 1. the metric: p99 latency spiked to 2000ms at 14:03        → WHICH requests?
# 2. the trace:  find a trace with duration > 2000ms at 14:03  → db.query: 1950ms
# 3. the log:    trace_id=abc123, level=error → "connection refused: db-primary"
# three tools, one diagnosis — the ids stitched them together.
```

## The build: the instrumented handler

```python
# instrumented.py — one handler, three pillars, correlated (~45 lines)
import json, time, secrets, collections

metrics = collections.defaultdict(list)                 # Ch 3's histograms
request_id = None                                       # Ch 2's correlation id

def log(level, msg, **fields):
    print(json.dumps({"ts": round(time.time(), 3), "level": level,
                      "trace": request_id, "msg": msg, **fields},
                     separators=(",", ":")))

def instrument(path):
    """the decorator: trace span + metrics + logs around one handler"""
    def deco(fn):
        def wrapper(request):
            global request_id
            request_id = secrets.token_hex(8)           # the edge generates the id
            start = time.perf_counter()
            log("info", "request started", path=path)
            try:
                result = fn(request)                    # the business logic, alone
                metrics["requests_total"].append(path)
                status = 200
            except Exception as e:
                metrics["errors_total"].append(path)
                log("error", "handler failed", path=path, err=str(e))
                status = 500; result = {"error": str(e)}
            duration = (time.perf_counter() - start) * 1000
            metrics.setdefault(f"latency:{path}", []).append(duration)
            log("info", "request finished", path=path, status=status,
                duration_ms=round(duration, 1))
            return result, status
        return wrapper
    return deco

@instrument("/checkout")
def checkout(request):
    time.sleep(0.05)                                    # the "work"
    return {"order": 123}

for i in range(3):
    checkout({"user": 42 + i})

p99 = sorted(metrics["latency:/checkout"])[-1]
print(f"\npipeline: {len(metrics['requests_total'])} requests, "
      f"last latency {p99:.1f}ms, ids correlated across logs and metrics")
# the log lines carry the SAME trace ids as the metrics' outcomes — the contract.
```

## What you now know

- Instrumentation = **the three pillars wired into one code path, correlated by
  ids** — the incident query chain (metric → trace → log) depends on it.
- The decorator/context-manager pattern keeps the business logic clean —
  instrumentation as separation of concerns.
- The metrics' outcome labels, the logs' trace ids, and the spans' timing all
  cross-reference: three views of one truth.

Next: the cost of it all — cardinality, the metric that quietly kills your
backend.
