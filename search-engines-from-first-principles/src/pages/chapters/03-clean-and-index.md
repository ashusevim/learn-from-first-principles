---
layout: ../../layouts/Chapter.astro
title: 'Cleaning & Tokenizing Documents'
description: 'Lowercase, tokenize, stem, stop-words — turning HTML into indexable terms. Build: a text pipeline from raw page to term list.'
part: 'Part I — The Crawler'
written: true
---

Chapter 2's corpus is raw HTML. Before anything can be indexed, documents become
**terms** through a pipeline of small, seemingly boring decisions — and every one of
those decisions silently defines what your search can and cannot find. "Python" vs
"python", "running" vs "run", "the" appearing in every document: each is a policy
choice with query-time consequences.

## The lie you were told

> "The index stores the words on the page."

The index stores **normalized terms**, and normalization is lossy on purpose:

```text
raw HTML ──strip tags──► text ──lowercase──► ──tokenize──► ──drop stop-words──► ──stem──► terms
"Running Shoes!"        "running shoes"   [running, shoes]   [running, shoes]     [run, shoe]
```

Each stage answers a question: Which text counts (do you index nav bars?). Do case and
plural matter ("Python" the snake vs "python" the language — lowercasing merges them)?
Do common words deserve space ("the" is in 40% of documents — indexing it bloats the
index and helps no query)? Do variants merge ("running"/"runs" → "run" — stemming)?

Get these wrong and users see "no results" for pages that visibly contain their words.

## The stages, priced

- **Tag stripping**: `<script>` bodies are text to a naive stripper — and index-spam
  to a search engine. Strip by tag type, not by regex.
- **Stop-words**: "the", "of", "and" appear everywhere, so they can't *distinguish*
  documents — their inverted-index posting lists are enormous and their discriminating
  power is nil. Drop them (but remember phrase queries need them back — Chapter 5).
- **Stemming**: merge "run/running/runs" → "run" so a query for "running" finds "runs".
  The classic Porter stemmer chops suffixes by rules; it's famously imperfect
  ("university" → "univers") — accepted loss for recall.

## Prove it to yourself

**1. Count what stop-words cost:**

```python
from collections import Counter
text = "the quick brown fox jumps over the lazy dog the end".split()
print(Counter(text).most_common(3))
# [('the', 3), ...] — the top term indexes ~every document: useless, huge
```

**2. Feel stemming's recall win:**

```python
def stem(w):                          # a crude suffix-stripper (Porter is smarter)
    for suf in ("ing", "ed", "es", "s"):
        if w.endswith(suf): return w[: -len(suf)]
    return w

print({stem(w) for w in ["run", "running", "runs"]})   # {'run'} — one term, three surfaces
```

A query for "running" now matches a document that only ever said "runs". That's
**recall** — bought with a little precision (Chapter 9 measures the trade).

## The build: the pipeline

```python
# pipeline.py — raw HTML → clean terms: the index's front door (~25 lines)
import re
from html import unescape

STOP = {"the", "a", "an", "of", "and", "or", "to", "in", "on", "for", "is", "it"}

def terms(html_text):
    text = unescape(re.sub(r"<script.*?</script>|<style.*?</style>", " ",   # kill noise first
                           html_text, flags=re.S))
    text = re.sub(r"<[^>]+>", " ", text)                      # strip tags
    words = re.findall(r"[a-z0-9]+", text.lower())            # lowercase + tokenize
    return [stem(w) for w in words if w not in STOP and len(w) > 1]

def stem(w):
    for suf in ("ing", "ed", "es", "s"):
        if w.endswith(suf) and len(w) - len(suf) > 2: return w[: -len(suf)]
    return w

page = "<html><h1>Running Shoes</h1><p>The best shoes for running marathons!</p></html>"
print(terms(page))
# ['run', 'shoe', 'best', 'shoe', 'run', 'marathon']  ← what Chapter 4's index stores
```

Feed it Chapter 2's corpus and you have indexable documents. Note the decisions you
just made: case gone, plurals merged, stop-words dropped, numbers kept — a user
querying "SHOES" will now find this page. The pipeline *is* the search contract.

## What you now know

- Indexing stores **normalized terms**, and every normalization stage trades precision
  against recall — consciously.
- Stop-words are dropped for **size + non-discrimination**; stemming for **recall**
  across word forms.
- `<script>`/`<style>` must die before tokenization, or your index fills with JS.

Next: the machine this course is named for — flip the world from "document → words" to
"word → documents". The inverted index.
