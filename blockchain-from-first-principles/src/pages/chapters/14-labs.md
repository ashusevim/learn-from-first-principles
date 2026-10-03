---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the chain from Chapter 12 — mining, tampering, double-spends, forks. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Every lab runs on the course’s own artefacts: `chain.py`, `block.py`, `mine.py`, `nodes.py`, `tx.py`, `mempool.py`, `fork.py`, `merkle.py`, `wallet.py`, `pos.py` and Chapter 12’s `blockchain.py`.

## How the labs work

Each lab has four fields; hints are directions, never solutions. A lab counts only when the promised output comes from your run.

| Tier | Labs | Shape |
|---|---|---|
| Warm-ups | 1.1–1.3 | one artefact, one observation |
| Builds | 2.1–2.5 | remove a defense, watch the attack land |
| Stretch goals | 3.1–3.4 | open-ended; many answers |

| Field | What it gives you |
|---|---|
| **Goal** | what the lab proves |
| **Do this** | how to demonstrate it |
| **You’ll know it works when** | the output you must see |
| **Where it comes from** | the source chapter |

## Warm-ups

**Lab 1.1 — Tamper one byte**
**Goal:** Watch a tamper cascade.
**Do this:** In `chain.py`, edit block 1’s data; run `verify()`.
**You’ll know it works when:** it prints `block 1: content tampered`; block 2’s link is stale.
**Where it comes from:** Chapter 1 — What Is a Blockchain, Really?

**Lab 1.2 — Break the link**
**Goal:** See the header carry the chain.
**Do this:** In `block.py`, change block 1’s nonce after hashing; run `verify_chain`.
**You’ll know it works when:** block 1 fails its hash check, block 2 its `prev_hash` check.
**Where it comes from:** Chapter 2 — The Block: Hashes Chain History.

**Lab 1.3 — Mine a block**
**Goal:** Feel the exponential.
**Do this:** Run `mine.py` at difficulties 3, 4 and 5:

```sh
python3 -c "from mine import mine; [mine('alice pays bob 5', d) for d in (3, 4, 5)]"
```

**You’ll know it works when:** each extra hex zero multiplies the guess count by ~16.
**Where it comes from:** Chapter 3 — Proof of Work: Making Forging Expensive.

## Builds

**Lab 2.1 — Reject a bad block**
**Goal:** See independent validation.
**Do this:** In `nodes.py`, broadcast a block that does not extend the tip.
**You’ll know it works when:** all three nodes answer `rejected (doesn't extend our chain)`.
**Where it comes from:** Chapter 4 — Decentralization: No Single Point of Trust.

**Lab 2.2 — Forge a signature**
**Goal:** Kill a forged spend.
**Do this:** In `tx.py`, sign with `mallory_priv`; verify against `alice_pub`.
**You’ll know it works when:** `is_valid(alice_pub)` returns `False`.
**Where it comes from:** Chapter 5 — Transactions & Digital Signatures.

**Lab 2.3 — Catch a double-spend**
**Goal:** See the mempool reject at the door.
**Do this:** In `mempool.py`, submit two alice transactions exceeding her balance.
**You’ll know it works when:** the second prints `rejected: double-spend with pending tx`.
**Where it comes from:** Chapter 6 — The Mempool & Block Validation.

**Lab 2.4 — Race the fork**
**Goal:** Resolve a double-spend by work.
**Do this:** In `fork.py`, extend the attack chain by one block; re-run the race.
**You’ll know it works when:** `max(chains, key=len)` flips the winner and the orphaned tx disappears.
**Where it comes from:** Chapter 7 — Double-Spend & the Longest-Chain Rule.

**Lab 2.5 — Prove inclusion without the block**
**Goal:** Verify one tx from log₂(n) hashes.
**Do this:** In `merkle.py`, prove `txs[2]`; flip one proof hash.
**You’ll know it works when:** the honest proof prints `True`, the flipped proof `False`.
**Where it comes from:** Chapter 8 — Merkle Trees: Efficient Verification.

## Stretch goals

**Lab 3.1 — Derive the address**
**Goal:** Walk the one-way chain.
**Do this:** In `wallet.py`, hash a public key into an address; try to walk back.
**You’ll know it works when:** the address reproduces; no inverse exists — the key is the account.
**Where it comes from:** Chapter 9 — Wallets & Addresses.

**Lab 3.2 — Pay for the rewrite**
**Goal:** Price a history rewrite.
**Do this:** Tamper an old block in `blockchain.py`; re-mine every block after it.
**You’ll know it works when:** the chain verifies again — and your clock prices the tamper.
**Where it comes from:** Chapter 3 — Proof of Work: Making Forging Expensive.

**Lab 3.3 — Add UTXO spending**
**Goal:** Spend an output wholesale.
**Do this:** Give a 5-coin output two outputs — 3 to bob, 2 back as change:

```python
outputs = [{"to": bob, "value": 3}, {"to": alice, "value": 2}]   # pay + change
```

**You’ll know it works when:** the input is consumed; the balance sums unspent outputs.
**Where it comes from:** Chapter 10 — What Real Blockchains Add.

**Lab 3.4 — Slash a double-signer**
**Goal:** Make cheating unprofitable.
**Do this:** In `pos.py`, have a validator double-sign; `slash` it.
**You’ll know it works when:** its stake drops, `slashed` is `True`, and selection drops it.
**Where it comes from:** Chapter 11 — The Energy Question & Proof of Stake.

## Self-checking without a grader

Expected output is the grader. If an observation cannot become an assert, the lab is loose.

```python
assert verify_chain(chain).startswith("block 1")     # Lab 1.1: the tamper is caught
assert forged.is_valid(alice_pub) is False           # Lab 2.2: the forgery is rejected
```

| Class of lab | How to check it yourself |
|---|---|
| Tamper detection (1.1, 1.2) | `verify` must fail after the edit |
| Mining cost (1.3, 3.2) | hashes and wall-clock from your run; ratios |
| Break-and-fix (2.2, 2.4, 2.5) | the tampered artefact fails the check the honest one passed |
| Open-ended (3.1, 3.3, 3.4) | flip an assumption; the observation must flip |

## What you now know

- Twelve labs, checkable by you alone — no grader needed.
- Warm-ups watch a chain break; builds watch an attack land.
- Stretch goals have many good answers.
- Doing the labs is the difference between reading about mining and mining.

Next: read the Bitcoin whitepaper (9 pages — this course expands it), then the Ethereum yellow paper’s EVM.