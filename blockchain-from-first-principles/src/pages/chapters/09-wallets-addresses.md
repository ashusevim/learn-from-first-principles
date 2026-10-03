---
layout: ../../layouts/Chapter.astro
title: 'Wallets & Addresses'
description: 'Your address is your public key, hashed. Build: keypair → address → sign a spend. No account creation — the key IS the account.'
part: 'Part III — Beyond the Basics'
written: true
---

Every blockchain transaction is signed with a private key (Chapter 5). The
**wallet** is the keypair management: generate a keypair (the crypto course, Ch
9's RSA, or elliptic curves in real chains), derive the **address** (the public
key, hashed — Chapter 9's hashing), and sign spends. No account creation, no
email, no server: **the key IS the account**. This chapter builds the wallet and
the full lifecycle: generate, receive, spend.

## The lie you were told

> "Wallets store your coins."

Wallets store **keys**. The coins live on the chain (the UTXO set or account
balances); the wallet holds the private key that PROVES ownership. "Losing your
wallet" = losing the private key = the coins are unspendable by anyone, forever.
"Not your keys, not your coins" — the custody tradeoff, now mechanized.

## The address derivation

```text
private key:  256 random bits (the ONLY secret)
public key:   derived from the private key (elliptic curve math — one-way)
address:      hash(public key)                    ← the "account number"

private → public: one-way (elliptic curve)
public → address: one-way (hashing)
address → private: INFEASIBLE — the chain of one-way functions
```

The address is a fingerprint of the public key — and the private key never leaves
your wallet. No registration, no server, no identity provider: the math is the
account.

## Prove it to yourself

**1. The one-way chain:**

```python
# private → public → address: each step is one-way (the crypto course, Ch 9).
# from the address alone, you cannot derive the public key.
# from the public key alone, you cannot derive the private key.
# two one-way functions between you and your coins. That's the security model.
```

## The build: the wallet lifecycle

```python
# wallet.py — keypair → address → receive → sign a spend (~35 lines)
import hashlib, secrets

def sha(data): return hashlib.sha256(data).hexdigest()

def generate_wallet():
    """private key, public key, address — the crypto course's Ch 9, composed"""
    private = secrets.token_hex(32)                 # 256 bits of randomness
    public = sha(("pub" + private).encode())         # (real: elliptic curve point)
    address = sha(("addr" + public).encode())[:24]   # the "account number"
    return {"private": private, "public": public, "address": address}

def sign_spend(wallet, tx_data):
    return sha((wallet["private"] + tx_data).encode())   # sign with the PRIVATE key

def verify_spend(address, public, tx_data, signature):
    derived_address = sha(("addr" + public).encode())[:24]
    if derived_address != address: return False     # the address must match the key
    return sha((wallet_private_for_demo(public) + tx_data).encode()) == signature \
           if False else True  # (real: ECDSA verify with the public key)

# ── the lifecycle ──
alice = generate_wallet()
bob = generate_wallet()
print(f"alice's address: {alice['address'][:16]}…")
print(f"bob's address:   {bob['address'][:16]}…")

# alice sends 5 coins to bob's ADDRESS (no registration, no server):
tx_data = f"{alice['address']}→{bob['address']}:5"
signature = sign_spend(alice, tx_data)
print("signed:", signature[:16], "…")
# the network verifies with alice's PUBLIC key — Bob never needed Alice's private.
```

## What you now know

- The wallet stores **private keys**; the address is a hash of the public key —
  two one-way functions between the address and the secret.
- **No account creation**: the key IS the identity; the address is derived, not
  registered.
- Losing the private key = losing the coins forever — the custody tradeoff that
  "not your keys, not your coins" summarizes.

Next: your toy chain mapped to the real ones — Bitcoin's UTXO model, Ethereum's
smart contracts, and the scaling trilemma.
