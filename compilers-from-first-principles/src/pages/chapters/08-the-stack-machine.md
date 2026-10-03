---
layout: ../../layouts/Chapter.astro
title: 'The Stack Machine: Bytecode That Runs'
description: 'Push, pop, add — the VM is 40 instructions from being Python. Build: the VM executing Chapter 7’s bytecode, speed compared.'
part: 'Part III — The Bytecode VM'
written: true
---

Chapter 7 compiled Bite to bytecode. The **virtual machine** executes it — and the
VM's core is a `while` loop with a `case` per opcode, a stack, and a variables
dictionary. Forty lines. This chapter builds it, runs Chapter 7's bytecode, and
races the tree-walking interpreter (Part II) against it — the two runtimes, measured.

## The lie you were told

> "A virtual machine emulates hardware."

This VM emulates nothing — it's an **abstract machine**: an instruction pointer
walking a list of instructions, with a stack for operands and a dict for variables.
"Virtual" because the machine is *defined by software*; the loop *is* the CPU:

```python
while ip < len(code):
    op, arg = code[ip]
    match op:
        case "PUSH":  stack.append(arg); ip += 1
        case "ADD":   b = stack.pop(); a = stack.pop(); stack.append(a + b); ip += 1
        ...
```

CPython *is* this loop (its opcode dispatch, ceval.c); the JVM and Lua's VM are the
same shape with better engineering (computed gotos, inline caches). The abstraction
is the product.

## Prove it to yourself

**1. The speed comparison, Chapter 1's promise kept** — the same Bite program on
both runtimes:

```python
program = "x = 0\nwhile x < 200000 { x = x + 1 }\nprint(x)"
# tree-walker (Part II): walks ~600k AST nodes → several seconds
# bytecode VM  (Ch 7–8): executes ~600k instructions → a fraction of it
# the diff is the tree-walk overhead, made visible by time.perf_counter().
```

**2. The instruction trace, watched** — add a trace flag to the VM and print the
stack per step for `1 + 2 * 3`:

```text
      PUSH 3      [3]
      PUSH 2      [3, 2]
      MUL         [6]
      PUSH 1      [6, 1]
      ADD         [7]
```

The stack machine's execution *is* the arithmetic, visualized.

## The build: the VM

```python
# vm.py — the stack machine (~45 lines)
def run(code, trace=False):
    stack, vars = [], {}
    ip = 0
    while ip < len(code):
        op, arg = code[ip]
        if trace: print(f"{ip:3d} {op:8s} {arg if arg is not None else '':>6}  stack={stack}")
        ip += 1                                     # default: next instruction
        if   op == "PUSH":   stack.append(arg)
        elif op == "PUSHVAR": stack.append(vars.get(arg, 0))
        elif op == "POPVAR": vars[arg] = stack.pop()
        elif op == "ADD":  b, a = stack.pop(), stack.pop(); stack.append(a + b)
        elif op == "SUB":  b, a = stack.pop(), stack.pop(); stack.append(a - b)
        elif op == "MUL":  b, a = stack.pop(), stack.pop(); stack.append(a * b)
        elif op == "DIV":  b, a = stack.pop(), stack.pop(); stack.append(a / b)
        elif op == "LT":   b, a = stack.pop(), stack.pop(); stack.append(a < b)
        elif op == "GT":   b, a = stack.pop(), stack.pop(); stack.append(a > b)
        elif op == "EQ":   b, a = stack.pop(), stack.pop(); stack.append(a == b)
        elif op == "PRINT": print(stack.pop())
        elif op == "HALT":  break
    return stack

from compile import Compiler
from parser import parse
from lexer import lex
code = Compiler().compile_program(parse(lex("x = 1 + 2 * 3\nprint(x * 2)")))
run(code, trace=True)
#   0 PUSH     3.0     [3.0]
#   2 PUSH     2.0     [3.0, 2.0]
#   4 MUL              [6.0]          ← the stack machine computing 2*3
#   5 PUSH     1.0     [6.0, 1.0]
#   7 ADD              [7.0]
#   8 POPVAR   x       []
#  10 PUSHVAR  x       [7.0]
#  12 PUSH     2.0     [7.0, 2.0]
#  14 MUL              [14.0]
#  15 PRINT            []             ← prints 14.0
#  16 HALT
```

## What you now know

- The VM = **instruction pointer + operand stack + variable dict** — a `while` with
  a `case` per opcode. Forty lines for a real execution engine.
- Compilation happens **once**; execution is flat list-walking — the structural
  speedup over the tree-walker.
- Every stack machine you'll ever disassemble — CPython, JVM, Lua, WebAssembly — is
  this loop with more opcodes.

Next: the VM runs straight-line code. Loops and ifs need **jumps** — and functions
need call frames. The VM grows up.
