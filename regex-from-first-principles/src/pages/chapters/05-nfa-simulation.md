---
layout: ../../layouts/Chapter.astro
title: 'Simulating the NFA: Linear Time, Always'
description: 'Track a SET of states instead of one — and backtracking becomes impossible. Build: the simulation that kills Chapter 3’s blowup.'
part: 'Part II — The Theory That Saves'
written: true
---

Chapter 4 built the NFA — a graph whose "nondeterminism" is parallel edges. The
simulator's insight: don't pick a path; **follow all paths at once** by tracking a
*set of states*. Each input character moves the whole set. If any state in the final
set is accepting, the regex matched — and the work per character is bounded by the
number of states, so **the runtime is linear in the input length, always**.
Chapter 3's exponential becomes Chapter 5's straight line.

## The lie you were told

> "Regex matching can hang."

The *backtracking* approach can hang — it explores paths one at a time with
recursion. The NFA simulation **cannot hang**: at each character it does
`(states, char) → next states` — at most `states × alphabet` work, and `states ≤
pattern length`. 2^n paths collapse into a set of ≤ n states, processed in one pass.

## The simulation

```python
current_states = ε-closure({start})       # all states reachable via ε-transitions
for each character c in the input:
    next_states = { s' for s in current_states
                      for s' reachable from s via c }
    current_states = ε-closure(next_states)
    if empty: fail early (no path alive)
matched = any(s.end for s in current_states)
```

The ε-closure (all states reachable without consuming input) is computed per step —
and a `frozenset` as a dict key even lets you **memoize** closures, making each
character's work effectively constant.

## Prove it to yourself

**1. Chapter 3's killer pattern, neutralized:**

```text
(a+)+b on "aaaaaaaa!" — the NFA simulation:
step 1: states {after a's paths} — several states, one character consumed
step 2..n: the set grows slightly, stays ≤ n states
'!': no transition — the set empties → NO MATCH in exactly n steps.
No path re-exploration. The 2^n paths were simulated in n steps as ONE SET.
```

That's the theorem in action: the exponential number of paths exists, but they
*share states*, and states are what the simulator tracks.

**2. The empty-set early exit** — once `current_states` is empty, no path can ever
revive (nothing consumes input from nothing): fail immediately. Real engines use
this to fail fast.

## The build: the NFA simulator

```python
# simulate.py — set-of-states NFA simulation: linear time, always
def epsilon_closure(states):
    """all states reachable from `states` without consuming input"""
    stack, closure = list(states), set(states)
    while stack:
        s = stack.pop()
        for t in s.eps:
            if t not in closure:
                closure.add(t); stack.append(t)
    return closure

def simulate(start, text, accepting):
    current = epsilon_closure({start})
    for i, c in enumerate(text):
        nxt = set()
        for s in current:
            if c in s.edges: nxt.add(s.edges[c])
        if not nxt: return False, i            # no path alive: fail FAST
        current = epsilon_closure(nxt)
    return any(s.end for s in current), len(text)

# ── Chapter 3's killer, re-run against the simulator ──
# build the NFA for (a+)+b by hand (Thompson's bricks):
class St:                                              # hashable states (sets need it!)
    def __init__(self): self.edges, self.eps, self.end = {}, [], False
    def __hash__(self): return id(self)
    def __eq__(self, o): return self is o
states = [St() for _ in range(6)]
s0, s1, s2, s3, s4, s5 = states
s0.eps = [s1]                      # ε into the outer machine
s1.eps = [s2]                      # outer loop head
s2.edges["a"] = s3                 # the inner a+
s3.eps = [s2, s4]                  # loop back OR exit to 'b'
s4.edges["b"] = s5                 # the 'b' that never comes
s5.end = True

for n in (5, 20, 200, 2000):
    text = "a" * n + "!"
    t0 = time.time() if False else __import__("time").time()
    matched, steps = simulate(s0, text, states)
    dt = (__import__("time").time() - t0) * 1000
    print(f"n={n:5d}: no match in {steps} steps, {dt:.2f} ms")
# n=    5: no match in 5 steps, 0.02 ms
# n=   20: no match in 20 steps, 0.03 ms     ← Chapter 3's matcher: 500ms+ here
# n=  200: no match in 200 steps, 0.11 ms    ← Chapter 3's matcher: ~10^40 years
# n= 2000: no match in 2000 steps, 0.85 ms   ← LINEAR. Always.
```

Twenty a's: the backtracking engine took 500ms; the simulation takes 0.03ms — and
the gap widens exponentially with each 'a' while the simulation stays linear. This
is why RE2 and Rust's regex crate (Chapter 10) simply *cannot* hang.

## What you now know

- The simulator tracks a **set of states**, not a path — all NFA branches advance
  simultaneously, one step per character.
- **ε-closures** fold zero-consumption transitions into each step; the empty set
  fails fast.
- Runtime: **O(input × states) — linear, always.** Catastrophic backtracking is
  structurally impossible here.

Next: the simulation recomputes state sets on every run. Precompute them *once*
into a machine with one deterministic edge per input — the DFA, via subset
construction.
