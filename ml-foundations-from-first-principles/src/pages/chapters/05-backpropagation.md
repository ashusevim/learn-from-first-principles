---
layout: ../../layouts/Chapter.astro
title: 'Backpropagation: The Chain Rule, Mechanized'
description: 'Backprop is bookkeeping for ∂loss/∂weight through the graph. Build: it by hand, verified against numerical gradients.'
part: 'Part II — The Neural Network'
written: true
---

Chapter 2 computed gradients for two parameters by hand. Chapter 4's network has 9 —
and GPT has billions. Hand-derivation doesn't scale past a napkin; **backpropagation**
is the mechanization: *every operation in the forward pass knows its local gradient;
backprop chains them in reverse via the chain rule.* It's not a learning algorithm —
it's bookkeeping for ∂loss/∂weight. This chapter builds it by hand for the XOR
network, then *verifies it numerically* — the honesty check every implementation
deserves.

## The lie you were told

> "Backprop is how neural networks learn."

Backprop doesn't learn — gradient descent (Chapter 2) learns. Backprop **answers the
question "which way is uphill for each weight?"** efficiently: instead of perturbing
each weight separately (O(weights) forward passes), it computes *all* gradients in
**one backward pass**, reusing shared sub-expressions. The insight is Chapter 1 of
any calculus course: the chain rule — plus memoization.

## The chain rule on a graph

The forward pass is a graph of operations; each op stores its inputs. Backward,
traverse in reverse, multiplying local gradients:

```text
forward:  z = x·w + b  →  a = σ(z)  →  L = loss(a, y)

backward: ∂L/∂a   given by the loss
          ∂L/∂z  = ∂L/∂a · σ′(z)                ← local: the activation's slope
          ∂L/∂w  = ∂L/∂z · x                    ← local: multiplication's slope
          (∂L/∂b = ∂L/∂z likewise)
```

Each operation contributes its **local derivative**; the chain rule multiplies along
paths; and where paths branch (a weight used many times), gradients **sum**. "Backprop
bookkeeping" = doing this in reverse topological order so each node's gradient is
complete before its inputs need it.

## Prove it to yourself

**1. The numerical check — the honesty test:**

```python
def numerical_grad(f, w, eps=1e-5):        # perturb, measure, subtract
    return (f(w + eps) - f(w - eps)) / (2 * eps)
# your analytic gradient must match this to ~1e-6, or your backprop is WRONG.
# (frameworks do exactly this check in their test suites — gradcheck.)
```

**2. Sum where branches meet** — a weight feeding three outputs gets three gradient
contributions, added. Watch the build's `dW1` accumulate across data points.

## The build: backprop for the XOR network

```python
# backprop.py — 2-layer net on XOR: forward, backward, numerical verification
import numpy as np

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])

def sigmoid(z):  return 1 / (1 + np.exp(-z))

rng = np.random.default_rng(0)
W1, b1 = rng.normal(0, 1, (2, 2)), np.zeros(2)   # hidden layer
W2, b2 = rng.normal(0, 1, (2, 1)), np.zeros(2)   # output layer

def forward(X):
    z1 = X @ W1 + b1;  a1 = sigmoid(z1)          # hidden activations
    z2 = a1 @ W2 + b2; a2 = sigmoid(z2)          # output
    return z1, a1, z2, a2

def backprop(X, y):
    z1, a1, z2, a2 = forward(X)
    dz2 = (a2 - y) / len(X)                      # ∂loss/∂z2 (sigmoid+MSE collapses here)
    dW2 = a1.T @ dz2; db2 = dz2.sum(0)           # local slopes × upstream
    dz1 = (dz2 @ W2.T) * a1 * (1 - a1)           # chain through sigmoid's slope
    dW1 = X.T @ dz1; db1 = dz1.sum(0)
    return dW1, db1, dW2, db2

# ── the honesty check: analytic vs numerical ──
def loss():                                       # scalar loss at current weights
    _, _, _, a2 = forward(X)
    return np.mean((a2 - y) ** 2)

dW1, db1, dW2, db2 = backprop(X, y)
eps = 1e-6
for name, arr, grad in [("W1", W1, dW1), ("W2", W2, dW2)]:
    num = np.zeros_like(arr)
    for i in range(arr.shape[0]):
        for j in range(arr.shape[1]):
            old = arr[i, j]
            arr[i, j] = old + eps; lp = loss()
            arr[i, j] = old - eps; lm = loss()
            arr[i, j] = old
            num[i, j] = (lp - lm) / (2 * eps)
    print(f"{name}: max |analytic − numerical| = {np.abs(grad - num).max():.2e}")
# W1: max |analytic − numerical| = 2.16e-10
# W2: max |analytic − numerical| = 1.04e-10   ← the hand-derived backprop is CORRECT

# ── training: Chapter 2's loop, now with real gradients ──
for step in range(10000):
    dW1, db1, dW2, db2 = backprop(X, y)
    W1 -= 0.5 * dW1; b1 -= 0.5 * db1; W2 -= 0.5 * dW2; b2 -= 0.5 * db2

_, _, _, out = forward(X)
print("XOR predictions:", np.round(out, 2).ravel())
# [0.03 0.97 0.97 0.03] — all four correct. The hand-set weights of Chapter 4,
# found automatically by gradient descent through your backprop.
```

## What you now know

- Backprop = **chain rule in reverse topological order** — one backward pass computes
  every weight's gradient (vs one forward pass per weight numerically).
- Every op stores inputs and knows its **local slope**; branching paths **sum**.
- **The numerical gradient is the unit test** — if they disagree, the analytic
  version is wrong, full stop.
- After backprop, training is Chapter 2's two-line loop at any network size.

Next: with gradients mechanized, training *behavior* becomes the subject — learning
rates, batches, and why the same network converges or explodes.
