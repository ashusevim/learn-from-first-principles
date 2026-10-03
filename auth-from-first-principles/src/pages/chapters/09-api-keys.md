---
layout: ../../layouts/Chapter.astro
title: 'API Keys & Machine Identity'
description: 'Machines authenticate too — keys, scopes, and rotation. Build: key generation with prefixes and hashed storage.'
part: 'Part III — Delegation'
written: true
---

Humans log in with passwords; **machines authenticate with API keys** — servers,
cron jobs, CI pipelines, mobile apps talking to your API. The pattern looks simple
("here's a long string, send it in a header") — and the engineering is in the
details this chapter builds: **key generation with entropy**, **hashed storage**
(the key is a password, Chapter 2), **scopes** (delegation, Chapter 7), and
**rotation** (the cryptography course's key hygiene).

## The lie you were told

> "API keys are just long random strings you store."

Every decision matters:

```text
GENERATION:  secrets.token_urlsafe(32) — 256 bits, URL-safe, no ambiguous chars
STORAGE:     hash the key (Chapter 2's PBKDF2/SHA-256) — a leaked DATABASE must
             not leak usable keys (the same rule as passwords!)
PREFIXES:    "sk_live_...", "sk_test_..." — visible type/environment identification
             (Stripe's design: the prefix is greppable in logs, the rest is secret)
SCOPES:      what the key may do (Ch 7's delegation, per key)
ROTATION:    keys leak — rotation must be zero-downtime (issue, overlap, revoke)
```

## Prove it to yourself

**1. The entropy, counted:**

```python
import secrets
key = secrets.token_urlsafe(32)
print(len(key), "chars, ~", 32 * 8, "bits of entropy")
# 43 chars, ~256 bits — guessing is hopeless (Ch 3's entropy lesson)
# compare: a 6-digit numeric "API key" = 2^20 ≈ a million guesses: seconds.
```

**2. Hashed storage, verified:**

```python
import hashlib
raw_key = "sk_live_" + secrets.token_urlsafe(24)
stored = hashlib.sha256(raw_key.encode()).hexdigest()   # the DATABASE stores this
# on every request: hash the presented key, constant-time compare (crypto Ch 7):
presented = raw_key
valid = hashlib.compare_digest(stored, hashlib.sha256(presented.encode()).hexdigest())
print("valid:", valid)
# a database leak exposes hashes, not keys — the passwords lesson (Ch 2), applied.
```

## The build: the API key system

```python
# apikeys.py — generate, store, authenticate, scope, rotate (~40 lines)
import hashlib, secrets, hmac

class APIKeySystem:
    PREFIX = "sk_live_"
    def __init__(self):
        self.keys = {}                               # key_hash -> {owner, scopes}
    def generate(self, owner, scopes):
        raw = self.PREFIX + secrets.token_urlsafe(24)
        digest = hashlib.sha256(raw.encode()).hexdigest()
        self.keys[digest] = {"owner": owner, "scopes": scopes}
        return raw                                   # shown ONCE (Ch 2's password rule)
    def authenticate(self, presented):
        digest = hashlib.sha256(presented.encode()).hexdigest()
        record = self.keys.get(digest)
        if not record: return None
        return record
    def authorize(self, record, scope):
        return scope in record["scopes"]             # Ch 7's delegation, per key
    def rotate(self, old_raw, owner, scopes):
        self.keys.pop(hashlib.sha256(old_raw.encode()).hexdigest(), None)
        return self.generate(owner, scopes)          # new key, zero downtime

keys = APIKeySystem()
raw = keys.generate("ci-pipeline", scopes={"deploy", "read"})
print("issued key:", raw[:16], "…")
record = keys.authenticate(raw)
print("owner:", record["owner"], "| may deploy:", keys.authorize(record, "deploy"))
print("may delete:", keys.authorize(record, "delete"))          # False: not scoped
new_raw = keys.rotate(raw, "ci-pipeline", {"deploy", "read"})
print("rotated:", keys.authenticate(raw) is None, "| new key valid:",
      keys.authenticate(new_raw) is not None)
```

## What you now know

- API keys = **machine passwords**: 256-bit generation, hashed storage, shown once.
- **Prefixes** (sk_live_) make keys greppable and self-describing — a UX decision
  with security payoffs.
- **Scopes** are per-key delegation (Chapter 7's model); **rotation** is
  zero-downtime by overlapping old and new.

Next: every token in this course travels over a channel — and without TLS, all of
it is theater. The cryptography course's Chapter 11 returns.
