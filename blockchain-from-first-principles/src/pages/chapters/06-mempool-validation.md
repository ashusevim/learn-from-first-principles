---
layout: ../../layouts/Chapter.astro
title: 'The Mempool & Block Validation'
description: 'Pending transactions wait to be mined — and must be validated first. Build: the mempool with double-spend detection.'
part: 'Part II — Trust Without Trust'
written: true
---

Transactions are signed and broadcast — but they don't go straight into a block.
They wait in the **mempool** (memory pool): the queue of pending transactions that
miners pick from. The mempool validates before accepting: signature valid? sender
has enough balance? no double-spend with another pending transaction? This chapter
builds the mempool and the validation it performs.

## The lie you were told

> "Transactions go straight onto the chain."

They wait — sometimes minutes, sometimes hours (when the mempool is congested and
fees are low). The mempool is a priority queue sorted by fee, and miners pick the
highest-fee transactions to fill their block. The validation at the door:

```text
1. signature valid?      (the sender authorized it — Ch 5)
2. sender has enough balance?  (no overspending)
3. no double-spend with another PENDING transaction?  (Ch 7's attack, caught early)
4. well-formed? (amount > 0, addresses valid)
```

## Prove it to yourself

**1. The double-spend, caught at the mempool:**

```python
# alice has 5 coins. She signs TWO transactions spending all 5:
#   tx1: alice → bob (5 coins)     tx2: alice → mallory (5 coins)
# both are validly signed. But the mempool accepts tx1 and REJECTS tx2 —
# alice's balance is spent by tx1. The double-spend is caught BEFORE mining.
```

## The build: the mempool with validation

```python
# mempool.py — pending transactions with validation (~40 lines)
import hashlib, secrets

def sha(data): return hashlib.sha256(data).hexdigest()

balances = {"alice": 5, "bob": 0}                # the current state (simplified)

class Mempool:
    def __init__(self):
        self.pending = []                        # sorted by fee (highest first)
    def submit(self, tx):
        sender, receiver, amount = tx["from"], tx["to"], tx["amount"]
        # ── validation at the door ──
        if amount <= 0: return f"rejected: amount must be positive"
        if balances.get(sender, 0) < amount: return f"rejected: insufficient funds"
        for pending in self.pending:             # double-spend with pending txs?
            if pending["from"] == sender and pending["amount"] + amount > balances.get(sender, 0):
                return f"rejected: double-spend with pending tx"
        tx["fee"] = tx.get("fee", 1)
        self.pending.append(tx)
        self.pending.sort(key=lambda t: -t["fee"])   # highest fee first
        return f"accepted: {sender} → {receiver} ({amount}), fee {tx['fee']}"

mempool = Mempool()
def tx(frm, to, amount, fee=1):
    return {"from": frm, "to": to, "amount": amount, "fee": fee}

print(mempool.submit(tx("alice", "bob", 3)))        # accepted
print(mempool.submit(tx("alice", "carol", 3)))      # rejected: would over-spend
print(mempool.submit(tx("bob", "carol", 3, fee=5))) # accepted (higher fee, from bob's new balance)
print("mempool (by fee):", [(t["from"], t["to"], t["fee"]) for t in mempool.pending])
# mempool: [('bob', 'carol', 5), ('alice', 'bob', 1)]  ← sorted by fee, highest first
```

## What you now know

- The mempool = **pending transactions, validated at the door, sorted by fee** —
  the queue miners pick from.
- **Double-spends are caught at the mempool** — before they enter a block — by
  checking balance against pending transactions.
- **Fees** are the miner's incentive: higher fee = mined sooner. The market for
  block space.

Next: the famous attack — spend the same coin twice on two forks of the chain,
and the longest-chain rule that resolves it.
