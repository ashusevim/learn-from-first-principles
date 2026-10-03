---
layout: ../../layouts/Chapter.astro
title: 'The Game Loop: Fixed Timestep & Interpolation'
description: 'Physics must be deterministic; rendering must be smooth. Build: the accumulator pattern that gives you both.'
part: 'Part I — The Loop'
written: true
---

How much time does one tick represent? Naive answer: "however long the last frame
took" (variable timestep). It works — until a frame hitch makes physics teleport a
ball through a wall, or two players' machines simulate differently because their
frame rates differ. The fix is the **fixed timestep with an accumulator**: physics
always advances by the *same* dt, possibly multiple times per frame, and rendering
interpolates between the last two states. This chapter builds it.

## The lie you were told

> "Pass the frame time to update(dt) and move on."

Variable timestep breaks two things:

```text
1. DETERMINISM: the same inputs produce different simulation results at different
   frame rates — replay systems and multiplayer sync become impossible.
2. STABILITY: physics integrators (Ch 5) are only accurate for small dt; a 200ms
   hitch makes the Euler integrator explode through walls.
```

The fix: **decouple simulation time from wall time**. Physics always steps by a
fixed 1/60s (deterministic! stable!), taking as many steps as the accumulated real
time requires:

```text
accumulator += frame_time                 (real time since last frame)
while accumulator >= FIXED_DT:            (1/60s)
    update(FIXED_DT)                      ← always the SAME step
    accumulator -= FIXED_DT
render(alpha)                             ← alpha = accumulator / FIXED_DT
                                          ← interpolate between the last two states
```

## Interpolation: the last 10% of smoothness

Physics ticks at fixed 1/60s, but renders once per *displayed* frame — and the
accumulator usually holds a partial step. Rendering the latest physics state
directly stutters. The fix: keep the previous state and the current state, and
render **alpha-blended between them**:

```text
rendered_position = previous × (1 − alpha) + current × alpha
```

One lerp per rendered entity — and the game looks perfectly smooth at any display
refresh rate while physics stays deterministic.

## Prove it to yourself

**1. Variable timestep breaks physics** — a ball approaching a wall:

```python
# dt = 1/60: ball at x=0.99 steps to x=1.01 → collision detected ✓
# dt = 0.2 (a hitch): ball at x=0.99 steps to x=1.19 → THROUGH the wall. ✗
# fixed dt: the hitch makes the loop run THREE physics steps of 1/60 each —
# the wall collision is detected mid-hitch. Determinism and stability, both saved.
```

**2. The spiral of death, named** — if update(FIXED_DT) takes LONGER than FIXED_DT,
the accumulator grows forever: the loop runs more and more catch-up steps per frame
until it freezes. The escape: clamp the accumulator (`accumulator = min(accumulator,
0.25)`) — slow down gracefully instead of dying.

## The build: the accumulator loop

```python
# accumulator.py — fixed timestep + interpolation (~40 lines)
import time

FIXED_DT = 1.0 / 60

class Ball:
    def __init__(self): self.x, self.v, self.prev = 0.0, 120.0, 0.0
    def integrate(self, dt):                     # physics: ALWAYS the same dt
        self.prev = self.x
        self.x += self.v * dt
        if self.x > 50: self.x = 50              # a wall at 50 (Ch 6 does collisions)

def run(seconds, fixed_dt=FIXED_DT):
    ball = Ball()
    accumulator, alpha = 0.0, 0.0
    frame_target = 1.0 / 60
    frames = []
    end = time.time() + seconds
    while time.time() < end:
        frame_start = time.time()
        accumulator += frame_target              # pretend each frame costs exactly 16.6ms
        steps = 0
        while accumulator >= fixed_dt:
            ball.prev = ball.x
            ball.integrate(fixed_dt)             # 0, 2, 4, ... deterministic positions
            accumulator -= fixed_dt; steps += 1
        alpha = accumulator / fixed_dt           # how far into the NEXT step are we?
        rendered = ball.prev * (1 - alpha) + ball.x * alpha   # interpolate between states
        frames.append((steps, rendered))
        elapsed = time.time() - frame_start
        if elapsed < frame_target: time.sleep(frame_target - elapsed)
    return frames

frames = run(0.25)
positions = [round(p, 2) for _, p in frames[:6]]
print("rendered positions:", positions)
# [0.0, 2.0, 4.0, 6.0, 8.0, 10.0] — smooth, evenly spaced: deterministic physics,
# smooth rendering. The accumulator fed them, alpha polished them.
```

## What you now know

- **Fixed timestep** buys determinism (same inputs → same simulation) and physics
  stability; the **accumulator** converts variable frame times into fixed steps.
- **Interpolation** (previous ⊕ current by alpha) buys render smoothness between
  physics ticks.
- The **spiral of death** is the pattern's failure mode — clamp the accumulator and
  degrade gracefully.
- Your engine's loop is now professional-grade: the same shape Unity's and
  Godot's docs describe.

Next: entities. The way games organize their objects — and the inheritance trap
that forced the industry to reinvent composition.
