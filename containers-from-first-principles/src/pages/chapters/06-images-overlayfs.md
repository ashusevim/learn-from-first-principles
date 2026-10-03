---
layout: ../../layouts/Chapter.astro
title: 'Images & overlayfs: Layers That Stack'
description: 'Why images are small and pulls are incremental: read-only layers + one writable layer. Build: an overlayfs mount, inspected live.'
part: 'Part II — The Runtime'
written: true
---

Four pillars of isolation done — but what *goes in* the container? An **image**: and
here's the design that makes Docker economically possible. Images aren't full disk
copies; they're **stacks of layer diffs** merged by the kernel's overlayfs — read-only
below, one writable layer on top. Ten containers from one image share every byte of it.
This chapter mounts overlayfs by hand and catches the copy-up trick in the act.

## The lie you were told

> "Each container has a full copy of the image's filesystem."

Each container gets an **overlay** — three ingredients:

```text
lowerdir  = the image's read-only layers (shared by EVERY container of that image)
upperdir  = THIS container's private writable layer
merged    = what the process sees (one seamless filesystem)

write to merged:
  - file exists in lower?  → COPY-UP: the whole file is copied to upper, then edited
  - file only in upper?    → just written there
  - delete a lower file?   → a WHITEOUT entry in upper (lower is read-only, untouched)
```

Lower layers are **content-addressed tar diffs** (the Git course, Chapter 1: same
hashing idea — a layer is "diff against the previous layer", shared when identical).
`docker pull` fetches only missing layers; ten containers of the same image = one copy
of the layers, ten tiny uppers.

## Why layers, really

Two payoffs, both from immutability:

1. **Sharing**: 50 MB base layer + 200 MB app layer, ten containers → 250 MB on disk,
   not 2.5 GB.
2. **Incremental everything**: builds cache per layer (`RUN` steps), pulls fetch only
   missing diffs, deploys ship megabytes instead of gigabytes.

The cost: layers are *dumb diffs*. A 100 MB file changed in a later layer makes the
image carry **both** copies (there's no delta compression within a layer — Chapter 5 of
the Git course would help, but images don't use packfiles). "Why is my image 2 GB?"
usually: a big file modified across layers. Flatten or multi-stage.

## Prove it to yourself

**1. See a real container's overlay, live:**

```sh
docker run -d --name probe alpine sleep 300 2>/dev/null || true
mount | grep overlay | head -1
# overlay on / ... lowerdir=/var/lib/docker/overlay2/l/ABC:l/DEF,
#              upperdir=/var/lib/docker/overlay2/l/GHI, workdir=.../JKL
# (lowerdir lists EVERY image layer, colon-separated, top-first)
```

**2. The copy-up, caught in the act** — the build below demonstrates it; on real
Docker, `stat` a file inside the container, modify it, and `stat` the upperdir's copy
outside: same inode story, the file physically moved to the container's private layer.

**3. Whiteouts** — delete a file that exists in a lower layer, then look at the upper
dir: a character-device "whiteout" marker replaced it. Deletion in overlay-land is a
*marker*, not a removal — which is also why `rm` in a Dockerfile doesn't shrink the
image (the lower layer's bytes are still there!).

## The build: overlayfs by hand

```sh
#!/bin/sh
# overlay.sh — lower + upper + workdir → merged, with copy-up and whiteout on camera
set -e
cd /tmp && rm -rf ovl && mkdir -p ovl/{lower,upper,work,merged}

# lower layer: an "image" with two files
echo "base config v1"      > ovl/lower/app.conf
echo "base library"        > ovl/lower/lib.so

# MOUNT: the kernel merges them — nothing is copied
sudo mount -t overlay overlay \
  -o lowerdir=/tmp/ovl/lower,upperdir=/tmp/ovl/upper,workdir=/tmp/ovl/work \
  /tmp/ovl/merged

echo "--- merged view:"; ls ovl/merged; cat ovl/merged/app.conf

# WRITE an existing (lower) file → COPY-UP:
echo "container edits config" > ovl/merged/app.conf
echo "--- upperdir after edit:"; ls ovl/upper      # app.conf APPEARED here (copied up!)
cat ovl/upper/app.conf
echo "--- lowerdir untouched:"; cat ovl/lower/app.conf   # still v1 — image layers are read-only

# DELETE a lower file → whiteout marker:
rm ovl/merged/lib.so
echo "--- upperdir after delete:"; ls -a ovl/upper # lib.so gone; a whiteout char device
                                                   # (see it: ls -la ovl/upper)

# a NEW file lands directly in upper:
echo "new" > ovl/merged/extra.txt; ls ovl/upper

sudo umount /tmp/ovl/merged
```

Read the after-states carefully: the lower directory (the "image") never changed; the
upper (the "container") holds exactly the edits, copies, and whiteouts. Every
"container state" question is now answerable by looking in `upperdir`.

## What you now know

- An image = **stacked read-only layer diffs**; a container = those + one private
  **upper**; the kernel's overlayfs merges them at mount.
- Edits trigger **copy-up** (the whole file moves to upper); deletes are **whiteouts**
  — which is why `rm` in a Dockerfile never shrinks anything.
- Sharing and incremental pulls fall out of layer immutability — Git's content model
  (Chapter 1, Git course) applied to filesystems.
- `mount | grep overlay` on any Docker host is this chapter's exact command line.

Next: overlay layers need *contents* — and the contents are humbling: a filesystem
whose entire OS is one static binary. The rootfs.
