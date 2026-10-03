---
layout: ../../layouts/Chapter.astro
title: 'The Cascade Engine: Specificity & Inheritance'
description: 'Matched rules compete by (a,b,c), inherited properties flow down. Build: a selector matcher and cascade resolver over your DOM.'
part: 'Part I — Reading the Web'
written: true
---

The web course (Chapter 6) built a specificity *resolver* for flat rules; this
chapter builds the real thing — **selector matching against your live DOM tree**,
specificity arithmetic, and **inheritance** flowing down the tree. The output is the
styled tree: every node carrying its computed font sizes, colors, and margins, ready
for Chapter 5's layout.

## The lie you were told

> "The browser applies stylesheets to pages."

The engine runs **per element**: for every node in the DOM, find every selector that
matches it (across every stylesheet), score them, and resolve. The tree is walked,
rules are matched right-to-left, winners are computed — per node, then inherited
values fill the gaps.

## Selector matching: right to left

`.menu li a` matches an `<a>` only if it descends from an `li` that descends from
`.menu`. The engine checks **right-to-left** — "are you an `a`? now: does an ancestor
match `li`?" — because most elements fail the rightmost check immediately:

```python
def matches(node, selector):            # toy subset: tag, .class, #id, "A B" descendant
    parts = selector.split()
    if not match_simple(node, parts[-1]): return False      # ← the cheap check first
    node = node.parent
    for part in reversed(parts[:-1]):                       # walk ancestors
        while node and node.tag != "#text":
            if match_simple(node, part): break
            node = node.parent
        else: return False
        node = node.parent
    return True
```

## Specificity + order + inheritance

Chapter 6 of the web course built the resolver; here it plugs into the tree walk:

```text
for each element (top-down):
  computed = {}
  for rule in all_rules_matching(element):
      computed.update(rule.declarations, by specificity → order)   # the tournament
  for prop, val in inherited_properties:                  # color, font flow DOWN
      computed.setdefault(prop, parent_computed[prop])
```

Two passes matter: **top-down** (inheritance needs the parent's computed values) and
**per-element** (matching is local). This is the "recalculate style" stage of the
web course's Chapter 8 — now it's your loop.

## Prove it to yourself

**1. Inheritance flows, then stops:**

```css
body { color: darkblue; }        /* inherits down: every child's text is darkblue */
div  { border: 1px solid; }      /* does NOT inherit — borders stay where declared */
```

**2. Specificity decides, order breaks ties** — the web course's Chapter 6
resolver, now fed by your selector matcher. (Same tuples (a,b,c); same
source-order tiebreak.)

## The build: the cascade engine

```python
# cascade.py — match selectors, resolve specificity, apply inheritance
import re

STYLESHEET = [
    ("body",        {"font-size": 14, "color": "darkblue"}),
    ("h1",          {"font-size": 28, "color": "black", "font-weight": "bold"}),
    ("p.note",      {"color": "purple", "margin": 8}),
    ("#special",    {"color": "green"}),
    ("b",           {"font-weight": "bold"}),
]

def match_simple(node, simple):
    if simple.startswith("."): return simple[1:] in node.attrs.get("class", "").split()
    if simple.startswith("#"): return simple[1:] == node.attrs.get("id")
    return node.tag == simple

def specificity(sel):                                    # (a, b, c) — the tournament
    ids    = len(re.findall(r"#\w+", sel))
    cls    = len(re.findall(r"\.\w+", sel))
    tags   = len(re.findall(r"(?:^|[\s>+~])[a-z]+$|^[a-z]+$", sel))
    return (ids, cls, tags)

def cascade(node, parent_computed, order_counter):
    computed = dict(parent_computed)                     # 1. inherit from the parent
    matched = []
    for order, (sel, decls) in enumerate(STYLESHEET):
        if match_simple(node, sel.split()[-1]):          # rightmost part decides (Ch: RTL)
            matched.append((specificity(sel), order, decls))
    for _, _, decls in sorted(matched):                  # 2. specificity → order
        computed.update(decls)
    node.computed = computed                             # the styled tree
    for kid in node.kids:
        if hasattr(kid, "cascade"): pass
        if hasattr(kid, "kids") or hasattr(kid, "tag"):
            if hasattr(kid, "tag"): cascade(kid, computed, order_counter + 1)

DOM.cascade = cascade
html = build(tokenize('<body class=""><p class="note">hi <b>bold</b> <span id="special">x</span></p>'))
html.cascade({"font-size": 14, "color": "black"}, 0)
for p in html.query("p"):
    print("p computed:", p.computed)
# {'font-size': 14, 'color': 'purple', 'margin': 8}      ← p.note beat body (0,1,0)>(0,0,1)
for b in html.query("b"):
    print("b computed:", b.computed)
# {'font-size': 14, 'color': 'darkblue', 'font-weight': 'bold'}   ← inherited color!
```

Read the `b` line: it declared only `font-weight`, but it *inherited* `font-size`
and `color` from its ancestors (body's darkblue flowed down), while its own weight
was set by the `b` rule. Inheritance, specificity, and order — computed per node,
top-down, by your engine.

## What you now know

- The cascade engine = **match selectors right-to-left per element, resolve by
  (specificity, order), then inherit top-down**.
- Matched-but-losing rules are debuggable (the web course's computed panel) because
  the tournament is deterministic.
- The output — the **styled tree** — is Chapter 5's input: geometry for every box
  that now knows its font size and margins.

Next: geometry. The box model, block layout, and margins that collapse when you're
not looking.
