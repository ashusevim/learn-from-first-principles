---
layout: ../../layouts/Chapter.astro
title: 'What Is a Blockchain, Really?'
description: 'A linked list where each link is a hash of the previous — tamper-evident by construction. Build: the chain, then tamper with it and watch it break.'
part: 'Part I — The Chain'
written: true
---

Strip away the hype, the tokens, the get-rich schemes, and a blockchain is **a
linked list where each node contains the hash of the previous node** — plus a rule
that makes rewriting history expensive. That's it. Everything else (mining, wallets,
smart contracts) builds on that one idea: **tamper-evident history**. This chapter
builds the chain, then alters one byte and watches every hash after it break.

## The lie you were told

> "A blockchain is a database with special powers."

It's a data structure with a specific property: **changing any historical entry
breaks every hash after it**. A regular database lets you UPDATE any row silently;
a blockchain makes every edit *detectable*. It's not "better than a database" —
it's a database with a different trust model: you don't need to trust the
keeper of the data, because the hashes verify it for you.

## The tamper-evident linked list

```text
block 0:  {data: "genesis",  prev_hash: 0000,  hash: H(block0)}
block 1:  {data: "payment",  prev_hash: H(block0),  hash: H(block1)}
block 2:  {data: "message",  prev_hash: H(block1),  hash: H(block2)}

alter block 1's data → H(block1) changes → block 2's prev_hash mismatches → BROKEN
```

The hash of each block covers its content AND the previous block's hash — so
altering any historical block cascades: every subsequent hash is wrong. The
tampering is *detectable without trusting anyone* — Chapter 2 of the cryptography
course's hash properties, chained.

## Prove it to yourself

**1. The tamper, detected:**

```python
# build a 3-block chain, change block 1's data from "payment" to "hacked",
# then verify: block 1's hash no longer matches its content, and block 2's
# prev_hash points at the OLD hash. Two breaks from one edit.
```

## The build: the chain

```python
# chain.py — the tamper-evident linked list (~25 lines)
import hashlib, json

def sha(data): return hashlib.sha256(data).hexdigest()

class Block:
    def __init__(self, data, prev_hash):
        self.data = data
        self.prev_hash = prev_hash
        self.hash = self.compute_hash()
    def compute_hash(self):
        return sha(json.dumps({"data": self.data, "prev": self.prev_hash},
                              sort_keys=True).encode())

class Chain:
    def __init__(self):
        self.blocks = [Block("genesis", "0" * 64)]     # the first block: no parent
    def add(self, data):
        self.blocks.append(Block(data, self.blocks[-1].hash))
    def verify(self):
        """every block's hash must match its content AND its prev link"""
        for i in range(1, len(self.blocks)):
            b = self.blocks[i]
            if b.hash != b.compute_hash(): return f"block {i}: content tampered"
            if b.prev_hash != self.blocks[i-1].hash: return f"block {i}: chain broken"
        return "chain valid"

chain = Chain()
chain.add("alice pays bob 5")
chain.add("bob pays carol 3")
chain.add("carol pays dave 1")

# tamper: change block 1's data WITHOUT recomputing hashes
chain.blocks[1].data = "alice pays mallory 5000"
print(chain.verify())
# block 1: content tampered — the edit is DETECTED, by hashes alone, no trust needed.
```

## What you now know

- A blockchain = **a hash-chained linked list** — tamper-evident by construction
  (the cryptography course, Chapter 2's one-way fingerprints, chained).
- Changing history **breaks every subsequent hash** — detection requires no trust.
- What's *missing* from this toy: a reason why tampering is EXPENSIVE (Ch 3's
  proof of work), who validates (Ch 4's decentralization), and who can SPEND
  (Ch 5's signatures).

Next: the chain detects tampering — but a determined attacker recomputes ALL the
hashes. Making that expensive is proof of work.
