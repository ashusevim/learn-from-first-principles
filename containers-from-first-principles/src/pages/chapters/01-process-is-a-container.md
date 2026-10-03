---
layout: ../../layouts/Chapter.astro
title: 'A Process Is a Container That Isn’t'
description: 'No virtualization, no VM: a container is an ordinary process shown a smaller world. Build: unshare a shell and watch lsns prove it.'
part: 'Part I — The Kernel Foundation'
written: true
---

The Linux course's finale (Chapter 14) built a container in ~70 lines of C. This course
takes that thread and grows it into the entire ecosystem — Docker, images, networking,
Kubernetes' feet of clay. Chapter one resets the deepest misconception first: a
container is not a small machine. **It's an ordinary process** — one of `ps`'s rows —
that the kernel shows a smaller world than yours. Prove it in the first ten minutes,
with zero code.

## The lie you were told

> "Containers are lightweight virtual machines."

A VM fakes hardware and runs its own kernel — the hypervisor is the boundary. A
container has **no kernel of its own, no fake hardware, no hypervisor**: it's your
kernel running one more process, with three features engaged:

| Feature | What it does | Linux course tie-in |
|---|---|---|
| **Namespaces** | private *views*: own PIDs, mounts, network, hostname | Ch 5's "everything is a file" windows |
| **cgroups** | private *budgets*: memory, CPU, IO caps | Ch 7's memory accounting |
| **overlayfs** | private *filesystem*: image layers stacked | Ch 5's VFS trick |

<figure class="diagram">
<svg viewBox="0 0 860 150" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arrc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#8b949e" stroke-width="1.5"/></marker></defs>
  <g font-family="ui-monospace,monospace" font-size="12">
    <rect x="20"  y="20" width="185" height="56" rx="9" fill="#161b22" stroke="#2d333b"/><text x="112" y="43" text-anchor="middle" fill="#e8b15c" font-weight="bold">namespaces</text><text x="112" y="60" text-anchor="middle" fill="#8b949e" font-size="10">private views: PID, mount, net</text>
    <rect x="225" y="20" width="185" height="56" rx="9" fill="#161b22" stroke="#2d333b"/><text x="317" y="43" text-anchor="middle" fill="#e8b15c" font-weight="bold">cgroups</text><text x="317" y="60" text-anchor="middle" fill="#8b949e" font-size="10">private budgets: RAM, CPU</text>
    <rect x="430" y="20" width="185" height="56" rx="9" fill="#161b22" stroke="#2d333b"/><text x="522" y="43" text-anchor="middle" fill="#e8b15c" font-weight="bold">overlayfs</text><text x="522" y="60" text-anchor="middle" fill="#8b949e" font-size="10">layers: image + writable</text>
    <rect x="635" y="20" width="185" height="56" rx="9" fill="#161b22" stroke="#2d333b"/><text x="727" y="43" text-anchor="middle" fill="#e8b15c" font-weight="bold">rootfs</text><text x="727" y="60" text-anchor="middle" fill="#8b949e" font-size="10">a tarball of a directory tree</text>
    <line x1="112" y1="76" x2="380" y2="112" stroke="#8b949e" stroke-width="1.2" marker-end="url(#arrc)"/>
    <line x1="317" y1="76" x2="410" y2="112" stroke="#8b949e" stroke-width="1.2" marker-end="url(#arrc)"/>
    <line x1="522" y1="76" x2="470" y2="112" stroke="#8b949e" stroke-width="1.2" marker-end="url(#arrc)"/>
    <line x1="727" y1="76" x2="500" y2="112" stroke="#8b949e" stroke-width="1.2" marker-end="url(#arrc)"/>
    <rect x="330" y="112" width="220" height="30" rx="9" fill="#1c2a20" stroke="#7ee2a8"/><text x="440" y="132" text-anchor="middle" fill="#7ee2a8" font-weight="bold">= one ordinary process</text>
  </g>
</svg>
<figcaption>Fig 1 — The four pillars: three kernel features + a tarball, composing into a container.</figcaption>
</figure>


