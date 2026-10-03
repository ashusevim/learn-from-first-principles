---
layout: ../../layouts/Chapter.astro
title: 'Block Ciphers & Modes: ECB Is a Meme'
description: 'Fixed-size blocks, and why the mode of operation matters as much as the cipher. Build: the ECB penguin, rendered.'
part: 'Part II — Secret-Key Cryptography'
written: true
---

Stream ciphers XOR keystream over arbitrary lengths. The other great cipher family —
**block ciphers** (AES, DES) — encrypts fixed-size blocks (16 bytes for AES) with a
key, perfectly: same block + same key = same output block, always. That determinism
is the block cipher's strength *and* its trap: encrypt a long message block-by-block
independently (**ECB mode**) and identical plaintext blocks produce identical
ciphertext blocks — leaking structure catastrophically. The famous proof is a
picture. This chapter renders it.

## The lie you were told

> "AES is unbreakable, so AES encryption is secure."

AES the *primitive* is unbroken. But a block cipher only encrypts 16 bytes at a time
— real messages need a **mode of operation** that chains blocks together, and the
mode decides most of the security. ECB (Electronic Codebook — "just encrypt each
block") is the broken one, and its failure is visual:

## The ECB penguin

Encrypt an image of Tux the penguin in ECB mode: identical plaintext blocks (the
white background, the solid black body regions) → identical ciphertext blocks → the
**penguin is visible in the ciphertext**. Not "partially leaked" — the silhouette is
fully readable. ECB is such a famous failure that "ECB penguin" is its own meme, and
code-review tools flag it on sight.

## Prove it to yourself

**1. Determinism, demonstrated with a toy block function:**

```python
# ecb.py — structure leaks block by block (toy block cipher: Chapter 5's stream cipher,
# but applied per 4-byte block independently — same deterministic per-block idea)
import hashlib

def block_encrypt(block, key):
    return hashlib.sha256(key + block).digest()[:4]     # our toy "block cipher"

key = b"K" * 16
plaintext = b"SECRETDATASECRETDATAXXXX"                 # note the repetition!
blocks = [plaintext[i:i+4] for i in range(0, len(plaintext), 4)]
ct = [block_encrypt(b, key) for b in blocks]
print("plaintext blocks:", blocks)
print("ciphertext blocks:", [c.hex()[:8] for c in ct])
# blocks 0 and 2 are IDENTICAL plaintext ("SECR") → IDENTICAL ciphertext.
# the attacker learns: "blocks 0 and 2 are the same". Repeat that over a real
# image and the picture shows through. That's the ECB penguin.
```

**2. The fix, previewed** — chain each block to the previous one so identical
plaintexts no longer produce identical ciphertexts (the build does CBC by hand).

## The build: ECB vs CBC on an image

```python
# modes.py — the ECB penguin, rendered with a toy block cipher
import hashlib

def ecb(image, key):                                    # each 8-pixel row block, alone
    return [row ^ int.from_bytes(hashlib.sha256(key + str(idx % 2).encode()).digest()[:1], "big")
            for idx, row in enumerate(image)]           # rows with equal content → equal ct

# simpler visual: a penguin-like image where identical RUNS encrypt identically:
img = ("........########........" * 3).split(".")
def ecb_line(row, key):
    return [hashlib.sha256(key + cell.encode()).hexdigest()[:2] for cell in row]

line = ["W"] * 4 + ["B"] * 4 + ["W"] * 4 + ["B"] * 4 + ["W"] * 8   # penguin stripes
print("plaintext: ", line)
print("ECB:       ", ecb_line(line, "key"))
# every W encrypts identically; every B encrypts identically:
# ['66', '66', '66', '66', '9c', '9c', '9c', '9c', '66', '66', ...]
# the PATTERN SURVIVES. That's the penguin — visible through the encryption.

# CBC: XOR each block with the previous ciphertext block first → repetition destroyed:
def cbc_line(row, key, iv):
    out, prev = [], iv
    for cell in row:
        x = cell + prev                                  # chain: input includes history
        ct = hashlib.sha256(key + x.encode()).hexdigest()[:2]
        out.append(ct); prev = ct                        # history feeds forward
    return out
print("CBC:       ", cbc_line(line, "key", "ab")[:8], "…")   # no two blocks repeat
```

The ECB line leaks the stripe pattern; the CBC line is indistinguishable from
noise — same block cipher, same key, different chaining. **The mode is the
security.** (Modern default: AES-GCM or ChaCha20-Poly1305 — modes that also
authenticate, Chapter 7's promise.)

## What you now know

- Block ciphers transform **fixed-size blocks** deterministically; long messages need
  a **mode of operation** to chain them.
- **ECB leaks structure** — identical plaintext blocks → identical ciphertext blocks:
  the penguin. Never use it. (Stack Overflow answers using it are a running joke.)
- **CBC/CTR/GCM** chain blocks with history — the mode carries half the security.
- Modern authenticated modes (GCM) bundle encryption *and* integrity — the bridge to
  Chapter 7.

Next: secrecy is half the story. An attacker who can't read your message can still
*change* it — undetectably, until MACs arrive.
