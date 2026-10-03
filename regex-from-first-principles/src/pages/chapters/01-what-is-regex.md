---
layout: ../../layouts/Chapter.astro
title: 'What Is a Regex, Really?'
description: 'A tiny language for describing sets of strings — matched by recursion. Build: the naive matcher for literals and the dot.'
part: 'Part I — The Matcher'
written: true
---

A regular expression is a **tiny language whose sentences describe sets of strings**.
`a` describes {a}; `a*` describes infinite strings of a's; `a|b` describes {a, b}.
The matching question — "does this string fit this description?" — is answered by an
engine, and this course builds the engine twice: first the naive recursive version
(which every mainstream language actually uses), then the automata-based version
theory promises (which almost nobody uses, and which Chapter 11 shows you need).

## The lie you were told

> "Regex is a search tool."

Regex is a **language for describing regular languages** — sets of strings with a
precise mathematical boundary (Chapter 4's NFAs make the boundary literal). Search
is one application; lexers (the compilers course, Chapter 2!), input validation, and
log parsing are others. The engine's job: given a pattern and a string, decide
membership — and tell you *where*.

## The problem, stated precisely

Match a pattern against a string **at a position**: does the pattern consume exactly
the string's next characters?

```text
match("a", "abc", 0) → true, consumed 1 char   ("a" matches, 1 character left over: fine)
match("ab", "abc", 0) → true, consumed 2
match("b", "abc", 0) → false
```

The full `re.search` semantics: try every starting position until one matches.
Everything else — `*`, `|`, groups — builds on this primitive.

## Prove it to yourself

**1. Regex is already everywhere you looked:**

```text
the compilers course, Ch 2:  the lexer IS a regex matcher — tokens are patterns
the web course, Ch 5:        the HTML tokenizer's tag names — regex-shaped rules
grep, sed, awk:              the original regex consumers (Ken Thompson built BOTH
                             grep and the first regex matcher, in one editor, in 1968)
```

**2. The set intuition** — every pattern is a set of strings, and operators transform
sets: `ab` = concatenation, `a|b` = union, `a*` = infinite repetition. Describing
infinite sets in 5 characters is the superpower.

## The build: the naive matcher

```python
# naive.py — match(pattern, text, start) → consumed length or None
def match_literal(pattern, text, start):
    """match 'literal chars' at start; return chars consumed or None"""
    n = 0
    while start + n < len(text) and n < len(pattern) and text[start + n] == pattern[n]:
        n += 1
    return n if n == len(pattern) else None

def match(pattern, text, start=0):
    """handles literal chars + '.' (any char)"""
    n = 0
    while n < len(pattern):
        if start + n >= len(text): return None           # pattern ran past the text
        if pattern[n] == "." or pattern[n] == text[start + n]:
            n += 1                                       # '.' matches anything
        else:
            return None                                  # mismatch
    return n

print(match("abc", "xabcx", 1))    # 3 — matched at offset 1
print(match("a.c", "abc", 0))      # 3 — '.' matched 'b'
print(match("ab", "abc", 0))       # 2
```

Twenty lines and the core primitive works — literally matching and the wildcard dot.
Every metacharacter in Chapter 2 extends this same function.

## What you now know

- Regex = **a language describing string sets**; matching = set membership at a
  position, consuming a prefix.
- The engine's primitive: `match(pattern, text, start) → consumed or None` — every
  future feature layers onto it.
- Thompson built grep AND the regex matcher in 1968 — this course rebuilds both.

Next: six symbols — `*`, `+`, `?`, `[]`, `|`, `^`, `$` — turn the matcher into a
mini-language. The recursion that handles them all, and the flaw it carries.
