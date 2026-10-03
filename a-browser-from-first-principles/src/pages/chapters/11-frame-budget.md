---
layout: ../../layouts/Chapter.astro
title: 'Performance: The 16ms Frame Budget'
description: 'Style → layout → paint, and where your browser spends its milliseconds. Build: instrument every stage of your own pipeline.'
part: 'Part III — A Real Browser'
written: true
---

Your browser navigates, renders, and responds. The last engineering question: **how
fast, and where does the time go?** The web course (Chapter 8) named the 16.7ms frame
budget and the pipeline stages; this chapter instruments *your* browser's stages —
tokenize, tree-build, cascade, layout, paint — and profiles a real page load end to
end. Optimization without this instrumentation is guessing.

## The lie you were told

> "Browsers are slow because pages are big."

Pages are big, but the stages cost *different* things — and your instrumentation
shows which stage owns your milliseconds:

```text
tokenize + tree-build:  proportional to HTML bytes         (Ch 2–3)
cascade:                elements × matched rules           (Ch 4: match is the cost)
layout:                 elements with geometry to compute  (Ch 5–6: the reflow stage)
paint:                  visible pixels drawn               (Ch 8)
```

The classic result: on content-heavy pages, **cascade and layout dominate** — which
is why selector complexity (Chapter 4's right-to-left matching) and DOM size are
performance advice, and why the web course said "no CDN can accelerate layout".

## Prove it to yourself

**1. The stage profile, from your own pipeline:**

```python
import time
stages = {}
def timed(name):
    def deco(fn):
        def wrapper(*a, **k):
            t = time.perf_counter(); r = fn(*a, **k)
            stages[name] = stages.get(name, 0) + (time.perf_counter() - t)
            return r
        return wrapper
    return deco
# decorate tokenize, build, cascade, layout_block, paint — load a page — print stages.
```

**2. The scale test** — load a 500KB HTML page and watch tree-build dominate; load
a page with 5,000 elements and watch cascade × matching dominate. Each stage's
complexity, demonstrated.

**3. The frame budget, budgeted:**

```python
budget = 16.7                                    # ms per frame at 60fps (web course, Ch 8)
stages = {"tokenize": 2.1, "build": 3.4, "cascade": 6.8, "layout": 4.2, "paint": 1.9}
total = sum(stages.values())
print(f"frame: {total:.1f}ms / {budget}ms budget — {'OVER' if total > budget else 'within'}")
for name, ms in sorted(stages.items(), key=lambda kv: -kv[1]):
    print(f"  {name:9s} {ms:5.1f}ms {'█' * int(ms * 2)}")
# cascade  6.8ms █████████████
# layout   4.2ms ████████
# build    3.4ms ██████
# tokenize 2.1ms ████
# paint    1.9ms ███
# the bar chart IS the optimization to-do list, ordered.
```

## The build: the instrumented pipeline

```python
# profile.py — your browser, every stage timed
import time
STAGES = {}
def timed(name):
    def deco(fn):
        def wrapper(*a, **k):
            t = time.perf_counter()
            r = fn(*a, **k)
            STAGES[name] = STAGES.get(name, 0) + time.perf_counter() - t
            return r
        return wrapper
    return deco

# decorate the pipeline (Ch 2–8's functions):
# tokenize = timed("tokenize")(tokenize)
# build    = timed("tree-build")(build)
# cascade  = timed("cascade")(cascade)
# layout_block = timed("layout")(layout_block)
# Painter.paint = timed("paint")(Painter.paint)

# then load a real page and report:
STAGES.update({"tokenize": 2.1, "tree-build": 3.4, "cascade": 6.8,
               "layout": 4.2, "paint": 1.9})            # (sample numbers)
budget, total = 16.7, sum(STAGES.values())
print(f"frame: {total:.1f}ms / {budget}ms — {'within' if total <= budget else 'OVER budget'}")
for name, ms in sorted(STAGES.items(), key=lambda kv: -kv[1]):
    bar = "█" * int(ms / total * 40)
    print(f"  {name:10s} {ms:5.1f}ms {bar}")
```

This table — stage names, milliseconds, bars — is what Chrome's Performance panel
shows, produced by your own pipeline. Optimization becomes: find the longest bar,
apply its chapter's fix (fewer elements, shorter selectors, smaller DOM), re-measure.

## What you now know

- **Instrument before optimizing** — the stage profile is a to-do list, ordered by
  milliseconds.
- Cascade and layout dominate content-heavy pages: **selector complexity and DOM
  size** are performance features (Chapter 4's right-to-left matching, Chapter 5's
  tree walk).
- The 16.7ms budget turns "fast" into arithmetic — and your pipeline can now compute
  it.

Next, the finale: every chapter's organ assembled into one file — **the complete
browser**: URL bar, tokenizer, DOM, cascade, layout, paint, links, history. Your
browser.
