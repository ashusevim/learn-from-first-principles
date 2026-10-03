# Linux from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that teaches Linux from the power button up — what the firmware, kernel,
and every syscall are actually doing — until the commands you've been memorizing become obvious.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(inspired by its approach): fundamentals first, frameworks second.

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

**Part I — The Machine Wakes Up**
1. What Happens When You Press the Power Button ✅
2. What Is a Kernel, Really? ✅
3. Processes: fork, exec, and the Zombie Apocalypse ✅

**Part II — Talking to the Machine**
4. The Shell Is Just a REPL Over Syscalls ✅ *(includes a working mini shell in ~60 lines of C)*
5. Why Everything Is a File ✅
6. File Descriptors, Redirection & Pipes ✅

**Part III — The Kernel's Resources**
7. Memory Is a Lie (And That's Good) ✅
8. Users, Permissions & sudo ✅
9. Dynamic Linking: Every Binary Is Incomplete ✅

**Part IV — The Running System**
10. systemd & the Birth of Services ✅
11. Networking: Interfaces, Routes & Sockets ✅
12. Packages & Distros ✅

**Part V — Power Tools**
13. Observability: The Kernel Keeps Receipts ✅
14. Containers from Scratch ✅ *(the finale — build a container in ~70 lines of C)*

All 14 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a raw-syscall program, a fork/exec manager, a working
mini shell, an mmap file-writer, a `>` implementation, a TCP echo server, your own
systemd service, a hand-built package, a mini-top, and a container from scratch.

## The rules of the course

1. **Start below the abstraction.** Before "how to use X", answer "what is X made of?"
2. **Nothing is magic.** Every claim comes with a command you can run to watch it happen.
3. **Build a toy version.** Mini shell, mini-top, a container from scratch.
4. **Then the real tools are obvious.** The course ends where the documentation begins.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages (Rust, Go, Python) are
all welcome — open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/python/minishell.py` (Chapter 4's shell) and `code/go/forkexec.go` (Chapter 3's fork/exec/wait).
