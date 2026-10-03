---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini browser from Chapter 12 — parse, layout, paint, and break it on purpose. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Reading a chapter convinces you for an hour; running it convinces you for good. These twelve labs run entirely on artefacts the course already built — `tokenize`, `build`, `cascade`, `layout`, `paint`, and the Chapter 12 `browser.py`. Each ends in output you check against your own run.

## How the labs work

| Field | What it gives you |
|---|---|
| **Goal** | the claim the lab proves |
| **Do this** | the smallest change that proves it |
| **You'll know it works when** | the expected output |
| **Where it comes from** | the chapter that taught it |

| Section | Labs |
|---|---|
| Warm-ups | 1.1–1.3 |
| Builds | 2.1–2.5 |
| Stretch goals | 3.1–3.4 |

Self-grade by diffing your output against the expected result; hints are directions, never solutions.

## Warm-ups

**Lab 1.1 — Read the token stream**
**Goal:** see what the tokenizer emits before the tree builder hides it.
**Do this:** feed one line through `tokenize` and print every token.
```python
for t in tokenize('<h1>Hi</h1><p>5 < 6</p>'): print(t)
```
**You'll know it works when:** `('start', 'h1', {}, False)` appears and the `<` in `5 < 6` arrives as **text**, not a tag.
**Where it comes from:** Chapter 2 — The Tokenizer: HTML as a State Machine.

**Lab 1.2 — Count the boxes**
**Goal:** watch layout turn the DOM into rectangles.
**Do this:** lay out two paragraphs and print their geometry.
```python
layout_block(dom, 0, 0, 640, {})
for n in dom.query_all("p"): print(n.rect)   # (x, y, width, height)
```
**You'll know it works when:** each `<p>` prints four numbers and the second's `y` exceeds the first's — boxes stacked, not overlapping.
**Where it comes from:** Chapter 5 — The Box Model & Block Layout.

**Lab 1.3 — Spell an origin**
**Goal:** see how cheaply a URL becomes a trust decision.
**Do this:** write `origin(url)` returning `(scheme, host, port)`; test three URLs.
```python
def origin(u):
    p = urlparse(u); return (p.scheme, p.hostname, p.port or 443)
```
**You'll know it works when:** `https://a.com` and `http://a.com` give **different** tuples, both defaulting to port 443.
**Where it comes from:** Chapter 10 — The URL Bar: Fetching & the Security Boundary.

## Builds

**Lab 2.1 — Name the window**
**Goal:** let the page title reach the shell.
**Do this:** after `dom = build(...)`, find the first `<title>` and call `self.title(text)`.
**You'll know it works when:** a page holding `<title>Example</title>` retitles your window to `Example`.
**Where it comes from:** Chapter 12 — Final Boss: The Complete Browser.

**Lab 2.2 — Real scrolling**
**Goal:** shift the display list instead of rebuilding it.
**Do this:** bind `<MouseWheel>` to `self.scroll_y` and pass it to `paint(dom, self.scroll_y)`.
**You'll know it works when:** the wheel moves the page while `STAGES["layout"]` stays unchanged — a blit, not a re-layout.
**Where it comes from:** Chapter 8 — Painting: Colors, Borders & Text.

**Lab 2.3 — Reload, not revisit**
**Goal:** add the third history move.
**Do this:** a Reload button that re-runs the current URL without touching the back stack.
```python
def reload(self): self.navigate(self.current)   # same URL, no history change
```
**You'll know it works when:** reloading leaves the back button's state unchanged while Back consumes an entry.
**Where it comes from:** Chapter 9 — Navigation & History.

**Lab 2.4 — Guard the bar**
**Goal:** refuse schemes the browser shouldn't fetch.
**Do this:** in `navigate`, reject any scheme not in `{"http", "https"}` before fetching.
**You'll know it works when:** `file:///etc/passwd` prints a blocked-scheme line and loads nothing.
**Where it comes from:** Chapter 10 — The URL Bar: Fetching & the Security Boundary.

**Lab 2.5 — Profile a page**
**Goal:** find which stage owns the milliseconds.
**Do this:** wrap `tokenize`, `build`, `cascade`, and `layout` with `timed(name)`; print `STAGES` descending.
**You'll know it works when:** `cascade` owns the longest bar on a link-heavy page — matching dominates (Chapter 11).
**Where it comes from:** Chapter 11 — Performance: The 16ms Frame Budget.

## Stretch goals

**Lab 3.1 — Wrap a bold span**
**Goal:** prove fragments, not elements, are the unit of layout.
**Do this:** narrow a paragraph until a `<b>bold phrase</b>` splits across two lines.
**You'll know it works when:** two fragments carry the same bold style at **different** `y` values. Any splitting width counts.
**Where it comes from:** Chapter 6 — Inline Layout & Text Wrapping.

**Lab 3.2 — Break an inheritance**
**Goal:** show where inheritance deliberately stops.
**Do this:** add `div { border: 1px solid }`; check a child `span` inherits `color` but gets no border.
**You'll know it works when:** the `span`'s computed has `color` and **no** `border` key. Any two disagreeing properties pass.
**Where it comes from:** Chapter 4 — The Cascade Engine: Specificity & Inheritance.

**Lab 3.3 — Plant a stack bug**
**Goal:** prove the tokenizer's recovery with a deliberate failure.
**Do this:** tokenize `<div><br><p>x</p>`; predict the stack before running it.
**You'll know it works when:** `<br>` never becomes a parent and `x` lands inside the `<p>`. Any input you can argue the stack for works.
**Where it comes from:** Chapter 3 — The Tree Builder & the Live DOM.

**Lab 3.4 — Cache a visit**
**Goal:** make Back instant without re-fetching.
**Do this:** keep a `{url: dom}` dict; on Back reuse it and run only `layout` and `paint`.
**You'll know it works when:** the second visit shows `tokenize` at **zero** ms. Eviction policy is yours.
**Where it comes from:** Chapter 11 — Performance: The 16ms Frame Budget.

## Self-checking without a grader

| Lab class | Evidence | A pass looks like |
|---|---|---|
| Warm-ups | printed values | the token, rect, or origin you predicted |
| Builds | one-line assertions | `assert back_stack == []` runs clean |
| Performance | the stage profile | the expected stage owns the longest bar |
| Stretch goals | a planted failure | the symptom you argued for appears |

**Expected output** settles the warm-ups, **assertions** the builds, **timing** anything performance-shaped, and **a deliberately planted bug** the stretch goals. If you can write the check, the lab is done.

## What you now know

- Every lab runs on **code you already wrote** — no new theory, no external tools.
- A specific expected output separates "I think it works" from a pass.
- The pitfalls of Chapters 2–11 are inputs you can reproduce on demand.
- Breaking your own browser on purpose is the fastest way to trust it.

Next: read the browser's real spec (html.spec.whatwg.org) and "Web Browser Engineering" (browser.engineering) — your pipeline is their early chapters, and the rest of the web is downstream.