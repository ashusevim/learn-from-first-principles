---
layout: ../../layouts/Chapter.astro
title: 'Entropy, Passwords & Key Derivation'
description: 'Why human passwords are weak keys, what salts fix (and don’t), and why slow hashing is a feature. Build: a dictionary attack, then PBKDF2.'
part: 'Part I — Foundations'
written: true
---

Chapter 2's commitment had a hole: `"rock"` always hashes to the same value, so an
attacker can precompute the hashes of likely choices and *look yours up*. Now scale
that thought to passwords: humans choose from a small, predictable dictionary, and
password "encryption" is just hashing. This chapter runs a real dictionary attack,
then builds the defenses in the order history invented them — salts, then slow
key-derivation functions — and shows exactly what each one fixes.

## The lie you were told

> "Passwords are stored encrypted, so they're safe."

They're stored **hashed** — and hashing gives no protection against guessing, because
verification *is* guessing: the server hashes your attempt and compares. The attacker
does the same, offline, at millions of guesses per second, with a list of hashes
stolen from a breach. The only real question: **how expensive is each guess, and how
big is the guess space?**

## Entropy: measuring the guess space

Entropy is the size of the search space, in bits:

```text
8-char lowercase password:  26^8  ≈ 2^38   (a GPU rig: seconds)
8-char mixed everything:    95^8  ≈ 2^53   (days)
4 random common words:      5000^4 ≈ 2^49  (days)   ← "correct horse battery staple"
```

Human-chosen passwords have far *less* entropy than their length suggests — people
pick from the same small dictionary of patterns. Attackers know the dictionary.

## The defenses, in historical order

1. **Don't store the password — store its hash.** (Chapter 2.) Insufficient alone:
   the attacker precomputes hashes of the top 10 million passwords — the **rainbow
   table** — and looks yours up in seconds.
2. **Salt: add random per-user data before hashing.** Kills rainbow tables (each
   user's hash needs its own precomputation) and hides identical passwords across
   users. **Doesn't slow down** a targeted attack on one user — the salt is stored
   right there in the database.
3. **Slow down: key-derivation functions** (PBKDF2, bcrypt, scrypt, argon2) hash
   *thousands of iterations* on purpose. Your login does 100ms of work once; the
   attacker pays 100ms *per guess*, per user. That's the feature.

## Prove it to yourself

**1. The dictionary attack, on camera:**

```python
# crackdemo.py — a stolen hash file, and how fast it falls
import hashlib

stolen = {"alice": "2bb80dcbc5431f0f", ...}   # (illustrative; real hashes are 64 hex chars)
# attacker's wordlist — the actual top of real breach lists:
wordlist = ["password", "123456", "dragon", "letmein", "qwerty"]

def crack(target_hash, salt=""):
    for pw in wordlist * 1:
        if hashlib.sha256((salt + pw).encode()).hexdigest().startswith(target_hash[:16]):
            return pw
    return None

print(crack("2bb80dcbc5431f0f"))    # "password" — cracked in microseconds
```

**2. Salts kill the shared lookup** — same password, different hashes:

```python
import hashlib, secrets
for user in ("alice", "bob"):
    salt = secrets.token_hex(8)
    print(user, hashlib.sha256((salt + "password123").encode()).hexdigest()[:16])
# two DIFFERENT hashes for the SAME password — rainbow tables are dead. Guessing isn't.
```

## The build: PBKDF2, and the price of slowness

```python
# kdf.py — key derivation: making each guess expensive on purpose
import hashlib, secrets, time

salt = secrets.token_bytes(16)
password = "correct-horse-battery-staple"

def derive(password, salt, iterations):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)

for iters in (1, 100_000, 600_000):
    t = time.time()
    key = derive(password, salt, iters)
    dt = (time.time() - t) * 1000
    print(f"iterations={iters:>7}: {dt:6.1f} ms per guess, key={key.hex()[:16]}")
# iterations=      1:    0.0 ms per guess     ← the rainbow-table era
# iterations= 100000:    38.5 ms per guess    ← attacker: 26 guesses/sec instead of millions
# iterations= 600000:   231.0 ms per guess    ← OWASP's current recommendation
```

The attacker's dictionary of 10 million passwords at 10ms per guess = **3.2 years**
against one user. That's what "slow hashing is a feature" means — the slowness
multiplies their entire attack.

## What you now know

- Password verification **is** hashing plus guessing; entropy of the password and
  cost per guess decide the outcome.
- **Salts kill precomputation and cross-user correlation** — they don't slow anyone
  down.
- **KDFs slow each guess** (PBKDF2/bcrypt/argon2); the iteration count is the
  dial — and "use argon2 with sane parameters" is the modern one-line answer.
- Never invent this yourself in production: use the platform's password hash API.
  (This course builds the understanding; the libraries build the safety.)

Next: with keys derived honestly, the first *real* cipher — one XOR away from proven
perfect secrecy.
