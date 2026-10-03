# Containers from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that demystifies containers by building them from kernel features up
— namespaces, cgroups, overlayfs — until Docker and Kubernetes become userland around
things you fully own. The finale: your own container runtime in ~200 lines.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(siblings: [Linux](../linux-from-first-principles), [Networking](../networking-from-first-principles),
[Git](../git-from-first-principles), [Databases](../databases-from-first-principles),
[Concurrency](../concurrency-from-first-principles), [Distributed Systems](../distributed-systems-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — The Kernel Foundation**
1. A Process Is a Container That Isn't ✅
2. PID Namespaces: A Private Process Tree ✅
3. Mount Namespaces & pivot_root: A Private Filesystem ✅
4. Network Namespaces: A Private Internet ✅

**Part II — The Runtime**
5. cgroups: The Budget ✅
6. Images & overlayfs: Layers That Stack ✅
7. The rootfs: What's Actually in There ✅
8. runc: Reading the Real Spec ✅

**Part III — The Ecosystem**
9. Docker's Anatomy: shim, containerd, daemon ✅
10. Container Networking: veth, docker0, NAT ✅
11. Volumes, Ports & the Filesystem Contract ✅
12. Final Boss: Your Own Container Runtime ✅ *(~200 lines: namespaces + cgroups + pivot + exec)*

All 12 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a hand-driven PID namespace, a private mount table
(and the propagation-leak bug reproduced), docker0 rebuilt from veth pairs, an OOM
enforced by cgroup files, an overlayfs stack with copy-up and whiteouts caught in the
act, a one-binary rootfs, a live OCI config.json read, a daemon-restart crash test, a
container packet traced through NAT, the three storage lifetimes proven — and your own
container runtime.

## The rules of the course

1. **Start below the abstraction.** Before "docker run", answer "what does the kernel do?"
2. **Nothing is magic.** Namespaces, cgroups, layers — inspectable kernel objects.
3. **Build a toy version.** The finale: a working runtime in ~200 lines.
4. **Then the ecosystem is plumbing.** Docker/K8s = userland around things you own.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/pivotrun.go` (Chapters 2–3's namespaces + fork/exec skeleton).
