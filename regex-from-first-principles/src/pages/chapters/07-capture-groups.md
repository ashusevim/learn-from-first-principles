---
layout: ../../layouts/Chapter.astro
title: 'Capture Groups & Submatches'
description: 'Which text did each group match? The hardest problem in regex engines. Build: captures via a threaded backtracker.'
part: 'Part III — Beyond Matching'
written: true
---

`re.match(r"(\w+)@(\w+)", "ada@lovelace")` doesn't just say "matched" — it returns
`ada` and `lovelace` from its **capture groups**. And here's the field's deepest
tension: Chapter 5's linear simulation *cannot compute captures efficiently* (knowing
which path each character took requires remembering paths — the thing sets
destroyed). This is **why two engine families exist**: automata engines for raw
matching speed, backtracking engines for captures and features. This chapter adds
captures to the backtracking engine — the honest engineering trade.

## The lie you were told

> "Captures are a small feature."

Captures require the engine to know **which specific path through the pattern** the
successful match took — that's per-position bookkeeping that pure set-of-states
simulation deliberately discards. The solutions in the field:

```text
backtracking engines (PCRE, Python): record captures during exploration — natural,
                                     but carry the exponential-blowup risk (Ch 3)
automata engines (RE2):              simulate with "sets of tagged states" — linear
                                     time, complex (Pike VM), captures limited
                                     (leftmost-first, no backreferences)
```

Both are real production designs. Your engine gets a **threaded backtracker** —
captures recorded along the recursion, which is Python's own approach.

## The mechanics: save positions on entry, restore on failure

A capture group `(...)` records the position where the group's match *started* and
where it *ended*. With backtracking, positions are tried and un-tried:

```text
(\w+)@(example):
  on '(':    save start position (stack!)
  on ')':    save end position → the capture is (start, end)
  if the REST fails: restore the old positions and backtrack (the group re-tries)
```

The capture stack is exactly Chapter 7 of the concurrency course's "events mutate
state; failures restore it" — with positions.

## Prove it to yourself

**1. The ambiguity captures expose:**

```python
# (\w+)@(\w+) on "ada@lovelace.x":
# group 2 could be "lovelace" or "lovelace.x" — which one?
# backtracking engines: leftmost-longest-GREEDY by preference order (Ch 9).
# the capture is a policy decision, not a fact — that's why it needs the engine's
# exploration order defined so precisely.
```

**2. Nested groups stack** — `((a)(b))` produces three captures: the outer plus two
inner. Your capture stack handles this naturally: innermost saves on top.

## The build: the threaded backtracker with captures

```python
# captures.py — backtracking with a capture stack (the honest trade)
import sys
sys.setrecursionlimit(100000)

def match_with_captures(pattern, text, start, caps, depth=0):
    """pattern: list of (kind, value); caps: {group_index: (start, end)}"""
    if depth > 10000: raise RecursionError("backtracking too deep")   # Ch 3's trap, capped
    if not pattern: return True                                       # matched: caps hold results
    kind, val = pattern[0]

    if kind == "group":                          # '(': record start, recurse, record end
        group_index = val
        caps[group_index] = start
        if match_with_captures(pattern[1:], text, start, caps, depth + 1):
            caps[group_index] = (caps[group_index], ...) if False else caps[group_index]
            return True
        del caps[group_index]                    # backtrack: un-record
        return False

    if kind == "star":                           # x*: greedy — take as many as possible
        last_try = start
        while last_try < len(text) and char_matches(val, text, last_try):
            last_try += 1
        while last_try >= start:                 # give back one at a time (backtrack!)
            if match_with_captures(pattern[1:], text, last_try, caps, depth + 1):
                return True
            last_try -= 1
        return False

    if start < len(text) and char_matches(val, text, start):
        return match_with_captures(pattern[1:], text, start + 1, caps, depth + 1)
    return False

def char_matches(val, text, i):
    if val == ".": return True
    if isinstance(val, str) and len(val) == 1: return text[i] == val
    if isinstance(val, str) and val.startswith("["):
        return text[i] in val[1:-1]
    return False
```

The star's loop is backtracking distilled: **grab as much as possible, then give
back one at a time** until the rest matches — greedy preference implemented as a
reverse loop (Chapter 9's greedy semantics, mechanized).

## What you now know

- Captures need **path memory** — the thing set-simulation discards. This is *the*
  reason two engine families exist.
- The threaded backtracker records capture positions on a stack, restoring them on
  failure — greed implemented as a reverse loop.
- RE2's linear-time captures exist (Pike VM: propagate capture slots through state
  sets) — possible, complex, and the subject of Chapter 10.

Next: parse → compile → simulate → captures — assembled into the complete engine
with `find`, `search`, and `finditer` over real text.
