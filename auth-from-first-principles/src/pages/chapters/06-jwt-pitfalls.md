---
layout: ../../layouts/Chapter.astro
title: 'JWT Pitfalls: alg=none & the Confusion Attacks'
description: 'The signature checks the ALGORITHM — from the attacker-controlled header. Build: the alg=none and RS256/HMAC confusion breaks.'
part: 'Part II — Tokens'
written: true
---

Chapter 5's verifier trusted one thing blindly: the **algorithm comes from the
token's header** — which the attacker controls. The famous JWT breaks exploit
exactly that: `alg: "none"` (no signature at all, "verified" by naive verifiers)
and the RS256/HMAC **confusion attack** (the verifier checks an HMAC using the
*public* RSA key as the HMAC secret — which the attacker knows). This chapter
performs both breaks on your own verifier.

## The lie you were told

> "The signature makes the JWT unforgeable."

The signature makes the JWT unforgeable **against an honest verifier** — one that
pins the algorithm. The naive verifier reads `alg` from the token and dispatches:

```python
alg = header["alg"]                    # ATTACKER-CONTROLLED!
if alg == "HS256": verify with HMAC secret
elif alg == "RS256": verify with RSA public key
elif alg == "none": ...accept without signature??    ← the 2015 CVE in every naive lib
```

The attacker changes the header to `alg: "none"`, deletes the signature, and the
naive verifier accepts the forged claims. The fix is one line — **pin the
algorithm** — but it broke real libraries (auth0's jwt-simple, multiple CVEs).

## The confusion attack, derived

The RS256/HMAC confusion: the server signs with RS256 (RSA private key) but the
*verifier* also accepts HS256 — verifying an HMAC with the **RSA public key** as
the HMAC secret. The public key is... public. The attacker signs their forged token
with the public key as the HMAC secret, sets `alg: HS256`, and the confused
verifier accepts:

```text
server:  signs RS256 with the private key         attacker can't forge these
attacker: signs HS256 with... the PUBLIC key       which is public!
verifier: "HS256? verify the HMAC with the public key" → matches. Forged. Accepted.
```

The lesson generalizes: **never let cryptographic material cross purposes** —
signature algorithms must be pinned, keys must not double as secrets.

## Prove it to yourself

**1. alg=none, against a naive verifier:**

```python
# naive.py — the verifier that trusts the header
import base64, hashlib, hmac, json

SECRET = b"the-signing-secret"

def b64url(data): return base64.urlsafe_b64encode(data).rstrip(b"=").decode()
def b64url_decode(s): return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def naive_verify(token):
    header_b64, payload_b64, sig_b64 = token.split(".")
    header = json.loads(b64url_decode(header_b64))
    if header["alg"] == "HS256":                        ← trusts the header!
        expected = b64url(hmac.new(SECRET, f"{header_b64}.{payload_b64}".encode(),
                                   hashlib.sha256).digest())
        ok = hmac.compare_digest(sig_b64, expected)
    elif header["alg"] == "none":
        ok = True                                       ← "unsigned: trust it" — THE HOLE
    return json.loads(b64url_decode(payload_b64)) if ok else None

# the honest token:
claims = {"sub": "alice", "exp": 1e18}
token = (b64url(json.dumps({"alg": "HS256"}).encode()) + "." +
         b64url(json.dumps(claims).encode()) + "." +
         b64url(hmac.new(SECRET, b64url(json.dumps({"alg": "HS256"}).encode()) + "." +
                         b64url(json.dumps(claims).encode()), hashlib.sha256).digest()))
print("honest:", naive_verify(token)["sub"])            # alice

# the forged token: alg=none, no signature:
forged = (b64url(json.dumps({"alg": "none"}).encode()) + "." +
          b64url(json.dumps({"sub": "admin"}).encode()) + ".")
print("forged:", naive_verify(forged)["sub"])           # admin — THE BREAK
```

## The build: the pinned verifier (the fix)

```python
# pinned.py — the verifier that PINS the algorithm
def pinned_verify(token, secret=SECRET):
    header = json.loads(b64url_decode(token.split(".")[0]))
    if header["alg"] != "HS256":                        ← PINNED: no negotiation
        return None                                     # "none" rejected here. The fix.
    payload_b64, sig_b64 = token.split(".")[1:]
    expected = b64url(hmac.new(secret, f"{token.split('.')[0]}.{payload_b64}".encode(),
                               hashlib.sha256).digest())
    if not hmac.compare_digest(sig_b64, expected): return None
    return json.loads(b64url_decode(payload_b64))

forged = (b64url(json.dumps({"alg": "none"}).encode()) + "." +
          b64url(json.dumps({"sub": "admin"}).encode()) + ".")
print("pinned verifier on forged:", pinned_verify(forged))   # None — REJECTED
```

One line — `if header["alg"] != "HS256": return None` — and both the alg=none and
the confusion attack die. The fix is always "pin the algorithm", because
**negotiating security parameters with the attacker is the bug**.

## What you now know

- The JWT breaks exploit **attacker-controlled algorithm negotiation** — the
  header chooses the verification path.
- **alg=none**: unsigned tokens accepted by naive verifiers. **Confusion**: the
  public key abused as an HMAC secret. Both die with a pinned algorithm.
- The meta-lesson: **never negotiate cryptographic parameters with untrusted
  input** — the cryptography course's rule, restated at the protocol layer.

Next: the same trust question, scaled up — "let this app access my data" without
sharing your password. OAuth 2.0, and the delegation problem.
