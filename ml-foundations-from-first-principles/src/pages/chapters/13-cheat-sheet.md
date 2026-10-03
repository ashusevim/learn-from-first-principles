---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Machine Learning on One Page'
description: 'Loss, gradients, backprop and training dynamics on one page — the model, the failure modes, and the fixes.'
part: 'Part IV — Practice & Reference'
written: true
---

The whole course is one loop: **predict, measure the error, follow the gradient
downhill**. The `Value` engine differentiates, the layers compose, and every
failure below is that loop misbehaving in a recognizable way.

## The one-page model

```text
  data → model(params) → loss (one number) → backward() → params -= lr * grad
  Ch 1      Ch 4           Ch 2                 Ch 5            Ch 2, 6
```

`MLP` is neurons all the way down (Chapter 4): each `Neuron` holds `Value`s,
every `Value` remembers how it was made, and `backward()` walks the graph
applying the chain rule (Chapter 5). The train/test split (Chapter 3) is the
only honest judge of whether the downhill walk learned or memorized.

## The ML you actually use

| Name | Meaning | Chapter |
|---|---|---|
| `Value(data, _op, _prev)` | a number plus its recipe — the autograd atom | 5, 12 |
| `loss` as one scalar | the single number the whole machine descends | 2 |
| `lr` (learning rate) | step size: too big diverges, too small crawls | 2, 6 |
| `backward()` | chain rule mechanized over the graph | 5 |
| `Neuron(n_in)` / `MLP` | weighted sum + nonlinearity, layered | 4, 12 |
| activation (tanh/ReLU/sigmoid) | the bend — without it, layers collapse to one line | 4 |
| batches + schedules | noisy cheap steps, annealed over epochs | 6 |
| softmax + cross-entropy | scores → probabilities → classification loss | 7 |
| dropout / weight decay | noise and shrinkage against memorization | 8 |
| convolution kernels | shared weights that see locally, everywhere | 9 |
| embeddings | meaning as position; attention as routing | 10 |
| the autograd contract | frameworks exist to run this loop faster | 11 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| `lr` an order too high | loss explodes or ping-pongs — divergence, not learning | Chapters 2, 6 |
| `lr` an order too low | the clock runs out before the valley | Chapter 6 |
| No nonlinearity anywhere | deep nets collapse to one linear map | Chapter 4 |
| Judging on the training set | memorization applauded as learning | Chapter 3 |
| Sigmoid stacks, deep | gradients vanish to zero before the early layers | Chapters 4–5 |
| Dropout left on at test time | predictions jitter — noise where answers belong | Chapter 8 |
| Full-batch on huge data | each step costs an epoch; the walk stalls | Chapter 6 |
| Forgetting `zero_grad`-equivalents | gradients accumulate across steps — phantom momentum | Chapters 5–6 |
| Convolutions as dense layers | parameters explode; translation structure ignored | Chapter 9 |
| Attention without position | order evaporates — sets, not sequences | Chapter 10 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| A first model | one neuron, MSE, tiny `lr` — watch it descend | it must classify — softmax + cross-entropy (Ch 7) |
| Faster convergence | batches + schedule + momentum-ish averaging | the data is tiny — full batch is exact (Ch 6) |
| Generalization proof | a held-out split, never touched in training | data is scarce — cross-validate (Ch 3) |
| Deeper nets that train | ReLU + sane init + normalization habits | shallow suffices — depth is a cost (Ch 4–5) |
| Spatial data | convolutions, shared kernels | no locality — dense layers (Ch 9) |
| Sequences with order | embeddings + positional signal + attention | order-free bags — embeddings alone (Ch 10) |

## Prove it to yourself

**1. The gradient is a slope you can check:**

```python
v = Value(3.0); loss = (v * v)      # d(loss)/dv at 3 is 6 — by hand
loss.backward()
print(round(v.grad, 6))             # 6.0: the machine agrees with calculus
```

**2. No bend, no depth:**

```python
m1, m2 = MLP(2, [4, 1], act=None), MLP(2, [4, 1], act="tanh")
print(m1.loss(X) > m2.loss(X))      # the linear stack cannot bend to the data
```

**3. Memorization applauded:**

```python
print(train_loss(m), test_loss(m))  # 0.001 vs 0.4 — the gap IS Chapter 3
```

## What you now know

- **Learning is downhill walking on a scalar field**, and every hyperparameter
  is about the stride (Ch 2, 6).
- **Backprop is bookkeeping**, not intelligence: store the recipe, apply the
  chain rule, spend the gradients (Ch 5).
- **Generalization is measured, never assumed:** the split is the only honest
  instrument in the building (Ch 3).
- Architectures are inductive biases with good marketing — match the bias to
  the data's shape (Ch 9–10).

Next: twelve labs that break the loop instructively — starve it, flood it, and
watch the loss curves confess.
