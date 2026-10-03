---
layout: ../../layouts/Chapter.astro
title: 'Attention: The Core Idea'
description: 'Every token asks “who should I look at?” — queries, keys, values, softmax. Build: self-attention in ~20 lines of NumPy.'
part: 'Part II — The Transformer'
written: true
---

Chapter 3 gave each token a fixed vector — but "bank" means river or money depending
on its *neighbors*, so a single static vector can't be right. **Attention** is the
fix, and the idea is one sentence: *every token looks at every other token, decides
how much each matters, and replaces itself with a weighted average of what it saw.*
The 2017 paper's title — "Attention Is All You Need" — was a claim that this one
mechanism, stacked, could replace everything else. This chapter builds it in ~20
lines of NumPy.

## The lie you were told

> "Attention lets the model 'understand context' in some cognitive sense."

Mechanically it's a **weighted average with computed weights**:

```text
for each token position:
  1. QUERY (q): what am I looking for?        (my embedding × a learned matrix)
  2. KEY (k):   what do I offer?              (other embeddings × learned matrix)
  3. score = q · k for every other token      ← dot product = relevance
  4. weights = softmax(scores)                ← normalize to a probability
  5. my new embedding = Σ weights × value(v)  ← weighted average of VALUES
```

Three learned matrices — Q, K, V — and one softmax. "Attention" is the metaphor;
**matrix multiplication and a softmax** are the implementation.

## The shapes tell the story

```text
X: (T, d)           T tokens, d-dimensional embeddings
Q = X @ Wq: (T, d)  each token has a query
K = X @ Wk: (T, d)  each token has a key
V = X @ Wv: (T, d)  each token has a value

scores = Q @ K.T : (T, T)   ← EVERY token scored against EVERY token (the "attention map")
weights = softmax(scores, axis=-1)
output = weights @ V : (T, d)   ← each token = weighted mix of all values
```

The (T, T) attention map is the interpretable artifact: row i shows where token i
looked. In trained models, some heads learn to look at the previous token, some at
verbs, some at matching quotes.

## Prove it to yourself

**1. Disambiguation, witnessed** — the "bank" problem:

```python
# tokens: ["river", "bank", "muddy"]  — "bank" attends to "river" (weight high),
# so its output vector shifts toward the RIVER meaning.
# tokens: ["money", "bank", "robbery"] — same input word "bank", different neighbors,
# different attention weights, different output. One embedding in, context-aware out.
```

The static embedding from Chapter 3 was frozen; attention makes the representation
*dynamic per sentence*. That's the entire revolution.

**2. The softmax is the selectivity dial** — weights always sum to 1, so attention
redistributes focus rather than adding information. Sharp softmax = "look mainly
there"; flat softmax = "average everything".

## The build: self-attention in NumPy

```python
# attention.py — the core mechanism, ~20 lines
import numpy as np

rng = np.random.default_rng(0)
T, d = 4, 8                                    # 4 tokens, 8-dim embeddings
X = rng.normal(size=(T, d))                    # (in a real model: from the embedding table)

Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))   # learned matrices
Q, K, V = X @ Wq, X @ Wk, X @ Wv

scores = Q @ K.T / np.sqrt(d)                  # scaled dot products: (T, T)
weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)  # softmax rows
out = weights @ V                              # each token = weighted mix of values

np.set_printoptions(precision=2, suppress=True)
print("attention weights (rows sum to 1):")
print(weights)
# each row = one token's focus distribution over all tokens — the attention map.
# row 0 can only attend to position 0 (it's first); later rows look anywhere.
```

Two details worth their weight:

- **Scaling by √d**: dot products of d-dimensional vectors have variance ~d; without
  the divide, softmax saturates to one-hot and gradients die. The √d keeps the
  softmax in its working range.
- **The first row always attends to itself** — nothing earlier exists to look at. For
  *generation* we also want to forbid looking *ahead*: the causal mask (Chapter 5's
  build).

## What you now know

- Attention = **computed weighted average**: Q·K decides relevance, softmax
  normalizes, V carries content. Three learned matrices, one softmax.
- The (T, T) **attention map** is inspectable — rows show where each token looked.
- Output vectors are **context-dependent**: the same word, different neighbors,
  different representation. Chapter 3's static embeddings, made dynamic.
- Scaling by √d keeps gradients alive — a detail with a stability story.

Next: one attention "eye" isn't enough — multiple heads specialize, and generation
needs a causal mask plus positional information. The full attention block.
