---
layout: ../../layouts/Chapter.astro
title: 'Observability: The Kernel Keeps Receipts'
description: 'strace, top, /proc, perf — every Linux debugging tool is a thin reader of kernel-provided data. We read the receipts ourselves.'
part: 'Part V — Power Tools'
written: true
---

htop looks authoritative. Colored bars, percentages, the works. But htop has no special
powers, no kernel modules, no secret channel — it's a text formatter reading the same
`/proc` files you met in Chapter 5. Every classic Linux debugging tool is that: a *pretty
reader* of data the kernel publishes. This chapter is about cutting out the middleman.

## The lie you were told

> "htop shows you the system."

htop shows you a rendering of `/proc/[pid]/stat` and friends. The kernel is the only source
of truth, and it publishes everything to files. If a tool can see it, so can you — that's
not a slogan, it's the design. **When something is broken, ask the kernel; it watched
everything happen.**

## The receipts, ranked by usefulness

### 1. strace — the single best debugging tool in Unix

Runs a program and prints every syscall it makes, live, with arguments and return values.
Chapter 2's `strace printf hello` was a party trick; in real life it answers:
*which file failed to open? which address refused to connect? why is this hanging?*
The hanging one:

```sh
strace -e trace=openat,connect,read python3 script.py   # watch it stall on syscall #47
```

If a program is stuck, it's stuck *in a syscall* — and strace shows you which.

### 2. /proc — the API that happens to be a directory

| File | What it tells you |
|------|-------------------|
| `/proc/[pid]/stat` | state, parent, CPU time — the source of every column in `top` |
| `/proc/[pid]/status` | human-readable: VmRSS, threads, UIDs (Ch 7, Ch 8) |
| `/proc/[pid]/fd/` | its open file descriptors (Ch 6) |
| `/proc/meminfo`, `/proc/loadavg`, `/proc/net/tcp` | machine-wide state |

### 3. perf — when CPU is actually burning

`perf top` samples where the instruction pointer is, thousands of times a second, and
attributes cycles to functions. It's the difference between "the server feels slow" and
"37% of cycles are in JSON unescaping". And it's reading kernel counters — receipts again.

## Prove it to yourself

**1. The census of a trivial command:**

```sh
strace -c ls >/dev/null        # ~30 syscalls for "list files". That's the price of living.
```

**2. `cat` is four syscalls in a trench coat:**

```sh
strace -e trace=openat,read,write cat /etc/hosts >/dev/null
```

**3. Compute CPU% yourself** — pick a busy process, then:

```sh
awk '{print "utime ticks:", $14}' /proc/<pid>/stat
# wait 10s, read again, divide the delta by (10 × clock ticks/sec = 1000)
```

Congratulations — you are now `top`, hand-cranked. Every percentage it shows is this
arithmetic with nicer fonts.

## The build: a working mini-top in ~50 lines

Reads the same files htop reads, sorts by CPU time, prints a table. No libraries:

```c
// minitop.c — gcc -o minitop minitop.c && ./minitop
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>

struct proc { int pid; long utime; char comm[64]; };

int main(void) {
    struct proc procs[1024];
    int n = 0;

    DIR *d = opendir("/proc");
    struct dirent *e;
    while ((e = readdir(d)) && n < 1024) {
        if (e->d_name[0] < '0' || e->d_name[0] > '9') continue;   // PIDs only
        char path[128];
        snprintf(path, sizeof(path), "/proc/%s/stat", e->d_name);
        FILE *f = fopen(path, "r");
        if (!f) continue;                       // process died — that's fine, they do

        char buf[1024];
        if (!fgets(buf, sizeof(buf), f)) { fclose(f); continue; }
        fclose(f);

        struct proc *p = &procs[n];
        char *after = strrchr(buf, ')');        // comm can contain spaces — parse past it
        sscanf(buf, "%d (%63[^)]", &p->pid, p->comm);
        // stat field 14 is utime (CPU ticks); skip 10 fields between ')' +2 and it
        sscanf(after + 2, "%*c %*d %*d %*d %*d %*d %*u %*u %*u %*u %*u %lu", &p->utime);
        n++;
    }
    closedir(d);

    for (int i = 1; i < n; i++) {               // sort by utime, biggest first
        struct proc key = procs[i];
        int j = i - 1;
        while (j >= 0 && procs[j].utime < key.utime) { procs[j + 1] = procs[j]; j--; }
        procs[j + 1] = key;
    }

    printf("%-8s %-10s %s\n", "PID", "CPU-TICKS", "NAME");
    for (int i = 0; i < n && i < 10; i++)
        printf("%-8d %-10ld %s\n", procs[i].pid, procs[i].utime, procs[i].comm);
    return 0;
}
```

Run it, then run `top` — same names at the top, because you're reading the same receipts.
Refresh in a loop (`watch -n1 ./minitop`) and you've replicated the htop experience,
ownership included.

## What you now know

- Every classic tool is a **reader of kernel-published data**; the kernel is the source of truth.
- **strace** is the sharpest instrument you own: if a program is stuck, it's stuck in a syscall.
- `/proc` is the raw API; `top`'s percentages are arithmetic you can do yourself.
- You built your own `top`. Observability is not a product category — it's a habit of asking the kernel.

Next, the finale: everything you've learned — processes, fds, namespaces of the mind,
memory, capabilities — aims at one act. **You build a container.**
