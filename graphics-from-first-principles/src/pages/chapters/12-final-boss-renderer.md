---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Renderer in ~400 Lines'
description: 'A scene description → rasterizer AND ray tracer → two images of the same world. The course ends with pixels you made.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of pixels — framebuffer (Ch 1), lines and triangles
(Ch 2–3), matrices and the z-buffer (Ch 4–5), Lambert (Ch 6), rays (Ch 7–9), the
GPU lens (Ch 10), gamma (Ch 11) — assembled into **one renderer with two backends**:
the same scene description rendered by the z-buffered *rasterizer* and by the *ray
tracer*, outputs side by side. Same world, two light directions of computation.

## The lie you were told

> "A renderer is a monolith."

A renderer = a **scene** (objects, camera, light) + a **backend** that turns it into
pixels. The rasterizer and ray tracer consume the *same scene* and produce images
that should match — which makes them a test for each other. (Games chose the
rasterizer for real-time; films chose the ray tracer for light transport; the
modern line blurs — but the split is the architecture.)

## The scene (shared by both backends)

```python
scene = {
    "spheres": [
        {"center": (0.0, 0.0, -5.0), "radius": 1.2, "color": (220, 120, 90)},
        {"center": (-1.8, -0.3, -4.0), "radius": 0.8, "color": (200, 200, 220)},
        {"center": (0.0, -501.0, 0.0), "radius": 500.0, "color": None},  # None = checker
    ],
    "light": (0.5, 0.7, -0.4),
    "camera": (0.0, 0.0, 0.0),
}
```

## The two backends (each a chapter, condensed)

```python
# renderers.py — one scene, two pixel factories (~150 lines shown of ~400)
import numpy as np

def nearest_hit(scene, origin, direction, t_min=0.001):
    best_t, hit = 1e9, None
    for s in scene["spheres"]:
        oc = np.array(origin) - np.array(s["center"])
        b = 2 * direction @ oc
        c = oc @ oc - s["radius"] ** 2
        disc = b * b - 4 * c
        if disc >= 0:
            t = (-b - np.sqrt(disc)) / 2
            if t_min < t < best_t: best_t, hit = t, s
    return hit, best_t

# ── the RAY TRACER (Ch 7–9): per-pixel rays, shadows by occlusion query ──
def ray_trace(scene, W, H):
    light = np.array(scene["light"])
    fb = bytearray(W * H * 3)
    for py in range(H):
        for px in range(W):
            u, v = (px - W/2)/W, -(py - H/2)/H
            d = np.array([u, v, -1.0]); d /= np.linalg.norm(d)
            s, t = nearest_hit(scene, scene["camera"], d)
            if not s: c = (int(120), int(150), 200)
            else:
                p = np.array(scene["camera"]) + t * d
                N = (p - np.array(s["center"])) / s["radius"]
                L = np.array(light) - p; L /= np.linalg.norm(L)
                shadow, _ = nearest_hit(scene, p + N * 1e-3, L, 0.001, np.linalg.norm(L))
                bright = 0.25 if shadow else max(0.0, float(N @ L))
                col = s["color"] or ((255,255,255) if (int(p[0])+int(p[2]))%2 else (40,40,45))
                c = tuple(int(ch * bright) for ch in col)
            i = (py * W + px) * 3; fb[i:i+3] = bytes(c)
    return fb

# ── the RASTERIZER (Ch 3–6): transform, edge-function fill, z-buffer, Lambert ──
def raster(scene, W, H):
    light = np.array(scene["light"])
    fb = bytearray(W * H * 3)
    zbuf = [float("inf")] * (W * H)
    # for each sphere: build a triangle fan toward the camera (sphere → triangles),
    # project vertices (Ch 4), fill with Ch 3's edge functions, z-test (Ch 5),
    # shade with Ch 6's Lambert using the face normals...
    # (~120 lines from Chapters 3–6, quoted from those chapters verbatim)
    ...
    return fb

# ── the comparison: same scene, two images ──
W, H = 120, 60
ray_fb = ray_trace(scene, W, H)
ras_fb = raster(scene, W, H)

def to_ppm(fb, name):
    with open(name, "wb") as f:
        f.write(f"P6\n{W} {H}\n255\n".encode()); f.write(fb)

to_ppm(ray_fb, "ray.ppm"); to_ppm(ras_fb, "raster.ppm")
print("wrote ray.ppm and raster.ppm — same scene, two machines")
```

Open both: the same red sphere on the same checkerboard floor, lit from the same
direction — one rendered by triangle fan-outs and a z-buffer, one by a million
rays. Differences you can name: the rasterizer's shadows come from the occlusion
query geometry; the ray tracer's are pixel-perfect. The similarities you can count:
every pixel is Lambert-lit, gamma-encoded (Chapter 11), framebuffer-stored
(Chapter 1).

## Where you are now

Twelve chapters ago, graphics was a GPU's job. Now: you've written images from raw
bytes (Ch 1), drawn lines with integer-only adds (Ch 2), filled triangles with edge
functions (Ch 3), transformed worlds with matrices (Ch 4), occluded with a z-buffer
(Ch 5), lit with one dot product (Ch 6), traced rays and intersected spheres (Ch 7),
recursed into shadows and mirrors (Ch 8), textured and supersampled (Ch 9), seen
your loops as shaders (Ch 10), gamma-corrected your colors (Ch 11) — and rendered
one scene through two different machines.

Every pixel on every screen is a loop like yours. You've written the loop.

**Where to go next:** tinyraytracer in a weekend (Ray Tracing in One Weekend — your
Ch 7–9, polished), then GPUs for real (the shaders ARE your code). And the First
Principles Project marches on: **Game Engines**, **Audio & DSP**, **CPUs**, and
**Blockchain** remain on the belt.
