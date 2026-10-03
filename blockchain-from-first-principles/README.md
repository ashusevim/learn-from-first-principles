# Blockchain from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a blockchain from first principles — hash-chained
blocks, proof-of-work mining, digital signatures, Merkle trees, the longest-chain
rule — breaking each naive construction on the way, and composing the defenses into
a working chain you mined yourself.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Cryptography](../cryptography-from-first-principles), [Databases](../databases-from-first-principles),
[Distributed Systems](../distributed-systems-from-first-principles), [Compilers](../compilers-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Chain**
1. What Is a Blockchain, Really? ✅
2. The Block: Hashes Chain History ✅
3. Proof of Work: Making Forging Expensive ✅

**Part II — Trust Without Trust**
4. Decentralization: No Single Point of Trust ✅
5. Transactions & Digital Signatures ✅
6. The Mempool & Block Validation ✅

**Part III — Beyond the Basics**
7. Double-Spend & the Longest-Chain Rule ✅
8. Merkle Trees: Efficient Verification ✅
9. Wallets & Addresses ✅

**Part IV — The Real World**
10. What Real Blockchains Add ✅
11. The Energy Question & Proof of Stake ✅
12. Final Boss: The Complete Blockchain in ~300 Lines ✅ *(txs, wallets, mining, tamper detection)*

All 12 chapters are fully written, each with runnable stdlib-Python builds and
tamper tests. Things you build along the way: the tamper-evident hash chain (and
the tamper that breaks it), proof-of-work mining with difficulty adjustment, three
syncing nodes, signed transactions with wallet-derived addresses, the mempool with
double-spend detection, the fork and longest-chain resolution, Merkle trees with
inclusion proofs, the wallet lifecycle — and the complete chain, verified and
tamper-tested.

## The rules of the course

1. **Start below the abstraction.** Before "invest in crypto", answer "what is a block, physically?"
2. **Break it to learn it.** Tamper with the chain, double-spend a coin — then see the defense.
3. **Build the real thing.** Mining, signatures, Merkle trees — all stdlib Python.
4. **Then the giants are readable.** Bitcoin's UTXO and Ethereum's contracts mapped onto your chain.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
