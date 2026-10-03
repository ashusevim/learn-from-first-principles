---
layout: ../../layouts/Chapter.astro
title: 'OpenID Connect: Who Are You?'
description: 'OAuth says what you may access; OIDC says who you are. Build: an ID token decoded, claims verified.'
part: 'Part III — Delegation'
written: true
---

OAuth (Chapter 7) delegates *access* — but "sign in with Google" needs *identity*:
who is the user, what's their email, are they verified? **OpenID Connect (OIDC)**
is OAuth + an identity layer: the provider issues an **ID token** — a JWT (Chapter
5!) whose *claims* say who you are — alongside the access token. This chapter
decodes an ID token and verifies the claims the right way.

## The lie you were told

> "OAuth and OpenID Connect are the same thing."

The distinction, precisely:

```text
OAuth 2.0:  "may this app access my photos?"     → ACCESS TOKEN → the API
OIDC:       "who is this user?"                  → ID TOKEN → the client's identity check

access token:  opaque or JWT, FOR THE API, scopes like "photos:read"
ID token:      ALWAYS a JWT, FOR THE CLIENT, claims like {"sub": "alice",
               "email": "a@x.com", "email_verified": true}
```

The ID token is Chapter 5's JWT structure, signed by the provider — the client
*verifies the signature* (with the provider's public key, from a published JWKS
endpoint — the crypto course's trust chain) and reads the claims. The claims ARE
the login.

## The claims that matter

```text
iss:   who issued the token (must match your configured provider URL)
sub:   the subject — the STABLE user id (never the email: emails change)
aud:   the audience — must match YOUR client_id (tokens for other apps rejected)
exp:   expiry (Chapter 3's session TTL, Chapter 5's JWT exp)
email, email_verified:  the profile claims
```

The verification checklist is the JWT verifier (Chapter 5) plus **aud and iss
checks** — a token signed correctly but issued *for a different app* must be
rejected (the confusion attack, Chapter 6, in OIDC clothing).

## Prove it to yourself

**1. The claims, decoded:**

```python
import base64, json
id_token = "eyJhbGciOiJIUzI1NiJ9." \
           "eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMTEiLC" \
           "JhdWQiOiJteS1hcHAiLCJleHAiOjk5OTk5OTk5OTksImVtYWlsIjoiYUB4LmNvbSJ9.sig"
payload = json.loads(base64.urlsafe_b64decode(id_token.split(".")[1] + "=="))
print(payload)
# {'iss': 'https://accounts.google.com', 'sub': '111', 'aud': 'my-app',
#  'exp': 9999999999, 'email': 'a@x.com'}   ← the identity, as signed claims
```

**2. The aud check, catching the confusion:**

```python
claims = {"iss": "https://accounts.google.com", "aud": "OTHER-APP", "sub": "111"}
def verify_id_token(claims, my_client_id, my_provider):
    if claims["iss"] != my_provider: return "rejected: wrong issuer"
    if claims["aud"] != my_client_id: return "rejected: issued for another app!"
    return "accepted: this identity is FOR US"
print(verify_id_token(claims, "my-app", "https://accounts.google.com"))
# accepted — but if aud were "OTHER-APP": rejected. The confusion attack, blocked.
```

## The build: OIDC login, simulated

```python
# oidc.py — the ID token flow: authorize → code → tokens → verified identity (~35 lines)
import secrets, time

def oidc_flow(provider, client_id, user):
    """the provider's side: issue code, then code+secret → ID token + access token"""
    code = secrets.token_hex(12)
    PROVIDER_CODES[code] = user
    return code
def token_exchange(code, client_id):
    user = PROVIDER_CODES.pop(code)                 # one-time use (Ch 7)
    now = int(time.time())
    header = b64url(json.dumps({"alg": "HS256"}).encode())
    payload = b64url(json.dumps({
        "iss": provider, "sub": f"user-{user}", "aud": client_id,
        "exp": now + 3600, "email": f"{user}@example.com",
        "email_verified": True}).encode())
    sig = b64url(hmac.new(IDP_SECRET, f"{header}.{payload}".encode(),
                          hashlib.sha256).digest())
    return {"id_token": f"{header}.{payload}.{sig}",
            "access_token": secrets.token_hex(16)}   # Ch 7's two tokens, both roles

PROVIDER_CODES, IDP_SECRET, provider = {}, b"idp-secret-key", "https://accounts.example.com"
code = oidc_flow(provider, "my-app", "alice")
tokens = token_exchange(code, "my-app")

claims = json.loads(base64.urlsafe_b64decode(
    tokens["id_token"].split(".")[1] + "=="))
checks = [
    claims["iss"] == provider,                       # right issuer (Ch 6's pinning)
    claims["aud"] == "my-app",                       # right audience (Ch 6's confusion)
    claims["exp"] > time.time(),                     # not expired (Ch 3's TTL)
]
print("ID token claims:", claims)
print("all checks passed:", all(checks), "→ logged in as", claims["sub"])
```

## What you now know

- **OIDC = OAuth + ID tokens (JWTs)**: OAuth delegates access; OIDC asserts
  identity — the two-token split (access FOR the API, ID FOR the client).
- The verification checklist: **signature (Ch 5), iss, aud, exp** — each a
  Chapter 6 lesson (pinning, confusion, expiry) at the identity layer.
- "Sign in with X" = OIDC: the client receives a signed identity, no password ever
  crosses.

Next: humans authenticate with passwords; machines authenticate with **API keys** —
generation, storage, scopes, and rotation.
