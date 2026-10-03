---
layout: ../../layouts/Chapter.astro
title: 'Traces: The Request’s Journey'
description: 'Spans, parent-child, timing per stage. Build: a trace model that shows where a request’s milliseconds went.'
part: 'Part II — Traces & Costs'
written: true
---

Metrics show p99 spiked; logs show one failed request. The trace shows **where
inside the request the time went** — as a tree of spans, each a timed operation
with a parent: gateway 5ms → auth 2ms → database 40ms → render 3ms. The database
span *is* the answer. This chapter builds the trace model: spans, parent-child
linking, and the waterfall that makes the slow stage jump out.

## The lie you were told

> "Tracing is for microservices."

A trace answers a question even a monolith has: *within this one request, which
stage ate the time?* The span tree works for one process — and becomes
*distributed* when spans cross service boundaries with propagated ids (Chapter 2's
correlation ids, formalized).

## The span tree

```text
trace abc123 (total 50ms)
├── gateway span (5ms)            parent: none
│   └── auth span (2ms)           parent: gateway
├── db.query span (40ms)          parent: gateway   ← THE ANSWER
│   └── db.query.retry (35ms)     parent: db.query  ← the retry ate the time!
└── render span (3ms)             parent: gateway
```

Each **span**: a name, a start, a duration, a parent, and attributes (the SQL, the
user). The waterfall renders spans as horizontal bars on a time axis — the slow
span is the long bar, visually undeniable.

## Prove it to yourself

**1. The waterfall, rendered in ASCII:**

```python
spans = [("gateway", 0, 5), ("auth", 5, 2), ("db.query", 7, 40), ("render", 47, 3)]
for name, start, dur in spans:
    print(f"{name:10s} {' ' * start}{'█' * dur} {dur}ms")
# gateway   █████ 5ms
# auth        ██ 2ms
# db.query      ████████████████████████████████████████ 40ms   ← jumps out
# render                                             ███ 3ms
```

The 40ms database span is visually undeniable — no stack of logs communicates
this faster. That's the trace's value: *time made visible*.

## The build: the trace model

```python
# trace.py — spans, parent-child, the waterfall (~35 lines)
import time, secrets

class Trace:
    def __init__(self):
        self.id = secrets.token_hex(8)
        self.spans = []                    # {name, span_id, parent_id, start, dur, attrs}

    def span(self, name, parent_id=None, **attrs):
        return SpanHandle(self, name, parent_id, attrs)

class SpanHandle:
    def __init__(self, trace, name, parent_id, attrs):
        self.trace, self.name = trace, name
        self.span_id = secrets.token_hex(4)
        self.parent_id = parent_id
        self.attrs = attrs
        self.start = time.perf_counter()
        trace.spans.append(self)           # register: finished spans get durations
    def __enter__(self): return self
    def __exit__(self, *a):                # on exit: record the duration
        self.duration = (time.perf_counter() - self.start) * 1000

def waterfall(trace):
    total = max(s.duration for s in trace.spans)
    for s in sorted(trace.spans, key=lambda s: s.start):
        offset = int((s.start - trace.spans[0].start) / total * 50)
        bar = "█" * max(1, int(s.duration / total * 50))
        print(f"  {s.name:12s} {' ' * offset}{bar} {s.duration:.1f}ms")

# ── a request, traced ──
trace = Trace()
with trace.span("gateway") as gw:
    with trace.span("auth", parent_id=gw.span_id):
        pass                               # auth: fast
    with trace.span("db.query", parent_id=gw.span_id) as db:
        time.sleep(0.04)                   # the slow database call
        with trace.span("db.query.retry", parent_id=db.span_id):
            time.sleep(0.03)               # the retry INSIDE the db call
    with trace.span("render", parent_id=gw.span_id):
        pass

waterfall(trace)
# the db.query bar dominates — with the retry nested inside it, visible.
```

## What you now know

- A trace = **a tree of timed spans** — each with a parent, duration, and
  attributes; the waterfall renders time as bars.
- The slow stage is **visually undeniable** — the long bar makes the diagnosis
  before any reading.
- Span trees nest: the retry *inside* the db call is visible as a child span —
  structure, not just timing.

Next: all three pillars on one code path, correlated — the instrumentation that
makes a service observable.
