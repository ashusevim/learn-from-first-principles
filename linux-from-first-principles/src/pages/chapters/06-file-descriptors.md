---
layout: ../../layouts/Chapter.astro
title: 'File Descriptors, Redirection & Pipes'
description: 'stdin/stdout/stderr are just fds 0, 1, 2. dup2 explains every redirection you’ve ever typed — and how | actually works.'
part: 'Part II — Talking to the Machine'
written: true
---

`>`, `<`, `|`, `2>&1` — most people learn these as shell syntax to memorize. They're not
syntax. They're a three-syscall magic trick performed with integers, and once you've seen
the trick you'll never look at a pipeline the same way again. This is also the chapter that
explains your web server's logs, your container's stdin, and that one coworker who says
"everything is a file descriptor" at parties.

## The lie you were told

> "Redirection is a shell feature."

The shell redirects **nothing**. It can't — it's the parent, and the output comes from the
child. What the shell actually does is rewire the child's file descriptors *between*
`fork()` and `exec()` (Chapter 3's dance). The kernel has never heard of `>`.

## File descriptors: the number behind every I/O

When you `open()` anything, the kernel hands back a small integer — a **file descriptor
(fd)**. That number is an index into a per-process array of open files. By convention, and
only by convention:

| fd | Name | Usual target |
|----|------|--------------|
| 0 | stdin | your keyboard |
| 1 | stdout | your screen |
| 2 | stderr | your screen |

A process doesn't *have* to know what its fds point at — it just says `read(0)` or
`write(1)` and trusts the table. **That trust is the loophole.** If the table's entry for
fd 1 points somewhere else, the process will happily "print to the screen" into a file, a
pipe, or a socket, oblivious.

## The atom of redirection: `dup2()`

One syscall does everything:

```c
dup2(fd, 1);   /* make fd 1 point wherever fd points */
```

That's it. That is redirection, pipes, and `2>&1`, all in one line:

- **`ls > out.txt`** = fork; child: `open(out.txt)` → `dup2(fd, 1)` → `exec ls`.
- **`prog 2> err.txt`** = same, but `dup2(fd, 2)`.
- **`2>&1`** = `dup2(1, 2)`: make fd 2 point wherever fd 1 points.

And the order-matters trap it explains: in `2>&1 > file`, fd 2 is pointed at *fd 1's
current target* (the screen) **before** fd 1 moves to the file — so errors hit the screen.
`> file 2>&1` does it in the working order. It's not shell trivia; it's `dup2` call order.

## Pipes: a buffer in the kernel

A pipe is a one-way channel the kernel holds in memory: write in one end, read out the
other. `pipe2()` hands you **two fds for one channel** — write to one, read from the other.

So `cat hosts | wc -l` decomposes to, in the shell:

```text
pipe2() → {read_end, write_end}
fork child A: dup2(write_end, 1); exec cat hosts
fork child B: dup2(read_end, 0);  exec wc -l
```

Two ordinary programs. Neither knows a pipe exists. `cat` thinks it's printing to a screen;
`wc` thinks it's reading a keyboard — their fd tables just point at the same kernel buffer.
**Unix pipelines compose because programs stay dumb and the fd tables do the wiring.**

## Prove it to yourself

**1. Look at your own shell's fd table** (Chapters 5 strikes again):

```sh
ls -l /proc/$$/fd
```

fds 0, 1, 2 — all pointing at your terminal (a *pseudo-terminal device*, not a screen).

**2. See the shell build a pipeline by hand:**

```sh
strace -f -e trace=pipe2,dup2,execve bash -c 'ls | wc -l' 2>&1 | grep -E 'pipe2|dup2|execve'
```

Every line is one of the steps above, in order.

**3. Errors ignore `>`** — because `>` only rewires fd 1:

```sh
ls /does-not-exist > out.txt    # the error still hits your screen (fd 2)
```

## The build: implement `>` in three syscalls

This program *is* the `>` operator, by hand:

```c
// redirect.c — gcc -o redirect redirect.c && ./redirect && cat out.txt
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open("out.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);

    dup2(fd, 1);          // fd 1 now points at out.txt
    close(fd);

    execlp("ls", "ls", NULL);   // ls writes to "the screen" — i.e. the file
    return 0;
}
```

Run it, `cat out.txt` — there's the directory listing. `ls` was never told anything. The
rewire happened in its fd table, before it even started.

## What you now know

- An fd is an index into a per-process table of open files; 0/1/2 are conventions.
- **`dup2()` is the atom**: every `<`, `>`, `2>&1`, and `|` is a `dup2` in a child.
- A **pipe** is a kernel buffer exposing two fds — wiring, not a program feature.
- Programs stay oblivious; composition happens in the fd tables.

You've finished the "talking to the machine" arc — you can now explain, from syscalls up,
what happens when you type a command. Part III goes under the hood: memory, users, and
what really happens before `main()`.
