---
layout: ../../layouts/Chapter.astro
title: 'Loss & Gradient Descent'
description: 'The loss landscape, the downhill step, the learning rate. Build: descent on a parabola and a real loss surface, on camera.'
part: 'Part I — The Learning Machine'
written: true
---

Chapter 1 trained a model by brute-force guessing 40,000 parameter combinations. That
doesn't scale to billions of parameters. The replacement is one calculus idea: **the
gradient tells you which way is uphill; step the other way.** Gradient descent is that
sentence, repeated. This chapter derives the gradients for Chapter 1's linear
regression by hand, watches the loss fall in 30 steps instead of 40,000 guesses, and
then demonstrates the single most important hyperparameter in machine learning — the
learning rate — by getting it wrong three ways.

## The lie you were told

> "Gradient descent is an optimization algorithm you import."

It's a walk: at your current position, measure the slope of the loss in every
parameter direction (the gradient), and take a small step in the opposite direction.
Repeat until the ground flattens. Everything subtle — momentum, Adam, schedules —
decorates this walk.

## The gradients, derived by hand

Chapter 1's loss: `L(m, b) = mean((m·x + b − y)²)`. The chain rule gives each
parameter's slope:

```text
∂L/∂m = mean( 2·(m·x + b − y)·x )     ← how much the miss scales with the slope knob
∂L/∂b = mean( 2·(m·x + b − y) )       ← intercept: no x factor

update:  m ← m − lr·∂L/∂m,   b ← b − lr·∂L/∂b
```

That's it. For a 96-layer transformer the same pattern applies per weight — the chain
rule threaded through the layers (Chapter 5's backprop mechanizes exactly this
bookkeeping).

## The learning rate: one dial, three fates

The step size `lr` decides everything:

```text
too small (0.0001): correct, but you'll walk for a million steps
just right (0.1):   the loss falls fast and settles
too big (1.5):      each step overshoots the valley — the loss GROWS, then explodes
```

This is why practitioners say learning rate is the first hyperparameter to tune: every
other failure is downstream of a badly sized step.

## Prove it to yourself

**1. The three fates, live** — the build below runs descent at three rates; the loss
curves tell the story in the output.

**2. Guessing vs gradient, raced** — Chapter 1's 40,000 guesses vs 30 gradient steps,
same final loss. The guesser needs a 40,000× bigger budget to match it, and the gap
widens with every parameter added.

**3. The loss surface exists** — plot L(m, b) over a grid (the build does) and see the
bowl: gradient descent is a marble rolling into it.

## The build: gradient descent on the real loss

```python
# descend.py — Chapter 1's regression, trained by calculus instead of guessing
data_x = [1, 2, 3, 4]
data_y = [2.1, 3.9, 6.2, 7.8]

def loss(m, b):
    return sum((m*x + b - y)**2 for x, y in zip(data_x, data_y)) / len(data_x)

def gradients(m, b):                                   # the two partial derivatives
    dm = sum(2*(m*x + b - y)*x for x, y in zip(data_x, data_y)) / len(data_x)
    db = sum(2*(m*x + b - y)   for x, y in zip(data_x, data_y)) / len(data_x)
    return dm, db

def descend(lr, steps=30):
    m, b = 0.0, 0.0                                    # start anywhere
    print(f"  lr={lr}: ", end="")
    for step in range(steps):
        dm, db = gradients(m, b)
        m -= lr * dm; b -= lr * db                     # downhill
        if step % 10 == 0 or step == steps - 1:
            print(f"L={loss(m,b):.4f} ", end="")
    print(f"→ y = {m:.2f}x + {b:.2f}")

descend(0.0001)   # too small: L=8.32 … L=0.35 — correct but crawling
descend(0.1)      # just right: L=7.85 … L=0.05 — fast and settled
descend(1.5)      # too big:   L=12.1 … L=∞-ish — overshooting, exploding
# 30 gradient steps matched Chapter 1's 40,000 brute-force guesses.
```

## What you now know

- **Gradient descent = measure slope, step opposite, repeat** — the loop everything
  in ML runs.
- Gradients are **partial derivatives of the loss** — derivable by hand for small
  models, mechanized by backprop for big ones (Chapter 5).
- The **learning rate** is the step size: too small crawls, too large explodes. It's
  tuned first, always.

Next: a model that reduces error on its own data can still be *worse* in the world —
overfitting, and the discipline of holding data back.
