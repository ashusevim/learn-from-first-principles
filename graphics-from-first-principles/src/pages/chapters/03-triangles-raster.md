---
layout: ../../layouts/Chapter.astro
title: 'Triangles: Filling the Raster'
description: 'The triangle is graphics’ atom: always planar, trivially split. Build: edge-function triangle fill, wireframe cube projected.'
part: 'Part I — The Framebuffer'
written: true
---

Lines draw edges; **triangles fill area** — and the triangle is graphics' atom for a
reason: three points are always in one plane (4+ points can twist), and any polygon
splits into triangles. Every 3D model you've ever seen in a game is millions of
them. This chapter builds the edge-function rasterizer — the same math GPUs use —
and draws a wireframe cube projected from 3D.

## The lie you were told

> "Rasterizing a shape is complex geometry."

The triangle fill is **three linear functions and a bounding-box loop**. Each edge of
the triangle defines a half-plane via the *edge function* — a cross product telling
you which side of the edge a point is on:

```text
edge_function(a, b, p) = (b.x − a.x)(p.y − a.y) − (b.y − a.y)(p.x − a.x)
  > 0 : p is on the left of edge a→b
  < 0 : p is on the right
  = 0 : p is ON the edge line

pixel inside the triangle ⇔ ALL THREE edge functions are positive (same sign)
```

No angle math, no case analysis — three signs. And it's incremental: moving one
pixel right adds a constant to each edge function (GPUs exploit this hard).

## Prove it to yourself

**1. The edge function, by hand:**

```python
a, b = (0, 0), (4, 0)          # edge along the x-axis
p1, p2 = (2, 1), (2, -1)
print((b[0]-a[0])*(p1[1]-a[1]) - (b[1]-a[1])*(p1[0]-a[0]))   # 4·1 − 0 = +4 (left/above)
print((b[0]-a[0])*(p2[1]-a[1]) - (b[1]-a[1])*(p2[0]-a[0]))   # 4·(−1) − 0 = −4 (below)
# the sign IS the side. Three edges, three signs, one triangle.
```

**2. Why triangles and not quads?** Four points can be non-coplanar in 3D — the
"quad" would twist and be un-rasterizable. Three points are always flat. The atom
must be indivisible.

## The build: the rasterizer + a projected cube

```python
# raster.py — edge-function fill + a wireframe cube from 3D (~45 lines)
import math

W, H = 100, 50
fb = bytearray(W * H * 3)

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        i = (int(y) * W + int(x)) * 3; fb[i:i+3] = bytes(c)

def edge(a, b, p):
    return (b[0]-a[0])*(p[1]-a[1]) - (b[1]-a[1])*(p[0]-a[0])

def triangle(p0, p1, p2, color):
    minx = max(0, int(min(p0[0], p1[0], p2[0])))         # bounding box: only visit
    maxx = min(W-1, int(max(p0[0], p1[0], p2[0])))       # pixels that could be inside
    miny = max(0, int(min(p0[1], p1[1], p2[1])))
    maxy = min(H-1, int(max(p0[1], p1[1], p2[1])))
    area = edge(p0, p1, p2)
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            p = (x + 0.5, y + 0.5)                       # pixel CENTER, not corner
            w0 = edge(p1, p2, p) / area                  # barycentric weights, free!
            w1 = edge(p2, p0, p) / area
            w2 = edge(p0, p1, p) / area
            if w0 >= 0 and w1 >= 0 and w2 >= 0:          # inside: all edges agree
                put(x, y, (int(color[0]*w1 + 40), int(color[1]*w2 + 40), int(color[2]*w0 + 40)))

# ── a wireframe cube, projected from 3D (Ch 4 rotates it properly) ──
points3d = [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
edges = [(i, j) for i in range(8) for j in range(i+1, 8)
         if sum(abs(a-b) for a, b in zip(points3d[i], points3d[j])) == 1]

angle = 0.5
def project(p):                                          # rotate Y, then perspective-ish
    x, z = p[0]*math.cos(angle) - p[2]*math.sin(angle), p[0]*math.sin(angle) + p[2]*math.cos(angle)
    s = 2.5 / (3 + z)                                    # divide by depth: closer = bigger
    return (W/2 + x*s*W/4, H/2 - p[1]*s*H/4)

pts2d = [project(p) for p in points3d]
for i, j in edges:                                       # Bresenham lines (Ch 2!)
    a, b = pts2d[i], pts2d[j]
    n = int(max(abs(b[0]-a[0]), abs(b[1]-a[1]))) + 1
    for k in range(n + 1):
        put(a[0] + (b[0]-a[0])*k/n, a[1] + (b[1]-a[1])*k/n, (232, 177, 92))

triangle((50, 5), (15, 40), (85, 35), (126, 226, 168))   # a filled triangle too

chars = " .:-=+*#%@"
for y in range(H):
    print("".join(chars[min(fb[(y*W+x)*3] * len(chars) // 256, 9)] for x in range(W)))
```

The ASCII render shows the rotated cube's wireframe and the filled green triangle
with its barycentric shading — pixels from a 3D world, in ~45 lines. (The filled
triangle's color *varies across its area* — those barycentric weights w0/w1/w2 are
the same numbers GPUs interpolate texture coordinates and normals with. You just
invented barycentric interpolation.)

## What you now know

- Triangle fill = **bounding box + three edge-function signs**; pixel centers, not
  corners.
- **Barycentric weights** fall out of the edge functions for free — the
  interpolation machinery GPUs are built on.
- The triangle is the atom: always planar, trivially split, edge-function-friendly.
- The cube was projected with one perspective divide — Chapter 4's matrices do it
  properly.

Next: rotating that cube with real matrices — translate, rotate, scale, and the
composition rule that makes them multiply.
