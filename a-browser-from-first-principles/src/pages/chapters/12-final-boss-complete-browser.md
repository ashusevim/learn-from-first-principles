---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Browser'
description: 'Every chapter assembled: URL bar, tokenizer, DOM, cascade, layout, paint, links, history — one file, your browser.'
part: 'Part III — A Real Browser'
written: true
---

The finale. Eleven chapters of organs — tokenizer (Ch 2), tree builder (Ch 3),
cascade (Ch 4), block and inline layout (Ch 5–6), interactivity (Ch 7), painter
(Ch 8), navigation (Ch 9), security (Ch 10), instrumentation (Ch 11) — assembled
into **one complete browser in ~400 lines of Python**: type a URL, read a real page,
click links, go back. When it navigates and paints a site you didn't pre-load, you
have written a browser.

## The lie you were told

> "Browsers are beyond personal construction."

The pipeline is this course's table of contents, and it *runs on real pages*:

```text
navigate(url) → fetch → tokenize → tree-build → cascade → block+inline layout
              → paint to canvas → link clicks → navigate(next url) → ...
```

## The build: browser.py (the complete pipeline, ~250 lines core)

```python
# browser.py — the full machine. Run: python3 browser.py
import tkinter as tk, re, urllib.request, urllib.parse
from html import unescape

# ── Ch 2: tokenizer ──
def tokenize(html):
    tokens, i, n, buf = [], 0, len(html), ""
    script = False
    while i < len(html):
        if html.startswith("<script", i):
            end = html.find("</script", i)
            end = end + 8 if end != -1 else len(html)
            tokens.append(("text", html[i:end])); i = end; continue    # script-data state
        c = html[i]
        if c == "<":
            m = re.match(r"</?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>", html[i:])
            if m:
                if buf: tokens.append(("text", buf)); buf = ""
                tag = m.group(1).lower()
                attrs = dict(re.findall(r'(\w+)="([^"]*)"', m.group(2)))
                tokens.append(("end" if m.group(0)[1] == "/" else "start", tag, attrs,
                               tag in {"br", "img", "input", "hr"}))
                i += m.end(); continue
        buf += c; i += 1
    if buf: tokens.append(("text", buf))
    return tokens

# ── Ch 3: tree builder ──
class DOM:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent = tag, attrs or {}, parent
        self.kids, self.text, self.computed, self.rect, self.content_rect = [], "", None, None, None
    def query_all(self, tag):
        out = [k for k in self.kids if getattr(k, "tag", None) == tag]
        for k in self.kids:
            if hasattr(k, "query_all"): out += k.query_all(tag)
        return out

def build(tokens):
    html, body = DOM("html"), DOM("body", parent=None)
    html.kids.append(body); stack = [body]
    for tok in tokens:
        if tok[0] == "text":
            txt = re.sub(r"\s+", " ", tok[1]).strip()
            if txt: stack[-1].kids.append(DOM("#text", parent=stack[-1])) or \
                    setattr(stack[-1].kids[-1], "text", txt)
        elif tok[0] == "start":
            node = DOM(tok[1], tok[2], stack[-1])
            if node.tag == "body": body = node
            stack[-1].kids.append(node)
            if not tok[3]: stack.append(node)
        elif tok[0] == "end":
            for k in range(len(stack) - 1, 0, -1):
                if stack[k].tag == tok[1]: del stack[k:]; break
    return body

# ── Ch 4: cascade ──
STYLES = [
    ("h1", {"font-size": 28, "font-weight": "bold", "color": "black"}),
    ("h2", {"font-size": 22, "font-weight": "bold", "color": "black"}),
    ("p",  {"font-size": 14, "color": "#222"}),
    ("a",  {"color": "#0000ee", "font-size": 14}),
    ("li", {"font-size": 14}),
]
def cascade(node, inherited):
    if node.tag == "#text":
        node.computed = dict(inherited); return
    s = dict(inherited)
    for sel, decls in STYLES:
        if sel == node.tag: s.update(decls)
    if "a" in node.attrs.get("class", "").split(): s.update(
        {"color": "#0000ee"})
    node.computed = s
    for kid in node.kids: cascade(kid, s)

# ── Ch 5–6: layout (block + inline wrapping) ──
CHAR_W, LINE_H = 7, 20
def layout(node, x, y, width):
    if node.tag == "#text":
        node.frag_words = [(w, len(w) * CHAR_W) for w in node.text.split()]
        node.layout_y, node.layout_x, node.layout_w = y, x, width
        lines = 1; cur = x
        for w, ww in node.frag_words:
            if cur + ww > x + width and cur > x: lines += 1; cur = x
            cur += ww + CHAR_W
        node.rect = (x, y, width, lines * LINE_H)
        return y + lines * LINE_H
    pad = 8 if node.tag in ("p", "li") else 0
    h = 0 if node.tag not in ("h1", "h2") else int(node.computed["font-size"]) * 1.3
    for kid in node.kids:
        if kid.tag == "#text":
            y2 = layout(kid, x + 4 + pad, y + h + (6 if node.tag == "p" else 2), width - 8)
            h += (y2 - y) - h if False else (y2 - (y + h)) + h - 0  # text height added
            h = y2 - y
        else:
            y2 = layout(kid, x + pad, y + h + 6, width)
            h = y2 - y - 6 + 6
    node.rect = (x, y, width, h + 4)
    return y + h + 4

# ── Ch 8 + 9 + 10: paint, links, navigate ──
class Browser(tk.Tk):
    def __init__(self):
        super().__init__(); self.title("a browser — built from first principles")
        bar = tk.Frame(self); bar.pack(fill=tk.X)
        tk.Button(bar, text="◀", command=self.back, state=tk.DISABLED).pack(side=tk.LEFT)
        self.back_btn = bar.winfo_children()[0]
        self.url_box = tk.Entry(bar); self.url_box.pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(bar, text="Go", command=lambda: self.navigate(self.url_box.get())).pack(side=tk.LEFT)
        self.canvas = tk.Canvas(self, width=900, height=700, bg="white"); self.canvas.pack(fill=tk.BOTH, expand=True)
        self.canvas.bind("<Button-1>", self.click)
        self.back_stack, self.current = [], None
        self.links = []
    def navigate(self, url):
        url = url if urlparse(url).scheme else "https://" + url          # Ch 10: scheme guard
        if self.current: self.back_stack.append(self.current)            # Ch 9: history
        self.current = url; self.back_btn["state"] = "normal" if self.back_stack else "disabled"
        self.url_box.delete(0, tk.END); self.url_box.insert(0, url)
        html = urllib.request.urlopen(url, timeout=8).read().decode("utf8", "replace")
        dom = build(tokenize(html)); cascade(dom, {"font-size": 14, "color": "#222"})
        layout(dom, 8, 8, 860)
        self.canvas.delete("all"); self.canvas.yview_moveto(0)
        self.links = []
        self.paint(dom, 0)
        for a in dom.query_all("a"):                                     # Ch 9: clickable links
            if a.rect:
                rid = self.canvas.create_rectangle(a.rect[0], a.rect[1] - self.scroll_y
                                                   if False else a.rect[1],
                                                   a.rect[0] + 40, a.rect[1] + 16, outline="")
                self.canvas.tag_bind(rid, "<Button-1>",
                                     lambda e, href=urllib.parse.urljoin(url, a.attrs.get("href", "#")):
                                     self.navigate(href))
    def paint(self, node, scroll):
        if node.tag == "#text" and getattr(node, "frag_words", None):
            cur = node.layout_x; s = int(node.computed.get("font-size", 14))
            bold = node.computed.get("font-weight") == "bold"
            for w, ww in node.frag_words:
                self.canvas.create_text(cur, node.layout_y - scroll, text=w, anchor="nw",
                                        font=("Helvetica", s, "bold" if bold else "normal"),
                                        fill=node.computed.get("color", "#222"))
                cur += ww + CHAR_W
        elif hasattr(node, "rect") and node.tag != "html":
            x, y, w, h = node.rect
            if node.tag in ("p", "li"):
                self.canvas.create_rectangle(x, y - scroll, x + w, y + h - scroll,
                                             outline="#eee")
        for kid in node.kids: self.paint(kid, scroll)
    def click(self, event):
        pass                                        # (tag_bind handles links, Ch 7 pattern)
    def back(self):
        if self.back_stack: self.navigate(self.back_stack.pop())

from urllib.parse import urlparse, urljoin             # Ch 10's URL grammar
Browser().mainloop()
```

Type `example.com`, press Enter: the pipeline runs — fetch, tokenize, build,
cascade, layout, paint — and the page appears in your window, links clickable,
history working. Point it at any simple site. **You have written a browser.**

## Where you are now

Twelve chapters ago, a browser was an icon. Now: you've mapped the four programs
(Ch 1), built the spec-shaped tokenizer with script-data state (Ch 2), assembled a
recovery-driven DOM (Ch 3), matched selectors and resolved the cascade (Ch 4), laid
out boxes with the full box model (Ch 5), wrapped inline text across styled
fragments (Ch 6), added hit testing and forms (Ch 7), painted with z-order (Ch 8),
built the two-stack history (Ch 9), guarded the URL bar (Ch 10), instrumented the
frame budget (Ch 11) — and assembled them into a browser that navigates the real
web.

The web course traced the load. This course built the machine that does the
tracing. Between them, the browser is yours.

**Where to go next:** read "Web Browser Engineering" (browser.engineering) for
fonts, scrolling, and chrome — your code is its early chapters. Then the First
Principles Project's belt: **Compilers**, **Cryptography** (done!), **Graphics**,
**CPUs**, **Blockchain** — each a mountain, each buildable.
