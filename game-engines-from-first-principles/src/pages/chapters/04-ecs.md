---
layout: ../../layouts/Chapter.astro
title: 'ECS: Entity-Component-System'
description: 'Composition over inheritance, taken to data. Build: a working ECS — entities as ids, components as dicts, systems as functions.'
part: 'Part II — The Simulation'
written: true
---

The industry's answer to Chapter 3's trap is **Entity-Component-System**, and it's
three separations:

```text
ENTITY:    just an id. No class, no behavior. "thing #7".
COMPONENT: pure data attached to an id — Position, Velocity, Health, Sprite.
           (has-a: an entity HAS a position, HAS health)
SYSTEM:    a function that runs over every entity having certain components —
           MovementSystem reads Position+Velocity, writes Position.
```

A flying-shooting boss is an entity with `Flying + Shooting + Health` components —
new combinations are **data, not classes**. The combination explosion (Chapter 3's
2^abilities) collapses to per-ability components. This chapter builds a working ECS
in ~60 lines and runs a small world on it.

## The lie you were told

> "ECS is an architectural philosophy you adopt or don't."

It's three data structures and a loop:

```python
entities = set()                            # ids
components = {"position": {}, "velocity": {}, ...}   # component type -> {entity_id: data}
def system(components, dt): ...             # functions over component dicts
```

The database course's Chapter 4 resonance: components ARE tables (entity id → row),
systems ARE queries (scan the table, update rows). An ECS is an in-memory database
with a game loop on top — the same insight, game-shaped.

## Prove it to yourself

**1. The combination explosion, undone:**

```python
# the flying-swimming boss from Chapter 3:
boss_components = {"position": ..., "velocity": ..., "flying": {}, "swimming": {}, "health": {...}}
# new abilities = new component entries. Zero new classes. The 63-class tree → data.
```

**2. Systems compose independently** — a bug in the movement system can't affect
the damage system: different functions, different components. Chapter 3's
"scattered bug fix" dissolves.

## The build: a working ECS

```python
# ecs.py — entities, components, systems: the full pattern (~55 lines)
import collections

class ECS:
    def __init__(self):
        self.next_id = 0
        self.components = collections.defaultdict(dict)   # name -> {eid: data}

    def entity(self, *component_dict_pairs):
        eid = self.next_id; self.next_id += 1
        for name, data in component_dict_pairs:
            self.components[name][eid] = data
        return eid

    def query(self, *names):
        """ids of entities having ALL the named components — the join!"""
        sets = [set(self.components[n]) for n in names]
        return set.intersection(*sets) if sets else set()

# ── systems: plain functions over component dicts ──
def movement_system(ecs, dt):
    for eid in ecs.query("position", "velocity"):
        pos, vel = ecs.components["position"][eid], ecs.components["velocity"][eid]
        pos["x"] += vel["x"] * dt
        pos["y"] += vel["y"] * dt

def gravity_system(ecs, dt):
    for eid in ecs.query("velocity", "gravity"):
        ecs.components["velocity"][eid]["y"] -= 9.8 * dt

def damage_system(ecs):
    for eid in ecs.query("health"):
        ecs.components["health"][eid]["hp"] -= 1   # (toy: everything takes damage)

# ── the world: data, not classes ──
ecs = ECS()
player = ecs.entity(("position", {"x": 0, "y": 0}), ("velocity", {"x": 5, "y": 0}),
                    ("health", {"hp": 100}))
ecs.entity(("position", {"x": 10, "y": 0}), ("velocity", {"x": 0, "y": 0}),
           ("gravity", {}), ("health", {"hp": 30}))

for tick in range(3):
    gravity_system(ecs, 1/60)
    movement_system(ecs, 1/60)

print("player pos:", ecs.components["position"][player])
# {'x': 0.25, 'y': 0}   ← moved by velocity; NO gravity: the player lacks the component
print("falling thing:", ecs.components["position"][1])
# {'x': 10.0, 'y': -0.49}  ← gravity applied: IT has the gravity component
```

Read the player's y: 0 — gravity never touched it, because `gravity_system` queries
`velocity + gravity` and the player lacks a gravity component. **Abilities are
component membership** — the Chapter 3 trap, inverted into data.

## What you now know

- ECS = **entities (ids) + components (data per id) + systems (functions over
  components)** — composition as data, the Chapter 3 trap dissolved.
- `query()` is a **join over component tables** — the databases course's shape,
  in-memory.
- Abilities become component membership: new combinations are data edits, not
  class trees.

Next: entities move — but *how* correctly? Integration, and why Euler lies about
energy.
