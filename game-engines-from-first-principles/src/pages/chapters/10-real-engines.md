---
layout: ../../layouts/Chapter.astro
title: 'What Unity/Unreal/Godot Actually Are'
description: 'Your systems, productized: editors, asset pipelines, and the ECS lineage. Every module mapped to a chapter you built.'
part: 'Part IV — A Real Game'
written: true
---

Your engine now has a loop, ECS, physics, input, rendering, and scenes. The
commercial engines add **scale and ergonomics** to the same systems — this chapter
maps each giant's modules onto what you built, so engine documentation reads like
your course's table of contents with marketing.

## The lie you were told

> "Engines do things you couldn't build."

Everything an engine does is in this course — plus orders of magnitude of
*hardening and tooling*. The honest mapping:

| Engine module | What it is | Your chapter |
|---|---|---|
| Game loop / player loop | fixed-timestep accumulator | Ch 2 |
| GameObjects / Entities / Nodes | entity ids + component data | Ch 4 |
| Rigidbody, colliders | integration + collision shapes | Ch 5–6 |
| Input System (new) | action mapping layer | Ch 7 |
| Cameras, sprite renderers | camera transform + paint order | Ch 8 (graphics course: the painter) |
| Scenes, asset bundles | scene delegate + asset cache | Ch 9 |
| Physics settings, quality settings | the tuning dials (rates, budgets) | Ch 2, 6, 11 |

## What the giants add (the honest list)

1. **The editor** — actually the product. Visual scene editing = mutating your ECS
   component data with a GUI; prefabs = serialized entity templates. The editor is
   why Unity won adoption, not runtime superiority.
2. **Asset pipeline** — importers, compression, dependency graphs, streaming
   (Chapter 9's lifecycle at industrial scale).
3. **Physics engines as libraries** — Box2D (2D), PhysX/Havok/Jolt (3D): the same
   integration + collision, with continuous collision detection, joints, and
   solvers that handle hundreds of bodies. (Chapter 6's toy handles dozens.)
4. **Rendering backends** — the graphics course's rasterizer, metal/Vulkan/DirectX
   wrapped.
5. **Platform ports** — the OS layer (the Linux course's territory) so your game
   runs on consoles and phones.

None of these change the architecture. They scale and polish it — which is exactly
why understanding the architecture first makes engine documentation readable.

## The ECS lineage, one footnote

Unity's GameObjects are entity+components (their older, object-flavored flavor);
Unity DOTS/ECS and Bevy (Rust) are the data-oriented ECS — Chapter 4's design with
struct-of-arrays storage for cache efficiency (the systems course's memory story).
The industry literally converged on Chapter 4's pattern because the inheritance
trap (Chapter 3) hurt everyone equally.

## Prove it to yourself

**1. The mapping, verified in a real engine's docs:**

```text
Godot docs → "Scene tree": Nodes in trees — Ch 9's scenes, Ch 3's composition
Godot docs → "Physics introduction": RigidBody2D — Ch 5–6
Unity docs → "Execute order of events": Awake/Start/Update — Ch 2's loop phases
Unreal docs → "Actor lifecycle": the same loop, C++ flavored
```

**2. Build the editor's core, in 10 lines** — the insight that an editor is just
data mutation with a UI:

```python
def editor_set_component(ecs, eid, component, data):
    ecs.components[component][eid] = data     # the editor's "inspector panel"
    # Unity's inspector = this function, with text fields and color pickers.
```

## What you now know

- Engines = **your systems, productized**: the editor is the product, the runtime is
  your chapters hardened.
- The **ECS lineage** (Unity DOTS, Bevy, EnTT) is Chapter 4's design with
  data-oriented storage.
- Engine documentation is readable as your course's table of contents — that's the
  payoff of building it yourself.

Next: your engine runs — but *how fast*? Instrument the loop: update vs physics vs
render, and find the frame-budget hogs in your own engine.
