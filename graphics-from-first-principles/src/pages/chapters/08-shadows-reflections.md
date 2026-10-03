---
layout: ../../layouts/Chapter.astro
title: 'Shadows & Reflections: Rays Recursing'
description: 'Shadow rays test visibility; reflection rays recurse. Build: shadows and a mirror sphere — rays within rays.'
part: 'Part III — The Ray Tracer'
written: true
---

Chapter 7's ray tracer shades each hit with Lambert — but nothing casts shadows and
nothing reflects. Both appear with the same move: **trace more rays**. A *shadow
ray* from the hit point toward the light asks "is anything in the way?" (visibility
— a boolean query). A *reflection ray* from the hit point along the mirror direction
asks "what would I see?" — and its color blends in. Rays within rays: the recursion
that made ray tracing famous.

## The lie you were told

> "Shadows and reflections need extra rendering passes."

They're **queries from the shading equation**:

```text
shadow:    any object between hit point and light?      → dim the diffuse term
reflection: mirror direction = reflect(view, normal)    → recurse, mix by reflectivity
refraction: Snell's law bends the ray through glass   → recurse again (Chapter 8's
                                                       recursion, in graphics form)
```

Each recursion costs a full ray-scene intersection test — and recursion depth is a
quality dial (rays within rays within rays). The rasterizer needs shadow *maps* and
environment *probes* to approximate these; the ray tracer just... recurses.

## The shadow ray

```text
hit point p, light L:
  shadow_ray = from p + ε·L toward L        (ε: escape the surface, avoid self-hit)
  occluded = any hit with t < distance(p, L)
  brightness = Lambert × (0 if occluded else 1)     ← hard shadows (soft = multiple
                                                      samples across the light's area)
```

The ε offset is the classic self-intersection fix — the shadow ray starts ON the
sphere; without the nudge it hits the sphere itself.

## Prove it to yourself

**1. Reflection, by hand** — the mirror direction:

```python
import numpy as np
d = np.array([0.5, -1.0, 0.0]); d /= np.linalg.norm(d)   # incoming ray, hitting a floor
n = np.array([0.0, 1.0, 0.0])                            # floor normal (up)
r = d - 2 * (d @ n) * n                                  # reflect: flip the normal component
print(r)                                                 # [0.5, 1.0, 0] — bounced UP
# one vector formula. Point the formula at another sphere and you have a mirror.
```

**2. The recursion depth dial:**

```text
depth 0: Lambert only (Ch 7's render)
depth 1: + shadows, + one mirror bounce
depth 3: mirrors in mirrors, soft-ish shadows
each level: a full ray-scene test per bounce — the render time multiplies.
```

## The build: shadows + a mirror sphere

```python
# shadows.py — the ray tracer grows up: occlusion + recursion (~60 lines)
import numpy as np

LIGHT = np.array([0.6, 0.8, -0.4]); LIGHT /= np.linalg.norm(LIGHT)
SPHERES = [  # center, radius, color, reflectivity
    (np.array([0.0, 0.0, -5.0]),  1.2, (220, 120, 90),  0.0),   # the matte red one
    (np.array([-1.8, -0.3, -4.0]),0.8, (200, 200, 220), 0.85),  # the MIRROR one
    (np.array([0.0, -4.5, 0.0]),  4.0, (150, 150, 150), 0.2),   # the floor sphere
]

def hit_scene(origin, direction, t_min=0.001, t_max=1e9):
    best_t, best = t_max, None
    for c, r, color, refl in SPHERES:
        oc = origin - c
        b = 2 * direction @ oc
        cc = oc @ oc - r * r
        disc = b * b - 4 * cc
        if disc >= 0:
            t = (-b - np.sqrt(disc)) / 2
            if t_min < t < best_t: best_t, best = t, (c, r, color, refl)
    return best, best_t

def trace(origin, direction, depth=0):
    hit, t = hit_scene(origin, direction)
    if not hit:                                        # the void: gradient sky
        sky = 0.5 + 0.5 * direction[1]
        return tuple(int(255 * sky) for _ in (1, 1)) + (255 - int(160 * sky),)
    center, r, color, refl = hit
    point = origin + t * direction
    N = (point - center) / r
    # shadow ray: is the LIGHT visible from here?
    to_light = LIGHT - point; dist = np.linalg.norm(to_light); to_light /= dist
    blocked, _ = hit_scene(point + N * 0.001, to_light, 0.001, dist)   # ε offset!
    brightness = 0.15 if blocked else max(0.0, float(N @ to_light))
    out = np.array(color) * brightness
    if refl > 0 and depth < 3:                         # mirror: recurse (Ch 8's recursion)
        rd = direction - 2 * (direction @ N) * N       # the mirror direction
        out += refl * np.array(trace(point + N * 0.001, rd, depth + 1))
    return np.minimum(out, 255)

W, H = 100, 50
fb = bytearray(W * H * 3)
for py in range(H):
    for px in range(W):
        u, v = (px - W/2) / W, -(py - H/2) / H
        d = np.array([u, v, -1.0]); d /= np.linalg.norm(d)
        c = tuple(int(x) for x in trace(np.zeros(3), d))
        i = (py * W + px) * 3; fb[i:i+3] = bytes(c)

chars = " .:-=+*#%@"
for y in range(H):
    print("".join(chars[min(fb[(y*W+x)*3] * 10 // 256, 9)] for x in range(W)))
# the render: a red sphere, a MIRROR sphere showing the red one in reflection,
# both casting shadows on the gray floor — from ~60 lines and three recursions.
```

Read the image for the three features: the dark crescents under both spheres
(**shadow rays**), the red sphere visible *inside* the mirror sphere
(**reflection rays**), and the floor darkening away from the light (Chapter 6's
Lambert, still doing its job).

## What you now know

- **Shadow rays** = visibility queries from hit points to the light — occlusion is
  one boolean intersection test.
- **Reflections** = recurse along the mirror direction (`d − 2(d·n)n`), mix by
  reflectivity; depth is the quality/perf dial.
- The ray tracer's superpower: realism features are *recursion*, not extra
  algorithms — and the recursion is the concurrency course's, per pixel.

Next: the images are jagged and untextured — supersampling and checkerboards fix
both, and the quality dial becomes arithmetic.
