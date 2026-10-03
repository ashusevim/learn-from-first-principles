---
layout: ../../layouts/Chapter.astro
title: 'Processes: fork, exec, and the Zombie Apocalypse'
description: 'A process is just a program that got a PID. fork(), exec(), wait(), signals, and why zombies exist.'
part: 'Part I — The Machine Wakes Up'
written: true
---

You'd think starting a program is one step. It's actually three — and the third one has a
body count of zombies. This is the chapter where Linux's process model stops being a
diagram in a book and becomes something you can watch, poke, and build yourself. Every
shell, every terminal tab, every Docker container, every `spawn()` in every language is
this exact mechanism wearing a costume.

## The lie you were told

> "The operating system runs programs."

The kernel never runs *programs*. It runs **processes** — a program plus a PID, a memory
space, open files, and CPU state. And here's the weird part: **a process can only be created
by another process**, using the same two syscalls, every time, for everything.

## The three-step dance

### 1. `fork()` — one becomes two

`fork()` clones the calling process. Same memory (copy-on-write: cheap), same open files,
new PID. Both continue from the same line of code; the only difference is the return value:
**0 in the child, the child's PID in the parent.**

```c
pid_t pid = fork();
if (pid == 0) {
    // I am the child
} else {
    // I am the parent, and pid is my child's ID
}
```

Why clone instead of "create fresh"? Because the parent's environment — open files,
working directory, environment variables — is exactly what the child should start with.
Cloning *is* the feature.

### 2. `execve()` — swap the program

The child usually doesn't want to be a clone — it wants to be `ls`. `execve()` **keeps the
process but replaces the program**: same PID, same open file descriptors, brand-new memory
image running the new binary. If it succeeds, it never returns — there's nothing to return to.

### 3. `wait()` — bury the dead

When a child dies, the kernel keeps a small corpse: its exit code. The parent is expected to
collect it with `wait()`. Until it does, the dead child lingers as a **zombie** — shows in
`ps` as `<defunct>`, holding nothing but an entry in the process table.

Zombies aren't a bug; they're a mailbox. But if a parent never waits and never dies, the
mailbox fills up — and if a parent *dies* first, its orphans get re-parented to **PID 1**
(systemd), which dutifully waits on everyone. That's PID 1's oldest job description.

## Signals: poking a process from outside

A **signal** is a tiny message the kernel delivers to a process — a number, nothing more.
Ctrl-C is `SIGINT` (2), asking politely. `kill -TERM` is `SIGTERM` (15), the standard "please
exit, you may clean up". Programs can catch both and clean up gracefully.

`SIGKILL` (9) is different. It's not delivered to the process at all — the kernel just
removes it. Nothing can catch it, which is also why `kill -9` can leave temp files and
shared memory behind. It's the fire exit, not the door.

## Prove it to yourself

**1. See the family tree.** Every process descends from PID 1:

```sh
ps -ef --forest | head -20
```

**2. Catch a live zombie.** Run this, then check `ps` from another terminal:

```sh
( sleep 3 & exec sleep 60 )     # the subshell execs sleep 60...
ps -ef | grep defunct           # ...3s later: [sleep] <defunct>, parent = sleep 60
```

The background `sleep` died after 3 seconds; its new parent (`sleep 60`) never calls
`wait()`. The zombie sits in the process table for the remaining 57 seconds — a corpse
waiting for someone to read its exit code.

**3. Feel the difference between signals:**

```sh
bash -c "trap 'echo caught SIGTERM, ignoring' TERM; sleep 60" &
kill -TERM %1    # prints the message; process keeps living
kill -KILL %1    # gone. No message. No cleanup. Nothing to catch.
```

## The build: your first process manager

This ~20-line program is the pattern under every shell and every supervisor:

```c
// forkexec.c — gcc -o forkexec forkexec.c && ./forkexec
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();               // 1. one becomes two

    if (pid == 0) {                   // child:
        execlp("ls", "ls", "-l", NULL);   // 2. swap program
        perror("exec");               // only runs if exec failed
        _exit(127);
    }

    int status;                       // parent:
    waitpid(pid, &status, 0);         // 3. reap the child
    if (WIFEXITED(status))
        printf("child exited with %d\n", WEXITSTATUS(status));
    return 0;
}
```

Run it. You've just done, by hand, exactly what bash does when you type `ls` — and what
systemd does when it starts nginx. fork, exec, wait. That's the whole industry.

## What you now know

- A **process** = program + PID + memory + open files; created only by `fork()`.
- `execve()` swaps the program, keeps the process; `wait()` collects the dead.
- **Zombies** are uncollected exit codes — a mailbox, or a leak if nobody reads it.
- `SIGKILL` isn't a message; it's the kernel deleting the process. Handle with care.

Next: the program you've been using to run all these experiments — and why it's just
another process doing this same dance.
