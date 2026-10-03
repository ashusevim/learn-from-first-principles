---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: The Complete Toolchain in ~400 Lines'
description: 'Lexer → parser → compiler → VM, one file — Bite runs programs, with functions, closures, and errors that point at your typos.'
part: 'Part IV — A Real Language'
written: true
---

The finale. Eleven chapters of stages, assembled into **Bite's complete toolchain in
one file**: the lexer (Ch 2), parser (Ch 3), environments and control flow
(Ch 5–6), the bytecode compiler and VM with jumps, functions, and closures
(Ch 7–10), and diagnostics (Ch 11). One command runs Bite programs; a REPL runs
them interactively. When a Bite program with closures prints the right answer, you
have written a language.

## The lie you were told

> "The complete toolchain is a multi-year project."

The *industrial* toolchain is — optimizations, JIT tiers, debug info. The
**complete functional chain** is the twelve chapters you just read, and this finale
is their assembly with the rough edges sanded.

## The structure (each stage cites its chapter)

```python
# bite.py — the complete toolchain. Run: python3 bite.py program.bite  (or no args for REPL)
# ── Ch 2: lexer ──
KEYWORDS = {"if", "else", "while", "fun", "print", "true", "false"}
class Token:
    def __init__(self, kind, value, line): self.kind, self.value, self.line = kind, value, line
def lex(src): ...                                    # (Ch 2's listing, verbatim)

# ── Ch 3: parser ──
class Parser: ...                                    # (Ch 3's listing: expression layering,
                                                     #  + blocks, if/while/fun statements)
# ── Ch 7+9: bytecode compiler (now with closures) ──
class Compiler:
    def stmt(self, node):
        if node.kind == "fun":                       # Ch 10: functions are CLOSURES
            self.emit("CLOSURE", node.name)          # package (code, env) at RUN time
            self.emit("POPVAR", node.name)
        ...

# ── Ch 8+10: the VM ──
def run(main, functions):
    stack, frames, env = [], [None], {"parent": None}
    code, ip = main, 0
    while True:
        op, arg = code[ip]; ip += 1
        ...                                        # (Ch 8's opcodes + Ch 10's CLOSURE/CALL
                                                    #  with parent-chained environments)

# ── Ch 11: the humane top level ──
def bite(source):                                    # the full chain, one function
    program = friendly_parse(source)                 # errors with carets (Ch 11)
    code, functions = compile_program(program)
    run(code, functions)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        bite(open(sys.argv[1]).read())               # run a file
    else:
        repl()                                       # or the interactive loop
```

## The receipt: a real program, on your toolchain

```bite
// counter.bite — closures on camera (Chapter 10's program, as a file)
fun makeCounter() {
  count = 0
  fun inc() { count = count + 1; print(count) }
  return inc
}
c = makeCounter()
c(); c(); c()

fun fib(n) {
  if n < 2 { n } else { fib(n - 1) + fib(n - 2) }
}
print(fib(15))
```

```sh
python3 bite.py counter.bite
# 1
# 2
# 3
# 610
```

`fib(15)` = 610 — computed by recursive Bite functions, running as bytecode on your
stack machine, with closures captured along the way. The whole chain — text to
tokens to tree to bytecode to results — is code you can read in one sitting.

## The final scoreboard of the course

| You built | The real-world analogue |
|---|---|
| Bite's lexer | every scanner, ever |
| Recursive descent parser | Go, Rust, V8's parsers |
| Tree-walking interpreter | early Ruby, first Python |
| Bytecode compiler + stack VM | CPython, Lua, the JVM's core |
| Closures via captured environments | JavaScript, Python, Go functions |
| Caret diagnostics | Rust's error messages |

One language, one toolchain — and the design space of all programming languages
now reads as variations on decisions you made yourself.

## Where you are now

Twelve chapters ago, "compiler" was a graduate-school word. Now: you've lexed
characters with maximal munch (Ch 2), parsed grammar into trees with precedence by
layering (Ch 3), executed those trees directly (Ch 4), made the language remember
with environments (Ch 5) and branch with control flow (Ch 6), compiled the tree to
bytecode (Ch 7), run it on a stack machine you wrote (Ch 8), added jumps and call
frames (Ch 9), captured environments as closures (Ch 10), and given it a human
interface (Ch 11).

Languages were never magic. They're four programs in a chain — and you've built the
chain.

**Where to go next:** read *Crafting Interpreters* (you've built both of its halves);
then the First Principles Project continues — **Cryptography** taught you locks;
**Graphics**, **CPUs**, and **Blockchain** remain on the belt, each the same
promise: nothing is magic.
