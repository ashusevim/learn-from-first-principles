---
layout: ../../layouts/Chapter.astro
title: 'The Tree Builder & the Live DOM'
description: 'Implicit tags, self-closing exceptions, foster parenting — the tree assembles itself. Build: a DOM with parents, children, and querying.'
part: 'Part I — Reading the Web'
written: true
---

The tokenizer emits a flat stream of tokens; the **tree builder** turns it into the
DOM — inventing `<html>`, `<head>`, and `<body>` if absent, closing elements by
context (`<p>` can't nest `<p>`), and relocating strays (foster parenting). The
output is a live tree your later stages query, style, and paint. This chapter builds
it, with the recovery rules that make HTML HTML.

## The lie you were told

> "The DOM mirrors the HTML you wrote."

The DOM is what the *tree builder* decided — and it adds structure everywhere:

```text
your HTML:   <p>one <p>two
the DOM:     <html><head></head><body><p>one</p><p>two</p></body></html>
             ↑ invented: html, head, body, and the first </p>
```

An implied-tag system with a stack: elements that auto-close (`<p>` closes an open
`<p>`), elements that are implied (`<html>`), elements with special content rules
(`<table>`, `<ul>`), and the recovery order when they conflict. The spec's tree
construction is the second half of the parser.

## The element stack: how the builder thinks

```text
open-elements stack (bottom → top):  html → body → p

start tag <p>:  if top is p → close it first (no nesting p in p)
                push new p
end tag </p>:   pop until a p is popped (closing intermediates)
end tag </div> with no open div: IGNORE — specified recovery
EOF:            close everything still open
```

Every rule is "keep the stack sane": no impossible nesting, no unclosed ancestors at
EOF, nothing dropped.

## Prove it to yourself

**1. The implied structure** — Chapter 5 of the web course showed it; here it's your
tree builder's job. Feed the build below `<p>one<p>two` and inspect the output tree:
html/body present, both paragraphs closed.

**2. The live DOM** — parsed trees are *queryable* before styling: this chapter's
tree gets a `query(tag)` method, and Chapter 4's cascade walks it. The DOM is the
contract between the parser and everything after.

## The build: the tree builder

```python
# treebuilder.py — tokens → DOM tree with recovery (~40 lines)
VOID = {"br", "img", "input", "hr", "meta", "link"}

class DOM:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent = tag, attrs or {}, parent
        self.kids, self.text = [], ""
    def query(self, tag):
        found = [c for c in self.kids if getattr(c, "tag", None) == tag]
        for c in self.kids: found += c.query(tag) if hasattr(c, "query") else []
        return found
    def show(self, depth=0):
        pad = "  " * depth
        if self.text: print(pad + repr(self.text))
        else:
            print(pad + f"<{self.tag}>")
            for kid in self.kids: kid.show(depth + 1)

AUTO_CLOSE = {"p": {"p"}, "li": {"li"}, "tr": {"tr", "td"}, "td": {"td"}}

def build(tokens):
    html = DOM("html"); body = DOM("body", parent=html)
    html.kids.append(DOM("head")); html.kids.append(body)
    stack = [body]                                          # open elements: html, body
    for tok in tokens:
        kind = tok[0]
        top = stack[-1]
        if kind == "text":
            top.kids.append(DOM("#text", parent=top)); top.kids[-1].text = tok[1]
        elif kind == "start":
            tag, attrs, void = tok[1], tok[2] if len(tok) > 2 else {}, tok[3] if len(tok) > 3 else False
            if tag in AUTO_CLOSE and stack[-1].tag in AUTO_CLOSE[tag]:
                stack.pop()                                 # auto-close (p closes p)
            node = DOM(tag, attrs, stack[-1])
            stack[-1].kids.append(node)
            if not void: stack.append(node)                 # descend unless void (Ch 5's list)
        elif kind == "end":
            for k in range(len(stack) - 1, 0, -1):          # recovery: search up the stack
                if stack[k].tag == tok[1]:
                    del stack[k:]                           # close intermediates too
                    break                                   # no match: ignore (specified!)
    return html

from tokenizer import tokenize                              # Chapter 2's tokenizer
tree = build(tokenize('<p>one <b>bold<p>two</div>stray end<img src="x">'))
tree.show()
# <html>
#   <head>
#   <body>
#     <p>
#       'one '
#       <b> 'bold'
#     <p> 'two'                        ← auto-closed p; <b> closed by recovery
#     'stray end'                      ← text after ignored </div>: kept as text
#     <img> {'src': 'x.png' → {'src': 'x'}}   ← void: no descend
```

Every recovery the spec demands, implemented as stack discipline: auto-close by
context, search-and-close on end tags, ignore unmatched ends, keep everything else
as content.

## What you now know

- The tree builder adds **implied structure** (html/head/body) and enforces
  **context rules** (p closes p, li closes li) via an open-elements stack.
- Recovery is **never deletion**: stray end tags are ignored, stray text is kept —
  the DOM always contains everything.
- The DOM is the **contract**: Ch 4's cascade walks it, Ch 5–6 lay it out, Ch 8
  paints it, Ch 9's links live in it.

Next: the tree is bare. Give every node its computed style — the cascade engine,
with real selector matching and specificity arithmetic.
