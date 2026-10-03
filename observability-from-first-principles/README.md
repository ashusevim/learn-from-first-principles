# Observability from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds observability from first principles — structured
logs, metrics with histograms, distributed traces — then debugs an injected
incident through the telemetry you instrumented yourself.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Databases](../databases-from-first-principles),
[Game Engines](../game-engines-from-first-principles), [Cryptography](../cryptography-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Three Pillars**
1. What Is Observability, Really? ✅
2. Logs: Events with Context ✅
3. Metrics: Numbers Over Time ✅

**Part II — Traces & Costs**
4. Traces: The Request's Journey ✅
5. Instrumentation: Wiring the Pillars In ✅
6. Cardinality: The Metric That Kills Your Backend ✅

**Part III — Serving It**
7. Sampling: You Can't Keep Everything ✅
8. Alerting: Pages vs Tickets ✅
9. SLOs & Error Budgets ✅

**Part IV — The Real World**
10. OpenTelemetry: The Standard ✅
11. The Observability Stack: Prometheus, Grafana, Jaeger ✅
12. Final Boss: The Observable Service in ~300 Lines ✅ *(all three pillars, incident debugged)*

All 12 chapters are fully written, each with runnable builds and measured outputs.
Things you build along the way: a structured JSON logger with correlation ids, a
metrics registry with p50/p95/p99 percentiles, a trace waterfall showing where the
milliseconds went, the three pillars correlated on one code path, cardinality
growth measured, head vs tail sampling compared, threshold vs SLO-burn alerts,
an error-budget computer, the OTel model mapped to your systems — and an incident
debugged through the telemetry of the service you instrumented.

## The rules of the course

1. **Start below the abstraction.** Before "install Grafana", answer "what is a metric, physically?"
2. **Nothing is magic.** Structured logs, histograms, spans — buildable data structures.
3. **Instrument for real.** The three pillars on one code path, correlated by ids.
4. **Debug through the telemetry.** The finale: an incident, found through your tools.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
