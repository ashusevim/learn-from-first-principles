---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the observable service from Chapter 12 — logs, metrics, traces, SLOs. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in output you produced and can explain —
structured lines, rate numbers, a span tree, a fired (or correctly *unfired*)
alert — using the Chapter 12 service (`log`, `Counter`, `Span`, `db_query`,
`handle_checkout`, `inject_incident`). Nothing here is new: the pillars
(Ch 2–4), stitching (Ch 5), costs (Ch 6–7), discipline (Ch 8–9). What is new is
*rehearsal*: incidents on demand, detection on purpose.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Run the service in one shell, load in another (`for i in
$(seq 200); do curl ...; done`), and keep the incident switch (`inject_incident`)
within reach.

| Tool | What it proves |
|---|---|
| `log(level, msg, **fields)` | structured events, queryable |
| `Counter.rate(window)` | trends, not totals |
| `Span` nesting + `trace_id` | where the milliseconds live |
| `inject_incident(n)` | failure on schedule — the rehearsal |

## Warm-ups

**Lab 1.1 — Log like you mean it**
**Goal:** structured fields survive where prose drowns.
**Do this:** generate 200 requests, then query the log store for
`level == "error"` and `duration_ms > 100` as *fields*:

```python
errs  = query_logs(level="error")
slow  = query_logs(duration_ms__gt=100)
print(len(errs), len(slow))            # precise, instant, boring — as designed
```

**You'll know it works when:** both queries return instantly and precisely —
the same two questions asked of string logs would be two greps and a guess.
**Where it comes from:** Chapter 2 — Logs: Events with Context.

**Lab 1.2 — Rate, not total**
**Goal:** counters answer only through windows (Chapter 3).
**Do this:** capture `Counter("requests").value()` and `.rate(60)` twice, 30
seconds apart, under steady load:

```python
print(c.value(), c.rate(60))    # 14:02 — total climbs, rate holds ~steady
print(c.value(), c.rate(60))    # 14:03 — total meaningless, rate still the signal
```

**You'll know it works when:** the totals differ meaninglessly while the rates
read ~equal — the trend was always the signal; the total never meant anything.
**Where it comes from:** Chapter 3 — Metrics: Numbers Over Time.

**Lab 1.3 — Find the slow span**
**Goal:** the trace tree localizes latency without guessing.
**Do this:** `inject_incident(1)` (slow db), send 20 requests, open one trace,
and print span durations sorted:

```python
tr = traces[-1]                          # one failing request's tree
for span in sorted(tr.spans, key=lambda s: -s.duration_ms):
    print(f"{span.name:12} {span.duration_ms:6.1f}ms")   # db_query at the top
```

**You'll know it works when:** `db_query` dominates its parent `checkout` span
— one look, one culprit, zero bisection. That is what Chapter 4 bought you.
**Where it comes from:** Chapter 4 — Traces: The Request's Journey.

## Builds

**Lab 2.1 — One ID stitches everything**
**Goal:** correlation is the product (Chapter 5): log → trace → metric.
**Do this:** take one failing request's `trace_id` and follow it: find its log
lines, its span tree, and the error-rate metric bump at its timestamp.
**You'll know it works when:** all three artifacts line up in under a minute —
same ID, same story, three views. Without the ID this is three investigations.
**Where it comes from:** Chapter 5 — Instrumentation: Wiring the Pillars In.

**Lab 2.2 — Kill a label**
**Goal:** cardinality as a self-inflicted outage (Chapter 6).
**Do this:** temporarily tag `http_requests` by `user_id`, run 200 requests as
200 users, and watch series count (or memory) climb.
**You'll know it works when:** series explode with unique users and query time
climbs — then re-tag by `route` and watch it collapse to a handful. The label
is a budget line; spend it wisely.
**Where it comes from:** Chapter 6 — Cardinality: The Metric That Kills Your Backend.

**Lab 2.3 — Sample the tails, keep the truth**
**Goal:** head vs tail sampling as a correctness decision (Chapter 7).
**Do this:** at 100%→10% head sampling, check whether any *failing* request
kept its trace; then switch to tail sampling that keeps all errors.
**You'll know it works when:** head sampling silently drops most failure traces
(it can't know better yet) while tail sampling keeps every error — the 90%
savings with 100% of the evidence you actually need.
**Where it comes from:** Chapter 7 — Sampling: You Can't Keep Everything.

**Lab 2.4 — Page only when it burns**
**Goal:** SLO math deciding who loses sleep (Chapters 8–9).
**Do this:** set a 99% availability SLO over a 1-hour window, `inject_incident(2)`
(500s) at 2% error for 5 minutes, and watch the budget; then alert on CPU *and*
on burn rate and compare.
**You'll know it works when:** the burn alert fires once, while the CPU alert
fires on noise all night — one deserves a page, one deserves deletion. That
judgment call is the entire chapter.
**Where it comes from:** Chapter 9 — SLOs & Error Budgets.

**Lab 2.5 — The drill**
**Goal:** detection as a rehearsed skill, not an aspiration (Chapter 12).
**Do this:** with the dashboard closed, have a teammate (or a timer script)
`inject_incident(3)`; from alert to root-cause in one documented path.
**You'll know it works when:** you reach the culprit span via metrics → trace →
logs inside 10 minutes, writing each step down. The write-up is the deliverable;
the drill is the point.
**Where it comes from:** Chapter 12 — Final Boss: The Observable Service in ~300 Lines.

## Stretch goals

**Lab 3.1 — Vendor-proof the instrumentation**
**Goal:** OpenTelemetry's promise (Chapter 10): one API, swappable backend.
**Do this:** wrap your service's emit points behind an interface, then swap the
"backend" from files to a JSON endpoint without touching call sites.
**You'll know it works when:** zero call-site changes, all data flowing — the
instrumentation outlived its first vendor decision.
**Where it comes from:** Chapter 10 — OpenTelemetry: The Standard.

**Lab 3.2 — Write the postmortem from the data**
**Goal:** pillars as evidence chain, end to end.
**Do this:** using only Lab 2.5's artifacts (no memory), write the incident
timeline: when, what degraded, why, and the fix.
**You'll know it works when:** every line cites an artifact (a log line, a
metric panel, a span) — no "I think". Observability that cannot reconstruct an
incident was decoration.
**Where it comes from:** Chapters 4–5, 8–9.

## Self-checking without a grader

- **Query labs** (1.1, 1.2, 2.1): fields matched, rates computed, artifacts
  correlated — each answer arrives in seconds or the instrumentation failed.
- **Cost labs** (2.2, 2.3): series counts and kept-trace counts. Budgets are
  numbers; "seems fine" is not one.
- **Judgment labs** (2.4, 2.5, 3.2): the fired-vs-unfired alert and the cited
  timeline. Write the sentence a teammate could act on.

## What you now know

- **Detection is a drill** (Lab 2.5): the first time you practice should not be
  the first time it matters.
- **Costs are designed, not discovered** (Labs 2.2–2.3): label budgets and
  sampling rules are decisions you made — revisit them deliberately.
- **Alerts are promises** (Lab 2.4): burn-rate pages only; everything else is a
  ticket or a dashboard.
- The three pillars are one story told three ways — the `trace_id` is the plot.

Next: take one real alert from your work queue and trace its evidence chain —
log line, metric, span — and if any link is missing, you have found your next
instrumentation ticket.
