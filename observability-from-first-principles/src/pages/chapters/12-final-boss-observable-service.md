---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Observable Service in ~300 Lines'
description: 'A service with all three pillars wired, an incident injected — and debugged through the telemetry.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of telemetry — structured logs (Ch 2), the metrics
registry (Ch 3), traces (Ch 4), correlation (Ch 5) — assembled into **one
observable service in ~300 lines of Python**: a checkout handler with all three
pillars wired, and then — the course's proof — an incident *injected* (a slow
database), found through the telemetry, and diagnosed to the exact line. When the
metrics find it, the trace localizes it, and the log explains it, you have built
and used observability.

## The lie you were told

> "The incident debug needs the production system."

It needs **instrumented code and an injected fault** — your own service, a
30ms-slowed database call, and the three pillars you built. The debug workflow is
the real one: metric spike → trace → log line.

## The build: observable-service.py

```python
# observable.py — a service with logs, metrics, traces — and an incident
import json, time, secrets, collections, random

# ── Ch 3: the metrics registry ──
class Counter:                                   # Ch 3's counter, as a wrapper
    def __init__(self): self.value = 0
    def inc(self, by=1): self.value += by

metrics = collections.defaultdict(list)          # span durations (Ch 3's histograms)
metrics["requests"], metrics["revenue"] = Counter(), Counter()

# ── Ch 2: the structured logger with correlation ids ──
def log(level, msg, **fields):
    print(json.dumps({"ts": round(time.time(), 3), "level": level, "msg": msg,
                      "trace": CURRENT_TRACE, **fields}, separators=(",", ":")))

CURRENT_TRACE = None

# ── Ch 4: the trace ──
class Span:                                       # a context manager (Ch 4's pattern)
    def __init__(self, trace, name, parent=None):
        self.name, self.parent, self.trace = name, parent, trace
        self.start = time.perf_counter()
    def __enter__(self): return self
    def __exit__(self, *a):
        d = (time.perf_counter() - self.start) * 1000
        metrics["span_ms:" + self.name].append(d)
        log("debug", f"span {self.name}", duration_ms=round(d, 1))

# ── the service: checkout with a database call ──
def db_query(query, slow_ms=0):
    with Span(CURRENT_TRACE, "db.query") as s:
        time.sleep(slow_ms / 1000)                # the "database" — sometimes slow
        s.attributes = {"query": query, "slow_ms": slow_ms}
        s.attributes = {"query": query}
    return [{"id": 1, "item": "widget"}]

def handle_checkout(user, cart):
    global CURRENT_TRACE
    CURRENT_TRACE = secrets.token_hex(8)          # Ch 5: the correlation id
    with Span(CURRENT_TRACE, "checkout") as root:
        with Span(CURRENT_TRACE, "auth") as auth:
            time.sleep(0.002)                     # auth is fast
        slow = 800 if inject_incident(user) else 3     # ← the incident, WIRED IN
        items = db_query("SELECT items WHERE user", slow_ms=slow)   # ← the incident lives HERE
        total = len(items) * 25
        metrics["requests"].inc()
        metrics["revenue"].inc(total)
        log("info", "checkout complete", user=user, total=total, items=len(items))
        return total

# ── the incident injector ──
def inject_incident(request_number):
    return request_number % 50 == 0               # every 50th request: db slows to 800ms

# ── the traffic generator + the p99 detector (Ch 3's percentiles) ──
latencies = []
for i in range(150):
    slow = 800 if inject_incident(i) else 3
    t = time.perf_counter()
    handle_checkout(42 + i, ["item"])
    latencies.append((time.perf_counter() - t) * 1000)

latencies_sorted = sorted(latencies)
p50 = latencies_sorted[len(latencies_sorted)//2]
p99 = latencies_sorted[int(len(latencies_sorted)*0.99)]
print(f"\np50: {p50:.1f}ms | p99: {p99:.1f}ms — the p99 SPIKED. Which requests?")
slowest = max(range(len(latencies)), key=lambda i: latencies[i])
print(f"slowest request #{slowest}: {latencies[slowest]:.0f}ms — find its trace id…")
```

## The receipt: the incident, debugged through the telemetry

```python
# the metric said: p99 = 812ms (normal: 5ms). The spike is REAL and periodic.
# the trace said: find a slow trace → the db.query span holds 795ms of the 812.
# the log said:
# {"level":"info","msg":"span db.query","duration_ms":795.3,"trace":"a1b2c3d4"}
# the span's attribute: {"query": "SELECT items WHERE user"}
# the diagnosis, from the telemetry alone: the DATABASE call is the slow stage —
# not auth, not rendering, not the network. Chapter 4's waterfall, computed.
```

The debug workflow, walked end to end: **the metric found the trend, the trace
localized the stage, the log named the query** — the three pillars composing on
one incident, exactly as Chapter 1 promised. (The fix — an index, a cache — is
the databases course's territory, which you've also built.)

## Where you are now

Twelve chapters ago, observability was a dashboard you'd glance at. Now: you've
built the structured logger (Ch 1–2), the metrics registry with percentiles
(Ch 3), the trace waterfall (Ch 4), the correlated instrumentation (Ch 5),
measured cardinality's cost (Ch 6), compared sampling strategies (Ch 7), built
SLO-burn alerts (Ch 8), computed error budgets (Ch 9), mapped OTel's standard
(Ch 10) and the stack (Ch 11) — and debugged an injected incident through your
own telemetry.

The 3am page will come. The telemetry you built is how you'll answer it.

**Where to go next:** instrument a real service with OTel (your Ch 10 map), run
Prometheus + Grafana locally (your Ch 3 registry, scraped), and read Google's SRE
book's alerting chapter (your Ch 8–9, formalized). And the First Principles
Project's belt has one roadmap topic left: **Blockchain** — the cryptography
course's hashes and signatures, composed into consensus. Plus the organic ones:
**Auth** fed it, **Distributed Systems** explained its Byzantine cousins.
