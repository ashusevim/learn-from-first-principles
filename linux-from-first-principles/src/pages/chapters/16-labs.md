---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs from fork to containers — processes, file descriptors, namespaces, cgroups. Each is checkable by you alone.'
part: 'Part VI — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in kernel output you read yourself — PIDs,
fds, cgroup meters, a container shell that believes it is PID 1. Nothing here
is new: fork/exec (Ch 3), the shell (Ch 4), files (Ch 5), fds (Ch 6), memory
(Ch 7), users (Ch 8), services (Ch 10), receipts (Ch 13), containers (Ch 14).
What is new is doing it with your hands instead of your eyes.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. One terminal is enough; two (host + container) is better for
the last third.

| Tool | What it proves |
|---|---|
| `strace`, `/proc`, `lsns` | the kernel narrating itself |
| `minishell.py` (Ch 4) / `forkexec.go` | the course's own toys, extended |
| `my-container` (Ch 14, ~70 lines of C) | the finale, operated and modified |
| `dmesg`, `journalctl`, `systemctl` | the system's own receipts |

## Warm-ups

**Lab 1.1 — Fork and know it**
**Goal:** one process becomes two, and they can tell each other apart.
**Do this:**
```c
pid_t p = fork();
printf("%d: fork returned %d\n", getpid(), p);
```
**You'll know it works when:** two lines print — the child's `fork` returned
`0`, the parent's returned the child's PID. Same code, two futures: that return
value *is* Chapter 3.
**Where it comes from:** Chapter 3 — Processes: fork, exec, and the Zombie Apocalypse.

**Lab 1.2 — Raise a zombie**
**Goal:** the apocalypse of Chapter 3's title, on demand.
**Do this:** fork a child that exits immediately; parent `sleep(30)` without
`wait()`; in another shell run `ps aux | grep defunct`.
**You'll know it works when:** the child shows as `<defunct>` — dead but
unreaped, holding its exit code for a parent that never asks. Then add the
`wait()` and watch it vanish: reaping is parenting.
**Where it comes from:** Chapter 3.

**Lab 1.3 — Redirection is `dup2`**
**Goal:** `>` is a syscall, not shell magic (Chapter 6).
**Do this:** in `minishell.py`, implement `echo hi > /tmp/hi` with `dup2` (no
`subprocess` redirection flags), then `cat /tmp/hi`.
**You'll know it works when:** the file holds `hi` and the shell's own stdout
still works — the child's fd 1 moved, the parent's didn't. Every redirect you
will ever type is this call.
**Where it comes from:** Chapter 6 — File Descriptors, Redirection & Pipes.

## Builds

**Lab 2.1 — Pipe two toys together**
**Goal:** `|` is two forks plus one shared kernel buffer (Chapter 6).
**Do this:** extend `minishell.py` with a single pipe: `seq 3 | wc -l` must
print `3`, built from `pipe()` + two forks + `dup2` + `exec`.
**You'll know it works when:** `3` prints — and `strace -f` shows exactly one
`pipe`, two `clone`s, and the write end closed in the reader. The diagram from
Chapter 6, in syscalls.
**Where it comes from:** Chapter 6.

