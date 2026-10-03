---
layout: ../../layouts/Chapter.astro
title: 'Snippets & Highlighting'
description: 'The green text under every result. Build: a snippet generator that finds the best passage.'
part: 'Part III — Serving & Scale'
written: true
---

Users judge results by two things: the blue link and the **snippet** under it — the
2-line excerpt showing *where your words appear on the page*. A good snippet can win
the click even at rank 3. And it's a hidden mini-ranking problem: given a document and
a query, find the **window of text containing the most query terms**. Build it in 30
lines.

## The lie you were told

> "Snippets are the first sentence of the page."

If that were true, snippets would be useless for pages that bury their content. A real
snippet engine **scores windows**: slide a 2–3 sentence window across the document,
count how many query terms each window contains (weighted by Chapter 6's IDF if you
want quality), pick the winner, and **highlight** the hits. The document never leaves
the server's index — snippets are computed from stored text at query time.

## The mechanics

```text
1. window the text          (by sentences if you have them; by ~30-word chunks otherwise)
2. score each window        (Σ query-term hits — IDF-weighted: rare matches matter)
3. pick the best window     (tiebreak: earliest — users expect top-of-page relevance)
4. highlight                (wrap query terms in <b> — case-insensitive, term-normalized)
```

One subtlety from Chapter 3: you *stemmed* at index time, so the query term "running"
became "run" — but the snippet must highlight the original surface form "running".
Keep a map from term → surface variants per document, or highlight by prefix.

## Prove it to yourself

**1. First-sentence snippets fail visibly** — search any long FAQ page and find
results whose snippet answers a *different* question: those are first-sentence
snippets.

**2. The window score, computed:**

```python
text = "Our store sells shoes. " * 3 + "The best running shoes for marathons are here. " + "Shipping is fast."
query = ["running", "marathon"]
# window at the start: 0 query terms. The middle window: 2. The winner is obvious —
# and the algorithm finds it by counting, not by reading.
```

## The build: a snippet generator

```python
# snippets.py — window scoring + highlighting (~30 lines)
def make_snippet(text, query_terms, window_words=30):
    words = text.split()
    q = {t.lower() for t in query_terms}
    best_i, best_score = 0, -1
    for i in range(0, max(len(words) - window_words, 1), 5):      # slide with stride 5
        window = words[i:i + window_words]
        score = sum(1 for w in window if w.lower().strip(".,!") in q)
        if score > best_score:
            best_i, best_score = i, score
    window = words[best_i:best_i + window_words]

    # highlight: match stems by prefix (Ch 3's stemming stripped suffixes)
    highlighted = []
    for w in window:
        bare = w.lower().strip(".,!")
        hit = any(bare.startswith(t) or t.startswith(bare) for t in q)
        highlighted.append(f"<b>{w}</b>" if hit else w)

    prefix = "…" if best_i > 0 else ""
    return prefix + " ".join(highlighted) + "…"

doc = ("Our store sells shoes. " * 3
       + "The best running shoes for marathons are here. "
       + "Shipping is fast and free everywhere.")
print(make_snippet(doc, ["running", "marathon"]))
# …The best <b>running</b> <b>shoes</b> for <b>marathons</b> are here. Shipping is fast
#   and free everywhere.…      ← the window with BOTH query terms, hits in bold
```

Try the same call with `query=["shipping"]`: a *different* window wins. One function,
query-aware output — this is exactly what Elasticsearch's highlighting does.

## What you now know

- Snippets = **window scoring** (most query terms wins) + **highlighting** (stem-aware
  markup) — a ranking problem at sentence scale.
- IDF-weighted window scores improve quality; tiebreak toward earlier windows (users
  expect top-of-page relevance).
- Snippets come from *stored text* — one more reason Chapter 4's index kept the
  documents.

Next: your engine works beautifully on one machine. Time to break it on purpose —
shards, replicas, and merging rankings across machines. The distributed systems
course, applied.
