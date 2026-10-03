---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the renderer from Chapter 12 — raster, depth, shading, rays. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a PPM you open and compare — `test.ppm`
and `gradient.ppm` already sit in the course root as witnesses. Work with
`renderers.py` from Chapter 12 (`nearest_hit`, `raster`, `ray_trace`, `to_ppm`)
on the shared `scene`. Nothing here is new — lines (Ch 2), triangles (Ch 3),
depth (Ch 5), light (Ch 6), rays (Ch 7–8). What is new is *seeing* each stage
fail in pixels.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Open every output image; keep the Chapter 12 renders as the
control group.

| Tool | What it proves |
|---|---|
| `raster(scene, W, H)` + `to_ppm` | the fast backend, pixel by pixel |
| `ray_trace(scene, W, H)` + `to_ppm` | the true backend, ray by ray |
| `test.ppm` / `gradient.ppm` in the repo root | what correct already looks like |
| side-by-side of the two backends | geometry must match; shading may differ |

## Warm-ups

**Lab 1.1 — Re-render the receipt**
**Goal:** both backends run from a clean tree and agree on geometry.
**Do this:**
```python
raster(scene, 200, 200); ray_trace(scene, 200, 200)
```

**You'll know it works when:** two PPMs appear and the spheres sit in the same
places in both — same centers, same sizes:

```python
from PIL import Image  # or read the PPM bytes directly
a = Image.open("raster.ppm"); b = Image.open("tracer.ppm")
print(a.size, b.size)                     # identical dimensions, shared scene
```

Positions matching is geometry
passing; brightness may differ (that's shading's department).
**Where it comes from:** Chapter 12 — Final Boss: The Complete Renderer in ~400 Lines.

**Lab 1.2 — Move the light, move the shading**
**Goal:** Lambert is live — the dot product answers to the light position.
**Do this:** render, move `scene["light"]` to the opposite side, render again,
and blink the two images.
**You'll know it works when:** bright faces go dark and dark faces go bright —
the terminator line visibly migrates. Nothing moved but the light; everything
shaded moved with it.
**Where it comes from:** Chapter 6 — Shading: Lambert's Light.

**Lab 1.3 — Count the gamma middle**
**Goal:** the sRGB middle is not 0.5 (Chapter 11) — compute it.
**Do this:**
```python
print(round(0.5 ** (1/2.2), 3))   # what "half" is stored as
print(round(0.5 ** 2.2, 3))       # what stored-half means linearly
```

**You'll know it works when:** `0.73` and `0.218` — the middle lives far from
the middle. Render `gradient.ppm` and confirm the eye agrees: the visual middle
sits well past the byte middle.
**Where it comes from:** Chapter 11 — Color: Gamma, sRGB & Blending.

## Builds

**Lab 2.1 — Delete the z-test**
**Goal:** depth is load-bearing — watch the image lie without it.
**Do this:** disable the z-buffer write/test in `raster` (paint in submit
order), render the Chapter 12 scene, and compare with the control.
**You'll know it works when:** far spheres draw over near ones wherever submit
order says so — the image looks "wrong" in exactly the painter's-algorithm way
Chapter 5 retired. Re-enable; order stops mattering. That indifference *is* the
z-buffer.
**Where it comes from:** Chapter 5 — Depth: The Z-Buffer.

**Lab 2.2 — Acne, then `t_min`**
**Goal:** self-intersection stripes, cured by the smallest epsilon.
**Do this:** set `t_min=0` in `nearest_hit`, ray-trace a lit sphere close up,
and zoom the render.
**You'll know it works when:** the surface stripes itself (acne) — the shadow
ray hits its own origin. Restore `t_min=0.001`: clean. One constant is the whole
difference between theory and product.
**Where it comes from:** Chapters 7–8.

**Lab 2.3 — One bounce, then two**
**Goal:** reflections recurse — count what each level buys.
**Do this:** ray-trace with max depth 1, then 2, then 3; diff each pair.
**You'll know it works when:** depth 2 adds the mirror's mirror, depth 3 adds
almost nothing visible — convergence you can price. Ship depth 2 with the
number to defend it.
**Where it comes from:** Chapter 8 — Shadows & Reflections: Rays Recursing.

**Lab 2.4 — Jagged vs smooth edges**
**Goal:** one sample per pixel draws stairs; supersampling sands them.
**Do this:** rasterize a diagonal edge at 1× then 4× supersampling, crop and
magnify both.
**You'll know it works when:** the 1× edge stair-steps and the 4× edge grades —
same geometry, different coverage. Cost: 4× the fragments. Chapter 9's tradeoff,
visible at 400% zoom.
**Where it comes from:** Chapter 9 — Textures & Anti-aliasing.

**Lab 2.5 — Wrong space lighting**
**Goal:** math in sRGB lies about mid-tones (Chapter 11) — see the lie.
**Do this:** render one blend once with gamma-correct linear math and once with
raw sRGB arithmetic, and compare the midpoints.
**You'll know it works when:** the sRGB version's mids wash out — muddy where
the linear version grades. Same numbers, different meanings: space is semantics.
**Where it comes from:** Chapter 11.

## Stretch goals

**Lab 3.1 — The mirror duel**
**Goal:** two facing mirrors vs your depth cap (Chapter 8's warning, staged).
**Do this:** place two reflective spheres facing each other, ray-trace with caps
2, 8, and 64, timing each.
**You'll know it works when:** the images converge by 8 while the clock keeps
climbing to 64 — the cap is a performance control wearing a correctness costume.
Quote both numbers in your commit message.
**Where it comes from:** Chapter 8.

**Lab 3.2 — Rasterize the ray-traced look**
**Goal:** fake one true effect in the fast backend (Chapter 10's real job).
**Do this:** add blob shadows (a dark radial decal under each sphere) to
`raster` and A/B against the ray-traced shadow render.
**You'll know it works when:** a casual glance can't tell — and a pixel diff
can. That gap, priced in milliseconds saved, is the entire GPU industry.
**Where it comes from:** Chapter 10 — The GPU Pipeline, Conceptually.

## Self-checking without a grader

- **Agreement labs** (1.1, 2.3): geometry matches across backends, bounces
  converge — diff PPMs, count differing pixels. Small diffs, named causes.
- **Breakage labs** (2.1, 2.2, 2.4, 2.5): the artifact must appear *and* vanish
  on command — painter's disorder, acne, jaggies, washed mids. Reversible
  breakage is understanding.
- **Price labs** (2.3, 2.4, 3.1): quote milliseconds per quality step. "Depth 2,
  4× samples, cap 8" is a shipping decision; anything vaguer is a wish.

## What you now know

- **Every pixel has an addressable cause:** wrong depth (z), wrong light (dot),
  wrong space (gamma), wrong coverage (samples) — diagnose from the artifact.
- **Backends cross-examine each other** (Labs 1.1, 2.3): geometry must agree;
  where shading differs, name the stage.
- **Quality is a priced list** (Labs 2.3–2.4, 3.1): bounces, samples, caps —
  each with a millisecond tag and a visible return.
- Faking well beats tracing slowly when the frame budget says so (Lab 3.2) —
  and now you know exactly what the fake costs in truth.

Next: take any game engine's graphics settings screen — shadow quality, AA mode,
reflections — and translate each toggle into a lab above; the menu will read
like your own benchmark table.
