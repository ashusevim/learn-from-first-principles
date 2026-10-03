---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini engine from Chapter 12 — timestep, ECS, collisions, profiling. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a number, a screenshot, or a frame-time you
read off the Chapter 12 mini-engine (`Game`, `ECS`, `Input`, `Camera`,
`physics`, `spawner`, `cleanup`, `player_system`). Nothing here is new — the loop
(Ch 1–2), ECS (Ch 4), physics (Ch 5–6), input (Ch 7). What is new is breaking
each one and watching the game confess.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Run headless where you can (systems are plain functions of
`g, dt`); open the window where eyes beat numbers.

| Tool | What it proves |
|---|---|
| `physics(g, dt)` with hand-set `pos`/`vel` | integration without the window |
| `ecs.query(...)` counts | who the systems actually see |
| frame-time prints per system | where the milliseconds go |
| screenshots 10 seconds apart | what the player actually feels |

## Warm-ups

**Lab 1.1 — Count the steps**
**Goal:** the fixed timestep fires at its own rate, not the monitor's.
**Do this:** run the game 5 seconds with `dt = 1/60`, counting `physics` calls:

```python
calls = 0
orig = physics
def counted(g, dt):
    global calls; calls += 1
    return orig(g, dt)
# swap in counted for one 5-second run, then read calls
```

**You'll know it works when:** the count reads ~300 — five seconds times sixty,
regardless of render rate. Steps follow the accumulator, not the screen.
**Where it comes from:** Chapter 2 — The Game Loop: Fixed Timestep & Interpolation.

**Lab 1.2 — Query the world**
**Goal:** the ECS answers "who moves?" without knowing kinds.
**Do this:**
```python
print(len(g.ecs.query("pos", "vel")))
print(len(g.ecs.query("pos")))
```
**You'll know it works when:** the second count is ≥ the first — everything that
moves has a position, not everything positioned moves. Kinds never entered the
query.
**Where it comes from:** Chapter 4 — ECS: Entity-Component-System.

**Lab 1.3 — Held is not pressed**
**Goal:** edges vs levels across one frame boundary.
**Do this:** hold left for a second, then release; log `held("left")` and
`just_pressed("left")` each frame through press, hold, and release:

```python
for frame in frames:                       # log one row per frame
    print(frame, inp.held("left"), inp.just_pressed("left"))
    inp.end_frame()
# press row:  True True  — hold rows: True False — release row: False False
```

**You'll know it works when:** `just_pressed` is true exactly one frame —
`held` spans the hold, the press is a single-frame edge. Movement reads held;
jumps read pressed.
**Where it comes from:** Chapter 7 — Input: Events vs Polling.

## Builds

**Lab 2.1 — Double the step, halve the truth**
**Goal:** timestep as a physics parameter, priced.
**Do this:** run the same 10-second fall at `dt = 1/30` and `dt = 1/120`,
recording landing position and frame-time:

```python
for dt in (1/30, 1/120):
    land, ms = drop_test(dt)          # same fall, two step sizes
    print(dt, round(land, 3), f"{ms:.1f}ms")
```

**You'll know it works when:** the landings differ (integration error shrinks
with the step) while the 1/120 run costs ~4× the physics milliseconds. Accuracy
vs budget, in two numbers — the tradeoff Chapter 2 named.
**Where it comes from:** Chapters 2 and 5.

**Lab 2.2 — Tunnel through the floor**
**Goal:** fast objects skip thin colliders — reproduce the classic miss.
**Do this:** set a block's velocity 10× normal aimed at a 1-pixel platform,
single-step `physics` + collision, and watch it pass through.
**You'll know it works when:** the block lands *below* the platform it should
have hit. Then clamp velocity per step (or sweep the segment) and watch it land
— the fix's price is one comparison per fast mover.
**Where it comes from:** Chapter 6 — Physics II: Collisions & Response.

**Lab 2.3 — Reorder the systems, change the game**
**Goal:** system order is semantics (Chapter 4's warning, demonstrated).
**Do this:** run `cleanup` *before* `physics` for 30 seconds of play, counting
score; then restore the Chapter 12 order and recount.
**You'll know it works when:** the scores differ — blocks cleaned a frame early
never score. Order is not style; it is the rules.
**Where it comes from:** Chapter 4.

**Lab 2.4 — Lose the camera**
**Goal:** the view is a system with one job: keep the player framed.
**Do this:** freeze the camera at (0,0), walk right for 20 seconds, screenshot.
**You'll know it works when:** the player exits stage right into void — the
world simulates fine, the *framing* failed. Restore follow with smoothing and
re-shoot: same walk, player centered. Camera is a feature, not furniture.
**Where it comes from:** Chapter 8 — Rendering: Sprites, Layers & the Camera.

**Lab 2.5 — Profile before you touch**
**Goal:** Chapter 11's discipline: measure first, in milliseconds per system.
**Do this:** time each system over 600 frames, print the table worst-first, then
"optimize" the *second*-worst system and re-time the frame.
**You'll know it works when:** the frame barely moves — you optimized the wrong
row on purpose. Now optimize the worst row and watch the frame drop. The table
was right; taste was wrong.
**Where it comes from:** Chapter 11 — Performance: Profiling the Loop.

## Stretch goals

**Lab 3.1 — A second game in the same engine**
**Goal:** the engine earns the name only when the rules swap cheaply.
**Do this:** replace `spawner`/`cleanup`/`player_system` with rising (not
falling) hazards and a score-for-dodging rule; touch nothing else.
**You'll know it works when:** a different game plays — same loop, same ECS,
same physics, new rules in three functions. If you edited `Game.run`, the
engine abstraction leaked: note where.
**Where it comes from:** Chapter 12.

**Lab 3.2 — Ship the worst frame**
**Goal:** worst-case, not average, ships games (Chapter 11's coda).
**Do this:** spawn 10× entities, record the *worst* frame in 60 seconds, and
name the system that owns it.
**You'll know it works when:** you can quote the worst frame in milliseconds
and its owner — and your fix targets that owner only. Averages lie; maxima bill.

**Where it comes from:** Chapters 10–11.

## Self-checking without a grader

- **Count labs** (1.1, 1.2, 2.3): exact integers — ~300 steps, query counts,
  divergent scores. The numbers are small enough to predict; predict them.
- **Feel labs** (1.3, 2.1, 2.2, 2.4): frame edges, landing spots, screenshots.
  Record before/after pairs — the difference is the result.
- **Table labs** (2.5, 3.2): the profiler's worst-first table, quoted. If you
  can't name the owner in milliseconds, you haven't measured yet.

## What you now know

- **The loop is three promises:** fixed steps, ordered systems, displayed
  interpolation — each lab broke exactly one and kept the receipt.
- **ECS pays off at rule-swap time** (Lab 3.1): three functions for a new game
  is the abstraction working.
- **Physics bugs have signatures:** tunneling (too fast), drift (too coarse),
  sticking (wrong axis) — diagnose from the symptom, fix at the step.
- **Profile worst-first, always** (Labs 2.5, 3.2): the frame you ship is the max,
  not the mean.

Next: open any Unity or Godot profiler on a real project, find its worst system,
and translate it into this chapter's vocabulary — the words will fit, because
the loop is the same.
