# Task: write the two capstone chapters for `graphics-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/graphics-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/graphics-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/graphics-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Computer Graphics on One Page'
description: 'Pixels to rays on one page — the model, the math you actually reuse, the pipeline stages, and the classic artifacts.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/graphics-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the renderer from Chapter 12 — raster, depth, shading, rays. Each is checkable by you alone.'
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
| 1 | `01-what-is-graphics` | What Is Graphics, Really? | Part I — The Framebuffer |
| 2 | `02-lines-bresenham` | Lines: Bresenham’s Algorithm | Part I — The Framebuffer |
| 3 | `03-triangles-raster` | Triangles: Filling the Raster | Part I — The Framebuffer |
| 4 | `04-transformations` | Transformations: Matrices Move Worlds | Part II — 3D and Light |
| 5 | `05-zbuffer-depth` | Depth: The Z-Buffer | Part II — 3D and Light |
| 6 | `06-shading-lambert` | Shading: Lambert’s Light | Part II — 3D and Light |
| 7 | `07-rays-intersections` | Rays: Tracing Backwards | Part III — The Ray Tracer |
| 8 | `08-shadows-reflections` | Shadows & Reflections: Rays Recursing | Part III — The Ray Tracer |
| 9 | `09-textures-antialiasing` | Textures & Anti-aliasing | Part III — The Ray Tracer |
| 10 | `10-gpu-pipeline` | The GPU Pipeline, Conceptually | Part IV — The Real World |
| 11 | `11-color-gamma` | Color: Gamma, sRGB & Blending | Part IV — The Real World |
| 12 | `12-final-boss-renderer` | Final Boss: The Complete Renderer in ~400 Lines | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Computer Graphics on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
