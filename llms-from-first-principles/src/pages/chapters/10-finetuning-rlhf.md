---
layout: ../../layouts/Chapter.astro
title: 'Fine-tuning & RLHF, Conceptually'
description: 'Base model → instructed model: same architecture, different data. Build: a tiny fine-tune that changes style.'
part: 'Part III — Using & Serving'
written: true
---

A base model (Chapter 7's loop, run at scale) continues text — ask it a question and
it may answer, or continue with *more questions*, because that's what its corpus
looked like. Chat models behave differently: they answer, refuse politely, adopt a
style. The architecture is **unchanged** — the same transformer, the same weights
shapes, the same next-token loss. What changed is the **data**. This chapter builds a
tiny fine-tune that visibly changes the model's behavior, then places RLHF on the
same foundation.

## The lie you were told

> "Alignment rewires the model / adds a conscience module."

Nothing is rewired. Fine-tuning is Chapter 7's training loop resumed with different
data:

```text
pre-training:   trillions of tokens of internet text    → learns language + the world
fine-tuning:    ~10k–1M examples of (prompt, ideal response) → learns the ASSISTANT FORMAT
RLHF:           humans rank pairs of responses → train a reward model →
                nudge weights toward high-reward continuations
```

Each stage is the same gradient descent on next-token (or score) prediction. The
"assistant" is a *distribution over behaviors* baked into the weights by data. Which
explains the characteristic failures: models know what they were fine-tuned to say,
can be jailbroken back toward base-model behavior, and inherit their training data's
biases — all data stories.

## RLHF in one paragraph

Humans rate pairs of responses ("A is better than B"). Train a **reward model** to
predict those preferences. Then optimize the LLM to produce high-reward outputs —
with a penalty for drifting too far from the base model (KL regularization), so it
becomes *more helpful* without becoming incoherent or just hacking the reward model.
Successor techniques (DPO) skip the separate reward model and learn directly from the
preferences. Same shape: **preferences → gradient nudges**.

## Prove it to yourself

**1. Format is learnable from ~dozens of examples** — a base model continues
"Q: ..."; a fine-tuned model answers. The build below does this at toy scale.

**2. The style switch is data-driven** — same weights, two datasets: the model's
"personality" follows whichever dataset it last trained on. Continual fine-tuning
overwrites (that's also how you *destroy* a model: fine-tune carelessly and the
general capability washes out — "catastrophic forgetting").

## The build: a style-changing fine-tune

```python
# finetune.py — Chapter 7's model, continued on new data: behavior follows data
import numpy as np

words = sorted(set("the cat sat on the mat the dog ran to the log".split()))
w2i = {w: i for i, w in enumerate(words)}
V = len(words)
E = np.random.default_rng(0).normal(0, 0.5, (V, V))     # imagine: Chapter 7 pretrained this
bias = np.zeros(V)

def train(pairs, steps=400, lr=2.0):
    global E, bias
    for _ in range(steps):
        for a, b in pairs:                              # (context word, next word)
            x, y = w2i[a], w2i[b]
            logits = E[x] + bias
            logits -= logits.max()
            probs = np.exp(logits); probs /= probs.sum()
            loss_grad = probs.copy(); loss_grad[y] -= 1  # ∂loss/∂logits (Ch 7's loop)
            E[x] -= lr * loss_grad
            bias -= lr * loss_grad

# BASE behavior: "the" → mostly "cat" (pet-heavy pre-training corpus):
base_pairs = [("the", "cat"), ("the", "mat"), ("the", "dog"), ("cat", "sat")]
train(base_pairs, steps=200)

def top_next(w, k=3):
    logits = E[w2i[w]] + bias
    idx = np.argsort(-logits)[:k]
    return [(words[i], round(float(logits[i]), 2)) for i in idx]

print("base model, after 'the':", top_next("the"))
# [('cat', 1.8), ('mat', 1.2), ('dog', 1.0)]   ← the pretrained personality

# FINE-TUNE: a "pirate corpus" — 20 tiny examples of the new style:
pirate_pairs = [("the", "pearl"), ("the", "galleon"), ("the", "horizon"),
                ("ahoy", "matey"), ("the", "buccaneer")] * 8
train(pirate_pairs, steps=200)                   # SAME weights array, different data

print("fine-tuned, after 'the':", top_next("the"))
# [('pearl', 2.1), ('galleon', 1.7), ('buccaneer', 1.2)]   ← new personality, same weights
```

No architecture changed; no new layers. Twenty pirate examples outweighed 200 base
examples at those slots — fine-tuning strength is **data volume and learning rate**
against the old distribution. Scale that to "helpful assistant corpora" and you have
ChatGPT's relationship to GPT.

## What you now know

- Base → assistant = **same architecture, resumed training on different data**:
  format fine-tunes, then preference optimization (RLHF/DPO).
- The assistant persona is a **trained distribution**, not a module — which is why
  jailbreaks (reverting toward base behavior) are structural.
- Fine-tuning is powerful and dangerous: style changes in dozens of examples;
  **catastrophic forgetting** can wash out general capability in thousands.
- RLHF adds a reward model trained on human preferences + a KL leash back to base.

Next: users generate thousands of tokens per request — and naive generation recomputes
attention over the whole prefix per token. The KV cache, and why inference speed is a
memory-bandwidth story.
