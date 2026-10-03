---
layout: ../../layouts/Chapter.astro
title: 'Embeddings & Attention, Recast as Learning'
description: 'The LLM course’s structures, derived as learned function approximators — same math, new lens.'
part: 'Part III — Beyond Basics'
written: true
---

A lens chapter. The LLM course handed you embeddings (Chapter 3) and attention
(Chapters 4–5) as mechanisms; this course can now explain them *generatively* — both
are function approximators whose parameters were found by Chapter 2's gradient
descent, minimizing losses you can name. Seeing familiar structures as learned
functions is the moment the two courses fuse.

## The lie you were told

> "Embeddings and attention are architectural facts."

They're **learned**: nothing about an embedding table or a Q/K/V matrix is meaningful
at initialization — gradient descent fills them, minimizing losses. This course
provides the "how" behind the LLM course's "what":

| LLM course structure | What learning it means here |
|---|---|
| Embedding table (Ch 3 LLM) | Row vectors trained by gradient descent so prediction works — the count-based geometry of Chapter 3 LLM *emerges* |
| Q/K/V matrices (Ch 4 LLM) | Three weight matrices trained end-to-end with everything else — Chapter 5's backprop, threaded through |
| Positional encoding (Ch 5 LLM) | Learned vectors (or fixed sinusoids) — parameters like any other, updated by the same loop |
| The whole stack (Ch 6–7 LLM) | This course's Chapter 4–6 networks, wider and deeper — trained by the same descent |

## The embedding table, trained not counted

Chapter 3 of the LLM course *counted* co-occurrences; the same geometry can be
*learned* — train vectors to predict co-occurring words (word2vec's actual objective):

```python
# learn-embed.py — gradient descent discovers the cat≈dog geometry (LLM Ch 3, learned)
import numpy as np

corpus = ("the cat sat on the mat the dog sat on the log the cat ate the fish "
          "the dog chased the cat the bird flew over the log").split()
vocab = sorted(set(corpus))
w2i = {w: i for i, w in enumerate(vocab)}
V = len(vocab)

E = np.random.default_rng(0).normal(0, 0.1, (V, 4))     # 4-dim embeddings, random at start
W_out = np.random.default_rng(0).normal(0, 0.1, (V, 4))

lr = 0.5
for epoch in range(200):
    loss = 0.0
    for i, w in enumerate(corpus):
        for j in range(max(0, i - 2), min(len(corpus), i + 3)):   # neighbors within window
            if j == i: continue
            x, target = E[w2i[w]], w2i[corpus[j]]
            logits = E[w2i[w]] @ W_out.T
            p = np.exp(logits - logits.max()); p /= p.sum()
            loss -= np.log(p[target] + 1e-9)
            g = p.copy(); g[target] -= 1                    # softmax gradient (Ch 7)
            E[w2i[w]] -= lr * (g @ W_out)                   # ← gradient descent on E!
            W_out -= lr * np.outer(g, E[w2i[w]])
    if epoch in (0, 199): print(f"epoch {epoch:3d}: loss {loss:.1f}")

def cosine(a, b):
    a, b = E[w2i[a]], E[w2i[b]]
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

print("cat≈dog:", round(cosine("cat", "dog"), 2))    # high — LEARNED, not counted
print("cat≈log:", round(cosine("cat", "log"), 2))    # low
```

The count-based version of the LLM course's Chapter 3 measured cat≈dog ≈ high. The
*learned* version discovers the same geometry — via this course's gradient descent.
Two roads, one destination; real systems use whichever suits scale.

## Attention, recast

The Q/K/V matrices are just three weight matrices — Chapter 5's backprop threads
gradients through them like any other layer. What gradient descent *discovers* in
them is the striking part: heads that track the previous token, heads that match
subject to verb — specialization as loss minimization, not design. And this course
explains their trainability: residuals keep gradients alive (Chapter 6's `+ x`),
layer norm keeps them scaled, and the causal mask is just a constant pattern the
gradients respect.

## What you now know

- Embeddings and attention are **learned function approximators** — this course's
  gradient descent is what fills them.
- Learned embeddings recover the co-occurrence geometry (LLM Ch 3) — two roads to the
  same geometry: counting and gradient descent.
- The LLM course and this course are one subject split at Chapter 7: everything after
  "the loss falls" is scale and engineering; everything before is these foundations.
- When you read "the model learned X", translate: gradient descent adjusted
  parameters to reduce next-token surprise, and X fell out of that compression.

Next: with the pieces understood, the question the LLM course raised — *why do
frameworks exist?* The autograd contract, previewing the finale.
