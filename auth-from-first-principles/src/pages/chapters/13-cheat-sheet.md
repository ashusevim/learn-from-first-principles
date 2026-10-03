---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Identity on One Page'
description: 'Authentication, sessions, tokens and delegation on one page — the model, the checks you must never skip, and the pitfalls with their chapters.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course on one page. Every row cites the chapter that derived it, and every row is a decision you must get right in the system you ship. Read the model while you design; scan the pitfalls before you ship.

## The one-page model

```text
WHO ARE YOU?                                     WHAT MAY YOU DO?
authentication                                   authorization
      │                                                │
passwords ─► KDF(password, salt, iters) ─► stored hash            (Ch 2)
login ─────► random token ──────────────► server-side store       (Ch 3)
                         │
                         └─► cookie: HttpOnly; Secure; SameSite=Lax      (Ch 4)
stateless ─► JWT = b64(header).b64(claims).HMAC(secret)           (Ch 5–6)
delegation ► OAuth code flow ───────────► OIDC ID token           (Ch 7–8)
machines ──► API key: prefix + entropy ─► hashed at rest          (Ch 9)
```

Every request answers two questions, in order: **prove the identity, then authorize the action.** Sessions keep the proof in server memory, JWTs carry it signed, cookies and TLS move it, OAuth and OIDC hand it to someone else.

## The auth primitives you actually use

| Primitive | What it is | The one line |
|---|---|---|
| `hashlib.pbkdf2_hmac("sha256", pw, salt, 600_000)` | password hash | slow KDF over a per-user salt; compare constant-time (Ch 2) |
| `secrets.token_hex(32)` | session token | 256 bits of entropy; the token *is* the proof (Ch 3) |
| `sessions[token] = {"user": u, "expires": t}` | session store | logout is `pop` — the server forgets (Ch 3) |
| `Set-Cookie: …; HttpOnly; Secure; SameSite=Lax` | transport | three attributes, three attack classes (Ch 4) |
| `b64url(header) + "." + b64url(claims)` | JWT body | signed, never encrypted — readable by anyone (Ch 5) |
| `header["alg"] != "HS256" → reject` | pinned algorithm | kills alg=none and the confusion attack (Ch 6) |
| `/authorize?…&scope=…&state=…` | OAuth start | consent happens at the provider (Ch 7) |
| `code + client_id + client_secret` | back-channel exchange | the browser never sees the access token (Ch 7) |
| `iss`, `aud`, `exp` | ID-token checks | signature first, then issuer, audience, expiry (Ch 8) |
| `"sk_live_" + secrets.token_urlsafe(24)` | API key | hashed at rest, shown once, scoped, rotated (Ch 9) |
| `Strict-Transport-Security: max-age=31536000` | HSTS | the browser upgrades before the network sees it (Ch 10) |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Plaintext or one-shot hashed passwords | one leak is every account; a GPU walks the list | Ch 2 |
| Keeping the session id across login | fixation: the planted id becomes the victim's | Ch 11 |
| Cookies sent without attributes | XSS reads `document.cookie`; cross-site POSTs carry it | Ch 4 |
| Trusting `alg` from the token header | alg=none and RS256/HMAC confusion forge claims | Ch 6 |
| Verifying a JWT but not `aud` or `iss` | a token minted for another app is accepted as yours | Ch 8 |
| "We'll add revocation later" | a JWT cannot be logged out before `exp` | Ch 5 |
| Any `http://` in the auth path | passwords and tokens are plaintext on the network | Ch 10 |
| No rate limit on login | breached lists are replayed at machine speed | Ch 11 |

## When to use what

| Decision | Choose | Because |
|---|---|---|
| Browser app with a server | session + cookie (Ch 3–4) | logout must actually log out |
| Stateless API, many services | JWT, pinned, short `exp` (Ch 5–6) | no shared store; you accept the revocation cost |
| A third party needs your user's data | OAuth authorization code (Ch 7) | the password never crosses the wire |
| A third party needs to know who the user is | OIDC ID token (Ch 8) | OAuth delegates access, not identity |
| A machine talks to your API | prefixed, scoped API key (Ch 9) | 256-bit secret, hashed at rest, rotatable |
| Any of the above, over a network | HTTPS + HSTS, no exceptions (Ch 10) | the channel is the lowest layer of the proof |

## Prove it to yourself

**1. Price one guess.** The KDF's iteration count is the security:

```sh
python3 -c "import hashlib,secrets,time; s=secrets.token_bytes(16); t=time.time(); hashlib.pbkdf2_hmac('sha256', b'correct-horse', s, 600_000); print(round(time.time()-t, 3), 's per guess')"
# ~0.2 s per guess. A 10M-word dictionary: weeks per user — that is what 600,000 buys.
```

**2. Read a claim.** Any JWT you are handed is readable without the secret:

```sh
python3 -c "import base64,json,sys; print(json.loads(base64.urlsafe_b64decode(sys.argv[1].split('.')[1] + '===')))" "$TOKEN"
# {'sub': 'alice', 'exp': 1735689600} — signed is not encrypted. Keep secrets out of claims.
```

**3. Delete the pin.** Run one forged token through both verifiers from Chapter 6:

```python
forged = b64url(json.dumps({"alg": "none"}).encode()) + "." + \
         b64url(json.dumps({"sub": "admin"}).encode()) + "."
print(naive_verify(forged))    # {'sub': 'admin'} — the hole
print(pinned_verify(forged))   # None — the one-line fix
```

Same token, two verifiers, one line apart — the difference between a breach report and a quiet Tuesday.

## What you now know

- **Authentication, then authorization** — identity first, permissions second, on every request.
- Three transports, one job: sessions (revocable), JWTs (stateless), cookies (the browser's contract).
- Hash with a salt through a slow KDF, compare constant-time, and pin the algorithm.
- Verify `iss`, `aud` and `exp`; exchange OAuth codes server-to-server; scope and rotate machine keys.
- Auth over `http://` is theater — TLS is part of the protocol, not an infrastructure detail.

Next: the labs — twelve exercises that make you prove every line on this page on your own machine.
