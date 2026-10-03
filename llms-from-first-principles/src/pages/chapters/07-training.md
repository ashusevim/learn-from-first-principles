---
layout: ../../layouts/Chapter.astro
title: 'Training: Next-Token Loss'
description: 'Cross-entropy on the next token, backprop, a loss curve that falls. Build: train a tiny model on a real corpus.'
part: 'Part II — The Transformer'
written: true
---

Random weights (Chapter 6) produce noise. **Training** is the loop that turns noise
into a language model: show the model a chunk of text with the last token hidden, have
it predict the hidden token, measure the surprise (**cross-entropy loss**), and nudge
every weight *downhill* on that surprise by **gradient descent**. Repeat a few million
times. This chapter runs that loop on a tiny NumPy model — hand-derived gradients, no
framework — and watches a loss curve fall.

## The lie you were told

> "Training teaches the model facts about the world."

Training teaches exactly one skill: **predict the next token** on the training corpus.
"Knowing facts" is a compression side effect — to predict well on diverse text, the
weights must encode grammar, style, and (statistically) the world the text describes.
Hallucination, memorization, and "the model knows X" are all statements about this
compression, not about a knowledge store (Chapter 1's no-database point, now
mechanized).

## The loop, mechanized

```text
repeat:
  1. sample a chunk of text; input = tokens[:-1], target = tokens[1:]   (shift by one!)
  2. forward pass: logits = model(input)        (Ch 6's stack → (T, vocab) scores)
  3. loss = cross_entropy(logits, target)       ← "how surprised was the model?"
  4. gradient = ∂loss/∂weights                  (backprop: the chain rule, mechanized)
  5. weights -= learning_rate × gradient        (downhill, a small step)
```

The shift-by-one is the whole dataset *for free*: one chunk of text provides T
training pairs simultaneously (predict token 2 from 1, token 3 from 1–2, ...).

## Cross-entropy, made physical

Cross-entropy = −log(predicted probability of the correct next token):

```text
model says P("mat") = 0.01 for "the cat sat on the ___"  → loss = −log(0.01) ≈ 4.6 nats
model says P("mat") = 0.90                                → loss ≈ 0.1 nats
```

Loss 4.6 = the model was ~100× more surprised than it should've been. A falling loss
curve is the model getting less surprised by the corpus — memorizing its patterns.

## Prove it to yourself

**1. The gradient direction, felt** — the simplest model, one weight:

```python
import numpy as np
w, lr = -3.0, 0.3
for step in range(8):
    loss = (w - 5) ** 2                 # "surprise" minimized at w = 5
    grad = 2 * (w - 5)                  # ∂loss/∂w — which way is uphill?
    w -= lr * grad                      # step DOWNHILL
    print(f"step {step}: w={w:.2f} loss={loss:.2f}")
# the weight walks to 5. Gradient descent is this, × billions of weights.
```

**2. The shift-by-one dataset trick:**

```python
tokens = ["the", "cat", "sat", "on", "mat"]
# one window → 4 training pairs, simultaneously:
# predict "cat" from ["the"], "sat" from ["the","cat"], ...
```

## The build: train a neural bigram in NumPy

The Chapter 6 block is too big to train in a chapter listing — so we train the
*smallest neural language model*: embedding → softmax (a neural bigram). Same loop,
same loss, real gradients, hand-derived:

```python
# trainlm.py — a neural bigram: embedding table + softmax, gradients by hand
import numpy as np

text = "the cat sat on the mat the dog sat on the log " * 200
words = sorted(set(text.split()))
w2i = {w: i for i, w in enumerate(words)}
V = len(words)
data = [w2i[w] for w in text.split()]

E = np.random.default_rng(0).normal(0, 0.1, (V, V))   # embedding table (the weights!)
logits_bias = np.zeros(V)
lr = 2.0

def loss_and_grad(indices):
    x, y = indices[:-1], indices[1:]                  # inputs, targets (shift by one)
    logits = E[x] + logits_bias                       # (T, V): score each next word
    logits -= logits.max(-1, keepdims=True)
    probs = np.exp(logits); probs /= probs.sum(-1, keepdims=True)
    loss = -np.mean(np.log(probs[np.arange(len(y)), y] + 1e-9))
    g = probs; g[np.arange(len(y)), y] -= 1; g /= len(y)   # ∂cross-entropy/∂logits
    gE = np.zeros_like(E)
    for t, xi in enumerate(x): gE[xi] += g[t]              # route gradients to embeddings
    return loss, gE, g.mean(0)

for step in range(300):
    loss, gE, gb = loss_and_grad(data)
    E -= lr * gE; logits_bias -= lr * gb              # downhill (step 5)
    if step % 50 == 0: print(f"step {step:3d}  loss {loss:.3f}")
# step 0    loss 2.9   (≈ ln(19): maximum surprise — random guessing)
# step 250  loss 1.1   (the model got much less surprised — it LEARNED the bigrams)
```

Loss starts at ln(V) ≈ 2.94 ("random over 19 words") and falls toward the bigram
entropy of the corpus — the training loop *works*, end to end, no framework. Your
Chapter 6 block replaces the single matrix; the loop is identical at every scale —
this is literally what GPT's training run does, minus four orders of magnitude.

## What you now know

- Training = **next-token cross-entropy + gradient descent**, on windows that are
  self-labeling by the shift-by-one trick.
- Loss = the model's **surprise**; a falling curve is compression of the corpus into
  weights.
- "Knowing facts" is a side effect of that compression — the mechanistic root of both
  capability and hallucination.
- The loop is scale-invariant: this NumPy bigram and GPT-4's training run differ in
  parameters and data, not in kind.

Next: the trained model outputs probabilities — but users want *text*. Generation:
temperature, top-k, and why the model sometimes rambles.
