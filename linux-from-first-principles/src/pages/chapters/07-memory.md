---
layout: ../../layouts/Chapter.astro
title: 'Memory Is a Lie (And That’s Good)'
description: 'Virtual memory, pages, mmap, the page cache, and the OOM killer. Why every process thinks it owns the machine.'
part: 'Part III — The Kernel’s Resources'
written: true
---

Every address your program has ever used is fake. Every single one. The kernel, together
with a chip on your CPU, has been running the most successful con in computing history:
convincing thousands of processes that each one owns a huge, private, contiguous stretch of
memory — on a machine that has a fraction of that, shared between everyone. Understanding
this con explains "out of memory", swap, why `free` confuses everyone, and what the OOM
killer actually is.

## The lie you were told

> "A pointer holds a physical address, and malloc fails when RAM runs out."

Wrong on both counts. A pointer holds a **virtual address** — an index into your process's
private fantasy. And allocation almost never fails, because Linux **overcommits**: it
promises memory it hasn't handed out yet, betting you won't use it all. When the bet fails,
the kernel doesn't refuse — it *kills someone*.

## The machinery: pages and the MMU

Memory is managed in fixed chunks called **pages** (4 KiB on x86-64). Your CPU's MMU
translates every virtual address through **page tables** the kernel maintains:

```text
your program:  0x7fff_aaaa_1234   (virtual — meaningless to hardware)
                          │ page tables
                          ▼
             physical RAM frame 0x1a2b3   (real location, nobody asked)
```

Two processes can both "have" address 0x400000 — they're different pages. One process can't
even *name* another's memory. That's isolation, for free, at every memory access.

And it's lazy: when you `malloc` 1 GiB, the kernel just makes a *note*. Nothing is assigned
until you touch a page and the MMU faults — only then does the kernel find a real frame.
**Allocating is free. Using is what costs.**

## mmap: files are memory, memory is files

`mmap()` asks the kernel to make a file (or fresh zeroed memory) appear at an address in
your space. Read that address, you're reading the file. This is how `malloc` serves big
allocations, how loaders map binaries (Chapter 9), and how the kernel implements...

## The page cache: your "free" RAM was never free

RAM you aren't using is being filled with pages of files you *might* read next. That's the
**page cache** — it's why reading the same file twice is instant, and why `free` looks
terrifying on an idle machine. Linux grabs all RAM it can and gives it back the moment you
need it.

## Overcommit and the OOM killer

Because of the promise-now-use-later scheme, physical RAM can genuinely run out. When it
does, the kernel can evict page-cache pages, swap anonymous ones to disk — and if even that
fails, it invokes the **OOM killer**: it picks the process hogging the most memory and
SIGKILLs it. Not the guilty one, not your favorite — the *scored* one. This is why "the
server just died at 3am" is a genre.

## Prove it to yourself

**1. Read your own address space** — the lie, itemized (Chapters 5's window again):

```sh
head -8 /proc/self/maps
```

**2. Watch allocation stay lazy.** Compile and run this, with `grep VmRSS /proc/<pid>/status`
in a second terminal:

```c
// lazy.c — gcc -o lazy lazy.c && ./lazy
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    size_t GB = 1 << 30;
    char *p = malloc(GB);
    printf("malloc'd 1 GiB. pid=%d — check VmRSS now (it barely moved)\n", getpid());
    printf("press Enter to touch one byte per page...\n");
    getchar();
    for (size_t i = 0; i < GB; i += 4096) p[i] = 1;
    printf("touched. check VmRSS again — allocation ≠ usage\n");
    getchar();
    return 0;
}
```

**3. The page cache in action:**

```sh
time cat /usr/lib/libc.so.6 > /dev/null   # first read
time cat /usr/lib/libc.so.6 > /dev/null   # second read: ~instant, it's cached
free -h                                   # "available" ≠ "free"
```

## The build: the memory that *was* a file

Write to memory, and the file on disk changes — because for a `MAP_SHARED` mapping, they
were always the same pages:

```c
// mmapfile.c — gcc -o mmapfile mmapfile.c && ./mmapfile
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>

int main(void) {
    int fd = open("note.txt", O_RDWR | O_CREAT, 0644);
    write(fd, "XXXXXXXXXXX", 11);            // give the file some bytes

    char *p = mmap(NULL, 11, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    memcpy(p, "hello mmap", 10);              // "write to memory"...

    msync(p, 11, MS_SYNC);
    munmap(p, 11);

    char buf[12];
    lseek(fd, 0, SEEK_SET);
    read(fd, buf, 11); buf[11] = 0;
    printf("file now contains: %s\n", buf);   // ...the memory WAS the file
    close(fd);
    return 0;
}
```

No `write()` call ever touched the content. This is the "everything is a file" idea from
Chapter 5, coming out the other side.

## What you now know

- Every address is **virtual**; the MMU + page tables translate, isolate, and lie.
- **Allocation is a note; touching is the cost** (demand paging).
- `mmap` makes files and memory the same thing; the **page cache** eats your "free" RAM on purpose.
- When the lie fails: swap, then the **OOM killer** — the kernel shoots the biggest process.

Next: the kernel checks a number on every syscall to decide what you may do — and one
number means "everything". Users, root, and the truth about sudo.
