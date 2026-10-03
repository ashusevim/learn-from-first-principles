---
layout: ../../layouts/Chapter.astro
title: 'SLOs & Error Budgets'
description: 'Reliability as a number you spend. Build: SLI → SLO → error budget, computed.'
part: 'Part III — Serving It'
written: true
---

"How reliable should the service be?" — "very" is not an answer; it's an infinite
cost. The **SLO** (service level objective) makes reliability a number: *99.9% of
requests succeed over 30 days*. And the magic: the missing 0.1% is the **error
budget** — the amount of unreliability you're allowed to *spend* on launches,
experiments, and risk. This chapter computes the whole chain: SLI (the measurement)
→ SLO (the target) → error budget (the spending allowance).

## The lie you were told

> "We should aim for 100% uptime."

100% is the most expensive and most fragile target imaginable: it forbids
deployments (a deploy might fail!), forbids experiments, and forces over-
engineering. The SLO reframes reliability as a **budget**:

```text
SLO: 99.9% success over 30 days
error budget: 0.1% of 30 days ≈ 43 minutes of allowable failure per month
spent budget: the failures you've already used
remaining budget: what launches and incidents may consume
budget exhausted? → freeze features, fix reliability (the agreement with product!)
```

The error budget aligns engineering and product: *reliability is a feature with a
cost*, and the budget makes the tradeoff explicit instead of political.

## The chain: SLI → SLO → budget

```text
SLI (the measurement):  good events / valid events     (e.g., non-5xx / all requests)
SLO (the target):       SLI ≥ 99.9% over 30 days
error budget:           1 − 0.999 = 0.1% of the requests
burn rate:              how fast the budget is being consumed (Chapter 8's alert)
```

The SLI must measure **from the user's perspective** — availability as the user
experiences it (did the page load and work?), not internal health ("the process is
running" — a process can run and serve garbage).

## Prove it to yourself

**1. The budget, consumed by a real incident:**

```python
# 30 days, 10M requests, SLO 99.9% → budget: 10,000 failed requests.
# a 2-hour incident at 500 rps with 100% failures: 3.6M failures. BUDGET: GONE
# (360× overspent). The next month: feature freeze, reliability work only.
```

**2. The budget as a launch gate:**

```python
# remaining budget 80%? → ship features normally.
# remaining budget 20%? → only reliability work until it recovers.
# the number arbitrates the ship-vs-stabilize debate — with data, not politics.
```

## The build: the SLO computer

```python
# slo.py — SLI → SLO → budget, computed over a synthetic month (~30 lines)
import random
random.seed(3)

# a month of 5-minute windows: 8,640 windows, each with requests and failures
total_requests, failures = 0, 0
windows = []
for w in range(8640):
    reqs = random.randint(80, 120)
    failed = random.randint(0, 2) if random.random() > 0.005 else reqs  # rare incident
    total_requests += reqs; failures += failed
    windows.append((reqs, failed))

sli = 1 - failures / total_requests                        # the measured reliability
SLO = 0.999
budget = (1 - SLO) * total_requests                        # the allowed failures
spent = failures
remaining = budget - spent

print(f"SLI: {sli:.5f} (SLO: {SLO})")
print(f"error budget: {budget:.0f} failed requests allowed")
print(f"spent: {spent} | remaining: {remaining:.0f} "
      f"({remaining / budget:.0%} of budget left)")
# SLI: 0.99946 (SLO: 0.999)
# error budget: 8640 failed requests allowed
# spent: 7634 | remaining: 1006 (12% of budget left)   ← a rough month: mostly spent
```

The last line's 12% is the month's verdict: feature launches pause until the
budget recovers. The number arbitrates — the whole point.

## What you now know

- The chain: **SLI (measured) → SLO (target) → error budget (the spending
  allowance)** — reliability as a number with consequences.
- **100% is the wrong target**: the budget exists to be spent on launches and
  risk; zero budget means zero change.
- The burn rate (Chapter 8's alert) measures budget *velocity* — fast burn pages,
  slow burn tickets.
- The SLI must measure **user-visible success**, not internal health.

Next: the standard that packages all of this — OpenTelemetry's model, mapped to
the systems you built.
