---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Cryptography on One Page'
description: 'Hashes, ciphers, MACs and key exchange on one page — the model, the primitives, the combinations that are safe, and the ones that are not.'
part: 'Part V — Practice & Reference'
written: true
---

Every primitive in this course answers one question: **what does the attacker get
to choose?** Fix the attacker's powers first; the primitive follows. The four
questions, the four answers, and every composition the course declared safe.

## The one-page model

```text
  attacker chooses…            you need…            primitive        chapter
  the input, sees the output   a fingerprint        hash (SHA-256)     Ch 2
  everything except the key    reversible secrecy   cipher (stream/block) Ch 4–6
  the message in transit       unforgeability       MAC (HMAC)         Ch 7
  the whole network            a shared secret      DH + KDF → channel Ch 8–12
```

Secrecy without integrity is a suggestion; integrity without secrecy is a
postcard. The secure channel (Chapter 12) is `DH → KDF → encrypt-then-MAC`,
in that order, and every reordering is a named attack.

## The cryptography you actually use

| Primitive | Contract | In your build |
|---|---|---|
| `SHA256(x)` | one-way, collision-resistant fingerprint | Ch 2 |
| password + salt + 600k rounds | guessing costs what hashing costs, per user | Ch 3 |
| `keystream = SHA256(key ‖ nonce)` + XOR | a stream cipher from one hash (Ch 5's shape) | Ch 4–5 |
| block cipher + CBC/CTR (never ECB) | blocks that hide patterns, with a fresh IV | Ch 6 |
| `HMAC(key, msg)` + `compare_digest` | the tag, checked in constant time | Ch 7 |
| `encrypt-then-MAC` | ciphertext first, tag over nonce + ct | Ch 7, 12 |
| `dh_keypair()` → shared secret | the same number on both ends, seen by all | Ch 8 |
| `derive_key(shared, label, nonce)` | one secret in, per-direction keys out | Ch 3, 12 |
| RSA encrypt / RSA sign | trapdoor both directions, padding mandatory | Ch 9 |
| signatures + certificate chain | identity you can verify without trusting the wire | Ch 10 |
| `Channel.send/recv` over a socket | seq-nonce, encrypt, MAC, verify, decrypt | Ch 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| ECB mode on structured data | the penguin survives encryption — patterns leak | Chapter 6 |
| `==` on MAC tags | timing leaks the tag byte by byte | Chapter 7 |
| MAC-then-encrypt or encrypt-and-MAC | padding oracles and tag stripping | Chapter 7 |
| Reusing a nonce with one key | two ciphertexts XOR to two plaintexts XOR | Chapters 5, 12 |
| Textbook RSA without padding | malleability: forged ciphertexts, forged signatures | Chapter 9 |
| DH without authentication | the MITM agrees with everyone (your Ch 12 caveat) | Chapters 8, 12 |
| `password → SHA256 → store` | one GPU, every dictionary, all users at once | Chapter 3 |
| Putting secrets in JWT-style claims | signed is not encrypted — the claims are public | Chapters 10–11 |
| Verifying the tag after decrypting | the attacker already chose your plaintext's shape | Chapter 7 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| Store a password | salt + memory-hard KDF, never a bare hash | you need the password back — then you need a vault (Ch 3) |
| Bulk secrecy | a stream cipher or CTR with unique nonces | blocks must be random-access — still CTR, never ECB (Ch 6) |
| "Did this change?" | HMAC with its own key, constant-time check | public verifiability — signatures, not MACs (Ch 10) |
| Two strangers, one secret | DH + KDF with per-direction labels | the network is hostile — authenticate or accept MITM (Ch 8) |
| Move a key, not data | RSA-KEM / hybrid, padding on | the key is long-lived — rotate via the channel (Ch 9) |
| Everything at once | TLS: the Chapter 11 handshake, then a Chapter 12 channel | you must explain each step — then build Ch 12 by hand (Ch 11) |

## Prove it to yourself

**1. ECB draws the penguin:**

```python
from Crypto.Cipher import AES           # or your Chapter 6 block cipher
img = open("penguin.ppm", "rb").read()  # any structured bytes do
ct = AES.new(key, AES.MODE_ECB).encrypt(pad(img))
open("penguin_ecb.ppm", "wb").write(header + ct)   # shapes survive — Ch 6's meme
```

**2. One flipped bit, two fates:**

```python
tag1 = hmac.new(key, b"transfer $100", hashlib.sha256).digest()
tag2 = hmac.new(key, b"transfer $900", hashlib.sha256).digest()
print(tag1 == tag2, hmac.compare_digest(tag1, tag2))  # False False — unforgeable, safe compare
```

**3. The DH handshake agrees with itself:**

```python
a_priv, a_pub = dh_keypair()            # your Chapter 8 functions
b_priv, b_pub = dh_keypair()
print(shared(a_priv, b_pub) == shared(b_priv, a_pub))  # True — different paths, one secret
```

## What you now know

- **Name the attacker's powers first:** chosen input, chosen message, the whole
  network — each row of the model is one threat level answered.
- **Order is the protocol:** KDF before use, encrypt before MAC, verify before
  decrypt. Reorderings have names because they have victims (Ch 7, 12).
- **Constants are load-bearing:** unique nonces, per-direction labels, fresh IVs —
  reuse any of them and the math quietly stops protecting you.
- The channel you built *is* TLS's core minus authentication — which is why the
  MITM caveat, not the cipher, is the chapter's last word.

Next: twelve labs that attack your own channel — flip bits, reuse nonces, and
play the woman in the middle against Chapter 12.
