---
layout: ../../layouts/Chapter.astro
title: 'Logs: Events with Context'
description: 'Levels, correlation ids, structured fields — logs as events, not strings. Build: a JSON-lines logger with correlation ids.'
part: 'Part I — The Three Pillars'
written: true
---

Chapter 1's logger emitted JSON lines — the base. This chapter adds the two
features that make logs *usable during incidents*: **correlation ids** (every line
from one request shares an id, so a hundred services' logs reassemble into one
story) and **level discipline** (debug/info/warn/error with rules for each — so
production isn't drowned in noise).

## The lie you were told

> "Logs are for debugging."

Logs are **the audit trail of the business** — payments, signups, permission
changes. They're queried months later for compliance, incidents, and analytics.
The structured format (Ch 1) is what makes them queryable at that timescale.

## Correlation ids: reassembling the story

One user request crosses five services. Each logs its own lines — and without a
shared id, the story is fragments in five log files. The **correlation id**:
generated at the edge (the first service), propagated through every hop (headers),
emitted in every log line:

```text
gateway:    {"trace": "abc123", "msg": "request received"}
auth:       {"trace": "abc123", "msg": "token valid"}
checkout:   {"trace": "abc123", "msg": "payment processed", "amount": 50}
grep trace=abc123 across ALL services → the request's complete story.
```

## Level discipline: the rules

```text
ERROR:  the operation failed and HUMAN ATTENTION is needed      → page (Ch 8)
WARN:   degraded but auto-recovered (retries succeeded)          → ticket
INFO:   business events (payment, signup, login)                 → the audit trail
DEBUG:  the developer's narration                                → OFF in production
```

The rules that keep production sane: ERROR means "someone should look" — if you
page on every ERROR, alerts drown (Chapter 8's alert fatigue); DEBUG must be off
in production (or sampled) — it's a diagnostic firehose.

## Prove it to yourself

**1. The correlation id, reassembling the story:**

```python
# three services' logs, interleaved by time — chaos:
# gateway: request in / auth: token ok / checkout: paid / gateway: done
# with trace ids: grep trace=abc123 → 4 lines, in order, one story.
import json
logs = [
    {"svc": "gateway", "trace": "abc123", "msg": "request received"},
    {"svc": "checkout", "trace": "def456", "msg": "other user's payment"},
    {"svc": "auth", "trace": "abc123", "msg": "token valid"},
    {"svc": "checkout", "trace": "abc123", "msg": "payment processed"},
]
story = [l for l in logs if l["trace"] == "abc123"]
for l in story: print(l["svc"], "→", l["msg"])
# gateway → auth → checkout: the request's journey, reassembled from 3 services.
```

## The build: the correlated logger

```python
# slog2.py — correlation ids + level discipline (~30 lines)
import json, time, contextvars

request_id = contextvars.ContextVar("request_id")       # per-request context (Ch 7
                                                        # of the concurrency course)
class Logger:
    def __init__(self, level="info"):
        self.min = {"debug": 10, "info": 20, "warn": 30, "error": 40}[level]
    def log(self, level, msg, **fields):
        if {"debug": 10, "info": 20, "warn": 30, "error": 40}[level] < self.min:
            return
        event = {"ts": round(time.time(), 3), "level": level, "msg": msg,
                 "trace": request_id.get("-"), **fields}
        print(json.dumps(event, separators=(",", ":")))

log = Logger("info")

def handle_request(path, user):
    request_id.set(secrets.token_hex(8))                # generated at the edge (Ch 3)
    log.log("info", "request received", path=path)
    log.log("info", "user authenticated", user=user)
    log.log("debug", "cache lookup", key=f"user:{user}")   # filtered: debug < info
    log.log("info", "request complete", status=200)

import secrets
handle_request("/checkout", 42)
# {"ts":...,"level":"info","msg":"request received","trace":"a1b2c3d4","path":"/checkout"}
# {"ts":...,"level":"info","msg":"user authenticated","trace":"a1b2c3d4","user":42}
# {"ts":...,"level":"info","msg":"request complete","trace":"a1b2c3d4","status":200}
# (the debug line: absent — filtered by level)
```

## What you now know

- **Correlation ids** reassemble multi-service stories — generated at the edge,
  propagated through headers, emitted in every line.
- **Level discipline** is a production resource decision: ERROR pages, DEBUG
  filtered — both rules enforced by the logger's threshold.
- Structured logs are the **audit trail** — queried months later, so the format
  decisions (fields, ids) have months-scale consequences.

Next: pillar two — metrics. Numbers aggregated over time: counters, gauges,
histograms, and the registry that serves them.
