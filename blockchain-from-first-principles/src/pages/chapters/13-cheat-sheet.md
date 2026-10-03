---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Blockchain on One Page'
description: 'The chain, proof of work, signatures and forks on one page — the model, the invariants, and the ways naive chains break.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course on one page. Every row cites the chapter that derived it, and every row is a decision you must get right before you trust a chain.

## The one-page model

```text
  block N-1                    block N
 ──────────────────┐         ┌──────────────────┐
 │ prev_hash ───────┼────────▶│ prev_hash        │  the chain      (Ch 1–2)
 │ merkle_root      │         │ merkle_root      │  commits to txs (Ch 8)
 │ nonce            │         │ nonce            │  the mining var (Ch 3)
 ──────────────────┘         └──────────────────┘
   body: transactions            body: transactions
```

**A hash chain makes history tamper-evident; proof of work makes rewriting it expensive; signatures make spending authorized.** Everything else — wallets, mempools, forks, Merkle proofs — is engineering around those three.

## The chain primitives you actually use

| Primitive | What it is | The one line |
|---|---|---|
| `sha(json.dumps(header, sort_keys=True).encode())` | block hash | the header commits to prev_hash, nonce, txs (Ch 2) |
| `block.prev_hash == blocks[i-1].hash` | the link | one edit breaks every hash after it (Ch 1) |
| `hash.startswith("0" * difficulty)` | the PoW target | guess nonces; ×16 work per hex zero (Ch 3) |
| `sha(private + tx_data)` | signature (toy) | only the key holder can sign (Ch 5) |
| `verify(public, tx_data, signature)` | verification | forgery dies here, on every node (Ch 5) |
| `pending.sort(key=lambda t: -t["fee"])` | the fee queue | higher fee is mined sooner (Ch 6) |
| `if pending.amount + amount > balance: reject` | double-spend check | caught before mining (Ch 6) |
| `max(chains, key=len)` | longest-chain rule | the most-work fork wins; the other orphans (Ch 7) |
| `sha(hashes[i] + hashes[i+1])` | merkle pairing | log₂(n) hashes prove one transaction (Ch 8) |
| `address = sha(public)[:24]` | the address | the key is the account; no registration (Ch 9) |
| `select_proposer(seed)` | PoS proposer | stake-weighted, and randomized (Ch 11) |
| `slash(validator, evidence)` | PoS penalty | double-signing destroys the stake (Ch 11) |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Trusting a chain you never verified | a rewrite with recomputed hashes looks valid | Ch 1 |
| Hashing the body instead of the header | the nonce sits outside the hash, so mining cannot work | Ch 2 |
| A fixed difficulty | block times drift with hashrate; the chain stalls or floods | Ch 3 |
| "One node is enough" | a single copy is a single point of trust — and of lies | Ch 4 |
| Unsigned transactions | anyone can write "alice pays mallory everything" | Ch 5 |
| No balance check at the door | a validly signed overspend still enters a block | Ch 6 |
| Spending one output twice | the secret fork spends coins already spent | Ch 7 |
| Downloading a block to check one tx | O(n) where log₂(n) would do | Ch 8 |
| Serving a payment on one confirmation | the attacker only needs to outrun one block | Ch 7 |
| Storing a balance instead of deriving it | a stored number is a claim; the tx log is the truth | Ch 12 |
| "It is decentralized, so it is safe" | enough hash power rewrites history — the attack is economic | Ch 11 |

## When to use what

| Decision | Choose | Because |
|---|---|---|
| Who may spend | a signature over the tx (Ch 5) | the private key is the only authorizer |
| How expensive rewriting should be | the difficulty dial (Ch 3) | ×16 work per hex zero, retuned over time |
| Two valid chains appear | follow the most proof of work (Ch 7) | shorter forks orphan; the work is the vote |
| Is this payment final | wait for confirmations (Ch 7) | the catch-up probability decays by `(q/(1-q))**z` |
| A light client checks a tx | a Merkle proof, not the block (Ch 8) | log₂(n) hashes instead of the whole body |
| Where a balance lives | derived from the tx log (Ch 12) | a stored number is tamperable and meaningless |
| What secures the chain | electricity or stake (Ch 11) | the consensus mechanism is a swappable layer |
| What the toy still lacks | the UTXO model, the EVM (Ch 10) | data model and programmability, not the skeleton |

## Prove it to yourself

**1. Tampering cascades.** Change one byte in a block and the whole tail breaks:

```python
chain[1].transactions = ["alice pays bob 9999"]
print(verify_chain(chain))     # block 1: CONTENT tampered — and every later prev_hash is stale
```

**2. Difficulty is exponential.** Each hex zero multiplies the expected work by 16:

```sh
python3 -c "print(f'{16**3:,}', f'{16**5:,}', f'{16**6:,}')"   # 4,096 ... 1,048,576 ... 16,777,216 guesses
```

**3. A forged signature dies.** Sign with the wrong key and the network rejects:

```python
forged = Transaction(mallory_pub, bob_pub, 5, mallory_priv)
print(forged.is_valid(alice_pub))     # False — the sender never authorized it
```

## What you now know

- A blockchain is **a hash-chained list** — tamper-evident by construction, not by trust.
- **Proof of work makes rewriting history expensive; signatures make spending authorized.**
- Forks resolve by **work, not by vote** — the most-work chain is the truth.
- Balances are **derived from the transaction log**, never stored as facts.
- Every defense is economic in the end: the attack must cost more than it gains.

Next: the labs — twelve exercises that make you mine, tamper, double-spend and fork on your own machine.