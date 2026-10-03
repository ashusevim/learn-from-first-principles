---
layout: ../../layouts/Chapter.astro
title: 'The GPU Pipeline, Conceptually'
description: 'Your per-triangle loops are vertex and fragment shaders — the GPU just runs them in parallel. Build: your rasterizer, re-read as shaders.'
part: 'Part IV — The Real World'
written: true
---

Your software renderer ran loops: one pass over triangles transforming them, one
pass over pixels shading them. **That's the GPU pipeline** — vertex shading,
rasterization, fragment shading — and the GPU's revolution was *parallelism*: your
loops had hidden data independence (every triangle transforms without asking the
others; every pixel shades without asking its neighbors), and the GPU runs the
iterations simultaneously across thousands of cores. This chapter re-reads your own
code as shaders.

## The lie you were told

> "The GPU draws for you with hardware magic."

The GPU is a **massively parallel computer executing your programs**:

```text
vertex shader:   YOUR Chapter 4 matrices, run once per VERTEX   (millions in parallel)
rasterization:   YOUR Chapter 3 edge functions, fixed-function on most GPUs
fragment shader: YOUR Chapter 6 Lambert + textures, run once per PIXEL (billions in parallel)
```

The pipeline stages you built sequentially become parallel invocations of small
programs — "shaders" — with the GPU guaranteeing *each stage finishes before the
next begins* (that ordering is why Chapter 8's z-order works at all).

## The map: your code, their names

| Your code | GPU name | Runs per... |
|---|---|---|
| transform vertices (Ch 4's matrices) | **vertex shader** | vertex |
| edge-function fill (Ch 3) | rasterizer (mostly fixed) | triangle → fragments |
| Lambert + texture color (Ch 6, 9) | **fragment shader** ("pixel shader") | fragment (pixel candidate) |
| z-buffer test (Ch 5) | depth test | fragment |
| the framebuffer (Ch 1) | render target / swapchain | frame |

Uniform variables (same for all invocations — the light direction!), attributes
(per-vertex — positions, normals!), and varyings (interpolated per-fragment —
Chapter 3's barycentric weights!) are the three data channels, and each one maps to
a variable scope in your own loops.

## Prove it to yourself

**1. Your Lambert, as a GLSL fragment shader:**

```glsl
// fragment shader — Chapter 6's dot product, in GLSL:
in  vec3 v_normal;        // interpolated per-fragment by Chapter 3's barycentrics!
in  vec3 v_color;
uniform vec3 light_dir;   // same for every fragment (Ch 6's LIGHT constant)
out vec4 out_color;

void main() {
    float brightness = max(0.0, dot(normalize(v_normal), light_dir));
    out_color = vec4(v_color * (0.25 + 0.75 * brightness), 1.0);
}
```

Line for line: your Python loop body, in GLSL clothing. **The GPU runs this
function on every pixel the triangle covers — simultaneously.**

**2. The parallelism, measured by independence:**

```text
your triangle loop:   triangle[i] never reads triangle[j]'s output → parallel ✓
your z-buffer:        fragments DO conflict (same pixel!) → depth test serializes them,
                      handled in hardware per-pixel — the one place order still matters.
```

The z-buffer (Chapter 5) survives parallelism because its update is *commutative
and idempotent* (min) — a lovely echo of the distributed systems course's Raft
commutativity.

## What you now know

- The GPU pipeline = **your renderer's stages as parallel shader programs**, with
  inter-stage ordering preserved.
- Vertex shaders transform; fragment shaders shade; rasterization and the depth
  test sit between them — all four are chapters you built.
- Uniforms/attributes/varyings = the three data scopes (global / per-vertex /
  interpolated), and your loops already used all three implicitly.

Next: the last theoretical polish — color itself is a lie (displays are nonlinear),
and gamma correction is why 0.5 + 0.5 ≠ mid-gray.
