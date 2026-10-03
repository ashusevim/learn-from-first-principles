---
layout: ../../layouts/Chapter.astro
title: 'Cookies & the Browser Contract'
description: 'How the token travels: Set-Cookie, HttpOnly, Secure, SameSite. Build: a cookie jar that demonstrates every attribute.'
part: 'Part II — Tokens'
written: true
---

The session token (Chapter 3) must travel with every request. The mechanism: the
server's `Set-Cookie` header, and the browser's promise — *store this, send it back
on every request to this site*. Cookies are the auth transport, and their
**attributes** are the security dials: HttpOnly, Secure, SameSite. This chapter
builds a cookie jar that demonstrates each one.

## The lie you were told

> "Cookies are just key-value storage."

Cookies are a **contract with the browser** — and each attribute is a defense:

```text
Set-Cookie: session=abc123;
  HttpOnly;      ← JavaScript CANNOT read it (XSS can't steal the session — Ch 11)
  Secure;        ← only sent over HTTPS (never on http:// — Ch 10's channel)
  SameSite=Lax;  ← not sent on cross-site requests (kills CSRF — Ch 11)
  Max-Age=3600   ← expiry, in the BROWSER too (matching the server's session expiry)
```

Without HttpOnly: any XSS injects `document.cookie` and steals the session token.
Without Secure: the token leaks on any http:// request. Without SameSite: another
site's form posts to yours *with the cookie attached* — CSRF. Each attribute kills
one attack class (Chapter 11 stages them).

## Prove it to yourself

**1. The cookie jar, enforcing the contract:**

```python
# jar.py — a minimal cookie jar: domain scoping, secure flag, expiry
import time

class CookieJar:
    def __init__(self): self.jar = {}
    def set(self, domain, name, value, secure=False, expires=None):
        if secure and not domain.startswith("https"):
            print(f"  [Secure cookie NOT stored over http://{domain}]")
            return
        self.jar[domain, name] = {"value": value, "expires": expires or time.time() + 3600}
    def get(self, domain, name):
        entry = self.jar.get((domain, name))
        if entry and time.time() > entry["expires"]:
            del self.jar[domain, name]; return None            # expired: browser drops it
        return entry["value"] if entry else None

jar = CookieJar()
jar.set("https://example.com", "session", "abc123", secure=True)
print("https read:", jar.get("https://example.com", "session"))     # abc123
jar.set("http://example.com", "session", "abc123", secure=True)     # Secure: refused!
print("http read:", jar.get("http://example.com", "session"))       # None
```

**2. SameSite kills CSRF** — a cross-site form's POST omits the cookie:

```text
SameSite=Lax: cookies sent on top-level GET navigations, but NOT on cross-site POSTs.
              → the attacker's form posting to your API arrives cookie-less. CSRF dead.
```

## The build: Set-Cookie, parsed

```python
# setcookie.py — the header, parsed into the jar's attributes
def parse_set_cookie(header):
    """'session=abc123; HttpOnly; Secure; SameSite=Lax; Max-Age=3600' → structured"""
    parts = header.split("; ")
    name, value = parts[0].split("=", 1)
    attrs = {p.split("=")[0]: p.split("=", 1)[1] if "=" in p else True
             for p in parts[1:]}
    return name, value, attrs

name, value, attrs = parse_set_cookie(
    "session=abc123; HttpOnly; Secure; SameSite=Lax; Max-Age=3600")
print(f"cookie: {name}={value}")
print(f"attributes: {attrs}")
# attributes: {'HttpOnly': True, 'Secure': True, 'SameSite': 'Lax', 'Max-Age': '3600'}
# every attribute is a defense from Chapter 11's catalog, declared in one header.
```

## What you now know

- Cookies = **the browser's transport contract**: store, return, expire — with
  per-attribute defenses.
- **HttpOnly** kills XSS session theft; **Secure** keeps the token off http://;
  **SameSite** kills CSRF; **Max-Age** bounds the damage window.
- The attributes are *declarations of the threat model* — each one named after the
  attack it prevents (Chapter 11 stages all of them).

Next: the stateful session needs server memory. JWT flips it — signed *claims*,
no store. Built from scratch, with the signature verified.
