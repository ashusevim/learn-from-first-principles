---
layout: ../../layouts/Chapter.astro
title: 'Mount Namespaces & pivot_root: A Private Filesystem'
description: 'The container’s "/" is just a directory on your disk — until pivot_root makes it the only world. Build: a private mount namespace by hand.'
part: 'Part I — The Kernel Foundation'
written: true
---

A private process tree (Chapter 2) still browses *your* filesystem. The second wall: the
**mount namespace** — a private view of every mount on the system — plus one syscall
(`pivot_root`) that swaps "your disk directory" for "the only / there is". This is the
chapter where the container gets its filesystem, and where `docker run -v` becomes a
bind mount you could have typed yourself.

## The lie you were told

> "Container filesystems are virtualized like VM disks."

No virtualization: a container's `/` is **a directory on your ext4 disk** (Chapter 5 of
the Linux course strikes again), made to *look* like a root through two kernel moves:

1. **Mount namespace** — a private copy of the mount table. Mounting/unmounting inside
   it changes nothing for anyone else (your `snap` and browser sandboxes run in these
   already).
2. **pivot_root** — atomically swaps which directory is `/` for processes in that
   namespace. (`chroot`'s modern sibling: cleaner, escape-resistant when done right.)

## The steps, in order — and the gotcha that eats beginners

```text
1. unshare(CLONE_NEWNS)                    private mount table
2. mount(rootfs, rootfs, MS_BIND)          bind rootfs onto itself → anchor for the pivot
3. mount(NULL, "/", MS_REC|MS_PRIVATE)     STOP propagation (see below!)
4. pivot_root(rootfs, rootfs/old)          swap: old / → old/, rootfs → /
5. umount2("/old", MNT_DETACH)             detach the old world; it's gone
6. chdir("/"); exec(/bin/sh)               live there
```

Step 3 is the classic bug: mounts propagate between namespaces **by default** (shared
mounts — systemd sets it up), so your private `mount tmpfs /mnt` *silently appears on
the host too* unless you first make the tree `private`. Every "why did my namespace
mount leak?" question ever is step 3.

## chroot vs pivot_root, honestly

`chroot("/dir")` just rewrites the path prefix — the process can still `cwd` out via an
open fd, and it keeps the host's mount table. `pivot_root` moves the *entire mount
root*: the old root isn't a prefix anymore, it's detached. Done inside a mount
namespace with propagation off, it's the container-grade move — which is why runc does
exactly the six steps above.

## Prove it to yourself

**1. The private mount table:**

```sh
sudo unshare -m sh -c '
  mount -t tmpfs none /mnt            # exists ONLY in this namespace
  ls /mnt                             # empty but mountable
  mount | grep /mnt'
mount | grep /mnt                      # on the host: nothing. Private table confirmed.
```

**2. The propagation leak — step 3's bug, reproduced:**

```sh
sudo unshare -m sh -c 'mount -t tmpfs none /mnt; sleep 5' &
sleep 1; mount | grep /mnt             # ON THE HOST: the tmpfs leaked! (shared mounts)
# re-run with `unshare -m --propagation private` and it stays private. Step 3 justified.
```

**3. pivot_root as a one-file filesystem:**

```sh
sudo unshare -m --propagation private sh -c '
  mkdir -p /tmp/newroot/{bin,lib,old} /tmp/newroot/bin
  cp /bin/busybox /tmp/newroot/bin/           # one static binary IS a filesystem
  mount --bind /tmp/newroot /tmp/newroot      # the anchor (step 2)
  cd /tmp/newroot
  pivot_root . old                            # step 4: / is now /tmp/newroot
  /bin/busybox ls /                           # bin  lib  old — a whole new world
  /bin/busybox umount -l /old                 # step 5: old world detached'
```

## The build: the filesystem pillar in C

The Linux course's Chapter 14 code, now annotated with the *why* of every line:

```c
/* fs.c — gcc -o fs fs.c && sudo ./fs /path/to/rootfs — the container gets its "/" */
#define _GNU_SOURCE
#include <sched.h>
#include <stdio.h>
#include <sys/mount.h>
#include <sys/syscall.h>
#include <unistd.h>

int main(int argc, char **argv) {
    unshare(CLONE_NEWNS);                                    /* private mount table (step 1) */
    mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL);       /* stop propagation (step 3!) */
    mount(argv[1], argv[1], NULL, MS_BIND | MS_REC, NULL);   /* anchor (step 2) */

    chdir(argv[1]);
    syscall(SYS_pivot_root, ".", ".old");                    /* the swap (step 4) */
    chdir("/");
    umount2("/.old", MNT_DETACH);                            /* old world detached (step 5) */

    execl("/bin/sh", "sh", NULL);                            /* live there (step 6) */
}
```

Six syscalls — and `/bin/sh` now runs in a filesystem you constructed, unable to see
the disk it physically lives on. `-v` bind mounts in Docker are `mount(MS_BIND)` into
this namespace (Chapter 11); image layers are what `argv[1]` contains (Chapter 6).

## What you now know

- Container "/" = **a disk directory + mount namespace + pivot_root**. No virtual disk.
- **Mount propagation leaks by default** — `MS_PRIVATE` first, or your "private" mounts
  appear on the host.
- `pivot_root` beats `chroot`: full root swap, no fd escapes, container-grade.
- `-v` bind mounts = step 2, aimed at any directory. You've been using this syscall all
  along.

Next: the process tree and filesystem are private — but the container still shares
*your* internet. Third wall: network namespaces, and the veth pairs that build docker0.
