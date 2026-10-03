---
layout: ../../layouts/Chapter.astro
title: 'Sessions: The Server Remembers'
description: 'The stateful model: a random token, a server-side store, expiry. Build: login → session token → authenticated request → logout.'
part: 'Part I — Identity Foundations'
written: true
---

Login proved identity *once*. HTTP is stateless — the next request arrives with no
memory. The **session** is the bridge: at login, the server mints a random,
unguessable token and remembers it; the client presents the token on every request;
the server looks it up. This chapter builds the session store — token, expiry,
logout — the stateful heart of auth.

## The lie you were told

> "Sessions are a framework feature."

A session is **three things**: a random token (Chapter 3's entropy), a server-side
store (token → user), and an expiry policy. ~30 lines:

```python
sessions = {}                        # token -> {user, expires_at}

def create_session(user):
    token = secrets.token_hex(32)    # 256 bits of entropy — unguessable (Ch 3)
    sessions[token] = {"user": user, "expires": time.time() + 3600}
    return token

def validate(token):
    session = sessions.get(token)
    if not session or time.time() > session["expires"]: return None   # expired or fake
    return session["user"]

def logout(token): sessions.pop(token, None)             # the server forgets
```

The token's entropy is the security: `secrets.token_hex(32)` = 256 random bits — an
attacker cannot guess it (the cryptography course, Chapter 3's entropy lesson).
Session tokens are NOT hashes of usernames — they're random, because **the token is
the proof**, not the username.

## Prove it to yourself

**1. The token is unguessable — by construction:**

```python
import secrets
tokens = {secrets.token_hex(32) for _ in range(1000)}
print(len(tokens))                     # 1000 — no collisions in 256 bits
print(len(secrets.token_hex(32)))      # 64 hex chars = 256 bits of entropy
# guessing one token: 2^256 attempts. The universe's atoms: ~2^266. Good luck.
```

**2. Expiry, enforced:**

```python
token = create_session("alice")
print(validate(token))                       # alice
# (advance time past expiry in your tests) → validate returns None. The session died.
```

## The build: the session store with expiry and logout

```python
# sessions.py — the complete session store (~35 lines)
import secrets, time

class SessionStore:
    def __init__(self, ttl=3600):
        self.sessions, self.ttl = {}, ttl
    def create(self, user):
        token = secrets.token_hex(32)
        self.sessions[token] = {"user": user, "expires": time.time() + self.ttl}
        return token
    def validate(self, token):
        s = self.sessions.get(token)
        if not s: return None
        if time.time() > s["expires"]:          # expired: the server forgets
            del self.sessions[token]; return None
        return s["user"]
    def logout(self, token): self.sessions.pop(token, None)

store = SessionStore(ttl=2)                     # 2-second sessions for the demo
token = store.create("alice")
print("fresh:", store.validate(token))          # alice
time.sleep(2.5)
print("expired:", store.validate(token))        # None — expiry enforced
token = store.create("alice")
store.logout(token)
print("logged out:", store.validate(token))     # None — the server forgot on demand
```

## What you now know

- A session = **random token + server-side store + expiry** — three moving parts,
  ~30 lines.
- The token's **256 bits of entropy** are the proof; the server-side store is the
  memory; expiry bounds the damage of a stolen token.
- Logout = the server *forgets* — the stateful model's superpower (Chapter 5's JWT
  gives it up, and pays for it).

Next: the token exists — how does it travel? The browser contract: cookies and
their attributes.
