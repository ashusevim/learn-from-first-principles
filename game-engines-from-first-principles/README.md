# Game Engines from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a game engine from first principles — the game loop,
fixed timesteps, ECS, physics integration, collisions, input, rendering, scenes —
ending with a playable game running on your own engine.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Graphics](../graphics-from-first-principles), [Concurrency](../concurrency-from-first-principles),
[Compilers](../compilers-from-first-principles), [LLMs](../llms-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Loop**
1. What Is a Game Engine, Really? ✅
2. The Game Loop: Fixed Timestep & Interpolation ✅
3. Entities: The Inheritance Trap ✅

**Part II — The Simulation**
4. ECS: Entity-Component-System ✅
5. Physics I: Motion & Integration ✅
6. Physics II: Collisions & Response ✅

**Part III — The Rest of the Engine**
7. Input: Events vs Polling ✅
8. Rendering: Sprites, Layers & the Camera ✅
9. Scenes & the Asset Lifecycle ✅

**Part IV — A Real Game**
10. What Unity/Unreal/Godot Actually Are ✅
11. Performance: Profiling the Loop ✅
12. Final Boss: The Complete Mini-Engine in ~400 Lines ✅ *(ECS + physics + a playable game)*

All 12 chapters are fully written, each with runnable builds and measured outputs.
Things you build along the way: the heartbeat loop with the accumulator pattern, the
inheritance trap demonstrated then dissolved by a working ECS, energy drift measured
between Euler and semi-implicit integrators, collision response without jitter, the
just-pressed edge detector under action mapping, a camera-following render system,
scene switching with asset lifecycle notes, the O(n²) pair-count wall — and a
playable dodge game on your own engine.

## The rules of the course

1. **Start below the abstraction.** Before "use Unity", answer "what does the loop actually do?"
2. **Nothing is magic.** Timesteps, ECS, collisions — readable patterns.
3. **Build the systems.** Physics, input, rendering, scenes — each a chapter.
4. **Then the engines are modules.** Unity/Unreal/Godot mapped onto what you built.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
