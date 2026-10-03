---
layout: ../../layouts/Chapter.astro
title: 'Painting: Colors, Borders & Text'
description: 'The layout tree becomes pixels — backgrounds, borders, glyphs, in z-order. Build: a painter over your layout tree.'
part: 'Part II — Laying It Out'
written: true
---

Layout produced rectangles; painting turns them into **pixels** — and the order of
drawing *is* the visual result: backgrounds first, then borders, then text, with
later siblings painting over earlier ones (z-order). This chapter builds the painter
over your layout tree, and the page finally *looks like something*.

## The lie you were told

> "The browser draws elements."

The painter draws a **display list** — an ordered list of drawing commands
(fill-rect, draw-border, draw-text) produced by walking the layout tree. That
indirection is what makes scrolling cheap (re-execute the list shifted), invalidation
cheap (re-paint only damaged regions), and stacking contexts possible (the list order
IS the z-order). Paint = walk tree → emit commands → execute.

## The painting order (the spec's z-order, simplified)

```text
for each box in tree order:
  1. background + borders of the box itself
  2. its children (recursively)            ← children paint ON TOP of parents
```

Later siblings paint over earlier ones — which is why Chapter 7's hit test walked
reversed. Negative z-index and stacking contexts complicate this; the simplified
tree-order rule covers 90% of pages.

## Prove it to yourself

**1. The display list, inspected:**

```python
commands = []
def paint(node, canvas):
    commands.append(("bg", node))          # background first...
    for kid in node.kids: paint(kid, canvas)   # ...children over it
    commands.append(("text", node))        # text above the children's backgrounds
# the list's ORDER is the page's z-order — reorder the list, reorder the page.
```

**2. The frame budget, watched** — instrument the painter (Chapter 11's preview):
paint time is proportional to *visible pixels drawn*, which is why `visibility:
hidden` (still laid out, not painted) and scrolling (blit + paint new rows) differ.

## The build: the painter

```python
# painter.py — layout tree → tkinter canvas: backgrounds, borders, text
import tkinter as tk

class Painter:
    def __init__(self, canvas):
        self.canvas = canvas
    def paint(self, node, scroll=0):
        self.canvas.delete("all")
        self.walk(node, scroll)

    def walk(self, node, scroll):
        if hasattr(node, "rect") and node.tag != "#text":
            x, y, w, h = node.rect
            y -= scroll                                        # scrolling = shifted blit
            tag, bg = node.tag, {"h1": "#f0f0f0", "p": "white"}.get(node.tag, "white")
            self.canvas.create_rectangle(x, y, x + w, y + h, fill=bg, outline="#999")  # bg+border
        if node.text and hasattr(node, "content_rect"):
            cx, cy, cw, ch = node.content_rect
            size = int(node.computed.get("font-size", 14))
            weight = "bold" if node.computed.get("font-weight") == "bold" else "normal"
            color = node.computed.get("color", "black")
            self.canvas.create_text(cx + 2, cy - scroll, text=node.text, anchor="nw",
                                    font=("Helvetica", size, weight), fill=color, width=cw)
        for kid in node.kids: self.walk(kid, scroll)           # children over parents
```

Wire it into the Chapter 1 shell's `render()` — after the pipeline fills the layout
tree — and `example.com`'s heading paints in bold 28px black on white, the paragraph
below in 14px. Your browser draws.

## What you now know

- Painting = **produce a display list, execute it** — the list's order is z-order;
  later siblings over earlier.
- Scrolling = **re-executing the list shifted** — that's why it's cheap and why
  `position: fixed` doesn't scroll.
- Backgrounds → children → text per box; the simplified tree order covers most
  pages, stacking contexts are the deep end.

Next: pages that render but don't *navigate*. Links, clicks, and the back/forward
stacks that make a browser a browser.
