---
layout: ../../layouts/Chapter.astro
title: 'Performance: Profiling the Loop'
description: '16.6ms per frame, spent where? Build: instrument update/physics/render and find the budget hogs.'
part: 'Part IV — A Real Game'
written: true
---

Your engine runs at 60fps — until it doesn't. The frame budget is **16.6ms**
(the web course's Chapter 11, with a heartbeat), and it's spent across update,
physics, and render. Guessing which system hogs it is how projects die; profiling
is how they ship. This chapter instruments your engine's loop and reads the
results.

## The lie you were told

> "Optimization means making code faster."

It means **finding the right code first** — the frame budget's hogs follow the
90/10 rule ruthlessly: 90% of frame time in 10% of systems. The profiler's output
(Chapter 8 of the compilers course's stage profile, game-shaped):

```text
frame 16.6ms budget:
  physics     4.2ms  ████████          ← collision pairs growing?
  ai          7.9ms  ███████████████   ← 200 entities pathfinding every frame!
  render      2.1ms  ████
  other       0.4ms  █
```

AI pathfinding every frame for every entity — the classic hog. The fix isn't
"faster A*"; it's *amortization*: pathfind a few entities per frame, stagger them.

## The instrumentation

```python
class Profiler:
    def __init__(self):
        self.times = collections.defaultdict(float)
    def scoped(self, name):
        outer = self
        class Scope:
            def __enter__(self): self.t = time.perf_counter(); return self
            def __exit__(self, *a):
                outer.times[name] += time.perf_counter() - self.t
        return Scope()
    def report(self):
        total = sum(self.times.values()) or 1
        for name, t in sorted(self.times.items(), key=lambda kv: -kv[1]):
            print(f"  {name:10s} {t*1000:7.2f} ms  {'█' * int(t / total * 30)}")
        self.times.clear()
```

A context manager per system — `with profiler.scoped("physics"):` around each
system's update — accumulating across frames, reporting on demand.

## Prove it to yourself

**1. The hitch, localized:** frame times spike every ~2 seconds. The profiler run
over a spike window shows `physics 14ms` — a collision-check sweep gone quadratic
(Chapter 6's O(n²) pair loop on 300 entities). The fix: spatial partitioning
(broad-phase — only check pairs near each other). The profiler *named the fix*.

**2. The n² demonstration:**

```python
import time
for n in (100, 200, 400, 800):
    pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]  # all pairs
    t = time.time(); _ = [1 for _ in pairs]; dt = time.time() - t
    print(f"{n} entities: {len(pairs):7d} pairs, {dt*1000:7.1f} ms")
# 100:    4,950 pairs   0.4 ms
# 400:   79,800 pairs   6.1 ms     ← 4× entities, 16× pairs
# 800:  319,600 pairs  24.8 ms     ← the quadratic wall, O(n²)
```

## The build: the profiled loop

```python
# profiled.py — the engine loop, every system scoped
class Game:
    def __init__(self):
        self.profiler = Profiler()
        ...
    def run_frame(self, dt):
        with self.profiler.scoped("input"):  self.input.poll()
        with self.profiler.scoped("ai"):     self.ai_system.update(dt)
        with self.profiler.scoped("physics"): self.physics.update(dt)
        with self.profiler.scoped("render"): self.render_system.render()
        self.frame_times.append(time.perf_counter())

# report every 60 frames:
avg_frame = 1000 * sum(frame_times[-60:]) / 60
print(f"frame: {avg_frame:.2f} ms avg")
self.profiler.report()
```

The discipline: profile → fix the longest bar → re-profile. Two iterations usually
buy back the frame budget; blind optimization buys nothing.

## What you now know

- The frame budget is **16.6ms across all systems** — the profile is the to-do
  list, ordered.
- The classic hogs: O(n²) collision pairs (fix: broad-phase spatial partitioning),
  per-frame AI (fix: amortize — stagger across frames), unbatched draws (fix:
  sort by texture).
- Profile → fix the longest bar → re-profile: the loop that ships games.

Next, the finale: ECS + physics + input + rendering + scenes + profiler — the
complete mini-engine in ~400 lines, and a playable game built on it.
