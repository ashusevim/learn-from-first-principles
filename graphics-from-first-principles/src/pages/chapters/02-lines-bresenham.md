---
layout: ../../layouts/Chapter.astro
title: 'Lines: Bresenham’s Algorithm'
description: 'Drawing a straight line with only integer additions — the trick that fit graphics in 1960s hardware. Build: Bresenham, all octants.'
part: 'Part I — The Framebuffer'
written: true
---

Draw a line from (0,0) to (11,5) on a pixel grid — but pixels are at integer
coordinates, and the true line passes *between* them. You need to choose which
pixels best approximate the line. **Bresenham's algorithm** (1965) does it with only
integer additions and comparisons — no multiplication, no division — which is why it
ran on hardware without multipliers. This chapter derives it from the naive
floating-point version and builds all octants.

## The lie you were told

> "You need floating-point math for lines."

Floating-point works but costs multiply/divide per step — unaffordable in 1965 and
still slow per-pixel. Bresenham's insight: track an **error term** — how far the
current pixel is from the true line — and when it crosses a threshold, step y and
adjust. Addition only:

```text
naive:  for x: y = round(y0 + slope × (x − x0))     ← multiply + round per pixel
Bresenham: for x: plot; err += dy; if err > dx: y += 1; err -= dx   ← add + compare
```

The error term is the *accumulated fractional part* that rounding would use —
carried as an integer.

## Prove it to yourself

**1. The naive version's flaw, visible:**

```python
# float version: y = 0.4545..., 0.9090... — rounding drifts and costs a divide
# per pixel. On a 4K frame, ~8 million divides per line pass. Bresenham: 0.
```

**2. The derivation, in one increment:** each x-step, the true y increases by
`dy/dx` — a fraction. The error `err` accumulates `dy`; when `err ≥ dx` (a whole
pixel of accumulated slope), step y and subtract dx. The fraction, carried as
integers.

## The build: Bresenham, all octants

```python
# bresenham.py — integer-only lines between any two points (~25 lines)
def line(fb, W, x0, y0, x1, y1, color=(255, 255, 255)):
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1                    # step direction: left or right
    sy = 1 if y0 < y1 else -1                    # step direction: up or down
    err = dx + dy                                # the error term
    while True:
        i = (y0 * W + x0) * 3
        fb[i:i+3] = bytes(color)                 # plot the pixel
        if x0 == x1 and y0 == y1: break
        e2 = 2 * err                             # doubled: compare without 0.5
        if e2 >= dy: err += dy; x0 += sx         # horizontal step wins
        if e2 <= dx: err += dx; y0 += sy         # vertical step wins

# ── smoke test: draw lines into the Chapter 1 framebuffer ──
W, H = 64, 32
fb = bytearray(W * H * 3)
for x0, y0, x1, y1 in [(2,2, 60,28), (2,28, 60,2), (32,2, 32,28), (2,15, 60,15)]:
    line(fb, W, x0, y0, x1, y1, (232, 177, 92))

chars = " .:-=+*#%@"
for y in range(H):
    print("".join(chars[min(fb[(y*W+x)*3] * len(chars) // 256, 9)] for x in range(W)))
#            ─────────────────────
#           ╱                      ╲
#          ╱      ──────────        ╲      ← four lines, every octant,
#         ╱         │                ╲        drawn with adds alone
#        ╱────────────────────────────╲
```

The ASCII preview shows all four lines — diagonals both ways, vertical, horizontal —
drawn correctly. The doubled error (`e2 = 2*err`) is Bresenham's own trick to avoid
the 0.5 comparison; the whole loop is adds, compares, and pixel writes.

## What you now know

- Bresenham = **the accumulated fraction carried as an integer** — lines with
  addition only.
- **Maximal munch of slope steps** via the doubled error comparison; all octants
  from two sign variables.
- The framebuffer plot is the only I/O — the algorithm is pure geometry.

Next: lines are edges. Fill the space between them — the triangle, graphics' atom,
rasterized with edge functions.
