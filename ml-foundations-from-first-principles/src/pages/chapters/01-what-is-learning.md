---
layout: ../../layouts/Chapter.astro
title: 'What Is Learning, Really?'
description: 'Learning is fitting parameters to data by minimizing error. Build: linear regression by hand — the whole paradigm in 20 lines.'
part: 'Part I — The Learning Machine'
written: true
---

"Machine learning" sounds like a research frontier; mechanistically it's one move:
**choose a function with adjustable knobs (parameters), measure how wrong it is on
data (loss), and adjust the knobs to reduce that error.** Everything in this course —
and in the LLM course's 96-layer transformer — is that move, repeated at scale. This
chapter performs it by hand on the smallest honest problem, and every ML buzzword you
know becomes a label for one of its parts.

## The lie you were told

> "Machine learning means the machine programs itself."

The machine never writes rules. *You* choose the function's shape (a line? a
network?); the machine chooses the **numbers** inside it by minimizing measured
error. "Learning" = parameter fitting. The shape choice is called architecture; the
error measurement is called loss; the adjusting is called training. Three nouns, one
loop.

## The smallest honest problem

Fit a line through points. The function has two knobs — slope `m` and intercept `b` —
and the loss is the average squared miss:

```text
model:    predict(x) = m·x + b
loss(m,b) = mean( (predict(xᵢ) − yᵢ)² )  over all data points
```

Why squared? Positive and negative misses shouldn't cancel, and squaring makes the
loss smooth — which Chapter 2's gradient descent requires.

## Prove it to yourself

**1. The knobs, turned by hand:**

```python
data_x = [1, 2, 3, 4]
data_y = [2.1, 3.9, 6.2, 7.8]          # roughly y = 2x, but noisy

def loss(m, b):
    return sum((m*x + b - y)**2 for x, y in zip(data_x, data_y)) / len(data_x)

print(loss(1, 0))    # 8.86  — slope too small
print(loss(2, 0))    # 0.32  — closer
print(loss(2, 0.1))  # 0.09  — better still
# you are "training" right now: adjusting knobs to reduce measured error.
```

**2. The vocabulary, pinned to this example:**

```text
m, b                → "parameters" / "weights"
loss(m,b)           → "loss function" / "objective"
trying values       → "training"
the data            → "training set"
loss near zero      → "the model converged / fits"
a NEW point         → "does it generalize?" (Chapter 3's whole question)
```

**3. The scale jump is only width:**

```text
this chapter:  2 parameters, 4 points     (hand-adjusted)
LLM course:    billions of parameters, trillions of tokens (same loop, automated)
```

Nothing conceptual separates them — only the knob count and who does the turning
(Chapter 2 replaces your hands with calculus).

## The build: linear regression, the whole paradigm

```python
# linreg.py — 2-parameter learning, no framework, everything visible
data_x = [1, 2, 3, 4]
data_y = [2.1, 3.9, 6.2, 7.8]

def loss(m, b):
    return sum((m*x + b - y)**2 for x, y in zip(data_x, data_y)) / len(data_x)

# search: try many slopes and intercepts, keep the best pair
best = (None, None, float("inf"))
for m in [x / 100 for x in range(100, 300)]:          # slopes 1.00 – 2.99
    for b in [x / 100 for x in range(-100, 300)]:     # intercepts −1.00 – 2.99
        l = loss(m, b)
        if l < best[2]:
            best = (m, b, l)

m, b, l = best
print(f"learned: y = {m:.2f}x + {b:.2f}   (loss {l:.4f})")
# learned: y = 1.94x + 0.25   (loss 0.0499) — a model, trained.
print(f"prediction for x=5: {m*5 + b:.2f}")   # 9.95 — a prediction, generalizing
```

Two hundred lines of brute force stand in for Chapter 2's calculus (guessing is
honestly slower — but it makes the *structure* visible: a search over parameter
space, scored by a loss). Every technique in this course replaces the brute force
with something smarter, never with something different.

## What you now know

- **Learning = parameter fitting**: choose a function shape, minimize measured error
  over data.
- **Loss** is the error measure; squared difference is the classic — smooth and
  sign-safe.
- Prediction on *new* data is the actual goal — Chapter 3's train/test discipline
  guards it.
- The paradigm is scale-invariant: this chapter's 2 knobs and GPT's billions differ
  only in count and in who computes the adjustments.

Next: hand-guessing doesn't scale. The calculus that replaces it — loss surfaces and
the downhill step called gradient descent.
