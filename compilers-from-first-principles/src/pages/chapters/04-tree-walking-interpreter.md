---
layout: ../../layouts/Chapter.astro
title: 'The Tree-Walking Interpreter'
description: 'Walk the AST, compute results — the language RUNS. Build: an evaluator that turns Bite into a calculator, then more.'
part: 'Part II — Making It Run'
written: true
---

The parser produced a tree that *means* something. The tree-walking interpreter makes
it mean something **now**: walk the AST, compute each node's value bottom-up. That's
an interpreter — no bytecode, no VM, just recursion over the meaning. This chapter
makes Bite a working calculator, and Chapter 5–6 grow it into a real language.

## The lie you were told

> "Interpreters and compilers are different species."

They're the same program up to Chapter 3 — identical lexer and parser. They diverge
at the AST: the **tree-walker executes it directly** (simple, immediate); the
**compiler translates it** to bytecode for a VM (faster, Chapter 7). Python started
as a tree-walker; CPython still compiles to *its own* bytecode. Same spectrum,
different points.

## The evaluator: one function, one case per node kind

```python
def evaluate(node):
    match node.kind:
        case "number":  return node.value          # a literal is its own value
        case "binary":  left = evaluate(node.left) # compute children FIRST...
                        right = evaluate(node.right)
                        return apply_op(node.op, left, right)   # ...then combine
        case "unary":   return -evaluate(node.expr)
```

The recursion *is* the execution order: post-order traversal — children evaluate
before parents, which is exactly operator semantics.

## Prove it to yourself

**1. The tree from Chapter 3, evaluated by hand:**

```text
parse:  x = 1 + 2 * 3   →   Assign(x, Binary(+, 1, Binary(*, 2, 3)))
evaluate: Binary(*, 2, 3) → 6     (children 2, 3 → combine)
          Binary(+, 1, 6) → 7     (the * subtree first: precedence, honored)
          Assign(x, 7)
```

**2. Division's edge case** — `1 / 0` raises ZeroDivisionError *during evaluation*:
runtime errors are evaluation errors. Chapter 11 wraps them with line numbers.

## The build: the evaluator

```python
# interpret.py — the tree-walking evaluator (~35 lines)
from parser import parse          # Chapter 3
from lexer import lex

def evaluate(node):
    kind = node.kind
    if kind == "number": return node.value
    if kind == "string": return node.value
    if kind == "variable": return node.name            # Ch 5 resolves this for real
    if kind == "unary":   return -evaluate(node.expr)
    if kind == "binary":
        left, right = evaluate(node.left), evaluate(node.right)
        ops = {"+": left + right, "-": left - right, "*": left * right,
               "/": left / right, "<": left < right, ">": left > right,
               "<=": left <= right, ">=": left >= right,
               "==": left == right, "!=": left != right}
        return ops[node.op]
    if kind == "print":
        print(evaluate(node.expr)); return None
    raise RuntimeError(f"unknown node kind {kind}")

for src in ("1 + 2 * 3", "(1 + 2) * 3", "10 / 4", "3 > 2", "-(4 + 1)"):
    print(f"{src:>12} = {evaluate(parse(lex(src)))}")
#     1 + 2 * 3 = 7          ← precedence, honored by tree shape
#   (1 + 2) * 3 = 9          ← parens reshaped the tree, reshaped the result
#       10 / 4 = 2.5
#         3 > 2 = True
#     -(4 + 1) = -5
```

Bite evaluates expressions. Five chapters from now it runs loops and closures — but
*this* is the moment the language comes alive: text went in, a computed answer came
out.

## What you now know

- The tree-walking interpreter = **post-order traversal of the AST**, computing
  bottom-up — the simplest thing that executes a language.
- **Precedence was already solved** by the parser's tree shape; the evaluator just
  trusts it.
- Interpreters and compilers share Chapters 1–3 wholesale — the AST is the fork in
  the road.

Next: expressions compute, but programs *remember*. Variables — and the data
structure that is secretly scoping: environments.
