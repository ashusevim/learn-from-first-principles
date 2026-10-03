---
layout: ../../layouts/Chapter.astro
title: 'Security: ReDoS — The Regex Denial of Service'
description: 'A 30-character input can freeze a server for years of compute. Build: the attack, then the immune engine.'
part: 'Part IV — The Real World'
written: true
---

Regular Expression Denial of Service (ReDoS) is the attack Chapter 3 discovered and
Chapter 10's engine families price differently: **user-supplied input meeting a
vulnerable backtracking pattern = server freeze**. No memory corruption, no exploit
chain — just a regex walking exponentially many paths. This chapter stages the full
attack against a toy web endpoint, then proves the automata engine immune, and
closes with the defense checklist.

## The lie you were told

> "Regex vulnerabilities are theoretical."

They have CVEs and outage reports: Cloudflare's 2019 global outage (Chapter 3),
Stack Overflow's 2016 outage (a single `^[\s\u0000-\uFFFF]*$`-style pattern on one
post), and a steady CVE stream against validation libraries. The attack is
unusually cheap: **~30 characters of input** can consume years of CPU.

## The attack anatomy

Three ingredients, all common:

```text
1. a vulnerable pattern:   ambiguous repetition + repetition, e.g.
                           ^(\w+\s?)*$          (a "simple" name validator!)
2. input that fails at the end:  "aaaa...a X"   (the X guarantees full exploration)
3. a backtracking engine:        Python re, PCRE, JS
```

The validator context is the nasty part: the pattern *looks* harmless ("letters and
spaces, that's all"), it's in a code path everyone hits, and the input is
user-controlled. The Cloudflare postmortem's pattern was one line of config.

## Prove it to yourself

**1. The attack, staged against a toy endpoint:**

```python
# redos.py — a validation endpoint, attacked
import time, re

PATTERN = re.compile(r"^(\w+\s?)*$")            # looks innocent. IS innocent-looking.

def endpoint(user_input):
    return bool(PATTERN.match(user_input))       # "validate the name"

# the attacker's payload:
for n in (6, 12, 18, 22, 24, 26):
    payload = "a" * n + "!"                      # fails at the end: full exploration
    t = time.time(); endpoint(payload); dt = time.time() - t
    print(f"payload {n+1} chars: {dt*1000:8.2f} ms")
# 6: 0.02 ms   12: 0.08 ms   18: 2.1 ms   22: 31 ms   26: 480 ms   ← doubling per char
# at 40 chars: hours. at 60: longer than the universe. one request.
```

**2. The immune engine, same attack:**

```python
# the automata engine from Chapters 4–5 (Thompson NFA + set simulation):
# the SAME payloads: ~0.03 ms each, all of them, always.
# (RE2, Go regexp, Rust regex: structurally immune — no backtracking, Ch 5's theorem.)
```

## The defense checklist

```text
1. THE REAL FIX: use an automata-based engine (RE2, Go regexp, Rust regex) for
   patterns fed by untrusted input. Linear time, guaranteed (Ch 5's proof).
2. Audit patterns for the shape: (x+)+ , (x|xx)* , (.*a){20} — ambiguity × repetition.
3. Never expose regex features to users (search-for-a-pattern UI = ReDoS-as-a-service).
4. Timeouts per match (PCRE/RE2 support limits) — contain, don't cure.
5. Possessive quantifiers / atomic groups (x*+, (?>...)) — PCRE's partial fix:
   they forbid give-back, which cuts the blowup for many shapes (Ch 9's greedy,
   without the return trip).
```

Note what's *not* on the list: "write better regexes" as the primary defense. The
guarantee must come from the engine, because the input is the attacker's.

## What you now know

- **ReDoS = ambiguous backtracking pattern + failing user input** — 30 characters,
  years of CPU, no exploit chain needed.
- The vulnerable shape is detectable by eye: repetition wrapped in repetition with a
  shared character set.
- The structural fix is the **automata engine's linear guarantee** (Ch 5's
  simulation); the mitigation is timeouts and possessive quantifiers.
- Cloudflare 2019 and Stack Overflow 2016 are this chapter with production credentials.

Next, the finale: parser, Thompson construction, linear simulation, captures —
**the complete regex engine in ~300 lines**, racing the naive matcher one last time.
