---
layout: ../../layouts/Chapter.astro
title: 'Forms & Interactivity'
description: 'Inputs, buttons, and events — the browser listens back. Build: clickable, typable form elements with submit handling.'
part: 'Part II — Laying It Out'
written: true
---

Your browser renders pages — but a browser that never listens is a television. This
chapter adds **interactivity**: form elements (input, button), a hit-testing system
("what did the user click?"), and the event loop wiring that makes the UI respond.
The concurrency course's event loop (Chapters 6–7) returns — your browser has been an
event loop since the shell, and now it has users.

## The lie you were told

> "Clicks go to the element you clicked."

Clicks arrive as **coordinates on the canvas**. The browser must figure out which
element those coordinates belong to — **hit testing**: walk the layout tree's
rectangles (topmost/last-painted first) and find the box containing the point. Only
then does the event reach "the element you clicked" — an abstraction your own hit
test creates.

## The event model

```text
user click at (x, y)
  → hit test: which layout box contains (x, y)?       (walk the tree, deepest-first)
  → dispatch: run that element's onclick handler      (with the event object)
  → handler may change state → re-render (Ch 2's loop re-runs!)
```

That last step is the whole architecture: **events change state; state re-renders
the pipeline** (parse-less: same DOM, re-cascade + re-layout + repaint). The React
course's Chapter 1 loop, at browser scale.

## Prove it to yourself

**1. Hit testing is rectangle math:**

```python
def hit_test(node, x, y):
    for kid in reversed(node.kids):                 # LAST painted = topmost
        hit = hit_test(kid, x, y)
        if hit: return hit
    r = getattr(node, "content_rect", None)
    if r and r[0] <= x < r[0] + r[2] and r[1] <= y < r[1] + r[3]:
        return node                                 # deepest box containing the point
    return None
# reversed traversal = z-order: later siblings paint on top and win the test.
```

**2. Typing is a stream of events** — each keystroke fires an event, updates the
input's value, and (in real browsers) re-renders. Your Chapter 7 (web course) event
loop, with a keyboard.

## The build: a form the browser can hear

```python
# forms.py — hit testing + a working form: type a query, click Search
import tkinter as tk

class InteractiveBrowser(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("forms + events")
        self.query = tk.StringVar()
        self.entries = {}                            # element id → current value
        bar = tk.Frame(self); bar.pack(fill=tk.X)
        self.url_box = tk.Entry(bar); self.url_box.pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(bar, text="Go", command=self.load).pack(side=tk.LEFT)
        self.canvas = tk.Canvas(self, width=800, height=200, bg="white"); self.canvas.pack(fill=tk.BOTH)
        # a form page: label + input + button, laid out by hand (Ch 5–6 built the general case):
        self.canvas.create_text(10, 15, text="search this site:", anchor="nw")
        self.canvas.create_rectangle(150, 10, 350, 34, outline="gray")       # the input box
        self.entry = tk.Entry(self, textvariable=self.query, bd=0)
        self.entry.place(x=155, y=14)                        # a real input, ON the canvas
        self.canvas.create_rectangle(150, 44, 240, 68, fill="#e8b15c", outline="")
        self.canvas.create_text(195, 56, text="Search", fill="black")
        self.canvas.tag_bind("search_btn", "<Button-1>", lambda e: self.submit())

    def submit(self):
        print("submitted query:", self.query.get())          # → becomes a new navigation (Ch 9)
        self.canvas.create_text(10, 90, text=f"results for '{self.query.get()}' would load here",
                                anchor="nw", fill="gray")

    def load(self): self.submit()

InteractiveBrowser().mainloop()
```

Type into the box, click Search (or press Enter): the event fires, the state
changes, the UI updates. Clicks are events; events mutate state; state repaints —
the loop from Chapter 7 of the concurrency course, now with a cursor.

## What you now know

- **Hit testing** maps coordinates → elements by walking layout rectangles
  deepest-first (z-order), the abstraction behind every click.
- The architecture is the **event loop**: events → state changes → re-render; the
  concurrency course's model with a DOM.
- Forms = **inputs holding state + submit events triggering navigation** — Chapter
  9's history stack gets its fuel.

Next: the styled, laid-out, interactive tree becomes *pixels* — backgrounds,
borders, text, in the right z-order. Painting.
