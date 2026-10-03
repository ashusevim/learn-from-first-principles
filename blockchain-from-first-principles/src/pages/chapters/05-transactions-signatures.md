---
layout: ../../layouts/Chapter.astro
title: 'Transactions & Digital Signatures'
description: 'Spending requires proving ownership — the crypto course’s signatures, applied. Build: signed transactions verified by the network.'
part: 'Part II — Trust Without Trust'
written: true
---

The chain holds blocks of data — but *who can write*? Without identity, anyone
can add "alice pays mallory everything". The fix: **transactions signed with
private keys** — the cryptography course's Chapter 10 signatures, applied. Only
the holder of alice's private key can create a transaction spending alice's
balance, and every node verifies the signature before accepting the block.

## The lie you were told

> "Blockchain transactions are anonymous."

They're **pseudonymous**: your identity is a public key (hashed into an address),
not your name — but every transaction is publicly linked to that key. The privacy
is weaker than cash, stronger than a bank account (Chapter 9 of the crypto course:
the key IS the identity).

## The transaction

```text
{from: alice's address, to: bob's address, amount: 5, signature: Sign(alice_sk, tx_data)}

every node verifies: Verify(alice_pub, tx_data, signature) == True
  → only alice's private key could have produced this signature
  → the transaction is AUTHENTIC
```

## Prove it to yourself

**1. The signature, verified:**

```python
# sign with alice's private key, verify with her public key:
# a forged transaction ("alice pays mallory") signed by mallory: verification FAILS.
# the network rejects unsigned or wrongly-signed transactions. (Ch 10 crypto.)
```

## The build: signed transactions on the chain

```python
# tx.py — signed transactions, verified and chained (~40 lines)
import hashlib, secrets

def sha(data): return hashlib.sha256(data).hexdigest()

def keypair(seed=None):
    private = secrets.token_hex(32) if seed is None else sha(seed)
    public = sha(private.encode())          # toy key derivation (real: elliptic curves)
    return private, public

def sign(private, tx_data):
    return sha(private.encode() + tx_data.encode())   # toy signature (real: ECDSA)

def verify(public, tx_data, signature):
    return sign(public, tx_data) == signature         # (real: ECDSA verify)

class Transaction:
    def __init__(self, sender_pub, receiver_pub, amount, private_key):
        self.sender = sha(sender_pub.encode())[:16]   # the address (Ch 9)
        self.receiver = sha(receiver_pub.encode())[:16]
        self.amount = amount
        self.tx_data = f"{self.sender}{self.receiver}{amount}"
        self.signature = sign(private_key, self.tx_data)
    def is_valid(self, sender_pub):
        return verify(sender_pub, self.tx_data, self.signature)

alice_priv, alice_pub = keypair("alice-seed")
bob_priv, bob_pub = keypair("bob-seed")

tx = Transaction(alice_pub, bob_pub, 5, alice_priv)
print("alice's tx valid:", tx.is_valid(alice_pub))     # True — she signed it

# mallory tries to spend alice's coins with HIS key:
mallory_priv, mallory_pub = keypair("mallory-seed")
forged = Transaction(mallory_pub, bob_pub, 5, mallory_priv)
print("mallory's forgery valid:", forged.is_valid(alice_pub))   # False — rejected
```

## What you now know

- Transactions are **signed by the sender's private key** — verified by every node
  with the sender's public key.
- The **address** is derived from the public key (Chapter 9's wallets) —
  pseudonymous, publicly linked.
- Forgery dies at signature verification: the private key is the only way to
  produce a valid signature (the crypto course's Chapter 10, applied).

Next: transactions queue in the **mempool** before being mined — and the mempool
must reject double-spends before they enter a block.
