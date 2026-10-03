---
layout: ../../layouts/Chapter.astro
title: 'Depth: The Z-Buffer'
description: 'Two triangles overlap — who wins? A depth value per pixel, keep the closest. Build: overlapping triangles sorted by nothing.'
part: 'Part II — 3D and Light'
written: true
---

The painter's algorithm (draw far things first) breaks the moment triangles
interleave — you'd need to sort them, and sorting overlapping polygons is a
topological minefield. The **z-buffer** dissolves the problem: store a depth value
per pixel, and a triangle writes a pixel only if it's *closer* than what's there.
No sorting, no ordering constraints — triangles can arrive in any order and the
image comes out right. This chapter builds it.

## The lie you were told

> "The closest objects are drawn last."

With a z-buffer, **draw order is irrelevant**. Every pixel carries its current
depth; an incoming fragment replaces it only when closer:

```text
z-buffer:  float per pixel, initialized to +∞ (infinitely far)
fragment:  for each pixel the triangle covers:
             if fragment.z < zbuffer[pixel]:      ← closer than what's there?
                 zbuffer[pixel] = fragment.z
                 framebuffer[pixel] = fragment.color
```

N triangles × M pixels each = O(N×M) work, order-free, with one extra float per
pixel. GPUs dedicate enormous memory bandwidth to exactly this buffer.

## The interpolation: depth per pixel, not per triangle

Each triangle vertex carries a depth; the pixels inside interpolate (Chapter 3's
barycentric weights, again!): `z = w0·z0 + w1·z1 + w2·z2`. The edge functions you
built for the fill give the weights for free — the z-buffer is Chapter 3 plus one
array.

## Prove it to yourself

**1. Order irrelevance, proven by permutation:**

```python
import itertools
# two overlapping triangles, every arrival order — same image every time:
# for order in itertools.permutations(range(3)): render(order) → identical framebuffer
```

The painter's algorithm (Chapter 1's "draw far first") cannot make that claim —
interleaved triangles defeat any global sort. (Chapter 8 of the databases course
would call this "order-invariant commutative update".)

**2. The z-fighting caveat** — two triangles at *exactly* the same depth: the
comparison ties, and float rounding picks arbitrarily, flickering per frame. Real
engines offset geometry (polygon offset) — now you know why the knob exists.

## The build: the z-buffered rasterizer

```python
# zbuffer.py — overlapping triangles, order-free, depth-correct (~40 lines)
import math

W, H = 100, 50
fb = bytearray(W * H * 3)
zbuf = [float("inf")] * (W * H)                 # the depth array: +∞ = nothing yet

def put(x, y, z, c):
    if 0 <= x < W and 0 <= y < H:
        i = int(y) * W + int(x)
        if z < zbuf[i]:                          # closer than what's there?
            zbuf[i] = z
            fb[i*3:i*3+3] = bytes(c)             # then, and only then, write color

def edge(a, b, p):
    return (b[0]-a[0])*(p[1]-a[1]) - (b[1]-a[1])*(p[0]-a[0])

def triangle(p0, p1, p2, color):                 # vertices carry (x, y, z)
    minx = max(0, int(min(p0[0], p1[0], p2[0]))); maxx = min(W-1, int(max(p0[0], p1[0], p2[0])))
    miny = max(0, int(min(p0[1], p1[1], p2[1]))); maxy = min(H-1, int(max(p0[1], p1[1], p2[1])))
    area = edge(p0, p1, p2)
    for py in range(miny, maxy + 1):
        for px in range(minx, maxx + 1):
            p = (px + 0.5, py + 0.5)
            w0 = edge(p1, p2, p) / area; w1 = edge(p2, p0, p) / area; w2 = edge(p0, p1, p) / area
            if w0 >= 0 and w1 >= 0 and w2 >= 0:
                z = w0*p0[2] + w1*p1[2] + w2*p2[2]        # barycentric depth (Ch 3's weights)
                put(px, py, z, color)

def show():
    chars = " .:-=+*#%@"
    for y in range(H):
        print("".join(chars[min(fb[(y*W+x)*3] * 10 // 256, 9)] for x in range(W)))

# ── three triangles, hostile order: far one LAST ──
triangle((10, 5, 9),  (60, 5, 9),  (35, 30, 9),  (100, 100, 100))   # far: dark gray
triangle((20, 10, 5), (80, 10, 5), (50, 40, 5),  (126, 226, 168))   # middle: green
triangle((30, 15, 2), (85, 15, 2), (57, 42, 2),  (232, 177, 92))    # near: amber
show()
# the amber triangle overlaps the green, which overlaps the gray — CORRECTLY —
# although the far triangle was drawn LAST. Order didn't matter. The z-buffer judged.
```

The render proves the promise: the near amber triangle wins every contested pixel,
the far gray triangle shows only where nothing closer covers it — and reversing the
draw order produces the identical image.

## What you now know

- The z-buffer = **a depth value per pixel; write only when closer** — order-free
  occlusion, O(1) per fragment.
- Depth interpolates per pixel via **Chapter 3's barycentric weights** — the fill
  and the depth come from the same edge functions.
- **z-fighting** at equal depths is float-tie noise; polygon offset exists because
  of it.
- With geometry sorted and occluded, the scene is still flat-shaded — Lambert's
  light gives it form. Next chapter.
