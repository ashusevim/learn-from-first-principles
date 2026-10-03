---
layout: ../../layouts/Chapter.astro
title: 'Generation: Sampling, Temperature & Top-k'
description: 'Why the model rambles or repeats — the softmax dial. Build: a sampler with temperature and top-k, outputs compared.'
part: 'Part III — Using & Serving'
written: true
---

Your trained model (Chapter 7) outputs a probability distribution over the next token.
Turning that distribution into *text* is **sampling** — and the two dials you may have
seen in APIs (`temperature`, `top_k`) are the whole story: they control the trade
between the model's safest continuation and its most creative one. This chapter builds
a sampler and demonstrates the full dial, from deterministic loops to unhinged
rambling.

## The lie you were told

> "The model outputs the best next token."

The model outputs a **distribution** — every token gets a probability. Someone must
choose. The options:

```text
greedy:      always take argmax            → deterministic, but often repetitive loops
sample:      draw from the distribution    → variety, but occasionally incoherent
temperature: sharpen (T<1) or flatten (T>1) the distribution before drawing
top-k:       keep only the k most likely tokens, zero the rest, renormalize
```

## Temperature: the boldness dial

Before sampling, divide the logits by T, then softmax:

```text
logits = [2.0, 1.0, 0.5]
T=0.5 → probs [0.66, 0.24, 0.10]   ← sharpened: confident, repetitive-safe
T=1.0 → probs [0.51, 0.19, 0.11]   ← the model's honest opinion
T=2.0 → probs [0.38, 0.26, 0.18]   ← flattened: creative, riskier
T→0   → greedy (argmax)            ← the API's temperature=0 is a LIMIT, not a mode
```

Temperature rescales surprise: low T plays it safe (loops likely — the model's
favorite phrase wins again), high T explores (novel, occasionally nonsense). Neither
is "correct" — code generation wants low T, brainstorming wants high.

## Top-k: the safety net

Flat distributions let a truly terrible token through (probability 0.001 × a billion
tokens = guaranteed gibberish eventually). **Top-k** truncates: keep the k most
likely, renormalize, sample. Top-p (nucleus) is the adaptive version — keep the
smallest set covering p of the probability mass.

## Prove it to yourself

**1. Temperature reshapes, live:**

```python
import numpy as np
logits = np.array([2.0, 1.0, 0.5])
for T in (0.5, 1.0, 2.0):
    p = np.exp(logits / T); p /= p.sum()
    print(f"T={T}: {np.round(p, 2)}")
# T=0.5: [0.88 0.09 0.03]   ← nearly argmax
# T=1.0: [0.65 0.24 0.11]
# T=2.0: [0.51 0.28 0.21]   ← nearly uniform: chaos unlocked
```

**2. Greedy loops, on camera** — feed Chapter 7's trained bigram through greedy
sampling: it enters a favorite-phrase loop and repeats forever. Then sample: the
loop breaks. Repetition isn't a bug in the model; it's argmax's personality.

## The build: a sampler on your trained model

```python
# sample.py — generation with temperature and top-k over the Chapter 7 model
import numpy as np

def generate(E, bias, tokens, start, n=15, temperature=1.0, top_k=None, rng=None):
    rng = rng or np.random.default_rng(0)
    out = [start]
    for _ in range(n):
        logits = E[out[-1]] + bias                       # next-token scores (Ch 7)
        logits /= temperature                            # ① the boldness dial
        if top_k:                                        # ② keep only the k best
            keep = np.argsort(-logits)[:top_k]
            mask = np.full_like(logits, -np.inf); mask[keep] = logits[keep]
            logits = mask
        logits -= logits.max()
        probs = np.exp(logits); probs /= probs.sum()
        out.append(rng.choice(len(probs), p=probs))
    words = [tokens[i] for i in out]
    return " ".join(words)

tokens = sorted(set("the cat sat on the mat the dog ran to the log and the fish".split()))
rng = np.random.default_rng(0)
E = rng.normal(0, 0.5, (len(tokens), len(tokens)))
bias = np.zeros(len(tokens))
# (in production these are the arrays Chapter 7 trained)

for label, kw in [("greedy (T=0.1)", dict(temperature=0.1)),
                  ("balanced (T=0.8)", dict(temperature=0.8)),
                  ("creative (T=1.5)", dict(temperature=1.5)),
                  ("creative + top-3", dict(temperature=1.5, top_k=3))]:
    rng = np.random.default_rng(7)
    print(f"{label:18s}: {generate(E, bias, tokens, 'the', 10, rng=rng, **kw)}")
# greedy (T=0.1)  : the the the the the the the the the the    ← the loop
# balanced (T=0.8): the dog ran to the mat the fish the cat
# creative (T=1.5): the log and mat the fish ran the the cat   ← looser, weirder
# creative + top-3: the fish the mat the dog ran to the log    ← chaos, trimmed
```

Four dials, four personalities — same weights. Every "the model is boring/random"
complaint is this function's parameters, not its weights.

## What you now know

- Generation = **sample from the next-token distribution**, repeat. The model offers;
  the sampler chooses.
- **Temperature** sharpens/flattens the distribution (safe ↔ creative); **top-k /
  top-p** truncate the tail (no catastrophic tokens).
- Greedy decoding loops — repetition is argmax's signature, fixable by sampling, not
  retraining.
- `temperature=0` means greedy: reproducible, but dead — and floating-point makes even
  it slightly nondeterministic at scale.

Next: the model's memory is finite. Prompts, context windows, and what happens when
your conversation outgrows the model's mind.
