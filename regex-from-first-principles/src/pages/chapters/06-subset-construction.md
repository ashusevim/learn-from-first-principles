---
layout: ../../layouts/Chapter.astro
title: 'DFAs: The Subset Construction'
description: 'Precompute the state sets into a machine with one deterministic edge per input. Build: NFA → DFA, tables compared.'
part: 'Part II — The Theory That Saves'
written: true
---

Chapter 5's simulator recomputes ε-closures and state sets on every run — correct and
linear, but doing the same work for the same pattern every time. The **subset
construction** (Rabin–Scott, 1959) precomputes those sets *once*: each set of NFA
states becomes a single DFA state, with one edge per input character. The result: a
machine that matches by **table lookups only** — no closures at runtime. This is
exactly what grep compiles its patterns into.

## The lie you were told

> "DFA and NFA are different power classes."

They recognize **exactly the same languages** (regular languages) — the subset
construction converts any NFA to an equivalent DFA, and the DFA is at most 2^n
states (each subset of NFA states is a potential DFA state) while being *faster at
runtime*: no ε-closure, no sets — one transition table.

```text
NFA:  flexible to build, needs set-simulation at run time
DFA:  built by subset construction (exponential worst case), then table-lookup speed
```

## The construction: sets become states

```text
DFA state       = a SET of NFA states (the ε-closure, computed once)
DFA start       = ε-closure({NFA start})
DFA transition  = move(set, c) → ε-closure(all c-successors) — memoized as a new DFA state
DFA accepting   = any state in the set is NFA-accepting
```

Each new (set, char) pair creates a new DFA state; the algorithm terminates because
distinct sets are finite (≤ 2^n). In practice: usually a handful, rarely exponential.

## Prove it to yourself

**1. The tables, compared** — the build prints both machines for the same pattern:

```text
NFA:  6 states, ε-edges, non-deterministic choices   (built in Ch 4)
DFA:  3 states, one edge per char, no ε              (built by subset construction)
matching "ab": NFA walks sets {s0}→{s1}→{s2,s3}; DFA walks 0→1→2 by table lookup
```

**2. The runtime difference, structural:**

```text
NFA simulation per char:  compute move-set + ε-closure     (work per step)
DFA per char:             table[current][char] → next       (one array lookup)
```

That's why `grep` (which uses DFAs for simple patterns) matches gigabytes per
second — the per-character cost is a memory load.

## The build: subset construction

```python
# subset.py — NFA → DFA: precompute the state sets once
def epsilon_closure(states):                    # Ch 5's closure, reused
    stack, closure = list(states), set(states)
    while stack:
        s = stack.pop()
        for t in s.eps:
            if t not in closure: closure.add(t); stack.append(t)
    return frozenset(closure)

def build_dfa(start, alphabet):
    dfa_start = epsilon_closure({start})
    dfa_states = {dfa_start: 0}                 # set-fingerprint → DFA state number
    dfa_edges = {}                              # (state, char) -> state
    worklist = [dfa_start]
    while worklist:
        current = worklist.pop()
        cur_id = dfa_states[current]
        for c in alphabet:
            moved = {s.edges[c] for s in current if c in s.edges}
            if not moved: continue
            target_set = epsilon_closure(moved)
            if target_set not in dfa_states:
                dfa_states[target_set] = len(dfa_states)
                worklist.append(target_set)
            dfa_edges[cur_id, c] = dfa_states[target_set]
    accepting = {sid for s, sid in dfa_states.items() if any(x.end for x in s)}
    return dfa_states, dfa_edges, accepting

def dfa_match(dfa_edges, accepting, start_id, text):
    state = start_id
    for i, c in enumerate(text):
        state = dfa_edges.get((state, c))       # ONE table lookup per character
        if state is None: return False, i       # dead edge: fail fast
    return state in accepting, len(text)
```

Each line of `build_dfa` is Chapter 5's simulation, executed at *compile* time: the
closures, the moves, the accepting check — precomputed into `dfa_edges`, a plain
lookup table. The DFA *is* Chapter 5's simulation, memoized into a machine.

## What you now know

- The **subset construction** converts an NFA to a DFA: state-sets become single
  states, edges become table entries — same language, table-lookup speed.
- NFA vs DFA is a **build-time vs run-time** trade: NFA construction is linear and
  simulation does per-run work; DFA construction can be exponential but runs at
  table speed.
- grep's speed on simple patterns = DFA table lookups; modern engines (RE2) lazily
  build DFA states during matching to get both.

Next: your engines match — but users want `re.match(r"(\w+)@(\w+)", text).group(1)`.
Captures: the hardest problem in regex engine design.
