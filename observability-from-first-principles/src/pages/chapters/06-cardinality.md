---
layout: ../../layouts/Chapter.astro
title: 'Cardinality: The Metric That Kills Your Backend'
description: 'A label per user id = millions of time series. Build: cardinality growth, measured.'
part: 'Part II — Traces & Costs'
written: true
---

Metrics (Chapter 3) are cheap because they're *aggregated*: 500 requests become 4
histogram buckets. The aggregation works only if the label combinations are
bounded — and the classic production outage is a metric with an **unbounded
label**: `requests_total{user_id=...}` — one time series per user, and with a
million users, the metrics backend drowns. This chapter measures cardinality
growth and derives the label discipline.

## The lie you were told

> "Labels are free — add as many as help."

Every label combination is a separate time series, stored forever:

```text
requests_total{status=200}                → 1 series per status code       fine: ~5
requests_total{path="/checkout"}          → 1 series per route            fine: ~50
requests_total{user_id=42}                → 1 series PER USER             death: millions
requests_total{email=...}                 → worse: users change emails    millions+
```

The bounded/unbounded distinction: `status` has ~5 values forever; `user_id` has
one per user and grows without bound. **Unbounded labels are the metric-system
killer** — Prometheus's memory fills, queries slow, the monitoring that protects
you becomes the outage.

## The discipline: bounded labels, unbounded data goes elsewhere

```text
bounded labels (metrics):    status, method, route template, error class
unbounded data (logs/trace): user_id, email, request ids  ← searchable in LOGS,
                                                              not aggregated in METRICS
```

The rule: metrics aggregate *shapes* of traffic; logs and traces carry the
*individual instances*. The user id belongs in the log line (Chapter 2) and the
trace span (Chapter 4) — never in a metric label.

## Prove it to yourself

**1. The growth, measured:**

```python
# one hour of traffic, two labeling strategies:
import itertools
users = 50_000; routes = 40; statuses = 5
bounded_series = routes * statuses                      # route × status
unbounded_series = users * statuses                     # user × status
print(f"bounded: {bounded_series:,} series")
print(f"unbounded: {unbounded_series:,} series — {unbounded_series // bounded_series}× more")
# bounded: 200 series
# unbounded: 250,000 series — 1250× more, and it grows with EVERY new user.
```

**2. The query cost, felt:**

```python
# a Prometheus query scans matching series: 200 series = instant.
# 250,000 series = the query itself takes seconds, and every scrape cycle
# stores 250k new values per interval. The backend drowns in bookkeeping.
```

## The build: the cardinality meter

```python
# cardinality.py — measure the series explosion before it measures you
def count_series(label_values: dict):
    """label_values: {label_name: [possible values]} → total distinct series"""
    total = 1
    for values in label_values.values():
        total *= max(len(values), 1)
    return total

scenarios = {
    "healthy":    {"status": ["200", "404", "500"], "method": ["GET", "POST"], "route": [f"/r{i}" for i in range(20)]},
    "risky":      {"status": ["200", "404", "500"], "method": ["GET", "POST"], "route": [f"/r{i}" for i in range(200)]},
    "on fire":    {"status": ["200", "404", "500"], "method": ["GET", "POST"], "user_id": [f"u{i}" for i in range(50_000)]},
}
for name, labels in scenarios.items():
    print(f"{name:9s}: {count_series(labels):>10,} time series")
# healthy  :         200 time series
# risky    :       2,000 time series
# on fire  :     300,000 time series   ← one label choice, 1500× the storage
```

## What you now know

- Every label combination is a **separate stored time series** — unbounded labels
  (user ids, emails, request ids) kill metrics backends.
- The discipline: **bounded labels in metrics; unbounded identifiers in logs and
  traces** — each pillar carries what it's designed for.
- Cardinality is measurable *before* deployment: count the label combinations
  (the build does it in one function).

Next: you can't keep every trace — sampling, and the head/tail strategies that
keep the interesting ones.
