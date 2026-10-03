---
layout: ../../layouts/Chapter.astro
title: 'The rootfs: What’s Actually in There'
description: 'An image is a tarball of a filesystem — nothing more. Build: a minimal rootfs with busybox, booted by your own namespace code.'
part: 'Part II — The Runtime'
written: true
---

Chapters 2–5 built the isolation pillars; Chapter 6 built the layer stack. One question
left before assembly: what *is* an image, physically? The answer deflates everything:
**a rootfs — a plain directory tree** with `/bin`, `/lib`, your app, and not much else,
shipped as a tarball. Alpine Linux is 5 MB. This chapter builds a working rootfs in
five minutes from one static binary — and boots it with your Chapter 1–5 pillars.

## The lie you were told

> "Images contain an operating system."

They contain **files**. No kernel (Chapter 1: it's your host's), no boot sector, no
init system (usually), no device drivers. The inventory of the world's most popular
base image:

```text
alpine:3.20 (7.8 MB)         =  musl libc + busybox + package db + /etc
distroless/static (~2 MB)    =  your binary + CA certs + tzdata. That's it.
FROM scratch (your size)     =  your binary alone — possible because Go/Rust
                                statically link everything
```

"FROM scratch" isn't a metaphor — it's Docker's empty-parent syntax. You can build a
rootfs whose entire OS is *one file*:

## The anatomy of "an OS" in a container

```text
rootfs/
├── bin/busybox        ← THE program: ls, sh, cat, ping — 200 applets, 1 static binary
├── lib/               ← (empty if busybox is static; musl otherwise)
├── etc/passwd         ← a text file (Linux course Ch 8: userland's address book)
├── proc/              ← EMPTY: mount namespace will hang procfs here (Ch 2)
├── dev/               ← EMPTY: devtmpfs or explicit device nodes
└── app/server         ← your actual software
```

Why does this work at all? Chapter 5 of the Linux course: **the VFS**. The kernel
doesn't care that `/bin/sh` is "an OS" — it cares that the path resolves to an
executable. Give a namespace a directory with the right files and `pivot_root` into it
(Chapter 3), and it *is* an OS, to every process inside.

## Prove it to yourself

**1. One binary, one OS:**

```sh
mkdir -p rootfs/bin
cp $(which busybox) rootfs/bin/ 2>/dev/null || \
  curl -L -o rootfs/bin/busybox https://busybox.net/downloads/binaries/1.35.0-x86_64-linux-musl/busybox
chmod +x rootfs/bin/busybox
file rootfs/bin/busybox           # "statically linked" — no libc needed, no /lib
sudo chroot rootfs /bin/busybox sh    # a shell. In a 1-MB OS.
```

**2. The static-linking insight** — `chroot` works with zero libraries because
`file` said `statically linked`. Dynamic binaries need their `ld.so` + libs *inside the
rootfs* (Linux course, Chapter 9: "every binary is incomplete") — the entire reason
`alpine` ships musl and `gcr.io/distroless` exists: the rootfs must contain every
non-static dependency, and only those.

**3. Images are tarballs — literally:**

```sh
docker save alpine:3.20 -o alpine.tar && tar -tf alpine.tar | head -8
# manifest.json / oci-layout / layer.tar files — a directory tree, tarred. That's the
# registry's product. `docker pull` = tarball download + layer extraction (Ch 6).
```

## The build: a real rootfs, booted by your pillars

```sh
#!/bin/sh
# rootfs.sh — busybox rootfs + the four pillars from Chapters 2–5, in one boot
set -e
mkdir -p rootfs/{bin,proc,sys,dev,etc,tmp}
cp $(which busybox) rootfs/bin/busybox && chmod +x rootfs/bin/busybox
echo "root:x:0:0:root:/root:/bin/sh" > rootfs/etc/passwd
for l in sh ls cat echo ps mount; do ln -sf busybox rootfs/bin/$l; done   # applet links

sudo unshare --pid --fork --mount-proc --mount --uts sh -c '
  mount -t proc proc /proc                       # Ch 2: fresh /proc for the new PIDs
  mount -t devtmpfs dev /dev                     # devices (Ch 5 of Linux course: /dev)
  hostname rootfs-box                            # Ch 1: private hostname (UTS ns)
  exec chroot /home/you/rootfs /bin/sh'          # Ch 3: pivot into the world we built
```

Inside that shell: `ls` works, `ps` shows only your tree, `/proc` is *your* process
table, the hostname is yours — a complete, tiny, hand-built container OS. Every piece
was built in a previous chapter; this script is Chapter 12's finale in embryo.

## What you now know

- An image = **a rootfs directory tree**, tarred; no kernel, no boot — the VFS (Linux
  Ch 5) makes "a directory with the right files" indistinguishable from an OS.
- **Static linking shrinks rootfs to one binary** (FROM scratch, distroless); dynamic
  binaries drag in `ld.so` + every `.so` (Linux course, Ch 9's dependency list).
- `docker save` is a tar — the registry sells tarballs of directory trees.
- You built an Alpine-class rootfs from one binary and booted it with your own pillars.

Next: your hand-rolled pillars + rootfs have an official name and a JSON format — the
OCI spec, and `runc`, the program that reads it. Time to graduate from hand-rolled to
industrial.
