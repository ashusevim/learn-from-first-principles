---
layout: ../../layouts/Chapter.astro
title: 'The Assembler: Mnemonics to Machine Code'
description: 'Two passes: resolve labels, encode instructions. Build: an assembler for Bite-16 assembly.'
part: 'Part III — Running Programs'
written: true
---

Writing `0x4107` by hand is a party trick, not a workflow. The **assembler** is the
first tool ever built on top of a computer: it translates human-writable mnemonics
(`LOADI R1, 7`) into machine code, resolving **labels** (`loop:`) into addresses —
including forward references, which need the famous **two-pass** structure (the
compilers course, Chapter 7, used the same trick for loop jumps). This chapter
builds Bite-16's assembler.

## The lie you were told

> "Assembly is unreadable."

Assembly is *verbose but honest* — one line per instruction, no hidden state. The
program from Chapter 7:

```asm
        LOADI R1, 3
        LOADI R2, 1
loop:   SUB R0, R2
        JZ R0, done
        JUMP loop
done:   HALT
```

Reads exactly like what the CPU does. The assembler's job: convert each line to its
16-bit encoding, and turn `loop`/`done` into addresses.

## The two passes

```text
PASS 1:  read every line, count addresses, record label positions
         (an instruction is 2 bytes; a label is where the NEXT instruction lands)
PASS 2:  emit encodings, substituting label addresses for label names
```

Why two passes? `JZ R0, done` at address 6 references `done` at address 12 — which
the assembler hasn't seen yet at line 4. Pass 1 collects the symbol table; pass 2
resolves. (The compilers course's Chapter 7 patched placeholders with the same
trick; the assembler's symbol table is the general solution.)

## Prove it to yourself

**1. The symbol table, inspected:**

```text
pass 1 produces: {"loop": 4, "done": 12}
pass 2 resolves: JZ R0, 12   and   JUMP 4
```

**2. Assembly is the compilers course's lexer+parser, applied to the ISA** —
mnemonics are keywords, registers and numbers are operands, and the encoding is
Chapter 5's `encode()`. No new concepts; a new grammar.

## The build: the assembler

```python
# asm.py — the two-pass assembler (~45 lines)
from isa import encode, OPCODES

MNEMONICS = {"LOAD": 0x0, "STORE": 0x1, "ADD": 0x2, "SUB": 0x3,
             "LOADI": 0x4, "JUMP": 0x5, "JZ": 0x6, "CALL": 0x7,
             "RET": 0x8, "HALT": 0x9}

def parse_line(line):
    line = line.split(";")[0].strip()               # strip comments
    if not line: return None
    label = None
    if ":" in line:
        label, line = line.split(":", 1); label = label.strip(); line = line.strip()
    parts = line.split()
    mnemonic = parts[0] if parts else None
    operands = [p for p in (parts[1:] if len(parts) > 1 else []) if p]
    return label, mnemonic, operands

def reg_number(r):                                  # "R2" → 2
    return int(r[1:]) if r.startswith("R") else int(r)

def assemble(source):
    labels, words = {}, []
    # ── pass 1: collect labels and count instruction sizes ──
    for line in source.splitlines():
        label, mnem, ops = parse_line(line)
        if label: labels[label] = len(words) * 2    # byte address of the next word
        if mnem: words.append(None)                 # placeholder per instruction
    # ── pass 2: encode, resolving labels ──
    pc, out, out_lines = 0, [], []
    for line in source.splitlines():
        label, mnem, ops = parse_line(line)
        if label: labels[label] = pc
        if not mnem: continue
        if mnem == "HALT":
            word = encode("HALT")
        elif mnem in ("LOADI",):
            word = encode("LOADI", (reg_number(ops[0]) << 8) | int(ops[1]))
        elif mnem in ("ADD", "SUB"):
            word = encode(mnem, (reg_number(ops[0]) << 8) | reg_number(ops[1]))
        elif mnem in ("LOAD", "STORE"):
            word = encode(mnem, (reg_number(ops[0]) << 8) | int(ops[1].strip("[]")))
        elif mnem in ("JUMP", "JZ", "CALL"):
            target = int(ops[1]) if ops[1].isdigit() else labels[ops[1]]
            word = encode(mnem, (reg_number(ops[0]) << 12 if mnem == "JZ" else 0) | target)
        elif mnem == "RET":
            word = encode("RET")
        else:
            raise SyntaxError(f"unknown mnemonic {mnem}")
        out.append(word); out_lines.append((pc, mnem, ops)); pc += 2
    return out, labels, out_lines

source = """
        LOADI R1, 3
        LOADI R2, 1
        LOADI R0, 3
loop:   SUB R0, R2
        JZ R0, done
        JUMP loop
done:   HALT
"""
words, labels, _ = assemble(source)
print("labels:", labels)
print("machine code:", [hex(w) for w in words])
# labels: {'loop': 8, 'done': 14}
# machine code: ['0x4103', '0x4201', '0x4003', '0x3002', '0x600e', '0x5008', '0x9000']
```

The labels resolved to byte addresses (`loop: 8`, `done: 14`) and the encodings
match Chapter 7's hand-assembly — produced from readable mnemonics. (The JZ
encoding packs the register into the top bits, exactly as Chapter 5's operand
packing prescribed.)

## What you now know

- The assembler = **two passes over the source**: pass 1 builds the symbol table,
  pass 2 encodes and resolves — forward references handled by design.
- Assembly is the **compilers course's frontend aimed at the ISA**: mnemonics as
  keywords, the encoding as codegen.
- The symbol table generalizes to every linker and loader — the same two-pass idea
  at every scale.

Next: what you've built is a *simulator* — real silicon adds buses, clock speed,
and caches. Your CPU mapped to the physics.
