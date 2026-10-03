---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Containers on One Page'
description: 'Namespaces, cgroups, overlayfs and OCI on one page — the four kernel features, the syscalls, and the traps in the runtime.'
part: 'Part IV — Practice & Reference'
written: true
---

You built every pillar by hand — namespaces, cgroups, overlayfs, a rootfs — and compiled them into your own runtime (Chapter 12). This page is the 60-second index for the whole course: the mental model, the commands you will actually type, the traps, and the chapter that explains each one. Use it two ways: skim it before a debug session, and follow the chapter number whenever a row surprises you. Nothing here is new — it is the course, compressed.

## The one-page model

```text
namespaces   private VIEWS       unshare(CLONE_NEW*) / lsns        (Ch 2–4)
cgroups      private BUDGETS     echo 100M > memory.max            (Ch 5)
overlayfs    private ROOT STACK  mount -t overlay lower/upper      (Ch 6)
rootfs       a tarred DIRECTORY  busybox + your binary, pivot_root (Ch 7)
        │
        ▼
  ONE ordinary process, run by YOUR kernel — no VM, no second kernel (Ch 1)
```

A container is **four kernel features pointed at one normal process**. Namespaces give it a smaller world (PID, mount, network, hostname); cgroups ration that world; overlayfs and a rootfs give it a filesystem. Docker adds registries, networking conveniences, and a small process zoo — never new isolation.

## The container primitives you actually use

| Primitive | What it does | Example |
|---|---|---|
| `unshare` | new namespaces for a child | `unshare --pid --fork --mount-proc bash` |
| `lsns` | list namespaces on the host | `lsns -t pid \| wc -l` |
| `mount(MS_BIND)` | window onto a host path | `mount --bind /host /rootfs/data` |
| `pivot_root` | swap which directory is `/` | `pivot_root . old` |
| `ip netns add` | a private network stack | `ip netns add red` |
| `ip link add … type veth` | a patch cable, two ends | `ip link add veth-red type veth peer name veth-blue` |
| `ip link add … type bridge` | the switch every cable plugs into | `ip link add br0 type bridge` |
| `nft … masquerade` | outbound NAT rewrite | `nft add rule nat postrouting ip saddr 172.30.0.0/24 masquerade` |
| `memory.max` | hard RAM ceiling (OOM) | `echo 20M > /sys/fs/cgroup/demo/memory.max` |
| `cpu.max` | CPU quota per window | `echo "50000 100000" > demo/cpu.max` |
| `cgroup.procs` | enroll a PID into the budget | `echo $PID > demo/cgroup.procs` |
| `mount -t overlay` | merge image layers | `mount -t overlay overlay -o lowerdir=L,upperdir=U,workdir=W merged` |
| `runc run` | execute an OCI spec | `sudo runc run mybox` |
| `docker inspect` | find a container's writable layer | `docker inspect c --format '{{.GraphDriver.Data.UpperDir}}'` |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| "A container is a lightweight VM" | The kernel is shared, so kernel bugs are container escapes — VMs still own hostile multi-tenancy | Chapter 1 |
| Zombies pile up; "the container leaks memory" | Its PID 1 never calls `wait()` — that is what `--init` volunteers a reaper for | Chapter 2 |
| A "private" mount appears on the host | Mounts propagate by default; the tree must be made `MS_PRIVATE` first | Chapter 3 |
| A fresh network namespace cannot `ping 127.0.0.1` | `lo` is DOWN until you `ip link set lo up` — a rite of passage | Chapter 4 |
| The container "restarts for no reason" | `memory.max` was crossed; the OOM killer, scoped to the cgroup, killed the fattest process | Chapter 5 |
| "Slow but idle" — CPU graphs read 50% | `cpu.max` throttles in windows; the receipt is `cpu.stat`'s `nr_throttled` | Chapter 5 |
| The image grew by 2 GB on a small edit | Layers are dumb diffs — both copies are carried; multi-stage or flatten | Chapter 6 |
| `rm` in a Dockerfile shrinks nothing | Deletion is a whiteout marker; the lower layer's bytes are still there | Chapter 6 |
| "No such file or directory" inside the container | A dynamic binary without its `ld.so` and `.so` files in the rootfs | Chapter 7 |
| Published port 8080 accepts nothing | `-p` is a DNAT rule to the container IP; check `nft list ruleset` | Chapter 10 |
| Data gone after `docker rm` | Writes landed in the writable layer, not a volume — designed to die | Chapter 11 |

## When to use what

| You need to… | Choose | Because |
|---|---|---|
| Isolate hostile tenants | a VM | containers share the kernel; kernel bugs escape to everything (Chapter 1) |
| A private process tree | PID namespace | inside, PID 1 is your process, with reaping duties (Chapter 2) |
| A private `/` | mount ns + `pivot_root` | a disk directory plus one syscall — no virtual disk (Chapter 3) |
| A private internet | network ns + veth | a dark machine until you wire it (Chapter 4) |
| RAM that cannot be exceeded | `memory.max` | crossing it triggers the OOM killer (Chapter 5) |
| CPU that cannot hog a core | `cpu.max` | it throttles in windows instead of killing (Chapter 5) |
| Shared image layers | overlayfs | read-only lowers plus one private upper (Chapter 6) |
| A tiny image | static binary / distroless | one file is a whole OS to the VFS (Chapter 7) |
| Reproducible boots | `runc` + `config.json` | Chapters 2–7, serialized (Chapter 8) |
| Containers that survive a `dockerd` restart | the shim | the durable parent under PID 1 (Chapter 9) |
| State that outlives the container | a volume | the writable layer is built to die (Chapter 11) |

## Prove it to yourself

**1. The kernel is shared:**

```sh
uname -r                                             # host
sudo unshare --pid --fork bash -c 'uname -r'         # identical string — no second kernel
```

A VM prints its own version; the container prints yours. That single line is the whole distinction.

**2. Copy-up, caught in the act:**

```sh
cd /tmp && rm -rf ovl && mkdir -p ovl/{lower,upper,work,merged}
echo v1 > ovl/lower/app.conf
sudo mount -t overlay overlay -o lowerdir=$PWD/ovl/lower,upperdir=$PWD/ovl/upper,workdir=$PWD/ovl/work ovl/merged
echo v2 > ovl/merged/app.conf      # edit a file that lives in the lower layer
ls ovl/upper                       # app.conf has APPEARED here — copied up whole
cat ovl/lower/app.conf             # still v1: image layers are read-only
sudo umount ovl/merged
```

**3. The OOM, on camera:**

```sh
mkdir -p /sys/fs/cgroup/demo && echo 20M > /sys/fs/cgroup/demo/memory.max
python3 -c "x = bytearray(100*1024*1024); input()" & echo $! > /sys/fs/cgroup/demo/cgroup.procs
sleep 2; dmesg | tail -3           # "Memory cgroup out of memory: Killed process …"
```

The host never flinched: the kill was scoped to the group.

## What you now know

- A container is **one ordinary process** plus namespaces, cgroups, overlayfs, and a rootfs — no VM (Chapter 1).
- The four pillars are **syscalls and files**: `unshare`, `mount`, `pivot_root`, and `echo` into cgroup files.
- Docker's flags are **translators** into those files; `runc` executes the JSON form of them (Chapter 8).
- Three storage lifetimes — image layers, writable layer, volumes — answer every "where did my data go" (Chapter 11).
- The runtime you wrote in Chapter 12 is the whole course; everything else is packaging.

Next: put the page down and do it — twelve labs on your own runtime, each checkable by you alone (Chapter 14).
