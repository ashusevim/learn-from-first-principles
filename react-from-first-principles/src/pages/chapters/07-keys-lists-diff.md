---
layout: ../../layouts/Chapter.astro
title: 'Keys, Lists & Why the Diff Algorithm Cares'
description: 'The famous key warning is a diff-algorithm contract. Build: keyed vs unkeyed diffing — watch state jump between rows.'
part: 'Part II — The Mechanics'
written: true
---

"Each child in a list should have a unique key" — the warning everyone silences with
the array index. That warning is not pedantry: it documents a **contract with the diff
algorithm** about element *identity*. Get identity wrong and React doesn't corrupt
your data — it reuses the wrong DOM nodes, and *component state jumps between rows*.
This chapter reproduces the bug on camera, then fixes it with one line.

## The lie you were told

> "Keys are an optimization hint."

Keys are **identity**. When Chapter 2's diff walks two children arrays, it compares
*by position* — `old[0]` vs `new[0]`, `old[1]` vs `new[1]`. Position works when lists
only grow/shrink at the end. But when a list **reorders, inserts in the middle, or
deletes from the middle**, positional matching makes every element after the change
"be" a different element:

```text
before: [A, B, C]        after deleting B: [A, C]
positional diff:         A↔A (same), B↔C (same position!) → C's props patched ONTO B's DOM,
                         C removed.
result:                  row C's DOM was B's — its input text, focus, scroll: all B's.
```

The DOM nodes are reused for the wrong logical items. For plain text this is invisible;
for rows with *state* (an input the user typed in, a checkbox, focus, an open
dropdown) it's data corruption in the UI. The key tells the diff: **match by
identity, not position** — `key:"B"` was removed, so destroy B's DOM wherever it is;
`key:"C"` moved, so *move* C's DOM intact.

## Prove it to yourself

**1. State jumping, on camera:**

```jsx
// type "hello" into row B's input, then delete row A:
<ul>{items.map((item, i) =>
  <Row key={i} item={item} />)}          // keyed by INDEX = positional diff!
</ul>
// the text "hello" stays on the FIRST row — but the first row is now logically C.
// React didn't lose your data; it misdelivered it. Identity was position.
```

**2. Same app, key={item.id}**: delete row A — "hello" moves *with* row B. The DOM
node was moved, not re-rendered. One character of code, a whole class of bug gone.

**3. The warning, understood**: it fires when React sees a list it can't give stable
identity for — it's telling you the diff will fall back to position, and your
components' state will follow position too.

## The build: keyed vs unkeyed diff

```javascript
// keys.js — positional diff vs keyed diff over a list of rows WITH state
const domRows = new Map();                 // vdom identity → DOM node (React keeps this
                                           // internally as the fiber's instances)

function renderRow(row) {
  const el = document.createElement("div");
  const input = document.createElement("input");
  input.value = row.draft;                              // per-row STATE (what you typed)
  el.appendChild(input);
  el.appendChild(document.createTextNode(" " + row.name));
  domRows.set(row, el);
  return el;
}

function unkeyedDiff(oldRows, newRows, container) {
  // Chapter 2's diff: match by POSITION — DOM reused positionally
  container.innerHTML = "";
  for (const row of newRows) container.appendChild(domRows.get(oldRows[newRows.indexOf(row)]) ?? renderRow(row));
}

function keyedDiff(oldRows, newRows, container) {
  // match by IDENTITY: move/remove/add whole DOM nodes, state travels with them
  const oldByKey = new Map(oldRows.map(r => [r.id, r]));
  for (const row of newRows) {
    const el = domRows.get(oldByKey.get(row.id)) ?? renderRow(row);
    container.appendChild(el);                          // appendChild MOVES existing nodes
  }
  for (const row of oldRows)
    if (!newRows.find(r => r.id === row.id)) domRows.get(row)?.remove();
}

// — the experiment —
let rows = [ { id: 1, name: "A", draft: "" },
             { id: 2, name: "B", draft: "" },
             { id: 3, name: "C", draft: "" } ];
const c1 = document.createElement("div"), c2 = document.createElement("div");
for (const r of rows) { c1.appendChild(renderRow(r)); c2.appendChild(domRows.get(r)); }

// type "hello" into row B's input (both columns show it):
c1.children[1].querySelector("input").value = "hello";
c2.children[1].querySelector("input").value = "hello";

const after = [rows[0], rows[2]];                       // DELETE row B

unkeyedDiff(rows, after, c1);    // positional: "hello" is now on row C's input (WRONG)
keyedDiff(rows, after, c2);      // keyed:      "hello" is on... nothing (B was deleted),
                                 //             and C's input is empty (CORRECT)
console.log("unkeyed col:", [...c1.querySelectorAll("input")].map(i => i.value));
console.log("keyed col:   ", [...c2.querySelectorAll("input")].map(i => i.value));
// unkeyed col: ['hello']        ← the dead row's state, reincarnated on row C
// keyed col:   []              ← C's own (empty) state, correctly
```

The unkeyed column shows the corruption: row C now *contains* the text you typed into
row B. The keyed column is correct. Same diff, one identity rule.

## What you now know

- Keys = **element identity for the diff algorithm**; without them, matching is
  positional and DOM/state misdelivers on reorder/delete.
- The index-as-key bug appears exactly when lists **reorder or delete from the
  middle** AND rows have state (inputs, focus, animations).
- Keys also **force remounts** when changed (`key={userId}` on a profile = fresh
  state per user — Chapter 4's array is per-instance, and the key defines the
  instance).
- Random keys are worse than index keys (new identity every render = full teardown).

Next: Chapter 2's diff is recursive — and recursion can't pause. React 16's rewrite
(fiber) made rendering interruptible; build a time-sliced diff and see why.
