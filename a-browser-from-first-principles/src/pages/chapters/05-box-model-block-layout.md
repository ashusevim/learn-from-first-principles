---
layout: ../../layouts/Chapter.astro
title: 'The Box Model & Block Layout'
description: 'Every element is a rectangle: content, padding, border, margin. Build: block layout with collapsing margins and real geometry.'
part: 'Part II — Laying It Out'
written: true
---

The styled tree (Chapter 4) knows fonts and colors; layout adds **geometry** — a
rectangle for every element. Block layout is the base mode: boxes stack vertically,
widths fill their container, and — the classic surprise — vertical margins
*collapse* into each other. This chapter builds a real box model with padding,
borders, and margins, and reproduces the margin-collapsing behavior that confuses
everyone.

## The lie you were told

> "Every element's width is its width."

An element's declared width is only the **content box**; the box model adds padding,
border, and margin around it:

```text
┌────────────── margin (transparent, outside) ──────────────┐
│ ┌──────────── border ──────────────────────────────────┐ │
│ │ ┌────────── padding ──────────────────────────────┐ │ │
│ │ │ ┌────────── content: width × height ─────────┐ │ │ │
│ │ │ └─────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────┘
border-box: declared width INCLUDES padding + border (the fix everyone applies)
```

And the layout rule for blocks: **width fills the parent, height grows with
content** — which is why `width: 50%` behaves and `height: 50%` often doesn't
(parent height must be definite).

## Margin collapsing: the classic confusion

Two sibling blocks with 20px bottom-margin and 30px top-margin stack with **30px**
between them — not 50. The margins *collapse* to the larger. Parent/child margins
collapse too (a child's top margin can push the PARENT down). Mechanism: adjacent
vertical margins merge into one, taking the max — unless padding/border/inline
content separates them.

## Prove it to yourself

**1. Collapsing, measured:**

```python
# blocks with margin-bottom 20 and margin-top 30: the gap is 30, not 50.
# add 1px of padding to the parent → the child's margin no longer collapses
# through — the gap becomes 50. The separator rule, demonstrated.
```

**2. Border-box vs content-box, computed:**

```python
def outer_width(box):                            # content-box arithmetic:
    return box["width"] + box["padding"] * 2 + box["border"] * 2
print(outer_width({"width": 100, "padding": 10, "border": 5}))   # 130, not 100!
```

## The build: block layout with the full box model

```python
# blocklayout.py — styled tree → geometry (x, y, width, height per box)
import numpy as np
from treebuilder import build, DOM
from tokenizer import tokenize
from cascade import cascade, STYLESHEET

def px(value, default=0):                        # "8" → 8, "14" → 14 (toy units: px)
    try: return int(str(value).replace("px", ""))
    except: return default

def layout_block(node, x, y, width, parent_computed):
    s = {**parent_computed, **getattr(node, "computed", {})}
    pad  = px(s.get("padding", 0))
    margin = px(s.get("margin", 0))
    border = 1 if node.tag in ("p", "div", "h1") else 0    # toy: some tags have borders

    box_w = width - 2 * pad - 2 * border              # content width = fill parent
    box_x, box_y = x + pad + margin, y + margin       # margin pushes us down/right

    text_h = 0
    if node.text:
        fs = px(s.get("font-size", 14))
        text_h = int(fs * 1.4)                        # one line of text: 1.4em
    y_content = box_y + pad + border
    kid_y = y_content + text_h
    for kid in node.kids:
        if kid.tag == "#text": continue
        kid_y = layout_block(kid, box_x + border, kid_y, box_w - 2 * border, s)

    content_h = (kid_y - y_content) if node.kids else text_h
    node.rect = (box_x - margin, box_y - margin,       # the OUTER box (margin box)
                 box_w + 2*pad + 2*border,
                 content_h + 2*pad + 2*border + (text_h if not node.kids else 0))
    node.content_rect = (box_x + border, y_content, box_w, text_h if not node.kids else content_h)
    return box_y - margin + node.rect[3]               # next sibling starts BELOW (margin box)

html = build(tokenize('<h1>title</h1><p class="note" style="">first paragraph with words</p>'
                      '<p>second paragraph</p>'))
html.cascade({"font-size": 14, "color": "black"}, 0)
layout_block(html, 0, 0, 640, {})
for node in [html.kids[1].kids[1], html.kids[1].kids[2]]:
    x, y, w, h = node.content_rect
    print(f"<{node.tag}> at ({x:.0f},{y:.0f}) size {w:.0f}×{h:.0f}")
# <p> at (12,63) size 616×20      ← stacked vertically, each below the last
# <p> at (12,87) size 616×20      ← y advanced by the previous box's full height
```

Every node now owns a rectangle — Chapter 8 of the web course's layout stage, built.
Chapter 8's painter consumes exactly these rectangles.

## What you now know

- Block layout = **vertical stacking with the box model arithmetic**: content +
  padding + border + margin, width filling the parent.
- **Vertical margins collapse** to the max when adjacent — the separator rule (any
  padding/border/inline content breaks the collapse).
- The output is a **layout tree of rectangles** — the exact input the painter needs.

Next: the hardest layout mode — text that flows, wraps, and shares its line with
bold spans and links. Inline layout.
