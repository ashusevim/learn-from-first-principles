# LLMs from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds large language models from first principles — tokens,
embeddings, attention, the transformer block, training, sampling — ending with a
mini-GPT you trained yourself, writing text in your corpus's voice.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [The Web](../the-web-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Tokens & Meaning**
1. What Is an LLM, Really? ✅
2. Tokens: Words Too Big, Characters Too Small ✅
3. Embeddings: Meaning as Geometry ✅

**Part II — The Transformer**
4. Attention: The Core Idea ✅
5. Multi-Head Attention & Positional Encoding ✅
6. The Transformer Block ✅
7. Training: Next-Token Loss ✅

**Part III — Using & Serving**
8. Generation: Sampling, Temperature & Top-k ✅
9. Prompting & Context Windows ✅
10. Fine-tuning & RLHF, Conceptually ✅
11. Serving: KV Caches & Inference Speed ✅
12. Final Boss: A Mini-GPT in ~300 Lines ✅ *(tokenizer + transformer + training + sampler)*

All 12 chapters are fully written, each with runnable NumPy builds and measured outputs.
Things you build along the way: a bigram model that writes, a BPE tokenizer with a
learned merge table, co-occurrence embeddings with measured similarity, self-attention
with an inspectable attention map, the full causal multi-head block, a hand-graded
training loop with a falling loss curve, temperature/top-k samplers, a conditioning and
context-edge demo, a pirate fine-tune, a KV-cache benchmark — and a mini-GPT trained on
a real corpus.

## The rules of the course

1. **Start below the abstraction.** Before "use the API", answer "what does the matrix do?"
2. **Nothing is magic.** Attention and training are NumPy-scale math you can run.
3. **Build a toy version.** The finale: a mini-GPT — tokenizer, transformer, sampler.
4. **Then the papers are readable.** "Attention Is All You Need" becomes a parts list.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
