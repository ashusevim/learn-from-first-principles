---
layout: ../../layouts/Chapter.astro
title: 'Users, Permissions & sudo'
description: 'UIDs, permission bits, setuid, and capabilities. Root is just UID 0 — and the kernel checks numbers, not names.'
part: 'Part III — The Kernel’s Resources'
written: true
---

Everything you believe about "root" is slightly wrong, and the correction is delightful:
there is no superuser *account*. There is a number — **0** — and on every syscall that
touches anything (files, sockets, signals, processes), the kernel checks *your* number
against the rules. Root isn't magic. Root is what happens when the magic number matches.

## The lie you were told

> "Root is a special account with superpowers."

There's a user named `root` in `/etc/passwd`, sure — but the kernel has never read
`/etc/passwd` in its life. That file is for *humans and userland*. The kernel knows only
**UIDs and GIDs: integers**. `root` is UID 0 the way Sunday is day 0 — the special one is
the number, and any process carrying it gets the superpower.

## The players

- **UID** — your process's real identity, inherited from your login.
- **`/etc/passwd`** — the mapping humans read: `wanony:x:1000:1000:...`. Userland stuff.
- **`/etc/shadow`** — password hashes, readable only by UID 0 (that's the whole security model).
- **Permission bits** — the rules the kernel applies at `open()`: `rwxr-xr--` = three triads
  (owner / group / others), each read-write-execute, plus a fourth bit column later.

One subtlety worth its own tattoo: **permission checks happen at `open()`, not at `read()`**.
If you can open a file and then root revokes your permission, your already-open fd keeps
working (Chapter 6 explains why: the fd points at the file, not the name).

## setuid: borrowing the number

How can a normal user change *their own password* — writing to root-only `/etc/shadow`?
**setuid**: a file's fourth bit says *"when this program execs, grant it the file owner's
UID"*. `passwd` is owned by root with the setuid bit set — for the duration of that program,
your process carries UID 0. That mechanism is also exactly what `sudo` is: a setuid-root
binary that checks a policy (`/etc/sudoers`) and then runs *your* command with UID 0.

This is the most powerful bit in Unix — and the most dangerous, which is why
`chmod u+s` on something shell-scripty is a classic own-goal.

## Capabilities: root, in slices

Modern Linux can split UID 0's power into ~40 discrete **capabilities**:
`CAP_NET_RAW` (raw sockets — that's `ping`), `CAP_NET_ADMIN` (firewalls, interfaces),
`CAP_SYS_TIME` (set the clock)… A process can hold *some* root powers without being root.
When Docker grants a container "partial root", this is the dial it's turning.

## Prove it to yourself

**1. You are a number:**

```sh
id -u            # your UID — that's all the kernel knows about you
stat -c '%U (%u)' /etc/shadow    # who may read the hashes (and as what number)
```

**2. The famous bit:**

```sh
stat -c '%A' /usr/bin/passwd     # note the 's' where x would be for the owner
getcap /usr/bin/ping             # ping doesn't need root — just one capability
```

**3. Feel setuid work.** Compile, then hand your program the crown:

```sh
./whoami         # uid=1000 euid=1000
sudo chown root ./whoami && sudo chmod u+s ./whoami
./whoami         # uid=1000 euid=0  ← your process now writes as UID 0
```

## The build: see the numbers switch

```c
// whoami.c — gcc -o whoami whoami.c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("real uid=%d  effective uid=%d\n", getuid(), geteuid());
    return 0;
}
```

`getuid()` is who you are; `geteuid()` is who the kernel thinks you are *for permission
checks* — that's the one setuid rewires. The `sudo chown root && chmod u+s` above flips
`euid` to 0 while `uid` stays you: precisely the state sudo's children run in. (Clean up
after: `sudo chown $USER ./whoami && sudo chmod u-s ./whoami`.)

For capabilities, try the same idea in one power instead of all of them:

```sh
sudo setcap cap_net_raw+ep ./my-ping   # only raw sockets — no other root powers
getcap ./my-ping
```

## What you now know

- The kernel checks **UID numbers** on syscalls; names, `/etc/passwd`, "root" — all userland.
- **Permission bits** are checked at `open()`; open fds are grandfathered.
- **setuid** = "run with the file owner's UID" — the mechanism under both `passwd` and `sudo`.
- **Capabilities** slice root into ~40 independent powers (this becomes very useful in Chapter 14).

Next: before `main()` runs, a completely hidden program runs first. Time to meet the
dynamic linker.
