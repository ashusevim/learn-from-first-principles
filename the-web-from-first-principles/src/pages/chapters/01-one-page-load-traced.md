---
layout: ../../layouts/Chapter.astro
title: 'One Page Load, Traced End to End'
description: 'Follow one URL from your fingers to pixels: DNS, TCP, TLS, HTTP, parse, paint — every hop named, every delay measured.'
part: 'Part I — The Pipe'
written: true
---

You press Enter; a page appears. Between those two events lies the most sophisticated
machine civilians interact with daily: cache lookups, a DNS walk, a TCP handshake, a
TLS negotiation, an HTTP request, a parse tree, a style cascade, layout, paint. This
course traces **one page load — byte by byte, hop by hop** — and ends with you building
a mini browser. Today: the whole journey at altitude, with every stage *measured*, so
each later chapter has a timestamp to fill in.

## The lie you were told

> "The browser downloads the page and shows it."

"Downloads and shows" hides a pipeline of ~15 stages across 4 layers — and the trace
below will assign milliseconds to each. The surprise preview: on a typical page, the
network is *minority* of the time. Most of the load is parsing, style computation, and
layout — the parts no CDN can accelerate.

## The journey, annotated

```text
ENTER "https://example.com"
  1. URL parse          scheme/host/path; is it even web?
  2. cache checks       browser HTTP cache? service worker? (Ch 9: the free wins)
  3. DNS                browser cache → OS cache → resolver → authority   (Ch 2)
  4. TCP handshake      SYN → SYN-ACK → ACK            (networking course, Ch 4!)
  5. TLS handshake      ClientHello → ... → keys       (networking course, Ch 10!)
  6. HTTP request       GET / HTTP/2 (Ch 4 of this course: streams, not text lines)
  7. server             your backend: the whole First Principles Project's subject
  8. response bytes     headers (Ch 9: cache them!) + gzip/brotli body (Ch 10)
  9. HTML parse         bytes → tokens → DOM tree                        (Ch 5)
 10. subresources       CSS/JS/images discovered mid-parse → back to step 3 each
 11. CSS parse + cascade→ computed styles per element                     (Ch 6)
 12. JS                 event loop, DOM mutations (concurrency course, Ch 7!) (Ch 7)
 13. layout             geometry for every box                            (Ch 8)
 14. paint + composite  pixels to the screen                              (Ch 8)
```

Three of your sibling courses already own stages 4, 5, and 7 — this course picks up the
browser-specific stages and their *timings*.

## Prove it to yourself

**1. The waterfall — every stage, timestamped** (DevTools → Network → reload):

```text
example.com   200   DNS 12ms   connect 23ms   TLS 28ms   TTFB 45ms   download 2ms
```

Read the bars: DNS, connect, TLS are the *connection tax* (Chapter 3); TTFB is server
time; the rest is transfer. Hover each segment — this line is the table of contents of
the course.

**2. The performance panel — where the time actually goes** (DevTools → Performance →
reload → bottom-up view):

```text
scripting   ████████ ← parse HTML, run JS (Ch 5, 7)
rendering   ████     ← style, layout (Ch 6, 8)
painting    ██       ← raster, composite (Ch 8)
system      █        ← network (Ch 2–4), idle
```

On content-heavy sites, "networking" is a sliver — the machine doing the real work is
the one on your desk.

**3. The raw wire** — the networking course's tools, on this exact load:

```sh
sudo tcpdump -n 'host example.com and port 443' &
curl -so /dev/null https://example.com
# TCP handshake packets, ClientHello, ApplicationData — Ch 4/10 of networking,
# now carrying *your page*.
```

## The build: a measurement harness you'll extend all course

One `curl` command produces the course's baseline numbers — each chapter will shave a
stage:

```sh
#!/bin/sh
# pagestats.sh — the cost breakdown of one page load, per stage
curl -s -o /dev/null -w '
dns        %{time_namelookup}s
tcp        %{time_connect}s        (handshake done)
tls        %{time_appconnect}s     (TLS done — delta from tcp = TLS cost)
first-byte %{time_starttransfer}s  (TTFB — delta from tls = server time)
total      %{time_total}s
size       %{size_download} bytes over HTTP/%{http_version}
' https://example.com
```

```text
dns        0.012345s
tcp        0.035678s        ← delta 0.023s = TCP handshake (1 round trip)
tls        0.063210s        ← delta 0.027s = TLS 1.3 (1 round trip — Ch 3)
first-byte 0.088456s        ← delta 0.025s = server think time
total      0.090123s
size       1256 bytes over HTTP/2
```

Save this script. Chapter 3 dissects the tcp/tls deltas; Chapter 9 makes second loads
free; Chapter 11 attacks the handshake itself. Every optimization in web performance is
an attack on one of these five numbers.

## What you now know

- A page load is a **15-stage pipeline across 4 layers** — network is the minority on
  typical pages.
- The connection tax (DNS + TCP + TLS) is paid before *any* HTTP bytes flow — the
  first target of every optimization.
- DevTools' Network and Performance panels are the receipts — and the course's map:
  chapters 2–4 own the waterfall, 5–8 own the performance panel.
- You have a five-number measurement harness — the baseline every chapter improves.

Next: the first stage of the pipe — the DNS walk, the four caches that usually make it
free, and DoH quietly relocating it.
