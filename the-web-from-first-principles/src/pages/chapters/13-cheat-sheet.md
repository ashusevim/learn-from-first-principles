---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: The Web on One Page'
description: 'One page load, on one page — DNS, TCP and TLS, HTTP, the render pipeline, caching, and the headers that decide everything.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one load trace with names attached: **DNS finds the door,
TCP+TLS open it, HTTP asks, the render pipeline paints, and caching decides
whether any of that happens again**. The stages, the headers that rule them,
and the failure each one owns.

## The one-page model

```text
  URL → DNS (Ch 2) → TCP handshake (Ch 3) → TLS (Ch 3) → HTTP request/response (Ch 4)
      → parse → DOM (Ch 5) → CSS cascade (Ch 6) → JS event loop (Ch 7)
      → layout → paint → composite (Ch 8) — with caching (Ch 9) skipping most of it
```

Your mini browser (Chapter 12) runs the middle of this row in ~300 lines:
`fetch` → `parse` → `cascade` → `layout` → `render`. Everything before `parse`
is networking; everything after is performance; caching is the handbrake that
skips both.

## The web you actually use

| Name | Meaning | Chapter |
|---|---|---|
| DNS A/AAAA + caches | browser → OS → resolver: names to addresses | 2 |
| TCP 3-way handshake | one RTT before any bytes mean anything | 3 |
| TLS handshake + session reuse | identity + secrecy, amortized by resumption | 3 |
| HTTP/2 streams | one connection, interleaved requests, no head-of-line cure-all | 4 |
| the DOM tree | parse output — the page as objects | 5 |
| the CSS cascade | specificity + inheritance → one computed style per node | 6 |
| the event loop | one thread; long tasks freeze everything | 7 |
| layout → paint → composite | geometry → pixels → layers; the invalidation order | 8 |
| `Cache-Control: max-age` | freshness without the network | 9 |
| ETag / If-None-Match → 304 | revalidation: cheap freshness checks | 9 |
| gzip/brotli + image formats | bytes on the wire are the other half of speed | 10 |
| HTTP/3 + QUIC | the transport rebuilt on UDP | 11 |
| `fetch/parse/cascade/layout/render` | your browser's whole pipeline | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Caching HTML "forever" | users migrate; the page lies until max-age expires | Chapter 9 |
| No `ETag` on cacheable assets | full re-downloads for unchanged bytes | Chapter 9 |
| Blocking the event loop | one 50ms task per frame = dropped frames forever | Chapter 7 |
| Layout thrash (read-write-read) | forced synchronous layout every frame | Chapter 8 |
| Uncached DNS assumptions | every navigation pays the lookup again | Chapter 2 |
| Serving unminified/uncompressed assets | 5× the bytes for identical pixels | Chapter 10 |
| CSS later in the cascade than you think | specificity beats source order; inline beats both | Chapter 6 |
| Assuming HTTP/2 fixes everything | packet loss stalls all streams on one connection | Chapters 4, 11 |
| TLS without session resumption | every connection pays the full handshake | Chapter 3 |
| Measuring only load time | interactions after load are where jank lives | Chapters 7–8, 11 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Faster repeat visits | `Cache-Control` + ETags, hashed asset names | the response is personal/uncacheable — then CDN at the edge (Ch 9) |
| Smaller payloads | brotli text, modern image formats, minification | you measured and bytes aren't the bottleneck (Ch 10) |
| Snappier interactions | break long tasks; animate only compositor props | it is already 60fps — measure first (Ch 7–8) |
| Many small requests | HTTP/2 multiplexing + connection reuse | lossy links stall streams — HTTP/3 (Ch 4, 11) |
| Debugging a slow load | the waterfall: DNS → connect → TLS → TTFB → download | the slowness is after load — then the profiler (Ch 7–8) |
| Understand any page | view-source plus this table — every stage is inspectable | it is minified — the pipeline still applies (Ch 5–8) |

## Prove it to yourself

**1. The handshake is visible:**

```sh
curl -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttotal}\n' -o /dev/null https://example.com
curl -w 'dns:%{time_namelookup} tcp:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttotal}\n' -o /dev/null https://example.com
```

The second run's `dns` and `tls` collapse — caches and session resumption,
measured.

**2. The cascade beats the stylesheet order:**

```css
p { color: blue; }   /* later in the file… */
p { color: red; }    /* same specificity: LAST one wins — try reversing */
```

Add `p.special { color: green; }` and watch specificity outrank order.

**3. Caching skips the whole pipeline:**

```sh
curl -s -D - -o /dev/null https://example.com | grep -iE 'cache-control|etag'
curl -s -D - -o /dev/null -H 'If-None-Match: <etag>' https://example.com | head -1   # 304
```

## What you now know

- **A load is a relay of stages** — and each stage has a cache, a cost, and a
  tool that measures it (Ch 2–4, 9).
- **The render pipeline is ordered and interruptible:** DOM → styles → layout
  → paint → composite; invalidation flows one way (Ch 5–8).
- **One thread runs all your JS** — the event loop is the reason both jank and
  async exist (Ch 7).
- Caching is the most powerful performance tool because it deletes stages,
  not milliseconds (Ch 9).

Next: twelve labs that re-run the trace on purpose — break DNS, stall the
loop, and race your mini browser against the real one.
