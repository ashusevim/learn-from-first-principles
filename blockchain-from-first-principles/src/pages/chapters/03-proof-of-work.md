---
layout: ../../layouts/Chapter.astro
title: 'Proof of Work: Making Forging Expensive'
description: 'Find a nonce whose hash starts with N zeros — guess until you win. Build: mining with adjustable difficulty, hashrate measured.'
part: 'Part I — The Chain'
written: true
---

Chapter 2's chain detects tampering — but an attacker with a fast computer can
recompute every hash after their edit, and the tampered chain looks *valid*. Proof
of work closes that hole: **a block is only valid if its hash starts with N zeros**
— and finding such a hash requires guessing nonces until you win. The cost of
forging = the cost of re-mining every block after your edit. This chapter builds
the miner.

## The lie you were told

> "Mining is solving puzzles."

Mining is **brute-force guessing**: try nonce 0, hash, check; nonce 1, hash, check;
... until the hash starts with enough zeros. No cleverness, no shortcuts — just
SHA-256 at maximum speed. The "puzzle" is deliberately memoryless: each guess is
independent, so more hashes per second = higher win probability.

## The difficulty

```text
difficulty 3: hash starts with 000  → 1/16^3 ≈ 1 in 4096 hashes
difficulty 5: hash starts with 00000 → 1 in 16^5 ≈ 1 in a million
difficulty adjusts: if blocks come too fast, raise N; too slow, lower it
```

The nonce is the guessing variable — and it's IN the header (Chapter 2), so
changing it changes the hash without touching the data.

## Prove it to yourself

**1. The mining loop, watched:**

```python
import hashlib
target = "000"                            # difficulty 3: hash starts with 000
nonce = 0
while True:
    block_hash = hashlib.sha256(f"block data{nonce}".encode()).hexdigest()
    if block_hash.startswith(target):
        print(f"mined! nonce={nonce} hash={block_hash[:16]}...")
        break
    nonce += 1
# a few thousand guesses for difficulty 3 — seconds at difficulty 5.
```

**2. The exponential, felt** — each +1 difficulty multiplies the expected work by
16 (hex: 16 possible characters per position). Difficulty 8 ≈ 4 billion guesses.

## The build: mining with adjustable difficulty

```python
# mine.py — proof-of-work mining with difficulty adjustment (~30 lines)
import hashlib, time

def mine(block_data, difficulty):
    target = "0" * difficulty
    nonce, hashes = 0, 0
    start = time.time()
    while True:
        block_hash = hashlib.sha256(f"{block_data}{nonce}".encode()).hexdigest()
        hashes += 1
        if block_hash.startswith(target):
            elapsed = time.time() - start
            print(f"mined at difficulty {difficulty}: nonce={nonce}, "
                  f"{hashes:,} hashes in {elapsed:.2f}s ({hashes/elapsed:,.0f} H/s)")
            return nonce, block_hash
        nonce += 1

for difficulty in (3, 4, 5, 6):
    mine("alice pays bob 5", difficulty)
# difficulty 3: ~4,000 hashes in 0.01s
# difficulty 4: ~65,000 hashes in 0.1s    ← ×16 per +1 difficulty
# difficulty 5: ~1,000,000 hashes in 1.2s
# difficulty 6: ~15,000,000 hashes in 15s ← the exponential, measured
```

The hashrate and the difficulty are the miner's income equation: more hashrate =
more blocks won; higher difficulty = more work per block. Bitcoin's difficulty
adjusts every 2016 blocks to keep the block time at ~10 minutes regardless of
total network hashrate — the same dial, at industrial scale.

## What you now know

- Proof of work = **guess nonces until the hash meets the difficulty target** —
  memoryless, exponential, no shortcuts.
- The **difficulty dial** multiplies expected work by 16 per hex zero — the
  network's self-adjusting economics.
- The nonce lives in the header (Ch 2), so mining doesn't touch the data — the
  proof of work is *in* the hash, verifiable by anyone.
- Forging history now requires **re-mining every block** — the expense that makes
  the chain trustworthy without a central authority.

Next: one miner is a puzzle; many miners are a *network*. Nodes syncing blocks,
agreeing on the longest chain, and the decentralization that removes the single
point of trust.
