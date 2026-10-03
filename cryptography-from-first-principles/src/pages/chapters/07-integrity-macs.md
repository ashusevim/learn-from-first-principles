---
layout: ../../layouts/Chapter.astro
title: 'Integrity: MACs & the Length-Extension Trap'
description: 'Encryption hides messages; MACs prove they weren’t altered. Build: the broken hash(key‖msg), then real HMAC.'
part: 'Part II — Secret-Key Cryptography'
written: true
---

Encryption (Chapters 5–6) delivers secrecy — and *only* secrecy. A network attacker
who can't read your ciphertext can still **flip bits** in it (Chapter 5's
malleability): your decrypted message changes, and nothing warns you. **Message
authentication codes** deliver integrity: a tag computed from the message *and* a
shared secret, such that any alteration breaks the tag. This chapter builds the
naive MAC — `hash(key ‖ message)` — breaks it with the length-extension attack, and
builds the real one: **HMAC**.

## The lie you were told

> "If it's encrypted, it's protected."

Secrecy and integrity are **independent promises** (Chapter 1). A bit-flipped
ciphertext decrypts to garbage (CTR mode) or *plausibly altered* text (CBC mode —
the change corrupts one block but the rest stays readable). Without a MAC, the
receiver cannot distinguish a real message from an attacker-modified one. The rule
every protocol since TLS 1.2 follows: **encrypt-then-MAC** — or an authenticated
mode (GCM) that does both.

## The naive MAC and its fatal flaw

Idea: `tag = SHA256(key ‖ message)`. The receiver recomputes with the shared key and
compares. Seems right — and the flaw is invisible until you know how Merkle–Damgård
hashes (SHA-256 included) work internally: they process the message **block by
block**, and the internal state after the last block is *the output itself*.

```text
SHA256(key ‖ message) ends in a state that is ALSO the start state for hashing
more data. So an attacker who knows (message, tag) can compute
    SHA256(key ‖ message ‖ anything)
WITHOUT THE KEY — appending to the message and forging a valid tag.
```

That's the **length-extension attack**: no key needed, just the original tag and
message, and it lets an attacker extend your authenticated request
(`?user=alice` → `?user=alice&admin=true`) with a valid tag.

## Prove it to yourself

**1. Malleability without a MAC** — the flip attack on Chapter 5's stream cipher:

```python
# flip.py — ciphertext tampering that survives decryption (no integrity!)
import hashlib

class StreamCipher:                                     # Chapter 5's cipher
    def __init__(self, key, nonce): self.key, self.nonce = key, nonce
    def keystream(self, n):
        out = b""
        for i in range((n // 32) + 1):
            out += hashlib.sha256(self.key + self.nonce + i.to_bytes(8, "big")).digest()
        return out[:n]
    def encrypt(self, msg): return bytes(a ^ b for a, b in zip(msg, self.keystream(len(msg))))

key, nonce = b"K"*32, b"N"*8
amount_msg = b"send amount: 100 to alice"
ct = StreamCipher(key, nonce).encrypt(amount_msg)

# attacker flips bits in the ciphertext: "100" → "999"
tampered = ct[:13] + bytes(a ^ b for a, b in zip(ct[13:16], b"999")) + ct[16:]
print(StreamCipher(key, nonce).decrypt(tampered))
# b'send amount: 999 to alice'  ← read perfectly. modified perfectly. undetected.
```

**2. Length extension, conceptually** — given `tag = H(key ‖ msg)` and knowing
`len(key)` (or brute-forcing a few lengths), the attacker computes `H` of
`key ‖ msg ‖ padding ‖ suffix` directly from `(msg, tag)` — appending `&admin=true`
with a valid tag. No key. That's a real CVE class in naive token designs.

## The build: HMAC, done right

HMAC's fix: hash in **two passes** with two derived keys, so the internal state can
never be reconstructed from the output:

```python
# hmacdemo.py — the broken MAC vs the real one (stdlib hmac)
import hashlib, hmac

key = b"shared-secret-key-32-bytes-long!"

def naive_mac(message):                                  # ← BROKEN. Length-extendable.
    return hashlib.sha256(key + message).hexdigest()

def real_mac(message):                                   # HMAC: two keys, two passes
    return hmac.new(key, message, hashlib.sha256).hexdigest()

msg = b"amount=100&to=alice"
tag = real_mac(msg)
print("tag:", tag[:16], "...")

# verify on the client:
print("valid:", hmac.compare_digest(tag, real_mac(msg)))
tampered = msg.replace(b"100", b"999")
print("tampered valid?:", hmac.compare_digest(tag, real_mac(tampered)))   # False — detected

# and unlike the naive MAC, HMAC's inner/outer passes block length extension:
print("naive tag of msg:", naive_mac(msg)[:16], "(extendable — see CVE history)")
print("hmac tag of msg: ", tag[:16], "(not extendable — inner state never exposed)")
```

Note `hmac.compare_digest` — constant-time comparison, so the check itself doesn't
leak how many leading bytes matched (a timing side channel — Chapter 3's
guessability, arriving through the CPU).

## What you now know

- **Secrecy ≠ integrity**: encrypted traffic can be tampered bit-by-bit, undetected.
- The naive `H(key ‖ msg)` is broken by **length extension** — Merkle–Damgård's
  block structure leaks the internal state.
- **HMAC** (two passes, derived keys) is the fix — plus `compare_digest` for
  constant-time checks. Encrypt-then-MAC or AEAD modes (GCM) compose both promises.

Next: everything so far needs a shared secret delivered in advance. The impossible-
sounding chapter: two strangers agreeing on a secret over a public channel —
Diffie–Hellman.
