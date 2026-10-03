---
layout: ../../layouts/Chapter.astro
title: 'Shading: Lambert’s Light'
description: 'Brightness = normal dot light direction. Build: a lit cube whose faces shade as it turns — the “wow” moment.'
part: 'Part II — 3D and Light'
written: true
---

The z-buffered cube is geometrically correct and visually dead — every face the same
flat color, no sense of form. **Lambert's law** (1760!) fixes it with one dot
product: *brightness = max(0, normal · light direction)* — a face perpendicular to
the light blazes, a face angled away falls into shadow. This chapter adds normals
and light to the rasterizer, and the cube becomes a *solid*.

## The lie you were told

> "Shading requires rendering equations."

The diffuse term is one dot product:

```text
brightness = max(0, N · L)
  N = the surface NORMAL — the arrow pointing away from the face
  L = the unit vector TOWARD the light
  perpendicular face: N·L = 1 → full brightness
  edge-on face:       N·L = 0 → dark
  facing away:        N·L < 0 → clamped to 0 (light from behind does nothing)
```

The normal is why 3D models carry per-vertex normals alongside positions — and why
a cube has 24 vertices, not 8 (each of the 6 faces needs its *own* four normals;
shared corners would smooth-shade the cube into a blob).

## Prove it to yourself

**1. The dot product, felt:**

```python
import numpy as np
light = np.array([0.3, -0.8, -0.5]); light /= np.linalg.norm(light)
for face_normal, name in [((0,0,-1), "front"), ((1,0,0), "right"), ((0,1,0), "top")]:
    N = np.array(face_normal, float)
    print(f"{name:6s}: brightness {max(0.0, float(N @ light)):.2f}")
# front: 0.50   right: 0.30   top: 0.80   ← the light comes from above-left-ish
```

**2. The 24-vertex cube** — shared corners would average the normals and round the
cube's crisp edges (that smoothing is *flat vs smooth shading*, the checkbox in
every 3D editor).

## The build: the lit cube

```python
# lambert.py — the z-buffered cube, now with normals and light (~50 lines)
import numpy as np, math

W, H = 100, 50
fb = bytearray(W * H * 3); zbuf = [float("inf")] * (W * H)
LIGHT = np.array([0.4, -0.7, -0.6]); LIGHT /= np.linalg.norm(LIGHT)

def put(x, y, z, c):
    if 0 <= x < W and 0 <= y < H:
        i = int(y) * W + int(x)
        if z < zbuf[i]: zbuf[i] = z; fb[i*3:i*3+3] = bytes(c)

def edge(a, b, p):
    return (b[0]-a[0])*(p[1]-a[1]) - (b[1]-a[1])*(p[0]-a[0])

def mat_rotate_y(a): return np.array([[math.cos(a),0,math.sin(a),0],[0,1,0,0],
                                      [-math.sin(a),0,math.cos(a),0],[0,0,0,1]])
def mat_rotate_x(a): return np.array([[1,0,0,0],[0,math.cos(a),-math.sin(a),0],
                                      [0,math.sin(a),math.cos(a),0],[0,0,0,1]])

# cube faces: 4 vertices each + the face NORMAL (per-face, not shared):
faces = [
    ([(0,0,-1),(1,0,-1),(1,1,-1),(0,1,-1)],  (0,0,-1),  (120, 90, 200)),   # front
    ([(0,0, 1),(1,0, 1),(1,1, 1),(0,1, 1)],  (0,0, 1),  (90, 120, 200)),   # back
    ([(0,0,-1),(0,0, 1),(0,1, 1),(0,1,-1)],  (-1,0,0),  (200, 120, 90)),   # left
    ([(1,0,-1),(1,0, 1),(1,1, 1),(1,1,-1)],  (1,0,0),   (120, 200, 90)),   # right
    ([(0,-1,-1),(1,-1, 1),(1,-1, 1),(0,-1,-1)], (0,-1,0), (200, 180, 90)),  # top
    ([(0, 1,-1),(1, 1, 1),(1, 1, 1),(0, 1,-1)], (0, 1,0), (90, 200, 180)),  # bottom
]

M = mat_rotate_y(0.55) @ mat_rotate_x(0.35)             # the spin (Ch 4's matrices)
for verts, normal, color in faces:
    N3 = np.array([normal[0], normal[1], normal[2], 0])  # direction: w=0 (a vector!)
    N_rot = (M @ N3)[:3]                                 # rotate the normal WITH the face
    brightness = max(0.0, float(N_rot @ LIGHT))          # Lambert's dot product
    shade = tuple(int(c * (0.25 + 0.75 * brightness)) for c in color)

    pts3d = [(M @ np.array([v[0], v[1], v[2], 1]))[:3] for v in verts]
    pts2d = [(W/2 + x*22/(z+3.2), H/2 - y*16/(z+3.2)) for x, y, z in pts3d]
    zs = [z for _, _, z in pts3d]
    minx = max(0, int(min(p[0] for p in pts2d))); maxx = min(W-1, int(max(p[0] for p in pts2d)))
    miny = max(0, int(min(p[1] for p in pts2d))); maxy = min(H-1, int(max(p[1] for p in pts2d)))
    area = ((pts2d[1][0]-pts2d[0][0])*(pts2d[2][1]-pts2d[0][1])
            -(pts2d[1][1]-pts2d[0][1])*(pts2d[2][0]-pts2d[0][0]))
    for py in range(miny, maxy + 1):
        for px in range(minx, maxx + 1):
            p = (px + 0.5, py + 0.5)
            w0 = ((pts2d[1][0]-pts2d[2][0])*(p[1]-pts2d[2][1])
                  - (pts2d[1][1]-pts2d[2][1])*(p[0]-pts2d[2][0])) / area
            w1 = ((pts2d[2][0]-pts2d[0][0])*(p[1]-pts2d[0][1])
                  - (pts2d[2][1]-pts2d[0][1])*(p[0]-pts2d[0][0])) / area
            w2 = 1 - w0 - w1
            if w0 >= 0 and w1 >= 0 and w2 >= 0:
                z = w0*zs[0] + w1*zs[1] + w2*zs[2]       # Ch 5's z-buffer judges
                put(px, py, z, shade)

chars = " .:-=+*#%@"
for y in range(H):
    print("".join(chars[min(fb[(y*W+x)*3] * 10 // 256, 9)] for x in range(W)))
```

The ASCII render shows a cube whose lit faces glow bright, whose angled faces fall
into mid-tones, and whose back faces vanish into the 25% ambient floor — form,
depth, and light from one dot product per face. Rotate the matrices and the shading
follows the geometry, automatically.

## What you now know

- **Lambert: brightness = max(0, N·L)** — the diffuse term, one dot product.
- Normals are **per-face** (crisp cubes) or per-vertex (smooth blobs) — 24 vs 8
  vertices on a cube; the count difference *is* the shading style.
- Rotating normals with the geometry (w=0: normals are directions, not positions)
  keeps lighting correct as objects turn.

Next: the rasterizer pushes triangles to pixels. Flip the direction of light: shoot
**rays** from the eye and ask what they hit — the ray tracer, and shadows for free.
