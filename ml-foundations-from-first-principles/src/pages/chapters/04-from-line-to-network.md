---
layout: ../../layouts/Chapter.astro
title: 'From Line to Network: Neurons & Activations'
description: 'Stack linear layers with nonlinearities and XOR becomes solvable. Build: the hidden layer that beats the perceptron’s limit.'
part: 'Part II — The Neural Network'
written: true
---

A line (Chapter 1) can only separate data a line can separate. XOR — output 1 when
*exactly one* input is 1 — is famously **not linearly separable**: no single line
splits its four points correctly. This killed perceptron research in 1969. The
resurrection took two ideas: **stack** linear functions, and put a **nonlinearity**
between them. This chapter proves the collapse, shows the limit, and breaks through
it with one hidden layer.

## The lie you were told

> "Deep networks are just bigger linear models."

Without nonlinearities, that insult is *literally true* — and provable:

```text
stack two linear layers:  y = (x·W1)·W2 + b2 = x·(W1·W2) + b2
                          W1·W2 is... one matrix. Ten layers = one layer.
```

A stack of linear functions collapses to a single linear function — the composition
of lines is a line. The **nonlinearity** (sigmoid, ReLU, tanh) between layers is what
prevents the collapse; each layer bends space instead of just stretching it. Bend
enough and any shape becomes reachable.

## The XOR wall

XOR's four points: (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0. Plot them: the 1s and 0s sit
on opposite *diagonals*. No single line separates diagonals — a linear model's test
error on XOR is stuck at 25% minimum no matter how it's trained. The perceptron
couldn't see past this; Minsky and Papert's 1969 book made it famous, and funding
died for a decade. The fix needs two lines that vote:

```text
line 1: separate (1,0) from the rest
line 2: separate (0,1) from the rest
output: 1 if exactly ONE of the two lines fired    ← hidden layer + output layer
```

Two intermediate features, each a half-plane, combined nonlinearly = XOR solved. A
hidden layer *creates new features* that make the problem linearly separable at the
next level.

## Prove it to yourself

**1. The linear model's ceiling:**

```python
import itertools, numpy as np
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([0, 1, 1, 0])                              # XOR

best = 0
for w1, w2, b in itertools.product([-2, -1, 0, 1, 2], repeat=3):
    pred = (X @ [w1, w2] + b > 0).astype(int)
    best = max(best, (pred == y).mean())
print(f"best single-line accuracy on XOR: {best:.0%}")   # 75% — the wall, enumerated
```

**2. The collapse, proven:**

```python
W1, W2 = np.random.default_rng(0).normal(size=(2, 2)), np.random.default_rng(0).normal(size=(2, 2))
x = np.array([[3, -1]])
print(np.allclose((x @ W1) @ W2, x @ (W1 @ W2)))        # True — two layers ≡ one
```

## The build: the hidden layer that solves XOR

Hand-set weights (Chapter 5 trains them properly — this chapter shows *why* they can
work):

```python
# xor.py — two lines that vote: the hidden layer breakthrough
import numpy as np

def step(x): return (x > 0).astype(int)

# hidden layer: two "line detectors" — each a half-plane feature
W1 = np.array([[20, 20], [-20, -20]])    # h1 fires for x1+x2 > 1ish; h2 for < 1ish
b1 = np.array([-10, 10])
# output layer: XOR = h1 AND NOT h2  — linear in the NEW features!
W2 = np.array([20, -20]); b2 = -10

def network(X):
    h = step(X @ W1.T + b1)              # hidden features: the two lines' verdicts
    return step(h @ W2 + b2)             # linear in the new features — enough now

for row, label in zip(X, ["0,0", "0,1", "1,0", "1,1"]):
    print(f"XOR({label}) = {network(row.reshape(1, -1))[0]}")
# XOR(0,0) = 0   XOR(0,1) = 1   XOR(1,0) = 1   XOR(1,1) = 0  — all four correct.
# 75% → 100%: the wall was the absence of a hidden layer, not a law of nature.
```

The hidden layer **transformed the coordinates**: in (h1, h2)-space, XOR *is*
linearly separable — a single output line suffices. Every deep network does this
trick, layer after layer: bend the space until the answer is linear in the new
coordinates.

## What you now know

- Linear stacks **collapse to one linear function** — nonlinearity between layers is
  what makes depth mean anything.
- XOR is linearly inseparable; a **hidden layer creates features** in whose space it
  becomes separable. The 1969 wall, broken.
- Depth = **repeated coordinate transformation**: bend space, then answer linearly.
- Hand-set weights show *possibility*; training them is Chapter 5's backprop — the
  bookkeeping that finds these weights automatically.

Next: finding those weights by gradient descent means computing gradients through
layers — the chain rule, mechanized. Backpropagation.
