---
layout: ../../layouts/Chapter.astro
title: 'Hooks: useState Demystified'
description: 'State isn’t in the function — it’s in the renderer, keyed by call order. Build: useState from scratch on your Chapter 3 renderer.'
part: 'Part I — The Model'
written: true
---

"The state is in the component." That sentence — repeated in every tutorial — is
false, and its falsity explains *every* hooks rule in one stroke. Components are
functions (Chapter 3): they have no memory between calls, any more than `Math.max`
does. So `useState`'s state lives **in the renderer**, in an array attached to the
component instance, indexed by **call order**. Build it, break it on purpose, and the
"Rules of Hooks" stop being commandments and become the invariants of a data
structure.

## The lie you were told

> "useState stores state inside your component function."

A function cannot store anything — it's re-created and re-called every render
(Chapter 3). What actually exists:

```text
renderer's memory for this component instance:
  hooks: [ {value: 0}, {value: "hi"}, ... ]     ← an ARRAY
             ↑ slot 0     ↑ slot 1

useState(initial):
  1. read hooks[cursor]; if empty, initialize
  2. cursor += 1
  3. return [value, setter that schedules a re-render]

every render: cursor resets to 0 — so the SAME call order reads the SAME slots.
```

That's the whole mechanism. Which immediately explains the rules:

- **"Only call hooks at the top level"** — a hook inside an `if` shifts every later
  hook's slot; the second render reads state[1] where state[0] used to be. Corruption
  by index shift, not by magic.
- **"Only call hooks from components"** — the cursor belongs to the renderer's
  per-component memory; a random function has none.
- **"Custom hooks are just hooks"** — they run inline within the component's render,
  consuming slots of the same array in the same order.

## Prove it to yourself

**1. The index-shift corruption, on camera** (with the build below):

```javascript
function Bad({ open }) {
  const [a, setA] = useState("A");     // slot 0
  if (open) {
    const [b] = useState("B");         // slot 1 — ONLY when open!
  }
  const [c] = useState("C");           // open=true: slot 2... open=false: slot 1!!
  // flip `open`: c reads "B". State jumped components. The bug IS the array shift.
}
```

**2. Two useStates are independent** — because they're two slots, not one variable:

```javascript
const [x, setX] = useState(0);   // slot 0
const [y, setY] = useState(0);   // slot 1 — different cell, both survive re-renders
```

**3. State survives re-renders but not remounts** — the array lives with the component
*instance*: unmount it and the array is garbage-collected; remount = fresh array =
fresh state. (And `key` changes force a remount — Chapter 7's state-jump mystery,
solved in advance.)

## The build: useState, from scratch

Extend Chapter 3's renderer with a cursor and a per-instance array — this is the
famous "build React hooks in 20 lines" exercise, done honestly:

```javascript
// hooks.js — extends components.js (Ch 3)
let currentComponent = null;      // who is rendering right now?
let hookIndex = 0;                // the cursor into the hooks array

function useState(initial) {
  const hooks = currentComponent.hooks ??= [];      // per-INSTANCE memory (Ch 3's instance)
  const i = hookIndex++;
  if (i >= hooks.length) hooks[i] = { value: initial };   // first render: initialize

  const setState = (newValue) => {
    hooks[i].value = typeof newValue === "function" ? newValue(hooks[i].value) : newValue;
    scheduleRender(currentComponent);               // re-describe (Ch 2's loop re-runs)
  };
  return [hooks[i].value, setState];
}

function renderComponent(component) {
  currentComponent = component;                     // the renderer tells hooks WHO is asking
  hookIndex = 0;                                    // ← cursor reset: call order = slot order
  const vdom = component.fn(component.props);
  currentComponent = null;
  return vdom;
}
// (diff/patch from Chapter 2; scheduleRender re-runs renderComponent + diff/patch)
```

Twenty lines — and now run the corruption experiment: the `Bad` component above, with
`open` flipping, reads its neighbor's slot. **You didn't violate a rule; you shifted
an index.** Every hooks lint rule is a guard on this array's invariants.

## What you now know

- `useState`'s state lives **in the renderer: one array per component instance,
  addressed by call order** — the function itself is stateless.
- The Rules of Hooks are **index-shift invariants** — top-level only, component-only,
  same-order-every-render.
- State survives re-renders (array persists), dies on unmount (array collected), and
  resets on `key` change (new instance, new array — Chapter 7 connects this).
- Custom hooks compose because they're inline: they consume slots of the caller's
  array in deterministic order.

Next: state covers the DOM world. Effects are the bridge *out* — synchronizing with
timers, servers, and subscriptions, with cleanup as the contract.
