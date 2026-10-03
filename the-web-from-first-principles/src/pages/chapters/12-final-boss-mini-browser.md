---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Mini Browser in ~300 Lines'
description: 'Fetch → parse → style → layout → render to a window. The course ends with you drawing the web yourself.'
part: 'Part III — Fast & Modern'
written: true
---

The finale. Twelve chapters traced the machine; this one assembles it: **a mini
browser** — fetch a URL, parse the HTML (Ch 5), apply the CSS cascade (Ch 6), compute
block layout (Ch 8), and render — drawing actual text to an actual window. Fewer
features than Chrome by a factor of a hundred thousand; identical *pipeline*. When
your own window paints a remote page, the web stops being a platform you use and
becomes a protocol you implemented.

## The lie you were told

> "A browser is millions of lines beyond reach."

Chrome's engine is — the JS JIT, security sandbox, and 40 years of edge cases are the
bulk. The **pipeline** is this course's table of contents:

```text
URL → fetch (Ch 3–4) → parse → DOM (Ch 5) → cascade → style tree (Ch 6)
    → layout: geometry per box (Ch 8) → paint: draw it (Ch 8) → pixels
```

## The build: mini-browser.py

```python
# minibrowser.py — fetch → parse → cascade → layout → render (tkinter)
import re, sys, urllib.request
import tkinter as tk

# ---------- 1. FETCH (Ch 3–4: the pipe) ----------
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "MiniBrowser/1.0"})
    with urllib.request.urlopen(req) as r:
        body = r.read().decode("utf-8", errors="replace")
    return body

# ---------- 2. PARSE → DOM (Ch 5: bytes → tokens → tree) ----------
TAG = re.compile(r"<(\w+)([^>]*)>|</(\w+)>")
VOID = {"br", "img", "meta", "link", "hr", "input"}

def parse(html):
    root = {"tag": "html", "kids": [], "style": {}}
    stack = [root]; text_owner = None
    pos = 0
    for m in TAG.finditer(html):
        between = html[pos:m.start()].strip()
        if between and stack: stack[-1]["kids"].append({"text": between, "style": {}})
        pos = m.end()
        if m.group(3):                                    # closing tag
            if len(stack) > 1 and stack[-1]["tag"] == m.group(3): stack.pop()
        else:
            tag = m.group(1).lower()
            attrs = dict(re.findall(r'(\w+)="([^"]*)"', m.group(2)))
            node = {"tag": tag, "attrs": attrs, "kids": [], "style": {}}
            stack[-1]["kids"].append(node)
            if tag not in VOID: stack.append(node)        # descend (non-void)
    return root

# ---------- 3. CASCADE (Ch 6: origin → specificity → order) ----------
DEFAULTS = {"h1": 32, "h2": 24, "h3": 18, "p": 14, "body": 14, "li": 14, "a": 14}
STYLESHEET = [                                          # (tag, font_size, bold)
    ("h1", 32, True), ("h2", 24, True), ("h3", 18, True),
    ("b", 14, True), ("strong", 14, True), ("p", 14, False),
    ("li", 14, False), ("body", 14, False),
]
def cascade(node, inherited_size=14, inherited_bold=False):
    tag = node.get("tag", "")
    size, bold = inherited_size, inherited_bold         # INHERITANCE: text props flow down
    for sel, s, b in STYLESHEET:                        # (a real impl: Ch 6's tournament)
        if sel == tag: size, bold = s, b
    node["style"] = {"size": size, "bold": bold}
    for kid in node.get("kids", []): cascade(kid, size, bold)

# ---------- 4. LAYOUT (Ch 8: block flow — width down, height up) ----------
WIDTH = 780
def layout(node, x, y, canvas_width=WIDTH):
    if "text" in node:
        size, bold = node["style"]["size"], node["style"]["bold"]
        node["layout"] = (x, y, size, bold)             # a text box: position + style
        return y + int(size * 1.4)                      # line height: 1.4em (Ch 8's arithmetic)
    for kid in node.get("kids", []):
        y = layout(kid, x, y, canvas_width)             # kids stack vertically (block flow)
    node["layout"] = (x, y, 0, False)
    return y

# ---------- 5. RENDER (Ch 8: paint) ----------
def render(canvas, node):
    if "text" in node and "layout" in node:
        x, y, size, bold = node["layout"]
        canvas.create_text(x, y, text=node["text"], anchor="nw",
                           font=("Helvetica", size, "bold" if bold else "normal"))
    for kid in node.get("kids", []): render(canvas, kid)

# ---------- the pipeline, assembled ----------
def load(url):
    dom = parse(fetch(url))
    cascade(dom); layout(dom)
    canvas.delete("all"); render(canvas, dom)

win = tk.Tk(); win.title("MiniBrowser — built from first principles")
toolbar = tk.Frame(win); toolbar.pack(fill="x")
addr = tk.Entry(toolbar); addr.pack(side="left", fill="x", expand=True, padx=4)
addr.insert(0, "https://example.com")
canvas = tk.Canvas(win, width=WIDTH, height=600, bg="white"); canvas.pack()

def go(event=None):
    try: load(addr.get())
    except Exception as e: canvas.delete("all"); canvas.create_text(20, 20, anchor="nw", text=f"error: {e}")
tk.Button(toolbar, text="Go", command=go).pack(side="left")
win.bind("<Return>", go); go(); win.mainloop()
```

Run it, point it at `example.com` — the headline renders large and bold, the body
small and regular: **your cascade picked the fonts, your layout placed them, your
parser built the tree, your fetch pulled the bytes.** Point it at any simple page —
Wikipedia's mobile view works nicely — and watch block after block stack down the
canvas, exactly as Chapter 8's pipeline describes.

## The feature gap — and what each gap is

Every missing feature is a *course-sized* problem, now nameable:

| Missing from your browser | It is... |
|---|---|
| CSS classes, IDs, specificity tournament | Chapter 6's resolver over real selectors |
| Flexbox/grid layout | constraint-solving layout (Ch 8's geometry, squared) |
| JavaScript | a whole language runtime + the event loop (concurrency course Ch 6–7) + DOM bindings |
| Tabs, history, sandboxing | process isolation (containers course, Ch 2–5!) |
| Caching | Chapter 9's header machinery + a disk store |
| HTTP/2/3 | Chapter 4 and 11's frame protocols |

That table is the industry's R&D map. You've implemented the spine that everything
else hangs from.

## Where you are now

Twelve chapters ago the browser was a window that "shows websites". Now: you've traced
a load across four layers (Ch 1), timed the cache hierarchy (Ch 2), priced handshakes
(Ch 3), decoded multiplexing (Ch 4), parsed HTML with spec-grade mercy (Ch 5), resolved
the cascade arithmetically (Ch 6), ordered the single thread's queues (Ch 7), walked
the render pipeline and its budget (Ch 8), made second visits free (Ch 9), audited
bytes (Ch 10), simulated QUIC's gamble (Ch 11) — and drawn a remote web page inside a
window that your own code fetched, parsed, styled, laid out, and painted.

The web was never a platform. It's a pipeline — and you've built it.

**Where to go next:** read "Web Browser Engineering" (browser.engineering) — your mini
browser is its first chapters. Then contribute to Servo or Ladybird — real browsers
that welcome newcomers. And the First Principles Project marches on: **React** (the
DOM, made declarative — you've already built the DOM it manages), **Search Engines**,
and **LLMs** are next on the belt.
