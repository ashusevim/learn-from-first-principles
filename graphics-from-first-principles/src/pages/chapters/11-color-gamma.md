---
layout: ../../layouts/Chapter.astro
title: 'Color: Gamma, sRGB & Blending'
description: 'Why 0.5 + 0.5 isn’t mid-gray: displays are nonlinear. Build: linear vs gamma-space blending, half the lesson visible.'
part: 'Part IV — The Real World'
written: true
---

One last polish, and it changes how every color in your engine behaves: **displays
are nonlinear**. The value 0.5 in a framebuffer does not emit half the light —
the screen applies a ~2.2 power curve (gamma) inherited from CRT phosphors. Every
blend, every average, every lighting falloff you computed was in *code value* space
unless you deliberately converted — and "why does my dark scene look muddy?" and
"why does my lighting look washed out?" are both gamma mistakes. This chapter makes
the difference visible.

## The lie you were told

> "Framebuffer value 0.5 is half brightness."

The display's response:

```text
emitted light ≈ value^2.2          (sRGB ≈ 2.2 gamma)
value 0.5 → 0.5^2.2 ≈ 0.22         ← a fifth of the light, not half!
```

So the framebuffer stores *perceptually encoded* values (humans see more detail in
darks — the curve allocates bits where eyes are). The rule for renderers:

```text
light math in LINEAR space (where physics works: 2 lights = 2× light)
convert:  linear → sRGB (≈ pow(1/2.2)) when WRITING the framebuffer
convert:  sRGB → linear (≈ pow(2.2)) when READING textures
```

Blend in the wrong space and midtones go muddy (blending in sRGB) or highlights
blow out (double-converting). Every "my game looks dark and gritty for no reason"
bug is this.

## Prove it to yourself

**1. The curve, measured:**

```python
for v in (0.2, 0.5, 0.8):
    print(f"value {v}: emitted {v**2.2:.3f}")
# value 0.2: emitted 0.027     ← a fifth of the value, a THIRTIETH of the light
# value 0.5: emitted 0.218
# value 0.8: emitted 0.612
# the display's response is wildly nonlinear — and human eyes match it (that's WHY).
```

**2. The blend difference, visible:** 50% white over black —
in sRGB space you get value 0.5 (emits 0.22 — dark); in linear space you get
emitted 0.5 (value 0.73 — the honest midpoint). Two different grays for "half and
half", and linear is the physically correct one.

## The build: linear blending, done right

```python
# gamma.py — the same 50/50 blend, both spaces, side by side
import numpy as np

def to_srgb(linear):                 # linear → framebuffer values (encode)
    return np.where(linear <= 0.0031308, 12.92 * linear,
                    1.055 * linear ** (1/2.4) - 0.055)
def to_linear(srgb):                 # framebuffer values → linear light (decode)
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)

black = np.zeros(3)
white = to_linear(np.array([1.0, 1.0, 1.0]))

naive = np.full(3, 0.5)                                     # blended in sRGB: wrong
linear = to_srgb((black + white) / 2)                       # blended in linear: right
print("50% white over black, sRGB blend:  ", np.round(naive, 3))   # [0.5]
print("50% white over black, linear blend:", np.round(linear, 3))   # [0.735]
# 0.5 emits 22% light. 0.735 emits ~50% light. The linear blend is the HONEST half.
# (write both into your gradient.ppm as two stripes and SEE the difference.)
```

The full pipeline of a correct renderer, recited:

```text
textures (stored sRGB) ──decode──► linear
        lighting, blending, ALL math in linear
output ──encode──► sRGB framebuffer ──► display applies 2.2 ──► your linear intent
```

## What you now know

- Displays apply **~2.2 gamma**: framebuffer values are perceptually encoded, not
  linear light.
- **Do light math in linear; encode on output; decode on input.** Blending in sRGB
  makes midtones muddy — visible in one stripe test.
- sRGB is the standardized encode curve (≈2.2 with a linear toe); every "why does
  my render look off" bug list starts here.

Next, the finale: the z-buffered rasterizer and the ray tracer, joined by correct
color — one scene description, two renderers, two images. The course's proof of
work.
