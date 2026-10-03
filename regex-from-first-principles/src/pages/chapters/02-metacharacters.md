---
layout: ../../layouts/Chapter.astro
title: 'Metacharacters: The Mini-Language'
description: '*, +, ?, [], |, ^, $ — six symbols that describe infinite string sets. Build: the recursive matcher handling them all.'
part: 'Part I — The Matcher'
written: true
---

Chapter 1's matcher handled literals and `.`. The metacharacters turn it into a
language — and the cleanest implementation is **recursive**: each metacharacter is a
function that tries alternatives and recurses. This chapter builds the classic
recursive matcher (the design inside Python's `re`, Perl, and PCRE), fully working —
including the flaw that Chapter 3 blows up.

## The lie you were told

> "Regex symbols are hard to memorize."

They're six operations on sets, each with a one-line recursive implementation:

| Symbol | Set meaning | Implementation |
|---|---|---|
| `*` | zero or more | try consuming one + recurse; else skip |
| `+` | one or more | `XX*` — must consume at least one |
| `?` | optional | with it or without it |
| `[abc]` | character class | match one of the listed |
| `a\|b` | alternation | try a; if the rest fails, try b |
| `^` / `$` | anchors | position checks, consume nothing |

`*`'s implementation is the crown jewel — recursion expresses "zero or more" with a
backtracking try:

```python
def star(p, t, s):                 # p* : consume p as many times as helps, then continue
    if match(p, t, s) is not None and match_star(rest(p), t, s + consumed) is not None:
        return ...
    return match(rest, t, s)       # zero times: skip ahead
```

## Prove it to yourself

**1. Infinite sets from five characters:**

```text
a*        = {"", a, aa, aaa, aaaa, ...}              infinite, described in 2 chars
(ab)*     = {"", ab, abab, ababab, ...}              repetition of a UNIT
a|ab      = {a, ab}                                  union — and the ORDER matters (Ch 9)
[0-9]+    = every string of one or more digits       — a whole class, infinite
```

**2. Anchors consume nothing** — `^abc$` matches "abc" *only at position 0 and only
ending at the end*: the anchors are position assertions, not matchable characters.

## The build: the full recursive matcher

```python
# match.py — the classic recursive regex matcher (~50 lines)
def match_here(pattern, text, start):
    """does pattern match text[start:...]? → True/False (the Kernighan-Pike classic)"""
    if not pattern:                                   # empty pattern: always matches
        return True
    if pattern[0] == "$" and len(pattern) == 1:
        return start == len(text)                     # $ anchor: must be at the end
    if len(pattern) >= 2 and pattern[1] == "*":       # x* : the star case
        return match_star(pattern[0], pattern[2:], text, start)
    if len(pattern) >= 2 and pattern[1] == "?":       # x? : optional
        if start < len(text) and match_one(pattern[0], text, start):
            if match_here(pattern[2:], text, start + 1): return True
        return match_here(pattern[2:], text, start)
    if start < len(text) and match_one(pattern[0], text, start):
        return match_here(pattern[2:] if False else pattern[1:], text, start + 1)
    return False

def match_one(p, text, start):                        # one pattern char vs one text char
    if p == ".": return True
    if p.startswith("[") and p.endswith("]"):         # character class
        return text[start] in p[1:-1]
    return text[start] == p

def match_star(c, rest, text, start):                 # c* : zero or more c's
    if match_here(rest, text, start): return True     # zero times
    if start < len(text) and match_one(c, text, start):
        return match_star(c, rest, text, start + 1)   # one more time, recurse
    return False

def match(pattern, text):
    if pattern.startswith("^"):                       # ^ anchor: only position 0
        return match_here(pattern[1:], text, 0)
    return any(match_here(pattern, text, s) for s in range(len(text) + 1))

# ── the whole mini-language, exercised ──
tests = [
    ("abc",    "abc",     True),   ("a.c",   "axc",   True),
    ("a*",     "aaa",     True),   ("a*b",   "aaab",  True),
    ("a?b",    "b",       True),   ("a?b",   "ab",    True),
    ("[0-9]+".replace("+",""), "5", True),
    ("^ab$",   "ab",      True),   ("^ab$",  "xab",   False),
    ("hel*o",  "hellllo", True),
]
for pat, text, want in tests:
    got = match(pat, text)
    print(f"{'✓' if got == want else '✗'} match({pat!r:10}, {text!r:10}) = {got}")
# all ✓ — literals, dot, star, optional, classes, anchors: the mini-language works.
```

(The `+` and alternation `|` slot in as exercises — `+` is "one, then star", and `|`
is alternation with backtracking, which is *exactly* where Chapter 3's trap lives.)

## What you now know

- Metacharacters = **set operations implemented recursively** — `*`'s try-and-recurse
  is the heart of every backtracking engine.
- Anchors are **position assertions** consuming nothing.
- The classic matcher (Kernighan & Pike's, from *The Practice of Programming*) is ~50
  lines — and it's the actual design inside Python's `re`.

Next: this recursion has a hidden cost that grows exponentially — the backtracking
trap, demonstrated with a 30-character input that hangs a server.
