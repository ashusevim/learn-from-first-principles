---
layout: ../../layouts/Chapter.astro
title: 'Real Engine Internals: PCRE vs RE2'
description: 'Backtracking (PCRE, Python) vs automata (RE2, Go/Rust): two philosophies, one guarantee difference.'
part: 'Part IV — The Real World'
written: true
---

Your course built **both** engine families. This chapter names them, compares their
designs, and shows where each lives in the tools you use: Python's `re` and PCRE are
backtracking engines (Chapter 7's threaded design); Go's `regexp`, Rust's `regex`,
and RE2 are automata engines (Chapters 4–6's construction and simulation). The
feature lists differ *because* the engines differ — now you can derive the feature
lists.

## The lie you were told

> "All regex engines are equivalent, just faster or slower."

They're different *machines* with different guarantee classes:

```text
BACKTRACKING (Python re, PCRE, Perl, JS):        AUTOMATA (RE2, Go regexp, Rust regex):
  + captures, backreferences, lookaround          + LINEAR TIME GUARANTEE — cannot hang
  + richer syntax                                 + safe on untrusted input
  − exponential worst case (Ch 3's ReDoS)         − no backreferences, limited lookaround
  − per-match bookkeeping costs                   − captures are the hard part (Ch 7)
```

The automata family gives up features to buy **the linear-time guarantee** — the
exact trade Chapter 5 proved possible and Chapter 7 showed the cost of. RE2's design
doc says it plainly: "we do not support backreferences because they would require
backtracking."

## The design decisions, derived

| Feature question | Backtracking answer | Automata answer |
|---|---|---|
| Captures? | record on the recursion stack (Ch 7) | threaded state sets (Pike VM) — costly |
| Backreferences `\1`? | trivial: compare captured text | **impossible**: requires remembering the captured text per path — kills the state-set model |
| Lookaround? | natural: pause, sub-match, resume | limited (lookahead via state intersection) |
| Worst case? | exponential (Ch 3) | linear (Ch 5) |

The **backreference row is the watershed**: a pattern like `(a+)\1` requires
comparing against *what was captured earlier on this specific path* — automata
states can't carry per-path history without exploding. RE2 refuses the feature; PCRE
accepts the risk. Neither is wrong — they bought different guarantees.

## Prove it to yourself

**1. The guarantee, demonstrated:**

```python
import re, time
evil = "(a+)+b"
text = "a" * 28 + "!"
t = time.time()
try:
    re.match(evil, text)                        # Python: backtracking
except: pass
print(f"python re: {time.time()-t:.2f}s")        # seconds — and doubling per 'a'
# (Go's regexp or Rust's regex on the same input: microseconds, ALWAYS.)
```

**2. The feature gap, demonstrated:**

```python
import re
print(re.match(r"(a+)\1", "aaaa").groups())      # backreference: Python has it
# Go's regexp: compiles with an error — "invalid or unsupported Perl syntax: \1"
# the feature that breaks the linear-time guarantee is exactly the one RE2 omits.
```

## What you now know

- Two families: **backtracking** (features, exponential worst case) vs **automata**
  (linear guarantee, fewer features) — you built one of each in this course.
- **Backreferences are the feature that forces backtracking** — per-path history is
  incompatible with set-of-states simulation.
- The choice is per-use-case: untrusted input (user-supplied patterns) → automata;
  trusted patterns needing captures/backrefs → backtracking, carefully.
- ReDoS (Chapter 11) is the backtracking family's invoice — next chapter, the full
  attack.
