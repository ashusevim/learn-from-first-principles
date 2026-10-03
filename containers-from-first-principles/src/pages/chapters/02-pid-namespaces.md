---
layout: ../../layouts/Chapter.astro
title: 'PID Namespaces: A Private Process Tree'
description: 'Inside the container, PID 1 is your shell. Build: unshare --pid --fork --mount-proc, then meet PID 1’s reaping duties up close.'
part: 'Part I — The Kernel Foundation'
written: true
---

Chapter 1 proved a container is a process in a smaller world. The first wall of that
world is the **PID namespace**: inside it, processes are renumbered from 1, the host's
hundreds of processes become invisible, and *your* main process wakes up as **PID 1** —
a role with duties most programs never trained for. This chapter builds the namespace,
then makes you be PID 1.

## The lie you were told

> "Docker assigns containers fake PID numbers."

Nothing is "fake". A **PID namespace** is a kernel structure that scopes the PID
counter: the first process forked inside gets number 1, its children 2, 3... The *same
physical task_structs* (Linux course, Chapter 3) have different numbers in different
namespaces — the host sees your container's shell as PID 48211; the container sees it
as PID 1. Two true numbers, one process.

## The rules of PID 1

Inside a new PID namespace, that first process inherits the duties the Linux course
(Chapter 3) documented — plus new teeth:

1. **Reaper**: any orphan in the namespace is re-parented to *you*; uncollected
   children become zombies in *your* table. Your container "leaks memory" for no
   reason? Its PID 1 isn't calling `wait()`.
2. **Signal immunity**: signals from *outside* the namespace (even `kill -9` from root
   on the host... mostly) don't kill PID 1 unless the process installed a handler.
   That's why `docker stop` sends SIGTERM and *waits* — PID 1 may ignore it, hence the
   `-t` timeout, hence `SIGKILL` after.
3. **The namespace dies with PID 1**: if it exits, the kernel SIGKILLs everything else
   in the namespace. This is why a container exits when its main command exits — there
   is no "container shell" hiding behind it.

## Prove it to yourself

**1. The renumbering, observed both ways:**

```sh
sudo unshare --pid --fork --mount-proc bash -c 'echo "inside: $$"; sleep 30' &
sleep 1
# inside the container: $$ printed as a small number (often 1 or 2)
ps -ef | grep "sleep 30"    # on the host: the SAME process at a big host PID
```

One process, two numbers — read them side by side. That's the namespace, seen.

**2. Invisibility, one-directional:**

```sh
sudo unshare --pid --fork --mount-proc bash -c 'ps -ef | wc -l'   # ~2: just bash+ps
ps -ef | wc -l                                                     # host: hundreds
```

The container can't see the host. The host sees the container. Chapter 1's
one-directional isolation, in process lists.

**3. The zombie leak, reproduced in miniature:**

```sh
sudo unshare --pid --fork --mount-proc bash -c '
  for i in 1 2 3; do (sleep 0.1) & done     # orphans: parent shell loops on
  sleep 1; ps -ef'                           # ...watch [defunct] children stack up
```

The inner bash is PID 1 here and *is* reaping (bash waits) — but replace it with a
custom app that doesn't `wait()`, and those defunct rows pile up forever. This exact
bug ships in production containers weekly.

## The build: be PID 1, by hand

Chapter 14 of the Linux course used `unshare(2)` in C; here's the minimal PID-namespace
program, with the reaping duty made explicit:

```c
/* pid1.c — gcc -o pid1 pid1.c && sudo ./pid1
   The child of an unshare(CLONE_NEWPID) fork is PID 1 of a new universe. */
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();                     /* fork AFTER unshare: child = new PID 1 */
    if (unshare(CLONE_NEWPID) == -1) { perror("unshare"); return 1; }

    pid = fork();
    if (pid == 0) {
        printf("inside: my PID is %d (I am PID 1!)\n", getpid());   /* prints 1 */
        /* spawn a child that dies instantly — an orphan for US to reap: */
        if (fork() == 0) return 0;
        sleep(1);
        int st;                             /* PID 1's DUTY: reap orphans, or they */
        while (wait(&st) > 0);              /* pile up as zombies in our table */
        printf("reaped my orphan. exiting: universe dies with me\n");
        return 0;
    }
    wait(NULL);                             /* host parent: the namespace's babysitter */
    return 0;
}
```

Run it: the inner process prints **PID 1**, reaps its orphan, exits — and the namespace
dies with it. You've now been PID 1, and the `--init` flag, the zombie-container bug,
and `docker stop`'s SIGTERM-then-KILL dance are all explained.

## What you now know

- PID namespaces **renumber processes privately**: one task, true numbers in every
  namespace it belongs to.
- **PID 1 = reaper + signal-immune + namespace load-bearing**: three reasons container
  best practices exist.
- Isolation stays one-directional: the host's `ps` sees through; the container's can't.
- Zombie containers = PID 1 skipping `wait()`. Now a diagnosis, not a mystery.

Next: the process tree is private — but it still sees your filesystem. Wall two: mount
namespaces, where a directory on your disk becomes the only "/" there is.
