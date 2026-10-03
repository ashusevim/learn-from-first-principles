---
layout: ../../layouts/Chapter.astro
title: 'What Is a Kernel, Really?'
description: 'Kernel vs. distro vs. shell vs. desktop. Syscalls as the only door between your code and the hardware, and how to watch them happen.'
part: 'Part I — The Machine Wakes Up'
written: true
---

You said "I installed Linux" — but what you installed was Ubuntu or Fedora or Arch. So
which part is Linux? Ask three people and you'll get three answers. This chapter gives you
the only definition that matters, and one insight that explains every security setting,
every driver install, and every "permission denied" you'll ever see: **your code is not
allowed to touch the hardware. Ever. Someone else does it for you.**

## The lie you were told

> "I installed Linux when I installed Ubuntu."

A Linux **distro** is a bundle: one kernel (a single file!) plus thousands of userland
programs wrapped around it. You install the bundle; the kernel itself is one file sitting
in `/boot`.

## The one diagram that explains everything

Your machine has exactly two layers of software, separated by a hard wall:

```text
┌─────────────────────────────────────────┐
│  USERLAND                               │
│  bash · firefox · your code · systemd   │  ← thousands of programs
├──────────── syscall boundary ───────────┤  ← the only door
│  KERNEL (the one file: vmlinuz)         │
│  scheduler · memory · drivers · net     │  ← one program, total power
├─────────────────────────────────────────┤
│  HARDWARE: CPU · RAM · disk · NIC       │
└─────────────────────────────────────────┘
```

- The **kernel** is the one program allowed to talk to hardware. It schedules every process,
  owns all memory, routes every packet.
- **Userland** is everything else — including the shell, the desktop, and your code. None of
  it can touch hardware directly.

Why the wall? Because the CPU itself enforces it. x86 CPUs have privilege levels ("rings");
Linux uses two: **kernel mode** (ring 0 — do anything) and **user mode** (ring 3 — touching
hardware, or another process's memory, causes an immediate fault). When Ubuntu "runs as
root", root's programs still run in user mode — root is a userland concept. The kernel is
above even root.

## Syscalls: the only door

So how does userland get anything done? Through a **syscall** — a deliberate trap into
kernel code. Your program puts a number in a register (which syscall you want) and arguments
in others, then executes a special instruction. The CPU switches to kernel mode, the kernel
does the work safely, and switches back.

The doors you'll use all the time:

| Syscall | What it does |
|---------|-------------|
| `read` / `write` | bytes in / bytes out (files, terminals, sockets, pipes) |
| `open` / `close` | get and release a file descriptor |
| `fork` / `execve` | create a process / run a different program (Chapter 3) |
| `mmap` | map memory (Chapter 7) |
| `socket` / `connect` | talk over the network (Chapter 11) |

That's the whole trick. **libc — the "C library" — is just a polite wrapper** over these
doors: when you call `printf()`, it formats a string and calls the `write` syscall. When you
call `fopen()`, it calls `open`.

## Prove it to yourself

**1. Count the syscalls in "hello".** One innocent line of C:

```sh
strace -c printf hello 2>&1 | tail -5
```

`printf` made several real syscalls (memory setup, `write`, exit) to print six characters.
`strace` is showing you the door being knocked on, every time.

**2. Kernel version ≠ distro version.** They're two different counters:

```sh
uname -r              # e.g. 6.10.2-arch1-1  ← the kernel
cat /etc/os-release   # e.g. NAME="Arch Linux" ← the bundle
```

You can (and people do) run dozens of kernel versions under the same distro.

**3. See the kernel itself.** It's a single file, right there:

```sh
ls -lh /boot/vmlinuz*
```

Everything else in the distro — all of `/usr/bin` — is userland. You can delete every
program there and the kernel still runs; delete vmlinuz and nothing boots (Chapter 1).

## The build: knock on the door yourself

No `printf`, no `fopen`, no libc help — just the raw syscall:

```c
// hello.c — gcc -o hello hello.c && ./hello
#include <unistd.h>

int main(void) {
    write(1, "hello, kernel\n", 14);   // syscall: write(fd=1, buf, len)
    return 0;
}
```

Then watch it go through the wall:

```sh
strace ./hello 2>&1 | grep write
# write(1, "hello, kernel\n", 14) = 14
```

That line is the entire architecture of your computer in miniature: your code, on one side;
the kernel, doing the work on the other; one syscall crossing the boundary.

## What you now know

- A distro = **one kernel file** + a curated userland. The kernel is not "Ubuntu".
- Userland runs in a CPU-enforced sandbox; **syscalls are the only way out**.
- libc is a convenience wrapper, not magic — you can call syscalls directly.
- `strace` shows you any program's syscall conversation — the ultimate debugging tool.

Next: the kernel's first and most famous trick — how one program becomes a **process**.
