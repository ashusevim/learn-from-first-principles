---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Mini-Engine in ~400 Lines'
description: 'ECS + physics + input + rendering + scenes — and a playable game built on it. The course ends with your engine running your game.'
part: 'Part IV — A Real Game'
written: true
---

The finale. Twelve chapters of systems — the loop and timestep (Ch 1–2), the ECS
(Ch 4), physics and collisions (Ch 5–6), input (Ch 7), rendering and the camera
(Ch 8), scenes (Ch 9), profiling (Ch 11) — assembled into **one complete engine in
~400 lines of Python**, and then a *playable game* built on it: dodge the falling
blocks, survive, score. When the game runs on your engine, the course's promise is
kept: engines are systems, and you built every system.

## The lie you were told

> "A game engine is a product you download."

It's a **loop with services** — and your services now cover the core: fixed
timestep (Ch 2), ECS (Ch 4), semi-implicit physics (Ch 5), AABB collisions with
correction (Ch 6), action-mapped input with edge detection (Ch 7), camera-following
rendering (Ch 8), scene switching (Ch 9), and a profiler (Ch 11). The finale is the
assembly, plus one game.

## The build: engine.py (~250 lines core, condensed to the architecture)

```python
# engine.py — the mini-engine: every system, composed
import tkinter as tk, time

class ECS:                                   # Ch 4
    def __init__(self): self.next_id, self.components = 0, {}
    def entity(self, **comps):
        eid = self.next_id; self.next_id += 1
        for name, data in comps.items(): self.components.setdefault(name, {})[eid] = data
        return eid
    def destroy(self, eid):
        for table in self.components.values(): table.pop(eid, None)
    def query(self, *names):
        sets = [set(self.components.get(n, {})) for n in names]
        return set.intersection(*sets) if sets else set()

class Input:                                 # Ch 7: polling + edges + actions
    def __init__(self, window):
        self.current, self.previous = set(), set()
        window.bind("<KeyPress>", lambda e: self.current.add(e.keysym))
        window.bind("<KeyRelease>", lambda e: self.current.discard(e.keysym))
        self.bindings = {"left": ["Left", "a"], "right": ["Right", "d"]}
    def end_frame(self): self.previous = set(self.current)
    def held(self, action):
        return any(k in self.current for k in self.bindings.get(action, []))
    def just_pressed(self, action):
        return self.held(action) and not any(k in self.previous for k in self.bindings.get(action, []))

class Camera:                                # Ch 8: the follow camera
    def __init__(self): self.x, self.y = 0.0, 0.0

class Game:                                  # the loop (Ch 1–2) with all systems
    def __init__(self):
        self.ecs, self.input = ECS(), None
        self.camera = {"x": 0.0, "y": 0.0}
        self.score = 0
    def run(self):
        FIXED, acc = 1/60, 0.0
        last = time.time()
        while True:
            now = time.time(); frame = now - last; last = now
            acc = min(acc + frame, 0.25)     # Ch 2: clamp the spiral of death
            while acc >= FIXED:
                self.update(FIXED)           # physics + game rules: deterministic
                acc -= FIXED
            self.render()                    # draw (interpolation omitted — Ch 2 has it)
            self.input.end_frame()
            self.update_idletasks(); self.update()

# ── the systems (Ch 5–6 physics, Ch 11 profiling hooks) ──
def physics(g, dt):
    for eid in g.ecs.query("position", "velocity"):
        pos = g.ecs.components["position"][eid]; vel = g.ecs.components["velocity"][eid]
        vel["y"] += 500 * dt                                # gravity
        pos["x"] += vel["x"] * dt; pos["y"] += vel["y"] * dt
        if pos["y"] > 380:                                  # floor: Ch 6's correction
            pos["y"] = 380; vel["y"] = 0

def spawner(g, dt):                                          # the GAME rule: falling blocks
    g.spawn_timer -= dt
    if g.spawn_timer <= 0:
        g.spawn_timer = 0.8
        x = (g.frame * 37) % 600                             # deterministic spread
        g.ecs.entity(position={"x": x, "y": -20}, velocity={"x": 0, "y": 120},
                     block=True, w=36)
def cleanup(g, dt):                                          # off-screen → score
    for eid in list(g.ecs.query("block", "position")):
        if g.ecs.components["position"][eid]["y"] > 500:
            g.ecs.destroy(eid); g.score += 1
```

## The game: dodge the blocks (~40 lines of game on your engine)

```python
# the GAME: data + rules plugged into the engine — no engine code touched
def player_system(g, dt):
    p = g.player
    speed = 260 * dt
    if g.input.held("left"):  p["x"] -= speed
    if g.input.held("right"): p["x"] += speed
    if g.input.just_pressed("space") and p.get("jumps", 0) < 1:   # Ch 7's edge!
        p["jumps"] = 1; g.ecs.components["velocity"][g.player_id]["y"] = -320
    for eid in g.ecs.query("block", "position"):                 # the lose condition
        bpos = g.ecs.components["position"][eid]
        if (abs(bpos["x"] - p["x"]) < 30 and abs(bpos["y"] - 350) < 40):
            print(f"GAME OVER — score: {g.score}"); g.running = False

game = Game(...)
game.player_id = game.ecs.entity(position={"x": 300, "y": 350},
                                 velocity={"x": 0, "y": 0}, jumps=0)
game.player = game.ecs.components["position"][game.player_id]
game.update = lambda dt: (physics(game, dt), player_system(game, dt),
                          spawner(game, dt), cleanup(game, dt))
game.run()
```

Left/right to dodge, space to jump, blocks falling with gravity, score counting
cleanups. Built entirely on systems you wrote in this course — and the *game code*
is ~40 lines of data and rules, because the engine carries the machinery. That
separation is why engines exist.

## Where you are now

Twelve chapters ago, a game engine was Unity. Now: you've built the loop with fixed
timestep and interpolation (Ch 1–2), felt the inheritance trap (Ch 3) and replaced
it with a working ECS (Ch 4), integrated motion with bounded energy (Ch 5), resolved
collisions without jitter (Ch 6), mapped input to actions with edge detection
(Ch 7), rendered with camera and culling (Ch 8), switched scenes (Ch 9), mapped the
giants onto your systems (Ch 10), profiled your own frame budget (Ch 11) — and run
a playable dodge game on your own engine.

Unity's inspector is a GUI over component data you've written. Godot's scenes are
your scene delegate. The engines were never magic — they were this course, with
product managers.

**Where to go next:** extend the game (enemies that home in — Ch 5's physics plus
Ch 9's scenes), then read a real engine's source (Godot is open — your course is
its index). And the First Principles Project continues: **Cryptography** taught the
locks, **A Browser** built the window, **Compilers** built the languages —
**Audio & DSP**, **CPUs**, and **Blockchain** remain on the belt.
