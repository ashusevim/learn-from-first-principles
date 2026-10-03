---
layout: ../../layouts/Chapter.astro
title: 'Double-Spend & the Longest-Chain Rule'
description: 'The famous attack: spend the same coin twice on two forks. Build: the fork, the race, and the resolution.'
part: 'Part III — Beyond the Basics'
written: true
---

The double-spend is blockchain's famous attack: spend the same coin twice by
creating two conflicting transactions on two forks of the chain. The mempool
(Chapter 6) catches it *before* mining — but what if the attacker mines BOTH
branches? The answer is the **longest-chain rule**: the network follows whichever
fork is longer (has more proof of work), and the losing fork's transactions are
orphaned. This chapter builds the fork, races the chains, and shows the resolution.

## The lie you were told

> "Blockchains prevent double-spending."

They *make it economically irrational*. The attack requires controlling enough
hash power to outrun the honest network (the 51% attack) — and even then, the
attempt is *visible* (the fork is public), destroying the coin's value in the
process. The security is economic, not mathematical: **the attack costs more than
it gains**.

## The fork

```text
alice has 5 coins. She pays bob 5 coins (tx1) → mined into block N.
Then she builds a SECRET fork from block N-1: pays mallory the same 5 coins (tx2).

chain A (honest):  ...→ block N (tx1: alice→bob) → block N+1 → ...
chain B (attack):  ...→ block N-1 → block N' (tx2: alice→mallory) → ...

both chains are valid! the network must choose.
```

## The longest-chain rule

```text
the rule: follow the chain with the most CUMULATIVE PROOF OF WORK
          (approximated by length — more blocks = more hashing done)

the race: the attacker mines chain B alone; the honest network mines chain A.
          unless the attacker has > 50% of the network's hash power,
          chain A grows faster → chain B is orphaned → tx2 vanishes.
```

The **6-confirmation convention**: merchants wait for 6 blocks on top of the
payment before shipping — the probability that the attacker can outrun 6 blocks
*and* maintain the lead shrinks exponentially with each confirmation.

## Prove it to yourself

**1. The probability, computed:**

```python
import math
# attacker has q fraction of hash power, needs to catch up z blocks:
q, z = 0.3, 6      # attacker has 30% hash power, is 6 blocks behind
# the probability the attacker EVER catches up (from the Bitcoin whitepaper):
p = (q / (1 - q)) ** z
print(f"attacker catches up: {p:.2e} probability")
# 0.0007 — 0.07%. The 51% threshold is where this exceeds 50%.
for q in (0.1, 0.3, 0.49):
    print(f"  hash power {q:.0%}: catch-up probability {(q/(1-q))**6:.2e}")
# the attack cost rises sharply as the attacker's hash power drops below 50%.
```

## The build: the fork and the resolution

```python
# fork.py — the double-spend, the fork, the resolution (~40 lines)
import hashlib, json

def sha(data): return hashlib.sha256(data).hexdigest()

def mine(data, prev_hash, difficulty=4):
    nonce = 0
    while True:
        block_hash = sha(f"{data}{prev_hash}{nonce}")
        if block_hash.startswith("0" * difficulty): return nonce, block_hash
        nonce += 1

# ── the honest chain: alice pays bob, mined ──
honest = [{"data": "genesis", "prev": "0"*64, "hash": sha("genesis")}]
tx1_block = {"data": "alice pays bob 5", "prev": honest[-1]["hash"]}
n1, h1 = mine(tx1_block["data"], tx1_block["prev"], 3)
tx1_block["nonce"], tx1_block["hash"] = n1, h1
honest.append(tx1_block)
print("honest chain: alice→bob confirmed (3 blocks)")

# ── the ATTACK: a secret fork, paying mallory instead ──
attack_chain = [honest[0]]                           # fork from genesis
tx2_block = {"data": "alice pays mallory 5", "prev": honest[0]["hash"]}
n2, h2 = mine(tx2_block["data"], tx2_block["prev"], 3)
tx2_block["nonce"], tx2_block["hash"] = n2, h2
attack_chain.append(tx2_block)
print(f"attack chain: mallory paid (2 blocks — BEHIND the honest chain)")

# ── the resolution: the longest chain wins ──
chains = [honest, attack_chain]
winner = max(chains, key=len)
print(f"longest chain wins: {len(winner)} blocks")
print("winner's txs:", [b["data"] for b in winner[1:]])
print("attack chain orphaned:", winner is honest or "mallory's payment wins")
# the honest chain is longer (more work) → mallory's fork is orphaned.
# the attacker needed MORE hash power than the honest network to win. That's the model.
```

## What you now know

- The **double-spend** creates two valid chains; the **longest-chain rule** picks
  the one with more proof of work.
- The attacker needs **> 50% hash power** to sustain the fork — the security is
  economic (the attack costs more than the gain), not mathematical.
- The **6-confirmation convention** is the exponential decay of attack probability
  (the Bitcoin whitepaper's math, computed).
- This is why exchanges wait for confirmations — and why "1 confirmation" payments
  are risky.

Next: the chain stores blocks of transactions — but verifying "does this block
contain MY transaction?" requires re-scanning the whole block. Merkle trees fix
that with one hash.
