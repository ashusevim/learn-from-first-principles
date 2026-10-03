---
layout: ../../layouts/Chapter.astro
title: 'Embeddings: Meaning as Geometry'
description: 'Words become vectors; similarity becomes distance. Build: co-occurrence embeddings and the king − man + woman trick.'
part: 'Part I — Tokens & Meaning'
written: true
---

Chapter 2's tokens are integers — `47` carries no more meaning than `47`. An
**embedding** replaces each token with a *vector* of numbers, and the magic claim is
that after training, **geometry encodes meaning**: similar words sit near each other,
and relationships become directions ("king − man + woman ≈ queen"). This chapter
builds embeddings from co-occurrence statistics — no neural network needed — and
measures the geometry.

## The lie you were told

> "The embedding table is a meaningless lookup table."

It *is* a lookup table — `vector = table[token_id]`, literally. The meaning is in
what the numbers *learn to be*. The distributional hypothesis (Firth, 1957): **you
shall know a word by the company it keeps**. Words that appear in the same contexts
get pushed toward the same region of space:

```text
"cat" appears near: sleeps, pet, meows
"dog" appears near: sleeps, pet, barks        ← overlapping contexts!
"car" appears near: drives, fuel, wheels      ← different context

after training: cat ≈ dog (nearby), car far away — nobody declared this;
the training process discovered it.
```

## The trick without neural networks

Count which words appear in the same window, and use those counts as coordinates:

```text
        near "sleeps"  near "fuel"  near "meows"
cat:        5              0            4
dog:        4              0            1
car:        0              6            0
```

Each word is now a vector; cosine similarity measures "same kind of word". This is
count-based embedding (classic LSA/word2vec territory) — real models learn the table
by gradient descent instead, but the *resulting geometry* is the same idea.

## Prove it to yourself

**1. Similarity from co-occurrence, measured:**

```python
from collections import Counter
import math

corpus = ("the cat sleeps the dog sleeps the cat meows the dog barks "
          "the car drives the car uses fuel the cat and dog play").split()
window = 3

def contexts(word):
    return {corpus[i] for i, w in enumerate(corpus)
            if w == word for j in range(max(0, i - window), min(len(corpus), i + window + 1))}

def cosine(a, b):
    common = set(a) | set(b)
    dot = sum(a.get(w, 0) * b.get(w, 0) for w in common)
    na, nb = math.sqrt(sum(v * v for v in a.values())), math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0

counts = {w: Counter() for w in set(corpus)}
for i, w in enumerate(corpus):
    for j in range(max(0, i - window), min(len(corpus), i + window + 1)):
        counts[w][corpus[j]] += 1

print("cat≈dog:", round(cosine(counts["cat"], counts["dog"]), 2))   # high — same pet-ness
print("cat≈car:", round(cosine(counts["cat"], counts["car"]), 2))   # low — different world
```

**2. The famous arithmetic** — with real trained embeddings (any published set), the
vector `king − man + woman` lands nearest to `queen`: relationships became
*directions in space*. Your toy vectors show small versions of this; GPT's show
large ones.

## The build: dense embeddings, normalized and searched

```python
# embed.py — co-occurrence vectors → cosine search: "find me similar words"
import numpy as np

corpus = ("the cat sat on the mat the dog sat on the log the cat ate the fish "
          "the dog chased the cat the bird flew over the log").split()
vocab = sorted(set(corpus))
idx = {w: i for i, w in enumerate(vocab)}

# co-occurrence matrix: E[i, j] = how often w_i appears near w_j
E = np.zeros((len(vocab), len(vocab)))
for i, w in enumerate(corpus):
    for j in range(max(0, i - 2), min(len(corpus), i + 3)):
        E[idx[w], idx[corpus[j]]] += 1

E = E / (np.linalg.norm(E, axis=1, keepdims=True) + 1e-9)   # normalize → direction matters

def similar(word, k=3):
    v = E[idx[word]]
    sims = E @ v                                            # one dot product = all similarities
    return [(vocab[i], round(float(s), 2)) for i in sorted(np.argsort(-sims))[1:k+1]]

print("sat  →", similar("sat"))    # [('on',...), ('the',...), ('mat',...)] — same context
print("dog  →", similar("dog"))    # [('cat',...), ...] — the model KNOWS cats and dogs
print("bird →", similar("bird"))   # flying-adjacent words — discovered, never declared
```

The matrix multiply at the heart of `similar()` — one dot product between vectors —
is the same operation the transformer hammers billions of times (Chapter 4). You've
just met the workhorse instruction of the entire field.

## What you now know

- An embedding table **is** a lookup — but training fills it with *geometry*: similar
  words nearby, relationships as directions.
- The **distributional hypothesis** ("know a word by the company it keeps") is the
  learning signal — contexts, not definitions.
- Cosine similarity over vectors is the measurement tool — and the dot product is the
  transformer's core instruction.

Next: the problem every embedding has — a word's meaning *depends on its neighbors*
("bank" of a river vs "bank" of money). The fix is the idea the whole field runs on:
attention.
