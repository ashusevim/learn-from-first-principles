---
layout: ../../layouts/Chapter.astro
title: 'The Render Pipeline: Layout, Paint, Composite'
description: 'Why changing width is expensive and transform is free. Build: a DevTools performance walkthrough of reflow vs composite.'
part: 'Part II — The Document'
written: true
---

Chapters 5–7 produced a styled, scripted DOM tree. Pixels require one more pipeline —
and it's the answer to the most practical question in frontend: *why does animating
`width` drop frames while `transform: translate()` doesn't?* Because the pipeline has
four stages with wildly different costs, and the two properties touch different
stages. This chapter walks the pipeline in DevTools and builds a tiny layout engine to
prove the geometry math.

## The lie you were told

> "Style changes cost roughly the same."

The pipeline, per frame (budget: **16.7ms** at 60fps):

```text
JavaScript → Style → Layout → Paint → Composite
 (Ch 7)      (Ch 6)     geometry   raster    GPU layers
                         ← EXPENSIVE →     ← cheap →
```

- **Style** (recalc): match selectors, run the cascade (Chapter 6) per element.
- **Layout** (*reflow*): geometry for every box — widths, heights, positions — where a
  change can cascade to siblings, parents, the whole page (Ch 5's tree, now with
  dimensions).
- **Paint**: fill pixels into layers (CPU/GPU raster).
- **Composite**: stack GPU layers into the final frame — the GPU's only job, and
  *fast*.

The golden rule falls out: **animate `transform` and `opacity`** (composite-only:
the GPU moves an existing texture) and you skip style+layout+paint entirely. Animate
`width`/`top` and you reflow *and* repaint every frame. Same visual, 10–100× the work.

## Layout is contagious

Layout is the expensive stage because boxes nest: change one element's width → its
children re-wrap → the parent's height changes → *its* siblings shift → scrollbars
recompute. One `width` write can reflow the document. The classic **layout
thrashing** loop makes it pathological:

```javascript
// read-write-read-write: each read FORCES a synchronous reflow of the pending writes
for (const el of items) {
    const h = el.offsetHeight;      // read → reflow! (pending writes must flush)
    el.style.height = h * 2 + "px"; // write → invalidates layout again
}
// fix: read ALL heights first, then write ALL — one reflow instead of N
```

That read-after-write pattern is the single most common performance crime in JS-heavy
pages — and now you know its mechanism, not just its name.

## Prove it to yourself

**1. The pipeline, watched** (DevTools → Performance → record while animating):

```text
animate width:  Recalculate Style → Layout → Paint → Composite  (every frame, ~all of it)
animate transform:  → Composite                                  (only this, tiny)
```

**2. The border-box surprise** — layout's most common bug, made visible:

```css
.box { width: 100px; padding: 10px; border: 5px solid; }  /* real width: 130px! */
* { box-sizing: border-box; }                              /* real width: 100px (padding inside) */
```

The default (`content-box`) adds padding+border *outside* width — the arithmetic you
built below.

**3. Frames vs the budget** — DevTools → Rendering → FPS meter while animating: the
16.7ms budget is why "60fps" and why missing it produces *stutter*, not slowness.

## The build: a tiny block-layout engine

Real layout is 100k lines (flexbox, fonts, line-breaking). The *block-flow core* —
vertical stacking, padding arithmetic — fits in 40 lines and proves the reflow
cascade:

```python
# layout.py — block layout: the width-arithmetic and the reflow cascade, miniaturized
class Box:
    def __init__(self, width=None, padding=0, kids=(), text=None):
        self.width, self.padding, self.kids, self.text = width, padding, list(kids), text
        self.x = self.height = 0                        # computed by layout

def layout(box, x=0, content_width=800):
    """Block flow: kids stack vertically; width cascades down, height bubbles up."""
    box.x = x
    inner = (box.width if box.width is not None else content_width) - 2 * box.padding
    y = 0
    for kid in box.kids:                                # 1. layout kids DOWN the tree
        layout(kid, box.padding, inner)
        y += kid.height
    box.height = (y if box.kids else 24) + 2 * box.padding   # 2. heights bubble UP

def find_and_grow(box, text):                           # the width-bomb: one change...
    if box.text == text:
        box.width = (box.width or 800) + 50             # ...invalidates EVERYTHING above
        return True
    return any(find_and_grow(k, text) for k in box.kids)

page = Box(padding=10, kids=[
    Box(text="header"),
    Box(padding=10, kids=[Box(text="item 1"), Box(text="item 2")]),   # a card
    Box(text="footer"),
])
layout(page)
print("page height after build:", page.height)

find_and_grow(page, "item 1")            # change ONE nested box's width
layout(page)                             # ← full relayout: the reflow you bought
print("page height after one nested change:", page.height, "(everything re-wrapped)")
```

The two-phase walk — widths down, heights up — is layout's actual shape; the demo's
full re-layout after one nested change is *reflow's cost*, miniaturized. Real engines
cache, batch, and skip subtrees — which is why the read-write-loop above hurts: it
defeats the batching.

## What you now know

- Four stages, four costs: **JS → Style → Layout → Paint → Composite**; animate only
  `transform`/`opacity` to live on the cheap stage.
- **Layout is contagious** — nested geometry means one width change can reflow the
  page; read-then-write batches, thrashing kills.
- `box-sizing` is layout arithmetic (content-box adds padding outside width) — not a
  preference.
- 60fps = a 16.7ms budget per frame; the pipeline tells you exactly which stage your
  budget died in (DevTools Performance, bottom-up view).

Next: the page is rendering — now make the *second* visit free. Cache-Control, ETags,
and the protocol's memory.
