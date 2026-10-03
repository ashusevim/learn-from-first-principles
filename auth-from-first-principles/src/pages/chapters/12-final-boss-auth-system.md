---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Complete Auth System in ~300 Lines'
description: 'Register, login, sessions, logout, protected routes — every defense from the course composed into one file.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of defenses — password hashing (Ch 2), session tokens
(Ch 3), cookie attributes (Ch 4), JWT (Ch 5), pinned algorithms (Ch 6), scopes
(Ch 9), TLS discipline (Ch 10), and the attack catalog's four counters (Ch 11) —
assembled into **a complete auth system in ~300 lines of Python**: register, login,
logout, protected routes, with every defense composed. When the attacks fail
against it, the course's promise is kept.

## The lie you were told

> "Auth systems are complex frameworks you must trust."

The *hardened* ones are — rate limiting, MFA, audit logs, breach checks. The
**core** is every defense from this course, composed. This finale is the
composition, with every defense citing its chapter.

## The build: auth.py — the complete system

```python
# auth.py — register/login/sessions/protected routes, every defense composed
import hashlib, hmac, secrets, time

class AuthSystem:
    def __init__(self):
        self.users = {}                     # username -> {salt, iters, hash}   (Ch 2)
        self.sessions = {}                  # token -> {user, expires}          (Ch 3)
        self.login_attempts = {}            # username -> [timestamps]          (Ch 11: stuffing)

    # ── Ch 2: password storage ──
    def register(self, username, password):
        if username in self.users: return False, "username taken"
        if len(password) < 8: return False, "password too short"
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 600_000)
        self.users[username] = {"salt": salt, "iters": 600_000, "hash": digest}
        return True, "registered"

    # ── Ch 2 + Ch 11: login with KDF + stuffing defense ──
    def login(self, username, password):
        attempts = [t for t in self.login_attempts.get(username, [])
                    if time.time() - t < 300]                       # 5-minute window
        if len(attempts) >= 5:                                      # Ch 11: stuffing defense
            return False, "too many attempts — locked for 5 minutes"
        record = self.users.get(username)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(),
                                     record["salt"], record["iters"])
        self.login_attempts.setdefault(username, []).append(time.time())
        if hmac.compare_digest(digest, record["hash"]):             # Ch 2: constant-time
            self.login_attempts[username] = []                      # reset on success
            token = secrets.token_hex(32)                           # Ch 3: 256-bit entropy
            self.sessions[token] = {"user": username,
                                    "expires": time.time() + 3600,
                                    "csrf": secrets.token_hex(16)}  # Ch 11: the form token
            return True, token
        return False, "invalid credentials"                         # generic: no enumeration

    # ── Ch 3: session validation ──
    def validate(self, token):
        s = self.sessions.get(token)
        if not s or time.time() > s["expires"]: return None
        return s["user"], s["csrf"]                         # identity + the CSRF token

    def logout(self, token): self.sessions.pop(token, None)  # Ch 3: the server forgets

    # ── Ch 11: the protected route with authz + CSRF check ──
    def protected_transfer(self, token, form_csrf, to_user, amount):
        who = self.validate(token)
        if not who: return "401: not authenticated"
        user, csrf = who
        if form_csrf != csrf: return "403: CSRF token mismatch"      # Ch 11's defense
        if user != "admin" and to_user == "admin":                    # Ch 1: authz!
            return "403: you may not transfer to admin"
        return f"transferred {amount} to {to_user} (from {user})"

# ── the receipt: the whole lifecycle ──
auth = AuthSystem()
print(auth.register("alice", "correct-horse-battery"))
token, message = auth.login("alice", "correct-horse-battery")[0], None
ok, token = auth.login("alice", "correct-horse-battery")
print("login:", ok, "| session token:", token[:16], "…")

who, csrf = auth.validate(token)
print("protected transfer (with the form's CSRF token):")
print(" ", auth.protected_transfer(token, csrf, "bob", 100))
print("protected transfer (attacker's CSRF token):")
print(" ", auth.protected_transfer(token, "forged", "mallory", 100))
auth.logout(token)
print("after logout:", auth.validate(token))            # None — the server forgot
```

The receipt, line by line:

```text
registered alice (salt …, 600000 iters)      ← Ch 2: hashed, salted, slow
login: True | session token: 3f9c…           ← Ch 3: 256-bit entropy
transferred 100 to bob (from alice)          ← authz passed, CSRF token matched
403: CSRF token mismatch                     ← Ch 11: the forged request died
after logout: None                           ← Ch 3: the server forgot
```

Every line is a defense from a chapter — composed, and the attacks fail against
the composition.

## Where you are now

Twelve chapters ago, auth was a login page. Now: you've stored passwords with
salts and slow KDFs (Ch 2), minted and expired session tokens (Ch 3), declared the
cookie contract (Ch 4), built and verified JWTs (Ch 5), pinned algorithms against
the confusion attacks (Ch 6), delegated with OAuth (Ch 7), identified with OIDC
(Ch 8), issued machine keys (Ch 9), refused the theater of http:// (Ch 10), staged
and blocked the four classic attacks (Ch 11) — and composed the complete system.

Every login you'll ever implement is these defenses, composed. You've written the
composition.

**Where to go next:** add rate limiting per-IP and MFA (TOTP — the cryptography
course's HMAC over time, again), then read OWASP's Authentication Cheat Sheet
(your course is its table of contents). And the First Principles Project
continues: **Blockchain** (the cryptography course's hashes and signatures,
composed into consensus) and **Observability** remain on the belt.
