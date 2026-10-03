---
layout: ../../layouts/Chapter.astro
title: 'Effects: Synchronizing With the Outside'
description: 'Effects aren’t lifecycle callbacks — they’re “keep the world in sync” declarations. Build: an effect scheduler with cleanup.'
part: 'Part II — The Mechanics'
written: true
---

`useEffect` is taught as three lifecycle callbacks in a trench coat ("didMount,
didUpdate, willUnmount") — and that framing is why its dependency array feels
arbitrary. Reframe it the way React does: your render function must stay *pure*
(Chapter 3), but apps must touch the outside world — timers, servers,
subscriptions. An **effect** is a declaration: *"when these inputs change, run this
to re-sync with the outside; here's how to undo the previous run."* Build the
scheduler and the dependency array stops being a guessing game.

## The lie you were told

> "useEffect runs after render, once if the deps array is empty."

Mechanically true; conceptually backwards. The deps array isn't a caching hint you
tune — it's the **definition of what the effect synchronizes on**:

```javascript
// NOT: "run this once on mount" (lifecycle thinking)
// YES: "keep document.title in sync with `count` — re-run whenever count changes"
useEffect(() => { document.title = `Count: ${count}`; }, [count]);
```

Read effects as *sync declarations* and the rules fall out:

- **`[]`** = "synchronize with nothing" — nothing can change it; runs once. (And the
  lint rule "did you forget a dep?" is asking: *is that really true?*)
- **`[roomId]`** = "the connection depends on the room" — room changes → old
  connection is *wrong*, clean it up, re-establish.
- **No array** = "sync with everything" — re-runs every render (almost always wrong).

## The commit timing (and why it matters)

Effects run **after** the DOM is patched (Chapter 2's commit) — *asynchronously*, so
they never block the paint (the web course, Chapter 8's frame budget). The lifecycle
of one effect across renders:

```text
render 1: DOM patched → effect run                (established: e.g. subscribed)
render 2 (deps changed): cleanup(r1) → effect run (re-established: re-subscribed)
render 3 (deps same):    nothing — already in sync
unmount:                 cleanup(last) — final undo
```

Cleanup isn't optional hygiene: it *is* the sync. A timer effect without cleanup
stacks timers; a subscription without unsubscribe leaks (the concurrency course,
Chapter 10's resource story, in React clothing).

## Prove it to yourself

**1. The classic bug — effect without cleanup:**

```javascript
useEffect(() => {
  setInterval(() => setCount(c => c + 1), 1000);  // deps []: runs once...
}, []);
// ...but a HOT RELOAD or remount runs it AGAIN: two intervals, count ticking 2×/s.
// with a cleanup: return () => clearInterval(id) — remount replaces, never stacks.
```

**2. The dependency lint is a correctness check** — this lies:

```javascript
useEffect(() => { document.title = `Room: ${roomId}`; }, []);   // [] but READS roomId!
// effect ran once with roomId="kitchen" → navigate to "attic" → title still "kitchen".
// the DOM (outside world) is now OUT OF SYNC with state. The lint was right.
```

**3. Effects run after paint** — log inside an effect vs the render body: the render
log precedes the effect log *across* a frame boundary; heavy effect work doesn't
block the paint (unlike code in the render body, which does — Chapter 8's budget).

## The build: an effect scheduler on your own React

```javascript
// effects.js — extends hooks.js (Ch 4): useEffect with deps + cleanup
function useEffect(fn, deps) {
  const hooks = currentComponent.hooks ??= [];
  const i = hookIndex++;
  const [lastDeps, cleanup] = hooks[i] ?? [undefined, undefined];

  const changed = !deps || !lastDeps ||
                  deps.length !== lastDeps.length ||
                  deps.some((d, j) => d !== lastDeps[j]);     // Object.is per slot

  if (changed) {
    if (cleanup) cleanup();                                   // undo the PREVIOUS sync
    hooks[i] = [deps, undefined];
    scheduleAfterCommit(() => {                               // AFTER the DOM patch (Ch 2)
      const undo = fn();
      hooks[i][1] = typeof undo === "function" ? undo : null; // the new cleanup
    });
  }
}

// — demo: a title-sync and a timer, both with cleanup —
function App() {
  const [count, setCount] = useState(0);
  const [room, setRoom] = useState("kitchen");

  useEffect(() => {                                    // sync title with count
    document.title = `Count: ${count}`;
  }, [count]);

  useEffect(() => {                                    // sync a "connection" with room
    const id = setInterval(() => console.log(`polling ${room}...`), 1000);
    return () => { clearInterval(id); console.log(`left ${room}`); };
  }, [room]);                                          // room changes → poll re-established

  return h("div", {},
    h("h1", {}, `count: ${count}`),
    h("button", { onclick: () => setCount(c => c + 1) }, "+1"),
    h("button", { onclick: () => setRoom("attic") }, "move to attic"));
}
// click "+1": title updates (count is a dep), polling UNTOUCHED (room isn't)
// click "move": "left kitchen" → "polling attic..." — cleanup ran BEFORE re-sync
```

Watch the console on each button: effects re-run **only when their own deps change**,
cleanup always precedes re-establishment, and the DOM patch happened between them.
The dependency array was never a hint — it was the sync contract, now executed by
code you wrote.

## What you now know

- An effect = **"keep the outside world in sync with these inputs"** — deps define the
  inputs; cleanup undoes the previous sync; the array is a contract, not a cache knob.
- Effects run **after commit**, asynchronously — render stays pure and paint stays fast.
- Missing cleanup = stacked timers/leaked subscriptions; missing deps = silent
  out-of-sync. The lint rules are both, mechanized.
- The lifecycle framing (didMount/didUpdate) is why effects felt arbitrary — the sync
  framing is why they don't.

Next: state and effects work *within* a component. When a value must reach depth-7
without six prop hop-throughs: context — scoped, render-driven teleportation.
