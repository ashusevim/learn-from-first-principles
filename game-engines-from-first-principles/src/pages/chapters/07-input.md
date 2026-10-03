---
layout: ../../layouts/Chapter.astro
title: 'Input: Events vs Polling'
description: '“Just pressed” vs “is held” — two models, both needed. Build: an input mapping layer with action names.'
part: 'Part III — The Rest of the Engine'
written: true
---

The simulation needs to know what the player did — and there are two questions,
constantly confused: **"is the key held right now?"** (polling: movement,
continuous) and **"was it just pressed this tick?"** (events: jump, shoot — once!).
Get the second wrong and jumping fires 60 times per second while held. This chapter
builds the input layer with action mapping, and derives both models.

## The lie you were told

> "Read the keyboard state in the update loop."

Polling state handles "is held" — but "just pressed" needs *history*: this tick's
state AND last tick's, compared:

```python
just_pressed = pressed_now and not pressed_last_tick     ← the edge detector
just_released = pressed_last_tick and not pressed_now
held = pressed_now and pressed_last_tick
```

Three states from two snapshots — and "jump on just_pressed" fires exactly once per
press, forever, at any frame rate.

## Action mapping: the remapability layer

Games don't ask "is the SPACE key down" — they ask "is JUMP active", with a mapping
(keyboard key → game action) that players can rebind. The layer also merges
devices: keyboard, gamepad, touch all feed the same JUMP action:

```text
bindings: {"jump": [SPACE, gamepad_A], "move_left": [LEFT, A], ...}
poll "jump" → any bound input active?
```

This indirection is what makes remapping and multi-device support a config change
instead of a rewrite.

## Prove it to yourself

**1. The edge detector, verified:**

```python
last, current = False, False
events = [(True, "press"), (True, "hold"), (True, "hold"), (False, "release")]
for pressed, label in events:
    just = pressed and not last
    print(f"{label:8s}: just_pressed={just}")
    last = pressed
# press : True     ← once
# hold  : False    ← held ≠ just pressed
# hold  : False
# release: False
```

**2. The frame-rate independence trap** — at 300fps, "hold for 0.5s" spans 90
frames; at 30fps, 15. Movement code must scale by dt (hold semantics) but *actions*
must consume edges (exactly once regardless of frame rate).

## The build: the input layer

```python
# input.py — polling + edges + action mapping (~35 lines)
class Input:
    def __init__(self):
        self.current, self.previous = set(), set()
        self.bindings = {"jump": ["space"], "left": ["left", "a"],
                         "right": ["right", "d"], "shoot": ["f", "ctrl"]}

    def press(self, key):   self.current.add(key)          # from the OS event queue
    def release(self, key): self.current.discard(key)
    def end_frame(self):
        self.previous = set(self.current)                  # the snapshot for next frame

    def _any(self, action):                                # any bound key active?
        return any(k in self.current for k in self.bindings.get(action, []))
    def _was_any(self, action):
        return any(k in self.previous for k in self.bindings.get(action, []))

    def held(self, action):          return self._any(action)
    def just_pressed(self, action):  return self._any(action) and not self._was_any(action)
    def just_released(self, action): return not self._any(action) and self._was_any(action)

# ── a game using actions instead of keys ──
input = Input()
frames = [("press space", "space"), ("hold space", "space"), ("hold space", "space"),
          ("release", ""), ("press d", "d")]
held = {"jump": 0, "right": 0}
for label, key in frames:
    if key: input.press(key)
    else: input.release("space")
    if input.just_pressed("jump"): print("jump! (once, even while held)")
    if input.held("right"): held["right"] += 1
    input.end_frame()
print(f"held right for {held['right']} frames")
# jump! (once, even while held)
# held right for 1 frames
```

`just_pressed("jump")` fired exactly once through a press-hold-hold-release
sequence — the edge detector working under the action mapping, remappable forever.

## What you now know

- Two models: **polling** ("is held" — continuous movement) and **edges** ("just
  pressed/released" — discrete actions), derived from two state snapshots.
- **Action mapping** decouples game logic from keys — remapping and multi-device
  become config.
- Frame-rate independence: edges fire once; holds scale by dt.

Next: the world is simulated and responsive — time to *see* it. Sprites, draw
order, and the camera that follows.
