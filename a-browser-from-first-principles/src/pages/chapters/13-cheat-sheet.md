---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: The Browser Pipeline on One Page'
description: 'The whole pipeline from bytes to pixels, compressed: the model, the stages you actually touch, the pitfalls, and where each is explained.'
part: 'Part IV — Practice & Reference'
written: true
---

A cheat sheet isn’t a summary — it’s a **lookup table**. You finished the course; you typed a URL and something on the page came out wrong. This page takes you from symptom to the chapter that fixes it: the model to hold in your head, the primitives your code actually calls, the pitfalls that catch everyone, and three tiny experiments proving the machine still runs on your laptop.

## The one-page model

```text
URL ─fetch─▶ bytes ─tokenize─▶ tokens ─build─▶ DOM
DOM ─cascade─▶ styled tree ─layout─▶ boxes ─paint─▶ pixels
pixels + a click ─hit test─▶ navigate ─▶ a new URL
history: back[] ⟨current⟩ forward[]      (a new navigation empties forward)
```

Two facts carry everything. **Every stage is a pure function of the previous stage’s output** — bytes in, data out, no hidden state — so you can run any stage alone on a captured value. The only mutable state in the whole browser is the URL, the two history stacks, and which element the pointer is over.

## The pipeline you actually use

| Primitive | What it does | Tiny example |
|---|---|---|
| `tokenize(html)` | text → tag/text token stream | `tokenize("<p>hi</p>")` |
| `build(tokens)` | tokens → live DOM tree | `dom = build(tokenize(html))` |
| `query_all(tag)` | descendants with a tag name | `dom.query_all("a")` |
| `cascade(node, inherited)` | match rules, resolve, inherit | `cascade(dom, base)` |
| `layout_block(node, x, y, w)` | boxes with the box model | `layout_block(dom, 8, 8, 860)` |
| `node.rect` | the margin box geometry | `x, y, w, h = node.rect` |
| `node.content_rect` | the content box geometry | `cx, cy, cw, ch = node.content_rect` |
| `Painter.paint(node, scroll)` | walk tree → draw to canvas | `paint(dom, self.scroll_y)` |
| `canvas.tag_bind(id, …)` | wire a drawn rect to a click | `tag_bind(rid, "<Button-1>", go)` |
| `back, current, forward` | the three history registers | `back.append(current)` |
| `origin(url)` | scheme + host + port | `origin("https://a.com")` |
| `timed("layout")(fn)` | wrap a stage with a timer | `STAGES["layout"]` |

`query_all`, `rect`, and the history stacks are the four names you’ll type most; everything else is a one-shot at the pipeline’s edge.

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| A literal `<` inside “5 < 6” | the tokenizer must emit it as text, not a tag | Chapter 2 |
| `if (a<b) x=1` inside `<script>` | ScriptData treats the whole body as text | Chapter 2 |
| a `<br>` that swallows every sibling | void elements never push the stack | Chapter 3 |
| `.note` losing to a bare `p` | specificity, then source order, decides | Chapter 4 |
| a “100px” box measuring 130px | the box model adds padding and border | Chapter 5 |
| a 20px + 30px gap that reads 50px | vertical margins collapse to the larger | Chapter 5 |
| a bold word jumping two lines down | inline fragments, not elements, wrap | Chapter 6 |
| a page that paints but ignores clicks | hit testing maps pixels back to nodes | Chapter 7 |
| overlapping text from a later sibling | paint order *is* z-order | Chapter 8 |
| Back, then a new link, loses the trail | a new navigation clears forward | Chapter 9 |
| `https://google.com@evil.com` | the host is `evil.com`; userinfo is display-stripped | Chapter 10 |
| a page that misses its 16ms budget | instrument stage-by-stage before tuning | Chapter 11 |

Twelve symptoms, twelve chapters — that one-to-one mapping is the course’s whole spine.

## When to use what

| Decision | Choose | Because |
|---|---|---|
| a heading vs a sentence | `layout_block` vs inline fragments | blocks stack; inline content wraps mid-line |
| sizing a toolbox | border-box arithmetic | declared width includes padding + border |
| scrolling a page | shift the display list | re-executing it is a blit, not a re-layout |
| a same-origin link vs a script read | allow the navigation, block the read | full-page loads cross origins; scripts don’t |
| going back vs reloading | pop the stack vs re-run in place | reload keeps history; back consumes it |
| debugging “why is it slow” | the stage profile | the longest bar names the fix |

## Prove it to yourself

**1. A stage is pure — run it twice:**

```python
from browser import tokenize
print(tokenize("<p>5 < 6</p>") == tokenize("<p>5 < 6</p>"))   # True — no hidden state
```

**2. The origin splits on scheme:**

```python
from urllib.parse import urlparse
def origin(u):
    p = urlparse(u)
    return (p.scheme, p.hostname, p.port or 443)   # default port per scheme
print(origin("https://a.com") == origin("http://a.com"))   # False
```

**3. A new navigation empties forward:**

```python
back, forward, current = ["a.com", "b.com"], ["d.com"], "c.com"
back.append(current); current = "e.com"; forward = []   # the new visit
print(forward)   # [] — d.com is gone
```

## What you now know

- The browser is **four pure stages plus glue** — fetch, parse, layout, paint — and navigation is the pipeline re-run.
- **The only mutable state is the URL, the history registers, and the pointer’s target.**
- Most bugs are one stage deep; the pitfall table maps the symptom to the chapter.
- You never have to rederive the pipeline — any decision is re-findable here in a minute.

Next: stop reading and start breaking — the labs take the Chapter 12 browser apart, one checkable exercise at a time.
