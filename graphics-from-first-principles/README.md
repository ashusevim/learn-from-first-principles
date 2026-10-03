# Graphics from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds computer graphics from first principles — framebuffer,
Bresenham lines, triangle rasterization, matrices, the z-buffer, Lambert shading,
then a ray tracer with shadows and reflections — writing every pixel from raw bytes
with no libraries.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Databases](../databases-from-first-principles),
[LLMs](../llms-from-first-principles), [Compilers](../compilers-from-first-principles)).

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

**Part I — The Framebuffer**
1. What Is Graphics, Really? ✅
2. Lines: Bresenham's Algorithm ✅
3. Triangles: Filling the Raster ✅

**Part II — 3D and Light**
4. Transformations: Matrices Move Worlds ✅
5. Depth: The Z-Buffer ✅
6. Shading: Lambert's Light ✅

**Part III — The Ray Tracer**
7. Rays: Tracing Backwards ✅
8. Shadows & Reflections: Rays Recursing ✅
9. Textures & Anti-aliasing ✅

**Part IV — The Real World**
10. The GPU Pipeline, Conceptually ✅
11. Color: Gamma, sRGB & Blending ✅
12. Final Boss: The Complete Renderer in ~400 Lines ✅ *(one scene, rasterizer + ray tracer)*

All 12 chapters are fully written, each with runnable builds writing real PPM images
from raw bytes. Things you build along the way: a library-free image writer,
Bresenham lines in all octants, an edge-function triangle rasterizer with
barycentric interpolation, a spinning projected cube, an order-free z-buffer, a
Lambert-lit cube, ray-sphere intersection, shadow and mirror rays, procedural
checkerboard textures, supersampled anti-aliasing, your loops re-read as shaders,
and a gamma-correct comparison — plus both backends rendering one shared scene.

## The rules of the course

1. **Start below the abstraction.** Before "use a GPU", answer "what is a pixel, physically?"
2. **Nothing is magic.** Lines, triangles, shadows — algorithms with readable loops.
3. **Build both directions.** A rasterizer AND a ray tracer, over the same scene.
4. **Then the GPU is visible.** Your loops, re-read as vertex and fragment shaders.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
