---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Computer Graphics on One Page'
description: 'Pixels to rays on one page — the model, the math you actually reuse, the pipeline stages, and the classic artifacts.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one question: **for this pixel, what color?** Two machines
answer it — the rasterizer (project, cover, shade) and the ray tracer (shoot,
hit, bounce). The shared scene, the shared math, and which artifacts betray
which stage.

## The one-page model

```text
  scene (spheres, camera, light) → per pixel: RASTER: project → cover → z-test → shade
                                                 RAY:   shoot → nearest_hit → shade → bounce
  both end in: to_ppm(fb) → test.ppm / gradient.ppm → your eyes
```

`nearest_hit`, `ray_trace` and `raster` consume the *same* `scene` dict —
camera, spheres, light — and produce the same world by opposite routes.
Bresenham draws the edges (Chapter 2), triangles fill them (Chapter 3),
matrices move them (Chapter 4), and gamma decides what the numbers *mean*
(Chapter 11).

## The graphics you actually use

| Name | Meaning | Chapter |
|---|---|---|
| the framebuffer (2D array) | every pixel is a writable cell; all output lands here | 1 |
| Bresenham line stepping | integer steps, no gaps, no floats | 2 |
| barycentric triangle fill | inside-test + interpolation weights in one | 3 |
| model/view/projection matrices | move the world, place the camera, flatten to screen | 4 |
| z-buffer per pixel | nearest depth wins; painters never needed | 5 |
| Lambert `max(0, n·l)` | diffuse light is one dot product | 6 |
| `nearest_hit(scene, origin, direction)` | closest sphere along the ray, or miss | 7 |
| shadow ray (occlusion query) | anything between point and light → shadow | 8 |
| reflection ray (recurse) | bounce and shade again, dimmer each time | 8 |
| textures + anti-aliasing | sample detail, average the edges | 9 |
| the GPU stages, conceptually | vertex → raster → fragment, massively parallel | 10 |
| gamma encode/decode | math in linear, storage in sRGB | 11 |
| `to_ppm(fb, name)` | the image file both backends agree to write | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Cracks between adjacent triangles | shared edges sampled twice or never — pinholes | Chapter 3 |
| Forgetting the z-test on one path | far draws over near; depth lies selectively | Chapter 5 |
| Normals unnormalized in the dot | Lambert dims and brightens with vector length | Chapter 6 |
| Shadow acne (self-hit at t=0) | surfaces stripe themselves — offset with `t_min` | Chapters 7–8 |
| Reflecting without a depth cap | two mirrors recurse until the stack surrenders | Chapter 8 |
| Textures sampled nearest-only | shimmer on motion; moiré on detail | Chapter 9 |
| One sample per pixel on edges | jaggies — the stair-steps anti-aliasing exists for | Chapter 9 |
| Lighting math in sRGB | mid-tones wash out; blends go muddy | Chapter 11 |
| Comparing backends by vibes | same scene, different bugs — diff the PPMs | Chapter 12 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Real-time frames | the rasterizer + z-buffer + GPU stages | reflections must be true — then rays (Ch 10) |
| True shadows/reflections | the ray tracer, bounce by bounce | 60 fps matters — bake or fake them (Ch 8) |
| Move anything | matrices, composed model→view→projection | one static scene — bake the transform (Ch 4) |
| Believable light | Lambert + shadows + one gamma decision | stylized flat looks — then skip shading (Ch 6, 11) |
| Smooth edges | supersample or MSAA the coverage | pixels are huge anyway — embrace the chunk (Ch 9) |
| Two backends, one truth | the shared `scene` dict + PPM diff | they diverge — the scene lied, not the math (Ch 12) |

## Prove it to yourself

**1. The dot product is the light:**

```python
import numpy as np
n = np.array([0., 0., 1.]); l = np.array([0., 0., 1.])
print(max(0, n @ l))                    # 1.0 — facing the light, full bright
l = np.array([0., 1., 0.])
print(max(0, n @ l))                    # 0.0 — edge-on, Lambert says dark
```

**2. Gamma changes the middle, not the ends:**

```python
mid = 0.5
print(round(mid ** (1/2.2), 3), round(mid ** 2.2, 3))  # 0.73 stored, 0.218 linear
```

Encode lifts mid-tones, decode drops them — and `0.0`/`1.0` never move.

**3. The backends agree (mostly):**

```python
raster(scene, W, H); ray_trace(scene, W, H)   # your Chapter 12 functions
print(ppm_diff("raster.ppm", "tracer.ppm"))   # small: shading differs, geometry must not
```

## What you now know

- **One question, two machines:** project-and-cover vs shoot-and-bounce — pick
  by frame budget, not by fashion.
- **Depth and light are each one test:** nearest-wins (z or `t_min`), facing-wins
  (the dot) — everything else is those tests, repeated.
- **Color numbers are meaningless without gamma:** linear for math, sRGB for
  storage, and never the twain confused (Ch 11).
- The shared scene plus the PPM diff is the whole QA department (Ch 12).

Next: twelve labs that interrogate both backends — move the light, break the
depth, and make the two images confess their differences.
