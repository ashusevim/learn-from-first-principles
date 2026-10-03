---
layout: ../../layouts/Chapter.astro
title: 'Greedy vs Lazy: Who Eats What'
description: 'Why .* grabs everything and .*? grabs nothing — preference order, not magic. Build: both behaviors side by side.'
part: 'Part III — Beyond Matching'
written: true
---

`<.*>` on `<a><b>` matches the whole string; `<.*?>` matches just `<a>`. Same
pattern, one extra character, completely different results. The difference isn't a
mode — it's the **order in which the backtracking engine tries alternatives**
(Chapter 7's give-back loop direction). Greedy tries "more" first; lazy tries "less"
first. This chapter demonstrates both and explains why the classic HTML-parsing
regex fails.

## The lie you were told

> "`.*?` is 'non-greedy dot star' — a special mode."

`.*?` is the same `.*` with the **trial order reversed**: lazy first tries *zero*
repetitions and grows only if forced (the rest of the pattern failing pushes it to
grow). Greedy first tries *maximum* and gives back only if forced. Both backtrack —
they just backtrack in opposite directions. The concurrency course's Ch 7 event
order, applied to preference.

## The mechanics, in the backtracking engine

```text
greedy "a*":     loop: consume a's to the max → try the rest → give back one, retry...
lazy   "a*?":    try zero a's → try the rest → consume one, retry...
```

The `while` direction in Chapter 7's star implementation flips. Everything else —
the recursion, the captures, the backtracking — is identical.

## Prove it to yourself

**1. The classic failure, explained:**

```python
import re
text = "<a><b>"
print(re.findall(r"<.*>", text))    # ['<a><b>']  ← greedy: .* ate to the LAST '>'
print(re.findall(r"<.*?>", text))   # ['<a>', '<b>'] ← lazy: .*? ate to the FIRST '>'
# the HTML-parsing lesson: .* grabs the widest span containing the pattern;
# .*? grabs the narrowest. For "extract tags", lazy is (almost always) what you meant.
```

**2. The preference order, forced:**

```python
print(re.match(r"a|ab", "ab").group())   # 'a' — alternation prefers the LEFT branch
# (and if 'a' alone satisfies the whole regex, 'ab' is never tried: Ch 7's order!)
```

**3. The zero-width subtlety** — `a*?` can match the empty string: laziness means it
tries zero repetitions *first*, and if the rest matches, done. That's why lazy
quantifiers at the end of a pattern often match less than you expect.

## The build: both orders in your engine

```python
# greedy.py — the star's two directions (Chapter 7's engine, two variants)
import sys
sys.setrecursionlimit(100000)

def match_here(pattern, text, start, greedy=True):
    if not pattern: return True, start
    kind, val = pattern[0]
    if kind == "star":
        # how far can it go?
        limit = start
        while limit < len(text) and char_matches(val, text, limit):
            limit += 1
        order = (range(limit, start - 1, -1) if greedy      # greedy: max first, give back
                 else range(start, limit + 1))              # lazy:   min first, grow
        for pos in order:
            ok, end = match_here(pattern[1:], text, pos, greedy)
            if ok: return True, end
        return False, start
    if start < len(text) and char_matches(val, text, start):
        ok, end = match_here(pattern[1:], text, start + 1, greedy)
        if ok: return True, end
    return False, start

def char_matches(val, text, i):
    return text[i] == val          # (toy: single-char atoms)

def run(pattern, text, greedy):
    ok, end = match_here(pattern, text, 0, greedy)
    return text[0:end] if ok else None

p = [("char", "<"), ("star", "."), ("char", ">")]
print("greedy:", run(p, "<a><b>", greedy=True))   # <a><b>
print("lazy:  ", run(p, "<a><b>", greedy=False))  # <a>
# the SAME pattern list; the loop direction in the star's backtrack chose the span.
```

The two calls differ by **one boolean** — the direction of the give-back loop. This
is the cleanest demonstration in the course that "greedy" and "lazy" are
*implementation order*, not semantics.

## What you now know

- Greedy vs lazy = **trial order in backtracking**: max-first vs min-first — one
  loop direction.
- The HTML-tag lesson: `.*>` grabs to the last `>`, `.*?>` to the first — lazy is
  "narrowest match", greedy is "widest".
- Leftmost alternation (Chapter 2's `a|ab`) is the same preference principle at the
  alternation operator: try branches left to right.
- Preference order is *defined by the engine* (POSIX actually requires leftmost-
  longest; Perl-family prefers leftmost-greedy) — engines differ here, legally.

Next: the two engine families that embody all of this — backtracking PCRE versus
automata RE2 — and the guarantee that separates them.
