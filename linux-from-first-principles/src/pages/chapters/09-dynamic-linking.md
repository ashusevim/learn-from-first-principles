---
layout: ../../layouts/Chapter.astro
title: 'Dynamic Linking: Every Binary Is Incomplete'
description: 'ld.so, ldd, LD_LIBRARY_PATH, static vs. dynamic. What actually happens between execve() and main().'
part: 'Part III — The Kernel’s Resources'
written: true
---

Here's a fact that breaks people gently: when you `execve()` a program, the kernel does not
run your program. It runs **the dynamic linker**, which is itself a program, whose whole job
is to go find the pieces your binary is missing, glue them in, and only *then* hand control
to `main()`. You've been running a two-stage rocket your whole life without seeing stage one.

## The lie you were told

> "The kernel loads and runs my program, and `main()` is the beginning."

The kernel loads one file — your ELF binary — which is deliberately incomplete: its calls to
`printf`, `malloc`, `open` are **unresolved references** with a note: "find these somewhere
else at runtime". `main()` is at best the third act.

## What an ELF actually is

`vmlinuz`, `/bin/ls`, `libc.so.6` — same container format: **ELF**. Headers describing
sections (code, data, symbol tables), an entry point, and a list of **dependencies** ("I need
libc.so.6") plus, for each import, the symbol name to resolve. You can see it with
`readelf -h /bin/ls` — no magic, just a structured file (Chapters 5 strikes again: it's a
file, so it's inspectable).

## The hidden second program: ld.so

Every dynamically-linked ELF names its loader: `/lib64/ld-linux-x86-64.so.2`. The kernel
maps that first, and *it* does the rest:

1. Read your binary's dependency list (`DT_NEEDED` entries).
2. Find each library — **`ld.so.cache`** (pre-scanned paths), then `LD_LIBRARY_PATH`, then
   default dirs.
3. `mmap` each library into your address space (Chapter 7: a library is just a file in memory).
4. **Relocate**: patch addresses so your calls point at the real functions — via the PLT/GOT
   jump tables that make "one shared libc for every process" possible.
5. Run any **constructors**. *Then* call your `main()`.

One shared copy of libc mapped into hundreds of processes; libraries updated without
recompiling the world — that's the trade. The cost: complexity, the famous
`"cannot open shared object file"` error, and `LD_LIBRARY_PATH` debugging sessions.

## Prove it to yourself

**1. Every binary is a guest — here are its hosts:**

```sh
ldd /bin/ls
```

**2. Watch the linker run before your program does:**

```sh
strace -e trace=openat /bin/true 2>&1 | grep -E 'ld.so|libc'
```

Those `openat`s of `libc.so.6`? That's the *linker*, shopping — before `/bin/true` executes
one instruction of its own.

**3. The escape hatch — static linking** (everything baked in, no linker at runtime):

```sh
gcc -static -o hello hello.c && ldd hello
# not a dynamic executable — one file, runs anywhere. Containers love this.
```

## The build: run code *before* main()

**Part 1 — the constructor.** ELF binaries can carry functions ld.so must run before `main`:

```c
// ctor.c — gcc -o ctor ctor.c && ./ctor
#include <stdio.h>

__attribute__((constructor))
static void before_main(void) {
    printf("[before main] the linker ran me\n");
}

int main(void) {
    printf("[main] finally\n");
    return 0;
}
```

**Part 2 — hijack any program.** Build a library that *replaces* a libc function, and inject
it into someone else's binary with `LD_PRELOAD`:

```c
// shout.c — gcc -shared -fPIC -o shout.so shout.c
#include <stdio.h>

int puts(const char *s) {          /* same name as libc's puts: ours wins */
    fprintf(stderr, "INTERCEPTED: %s\n", s);
    return 0;
}
```

```sh
gcc -shared -fPIC -o shout.so shout.c
LD_PRELOAD=$PWD/shout.so ./ctor
```

Both lines print as `INTERCEPTED:` — your function replaced libc's in *someone else's
program*, because ld.so resolves symbols in `LD_PRELOAD` order first. (This is also, word
for word, how security researchers and malware hook processes. Same mechanism, different
intent.)

## What you now know

- Executables are **ELF** files with unresolved imports — deliberately incomplete.
- The kernel runs **ld.so**, which maps libraries, patches calls (PLT/GOT), runs
  constructors, and only then reaches `main()`.
- `ldd` shows the guests' hosts; `LD_PRELOAD` lets you cut in line; static linking opts out.
- `main()` is not the beginning — it's the third chapter.

Next: a process has to die someday. Who cleans up, who restarts it, and who catches its
diary? PID 1 — systemd.
