---
layout: ../../layouts/Chapter.astro
title: 'Why Everything Is a File'
description: 'The VFS trick: inodes, dentries, and how /dev, /proc, and /sys expose the kernel as files you can cat.'
part: 'Part II — Talking to the Machine'
written: true
---

"Everything is a file" is the phrase Unix people say with a gleam in their eye, and it
usually gets explained as a slogan. It's not a slogan — it's an engineering trick with a
name: the **Virtual File System (VFS)**. Once you see it, half of Linux's weirdness
(`/proc`? `/dev/null`? "block device"?) snaps into focus at once.

## The lie you were told

> "A file is a document stored on disk."

No. In Linux, a file is **anything you can read and write bytes from**, through one
interface: `open() → read()/write() → close()`. Disks. Keyboards. Sockets. Process tables.
Kernel logs. Random number generators. All of them answer to the same four syscalls.

## The VFS trick

The kernel defines one abstract interface, and every "filesystem" implements it:

```text
        open / read / write / close     ← the only verbs
        ┌───────┬────────┬─────────┬──────────┐
        │ ext4  │ procfs │ devtmpfs│ sysfs    │
        │(disk) │(/proc) │ (/dev)  │ (/sys)   │
        └───────┴────────┴─────────┴──────────┘
```

Your `cat` doesn't know or care what's behind the file. That's why one tool works on
documents, devices, and the kernel's own memory tables — the *tools* never had to change.

## What a file actually is: an inode

On disk, a file is an **inode**: metadata (size, timestamps, permissions, owner UID) plus
pointers to data blocks. The *name* is not part of the file — a name is just a **directory
entry (dentry)**: a row in a directory saying "this name → this inode number".

That explains the two things everyone finds confusing:

- **Hard links**: two names pointing at *the same inode*. Same file, two names.
- **Deleting** is `unlink()`: remove one name. The data dies only when the *last* name is
  gone (and no process holds it open — that's why deleted-but-open files still eat space).

A **symlink** is different: a tiny file containing a *path*, not an inode number.

## Three fake filesystems you use every day

These directories don't exist on any disk. They're kernel data wearing file costumes:

| Mount | What it shows | Example |
|-------|--------------|---------|
| `/dev` | devices as files | `/dev/sda` (your disk!), `/dev/null`, `/dev/urandom` |
| `/proc` | processes & kernel state | `/proc/1234/` is process 1234's brain |
| `/sys` | kernel/hardware objects | every driver, every LED, every CPU |

This is the payoff of the whole design: reading a process's memory map is
`cat /proc/self/maps`. Not an API call, not a special tool — **`cat`**. The same boring
file reader your grandmother's text editor uses.

## Prove it to yourself

**1. Inodes don't lie:**

```sh
echo hi > a.txt
ln a.txt b.txt            # hard link
ln -s a.txt c.txt         # symlink
stat -c '%n inode=%i links=%h' a.txt b.txt c.txt
```

`a` and `b` share inode and link count 2. `c` is a different inode that stores a path.

**2. Names are just dentries — "delete" the original, data survives:**

```sh
rm a.txt && cat b.txt     # still prints "hi"
```

**3. Read your own CPU through the file interface:**

```sh
head -5 /proc/cpuinfo
```

**4. `/proc` weighs nothing:**

```sh
df -h /proc /home
```

`/proc` shows size 0 — it's not storage, it's a *window*.

## The build: one door, two universes

This program opens `/dev/urandom` with the **exact same `open()`** you'd use on
`notes.txt` — and gets kernel-grade randomness out:

```c
// rand.c — gcc -o rand rand.c && ./rand
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open("/dev/urandom", O_RDONLY);   // yes, that's all "a device" is
    if (fd < 0) { perror("open"); return 1; }

    unsigned char buf[16];
    read(fd, buf, sizeof(buf));
    close(fd);

    for (int i = 0; i < 16; i++) printf("%02x ", buf[i]);
    printf("\n");
    return 0;
}
```

No driver library. No special API. One file, read like any other — because the kernel made
sure the file *was* the driver.

## What you now know

- "File" = anything behind the VFS interface: `open/read/write/close`.
- A file is an **inode**; names are directory entries; deleting removes a *name*.
- `/dev`, `/proc`, `/sys` are kernel data pretending to be files — on purpose.
- That's why the same tools (`cat`, `wc`, `head`) work on everything.

Next: that `open()` returned a mysterious number — a **file descriptor**. Those numbers
are how redirection and pipes work, and they're up next.
