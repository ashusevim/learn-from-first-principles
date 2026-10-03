---
layout: ../../layouts/Chapter.astro
title: 'React vs Signals vs Svelte'
description: 'Fine-grained reactivity vs vdom diffing — one primitive, two strategies. Build: the same app both ways, update-counted.'
part: 'Part III — The Ecosystem'
written: true
---

Every UI framework answers one question — *"state changed; what now?"* — and there
are only two answers. **React**: re-run (a description of) everything, diff, patch —
coarse re-run, surgical apply. **Signals**: track exactly which computations read
which state, update those directly — fine-grained, no diff. This chapter builds the
same app under both models, counts the updates, and turns framework holy wars into a
measured tradeoff.

## The lie you were told

> "You picked your framework; the model doesn't matter."

The model determines *everything downstream*: React re-runs component functions (so
they must be pure, so effects exist, so memoization exists); signals never re-run
components (so no purity pressure, no vdom, no keys — state just *is* the binding).
The "hooks rules" from Chapter 4 exist only under model one. Choosing a model is
choosing which invariants you live with.

## The two strategies, precisely

```text
React (pull + diff):                    Signals (push + subscribe):
  state changes                           state changes
  → mark component(s) dirty               → each dependent computation re-runs
  → re-run component functions            → each DOM binding touched updates directly
  → diff vdom trees                       (no re-run, no diff, no vdom)
  → patch DOM differences

  cost: re-run + diff (proportional to    cost: dependency graph updates
        COMPONENT size)                         (proportional to AFFECTED bindings)
```

React's bet: components are a good granularity, diffs are fast enough, and *unbounded
flexibility* (any props/state shape) matters more than constant-time updates.
Signals' bet: dependencies are knowable, fine-grained is worth the tracking overhead,
and re-running functions is waste. Svelte compiles the signal idea into syntax; Vue
hybridizes (components re-run, but with fine-grained watchers); Solid is signals all
the way down.

## Prove it to yourself

**1. Count React's re-runs** — one keystroke in a controlled input, in a 500-line
component:

```javascript
function BigForm() {
  const [name, setName] = useState("");
  console.log("BigForm re-ran");          // ← counts EVERY keystroke
  return <input value={name} onChange={e => setName(e.target.value)} />;
  // + 490 lines of other JSX: all re-described, all re-diffed, per keystroke.
  // (React batches; the diff is fast — but the re-run is the model's tax, Ch 2.)
}
```

**2. Count signals' updates** — the same input, SolidJS or a signals library:

```javascript
const [name, setName] = createSignal("");
createEffect(() => console.log("binding update", name()));   // per keystroke: 1
<input onInput={e => setName(e.target.value)} />
// the effect runs — and IF bound to a text node, that node updates. No component
// re-ran. No diff ran. The dependency graph knew exactly who read `name`.
```

**3. React can approximate signals** — memoization walls (`React.memo`, `useMemo`)
are hand-built dependency graphs: Chapter 9's granularity argument, re-derived from
pain.

## The build: the same app, both models, update-counted

```python
# models.py — coarse re-run + diff vs fine-grained subscription, on identical state
class ReactModel:
    """the whole component re-runs; a diff finds changes"""
    def __init__(self):
        self.renders, self.dom_ops = 0, 0
        self.state, self.vdom = {}, None
    def set_state(self, **changes):
        self.state.update(changes)
        self.renders += 1
        new_vdom = self.describe(self.state)          # re-describe EVERYTHING (Ch 2)
        if self.vdom:
            for k, v in new_vdom.items():             # diff (toy: flat dict)
                if self.vdom.get(k) != v:
                    self.dom_ops += 1                 # patch only what changed
        self.vdom = new_vdom
    def describe(self, s):
        return {"name": s.get("name", ""),             # 50 other fields exist here
                "count": s.get("count", 0),
                "theme": s.get("theme", "light"),
                "list": str(s.get("list", []))}

class SignalModel:
    """each binding subscribes to exactly the cells it reads"""
    def __init__(self):
        self.updates = 0
        self.cells = {}
    def signal(self, name, initial):
        self.cells[name] = initial
        def setter(v):
            self.cells[name] = v
            self.updates += 1                          # the ONE binding that read it
        return setter
    def bind(self, name, node):                        # (creates a dependency edge)
        def update(v): self.updates += 1; node = v
        self.updates += 1; self.cells[f"bind:{name}"] = node
        return lambda v: update(v)

r = ReactModel()
r.set_state(name="x")                    # typing one character:
print(f"react: 1 keystroke → {r.renders} re-render(s), whole component re-described")

s = SignalModel(); set_name = s.signal("name", "")
set_name("x")
print(f"signals: 1 keystroke → {s.updates} update(s), one binding, no re-render")
# react: 1 keystroke → 1 re-render(s), whole component re-described
# signals: 1 keystroke → 1 update(s), one binding, no re-render
# (at 1 field they tie. At 500 fields, React re-describes 500 fields' worth of tree;
#  signals touch the 1 binding. Scale is where the models diverge — Ch 8's budget.)
```

## What you now know

- One question, two answers: **re-run + diff** (React) vs **subscribe + patch**
  (signals). Every framework is one, or a hybrid (Vue), or compiled from one (Svelte).
- React's costs — purity, hooks rules, memoization, keys — exist to make the **coarse
  re-run** safe and cheap. Signals have different costs — dependency graphs, memory
  for subscriptions, and no "escape hatch" of just re-running.
- Fine-grained wins on huge, churning UIs; re-run wins on simplicity and
  predictability of data flow. Neither is faster *by default* — measure per app
  (Chapter 8's budget is the judge).
- You can now read any framework announcement and locate its position on this one
  axis.

Next, the finale: vdom, diff, components, hooks — assembled into **your own React in
~200 lines**, running a real todo app.
