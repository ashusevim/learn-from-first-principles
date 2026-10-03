export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Loop',
  'Part II — The Simulation',
  'Part III — The Rest of the Engine',
  'Part IV — A Real Game',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-a-game-engine',
    order: 1,
    title: 'What Is a Game Engine, Really?',
    blurb:
      'Not graphics — a loop that never stops: input, update, render, repeat. Build: the anatomy map and your first infinite loop with a heartbeat.',
    part: 'Part I — The Loop',
    written: true,
  },
  {
    slug: '02-game-loop-timestep',
    order: 2,
    title: 'The Game Loop: Fixed Timestep & Interpolation',
    blurb:
      'Physics must be deterministic; rendering must be smooth. Build: the accumulator pattern that gives you both.',
    part: 'Part I — The Loop',
    written: true,
  },
  {
    slug: '03-entities',
    order: 3,
    title: 'Entities: The Inheritance Trap',
    blurb:
      'Class hierarchies collapse when the designer asks for a flying-swimming-shooting thing. Build: the trap, demonstrated in code.',
    part: 'Part I — The Loop',
    written: true,
  },
  {
    slug: '04-ecs',
    order: 4,
    title: 'ECS: Entity-Component-System',
    blurb:
      'Composition over inheritance, taken to data. Build: a working ECS — entities as ids, components as dicts, systems as functions.',
    part: 'Part II — The Simulation',
    written: true,
  },
  {
    slug: '05-physics-motion',
    order: 5,
    title: 'Physics I: Motion & Integration',
    blurb:
      'Velocity, acceleration, and the integrator that lies. Build: Euler vs Verlet, energy drift measured.',
    part: 'Part II — The Simulation',
    written: true,
  },
  {
    slug: '06-physics-collisions',
    order: 6,
    title: 'Physics II: Collisions & Response',
    blurb:
      'AABB overlap, circle distance, and bouncing without sticking. Build: collision detection and impulse response.',
    part: 'Part II — The Simulation',
    written: true,
  },
  {
    slug: '07-input',
    order: 7,
    title: 'Input: Events vs Polling',
    blurb:
      '“Just pressed” vs “is held” — two models, both needed. Build: an input mapping layer with action names.',
    part: 'Part III — The Rest of the Engine',
    written: true,
  },
  {
    slug: '08-rendering-sprites',
    order: 8,
    title: 'Rendering: Sprites, Layers & the Camera',
    blurb:
      'Draw order, cameras that follow, and culling. Build: a render system with a camera that follows the player.',
    part: 'Part III — The Rest of the Engine',
    written: true,
  },
  {
    slug: '09-scenes-assets',
    order: 9,
    title: 'Scenes & the Asset Lifecycle',
    blurb:
      'Loading, switching, unloading — the engine as a state machine of scenes. Build: menu ↔ game scene switching.',
    part: 'Part III — The Rest of the Engine',
    written: true,
  },
  {
    slug: '10-real-engines',
    order: 10,
    title: 'What Unity/Unreal/Godot Actually Are',
    blurb:
      'Your systems, productized: editors, asset pipelines, and the ECS lineage. Every module mapped to a chapter you built.',
    part: 'Part IV — A Real Game',
    written: true,
  },
  {
    slug: '11-profiling',
    order: 11,
    title: 'Performance: Profiling the Loop',
    blurb:
      '16.6ms per frame, spent where? Build: instrument update/physics/render and find the budget hogs.',
    part: 'Part IV — A Real Game',
    written: true,
  },
  {
    slug: '12-final-boss-mini-engine',
    order: 12,
    title: 'Final Boss: The Complete Mini-Engine in ~400 Lines',
    blurb:
      'ECS + physics + input + rendering + scenes — and a playable game built on it. The course ends with your engine running your game.',
    part: 'Part IV — A Real Game',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Game Engines on One Page',
    blurb:
      'The loop, ECS, physics and rendering on one page — the model, the update order, and the classic simulation bugs.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the mini engine from Chapter 12 — timestep, ECS, collisions, profiling. Each is checkable by you alone.',
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
