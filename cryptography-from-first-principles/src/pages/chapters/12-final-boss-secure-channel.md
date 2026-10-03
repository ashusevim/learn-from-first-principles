---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: A Secure Channel in ~300 Lines'
description: 'DH handshake → key derivation → encrypted, authenticated messages — your own mini-TLS, MITM caveat included.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters of primitives — entropy and KDFs (Ch 3), stream ciphers
(Ch 5), MACs (Ch 7), Diffie–Hellman (Ch 8), signatures (Ch 10) — assembled into
**your own secure channel in ~300 lines of stdlib Python**: two processes perform a
DH handshake, derive matching keys, and exchange encrypted *and* authenticated
messages. Then Chapter 8's man-in-the-middle returns on cue, and the exact line
where certificates would intervene is named — the course ends with its own boundary
in sight.

## The lie you were told

> "Building crypto yourself is how you learn to do it in production."

Build it to learn. **Deploy the libraries.** (Chapter 3's warning, restated: real
deployments need constant-time everything, side-channel resistance, nonce
management, and protocol review. This finale delivers the *understanding* that makes
the libraries' documentation readable.)

## The protocol (each step cites its chapter)

```text
1. both sides generate ephemeral DH keypairs            (Ch 8)
2. exchange public values over the socket               (Ch 8: the public channel)
3. shared = g^(ab) mod p                                (Ch 8: the magic)
4. keys = SHA256(shared ‖ nonce_exchange)               (Ch 3: derive per-direction keys)
5. messages: ciphertext ⊕ keystream + HMAC tag          (Ch 5 + Ch 7: secrecy + integrity)
   = encrypt-then-MAC, the honest composition
```

## The build: secure-channel.py

```python
# secure.py — DH handshake + KDF + authenticated encryption (stdlib only)
import hashlib, hmac, secrets, socket, subprocess, sys

P, G = 0x7FFFFFFF, 5                    # a 31-bit toy prime (real: 2048+ bits)

def dh_keypair():
    secret = secrets.randbelow(P - 2) + 1
    return secret, pow(G, secret, P)

def derive_key(shared, label, nonce):   # Ch 3's KDF: stretch the shared secret
    return hashlib.sha256(shared.to_bytes(4, "big") + label + nonce).digest()[:32]

class Channel:                          # Ch 5's stream cipher + Ch 7's HMAC
    def __init__(self, key):
        self.key = key
        self.seq = 0                    # sequence numbers: replay protection (Ch 8 DS!)
    def send(self, sock, msg):
        nonce = self.seq.to_bytes(8, "big"); self.seq += 1
        ks = hashlib.sha256(self.key + nonce).digest() * ((len(msg) // 32) + 1)
        ct = bytes(a ^ b for a, b in zip(msg, ks))
        tag = hmac.new(self.key, nonce + ct, hashlib.sha256).digest()   # Ch 7: the MAC
        sock.sendall(len(ct).to_bytes(2, "big") + ct + tag)
    def recv(self, sock):
        length = int.from_bytes(sock.recv(2), "big")
        payload = sock.recv(length + 32)
        ct, tag = payload[:length], payload[length:]
        nonce = (self.seq).to_bytes(8, "big"); self.seq += 1
        expect = hmac.new(self.key, nonce + ct, hashlib.sha256).digest()
        if not hmac.compare_digest(tag, expect):                # Ch 7: constant-time
            raise ValueError("AUTHENTICATION FAILED — message tampered")
        ks = hashlib.sha256(self.key + nonce).digest() * ((length // 32) + 1)
        return bytes(a ^ b for a, b in zip(ct, ks))

# ── Alice (server side) ─────────────────────────────────────────────────────
if sys.argv[1] == "alice":
    srv = socket.socket(); srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 9999)); srv.listen(1)
    conn, _ = srv.accept()
    a_secret, a_pub = dh_keypair()
    conn.sendall(str(a_pub).encode())
    b_pub = int(conn.recv(64))
    shared = pow(b_pub, a_secret, P)                    # Ch 8's magic
    nonce = conn.recv(8)
    chan = Channel(derive_key(shared, b"alice→bob", nonce))
    print("[secure channel established]")
    while True:
        print("received:", chan.recv(conn))

# ── Bob (client side) ───────────────────────────────────────────────────────
else:
    conn = socket.create_connection(("127.0.0.1", 9999))
    a_pub = int(conn.recv(64))
    b_secret, b_pub = dh_keypair()
    conn.sendall(str(b_pub).encode())
    shared = pow(a_pub, b_secret, P)
    nonce = secrets.token_bytes(8); conn.sendall(nonce)
    chan = Channel(derive_key(shared, b"alice→bob", nonce))
    print("[secure channel established]")
    for msg in (b"this message is encrypted", b"and authenticated", b"by my own protocol"):
        chan.send(conn, msg)
```

```sh
python3 secure.py alice &        # terminal 1
python3 secure.py bob            # terminal 2
# [secure channel established]
# received: b'this message is encrypted'
# received: b'and authenticated'
# received: b'by my own protocol'
```

Two processes, a public channel, a shared secret that never crossed it — built from
your chapters. Then the graduate-level test: run Mallory (Chapter 8's relay) against
it. It *will* succeed — the code signs nothing, so MITM remains possible. **Find
that line yourself**, then read Chapter 10's certificates one more time: that's the
boundary of the course, and the exact place the real world begins.

## Where you are now

Twelve chapters ago, cryptography was a lock emoji. Now: you've broken a Caesar
cipher with letter frequencies (Ch 1), watched the avalanche (Ch 2), run a dictionary
attack and priced the KDF defense (Ch 3), achieved and violated perfect secrecy
(Ch 4), built a stream cipher and a MAC and extended the broken one (Ch 5–7),
executed DH and watched Mallory take over the middle (Ch 8), built RSA and its
signatures and the certificate chain that kills the MITM (Ch 9–10), mapped TLS to
the course (Ch 11) — and composed your own secure channel.

Every padlock on the internet is this course, composed and hardened. You've read
every page of the composition.

**Where to go next:** read the first sections of the Signal protocol spec (your
secure channel, plus forward secrecy), then RFC 8446 — TLS 1.3, now readable
top-to-bottom. And the First Principles Project continues: the roadmap holds
**A Browser**, **Compilers**, **Graphics**, **CPUs**, **Blockchain** and more — each
one a mountain the same way this was.
