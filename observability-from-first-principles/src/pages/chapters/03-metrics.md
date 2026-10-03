---
layout: ../../layouts/Chapter.astro
title: 'Metrics: Numbers Over Time'
description: 'Counters, gauges, histograms — the three metric types. Build: a metrics registry and read a real histogram.'
part: 'Part I — The Three Pillars'
written: true
---

Logs answer "what happened to THIS request"; metrics answer "how is the SYSTEM
doing over time" — as numbers aggregated into buckets, cheap to store, fast to
chart. There are exactly **three metric types**, and every monitoring system
(Prometheus, StatsD, CloudWatch) is built on them:

```text
COUNTER:    only goes UP (requests served, errors)     — rate is what you chart
GAUGE:      goes up and down (memory used, connections) — the value is what you chart
HISTOGRAM:  a distribution of values (latency)          — percentiles are what you chart
```

This chapter builds all three and reads a real latency histogram — p50, p95, p99 —
the numbers every service review starts with.

## The lie you were told

> "Metrics are just numbers you store."

The aggregation is the design. A **counter** only increments — you chart the
*rate* (per second), not the value. A **histogram** doesn't store every latency —
it stores *counts per bucket* (0-10ms: 400, 10-50ms: 90...), so percentiles are
computed from bucket counts. The bucket boundaries ARE the resolution — a design
decision with Chapter 6's cardinality consequences.

## Percentiles from buckets

```text
latency buckets: [0-10ms: 400, 10-50ms: 90, 50-100ms: 9, 100ms+: 1]
total: 500 requests
p50: the 250th slowest → in the 10-50ms bucket   ← half the requests were faster
p99: the 495th → in the 100ms+ bucket            ← the slowest 1% live here
```

The p99 matters because the slowest 1% are often your *most valuable users* (the
ones doing the biggest operations) — averages hide them, percentiles expose them.

## Prove it to yourself

**1. The average lies, the percentile doesn't:**

```python
import statistics
latencies = [10] * 99 + [2000]          # 99 fast requests, 1 stuck at 2 seconds
print(f"mean: {statistics.mean(latencies):.1f} ms")           # 29.9 ms — looks fine!
print(f"p99:  {sorted(latencies)[98]:.0f} ms")                # 2000 ms — the truth
# the mean hid the stuck request entirely. Percentiles are how users experience you.
```

## The build: the metrics registry

```python
# metrics.py — counters, gauges, histograms (~35 lines)
import time, math

class Metrics:
    def __init__(self):
        self.counters, self.gauges = {}, {}
        self.histograms = {}                   # name -> list of observed values
    def inc(self, name, by=1):                 # counter: only up
        self.counters[name] = self.counters.get(name, 0) + by
    def gauge(self, name, value):              # gauge: set to the current value
        self.gauges[name] = value
    def observe(self, name, value):            # histogram: record a value
        self.histograms.setdefault(name, []).append(value)
    def percentile(self, name, p):             # p50/p95/p99 from the observations
        values = sorted(self.histograms.get(name, []))
        if not values: return None
        rank = max(0, math.ceil(p / 100 * len(values)) - 1)
        return values[rank]

m = Metrics()
# simulate 500 requests: 99% fast, 1% slow
for i in range(500):
    latency = 10 + (i % 5) if i % 100 else 2000
    m.inc("requests_total")
    if i % 100 == 0: m.inc("errors_total")
    m.observe("request_latency_ms", latency)
m.gauge("memory_used_mb", 412)

print("requests:", m.counters["requests_total"], "| errors:", m.counters["errors_total"])
print("memory gauge:", m.gauges["memory_used_mb"], "MB")
print(f"p50: {m.percentile('request_latency_ms', 50)}ms  "
      f"p95: {m.percentile('request_latency_ms', 95)}ms  "
      f"p99: {m.percentile('request_latency_ms', 99)}ms")
# requests: 500 | errors: 5
# memory gauge: 412 MB
# p50: 10ms  p95: 14ms  p99: 2000ms   ← the p99 exposes what the p50 hides
```

## What you now know

- Three metric types: **counters** (rate), **gauges** (value), **histograms**
  (distributions) — every monitoring system is built on them.
- **Percentiles over averages** — the mean hides the stuck 1%; p99 exposes them.
- Bucket boundaries ARE the resolution — choose them around your SLOs (Chapter 9).

Next: pillar three — the trace. Where inside one request did the milliseconds go?
