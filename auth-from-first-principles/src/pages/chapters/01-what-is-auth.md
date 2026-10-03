---
layout: ../../layouts/Chapter.astro
title: 'What Is Auth, Really?'
description: 'Authentication (who are you) vs authorization (what may you do) — two promises, constantly conflated. Build: the naive password check and its three holes.'
part: 'Part I — Identity Foundations'
written: true
---

Every app with users makes two promises, and the vocabulary collapses them:

```text
AUTHENTICATION (authn): "who are you?"        ← you are who you claim
AUTHORIZATION (authz):  "what may you do?"     ← you may access this resource
```

The cryptography course (Chapter 1) built the promise vocabulary — secrecy,
integrity, authenticity. Auth *uses* those promises to build identity: a password
check is an authentication (proof of knowledge of a secret), and "may access this
page" is an authorization decision made *after* the identity is known. This chapter
builds the naive version, then catalogs its holes — the course's map.

## The lie you were told

> "We have a login page, so we have auth."

The naive login — store passwords, compare at login, trust a flag afterward — has
three holes, each a chapter:

```python
# naive.py — the naive auth system: three holes, demonstrated
USERS = {"alice": "password123"}               # hole 1: plaintext passwords
logged_in = {}                                 # hole 2: "remembering" via a bare flag

def register(username, password):
    USERS[username] = password                 # stored as typed: the database IS the leak

def login(username, password):
    if USERS.get(username) == password:
        logged_in[username] = True             # "authenticated"
        return True
    return False

def is_authenticated(username):
    return logged_in.get(username, False)      # trust a bare flag — no token, no proof

def access_admin(username):
    return is_authenticated(username)          # hole 3: authentication ≠ authorization
```

## The three holes, cataloged

1. **Plaintext passwords** — one database leak exposes every user (the cryptography
   course, Chapter 3: hash with a salt and a slow KDF — Chapter 2 here).
2. **The bare flag** — `logged_in` has no token, no expiry, no binding: any code
   that sets it (or any process sharing the memory) grants access. The fix: a
   *token* — random, unguessable, expiring (Chapter 3).
3. **Authn/authz conflation** — "you are alice" ≠ "you may delete the database".
   Every request needs an authorization check against the *authenticated identity*
   — not just "logged in".

## Prove it to yourself

**1. Hole 2, exploited** — the flag outlives its purpose:

```python
login("alice", "password123")
print(is_authenticated("alice"))               # True — legitimately
logged_in["mallory"] = True                    # any code path that touches the dict...
print(is_authenticated("mallory"))             # True — mallory "authenticated"!
# a bare flag has no proof: no token, no expiry, no binding to a real login.
```

**2. Hole 3, demonstrated** — the admin page for everyone:

```python
# is_authenticated("alice") is True → access_admin("alice") allows...
# ...but SHOULD alice access admin? The authn promise says nothing about authz.
# every "logged in user sees the admin panel" breach: this conflation.
```

## The build: the spec for the course

Your auth system — built over the course — must:

1. **Store passwords** hashed with a salt and a slow KDF (Ch 2 — the crypto
   course's receipt).
2. **Prove login** with a random session token that expires (Ch 3), carried in a
   cookie with the right attributes (Ch 4).
3. **Support stateless auth** with signed claims — JWT, built and broken (Ch 5–6).
4. **Delegate** to third parties without sharing passwords (Ch 7–8: OAuth/OIDC).
5. **Survive** the attack catalog (Ch 11): CSRF, XSS, fixation, stuffing.

Keep `naive.py` — every chapter breaks it harder, then fixes one hole.

## What you now know

- **Authn ≠ authz**: identity first, permissions second — conflating them is hole 3.
- The naive system's three holes map to the course: **hashing** (Ch 2), **tokens**
  (Ch 3), **authorization checks** (every chapter's discipline).
- Every auth mechanism — sessions, JWT, OAuth — is an answer to "how does the
  server know who you are, provably, on every request?"

Next: the first fix — password storage with salts and slow hashing. The
cryptography course's receipts, applied.
