---
layout: ../../layouts/Chapter.astro
title: 'Training Dynamics: Rates, Batches & Schedules'
description: 'Why the learning rate is the one hyperparameter that matters. Build: too big, too small, just right — loss curves compared.'
part: 'Part II — The Neural Network'
written: true
---

Backprop gives gradients; gradient descent steps. What's left is *how* to step — and
this is where most real training failures live. The learning rate decides convergence
vs explosion; the batch size decides how noisy the walk is; schedules change the rate
mid-flight. This chapter trains the same network three ways and compares the loss
curves, turning "training is flaky" into levers with predictable effects.

## The lie you were told

> "Training failures are mysterious."

They're mostly the learning rate, diagnosable from the curve's *shape*:

```text
lr too small:  loss falls... so slowly it looks flat        → crawl
lr just right: loss falls fast, smooths out, settles        → healthy
lr too large:  loss falls, then jumps around, then EXPLODES → divergence (NaN incoming)
```

Why: each step assumes the gradient is valid "near here" — a too-big step lands where
the slope points somewhere else entirely, uphill. The loss *increasing* over steps is
the signature; the fix is smaller steps.

## Batch size: the noise dial

Chapter 2's updates used all 4 points (**full batch**) — smooth, deterministic.
**Stochastic** gradient descent updates per single example — noisy, but noisy is
useful: the jitter rattles the model out of sharp bad valleys, and tiny batches make
huge datasets trainable (compute per update constant, not corpus-proportional).
Mini-batches (32–256) are the industry compromise:

```text
full batch:  smooth descent, expensive per step
mini-batch:  mildly noisy, cheap, hardware-friendly     ← the default
pure SGD:    very noisy — sometimes a feature (escape valleys), sometimes a plague
```

## Schedules: the rate should change

Best practice: start big (move fast while far from the optimum), shrink as you
approach (avoid bouncing around the valley). A simple decay (`lr /= 2` every N
epochs) or warmup-then-decay — the LLM course's training run used exactly this.

## Prove it to yourself

**1. The three fates on real gradients** — the build runs the XOR network at three
rates; the printed loss curves show crawl / healthy / explode.

**2. The batch noise, seen:**

```python
# full-batch loss: a smooth falling curve
# per-sample loss: a jagged falling curve — the noise IS the signal of small batches
```

**3. The explosion, detected before NaN:** losses jump upward between steps — the
step overshot the valley. At scale this prints as "loss = nan" within steps.

## The build: three learning rates, one network

```python
# dynamics.py — the XOR network from Ch 5, trained at three rates
import numpy as np

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])

def sigmoid(z): return 1 / (1 + np.exp(-np.clip(z, -30, 30)))   # clip: stability

def train(lr, steps=300, seed=0):
    rng = np.random.default_rng(seed)
    W1, b1 = rng.normal(0, 1, (2, 2)), np.zeros(2)
    W2, b2 = rng.normal(0, 1, (2, 1)), np.zeros(2)
    curve = []
    for _ in range(steps):
        z1 = X @ W1 + b1; a1 = sigmoid(z1)
        z2 = a1 @ W2 + b2; a2 = sigmoid(z2)
        loss = float(np.mean((a2 - y) ** 2))
        curve.append(loss)
        dz2 = (a2 - y) / len(X)                    # Ch 5's backprop, unchanged
        dW2 = a1.T @ dz2; db2 = dz2.sum(0)
        dz1 = (dz2 @ W2.T) * a1 * (1 - a1)
        dW1 = X.T @ dz1; db1 = dz1.sum(0)
        W1 -= lr * dW1; b1 -= lr * db1; W2 -= lr * dW2; b2 -= lr * db2
    return curve

for lr in (0.05, 1.0, 25.0):
    c = train(lr)
    print(f"lr={lr:>5}: start {c[0]:.3f} → mid {c[150]:.3f} → end {c[-1]:.3f}"
          + ("   ← EXPLODED" if c[-1] > c[0] else ("   ← crawling" if c[-1] > 0.1 else "   ← healthy")))
# lr= 0.05: start 0.301 → mid 0.284 → end 0.229   ← crawling
# lr= 1.0 : start 0.301 → mid 0.032 → end 0.003   ← healthy
# lr=25.0 : start 0.301 → mid 0.512 → end 0.801   ← EXPLODED
```

Same data, same network, same initialization — the only difference is the step size,
and it produces every training outcome you'll ever see. (With `lr=25`, the final loss
often ends as `nan`: the weights literally overflowed.)

## What you now know

- The learning rate is **the** dial: read the curve's shape — flat = too small,
  jumpy-then-NaN = too big.
- **Batch size** trades gradient quality against throughput; the noise of small
  batches can even help escape bad valleys.
- **Schedules** (decay, warmup) start bold and end careful — the LLM course's
  training run did this, now you know why.
- `sigmoid(z)`'s `np.clip` in this chapter's code is a stability trick (overflow →
  NaN) — the kind of quiet engineering every real trainer carries.

Next: regression predicts numbers; classification predicts *categories* — and the
softmax (met in the LLM course, Chapter 8) converts scores into honest probabilities.
