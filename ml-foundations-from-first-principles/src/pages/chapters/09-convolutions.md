---
layout: ../../layouts/Chapter.astro
title: 'Convolutions: Kernels That See'
description: 'Weight sharing across space — how networks see edges everywhere. Build: convolve an image with edge detectors.'
part: 'Part III — Beyond Basics'
written: true
---

Everything so far treated inputs as flat vectors — which throws away the one thing
images have: **space**. An edge in the corner is the same phenomenon as an edge in
the center; a flat network must learn it twice. The **convolution** shares one small
kernel (a grid of weights) across every location — one pattern, detected everywhere.
This chapter convolves a real image with edge-detection kernels and produces a
visible edge map.

## The lie you were told

> "Vision networks learn separate weights per pixel."

A convolution **slides a small grid over the image**, multiplying and summing at each
position — the output at each location is "how much does this patch look like the
kernel?":

```text
kernel (3×3)          image region       output pixel = Σ kernel ⊙ patch
[-1 0 1]
[-2 0 2]     ⊛        [ ...9 pixels... ]  →  one number: "edge strength here"
[-1 0 1]
```

Three properties fall out of sharing:

1. **Translation invariance** — the same edge fires the same response anywhere.
2. **Few parameters** — a 3×3 kernel is 9 weights, not one per pixel pair; a
   full-image layer for a 1000×1000 image would be 10¹² weights.
3. **Local structure** — each output sees only a small patch; deep layers compose
   edges → textures → shapes → objects.

## The canonical kernels

Edge detectors are classical image processing, predating deep learning by decades —
the network learns *its own* kernels, but starts from these:

```text
Sobel-x (vertical edges)      Sobel-y (horizontal edges)
[-1 0 1]                      [-1 -2 -1]
[-2 0 2]                      [ 0  0  0]
[-1 0 1]                      [ 1  2  1]
```

## Prove it to yourself

**1. One kernel, everywhere** — the build below runs Sobel over a synthetic image;
every box edge lights up in the output, at every position, from *nine weights*.

**2. The parameter count, collapsed:**

```python
# a 1000×1000 image, a 1000×1000 dense layer: 10^12 weights.
# a 3×3 convolution: 9 weights, and it sees the whole image.
# weight sharing is why vision networks have millions of parameters, not trillions.
```

## The build: convolve an image, get an edge map

```python
# conv.py — Sobel edge detection: the convolution, hand-rolled
import numpy as np

# a synthetic image: bright squares on dark — boxes need edges
img = np.zeros((12, 12)); img[2:6, 3:7] = 1.0; img[7:11, 6:10] = 0.6

KX = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])   # vertical-edge kernel
KY = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])   # horizontal-edge kernel

def convolve(img, K):
    H, W = img.shape
    out = np.zeros((H - 2, W - 2))
    for i in range(H - 2):
        for j in range(W - 2):
            out[i, j] = (img[i:i+3, j:j+3] * K).sum()   # ⊙ and sum = the convolution
    return out

gx, gy = convolve(img, KX), convolve(img, KY)
edges = np.sqrt(gx**2 + gy**2)                          # edge strength, any direction

def show(m):
    chars = " .:*#@"
    for row in m:
        print("".join(chars[min(int(abs(v) * 5), 5)] for v in row))

print("image:"); show(img)
print("edges:"); show(edges)
# image:            edges:
#  . . . . .        (blank interior — flat regions have zero gradient)
#  . #### .         #  #  #      ← the box's borders, lit up
#  . #### .         #  #  #
#  ...              (and the second box's borders, same 9 weights)
```

Read the edge map: the boxes' outlines glow, their interiors are dark (flat = zero
gradient), and the *same nine weights* found every border at every position. A CNN's
first layer learns kernels like these automatically — from labeled data, instead of
Sobel's hand-crafted coefficients.

## What you now know

- Convolution = **one small kernel slid across the whole input** — translation
  invariance and parameter sharing by construction.
- Classical kernels (Sobel) detect edges; CNNs **learn** theirs — same operation,
  trained coefficients.
- Deep vision = convolutions composing edges → textures → shapes; the locality and
  sharing are why it's feasible.
- The same weight-sharing argument reappears everywhere data has structure
  (time-series → 1-D convs; the web course's audio, etc.).

Next: a lens chapter — the LLM course's embeddings and attention, recast as what
they really are: learned function approximators trained by *this* course's gradient
descent.
