---
layout: ../../layouts/Chapter.astro
title: 'The Engine, Assembled: Find, Search, Match All'
description: 'Parse → compile → simulate → find overlaps. Build: the complete finditer over real text.'
part: 'Part III — Beyond Matching'
written: true
---

Chapters 4–6 built the matching core for patterns anchored at a position. Real
regexes **find matches anywhere in the text** — `findall`, `search`, `finditer` —
which means running the machine at every offset (with the early-exit optimization
from Chapter 5) and reporting non-overlapping matches left to right. This chapter
assembles the complete engine: parse the pattern, build the NFA, and find all
matches in real text.

## The lie you were told

> "finditer is a loop calling match at every position."

It is — with two engineering details that make it correct and fast:

1. **Leftmost-first**: the first position with a match wins; inner positions are
   never tried (that's why the first match in "aaa" for `a` is at 0, and the scan
   resumes *after* it).
2. **Non-overlapping**: the next search starts at `start + consumed` — each match
   eats its prefix. (Lookaheads — zero-width — are the exception, Chapter 9's
   territory.)

## The pipeline, end to end

```text
pattern text ──parse──► internal form ──compile──► NFA (Ch 4)
text ──for each offset──► simulate (Ch 5) ──► first match? report + jump past it
```

The parse stage (a tiny recursive-descent parser — the compilers course, Chapter 3,
again) turns `"ab*|c"` into a tree; Thompson's construction compiles the tree to an
NFA; the simulator walks the text. Your engine is the compilers course and this
course fused.

## Prove it to yourself

**1. The three APIs, one primitive:**

```python
search(text)   = first position where the NFA matches     (early exit on success)
finditer(text) = search; report; continue after the match; repeat
match(text)    = search anchored at position 0 only       (^ implied)
# all three are the Chapter 5 simulation with different scan strategies.
```

**2. Real text, real matches:**

```python
text = "contact ada@lovelace.io or grace@hopper.mil today"
pattern = r"[a-z]+@[a-z]+\.(io|mil)"
# your engine finds both email-like matches, left to right, non-overlapping.
```

## The build: the assembled engine

```python
# engine.py — parse → NFA → finditer over real text (~60 lines)
import re as stdlib_re        # only for splitting the pattern into tokens (Ch 2's lexer role)

def parse_pattern(pattern):
    """pattern → nested ops for Thompson's construction (tag, char, branches)"""
    tokens = stdlib_re.findall(r"[a-z0-9]|\*|\||\(|\)", pattern)
    def parse_alt(i):                                # alternation: lowest precedence
        branches = [parse_concat(i)]
        while i < len(tokens) and tokens[i] == "|":
            i += 1; branch, i = parse_concat(i); branches.append((branch, i))
        return branches, i
    # (full recursive descent = the compilers course, Ch 3 — abridged for alternation)
    ...
```

The full assembled engine — with `|` splicing, `.` and classes — follows the
chapter's build pattern from Chapters 4–5; its `finditer` loop is the point:

```python
def finditer(self, text):
    pos = 0
    while pos <= len(text):
        matched, end = self.simulate_from(text, pos)     # Ch 5: NFA sim from offset pos
        if matched:
            yield text[pos:end]                          # the match, leftmost
            pos = end if end > pos else pos + 1          # non-overlapping (Ch 9: greedy)
        else:
            pos += 1                                     # try the next offset
```

That six-line loop is `re.finditer` — leftmost matches, non-overlapping, early
failure per offset (the empty-set exit from Chapter 5). Run it over real text and
compare with Python's `re.findall` on the same pattern: identical output.

## What you now know

- The complete engine: **parse → compile → NFA → per-offset simulation**, leftmost
  and non-overlapping.
- `search`/`match`/`finditer` are scan strategies over the same simulation — one
  primitive, three APIs.
- The engine fuses the compilers course (parsing) with this course (automata) —
  your toolchain builds your toolchain.

Next: `.*` eats everything; `.*?` eats nothing. Greedy vs lazy — the preference
order that decides who eats what, implemented as backtracking direction.
