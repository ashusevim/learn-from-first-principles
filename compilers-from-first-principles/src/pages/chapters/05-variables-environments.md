---
layout: ../../layouts/Chapter.astro
title: 'Variables & Environments'
description: 'Names live in environments — linked hash maps that also ARE scoping. Build: define, assign, and watch scope shadows work.'
part: 'Part II — Making It Run'
written: true
---

`x = 10` writes; `x` reads — but *where* is x? The answer is the deepest data
structure in language design: the **environment** — a hash map from names to values,
chained to a parent environment. Assignment writes to it; variable reads walk the
chain; and **scoping is the chain's shape**, not a separate feature. This chapter
adds environments to the evaluator and makes Bite remember.

## The lie you were told

> "Variables live in some symbol table managed by the language."

Variables live in **plain hash maps your interpreter holds**. A new scope (block,
function call) = a new map with a pointer to the enclosing map:

```text
global:   {x: 7, print: <builtin>}
             ↑ parent
block:    {y: 2}                    ← a block inside: {x: 7, y: 2} effectively

read y:   found in block            (nearest first)
read x:   not in block → found in global   (walk up)
write x:  WHERE? ← the design decision (Bite assigns where the name exists,
          else defines in the current scope)
```

**Scoping is lookup order.** "Local shadows global" isn't a rule someone enforces —
it's what nearest-first lookup *does*.

## Prove it to yourself

**1. Shadowing, computed:**

```python
global_env = {"x": "global-x", "y": "global-y"}
block_env  = {"x": "block-x", "parent": global_env}   # x shadows, y doesn't

def lookup(env, name):
    while env:
        if name in env: return env[name]
        env = env.get("parent")
    raise NameError(name)

print(lookup(block_env, "x"))   # block-x  ← shadowed
print(lookup(block_env, "y"))   # global-y ← walked up
```

**2. The赋 assignment rule matters** — Chapter 7 of the LLM course's Python had the
same design decision in `mini-git`'s index: where writes land defines the language's
feel. (Bite: assign-to-existing, else define-local.)

## The build: environments in the evaluator

```python
# envs.py — the evaluator gains assignment and variables (~30 new lines)
class Environment:
    def __init__(self, parent=None):
        self.vars, self.parent = {}, parent
    def get(self, name):
        env = self
        while env:
            if name in env.vars: return env.vars[name]
            env = env.parent
        raise NameError(f"undefined variable '{name}'")
    def assign(self, name, value):
        env = self
        while env:                                  # assign where it EXISTS (Ch 1's rule)
            if name in env.vars: env.vars[name] = value; return
            env = env.parent
        self.vars[name] = value                     # nowhere yet: define here
    def define(self, name, value): self.vars[name] = value

def evaluate(node, env):
    if node.kind == "number": return node.value
    if node.kind == "variable": return env.get(node.name)
    if node.kind == "assign":
        value = evaluate(node.expr, env)
        env.assign(node.name, value); return value
    if node.kind == "binary":
        left, right = evaluate(node.left, env), evaluate(node.right, env)
        return {"+": left + right, "-": left - right, "*": left * right,
                "/": left / right}[node.op]
    if node.kind == "print":
        print(evaluate(node.expr, env)); return None
    raise RuntimeError(f"unknown kind {node.kind}")

from parser import parse
from lexer import lex
env = Environment()
for stmt in parse(lex("x = 10\nprint(x * 2 + 1)\nx = x + 5\nprint(x)")):
    evaluate(stmt, env)
# 21
# 15      ← x remembered between statements: the environment IS the memory
```

## What you now know

- Variables live in **environments: hash maps chained by parent pointers** — lookup
  walks nearest-first, and that walk *is* scoping.
- **Assignment targets** (existing-scope vs always-local) are a language-design
  decision with runtime consequences.
- The interpreter's `env` parameter threaded through `evaluate()` is how state
  persists across statements.

Next: expressions and variables make a calculator. Conditionals and loops make it
**Turing-complete** — and the interpreter barely grows.
