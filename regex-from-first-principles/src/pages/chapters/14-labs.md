---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the engine from Chapter 12 — NFA, captures, greediness, ReDoS. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in output you check against your own run, using only
the artefacts this course already built. Nothing here is new theory — only something to
break.

## How the labs work

| Field | What it gives you |
|---|---|
| **Goal** | the claim the lab proves |
| **Do this** | the smallest change that proves it |
| **You'll know it works when** | the expected output |
| **Where it comes from** | the chapter that taught it |

Self-grade by diffing your output against the expected block. Hints are directions,
never solutions.

| Section | Labs |
|---|---|
| Warm-ups | 1.1–1.3 |
| Builds | 2.1–2.5 |
| Stretch goals | 3.1–3.4 |

## Warm-ups

**Lab 1.1 — Predict the consumption**
**Goal:** predict three `match` results before running them.
**Do this:** print all three calls from Chapter 1's matcher.
**You'll know it works when:**
```text
3 3 2
```
**Where it comes from:** Chapter 1 — What Is a Regex, Really?

**Lab 1.2 — Watch the doubling**
**Goal:** reproduce Chapter 3's exponential on your clock.
**Do this:** set the loop to `range(12, 21, 4)`; change nothing else.
**You'll know it works when:**
```text
n=12: 1.2 ms   n=16: 20 ms   n=20: 320 ms    ← ×16 per four a's
```
**Where it comes from:** Chapter 3 — The Backtracking Trap.

**Lab 1.3 — One ε-closure by hand**
**Goal:** name the states Chapter 5's simulator starts with.
**Do this:** label Chapter 5's six states `s0…s5`; print `sorted(epsilon_closure({s0}))`.
**You'll know it works when:**
```text
{s0, s1, s2}    ← three states for zero input
```
**Where it comes from:** Chapter 5 — Simulating the NFA: Linear Time, Always.

## Builds

**Lab 2.1 — Teach the matcher `+`**
**Goal:** add `+` to Chapter 2's `match_here`.
**Do this:** `x+` is "one, then star" — match one `x`, then let `match_star` take the rest.
**You'll know it works when:**
```text
ten tests ✓    match('a+b', 'aaab') = True
```
**Where it comes from:** Chapter 2 — Metacharacters: The Mini-Language.

**Lab 2.2 — Break a brick**
**Goal:** prove Thompson's union brick is load-bearing.
**Do this:** delete the ε-edge into `a|b*`'s `a` branch, then simulate `"a"`.
**You'll know it works when:**
```text
True before; False after    ← ε was the only way in
```
**Where it comes from:** Chapter 4 — Thompson's Construction: Regex to NFA.

**Lab 2.3 — Race the two engines**
**Goal:** run both engines on Chapter 3's killer input, then push it.
**Do this:** Chapter 12's benchmark as printed; raise 28 a's to 30, predicting both first.
**You'll know it works when:**
```text
n=28: 4.1 s vs 0.15 ms    n=30: ~16 s vs ~0.16 ms — steps, not seconds
```
**Where it comes from:** Chapter 12 — Final Boss: The Complete Regex Engine in ~300 Lines.

**Lab 2.4 — Hand a machine to the DFA builder**
**Goal:** compile an NFA you wired yourself.
**Do this:** wire `a|b` by hand; call Chapter 6's `build_dfa(start, {"a","b"})`.
**You'll know it works when:**
```text
NFA 6 states → DFA 3 states    edges: (0,'a')→1, (0,'b')→2    accepting {1, 2}
```
**Where it comes from:** Chapter 6 — DFAs: The Subset Construction.

**Lab 2.5 — Record where each group matched**
**Goal:** make a group report its start *and* end.
**Do this:** record start on entry, end on exit, delete both on failure; groups around `a*`, `@`, `b*` read `"aaa@bb"`.
**You'll know it works when:**
```python
print(caps)     # {1: (0, 3), 2: (4, 6)} — 'aaa' and 'bb'
```
**Where it comes from:** Chapter 7 — Capture Groups & Submatches.

## Stretch goals

**Lab 3.1 — Immunize Chapter 11's validator**
**Goal:** make the endpoint safe without trusting the pattern.
**Do this:** run the payloads at `^(\w+\s?)*$`; then swap in an automata engine (Ch 10), or budget the backtracker's steps.
**You'll know it works when:**
```text
payload 40 chars: <1 ms, clean refusal    ← no doubling, no hung request
```
**Where it comes from:** Chapter 11 — Security: ReDoS — The Regex Denial of Service.

**Lab 3.2 — Hunt the DFA blowup**
**Goal:** find a pattern whose DFA dwarfs its NFA.
**Do this:** count DFA states for `a|b`, then `(a|b)*a(a|b)(a|b)`: by hand, then with `build_dfa`.
**You'll know it works when:**
```text
a|b: 3 states    (a|b)*a(a|b)(a|b): 8 states    ← one per three-character tail
"abab" True    "abba" False    ← is the third-from-last character 'a'?
```
**Where it comes from:** Chapter 6 — DFAs: The Subset Construction.

**Lab 3.3 — Add `{n,m}`**
**Goal:** support bounded repetition by rewriting it before parsing.
**Do this:** write `expand()` mapping `a{3}` to `aaa` and `a{2,}` to `aaa*`; two-sided `{n,m}` wants `?`.
**You'll know it works when:**
```text
a{2,}: 'a' False   'aa' True   'aaaaaa' True       a{3}: 'aa' False   'aaa' True
```
**Where it comes from:** Chapter 2 — Metacharacters: The Mini-Language.

**Lab 3.4 — Make it leftmost-longest**
**Goal:** feel the policy separating POSIX from the Perl family.
**Do this:** run Chapter 9's `run` and Chapter 12's `finditer` on `a|ab` over `"ab"`; then keep the last accepting position.
**You'll know it works when:**
```text
Chapter 9's backtracker: 'a'     ← the first branch satisfying the pattern
Chapter 12's engine:     'ab'    ← the last accepting position
```
**Where it comes from:** Chapter 9 — Greedy vs Lazy: Who Eats What.

## Self-checking without a grader

| Lab class | How to check it | The signal |
|---|---|---|
| Behavior | diff against the block above | exact output |
| Invariant | assert the relation | `assert dfa < nfa` |
| Complexity | double the input, re-time | flat versus doubling |
| Structure | break one piece, re-run | the answer changes |

```python
assert t2000 < 2 * t1000    # complexity: doubling n kept it linear
```

Complexity is the class people get wrong: double `n` and read the clock.

## What you now know

- **Every claim here is checkable by you**: four fields and real output.
- **The artefacts compose**: matcher → NFA → simulator → DFA → captures → engine.
- **Break code to learn**: delete a brick, watch a match vanish.
- **Complexity is measurable**: double `n`, read the clock.

Next: take the engine to the real world — Python's `re`, RE2's design doc, and Russ Cox's "Regular Expression Matching Can Be Simple And Fast"; then the family's next course: **Graphics**, **CPUs**, or **Blockchain**.
