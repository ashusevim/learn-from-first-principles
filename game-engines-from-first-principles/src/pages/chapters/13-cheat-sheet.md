---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Game Engines on One Page'
description: 'The loop, ECS, physics and rendering on one page — the model, the update order, and the classic simulation bugs.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one loop with a fixed order: **input → update → physics →
render, on a fixed timestep**. The systems, the data they touch, and the bugs
that appear when the order or the timestep slips.

## The one-page model

```text
  fixed dt accumulate → player_system → physics → spawner/cleanup → camera → render
       input edges      intent          motion      rules            view     pixels
       Ch 7             Ch 4            Ch 5–6      Ch 12            Ch 8     Ch 8
```

`Game.run()` is Chapters 1–2 with passengers: the ECS (Chapter 4) holds the data,
each system reads what it needs and writes what it owns, and interpolation hides
the fixed step from the eye. Variable timesteps make physics lie; the accumulator
makes lying impossible.

## The engine you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `Game.run()` | the loop: accumulate real time, step fixed `dt` | 1–2, 12 |
| `ECS.entity(**comps)` / `destroy(eid)` | ids in, component bags out; ids recycle | 4 |
| `ecs.query("pos", "vel")` | the only iteration pattern — systems query, never own | 4 |
| `physics(g, dt)` | integrate `pos += vel * dt`, fixed step | 5 |
| collisions + response | overlap → separate along the smallest push | 6 |
| `Input.held()` / `just_pressed()` | polling now, edges across frames | 7 |
| `spawner` / `cleanup` | the game rule: falling blocks in, score out | 12 |
| `Camera` follow | world minus camera = screen; smooth the chase | 8 |
| scenes + asset lifecycle | load once, share handles, free on switch | 9 |
| the profiler read | milliseconds per system, per frame, worst first | 11 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Variable `dt` into physics | fast machines float, slow ones tunnel | Chapter 2 |
| Rendering raw accumulator state | judder: the eye sees the stair-steps | Chapter 2 |
| Inheritance trees for entities | the diamond: flying + swimming + boss breaks | Chapter 3 |
| Systems owning entities | two writers, one component — order-dependent lies | Chapter 4 |
| Integrating without the timestep | `pos += vel` per frame ties speed to refresh rate | Chapter 5 |
| Resolving collisions along the wrong axis | objects stick, sink, or launch to orbit | Chapter 6 |
| Reading input events as state | a one-frame press vanishes between polls | Chapter 7 |
| Camera set to player, raw | every turn snaps; motion sickness as a feature | Chapter 8 |
| Loading assets per frame | the disk joins the loop; the loop loses | Chapter 9 |
| Optimizing before profiling | months on rendering, bottleneck in physics | Chapter 11 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Stable simulation | fixed `dt` + accumulator + interpolation | turn-based logic — steps, not seconds (Ch 2) |
| Many entity kinds | composition via ECS, never inheritance | exactly one kind — a struct suffices (Ch 3–4) |
| Motion | integrate velocity, then resolve collisions | teleporting — set position, skip physics (Ch 5–6) |
| Responsive controls | poll held, edge-trigger pressed | menus — events are calmer there (Ch 7) |
| A world bigger than the screen | a follow camera with smoothing | single-screen puzzles — no camera at all (Ch 8) |
| 60 fps back | the profiler's worst system first | it is already 60 — ship it (Ch 11) |

## Prove it to yourself

**1. The timestep is the physics:**

```python
for dt in (1/30, 1/60, 1/240):
    x, v = 0.0, 10.0
    for _ in range(240):
        v -= 9.8 * dt; x += v * dt     # same code, three step sizes
    print(dt, round(x, 3))             # three answers — dt IS the simulation
```

**2. Query beats hierarchy:**

```python
movable = ecs.query("pos", "vel")
print(len(movable))                    # movers, whatever KIND they are
```

No `isinstance`, no tree walk — the query doesn't care what an entity *is*.

**3. Held vs pressed, one frame apart:**

```python
inp.end_frame()                        # previous = current: the edge window
print(inp.held("left"), inp.just_pressed("left"))  # True False — held, not new
```

## What you now know

- **The loop is a contract:** fixed steps simulate, interpolation displays, and
  neither job belongs to the other (Ch 2).
- **Data outlives code:** entities are ids, systems are functions, and the query
  is the only coupling (Ch 4).
- **Physics is integration plus restitution**, tuned by timestep — pick the step
  first, the constants second (Ch 5–6).
- The profiler, not taste, decides what gets optimized (Ch 11).

Next: twelve labs that break the loop six ways — wrong steps, wrong orders, and
a profiler telling you which system actually ate the frame.
