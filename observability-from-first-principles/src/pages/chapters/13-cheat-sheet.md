---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Observability on One Page'
description: 'Logs, metrics, traces and SLOs on one page — the model, the costs, the sampling rules, and the alerting discipline.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one sentence: **production is a system you cannot debug, so
you must measure it** — three data types, each answering a different question.
Logs answer "what happened", metrics answer "how much over time", traces answer
"where did the time go". The pillars, their costs, and the discipline that keeps
them from eating the backend.

## The one-page model

```text
  event → log line (structured!)          Ch 2   "what happened at 14:02:03"
  event → counter/gauge increment         Ch 3   "errors/min, since forever"
  request → span tree (parent, timing)    Ch 4   "checkout: db 40ms, pay 120ms"
  all three → correlated by trace_id      Ch 5   one ID stitches the story
```

Cardinality is the tax on metrics (Chapter 6), sampling the tax relief on
traces (Chapter 7), and alerting is where all three become judgment (Chapter 8).
The observable service (Chapter 12) runs all three on one checkout endpoint —
and `inject_incident` makes it fail on schedule so you can watch yourself detect it.

## The observability you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `log(level, msg, **fields)` | structured lines: fields queryable, not greppable prose | 2 |
| `Counter` | monotonically increasing: errors, requests, bytes | 3 |
| gauge / histogram | point-in-time value / distribution of durations | 3 |
| rate over window | the only way counters answer questions | 3 |
| `Span` context manager | one timed operation with attributes and a parent | 4 |
| trace = span tree | the request's journey across services | 4 |
| `trace_id` propagation | the stitch: log lines join spans join metrics | 5 |
| label cardinality | user_id as a label = one series per user = death | 6 |
| head vs tail sampling | keep interesting failures, drop boring success | 7 |
| page vs ticket | wakes a human vs files a task — different SLOs | 8 |
| SLO + error budget | reliability as a number with consequences | 9 |
| OpenTelemetry | one API, many backends — vendor-proof instrumentation | 10 |
| Prom/Grafana/Jaeger shapes | scrape+query, dashboards, span search | 11 |
| `inject_incident(n)` | rehearsed failure: slow db, 500s, cascades | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| `print`/string logs in production | unqueryable text at 10k lines/sec — the haystack grows | Chapter 2 |
| Counting without rate windows | "42,000 errors" answers nothing; errors/min does | Chapter 3 |
| A label per user | series explosion: the metric backend becomes the outage | Chapter 6 |
| Tracing everything at 100% | trace volume outweighs the app it watches | Chapter 7 |
| Alerting on CPU | machines are fine; users are not — alert on SLOs | Chapters 8–9 |
| Log lines without `trace_id` | three pillars that cannot talk to each other | Chapter 5 |
| Sampling away the failing requests | head sampling keeps the wrong 1% | Chapter 7 |
| Page-per-alert sprawl | on-call fatigue: real pages drowned in noise | Chapter 8 |
| Dashboards nobody opens | observability theater — pretty, unqueried | Chapters 9, 11 |
| Testing only the happy path | the first real failure is the first test | Chapter 12 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| "What just happened?" | structured logs with trace_id | it repeats hourly — then a metric + panel (Ch 2–3) |
| Trends and thresholds | counters + histograms, rate-windowed | you need per-request detail — then a trace (Ch 3–4) |
| "Where are the 300ms?" | the span tree, sorted by duration | the answer is in one log line — search it (Ch 4) |
| Fewer traces, same insight | tail-sample errors and slow tails | you need audit completeness — then log instead (Ch 7) |
| Wake someone | SLO burn alerts only | it can wait for morning — a ticket (Ch 8–9) |
| Prove it all works | `inject_incident` + detection drill | you enjoy production surprises (Ch 12) |

## Prove it to yourself

**1. Structured beats grepped:**

```python
log("info", "checkout", user="u1", total=42.0, trace_id=tid)  # fields, not prose
```

Query `fields.user == "u1"` in seconds; the same fact as prose is one
`grep` among ten thousand lookalikes.

**2. The counter needs a window:**

```python
c = Counter("http_500s")
for _ in range(50): c.inc()
print(c.rate(window=60))       # 50/min — meaningful; c.value() alone never was
```

**3. The span tree explains the p99:**

```python
with Span("checkout") as s:
    with Span("db_query") as q: db_query("SELECT ...", slow_ms=120)
    with Span("payment"): pass
print(s.duration_ms, q.duration_ms)   # ~121, ~120 — the child ate the parent
```

## What you now know

- **Three data types, three questions:** logs (what), metrics (how much),
  traces (where) — reach for the question first, the tool second.
- **Costs are part of the design:** cardinality budgets (Ch 6) and sampling
  rules (Ch 7) decide whether observability outlives launch week.
- **Alerting is ethics:** a page is a promise that a human's sleep buys
  something — SLO burn, not CPU (Ch 8–9).
- The observable service (Ch 12) is the rehearsal space — incidents are
  choreographed before they are suffered.

Next: twelve labs that rehearse disaster — inject failures, hunt them through
all three pillars, and page yourself once for practice.
