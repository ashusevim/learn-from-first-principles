---
layout: ../../layouts/Chapter.astro
title: 'Navigation & History'
description: 'Links, back/forward stacks, reloads — the browser as a state machine of visits. Build: clickable links with a history stack.'
part: 'Part III — A Real Browser'
written: true
---

A browser renders pages; a *browser* navigates between them. This chapter wires
Chapter 7's clicks to link elements, and builds the **session history** — the two
stacks (back/forward) that make the back button work, including the subtle part:
navigating forward from the middle of your history **destroys the forward stack**.
The browser becomes a state machine of visits.

## The lie you were told

> "The back button goes back along a list of pages."

The history is **two stacks plus a current pointer** — and that structure *is* the
behavior:

```text
back:    [A, B, C] current=C  → push C to forward, current=B     [A, B] | fwd [C]
new nav: current=B → push B... wait: navigating from B CLEARS forward  [A, B] | fwd []
         (C is gone forever — that's why "back then new link" loses your forward trail)
```

That "clear on new navigation" is the whole spec: the forward stack represents
*futures you abandoned*, and a new navigation abandons them by definition.

## The navigation lifecycle

A click (or URL entry) triggers the full Chapter 1 pipeline, re-run:

```text
click → normalize URL → push current to back stack → current = new URL
      → fetch (Ch 10's rules) → parse → cascade → layout → paint   (the pipeline, Ch 2–8)
      → scroll resets to top (new page!), focus resets, history entry recorded
```

And **reload** is navigation-in-place: same URL, re-run the pipeline, no history
change. Every browser button maps to one of these three moves.

## Prove it to yourself

**1. The forward-stack wipe, demonstrated:**

```python
back, forward, current = ["a.com", "b.com"], ["d.com"], "c.com"
# click a link on c.com to e.com:
back.append(current); current = "e.com"; forward = []      # ← d.com is GONE
print(back, current, forward)
# ['a.com', 'b.com', 'c.com'] e.com [] — the abandoned future, destroyed by design.
```

**2. Same-document navigation** — clicking `#anchor` changes the URL fragment
*without* a full pipeline run: scroll to the element, push a history entry. (That's
why back seems to "undo scrolling" on long pages — same-document history entries.)

## The build: clickable links + history

```python
# navigate.py — the shell gains links, clicks, and the two stacks
import tkinter as tk, re, urllib.request

class NavigatingBrowser(tk.Tk):
    def __init__(self):
        super().__init__()
        self.back_stack, self.forward_stack, self.current = [], [], None
        bar = tk.Frame(self); bar.pack(fill=tk.X)
        tk.Button(bar, text="◀", command=self.go_back, state=tk.DISABLED).pack(side=tk.LEFT)
        self.back_btn = bar.winfo_children()[0]
        tk.Button(bar, text="▶", command=self.go_forward, state=tk.DISABLED).pack(side=tk.LEFT)
        self.fwd_btn = bar.winfo_children()[2]
        self.url_box = tk.Entry(bar); self.url_box.pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(bar, text="Go", command=self.load_from_bar).pack(side=tk.LEFT)
        self.canvas = tk.Canvas(self, width=800, height=500, bg="white"); self.canvas.pack(fill=tk.BOTH, expand=True)
        self.link_rects = []                                # link rects → their hrefs (Ch 7's hit test)

    def navigate(self, url):                                # the ONE entry point
        if self.current: self.back_stack.append(self.current); self.forward_stack = []
        self.current = url; self.load_pipeline(url)         # Ch 2–8's pipeline
        self.back_btn["state"] = "normal" if self.back_stack else "disabled"
        self.fwd_btn["state"] = "normal" if self.forward_stack else "disabled"

    def go_back(self):
        if not self.back_stack: return
        self.forward_stack.append(self.current)             # the future returns...
        self.current = self.back_stack.pop()                # ...from the past
        self.load_pipeline(self.current)

    def go_forward(self):
        if not self.forward_stack: return
        self.back_stack.append(self.current)
        self.current = self.forward_stack.pop()
        self.load_pipeline(self.current)

    def load_pipeline(self, url):                           # Ch 2–8's pipeline, invoked
        html = urllib.request.urlopen(url, timeout=5).read().decode("utf8", "replace")
        self.canvas.delete("all"); self.link_rects = []
        y = 10
        for m in re.finditer(r'<a href="([^"]+)">(.*?)</a>', html):
            text = re.sub(r"<[^>]+>", "", m.group(2))
            rid = self.canvas.create_text(10, y, text=text, anchor="nw", fill="#0000ee")
            self.canvas.tag_bind(rid, "<Button-1>",
                                 lambda e, href=urllib.parse.urljoin(url, m.group(1)): self.navigate(href))
            self.link_rects.append((rid, m.group(1))); y += 24
        self.url_box.delete(0, tk.END); self.url_box.insert(0, url)

import urllib.parse                                     # (for urljoin above)
app = NavigatingBrowser()
app.navigate("https://example.com")                     # the first visit
app.mainloop()
```

Click a link: the pipeline re-runs for the new URL, the back button lights up.
Click back, then a new link: the forward stack wipes. Every browser behavior you
know, from two stacks and a pointer.

## What you now know

- History = **back stack + current + forward stack**; new navigation clears forward —
  abandoned futures die by design.
- **Reload** = navigate-in-place; **fragment links** = same-document navigation
  (scroll + history entry, no pipeline).
- Navigation *is* the pipeline trigger — Chapters 2–8 run per visit, and the URL bar
  (Chapter 10) is its trust anchor.

Next: the address bar is the most-attacked input in software. URL grammar, the
same-origin policy, and why the browser guards it like a border crossing.
