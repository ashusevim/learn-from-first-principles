---
layout: ../../layouts/Chapter.astro
title: 'Diffie–Hellman: Sharing Secrets Publicly'
description: 'The impossible-sounding trick: two strangers build a shared key on a public channel. Build: a DH exchange — then a man-in-the-middle attack.'
part: 'Part III — Public-Key Cryptography'
written: true
---

Everything through Chapter 7 needs a **shared secret** delivered in advance. For two
strangers on the internet — who have never met, whose entire channel is public —
that seemed impossible: how can you agree on a secret while an eavesdropper watches
every byte? Diffie–Hellman (1976) answered with modular arithmetic so simple you can
do it by hand, and its discovery created *public-key cryptography*. This chapter runs
the exchange, then breaks it with the man-in-the-middle attack that motivates
certificates.

## The lie you were told

> "You can't establish a secret over a public channel."

You can — if the underlying math is **asymmetric**: cheap one way, infeasible the
other. DH's one-way function is **modular exponentiation**:

```text
easy:   g^a mod p           (one multiplication chain, instant)
hard:   given g^a mod p, find a    ("discrete logarithm" — infeasible for big p)
```

## The exchange, step by step

Public parameters: a large prime `p` and a generator `g` — announced openly.

```text
Alice: picks secret a at random, sends A = g^a mod p      (public!)
Bob:   picks secret b at random, sends B = g^b mod p      (public!)

Alice computes: B^a mod p = g^(ab) mod p
Bob computes:   A^b mod p = g^(ab) mod p

Same number. The shared secret. An eavesdropper saw g, A, B — and cannot compute
g^ab from them without solving discrete log.
```

The paint-mixing analogy (which is *exact* in structure): both start with public
yellow paint, each adds their secret color, they swap mixtures, each adds their
secret color again — both end with the same mixture, while the eavesdropper holding
only the intermediate mixtures cannot un-mix. (Literal un-mixing is easy for paint
but infeasible for modular exponentiation — the analogy survives because of that.)

## Prove it to yourself

**1. The magic moment, by hand** — small numbers so you can verify:

```python
# dh.py — the exchange with tiny numbers (real ones are 2048+ bits)
p, g = 23, 5                       # public: prime p, generator g

a, b = 6, 15                       # the two secrets — NEVER transmitted
A, B = pow(g, a, p), pow(g, b, p)  # the public values
print("public:", A, B)

alice_secret = pow(B, a, p)        # B^a mod p
bob_secret   = pow(A, b, p)        # A^b mod p
print("alice's key:", alice_secret, "| bob's key:", bob_secret)
print("shared secret established:", alice_secret == bob_secret)   # 2 == 2 — magic
# eavesdropper knows p=23, g=5, A=17, B=19... and must find a or b. Discrete log.
```

**2. The eavesdropper's actual task** — brute-force the secret:

```python
for guess in range(1, p):
    if pow(g, guess, p) == A:
        print("found a =", guess, "→ key =", pow(B, guess, p))
        break
# trivial for p=23. For p of 2048 bits, this search outlives the solar system.
```

## The build: the exchange — then the man in the middle

```python
# mitm.py — DH is secure against LISTENING, not against SPEAKING
# Alice → "A" → [channel] → "B" → Bob    ...or so they think.

mallory = {}                       # the attacker: relays and rewrites

def exchange(alice_pub, bob_pub):
    # Mallory intercepts BOTH public values and substitutes her own:
    mallory["to_alice"], mallory["to_bob"] = g ** m % p, g ** m % p   # her key m
    alice_key = mallory["to_alice"] ** a % p     # Alice shares with... MALLORY
    bob_key   = mallory["to_bob"] ** b % p       # Bob shares with... MALLORY
    print("alice's key:", alice_key, "| bob's key:", bob_key)
    print("same secret?", alice_key == bob_key)  # False! But BOTH equal Mallory's key.
    return alice_key, bob_key

p, g = 23, 5
m = 4                              # Mallory's secret
a, b = 6, 15
alice_key, bob_key = exchange(g ** a % p, g ** b % p)
mallory_key = pow(g ** a % p, m, p)
print("mallory knows BOTH:", mallory_key == alice_key == bob_key)
# Mallory decrypts, reads, re-encrypts everything. Neither party can tell.
```

The output lands the lesson: **DH gives secrecy against eavesdroppers, and zero
authentication.** Mallory in the middle is invisible to the protocol itself. The
fix — proving whose public value is whose — needs signatures and a web of trust:
Chapter 10, and Chapter 11 shows TLS assembling the whole answer.

## What you now know

- **DH = two strangers agreeing on a secret over a public channel**, using modular
  exponentiation's asymmetry (easy forward, infeasible discrete log).
- The exchange defeats **eavesdroppers** completely — and does nothing against an
  **active attacker** who substitutes public values (MITM).
- Authentication is a separate promise (Chapter 1!), delivered by signatures and
  certificates — the next two chapters.
- This 1976 idea is inside every TLS connection you make: your browser and the
  server ran a DH exchange this very minute.

Next: DH solves *agreeing* on secrets; RSA solves *proving identity* and *sending to
strangers* — via a trapdoor built from the asymmetry of multiplication vs factoring.
