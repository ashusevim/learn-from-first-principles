---
layout: ../../layouts/Chapter.astro
title: 'Prompting & Context Windows'
description: 'Prompts are just conditioning; the window is finite memory. Build: watch quality collapse past the window edge.'
part: 'Part III — Using & Serving'
written: true
---

"Prompt engineering" sounds like wizardry; mechanistically it's Chapter 7's loop with
a longer prefix. A prompt is **conditioning text**: tokens that shift the next-token
distribution toward the corpus's style of responding to such prefixes. And the
**context window** — the model's entire visible memory — is a hard integer. This
chapter demonstrates both, then shows the failure mode nobody warns you about:
*everything past the window edge literally does not exist for the model.*

## The lie you were told

> "Good prompts unlock hidden capabilities."

The model has no hidden capabilities — it has a **conditional distribution**. A prompt
shifts probability mass: "Translate to French: 'hello' →" moves mass onto French
tokens, because in the training corpus, text after such prefixes *was* French
translations. Few-shot examples work identically — you're not teaching, you're
*conditioning* on a pattern the model can continue. (Chapter 10's fine-tuning bakes
favored behaviors into the weights so less conditioning is needed.)

## The window: the model's entire world

A context window of T tokens means the model sees **at most** T tokens — prompt and
response *combined*:

```text
context window (e.g. 8,000 tokens)
┌────────────────────────────────────────────┐
│ system prompt │ conversation history │ RAG │ ← your new message must fit!
└────────────────────────────────────────────┘
every new token: attention (Ch 4–5) sees ONLY what's inside the window
```

Long conversations don't "get forgotten gradually" — the oldest tokens fall off an
attention cliff (or get summarized/truncated by the serving layer). The model has no
memory *of* them at all. "Why did the AI forget my name?" — you asked it outside the
window's walls.

## Prove it to yourself

**1. Conditioning, measured** — the same start, wildly different distributions:

```python
# with Chapter 7's bigram model, condition on different prefixes:
# prompt "the cat" → high P("sat"), P("ate")     — pet-story continuation
# prompt "the dog" → high P("ran"), P("sat")     — different mass, same weights
# NOTHING changed but the conditioning tokens. No mode switch. Just shifted probabilities.
```

**2. Few-shot is pattern continuation** — show 3 examples of the format you want, and
the 4th pattern-completes. The model isn't "learning the task"; it's matching the
*corpus-shaped* pattern of "examples then answer" (and it works because such patterns
were common in training).

**3. The cliff, stepped off** — paste a 9,000-token document into an 8,000-token
window and ask about the first paragraph: confidently unavailable. Not "forgotten" —
*never seen*.

## The build: conditioning + the window edge, demonstrated

```python
# context.py — prompting as conditioning + the hard window edge
import numpy as np

# the Chapter 7 model, extended with conditioning:
tokens = ["<pad>", "the", "cat", "sat", "on", "mat", "dog", "ran", "log", "fish"]
E = np.random.default_rng(0).normal(0, 0.5, (len(tokens), len(tokens)))
bias = np.zeros(len(tokens))
# (pretend Chapter 7 trained these so "the cat" → "sat", "the dog" → "ran")

def next_token(prefix_ids, temperature=0.1):
    logits = E[prefix_ids[-1]] + bias          # bigram: conditions on the LAST token
    logits /= temperature
    return int(np.argmax(logits))              # greedy

def generate(prefix, n=4):
    ids = [next(i for i, t in enumerate(tokens) if t == prefix[-1])]
    for _ in range(n):
        ids.append(next_token(ids))
    return [tokens[i] for i in ids]

print("condition on 'cat':", generate(["cat"]))   # one continuation style
print("condition on 'dog':", generate(["dog"]))   # a different mass — same weights

# the WINDOW EDGE, made concrete:
CONTEXT_WINDOW = 6
conversation = ["the", "cat", "sat", "on", "the", "mat"]   # 6 tokens: window FULL
question = "log"                                           # arrives 7th...
visible = conversation[-(CONTEXT_WINDOW - 1):] + [question]
print("model actually sees:", visible, "← 'the' (first token) fell off the edge")
# ask about token[0] now: the model has never seen it. Not ignored — nonexistent.
```

The practical rules fall out: put critical instructions *at the start or end* of long
contexts (attention is measurably weaker in the middle — the "lost in the middle"
effect), summarize long histories instead of accumulating them, and treat the window
size as a hard budget you spend (system prompt + history + your message + the
response).

## What you now know

- Prompting = **conditioning the next-token distribution** — few-shot examples are
  pattern completion, not teaching.
- The context window is **the model's total sensory world**; past the edge,
  information is nonexistent, not weak.
- Long-context quality is non-uniform (middle blindness) — put what matters at the
  edges, budget tokens like memory (because it is).

Next: the base model continues text; users want an assistant. Fine-tuning and RLHF —
same architecture, different data.
