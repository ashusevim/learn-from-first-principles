---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on the toolchain from Chapter 12 — lex, parse, compile, disassemble. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in output you check against your own screen, using
the toolchain Chapter 12 assembled. Nothing here is new theory — the last new idea
was closures (Chapter 10). What is new is mileage: by the twelfth lab you will have
touched every stage with a screwdriver.

## How the labs work

Every lab has four fields. **Goal** names the claim. **Do this** is the smallest change
that tests it. **You'll know it works when** shows the expected output — diff yours
against it. **Where it comes from** names the chapter that taught it, so a stuck lab
tells you exactly what to reread. Work on the `bite()` toolchain from Chapter 12, and
know these four entry points cold before Lab 1.1:

| Function | Stage | Chapter |
|---|---|---|
| `lex(src)` | characters → tokens | 2 |
| `Parser` | tokens → AST | 3 |
| `Compiler` | AST → bytecode | 7 |
| `run(main, functions)` | bytecode → result | 8 |

## Warm-ups

**Lab 1.1 — Count the tokens**
**Goal:** see the lexer's contract: one token per word or symbol, then the end marker.
**Do this:**
```python
print(lex("print 1 + 2"))
```
**You'll know it works when:** you count five items — `print`, `1`, `+`, `2`, and the
end-of-input marker — and nothing else. No character was lost, none invented.
**Where it comes from:** Chapter 2 — The Lexer: Characters to Tokens.

**Lab 1.2 — Break it on purpose**
**Goal:** meet the diagnostics (Chapter 11) from the user's side, before you extend them.
**Do this:**
```python
bite("print (1 + 2")
```
**You'll know it works when:** the toolchain reports an error naming the line and what
it wanted — not a raw Python traceback. A language that cannot explain a missing `)`
is not finished (and yours is).
**Where it comes from:** Chapter 11 — Errors & Diagnostics: Talking to Humans.

**Lab 1.3 — Predict the precedence**
**Goal:** prove the parser's expression layering (Chapter 3) actually runs.
**Do this:** cover the screen, predict, then run:
```python
bite("print 2 + 3 * 4")
```
**You'll know it works when:** it prints `14` — multiplication bound tighter, exactly as
the layered grammar says. If you predicted `20`, reread the precedence section of
Chapter 3 before continuing.
**Where it comes from:** Chapter 3 — The Parser: Grammar to AST.

## Builds

**Lab 2.1 — Teach the lexer silence**
**Goal:** comments — characters the lexer must see and then forget.
**Do this:** in `lex()`, when you meet `//`, advance to the newline and emit no token:
```python
# inside lex(): if src[i:i+2] == "//", skip to "\n"; emit nothing
```
**You'll know it works when:** `lex("print 1 // hello")` returns exactly the tokens of
`lex("print 1")`. The comment leaves no trace in the stream.
**Where it comes from:** Chapter 2 — The Lexer: Characters to Tokens.

**Lab 2.2 — A new operator, end to end**
**Goal:** one feature across all four stages: `%`.
**Do this:** add the token in `lex()`, a precedence level beside `*` in the parser, a
modulo opcode in the compiler, and its execution in the VM loop (Chapters 7–8):
```python
bite("print 7 % 3")
```
**You'll know it works when:** it prints `1`, and `print 10 % 5` prints `0`. An
operator is not done when it lexes — it is done when the VM executes it.
**Where it comes from:** Chapters 2, 3, 7 and 8.

**Lab 2.3 — Strings that print**
**Goal:** a new literal type through the whole chain.
**Do this:** lex `"..."` as a single token (contents, not quotes), parse it as a
primary, compile it as a constant, and emit it raw at output:
```python
bite('print "hello"')
```
**You'll know it works when:** the screen shows `hello` — no quotes, no brackets, no
`Token(...)` repr leaking out of the machinery.
**Where it comes from:** Chapters 2, 3 and 7.

**Lab 2.4 — `and` that refuses to look**
**Goal:** short-circuit evaluation via a jump (Chapter 9).
**Do this:** compile `and` so a falsy left side jumps past the right side entirely —
the right side must never execute:
```python
bite("print false and undefined_variable_xyz")
```
**You'll know it works when:** it prints `false` with no "undefined variable" error.
The name on the right was never resolved, which is the proof the jump is real.
**Where it comes from:** Chapter 9 — Jumps, Control Flow & Functions in the VM.

**Lab 2.5 — `for` as sugar**
**Goal:** desugar in the parser; the VM learns nothing new.
**Do this:** in the parser, rewrite your language's `for` loop into its `while`
equivalent from Chapter 6, then compile as usual:
```python
bite("for (let i = 0; i < 5; i = i + 1) print i")
```
**You'll know it works when:** it prints `0` through `4` — and the disassembly shows
no new opcode. Sugar leaves no trace below the parser.
**Where it comes from:** Chapter 6 — Control Flow: If, While & Turing Completeness.

## Stretch goals

**Lab 3.1 — One statement, two constant kinds**
**Goal:** numbers and strings flowing to the same `print` in one statement.
**Do this:** build on Lab 2.3's string constants: allow
`print "hi", 2 + 3` to work in a single statement (mixed value kinds reaching
the same output instruction).
**You'll know it works when:** the screen shows `hi` then `5`, each on its own
line. One statement, two constant kinds, no crash.
**Where it comes from:** Chapters 4 and 7.

**Lab 3.2 — Your diagnostics, dual-signed**
**Goal:** an error message a stranger could act on (Chapter 11's standard).
**Do this:** trigger every error your toolchain can raise — unclosed `(`, unknown
name, `and` with no right side — and grade each message: does it name the line,
the character, and what was wanted instead?
**You'll know it works when:** all three do, in plain words, with zero raw Python
traceback. If any leaks the implementation, fix the span tracking until it stops.
**Where it comes from:** Chapter 11 — Errors & Diagnostics: Talking to Humans.

## Self-checking without a grader

- **Warm-ups**: the output is a number, a message, or a count. Exact match is the
  test — `14` vs `20` tells you which grammar you wrote (Lab 1.3).
- **Builds**: each lab names its acceptance line (`prints 1`, `prints false with
  no error`, `prints 0 through 4`). Run the *negative* too: `%` on a string, `and`
  with a true left side — the answer should refuse in words, not in tracebacks.
- **Stretch goals**: compare against the reference behavior — Python's own `print`,
  your shell's `&&`, any compiler's error style. Agreement with a real tool is the
  verdict.

## What you now know

- **A language is a chain**: characters → tokens → tree → bytes → result, and Lab
  2.2 proved each link carries its own weight.
- **`bite()` is a REPL core**: wrap Lab 1.1's token counter in a loop and you have
  the inspector every real interpreter ships.
- **Errors are a feature**: Lab 3.2 treats span tracking as load-bearing, because a
  user meeting a traceback is meeting your language at its worst.
- **Sugar is honest debt**: Lab 2.5 shows how much language fits in the parser
  alone — and the disassembly proves what each sugar costs (nothing, here).

Next: download the source of the tiniest real language you can find, print its
disassembly for `"hello"`, and diff it against Lab 2.3 — the opcodes will read
like old friends.

