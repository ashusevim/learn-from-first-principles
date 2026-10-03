---
layout: ../../layouts/Chapter.astro
title: 'Control Flow: If, While & Turing Completeness'
description: 'Conditionals and loops make the language universal. Build: if/else and while in the interpreter — recursion works for free.'
part: 'Part II — Making It Run'
written: true
---

Expressions and variables make Bite a calculator; **conditionals and loops** make it
a programming language — the moment it becomes capable of computing anything
computable (Turing completeness). And in a tree-walking interpreter they're almost
embarrassingly small: `if` evaluates a condition and picks a branch; `while` loops
the evaluation. This chapter adds both, plus functions — and Bite runs real
programs.

## The lie you were told

> "Control flow needs special support deep in the runtime."

In a tree-walker, control flow is **Python's own control flow**:

```python
if kind == "if":
    if evaluate(node.cond, env):                 # truthy → run the then-branch
        evaluate(node.then, env)
    elif node.els: evaluate(node.els, env)
    return None
if kind == "while":
    while evaluate(node.cond, env):              # loop = re-evaluating the subtree
        evaluate(node.body, env)
    return None
```

The interpreter's recursion (Chapter 4) executes subtrees; `if` *chooses* which
subtree, `while` *re-chooses* it in a loop. The Python `while` becomes Bite's
`while`. (That's also the tree-walker's limit: Bite loops run in Python's stack —
deep Bite recursion hits Python's recursion limit. The bytecode VM, Chapter 8, owns
its own stack and outgrows that.)

## Functions, early: the environment trick

A `fun` definition just stores the function's AST *and* its birth environment in a
variable; a call creates a fresh environment whose parent is that birth environment
— and evaluates the body in it:

```python
if kind == "fun":                                # define: capture NOW, call LATER
    env.define(node.name, {"params": node.params, "body": node.body, "env": env})
if kind == "call":
    fn = evaluate(node.callee, env)
    call_env = Environment(parent=fn["env"])     # ← the birth env: closure mechanics!
    for param, arg in zip(fn["params"], node.args):
        call_env.define(param, evaluate(arg, env))
    result = None
    for stmt in fn["body"]: result = evaluate(stmt, call_env)
    return result                                # (Bite: last statement's value)
```

That `parent=fn["env"]` line **is closures** — Chapter 10's headline, falling out of
the environment chain. Functions defined inside functions keep their birth scope
alive through it.

## Prove it to yourself

**1. Turing completeness, demonstrated by a program:**

```bite
x = 0
total = 0
while x < 10 { total = total + x; x = x + 1 }
print(total)        // 45
```

Variables + arithmetic + conditionals + unbounded loops = any computation. (The
formal claim is Turing's; the practical claim: Bite can now express real programs.)

**2. Recursion, free of charge:**

```bite
fun fib(n) {
  if n < 2 { n } else { fib(n - 1) + fib(n - 2) }
}
print(fib(10))      // 55 — the function calls ITSELF; each call gets a fresh
                    // environment chained to its birth env. Recursion is just
                    // environments + calls. No extra feature was added.
```

## The build: statements and functions in the interpreter

```python
# control.py — Chapter 5's evaluator + if/while/fun/call (the full language, minus VM)
class Environment:                                 # (Chapter 5, unchanged)
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
        while env:
            if name in env.vars: env.vars[name] = value; return
            env = env.parent
        self.vars[name] = value
    def define(self, name, value): self.vars[name] = value

def evaluate(node, env):
    kind = node.kind
    if kind in ("number", "string"): return getattr(node, "value")
    if kind == "variable": return env.get(node.name)
    if kind == "assign":
        value = evaluate(node.expr, env); env.assign(node.name, value); return value
    if kind == "binary":
        l, r = evaluate(node.left, env), evaluate(node.right, env)
        return {"+": l + r, "-": l - r, "*": l * r, "/": l / r,
                "<": l < r, ">": l > r, "==": l == r}[node.op]
    if kind == "print": print(evaluate(node.expr, env)); return None
    if kind == "if":
        if evaluate(node.cond, env): evaluate(node.then, env)
        elif getattr(node, "els", None): evaluate(node.els, env)
        return None
    if kind == "while":
        while evaluate(node.cond, env): evaluate(node.body, env)
        return None
    if kind == "fun":
        env.define(node.name, {"params": node.params, "body": node.body, "env": env})
        return None
    if kind == "call":
        fn = evaluate(node.callee, env)
        call_env = Environment(parent=fn["env"])
        for p, a in zip(fn["params"], node.args): call_env.define(p, evaluate(a, env))
        result = None
        for stmt in fn["body"]: result = evaluate(stmt, call_env)
        return result
    raise RuntimeError(f"unknown kind {kind}")

# the blocks/if/while parse rules slot into Chapter 3's parser:
#   statement: if expr block [else block] | while expr block | fun name(params) block | ...
#   block: '{' statement* '}'  → AST("block", stmts=[...])  — evaluate runs kids in env

from parser import parse
from lexer import lex
program = parse(lex("""
x = 0
total = 0
while x < 10 { total = total + x; x = x + 1 }
print(total)
fun fib(n) { if n < 2 { n } else { fib(n - 1) + fib(n - 2) } }
print(fib(10))
"""))
env = Environment()
for stmt in program: evaluate(stmt, env)
# 55
# 55
```

Bite runs loops, conditionals, and recursive functions. **The language is
Turing-complete, and the interpreter is under 100 lines.** Part II is complete.

## What you now know

- `if`/`while` in a tree-walker = **Python's own control flow choosing subtrees** —
  tiny code, Turing-complete result.
- **Functions = captured environment + fresh child env per call** — closures
  (Chapter 10) fall out of the parent chain.
- The tree-walker's recursion is Python's — the bytecode VM (next part) owns its
  stack precisely to outgrow that.

Next: the tree-walk is simple and slow. Part III compiles the AST into **bytecode**
for a stack machine — the architecture Python and Java actually use.
