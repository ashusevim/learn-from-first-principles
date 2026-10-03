---
layout: ../../layouts/Chapter.astro
title: 'UI as a Function of State'
description: 'The declarative bet: stop mutating the DOM, describe the result. Build: the same counter imperatively and React-ively, side by side.'
part: 'Part I — The Model'
written: true
---

React is famous for hooks, JSX, and its ecosystem — and all of that rests on one idea
stated in one line from the 2013 talk: **UI is a function of state.** `f(state) = view`.
Stop *mutating* the screen step by step; *describe* the screen your current state
implies, and let machinery make reality match the description. This chapter builds the
same feature twice — imperative and declarative — and locates the exact moment the
bugs disappear.

## The lie you were told

> "React makes the DOM fast."

React is (usually) *slower* than hand-written DOM mutations — a well-tuned
`textContent = value` beats a whole React render. What React buys is **correctness at
scale**: the declarative model removes an entire species of bug. Speed comes later
(Chapter 2's diff making re-describing cheap enough).

## The imperative trap, in slow motion

A sync-status widget, vanilla DOM:

```javascript
let count = 0;
function addItem(item) {
    count++;
    document.querySelector("#count").textContent = count;      // remember to update...
    document.querySelector("#empty").hidden = count > 0;       // ...remember this too...
    document.querySelector("#list").appendChild(render(item)); // ...and this...
}
function removeItem(el) {
    count--;
    document.querySelector("#count").textContent = count;      // ...again?
    if (count === 0) document.querySelector("#empty").hidden = false;  // ...forgot anywhere?
}
```

Every mutation site must hand-maintain *every* derived view. Miss one path — the
empty-state banner, the counter after undo, the badge after bulk delete — and the UI
lies. These are **state-sync bugs**: N features × M views = N×M places to forget. The
bug count grows multiplicatively with the app.

## The declarative move

Instead of "how to change the screen", write "what the screen is":

```jsx
function App() {
    const [items, setItems] = React.useState([]);
    return (
        <div>
            <span id="count">{items.length}</span>
            <span id="empty" hidden={items.length > 0}>no items yet</span>
            <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
    );
}
// addItem = setItems(items => [...items, item]) — no DOM calls. Anywhere. Ever.
```

The view is a **pure function of the data**: `view = f(items)`. The empty banner can't
drift out of sync — it's *computed* from the same source, every render. `addItem` and
`removeItem` shrank to one line each, and the N×M bug matrix collapsed to N data
changes. **That's the bet.** The machinery React runs to honor it (re-render, diff,
patch) is Chapter 2.

## Prove it to yourself

**1. The bug the declarative model can't have** — in the imperative version, add a
"clear all" button that forgets the empty-banner line. The counter resets; the banner
doesn't. In the React version, there is no banner line to forget — it's derived. Run
both; break one; fail to break the other.

**2. The re-render, observed** — put a `console.log` in the component body: it runs on
*every* state change. React re-runs your whole description and reconciles (Chapter 2)
— your job is describing, its job is applying.

**3. The cost, acknowledged** — DevTools Performance on both versions: the vanilla
one does ~0.1ms per click; React does ~0.5ms (describe → diff → patch). You bought
correctness with CPU — a trade you'll make *consciously* from now on, and optimize
selectively (memoization, Chapter 2's diff granularity).

## The build: both models, side by side, one file

```html
<!-- counter.html — the same counter, three ways. Open in a browser. -->
<div id="imperative"></div>
<div id="declarative"></div>
<script>
  /* 1. IMPERATIVE: mutate the DOM step by step (the N×M bug farm) */
  const imp = document.getElementById("imperative");
  let count = 0;
  function impRender() {                       // ...a hand-rolled "render" you must call
    imp.innerHTML = `<b>imperative:</b> ${count}
      <button id="inc">+1</button>`;
    document.getElementById("inc").onclick = () => { count++; impRender(); };
  }
  impRender();                                  // forget this call = blank UI (a classic)

  /* 2. DECLARATIVE: view = f(state) — the React shape, in vanilla */
  const dec = document.getElementById("declarative");
  let dcount = 0;
  function App(state) {                         // a PURE function: state in, view out
    return `b<decl: ${state} <button id="dinc">+1</button>`.replace("b<", "<b>").replace("</button>", "</button>");
  }
  function decRender() {                        // the framework's job (Ch 2: diff+patch)
    dec.innerHTML = `<b>declarative:</b> ${dcount} <button id="dinc">+1</button>`;
    document.getElementById("dinc").onclick = () => { dcount++; decRender(); };
  }
  decRender();                                  // also "re-run whenever state changes" —
                                                // but the function can NEVER forget a view,
                                                // because every view is derived.
</script>
```

Both counters behave identically — and at this size, the imperative one is *fine*. The
declarative difference appears when a second view depends on the count, then a third,
then a bulk operation: the imperative version accumulates sync sites; the declarative
version accumulates nothing. That growth-curve difference is the whole adoption story
of the last decade.

## What you now know

- **UI = f(state)**: describe the result from data; never hand-maintain derived views.
- The bug class it kills is **state-sync divergence** — N features × M views of
  forgetting; it collapses to N state changes.
- React is *slower* per update than raw DOM — the trade is correctness at scale, paid
  in CPU, and Chapter 2's diff is what shrinks the bill.
- Every React API you'll meet (hooks, keys, memo) exists to keep `f` pure and the
  re-description cheap.

Next: the machinery under the bet — why re-describing everything doesn't melt the DOM:
build a virtual DOM, diff it, and patch it in ~60 lines.
