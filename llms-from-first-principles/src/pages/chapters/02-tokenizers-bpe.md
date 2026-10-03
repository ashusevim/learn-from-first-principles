---
layout: ../../layouts/Chapter.astro
title: 'Tokens: Words Too Big, Characters Too Small'
description: 'Byte-pair encoding builds a vocabulary from the corpus. Build: a tiny BPE tokenizer that learns merges from scratch.'
part: 'Part I — Tokens & Meaning'
written: true
---

Chapter 1's model predicted *words* — and the word was the first thing to fail: a
vocabulary of every English word is millions of entries (and every typo, name, and
code identifier is "unknown"), while a character-level model makes sequences 5× longer
and meaning harder. The industry's answer is **byte-pair encoding (BPE)**: start from
characters, repeatedly merge the most frequent adjacent pair, and let a vocabulary of
usable chunks *grow out of the data*. This chapter builds BPE from scratch — and
explains why GPT can't count the letters in "strawberry".

## The lie you were told

> "LLMs read words."

LLMs read **tokens** — sub-word chunks learned from the corpus. GPT-4's tokenizer has
~100,000 of them: common words are one token (`" the"`), rarer words are several
(`"straw"` + `"berry"`), and code, emoji, and non-English text fragment further. The
token you feed the model is just an integer — the tokenizer's job is text → integers.

## The algorithm: greedily merge what's common

```text
1. start: every character is a token          ("l","o","w","e","r")
2. count adjacent pairs across the corpus     ("l","o") most frequent → merge → "lo"
3. repeat: ("lo","w") → "low", ("e","r") → "er"...
4. stop at vocabulary size
```

Frequent strings become single tokens; rare strings stay as multi-token sequences.
No dictionary required — the vocabulary *is* a compression of your corpus (Chapter 1
of the Git course: content statistics as structure).

## Prove it to yourself

**1. The merge loop, on a toy corpus:**

```python
corpus = ["low", "low", "low", "lower", "lowest", "newer", "wider"]
# iteration 1: ('l','o') appears 5× — merge → "lo"
# iteration 2: ('lo','w') appears 3× — merge → "low"
# ...the vocabulary builds itself from frequency, nothing hand-declared
```

**2. The strawberry problem, explained:**

```python
# "strawberry" tokenizes roughly as ["str", "aw", "berry"] — 3 tokens.
# The model never sees the letters r-r together; it sees chunk ids.
# Asked "how many r's?", it must answer from chunk statistics, not letters.
# Letter-counting failures are TOKENIZER failures, not intelligence failures.
```

**3. Token counts are context-dependent** — "1234" might be one token or four,
depending on the merge table; that's why arithmetic and number formatting are
special-cased in real tokenizers.

## The build: a tiny BPE trainer

```python
# bpe.py — byte-pair encoding: learn merges, then encode/decode (~35 lines)
from collections import Counter

def train(corpus, vocab_size=50):
    words = [list(w) + ["</w>"] for w in corpus.split()]   # chars + end marker
    merges = []
    while True:
        pairs = Counter()
        for w in words:
            for a, b in zip(w, w[1:]):
                pairs[a, b] += 1
        if not pairs or max(pairs.values()) < 2: break
        best, _ = pairs.most_common(1)[0]
        words = [[c for c in
                  (" ".join(w)).replace(" ".join(best), "".join(best)).split(" ")]
                 for w in words]
        words = [w[0] for w in words]
        merges.append(best)
        if len(merges) >= vocab_size: break
    return merges

def encode(word, merges):
    tokens = list(word) + ["</w>"]
    for a, b in merges:                       # apply merges IN LEARNED ORDER
        i = 0
        while i < len(tokens) - 1:
            if tokens[i] == a and tokens[i + 1] == b:
                tokens[i:i + 2] = [a + b]
            else:
                i += 1
    return tokens

corpus = "low low low lower lowest newer wider new new"
merges = train(corpus, vocab_size=10)
print("learned merges:", merges)
# [('l','o'), ('lo','w'), ('e','r'), ('low','e'), ('low','er'), ('n','e'), ...]
print(encode("lowest", merges))    # ['low', 'est</w>'] — "low" became ONE token
print(encode("unseenword", merges)) # unseen words still encode — from characters up
```

That last property is the killer feature: **anything encodes** — typos, URLs, 中文,
emoji — by falling back to characters. No "unknown word" ever exists.

## What you now know

- Models read **tokens**: chunks learned by greedily merging frequent pairs — a
  vocabulary grown from the corpus, not a dictionary.
- **Encode order matters**: merges apply in learned order; unseen words fall back to
  characters, so nothing is out-of-vocabulary.
- Letter-counting failures and formatting quirks are **tokenizer artifacts** — now
  diagnosable.

Next: tokens are integers with no meaning. The next machine converts them into
*vectors* — and meaning becomes geometry.
