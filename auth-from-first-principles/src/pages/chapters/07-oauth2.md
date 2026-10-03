---
layout: ../../layouts/Chapter.astro
title: 'OAuth 2.0: The Delegation Problem'
description: '“Let this app access my data” without sharing your password. Build: the authorization code flow, step by step.'
part: 'Part III — Delegation'
written: true
---

"Sign in with Google" solves a problem you've felt: an app needs your data from
another service, and typing your Google password *into the app* would hand the app
your entire account. **OAuth 2.0** is the delegation protocol: you authorize the
app *at the provider*, and the app receives a limited token — never your password.
This chapter walks the authorization code flow, step by step, with the roles named.

## The lie you were told

> "OAuth logs you in."

OAuth is **authorization** (delegated access to resources) — not authentication
(Chapter 1's distinction, the source of endless confusion). "Sign in with X" is
actually **OpenID Connect** (Chapter 8) layered on top: OAuth for the token, OIDC
for the identity.

## The four roles

```text
RESOURCE OWNER:  you — the user who owns the data
CLIENT:          the app that wants access            (the third-party app)
AUTHORIZATION SERVER: the provider's consent screen   (accounts.google.com)
RESOURCE SERVER: the API holding the data             (googleapis.com)
```

## The authorization code flow, step by step

```text
1. CLIENT → browser → AUTH SERVER:
     /authorize?client_id=APP&redirect_uri=...&scope=photos&state=xyz
   (the user logs in AT THE PROVIDER and clicks "allow" — the password
    never touches the client!)

2. AUTH SERVER → redirect → CLIENT:
     redirect_uri?code=AUTH_CODE&state=xyz           (the state echoes back:
                                                      CSRF detection, Ch 11!)

3. CLIENT → AUTH SERVER (back channel, server-to-server):
     code + client_id + client_secret                (the secret never leaves
                                                      the server: the Ch 5 lesson)
     → AUTH CODE + verifier → ACCESS TOKEN (+ refresh token)

4. CLIENT → RESOURCE SERVER: Authorization: Bearer <access_token>
     → the API returns the photos                    (scoped, expiring, revocable)
```

The **authorization code** is a one-time intermediate: the browser only ever sees
the code, and the code alone is useless without the client secret (server-to-
server exchange). The **state parameter** is the CSRF defense (Chapter 11's
catalog) — the client generates it, the provider echoes it, mismatches abort.

## Prove it to yourself

**1. The flow's shape, simulated:**

```python
# oauth.py — the roles and the flow, simulated (~40 lines)
import secrets

PROVIDER_USERS = {"alice": "provider-password"}
PROVIDER_DATA = {"alice": ["photo1.jpg", "photo2.jpg"]}
AUTH_CODES, ACCESS_TOKENS = {}, {}
CLIENT = {"id": "photo-print-app", "secret": "client-secret", "redirect": "https://app/cb"}

def authorize(user, password, client_id, redirect, state):
    """step 1-2: the user consents AT THE PROVIDER (password stays there)"""
    assert PROVIDER_USERS.get(user) == password, "provider login failed"
    code = secrets.token_hex(16)
    AUTH_CODES[code] = {"user": user, "client_id": client_id, "redirect": redirect}
    return f"{redirect}?code={code}&state={state}"

def exchange(code, client_id, client_secret, redirect):
    """step 3: the back-channel exchange (server-to-server)"""
    record = AUTH_CODES.get(code)
    assert record, "unknown/used code"                       # codes are one-time
    assert (client_id, client_secret, redirect) == \
           (CLIENT["id"], CLIENT["secret"], CLIENT["redirect"]), "client mismatch"
    del AUTH_CODES[code]                                     # one-time use, enforced
    token = secrets.token_hex(16)
    ACCESS_TOKENS[token] = record["user"]
    return token

def api_call(token, path):
    user = ACCESS_TOKENS.get(token)                          # Bearer token → identity
    assert user, "401: invalid or expired token"
    return PROVIDER_DATA[user]

# ── the flow, run ──
state = secrets.token_hex(8)
redirect_with_code = authorize("alice", "provider-password",
                               CLIENT["id"], CLIENT["redirect"], state)
print("provider redirected to:", redirect_with_code[:60], "…")
code = redirect_with_code.split("code=")[1].split("&")[0]
print("the browser only ever saw the CODE:", code[:16], "… — never the password")

token = exchange(code, CLIENT["id"], CLIENT["secret"], CLIENT["redirect"])
print("API call with the token:", api_call(token, "/photos"))
print("the password 'provider-password' was NEVER sent to the client app ✓")
```

## What you now know

- OAuth = **delegated authorization**: the user consents at the provider, the
  client receives scoped tokens, the password never crosses.
- The **authorization code** is a one-time intermediate, exchanged server-to-server
  with the client secret — the browser never sees the token.
- The **state parameter** is the CSRF defense; the **code exchange** is the
  client-authentication step; **scopes** limit the delegation.

Next: OAuth says what the app may access — but not *who the user is*. OpenID
Connect adds the identity layer: the ID token.
