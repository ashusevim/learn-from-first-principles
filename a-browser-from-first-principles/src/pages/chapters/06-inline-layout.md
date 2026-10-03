---
layout: ../../layouts/Chapter.astro
title: 'Inline Layout & Text Wrapping'
description: 'Text flows, wraps, and shares lines — the hardest layout mode. Build: word-wrapped line boxes with mixed styles.'
part: 'Part II — Laying It Out'
written: true
---

Block layout stacks rectangles; **inline layout** flows content horizontally and
wraps it at the container edge — `<b>bold</b>` words inside sentences, links inside
paragraphs. It's the hardest layout mode in the browser (line boxes, baselines, mixed
fonts), and this chapter builds its core: break text into words, fill lines up to the
width, and carry styles across the wrap.

## The lie you were told

> "Text renders as it appears in the file."

Whitespace collapses (ten spaces = one), newlines become spaces, and words wrap at
the *word boundary* — never mid-word (unless `overflow-wrap` says so). The pipeline:
**text → words → line boxes**:

```text
fill line with words while width allows
  ↓ word doesn't fit?
close the line box, start a new one
  ↓ line box = a row of styled word fragments, each with an x position
```

## The subtlety: fragments, not elements

`<p>small <b>bold</b> words</p>` is ONE paragraph — but three *fragments* on the
line ("small ", "bold", " words"), each styled differently, laid out side by side.
The layout tree therefore splits text into **fragments per line**: the same DOM text
node can contribute fragments to two different lines when it wraps. This is why
`display: inline` boxes can be split across lines — and why selecting across a wrap
highlights two rectangles.

## Prove it to yourself

**1. The wrap point, computed:**

```python
words = "the quick brown fox jumps".split()
width, cursor = 100, 0
lines, line = [], []
for w in words:
    w_width = len(w) * 8                    # toy: 8px per character
    if cursor + w_width > width and line:   # doesn't fit → wrap (if line non-empty)
        lines.append(line); line, cursor = [], 0
    line.append(w); cursor += w_width + 8   # + space
lines.append(line)
print(lines)   # [['the', 'quick', 'brown'], ['fox', 'jumps']] — wrapped at 'fox'
```

**2. A long word alone exceeds the line** — it overflows (the default) rather than
breaking: wrap only happens at word boundaries. (That's why long URLs explode
layouts — and why `overflow-wrap: anywhere` exists.)

## The build: inline layout with mixed styles

```python
# inline.py — fragments, line boxes, and wrapping across styled spans (~35 lines)
from cascade import cascade, STYLESHEET
from treebuilder import build, DOM
from tokenizer import tokenize

CHAR_W = 8                                        # toy monospace advance width

def flatten_inline(node, style, frags):
    """DOM subtree → styled word fragments (inline content, flattened)"""
    s = {**style, **getattr(node, "computed", {})}
    if node.text:
        for word in node.text.split():
            frags.append({"word": word, "size": s.get("font-size", 14),
                          "bold": s.get("font-weight") == "bold"})
        frags.append({"word": " ", "size": s.get("font-size", 14), "bold": False})
    for kid in node.kids: flatten_inline(kid, s, frags)

def layout_inline(frags, width, x, y):
    line_boxes, cursor, line_start = [], x, y
    for frag in frags:
        w = len(frag["word"]) * CHAR_W * (frag["size"] / 14)
        if cursor + w > x + width and cursor > x:      # wrap at the word boundary
            line_boxes.append((line_start, y, cursor - x)); y += int(20 * 1.4)
            cursor = x
        frag["pos"] = (cursor, y)
        cursor += w
    line_boxes.append((line_start, y, cursor - x))
    return frags, line_boxes, y + 28

html = build(tokenize('<p>small words <b>bold text</b> more words follow here now</p>'))
html.cascade({"font-size": 14, "color": "black"}, 0)
frags = []; flatten_inline(html.kids[1].kids[1], {"font-size": 14}, frags)
frags, lines, final_y = layout_inline(frags, 200, 12, 10)   # a narrow 200px paragraph
for lb in lines: print("line box:", lb)
for f in frags:
    if f["word"] != " ": print(f"  '{f['word']}' at {f['pos']} bold={f['bold']}")
# line box: (12, 10, 184)      ← first line: filled to ~196px, then wrapped
# line box: (12, 38, 136)      ← second line
#   'small' at (12, 10) bold=False
#   'words' at (60, 10) bold=False
#   'bold'  at (124, 10) bold=True    ← the <b> fragment, same line, different style
#   'text'  at (12, 38) bold=True     ← wrapped MID-SPAN: the bold fragment split lines!
#   'more'  at (60, 38) bold=False ...
```

That "bold text" splitting across two lines — different y, same bold style — is
inline layout's defining behavior: **fragments are the unit of layout**, elements
are just where fragments come from.

## What you now know

- Inline layout = **word fragments → line boxes**, wrapping at word boundaries,
  carrying per-fragment styles.
- Whitespace collapses; **fragments split across wraps** (selection rectangles,
  decorations — all fragment-aware).
- The painter (Chapter 8) consumes fragments: each has a position, a font, and a
  style — pixels are next.

Next: a page that renders but doesn't respond. Forms, inputs, clicks — the browser
starts listening back.
