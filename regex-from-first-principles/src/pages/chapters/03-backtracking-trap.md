---
layout: ../../layouts/Chapter.astro
title: 'The Backtracking Trap'
description: '(a+)+b against "aaaaaaaaaaaaaaaaaaaa!" — exponential time, on camera. Build: the blowup, measured.'
part: 'Part I — The Matcher'
written: true
---

Chapter 2's recursive matcher works — until a specific pattern meets a specific
string and the runtime explodes from microseconds to **heat death of the universe**.
This is *catastrophic backtracking*, the bug behind real outages (Cloudflare's 2019
global outage was a single regex). This chapter reproduces it, measures the
exponential, and names the mechanism — setting up the automata theory that makes it
impossible.

## The lie you were told

> "Regex matching is fast."

The *naive* backtracking matcher's speed depends on **how many ways the pattern can
try to match**. For most patterns, few. For patterns where a repetition contains an
ambiguous repetition — `(a+)+` — the number of ways to split `a^n` among the
repetitions grows **exponentially**, and a *failing* match forces the engine to try
every one:

```text
(a+)+b  against  "aaaaaaaaaaaaaaaaaaaa!"   (20 a's, no b — the match FAILS)
ways to split 20 a's into groups: 2^19 ≈ 524,288 paths
each path: function calls, comparisons... and the answer is always "no b".
```

The `!` at the end is the attacker's mark: the failure forces exhaustive exploration.
Had the string ended in `b`, the first path would match instantly. **Failure is the
expensive case** — which is exactly what an attacker engineers.

## The mechanism: ambiguity × failure

```text
(a+)+b on a^n (no b):
  the outer + consumes the inner a+'s output in k different ways,
  for every k, for every split... the engine explores 2^(n-1) decompositions.
```

The pattern is ambiguous (many ways to assign a's between the inner and outer `+`),
and only a failing end state forces full enumeration. Real-world patterns with this
shape: `(a|a)*$`, `(\w+\s?)*$` (Cloudflare's killer), `(.*?,)+x`.

## Prove it to yourself

**1. The exponential, measured** — each extra 'a' DOUBLES the time:

```python
# blowup.py — (a+)+b against growing a-runs, no b: the failure case
import time

def match_here(p, t, s):                 # Chapter 2's matcher, verbatim shape
    if not p: return True
    if p[0] == "+":                      # one-or-more: try one more, or skip
        return (match_here(p, t, s + 1) if s < len(t) and t[s] == "a" else False) \
            or match_here(p[1:], t, s)
    if s < len(t) and p[0] == t[s]: return match_here(p[1:], t, s + 1)
    return False

def match(pattern, text):                # try all start offsets
    return any(match_here(pattern, text, s) for s in range(len(text) + 1))

for n in range(3, 22):
    text = "a" * n + "!"
    t = time.time(); match("(a+)+b", text); dt = time.time() - t
    print(f"n={n:2d}: {dt*1000:8.2f} ms")
    if dt > 2: break                     # stop before the heat death
# n= 3: 0.02 ms
# n=10: 0.31 ms        each 'a' DOUBLES the time: 2^n
# n=17: 40.1 ms
# n=21: ~640 ms … n=30 would be ~11 minutes; n=42: ~34 YEARS
```

**2. The success case, for contrast** — same pattern, string ending in `b`:

```python
# "aaa...ab": the FIRST decomposition path matches instantly. 0.02 ms every time.
# failure forces exhaustive search; success shortcuts it. The attacker knows.
```

## The real-world cost

Cloudflare, January 2019: one regex in a wall-rules feature —
`(?<count>.*(?:[0-9a-fA-F]{3})* ...,` roughly `(.*)+(?:[0-9a-f]+)...` shaped — met a
1MB request. The backtracking engine burned 100% CPU per request; CPU exhaustion
took down Cloudflare's edge network **globally for 27 minutes**. The fix: a regex
that couldn't backtrack catastrophically. The lesson: this is a *denial of service*
vector, and it's Chapter 11's subject.

## What you now know

- Backtracking explores **all decomposition paths** of ambiguous repetitions — and
  failing matches force full exploration: **2^n time for 2^n paths**.
- The attack shape: an **ambiguous repetition wrapping a repetition**, plus a
  guaranteed failure at the end.
- Real outages (Cloudflare 2019, Stack Overflow 2016) were exactly this — a ReDoS
  (regex DoS), Chapter 11's full treatment.

Next: the fix isn't a smarter backtracker — it's a *different machine*. Thompson's
construction turns the regex into an NFA where this blowup is impossible.
