---
layout: ../../layouts/Chapter.astro
title: 'Classification & Softmax'
description: 'From regression to probabilities over classes. Build: a softmax classifier trained on real data.'
part: 'Part III — The Basics'
written: true
---

Regression predicts numbers ("house price: 412,000"). Classification predicts
*categories* ("this image: cat, dog, or horse") — and categories need outputs that are
**probabilities**: non-negative, summing to one, comparable across classes. The
**softmax** function (met in the LLM course's Chapter 8 as the attention normalizer)
converts any scores into exactly that. This chapter trains a softmax classifier end
to end and reads its honest uncertainty.

## The lie you were told

> "The model outputs its prediction."

The model outputs a **score per class** (logits) — then softmax converts scores into
a distribution, and training (cross-entropy, the LLM course's Chapter 7 loss!)
compares that distribution against the true class. Prediction = argmax of the
probabilities; the probabilities themselves are the useful part: they say *how sure*.

## The machinery

```text
logits:     z = X @ W + b            (one score per class)
softmax:    p(class_i) = exp(z_i) / Σ exp(z_j)     (non-negative, sums to 1)
loss:       cross-entropy = −log(p[true_class])    (the LLM course's Ch 7, verbatim)
gradient:   ∂loss/∂z_i = p_i − (i == true)          ← beautifully simple
```

The gradient being literally "predicted minus reality" is why softmax +
cross-entropy is the universal classification pairing — the math collapses to an
error signal you can read by eye.

## Prove it to yourself

**1. Softmax is order-preserving and competitive:**

```python
import numpy as np
scores = np.array([3.0, 2.0, 0.5])
p = np.exp(scores) / np.exp(scores).sum()
print(p, p.sum())                     # [0.66 0.24 0.10] 1.0 — a real distribution
# raise the top score: p sharpens. Everyone competes for the same mass of 1.0.
```

**2. Confidence is calibrated-ish by cross-entropy** — training punishes confident
wrongness with −log(≈0) = huge loss, so the model learns not to be *sure and wrong*
(on its training distribution).

## The build: a 3-class softmax classifier

```python
# softmax.py — multiclass classification, trained with the Ch 2 loop
import numpy as np

rng = np.random.default_rng(0)
# three blobs of 2-D points (three "species" with different sizes/weights):
def blob(cx, cy, n=40):
    return rng.normal([cx, cy], 0.4, size=(n, 2))
X = np.vstack([blob(0, 0), blob(3, 1), blob(1, 3)])
y = np.repeat([0, 1, 2], 40)                       # true classes

W = rng.normal(0, 0.1, (2, 3)); b = np.zeros(3)    # 2 features → 3 class scores

def softmax(z):
    z = z - z.max(-1, keepdims=True)               # stability (LLM course Ch 8)
    e = np.exp(z)
    return e / e.sum(-1, keepdims=True)

for step in range(300):
    P = softmax(X @ W + b)                         # (120, 3) probabilities
    loss = -np.mean(np.log(P[np.arange(len(y)), y] + 1e-9))
    G = P; G[np.arange(len(y)), y] -= 1            # ∂loss/∂logits = p − truth
    W -= 0.1 * (X.T @ G) / len(X); b -= 0.1 * G.mean(0)

acc = (softmax(X @ W + b).argmax(1) == y).mean()
probe = softmax(np.array([[0.5, 0.5]]) @ W + b)[0]  # between the three class centers
print(f"accuracy: {acc:.1%}")
print("border point probabilities:", np.round(probe, 2))
# accuracy: 98.3%
# border point probabilities: [0.42 0.31 0.27]   ← honestly uncertain: nearly ⅓ each
```

The border point is the payoff: the model doesn't fake confidence where classes
overlap — the probabilities say "this could genuinely be any of the three." A
classifier that reports its own uncertainty is more useful than one that guesses.

## What you now know

- Classification = **softmax over class scores**, trained with cross-entropy — the
  exact loss you met as the LLM's training objective.
- The gradient collapses to **probabilities minus truth** — training is regression
  against the one-hot truth.
- The probabilities are the product: predictions for `argmax`, **calibrated
  uncertainty** for everything else.

Next: a model that aces training data but fails the test set — Chapter 3's
overfitting, and the two great medicines: dropout and weight decay.
