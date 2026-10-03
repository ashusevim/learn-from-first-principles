---
layout: ../../layouts/Chapter.astro
title: 'TLS: The Handshake That Hides Everyone'
description: 'Certificates, key exchange, trust stores. Build: dissect a real TLS handshake with openssl s_client.'
part: 'Part IV — The Real World'
written: true
---

Everything you've built so far travels in the open: frames anyone can sniff (Ch 1), IP any
router can read (Ch 2), DNS in plaintext (Ch 8), HTTP as literal text (Ch 9). **TLS** fixes
that — and its core trick is a beautiful paradox: two strangers who have never met, talking
in public, somehow end up with a secret nobody else knows. You will watch a real handshake
happen, message by message, and see exactly how the paradox is resolved.

## The lie you were told

> "HTTPS is encrypted with magic."

HTTPS = HTTP (Ch 9) *inside* TLS. And TLS is two ordinary-looking steps:

1. **Prove identity** — "are you really example.com?" → certificates (public-key signatures).
2. **Agree on a secret** — in the open, in a way eavesdroppers can't follow → key exchange.

No magic. Two number-theory tricks wearing protocol clothes.

## The two tricks

**Identity: signatures.** The server presents a **certificate**: its public key + its name,
signed by a Certificate Authority (CA). Your OS ships a **trust store** of ~150 CA public
keys (`/etc/ssl/certs` — look, they're right there). The check is pure arithmetic:
verify the signature with the CA's public key, verify the name matches, verify the chain
leads to a CA you trust. **Trust isn't in the network — it's pre-installed on your disk.**

**Secrecy: ECDHE.** Client and server each publish a public value; each mixes the other's
public value with their own secret to compute the same shared key. An eavesdropper sees
both public values but can't run the mix backwards (that's elliptic-curve hardness). The
"E" in ECDHE is *ephemeral* — fresh keypair per connection — so even stealing the server's
private key later can't decrypt yesterday's traffic (forward secrecy).

Then everything — both directions, including the HTTP text you decoded last chapter — is
encrypted with keys derived from that secret. And it rides on the *same TCP connection*
you already understand: TLS bytes are just TCP payload.

## The handshake, witnessed

```text
1. ClientHello     ← "here are my ciphers, my random, my key share"
2. ServerHello     ← "cipher chosen, here's my key share"
3. Certificate     ← "and here's proof I'm example.com: CA-signed"
4. (both sides)    ← mix keys, derive session keys — from here, encrypted
5. Finished        ← "verify me: a MAC over the whole handshake" — tamper check
```

TLS 1.3 compresses this to *one* round trip (1-RTT) — the certificate arrives alongside
the key exchange, not after it.

## Prove it to yourself

**1. Watch the handshake, live and verbose** — this prints every message above:

```sh
openssl s_client -connect example.com:443 -brief </dev/null
# Certificate chain / Verification: OK
# Protocol version: TLSv1.3; Ciphersuite: TLS_AES_256_GCM_SHA384
```

**2. See the whole CA chain** — your server was vouched for by strangers:

```sh
openssl s_client -connect example.com:443 -showcerts </dev/null 2>/dev/null | \
  grep -E '^ i:|^ s:'      # "issuer" and "subject" of every link in the chain
```

**3. Prove it's opaque now** — same capture as Chapter 9, but encrypted:

```sh
sudo tcpdump -A -n 'host example.com & tcp port 443' &
curl -s https://example.com >/dev/null     # no readable text anywhere. That's the point.
```

**4. Meet your trust store:**

```sh
ls /etc/ssl/certs | wc -l        # the ~150 strangers your browser trusts by default
```

## The build: dissect, then tamper

**Dissect:** point `openssl s_client -msg -connect example.com:443` at the wire and label
every message against the 5-step list above — ClientHello, ServerHello, Certificate,
Finished. You're reading protocol, not invoking it.

**Then watch trust fail on purpose:**

```sh
openssl s_client -connect example.com:443 -CAfile /dev/null </dev/null
# Verification error: unable to get local issuer certificate
```

Same packets, same math — zero trust, because you deleted the trust store. **Nothing about
TLS failed; everything about trust is local.** That's the deepest sentence in this chapter:
the network proves nothing; your disk decides.

## What you now know

- TLS = **certificates (identity)** + **ECDHE (secrecy)**, on the same TCP you already speak.
- "Trusted" means *signed by a chain ending in your disk's trust store* — pre-installed, local.
- Ephemeral keys give **forward secrecy**: steal tomorrow's key, still can't read today.
- TLS 1.3 does it all in one round trip — the handshake you watched was that fast.

Next: one gap remains. Your packets reached *the internet* somehow — and a little box in
your hallway rewrote every single one of them. NAT, routers, and the truth behind
traceroute's stars.
