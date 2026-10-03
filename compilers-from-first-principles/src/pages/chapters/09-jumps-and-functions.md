---
layout: ../../layouts/Chapter.astro
title: 'Jumps, Control Flow & Functions in the VM'
description: 'Loops become backwards jumps; calls become frames. Build: if/while/functions compiled and running on the stack machine.'
part: 'Part III — The Bytecode VM'
written: true
---

Chapter 8's VM runs straight-line code. Control flow changes that: an `if` needs to
**skip** instructions, a `while` needs to loop **backwards**, and a function call
needs a **frame** — a saved place to return to. The new machinery is two jump
instructions and one call-stack discipline; the compiler emits them with a
two-pass trick for the backwards jumps. This chapter completes the VM.

## The lie you were told

> "Control flow compiles to something clever."

It compiles to **changing the instruction pointer**:

```text
JUMP_IF_FALSE addr:   pop; if falsy, ip = addr      (the if/while conditional)
JUMP addr:            ip = addr                     (the while's backwards edge)
```

That's all control flow ever was at machine level — conditional and unconditional
arithmetic on the program counter (CPUs course foreshadowing: your CPU does this
with a program counter register).

## The compiler's two-pass trick

Here's the rub: compiling `while cond { body }`, the `JUMP_IF_FALSE` must target the
instruction *after the body* — which doesn't exist yet. The fix, used by every
compiler: emit a **placeholder**, remember its position, patch it later:

```python
def compile_while(node):
    loop_start = len(self.code)              # 1. remember where the loop begins
    self.expr(node.cond)
    jf = self.emit("JUMP_IF_FALSE", None)    # 2. placeholder: exit address unknown yet
    self.stmt(node.body)
    self.emit("JUMP", loop_start)            # 3. backwards jump: address already known!
    self.code[jf] = ("JUMP_IF_FALSE", len(self.code))   # 4. patch the placeholder
```

Forwards references get patched; backwards references are known immediately. (This
is also how linkers resolve forward-declared symbols — the same two-pass idea.)

## Functions: call frames

A function call must: evaluate arguments, jump to the function's body, let the body
use its own variables, return a value, and **resume exactly where the caller was**.
The VM keeps a **frame stack**: each frame remembers (return address, saved
variables base). `RETURN` pops the frame and jumps back:

```text
CALL fn nargs:  frame = (ip, stack depth) pushed; ip = fn's bytecode start
RETURN:         result = stack.pop(); pop the frame; ip = saved return address;
                push result
```

Recursion works automatically — each call gets its own frame, its own slot view.
(The tree-walker got this from Python's call stack; the VM owns its own now, which
is why the VM can run *deeper* recursion than the tree-walker could.)

## Prove it to yourself

**1. The loop, traced at the bytecode level:**

```text
bite:  x = 0; while x < 2 { x = x + 1 }
  0 PUSH 0          5  POPVAR x        ← body's store
  2 POPVAR x        7  JUMP 2          ← backwards: the loop!
  4 PUSHVAR x       ...
  6 PUSH 2
  8 LT
  9 JUMP_IF_FALSE 14 ← patch target: after the body
```

Run the trace (Chapter 8's flag) and watch `ip` bounce 2→9→4→5→7→2: the loop, in
instruction-pointer coordinates.

**2. Recursion depth, compared** — the tree-walker died near Python's limit
(Chapter 6); the VM runs `fib(25)` with frames on *its own* list. The ownership
transfer, measured.

## The build: jumps and functions

```python
# controlvm.py — the compiler + VM gain if/while/functions
class Compiler:
    def __init__(self):
        self.code = []; self.functions = {}      # name -> (code, params)

    def stmt(self, node):
        if node.kind == "if":
            self.expr(node.cond)
            jf = self.emit("JUMP_IF_FALSE", None)
            for s in node.then_stmts: self.stmt(s)
            self.code[jf] = ("JUMP_IF_FALSE", len(self.code))      # patch
        elif node.kind == "while":
            start = len(self.code)
            self.expr(node.cond)
            jf = self.emit("JUMP_IF_FALSE", None)
            for s in node.body_stmts: self.stmt(s)
            self.emit("JUMP", start)                               # backwards: known now
            self.code[jf] = ("JUMP_IF_FALSE", len(self.code))      # patch
        elif node.kind == "fun":
            fn_comp = Compiler()                                   # separate bytecode
            for p in node.params: fn_comp.emit("POPARG", p)        # bind args to names
            for s in node.body_stmts: fn_comp.stmt(s)
            fn_comp.emit("RETURN")                                 # implicit return
            self.functions[node.name] = (fn_comp.code, node.params)
        elif node.kind == "call":
            for a in node.args: self.expr(a)                       # args pushed in order
            self.emit("CALL", (node.callee.name, len(node.args)))
        elif node.kind == "return-ish":                            # Bite: last expression
            self.expr(node.expr); self.emit("RETURN")

def run(code, functions, trace=False):
    stack, frames, ip = [], [None], 0                              # frames: return points
    vars_stack = [{}]                                              # one vars dict per frame
    while True:
        op, arg = code[ip]
        ip += 1
        if   op == "PUSH": stack.append(arg)
        elif op == "PUSHVAR": stack.append(vars_stack[-1].get(arg, 0))
        elif op == "POPARG": vars_stack[-1][arg] = stack.pop()
        elif op == "POPVAR": vars_stack[-1][arg] = stack.pop()
        elif op == "ADD": b, a = stack.pop(), stack.pop(); stack.append(a + b)
        elif op == "MUL": b, a = stack.pop(), stack.pop(); stack.append(a * b)
        elif op == "LT":  b, a = stack.pop(), stack.pop(); stack.append(a < b)
        elif op == "SUB": b, a = stack.pop(), stack.pop(); stack.append(a - b)
        elif op == "PRINT": print(stack.pop())
        elif op == "JUMP": ip = arg
        elif op == "JUMP_IF_FALSE":
            if not stack.pop(): ip = arg
        elif op == "CALL":
            fname, nargs = arg
            fn_code, params = functions[fname]
            frames.append((ip, len(vars_stack)))                   # remember the way back
            args = stack[-nargs:]; del stack[-nargs:]
            new_vars = dict(zip(params, args))                     # args become locals
            vars_stack.append(new_vars)
            code, ip = fn_code, 0                                  # jump into the function
        elif op == "RETURN":
            result = stack.pop() if stack else None
            ret_ip, prev_depth = frames.pop()
            while len(vars_stack) > prev_depth: vars_stack.pop()
            code, ip = main_code, ret_ip                           # back to the caller
            stack.append(result)
            if not frames: break
        elif op == "HALT": break
```

Compile the recursive `fib` from Chapter 6 and run it: the frames stack and unstack,
`fib(10)` returns 55, and recursion depth is bounded by *your* frame list — not
Python's.

## What you now know

- Control flow = **JUMP and JUMP_IF_FALSE** — arithmetic on the instruction
  pointer; backwards jumps are the loop.
- Forward references are **patched**: emit a placeholder, fill the address when it's
  known (the two-pass trick).
- Functions = **call frames**: saved return address + own variable scope, stacked —
  recursion for free, and deeper than the tree-walker could reach.

Next: functions that capture their *birth* environment — closures. The LLM course's
hardest chapter's sibling, and the last major VM feature.
