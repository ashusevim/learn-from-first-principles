---
layout: ../../layouts/Chapter.astro
title: 'Decentralization: No Single Point of Trust'
description: 'Multiple nodes, same rules, no boss. Build: three nodes syncing blocks and agreeing on the longest chain.'
part: 'Part II — Trust Without Trust'
written: true
---

One miner with a chain is a puzzle; **many nodes with copies of the same chain** —
syncing, validating, and agreeing — is the decentralization that removes the single
point of trust. The distributed systems course's consensus (Chapter 5–7's Raft)
was for *trusted* nodes; the blockchain's consensus works with *untrusted* ones —
the longest chain with the most proof of work wins. This chapter builds three
nodes that sync and agree.

## The lie you were told

> "Decentralization means no rules."

Decentralization means **the rules are enforced by every node independently**:
each node validates every block (hash, difficulty, transactions), accepts the
longest valid chain, and rejects anything shorter. The "no boss" property comes
from everyone running the same validation code — not from the absence of rules.

## The longest-chain rule

```text
if two miners find blocks at the same time (a fork):
  the network temporarily splits — some nodes follow chain A, some chain B
  the NEXT block breaks the tie: whichever fork gets extended first becomes
  the longest, and the other fork's blocks are orphaned (discarded)
```

The rule's security: to rewrite history, the attacker must build a chain LONGER
than the honest network's — meaning more hash power than the entire network
combined. That's the 51% attack, and it's the security model's assumption.

## Prove it to yourself

**1. The fork and the resolution:**

```python
# two miners find blocks simultaneously → the chain forks:
# chain A: [..., block3a]    chain B: [..., block3b]
# the next miner to find a block extends ONE of them — say A:
# chain A: [..., block3a, block4]  → now longer → ALL nodes switch to A
# block3b is orphaned (its transactions return to the mempool)
```

## The build: three syncing nodes

```python
# nodes.py — three nodes, one chain, synced and validated (~40 lines)
import hashlib, json, time

def sha(data): return hashlib.sha256(data).hexdigest()

class Node:
    def __init__(self, name):
        self.name = name
        self.chain = [{"data": "genesis", "prev": "0" * 64, "hash": sha("genesis")}]
    def receive_block(self, block):
        if block["prev"] != self.chain[-1]["hash"]:
            return f"{self.name}: rejected (doesn't extend our chain)"
        if block["hash"] != sha(json.dumps(block, sort_keys=True).encode()):
            return f"{self.name}: rejected (hash mismatch)"
        self.chain.append(block)
        return f"{self.name}: accepted block {block['data']!r}"
    @property
    def height(self): return len(self.chain)

# three nodes, all starting from genesis:
nodes = [Node("alice"), Node("bob"), Node("carol")]

# alice mines a block and broadcasts it:
block1 = {"data": "alice pays bob 5", "prev": nodes[0].chain[-1]["hash"],
          "hash": sha("alice pays bob 5")}
for n in nodes: print(n.receive_block(block1))

# bob mines the next block:
block2 = {"data": "bob pays carol 3", "prev": block1["hash"],
          "hash": sha("bob pays carol 3" + block1["hash"])}
for n in nodes: print(n.receive_block(block2))

print(f"\nall nodes synced: {[n.height for n in nodes]}")
# all nodes synced: [3, 3, 3] — one chain, three copies, no boss.
```

## What you now know

- Decentralization = **every node validates every block independently** — the
  rules are enforced by consensus, not by a central authority.
- The **longest-chain rule** resolves forks: the most-work chain wins; the other
  fork is orphaned.
- The security model: rewriting history requires **more hash power than the honest
  network combined** (the 51% attack — Chapter 7's double-spend).

Next: the chain holds blocks of data — but who can WRITE? Transactions signed
with private keys, the cryptography course's Chapter 10 applied.
