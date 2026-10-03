---
layout: ../../layouts/Chapter.astro
title: 'TLS: Auth Without the Channel Is Theater'
description: 'Every token in this course travels over TLS (the cryptography course, Chapter 11). Build: why http:// auth is theater.'
part: 'Part IV — The Real World'
written: true
---

Every mechanism in this course — password checks, session tokens, JWTs, API keys —
assumes one thing: **the channel between client and server is confidential and
authenticated**. The cryptography course (Chapter 11) built that channel: TLS. This
chapter is short and blunt: auth over http:// is theater, because every token
travels in plaintext and every defense in this course is void. The rule, and why
the rule has no exceptions.

## The lie you were told

> "We'll add TLS later; the auth logic is what matters now."

The auth logic *depends* on the channel:

```text
password at login:    sent in plaintext over http:// — the network sees it (Ch 1 crypto)
session token:        sent on EVERY request — one open Wi-Fi = session theft (Ch 3)
JWT:                  signed, not encrypted (Ch 5) — readable AND forgeable-in-transit
                      (an attacker rewrites the payload... no wait: they can't forge the
                       signature, but they can STEAL the whole token and replay it)
cookies:              Secure flag (Ch 4) refuses http:// — the defense you configured
```

The crypto course's Chapter 11 proved the guarantees: TLS provides the
confidentiality and integrity that auth's tokens *assume*. Without it: session
hijacking, password theft, token replay — the attack catalog (Chapter 11) with no
defenses standing.

## Prove it to yourself

**1. The theft, one tcpdump away:**

```sh
# on any network between the client and the server:
sudo tcpdump -A 'port 80 and host target.com' | grep -i 'cookie\|authorization'
# every session token, every API key, every password — plaintext. (Ch 1 crypto's
# "the network reads everything", demonstrated against your own auth.)
```

**2. HSTS: the remember-my-choice header** — even one http:// visit is dangerous
(the first request before any redirect). HSTS (`Strict-Transport-Security:
max-age=31536000`) tells the browser: *never* try http:// for this domain again —
the redirect attack (sslstrip) dies.

## The build: the redirect chain, done right

```python
# redirect.py — the http→https redirect and why it's not enough alone
def handle_request(url, hsts_cache):
    if url.startswith("http://"):
        if url.split("/")[2] in hsts_cache:
            # HSTS: the browser upgrades BEFORE asking the network (no round trip
            # for the attacker to intercept — the sslstrip defense)
            url = "https://" + url.split("://", 1)[1]
        else:
            print("redirecting to https — but THIS request was already plaintext!")
            print("  (an attacker on the network sees and may strip the redirect)")
            url = "https://" + url.split("://", 1)[1]
    return url

hsts_cache = set()
print(handle_request("http://example.com/login", hsts_cache))    # first visit: exposed
hsts_cache.add("example.com")                                    # HSTS seen on the https response
print(handle_request("http://example.com/login", hsts_cache))    # upgraded BEFORE the network
```

The first request over http:// is the permanent hole — HSTS preload lists (baked
into browsers) close it for known domains. The discipline: HTTPS from the first
byte, HSTS from the first response, and auth endpoints on no other scheme, ever.

## What you now know

- **Auth over http:// is theater**: passwords, tokens, and cookies all travel in
  plaintext — every defense in this course assumes TLS.
- **HSTS** closes the redirect hole (the browser upgrades before the network sees
  it); preload lists close the first-visit hole.
- TLS is not "an infrastructure detail" — it's the *channel* every auth promise
  travels over. The cryptography course's Chapter 11 was a prerequisite for this
  entire course.

Next: the attack catalog — CSRF, XSS, session fixation, credential stuffing — each
staged against the naive system, each mapped to the defense that kills it.
