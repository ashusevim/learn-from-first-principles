---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Compilers on One Page'
description: 'The whole pipeline — lexer, parser, VM, closures — on one page: the model, the stages, the invariants, and the classic bugs.'
part: 'Part V — Practice & Reference'
written: true
---

The course is over; this page is the index into what you built. **One model, one
reference table, one list of traps** — enough to re-find any decision in under a minute.
Every name below is code you wrote: `lexer.py` (Chapter 2), `parser.py` (Chapter 3),
`compile.py` (Chapter 7), `vm.py` (Chapter 8), and the assembled `bite.py` of Chapter 12.

## The one-page model

```text
  source text         tokens          AST          bytecode            results
  x = 1 + 2 * 3  →  [ident, op…]  →   tree   →  [PUSH 3, PUSH 2, MUL…]  →  7.0
       Ch 2            Ch 3         Ch 7          Ch 8–10          your terminal
```

Four programs, three seams, two runtimes, one language. **Each stage is a pure function
from one representation to the next** — the lexer has no opinion about grammar, the
parser none about execution, the compiler decides nothing at run time. *Text → tokens →
tree → instructions → values, and every bug lives at a seam.*

## The compiler you actually use

| Tool | What it does | In your build |
|---|---|---|
| `lex(source)` | characters → tokens, each tagged with its line | `lexer.py` (Ch 2) |
| `parse(tokens)` | tokens → AST, one function per grammar rule | `parser.py` (Ch 3) |
| `evaluate(node, env)` | walks the AST directly, no bytecode | Ch 4–6 |
| `Compiler().compile_program(prog)` | AST → flat list of `(opcode, arg)` | `compile.py` (Ch 7) |
| `run(code, functions)` | the VM loop: `ip`, stack, environment chain | `vm.py` (Ch 8) |
| `PUSH v` / `PUSHVAR x` / `POPVAR x` | move constants and variables through the stack | Ch 7–8 |
| `ADD SUB MUL DIV LT GT EQ` | pop two operands, push one result | Ch 8 |
| `PRINT` / `HALT` | consume the stack top / stop the loop | Ch 8 |
| `JUMP n` / `JUMP_IF_FALSE n` | set `ip` — all control flow is this | Ch 9 |
| `POPARG p` / `CALL f n` / `RETURN` | bind arguments, push a frame, resume the caller | Ch 9 |
| `CLOSURE f` | package `(code, env)` — a function *value* | Ch 10 |
| `run(code, trace=True)` | print `ip`, opcode and stack after every step | Ch 8 |
| `python3 bite.py file.bite` | the whole chain in one command; no args → REPL | Ch 11–12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| `==` split into two `=` | without maximal munch the lexer emits two operators and the parser blames the wrong line | Ch 2 |
| `2 * 3 + 1` grouping as `2 * (3 + 1)` | precedence is *who calls whom*, not a table: one mis-ordered call layer inverts it | Ch 3 |
| An assignment writing to the wrong scope | `assign` that always defines locally never updates the shadowed outer variable | Ch 5 |
| A forward jump left as `None` | the placeholder was emitted but never patched, so `ip = None` kills the VM | Ch 9 |
| A returned function that “forgot” `count` | without the captured env, locals die when the defining scope exits | Ch 10 |
| Operand order reversed | the VM pops right-then-left, so `10 - 3` answers 7 on one path, −7 on the other | Ch 7–8 |
| `vars.get(arg, 0)` | an undefined variable evaluates to `0` — a wrong answer, no error | Ch 8 |
| Errors with no line number | every message reads “somewhere in the file”, though the token carried the line | Ch 11 |

## When to use what

| You need | Reach for | Why |
|---|---|---|
| to run one program once | the tree-walker (Ch 4) | no compile stage: walk the tree and compute |
| to run the same code in a loop | bytecode + VM (Ch 7–8) | compile once, execute the flat list forever |
| state that survives its scope | closures (Ch 10) | a function value is `(code, env)` |
| a mutable interactive session | the REPL (Ch 11) | one persistent `env`, brace counting for incomplete lines |
| a failure a human can act on | caret diagnostics (Ch 11) | line, column, echoed source line, pointer |
| to see a production compiler | `dis` (Ch 1) | the same stack-machine shape, in the standard library |

## Prove it to yourself

**1. The shape, confirmed by someone else’s compiler:**

```sh
python3 -c "import dis; dis.dis('x = 1 + 2 * 3')"
# LOAD_CONST, LOAD_CONST, LOAD_CONST, BINARY_OP, BINARY_OP
```

Operands first, operator last — your Chapter 7 convention, written by strangers.

**2. The stack, watched:**

```python
run(Compiler().compile_program(parse(lex("x = 1 + 2 * 3"))), trace=True)
# PUSH 3.0 [3.0]  PUSH 2.0 [3.0, 2.0]  MUL [6.0]  PUSH 1.0 [6.0, 1.0]  ADD [7.0]
```

That column *is* your program’s meaning, materialized: `MUL` before `ADD` is precedence,
executed rather than assumed.

**3. The receipt — closures, on your VM:**

```sh
python3 bite.py counter.bite    # 1 / 2 / 3, then fib(15) → 610
```

`count` outlived `makeCounter`’s scope, on your own frame list — not Python’s.

## What you now know

- The chain is **four small programs**, each a pure function between representations.
- **Bytecode is the compiler’s output and the VM’s input** — a flat list, hence cheap to run.
- **Control flow is arithmetic on `ip`**, with forward jump targets patched.
- **A closure is a function value carrying its birth environment**; lookup walks the chain.
- **Diagnostics are paid for at lex time**: no line numbers, no humane errors.

Next: prove all of it yourself — twelve labs on the Chapter 12 toolchain, each with a stated output you can check without a grader.
