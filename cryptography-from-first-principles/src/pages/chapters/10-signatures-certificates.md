---
layout: ../../layouts/Chapter.astro
title: 'Signatures & Certificates'
description: 'Authentication and non-repudiation, plus the trust-store chain that tames Chapter 8’s MITM. Build: sign, verify, chain.'
part: 'Part III — Public-Key Cryptography'
written: true
---

Chapter 8's man-in-the-middle broke Diffie–Hellman because nobody could prove whose
public value was whose. **Signatures** close that hole: a private-key operation on a
message that anyone can verify with the matching public key — unforgeable without
the private key, and **non-repudiable** (the signer can't later deny it, unlike a
MAC which anyone holding the shared key could have produced). **Certificates** then
answer the last question: "why should I trust this public key *is* the real
example.com's?" Build both, and the trust store finally makes sense.

## The lie you were told

> "Signatures are encrypted hashes."

Close enough to be useful, with one correction: a signature is a **private-key
operation** (RSA: exponentiate with d; modern: Ed25519) verified with the *public*
key. Encryption ran the other direction (public encrypts, private decrypts). The
verifiable guarantee is the point: only the private-key holder could have produced
it — and since the message itself is part of the math, the signature is bound to
*exactly this message* (hash it first; Chapter 2 returns).

```text
sign:   signature = Sign(private_key, hash(message))
verify: valid = Verify(public_key, hash(message), signature)   ← no private key needed
```

## Certificates: taming the MITM

The MITM attack (Chapter 8) works because the attacker publishes *their* key and
says "this is example.com". The fix — **certificates** — wraps each public key in a
signed statement: *"this key belongs to example.com" — signed by a Certificate
Authority (CA)*. Verification walks the chain: your browser's pre-installed **trust
store** (~150 CA root keys — the LLM course has none of this; the OS ships it) →
intermediate CA → the site's certificate. Any link failing signature verification →
the browser's warning page you've seen a hundred times.

```text
root CA (in your OS trust store)
  └─ signs → intermediate CA
               └─ signs → example.com's key      ← verify each link up the chain
MITM's self-made "certificate": no CA signs it → loud warning. MITM dead.
```

## Prove it to yourself

**1. Your machine already has the trust store:**

```sh
ls /etc/ssl/certs | wc -l          # hundreds of CA certificates, pre-installed
# every HTTPS warning you've ever seen = this chain failing to verify.
```

**2. The signature math, small-scale** — Chapter 9's RSA reversed:

```python
# sign.py — sign with the private key, verify with the public
n, e, d = 3233, 17, 2753            # from Chapter 9: public (n,e), secret d
message = "transfer 100 to alice"

from hashlib import sha256
h = int.from_bytes(sha256(message.encode()).digest()[:2], "big") % n   # hash → number
signature = pow(h, d, n)            # the private-key operation

# verification — anyone, no secret needed:
h_check = int.from_bytes(sha256(message.encode()).digest()[:2], "big") % n
print("valid:", pow(signature, e, n) == h_check)
tampered = message.replace("100", "999")
h2 = int.from_bytes(sha256(tampered.encode()).digest()[:2], "big") % n
print("tampered valid?:", pow(signature, e, n) == h2)   # False — bound to THIS message
```

**3. The MITM, re-run against a certificate** — Mallory substitutes her key; the
client asks "who signed this?" — Mallory's self-signed cert chains to nothing in
the trust store → rejected. The attack from Chapter 8 dies exactly there.

## The build: a toy certificate chain

```python
# chain.py — root CA signs an intermediate, which signs a server key
from hashlib import sha256

def sign(private_d, n, data):                       # Ch 9's signature (hash-then-sign)
    h = int.from_bytes(sha256(data.encode()).digest()[:2], "big") % n
    return pow(h, private_d, n)
def verify(public_e, n, data, signature):
    h = int.from_bytes(sha256(data.encode()).digest()[:2], "big") % n
    return pow(signature, e, n) == h

# three key pairs (Chapter 9's keygen, tiny):
root_key, root_pub = (777, 3233, 17), (3233, 17)    # the CA: in the trust store
mid_key,  mid_pub  = (911, 3599, 11), (3599, 11)
srv_key,  srv_pub  = (511, 4087, 7),  (4087, 7)

# the chain: root → intermediate → server, each link a signature over the NEXT key:
link1 = sign(777, 3233, "mid_pub=3599,11")          # root vouches for intermediate
link2 = sign(911, 3599, "srv_pub=4087,7")           # intermediate vouches for server

def verify_chain(server_data, link2, link1):
    ok_mid = verify(3233, 3599, "mid_pub=3599,11", link1)   # root in trust store? ✓
    ok_srv = verify(3599, 4087, "srv_pub=4087,7", link2)    # chain link verifies? ✓
    return ok_mid and ok_srv

print("chain valid:", verify_chain("srv_pub=4087,7", link2, link1))       # True
fake_link = sign(511, 4087, "srv_pub=4087,7")       # Mallory signs her OWN key...
print("mallory's chain:", verify(3233, 3599, "mid_pub=3599,11", fake_link))  # False
# her self-made "certificate" chains to no trusted root. The MITM is dead.
```

The trust store is the axiom the whole system rests on: ~150 keys your OS vendor
chose. Every HTTPS padlock on the web reduces to "some CA in this file vouched for
this key" — now you can read the chain yourself in any browser's certificate viewer.

## What you now know

- Signatures = **private-key hash signing, public verification** — authentication +
  non-repudiation (a MAC can't do the second: shared keys can't prove who spoke).
- Certificates = **signed statements binding keys to names**, chained to a
  pre-installed trust store — the structural fix for Chapter 8's MITM.
- The browser padlock = a chain of Chapter 9 signatures reaching your OS's trust
  store, verified on every HTTPS connection.

Next: every piece is built — DH (Ch 8), signatures (Ch 10), AEAD from Chapters 5–7.
TLS is their composition, and it runs billions of times a day. Dissect a live
handshake.
