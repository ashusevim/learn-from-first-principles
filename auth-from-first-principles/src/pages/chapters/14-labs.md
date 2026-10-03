---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the auth system from Chapter 12 — hashing, sessions, JWT attacks, OAuth. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Every lab runs on this course’s own artefacts: `naive.py`, `authstore.py`, `sessions.py`, `jar.py`, `jwt.py`, `pinned.py`, `oauth.py`, `oidc.py`, `apikeys.py`, `redirect.py` and `auth.py`.

## How the labs work

Each lab has four fields; hints are directions, never solutions. A lab counts only when the promised output comes from your run.

| Tier | Labs | Shape |
|---|---|---|
| Warm-ups | 1.1–1.3 | one artefact, one observation |
| Builds | 2.1–2.5 | remove a defense, watch it land |
| Stretch goals | 3.1–3.4 | open-ended; many answers |

| Field | What it gives you |
|---|---|
| **Goal** | what the lab proves |
| **Do this** | how to demonstrate it |
| **You’ll know it works when** | the output you must see |
| **Where it comes from** | the source chapter |

## Warm-ups

**Lab 1.1 — Price one guess**
**Goal:** Price a KDF guess.
**Do this:** Time one `pbkdf2_hmac("sha256", b"wrong", salt, 600_000)` call; ×10,000,000.
**You’ll know it works when:** ≈0.2 s per guess — weeks per password.
**Where it comes from:** Chapter 2 — Password Storage Done Right.

**Lab 1.2 — Count the token’s entropy**
**Goal:** Prove a session token is unguessable.
**Do this:** Mint 1,000 tokens with `secrets.token_hex(32)`; count distinct values.
**You’ll know it works when:** 1,000 distinct, 64 hex characters — 256 bits.
**Where it comes from:** Chapter 3 — Sessions: The Server Remembers.

**Lab 1.3 — Read a claim with no secret**
**Goal:** Read a claim with no key.
**Do this:** Decode the middle segment of a token from `jwt.py`:

```python
token = make_jwt({"sub": "alice", "exp": 1e18})
print(json.loads(base64.urlsafe_b64decode(token.split(".")[1] + "==")))
```

**You’ll know it works when:** `{'sub': 'alice', …}` prints — the claims are public.
**Where it comes from:** Chapter 5 — JWT: Signed Claims.

## Builds

**Lab 2.1 — Re-open hole 3**
**Goal:** Show authn is not authz.
**Do this:** In `naive.py`, call `access_admin("alice")` for a logged-in non-admin.
**You’ll know it works when:** the admin action runs for an unauthorized user.
**Where it comes from:** Chapter 1 — What Is Auth, Really?

**Lab 2.2 — Fail to steal an HttpOnly cookie**
**Goal:** See a cookie attribute refuse to leak.
**Do this:** In `jar.py`, set a `Secure=True` cookie over `http://`, then read it.
**You’ll know it works when:** the `https://` read returns `abc123`, the `http://` read `None`.
**Where it comes from:** Chapter 4 — Cookies & the Browser Contract.

**Lab 2.3 — Forge with alg=none**
**Goal:** Forge a token, then pin it.
**Do this:** Build header `{"alg": "none"}`, payload `{"sub": "admin"}`, no signature:

```python
forged = b64url(json.dumps({"alg": "none"}).encode()) + "." + b64url(json.dumps({"sub": "admin"}).encode()) + "."
print(naive_verify(forged), pinned_verify(forged))   # {'sub': 'admin'} None
```

**You’ll know it works when:** the verifiers disagree on identical bytes.
**Where it comes from:** Chapter 6 — JWT Pitfalls: alg=none & the Confusion Attacks.

**Lab 2.4 — Spend an authorization code twice**
**Goal:** Confirm codes are one-time.
**Do this:** In `oauth.py`, exchange a code, then `exchange` it again.
**You’ll know it works when:** the second call raises `unknown/used code`.
**Where it comes from:** Chapter 7 — OAuth 2.0: The Delegation Problem.

**Lab 2.5 — Rotate a key with zero downtime**
**Goal:** Rotate without breaking clients.
**Do this:** In `apikeys.py`, issue a second key before revoking the first.
**You’ll know it works when:** both keys work in the overlap; only the new one after.
**Where it comes from:** Chapter 9 — API Keys & Machine Identity.

## Stretch goals

**Lab 3.1 — Log out a JWT**
**Goal:** Make logout real for a stateless token.
**Do this:** Add a denylist of revoked tokens to `auth.py`, pruned past `exp`.
**You’ll know it works when:** the logged-out token returns `None`; the list stops growing.
**Where it comes from:** Chapter 5 — JWT: Signed Claims.

**Lab 3.2 — Reject a token for another app**
**Goal:** Enforce `aud` and `iss`, not just the signature.
**Do this:** Feed `oidc.py` a token whose `aud` is another client.
**You’ll know it works when:** the check rejects it — issued for another app.
**Where it comes from:** Chapter 8 — OpenID Connect: Who Are You?

**Lab 3.3 — Kill a forged transfer**
**Goal:** Defeat CSRF on the protected route.
**Do this:** Call `protected_transfer` with the real CSRF token, then a guess.
**You’ll know it works when:** the second returns `403: CSRF token mismatch`.
**Where it comes from:** Chapter 11 — The Attack Catalog: CSRF, XSS, Fixation & Stuffing.

**Lab 3.4 — Close the first-request hole**
**Goal:** Find the request HSTS cannot save.
**Do this:** Walk `redirect.py` through a cold cache; count plaintext requests that escape.
**You’ll know it works when:** you can name the leaking request — and what closes it.
**Where it comes from:** Chapter 10 — TLS: Auth Without the Channel Is Theater.

## Self-checking without a grader

Expected output is the grader. If an observation cannot become an assert, the lab is too loose.

```python
assert pinned_verify(forged) is None      # Lab 2.3: the pin held
assert keys.authenticate(raw) is None     # Lab 2.5: the old key is dead
```

| Class of lab | How to check it yourself |
|---|---|
| Cost measurement (1.1) | wall-clock from your run; compare ratios, not absolutes |
| Break-and-fix (2.3, 3.2) | the pinned verifier returns `None` where the naive one accepted |
| Stateful flow (2.4, 2.5, 3.3) | assert on the store after the call |

## What you now know

- Twelve labs, checkable by you alone — no grader needed.
- Warm-ups price the primitives; builds watch the attack land.
- Stretch goals have many good answers.
- Doing the labs is the difference between reading and knowing this course.

Next: take these labs to the real tools — OWASP’s Authentication Cheat Sheet, RFC 6749, RFC 7519, RFC 8446 — and on to Blockchain.