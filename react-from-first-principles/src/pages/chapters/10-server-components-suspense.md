---
layout: ../../layouts/Chapter.astro
title: 'Server Components & Suspense'
description: 'Rendering on the server, streaming to the client. Build: a Suspense-style streaming skeleton demo.'
part: 'Part III — The Ecosystem'
written: true
---

Every React render so far ran in the browser. **Server components** move parts of the
tree to the server — not as "SSR of the same components" but as components that
*never ship to the client at all*: they read databases directly, have zero bundle
cost, and stream their output as the data resolves. **Suspense** is the client-side
mechanism that makes partial trees renderable: "this subtree isn't ready — show this
placeholder, swap when done." Together they're the web course's streaming (Ch 11's
QUIC era) applied to React's tree. Build both, in toy form.

## The lie you were told

> "Server components are SSR — the same React, rendered on the server."

Classic SSR runs your *client* components on the server to produce HTML faster, then
ships the whole component code anyway for hydration. Server components are a third
category:

```text
client components:  shipped as JS, stateful, interactive (useEffect works)
server components:  NEVER shipped, stateless, async OK, read DBs/files directly,
                    output = a serialized tree description (Ch 2's vdom, as a payload!)

async function Profile({ id }) {                 ← this is a server component
  const user = await db.users.get(id);           ← direct DB access — zero API layer
  return <ProfileView user={user} />;            ← ProfileView ships to the client
}
```

The bundle win is the headline: an 800KB Markdown renderer used in a server component
costs the client **zero bytes**. The data win: no client-side waterfall of API calls —
the component *awaits* its data where it renders.

## Suspense: rendering an unfinished tree

The client's problem with async subtrees: the tree isn't ready — does the page freeze?
Suspense's answer: **the nearest boundary's fallback shows while the subtree
"throws" its pending promise**; when it resolves, the real content swaps in. A
promise as a control-flow signal:

```jsx
<Suspense fallback={<Skeleton />}>
  <Profile id="1" />          ← throws a promise while loading; React shows Skeleton
</Suspense>                     ← resolves → React discards the fallback, renders Profile
```

This is fiber's abandonment (Chapter 8) put to work: the unfinished subtree *is* the
pending fiber, set aside — not destroyed — and resumed when the promise lands. And
because boundaries are independent, each ready subtree streams in as data arrives:
**the page paints progressively, skeleton by skeleton** — no waiting for the slowest
query.

## Prove it to yourself

**1. The streaming shape, in curl** (any Suspense-streaming site or Next.js app):

```sh
curl -sN -H 'RSC: 1' https://next-app.example/page | head -20
# the response arrives in CHUNKS over time — shell, route, then data blocks
# appended seconds apart. HTML that arrives progressively = streaming (web course Ch 11).
```

**2. The bundle win, weighed:**

```sh
# a client component importing a 800KB dependency: 800KB in the JS bundle.
# the same code in a server component: 0KB shipped — it ran where the data lives.
# (verify: DevTools → Sources — the module simply isn't there.)
```

**3. The waterfall vs the stream:**

```text
no Suspense:  page → (wait 800ms for ALL data) → render everything
Suspense:     page → shell paints → skeleton A → data A swaps in → skeleton B → ...
```

## The build: streaming with Suspense semantics

```python
# suspense.py — a tree with async subtrees: fallbacks, resolution, progressive swap
import time, threading

class Suspense:                                   # a boundary: fallback + one subtree
    def __init__(self, fallback, make_content):
        self.fallback, self.make_content = fallback, make_content
        self.done, self.content = False, None

def render_tree(tree, out):
    """depth-first render; pending subtrees print fallback and resolve in background"""
    if isinstance(tree, Suspense):
        if tree.done: render_tree(tree.content, out)
        else:
            out.append(tree.fallback)             # the skeleton shows NOW
            def resolve():
                time.sleep(tree.make_content[1])  # the "network"
                tree.content = tree.make_content[0]()
                tree.done = True
                print("   [boundary resolved — swapping in content]")
            threading.Thread(target=resolve).start()
        return
    if isinstance(tree, str): out.append(tree); return
    for kid in tree: render_tree(kid, out)

page = [
    "<header> Shell paints immediately </header>",
    Suspense("  [skeleton: profile...]", (lambda: "<profile> Ada, written in 800ms </profile>", 0.8)),
    Suspense("  [skeleton: feed...]",    (lambda: "<feed> 30 posts, written in 1.5s </feed>", 1.5)),
]
out = []
print("── first render (instant): ──")
render_tree(page, out); print("\n".join(out))
time.sleep(1.8)                                   # the browser would keep the loop alive
print("\n── after all boundaries resolved, final tree: ──")
out2 = []; render_tree(page, out2); print("\n".join(out2))
```

```text
── first render (instant): ──
<header> Shell paints immediately </header>
  [skeleton: profile...]
  [skeleton: feed...]
   [boundary resolved — swapping in content]      ← at 800ms
   [boundary resolved — swapping in content]      ← at 1.5s
── after all boundaries resolved, final tree: ──
<header> Shell paints immediately </header>
<profile> Ada, written in 800ms </profile>
<feed> 30 posts, written in 1.5s </feed>
```

The shell and skeletons paint *immediately*; each subtree swaps in exactly when its
own data lands — the slowest query no longer gates the page. That's Suspense's whole
value: independent readiness, progressive paint.

## What you now know

- Server components = **components that never ship**: async, data-adjacent, zero
  bundle cost — serialized into the tree the client receives.
- **Suspense = promise-as-control-flow**: pending subtree shows the boundary's
  fallback; resolution swaps content without unmounting the shell.
- The pair turns loading from "wait for everything" into **streaming progressive
  paint** — the web course's Ch 11 streaming, at component granularity.
- The client/server split is an *architecture decision per component*: interactivity
  ships, data-adjacency stays home.

Next: React vs the challengers. Signals and Svelte make a different bet about
*granularity* — build the same app both ways and count the updates.
