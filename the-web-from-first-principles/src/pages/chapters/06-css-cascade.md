---
layout: ../../layouts/Chapter.astro
title: 'CSS: Selectors, Specificity & the Cascade'
description: 'How one winning style emerges from ten rulesheets. Build: a specificity resolver that predicts every winner.'
part: 'Part II — The Document'
written: true
---

Chapter 5 produced a tree of bare nodes. CSS dresses it — and "CSS is unpredictable"
is the most disprovable claim in frontend. For any element and any set of rules, the
winner is **deterministic arithmetic**: parse selectors, score specificity as a
three-number tuple, sort by origin/importance, break ties by source order. Build the
resolver and `!important` wars, framework specificity anxieties, and "why didn't my
style apply" all become predictable.

## The lie you were told

> "CSS resolves conflicts by vibes and load order."

Every declaration competes in a **tournament with published rules**, in strict order:

```text
1. ORIGIN & IMPORTANCE:  transitions < UA styles < user < AUTHOR < AUTHOR !important
                         < user !important < transition overrides
2. SPECIFICITY (within same origin/importance): compare (a, b, c)
     a = # of ID selectors        (#nav        → 1,0,0)
     b = # of class/attr/pseudo-class (.btn, [href], :hover → 0,1,0)
     c = # of element/pseudo-element (div, ::before → 0,0,1)
     compare left-to-right: (1,0,0) beats (0,99,99). Always.
3. SOURCE ORDER: still tied? the LAST one in the stylesheet wins.
```

That's the cascade. Inline `style="..."` counts as (1,0,0,0) — above every selector,
below `!important`. Inheritance is a *separate* axis: some properties (color, font)
flow down the tree when unspecified; most (border, margin) don't.

## The selector-matching subtlety

Specificity is computed per **compound selector**, and matching walks *right-to-left*:
`.menu li a` first asks "are you an `a`?" then "a `li` ancestor?" then "`.menu`
ancestor?" — right-to-left is cheaper when most elements are excluded early. (Why
"keep selectors short" is a performance tip: fewer ancestor hops per element, for
every element × every rule — Chapter 8's style recalc cost.)

## Prove it to yourself

**1. The tournament, watched live** — DevTools → Elements → Styles: every conflicting
rule is listed, struck-through losers visible, winner on top *with its specificity
shown on hover*. The inspector is the resolver's debug output.

**2. The tuple beats the pile:**

```css
/* (0,0,1) */  div { color: red; }
/* (0,1,0) */  .note { color: blue; }
/* (1,0,0) */  #special { color: green; }
/* (0,0,1) later in the file */  div { color: purple; }
```

`<div id="special" class="note">` → **green**. Source order only decides between
*equal* specificity; purple's lateness can't out-argue the ID.

**3. The !important escape hatch — and its trap:**

```css
.note { color: blue !important; }
#special { color: green; }        /* loses now: author!important > author-normal */
```

`!important` flips origin priority — so each `!important` you add forces the next one,
until the sheet is a wall of them (utility frameworks manage this by *having zero
specificity*: single classes, all (0,1,0), order decides — the actual design insight
behind Tailwind).

## The build: a specificity resolver that predicts every winner

```python
# cascade.py — parse selectors, score specificity, resolve conflicts deterministically
import re

def specificity(selector):
    """(a, b, c) — the tournament score, per the CSS spec's grammar."""
    a = len(re.findall(r"#[\w-]+", selector))                    # IDs
    b = len(re.findall(r"\.[\w-]+|\[[^\]]+\]|:[\w-]+", selector))# classes, attrs, pseudo-classes
    c = len(re.findall(r"(?:^|[\s>+~])[a-z]+|::[a-z-]+", selector))  # elements, pseudo-elements
    return (a, b, c)

def resolve(stylesheet, element_matches):
    """stylesheet: [(selector, prop, value, important, order)]
       element_matches: which selectors apply to OUR element"""
    candidates = [(specificity(sel), order, prop, val, imp)
                  for sel, prop, val, imp, order in stylesheet
                  if sel in element_matches]
    winners = {}
    # tournament sort: importance → specificity → source order (later wins)
    for spec, order, prop, val, imp in sorted(
            candidates, key=lambda t: (t[4], t[0], t[1])):
        winners[prop] = val
    return winners

sheet = [
    ("div",       "color", "red",    False, 0),   # (0,0,1)
    (".note",     "color", "blue",   False, 1),   # (0,1,0)
    ("#special",  "color", "green",  False, 2),   # (1,0,0)
    ("div",       "color", "purple", False, 3),   # (0,0,1) later — still loses to (1,0,0)
    (".note",     "color", "gold",   True,  4),   # (0,1,0) !important — beats the ID
]
element = {"div", ".note", "#special"}             # our element matches all four

print(resolve(sheet, element))
# {'color': 'gold'}  ← !important author beats ID, exactly per the origin table
element2 = {"div", ".note"}                        # without the id:
print(resolve([r for r in sheet if r[0] != "#special"], element2))
# {'color': 'gold'} — and without the !important, it would be 'blue': (0,1,0) > (0,0,1)
```

Every output is predictable *before* running — that's the point. Feed it real
stylesheets and real element classes, and it calls DevTools' computed panel in advance.

## What you now know

- The cascade is **published arithmetic**: origin/importance → specificity (a,b,c) →
  source order. Nothing else.
- Specificity is a **tuple comparison**, not a number: (1,0,0) > (0,99,99).
- `!important` flips the origin layer; utility frameworks dodge the whole war by
  staying at (0,1,0).
- Matching walks **right-to-left**; short selectors are a *style-recalc performance*
  decision (Chapter 8 prices it).

Next: the styled tree meets JavaScript — one thread, a task queue, microtasks jumping
the line. The concurrency course returns wearing a DOM.
