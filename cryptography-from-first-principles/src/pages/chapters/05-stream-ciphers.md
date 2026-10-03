---
layout: ../../layouts/Chapter.astro
title: 'Stream Ciphers: Expanding a Small Key'
description: 'The OTP needs a key as long as the message; keystream generators fake it. Build: a hash-based counter-mode stream cipher.'
part: 'Part II — Secret-Key Cryptography'
written: true
---

The one-time pad's fatal requirement — a key as long as the message — is what stream
ciphers fake. Take a **small shared key** (32 bytes), feed it with a counter into a
pseudo-random generator, and *expand* it into an arbitrary-length keystream that
passes for random. XOR as before. The secrecy is no longer information-theoretic —
it's computational: "breaking this would require predicting a hash function's
output." This chapter builds a real, usable stream cipher from nothing but
`hashlib`.

## The lie you were told

> "Stream ciphers generate random numbers."

They generate **pseudo**-random keystreams: deterministic given the key (both sides
must produce the identical stream!), computationally indistinguishable from random
*if the generator is good*. The entire security rests on the generator — which is
why RC4's slow statistical rot killed it, and why ChaCha20 is the modern standard.

## The design: a keyed generator with a nonce

The generator must never repeat its keystream for the same key. The fix: mix in a
**nonce** (number used once) per message — same key, different nonce, different
stream. Chapter 4's catastrophe becomes impossible *by construction*:

```text
keystream block i = H(key ‖ nonce ‖ i)         ← hash the key, nonce, and counter
ciphertext     = message ⊕ keystream            ← XOR as in the OTP
decryption     = regenerate the same keystream, XOR back
```

The counter means you can jump to any offset without computing earlier blocks — and
this construction (hash in counter mode) is a legitimate pattern, though real
deployments use purpose-built ciphers (ChaCha20, AES-CTR) with proven generators.

## Prove it to yourself

**1. The nonce saves Chapter 4's disaster:**

```python
# same key, different nonces → completely different keystreams:
# H(key ‖ nonce=1 ‖ 0) and H(key ‖ nonce=2 ‖ 0) share nothing (avalanche, Ch 2).
# c1 ⊕ c2 no longer cancels anything — the two-time pad attack finds no structure.
```

**2. Determinism is the feature:** both parties compute `H(key ‖ nonce ‖ i)`
independently and get the identical stream — no key transmission needed, just the
small key and the (public) nonce.

## The build: a working stream cipher

```python
# stream.py — a hash-based counter-mode stream cipher (stdlib only)
import hashlib

class StreamCipher:
    def __init__(self, key: bytes, nonce: bytes):
        self.key, self.nonce = key, nonce

    def keystream(self, length):
        out = b""
        counter = 0
        while len(out) < length:
            block = hashlib.sha256(self.key + self.nonce + counter.to_bytes(8, "big")).digest()
            out += block                                   # 32 bytes of keystream per block
            counter += 1
        return out[:length]

    def encrypt(self, plaintext: bytes) -> bytes:
        return bytes(p ^ k for p, k in zip(plaintext, self.keystream(len(plaintext))))

    def decrypt(self, ciphertext: bytes) -> bytes:
        return self.encrypt(ciphertext)                    # XOR is its own inverse

key = b"the shared secret key from Chapter 3's KDF!"[:32]
nonce = b"\x9f" * 8                                     # unique per message, public

cipher, decipher = StreamCipher(key, nonce), StreamCipher(key, nonce)
msg = b"meet at dawn by the old bridge"
ct = cipher.encrypt(msg)
print("ciphertext:", ct[:24], "...")
print("decrypted: ", decipher.decrypt(ct))
# ciphertext: b'\x93\xc4... (random-looking bytes — no structure survives, Ch 1!)
# decrypted:  b'meet at dawn by the old bridge'
```

That's a genuine, working cipher — messages between two parties who share only 32
bytes, unreadable to anyone without them. One caveat reveals the next chapter: the
attacker can **flip bits** in the ciphertext, and the corresponding plaintext bits
flip (XOR is malleable). Secrecy isn't integrity — Chapter 7 adds the MAC.

## What you now know

- Stream ciphers **expand a small key** into a keystream via a pseudo-random
  generator — the OTP's structure with practical keys, and a **nonce** to prevent
  reuse.
- Security is **computational**, not perfect: it rests on the unpredictability of the
  generator (Ch 2's avalanche, industrialized).
- XOR's **malleability** (bit flips propagate to plaintext) is the flaw that proves
  secrecy isn't integrity — Chapter 7's problem statement.

Next: the other great cipher shape — encrypt fixed-size *blocks* — and the famous
image that proves the mode of operation matters as much as the algorithm.
