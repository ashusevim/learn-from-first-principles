---
layout: ../../layouts/Chapter.astro
title: 'Password Storage Done Right'
description: 'The cryptography course’s Chapter 3, applied: salts, slow KDFs, and the login loop. Build: register + login with PBKDF2.'
part: 'Part I — Identity Foundations'
written: true
---

The cryptography course (Chapter 3) built the defenses: salts kill rainbow tables,
slow KDFs tax each guess. This chapter applies them to the auth system — register
and login with PBKDF2 — and measures the attack cost against the defended storage.

## The lie you were told

> "Hashing passwords is enough."

Chapter 1 of the cryptography course proved the rest of the sentence matters:
*hash with a per-user salt, through a slow KDF*. The three-layer defense:

```python
stored = KDF(password, salt, iterations)     ← slow: taxes each guess
salt:     random per user                    ← kills rainbow tables and cross-user correlation
stored DB record: {salt, iterations, hash}   ← the salt is PUBLIC (it's not a secret!)
```

The salt's publicness surprises people: the salt's job is *uniqueness* (kill
precomputation), not secrecy. The slowness is the security — the iterations dial
prices each guess.

## Prove it to yourself

**1. The attack cost, priced** — the crypto course's dictionary attack, re-run
against the defended storage:

```python
import hashlib, time
salt = b"random-per-user-salt"
target = hashlib.pbkdf2_hmac("sha256", b"correct-horse", salt, 600_000)

t = time.time()
for guess in ("password123", "letmein", "correct-horse"):
    candidate = hashlib.pbkdf2_hmac("sha256", guess.encode(), salt, 600_000)
    if candidate == target: print(f"cracked: {guess} after {time.time()-t:.1f}s")
    else: print(f"miss: {guess} ({time.time()-t:.1f}s elapsed)")
# each guess: ~230ms (the KDF's 600k iterations). A 10M-word dictionary: 26 DAYS
# for one user. Chapter 1's naive hash: the same list in seconds.
```

## The build: register + login, defended

```python
# authstore.py — register/login with PBKDF2 (the cryptography course, applied)
import hashlib, secrets

USERS = {}   # username -> {salt, iterations, hash}

def register(username, password):
    salt = secrets.token_bytes(16)                     # random per user
    iterations = 600_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    USERS[username] = {"salt": salt, "iters": iterations, "hash": digest}
    print(f"registered {username} (salt {salt.hex()[:8]}…, {iterations} iters)")

def login(username, password):
    record = USERS.get(username)
    if not record: return False                        # no user: no timing signal either
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(),
                                 record["salt"], record["iters"])
    return hmac.compare_digest(digest, record["hash"])  # constant-time compare (Ch 7 crypto)

import hmac
register("alice", "correct-horse-battery")
print("login ok:", login("alice", "correct-horse-battery"))       # True
print("login bad:", login("alice", "wrong-password"))             # False
print("login ghost:", login("mallory", "anything"))               # False (no such user)
```

(The `hmac.compare_digest` is the cryptography course's constant-time comparison —
Chapter 7's timing-side-channel lesson, one line.)

## What you now know

- **Hash with a per-user salt through a slow KDF** — the salt kills precomputation,
  the slowness taxes each guess, `compare_digest` avoids timing leaks.
- The iteration count is a **tuning dial** — OWASP's current recommendations are the
  floor, not the ceiling.
- "No user found" and "wrong password" should return the same generic error and
  similar timing — username enumeration is a hole this chapter's discipline starts
  closing.

Next: the login worked, but *how does the server remember* on the next request?
Sessions — the token, the store, and expiry.
