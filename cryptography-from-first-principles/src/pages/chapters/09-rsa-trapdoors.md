---
layout: ../../layouts/Chapter.astro
title: 'RSA: Trapdoors from Factoring'
description: 'Multiply two primes: easy. Factor the product: hard. Build: textbook RSA from scratch — and why textbook RSA is dangerous.'
part: 'Part III — Public-Key Cryptography'
written: true
---

DH (Chapter 8) lets strangers *agree* on a shared key — but it's interactive, and it
doesn't let anyone *verify* who they're talking to. **RSA** (1977) delivers both with
a different one-way function: **multiplication is easy, factoring is infeasible**.
This chapter builds textbook RSA from scratch — key generation, encryption,
decryption, signatures — watches it work with tiny numbers, and then explains why
"textbook RSA" is a famous trap that has broken real systems.

## The lie you were told

> "RSA encrypts with the public key using the same math as decryption."

The *shape* is symmetric and beautiful; the *security* is entirely in the padding
scheme wrapped around it. Textbook RSA — the raw math — is deterministic, malleable
(Chapter 5's bit-flipping, in multiplicative form), and only encrypts numbers smaller
than the modulus. Real RSA = textbook RSA + OAEP padding, or textbook signatures +
PSS padding. Learn the math here; never deploy it bare.

## The key generation: a trapdoor from two primes

```text
1. pick two large primes, p and q            (secret!)
2. n = p·q                                    (public — the modulus)
3. φ(n) = (p−1)(q−1)                          (secret — Euler's totient)
4. pick e with gcd(e, φ(n)) = 1              (public — usually 65537)
5. find d with e·d ≡ 1 (mod φ(n))            (secret — the private exponent)

encrypt: c = m^e mod n          decrypt: m = c^d mod n
```

The magic: `(m^e)^d = m^(e·d) ≡ m (mod n)` — because e·d ≡ 1 (mod φ(n)), and Euler's
theorem makes the exponents cycle. **The trapdoor**: knowing φ(n) (which requires
knowing p and q) makes computing d trivial; everyone else would have to factor n —
infeasible for 2048-bit n. Encryption needs only (e, n); decryption needs d, which
needs the factorization.

## Prove it to yourself

**1. The full cycle, with small numbers:**

```python
# rsa.py — textbook RSA from scratch (tiny numbers; real: 2048+ bits)
from sympy import isprime, nextprime   # (or hand-check primality for the demo)

p, q = 61, 53                          # two primes — the secret
n = p * q                              # 3233 — the public modulus
phi = (p - 1) * (q - 1)                # 3120 — the secret totient
e = 17                                 # public exponent (coprime with 3120)
d = pow(e, -1, phi)                    # the secret: e's modular inverse = 2753

print(f"n={n} (public), e={e} (public), d={d} (SECRET)")

m = 65                                 # "A" as a number
c = pow(m, e, n)                       # encrypt with the PUBLIC key
print("ciphertext:", c)                # 2790
print("decrypted:", pow(c, d, n))      # 65 — only d (needing φ) recovers it
```

**2. Why an eavesdropper fails** — they know n=3233, e=17, c=2790. To decrypt they
need d — which needs φ(n) — which needs **factoring 3233**. For tiny n, that's easy
(3233 = 61 × 53); for 2048-bit n, it's the hardest well-known problem in the field.

**3. Signatures are the same math, reversed:**

```python
signature = pow(m, d, n)               # sign with the SECRET key
verified = pow(signature, e, n) == m   # verify with the PUBLIC key
print("signature valid:", verified)    # only d could produce it: authenticity!
```

## The build: textbook RSA, then the two famous breaks

```python
# rsabreaks.py — deterministic RSA is malleable and guessable
# (tiny numbers again — the attacks scale up with the modulus)

# attack 1: DETERMINISM — same message, same ciphertext. A guessing dictionary (Ch 3)
# works on small message spaces: encrypt every candidate, compare ciphertexts.
e, n = 17, 3233
c_of_yes = pow(int.from_bytes(b"YES", "big"), e, n)
for guess in (b"YES", b"NO!", b"MAYB"):
    if pow(int.from_bytes(guess, "big"), e, n) == c_of_yes:
        print(f"guessed the message: {guess}")       # "YES" — no private key needed

# attack 2: MALLEABILITY — RSA is multiplicatively homomorphic:
m1, m2 = 4, 3
c1, c2 = pow(m1, e, n), pow(m2, e, n)
print("c1 × c2 decrypts to m1 × m2:", pow(c1 * c2, e and 1 or 1, 0) if False else
      pow((c1 * c2) % n, d if False else 2753, n))   # 12 = 4 × 3 — a forged product!
# (padding schemes like OAEP randomize and structure the input, killing both attacks.
#  THE LESSON: the raw math is a tool; the protocol around it is the security.)
```

## What you now know

- RSA's trapdoor: **factoring n** recovers the private key — easy to multiply, assumed
  infeasible to factor at 2048+ bits.
- **Encrypt with public, decrypt with private; sign with private, verify with
  public** — the same modular exponentiation, two directions, two promises
  (confidentiality / authenticity + non-repudiation).
- **Textbook RSA is unsafe**: deterministic (dictionary attacks) and malleable
  (homomorphic forging). Real RSA = padding (OAEP/PSS) — the protocol around the
  math.
- Next chapter's certificates will solve Chapter 8's MITM — but note RSA's 2020s
  footnote: quantum computers threaten factoring (Shor's algorithm), and the field is
  migrating to post-quantum schemes.

Next: Chapter 8's MITM attack versus Chapter 9's signatures — the collision that
produces certificates, the trust store, and the web's whole identity system.
