---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Linux on One Page'
description: 'Boot, syscalls, processes, files and containers on one page — the model, the commands, and the traps with their chapters.'
part: 'Part VI — Practice & Reference'
written: true
---

Fourteen chapters, one machine: **everything is a process making syscalls, and
everything the kernel owns shows up as a file**. The boot that built the stage,
the interfaces that run the play, and the traps each earned a chapter exposing.

## The one-page model

```text
  firmware → bootloader → kernel → initramfs → PID 1 → services → your shell
     Ch 1         Ch 1       Ch 2       Ch 1       Ch 10     Ch 10      Ch 4
  your shell → fork/exec → fds → VFS → pages → sockets → namespaces+cgroups
     Ch 4       Ch 3      Ch 6    Ch 5    Ch 7      Ch 11       Ch 14
```

A process is a program with a PID (Chapter 3); a file descriptor is a capability
to a kernel object (Chapter 6); memory is a per-process illusion maintained by
page tables (Chapter 7); a container is that same process with a smaller world
(Chapter 14). Learn those four sentences and the commands below are just
spellings.

## The Linux you actually use

| Command | What it shows | Chapter |
|---|---|---|
| `strace -e trace=%process,%net <cmd>` | the syscalls — the only door to the kernel | 2 |
| `ps -ef --forest` / `pstree` | who forked whom, alive right now | 3 |
| `kill -l` / `kill -TERM <pid>` | signals: the kernel's tap on the shoulder | 3 |
| `ls -l /proc/<pid>/fd` | the process's open capabilities | 6 |
| `ls /proc` / `cat /proc/<pid>/status` | the kernel, exposed as text files | 5, 13 |
| `free -h` / `/proc/meminfo` | pages, cache, swap — memory's public ledger | 7 |
| `id` / `ls -l` / `sudo -l` | UIDs, bits, and what you may become | 8 |
| `ldd <binary>` / `LD_LIBRARY_PATH` | what `execve` loads before `main` | 9 |
| `systemctl status` / `journalctl -u` | units, dependencies, and their logs | 10 |
| `ip addr` / `ip route` / `ss -tlnp` | interfaces, routes, and listening sockets | 11 |
| `apt` / `pacman -Qi` | who put these binaries here, and why updated | 12 |
| `top` / `perf top` | receipts: CPU time, charged per process | 13 |
| `unshare --pid --fork --mount-proc bash` | a PID namespace in one line — try it now | 14 |
| `gcc -o my-container my-container.c` | the finale: ~70 lines, no Docker in sight | 14 |


## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| `kill -9` as a first resort | no cleanup runs; the receipts (Ch 13) go unwritten | Chapters 3, 13 |
| Redirecting with `>` inside a pipeline | each stage has its own fds — the file lands elsewhere | Chapter 6 |
| `chmod 777` "to make it work" | the bits were right; the UID was wrong — now everyone is root-adjacent | Chapter 8 |
| `LD_LIBRARY_PATH` exported globally | every binary now resolves differently; upgrades detonate | Chapter 9 |
| `systemctl restart` without reading the unit | the dependency that failed starts failing again, faster | Chapter 10 |
| Debugging the app before `ss -tlnp` | the port was never listening — the bug is deployment | Chapters 11, 13 |
| `rm -rf` in the wrong namespace | namespaces hide processes, not files — the host bites | Chapters 5, 14 |
| Trusting `free`'s first number | cache is not used; the OOM killer reads the rest | Chapters 7, 13 |
| Static binaries "for simplicity" | no shared libc: every CVE needs a rebuild of everything | Chapters 9, 12 |
| Containers as "light VMs" | no second kernel — a kernel bug escapes to the host | Chapter 14 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| See what a program did | `strace` first, logs second, guesses never | it is too fast to trace — sample with `perf` (Ch 13) |
| Run it again | a shell function; run it forever: a unit | it must survive reboot — enable the unit (Ch 10) |
| Share with another user | groups + bits, least privilege | it needs one root power — a capability, not setuid (Ch 8) |
| Isolate a process | namespaces + cgroups, the Chapter 14 recipe | hostile tenants — a VM, which has its own kernel (Ch 14) |
| Install software | the distro packages, pinned and signed | it isn't packaged — a static binary, knowingly (Ch 12) |
| Debug "slow" | `top`, then `/proc`, then `perf` — receipts in order | it is the network — `ss` and the route table first (Ch 11) |

## Prove it to yourself

**1. The shell is syscalls:**

```sh
strace -f -e trace=process,desc echo hi 2>&1 | grep -E 'clone|execve|dup|write'
```

`clone`, `execve`, `dup2`, `write` — Chapter 4's REPL, itemized by the kernel.

**2. Everything is a file, including lies:**

```sh
cat /proc/$$/status | head -3     # your shell, as text
ls -l /proc/$$/fd                 # its capabilities, as symlinks
echo $$ > /tmp/me && cat /tmp/me  # and yours, as a file you made
```

**3. The container is a process:**

```sh
sudo unshare --pid --fork --mount-proc bash
echo $$                            # 1 — a new universe with you as init
ps -ef                             # two lines: the whole world
exit
```

## What you now know

- **Boot is a relay** (firmware → kernel → PID 1 → units), and every slow boot
  is one slow baton-pass you can now name (Ch 1, 10).
- **Processes, files, memory, users** are four views of one kernel — fds for
  access, pages for memory, UIDs for permission (Ch 3, 6, 7, 8).
- **The kernel keeps receipts** for everything: `/proc`, `strace`, `perf` are
  readers, not magic — reach for them before theories (Ch 13).
- **Containers are configuration**, not virtualization: three kernel features
  plus excellent UX (Ch 14).

Next: sixteen labs from `fork()` to a working container — the whole course as
muscle memory, ending where Docker began.
