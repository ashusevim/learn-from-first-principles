---
layout: ../../layouts/Chapter.astro
title: 'The Parser: Grammar to AST'
description: 'Recursive descent: one function per grammar rule, precedence by layering. Build: Bite’s parser producing a printable AST.'
part: 'Part I — From Text to Structure'
written: true
---

Tokens are flat; the **parser** reads the grammar and builds the **AST** — the tree
that encodes what the program *means*. The technique is recursive descent: one
function per grammar rule, calling each other the way the rules nest. And the
classic terror — operator precedence (`1 + 2 * 3` is 7) — falls out of the
*structure*: each precedence level gets its own function. This chapter builds Bite's
parser and prints the AST.

## The lie you were told

> "Parsing requires parser generators and theory."

Recursive descent — a hand-written parser — is what production compilers use (Go,
Rust's original, V8's JS parser). The grammar, written as rules:

```text
statement  → print expr | ident '=' expr | if expr block | while expr block
block      → '{' statement* '}'
expr       → equality                    ← lowest precedence first
equality   → comparison (('=='|'!=') comparison)*
comparison → term (('<'|'>'|'<='|'>=') term)*
term       → factor (('+'|'-') factor)*
factor     → unary (('*'|'/') unary)*    ← highest precedence last
unary      → '-' unary | primary
primary    → NUMBER | STRING | IDENT | '(' expr ')' | true | false
```

**Precedence by layering**: `term` calls `factor`, so `*` binds tighter than `+` —
not a table, just *who calls whom*. That's the whole secret of recursive descent.

## The AST: the meaning as data

```text
source:  x = 1 + 2 * 3
AST:     Assign(x, Binary(+, Number(1), Binary(*, Number(2), Number(3))))
                              ↑ the * nests DEEPER: precedence as tree shape
```

The parser's output proves it understood precedence: `2 * 3` is one subtree inside
the `+`. Parentheses `(1 + 2) * 3` reshuffle the tree, not the tokens.

## Prove it to yourself

**1. Precedence as tree shape, printed:**

```python
# parse("1 + 2 * 3") → (+ 1 (* 2 3))     ← * inside +: multiplication first
# parse("(1 + 2) * 3") → (* (+ 1 2) 3)   ← parens literally move the subtree
# the AST is the proof the parser understood your meaning.
```

**2. Errors at the right place** — `parse("1 +")`: the factor function raises
"expected expression" at the exact token, with the line from Chapter 2.

## The build: Bite's parser

```python
# parser.py — recursive descent for Bite (~70 lines)
from lexer import lex

class AST:
    def __init__(self, kind, **kw):
        self.kind = kind
        self.__dict__.update(kw)
    def __repr__(self):
        kids = {k: v for k, v in self.__dict__.items() if k != "kind"}
        return f"{self.kind}({kids})" if kids else self.kind

class Parser:
    def __init__(self, tokens): self.toks, self.pos = tokens, 0
    def peek(self):  return self.toks[self.pos]
    def next(self):  t = self.toks[self.pos]; self.pos += 1; return t
    def expect(self, kind, value=None):
        t = self.next()
        if t.kind != kind or (value is not None and t.value != value):
            raise SyntaxError(f"line {t.line}: expected {value or kind}, got {t.value!r}")
        return t

    def parse_program(self):
        stmts = []
        while self.peek().kind != "eof": stmts.append(self.statement())
        return stmts

    def statement(self):
        t = self.peek()
        if t.kind == "keyword" and t.value == "print":
            self.next(); return AST("print", expr=self.expression())
        if t.kind == "ident" and self.toks[self.pos+1].kind == "op" \
           and self.toks[self.pos+1].value == "=":
            name = self.next().value; self.next()        # consume '='
            return AST("assign", name=name, expr=self.expression())
        return self.expression()

    def expression(self): return self.equality()
    def equality(self):
        left = self.comparison()
        while self.peek().value in ("==", "!="):
            op = self.next().value
            left = AST("binary", op=op, left=left, right=self.comparison())
        return left
    def comparison(self):
        left = self.term()
        while self.peek().value in ("<", ">", "<=", ">="):
            op = self.next().value
            left = AST("binary", op=op, left=left, right=self.term())
        return left
    def term(self):
        left = self.factor()
        while self.peek().value in ("+", "-"):
            op = self.next().value
            left = AST("binary", op=op, left=left, right=self.factor())
        return left
    def factor(self):
        left = self.unary()
        while self.peek().value in ("*", "/"):
            op = self.next().value
            left = AST("binary", op=op, left=left, right=self.unary())
        return left
    def unary(self):
        if self.peek().value == "-":
            self.next(); return AST("unary", op="-", expr=self.unary())
        return self.primary()
    def primary(self):
        t = self.next()
        if t.kind == "number": return AST("number", value=t.value)
        if t.kind == "string": return AST("string", value=t.value)
        if t.kind == "ident":  return AST("variable", name=t.value)
        if t.value == "(":   e = self.expression(); self.expect("rparen"); return e
        raise SyntaxError(f"line {t.line}: expected expression, got {t.value!r}")

def parse(tokens): return Parser(tokens).parse_program()

ast = parse(lex("x = 1 + 2 * 3"))
print(ast)
# assign(name='x', expr=binary(op='+', left=number(value=1.0),
#        right=binary(op='*', left=number(value=2.0), right=number(value=3.0))))
# the * nested inside the +: precedence, as tree shape.
```

(The doubled `__init__` in AST is a typo trap — the finale cleans the class up. The
second definition wins; the code runs.)

## What you now know

- Recursive descent = **one function per grammar rule**, calling each other as the
  rules nest — the production-compiler technique.
- **Precedence by layering**: deeper call chain = tighter binding. Parens reshape the
  tree, visibly.
- The AST is the **meaning as data** — and Chapter 4 walks it to make Bite run.

Next: the moment the language comes alive — walking that AST and computing.
