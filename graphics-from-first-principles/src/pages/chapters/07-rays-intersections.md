---
layout: ../../layouts/Chapter.astro
title: 'Rays: Tracing Backwards'
description: 'Instead of pushing triangles to pixels, shoot rays from the eye and ask what they hit. Build: ray–sphere intersection, first render.'
part: 'Part III — The Ray Tracer'
written: true
---

The rasterizer pushes geometry to pixels (triangles → screen). The **ray tracer**
runs light backwards: shoot one ray from the eye *through each pixel* into the
scene, find the first object it hits, and color the pixel by what happened there.
It's dramatically slower (one ray per pixel minimum) and dramatically more capable —
shadows, reflections, refraction fall out of "trace another ray". This chapter
builds ray-sphere intersection and the first render: a sphere, shaded.

## The lie you were told

> "Ray tracing is a different kind of graphics."

Same framebuffer, same pixels, same color math (Lambert still applies!) — the
difference is **who asks whom**: the rasterizer asks "which triangles cover this
pixel?"; the ray tracer asks "which surface does this pixel's ray hit first?" The
second question is 100× more expensive and answers reflections for free.

## The ray and the sphere

A ray is an origin plus a direction: `point(t) = origin + t·direction` for t > 0.
A sphere is a center plus a radius. Intersecting them is one quadratic equation:

```text
|origin + t·dir − center|² = r²
     → t² (dir·dir) − 2t dir·(origin − center) + |origin − center|² − r² = 0
     → At² + Bt + C = 0,   t = (−B ± √disc) / 2A

disc < 0: the ray misses.  two roots: enters and exits — the smaller positive t
          is the visible hit (the entry point).
```

## Prove it to yourself

**1. The intersection, by hand:**

```python
# a ray from the eye at (0,0,0) toward (0,0,-1), a sphere at (0,0,-5) radius 1:
# hits where (−5 + t)² = 1 → t = 4 or 6. The entry: t = 4.
# every pixel whose ray's cone touches the sphere: a disc on the screen. A sphere!
```

**2. The normal comes free** — at the hit point, the normal is `hit − center`,
normalized: the sphere hands you its own shading geometry.

## The build: the first ray-traced render

```python
# rays.py — ray-sphere intersection + Lambert, one sphere (~45 lines)
import numpy as np

W, H = 100, 50
sphere_center = np.array([0.0, 0.0, -5.0])
sphere_r = 1.2
light = np.array([0.5, 0.5, -0.5]); light /= np.linalg.norm(light)
eye = np.array([0.0, 0.0, 0.0])

def hit_sphere(center, r, origin, direction):
    oc = origin - center
    A = direction @ direction
    B = 2 * direction @ oc
    C = oc @ oc - r * r
    disc = B * B - 4 * A * C
    if disc < 0: return None                      # miss: the ray sails past
    t = (-B - np.sqrt(disc)) / (2 * A)            # entry point (smaller root)
    return t if t > 0 else None

fb = bytearray(W * H * 3)
for py in range(H):
    for px in range(W):
        # the ray through this pixel: direction = pixel offset in camera space
        u = (px - W/2) / W
        v = -(py - H/2) / H
        direction = np.array([u, v, -1.0]); direction /= np.linalg.norm(direction)

        t = hit_sphere(sphere_center, sphere_r, eye, direction)
        if t:
            hit = eye + t * direction
            N = (hit - sphere_center) / sphere_r  # the normal, for free
            brightness = max(0.0, float(N @ light))
            c = tuple(int(200 * b + 30) for b in
                      (brightness, brightness * 0.8, brightness * 0.6))
        else:
            c = (20, 24, 33)                      # the void: dark blue-gray
        i = (py * W + px) * 3; fb[i:i+3] = bytes(c)

chars = " .:-=+*#%@"
for y in range(H):
    print("".join(chars[min(fb[(y*W+x)*3] * 10 // 256, 9)] for x in range(W)))
#        .:-=+*#%@*  ← a shaded SPHERE: bright where the light hits,
#       =+*#%@*#=-     dark at the silhouette edge, gradient in between —
#      =+*#%@*#=-      real 3D form, from one quadratic equation per pixel.
```

The ASCII render shows a genuinely 3D-shaded sphere: the bright spot toward the
light, the limb darkening to the silhouette. One quadratic per pixel bought what
took the rasterizer five chapters (and the rasterizer still can't do reflections —
Chapter 8's rays recurse).

## What you now know

- Ray tracing = **shoot per-pixel rays, intersect with surfaces, shade the nearest
  hit** — light traced backwards from the eye.
- Ray–sphere = **one quadratic**; the entry root is the visible hit; the normal is
  `hit − center`, free.
- The trade vs the rasterizer is total: slower per pixel, but shadows/reflections/
  refraction are "trace more rays" — the rasterizer needs whole extra algorithms.

Next: one ray per pixel gives shading; *recursing* rays gives shadows and mirrors —
the ray tracer's signature moment.
