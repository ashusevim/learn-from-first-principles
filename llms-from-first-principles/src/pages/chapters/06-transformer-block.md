---
layout: ../../layouts/Chapter.astro
title: 'The Transformer Block'
description: 'Attention + MLP + residuals + layer norm — the Lego brick of GPT. Build: a stackable block, shapes verified.'
part: 'Part II — The Transformer'
written: true
---

Attention (Chapter 5) lets tokens share information. But a transformer needs one more
component to be useful — a place to *think about* what was gathered — plus two pieces
of engineering glue that make deep stacking possible. Assemble them and you have the
**transformer block**: the Lego brick that GPT stacks 96 of. This chapter builds one,
verifies every shape, and stacks a few.

## The lie you were told

> "The transformer is one exotic architecture."

It's four mundane components in a twice-repeated wrapper:

```text
x = x + attention(norm(x))        ← the tokens talk (Ch 5)
x = x + mlp(norm(x))              ← each token thinks alone (a 2-layer network per token)

attention: move information BETWEEN positions
MLP:       process information WITHIN each position (≈ 2/3 of the parameters!)
residual:  "+ x" keeps a highway open — gradients flow, depth possible
layer norm: keeps activations in a sane range — stacking without explosion
```

Two insights worth underlining: the **MLP does most of the "knowing"** (it's the
bigger half of the parameter count — the model's long-term memory), while attention is
the *conductor* routing information between positions. And **residuals are what make
96 layers trainable** — without the `+ x`, gradients die within a few blocks (Chapter
7's training would flatline).

## Prove it to yourself

**1. Shapes all the way down** — the block never changes them:

```text
input (T, d) → attention (T, d) → +residual → norm → MLP (T, 4d) → (T, d) → +residual
                same shape!                    expands 4×   contracts    same shape!
```

Same-shape blocks stack arbitrarily — the entire architecture is `for _ in range(N): x = block(x)`.

**2. Residuals keep the path alive:**

```python
x_new = x + f(x)      # f's output is an UPDATE, not a replacement.
                      # if f is useless early in training, the block learns f ≈ 0
                      # and the signal passes through untouched. Depth without death.
```

## The build: a transformer block in NumPy

```python
# block.py — attention (Ch 5) + MLP + residuals + layernorm, shapes verified
import numpy as np

def layernorm(x, eps=1e-5):                     # normalize each token's vector
    mean, var = x.mean(-1, keepdims=True), x.var(-1, keepdims=True)
    return (x - mean) / np.sqrt(var + eps)

def gelu(x):                                    # the MLP's nonlinearity
    return 0.5 * x * (1 + np.tanh(np.sqrt(2/np.pi) * (x + 0.044715 * x**3)))

def attention(X, Wq, Wk, Wv, Wo, causal=True):  # Ch 5's mechanism (single head, abridged)
    T, d = X.shape
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(d)
    if causal:
        S += np.triu(np.full((T, T), -np.inf), k=1)
    S -= S.max(-1, keepdims=True)
    W = np.exp(S) / np.exp(S).sum(-1, keepdims=True)
    return W @ V

class Block:
    def __init__(self, d, mlp_mult=4, rng=None):
        rng = rng or np.random.default_rng(0)
        self.wq, self.wk, self.wv, self.wo = (rng.normal(0, 0.02, (d, d)) for _ in range(4))
        self.w1 = rng.normal(0, 0.02, (d, d * mlp_mult))    # expand 4×
        self.w2 = rng.normal(0, 0.02, (d * mlp_mult, d))    # contract back
    def __call__(self, x):
        x = x + attention(layernorm(x), self.wq, self.wk, self.wv, self.wo)  # talk
        h = layernorm(x)
        x = x + gelu(h @ self.w1) @ self.w2                                  # think
        return x

rng = np.random.default_rng(0)
d, T = 32, 5
x = rng.normal(size=(T, d))
block = Block(d, rng=rng)
out = block(x)
print("block shapes: in", x.shape, "→ out", out.shape)      # (5,32) → (5,32) — stackable

x2 = block(block(out))                                       # stack more: identical shapes
print("after 2 more blocks:", x2.shape)                     # (5, 32)
print("params per block:", sum(p.size for p in
      [block.wq, block.wk, block.wv, block.wo, block.w1, block.w2]))
# ~4×d² in attention + 8×d² in the MLP: the MLP is ⅔ of the block — the "memory" half.
```

## What you now know

- The block = **attention (talk) + MLP (think)**, each wrapped in **residual + layer
  norm**. Same-shape in/out → arbitrarily deep stacks.
- The **MLP holds ~⅔ of the parameters** — the model's associative memory; attention
  routes between stored facts.
- **Residuals** make 96-layer stacks trainable (updates, not replacements); **layer
  norm** keeps the activations civilized.
- What's missing to be GPT: a way to *train* the weights — Chapter 7's gradient
  descent on next-token prediction.

Next: random weights know nothing. The training loop — predict the next token, measure
the surprise, nudge every weight — and a loss curve that actually falls.
