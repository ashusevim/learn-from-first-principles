---
layout: ../../layouts/Chapter.astro
title: 'What Is a Game Engine, Really?'
description: 'Not graphics — a loop that never stops: input, update, render, repeat. Build: the anatomy map and your first infinite loop with a heartbeat.'
part: 'Part I — The Loop'
written: true
---

A game engine is not graphics — the graphics course (Chapters 1–6) built the
rendering half already. A game engine is the thing *around* the rendering: a loop
that runs **60+ times per second, forever**, reading input, simulating a world,
drawing the result — and never missing a beat. This chapter builds the skeleton of
that loop and names the systems that hang off it.

## The lie you were told

> "Game engines make games."

Engines provide **systems**; games provide *data and rules*. The distinction this
course builds toward: your engine will have an ECS (entities and components), physics
(integration and collisions), input, rendering, and scenes — and the *game* is just
data plugged into those systems. Unity/Unreal/Godot are productized versions of
exactly the modules this course builds.

## The loop: the heartbeat

```text
while running:
    input    = read input devices          (what did the player do?)
    update   = advance the simulation      (physics, AI, game rules — by dt seconds)
    render   = draw the current state      (the graphics course's whole job)
```

Three phases, forever. The subtlety — *how much time each update represents* — is
Chapter 2's entire subject (fixed timestep vs variable, and why mixing them breaks
physics). Everything else in the engine is a service to these three phases.

## Prove it to yourself

**1. The loop, felt in any game you own** — enable a frame-time overlay in any game
and watch the milliseconds: 16.6ms per frame at 60fps — the web course's frame
budget (Ch 11), with a heartbeat.

**2. The systems, spotted in any engine's docs** — Unity's manual sections map one-
to-one to this course's chapters:

```text
Unity:    GameObjects/Components  →  ECS (Ch 4)
Unity:    Physics engine          →  Ch 5–6
Unity:    Input System            →  Ch 7
Unity:    Rendering/Sprites       →  Ch 8 (the graphics course)
Unity:    Scenes                  →  Ch 9
```

**3. The loop without a display** — a headless simulation is still a game loop
(AI servers, game replay systems, server-side simulation for multiplayer):

```python
import time
ticks = 0
start = time.time()
while time.time() - start < 1.0:        # run for one second
    # input: (none — headless)
    # update: the simulation advances by dt
    ticks += 1
print(f"{ticks} ticks in one second — the heartbeat, headless")
```

## The build: the loop skeleton

```python
# loop.py — the game loop skeleton with a heartbeat (~25 lines)
import time

class Engine:
    def __init__(self):
        self.running = True
        self.systems = []                   # filled in later chapters

    def add_system(self, system):           # a system: update(dt) + render()
        self.systems.append(system)

    def run(self, seconds=1.0, fps=60):
        dt = 1.0 / fps                      # the time each update represents (Ch 2!)
        end = time.time() + seconds
        frame_target = 1.0 / fps
        while time.time() < end and self.running:
            frame_start = time.time()
            for system in self.systems:
                system.update(dt)           # simulate
            for system in self.systems:
                system.render()             # draw
            # hold the frame budget (Ch 11 profiles this):
            elapsed = time.time() - frame_start
            if elapsed < frame_target:
                time.sleep(frame_target - elapsed)

class Heartbeat:
    def __init__(self): self.ticks = 0
    def update(self, dt): self.ticks += 1
    def render(self): pass

engine = Engine()
hb = Heartbeat()
engine.add_system(hb)
engine.run(seconds=1.0)
print(f"heartbeat: {hb.ticks} ticks in 1.0s (target 60)")
```

Run it: ~60 ticks in one second. The loop beats. Every chapter adds a system — ECS,
physics, input, rendering — until the finale assembles them and a game *runs on your
engine*.

## What you now know

- A game engine = **the loop + the systems that serve it**: input, simulation,
  rendering, and the asset/scene lifecycle.
- The loop's three phases — **input, update, render** — repeat 60+ times per second;
  `dt` is the simulation's unit of time (Chapter 2 handles it properly).
- **Engines provide systems; games provide data** — the Unity-docs mapping is the
  course's table of contents.

Next: the loop's hardest design decision — how much time each tick represents, and
the accumulator pattern that keeps physics deterministic while rendering stays
smooth.
