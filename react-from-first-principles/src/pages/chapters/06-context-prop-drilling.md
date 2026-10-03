---
layout: ../../layouts/Chapter.astro
title: 'Context & Prop Drilling'
description: 'How a value reaches depth-7 components without 6 hop-throughs. Build: a toy context provider.'
part: 'Part II — The Mechanics'
written: true
---

Props flow down, one level per render call (Chapter 3). When a theme, a current user,
or a locale is needed at depth 7, that discipline becomes *prop drilling*: six
intermediate components each accept and re-forward a prop they never use. **Context**
is the escape — but it's not a global variable; it's a **render-scoped broadcast**:
the provider's value propagates down the tree during render, and consumers read the
nearest provider above them. Build one, and see its real cost too.

## The lie you were told

> "Context is a global variable / a state manager."

Three precise corrections:

1. **Scoped, not global** — the value reaches only the subtree under its provider;
   two providers of the same context can coexist, each shadowing the other (nearest
   wins — like variable shadowing).
2. **Render-driven, not event-driven** — a context value change re-renders the
   provider and *everything below it that consumes* (Chapter 2's reconciliation,
   triggered by the provider). It's not a signal (Chapter 11): no fine-grained
   tracking.
3. **Transport, not state** — context *delivers* a value; it doesn't own updates.
   Put `useState` *in the provider* and pass `[value, setter]` down; the context is
   the wire, not the battery.

## The mechanism

```text
<ThemeCtx.Provider value="dark">        ← during render, push "dark" onto the
   ...any depth...                         context stack for ThemeCtx
      useContext(ThemeCtx)              ← walks UP the current render stack,
   ...                                     finds the NEAREST provider, reads "dark"
</ThemeCtx.Provider>                    ← pop on the way out
```

Two implementation shapes exist: walk the element tree at render time (our toy), or
maintain a stack during the recursive render call (what React does — the recursion of
Chapter 3 *is* the stack). Either way: nearest enclosing provider, read at render,
re-render on provider change.

## Prove it to yourself

**1. Nearest provider wins (shadowing):**

```jsx
<ThemeCtx.Provider value="dark">
  <Toolbar />                                  {/* reads "dark" */}
  <ThemeCtx.Provider value="light">
    <Modal />                                  {/* reads "light" — shadowed */}
  </ThemeCtx.Provider>
</ThemeCtx.Provider>
```

**2. Every consumer re-renders on value change** — put a `console.log` in three
consumers at different depths, change the provider's value: all three log. (And so
does everything *between* provider and consumers that isn't memoized — Chapter 2's
reconciliation doesn't skip; this is why "context re-render storms" happen and why
the value object identity matters — a new `{}` per render re-renders all consumers
even with identical contents.)

**3. Prop drilling, before and after:**

```jsx
// before: 6 hop-throughs, each a place to forget
<Layout user={user}> <Sidebar user={user}> <Menu user={user}> <Avatar user={user} />
// after: 0 hops — Avatar reads useContext(UserCtx) directly
```

## The build: a toy context

```javascript
// context.js — extends hooks.js (Ch 4): a provider stack + useContext
function createContext(defaultValue) {
  return { Provider: null, _defaultValue: defaultValue, _stack: [defaultValue] };
}
// each context carries a stack: the nearest provider's value is on top

function Provider(ctx, value, childrenVdom) {
  ctx._stack.push(value);                        // push: the render recursion IS the scope
  const vdom = childrenVdom;                     // children render INSIDE the push
  ctx._stack.pop();                              // pop when the subtree finishes
  return vdom;
}

function useContext(ctx) {
  return ctx._stack[ctx._stack.length - 1];      // nearest enclosing provider
}

// — demo: theme at the top, user at depth 7, zero drilling —
const Theme = createContext("light");
const User = createContext(null);

function DeepAvatar() {
  const theme = useContext(Theme);               // depth 7, no props
  const user = useContext(User);
  return h("span", { style: `color:${theme === "dark" ? "#9cf" : "#333"}` },
           `avatar of ${user.name}`);
}
function Panel() { return h("div", {}, DeepAvatar()); }
function Sidebar() { return h("div", {}, Panel()); }
function App() {
  return Provider(Theme, "dark",
    Provider(User, { name: "ada" },
      Sidebar()));                               // App → Sidebar → Panel → Avatar
}
```

Render `App()`: `DeepAvatar` reads both contexts with **no props on any intermediate
component**. The push/pop around the subtree is the entire mechanism — the render
recursion (Chapter 3) was always a stack; context just reads it.

## What you now know

- Context = **scoped broadcast**: nearest provider, read at render, shadowable like
  variables.
- Provider value changes **re-render consumers** (and intermediates) — it's
  reconciliation-triggering transport, not fine-grained reactivity (Ch 11's signals
  fix exactly this).
- Context is the *wire*; state belongs in the provider component. And it's for
  genuinely ambient values (theme, user, locale) — not a prop-drilling hammer for
  data that flows one path.
- Your render recursion was a stack all along — context is the stack, read.

Next: Chapter 2's diff handles trees — but lists are where it bleeds. Keys, identity,
and the state-jumping bug that the famous console warning exists to prevent.
