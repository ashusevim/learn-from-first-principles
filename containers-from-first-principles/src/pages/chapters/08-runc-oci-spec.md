---
layout: ../../layouts/Chapter.astro
title: 'runc: Reading the Real Spec'
description: 'The OCI runtime spec is a JSON file describing namespaces, cgroups, and mounts. Build: run runc on your Chapter 7 rootfs.'
part: 'Part II — The Runtime'
written: true
---

Chapters 2–7 built containers from raw kernel primitives — but every pillar was
hand-typed: `unshare` flags, `echo 20M > memory.max`, mount commands. Industry needed
those steps *serialized* so any tool could reproduce them. The answer is the **OCI
runtime spec**: a single JSON file describing namespaces, cgroups, mounts, and the
command — and **runc**, the reference program that reads it and performs *exactly your
Chapters 2–5 moves*. This chapter reads the spec and runs runc on your own rootfs.

## The lie you were told

> "runc is mysterious low-level plumbing."

Read its input. The OCI spec is JSON:

```json
{
  "root": { "path": "rootfs", "readonly": true },
  "process": {
    "args": ["/bin/sh"],
    "user": { "uid": 0 },
    "capabilities": ["CAP_NET_BIND_SERVICE"]
  },
  "linux": {
    "namespaces": [
      { "type": "pid" }, { "type": "network" },
      { "type": "mount" }, { "type": "uts" }, { "type": "ipc" }
    ],
    "resources": {
      "memory": { "limit": 52428800 },
      "cpu":    { "quota": 50000, "period": 100000 }
    }
  },
  "mounts": [
    { "destination": "/proc", "type": "proc", "source": "proc" },
    { "destination": "/tmp",  "type": "tmpfs", "source": "tmpfs" }
  ]
}
```

Every field maps to a chapter you've *built by hand*: `namespaces` → your `unshare`
flags (Ch 2–4); `resources` → your `memory.max`/`cpu.max` echoes (Ch 5); `mounts` →
your mount commands (Ch 3); `root.path` → your rootfs (Ch 7); `process.args` → your
`exec`. **runc is your Chapters 2–7 script, compiled, hardened, and given a JSON
driver.** That's the entire mystery, gone.

## The contract that made an ecosystem

Before OCI (2015), Docker's internals were the runtime — tools couldn't run "Docker
containers". The spec splits the stack at a clean seam:

```text
docker / podman / nerdctl / k8s kubelet     ← high-level tools (your UI)
        │  speaks the OCI runtime spec
        ▼
      runc (or crun, kata, gVisor...)        ← THE runtime: JSON → your chapters 2–7
        │  syscalls
        ▼
      Linux kernel
```

Any spec-conforming tool can run any spec-conforming image through any
spec-conforming runtime. That seam is why `podman run` and `kubectl` and `nerdctl` all
work — they're different JSON *producers* over the same JSON *executor*.

## Prove it to yourself

**1. Read a running container's spec** (Docker keeps one per live container):

```sh
docker run -d --name specprobe --memory=64m alpine sleep 300
find /var/run/docker -name config.json 2>/dev/null | head -1
# or via containerd: crictl inspect / ctr task ...
python3 -m json.tool <path> | grep -A3 namespaces
# your unshare flags, in JSON. Docker was translating your English flags into THIS file.
```

**2. The capabilities field explains `--cap-add`** (Linux course, Chapter 8: root's
~40 discrete powers): Docker's default cap set is visible right there as an array —
and `--privileged` is "include ALL of them plus /dev". The security knob was a JSON
array all along.

## The build: run runc on your own rootfs

```sh
#!/bin/sh
# runc.sh — the OCI way to boot the Chapter 7 busybox rootfs
set -e
# 1. the layout runc demands: bundle/ = config.json + rootfs/
mkdir -p bundle/rootfs
cp -a /path/to/rootfs/* bundle/rootfs/          # your Ch 7 busybox tree

# 2. the spec — every field is a chapter you already did by hand:
cat > bundle/config.json <<'EOF'
{
  "ociVersion": "1.0.2",
  "root": { "path": "rootfs", "readonly": false },
  "hostname": "runc-box",
  "process": {
    "terminal": false,
    "user": { "uid": 0, "gid": 0 },
    "args": ["/bin/sh"],
    "env": ["PATH=/bin"]
  },
  "linux": {
    "namespaces": [
      { "type": "pid" },
      { "type": "mount" },
      { "type": "uts" },
      { "type": "network" }
    ],
    "resources": {
      "memory": { "limit": 33554432 },
      "pids": { "limit": 32 }
    }
  },
  "mounts": [
    { "destination": "/proc", "type": "proc", "source": "proc" },
    { "destination": "/dev",  "type": "tmpfs", "source": "tmpfs" }
  ]
}
EOF

cd bundle
sudo runc run mybox          # → a shell in a container you specified in JSON
                             # (runc performs: unshare ×4, pivot_root, mounts,
                             #  cgroup writes, cap drop — your chapters 2–7, executed)
```

Inside, confirm the pillars: `ps` (PID ns — Ch 2), `hostname` (UTS — Ch 1), `mount`
(the two mounts — Ch 3), and from outside: `cat /sys/fs/cgroup/.../memory.max` (Ch 5).
One JSON file drove all of it. That's the OCI runtime spec: **your course, serialized**.

## What you now know

- The OCI spec = **your Chapters 2–7 moves in JSON**: namespaces, resources, mounts,
  root, args. runc executes it — the reference implementation of your own shell script.
- The spec seam **created the ecosystem**: Docker/podman/k8s produce JSON; runc/crun/
  gVisor consume it; images work across all of them.
- Docker's security knobs (`--cap-add`, `--privileged`) are arrays in that JSON —
  Chapter 8 of the Linux course, enumerated.
- You can now read any container's live config.json and know precisely what world it
  was shown.

Next: runc runs *one* container — but `docker run` spawns a small *zoo* of processes.
Time to name every one of them: the shim, containerd, and why your containers survive
daemon restarts.
