---
layout: ../../layouts/Chapter.astro
title: 'cgroups: The Budget'
description: 'Namespaces hide the world; cgroups ration it. Build: memory.max + a process that OOMs on camera, CPU quotas measured.'
part: 'Part II — The Runtime'
written: true
---

Namespaces (Chapters 2–4) hide the world; they don't *ration* it. A container with a
private everything can still `malloc` until the host dies. The fourth pillar —
**cgroups** (control groups) — doesn't isolate anything: it sets **budgets**. And on
cgroup v2, budgets are literally files: `echo 100M > memory.max`. Write a number, the
kernel enforces it, and the OOM killer (Linux course, Chapter 7) collects the
debtor. This chapter makes one OOM on camera.

## The lie you were told

> "Docker's --memory=100m flag is some Docker feature."

Docker is a translator. `--memory=100m` becomes `echo 104857600 > .../memory.max`;
`--cpus=1.5` becomes `cpu.max` = `150000 100000` ("150ms of CPU per 100ms window").
The cgroup filesystem **is** the API — Docker/Kubernetes just spell-check your YAML
into these files. You can drive it by hand:

```text
/sys/fs/cgroup/mybudget/
├── memory.max        "104857600"     ← hard RAM ceiling
├── memory.current    "41320448"      ← live usage (readable, like everything in Ch 5)
├── cpu.max           "150000 100000" ← CPU quota / period
├── pids.max          "50"            ← process-count ceiling
└── cgroup.procs      ← PIDs in this budget; write a PID here to enroll it
```

## Enforcement, two flavors

- **memory.max** is a *hard* wall: allocation that crosses it triggers the **OOM
  killer** *within the group* — the fattest process in *that* cgroup dies (Chapter 7's
  "scored" OOM killer, scoped). The host survives; the container restarts. This is why
  a leaky app in a container shows up as "container keeps restarting", not "host froze".
- **cpu.max** is a *throttle*: exceeding the quota doesn't kill — the group simply
  isn't scheduled until the next period. This is why CPU limits produce mysterious
  latency spikes (your app gets paused mid-request every 100ms window) rather than
  slowdowns you can profile. (Kubernetes' CPU-limit latency folklore, explained: it's
  the throttle window.)

## Prove it to yourself

**1. Watch a budget in real time:**

```sh
cd /sys/fs/cgroup && mkdir -p demo && echo "+memory +cpus +pids" > cgroup.subtree_control 2>/dev/null
echo 50M > demo/memory.max
sleep 300 & echo $! > demo/cgroup.procs        # enroll the sleeper
cat demo/memory.current                        # its live usage, in your own file
```

**2. The OOM, on camera:**

```sh
cd /sys/fs/cgroup
echo 20M > demo/memory.max                     # a tiny budget
python3 -c "x = bytearray(100 * 1024 * 1024); input()" &   # wants 100MB
echo $! > demo/cgroup.procs
sleep 2; dmesg | tail -3
# Memory cgroup out of memory: Killed process 12345 (python3) — the killer, scoped,
# on camera. The host never flinched.
```

**3. Feel the CPU throttle:**

```sh
echo "50000 100000" > demo/cpu.max             # 50% of one core: 50ms per 100ms
cat demo/cpu.stat                              # nr_throttled / throttled_usec — the
                                               # smoking gun when latency graphs spike
```

`cpu.stat`'s `nr_throttled` is the diagnosis for "the container is slow but CPU graphs
show 50%": it's not slow, it's *rationed* — paused half of every window by design.

## The build: a budget, end to end

```c
/* budget.c — gcc -o budget budget.c && sudo ./budget
   A C program that puts its child in a cgroup and watches the OOM collect it. */
#define _GNU_SOURCE
#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main(void) {
    system("mkdir -p /sys/fs/cgroup/budget && echo 20M > /sys/fs/cgroup/budget/memory.max");

    pid_t pid = fork();
    if (pid == 0) {
        char buf[64]; int fd = open("/sys/fs/cgroup/budget/cgroup.procs", 1); /* O_WRONLY */
        int len = snprintf(buf, sizeof buf, "%d", getpid());
        write(fd, buf, len); close(fd);                 /* enroll MYSELF in the budget */
        char *hogs[100];                                 /* allocate 100 MB in 1MB bites: */
        for (int i = 0; i < 100; i++) {
            hogs[i] = malloc(1024 * 1024); memset(hogs[i], 1, 1024 * 1024);
            usleep(10000);
        }
        printf("never printed: the OOM killer collected me first\n");
        return 0;
    }
    int st; waitpid(pid, &st, 0);                        /* the parent watches it die */
    printf("child killed by OOM: %s\n", WIFSIGNALED(st) && WTERMSIG(st) == 9 ? "yes (SIGKILL)" : "no");
    return 0;
}
```

The child allocates 1 MB at a time — politely, the way a leaky service does — and dies
at 20 MB, by SIGKILL, from the OOM killer, inside its own budget, without touching
anyone else. Namespaces said "you can't see the world"; cgroups say "and you get 20
megabytes of it".

## What you now know

- cgroup budgets are **files**: `memory.max`, `cpu.max`, `pids.max` — Docker/K8s flags
  are translators into them.
- Memory limits kill (**OOM, group-scoped**); CPU limits **throttle in windows** —
  `cpu.stat`'s `nr_throttled` explains "slow but idle" containers.
- Enrollment is writing a PID to `cgroup.procs` — the whole API is the VFS (Linux
  course, Chapter 5, forever).
- Your four pillars now: PID namespace, mount namespace + pivot_root, network
  namespace, cgroup budget. Next: the *filesystem contents* — where image layers and
  overlayfs stack.
