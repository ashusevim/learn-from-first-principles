---
layout: ../../layouts/Chapter.astro
title: 'What Is an LLM, Really?'
description: 'No thinking, no magic: a next-token predictor trained on the internet. Build: a bigram model that “writes” — and see where it fails.'
part: 'Part I — Tokens & Meaning'
written: true
---

"It's just autocomplete" is usually an insult. This course takes it as a *technical
specification*: a large language model is a machine that, given some text, predicts a
probability distribution over **the next token** — trained by doing exactly that,
trillions of times, on most of the written internet. Everything you've seen GPT do
emerges from that one loop done extraordinarily well. This chapter builds the loop at
its smallest honest scale — a bigram model — and watches where it breaks, because the
break points are the table of contents for the whole course.

## The lie you were told

> "LLMs look up answers in a database of training text."

There is no database. Training compresses the corpus into **billions of weights**; at
query time the model runs a forward pass over those weights and produces probabilities.
It cannot "look up" a training sentence — it can only re-generate text shaped like
what it saw. (This is why LLMs hallucinate fluently: they're not retrieving, they're
*continuing*, and continuation has no truth guarantee.)

## The smallest honest model: the bigram

Predict the next word using *only* the previous word. Count pairs in a corpus,
normalize into probabilities, sample. That's a language model — Markov's 1906 vintage:

```text
P(next | "the") = {"quick": 0.2, "end": 0.1, "world": 0.05, ...}
```

## Prove it to yourself

**1. Build and run one** — count, normalize, generate:

```python
# bigram.py — the whole LLM loop at miniature scale
import collections, random

def train(text):
    words = text.lower().split()
    pairs = collections.defaultdict(collections.Counter)
    for a, b in zip(words, words[1:]):
        pairs[a][b] += 1                    # count every adjacent pair
    return {a: {b: c / total for b, c in counter.items()}   # normalize → probabilities
            for a, total in ((a, sum(c.values())) for a, c in pairs.items())}

def generate(model, start, n=12):
    word, out = start, [start]
    for _ in range(n):
        options = model.get(word) or {"the": 1}   # unknown word → fall back
        word = random.choices(list(options), weights=options.values())[0]
        out.append(word)
    return " ".join(out)

corpus = ("the cat sat on the mat the cat ate the fish the dog sat on the log "
          "the cat saw the dog the fish swam the mat held the cat") * 50
model = train(corpus)
random.seed(3)
print(generate(model, "the"))
# the cat sat on the mat the cat ate the fish the dog sat on the log
```

It "writes" — locally coherent, occasionally a real sentence. **You have just built
the LLM loop**: predict next token, sample, append, repeat.

**2. Now watch it fail — and name the failures:**

```python
print(generate(model, "cat"))
# the cat sat on the mat the cat sat ...    ← failure 1: no long-range coherence.
#                                             Each pair is plausible; the SEQUENCE rambles.
# A 2-word memory (bigram) can't track a story. Fix: more context → Ch 4's attention,
# with a context window of thousands of tokens instead of 2.
```

- **Failure 1 — context**: one word of memory. The whole course is about extending this.
- **Failure 2 — vocabulary**: unknown words crash the model (Ch 2's tokenizers).
- **Failure 3 — no meaning**: "the" and "fish" are just symbols (Ch 3's embeddings).
- **Failure 4 — no training signal**: we counted; real models *learn* weights by
  gradient descent (Ch 7).

Each failure is a chapter. GPT is this toy with every failure fixed.

## What you now know

- An LLM = **next-token prediction**: given text, output a probability distribution
  over the next token. Generation = sample and repeat.
- Training = **compressing a corpus into weights**; no lookup, no database — which is
  exactly why hallucination is structural, not a bug.
- The bigram model is the loop at scale 1 — locally plausible, globally incoherent,
  and every gap it shows (context, vocabulary, meaning, learning) is a chapter here.

Next: the model's first input problem. Words are too big (a vocabulary of millions),
characters too small (no meaning) — byte-pair encoding builds the just-right chunks.
