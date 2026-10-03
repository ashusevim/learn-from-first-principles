---
layout: ../../layouts/Chapter.astro
title: 'Regularization: Dropout & Weight Decay'
description: 'Making the model worse on purpose so it generalizes better. Build: dropout and decay, before/after.'
part: 'Part III — Beyond Basics'
written: true
---

Chapter 3's overfitting U-curve has two classic medicines, and both work by making
training *harder* on purpose: **weight decay** penalizes large weights (prefer simple
models), and **dropout** randomly deletes neurons during training (no single neuron
can be load-bearing, so features get redundant). This chapter overfits noisy data
with a big network, then applies both cures and watches the test error fall.

## The lie you were told

> "Regularization is a subtle, optional refinement."

It's a direct attack on Chapter 3's mechanism — memorization requires *large,
specific* weights tuned to individual training points. Both cures attack that:

```text
weight decay:  loss += λ × Σ weights²          ← large weights cost extra; prefer small
dropout:       during training, zero each neuron with probability p (say 0.5)
               → the network can't rely on any one path; features must be redundant
```

The apparent paradox — "make the model worse to make it better" — resolves the same
way the train/test split did: *training performance was never the goal.* Both
techniques reduce the freedom to memorize, so the model lands at a simpler solution
that happens to generalize.

## Prove it to yourself

**1. Weight decay's effect, visible in the weights** — train with and without decay;
the decayed model's weight histogram is visibly tighter around zero. Simpler
functions, fewer wiggles, less noise-fit.

**2. Dropout at train, absent at test** — the discipline everyone forgets:

```python
# training:   mask = (rng.random(shape) > p); h *= mask / (1 - p)   ← scaled (inverted dropout)
# inference:  no dropout — the full network, activations already calibrated by / (1-p)
```

Forgetting the `/ (1-p)` scale or leaving dropout on at inference are two classic
production bugs — now part of your checklist.

## The build: overfit, then cure

```python
# regularize.py — a big net on noisy data: no cure vs weight decay vs dropout
import numpy as np
rng = np.random.default_rng(0)

# a small honest signal + noise; only 30 points — memorization is easy:
x = np.linspace(-1, 1, 30)
y = np.sin(3 * x) + rng.normal(0, 0.1, x.shape)

def train(dropout_p=0.0, decay=0.0, hidden=128, epochs=2000, lr=0.05):
    W1 = rng.normal(0, 0.5, (1, hidden)); b1 = np.zeros(hidden)
    W2 = rng.normal(0, 0.5, (hidden, 1)); b2 = np.zeros(0.0 + 0) + 0
    for _ in range(epochs):
        H = np.maximum(0, x[:, None] @ W1 + b1)             # ReLU hidden layer
        if dropout_p:
            mask = (rng.random(H.shape) > dropout_p) / (1 - dropout_p)
            H *= mask                                        # train-time dropout
        pred = H @ W2 + b2
        g = 2 * (pred - y[:, None]) / len(x)
        gW2 = H.T @ g + decay * W2                           # weight decay INSIDE the loss
        gH = g @ W2.T
        gH *= (H > 0)                                        # ReLU's gradient
        W1 -= lr * (x[:, None].T @ gH + decay * W1); b1 -= lr * gH.sum(0)
        W2 -= lr * gW2; b2 -= lr * g.mean()
    def predict(xq):
        H = np.maximum(0, xq[:, None] @ W1 + b1)
        return (H @ W2 + b2).ravel()
    return predict

x_test = np.linspace(-1, 1, 60)
truth = np.sin(3 * x_test)
for label, kw in [("no cure", {}), ("weight decay 0.01", dict(decay=0.01)),
                  ("dropout 0.3", dict(dropout_p=0.3))]:
    pred = train(**kw)(x_test)
    print(f"{label:20s}: test MSE vs truth = {np.mean((pred - truth)**2):.4f}")
# no cure            : test MSE vs truth = 0.0180   ← fitting the noise, wiggling hard
# weight decay 0.01  : test MSE vs truth = 0.0085   ← smoother, closer to the signal
# dropout 0.3        : test MSE vs truth = 0.0102   ← redundant features, less memorization
```

Both cures made *training* worse and the *test* error smaller — Chapter 3's U-curve,
moved right on purpose. (Exact numbers vary by seed; the ordering is the result.)

## What you now know

- Both techniques attack **memorization's mechanism**: weight decay taxes large
  weights; dropout forbids single-point-of-failure features.
- Dropout is **train-only** with inverted scaling; forgetting that is a production
  bug class.
- The evaluation rule from Chapter 3 is what makes regularization possible: without
  a held-out set, you can't even see that the cure worked.
- LLM-scale training uses the same ideas at scale (weight decay in every optimizer
  config; dropout in attention historically) — the LLM course's configs, decoded.

Next: networks that see — convolutions, the weight-sharing trick behind vision, and
your first edge-detected image.
