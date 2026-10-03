---
layout: ../../layouts/Chapter.astro
title: 'Transformations: Matrices Move Worlds'
description: 'Translate, rotate, scale — all matrix multiplies; compose by multiplying. Build: a rotating wireframe cube, projected to 2D.'
part: 'Part II — 3D and Light'
written: true
---

Chapter 3 rotated the cube with inline trig. Real graphics uses **matrices** — and
not for elegance: matrices make every transformation (move, turn, scale, project)
the *same shape of operation*, so they compose by multiplication and pipeline through
hardware uniformly. This chapter builds the matrices, proves the composition rule,
and spins the cube properly.

## The lie you were told

> "Matrices are math formality."

Matrices are the **uniform interface** that lets one pipeline handle any chain of
transforms. The trick: represent points as 4-component vectors (x, y, z, 1) and
every transformation as a 4×4 matrix — including *translation*, which plain 3D math
can't do as a multiply:

```text
translate by (tx, ty, tz):      the 1 row absorbs the addition:
[x y z 1] · M  =  [x+tx  y+ty  z+tz  1]     ← a multiply does a translation!

rotate, scale:  same shape, different M
compose:        M = translate · rotate · scale    ONE matrix for the whole chain
apply:          transformed = point · M           ONE multiply per point
```

Composition order matters — matrices don't commute (rotate-then-move ≠
move-then-rotate) — and the multiplication order encodes it: point × scale ×
rotate × translate reads "scale first, then rotate, then translate".

## Prove it to yourself

**1. The collapse proof, again:** two rotations compose to *a rotation*; a rotation
and a scale compose to *a linear map*; but a translation can't be expressed as
multiplying (x, y, z) — the `1` in the fourth slot is the sole addition. That's why
graphics is 4×4, not 3×3.

**2. Non-commutation, demonstrated:**

```python
# move(5,0,0) then rotate 90° about origin ≠ rotate then move.
# rotate(move(p)) lands the point somewhere else entirely — order is geometry.
```

## The build: the rotating cube

```python
# transform.py — matrices, composition, a spinning wireframe cube (~45 lines)
import numpy as np, math

def mat_translate(tx, ty, tz): return np.array([[1,0,0,tx],[0,1,0,ty],[0,0,1,tz],[0,0,0,1]])
def mat_rotate_y(a): return np.array([[math.cos(a),0,math.sin(a),0],[0,1,0,0],
                                      [-math.sin(a),0,math.cos(a),0],[0,0,0,1]])
def mat_rotate_x(a): return np.array([[1,0,0,0],[0,math.cos(a),-math.sin(a),0],
                                      [0,math.sin(a),math.cos(a),0],[0,0,0,1]])
def mat_scale(s): return np.array([[s,0,0,0],[0,s,0,0],[0,0,s,0],[0,0,0,1]])

def project(p, W, H):                                    # perspective: divide by depth
    x, y, z = p[:3]
    s = 2.2 / (z + 3.2)                                  # closer (small z) = bigger
    return (W/2 + x*s*W/4, H/2 - y*s*H/4)

points = [np.array([x, y, z, 1]) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
edges = [(i, j) for i in range(8) for j in range(i+1, 8)
         if sum(abs(a-b) for a, b in zip(points[i][:3], points[j][:3])) == 1]

W, H = 100, 50
chars = " .:-=+*#%@"
for frame in range(4):                                   # the spin, frame by frame
    M = mat_translate(0, 0, 0) @ mat_rotate_y(0.6 * frame) @ mat_rotate_x(0.35)
    fb = bytearray(W * H * 3)
    pts = [project(M @ p, W, H) for p in points]         # ONE multiply per point!
    for i, j in edges:
        (x0, y0), (x1, y1) = pts[i], pts[j]
        n = int(max(abs(x1-x0), abs(y1-y0))) + 1
        for k in range(n + 1):
            px, py = int(x0 + (x1-x0)*k/n), int(y0 + (y1-y0)*k/n)
            if 0 <= px < W and 0 <= py < H:
                fb[(py*W+px)*3:][:3] = bytes((232, 177, 92))
    print(f"── frame {frame} ──")
    for y in range(0, H, 2):                             # every other row: compact preview
        print("".join(chars[min(fb[(y*W+x)*3] * 10 // 256, 9)] for x in range(0, W, 2)))
```

Each frame: one composed matrix (translate·rotateY·rotateX), one multiply per
point, projection with the perspective divide — and the cube tumbles across the
ASCII frames. Change the multiplication order and watch the cube orbit the screen
instead of spinning in place: order is geometry, demonstrated.

## What you now know

- **4×4 matrices with homogeneous coordinates** make translation a multiply — and
  every transform composable into one matrix.
- **Order matters**: the multiplication sequence encodes the transformation sequence.
- The perspective divide (`/ z`) is projection — closer points spread wider.
- Chapter 3's triangle rasterizer consumes these projected points; Chapter 5 adds
  the z-buffer so overlapping triangles sort themselves.

Next: two triangles overlap — who wins? The z-buffer: one float per pixel, keep the
closest.
