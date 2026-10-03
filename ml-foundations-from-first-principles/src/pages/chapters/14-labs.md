---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the autograd engine from Chapter 12 — gradients, networks, overfitting, convolutions. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a gradient value, a loss curve, or a
prediction you check against arithmetic — using `Value`, `Neuron` and `MLP`
from Chapter 12. Nothing here is new: loss (Ch 2), splits (Ch 3), neurons
(Ch 4), backprop (Ch 5), dynamics (Ch 6). What is new is watching the loop
misbehave and naming the misbehavior correctly.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Print numbers first, plot second — a gradient that disagrees
with calculus by `1e-3` is a bug, and the arithmetic below always shows it.

| Tool | What it proves |
|---|---|
| hand-derived gradients | what `backward()` must print |
| loss curves (train vs test) | learning vs memorizing, per epoch |
| `lr` sweeps on one problem | the stride's whole personality |
| tiny datasets you invent | control groups with known answers |

## Warm-ups

**Lab 1.1 — Check one gradient by hand**
**Goal:** `backward()` agrees with calculus on a two-op graph.
**Do this:**
```python
v = Value(3.0); out = v * v + v   # d(out)/dv = 2v + 1 = 7 at v = 3
out.backward()
print(v.grad)
```
**You'll know it works when:** it prints `7.0` (within float dust). The engine
is a chain-rule machine; this is its multiplication table.
**Where it comes from:** Chapter 5 — Backpropagation: The Chain Rule, Mechanized.

**Lab 1.2 — Watch descent descend**
**Goal:** the loop visibly improves, one print per epoch.
**Do this:** fit `y = 2x + 1` with one neuron, `lr = 0.1`, printing loss every
10 epochs for 100 epochs.
**You'll know it works when:** the loss falls monotonically-ish toward ~0 and
the weight reads near `2.0`. Monotone-ish, not monotone — noise is normal,
plateaus are data.
**Where it comes from:** Chapter 2 — Loss & Gradient Descent.

**Lab 1.3 — Memorize, then get caught**
**Goal:** the train/test gap as a number you produce.
**Do this:** fit 5 noisy points with a 4-layer MLP to near-zero train loss,
then evaluate 50 fresh points from the same function.
**You'll know it works when:** train ≈ 0, test is embarrassing — the gap is the
verdict, and the verdict is Chapter 3. Capacity without discipline memorizes.
**Where it comes from:** Chapter 3 — Overfitting & the Train/Test Split.

## Builds

**Lab 2.1 — Sweep the learning rate**
**Goal:** the stride's whole personality in one table.
**Do this:** fit Lab 1.2's line with `lr` in (0.001, 0.01, 0.1, 1.0), 100
epochs each, recording final loss.
**You'll know it works when:** the table reads crawl / steady / fast /
exploded-or-NaN — the full arc of Chapters 2 and 6 in four cells. Your default
`lr` now has an evidence base.
**Where it comes from:** Chapter 6 — Training Dynamics: Rates, Batches & Schedules.

**Lab 2.2 — Batch it and feel the noise**
**Goal:** stochastic steps trade exactness for speed — measure the trade.
**Do this:** fit one dataset full-batch vs batches-of-8, same epochs, and plot
both loss curves.
**You'll know it works when:** the batch curve jitters but finishes first in
wall time — noise per step, speed per epoch. The jitter is the price; the clock
is the prize.
**Where it comes from:** Chapter 6.

**Lab 2.3 — Classify, then read the probabilities**
**Goal:** softmax outputs are a distribution you can audit (Chapter 7).
**Do this:** train a tiny 3-class classifier, print `softmax` outputs for one
example per class, and check the rows sum to 1.
**You'll know it works when:** rows sum to 1.0, the true class leads — and a
`0.51` prediction reads as the shrug it is. Probabilities are the product;
accuracy is the summary.
**Where it comes from:** Chapter 7 — Classification & Softmax.

**Lab 2.4 — Regularize the memorizer**
**Goal:** Lab 1.3's embarrassment, treated two ways.
**Do this:** repeat Lab 1.3 with dropout on, then again with weight decay,
keeping everything else fixed.
**You'll know it works when:** test loss drops both times while train loss
*rises* slightly — the signature of a cure working. Two treatments, same
diagnosis: excess capacity.
**Where it comes from:** Chapter 8 — Regularization: Dropout & Weight Decay.

**Lab 2.5 — Convolve, don't densify**
**Goal:** shared weights see locally with few parameters (Chapter 9).
**Do this:** count parameters for a 5×5-kernel conv layer vs a dense layer on
the same 28×28 input, then train both on a tiny shape task.
**You'll know it works when:** the conv layer has ~25 weights per filter
against the dense layer's thousands — and matches or beats it. Structure beats
capacity when the data has locality.
**Where it comes from:** Chapter 9 — Convolutions: Kernels That See.

## Stretch goals

**Lab 3.1 — Vanish a gradient**
**Goal:** depth without care kills the signal (Chapters 4–5).
**Do this:** stack 8 sigmoid layers, print `grad` norms per layer after one
backward pass.
**You'll know it works when:** early layers read ~0 while late layers read
loud — the signal decayed exponentially with depth. Swap in ReLU and watch the
early layers wake: the fix, priced in one activation.
**Where it comes from:** Chapters 4–5.

**Lab 3.2 — Attention as routing**
**Goal:** weights that choose what matters (Chapter 10), inspected.
**Do this:** on a tiny copy-task, print the attention weights for one query
position.
**You'll know it works when:** the weight concentrates on the position being
copied — routing, visible as a distribution. Diffuse weights mean the model
hasn't learned to look; peaked means it has.
**Where it comes from:** Chapter 10 — Embeddings & Attention, Recast as Learning.

## Self-checking without a grader

- **Arithmetic labs** (1.1, 1.2, 2.1): exact gradients, monotone-ish loss, the
  four-cell `lr` table. Calculus and the table don't negotiate — match them.
- **Gap labs** (1.3, 2.4, 3.1): train-vs-test numbers, per-layer norms. The gap
  is the diagnosis; the treatment must move it, not the story.
- **Shape labs** (2.2, 2.3, 2.5, 3.2): jitter-vs-clock, rows summing to 1,
  parameter counts, peaked weights. Structure leaves signatures — read them.

## What you now know

- **Every failure has a curve:** divergence (lr), memorization (gap),
  starvation (vanished grads) — plot first, theorize second.
- **Capacity is a budget:** spend it with regularization watching (Labs 1.3,
  2.4), and structure beats raw size where data has shape (Lab 2.5).
- **The loop is the product:** batches, schedules, and strides are not
  trivia — they decide what the same network learns (Labs 2.1–2.2).
- Your `MLP` is now a laboratory instrument, not a trophy: point it at any new
  idea and read the curves.

Next: reimplement one idea from a real paper's abstract on your engine —
attention is just weighted routing, and the curves will tell you if you got it.
