export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Framebuffer',
  'Part II — 3D and Light',
  'Part III — The Ray Tracer',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-graphics',
    order: 1,
    title: 'What Is Graphics, Really?',
    blurb:
      'A framebuffer is an array of pixels; every image ever drawn is a loop over it. Build: a PPM image written from raw bytes — no libraries.',
    part: 'Part I — The Framebuffer',
    written: true,
  },
  {
    slug: '02-lines-bresenham',
    order: 2,
    title: 'Lines: Bresenham’s Algorithm',
    blurb:
      'Drawing a straight line with only integer additions — the trick that fit graphics in 1960s hardware. Build: Bresenham, all octants.',
    part: 'Part I — The Framebuffer',
    written: true,
  },
  {
    slug: '03-triangles-raster',
    order: 3,
    title: 'Triangles: Filling the Raster',
    blurb:
      'The triangle is graphics’ atom: always planar, trivially split. Build: edge-function triangle fill, wireframe cube projected.',
    part: 'Part I — The Framebuffer',
    written: true,
  },
  {
    slug: '04-transformations',
    order: 4,
    title: 'Transformations: Matrices Move Worlds',
    blurb:
      'Translate, rotate, scale — all matrix multiplies; compose by multiplying. Build: a rotating wireframe cube, projected to 2D.',
    part: 'Part II — 3D and Light',
    written: true,
  },
  {
    slug: '05-zbuffer-depth',
    order: 5,
    title: 'Depth: The Z-Buffer',
    blurb:
      'Two triangles overlap — who wins? A depth value per pixel, keep the closest. Build: overlapping triangles sorted by nothing.',
    part: 'Part II — 3D and Light',
    written: true,
  },
  {
    slug: '06-shading-lambert',
    order: 6,
    title: 'Shading: Lambert’s Light',
    blurb:
      'Brightness = normal dot light direction. Build: a lit cube whose faces shade as it turns — the “wow” moment.',
    part: 'Part II — 3D and Light',
    written: true,
  },
  {
    slug: '07-rays-intersections',
    order: 7,
    title: 'Rays: Tracing Backwards',
    blurb:
      'Instead of pushing triangles to pixels, shoot rays from the eye and ask what they hit. Build: ray–sphere intersection, first render.',
    part: 'Part III — The Ray Tracer',
    written: true,
  },
  {
    slug: '08-shadows-reflections',
    order: 8,
    title: 'Shadows & Reflections: Rays Recursing',
    blurb:
      'Shadow rays test visibility; reflection rays recurse. Build: shadows and a mirror sphere — rays within rays.',
    part: 'Part III — The Ray Tracer',
    written: true,
  },
  {
    slug: '09-textures-antialiasing',
    order: 9,
    title: 'Textures & Anti-aliasing',
    blurb:
      'Checkerboards by math, jaggies by sampling. Build: a textured plane and 4× supersampling, jaggies halved.',
    part: 'Part III — The Ray Tracer',
    written: true,
  },
  {
    slug: '10-gpu-pipeline',
    order: 10,
    title: 'The GPU Pipeline, Conceptually',
    blurb:
      'Your per-triangle loops are vertex and fragment shaders — the GPU just runs them in parallel. Build: your rasterizer, re-read as shaders.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-color-gamma',
    order: 11,
    title: 'Color: Gamma, sRGB & Blending',
    blurb:
      'Why 0.5 + 0.5 isn’t mid-gray: displays are nonlinear. Build: linear vs gamma-space blending, half the lesson visible.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-renderer',
    order: 12,
    title: 'Final Boss: The Complete Renderer in ~400 Lines',
    blurb:
      'A scene description → rasterizer AND ray tracer → two images of the same world. The course ends with pixels you made.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Computer Graphics on One Page',
    blurb:
      'Pixels to rays on one page — the model, the math you actually reuse, the pipeline stages, and the classic artifacts.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the renderer from Chapter 12 — raster, depth, shading, rays. Each is checkable by you alone.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
];

export function chapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chapterNeighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : undefined,
    next: i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : undefined,
  };
}
