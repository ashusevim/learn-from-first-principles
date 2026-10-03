---
layout: ../../layouts/Chapter.astro
title: 'TLS: The Whole Course in One Handshake'
description: 'Every protocol in this course, composed: DH + signatures + AEAD. Build: dissect a real TLS session with openssl s_client.'
part: 'Part IV — The Real World'
written: true
---

TLS — the padlock in your browser — is not a new invention. It's **this course,
composed**: a Diffie–Hellman exchange (Chapter 8), authenticated by signatures
chained to a trust store (Chapter 10), producing keys stretched through a KDF
(Chapter 3) that feed an authenticated cipher (Chapters 5–7). Every hand-wave in
every earlier chapter ends here, in the handshake that runs billions of times a day.
This chapter dissects a live TLS session and maps each message to its chapter.

## The lie you were told

> "TLS is complicated."

TLS is *layered* — decades of fixes for attacks on earlier versions — but the
TLS 1.3 handshake is two round trips with one message per side:

```text
ClientHello:   "here are my ciphers + my DH public value (Ch 8)"
ServerHello:   "cipher chosen + my DH public value"
Certificate:   "my key, signed by a CA chain"                 (Ch 10: kills MITM)
CertVerify:    "signature proving I own that certificate"     (Ch 10: signs the handshake!)
Finished:      "MAC over the whole transcript"                (Ch 7: tamper-evident)
   ═══ both sides now derive the same keys (Ch 3's KDF) and switch to encrypted ═══
```

Note the elegant detail: the server **signs the entire handshake transcript** —
which is why Chapter 8's MITM dies *inside* TLS, not just at the certificate: Mallory
can substitute DH values, but she cannot forge the server's signature over the
modified transcript.

## The message-to-chapter map

| TLS element | Primitive | Course chapter |
|---|---|---|
| ClientHello / ServerHello DH shares | Diffie–Hellman | Ch 8 |
| Certificate + chain | Signatures + trust store | Ch 10 |
| CertVerify signature | RSA/ECDSA signing | Ch 9–10 |
| Key schedule | HKDF (a KDF) | Ch 3 |
| Application data | AEAD (AES-GCM / ChaCha20-Poly1305) | Ch 5–7 |
| Finished MAC | transcript integrity | Ch 7 |

Every row is a course chapter — TLS is the composition the course has been building
toward, deployed.

## Prove it to yourself

**1. Dissect a live session:**

```sh
openssl s_client -connect example.com:443 -brief </dev/null
# Protocol version: TLSv1.3
# Ciphersuite: TLS_AES_256_GCM_SHA384      ← AEAD: Ch 5–7's authenticated encryption
# Server cert: ... (the chain — Ch 10)
# Verification: OK                          ← the trust store, verifying (Ch 10)
```

**2. See the certificate chain, link by link:**

```sh
openssl s_client -connect example.com:443 -showcerts </dev/null 2>/dev/null | \
  openssl x509 -noout -subject -issuer
# subject=C = US, O = Let's Encrypt, CN = E1     ← who signed it (Ch 10's CA)
# issuer=C = US, O = ISRG, CN = ISRG Root X1     ← whose key is in your trust store
```

**3. Watch the handshake fail without trust** (Chapter 10's experiment, on the real
web): connect to a site with a self-signed certificate and read the verification
failure — the MITM defense, printed.

## What you now know

- TLS 1.3 = **DH (Ch 8) + signatures over the transcript (Ch 9–10) + a KDF (Ch 3) +
  AEAD (Ch 5–7)**, in two round trips.
- The server **signs the whole transcript** — MITM is blocked inside the protocol,
  not just at the certificate check.
- Downgrade protection, replay protection (Ch 8's 0-RTT caveat), and cipher
  negotiation are all decisions about *which chapter's primitives* to use.
- You can now read any handshake trace and name every field's job.

Next, the finale: compose the primitives yourself — DH handshake, key derivation,
authenticated encryption, and the honest disclosure of what's still missing without
certificates. Your mini-TLS in ~300 lines.
