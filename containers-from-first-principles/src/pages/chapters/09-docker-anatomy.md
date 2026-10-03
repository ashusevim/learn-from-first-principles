---
layout: ../../layouts/Chapter.astro
title: 'Docker’s Anatomy: shim, containerd, daemon'
description: 'docker run is six processes in a trench coat. Build: trace them with ps/lsns while a container lives, and name each one’s job.'
part: 'Part III — The Ecosystem'
written: true
---

You've built every kernel feature a container needs (Chapters 2–5) and read the spec
that serializes them (Chapter 8). The last mystery is *organizational*: why does one
`docker run` produce a family of processes — dockerd, containerd, containerd-shim,
runc? This chapter traces the zoo live, names each animal's job, and answers the
question you never thought to ask: **why do containers survive a daemon restart?**

## The lie you were told

> "docker run talks to one daemon that manages everything."

The chain has four links, each existing for a reason:

```text
docker (CLI) ──REST──► dockerd ──gRPC──► containerd ──exec──► containerd-shim ──► runc
  your typing            images, API,     container LIFECYCLE   1 shim PER        runs the
  builds, volumes        networking       (start/stop/watch)    container;        OCI spec
                         (userland)       (userland)            SURVIVES everything
```

- **dockerd** — the API server: builds, volumes, networks, the `docker` command's
  brain. Userland glue.
- **containerd** — runs the *lifecycle* of containers, extracted from Docker so
  Kubernetes (and others) could use the same engine without Docker.
- **containerd-shim** — one per container; the container's actual parent process. It
  holds stdio pipes, watches exit status, and lets both dockerd and containerd restart
  without killing containers (Chapter 2's PID 1 needs a parent that won't vanish —
  the shim is that parent).
- **runc** — Chapter 8's spec executor. Runs once, configures namespaces/cgroups, execs
  your process, **exits**. Your container's parent becomes the shim, not runc.

## Why the split matters (the crash test)

If dockerd managed containers directly (early Docker!), every daemon upgrade or crash
would orphan every container. The shim isolates lifetimes:

```text
dockerd restart   → containers unaffected (shim keeps running, independent)
containerd restart→ containers unaffected (shim again)
kill the shim     → container keeps RUNNING but unmanaged (nobody holds stdio)
```

This layering is also Kubernetes' story: kubelet speaks to containerd directly — Docker
became optional in 2021 precisely because the shim/containerd seam existed.

## Prove it to yourself

**1. Name the animals, live:**

```sh
docker run -d --name zoo alpine sleep 300
ps -ef --forest | grep -A3 containerd
# containerd ── containerd-shim -namespace moby -id zoo ...
#                              └─ /bin/sleep 300     ← the "container": one process
```

**2. The namespace census** — Chapter 1's `lsns`, now with names attached:

```sh
lsns -t pid | grep -i 'sleep\|shim'
# the container's PID namespace, the shim watching it from the host side
```

**3. The crash test — daemon restart, containers live:**

```sh
docker run -d --name survivor alpine sleep 300
sudo systemctl restart docker          # (or: sudo kill dockerd; dockerd &)
docker ps | grep survivor              # STILL RUNNING — the shim held the line.
# (state "re-adopted" after restart; the container never died.)
```

## The build: a lifecycle trace

```sh
#!/bin/sh
# anatomy.sh — watch the whole chain assemble when one container starts
set -e
docker rm -f trace 2>/dev/null || true

# start a container in the background, then snapshot the process tree repeatedly:
docker run -d --name trace alpine sh -c 'sleep 5; echo done'
for i in 1 2 3; do
    echo "── t+$i ──"
    ps -ef --forest | grep -E 'dockerd|containerd|runc|shim|sleep 5' | grep -v grep | head -8
    sleep 1.5
done
# read the tree: dockerd (API) → containerd (lifecycle) → shim (per-container parent)
#   → [runc appears briefly during t+1, configures namespaces, EXITS]
#   → sleep 5 (your process, now the shim's child, PID 1 in its namespace — Ch 2!)

docker rm -f trace >/dev/null
echo "note: runc only appears for an instant — it builds the world, then leaves.
The shim is the constant: the container's durable parent (Ch 2's duties, delegated)."
```

Watch for the transience: **runc flashes for a fraction of a second** (it's a one-shot
world-builder), while the shim persists. When Chapter 12 assembles your own runtime,
your main() will be runc's job; a loop waiting on the child will be your shim.

## What you now know

- `docker run` = **dockerd (API) → containerd (lifecycle) → shim (per-container parent)
  → runc (one-shot world builder)**.
- The **shim** is why containers survive daemon restarts — and why it exists: PID 1
  needs a permanent parent (Chapter 2's duties need a guardian).
- Kubernetes runs on containerd directly — Docker-the-runtime became optional once the
  seam was standardized (Chapter 8's OCI).
- Your container is one process under a shim under a tree of managers — `ps --forest`
  names them all.

Next: the container runs but can't reach the internet — or can it? Container networking,
traced packet by packet: veth, docker0, and the NAT rule that `-p` secretly writes.
