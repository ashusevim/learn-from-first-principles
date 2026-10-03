---
layout: ../../layouts/Chapter.astro
title: 'XOR & the One-Time Pad'
description: 'The only cipher with proven perfect secrecy — and the key-reuse mistake that breaks it. Build: an OTP, then crib-drag the two-time pad.'
part: 'Part II — Secret-Key Cryptography'
written: true
---

After two chapters of broken things, the first cipher that *provably works* — and
it's one operation: **XOR**. The one-time pad encrypts each byte of the message with
each byte of a truly random key, used exactly once. Claude Shannon proved in 1949
that it has **perfect secrecy**: the ciphertext reveals literally zero information
about the message. And it's almost never used — because its one requirement is
impossible at scale, and violating it is catastrophic. This chapter builds the pad,
proves the secrecy, and then breaks its famous misuse: the two-time pad.

## The lie you were told

> "Strong encryption is complicated math."

The mathematically strongest encryption possible is `ciphertext = message XOR key` —
no S-boxes, no rounds, no matrix multiplication. Its strength comes from one
property: the key is **truly random, as long as the message, used once**. The
complication in real cryptography exists precisely *because* we can't meet that
property at scale and must fake it.

## Why XOR gives perfect secrecy

XOR is its own inverse (`a ⊕ b ⊕ b = a`), so encryption and decryption are the same
operation. And the secrecy proof is one observation:

```text
ciphertext = message ⊕ key
for ANY target message M′, there EXISTS a key K′ = ciphertext ⊕ M′
    that would produce exactly this ciphertext.
```

So every possible plaintext of the right length is *equally consistent* with the
ciphertext you observed. The ciphertext gives an attacker **zero information** — not
"very hard", information-theoretically zero. That's perfect secrecy, and it's the
ceiling: no cipher can do better.

## The impossible requirement

The key must be: **truly random** (Chapter 3's entropy), **as long as the message**,
and **used exactly once** — hence "one-time". For a video call, you'd need gigabytes
of perfect randomness securely delivered to both ends *before* communicating. If you
can deliver that key securely, why not deliver the message the same way? The pad is
a beautiful theorem and an unusable product — which is why Chapters 5–9 build
machines that *approximate* it from a small key.

## Prove it to yourself

**1. Perfect secrecy, demonstrated** — same ciphertext, two "decryptions":

```python
def xor(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

ciphertext = xor(b"attack at dawn", b"\x51\x20\x33\x11\xab\xcd\xef\x12\x90\x8a\x77\x66\x55\x23")
print("as 'attack at dawn':", xor(ciphertext, b"\x51\x20\x33\x11\xab\xcd\xef\x12\x90\x8a\x77\x66\x55\x23"))
alt_key    = xor(ciphertext, b"retreat at noon"[:14])
print("as 'retreat at no':", xor(ciphertext, alt_key))
# both decodings are perfectly valid — the ciphertext is consistent with EVERYTHING.
# an attacker learns the message LENGTH. That is all. That's perfect secrecy.
```

**2. Key reuse, the catastrophic break:**

```python
# TWO-TIME PAD: the same key stream used twice. Don't. But watch what happens:
msg1, msg2 = b"attack at dawn", b"attack at noon"
key = b"\x51\x20\x33\x11\xab\xcd\xef\x12\x90\x8a\x77\x66\x55\x23"
c1, c2 = xor(msg1, key), xor(msg2, key)

leak = xor(c1, c2)          # the attacker XORs the two ciphertexts — KEY CANCELS!
print("c1 ⊕ c2 =", leak)
print("m1 ⊕ m2 =", xor(msg1, msg2))
# identical! c1 ⊕ c2 = m1 ⊕ m2 — the key is GONE from the equation.
# and m1 ⊕ m2 leaks structure: the spaces XOR to 0 where the words align.
```

## The build: crib-dragging the two-time pad

With `m1 ⊕ m2` known, the attacker drags a guessed word ("crib") along the leak —
wherever the result looks like English, the crib was there, revealing the other
message at that offset:

```python
# cribdrag.py — the two-time pad, broken by hand
leak = xor(msg1, msg2)                                  # what the attacker has

def crib_drag(leak, crib):
    out = []
    for off in range(len(leak) - len(crib) + 1):
        piece = xor(leak[off:off+len(crib)], crib)
        if all(32 <= c < 127 for c in piece):           # printable = probably right
            out.append((off, piece.decode()))
    return out

print(crib_drag(leak, b" at "))
# [(6, b'at noo'), ...]  — "at no..." appears: m2 reads "attack at noon..."
# each confirmed crib piece reveals more of BOTH messages. Game over.
```

That's the historical break of real intercepted traffic — VENONA, the program that
decrypted Soviet messages, worked exactly this way on reused pads.

## What you now know

- **XOR + truly random single-use key = proven perfect secrecy** (Shannon). The
  ciphertext is consistent with every message of that length.
- The key requirements — random, message-length, single-use — are **the impossible
  part**; real cryptography is the art of faking them from a small shared secret.
- **Key reuse is catastrophic**: the XOR of two ciphertexts equals the XOR of two
  plaintexts, and crib-dragging tears both open. Stream ciphers must NEVER repeat a
  keystream.

Next: how to fake the pad — stretch a small key into a long, non-repeating keystream
using nothing but a hash function. The stream cipher.
