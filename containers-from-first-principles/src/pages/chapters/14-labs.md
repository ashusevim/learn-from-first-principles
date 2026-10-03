---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on your own runtime from Chapter 12 — namespaces, cgroups, overlayfs, networking. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in a difference you can see with your own eyes,
using `myrun` from Chapter 12 (`sudo ./myrun <rootfs> <cmd>`). Nothing here is new —
namespaces (Chapters 2–4), budgets (Chapter 5), layers (Chapter 6), the rootfs
(Chapter 7), the spec (Chapter 8). What is new is mileage. Keep a host shell open
beside the container shell; half the labs are spot-the-difference.

## How the labs work

Every lab has four fields. **Goal** names the claim. **Do this** is the smallest
command that tests it. **You'll know it works when** tells you the expected
difference — diff yours against it. **Where it comes from** names the chapter that
taught it, so a stuck lab tells you exactly what to reread. Your instruments:

| Tool | What it proves | Chapter |
|---|---|---|
| `sudo ./myrun <rootfs> /bin/sh` | the whole runtime | 12 |
| `unshare --pid --fork --mount-proc bash` | a PID namespace in one line | 2 |
| `ls -l /proc/<pid>/ns` | which cage a process lives in | 2–4 |
| `mount \| grep overlay` | where the layers landed | 6 |
| `cat /sys/fs/cgroup/.../memory.current` | what the budget says | 5 |

## Warm-ups

**Lab 1.1 — You are PID 1**
**Goal:** see the private process tree (Chapter 2) from inside and outside.
**Do this:**
```sh
sudo ./myrun /path/to/rootfs /bin/sh
echo $$
ps -ef
exit
```
**You'll know it works when:** `echo $$` prints `1`, and `ps -ef` shows a tiny world —
the shell, `ps`, nothing else. From the host shell, the same processes show their
*real* PIDs. Two views, one kernel.
**Where it comes from:** Chapter 2 — PID Namespaces: A Private Process Tree.

**Lab 1.2 — A hostname nobody else hears**
**Goal:** prove the UTS part of `myrun` is real.
**Do this:** inside, run `hostname jail-1`; in the host shell run `hostname`.
**You'll know it works when:** the host name is unchanged, while inside it still
says `jail-1`. Exit and re-enter: it is gone. Namespaces are born with the process
and die with it.
**Where it comes from:** Chapters 2–4.

**Lab 1.3 — Find your cage from the outside**
**Goal:** namespaces are files — read them like files.
**Do this:** with the container running, find its shell (`ps -ef | grep '/bin/sh'`),
then compare cages from the host:
```sh
ls -l /proc/<container-pid>/ns | grep -E 'pid|mnt|net|uts'
ls -l /proc/$$/ns | grep -E 'pid|mnt|net|uts'
```
**You'll know it works when:** the `pid`, `mnt`, `net` and `uts` inodes differ
between the two listings. Isolation is per-namespace, not per-machine.
**Where it comes from:** Chapters 2–4.

## Builds

**Lab 2.1 — The ten-second PID namespace**
**Goal:** namespaces with zero code — the `unshare` one-liner behind `myrun`.
**Do this:**
```sh
sudo unshare --pid --fork --mount-proc bash
ps -ef
exit
```
**You'll know it works when:** inside, `bash` is PID 1 and `ps` shows two lines;
after `exit`, the universe is gone. `myrun` does this programmatically; the flag
does it in one line.
**Where it comes from:** Chapter 2 — PID Namespaces: A Private Process Tree.

**Lab 2.2 — A private internet for two shells**
**Goal:** a veth pair across the boundary (Chapters 4 and 10).
**Do this:** with the container pid as `<pid>`, from the host:
```sh
sudo ip link add veth-host type veth peer name veth-jail
sudo ip link set veth-jail netns <pid>
sudo nsenter -t <pid> -n ip addr add 10.9.9.2/24 dev veth-jail
sudo nsenter -t <pid> -n ip link set veth-jail up
sudo ip addr add 10.9.9.1/24 dev veth-host
sudo ip link set veth-host up
ping -c2 10.9.9.2
```
**You'll know it works when:** `ping` answers — and inside, `ip addr` shows an
interface the host never lists under that name. A private internet, six commands.
**Where it comes from:** Chapter 4 — Network Namespaces: A Private Internet, and Chapter 10 — Container Networking: veth, docker0, NAT.

