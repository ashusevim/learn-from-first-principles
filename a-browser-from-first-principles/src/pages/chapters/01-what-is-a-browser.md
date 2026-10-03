---
layout: ../../layouts/Chapter.astro
title: 'What Is a Browser, Really?'
description: 'A fetcher, a parser, a layout engine, and a painter — four programs wearing one icon. Build: the architecture map and the skeleton shell.'
part: 'Part I — Reading the Web'
written: true
---

Chrome is tens of millions of lines. The web course's mini browser was ~300. Both are
the same **four programs wearing one icon** — and this course builds them properly,
one stage per chapter:

```text
1. FETCH     URLs → bytes over the network        (the web course, Ch 2–4)
2. PARSE     bytes → a live DOM tree              (Ch 2–3 of this course)
3. LAYOUT    DOM + styles → geometry per box      (Ch 4–6: cascade, block, inline)
4. PAINT     geometry → pixels on the screen      (Ch 8)
plus:        interactivity (Ch 7) and navigation (Ch 9–10) gluing it all together
```

The web course traced one page load *through* a browser. This course *builds* the
browser — with real error recovery, real wrapping, real clicks — and by the finale it
navigates real pages.

## The lie you were told

> "The browser downloads the page, then renders it."

The stages are not sequential — they're a **pipeline running while bytes arrive**:
parsing starts as soon as the first bytes land, discovers CSS/JS references mid-parse,
and the first paint often happens before the document ends. The pipeline's stages and
budgets were Chapter 8 of the web course; here they become *your* code's structure.

## The architecture of ours (and Chrome's, simplified)

```text
┌────────────────────────────────────────────┐
│ UI: URL bar, buttons, scroll               │  ← the shell (Ch 1's build)
├────────────────────────────────────────────┤
│ NETWORK: fetch bytes (Ch 10's security)    │
│   ↓ bytes                                  │
│ PARSER: tokenizer → tree builder → DOM     │  (Ch 2–3)
│   ↓ DOM                                    │
│ STYLE: cascade → styled tree               │  (Ch 4)
│   ↓ styled tree                            │
│ LAYOUT: geometry per box                   │  (Ch 5–6)
│   ↓ layout tree                            │
│ PAINT: pixels to the canvas                │  (Ch 8)
└────────────────────────────────────────────┘
```

Chrome splits these into separate *processes* (network, renderer per tab, GPU) —
the containers course's isolation (Ch 2–5) and the concurrency course's message
passing, applied. Ours stays one process; the boundaries stay the same.

## Prove it to yourself

**1. The four programs, named in a real browser:**

```text
DevTools → Network:    the fetcher's log (Ch 10's rules)
DevTools → Elements:   the parser's output — the live DOM (Ch 3)
DevTools → Computed:   the cascade's verdict per element (Ch 4)
DevTools → Layers:     the painter's outputs (Ch 8)
```

Four panels, four programs. Chrome's UI is the world's most elaborate wrapper around
them.

**2. The pipeline streaming, seen:** Network panel → a slow-throttled page: the first
paint lands while the blue "download" bar is still moving. Parse and paint *during*
transfer — Chapter 5 of the web course's streaming, at pipeline depth.

## The build: the skeleton shell

Every chapter adds an organ to this body. Chapter 1's build is the shell — URL bar,
canvas, and a `render(url)` seam where the pipeline will hang:

```python
# shell.py — the browser skeleton: URL bar + canvas + the pipeline seam
import tkinter as tk

class Browser:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("a browser")
        self.bar = tk.Frame(self.window)
        self.bar.pack(fill=tk.X)
        self.url_entry = tk.Entry(self.bar)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=4)
        self.go_button = tk.Button(self.bar, text="Go", command=self.go)
        self.go_button.pack(side=tk.LEFT)
        self.window.bind("<Return>", self.go)
        self.canvas = tk.Canvas(self.window, width=800, height=600, bg="white")
        self.canvas.pack(fill=tk.BOTH, expand=True)

    def go(self, event=None):
        url = self.url_entry.get().strip()
        if not url: return
        if not url.startswith("http"): url = "https://" + url
        self.render(url)                       # ← the seam: Ch 2 hangs the parser here

    def render(self, url):
        self.canvas.delete("all")
        self.canvas.create_text(10, 10, anchor="nw",
                                text=f"[pipeline not built yet — would load {url}]")

Browser().window.mainloop()
```

Run it: a URL bar, a canvas, and a seam. Twelve chapters from now, `render(url)`
contains the entire machine — and it navigates real websites.

## What you now know

- A browser = **fetch + parse + layout + paint** plus glue — four programs, one icon.
- The stages run as a **streaming pipeline**, not a sequence — first paint before the
  document ends.
- Chrome's processes, DevTools' panels, and this course's chapters all carve the same
  four programs at the same seams.

Next: stage one of the pipeline — a tokenizer shaped like the HTML spec's state
machine, that turns byte soup into a stream of tags without ever rejecting input.
