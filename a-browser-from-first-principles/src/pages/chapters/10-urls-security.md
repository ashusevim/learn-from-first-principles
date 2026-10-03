---
layout: ../../layouts/Chapter.astro
title: 'The URL Bar: Fetching & the Security Boundary'
description: 'URL grammar, same-origin policy, mixed content — the address bar is the trust anchor. Build: URL parsing and origin checks.'
part: 'Part III — A Real Browser'
written: true
---

The URL bar is the most security-critical input in computing: it's the user's answer
to "where am I, and who am I talking to?" Every attack that matters — phishing,
mixed content, cross-site leaks — is an attack on the *meaning* of that bar. This
chapter builds URL parsing (the grammar), introduces the **same-origin policy** (the
browser's core security boundary), and wires Chapter 9's navigation to it.

## The lie you were told

> "The URL is just the address."

The URL is a **grammar** with security semantics in every part:

```text
https://user:pass@shop.example.com:443/products?id=7#reviews
└┬──┘   └┬──┘  └──────┬─────┘ └┬─┘ └──┬───┘ └┬─┘ └──┬──┘
scheme  userinfo      host     port  path  query  fragment
```

- The **origin** = scheme + host + port. The same-origin policy: scripts from one
  origin cannot read another origin's data — the wall between your bank tab and a
  random tab. (And userinfo (`user:pass@`) is *display-stripped* in modern browsers
  precisely because phishers abused it: `https://google.com@evil.com` shows
  "google.com" while visiting evil.com.)
- **Scheme decides everything**: `http` vs `https` are different origins — and
  **mixed content** (an https page loading http scripts) is blocked, because one
  plain-text script reopens everything TLS closed (the cryptography course, Chapter
  11's guarantees voided).

## The same-origin policy: the browser's constitution

One rule, enormous consequences: **scripts can read each other's DOM/storage only
within the same origin.** Your bank tab and this course's tab share a browser — and
nothing else. (CORS headers are the *explicit relaxation*: a server answering
`Access-Control-Allow-Origin: other.com` pokes a hole in its own wall, deliberately.)

The cryptography course's Chapter 11 built confidentiality between client and
server; the same-origin policy builds *separation between sites* — both needed, neither
substitutable.

## Prove it to yourself

**1. Origins, computed:**

```python
from urllib.parse import urlparse
def origin(url):
    p = urlparse(url)
    return (p.scheme, p.hostname, p.port or {"https": 443, "http": 80}.get(p.scheme))

print(origin("https://shop.example.com:443/a") == origin("https://shop.example.com/b"))  # True
print(origin("https://shop.example.com") == origin("http://shop.example.com"))           # False — scheme!
print(origin("https://shop.example.com") == origin("https://evil.com"))                  # False — host!
```

**2. The phishing URL, dissected:**

```python
print(urlparse("https://google.com@evil.com/steal"))      # hostname: evil.com!
# browsers display "evil.com" (stripping userinfo) BECAUSE of this grammar — Ch 1 of
# this course's URL bar is where the phishing war is fought.
```

## The build: URL parsing + the origin check in navigation

```python
# security.py — Chapter 9's navigate(), now guarded
from urllib.parse import urlparse, urljoin

class SecureNav:
    def __init__(self):
        self.current_origin = None
    def navigate(self, url):
        url = url if urlparse(url).scheme else "https://" + url
        p = urlparse(url)
        if p.scheme not in ("http", "https"):
            raise ValueError(f"blocked scheme: {p.scheme}")        # file:, javascript: ...
        origin = (p.scheme, p.hostname, p.port)
        if self.current_origin and origin != self.current_origin:
            print(f"[cross-origin navigation: {self.current_origin} → {origin}]")
            # full page loads MAY cross origins (links work!) — scripts may NOT read across.
        self.current_origin = origin
        return p

nav = SecureNav()
nav.navigate("https://example.com/page")                # establishes the origin
print(nav.navigate("https://example.com/other"))        # same origin: fine
print(nav.navigate("http://example.com/other").scheme)  # http: DIFFERENT origin (port default)
```

The comment is the law of the land: **full-page navigations cross origins freely
(links must work!); scripts never read across them.** Your browser now enforces the
constitution.

## What you now know

- The URL is a **grammar** whose parts carry security semantics: origin = scheme +
  host + port; userinfo is a phishing vector (display-stripped).
- The **same-origin policy** separates sites inside one browser; CORS is the
  server-controlled relaxation; mixed content is blocked to protect TLS.
- Navigation crosses origins freely; scripts don't — the asymmetry that makes the
  web usable *and* safe-ish.

Next: your browser works — how fast? Instrument every pipeline stage, find the
16ms frame budget, and learn where browsers spend their optimization effort.
