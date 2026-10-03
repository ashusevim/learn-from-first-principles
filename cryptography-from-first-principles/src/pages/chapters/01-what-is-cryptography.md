---
layout: ../../layouts/Chapter.astro
title: 'What Is Cryptography, Really?'
description: 'Three promises — secrecy, integrity, authenticity — and the Caesar cipher that delivers none of them. Build: a cipher and its frequency-analysis break.'
part: 'Part I — Foundations'
written: true
---

Cryptography is usually taught as a museum of algorithms. Reframe it as a **set of
promises** — because that's what it is:

```text
SECRECY:       nobody but the intended party can read the message
INTEGRITY:     nobody can alter the message without detection
AUTHENTICITY:  you can prove who sent it (and they can't deny it)
```

Every protocol in this course — every cipher, hash, and key exchange — delivers one
or more of these promises. "Encryption" only delivers the first. This chapter builds
the oldest cipher in the book, keeps the first promise *badly*, and then breaks it
the way a nine-year-old with a newspaper can — because **breaking weak crypto is how
you learn to recognize strong crypto**.

## The lie you were told

> "Encryption means the message is secure."

Encryption only *claims* secrecy — and depending on the cipher, the claim may be
worthless. The Caesar cipher "encrypts" by shifting every letter three places. It
delivers secrecy against a distracted Roman centurion and nobody else. Security is a
property of the whole construction, and constructions get broken.

## The Caesar cipher, built

```python
# caesar.py — the oldest cipher: shift every letter by k
def encrypt(text, k=3):
    out = []
    for ch in text.upper():
        if "A" <= ch <= "Z":
            out.append(chr((ord(ch) - ord("A") + k) % 26 + ord("A")))
        else:
            out.append(ch)                       # spaces/punctuation unchanged (a leak!)
    return "".join(out)

def decrypt(text, k=3):
    return encrypt(text, -k)

secret = encrypt("attack at dawn", 3)
print(secret)            # DWWDFN DW GDZQ
print(decrypt(secret, 3)) # ATTACK AT DAWN
```

Two immediate leaks, visible in the output: **word lengths and punctuation survive**,
and repeated letters map to repeated letters ("ATTACK" has three Ts → "DWWDFN" has
three Ws). Structure is information — the first lesson of cryptanalysis.

## The break: frequency analysis

English has a fingerprint: E is the most common letter (~12%), T second (~9%), Z
almost never (~0.07%). Shift the alphabet and the fingerprint shifts with it. Count
letters in the ciphertext, match the tallest spike to E, read off the key:

```python
# crack.py — frequency analysis: the Caesar cipher has no chance
from collections import Counter

def crack(ciphertext):
    counts = Counter(c for c in ciphertext if "A" <= c <= "Z")
    common = counts.most_common()
    print("ciphertext letter frequencies:", common)
    most_common_cipher_letter = common[0][0]
    key = (ord(most_common_cipher_letter) - ord("E")) % 26   # guess: it's E
    return key

ciphertext = encrypt("the quick brown fox jumps over the lazy dog and the end of the story", 11)
key = crack(ciphertext)
print(f"guessed key: {key} → {decrypt(ciphertext, key)}")
# guessed key: 11 → THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND THE END OF THE STORY
# broken in ~10 lines, no secret key needed, works on ANY message long enough.
```

Twenty-six possible keys means brute force also works instantly — but frequency
analysis is the more important lesson: **structure survives bad encryption**. Every
real attack in this course exploits some surviving structure.

## The promises, scored

| Promise | Caesar delivers? | Why |
|---|---|---|
| Secrecy | ✗ | frequency analysis + 26-key brute force |
| Integrity | ✗ | any letter can be flipped; nobody can tell |
| Authenticity | ✗ | anyone with the cipher can produce a "valid" message |

And that scoring table is the shape of the entire course: each chapter adds a
primitive, checks which promises it delivers, and finds the attack that breaks the
naive use of it. The finals — TLS and your own secure channel — are the composition
that finally scores three ✓s.

## What you now know

- Cryptography = **three promises**: secrecy, integrity, authenticity. "Encrypted"
  only addresses the first.
- The Caesar cipher fails because **structure survives**: letter frequencies, word
  lengths, repeats.
- **Breaking weak constructions is the curriculum** — you'll crack this one, the
  two-time pad, ECB, and a broken MAC in the coming chapters.

Next: the first primitive worth trusting — not an encryption at all, but a one-way
function. The hash.