**Lab 2.3 — Prove the layers**
**Goal:** writes land in `upper`, never in the image (Chapter 6).
**Do this:** inside, `touch /made-inside`; on the host find the layer
(`mount | grep overlay` — the `upperdir=` path) and list it:
```sh
ls <upperdir>      # made-inside is HERE; the rootfs dir has no such file
```
**You'll know it works when:** the file is in `upperdir` and absent from the lower
rootfs. Now `rm /made-inside` inside and list again — overlay recorded the deletion
without touching the lower layer.
**Where it comes from:** Chapter 6 — Images & overlayfs: Layers That Stack.

**Lab 2.4 — Watch the budget breathe**
**Goal:** the cgroup is a live meter, not a setting (Chapter 5).
**Do this:** inside the container, read your course's memory path, then move 50 MB:
```sh
cat /sys/fs/cgroup/memory.current
head -c 50M /dev/zero > /tmp/ballast
cat /sys/fs/cgroup/memory.current
rm /tmp/ballast
```
**You'll know it works when:** the number jumps ~50 MB and falls straight back. A
budget you can watch while the process runs.
**Where it comes from:** Chapter 5 — cgroups: The Budget.

**Lab 2.5 — Share a directory on purpose**
**Goal:** volumes are bind mounts (Chapter 11).
**Do this:** on the host, then inside:
```sh
mkdir -p /tmp/shared && echo from-host > /tmp/shared/note
mount --bind /tmp/shared <rootfs>/mnt    # host: attach it to the rootfs
cat /mnt/note                            # inside: read it
echo from-jail >> /mnt/note              # inside: write it back
cat /tmp/shared/note                     # host: both lines
```
**You'll know it works when:** both lines appear on both sides. One file, two
views — the filesystem contract, working as designed.
**Where it comes from:** Chapter 11 — Volumes, Ports & the Filesystem Contract.

## Stretch goals

**Lab 3.1 — Meet the OOM killer**
**Goal:** a budget is only real when something hits it.
**Do this:** from Lab 2.4, grow `/tmp/ballast` past your course's Chapter 5 limit
until the shell stutters or the writer dies; on the host, find the verdict:
```sh
dmesg | tail -5    # look for "Killed process" and the cgroup name
```
**You'll know it works when:** `dmesg` names your process and the cgroup — the
killer's signature, on camera, with your name on it.
**Where it comes from:** Chapter 5 — cgroups: The Budget.

**Lab 3.2 — Ship a layer**
**Goal:** an image you can hand to someone — tar, move, unpack, run.
**Do this:** on the host, pack your Chapter 7 rootfs plus Lab 2.5's `/tmp/shared`
as data, unpack the tar in a fresh directory, and run `myrun` against the copy:
```sh
tar -czf myapp.tar.gz -C <rootfs> .
mkdir /tmp/rootfs2 && tar -xzf myapp.tar.gz -C /tmp/rootfs2
sudo ./myrun /tmp/rootfs2 /bin/sh
```
**You'll know it works when:** the copy behaves identically — same `ps` view, same
`/mnt/note` contents. That tarball *is* an image; registries (Chapter 9) only add
names and downloads.
**Where it comes from:** Chapters 7, 9 and 12.

## Self-checking without a grader

- **Spot-the-difference labs** (1.x, 2.1, 2.2): the proof is two outputs side by
  side — host vs container, before vs after. If the difference is visible and
  matches "You'll know it works when", you are right.
- **Layer and budget labs** (2.3, 2.4, 3.1): the kernel keeps the receipts —
  `upperdir` listings, `memory.current`, `dmesg`. Numbers do not flatter.
- **The ship lab** (3.2): identity of behavior across a tar round-trip is the whole
  test. If the copy runs the same, the layers were honest.

## What you now know

- **`myrun`'s six calls** are the entire runtime: unshare the views, mount the
  layers, `pivot_root` the world, drop the budget, run.
- **Every Docker feature maps to one call**: the image is a tarball (Lab 3.2), the
  network is a veth pair (Lab 2.2), the volume is a bind mount (Lab 2.5).
- **The kernel never lies**: namespace inodes, cgroup meters and `dmesg` tell you
  the truth when the tooling is confusing.
- Namespaces are process-lifetime: no daemon keeps your universe alive. The shim
  (Chapter 9) exists precisely because of that fact.

Next: read runc's source tree — the file names are your table of contents now,
and every function has a three-line cousin in `myrun`.

