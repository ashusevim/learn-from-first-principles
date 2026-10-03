---
layout: ../../layouts/Chapter.astro
title: 'Scenes & the Asset Lifecycle'
description: 'Loading, switching, unloading — the engine as a state machine of scenes. Build: menu ↔ game scene switching.'
part: 'Part III — The Rest of the Engine'
written: true
---

Games are states: menu → playing → paused → game over → playing. A **scene** is one
state — its own entities, its own input handling, its own render — and the engine
becomes a **state machine of scenes**. This chapter builds scene switching, and with
it the asset lifecycle: what loads when, and what gets freed.

## The lie you were told

> "Scenes are levels."

A scene is a **screen-state**: menu, pause overlay, game, credits. Each scene
implements the loop's three phases (input/update/render — Chapter 1), and the
engine delegates the loop to the *active* scene:

```python
while running:
    scene.handle_input(input)
    scene.update(dt)
    scene.render(canvas)
    scene = scene.next or scene             ← switching is replacing the delegate
```

The scene switch is where assets live or die: the game scene holds the level's
textures and entities; switching to the menu frees them (memory) or keeps them
cached (fast return). The policy is yours — the LLM course's KV cache tradeoff
(Chapter 11 of that course), for assets.

## The asset lifecycle

```text
load:    parse + upload to GPU memory (Ch 10 of graphics) — expensive, done once
cache:   keep loaded assets in a dict keyed by path    ← fast re-entry into scenes
free:    drop references; the GC/GPU reclaims          ← explicit control, rare in toys
```

The trap: loading a 50MB asset *during* gameplay causes a frame hitch (the frame
budget, Chapter 11). Real engines stream and preload — the menu's quiet moment
loads the level.

## Prove it to yourself

**1. The scene interface, minimal:**

```python
class Scene:
    def handle_input(self, events): pass
    def update(self, dt): pass
    def render(self, canvas): pass
    @property
    def next(self): return self
# any object with these three methods + a next pointer is a scene. The engine
# can't tell a menu from a boss fight — that's the composability.
```

**2. The state machine, drawn:**

```text
Menu ──start──► Playing ──esc──► Paused ──esc──► Playing ──die──► GameOver ──► Menu
   ▲                                                                              │
   └──────────────────────────────────────────────────────────────────────────────┘
each arrow = a scene switch = the engine swaps its delegate
```

## The build: scene switching

```python
# scenes.py — menu ↔ game, the engine as a delegate-swapping loop (~40 lines)
import tkinter as tk

class Engine(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("scenes")
        self.canvas = tk.Canvas(self, width=640, height=400, bg="black")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        self.scene = None
        self.assets = {}                                # the cache: path → loaded data
    def switch(self, scene):
        self.scene = scene
        scene.engine = self
    def run(self):
        last = time.time()
        while True:
            now = time.time(); dt = now - last; last = now
            self.scene.handle_input()
            self.scene.update(dt)
            self.scene.render(self.canvas)
            self.update_idletasks(); self.update()
            time.sleep(1/60)

class MenuScene:
    def handle_input(self):
        if self.engine.event == "space":                # space starts the game
            self.engine.switch(GameScene(self.engine))
    def update(self, dt): pass
    def render(self, canvas):
        canvas.delete("all")
        canvas.create_text(320, 180, text="BITE ENGINE", fill="#e8b15c",
                           font=("Helvetica", 32, "bold"))
        canvas.create_text(320, 230, text="press SPACE to play", fill="gray")

class GameScene:
    def __init__(self, engine):
        self.engine = engine
        self.player_x = 320
        print("[GameScene] loading level assets...")    # the lifecycle, visible
    def handle_input(self):
        if self.engine.event == "escape":
            self.engine.switch(MenuScene())             # back to menu: assets freed
    def update(self, dt):
        if self.engine.event == "right": self.player_x += 200 * dt
    def render(self, canvas):
        canvas.delete("all")
        canvas.create_rectangle(self.player_x, 300, self.player_x + 20, 320,
                                fill="#e8b15c")
```

Space starts the game (assets load, printed); Escape returns to the menu (game
scene dropped). The engine loop never changed — only the delegate.

## What you now know

- Scenes = **the loop's delegate swapped by a state machine** — menu/game/pause are
  objects with handle_input/update/render.
- The **asset lifecycle** follows the scene: load on enter, cache for re-entry, free
  on true exit — the memory/latency trade from the databases course.
- Preload during natural pauses: loading during gameplay costs frame hitches
  (Chapter 11's budget).

Next: your engine vs the giants. Unity, Unreal, Godot — every module mapped to a
chapter you built.
