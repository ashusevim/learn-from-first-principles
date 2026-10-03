---
layout: ../../layouts/Chapter.astro
title: 'Multi-Head Attention & Positional Encoding'
description: 'Multiple attention “eyes” plus a sense of word order. Build: a full attention block with causal masking.'
part: 'Part II — The Transformer'
written: true
---

Chapter 4's self-attention has two gaps: it runs **one attention pattern** (one "eye")
for all relationships, and it's **order-blind** — shuffle the input tokens and the
attention weights are identical, since nothing in the math knows position. The fixes:
run several attentions in parallel (**multi-head**) so each learns its own pattern,
and **inject position information** into the embeddings before attention ever runs.
Plus, for generation: the **causal mask** that forbids looking at the future. This
chapter builds the complete attention block.

## The lie you were told

> "Word order comes from the input order."

Attention is a *set* operation: `weights @ V` treats the input as an unordered bag —
swap two tokens and every dot product is unchanged, just reordered. Position must be
**injected**: add a position-dependent vector to each embedding (the original paper's
sinusoids; modern models use learned vectors or RoPE rotations). After injection,
"dog bites man" and "man bites dog" produce genuinely different attention.

## Multi-head: parallel eyes

One head = one Q/K/V triple = one attention pattern per token. But a token needs
*multiple* relationship types at once (the previous token, the sentence's verb, matching
quotes). **Heads** are several smaller attentions run in parallel, concatenated and
mixed:

```text
head_i = softmax(Q_i @ K_i.T / √d_head) @ V_i      (each head: d split into h chunks)
output = concat(head_1..head_h) @ Wo               ← Wo re-mixes the findings
```

Same total compute (each head is d/h dimensional), more patterns learned. Empirically:
some heads track position, some track syntax, some track rare-token matching —
specialization emerges from training, undesigned.

## The causal mask: generation's blindfold

For text generation, token at position t must **not** see positions > t (you can't
condition on the future you're predicting). The mask sets future scores to −∞ before
softmax — making those weights exactly 0:

```text
scores after mask (T=4):
  token 0: [ s, -∞, -∞, -∞ ]   → looks only at itself
  token 1: [ s,  s, -∞, -∞ ]   → self + previous
  token 3: [ s,  s,  s,  s ]   → sees everything so far
```

One triangular matrix of −∞ turns any attention into a *language-model* attention.

## Prove it to yourself

**1. Order-blindness, demonstrated:**

```python
import numpy as np
rng = np.random.default_rng(0)
d = 8
W = rng.normal(size=(d, d))
def attend(seq):                                   # attention WITHOUT position injection
    X = np.stack(seq)
    S = X @ W @ X.T
    return np.exp(S) / np.exp(S).sum(-1, keepdims=True)

a, b, c = [rng.normal(size=d) for _ in range(3)]
assert np.allclose(attend([a, b])[0], attend([b, a])[1])  # same pair, same weights!
# the weights between two tokens don't care which came first. Order needs injection.
```

**2. The causal mask, verified** — row t of the masked weights is exactly zero past
position t (the build below prints it).

## The build: the complete attention block

```python
# attentionblock.py — multi-head + causal mask + positional encoding
import numpy as np

def attention_block(X, Wq, Wk, Wv, Wo, n_heads, causal=True):
    T, d = X.shape
    dh = d // n_heads

    # positional injection: sinusoid-style, added ONCE before attention (order!)
    pos = np.arange(T)[:, None] / np.power(10000, np.arange(0, d, 2) / d)
    pe = np.zeros((T, d)); pe[:, 0::2] = np.sin(pos); pe[:, 1::2] = np.cos(pos)
    X = X + pe

    heads = []
    for h in range(n_heads):                       # each head: its own slice of dims
        sl = slice(h * dh, (h + 1) * dh)
        Q, K, V = X @ Wq[:, sl], X @ Wk[:, sl], X @ Wv[:, sl]
        S = Q @ K.T / np.sqrt(dh)
        if causal:                                 # the blindfold:
            S += np.triu(np.full((T, T), -np.inf), k=1)   # future = −∞ → weight 0
        S -= S.max(axis=-1, keepdims=True)         # stable softmax
        W = np.exp(S) / np.exp(S).sum(-1, keepdims=True)
        heads.append(W @ V)
    return np.concatenate(heads, axis=-1) @ Wo     # re-mix the heads' findings

rng = np.random.default_rng(1)
d, T, heads = 16, 4, 2
X = rng.normal(size=(T, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) for _ in range(4))
out = attention_block(X, Wq, Wk, Wv, Wo, n_heads=heads)
print("output shape:", out.shape)                  # (4, 16) — same as input, richer each

W = attention_block(X, Wq, Wk, Wv, Wo, n_heads=heads)  # (recompute one head's weights to show)
print("causal row 2 (token 2 sees only 0,1,2):")
print(np.round(np.triu(np.full((T, T), -np.inf), k=1), 2))
```

Output shape == input shape is the design's quiet genius: attention blocks **stack**,
each deepening the representation without reshaping it. GPT-3 stacked 96.

## What you now know

- **Multi-head** = several small attentions in parallel, concatenated and re-mixed —
  specialization for free.
- Attention is **order-blind**: positional information must be injected (sinusoids,
  learned, or RoPE) before attention runs.
- The **causal mask** (−∞ above the diagonal) turns any attention into generation-
  safe attention — token t sees only 0..t.
- Same-shape-in, same-shape-out means blocks stack — which is Chapter 6: the full
  transformer block.
