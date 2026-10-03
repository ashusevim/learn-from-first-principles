---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: Your Own Container Runtime'
description: 'Namespaces + cgroups + overlayfs + a rootfs, in ~200 lines. run sh inside your own runtime. The course ends where Docker began.'
part: 'Part III — The Ecosystem'
written: true
---

The finale. Twelve chapters built every pillar by hand — PID/mount/network namespaces,
cgroup budgets, overlayfs, the rootfs, the OCI spec, the shim. Now they become **one
program**: a container runtime in ~200 lines of C that runs a shell inside a world you
constructed — with Docker's own flags mapped to your code, line by line. When
`myrun alpine sh` gives you a prompt, Docker stops being a product and becomes a
*ledger of syscalls you already know*.

## The lie you were told

> "A container runtime is years of engineering beyond reach."

The *hardened* ones (runc, crun) are — spec compliance, rootless modes, security
hardening. The **core loop** is four moves, each from a chapter:

```text
1. unshare(CREATE_NEWNS|NEWPID|NEWUTS)     ← Ch 2–4: the private views
2. write cgroup files, enroll the child    ← Ch 5: the budget
3. mount overlayfs, pivot_root             ← Ch 6–7: the filesystem
4. exec your command                       ← Linux course Ch 3: the last syscall
```

(Plus Chapter 9's shim role: *be the parent that waits*. You already are — it's your
main function.)

## The build: myrun.c — the course, compiled

```c
/* myrun.c — gcc -O2 -o myrun myrun.c
   usage: sudo ./myrun /path/to/rootfs /bin/sh          (your Ch 7 rootfs) */
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/wait.h>

static void setup_cgroup(long mem_bytes) {               /* Ch 5: the budget as files */
    system("mkdir -p /sys/fs/cgroup/myrun");
    FILE *f = fopen("/sys/fs/cgroup/myrun/memory.max", "w");
    fprintf(f, "%ld", mem_bytes); fclose(f);             /* 128 MB by default, below */
}

static void setup_fs(const char *rootfs) {               /* Ch 3 + 6: private "/" */
    mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL);   /* stop propagation (Ch 3!) */
    mount(rootfs, rootfs, NULL, MS_BIND | MS_REC, NULL); /* the anchor */
    char old[512]; snprintf(old, sizeof old, "%s/.old", rootfs);
    mkdir(old, 0700); chdir(rootfs);
    syscall(SYS_pivot_root, ".", ".old");                /* the world swap */
    chdir("/"); umount2("/.old", MNT_DETACH);
    mkdir("/proc", 0755); mount("proc", "/proc", "proc", 0, NULL);   /* fresh /proc */
    mkdir("/dev", 0755);  mount("devtmpfs", "/dev", "devtmpfs", 0, NULL);
}

int main(int argc, char **argv) {
    if (argc < 3) { fprintf(stderr, "usage: %s <rootfs> <cmd>\n", argv[0]); return 1; }

    /* 1. the private views — ONE syscall, five namespaces (Ch 2–4) */
    unshare(CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS | CLONE_NEWIPC);
    setup_cgroup(128 * 1024 * 1024);                     /* 2. the budget (Ch 5) */

    pid_t pid = fork();
    if (pid == 0) {                                      /* the child: PID 1 of the new ns */
        sethostname("myrun", 5);                         /* Ch 2's private hostname */
        setup_fs(argv[1]);                               /* Ch 3/6/7: the filesystem */

        char *args[] = {argv[2], NULL};
        execv(args[0], args);                            /* 4. the last syscall */
        perror("exec"); return 1;
    }

    /* the SHIM (Ch 9): enroll the child, then WAIT — the durable parent (Ch 2) */
    FILE *f = fopen("/sys/fs/cgroup/myrun/cgroup.procs", "w");
    fprintf(f, "%d", pid); fclose(f);

    int status;
    waitpid(pid, &status, 0);                            /* reap PID 1: my duty as shim */
    printf("[myrun] container (pid 1) exited: %d\n",
           WIFEXITED(status) ? WEXITSTATUS(status) : -1);
    return 0;
}
```

```sh
sudo ./myrun $PWD/rootfs /bin/sh
/ # hostname && ps && ls /
myrun    1 root    /bin/sh    bin proc dev ...
```

Two hundred lines (with error handling), zero external tools. Every line cites a
chapter. **The container ran.**

## The equivalence ledger

Every Docker flag you've used, mapped to what you just wrote:

| Docker | myrun / the chapter |
|---|---|
| `docker run alpine sh` | Ch 2–4: `unshare` + `exec` |
| `--memory=128m` | Ch 5: `echo 134217728 > memory.max` |
| `--hostname` | Ch 1–2: `sethostname()` (UTS ns) |
| `-v host:ctr` | Ch 3: `mount(MS_BIND)` into the ns |
| the image | Ch 6–7: overlayfs over a rootfs |
| `--rm` | `waitpid` + cleaning the cgroup dir |
| the daemon | *absent by design* — Ch 9 explained what it adds |

What Docker adds to this program: image registries and pulls (Ch 6's tarballs over the
network), build caching, API/naming, networking conveniences (Ch 10), and hardening.
Valuable — but now *catalogued* value, not mystery.

## Where you are now

Fourteen chapters ago (counting your Linux course), a container was a marketing word.
Now you've: watched a process get renumbered to PID 1 (Ch 2), pivoted a filesystem
root (Ch 3), wired a private internet with veth pairs (Ch 4), enforced a memory budget
and met the OOM killer on camera (Ch 5), stacked image layers on overlayfs (Ch 6),
built a one-binary rootfs (Ch 7), read the OCI spec as your own script serialized
(Ch 8), named the shim/containerd/daemon zoo (Ch 9), traced a packet through docker0's
NAT (Ch 10), proven the three storage lifetimes (Ch 11) — and compiled the whole course
into a runtime that runs a shell in a world of your construction.

Kubernetes schedules these. Docker builds these. You *make* these.

**Where to go next:** read runc's source tree — the file names are your table of
contents now. Then Kubernetes: every pod spec field maps to a chapter you own
(requests/limits → Ch 5, ports → Ch 10, volumes → Ch 11). And the First Principles
Project continues: **The Web** — one page load, traced byte-by-byte from DNS to paint.
