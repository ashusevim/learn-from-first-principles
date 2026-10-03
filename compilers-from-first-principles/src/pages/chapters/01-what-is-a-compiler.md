---
layout: ../../layouts/Chapter.astro
title: 'What Is a Compiler, Really?'
description: 'Four programs in a chain: lexer, parser, evaluator/compiler, runtime. Build: the pipeline map and our language “Bite” — its syntax tour.'
part: 'Part I — From Text to Structure'
written: true
---

A compiler is not one program. It's a **chain of four small programs**, each with a
crisp input and output:

```text
source text ──LEXER──► tokens ──PARSER──► AST ──COMPILER──► bytecode ──VM──► results
              (characters      (the meaning          (a flat,          (a stack machine
               to words)       as a tree)            linear form)      that runs it)
```

Every language you use — Python, Go, Rust, the JS engine in the browser course — is
this chain with different decorations. This course designs a small language called
**Bite** and builds its complete toolchain. By Chapter 12, Bite runs programs with
variables, loops, functions, and closures — on a virtual machine you wrote.

## The lie you were told

> "Compilers are theory-dense programs built by researchers."

Each stage is *smaller than the programs you've built in this project*: the lexer is
a loop with a character classifier, the parser is one function per grammar rule, a
bytecode VM is a `while` loop over an instruction array with a stack. The theory
(parsing theory, register allocation) exists for the industrial edges. The core is
an afternoon per stage.

## The language: Bite

A language design is a set of decisions; Bite makes small ones:

```text
x = 10                      ← assignment
print(x * 2 + 1)            ← arithmetic, function calls
if x > 5 { print("big") }   ← braces for blocks (no indentation wars)
while x > 0 { x = x - 1 }   ← while loops
fun add(a, b) { a + b }     ← functions (last expression is the return)
```

Deliberately *not* in Bite: classes, inheritance, modules, garbage-collection
tuning. A language spec is a list of refusals — every feature refused is a chapter
saved. (Crafting Interpreters calls its language Lox; Bite is ours, tiny on purpose.)

## The two runtimes (and why we build both)

The course builds Bite **twice**:

```text
tree-walking interpreter (Ch 4–6):  walk the AST directly — simple, instant, slow-ish
bytecode compiler + VM    (Ch 7–12): compile to instructions, run on a stack machine —
                                     faster, the real architecture of Python/Java/Lua
```

Same language, two runtimes — which makes their differences *measurable*: same
program, both runtimes, timing compared (Chapter 8). The tree-walker teaches what
execution means; the VM teaches why real languages are built the way they are.

## Prove it to yourself

**1. The chain, spotted in the wild:**

```sh
python3 -c "import dis; dis.dis('x = 1 + 2')"
#   LOAD_CONST 0 (1)
#   LOAD_CONST 1 (2)
#   BINARY_OP 0 (+)
#   STORE_NAME 0 (x)
# Python itself compiles to bytecode for a stack machine — Chapter 7–8 of this
# course, shipped inside the language. `javap`, `lua`'s opcodes: same shape.
```

**2. The stages, visible in errors:**

```python
# a lexer error:   Bite: unexpected character @ (line 2)
# a parser error:  Bite: expected ')' after arguments (line 3)
# a runtime error: Bite: undefined variable 'x' (line 4)
# three different programs complained — the chain, exposed by its error messages.
```

## The build: the pipeline skeleton

```python
# pipeline.py — Bite's architecture: four seams, filled in Chapters 2–8
def lex(source):                       # Ch 2: text → tokens
    ...
def parse(tokens):                    # Ch 3: tokens → AST
    ...
def compile(ast):                     # Ch 7: AST → bytecode
    ...
def run(bytecode):                    # Ch 8: bytecode → results
    ...

def bite(source):                     # the full chain, composed
    return run(compile(parse(lex(source))))

# Chapter 4 pauses the chain early: parse the AST and WALK it (a tree-walking
# interpreter) — running code before writing a single compiler line. Chapter 7
# then swaps the walker for the compiler+VM, and Chapter 8 races them.
```

The skeleton is the syllabus. Each `...` is a chapter, each chapter ends with
something *running*.

## What you now know

- A compiler = **lexer → parser → compiler → runtime** — four small programs, one
  chain.
- **Bite**: braces, `fun`, last-expression returns — small by refusal, complete by
  Chapter 12.
- Two runtimes on one language: the **tree-walker** (simple) and the **bytecode VM**
  (real) — built and raced.
- The whole field is visible in Python's own `dis`: your course's output shape,
  shipped.

Next: the chain's first link — turning characters into tokens, with line numbers
for the errors to come.
