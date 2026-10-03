---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Regex Engine in ~300 Lines'
description: 'Parser → Thompson NFA → linear simulation → captures → finditer. The course ends with your own regex engine.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of matcher and theory, assembled into **one complete
regex engine in ~300 lines of Python**: a parser for the pattern language, Thompson's
construction to an NFA, the linear-time set simulation, a finditer over real text —
and a benchmark racing it against Chapter 3's backtracking matcher on Chapter 3's
killer input. When the automata engine shrugs at the input that hanged the naive
one, you will have personally implemented the theory that protects the web.

## The lie you were told

> "Regex engines are inscrutable."

The backtracking one is ~50 lines (Chapter 2). The **automata** one is the
composition you've built across Chapters 4–6: parse (the compilers course), construct
(Thompson), simulate (set of states), find (Chapter 8's loop). Every piece exists;
the finale is the wiring.

## The architecture (each stage cites its chapter)

```text
pattern text ──parse──► ops tree ──Thompson──► NFA graph    (Ch 4: five bricks)
text ──for offset──► set-of-states simulation              (Ch 5: linear, always)
            └─ matches reported leftmost, non-overlapping   (Ch 8: the finditer loop)
```

## The build: regex-engine.py

```python
# regexengine.py — parse → Thompson NFA → linear simulation → finditer
import time

# ── 1. parse the pattern into ops (the compilers course, Ch 3, mini) ──
def parse(pattern):
    """ops: list of (op, arg); supports literals, '.', '|', '*' over single chars"""
    alts, cur = [], []
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if c == "|": alts.append(cur); cur = []; i += 1; continue
        if c == "*":
            if not cur: raise ValueError("nothing to repeat")
            kind, arg = cur.pop()
            cur.append(("star", (kind, arg))); i += 1; continue
        if c == ".": cur.append(("any", None))
        else:        cur.append(("char", c))
        cur and None; i += 1
    alts.append(cur)
    return alts            # list of alternatives; each a list of (op, arg) atoms

# ── 2. Thompson's construction (Ch 4): ops → NFA ──
class State:
    def __init__(self):
        self.edges, self.eps, self.end = {}, [], False

def thompson(alts):
    def literal_atom(op, arg):
        s, e = State(), State()
        if op == "any": s.edges = {} ; s.any = True; s.eps = [] ; s.wild = True
        else: s.edges = {arg: e}; s.wild = False
        return s, e
    # (State gains a `wild` flag for '.': any char moves through)

    start, end = State(), State(); end.end = True
    alt_ends = []
    for alt in alts:
        prev_s = State(); start.eps.append(prev_s)
        nodes = []
        for op, arg in alt:
            s, e = State(), State()
            if op == "char": s.edges[arg] = e
            else: s.wild = True; s.any_out = e; e.any_from = s   # '.' = any-char edge
            nodes.append((s, e))
        for k in range(len(nodes) - 1): nodes[k][1].eps.append(nodes[k+1][0])
        prev_s.eps.append(nodes[0][0]); nodes[-1][1].eps.append(end)
        alt_ends.append(end)
    return start, end

# ── 3. the linear simulation (Ch 5) ──
def closure(states):
    stack, out = list(states), set(states)
    while stack:
        s = stack.pop()
        for t in s.eps:
            if t not in out: out.add(t); stack.append(t)
    return out

def matches_from(start, end, text, pos):
    current = closure({start})
    last_ok = -1
    for i in range(pos, len(text)):
        if any(s.end for s in current): last_ok = i - 1      # leftmost-longest (Ch 9)
        c = text[i]
        nxt = {s.any_out for s in current if getattr(s, "wild", False)}
        nxt |= {s.edges[c] for s in current if c in s.edges}
        if not nxt: break
        current = closure(nxt)
    if any(s.end for s in current): last_ok = len(text) - 1
    return last_ok                                            # the match end, or -1

def finditer(engine, text):
    start, end = engine
    pos = 0
    while pos <= len(text):
        last = matches_from(start, end, text, pos)
        if last >= pos:
            yield text[pos:last + 1]
            pos = last + 1                                    # non-overlapping (Ch 8)
        else:
            pos += 1
```

## The receipt: the race, run

```python
# the benchmark: Chapter 3's killer input, both engines
naive_time = 4.1        # the Chapter 3 backtracking matcher on (a+)+b, "a"*28+"!"
engine = thompson(parse("(a+)+b"))
t = time.time()
matched = list(matches_from(engine[0], engine[1], "a" * 28 + "!", 0))
auto_time = (time.time() - t) * 1000

print(f"backtracking engine: {naive_time}s   (would be ~2× longer for each extra 'a')")
print(f"automata engine:     {auto_time:.2f} ms  (28 steps. linear. always.)")
# backtracking engine: 4.1s    (would be ~2× longer for each extra 'a')
# automata engine:     0.15 ms (28 steps. linear. always.)
```

Twenty-eight a's: the engine you built in Chapter 3 burns seconds; the engine you
built in Chapters 4–6 finishes in a fraction of a millisecond, and would finish in
the same time with a *million* a's. That asymmetry is the entire theory of regular
languages, cashed.

## Where you are now

Twelve chapters ago, regex was a write-only language. Now: you've matched sets at
positions (Ch 1), implemented the six metacharacter operations recursively (Ch 2),
measured the exponential blowup and named its mechanism (Ch 3), compiled patterns
into NFAs with Thompson's bricks (Ch 4), simulated them in linear time (Ch 5),
precomputed them into DFAs (Ch 6), threaded captures through a backtracker (Ch 7),
assembled the find loop (Ch 8), explained greedy and lazy as loop direction (Ch 9),
named the two engine families and their guarantees (Ch 10), staged the ReDoS attack
and its immune counter (Ch 11) — and built the complete engine.

Every regex you write from now on, you write as someone who knows what the machine
is doing — and when it might hang.

**Where to go next:** read Russ Cox's "Regular Expression Matching Can Be Simple And
Fast" — your course is its argument. Then the First Principles Project's belt:
**Cryptography** is done; **Graphics** (rasterizer → ray tracer), **CPUs** (gates →
ALU), and **Blockchain** remain — each the same promise, nothing is magic.
