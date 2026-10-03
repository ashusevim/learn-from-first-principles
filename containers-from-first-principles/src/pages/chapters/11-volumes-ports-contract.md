---
layout: ../../layouts/Chapter.astro
title: 'Volumes, Ports & the Filesystem Contract'
description: 'Writable layers die with the container; volumes outlive them. Build: prove it — write to both, kill the container, check.'
part: 'Part III — The Ecosystem'
written: true
---

One userland mystery remains, and it bites everyone exactly once: *where do my writes
go, and what dies when the container dies?* The answer is a two-part filesystem
contract built from Chapter 6's overlayfs: **image layers are read-only and shared;
each container's writable layer is private and ephemeral; volumes are just bind mounts
that outlive everything.** This chapter proves all three clauses, then reads the
diagnostics (`docker system df`) like the kernel receipts they are.

## The lie you were told

> "Volumes and container storage are interchangeable."

Three storage classes, three lifetimes:

```text
image layers      read-only, content-addressed, SHARED by every container (Ch 6)
writable layer    one per container, PRIVATE, dies with `docker rm`   ← where writes go
volume/bind mount a host directory mounted INTO the container, survives everything
```

The contract, mechanically: writes to `/usr/...` land in the container's **upperdir**
(Ch 6's copy-up) — deleted with the container, because the upperdir is deleted.
Volumes are `mount(MS_BIND)` (Chapter 3!) of a host path into the namespace — the
container holds a *window* to storage that lives outside the overlay entirely.

## Why "state in the container" is a trap

```text
database writes to /var/lib/postgres (in the writable layer):
  - container rm → upperdir deleted → your data is GONE (image layers untouched!)
  - container commit → the data is baked INTO a new image layer (frozen forever)
  - two containers "sharing" the layer? impossible — uppers are private by design
volume mount at /var/lib/postgres:
  - data lives on the host (or a network volume) → containers are cattle, data is not
```

This is the entire cultural argument for "containers are disposable": the filesystem
contract makes the writable layer *designed to die*, and forces state into volumes —
which is also what makes orchestration (K8s: reschedule anywhere) possible.

## Prove it to yourself

**1. The three lifetimes, in one experiment:**

```sh
docker run -d --name contract -v contractvol:/data alpine sleep 300
docker exec contract sh -c 'echo layer-data > /tmp/in-layer.txt; \
                            echo vol-data   > /data/in-volume.txt'
docker rm -f contract                                  # kill it
docker run --rm -v contractvol:/data alpine cat /data/in-volume.txt
# vol-data — the volume survived the container's death
docker run --rm alpine cat /tmp/in-layer.txt 2>&1 | tail -1
# cat: can't open — the writable layer died with `contract`. Clause proven.
```

**2. See the writable layer as a directory:**

```sh
docker inspect contract2 --format '{{json .GraphDriver.Data.UpperDir}}'
sudo ls $(docker inspect --format '{{.GraphDriver.Data.UpperDir}}' contract2)
# your container's private writes, sitting in a host directory (Chapter 6's upperdir)
```

**3. The sharing, measured** — ten alpines, one disk:

```sh
docker system df            # "Shared Layers" accounting: 10 containers, ~5MB each
docker images -s alpine     # per-image layer sizes: unique vs shared bytes
```

## The build: the whole contract, staged

```sh
#!/bin/sh
# contract.sh — image layers vs writable layer vs volume: lifetimes proven
set -e
docker rm -f lab 2>/dev/null || true; docker volume rm labvol 2>/dev/null || true

# the image carries a baked-in file (frozen at build time — read-only layer):
docker build -t labimg - <<'EOF'
FROM alpine
RUN echo "baked at build" > /etc/baked.txt
EOF

docker run -d --name lab -v labvol:/data alpine sleep 300
docker exec lab sh -c 'echo baked-but-readable && cat /etc/baked.txt > /dev/null
                       echo "writable-layer write" > /tmp/ephemeral.txt
                       echo "volume write"         > /data/persistent.txt'

UPPER=$(docker inspect lab --format '{{.GraphDriver.Data.UpperDir}}')
echo "── the container's private writes, on the HOST (Ch 6's upperdir):"
sudo ls $UPPER/tmp; sudo cat $UPPER/ephemeral.txt

docker rm -f lab >/dev/null            # the death clause
docker volume rm labvol 2>/dev/null || true   # (survives rm -f of the container anyway)
docker run --rm -v labvol:/data alpine cat /data/persistent.txt   # volume: SURVIVED
docker run --rm labimg cat /etc/baked.txt                         # image layer: eternal
# ...and /tmp/ephemeral.txt is nowhere in the universe. Contract enforced by the kernel.
```

Three file writes, three fates — all traceable to Chapter 3's bind mounts and Chapter
6's overlay. There is no fourth fate; any "where did my data go" incident is now a
two-minute diagnosis.

## What you now know

- Three storage classes, three lifetimes: **image layers** (read-only, shared, eternal),
  **writable layer** (private, dies with the container), **volumes** (bind mounts,
  outlive everything).
- The writable layer is Chapter 6's upperdir — visible as a host directory; the volume
  is Chapter 3's bind mount — a window to host storage.
- `docker commit` freezes a writable layer into an image (the "pet container" antipattern
  — you now see exactly what it does and why teams ban it).
- The disposable-container culture is the contract's conclusion: state must live in
  volumes because uppers are designed to die.

Next, the finale: Chapters 2–11's pillars assembled into your own container runtime in
~200 lines — namespaces, cgroups, overlayfs, rootfs, and an exec. Docker's obituary,
written by your own main().
