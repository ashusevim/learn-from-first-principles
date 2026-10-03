---
layout: ../../layouts/Chapter.astro
title: 'Containers from Scratch'
description: 'Docker is namespaces + cgroups + overlayfs. The finale: we build a working container in ~70 lines of C, no Docker in sight.'
part: 'Part V — Power Tools'
written: true
---

You've reached the finale, and it aims at the biggest "magic" in our industry: containers.
Docker, Kubernetes, "lightweight VMs", 47 CI logos. Here is the secret the whole ecosystem
is built on: **there is no virtualization**. A container is an *ordinary Linux process* —
the same fork/exec from Chapter 3 — that the kernel has agreed to show a smaller world to.
Every concept in this course was secretly a container chapter. Time to cash them all in.

## The lie you were told

> "Containers are little virtual machines."

A VM fakes hardware and runs a kernel; a container has **no kernel of its own** — it *is*
processes on *your* kernel. What makes it feel isolated are three kernel features:

| Feature | What it does | Course chapter |
|---------|-------------|----------------|
| **Namespaces** | private *views*: own PIDs, own mounts, own network, own hostname | Ch 3, Ch 5 |
| **cgroups** | private *budgets*: caps on memory, CPU, IO | Ch 7 |
| **overlayfs** | private *filesystem*: image layers stacked into one root | Ch 5 |

That's the whole stack. Docker = these three + image format + registry + excellent UX.

## Namespace 1: a private process tree

In a **PID namespace**, the first forked process becomes PID 1 of a new universe — and
can't see yours. Yours can see it (`lsns` lists every namespace on the machine, including
your browser's). Try it right now, no code:

```sh
sudo unshare --pid --fork --mount-proc bash
ps -ef          # PID 1 is bash. The universe shrunk around you.
exit
```

## Namespace 2: a private filesystem

**pivot_root** (chroot's modern, safer sibling) swaps your mount root for a directory.
That directory *is* the container's `/` — which is exactly what a Docker **image** is: a
directory tree. And **overlayfs** is how layers stack cheaply:

```sh
ip link add docker0 type bridge   # ...actually, simpler: look at real layers
mount | grep overlay | head -1    # if you run Docker, it's already here:
# overlay on / ... lowerdir=A:B, upperdir=C, workdir=D — image layers + your writes
```

Reads fall through the read-only lower layers; writes land in the writable `upperdir`.
That's why images share gigabytes of layers and your container writes don't touch them.

## Namespace 3: a private budget

cgroups (Chapter 7's "ration") cap the container's memory and CPU. `memory.max` is a file —
write a number in it, and the OOM killer enforces your lease:

```sh
cat /sys/fs/cgroup/system.slice/docker.service/memory.max 2>/dev/null || \
ls /sys/fs/cgroup/ | head        # cgroup v2: one unified tree of budgets
```

And Chapter 8's capabilities are the "root without all of root" story: Docker containers
run as "root" with a *truncated capability set* — that's why some things still fail inside
them.

## The build: a container in ~70 lines of C

Get any root filesystem (a directory with `/bin/sh`):

```sh
mkdir -p rootfs && sudo debootstrap --variant=minbase jammy rootfs   # Debian/Ubuntu
# or: docker export $(docker create busybox) | tar -C rootfs -xf -
```

Then the kernel primitives — nothing else:

```c
// my-container.c — gcc -o my-container my-container.c
// usage: sudo ./my-container /path/to/rootfs
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/wait.h>

int main(int argc, char **argv) {
    if (argc < 2) { fprintf(stderr, "usage: %s <rootfs>\n", argv[0]); return 1; }
    const char *rootfs = argv[1];

    /* 1. new namespaces: mounts, PIDs, hostname, IPC */
    if (unshare(CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS | CLONE_NEWIPC) == -1) {
        perror("unshare"); return 1;
    }

    /* 2. keep our mounts private from the host */
    if (mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL) == -1) {
        perror("remount private"); return 1;
    }

    /* 3. bind-mount rootfs onto itself so pivot_root has an anchor */
    if (mount(rootfs, rootfs, NULL, MS_BIND | MS_REC, NULL) == -1) {
        perror("bind rootfs"); return 1;
    }
    char put_old[512];
    snprintf(put_old, sizeof(put_old), "%s/old", rootfs);
    mkdir(put_old, 0700);
    if (chdir(rootfs) == -1) { perror("chdir rootfs"); return 1; }

    /* 4. pivot_root: the container's directory IS / now */
    if (syscall(SYS_pivot_root, ".", "old") == -1) { perror("pivot_root"); return 1; }
    if (chdir("/") == -1 || umount2("/old", MNT_DETACH) == -1) {
        perror("detach old root"); return 1;
    }

    /* 5. fork: first child in the new PID namespace becomes its PID 1 */
    pid_t pid = fork();
    if (pid == 0) {
        sethostname("my-container", 12);                  /* own hostname */
        mkdir("/proc", 0755);
        mount("proc", "/proc", "proc", 0, NULL);          /* fresh /proc for new PIDs */
        char *shell[] = { "/bin/sh", NULL };
        execv(shell[0], shell);                           /* Chapter 3's execve! */
        perror("exec"); _exit(127);
    }

    /* 6. we (the parent) are the "runtime" — like docker, but honest */
    int status;
    waitpid(pid, &status, 0);
    printf("[runtime] container (pid 1) exited with %d\n",
           WIFEXITED(status) ? WEXITSTATUS(status) : -1);
    return 0;
}
```

```sh
sudo ./my-container $PWD/rootfs
/ # ps -ef          # PID 1 = our sh. Welcome to the world you built.
/ # ls /            # a whole filesystem that was a directory a second ago
/ # exit
```

Look at what you did *not* write: no VM, no hypervisor, no image daemon. Namespaces,
mounts, fork, exec, wait — Chapters 3, 5, 7. Docker is this program with 10 million lines
of polish around it. You have now built, from first principles, the thing everyone
abbreviates as "just use Docker".

## Where you are now

Fourteen chapters ago, a computer was a box that ran an OS you'd memorized commands for.
Now: you know how it boots, what a kernel is for, how processes are born and buried, why
everything is a file, what memory really is, who root actually is, what happens before
`main()`, who supervises your services, how packets leave the building, where binaries
come from, how to read the kernel's receipts — and you've built a shell, a top, a TCP
server, and a container.

The frameworks were never magic. They were waiting for you to look underneath.

**Where to go next:** run `strace` on everything; read `/proc` out of boredom; try
`unshare` on a rainy day. And when you're ready for the next mountain, the First
Principles Project has courses on networking, databases, and git that start exactly where
this one ends.
