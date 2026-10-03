---
layout: ../../layouts/Chapter.astro
title: 'The Observability Stack: Prometheus, Grafana, Jaeger'
description: 'Pull vs push, time-series databases, and the UIs — every tool mapped to your systems.'
part: 'Part IV — The Real World'
written: true
---

The three pillars need homes: metrics storage and querying (Prometheus), dashboards
(Grafana), trace storage and search (Jaeger/Tempo). This chapter maps each tool to
the systems you built — and the one big architectural decision they embody:
**pull vs push**.

## The lie you were told

> "The observability stack is a zoo of products."

Three products, three pillars, each matching a system you built:

```text
Prometheus:  metrics — a TIME-SERIES DATABASE + a pull-based scraper + PromQL
             (your Ch 3 registry, exposed at /metrics, scraped every 15s)
Grafana:     dashboards — a visualization layer over Prometheus/traces/logs
Jaeger:      traces — storage + a query UI for span trees (your Ch 4 traces)
```

## Pull vs push: the architectural fork

```text
PULL (Prometheus):  the server SCRAPES your /metrics endpoint every 15s
                    + failed scrapes are themselves a signal (the target is down!)
                    + the target controls what it exposes
                    − scrapes can miss short-lived events; behind NATs, hard

PUSH (StatsD, OTel exporters):  the app SENDS metrics as they happen
                    + works behind NATs; catches short-lived events
                    − the backend can't tell "no data" from "app dead" — the
                      broken-monitor problem needs an external heartbeat
```

The time-series database underneath: your Chapter 3 registry's values, appended
with timestamps, queried by label selectors — the databases course's indexes and
compression, applied to `(name, labels, timestamp) → value` rows.

## Prove it to yourself

**1. The Prometheus exposition format, read:**

```text
# HELP requests_total total requests served
# TYPE requests_total counter
requests_total{path="/checkout",status="200"} 1234
requests_total{path="/checkout",status="500"} 3
# YOUR Chapter 3 counter registry, formatted as text — Prometheus scrapes this.
```

**2. The stack assembled:**

```text
your service /metrics ──scrape──► Prometheus ──query──► Grafana dashboard
your service OTLP spans ──push──► Jaeger ──query──► the trace waterfall
your service JSON logs ──ship──► Loki ──query──► log search
```

## What you now know

- **Prometheus** = the metrics pillar: pull-scraping, a time-series DB, PromQL —
  your Chapter 3 registry, exposed and scraped.
- **Grafana** = dashboards over all three pillars; **Jaeger** = trace storage and
  the waterfall UI (your Chapter 4 spans).
- **Pull vs push** is the architectural fork — each with its failure mode — and
  OTel (Chapter 10) is the standard that bridges to either.
- The stack's every query and dashboard is a consumer of data structures you built
  from scratch.

Next, the finale: the three pillars wired into one service, an incident injected —
and debugged through the telemetry you instrumented. The course's proof of work.