Isolation without virtualization. A container's `uname -r` is *your* kernel's version —
check it in any container you run; that single fact distinguishes the whole technology
from VMs.

## The demonstration: two commands

`unshare` asks the kernel for new namespaces and runs a program inside them. `lsns`
lists every namespace on the machine — and your browser and SSH daemon live in some too:

```sh
sudo unshare --pid --fork --mount-proc bash     # new PID namespace, new /proc
ps -ef                                           # PID 1 = bash. The universe shrunk.
exit
lsns | head                                      # the host's namespace inventory:
# NS TYPE   NPROCS PID USER  COMMAND
# ...pid   143    1   root  /sbin/init                ← your boot's namespace
# ...pid   2      ... browser, sshd — namespaces everywhere, always
```

The default namespace you've lived in all along is just the first one. Namespaces aren't
container technology bolted onto Linux; they're how Linux was always structured, and
containers are what you get when you hand them to userland.

## What isolation does and doesn't mean

Inside that `unshare` shell:

- **Isolated**: process list (can't see or signal your other processes), later: mounts,
  network, hostname.
- **NOT isolated**: the kernel itself, the hardware, the *physical RAM and CPU*, and
  the kernel's attack surface. A container escaping to the kernel escapes to everything —
  which is why kernel bugs are container bugs, and why VMs still exist for hostile
  multi-tenancy.

And one subtlety with teeth: a process in a new PID namespace sees itself as PID 1 —
and **PID 1 has reaping duties** (Linux course, Chapter 3): adopt orphans, collect
zombies, never die. Your container's main process *is* PID 1, whether it knows how to
be or not. The `--init` flag you've always ignored on `docker run` exists precisely to
volunteer a proper reaper.

## Prove it to yourself

**1. The kernel is shared — same version, same vmstat:**

```sh
uname -r                          # on the host
sudo unshare --pid --fork bash -c "uname -r; cat /proc/loadavg"
# identical kernel string. A VM would print its own. This is the whole distinction.
```

**2. Process isolation, felt:**

```sh
sudo unshare --pid --fork --mount-proc bash -c "ps -ef | wc -l; sleep 300" &
sleep 1; ps -ef | grep "sleep 300" | grep -v grep
# the HOST sees the container's sleep process — but inside the container,
# `ps` cannot see the host's. Isolation is one-directional. That asymmetry is design.
```

**3. Your browser is already namespaced** (snap/flatpak/Chrome sandboxes use the same
kernel features):

```sh
lsns -t pid | wc -l       # count the PID namespaces on "your" machine. It was never just one.
```

## The build: the world's smallest container

The Linux course's Chapter 14 built a full runtime in C. Here's the four-command shell
version — every subsequent chapter replaces one command with understanding:

```sh
#!/bin/sh
# smallest-container.sh — a shell in a smaller world, with the four pillars named
sudo unshare --pid --fork --mount-proc \        # 1. PID namespace (Ch 2)
  sh -c '
    hostname container-one                      # 2. UTS namespace: private hostname
    mount -t proc proc /proc                    #    (fresh /proc for the new PIDs)
    echo "I am PID $$ in my own universe:"
    ps -ef
    exec sh                                     # 3-4 (mounts, network) come next chapter
  '
```

Inside: a private process tree, a private hostname, a fresh `/proc`. Outside: `ps -ef`
on the host sees the whole thing — because it *is* host processes, top to bottom. Four
chapters from now, you'll run a shell inside a filesystem and network you built; twelve
chapters from now, in a runtime you wrote.

## What you now know

- Containers = **namespaces + cgroups + overlayfs** around a normal process — no VM, no
  second kernel (`uname -r` proves it).
- Namespaces are ordinary Linux structure — your init, browser, and snap packages live
  in them already.
- PID 1's reaping duties follow your container's main process; `--init` volunteers a pro.
- Isolation is one-directional (host always sees in), and the kernel remains shared —
  the security boundary is the kernel, not the container.

Next: the first pillar in full — PID namespaces, and what it means for *your process*
to be PID 1 with nobody above it.
