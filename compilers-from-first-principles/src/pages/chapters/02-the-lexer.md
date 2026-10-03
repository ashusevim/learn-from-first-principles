---
layout: ../../layouts/Chapter.astro
title: 'The Lexer: Characters to Tokens'
description: 'Numbers, strings, identifiers, keywords, operators — with line tracking for errors. Build: Bite’s complete lexer, token stream inspected.'
part: 'Part I — From Text to Structure'
written: true
---

The lexer is the compiler's front door: a loop that reads characters and groups them
into **tokens** — the smallest units with meaning (`x`, `=`, `10`, `+`, `;`). It has
no opinions about grammar; it only classifies. This chapter builds Bite's complete
lexer, and its design decisions (keywords vs identifiers, maximal munch, line
tracking) are the ones every real lexer makes.

## The lie you were told

> "The lexer uses regexes and magic tables."

Hand-written lexers are a loop with a character classifier — and most production
lexers (Go's, GCC's) are hand-written precisely because it's *faster and clearer*
 than generated tables. The rules:

```text
identifier:  letter (letter|digit)*        → then check: is it a KEYWORD?
number:      digit+ (. digit+)?            → maximal munch: take the longest valid token
string:      '"' until '"'                 → errors if unterminated (line number!)
'=', '=='    → maximal munch again: '==' wins over two '='s
```

**Maximal munch** — always take the longest possible token — is why `==` is one token
and why `x1` is one identifier, not `x` then `1`.

## Keywords: a lookup, not states

`if`, `while`, `fun` look exactly like identifiers to the lexer. The trick: lex an
identifier, *then* check a keyword table. One code path, no special states:

```python
KEYWORDS = {"if", "while", "fun", "print", "true", "false", "else"}
kind = "keyword" if word in KEYWORDS else "ident"
```

## Line tracking: the error messages depend on it

Every token carries its line number — Chapter 11's diagnostics are impossible
without it. The lexer increments a counter on every `\n`. That's the whole feature;
forgetting it dooms your error messages to "somewhere in the file".

## Prove it to yourself

**1. Maximal munch, verified:**

```python
source = "x == 10"
# without munch: '=' then '=' → parse error later (two assignments?!)
# with munch:    '==' → one comparison token. The lexer decides the grammar's fate.
```

**2. The token stream, inspected** — the build prints Bite's tokens for a real
program; read them like words of a sentence.

## The build: Bite's lexer

```python
# lexer.py — Bite's complete lexer (~50 lines)
KEYWORDS = {"if", "else", "while", "fun", "print", "true", "false"}

class Token:
    def __init__(self, kind, value, line):
        self.kind, self.value, self.line = kind, value, line
    def __repr__(self): return f"{self.kind}({self.value!r})"

def lex(source):
    tokens, i, line = [], 0, 1
    while i < len(source):
        c = source[i]
        if c == "\n": line += 1; i += 1; continue
        if c.isspace(): i += 1; continue
        if c.isdigit():                                    # number: maximal munch
            j = i
            while j < len(source) and (source[j].isdigit() or source[j] == "."): j += 1
            tokens.append(Token("number", float(source[i:j]), line)); i = j; continue
        if c.isalpha():                                    # identifier or keyword
            j = i
            while j < len(source) and (source[j].isalnum() or source[j] == "_"): j += 1
            word = source[i:j]
            tokens.append(Token("keyword" if word in KEYWORDS else "ident", word, line))
            i = j; continue
        if c == '"':                                       # string, with line tracking
            j = i + 1
            while j < len(source) and source[j] != '"':
                if source[j] == "\n": line += 1
                j += 1
            if j >= len(source): raise SyntaxError(f"line {line}: unterminated string")
            tokens.append(Token("string", source[i+1:j], line)); i = j + 1; continue
        if c in "=!" and i + 1 < len(source) and source[i+1] == "=":   # maximal munch: == !=
            tokens.append(Token("op", c + "=", line)); i += 2; continue
        if c in "+-*/<>={}(),;":
            kind = {"(": "lparen", ")": "rparen",
                    "{": "lbrace", "}": "rbrace"}.get(c, "op")
            tokens.append(Token(kind, c, line)); i += 1; continue
        raise SyntaxError(f"line {line}: unexpected character {c!r}")
    tokens.append(Token("eof", None, line))
    return tokens

for t in lex('x = 10\nif x > 5 { print("big") }'):
    print(t)
# ident('x') op('=') number(10.0) keyword('if') ident('x') op('>') number(5.0)
# lparen('{') keyword('print') lparen('(') string('big') rparen(')') rbrace('}') eof(None)
```



## What you now know

- The lexer = **a loop + a character classifier**, with maximal munch deciding
  multi-char operators.
- Keywords are **identifiers checked against a table** — one code path.
- Every token carries its **line number**: Chapter 11's diagnostics are born here.

Next: tokens are flat — the parser reads the grammar and builds the tree, with
operator precedence falling out of the structure.
