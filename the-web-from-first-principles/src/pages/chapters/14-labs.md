---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini browser from Chapter 12 — DNS, connections, caching, the render pipeline. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in timings, headers, or pixels you produced —
using the mini browser (`fetch`, `parse`, `cascade`, `layout`, `render`, `load`)
from Chapter 12 plus `curl` and a local server. Nothing here is new: DNS (Ch 2),
connections (Ch 3), HTTP (Ch 4), DOM (Ch 5), CSS (Ch 6), the loop (Ch 7),
rendering (Ch 8), caching (Ch 9). What is new is *breaking each stage* and
watching the page confess which one you broke.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Serve a test page from `python3 -m http.server` so every stage
is under your control.

| Tool | What it proves |
|---|---|
| `mini_browser.load(url)` | the pipeline, end to end, in your own code |
| `curl -w` timing variables | DNS, TCP, TLS, TTFB as numbers |
| response headers | the caching contract, in writing |
| `time.sleep` in a handler | a slow server, on demand |

## Warm-ups

**Lab 1.1 — Load your page in your browser**
**Goal:** the pipeline runs on bytes you serve.
**Do this:**
```python
# serve test.html with <h1>, <p>, a link — then:
mini.load("http://localhost:8000/test.html")
```
**You'll know it works when:** the tkinter canvas shows heading and paragraph
at cascade sizes (32/14 from `DEFAULTS`) — fetch, parse, cascade, layout,
render, all yours.
**Where it comes from:** Chapter 12 — Final Boss: A Mini Browser in ~300 Lines.

**Lab 1.2 — Name the stages with numbers**
**Goal:** DNS/TCP/TLS/TTFB as measurable, separable costs.
**Do this:**
```sh
curl -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttotal}\n' -o /dev/null https://example.com
```
**You'll know it works when:** each stage reports separately and tls > tcp >
dns on a cold run. Run twice: dns and tls shrink — caches and resumption,
caught in the act.
**Where it comes from:** Chapters 2–3.

**Lab 1.3 — Read the caching contract**
**Goal:** headers are the cache's instructions, in writing.
**Do this:**
```sh
curl -s -D - -o /dev/null https://example.com | grep -iE 'cache-control|etag|last-modified'
```
**You'll know it works when:** you can state, for that response, who may cache
it and for how long — and re-request with `If-None-Match` to see the `304`.
**Where it comes from:** Chapter 9 — Caching: The Headers That Save the World.

**Lab 2.1 — One connection, many resources**
**Goal:** connection reuse beats handshakes (Chapters 3–4).
**Do this:** time 10 sequential `curl`s to the same host with fresh connections
vs a single reused connection (`curl` URLs in one command), and sum the totals.
**You'll know it works when:** the reused batch saves ~9 handshakes' worth of
RTT. That saving is HTTP/2's reason to exist — measured before it's named.
**Where it comes from:** Chapters 3 and 4.

**Lab 2.2 — Cascade order vs specificity**
**Goal:** two rules, one element — specificity outranks source order (Ch 6).
**Do this:** render a `<p class="a">` where `.a { color: green }` appears
*before* `p { color: red }` in the stylesheet.
**You'll know it works when:** the paragraph is green — class beats element
despite losing the order race. Reverse the order and nothing changes; that
indifference *is* the cascade.
**Where it comes from:** Chapter 6 — CSS: Selectors, Specificity & the Cascade.

**Lab 2.3 — Freeze the event loop**
**Goal:** one thread means one long task stalls the world (Chapter 7).
**Do this:** add a button to the test page whose handler runs a 2-second
`while` loop; click it, then try a second button mid-freeze.
**You'll know it works when:** clicks queue and land after the loop — nothing
renders, nothing responds. Every async API you use exists because of this lab.
**Where it comes from:** Chapter 7 — JavaScript: The Single Thread That Runs Everything.

**Lab 2.4 — Layout thrash, on camera**
**Goal:** interleaved reads and writes force reflow per frame (Chapter 8).
**Do this:** in a page script, read an element's position then write a style,
looped 100 times; compare frame time against batching all reads then all writes.
**You'll know it works when:** the interleaved version costs multiples of the
batched one — forced synchronous layout, priced in milliseconds.
**Where it comes from:** Chapter 8 — The Render Pipeline: Layout, Paint, Composite.

**Lab 2.5 — Cache it, then break the cache**
**Goal:** `max-age`, `ETag`, and busting — the whole contract, operated.
**Do this:** serve `app.js` with `Cache-Control: max-age=60` and an ETag;
re-request (expect a local hit or `304`); edit the file, rename it `app.v2.js`,
update the HTML, and re-load.
**You'll know it works when:** the old URL keeps serving cached bytes until
max-age, and only the *new* URL fetches fresh — cache busting by name, working
as designed.
**Where it comes from:** Chapter 9 — Caching: The Headers That Save the World.

## Stretch goals

**Lab 3.1 — The slow-server waterfall**
**Goal:** attribute latency to the right stage (Chapter 1's trace, repeated).
**Do this:** add `time.sleep(1)` to your test server; re-run Lab 1.2's curl
timing and the mini browser load.
**You'll know it works when:** only TTFB moves ~1s while dns/tcp/tls stay
constant — the delay is server-side, and the numbers prove it. Diagnosis by
subtraction, the on-call skill.
**Where it comes from:** Chapters 1 and 4.

**Lab 3.2 — Mini browser vs the real one**
**Goal:** your pipeline against Chrome's, pixel-adjacent (Chapter 12).
**Do this:** render your test page in the mini browser and Chrome; screenshot
both; diff the block positions and font sizes for h1/h2/p/li.
**You'll know it works when:** block stacking and cascade sizes match; text
wrapping and inline details differ. The differences are precisely Chapters 5–8's
"we omitted" list — which is now your reading list.
**Where it comes from:** Chapters 5–8 and 12.

## Self-checking without a grader

- **Timing labs** (1.2, 2.1, 3.1): stage-by-stage numbers, before/after pairs.
  Subtraction between runs is the diagnosis; print both runs.
- **Behavior labs** (2.2–2.5): green paragraphs, queued clicks, frame-time
  multiples, cache hits by name. Each has a visible before/after.
- **Comparison labs** (3.2): the screenshot diff against a real browser. The
  gap between your pixels and Chrome's is a syllabus, not a failure.

## What you now know

- **Every stage of a load is separately measurable** — and "the site is slow"
  is a claim you can now decompose in one command (Labs 1.2, 3.1).
- **The cascade and the event loop are rulebooks** (Labs 2.2–2.3): specificity
  outranks order; one thread outranks everything.
- **Caching is a contract you can read** (Labs 1.3, 2.5): headers in, `304`s
  and busting out.
- Your mini browser is a working model of the real pipeline — and the pixel
  diff against Chrome is the map of what to learn next (Lab 3.2).

Next: open DevTools' Performance panel on your favorite site, label every
waterfall segment with a chapter — the unlabeled segments are the next course.

## Builds
