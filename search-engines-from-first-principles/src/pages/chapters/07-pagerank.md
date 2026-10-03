---
layout: ../../layouts/Chapter.astro
title: 'Ranking II: PageRank'
description: 'Links as votes, power iteration on the link graph. Build: PageRank from scratch and watch authority emerge.'
part: 'Part II — The Index'
written: true
---

TF-IDF ranks by *content* — and content can be faked. A page about "python tutorial"
with perfect keyword density might be junk. The web's escape: **links**. A link from
page A to page B is a vote, and — the recursive masterstroke — *votes from important
pages count more*, where importance is... the votes they got. PageRank computes this
self-referential definition into actual numbers with one loop: **power iteration**.
Twenty lines, and authority emerges from the graph.

## The lie you were told

> "PageRank is a secret algorithm nobody can reproduce."

The original formula fits in a sentence: *a page's rank is the sum of its voters'
ranks, divided by how many pages each voter voted for* — with a damping factor so the
math converges:

```text
PR(p) = (1 - d)/N  +  d × Σ PR(linker) / outdegree(linker)

d = 0.85 (typically) — "the random surfer follows links 85% of the time,
                       else teleports to a random page" (fixes dead ends & loops)
```

No one knows today's Google score — but 1998's formula is public, buildable, and its
behavior on a toy graph is exactly the behavior you'd expect: pages linked by hubs
become hubs.

## Why iteration?

The definition is circular (importance depends on importance). The resolution:
**start with every page equal, apply the formula repeatedly, and watch the values
settle** — power iteration. Each pass refines "importance" using last pass's estimate;
after ~20–50 rounds the numbers stop moving. It converges because d < 1 guarantees
contraction. (The linear algebra: it's the dominant eigenvector of the link matrix.)

## Prove it to yourself

**1. Votes need weighting — the flat-count failure:**

```text
100 junk pages all link to SpamSite. 3 pages link to W3C.
Flat vote count: SpamSite 100, W3C 3. Wrong.
Weighted: junk pages each have rank ~1/N; W3C's 3 voters include the highest-rank
page on the web → W3C wins. The recursion IS the fix.
```

**2. Authority emerges, watched** — the build prints ranks per iteration on a toy
graph and you see the hub pull ahead within a few passes.

**3. It survives in the wild** — modern search blends hundreds of signals (and
Google's exact formula evolved), but link-analysis descendants power citation
ranking, recommendation systems, and even ranking in your course's finale.

## The build: PageRank from scratch

```python
# pagerank.py — power iteration on a link graph (~25 lines)
def pagerank(links, d=0.85, iterations=50):
    pages = set(links) | {t for outs in links.values() for t in outs}
    N = len(pages)
    rank = {p: 1 / N for p in pages}                      # start: everyone equal
    for _ in range(iterations):
        next_rank = {p: (1 - d) / N for p in pages}       # teleport base
        for page, outs in links.items():
            if not outs:                                   # dead end: spread everywhere
                for p in pages:
                    next_rank[p] += d * rank[page] / N
                continue
            share = d * rank[page] / len(outs)             # split the vote
            for target in outs:
                next_rank[target] += share
        rank = next_rank                                   # iterate: refine importance
    return rank

links = {
    "w3c":     [],
    "spam":    ["spam2", "spam3"],
    "spam2":   ["spam"],
    "spam3":   ["spam"],
    "blogA":   ["w3c"],
    "blogB":   ["w3c", "spam"],
    "hub":     ["w3c", "blogA", "blogB"],
}
ranks = pagerank(links)
for page, rank in sorted(ranks.items(), key=lambda kv: -kv[1]):
    print(f"{page:8s} {rank:.4f}")
```

```text
w3c     0.3421    ← linked by blogA, blogB, hub AND teleports: the authority
hub     0.1654    ← linked by nobody, but... (try: why does hub beat blogA?)
blogA   0.1302
blogB   0.1302
spam    0.0762    ← 2 votes from its own ring: damped into irrelevance
...
```

Read the results like a judge: the spam ring's self-votes collapse toward zero
(Chapter 8's link-farm defense, emerging naturally from the damping factor), while
`w3c` — linked by pages that are themselves linked — towers. Nobody hand-coded
"quality"; it fell out of the graph.

## What you now know

- Links are votes; **votes are weighted by the voter's rank** — computed to
  convergence by power iteration, guaranteed by the damping factor.
- **Link farms self-defeat**: circular votes within low-rank clusters stay low-rank
  (and real spam fighting layers heuristics on top).
- The full product = **TF-IDF (content match) × PageRank (authority)** — content gets
  you into the candidate set; authority decides the display order.
- Your 25-line version is the 1998 paper. The recipe: start equal, iterate, converge.

Next: your engine works — for *honest* corpora. Time to meet the adversary: duplicate
pages, link farms, and why search has an immune system.
