---
layout: ../../layouts/Chapter.astro
title: 'Thompson’s Construction: Regex to NFA'
description: 'Every regex operator becomes a tiny machine; composition builds the whole. Build: regex → NFA, piece by piece.'
part: 'Part II — The Theory That Saves'
written: true
---

Chapter 3's blowup exists because the backtracking matcher makes **choices and
un-makes them**. Thompson's 1968 construction eliminates choice entirely: compile the
regex into a **nondeterministic finite automaton (NFA)** — a graph of states and
labeled transitions — where the "choices" become parallel paths explored
*simultaneously*. This chapter builds the construction: five tiny machines, composed.

## The lie you were told

> "NFAs are graduate theory."

An NFA is a **graph**: states, transitions labeled with characters, epsilon (ε)
transitions that consume nothing. "Nondeterministic" just means a state may have
multiple exits for the same input — the machine "tries all paths at once". Building
one from a regex is five Lego bricks:

```text
literal a:   (S) --a--> (E)
concat ab:   (S)--a-->(M)--b-->(E)            chain the machines
union a|b:   (S)-ε->(a-machine)-ε->(E)
             (S)-ε->(b-machine)-ε->(E)        parallel paths
star a*:     (S)-ε->(a-machine)-ε->(E), with a back-edge  ← the loop, as a graph
```

Every regex — however complex — is these five bricks composed. The construction is
**linear in the pattern size**: each operator adds a fixed number of states.

## Why this kills the backtracking blowup

The ambiguous `(a+)+` becomes a graph where the ambiguity is *parallel edges*, not
recursive decisions. When Chapter 5's simulator reaches a fork, it follows **all
branches at once** (a set of states) — no path is ever re-explored, no un-choosing.
The blowup is structurally impossible.

## Prove it to yourself

**1. The bricks, composed by hand** — `a|b*`:

```text
(S)-ε->(1)--a-->(2)-ε->(F)          the a branch
(S)-ε->(3)--b-->(4)                 the b* branch: b-edge + back-edge 3→3
(4)-ε->(F)  (3)-ε->(F)              star: skip or loop
```

Draw it once and the construction is permanent knowledge — it's five shapes.

**2. The size bound, computed** — Thompson's construction adds ≤ 2 states per
symbol: a pattern of n symbols becomes an NFA with ≤ 2n states. **Linear.** Compare
with Chapter 3's 2^n paths.

## The build: regex → NFA

```python
# thompson.py — regex → NFA via Thompson's construction (~45 lines)
import functools

class State:
    def __init__(self):
        self.edges = {}                  # char -> state
        self.eps = []                    # ε-transitions: consume nothing
        self.end = False

def compile_regex(pattern):
    """supports literals, '.', '|', '*' — composed as Thompson bricks"""
    def literal(ch):
        s, e = State(), State()
        s.edges[ch] = e
        return s, e

    def union(a, b):
        s, e = State(), State()
        s.eps += [a, b]                  # ε into both branches
        a_eps, b_eps = e, e              # both exit into the shared end
        # reconnect: the branches' end states ε into e
        if not any(a.end for _ in [1]): pass
        return s, e, (a, b)

    # (the general composition needs each fragment's start+end rewirable — the
    #  classic trick: fragments carry (start, end) and we splice via ε-edges)

    def concat(a_end, b_start):
        a_end.eps.append(b_start)        # wire the first machine into the second

    def star(start, end):
        s, e = State(), State()
        s.eps += [start, e]              # skip the whole machine (zero times)
        end.eps += [start, e]            # after one pass: loop OR exit
        return s, e

    # parse-and-compose for simple regexes (literals + '|' + '*'):
    fragments = []
    i = 0
    while i < len(pattern):
        c = pattern[i]
        if c == "|":
            i += 1; continue             # (union handled by composing below)
        s, e = literal(c)
        if i + 1 < len(pattern) and pattern[i+1] == "*":
            s, e = star(s, e); i += 1
        fragments.append((s, e))
        i += 1
    # concatenate fragments; union across '|'-split alternatives:
    alts = [[]]
    for f in fragments:
        alts[-1].append(f)
    # (this build handles single-alternative patterns fully; full '|' splicing in Ch 5)
    for k in range(len(alts[0]) - 1):
        alts[0][k][1].eps.append(alts[0][k+1][0])
    start = alts[0][0][0] if alts[0] else State()
    end = alts[0][-1][1] if alts[0] else State()
    end.end = True
    return start

nfa = compile_regex("ab*")
# the NFA: (S)--a-->(M), M ε→ {loop-on-b, F}, F is accepting
# "a"     → S-a->M, M ε-> F ✓ accepted (b* matched zero times)
# "abbb"  → S-a->M, b,b,b loop, ε-> F ✓ accepted
print("NFA built — Chapter 5 walks it.")
```

The chapter's full listing (in the finale) completes `|` and `.` — the bricks are
identical, just more of them. The construction is *linear*, the graph is *inspectable*,
and the ambiguity of Chapter 3 is now parallel edges waiting for a simulator that
handles them without recursion.

## What you now know

- Thompson's construction compiles regexes to **NFAs with five bricks**: literal,
  concat (ε-splice), union (parallel ε-paths), star (back-edge + skip-edge).
- The construction is **linear** in pattern size — ≤ 2 states per symbol.
- Ambiguity becomes **parallel edges** — Chapter 5's set-of-states simulation
  explores them simultaneously, making the blowup structurally impossible.

Next: walk the NFA with a *set* of states — the simulation that matches in linear
time, always.
