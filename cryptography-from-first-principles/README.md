# Cryptography from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds cryptography from first principles — hashes, XOR,
stream ciphers, MACs, Diffie–Hellman, RSA — breaking each weak construction on the
way, and assembling the survivors into a secure channel of your own.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Databases](../databases-from-first-principles), [LLMs](../llms-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Foundations**
1. What Is Cryptography, Really? ✅
2. Hashes: One-Way Functions ✅
3. Entropy, Passwords & Key Derivation ✅

**Part II — Secret-Key Cryptography**
4. XOR & the One-Time Pad ✅
5. Stream Ciphers: Expanding a Small Key ✅
6. Block Ciphers & Modes: ECB Is a Meme ✅
7. Integrity: MACs & the Length-Extension Trap ✅

**Part III — Public-Key Cryptography**
8. Diffie–Hellman: Sharing Secrets Publicly ✅
9. RSA: Trapdoors from Factoring ✅
10. Signatures & Certificates ✅

**Part IV — The Real World**
11. TLS: The Whole Course in One Handshake ✅
12. Final Boss: A Secure Channel in ~300 Lines ✅ *(DH + KDF + encrypt-then-MAC)*

All 12 chapters are fully written, each with runnable stdlib-Python builds — and every
weak construction gets broken on camera. Things you break along the way: the Caesar
cipher (frequency analysis), the two-time pad (crib dragging), ECB mode (the penguin),
the naive MAC (length extension), and DH without certificates (man-in-the-middle).
Things you build: hash commitments, a stream cipher, real HMACs, a DH exchange,
textbook RSA with signatures and a certificate chain — and your own secure channel.

## The rules of the course

1. **Start below the abstraction.** Before "use TLS", answer "what does the primitive promise?"
2. **Break it to learn it.** Every weak cipher gets attacked — by you, successfully.
3. **Build a toy version.** Stream ciphers, MACs, DH, RSA — all stdlib Python.
4. **Assemble honestly.** The finale composes the primitives and names the gaps.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
