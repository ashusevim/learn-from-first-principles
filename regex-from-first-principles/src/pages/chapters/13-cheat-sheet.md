---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Regex on One Page'
description: 'The mini-language, the automata and the engines on one page — the model, the operators, and the trap that costs you.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course on one page: the model, the operators, the two engine families, and
the failures behind real outages. Read the model once, then jump to the row that
matches your problem — every row cites the chapter that earned it.

## The one-page model

```text
pattern ──parse──► ops ──Thompson (Ch 4)──► NFA ──set-of-states sim (Ch 5)──► match (Ch 8)
                                              └── subset construction (Ch 6) ─► DFA: one lookup per char
```

A regex is **a description of a set of strings** (Chapter 1); matching is membership at
an offset. Two machines decide it: an NFA walked with a *set* of states (linear, always
— Chapter 5), and a DFA that precomputes those sets into table lookups (Chapter 6). The
recursive matcher you meet first (Chapter 2) decides the same language by *choosing and
un-choosing* paths — the reason it can go exponential (Chapter 3). **Every row below
follows from those four sentences.**

## The regex you actually use

| Operator | Meaning | In practice |
|---|---|---|
| `abc` | literals: those exact characters, in order | `at` matches "at" |
| `.` | any one character | `a.c` matches "abc" |
| `*` | zero or more of the preceding unit | `ab*` matches "a" and "abbb" |
| `+` | one or more — `XX*` (Ch 2) | `a+` matches "a" and "aaa" |
| `?` | zero or one | `colou?r` matches both spellings |
| `{n,m}` | bounded repetition | `a{2,4}` matches "aa"…"aaaa" |
| `[...]` | class of one character; `[^...]` negates | `[0-9]`, `[^"]` |
| `A\|B` | alternation; the left branch is preferred (Ch 9) | `cat\|dog` |
| `^` `$` | anchors: position tests, consuming nothing (Ch 2) | `^ab$` matches only "ab" |
| `\d` `\w` `\s` | digit, word character, whitespace | `\w+@\w+` |
| `(...)` | capture group: records start and end (Ch 7) | `(\w+)@(\w+)` |
| `x*?` | lazy: fewest repetitions first (Ch 9) | `<.*?>` |
| `x*+` `(?>…)` | possessive and atomic: no give-back (Ch 11) | PCRE only |
| `\1` | backreference to a capture — forces a backtracker (Ch 10) | `(a+)\1` matches "aaaa" |
## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| `(a+)+b` on an input that fails | ambiguous repetition × failure = 2^n paths; seconds become years | Chapter 3 |
| A user-supplied pattern on a backtracker | ReDoS: ~30 characters freeze a server (Cloudflare, 2019) | Chapter 11 |
| `.*` where you meant "up to the first" | greedy eats to the last delimiter: `<.*>` gives `<a><b>` | Chapter 9 |
| Expecting captures from an automata engine | linear engines limit captures and refuse backreferences | Chapters 7, 10 |
| Writing `\1` and hoping RE2 compiles it | "invalid or unsupported Perl syntax" — per-path history kills the state set | Chapter 10 |
| Assuming every engine prefers the same match | POSIX wants leftmost-longest; the Perl family wants leftmost-greedy | Chapter 9 |
| Treating `^` and `$` as characters | position assertions: `^ab$` fails on "xab" | Chapter 2 |
| Assuming the DFA is always the smaller machine | the subset construction is worst-case 2^n states | Chapter 6 |

## When to use what

| Decision | Reach for | Unless |
|---|---|---|
| Untrusted input, user-supplied patterns | an automata engine — RE2, Go `regexp`, Rust `regex` (Ch 5) | you need backreferences → a backtracker with a timeout (Ch 11) |
| Captures and submatches | a backtracking engine — Python `re`, PCRE (Ch 7) | leftmost-longest suffices and you want the guarantee |
| One pattern, huge inputs | compile to a DFA once, then table lookups (Ch 6) | the pattern changes per request → simulate the NFA (Ch 5) |
| A suspicious pattern you must keep | possessive quantifiers and atomic groups (Ch 11) | the input is untrusted → change the engine, not the pattern |
| Finding every match in text | the `finditer` loop: leftmost, non-overlapping (Ch 8) | you want overlaps → step a character, not a match (Ch 9) |

## Prove it to yourself

**1. A pattern describes a set, not a search:**

```python
import re
print(re.fullmatch(r"a*", "aaaa"))    # a Match — one pattern, infinitely many strings
print(re.fullmatch(r"a*", "aab"))     # None — "aab" is not in the set (Ch 1)
```

**2. One character flips the trial order:**

```python
import re
print(re.findall(r"<.*>", "<a><b>"))    # ['<a><b>'] — to the LAST '>' (Ch 9)
print(re.findall(r"<.*?>", "<a><b>"))   # ['<a>', '<b>'] — to the FIRST
```

**3. The blowup multiplies by sixteen:**

```python
import re, time
for n in (12, 16, 20):                        # +4 a's ≈ ×16, i.e. 2^n (Ch 3)
    t = time.time()
    re.match(r"(a+)+b", "a" * n + "!")        # the final character makes the match fail
    print(n, f"{time.time() - t:.3f}s")
```

Observed: `0.001s`, `0.020s`, `0.320s`. The automata engine rates all three flat (Chapter 5).

## What you now know

- **A regex is a set description**; matching is membership at an offset.
- **Two families, one trade**: backtracking buys features with an exponential worst case; automata buy the linear guarantee.
- **The blowup is a shape**: repetition inside repetition over a shared alphabet, plus an input that fails.
- **Greedy and lazy are trial order** — one loop direction, backwards.
- **The defense is the engine**, because the input belongs to the attacker.

Next: twelve labs that turn this page into muscle memory.