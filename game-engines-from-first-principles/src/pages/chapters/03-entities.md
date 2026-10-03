---
layout: ../../layouts/Chapter.astro
title: 'Entities: The Inheritance Trap'
description: 'Class hierarchies collapse when the designer asks for a flying-swimming-shooting thing. Build: the trap, demonstrated in code.'
part: 'Part I — The Loop'
written: true
---

Every game starts by writing classes: `class Player`, `class Enemy extends Player`,
`class FlyingEnemy extends Enemy`... and dies when the designer asks for a
*flying-swimming-shooting boss that also opens doors*. Inheritance forces abilities
into a single tree, and real game objects don't grow on trees. This chapter
demonstrates the collapse in code — setting up Chapter 4's ECS, the industry's
answer.

## The lie you were told

> "Model game objects as a class hierarchy."

The hierarchy starts clean and rots predictably:

```text
        GameObject
        ├── Player
        │    └── PlayerWithJetpack      ← the first special case
        ├── Enemy
        │    ├── FlyingEnemy            ← duplicates movement code from Jetpack
        │    └── SwimingEnemy
        └── Door
             └── BossDoor               ← needs "only opens when enemies dead"
                 └── FlyingBossDoor     ← WHICH PARENT?!
```

The designer asks for a **flying-swimming boss that drops loot** — the combination
explosion: every new ability multiplies classes. This is the "diamond problem"
(PyQt/Python's multiple inheritance headache) weaponized by game design churn.

## The two failures, precisely

1. **Combinatorial explosion**: m abilities × n roles = m×n classes (or worse — the
   tree can't express "flying AND swimming" without duplicating a branch).
2. **Scattered behavior**: the movement code for flying exists in `FlyingEnemy` and
   `FlyingBossDoor` and `FlyingPlayer` — a bug fix becomes an archaeology dig.

The root cause: **inheritance models "is-a"**, but game objects *have* abilities.
A flying-shooting boss IS-A thing that HAS flying and HAS shooting — the "has" is
the tell. Composition is coming (Chapter 4); first, feel the trap.

## Prove it to yourself

**1. The combination explosion, counted:**

```python
abilities = ["flying", "swimming", "shooting", "loot", "doors", "regen"]
# inheritance: every COMBINATION needs a class...
import math
print(f"abilities: {len(abilities)} → combinations needed: {2**len(abilities) - 1}")
# 63 classes to cover every ability combination. Six abilities. SIX.
```

**2. The duplicated bug fix** — patch flying physics in `FlyingEnemy`... and
`FlyingSwimmingEnemy`... and `FlyingBoss`... `grep` for the fix: three copies. The
maintenance cost, demonstrated.

## The build: feeling the trap (then refusing it)

```python
# trap.py — the inheritance tree, and where it snaps
class GameObject:
    def update(self, dt): raise NotImplementedError

class Player(GameObject):
    def update(self, dt): self.x += self.speed * dt

class Enemy(Player):                                  # shares movement... mostly
    def update(self, dt):
        self.x += self.speed * dt * 0.5               # enemies move slower — copied!
        if self.health <= 0: self.die()

class FlyingEnemy(Enemy):
    def update(self, dt):
        self.y += self.fly_speed * dt                 ← NEW movement code, not shared
        # ...and the Enemy update above still ran its ground logic. Wrong for fliers.

class SwimmingFlyingBoss(FlyingEnemy):                # ← the tree can't hold this
    pass
# every ability combination demands another branch. The tree is a lie.
```

The honest conclusion, written into the course: **inheritance answers "what IS it"
when games need "what DOES it"**. Chapter 4 flips the model: entities have no
behavior; *components* carry abilities; *systems* run abilities over everything
that has them. New ability combinations become data, not classes.

## What you now know

- The inheritance trap: **abilities don't form a tree** — combinations explode
  (2^abilities classes) and bug fixes scatter across copies.
- The tell is linguistic: games need **"has-a"** (components), not "is-a"
  (inheritance).
- Feeling the trap is prerequisite to loving the ECS — Chapter 4's composition
  model lands precisely because this chapter hurts.

Next: the industry's answer — Entity-Component-System — built in ~60 lines, with
entities as ids, components as dicts, and systems as plain functions.
