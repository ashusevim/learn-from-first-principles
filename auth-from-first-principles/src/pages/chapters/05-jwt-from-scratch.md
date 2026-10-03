---
layout: ../../layouts/Chapter.astro
title: 'JWT: Signed Claims'
description: 'The stateless model: claims signed with HMAC. Build: JWT header.payload.signature from scratch — verify, tamper, detect.'
part: 'Part II — Tokens'
written: true
---

The session (Chapter 3) stores state server-side — which breaks at scale (load
balancers, microservices: every server needs the session store, or sticky sessions).
**JWT** flips it: the server signs the user's claims and hands them back — *"this
is alice, logged in until 5pm" — signed by me*. No store; the signature *is* the
proof (the cryptography course, Chapter 10's signatures, applied). This chapter
builds a JWT from scratch, verifies it, and tampers with one.

## The lie you were told

> "JWT is encrypted."

JWT is **signed, not encrypted** — anyone can READ the claims (base64), nobody can
FORGE them (the signature needs the secret). Never put secrets in a JWT — only
claims the client may see: user id, roles, expiry.

## The structure: three base64 parts

```text
header.payload.signature

header:    {"alg": "HS256", "typ": "JWT"}     ← the signing algorithm (Ch 6 breaks it!)
payload:   {"sub": "alice", "exp": 1735689600} ← the claims (exp: expiry, Ch 3's session TTL)
signature: HMAC-SHA256(header.payload, secret) ← the crypto course's MAC (Ch 7!)

all three: base64url-encoded, joined with dots
```

The signature covers **header.payload together** — alter either and the signature
breaks. The verifier recomputes the HMAC and compares (constant-time — the crypto
course's Chapter 7 discipline).

## Prove it to yourself

**1. The claims are readable — by design:**

```python
import base64, json
token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGljZSJ9.sig"
header = json.loads(base64.urlsafe_b64decode(token.split(".")[0] + "=="))
print(header)     # {'alg': 'HS256', 'typ': 'JWT'} — anyone can read the claims!
# never put secrets in the payload: JWT is signed, not encrypted (Ch 1's secrecy vs the rest).
```

**2. Tampering, detected:**

```python
# change "sub": "alice" to "sub": "admin" and re-encode:
# the signature no longer matches → verification fails. The MAC (crypto Ch 7) catches it.
```

## The build: JWT from scratch

```python
# jwt.py — header.payload.signature, built and verified (~35 lines)
import base64, hashlib, hmac, json, time

SECRET = b"the-signing-secret-from-the-env"

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()
def b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

def make_jwt(claims, secret=SECRET):
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64url(json.dumps(claims).encode())
    signing_input = f"{header}.{payload}".encode()
    signature = b64url(hmac.new(secret, signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"

def verify(token, secret=SECRET):
    header_b64, payload_b64, sig_b64 = token.split(".")
    expected = b64url(hmac.new(secret, f"{header_b64}.{payload_b64}".encode(),
                               hashlib.sha256).digest())
    if not hmac.compare_digest(sig_b64, expected):       # constant-time (crypto Ch 7)
        return None                                      # TAMPERED or forged
    claims = json.loads(b64url_decode(payload_b64))
    if claims.get("exp", 1e18) < time.time(): return None   # expired (Ch 3's session TTL)
    return claims

token = make_jwt({"sub": "alice", "role": "user", "exp": time.time() + 600})
print("token:", token[:60], "...")
claims = verify(token)
print("verified claims:", claims)                        # {'sub': 'alice', ...}

# tamper: swap the payload, keep the old signature:
parts = token.split(".")
forged_payload = b64url(json.dumps({"sub": "admin", "exp": time.time() + 600}).encode())
forged = f"{parts[0]}.{forged_payload}.{parts[2]}"
print("forged verify:", verify(forged))                  # None — the MAC caught it
```

The forged token's payload says "admin" — and `verify` returns None, because the
HMAC over the modified payload doesn't match the old signature. **The signature
binds the claims**: change a claim, break the token.

## What you now know

- JWT = **base64url(header).base64url(claims).HMAC signature** — signed, not
  encrypted: claims are readable by anyone.
- The signature **binds header and payload** — tampering breaks verification
  (the crypto course's MAC, Chapter 7).
- Statelessness: the server stores nothing — the token *carries* the identity.
  The price: you can't logout a JWT before expiry (the store would be back) —
  Chapter 6's pitfalls and mitigations.

Next: the signature checks the algorithm — *from the attacker-controlled header*.
The alg=none attack, and the confusion attacks that broke real JWT libraries.
