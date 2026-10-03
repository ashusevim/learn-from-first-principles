---
layout: ../../layouts/Chapter.astro
title: 'Rendering: Sprites, Layers & the Camera'
description: 'Draw order, cameras that follow, and culling. Build: a render system with a camera that follows the player.'
part: 'Part III — The Rest of the Engine'
written: true
---

The world is simulated; rendering draws it to the screen — the graphics course's
pipeline, now fed by the ECS. Three engine-specific ideas: **draw order** (layers:
ground < entities < UI), the **camera** (world coordinates minus camera position —
the player stays centered while the world moves), and **culling** (don't draw what's
off-screen). This chapter builds the render system.

## The lie you were told

> "Rendering draws the world."

Rendering draws **the camera's view of the world** — every entity's world position
transforms by `screen_pos = world_pos − camera_pos` (× zoom, later). The camera is
just an offset, but it's the difference between a static page and a *world you move
through*.

## The pieces

```text
layers:      ground → entities → particles → UI      (paint order = z-order, Ch 8 graphics)
camera:      follows the player (lerped, so it glides)
             screen = world − camera
culling:     skip entities outside the camera rect   (the web course's Ch 8 budget)
```

Camera smoothing (lerp toward the target) is the polish: hard-locked cameras feel
mechanical; `camera += (target − camera) × min(1, k·dt)` glides.

## Prove it to yourself

**1. The camera transform, one subtraction:**

```python
camera = {"x": 50, "y": 30}
player_world = {"x": 62, "y": 44}
print({"x": player_world["x"] - camera["x"], "y": player_world["y"] - camera["y"]})
# {'x': 12, 'y': 14} — the player renders at (12, 14) while standing at (62, 44) in
# the world. Move the camera; the world moves instead. That's a camera.
```

**2. Culling, measured** — a 10,000-entity world, camera showing 5%: the render
system touches 500 entities, skipping 9,500. The frame budget (Chapter 11) lives on
this.

## The build: the render system

```python
# render.py — the camera-following render system (~30 lines)
class RenderSystem:
    def __init__(self, canvas, camera):
        self.canvas, self.camera = canvas, camera
    def render(self, ecs):
        self.canvas.delete("all")
        cam = self.camera
        LAYERS = {"ground": 0, "entity": 1, "ui": 2}       # paint order (Ch 8 graphics)
        drawables = []
        for eid in ecs.query("position", "sprite"):
            pos, spr = ecs.components["position"][eid], ecs.components["sprite"][eid]
            sx, sy = pos["x"] - cam["x"], pos["y"] - cam["y"]     # the camera transform
            if -64 < sx < 864 and -64 < sy < 504:                 # culling (Ch 11's budget)
                drawables.append((LAYERS.get(spr.get("layer", "entity")), sx, sy,
                                  spr.get("color", "white"), spr.get("w", 16)))
        for _, sx, sy, color, w in sorted(drawables):             # layer order = paint order
            self.canvas.create_rectangle(sx, sy, sx + w, sy + w, fill=color, outline="")

# ── the camera follows the player ──
def camera_follow(camera, target, dt, stiffness=5.0):
    camera["x"] += (target["x"] - camera["x"]) * min(1.0, stiffness * dt)
    camera["y"] += (target["y"] - camera["y"]) * min(1.0, stiffness * dt)
```

The lerp in `camera_follow` is the glide: the camera *catches up* to the player at
a rate proportional to the distance — hard-locked on `target` feels mechanical,
pure exponential glide feels alive. One line of feel.

## What you now know

- Rendering = **world − camera**, drawn in layer order, culled to the view.
- The **camera is an offset with a lerp** — smoothing is one line of feel.
- Culling makes entity count irrelevant to *render* cost (simulation still sees
  everything — the two systems' scopes differ on purpose).

Next: menus, levels, game-over screens — the engine as a state machine of scenes,
with assets loaded and unloaded per scene.
