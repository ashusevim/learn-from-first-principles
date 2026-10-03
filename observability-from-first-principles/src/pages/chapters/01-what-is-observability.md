---
layout: ../../layouts/Chapter.astro
title: 'What Is Observability, Really?'
description: 'Three data types — logs, metrics, traces — answering three questions. Build: print to JSON lines, the structured logger born.'
part: 'Part I — The Three Pillars'
written: true
---

When a service breaks at 3am, three questions decide how fast you fix it: **what
happened** (logs), **how much and how often** (metrics), **where did the time and
the request go** (traces). Observability is the discipline of instrumenting your
code to answer all three — and this course builds all three data structures from
scratch, then debugs an incident through them.

## The lie you were told

> "Observability is a product you buy."

It's a **property of your instrumentation** — the data your code emits. The
products (Prometheus, Grafana, Datadog) are storage and visualization for data
your code must produce first. This course builds the data structures; the products
become their consumers.

## The three pillars, as data types

```text
LOGS:    discrete EVENTS with context      "user 42 paid $50 at 12:03"  — searchable
METRICS: NUMBERS aggregated over time      error rate: 0.4%, p99 latency: 340ms — chartable
TRACES:  the REQUEST's journey per stage   gateway 5ms → auth 2ms → db 40ms — followable
```

Each answers a different question, and real systems need all three: logs tell you
*what happened to this one request*; metrics tell you *the trend*; traces tell you
*where inside the request the time went*.

## The naive version's flaw

```python
# the print statement: unstructured, unqueryable, uncorrelated
print("payment failed for user")
# which user? which error? which request? at what time? what amount?
# a thousand of these in a log file: grep finds "failed" — and nothing else.
```

The fix isn't a product — it's **structure**: emit the event as data (JSON), with
fields, levels, and a correlation id. The products parse what you emit.

## Prove it to yourself

**1. grep vs structured query** — the same incident, both ways:

```python
# grep version: grep "failed" app.log → 50,000 lines, none of them yours
# structured:   {"level": "error", "user": 42, "amount": 50, "err": "card_declined"}
#               → filter: level=error AND user=42 — one line. The incident.
```

**2. The three pillars, on one incident** — a slow checkout: metrics show p99
spiked (the trend), the trace shows the DB call took 3s (the where), the log shows
the query and its parameters (the what). Each pillar alone is a guess; together
they're a diagnosis.

## The build: the structured logger

```python
# slog.py — print to JSON lines: the structured logger born (~20 lines)
import json, time

LEVELS = {"debug": 10, "info": 20, "warn": 30, "error": 40}

class Logger:
    def __init__(self, level="info", **defaults):
        self.min = LEVELS[level]
        self.defaults = defaults               # service name, host — shared context
    def log(self, level, message, **fields):
        if LEVELS[level] < self.min: return
        event = {"ts": round(time.time(), 3), "level": level,
                 "msg": message, **self.defaults, **fields}
        print(json.dumps(event, separators=(",", ":")))   # ONE LINE, parseable

log = Logger("info", service="checkout")
log.log("info", "payment received", user=42, amount=50)
log.log("error", "payment failed", user=43, amount=99, err="card_declined")
log.log("debug", "cache hit", key="user:42")   # filtered out: below "info"
# {"ts":1736...,"level":"info","msg":"payment received","service":"checkout","user":42,"amount":50}
# {"ts":1736...,"level":"error","msg":"payment failed",...,"err":"card_declined"}
```

Every line: timestamp, level, message, context — parseable by machines, readable
by humans. The debug line was *filtered by level*: production verbosity, controlled.

## What you now know

- Observability = **the data your code emits** — three types answering three
  questions; the products are consumers.
- The naive print is **unqueryable**; the structured event (JSON, levels, fields,
  correlation ids) is the fix.
- The three pillars **compose on one incident**: metrics find the trend, traces
  find the where, logs find the what.

Next: pillar one in full — structured logs with levels, correlation ids, and the
patterns that make them searchable.
