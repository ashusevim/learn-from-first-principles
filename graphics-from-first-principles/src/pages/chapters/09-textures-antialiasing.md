---
layout: ../../layouts/Chapter.astro
title: 'Textures & Anti-aliasing'
description: 'Checkerboards by math, jaggies by sampling. Build: a textured plane and 4× supersampling, jaggies halved.'
part: 'Part III — The Ray Tracer'
written: true
---

Two quality upgrades finish the ray tracer: **textures** (a surface's color varies
across itself — a checkerboard comes free from math) and **anti-aliasing** (the
jagged staircase on sphere edges — fixed by sampling more rays per pixel and
averaging). Both are small changes to code you already have, and both demonstrate
the deepest principle in rendering: *an image is a sampling problem*.

## The lie you were told

> "Jagged edges mean low resolution."

Jaggies mean **undersampling**: the true image varies infinitely fast at edges, and
one sample per pixel can't represent that. The fixes are all "sample more,
smarter": supersampling (4× the rays, average), or filters that blur deliberately
before sampling. The checkerboard's shimmer at distance is the same disease — its
pattern varies faster than a pixel.

## Textures: color as a function of position

A texture isn't a picture glued on — it's a **function from surface position to
color**. The checkerboard is `floor(x) + floor(z) mod 2`:

```text
hit point (x, y, z) on the floor sphere/plane
checker = ((floor(x) + floor(z)) % 2)      → 0 or 1
color    = white if checker else black     ← infinite checkerboard, zero storage
```

Procedural textures — stripes, checkers, wood, marble (noise functions) — are all
"color = math(position)". Image textures sample a bitmap at (u, v) coordinates
mapped onto the surface; same idea, lookup instead of math.

## Prove it to yourself

**1. The checkerboard, computed:**

```python
def checker(x, z):
    return (int(np.floor(x)) + int(np.floor(z))) % 2
print([checker(x, 0.5) for x in (0.5, 1.5, 2.5, 3.5)])   # [0, 1, 0, 1] — alternating
# no image file exists. The pattern is arithmetic.
```

**2. The jaggies, halved by supersampling:**

```text
1 ray per pixel:  the sphere's edge is a hard staircase
4 rays per pixel (corners + center, averaged): the edge blends over 2 pixels
n samples: the edge blends over ~n — the accuracy/noise trade of sampling theory
```

## The build: textured plane + supersampling

```python
# quality.py — checkerboard floor + 4× supersampling (~40 lines)
import numpy as np

SPHERES = [
    (np.array([0.0, 0.0, -5.0]), 1.2, (220, 120, 90), 0.0),
    (np.array([0.0, -501.0, 0.0]), 500.0, None, 0.0),   # a huge floor sphere...
]
LIGHT = np.array([0.5, 0.7, -0.4]); LIGHT /= np.linalg.norm(LIGHT)

def floor_color(point):                    # the texture: math, not a bitmap
    return (255, 255, 255) if (int(np.floor(point[0])) + int(np.floor(point[2]))) % 2 \
           else (40, 40, 45)

def trace(origin, direction, depth=0):
    best_t, hit = 1e9, None
    for c, r, color, refl in SPHERES:
        oc = origin - c
        b = 2 * direction @ oc; cc = oc @ oc - r * r
        disc = b * b - 4 * cc
        if disc >= 0:
            t = (-b - np.sqrt(disc)) / 2
            if 0.001 < t < best_t: best_t, hit = t, (c, r, color, refl)
    if not hit:
        sky = max(0.0, direction[1]); return (int(120+100*sky), int(150+80*sky), 200)
    center, r, color, refl = hit
    point = origin + best_t * direction
    N = (point - center) / r
    if color is None: color = floor_color(point)          # ← the floor asks the MATH
    bright = 0.25 + 0.75 * max(0.0, float(N @ LIGHT))
    out = np.array(color) * bright
    if refl > 0 and depth < 3:
        rd = direction - 2 * (direction @ N) * N
        out += refl * np.array(trace(point + N * 0.001, rd, depth + 1))
    return np.minimum(out, 255)

def render(W, H, samples):
    fb = bytearray(W * H * 3)
    offsets = [(dx, dy) for dx in (-0.25, 0.25) for dy in (-0.25, 0.25)][:samples]
    for py in range(H):
        for px in range(W):
            acc = np.zeros(3)
            for dx, dy in offsets:                        # supersampling: N rays per pixel
                u = (px - W/2 + dx) / W
                v = -(py - H/2 + dy) / H
                d = np.array([u, v, -1.0]); d /= np.linalg.norm(d)
                acc += np.array(trace(np.zeros(3), d))
            acc /= len(offsets)                           # the average IS the anti-alias
            i = (py * W + px) * 3
            fb[i:i+3] = bytes(int(c) for c in acc)
    return fb

chars = " .:-=+*#%@"
for s, label in ((1, "1 ray/px"), (4, "4 rays/px (supersampled)")):
    fb = render(60, 30, s)
    print(f"── {label} ──")
    for y in range(0, 30, 2):
        print("".join(chars[min(fb[(y*60+x)*3] * 10 // 256, 9)] for x in range(0, 60)))
# the checkerboard floor + a smoother sphere edge at 4 rays/px:
# the staircase softens into a gradient — sampling theory, visible.
```

(The checkerboard shimmers at distance even here — *that's the sampling problem
too*, and mipmapping is its fix: pre-blurred texture levels. Now the term has a
mechanism.)

## What you now know

- Textures = **color as a function of surface position** — procedural (math) or
  sampled (bitmaps at u,v).
- Aliasing = **undersampling**; supersampling averages N rays per pixel and halves
  jaggies per doubling — the accuracy/noise trade.
- Shimmering distant patterns are the same disease at texture scale; mipmapping is
  pre-blur.

Next: the pipeline you built — per-triangle loops and per-pixel shading — is what
GPUs run in parallel. Re-read your own code as vertex and fragment shaders.
