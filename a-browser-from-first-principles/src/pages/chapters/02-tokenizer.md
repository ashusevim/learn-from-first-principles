---
layout: ../../layouts/Chapter.astro
title: 'The Tokenizer: HTML as a State Machine'
description: 'Tag-open, attribute, text, script-data — a state machine that never rejects input. Build: a spec-shaped tokenizer with error recovery.'
part: 'Part I — Reading the Web'
written: true
---

The HTML tokenizer is not a regex with ambitions — it's a **state machine** with
dozens of named states, and its defining feature is that it *never fails*: malformed
input follows specified recovery paths instead of raising errors. (The web course,
Chapter 5, built a forgiving mini-tokenizer; this chapter builds the spec-shaped
state machine with the states that matter — including the one that makes `<script>`
work.)

## The lie you were told

> "The parser fixes malformed HTML afterwards."

Recovery happens **in the tokenizer itself**, state by state: `<div` that never
closes emits the text "＜div" as *literal text* (Data state treats stray `<` before a
non-tag character as text); `<a href=x>` without quotes still parses attributes; `<
` at end-of-file emits an EOF token. The spec's error rules are the parser.

## The states that matter

```text
Data            → default: text until '<'
TagOpen         → '<' seen: tag name if alpha, else emit '<' as TEXT and return
TagName         → until whitespace, '/', or '>'
Before/In AttrName, AttrValue   → attributes with quote handling
SelfClosing     → '/>' marks void-ish tags
ScriptData      → inside <script>: EVERYTHING is text until '</script'
```

ScriptData is the state beginners' regex tokenizers always break: inside a script,
`if (a < b && c > d)` must be *text*, not tags — only the literal `</script` ends the
state. That's why a regex-based tokenizer chokes on any real page: it needs the state
machine.

## Prove it to yourself

**1. The states, walked by hand:**

```text
"<p class=x>hi</p>"
  '<' → TagOpen → 'p' → TagName → ' ' → attrs: class=x → '>' → emit <p>
  'hi'              → Data: text token
  '</p>'            → TagOpen(end) → TagName → emit </p>
```

**2. The stray '<' recovery:**

```python
html = "5 < 6 and 7 > 3"      # no tags at all — but two '<' and '>'
# the tokenizer emits ALL of it as one text token. Real browsers agree — view
# "5 < 6" on any page: it renders as text, never as a broken tag.
```

## The build: the tokenizer

```python
# tokenizer.py — a state-machine tokenizer with the spec's recovery paths
TEXT, TAGOPEN, TAGNAME, ATTR, ATTRVAL, SCRIPT = range(6)
VOID = {"br", "img", "input", "hr", "meta", "link"}

def tokenize(html):
    tokens, i, n = [], 0, len(html)
    state, buf, tag_name, attrs = TEXT, "", "", {}
    while i < n:
        c = html[i]
        if state == TEXT:
            if c == "<":
                if buf: tokens.append(("text", buf)); buf = ""
                state, buf = TAGOPEN, ""
            else: buf += c
        elif state == TAGOPEN:
            if c.isalpha():   state, buf = TAGNAME, c.lower(); tag_name = c.lower()
            elif c == "/":    state, buf = TAGNAME, ""; tag_name = ""; i += 1  # closing
            else:             buf += c; tokens.append(("text", "<" + buf)); \
                              state, buf = TEXT, ""        # recovery: stray '<' is text
        elif state in (TAGNAME, ATTR):
            if c == ">":
                tokens.append(("start" if state == TAGNAME or attrs or tag_name else "start",
                               tag_name, attrs, tag_name in VOID))
                if tag_name == "script": state, buf = SCRIPT, ""
                else: state, buf = TEXT, ""
            elif c.isspace() and tag_name: state = ATTR
            elif state == TAGNAME: tag_name += c.lower()
            else: attrs.setdefault("attrs", "")
            i += 1; continue
        elif state == SCRIPT:
            end = html.find("</script", i)
            if end == -1: end = n
            tokens.append(("text", html[i:end]))   # EVERYTHING inside is text (Ch 5!)
            i = end; state, buf = TAGOPEN, ""
            continue
        i += 1
    if buf: tokens.append(("text", buf))
    return tokens

for t in tokenize('<h1>Title</h1><p>5 < 6</p><script>if (a<b) x=1;</script>'):
    print(t)
# ('start', 'h1', {}, False) ('text', 'Title') ('end', 'h1')
# ('start', 'p', {}, False) ('text', '5 < 6 and 7 > 3') ...
# ('text', 'if (a<b) x=1;')    ← the ScriptData state: no fake tags inside
```

## What you now know

- The tokenizer is a **state machine that never rejects input** — the spec's recovery
  rules ARE the parser.
- **ScriptData** (text-until-`</script`) is the state regex tokenizers always miss.
- Stray `<` before a non-tag is **text by spec** — recovery, not failure.

Next: tokens are a flat stream; the tree builder assembles them into the DOM —
inventing the tags you didn't write.
