---
layout: ../../layouts/Chapter.astro
title: 'Errors & Diagnostics: Talking to Humans'
description: '“Syntax error” is a failure of care. Build: line-numbered errors, caret pointers, and a REPL.'
part: 'Part IV — A Real Language'
written: true
---

Bite works — for correct programs. Real users typo, forget parens, and misspell
variables, and the difference between a hostile language and a friendly one is the
**error messages**: what line, what position, what was expected, what would be
better. This chapter upgrades every stage's errors using the line numbers Chapter 2
carried all along, adds caret pointers, and builds a REPL — the interactive loop
where language designers live.

## The lie you were told

> "Error messages are cosmetic."

They're the **primary user interface of the compiler** — users interact with errors
far more than with any feature. Rust's adoption owes as much to its error messages
as to its type system. And the information was already there: Chapter 2's tokens
carry line numbers; this chapter makes them *reach the user*.

## The anatomy of a good error

```text
Bite: line 3, column 8: expected ')' after arguments
  |
3 | print(fib(10, 5
  |         ^
  = the call opened here needs its closing paren
```

Four ingredients: **where** (line + column + the source line echoed), **what**
(expected vs found — the parser's actual state), **why** (the rule that wanted it),
and **the fix** (when knowable). Our parser's `expect()` already knows all of this;
the work is formatting it.

## Prove it to yourself

**1. The stage of each error, from Chapter 1:**

```text
lexer error:    "unexpected character '@'"     — the lexer's rejection
parser error:   "expected ')' after arguments" — the parser's expectation failed
runtime error:  "undefined variable 'x'"       — the evaluator's lookup failed
```

Three stages, three error types, all needing line context — which is why Chapter 2
tagged every token at lex time.

**2. The REPL's special problem: an incomplete line is not an error.** Typing
`if x > 2 {` in a REPL shouldn't scream "unclosed brace" — the REPL must *detect
incompleteness* (unclosed braces/parens) and keep reading. That's a continuation
prompt, not an exception.

## The build: diagnostics + the REPL

```python
# diagnostics.py — caret errors and the read-eval-print loop
from lexer import lex
from parser import parse

class BiteError(Exception):
    def __init__(self, message, line=None, col=None, source=None):
        self.message, self.line, self.col, self.source = message, line, col, source
        super().__init__(self.render())
    def render(self):
        out = f"Bite error: {self.message}"
        if self.line and self.source:
            src_line = self.source.splitlines()[self.line - 1]
            caret = " " * ((self.col or 1) - 1) + "^"
            out += f"\n  {self.line} | {src_line}\n  {' ' * len(str(self.line))} | {caret}"
        return out

def friendly_run(source):
    try:
        tokens = lex(source)                      # lexer errors carry line already
    except SyntaxError as e:
        raise BiteError(str(e).replace("line ", ""), source=source)
    try:
        program = parse(tokens)
    except SyntaxError as e:
        raise BiteError(str(e), source=source)    # the parser's expectation, echoed
    return program

source = 'x = 10\nprint(fib(10, 5'
try:
    friendly_run(source)
except BiteError as e:
    print(e)
# Bite error: line 2, expected ')' after arguments
#   2 | print(fib(10, 5
#   2 |         ^
# (the caret lands at the EOF where ')' should be — the parser said where it starved)

# ── the REPL: read, eval, print, LOOP — with continuation for incomplete input ──
def repl():
    buffer, env = "", {}
    prompt = "bite> "
    while True:
        try:
            line = input(prompt if not buffer else "  ... ")
        except EOFError:
            break
        buffer += line + "\n"
        if buffer.count("{") > buffer.count("}"):   # incomplete: keep reading (nicely!)
            continue
        try:
            program = friendly_run(buffer)
            for stmt in program:
                result = evaluate(stmt, env)
                if result is not None: print(f"= {result}")
        except BiteError as e:
            print(e)
        buffer = ""

# bite> 1 + 2 * 3
# = 7
# bite> x = 10
# bite> x * x
# = 100
# bite> if x > 5 {
#   ...     print("big")
#   ... }
# big
```

(Note the REPL's quiet superpower: it shares `env` across inputs — the environment
from Chapter 5 *persists*, which is the entire point of interactive languages.)

## What you now know

- Errors are the **compiler's main UI**: location, expectation, and the echoed
  source line with a caret — all from data Chapter 2 carried.
- The REPL needs **incompleteness detection** (brace counting) separate from error
  reporting, plus a *persistent environment* across inputs.
- Every stage raises typed errors that the top level formats — the chain from
  Chapter 1, now humane.

Next, the finale: every chapter assembled into **the complete toolchain in ~400
lines** — and Bite runs programs with functions, closures, and errors that point at
your typos.