**Lab 2.2 — Read your own memory map**
**Goal:** virtual memory as a printed artifact (Chapter 7).
**Do this:**
```sh
cat /proc/$$/maps | head -8
python3 -c "x = bytearray(200*1024*1024); input()" &
cat /proc/$!/status | grep -E 'VmRSS|VmSize'
kill %1
```
**You'll know it works when:** the maps show distinct `r-xp` (code), `rw-p`
(heap/stack) regions — and VmRSS jumps ~200 MB while the code regions don't
move. The lie has an address for every part.
**Where it comes from:** Chapter 7 — Memory Is a Lie (And That's Good).

**Lab 2.3 — Become (almost) root**
**Goal:** UIDs are numbers; the kernel checks numbers (Chapter 8).
**Do this:**
```sh
id -u; sudo id -u
ls -l /usr/bin/sudo              # the setuid bit that makes the second work
sudo -l                          # what YOU may become, enumerated
```
**You'll know it works when:** the numbers differ, the `s` sits where `x`
would, and `sudo -l` lists your exact powers — no more, no less. Root is UID
0; everything else is policy.
**Where it comes from:** Chapter 8 — Users, Permissions & sudo.

**Lab 2.4 — Ship a service**
**Goal:** PID 1's world from the unit side (Chapter 10).
**Do this:** write a 6-line unit that runs your Lab 2.1 pipeline on a timer,
`systemctl --user start` it, and read its logs:
```sh
journalctl --user -u pipeline.service --no-pager | tail -5
```
**You'll know it works when:** the log shows `3`, timestamped, without you
running anything — the system ran it, supervised it, and kept the receipt.
**Where it comes from:** Chapter 10 — systemd & the Birth of Services.

**Lab 2.5 — Enter the container and prove it's a process**
**Goal:** the finale, operated: namespaces verified from both sides.
**Do this:**
```sh
sudo ./my-container /path/to/rootfs /bin/sh &
CPID=$!
lsns | grep $CPID                # the kernel lists its cages
sudo ls -l /proc/$CPID/ns | grep -E 'pid|mnt|uts'
cat /proc/$CPID/status | head -2 # still your kernel's child
fg; exit
```
**You'll know it works when:** its namespace inodes differ from your shell's,
yet `PPid` chains back to your terminal. A smaller world, same kernel — the
whole course in one process listing.
**Where it comes from:** Chapter 14 — Containers from Scratch.

## Stretch goals

**Lab 3.1 — Cap the container's memory**
**Goal:** cgroups meet containers: a budget the finale never set.
**Do this:** add a 50 MB `memory.max` to `my-container` (write the cgroup
before `exec`), then allocate 200 MB inside and watch from the host.
**You'll know it works when:** the OOM killer strikes *inside* the container
while the host never flinches — `dmesg` names the victim and its cgroup. Two
chapters, one corpse.
**Where it comes from:** Chapters 7 and 14.

**Lab 3.2 — Trace the whole finale**
**Goal:** `my-container` reduced to its syscalls — the course's greatest hits,
in order.
**Do this:**
```sh
sudo strace -f -e trace=%process,%network,desc ./my-container /path/to/rootfs /bin/true 2>&1 | grep -E 'unshare|pivot_root|clone|execve' | head -10
```
**You'll know it works when:** the four calls appear in order — unshare the
views, swap the root, fork the init, become the program. Every other line is
commentary; these four are the container.
**Where it comes from:** Chapters 2, 3, 5 and 14.

## Self-checking without a grader

- **Process labs** (1.1, 1.2, 2.1): PIDs, return values, `<defunct>` rows, the
  number `3`. Process state prints plainly — `ps` is the arbiter.
- **File/memory/user labs** (1.3, 2.2, 2.3): file contents, maps regions,
  UID numbers. Bytes and numbers, no interpretation needed.
- **System labs** (2.4, 2.5, 3.1, 3.2): journal lines, namespace inodes, OOM
  verdicts, syscall traces. The kernel writes the receipts; you only read them.

## What you now know

- **Every abstraction in this course is three syscalls deep:** the shell
  (fork/exec/dup2), the pipe (pipe/fork/dup2), the container (unshare/
  pivot_root/exec) — fluency is knowing which three.
- **The kernel is legible:** `/proc`, `strace`, `dmesg`, `journalctl` answer
  before theories (Lab 3.2 is the habit, automated).
- **Isolation is a list, not a product:** namespaces for views, cgroups for
  budgets, and everything else is UX you could now write.
- You operate the machine instead of using it: services supervised, memory
  mapped, containers budgeted.

Next: take the on-call runbook for any service you own and annotate each step
with its chapter — the page that has no annotation is the next thing to learn.
