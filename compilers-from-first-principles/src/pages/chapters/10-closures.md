---
layout: ../../layouts/Chapter.astro
title: 'Closures: Functions That Remember'
description: 'A function capturing its birth environment — the deepest idea in language design. Build: closures working in the VM.'
part: 'Part IV — A Real Language'
written: true
---

Chapter 9's functions have a subtle flaw: each call creates fresh variables, so a
function returned from inside another function loses access to its birthplace's
variables. **Closures** fix this — a function value carries its birth environment,
so "local" variables survive after the defining scope exits. It's the mechanism
behind callbacks, decorators, and every JS/Python function you've stored somewhere.
This chapter makes closures work in Bite's VM.

## The lie you were told

> "Closures are a language feature you enable."

A closure is what you get automatically when **function values carry their
environment** instead of just their code:

```text
fun makeCounter() {
  count = 0
  fun inc() { count = count + 1; print(count) }
  return inc                 ← inc escapes makeCounter... WITH its birth env
}
c = makeCounter()            ← makeCounter's scope has EXITED
c(); c(); c()                ← prints 1, 2, 3 — count survived the exit!
```

The function value isn't (code) — it's **(code, environment)**. `count` lives in
that captured environment, kept alive because `inc` references it. Every language
with first-class functions has closures; the differences are only in *how the
captured variables are stored* (boxed on the heap — the LLM course's Ch 3 embeddings
were a lookup table, closures are a lookup table with a heartbeat).

## The VM change: environments in the frame

Chapter 9's frames used one variables dict per call. For closures, function values
need three parts:

```python
function value = { bytecode, params, env }    ← env = the DEFINING frame's variables
CALL:  new frame's variables = {params→args}, with PARENT = fn.env
PUSHVAR/POPVAR: walk the parent chain (Chapter 5 of this course's environments!)
```

The environment chain (the tree-walker's Chapter 5 data structure) returns — the
VM's frames now link to their defining frames, and variable lookup walks the chain.
Closures cost a chain walk; that's the price of memory.

## Prove it to yourself

**1. The counter, and why it works:**

```text
makeCounter called:  frame B {count: 0}, parent = global
inc defined in B:    value = (inc bytecode, env=B)
makeCounter exits:   frame B would die... but inc's value still references it
c() called:          inc runs with vars = {params}, parent = B → count found → 1
c() again:           2 — the SAME B, mutated. Memory across exits: the closure.
```

**2. Three counters, independent:**

```python
a = makeCounter(); b = makeCounter()
a(); a(); b()
# a's closure counted 2, b's counted 1 — each makeCounter call created a FRESH env.
# independence falls out of "new environment per call" (Chapter 9's frames).
```

## The build: closures in the VM

```python
# closures.py — function values carry their environment; lookup walks the chain
class Function:
    def __init__(self, code, params, env, name="<fn>"):
        self.code, self.params, self.env, self.name = code, params, env, name

def run(main_code, functions):
    stack = []
    frames = [None]                                   # (return_ip, env) per call
    env = {"global": True}                            # the global environment
    code, ip = main_code, 0
    while True:
        op, arg = code[ip]; ip += 1
        if   op == "PUSH": stack.append(arg)
        elif op == "PUSHVAR":                            # walk the env CHAIN (Ch 5!)
            env2 = env
            while env2 is not None and arg not in env2: env2 = env2.get("parent")
            stack.append(env2[arg] if env2 else 0)
        elif op == "POPVAR":
            env2 = env
            while env2 is not None and arg not in env2: env2 = env2.get("parent")
            (env2 if env2 else env)[arg] = stack.pop()
        elif op == "CLOSURE":                            # make a function VALUE
            code_ref, params = functions[arg]
            stack.append(Function(code_ref, params, env, arg))   # ← capture: env, NOW
        elif op == "CALL":
            nargs = arg
            fn = stack[-nargs - 1]                       # the function value (has .env!)
            args = stack[-nargs:]; del stack[-nargs - 1:]
            frames.append((ip, env))                     # save caller's world
            code, ip = fn.code, 0
            env = {"parent": fn.env, **dict(zip(fn.params, args))}   # birth env = PARENT
        elif op == "RETURN":
            result = stack.pop()
            ip, env = frames.pop()
            stack.append(result)
            if not frames: break
        elif op == "ADD": b, a = stack.pop(), stack.pop(); stack.append(a + b)
        elif op == "PRINT": print(stack.pop())

# — the program: closures on camera —
main = [("CLOSURE", "makeCounter"), ("POPVAR", "makeCounter"),
        ("PUSHVAR", "makeCounter"), ("CALL", 0), ("POPVAR", "c"),
        ("PUSHVAR", "c"), ("CALL", 0), ("PRINT"),
        ("PUSHVAR", "c"), ("CALL", 0), ("PRINT"),
        ("PUSHVAR", "c"), ("CALL", 0), ("PRINT")]
makecounter_code = [("POPARG", None), ("PUSH", 0), ("POPVAR", "count"),
                    ("CLOSURE", "inc"), ("RETURN", None)]
inc_code = [("POPARG", None), ("PUSHVAR", "count"), ("PUSH", 1),
            ("ADD"), ("POPVAR", "count"), ("PUSHVAR", "count"), ("PRINT")]
functions = {"makeCounter": (makecounter_code, []), "inc": (inc_code, [])}
run(main, functions)
# 1
# 2
# 3     ← count survived makeCounter's exit, mutated across calls: THE CLOSURE
```

(The listing compresses Bite's syntax into bytecode by hand — the compiler from
Chapter 9 emits this exact instruction sequence for the `makeCounter` program. The
one new line, conceptually: `CLOSURE` packages (code, env) — the function value
*is* the closure.)

## What you now know

- A closure = **a function value carrying its birth environment** — count survives
  scope exit because the environment is referenced, not copied.
- The VM's frames now **link environments** (parent chains, Chapter 5's structure);
  variable lookup walks the chain.
- Three counters, three independent captured environments — independence falls out
  of per-call environments.
- Closures aren't a feature; they're what first-class functions *are* once you look
  at what they carry.

Next: the language works — now make it *kind*. Errors with line numbers, caret
pointers, and a REPL: talking to humans.
