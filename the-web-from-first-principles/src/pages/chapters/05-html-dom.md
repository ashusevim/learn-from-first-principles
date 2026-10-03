---
layout: ../../layouts/Chapter.astro
title: 'HTML Parsing & the DOM Tree'
description: 'Bytes → tokens → nodes → the live tree. Build: a tokenizer in ~60 lines that survives malformed HTML.'
part: 'Part II — The Document'
written: true
---

The pipe (Chapters 1–4) delivered HTML bytes. The browser's first act: **parsing** —
and it's nothing like the strict parsers you know. The HTML spec's tokenizer is
deliberately *error-forgiving*: there is no "invalid HTML" at parse time, only "HTML
the spec says to interpret this way". This chapter builds a tokenizer and tree
builder that shrug off malformed input — and explains why that forgiveness shaped the
entire web.

## The lie you were told

> "The browser waits for clean, closed HTML before rendering."

Historically backwards. Browsers competed on rendering *broken* pages in the 90s; when
the spec was finally written (WHATWG, 2007), it **reverse-engineered** what browsers
actually did with garbage and codified it. Consequences:

- Unclosed `<p>` tags, mismatched quotes, `<b><i></b></i>` — all have *specified*
  recoveries.
- Parsing is **streaming**: rendering can begin before the bytes end (Chapter 8's
  pipeline).
- `<script>` mid-parse **pauses the parser** (it may mutate the tree via
  `document.write`) — unless `defer`/`async` say otherwise. The single biggest
  HTML-structure performance rule, born in the tokenizer.

## The two stages

```text
bytes ──(encoding)──► code points ──TOKENIZER──► tags, attrs, text ──TREE BUILDER──► DOM

tokenizer states: Data → TagOpen → TagName → BeforeAttrName → AttrValue → ...
tree builder:     <html><head></head><body>...   (implicit tags CREATED for you!)
```

The tree builder is the surprising part: it *invents* structure. Omit `<html>`,
`<head>`, `<body>`, `</p>`, even `</html>` — the spec inserts them. Tables have special
recovery ("foster parenting": stray text before `<table>` gets moved *before* the
table). Your browser runs a tiny state machine of these rescues on every page.

## Prove it to yourself

**1. The invented structure:**

```sh
cat > broken.html <<'EOF'
<p>one
<p>two
<div>three
EOF
# open in a browser → DevTools → Elements: <html>, <head>, <body> all exist,
# the <p>s are CLOSED for you, </div></body></html> implied. Nobody wrote them.
```

**2. The script pause:**

```html
<script>document.write("<b>mid-parse!</b>")</script>
<span>after</span>
```

The `<b>` lands *before* `<span>` in the DOM — the parser literally stopped, ran JS,
resumed. `defer`/`async` are promises that free the parser from this pause (Chapter 8's
pipeline thanks them).

**3. Foster parenting, the deepest cut:**

```html
<table>stray text</table>
```

DevTools shows the text **before** the table — the spec forbids text as a table child
and relocates it. Specified, deterministic recovery of nonsense.

## The build: a forgiving tokenizer + tree builder (~60 lines)

```python
# htmlparse.py — bytes → tokens → tree; malformed input welcome
VOID = {"br", "img", "input", "hr", "meta", "link"}

def tokenize(html):
    i, n = 0, len(html)
    while i < n:
        if html[i] == "<" and (i + 1 < n) and (html[i+1].isalpha() or html[i+1] == "/"):
            j = html.find(">", i)
            if j == -1: j = n                                  # unclosed tag: recover
            tag = html[i+1:j].strip()
            if tag.startswith("/"):
                yield ("end", tag[1:].split()[0])              # </tag>
            else:
                parts = tag.split(None, 1)
                attrs = dict(re.findall(r'(\w+)="([^"]*)"', parts[1])) if len(parts) > 1 else {}
                yield ("start", parts[0], attrs)               # <tag attrs>
                if parts[0] in VOID: yield ("end", parts[0])   # void tags self-close
            i = j + 1
        else:
            j = html.find("<", i + 1)
            if j == -1: j = n
            text = html[i:j].strip()
            if text: yield ("text", text)                      # text between tags
            i = j

import re

def build(html):
    root = {"tag": "html", "attrs": {}, "kids": []}
    stack = [root]
    for tok in tokenize(html):
        top = stack[-1]
        if tok[0] == "start":
            node = {"tag": tok[1], "attrs": tok[2], "kids": []}
            top["kids"].append(node)
            if tok[1] not in ("br", "meta", "link"):           # not self-closing here
                stack.append(node)                             # descend
        elif tok[0] == "end" and len(stack) > 1:
            # forgiving close: if it doesn't match the top, close IMPLICIT tags up to it
            for k in range(len(stack) - 1, 0, -1):
                if stack[k]["tag"] == tok[1]:
                    del stack[k:]                              # pop to the matching open
                    break
        else:
            top["kids"].append({"text": tok[1]})
    return root

def show(node, depth=0):
    if "text" in node: print("  " * depth + repr(node["text"])); return
    print("  " * depth + f"<{node['tag']}> {node['attrs'] or ''}")
    for kid in node["kids"]: show(kid, depth + 1)

show(build('<p>hello <b>bold</p>world<img src="x.png"><p>next'))
# <html>
#   <p>  hello <b>bold — the </p> closed BOTH p and b (recovery)
#   text 'world'
#   <img> {'src': 'x.png'}      ← void: no closing tag needed
#   <p>  next                   ← a sibling, not a child (previous p was closed)
```

Twenty lines of tokenizer, twenty of tree, and it already behaves like the spec on the
cases that matter: unclosed tags, void elements, recovery. The real HTML spec's
tokenizer is this state machine with ~80 enumerated error-recovery rules — readable
*after* this build.

## What you now know

- HTML parsing is **streaming and error-forgiving by codified design** — the spec
  reverse-engineered browser mercy.
- The tree builder **invents structure**: implicit html/head/body, closed `<p>`s,
  foster-parented table text.
- `<script>` pauses the parser — `defer`/`async` are the escape hatches (Chapter 8
  returns to why this dominates load performance).
- The DOM is just this tree, made live and scriptable (Chapter 7 gives it a thread).

Next: a tree of nodes with no styling is a .txt file. Enter CSS — and the deterministic
arithmetic that picks one winner from ten conflicting rules.
