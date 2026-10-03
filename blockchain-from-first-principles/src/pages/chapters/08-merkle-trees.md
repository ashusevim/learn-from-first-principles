---
layout: ../../layouts/Chapter.astro
title: 'Merkle Trees: Efficient Verification'
description: 'Hash the transactions pairwise up a tree — one root proves all. Build: the tree and a proof that a transaction is included.'
part: 'Part III — Beyond the Basics'
written: true
---

The block header contains a **merkle root** — one hash that commits to ALL
transactions in the block. And a **merkle proof** (the sibling hashes up the tree)
proves a specific transaction is included — without downloading the whole block.
This is how lightweight clients (SPV) verify payments on phones. This chapter
builds the tree and generates a proof.

## The lie you were told

> "Verifying a transaction means downloading the block."

The merkle tree hashes transactions **pairwise** up to a single root:

```text
          root = H(H12 + H34)
              /        \
        H12 = H(H1+H2)   H34 = H(H3+H4)
          /        \        /       \
        H1(tx1)   H2(tx2) H3(tx3)   H4(tx4)

proof that tx3 is in the block: [H4, H12]
verify: H3 + H4 → H34; H12 + H34 → root. matches the block header? ✓ included!
```

The proof is log₂(n) hashes for n transactions — 20 hashes for a million
transactions. That's the lightweight client's superpower: verify inclusion without
downloading everything.

## Prove it to yourself

**1. The proof size, counted:**

```python
import math
for n in (4, 1000, 1_000_000):
    print(f"{n:>8,} transactions: proof = {math.ceil(math.log2(n))} hashes")
#        4 transactions: proof = 2 hashes
#    1,000 transactions: proof = 10 hashes
# 1,000,000 transactions: proof = 20 hashes    ← log₂(n): the exponential compression
```

## The build: the Merkle tree and proof

```python
# merkle.py — the tree, the root, and the inclusion proof (~35 lines)
import hashlib

def sha(data): return hashlib.sha256(data).hexdigest()

def merkle_root(txs):
    """hash transactions pairwise up to a single root"""
    hashes = [sha(tx.encode()) for tx in txs]
    while len(hashes) > 1:
        if len(hashes) % 2: hashes.append(hashes[-1])      # duplicate odd last
        hashes = [sha(hashes[i] + hashes[i+1]) for i in range(0, len(hashes), 2)]
    return hashes[0]

def merkle_proof(txs, index):
    """the sibling hashes needed to prove txs[index] is in the tree"""
    hashes = [sha(tx.encode()) for tx in txs]
    proof = []
    while len(hashes) > 1:
        if len(hashes) % 2: hashes.append(hashes[-1])
        i = index // 2                          # which PAIR is ours?
        sibling = hashes[i * 2 + 1] if index % 2 == 0 else hashes[i * 2]
        proof.append((index % 2, sibling))      # (am-I-left, sibling-hash)
        hashes = [sha(hashes[j] + hashes[j+1]) for j in range(0, len(hashes), 2)]
        index //= 2
    return proof

def verify_proof(tx, proof, root):
    h = sha(tx.encode())
    for is_left, sibling in proof:
        h = sha(h + sibling) if is_left else sha(sibling + h)
    return h == root

txs = ["alice pays bob 5", "bob pays carol 3", "carol pays dave 1", "dave pays eve 2"]
root = merkle_root(txs)
print("merkle root:", root[:16], "…")

# prove that txs[2] ("carol pays dave 1") is in the block:
proof = merkle_proof(txs, 2)
print(f"proof for tx[2]: {len(proof)} sibling hashes")
print("proof valid:", verify_proof(txs[2], proof, root))     # True — included!
# a FAKE transaction: proof fails (root mismatch):
print("fake tx proof:", verify_proof("mallory prints money", proof, root))   # False
```

## What you now know

- The **merkle root** in the block header commits to ALL transactions — one hash,
  O(n) build, tamper-evident.
- The **merkle proof** (log₂(n) sibling hashes) verifies inclusion without the
  block — how SPV lightweight clients work on phones.
- A fake transaction fails the proof (root mismatch) — tamper-evidence, compressed.
- Chapter 2's block header's merkle_root: now you know what it commits to and why.

Next: the chain has addresses — but where do they come from? Wallets: the private
key IS the identity, and the address is derived from the public key.
