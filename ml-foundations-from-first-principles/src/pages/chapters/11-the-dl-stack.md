---
layout: ../../layouts/Chapter.astro
title: 'Why Frameworks Exist: The Autograd Contract'
description: 'PyTorch/TF automate Chapter 5’s bookkeeping. Build: the contract — define-by-run, auto-derivatives.'
part: 'Part III — Beyond Basics'
written: true
---

Chapter 5 built backprop by hand for one network — and you felt the cost: every
operation needed its hand-derived local gradient and its bookkeeping. Change the
architecture and you re-derive everything. **Frameworks exist to automate exactly
that**: you define computations; they record the graph and run the backward pass.
This chapter distills the contract ("define-by-run"), builds a minimal version to
show the seam, and sets up the finale — your own engine.

## The lie you were told

> "PyTorch is a library of models."

The core of PyTorch is **autograd**: a system where every tensor operation (1) runs
the math and (2) records itself into a computation graph. Call `.backward()` and the
recorded graph executes Chapter 5's chain rule *in reverse, automatically* — for any
architecture you write, with no hand-derived gradients anywhere. The models,
optimizers, and data loaders are convenience layers around that.

## The contract

```text
1. define-by-run:   every operation on tracked tensors appends a node to the graph
2. backward:        traverse the graph in reverse, applying each op's local gradients
3. branching sums:  a value used by two ops receives the SUM of both gradients (Ch 5)
4. no_grad zones:   inference skips recording (no graph = no memory overhead)
```

Chapter 5's hand-written `backprop()` had these facts hardcoded for one architecture.
The contract generalizes them: *any* graph of supported ops gets correct gradients.

## Prove it to yourself

**1. The seam, visible in the API:**

```python
# PyTorch pseudocode — the contract in four lines:
# z = x * w + b        ← forward: math + graph recording, simultaneously
# z.backward()         ← reverse: the graph IS the backward schedule
# w.grad               ← Chapter 5's ∂loss/∂w, computed for free
```

**2. Why the graph must be recorded at runtime** — `if` statements, loops, and data-
dependent shapes change the computation; a runtime-recorded graph captures *what
actually executed* (define-by-run), which is why control flow "just works" in modern
frameworks — and why Chapter 8 of the concurrency course (pause the loop) and this
contract rhyme: both are "make the implicit schedule explicit data."

## The build: a 30-line sketch of autograd

The finale builds this properly in ~200 lines; here's the irreducible sketch, to see
the seam:

```python
# autogradsketch.py — the autograd contract, minimal
class Value:
    def __init__(self, data, parents=()):
        self.data, self.parents = data, parents
        self.grad = 0.0
    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, parents=[(self, 1.0), (other, 1.0)])
        return out                                       # d(a+b)/da = 1: pass-through
    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, parents=[(self, other.data), (other, self.data)])
        return out                                       # d(a*b)/da = b (and vice versa)
    def backward(self):
        topo, seen = [], set()                           # reverse topological order (Ch 5!)
        def build(v):
            if v not in seen:
                seen.add(v)
                for p, _ in v.parents: build(p)
                topo.append(v)
        build(self)
        self.grad = 1.0                                  # ∂self/∂self
        for v in reversed(topo):                         # the backward pass:
            for parent, local in v.parents:
                parent.grad += v.grad * local            # chain rule × SUM over branches

a, b = Value(3.0), Value(-2.0)
c = a * b + a                                           # the graph records itself
c.backward()
print(f"c = {c.data}, ∂c/∂a = {a.grad}, ∂c/∂b = {b.grad}")
# c = 7.0, ∂c/∂a = -1.0, ∂c/∂b = 3.0   — the chain rule, executed on a recorded graph
# (∂c/∂a = b·1 + 1 = -2+1 = -1: both branch contributions SUMMED, exactly per Ch 5)
```

Thirty lines deliver the contract: define-by-run recording, reverse-topological
backward, branch summation. The finale (~200 lines) adds more ops, a `Tensor` shape,
and trains a neural network through it — closing the loop with Chapter 5.

## What you now know

- Frameworks = **autograd** (the contract) + conveniences. The contract: record the
  graph at runtime, execute the chain rule in reverse, sum over branches.
- Define-by-run is why control flow works; no_grad/inference modes are "don't
  record".
- Chapter 5's hand-derived backprop and PyTorch's `.backward()` are the same
  mathematics at two levels of automation — and the finale builds the automation.

Next, the finale: the **tiny autograd engine** — a Value class with full operations,
backprop verified numerically (Chapter 5's honesty test), training a real network
through it.
