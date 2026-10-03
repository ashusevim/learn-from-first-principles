---
layout: ../../layouts/Chapter.astro
title: 'The Virtual DOM & Reconciliation'
description: 'Why diff two trees instead of mutating one? Build: a virtual DOM with diff and patch in ~60 lines.'
part: 'Part I — The Model'
written: true
---

Chapter 1 made the bet: describe the UI, let machinery apply it. The machinery is
**reconciliation** — and its core trick is the virtual DOM: render to a *cheap tree of
plain objects*, diff it against the last description, and touch the real DOM only
where something changed. This chapter builds the whole loop — vdom, diff, patch — in
~60 lines, and instruments it to prove the DOM is touched only where needed.

## The lie you were told

> "React re-renders everything for performance."

Re-rendering the *real* DOM for every state change would be glacial. React re-renders
a **description** of everything — plain JS objects (`{type: "div", props: {...},
children: [...]}`) — which costs microseconds. Then the diff decides the minimal set
of *real* DOM operations. The vdom is not a performance feature; it's what makes the
declarative model **affordable** — re-describe freely, apply surgically.

## The three functions

```text
h(type, props, ...children)   → a plain object describing one node   (the "vdom")
render(vdom)                  → a real DOM node (recursively)
diff(old, new)                → a list of operations (CHANGE / REPLACE / REMOVE / ADD)
patch(node, ops)              → apply them to the real DOM
```

Diff rules (the toy version — React's adds keying, Chapter 7):

```text
same type?    → recurse into children (props diff: changed ones → CHANGE)
different?    → REPLACE the whole subtree (cheap: descriptions are cheap)
extra/missing → ADD / REMOVE
```

## Prove it to yourself

**1. The DOM is touched surgically** — instrument `createElement`:

```javascript
let creations = 0;
const _ce = document.createElement.bind(document);
document.createElement = t => (creations++, _ce(t));

// re-render with ONE text change, patch:
// creations increments by 0–1 — NOT once per node in the tree.
// naive innerHTML re-render: creations increments for EVERY node.
```

**2. innerHTML vs diff, the trap they replace:**

```javascript
list.innerHTML = renderHTML(state);   // destroys and rebuilds: scroll jumps, focus lost,
                                      // images flicker, event listeners re-attached
patch(list, diff(oldVdom, newVdom));  // touches one text node. Focus, scroll, state: intact.
```

That second list — scroll position, focus, open `<select>`s, input values — is why
innerHTML-only rendering feels broken at scale, and why "just re-render everything"
needed a diff to become viable.

## The build: vdom + diff + patch, instrumented

```javascript
// vdom.js — the reconciliation loop, from scratch (~60 lines)
let domOps = 0;                                        // instrumentation (the proof!)

const h = (type, props = {}, ...kids) =>
  ({ type, props, kids: kids.flat().map(k =>
       typeof k === "object" ? k : { type: "text", props: { value: String(k) } }) });

function render(v) {                                   // vdom → real DOM
  if (v.type === "text") return document.createTextNode(v.props.value);
  const el = document.createElement(v.type); domOps++;
  for (const [k, val] of Object.entries(v.props || {}))
    if (k.startsWith("on")) el[k.toLowerCase()] = val;
    else el.setAttribute(k, val);
  for (const kid of v.kids) el.appendChild(render(kid));
  return el;
}

function diff(oldV, newV, ops = []) {
  if (oldV.type !== newV.type) { ops.push({ op: "replace", newV }); return ops; }
  for (const [k, val] of Object.entries(newV.props || {}))
    if (oldV.props?.[k] !== val) ops.push({ op: "attr", k, val });
  const max = Math.max(oldV.kids.length, newV.kids.length);
  for (let i = 0; i < max; i++) {
    const o = oldV.kids[i], n = newV.kids[i];
    if (o && n) diff(o, n, ops);                        // same type: recurse
    else if (n) ops.push({ op: "add", n, at: i });
    else if (o) ops.push({ op: "remove", at: i });
  }
  return ops;
}

function patch(el, ops) {
  for (const op of ops) {
    domOps++;
    if (op.op === "attr") el.setAttribute(op.k, op.val);
    if (op.op === "add") el.insertBefore(render(op.n), el.children[op.at]);
    if (op.op === "remove") el.removeChild(el.children[op.at]);
    if (op.op === "replace") el.replaceWith(render(op.newV));
  }
}

// ── demo: a counter, re-described on every click, patched surgically ──
let state = 0, oldV;
function App(s) { return h("div", {},
  h("h1", {}, "count: ", String(s)),
  h("button", { onclick: () => { state++; update(); } }, "+1")); }

function update() {
  const newV = App(state);
  if (oldV) {
    const before = domOps;
    patch(document.getElementById("app").firstChild, diff(oldV, newV));
    console.log(`re-render: ${domOps - before} real DOM ops (tree: ~6 nodes)`);
  } else {
    document.getElementById("app").appendChild(render(newV));
  }
  oldV = App(state);
}
document.body.innerHTML = '<div id="app"></div>';
update();
```

Click it and watch the console: each click performs **1–2 real DOM operations** for a
6-node tree — the diff found the one text node that changed. Re-render freely; pay
surgically.

## What you now know

- The vdom = **a cheap object tree**; reconciliation = **diff it, patch the real DOM
  minimally**. Re-describe everything, mutate almost nothing.
- The diff's core rule: same type → recurse; different type → replace subtree.
- `innerHTML`-style re-rendering breaks scroll/focus/listeners — the vdom exists to
  make re-describing *safe*, not just fast.
- Missing: components (Ch 3), state (Ch 4), and identity for list items (Ch 7's keys).

Next: those vdom nodes can have *functions* as their type — and calling them inside
each other gives you components and composition.
