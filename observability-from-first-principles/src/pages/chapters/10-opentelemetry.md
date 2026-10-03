---
layout: ../../layouts/Chapter.astro
title: 'OpenTelemetry: The Standard'
description: 'OTel’s model — your builds, standardized: the SDK, the protocol, the semantic conventions.'
part: 'Part IV — The Real World'
written: true
---

Every construct in this course — the structured logger (Ch 2), the metrics
registry (Ch 3), the trace spans (Ch 4) — has been re-implemented by every vendor
with different APIs. **OpenTelemetry (OTel)** is the industry's answer: one
vendor-neutral standard for the three pillars' APIs, SDKs, and wire protocol. This
chapter maps your builds onto OTel's model — the concepts are yours; the names are
the standard's.

## The lie you were told

> "OpenTelemetry is a vendor."

OTel is the **specification and SDKs** — vendor-neutral instrumentation that can
export to any backend. The decoupling: your code uses the OTel API; a *config
change* swaps the exporter from Datadog to Grafana to Jaeger. The
instrumentation-and-export split is the whole design — your code never changes
vendors again.

## The model, mapped to your builds

| OTel concept | Your build | Chapter |
|---|---|---|
| **Span** | the timed operation with parent + attributes | Ch 4 |
| **Trace** | the span tree, joined by trace id | Ch 4 |
| **Meter / Counter / Histogram** | the metrics registry (Ch 3) | Ch 3 |
| **Log record** | the structured JSON event | Ch 2 |
| **Context propagation** | the correlation id in headers | Ch 2, Ch 5 |
| **Exporter** | where the data goes (OTLP protocol) | Ch 11 |
| **Semantic conventions** | the standard field names (http.method, db.system) | — |

The **semantic conventions** are the quiet revolution: standardized field names
(`http.method` not `method` or `verb`) so that queries work across every service
and vendor. Your Chapter 2 correlation id became `trace_id`; your spans carry
`span_id` and `parent_span_id` — the standard's names, matching the field names
every backend expects.

## Prove it to yourself

**1. The decoupling, demonstrated:**

```python
# your code (unchanged forever):
from opentelemetry import trace
tracer = trace.get_tracer("checkout")
with tracer.start_as_current_span("process_payment") as span:
    span.set_attribute("user.id", 42)
    process_payment()

# the EXPORTER is config — swap the backend without touching the code above:
# OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.company.com
```

**2. The three pillars, one SDK:** OTel's SDK covers traces (spans), metrics
(counters/histograms), and logs — the three pillars you built, standardized under
one API with one wire protocol (OTLP) and one collector that fans out to any
backend.

## What you now know

- OTel = **the standard for the three pillars you built**: spans, metrics, logs —
  with vendor-neutral APIs and a pluggable export pipeline.
- **Define-by-run instrumentation + config-swapped exporters** — the
  instrumentation-and-export split ends vendor lock-in.
- **Semantic conventions** standardize field names — the queryability of Chapter
  2's structured logs, made universal.

Next: the consumers of all this data — Prometheus, Grafana, Jaeger — and how the
observability stack maps to the systems you built.
