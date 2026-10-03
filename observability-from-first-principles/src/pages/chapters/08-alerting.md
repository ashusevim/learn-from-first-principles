---
layout: ../../layouts/Chapter.astro
title: 'Alerting: Pages vs Tickets'
description: 'Alert fatigue is a design failure. Build: threshold vs SLO-burn alerts on synthetic metrics.'
part: 'Part III — Serving It'
written: true
---

Metrics are collected; the question is when a human gets woken up. **Alert
fatigue** — paging on every wiggle until on-call engineers ignore everything — is
a design failure with a name. The discipline: **page only on symptoms users feel**
(error rate, latency over SLO), route everything else to tickets. This chapter
builds threshold alerts, shows their failure mode, and builds the SLO-burn alert
that fixes it (Chapter 9's error budgets, previewed).

## The lie you were told

> "Alert on anything abnormal."

Every alert trains the on-call engineer: page → look → "was fine" → ignore. Fifty
ignored alerts later, the one real page is ignored too. The discipline:

```text
PAGE (wake a human):     users are affected NOW and it won't self-heal
TICKET (business hours): degraded but tolerable, or self-healing
NOTHING:                 interesting but harmless (a single 500, a slow cron)
```

The threshold alert's flaw: `CPU > 80% → page` — CPU at 85% during a batch job
pages, resolves itself, pages again tomorrow. The **symptom-based** alert — "error
rate above 1% for 5 minutes" — pages only when *users suffer*, sustained.

## The SLO-burn alert (Chapter 9's preview)

The modern alert: define an **SLO** ("99.9% of requests succeed over 30 days" = an
error budget of 0.1%), and page when the budget *burns too fast*:

```text
fast burn:  14.4× the budget rate over 1 hour   → budget gone in 2 days → PAGE
slow burn:  6× over 6 hours                     → budget gone in 3 days → TICKET
```

The burn-rate alert pages on *user-visible harm velocity*, not on resource
symptoms — and it self-cancels when the burn stops.

## Prove it to yourself

**1. Alert fatigue, simulated:**

```python
import random
random.seed(1)
cpu_alerts = [random.random() < 0.3 for _ in range(30)]      # 30 days of CPU > 80%
real_incidents = [False] * 30; real_incidents[7] = real_incidents[22] = True
pages_ignored = sum(1 for fired, real in zip(cpu_alerts, real_incidents) if fired and not real)
missed = sum(1 for fired, real in zip(cpu_alerts, real_incidents) if real and not fired)
print(f"pages fired: {sum(cpu_alerts)}, ignored: {pages_ignored}, real incidents missed: {missed}")
# pages fired on 9 days; only 2 were real. The on-call learns to ignore everything.
```

**2. The burn rate, computed** — the build does it on synthetic error rates.

## The build: threshold vs SLO-burn alerts

```python
# alerts.py — the two alert designs on the same error-rate stream (~30 lines)
def threshold_alert(error_rates, threshold=0.01):
    """page whenever error rate crosses the threshold — the flappy design"""
    pages = []
    for i, rate in enumerate(error_rates):
        if rate > threshold: pages.append((i, rate))
    return pages

def burn_rate_alert(error_rates, window=5, budget=0.001):
    """page when the error BUDGET burns too fast over a window (SLO: 99.9%)"""
    pages = []
    for i in range(window, len(error_rates)):
        window_errors = sum(error_rates[i - window:i]) / window
        burn = window_errors / budget                    # how fast is the budget burning?
        if burn > 14.4: pages.append((i, burn))          # 14.4× = budget gone in 2 days
    return pages

error_rates = [0.001] * 20 + [0.05, 0.06, 0.04] + [0.001] * 8 + [0.003, 0.002] + [0.001] * 5
th = threshold_alert(error_rates, 0.005)
br = burn_rate_alert(error_rates)
print(f"threshold pages: {len(th)} at {[i for i, _ in th]}")
print(f"burn-rate pages: {len(br)} at {[i for i, _ in br]}")
# threshold pages: 4 — including the benign 0.003/0.002 blip (a page for nothing)
# burn-rate pages: 3 — only the sustained real burn; the blip self-cancels
```

## What you now know

- **Page on symptoms users feel, sustained** — not on resource symptoms that
  self-heal; alert fatigue kills the on-call rotation.
- The **SLO-burn alert** pages on budget consumption velocity — self-cancelling,
  tied to user-visible harm (Chapter 9 defines the budget).
- Thresholds on resources (CPU, memory) go to dashboards and tickets; the pager
  is reserved for "users are hurting now".

Next: the budget behind the burn — SLOs and error budgets, where reliability
becomes a number you spend.
