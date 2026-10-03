# CPUs from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that builds a CPU from first principles — NAND gates, an ALU,
registers, a designed instruction set, fetch-decode-execute, jumps and a call stack
— then an assembler, and Fibonacci running in machine code your toolchain assembled
itself.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Compilers](../compilers-from-first-principles), [LLMs](../llms-from-first-principles),
[ML Foundations](../ml-foundations-from-first-principles), [Cryptography](../cryptography-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — From Electricity to Logic**
1. What Is a CPU, Really? ✅
2. NAND Is Everything ✅
3. The ALU: Arithmetic in Gates ✅

**Part II — The Machine**
4. Memory & Registers: Remembering Bits ✅
5. Designing the Instruction Set ✅
6. Fetch–Decode–Execute: The CPU Loop ✅

**Part III — Running Programs**
7. Jumps & Branches: Teaching the CPU If ✅
8. Functions & the Call Stack ✅
9. The Assembler: Mnemonics to Machine Code ✅

**Part IV — The Real World**
10. Buses, Clocks & the Real Hardware ✅
11. From Bite-16 to x86 & RISC-V ✅
12. Final Boss: The Complete CPU in ~400 Lines ✅ *(gates → ALU → ISA → assembler → Fibonacci)*

All 12 chapters are fully written, each with runnable builds and verified outputs.
Things you build along the way: the NAND atom, a truth-table-verified gate library
(NOT/AND/OR/NOR/XOR/MUX), an 8-bit ALU with two's-complement subtraction, a
cross-coupled SR latch and D flip-flops, the Bite-16 ISA with packed operands, a
fetch-decode-execute CPU, the PC-as-register revelation, the two-stack history,
call frames with recursion, a two-pass assembler — and Fibonacci running in machine
code the toolchain assembled itself.

## The rules of the course

1. **Start below the abstraction.** Before "the CPU executes instructions", answer "what executes a gate?"
2. **Nothing is magic.** Adders, registers, the PC — traceable graphs of NANDs.
3. **Build the real thing.** An ISA designed, an assembler written, programs running.
4. **Then the real chips are readable.** x86 and RISC-V manuals decode as your ISA's ideas.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
