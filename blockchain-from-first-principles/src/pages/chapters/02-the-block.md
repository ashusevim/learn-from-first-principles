---
layout: ../../layouts/Chapter.astro
title: 'The Block: Hashes Chain History'
description: 'What goes IN a block and how the hash chains it. Build: the block structure, then alter one byte and watch every hash after it break.'
part: 'Part I — The Chain'
written: true
---

Chapter 1's chain proved tamper-evidence with a minimal block: data + prev_hash.
A real block carries more — **timestamp, nonce, transactions, and a Merkle root**
(Chapter 8) — and the hash covers all of it. This chapter builds the complete block
structure and demonstrates the cascade: alter one byte, and every hash after it
breaks.

## The lie you were told

> "A block is just data with a hash."

A block is a **header + a body**, where the header is what gets hashed:

```text
header:
  version        protocol version
  prev_hash      the previous block's hash  ← THE chain
  merkle_root    hash of all transactions (Ch 8)
  timestamp      when this block was created
  nonce          the proof-of-work number (Ch 3)
  difficulty     the mining target
body:
  transactions   the actual data
```

The header is what the miner hashes (it's small — the body can be megabytes); the
merkle root commits to ALL transactions without hashing them individually.

## Prove it to yourself

**1. The cascade, block by block:**

```python
# alter block 1's data → H(block1) changes → block 2's prev_hash mismatches
# → block 2's hash is "wrong" → block 3's prev_hash mismatches → ...
# EVERY block after the tamper is invalid. The cascade is the tamper-evidence.
```

**2. The nonce is in the header** — which is why changing the nonce changes the
hash (Chapter 3's mining) without touching the data: the nonce is *inside* what
gets hashed.

## The build: the complete block structure

```python
# block.py — the complete block: header + body, the cascade verified (~35 lines)
import hashlib, json, time

def sha(data): return hashlib.sha256(data).hexdigest()

class Block:
    def __init__(self, prev_hash, transactions, nonce=0):
        self.prev_hash = prev_hash
        self.timestamp = time.time()
        self.nonce = nonce
        self.transactions = transactions
        self.hash = self.compute_hash()          # computed ONCE at creation
    def compute_hash(self):
        header = {"prev": self.prev_hash, "time": self.timestamp,
                  "nonce": self.nonce, "txs": self.transactions}
        return sha(json.dumps(header, sort_keys=True).encode())

chain = [Block("genesis — the first block", "0" * 64)]
chain.append(Block(["alice pays bob 5"], chain[-1].hash))
chain.append(Block(["bob pays carol 3"], chain[-1].hash))

def verify_chain(blocks):
    for i in range(1, len(blocks)):
        b = blocks[i]
        if b.hash != b.compute_hash():
            return f"block {i}: CONTENT tampered (hash mismatch)"
        if b.prev_hash != blocks[i-1].hash:
            return f"block {i}: CHAIN broken (prev_hash mismatch)"
    return "chain valid"

print("before tamper:", verify_chain(chain))

# THE TAMPER: change one transaction's amount in block 1:
chain[1].transactions = ["alice pays bob 9999"]
print("after tamper:", verify_chain(chain))
# block 1: CONTENT tampered — the hash no longer matches the data

# and the cascade: block 2's prev_hash still points at block 1's OLD hash:
print("block 2's prev_hash still matches block 1's ORIGINAL hash:",
      chain[2].prev_hash == sha(json.dumps(
          {"data": "alice pays bob 5", "prev": chain[0].hash}, sort_keys=True).encode()))
# True — the old hash is what block 2 recorded. The tamper broke the chain.
```

## What you now know

- The block = **header (what's hashed) + body (the transactions)**; the header
  commits to everything via the merkle root and prev_hash.
- The tamper **cascades**: one edit breaks the block's hash AND every subsequent
  prev_hash link.
- The **nonce** lives in the header — Chapter 3's mining changes it to find a valid
  hash without touching the data.

Next: the chain detects tampering — but an attacker with a fast computer recomputes
every hash. Making that expensive is the innovation: proof of work.
