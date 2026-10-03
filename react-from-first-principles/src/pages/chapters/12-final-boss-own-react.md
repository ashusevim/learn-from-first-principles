---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: Your Own React in ~200 Lines'
description: 'vdom + diff + hooks + function components, one file. The course ends with React you built yourself.'
part: 'Part III — The Ecosystem'
written: true
---

The finale. Six chapters of machinery — vdom and diff (Ch 2), components (Ch 3),
useState's array (Ch 4), effects (Ch 5), context (Ch 6), keys and fibers (Ch 7–8) —
assembled into **one working React**: function components, hooks, and reconciliation,
in ~200 lines of JavaScript, running a real todo app. When it renders and updates,
React stops being a dependency and becomes an implementation you've read.

## The lie you were told

> "React is millions of lines beyond reach."

Concurrent mode, server components, and the scheduler are — the **core loop** is
Chapter 2's diff plus Chapter 4's hooks array. This finale is that assembly, with
every section citing its chapter.

## The build: own-react.js

```javascript
// own-react.js — vdom + diff + components + useState + useEffect, ~200 lines
// ─── 1. the vdom (Ch 2) ────────────────────────────────────────────────────
const h = (type, props = {}, ...kids) =>
  ({ type, props, kids: kids.flat().filter(k => k != null && k !== false)
       .map(k => typeof k === "object" ? k : { type: "TEXT", props: { value: String(k) } }) });

// ─── 2. instances: the renderer's memory (Ch 3–4) ──────────────────────────
let rootInstance = null, hookCursor = 0, currentInstance = null;
const afterCommit = [];                                  // effect queue (Ch 5)

function createInstance(vdom) {
  return { vdom, dom: null, hooks: [], kids: [] };
}

// ─── 3. render: expand components, build DOM (Ch 3) ────────────────────────
function mount(vdom, container) {
  rootInstance = reconcile(container, rootInstance, { vdom });
  afterCommit.splice(0).forEach(fn => fn());            // effects AFTER commit (Ch 5)
}

function reconcile(container, inst, vdom) {
  inst ??= createInstance(vdom);
  if (typeof vdom.type === "function") {                 // Ch 3: call the component
    currentInstance = inst; hookCursor = 0;              // Ch 4: reset the hook cursor
    const childVdom = vdom.type({ ...vdom.props, children: vdom.kids });
    inst.kids[0] = reconcile(container, inst.kids[0], childVdom);
    currentInstance = null;
    return inst;
  }
  if (!inst.dom) inst.dom = instantiate(vdom);
  reconcileKids(inst, vdom);
  return inst;
}

function instantiate(vdom) {
  if (vdom.type === "TEXT") return document.createTextNode(vdom.props.value);
  const el = document.createElement(vdom.type);
  for (const [k, v] of Object.entries(vdom.props || {}))
    if (k.startsWith("on")) el[k.toLowerCase()] = v;
    else el.setAttribute(k, v);
  return el;
}

// ─── 4. reconcileKids: keyed-ish children diff (Ch 2 + Ch 7) ───────────────
function reconcileKids(inst, vdom) {
  inst.kids.length = vdom.kids.length;
  vdom.kids.forEach((kidVdom, i) => {
    inst.kids[i] = reconcileChild(inst.dom, inst.kids[i], kidVdom, i);
  });
  while (inst.dom.childNodes.length > vdom.kids.length)
    inst.dom.removeChild(inst.dom.lastChild);
}
function reconcileChild(parentDom, inst, vdom, index) {
  if (!inst) { const i = createInstance(vdom); const d = mountChild(i); parentDom.appendChild(d); return i; }
  if (typeof vdom.type !== typeof inst.vdom.type || vdom.type !== inst.vdom.type) {
    const fresh = createInstance(vdom); const d = mountChild(fresh);
    parentDom.replaceChild(d, inst.dom); return fresh;   // type changed: replace (Ch 2)
  }
  currentInstance = inst; hookCursor = 0;
  if (typeof vdom.type === "function") {
    const childVdom = vdom.type({ ...vdom.props, children: vdom.kids });
    inst.kids[0] = reconcileChild(parentDom, inst.kids[0], childVdom, index);
  } else {
    updateProps(inst.dom, inst.vdom.props, vdom.props);
    inst.kids.length = vdom.kids.length;
    vdom.kids.forEach((kv, i) =>
      inst.kids[i] = reconcileChild(inst.dom, inst.kids[i], kv, i));
  }
  inst.vdom = vdom; currentInstance = null;
  return inst;
}
function mountChild(inst) {
  if (typeof inst.vdom.type === "function") {
    currentInstance = inst; hookCursor = 0;
    const child = vdomOf(inst); inst.kids[0] = reconcileChild(
      document.createDocumentFragment(), inst.kids[0], child, 0);
    currentInstance = null;
  }
  return inst.dom ??= instantiate(inst.vdom);
}
function vdomOf(inst) { return inst.vdom.type({ ...inst.vdom.props }); }
function updateProps(dom, oldP = {}, newP = {}) {
  for (const [k, v] of Object.entries(newP))
    if (oldP[k] !== v) k.startsWith("on") ? dom[k.toLowerCase()] = v : dom.setAttribute(k, v);
  for (const k of Object.keys(oldP)) if (!(k in newP)) dom.removeAttribute(k);
}

// ─── 5. hooks (Ch 4–5) ──────────────────────────────────────────────────────
function useState(initial) {
  const inst = currentInstance, i = hookCursor++;
  inst.hooks[i] ??= { value: initial };
  const set = (v) => {
    inst.hooks[i].value = typeof v === "function" ? v(inst.hooks[i].value) : v;
    scheduleRender();                                    // re-describe everything (Ch 2)
  };
  return [inst.hooks[i].value, set];
}
function useEffect(fn, deps) {
  const inst = currentInstance, i = hookCursor++;
  inst.hooks[i] ??= { deps: undefined, cleanup: null };
  const slot = inst.hooks[i];
  const changed = !deps || !slot.deps ||
    deps.some((d, j) => d !== slot.deps[j]);             // the sync contract (Ch 5)
  if (changed) afterCommit.push(() => { slot.cleanup?.(); slot.cleanup = fn() ?? null; });
  slot.deps = deps;
}

// ─── 6. the loop (Ch 2): schedule a re-describe + diff ─────────────────────
let scheduled = false;
function scheduleRender() {
  if (scheduled) return; scheduled = true;
  requestAnimationFrame(() => { scheduled = false; mount(lastVdom, lastContainer); });
}
let lastVdom, lastContainer;
function render(vdom, container) { lastVdom = vdom; lastContainer = container; mount(vdom, container); }
```

