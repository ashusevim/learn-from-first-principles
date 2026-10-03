---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the secure channel from Chapter 12 — hashes, ciphers, MACs, handshakes. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a digest, a refusal, or a decrypted sentence
from `secure.py` / the Chapter 12 `Channel`. Nothing here is new — hashes (Ch 2),
KDFs (Ch 3), ciphers (Ch 4–6), MACs (Ch 7), DH (Ch 8). What is new is playing the
attacker against your own code, with the defense one diff away.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. You are both parties and the wire: run alice and bob from
Chapter 12, and keep a third terminal as the attacker.

| Role | How you play it |
|---|---|
| alice / bob | the Chapter 12 scripts, unchanged unless told |
| the wire | copy a message, flip a byte, replay yesterday's bytes |
| the judge | `recv()` raising vs returning — refusal *is* the output |

## Warm-ups

**Lab 1.1 — The avalanche**
**Goal:** one input bit moves half the digest (Chapter 2's promise).
**Do this:**
```python
import hashlib
a = hashlib.sha256(b"transfer $100").hexdigest()
b = hashlib.sha256(b"transfer $101").hexdigest()
print(sum(x != y for x, y in zip(a, b)))   # count the differing hex chars
```
**You'll know it works when:** roughly half the 64 characters differ. Change one
more bit; the count stays near half. Diffusion is statistical, not poetic.
**Where it comes from:** Chapter 2 — Hashes: One-Way Functions.

**Lab 1.2 — Time the KDF**
**Goal:** slowness is the feature (Chapter 3) — measure it.
**Do this:** hash one password once with SHA-256, then run your KDF's full round
count, and time both with `time.perf_counter()`.
**You'll know it works when:** the KDF costs ~0.2s and the bare hash costs
microseconds — a factor of ~10⁵ per guess that multiplies every dictionary.
**Where it comes from:** Chapter 3 — Entropy, Passwords & Key Derivation.

**Lab 1.3 — Nonce reuse leaks the XOR**
**Goal:** two ciphertexts, one nonce — the plaintexts betray each other.
**Do this:** encrypt `b"aaaaaaaa"` and `b"bbbbbbbb"` with your Chapter 5 stream
shape under the *same* nonce, then XOR the two ciphertexts.
**You'll know it works when:** the result equals `b"aaaaaaaa" ^ b"bbbbbbbb"` —
the keystream cancelled, exactly as Chapter 5 warned. Never reuse; now you know
where the never comes from.
**Where it comes from:** Chapters 4–5.

## Builds

**Lab 2.1 — Flip a bit, meet the MAC**
**Goal:** integrity that actually refuses (Chapter 7).
**Do this:** send Chapter 12's three messages, capture the middle ciphertext,
flip one byte, deliver it to `recv()`:

```python
bad = bytearray(captured_ct); bad[7] ^= 0x01   # one flipped bit on the wire
chan.recv(sock_with(bytes(bad)))               # the tag no longer matches
```

**You'll know it works when:** `recv()` raises on the forged message — and the
untampered first and third still decrypt. One byte changed, zero bytes accepted.
**Where it comes from:** Chapter 7 — Integrity: MACs & the Length-Extension Trap.

**Lab 2.2 — Replay yesterday's message**
**Goal:** a valid tag is not a fresh message — find what your channel lacks.
**Do this:** record a full (nonce, ct, tag) triple from a session, open a *new*
session with fresh keys, and feed the old triple to the new `recv()`:

```python
old_nonce, old_ct, old_tag = recorded      # captured from yesterday's session
new_chan.recv(sock_with(old_nonce, old_ct, old_tag))   # fresh keys, stale message
```

**You'll know it works when:** it verifies — and that acceptance *is* the bug to
report. Sequence numbers bind freshness; your channel's `seq` restarts per
session, so name the fix (bind `seq` to the handshake nonce) in one sentence.
**Where it comes from:** Chapters 7 and 12.

**Lab 2.3 — Decrypt before verifying (then never again)**
**Goal:** feel why verify-first is load-bearing.
**Do this:** temporarily reorder `recv()` to decrypt-then-verify, feed it a
forged ciphertext, and log what the plaintext *would have been* before the tag
check fires.
**You'll know it works when:** the log shows attacker-shaped bytes the real code
path would have acted on. Restore verify-first; the log goes silent. Order is
the protocol.
**Where it comes from:** Chapter 7.

**Lab 2.4 — The handshake agrees**
**Goal:** two keypairs, one secret, both directions.
**Do this:** run `dh_keypair()` twice, complete the exchange both ways, and
derive the alice→bob and bob→alice keys with *different* labels:

```python
a_priv, a_pub = dh_keypair(); b_priv, b_pub = dh_keypair()
s_ab = shared(a_priv, b_pub); s_ba = shared(b_priv, a_pub)
k_ab = derive_key(s_ab, b"alice-to-bob", nonce)
k_ba = derive_key(s_ba, b"bob-to-alice", nonce)
```
**You'll know it works when:** `shared(a_priv, b_pub) == shared(b_priv, a_pub)`,
and the two directional keys differ from each other. Same secret in, separate
keys out — label discipline, demonstrated.
**Where it comes from:** Chapter 8 — Diffie–Hellman: Sharing Secrets Publicly.

**Lab 2.5 — Woman in the middle**
**Goal:** reproduce the Chapter 12 caveat on camera: unauthenticated DH agrees
with the attacker instead.
**Do this:** sit between alice and bob — complete one handshake with each,
relay the (re-encrypted) traffic, and read every message in the middle.
**You'll know it works when:** both endpoints report success while your middle
terminal prints their plaintext. No alarms, no errors: that silence *is* the
vulnerability signatures and certificates exist to close.
**Where it comes from:** Chapters 8, 10 and 12.

## Stretch goals

**Lab 3.1 — Time the `==`**
**Goal:** measure the leak that `compare_digest` closes (Chapter 7).
**Do this:** compare a correct tag against prefixes wrong at position 0 vs
position 31, timing a million iterations each with `perf_counter()`.
**You'll know it works when:** naive `==` shows a measurable gap and
`hmac.compare_digest` shows none. Nanoseconds become bytes become tags — the
whole chain, priced.
**Where it comes from:** Chapter 7.

**Lab 3.2 — Crack the toy, spare the real**
**Goal:** know exactly what "small parameters" cost (Chapters 8–9).
**Do this:** re-run the DH exchange with a tiny prime (8 bits), brute-force the
discrete log by trial multiplication, and recover the "secret".
**You'll know it works when:** the secret falls in milliseconds — and you can
state, in one sentence, which sizes move it from milliseconds to heat-death.
The math is identical; only the constants protect you.
**Where it comes from:** Chapters 8–9.

## Self-checking without a grader

- **Digest labs** (1.1–1.3): count differing chars (~32 of 64), time the KDF
  (~0.2s vs microseconds), XOR the two ciphertexts. Statistics and arithmetic
  are the judge.
- **Refusal labs** (2.1–2.3, 3.1): the output is a raised exception, an accepted
  replay you then explain, or a timing gap. A refusal you can trigger on demand
  is a defense you own.
- **Agreement labs** (2.4–2.5, 3.2): equality of the two shared secrets, readable
  middle traffic, recovered toy secret. The protocol either agrees or it tells
  you exactly where it stopped.

## What you now know

- **Your channel has a threat model you can recite:** bit flips refused (Lab 2.1),
  replays explainable (Lab 2.2), middles readable absent authentication (Lab 2.5).
- **Every constant is a security decision:** nonce uniqueness, label separation,
  round counts, key sizes (Labs 1.2, 1.3, 2.4, 3.2).
- **Order is not style:** verify-before-decrypt and KDF-before-use are the
  difference between a protocol and a suggestion (Lab 2.3).
- The distance from Chapter 12 to TLS is now countable: certificates in, MITM
  out — everything else you already built.

Next: read the TLS 1.3 handshake flight by flight and mark each message "have it
(Ch 12)", "missing (Ch 10)", until the RFC reads like a diff of your own code.
