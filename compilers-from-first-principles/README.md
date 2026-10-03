# Compilers from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that designs a small language ("Bite") and builds its complete
toolchain from first principles — lexer, parser, tree-walking interpreter, bytecode
compiler, stack-machine VM — until closures and precedence become data structures
you've personally implemented.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Databases](../databases-from-first-principles),
[LLMs](../llms-from-first-principles), [ML Foundations](../ml-foundations-from-first-principles)).

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

**Part I — From Text to Structure**
1. What Is a Compiler, Really? ✅
2. The Lexer: Characters to Tokens ✅
3. The Parser: Grammar to AST ✅

**Part II — Making It Run**
4. The Tree-Walking Interpreter ✅
5. Variables & Environments ✅
6. Control Flow: If, While & Turing Completeness ✅

**Part III — The Bytecode VM**
7. Compiling to Bytecode ✅
8. The Stack Machine: Bytecode That Runs ✅
9. Jumps, Control Flow & Functions in the VM ✅
10. Closures: Functions That Remember ✅

**Part IV — A Real Language**
11. Errors & Diagnostics: Talking to Humans ✅
12. Final Boss: The Complete Toolchain in ~400 Lines ✅ *(lexer → parser → compiler → VM)*

All 12 chapters are fully written, each with runnable builds — the chapters' own code
blocks concatenate into a working toolchain (verified: the lexer and parser run end to
end from the chapter listings). Things you build along the way: Bite's token stream,
a precedence-as-tree-shape parser, a tree-walking evaluator, environments with
shadowing, if/while/functions making the language Turing-complete, a bytecode
compiler and stack VM raced against the tree-walker, call frames with recursion,
closures capturing their birth environments, caret diagnostics — and the complete
toolchain running `fib(15)`.

## The rules of the course

1. **Start below the abstraction.** Before "use a parser generator", answer "what is a token, physically?"
2. **Nothing is magic.** Precedence, bytecode, closures — buildable data structures.
3. **Build the real thing.** The full toolchain: tree-walker AND bytecode VM.
4. **Then the books are manuals.** Crafting Interpreters becomes errata for your code.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.