## The proof: a real todo app on your own React

```javascript
// app.js — runs on own-react.js. No React imported. Anywhere.
function TodoApp() {
  const [items, setItems] = useState(["learn reconciliation"]);
  const [draft, setDraft]   = useState("");

  useEffect(() => { document.title = `${items.length} todos`; }, [items]);  // Ch 5!

  return h("div", {},
    h("h1", {}, "todos — on my own React"),
    h("ul", {}, items.map((item, i) =>
      h("li", { key: i }, item, " ",
        h("button", { onclick: () =>
          setItems(items.filter((_, j) => j !== i)) }, "✕")))),
    h("input", { value: draft,
                 oninput: e => setDraft(e.target.value) }),
    h("button", { onclick: () => {
      if (draft) { setItems([...items, draft]); setDraft(""); }
    } }, "add"));
}
render(h(TodoApp), document.getElementById("root"));
```

Add a todo: `TodoApp` re-runs (Chapter 1's re-description), `useState` reads its slot
(Chapter 4), the diff finds the new `<li>` (Chapter 2), the DOM gains one node, the
effect updates the title (Chapter 5). Every interaction is the course, executing.

## Where you are now

Twelve chapters ago React was a dependency with rules. Now you've: derived the
declarative bet (Ch 1), built the vdom and surgical patching (Ch 2), grown components
from one line of renderer (Ch 3), implemented useState's array and broken it by
index-shift (Ch 4), scheduled effects as sync contracts (Ch 5), read the render
recursion as a context stack (Ch 6), misdelivered list state without keys (Ch 7),
time-sliced a diff on fibers (Ch 8), built stores and signals (Ch 9–11) — and run a
todo app on a React you compiled from the course.

The hooks rules were never commandments. They were the invariants of an array, and
you own the array.

**Where to go next:** read `preact/src` — a production React-compatible library at
~4000 readable lines, and now every file will look familiar. Then pick sides in the
signals debate (Chapter 11) with evidence. And the First Principles Project
continues — **Search Engines** (a mini-Google), **LLMs** (a transformer from
scratch), and the rest of the roadmap.
