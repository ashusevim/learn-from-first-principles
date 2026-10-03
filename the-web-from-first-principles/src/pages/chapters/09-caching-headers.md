---
layout: ../../layouts/Chapter.astro
title: 'Caching: The Headers That Save the World'
description: 'Cache-Control, ETag, 304s — the protocol’s memory. Build: request twice, watch the second cost nothing.'
part: 'Part III — Fast & Modern'
written: true
---

Chapters 2–8 made one load fast. Chapter 9 makes the *next* load free — because the
cheapest request is the one **never sent**, and the second cheapest is one answered
with 304 Not Modified: no body, no render, a few hundred bytes. The mechanism is two
headers every response carries — and the difference between sites that feel instant on
return visits and sites that re-download everything, every time.

## The lie you were told

> "Caching is an infrastructure feature (Redis, CDNs)."

The browser has a full **HTTP cache**, governed by response headers *your server
sends* — no infrastructure required. The two mechanisms:

```text
FRESHNESS (no request at all):
  Cache-Control: max-age=31536000     ← "this byte-sequence is valid for a year"
  → browser serves from disk/memory cache; the Network panel shows "(disk cache)"

VALIDATION (a cheap question, if stale):
  ETag: "v42"                         ← a fingerprint of the content
  → browser re-requests with If-None-Match: "v42"
  → server: unchanged? "304 Not Modified" (no body!) — changed? "200" + new body
```

Freshness beats validation beats refetching. The art is choosing per resource: HTML
gets `no-cache` ("revalidate always — the user must see fresh navigation"), hashed
assets (`app.3f9a2.js`) get `max-age=31536000, immutable` (the filename *is* the
version — Chapter 10's fingerprinting), APIs get short/no store.

## The invalidation trick that runs the modern web

"Deployed new CSS but users see the old one" — the classic. The fix isn't cache
busting headers; it's **content-addressed filenames** (the Git course's hashing
model!):

```html
<link rel="stylesheet" href="/app.3f9a2b.css">   ← deploy changes the hash
<link rel="stylesheet" href="/app.9c1f7d.css">   ← new URL = new cache entry, instantly
```

HTML (short max-age) references hashed assets (eternal max-age): new deploy → new
HTML → new asset URLs → users get updates *immediately* with year-long caching. The
whole dance is one indirection.

## Prove it to yourself

**1. The 304, live:**

```sh
curl -sv https://example.com -o /dev/null 2>&1 | grep -iE 'etag|200'
curl -sv https://example.com -o /dev/null 2>&1 | grep -iE 'if-none-match|304'
# second request: If-None-Match matches the ETag → 304 Not Modified, no body
```

**2. DevTools proves the zero-cost load** — Network panel, disable "Disable cache",
reload twice:

```text
first load:  12 requests, 340 KB transferred
second load: 12 requests, 0 KB transferred — Size column reads "(disk cache)"
```

**3. The cache-control inventory of a real site:**

```sh
curl -sI https://example.com | grep -i cache
curl -sI https://cdn.example.com/app.3f9a2b.js | grep -i cache
# HTML: no-cache or max-age=0 (must revalidate) — assets: max-age=31536000, immutable
```

## The build: an ETag server in ~30 lines

```python
# etagserver.py — a tiny HTTP server with honest ETag/304 semantics
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler

PAGE = b"<h1>the expensive body</h1>" * 1000           # ~26KB of "content"
ETAG = '"' + hashlib.sha1(PAGE).hexdigest()[:16] + '"'  # fingerprint of the BYTES

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        inm = self.headers.get("If-None-Match")         # the browser's question:
        if inm == ETAG:                                 # "is your copy still 'v42'?"
            self.send_response(304)                     # NO BODY. ~100 bytes total.
            self.end_headers()
            print("→ 304: client's cache is valid — body never re-sent")
            return
        self.send_response(200)
        self.send_header("ETag", ETAG)
        self.send_header("Cache-Control", "no-cache")   # revalidate ALWAYS (it's HTML)
        self.end_headers()
        self.wfile.write(PAGE)
        print("→ 200: full body sent (first visit, or content changed)")

HTTPServer(("", 8080), Handler).serve_forever()
```

```sh
python3 etagserver.py &
curl -si localhost:8080 | head -3      # 200 + ETag "..." (26KB body)
curl -si localhost:8080 | head -3      # 304 — zero body. The validation tax: ~200 bytes.
# change PAGE, rerun: ETag differs → 200 with the fresh body. Automatic invalidation.
```

That's the entire mechanism real frameworks generate: fingerprint (ETag) → compare →
304. Note what it *can't* do: with `no-cache`, the request still travels (latency,
Chapter 3!). Pair it with `max-age` on assets and the requests vanish entirely.

## What you now know

- Two mechanisms: **freshness** (`max-age`: don't even ask) and **validation**
  (`ETag`/304: ask cheaply). Freshness wins when you can get it.
- The deploy-invalidation pattern: **hashed asset URLs + short-lived HTML** — one
  indirection, instant updates, year-long caching.
- Heuristic caching exists (no headers? browser guesses from Last-Modified) — send
  explicit headers and own your cache behavior.
- "Second load is instant" is engineered by headers *you* control — audit them with
  `curl -I` on every resource your page requests.

Next: with caching minimizing requests, minimize the bytes that remain — compression,
and the image-format battlefield where most of the web's bytes actually live.
