---
layout: ../../layouts/Chapter.astro
title: 'What Is Graphics, Really?'
description: 'A framebuffer is an array of pixels; every image ever drawn is a loop over it. Build: a PPM image written from raw bytes — no libraries.'
part: 'Part I — The Framebuffer'
written: true
---

Every image on every screen you've ever seen — games, photos, this page — is an
**array of pixels** (the framebuffer) written by a loop. Graphics is the discipline
of that loop: which pixels, which colors, in what order, and why. This chapter
writes an image from raw bytes with **zero libraries** — the PPM format is a header
plus RGB bytes — and establishes the framebuffer model every later chapter renders
into.

## The lie you were told

> "Images are files you open with libraries."

Images are **arrays**, and the simplest format on Earth proves it: PPM is six bytes
of header followed by raw RGB values. Writing it is `open()`, three numbers, and your
pixels. Every format (PNG, JPEG) is that array plus compression and metadata — the
pixels underneath never change.

## The framebuffer model

```text
framebuffer = width × height × 3 bytes    (red, green, blue per pixel)
pixel (x, y) starts at offset (y × width + x) × 3
origin: top-left (0,0) in image files; y grows DOWNWARD
```

That's the entire model. Every later chapter fills this array: lines (Ch 2),
triangles (Ch 3), shaded 3D (Ch 4–6), ray-traced light (Ch 7–9). The framebuffer
never changes.

## Prove it to yourself

**1. An image is bytes — view your own output:**

```sh
python3 gradient.py && head -c 32 gradient.ppm | xxd
# 5036 0a 32 35 30 20 32 35 30 0a 32 35 35 0a ...   ← "P6", "250 250", "255", then pixels
# open gradient.ppm in any image viewer — or GIMP, or your browser.
```

**2. Every format descends to this** — open any PNG in an editor that shows raw
chunks: inside the compression, it's the same pixel array.

## The build: gradient.ppm, from raw bytes

```python
# gradient.py — write a valid image with zero libraries (~15 lines)
W, H = 250, 250

fb = bytearray(W * H * 3)                    # the framebuffer: W×H×3 bytes
for y in range(H):
    for x in range(W):
        i = (y * W + x) * 3                  # pixel (x,y)'s offset
        fb[i + 0] = int(255 * x / W)         # red   grows →
        fb[i + 1] = int(255 * y / H)         # green grows ↓
        fb[i + 2] = 128                      # blue fixed

with open("gradient.ppm", "wb") as f:
    f.write(f"P6\n{W} {H}\n255\n".encode())  # header: magic, size, maxval
    f.write(fb)                              # the pixels, raw

print("wrote gradient.ppm — open it in any image viewer")
```

Open it: a red-to-green gradient sweeping down-right. You wrote an image **from
bytes**. The reader exercise: parse the header, read the pixels, print the color at
(125, 125) — an image decoder in 10 lines.

## What you now know

- The framebuffer = **W×H×3 bytes**; pixel (x,y) at offset (y×W+x)×3; origin
  top-left.
- **PPM = header + raw RGB** — images are arrays, provably, in 15 lines.
- Every later chapter renders into this exact array; only the loops change.

Next: the first real drawing primitive — a straight line between two points, using
only integer additions. Bresenham's 1965 trick.
