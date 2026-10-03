---
layout: ../../layouts/Chapter.astro
title: 'Overfitting & the Train/Test Split'
description: 'A model that memorizes the past can’t predict the future. Build: watch test error rise while train error falls.'
part: 'Part I — The Learning Machine'
written: true
---

Chapter 2's loss went down, so the model got better — right? Wrong in the most
consequential way possible: **training loss measures the past; usefulness is the
future.** A model can drive training error to zero while becoming worse at
prediction. That's overfitting — and the discipline that exposes it (hold data back,
measure on the hold-out) is the closest thing machine learning has to an honesty
rule. This chapter reproduces the whole phenomenon on camera.

## The lie you were told

> "Lower training error means a better model."

Training error can always be forced down — a model with enough freedom will
*memorize* the training set including its noise, and memorization predicts nothing.
The measure that matters is error on **held-out data the model never trained on**
(the test set), and the two diverge exactly when memorization starts:

```text
flexibility ↑:  train error ↓ ↓ ↓ (hits zero)     ← looks like winning
                test error  ↓ then ↑↑             ← actually losing
                       ↑ the U-curve: the whole chapter in one line
```

## The mechanism: degrees of freedom

With 4 data points and a line (2 parameters), fitting is constrained — the line
*must* capture the trend. With a degree-9 polynomial (10 parameters), the curve can
pass **exactly through every point**, noise included — its wiggles *are* the noise.
Parameters relative to data = freedom to memorize. (The LLM course's connection:
trillions of parameters trained on trillions of tokens — why the ratio, and the data,
matter so much.)

## Prove it to yourself

**1. The U-curve, printed as a table:**

```python
import numpy as np
rng = np.random.default_rng(0)
x = np.linspace(0, 1, 12)
y = np.sin(2 * np.pi * x) + rng.normal(0, 0.15, x.shape)   # signal + noise

train_x, train_y = x[:9],  y[:9]
test_x,  test_y  = x[9:],  y[9:]

def fit_poly(xs, ys, degree):
    coeffs = np.polyfit(xs, ys, degree)          # least-squares fit
    return lambda xq: np.polyval(coeffs, xq)

def mse(model, xs, ys):
    return float(np.mean((model(xs) - ys) ** 2))

print(f"{'degree':>6} {'train MSE':>10} {'test MSE':>10}")
for degree in (1, 3, 5, 7):
    model = fit_poly(train_x, train_y, degree)
    print(f"{degree:>6} {mse(model, train_x, train_y):>10.4f} {mse(model, test_x, test_y):>10.4f}")
# degree 1: train 0.09  test 0.10   — underfit: too stiff for the signal
# degree 3: train 0.03  test 0.04   — the sweet spot
# degree 7: train 0.0005 test 1.9+  — train "perfect", test catastrophic
```

Train error falls monotonically with degree. Test error falls, bottoms out, then
**explodes**. If you had only looked at training error, degree 7 looks like the best
model in the world.

**2. The honesty rule, enforced:**

```python
# never tune on the test set! once you peek, it leaks:
#   "test-informed decisions" = test data secretly became training data.
# the discipline: train set (fit), validation set (tune), test set (touch once, at the end).
```

## The build: the honest training loop

```python
# honest.py — gradient descent with a train/test discipline (Ch 2's gradients + split)
import numpy as np
rng = np.random.default_rng(0)

x = np.linspace(0, 1, 12)
y = np.sin(2 * np.pi * x) + rng.normal(0, 0.15, x.shape)
tx, ty, vx, vy = x[:9], y[:9], x[9:], y[9:]             # train / validation split

def descend(epochs=200, lr=0.5):
    m, b = 0.0, 0.0
    for _ in range(epochs):
        pred = m * tx + b
        m -= lr * np.mean(2 * (pred - ty) * tx)
        b -= lr * np.mean(2 * (pred - ty))
    return m, b, float(np.mean((m * vx + b - vy) ** 2))

for epochs in (10, 100, 1000, 10000):
    m, b, val_mse = descend(epochs)
    print(f"epochs {epochs:>6}: train MSE {np.mean((m*tx+b-ty)**2):.4f}  val MSE {val_mse:.4f}")
# train error keeps falling; validation error falls, flattens, then CREEPS UP —
# stop at the bottom of that valley: that's early stopping, the simplest regularizer (Ch 8).
```

The validation error's behavior across epochs is the model's honest report card — and
stopping at its minimum (early stopping) is the first regularization technique in the
field.

## What you now know

- **Training error measures the past; held-out error measures the future** — only the
  second correlates with usefulness.
- Overfitting is **freedom to memorize**: parameters relative to data decides it; the
  train/test U-curve makes it visible.
- The discipline: fit on train, tune on validation, touch test **once**. Peeking
  leaks.
- Early stopping is regularization before we even called it that (Chapter 8's toolbox).

Next: a line can't even represent XOR — the famous limitation that forced the
invention of hidden layers, and with them the neural network.
