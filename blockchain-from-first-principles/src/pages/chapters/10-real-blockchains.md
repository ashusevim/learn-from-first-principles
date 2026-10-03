---
layout: ../../layouts/Chapter.astro
title: 'What Real Blockchains Add'
description: 'Bitcoin’s UTXO model, Ethereum’s smart contracts, and the scaling trilemma — your toy chain mapped to the giants.'
part: 'Part IV — The Real World'
written: true
---

Your chain has the core: hash-chained blocks (Ch 1–2), proof of work (Ch 3),
decentralization (Ch 4), signed transactions (Ch 5), the mempool (Ch 6), the
longest-chain rule (Ch 7), Merkle trees (Ch 8), and wallet-derived addresses
(Ch 9). Real blockchains add **scale, programmability, and economics** to the same
skeleton. This chapter maps your toy chain to Bitcoin and Ethereum.

## The lie you were told

> "Bitcoin and Ethereum are fundamentally different technologies."

They share the skeleton (blocks, hashing, signatures, peer-to-peer). The
differences are in the **data model** and the **programmability**:

```text
BITCOIN (2009):  UTXO model — coins are unspent outputs, spent wholesale.
                 Script: a simple stack language for spending conditions.
                 Deliberately limited: no loops, no state — security through simplicity.

ETHEREUM (2015): Account model — balances per address (like a bank).
                 EVM: a Turing-complete virtual machine (the compilers course!).
                 Smart contracts: programs stored ON the chain, executed by every node.
```

## The UTXO model (Bitcoin)

Bitcoin doesn't track "balances" — it tracks **unspent transaction outputs
(UTXOs)**:

```text
alice received 5 BTC → a UTXO: {tx_hash, output_index: 0, value: 5, owner: alice_pk}

to send 3 BTC to bob:
  INPUT:  spend the 5-BTC UTXO (signed with alice's key)
  OUTPUTS: 3 BTC → bob (new UTXO), 2 BTC → alice (CHANGE, a new UTXO)

alice's balance = the SUM of her unspent UTXOs (computed, not stored)
```

Your chain used account balances (simpler); Bitcoin's UTXO model is parallelizable
(UTXOs are independent — no account lock contention) and privacy-friendly (new
address per transaction).

## Smart contracts (Ethereum)

A **smart contract** is a program stored ON the chain, executed by every node
(the compilers course's bytecode VM, Chapter 8, running ON the blockchain):

```text
contract: code + storage, at an ADDRESS on the chain
invoke:   a transaction TO the contract address, with function args
execution: every node runs the code → the SAME result (deterministic!) →
           the result is part of the consensus
gas:      every instruction costs gas — the metering that prevents infinite loops
          (Chapter 6 of the compilers course: loops need termination, enforced by money)
```

## The scaling trilemma

The famous tradeoff, visible in your own design decisions:

```text
DECENTRALIZATION: many nodes, no trust required (Ch 4)
SECURITY:         expensive to attack (Ch 3's PoW)
SCALABILITY:      high throughput                          ← pick TWO

more nodes → slower consensus; more security → more compute per tx;
more throughput → fewer nodes or fewer checks → less decentralization or security.
```

Your chain chose decentralization + security (like Bitcoin); Ethereum adds
scalability attempts (sharding, L2 rollups) — each a tradeoff against the other
two.

## What you now know

- Bitcoin = your chain with the **UTXO model** and a deliberately simple scripting
  language.
- Ethereum = your chain with an **account model** and a **Turing-complete VM**
  (the compilers course, running on-chain).
- The **scaling trilemma** is visible in your own design decisions — every chain
  picks two of three.
- The crypto course's primitives (hashes, signatures, KDFs) compose into all of it
  — the same atoms, different molecules.

Next: the energy question — proof of work burns electricity for security, and
proof of stake replaces it with economic stake.
