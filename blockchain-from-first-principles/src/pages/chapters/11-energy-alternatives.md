---
layout: ../../layouts/Chapter.astro
title: 'The Energy Question & Proof of Stake'
description: 'PoW burns electricity for security — PoS replaces it with economic stake. Build: a toy PoS validator selection.'
part: 'Part IV — The Real World'
written: true
---

Proof of work's security comes from **burning electricity**: an attacker must
out-compute the honest network, and the honest network's compute costs real energy
(Bitcoin uses more than many countries). **Proof of stake** replaces the electricity
with economic stake: validators lock up coins as collateral, and an attacker must
*own* a huge stake — which they lose if caught cheating. This chapter builds a toy
PoS validator selection and compares the security models.

## The lie you were told

> "Proof of stake is less secure because there's no work."

The security model changed, not weakened:

```text
PoW:  attack cost = the HASH POWER to out-mine the network (electricity, hardware)
      attack cost is RECURRING: you pay for electricity every block

PoS:  attack cost = the STAKE to become a dominant validator (buy the coins)
      attack cost is AT RISK: cheating → your stake is SLASHED (destroyed)
      the attack requires BUYING a huge stake — which raises the coin's price,
      making the attack more expensive as you prepare it (the elegant feedback loop)
```

## The validator selection

```text
PoW:  the miner with the most HASH POWER finds the next block first (probabilistically)
PoS:  the validator is chosen — weighted by stake, with randomness (VRF or round-robin)
      the chosen validator proposes a block; other validators ATTEST it
      cheating (proposing conflicting blocks) → SLASHING: the stake is destroyed
```

## Prove it to yourself

**1. The energy comparison, computed:**

```python
# Bitcoin's annual energy consumption ≈ 150 TWh (more than Argentina)
# a PoS chain's annual consumption ≈ the same as a few thousand laptops
# the security is economic in both cases — PoW pays in electricity,
# PoS pays in opportunity cost of locked capital (the interest you'd have earned).
```

**2. The slashing, demonstrated:**

```python
# a validator signs two conflicting blocks (the double-spend attempt, Ch 7):
# the evidence (both signatures) is submitted → the stake is DESTROYED.
# the attacker loses their stake AND the transaction still fails. The economics
# make the attack unprofitable — the same "cost more than gain" model as PoW.
```

## The build: toy PoS validator selection

```python
# pos.py — stake-weighted validator selection with slashing (~35 lines)
import hashlib, secrets

def sha(data): return hashlib.sha256(data).hexdigest()

class PoSChain:
    def __init__(self):
        self.validators = {}                     # address -> {"stake": amount, "slashed": bool}
    def register(self, address, stake):
        self.validators[address] = {"stake": stake, "slashed": False}
    def select_proposer(self, seed):
        """stake-weighted random selection (simplified VRF)"""
        eligible = {a: v for a, v in self.validators.items() if not v["slashed"]}
        total = sum(v["stake"] for v in eligible.values())
        point = int(sha(seed), 16) % total
        for addr, v in eligible.items():
            point -= v["stake"]
            if point < 0: return addr
        return list(eligible)[0]
    def slash(self, address, evidence):
        """double-signing = conflicting blocks = stake destroyed"""
        v = self.validators[address]
        penalty = v["stake"] // 2                // slash 50% (real: varies)
        v["stake"] -= penalty; v["slashed"] = True
        print(f"  slashed {address}: stake reduced to {v['stake']}")

chain = PoSChain()
chain.register("validator_A", stake=100)
chain.register("validator_B", stake=50)
chain.register("validator_C", stake=30)

for round_num in range(5):
    proposer = chain.select_proposer(f"block{round_num}")
    print(f"round {round_num}: proposer = {proposer}")

# A is selected most often (highest stake) — but B and C get turns too.
# the RANDOMNESS (seed-based) prevents A from always proposing.

# ── the slashing: double-signing ──
chain.register("validator_D", stake=200)
chain.slash("validator_D", evidence="signed two conflicting blocks")
print("D after slashing: staked", chain.validators["validator_D"]["stake"],
      "| slashed:", chain.validators["validator_D"]["slashed"])
# the attacker lost 100 coins AND their validation rights. The economics work.
```

## What you now know

- **PoW** pays for security with electricity (recurring cost); **PoS** pays with
  at-risk capital (slashing).
- The PoS feedback loop: buying stake to attack raises the price, making the
  attack more expensive as you prepare it.
- **Slashing** destroys the attacker's stake on provable misbehavior — the
  economic deterrent, mechanized.
- Both models secure the same chain structure (your Chapters 1–2) — the consensus
  mechanism is a swappable layer.

Next, the finale: every chapter assembled — **the complete blockchain in ~300
lines**: transactions, wallets, mining, validation, tamper detection. The course's
proof of work, literally.
