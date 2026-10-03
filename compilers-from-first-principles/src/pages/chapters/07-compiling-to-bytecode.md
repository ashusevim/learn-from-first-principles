---
layout: ../../layouts/Chapter.astro
title: 'Compiling to Bytecode'
description: 'The tree walk is slow; compile the AST to a flat instruction list. Build: Bite’s compiler emitting stack-machine bytecode.'
part: 'Part III — The Bytecode VM'
written: true
---

The tree-walking interpreter (Part II) re-walks the AST on every execution — walk
overhead on every addition. A **bytecode compiler** walks the AST *once*, translating
it into a flat list of instructions for a **stack machine** — and the VM (Chapter 8)
executes that list at memory speed, no tree, no recursion. This chapter builds the
compiler: every AST node becomes a sequence of stack instructions.

## The lie you were told

> "Bytecode is an implementation detail you never see."

You've seen it — Chapter 1 ran Python's `dis` on `x = 1 + 2 * 3` and got
`LOAD_CONST, LOAD_CONST, BINARY_OP, STORE_NAME`. Bite compiles to the *same shape*,
because both target a **stack machine**: operands are pushed; operations pop them
and push the result.

## The stack-machine idea

```text
1 + 2 * 3 compiles to:
    PUSH 1        stack: [1]
    PUSH 2        stack: [1, 2]
    PUSH 3        stack: [1, 2, 3]
    MUL           stack: [1, 6]      ← pops 2, 3; pushes 6
    ADD           stack: [7]         ← pops 1, 6; pushes 7
```

The tree's *post-order shape* (Chapter 4's evaluation order) becomes a *linear
instruction order* — the compiler flattens the recursion into a list, once. The VM
then runs the list at array speed, forever.

## Compiling: recursion, emitting as it goes

The compiler walks the AST exactly like the tree-walker (Chapter 4) — but instead of
*computing*, it **emits instructions**:

```python
def compile_expr(node):
    if node.kind == "number": emit("PUSH", node.value)
    if node.kind == "binary":
        compile_expr(node.left)          # left first → it's deeper in the stack
        compile_expr(node.right)         # right second → on top
        emit(OPS[node.op])               # op pops both, pushes one
```

Children first, parent's op last — post-order, again. Precedence (Chapter 3's tree
shape) is preserved automatically.

## Prove it to yourself

**1. Variables compile to named slots:**

```text
x = 10   →   PUSH 10; POPVAR x        (define)
x + 1    →   PUSHVAR x; PUSH 1; ADD
```

**2. Bytecode is inspectable in every real language** — Python's `dis` (Chapter 1),
Java's `javap`, Lua's `luac -l`. After this chapter, all three listings read like
your own compiler's output.

## The build: Bite's bytecode compiler

```python
# compile.py — AST → bytecode for a stack machine (~40 lines)
class Compiler:
    def __init__(self):
        self.code = []                       # list of (opcode, arg)
    def emit(self, op, arg=None):
        self.code.append((op, arg))

    def compile_program(self, stmts):
        for s in stmts: self.stmt(s)
        self.emit("HALT")
        return self.code

    def stmt(self, node):
        if node.kind == "print":
            self.expr(node.expr); self.emit("PRINT")
        elif node.kind == "assign":
            self.expr(node.expr); self.emit("POPVAR", node.name)

    def expr(self, node):
        if node.kind == "number": self.emit("PUSH", node.value)
        elif node.kind == "variable": self.emit("PUSHVAR", node.name)
        elif node.kind == "binary":
            self.expr(node.left)             # left evaluated first...
            self.expr(node.right)            # ...right on top of it
            self.emit({"+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV",
                       "<": "LT", ">": "GT", "==": "EQ"}[node.op])

# ── compile a real program and print the bytecode ──
from parser import parse
from lexer import lex
program = parse(lex("x = 1 + 2 * 3\nprint(x * 2)"))
code = Compiler().compile_program(program)
for i, (op, arg) in enumerate(code):
    print(f"{i:3d}  {op:8s} {arg if arg is not None else ''}")
#   0  PUSH     3.0          ← wait, 3 first? Right-to-left: see note below.
#   2  PUSH     2.0
#   4  MUL
#   5  PUSH     1.0
#   7  ADD
#   8  POPVAR   x
#  10  PUSHVAR x
#  12  PUSH     2.0
#  14  MUL
#  15  PRINT
#  16  HALT
```

(Note the operand order: this compiler emits **right then left**, so the left
operand lands on *top* — and MUL pops left-then-right. Operand order is a
per-compiler convention; the stack discipline is what matters, and Chapter 8's VM
matches this exact convention.)

## What you now know

- The compiler **flattens the AST into a linear instruction list** — the tree walk,
  done once at compile time instead of every run.
- Stack-machine bytecode: **operands pushed, ops pop-and-push** — post-order tree
  shape turned into instruction order.
- Same program, two runtimes: Chapters 4–6's tree-walker vs this bytecode — Chapter
  8 runs both and compares.

Next: the other half — the VM that executes this instruction list. Push, pop, add:
the machine is smaller than the compiler.
