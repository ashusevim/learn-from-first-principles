---
layout: ../../layouts/Chapter.astro
title: 'Hashes: One-Way Functions'
description: 'Avalanche, preimage resistance, commitments — why hashing isn’t encryption. Build: a hash commitment you can’t reneg on.'
part: 'Part I — Foundations'
written: true
---

A cryptographic hash — SHA-256 — takes any input and produces 32 bytes of output with
three extraordinary guarantees: it's **one-way** (you can't reverse it), **collision-
resistant** (you can't find two different inputs with the same output), and
**avalanching** (flip one input bit, half the output bits flip). Notice what's
missing: there's **no key and no way back**. A hash isn't encryption at all — it's a
*one-way fingerprint machine*, and its uses (commitments, password checks,
signatures, blockchains) all flow from those guarantees.

## The lie you were told

> "I hashed the message, so it's encrypted."

Hashing is **not** encryption: there's no key, no decryption, no getting the original
back. People "decrypt hashes" — meaning they *guess* inputs until one matches. That's
the only path back, and its difficulty **is** the security. The three guarantees,
stated as attacks that fail:

```text
preimage resistance:    given H(x), find any x′ with H(x′) = H(x)      ← infeasible
second-preimage:        given x, find x′ ≠ x with H(x′) = H(x)         ← infeasible
collision resistance:   find ANY pair x ≠ x′ with H(x) = H(x′)         ← infeasible
```

## The avalanche, demonstrated

Change one input bit; half the output bits should flip, unpredictably:

```python
# avalanche.py — one input bit flips → half the output bits flip, chaotically
import hashlib

def bits(b): return [int(bit) for byte in b for bit in f"{byte:08b}"]

a = hashlib.sha256(b"attack at dawn").digest()
b = hashlib.sha256(b"attack at dawo").digest()   # last letter changed by 1 bit
ba, bb = bits(a), bits(b)
flipped = sum(x != y for x, y in zip(ba, bb))
print(f"{flipped}/{len(ba)} output bits flipped ({flipped/len(ba):.0%})")
# ~128/256 ≈ 50% — and WHICH bits flip is unpredictable. Fingerprints, not encodings.
```

That unpredictability is why hash outputs look random and serve as fingerprints:
identical inputs give identical hashes (verifiable!), but the output reveals nothing
about the input's structure.

## The build: a commitment scheme

One of the purest hash uses: prove you made a decision *before* revealing it —
without revealing it early. (The bit-behind-rock-paper-scissors, sealed bids,
coin-flipping over the phone.)

```python
# commit.py — commit to a choice now, reveal later, with no take-backs
import hashlib, secrets

def commit(choice):
    nonce = secrets.token_hex(16)                    # random salt (why: Ch 3!)
    seal = hashlib.sha256((nonce + choice).encode()).hexdigest()
    return seal, nonce                               # publish the seal; keep the nonce

def reveal(seal, nonce, choice):
    return hashlib.sha256((nonce + choice).encode()).hexdigest() == seal

# Alice commits:
seal, nonce = commit("rock")
print("Alice publishes the seal:", seal[:16], "...")  # binds her choice; hides it

# Bob announces his play: "scissors"

# Alice reveals — she CANNOT claim she committed to "paper":
print("honest reveal:", reveal(seal, nonce, "rock"))          # True
fake_nonce = secrets.token_hex(16)
print("cheating reveal:", reveal(seal, fake_nonce, "paper"))  # False — no valid nonce exists
```

To cheat after seeing Bob's play, Alice would need a nonce making "paper" hash to her
published seal — that's preimage resistance, working as intended. The nonce matters
because without it, Alice could hash all three choices *upfront* and pick a seal that
hides her choice ambiguously — a preview of Chapter 3's lessons about guessability.

## What you now know

- Hashes are **one-way fingerprints**: one-way, collision-resistant, avalanching —
  and there's no key and no decryption.
- "Decrypting a hash" means **guessing until it matches**; the guess cost is the
  security.
- Commitment schemes — prove-then-reveal — fall straight out of the guarantees, and
  reappear inside passwords (Ch 3), signatures (Ch 10), and blockchains.

Next: the commitment's weakness — "rock" hashes the same every time — is the same
weakness every password system has. The fix is entropy, salts, and making guessing
slow. Key derivation.
