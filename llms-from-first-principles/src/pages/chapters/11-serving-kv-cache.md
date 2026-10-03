---
layout: ../../layouts/Chapter.astro
title: 'Serving: KV Caches & Inference Speed'
description: 'Why generating token 1000 is slower than token 2 — and the cache that fixes most of it. Build: measure with and without.'
part: 'Part III — Using & Serving'
written: true
---

Generation (Chapter 8) is one token at a time — and each new token's attention
(Chapter 4–5) must look at **every previous token**. Naively, generating token 1000
recomputes keys and values for all 999 earlier positions, most of them unchanged.
The **KV cache** fixes that by remembering them — and it's the reason LLM serving is
a *memory-bandwidth* story, not a compute one. This chapter measures the waste, then
builds the cache.

## The lie you were told

> "Generation speed is set by the GPU's compute."

Per token, the arithmetic is small — the cost is **touching every previous token's
keys and values** from memory:

```text
without cache, token t costs:  recompute K,V for t−1 positions + attention over t
with cache,    token t costs:  compute K,V for t only, read (t−1) cached pairs
                                ← O(1) compute, O(t) memory reads
```

The cached pairs *grow* every step — a 100k-token context carries a KV cache of
gigabytes — which is why long-context serving is priced by memory bandwidth and why
context length is a billing line, not a courtesy.

## The mechanics

During generation, each layer stores the K and V it computed for every past token:

```text
append token t:
  for each layer:
    k_t, v_t = project(embed(t))      ← compute ONLY the new token's pair
    cache[layer].K.append(k_t); cache[layer].V.append(v_t)
  attention: query = q_t; keys/values = the WHOLE cache   ← read, don't recompute
```

One consequence you've felt: the first token of a response has no cache (prompt
processing = full parallel compute, fast); each subsequent token is a sequential
memory read (the "tokens per second" number). Another: **batching** many users works
because each user's cache is independent — serving is a memory-management problem
(containers course, Chapter 5, for GPUs).

## Prove it to yourself

**1. The quadratic waste, counted:**

```python
T = 1000
recomputed_without = sum(t for t in range(1, T))          # Σt: every past token, per step
recomputed_with    = T                                     # only the new token, per step
print(f"K/V computations over a {T}-token generation:")
print(f"  without cache: {recomputed_without:,}")
print(f"  with cache:    {recomputed_with:,}   ← ~T/2 = 500× less work")
```

**2. The latency shape, felt in any LLM app:** first token slow (prompt processing),
then steady tokens/sec — that's cache-warm sequential generation, exactly.

## The build: attention with and without the cache

```python
# kvcache.py — attention cost: recompute vs cache, measured
import numpy as np, time

rng = np.random.default_rng(0)
T, d = 400, 64
Wk, Wv = rng.normal(size=(d, d)), rng.normal(size=(d, d))
embeddings = rng.normal(size=(T, d))                    # pretend: one token arrives per step

# ── naive: recompute ALL keys/values for every new token ──
t = time.time()
outs_naive = []
for t_step in range(1, T):
    X = embeddings[:t_step + 1]                         # the whole prefix, again
    K, V = X @ Wk, X @ Wv                               # ← recomputing the past!
    q = embeddings[t_step] @ Wk
    w = np.exp((K @ q) / np.sqrt(d)); w /= w.sum()
    outs_naive.append(w @ V)
naive_ms = (time.time() - t) * 1000

# ── cached: compute K,V for the NEW token only; read the rest ──
K_cache = np.zeros((T, d)); V_cache = np.zeros((T, d))
t = time.time()
for t_step in range(1, T):
    k, v = embeddings[t_step] @ Wk, embeddings[t_step] @ Wv   # ONLY the new token
    K_cache[t_step], V_cache[t_step] = k, v
    q = embeddings[t_step] @ Wk
    w = np.exp((K_cache[:t_step + 1] @ q) / np.sqrt(d)); w /= w.sum()
    _ = w @ V_cache[:t_step + 1]
cached_ms = (time.time() - t) * 1000

print(f"naive recompute: {naive_ms:6.1f} ms")
print(f"KV cache:        {cached_ms:6.1f} ms  ({naive_ms/cached_ms:.1f}× faster, identical math)")
```

Same outputs, same attention — one recomputed history 400 times, one appended to a
cache. The speedup grows **quadratically** with context: at 4,000 tokens it's
thousands×. That's why the KV cache isn't an optimization; it's what makes generation
possible at all.

## What you now know

- Generation is **one token at a time**, and attention over the growing prefix
  dominates — without a KV cache, cost grows O(T²) per generation.
- The KV cache stores every layer's K/V per past token: **O(1) compute per new
  token**, O(t) memory reads — serving becomes memory-bandwidth bound.
- The cache's size is why long contexts cost more to serve (and why context is
  metered).
- First-token latency (prompt processing) and steady-state tokens/sec are different
  regimes — now you know why.

Next, the finale: tokenizer, attention, block, training loop, sampler, KV cache —
assembled into **a mini-GPT in ~300 lines** that you train on a real corpus and that
writes in its voice.
