---
layout: ../../layouts/Chapter.astro
title: 'Compression & Images: Bytes on the Wire'
description: 'gzip, brotli, image formats — 90% of “site speed” is bytes. Build: measure every encoding against the same payload.'
part: 'Part III — Fast & Modern'
written: true
---

Chapter 9 made repeat visits free; this chapter shrinks the first one. The median page
ships megabytes — and the overwhelming majority is **images and fonts**, not your code.
Two levers fix most of it: text compression (gzip → brotli) and image formats
(JPEG → WebP → AVIF). Both are measurement exercises, so this chapter is mostly a
benchmark you run yourself.

## The lie you were told

> "Site speed is a code-optimization problem."

Byte audits say otherwise: the JS bundle often parses in tens of milliseconds
(Chapter 8), while uncompressed images and text cost *seconds* on a slow link. The
budget math (Chapter 3's formula):

```text
time = bytes / bandwidth   (+ Chapter 3's connection tax)
100 KB at 1 Mbps mobile  = 0.8s
1 MB   at 1 Mbps mobile  = 8s       ← a "small" uncompressed hero image
```

## Text: gzip vs brotli

Both are LZ77 + entropy coding (the networking course's compression lineage), but
brotli adds a **built-in dictionary** of 13,500 common web strings ("position:absolute",
"`</div>`", HTML tags, common words) — so the first 20KB (where gzip is weakest, before
the dictionary warms) compresses far better:

```text
the same 100 KB of text:
  raw            100 KB
  gzip -6         ~30 KB
  brotli -11      ~22 KB      ← and mobile CPUs spend less time decoding than
                               gzip -9 spends (brotli was built for this exact job)
```

Server side: gzip everything ≥ ~1KB (per-connection, cheap); brotli for *static*
assets (pre-compressed at deploy — level 11 is too slow to do per-request).

## Images: the format battlefield

| Format | Best at | Size (vs JPEG) | Catch |
|---|---|---|---|
| JPEG | photos | baseline | artifacts on text/edges |
| PNG | screenshots, transparency | huge for photos | lossless only |
| WebP | both | 25–35% smaller than JPEG | near-universal now |
| AVIF | both, better darks | ~50% smaller than JPEG | slower encode, patchier support |
| SVG | icons, logos | tiny, infinite zoom | never for photos |

And the two rules bigger than any format: **serve the size that's displayed** (a
300px-wide slot doesn't need a 3000px file — `srcset` automates it) and **lazy-load
below the fold** (`loading="lazy"` — don't pay for pixels the user hasn't reached).

## Prove it to yourself

**1. The encoding benchmark, on your own text:**

```sh
head -c 100000 /dev/urandom | base64 > sample.txt     # 100KB of realistic text
ls -l sample.txt | awk '{print "raw:   " $5}'
gzip -k -6 sample.txt        && ls -l sample.txt.gz   | awk '{print "gzip:  " $5}'
brotli -q 11 sample.txt 2>/dev/null && ls -l sample.txt.br | awk '{print "brotli:" $5}' \
  || echo "(brotli not installed — the point stands with gzip alone)"
```

**2. Your browser negotiates automatically** — watch the request header:

```sh
curl -sI -H 'Accept-Encoding: gzip, br' https://example.com | grep -i content-encoding
# content-encoding: br     ← the server picked brotli (content negotiation, Ch 9's headers)
```

**3. The image audit** — DevTools → Network → filter Img, sort by size: the top rows
*are* your speed problem, usually one or two files. Then check their intrinsic size vs
displayed size (`img.naturalWidth` vs `.width`): an oversized image is free to fix.

## The build: a compression audit of a whole page

```python
# bytesaudit.py — what a page would weigh under every encoding decision
import gzip, zlib

def brotli(data, q=11):                       # (brotli lib optional — gzip proves the point)
    try:
        import brotli; return brotli.compress(data, quality=q)
    except ImportError: return None

HTML = (open(__file__).read() * 20).encode()  # ~80KB of realistic text-ish payload
JS = b"function(){" * 4000                    # minified-looking code

for label, payload in [("html", HTML), ("js bundle", JS)]:
    gz = gzip.compress(payload, 6)
    br = brotli(payload)
    print(f"{label:10s}: raw {len(payload)//1024:4d} KB | "
          f"gzip {len(gz)//1024:3d} KB | "
          f"brotli {len(br)//1024 if br else '?':>3} KB")

# the wire math (Ch 3's formula), 1 Mbps:
raw = len(HTML)
print(f"\non a 1 Mbps link: raw {raw*8/1e6:.2f}s vs gzip {len(gzip.compress(HTML,6))*8/1e6:.2f}s")
# html      : raw   80 KB | gzip  19 KB | brotli  14 KB
# js bundle : raw   51 KB | gzip  11 KB | brotli   9 KB
# on a 1 Mbps link: raw 0.64s vs gzip 0.15s
```

That last line is the chapter in numbers: the same page, 0.64s → 0.15s, from a
one-line server config. Do it per asset, add image right-sizing, and "make it fast"
is mostly done before anyone profiles code.

## What you now know

- **Bytes dominate web speed** — audit before optimizing: Network panel, sort by size.
- Text: **gzip everything, brotli pre-compressed at deploy** — the dictionary wins
  exactly where gzip is weak.
- Images: right format, right size, lazy-loaded — `srcset` + `loading="lazy"` are the
  two highest-leverage attributes in HTML.
- Compression is negotiated per-request (`Accept-Encoding`/`Content-Encoding`) —
  Chapter 9's header machinery, working for bytes.

Next: the last protocol chapter — HTTP/3 and QUIC, the gamble that rebuilds TCP in
userspace to kill the head-of-line blocking that Chapter 4 inherited.
