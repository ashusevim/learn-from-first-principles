---
layout: ../../layouts/Chapter.astro
title: 'Physics II: Collisions & Response'
description: 'AABB overlap, circle distance, and bouncing without sticking. Build: collision detection and impulse response.'
part: 'Part II — The Simulation'
written: true
---

Things move — into each other. Collision physics is two problems: **detection**
(are these two shapes overlapping?) and **response** (what do their velocities
become?). Detection for boxes and circles is a few comparisons; response is one
impulse formula. The subtlety is *sticking* — objects sinking into each other and
jittering — and this chapter builds detection, response, and the position
correction that stops the jitter.

## The lie you were told

> "Collision response means reversing velocity."

Reversing on overlap *every tick* causes the classic jitter: the object sinks in,
reverses, pops out, sinks in... The fix is **positional correction** — push the
object out of the overlap along the collision normal — *plus* the velocity impulse
for the bounce:

```text
detect:      AABB overlap or circle distance < r1+r2
response:    separate positions along the normal (kill the overlap)
             reflect velocity along the normal (the bounce), with restitution
```

## The shapes, priced

```text
AABB (axis-aligned box):  overlap = |x1−x2| < (w1+w2)/2 AND same for y  ← 4 comparisons
circle:                   dist(center1, center2) < r1 + r2              ← 1 distance
```

AABBs are cheapest (no square roots) and cover most games' needs; circles are
rotation-proof. Rotated boxes need the separating-axis theorem — the rabbit hole
this course points at but doesn't enter.

## Prove it to yourself

**1. The jitter, then the fix:**

```python
# ball sinking into floor with velocity-only response:
#   tick: y = 9.9 (floor at 10) → overlaps → vy = +vy → y = 10.1 → falls back → ...
# the ball oscillates around the surface forever: the jitter.
# with positional correction: y snapped OUT of the floor first, then the bounce.
# one extra line, no jitter.
```

**2. Restitution is the bounciness dial** — restitution 1.0 conserves speed on
bounce (rubber ball), 0.0 kills the normal velocity (lump of clay). One scalar in
the impulse formula.

## The build: detection + response + correction

```python
# collisions.py — AABB detection, impulse response, position correction (~35 lines)
def aabb_overlap(a, b):
    return (abs(a["pos"]["x"] - b["pos"]["x"]) * 2 < (a["w"] + b["w"])) and \
           (abs(a["pos"]["y"] - b["pos"]["y"]) * 2 < (a["h"] + b["h"]))

def resolve(a, b, restitution=0.8):
    """a and b: entities with position, velocity, w, h — overlap assumed"""
    # collision normal: which axis is the shallowest overlap?
    dx = (b["pos"]["x"] - a["pos"]["x"])
    dy = (b["pos"]["y"] - a["pos"]["y"])
    overlap_x = (a["w"] + b["w"]) / 2 - abs(dx)
    overlap_y = (a["h"] + b["h"]) / 2 - abs(dy)
    nx, ny = (1 if dx > 0 else -1), 0
    if overlap_y < overlap_x: nx, ny = 0, (1 if dy > 0 else -1)

    # positional correction: split the overlap between the two bodies
    a["pos"]["x"] -= nx * overlap_x / 2; a["pos"]["y"] -= ny * overlap_y / 2
    b["pos"]["x"] += nx * overlap_x / 2; b["pos"]["y"] += ny * overlap_y / 2

    # impulse: reflect relative velocity along the normal (Newton's 3rd, 1D per axis)
    rel_v = (b["velocity"]["x"] - a["velocity"]["x"]) * nx + \
            (b["velocity"]["y"] - a["velocity"]["y"]) * ny
    if rel_v < 0:                                       # only if approaching!
        j = -(1 + restitution) * rel_v / 2
        a["velocity"]["x"] -= j * nx; a["velocity"]["y"] -= j * ny
        b["velocity"]["x"] += j * nx; b["velocity"]["y"] += j * ny

# ── two balls, one bouncing ──
a = {"pos": {"x": 0, "y": 0}, "velocity": {"x": 3, "y": 0}, "w": 20, "h": 20}
b = {"pos": {"x": 15, "y": 0}, "velocity": {"x": -1, "y": 0}, "w": 20, "h": 20}
print("before: a.vx =", a["velocity"]["x"], " b.vx =", b["velocity"]["x"])
if aabb_overlap(a, b): resolve(a, b, restitution=1.0)
print("after:  a.vx =", a["velocity"]["x"], " b.vx =", b["velocity"]["x"])
# before: a.vx = 3  b.vx = -1     (approaching: a→ ←b)
# after:  a.vx = -1  b.vx = 3     — they exchanged velocities (equal masses, e=1:
#                                   the textbook elastic collision, from one formula)
```

The `if rel_v < 0` guard is the subtle life-saver: **only respond when
approaching** — without it, objects already separating get "bounced" into each
other, sticking forever.

## What you now know

- Detection: **AABB (4 comparisons) or circles (1 distance)** — cheapest shapes
  first; rotated boxes need SAT (the rabbit hole).
- Response = **position correction** (kill the overlap) + **impulse along the
  normal** (bounce by restitution).
- The two classic bugs — jitter and sticking — both die from correction plus the
  approaching-only guard.

Next: the simulation feels your keyboard — events versus polling, and why "just
pressed" needs history.
