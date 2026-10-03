---
layout: ../../layouts/Chapter.astro
title: 'Components & Composition'
description: 'Functions that return UI trees, composed like functions compose. Build: components over your own vdom from Chapter 2.'
part: 'Part I — The Model'
written: true
---

Chapter 2's vdom nodes all had string types (`"div"`, `"h1"`). Give a node a
**function** as its type and everything changes: rendering that node *calls the
function* and recurses into whatever it returns. That's a component — and the nested
calls give you composition, props, and the entire mental model, with one rule added
to the renderer.

## The lie you were told

> "Components are special objects with templates and a lifecycle."

A component is **a function from props to vdom**. Nothing else:

```javascript
const Greeting = (props) => h("h1", {}, "Hello, " + props.name);
```

`<Greeting name="world" />` in JSX *is* `h(Greeting, {name: "world"})`. The renderer
sees a function type, calls it with the props, and reconciles the result — Chapter 2's
loop, one level deeper. "Composition" is just: the function's returned tree contains
*other* component nodes, so rendering recursively calls those too.

## Props: the component's only input

Data flows **down, and only down** — that's the discipline that makes components
predictable:

```text
App (owns state)
 └─ UserList({users, onSelect})     ← receives via props, can't mutate upstream
     └─ UserRow({user, selected})   ← receives via props
```

A component receiving props is a **pure-ish function of them** (plus its own state,
Chapter 4): same props in, same tree out. This is why React apps are testable and why
"props vs state" has a clean answer — *props belong to the caller; state belongs to
the component; when two siblings need one value, it gets lifted to their parent*
(Chapter 9's patterns).

## Prove it to yourself

**1. Components are function calls** — the stack in DevTools during a render:

```jsx
function App() { return <Layout><Sidebar /><Content /></Layout> }
// React DevTools' component tree mirrors the CALL STACK of render():
// App → Layout → Sidebar, Content — because that's literally the execution order.
```

**2. Props are read-only — and the enforced direction is a feature:**

```jsx
function UserRow({ user }) {
  user.name = "hacked";     // works! but the change vanishes on next render —
}                           // the parent owns the data. One-way flow prevents
                            // "spooky action at a distance" entirely.
```

**3. Composition over configuration** — the `children` prop:

```jsx
const Card = ({ title, children }) =>
  h("div", { className: "card" }, h("h2", {}, title), children);
// children is whatever you nest inside — components composing components.
// This is why React apps don't grow "config objects with 40 flags": they nest.
```

## The build: components on your own vdom

One change to Chapter 2's renderer — resolve function types by calling them:

```javascript
// components.js — extends vdom.js (Ch 2): function types call themselves
function render(v) {
  if (typeof v.type === "function") {
    const subtree = v.type(v.props);          // ← THE one new line: call the component
    return render(subtree);                   // ...and reconcile what it returns
  }
  /* ...Chapter 2's render, unchanged below... */
}

// now components, composing:
const Badge = ({ text }) => h("span", { style: "color:green" }, text);
const UserRow = ({ user }) => h("li", {},
  Badge({ text: user.status }), " ", user.name);
const UserList = ({ users }) => h("ul", {}, users.map(u => UserRow({ user: u })));
const App = () => UserList({ users: [
  { name: "ada", status: "online" },
  { name: "grace", status: "away" },
]});

// diff works across components for free — Chapter 2's diff sees only the EXPANDED tree:
let oldV = App();
document.getElementById("app").appendChild(render(oldV));
const newV = App();          // imagine state changed the users
patch(document.getElementById("app").firstChild, diff(oldV, newV));
```

No framework code was added beyond the one line — components fell out of "let function
types call themselves." And the diff now reconciles *through* them, because the tree
it sees is the expanded result.

## What you now know

- A component = **a function from props to vdom**; rendering = calling it and
  recursing. One renderer line bought the whole paradigm.
- **Props flow down, read-only** — the discipline that makes components predictable;
  state (Ch 4) is the component's private addition.
- **Composition (children) beats configuration** — nesting scales where flag-objects
  collapse.
- The component tree *is* the render call stack — DevTools shows you the recursion.

Next: components are pure functions... so where does `useState`'s state *live*
between renders? Answer: in the renderer, in an array, keyed by call order — and the
hooks rules are that array's invariants.
