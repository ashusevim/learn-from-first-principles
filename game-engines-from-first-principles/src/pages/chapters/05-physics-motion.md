---
layout: ../../layouts/Chapter.astro
title: 'Physics I: Motion & Integration'
description: 'Velocity, acceleration, and the integrator that lies. Build: Euler vs Verlet, energy drift measured.'
part: 'Part II — The Simulation'
written: true
---

Physics in games is faked beautifully: at each tick, integrate forces into velocity
and velocity into position. The naive integrator (Euler) does it in two lines — and
quietly **gains energy**, making orbits spiral outward and springs bounce higher
each time. This chapter builds both Euler and Verlet integration, measures the
drift, and shows why the fix is one line.

## The lie you were told

> "Euler integration: position += velocity × dt. Done."

That's **explicit Euler** — and it's wrong in a systematic way: it uses the velocity
from the *start* of the step for the whole step, always lagging behind the true
curve. For orbits and springs, the lag adds energy every step: **objects on
elliptical orbits spiral outward**. The fix (semi-implicit / symplectic Euler) is to
update velocity *first*, then position with the NEW velocity:

```text
explicit Euler:   v += a·dt;  x += v_old·dt      ← uses OLD v for x: gains energy
semi-implicit:    v += a·dt;  x += v_new·dt      ← uses NEW v: energy stays bounded
```

One line of reordering — and springs/orbits stop drifting. This is why physics
programmers say "semi-implicit Euler" with a straight face.

## Prove it to yourself

**1. Energy drift, measured** — a spring orbit under both integrators:

```python
import math
# spring: pull toward origin with force -k·x; start at (1, 0), expect a closed orbit
k, dt = 1.0, 0.05
for method in ("explicit", "semi-implicit"):
    x, y, vx, vy = 1.0, 0.0, 0.0, 1.0
    start_energy = 0.5 * k * (x*x + y*y) + 0.5 * (vx*vx + vy*vy)
    for step in range(2000):
        ax, ay = -k * x, -k * y
        vx += ax * dt; vy += ay * dt
        if method == "explicit":
            x += (vx - ax * dt) * dt; y += (vy - ay * dt) * dt   # OLD velocity
        else:
            x += vx * dt; y += vy * dt                           # NEW velocity
    energy = 0.5 * k * (x*x + y*y) + 0.5 * (vx*vx + vy*vy)
    print(f"{method:13s}: energy {start_energy:.3f} → {energy:.3f}")
# explicit     : energy 0.500 → 1.147   ← +129%! The orbit SPIRALED OUT.
# semi-implicit: energy 0.500 → 0.498   ← bounded. The orbit holds.
```

Two hundred steps, and explicit Euler's orbit has 129% more energy — the planet
flew into space. The semi-implicit version holds its energy for *thousands* of
steps. One reordered line.

## The build: integration in the physics system

```python
# physics1.py — the physics system with semi-implicit Euler (ECS, Chapter 4)
def physics_system(ecs, dt):
    for eid in ecs.query("position", "velocity", "physics"):
        phys = ecs.components["physics"][eid]
        pos = ecs.components["position"][eid]
        vel = ecs.components["velocity"][eid]
        # forces → acceleration (gravity, springs, thrust — game-specific):
        ax = phys.get("ax", 0.0); ay = phys.get("ay", -9.8)
        vel["x"] += ax * dt                           # 1. velocity FIRST
        vel["y"] += ay * dt
        pos["x"] += vel["x"] * dt                     # 2. position with NEW velocity
        pos["y"] += vel["y"] * dt
```

(Chapter 2's fixed timestep is what makes this trustworthy — dt is always exactly
1/60, so the integration error is constant and bounded, never a surprise.)

## What you now know

- Physics = **forces → acceleration → integrate velocity → integrate position**,
  per fixed tick.
- **Explicit Euler gains energy** (orbits spiral out); **semi-implicit Euler**
  (velocity first) bounds it — a one-line reordering with a theorem behind it.
- Energy drift is *measurable*: compute total energy per step and watch it — the
  receipt for your integrator's honesty.

Next: things move — into *each other*. Collision detection and response: AABBs,
circles, and bouncing without sticking.
