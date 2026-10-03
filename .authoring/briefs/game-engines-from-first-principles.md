# Task: write the two capstone chapters for `game-engines-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/game-engines-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/game-engines-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/game-engines-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Game Engines on One Page'
description: 'The loop, ECS, physics and rendering on one page — the model, the update order, and the classic simulation bugs.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/game-engines-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the mini engine from Chapter 12 — timestep, ECS, collisions, profiling. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the labs structure from the spec (§ "Chapter 2") — 3 warm-ups, 4-5 builds,
3 stretch goals, and 12 labs in total, each with **Goal** / **Do this** /
**You'll know it works when** / **Where it comes from**. Build every lab on artefacts
this course has already built.

## The course's chapter index — reference only these

| # | slug | title | part |
|---|------|-------|------|
| 1 | `01-what-is-a-game-engine` | What Is a Game Engine, Really? | Part I — The Loop |
| 2 | `02-game-loop-timestep` | The Game Loop: Fixed Timestep & Interpolation | Part I — The Loop |
| 3 | `03-entities` | Entities: The Inheritance Trap | Part I — The Loop |
| 4 | `04-ecs` | ECS: Entity-Component-System | Part II — The Simulation |
| 5 | `05-physics-motion` | Physics I: Motion & Integration | Part II — The Simulation |
| 6 | `06-physics-collisions` | Physics II: Collisions & Response | Part II — The Simulation |
| 7 | `07-input` | Input: Events vs Polling | Part III — The Rest of the Engine |
| 8 | `08-rendering-sprites` | Rendering: Sprites, Layers & the Camera | Part III — The Rest of the Engine |
| 9 | `09-scenes-assets` | Scenes & the Asset Lifecycle | Part III — The Rest of the Engine |
| 10 | `10-real-engines` | What Unity/Unreal/Godot Actually Are | Part IV — A Real Game |
| 11 | `11-profiling` | Performance: Profiling the Loop | Part IV — A Real Game |
| 12 | `12-final-boss-mini-engine` | Final Boss: The Complete Mini-Engine in ~400 Lines | Part IV — A Real Game |
| 13 | `13-cheat-sheet` | Cheat Sheet: Game Engines on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
