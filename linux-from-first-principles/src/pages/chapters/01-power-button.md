---
layout: ../../layouts/Chapter.astro
title: 'What Happens When You Press the Power Button'
description: 'From dead silicon to a login prompt: firmware, bootloader, kernel, initramfs, PID 1. The whole boot, step by step.'
part: 'Part I — The Machine Wakes Up'
written: true
---

Everything on your computer — every window, every server, every container — exists because of
a five-actor relay race that starts the instant you press the power button. Most people never
see it, because it takes about two seconds and prints too fast to read. But it's the single
most important thing to understand about Linux: **everything else in this course is a
consequence of how this race is won.**

## The lie you were told

> "The operating system starts your computer."

It's actually backwards. Your hardware can't even *find* the operating system at first —
it doesn't know what a disk is, what a filesystem is, or what Linux is. The boot is a
carefully staged handoff, where each actor is only smart enough to find and start the next one:

```text
CPU ──▶ Firmware ──▶ Bootloader ──▶ Kernel ──▶ PID 1
(power)  (UEFI)      (GRUB)        (vmlinuz)  (systemd)
```

Let's walk it, stage by stage.

<figure class="diagram">
<svg viewBox="0 0 860 110" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="#e8b15c" stroke-width="1.5"/></marker></defs>
  <g font-family="ui-monospace,monospace" font-size="13">
    <rect x="20"  y="30" width="120" height="46" rx="9" fill="#161b22" stroke="#2d333b"/><text x="80"  y="50" text-anchor="middle" fill="#e6edf3" font-weight="bold">CPU</text><text x="80" y="66" text-anchor="middle" fill="#8b949e" font-size="10">resets, jumps</text>
    <rect x="190" y="30" width="120" height="46" rx="9" fill="#161b22" stroke="#2d333b"/><text x="250" y="50" text-anchor="middle" fill="#e8b15c" font-weight="bold">UEFI</text><text x="250" y="66" text-anchor="middle" fill="#8b949e" font-size="10">finds bootloader</text>
    <rect x="360" y="30" width="120" height="46" rx="9" fill="#161b22" stroke="#2d333b"/><text x="420" y="50" text-anchor="middle" fill="#e8b15c" font-weight="bold">GRUB</text><text x="420" y="66" text-anchor="middle" fill="#8b949e" font-size="10">loads kernel</text>
    <rect x="530" y="30" width="120" height="46" rx="9" fill="#161b22" stroke="#2d333b"/><text x="590" y="50" text-anchor="middle" fill="#e8b15c" font-weight="bold">Kernel</text><text x="590" y="66" text-anchor="middle" fill="#8b949e" font-size="10">+ initramfs</text>
    <rect x="700" y="30" width="130" height="46" rx="9" fill="#161b22" stroke="#e8b15c"/><text x="765" y="50" text-anchor="middle" fill="#7ee2a8" font-weight="bold">PID 1</text><text x="765" y="66" text-anchor="middle" fill="#8b949e" font-size="10">starts everything</text>
    <line x1="140" y1="53" x2="186" y2="53" stroke="#e8b15c" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="310" y1="53" x2="356" y2="53" stroke="#e8b15c" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="480" y1="53" x2="526" y2="53" stroke="#e8b15c" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="650" y1="53" x2="696" y2="53" stroke="#e8b15c" stroke-width="1.5" marker-end="url(#arr)"/>
  </g>
</svg>
<figcaption>Fig 1 — The boot relay: each actor is only smart enough to start the next one.</figcaption>
</figure>


## Stage 0: Power. Just electricity.

When you press the button, the power supply sends a "power good" signal, the CPU resets, and
starts executing whatever machine code it finds at a fixed memory address burned into the
motherboard. It has no RAM initialized, no disk, no idea what it is. The code at that address
is your **firmware**.

## Stage 1: Firmware (UEFI)

UEFI (the modern replacement for the 1981 BIOS) does three jobs:

1. **Initializes hardware** — RAM training, and probing every bus for attached devices.
2. **Runs POST** — the power-on self-test. (The beep from old PCs was this stage talking.)
3. **Chooses a bootloader** — it reads a special FAT-formatted partition called the
   **EFI System Partition (ESP)** and launches a `.efi` executable from it.

That executable is almost always a **bootloader**.

## Stage 2: Bootloader (GRUB)

Here's the chicken-and-egg problem the bootloader exists to solve: the kernel needs drivers
to read your disk, but the drivers live *on* the disk. GRUB breaks the loop because it ships
with a small toolbox of read-only filesystem drivers of its own.

GRUB:

1. Reads its config from `/boot/grub/grub.cfg` — **this is the menu you see on dual-boot machines**.
2. Loads two files into memory: the compressed kernel (`vmlinuz`) and the **initramfs** (next stage).
3. Passes the kernel a **command line** (e.g. `root=/dev/nvme0n1p2 quiet`) and jumps to it.

## Stage 3: The kernel takes over

The kernel decompresses itself, sets up the machinery of the machine — paging, interrupts,
the scheduler — and initializes every driver it was built with. Then it mounts the initramfs
as a temporary root filesystem and starts exactly **one** program: PID 1.

> **Why does the initramfs exist?** Because your root filesystem might be on fancy storage —
> encrypted, on NVMe RAID, on the network. The kernel image can't contain drivers for all of
> that, so your distro packs just *your* drivers into a tiny archive. The kernel mounts it,
> loads the modules, and the initramfs' only job is to find and mount your real root.

## Stage 4: PID 1 (systemd)

PID 1 is the first real process, and the ancestor of every process that will ever run on this
machine (Chapter 3). Its job: mount the real root filesystem, then start everything else —
networking, login prompt, your desktop — in dependency order. On most distros today, PID 1 is
`systemd`. When it's done, it draws a login prompt, and the race is over.

## Prove it to yourself

This is the part tutorials skip. Don't trust me — run these:

**1. Read the kernel's diary.** Everything from Stage 3 is still sitting in a memory buffer:

```sh
sudo dmesg | head -30
```

You'll see the kernel's own narration: *"Linux version…", "ACPI…", "NVMe…"* — every line is a
boot step you just read about.

**2. See the message GRUB passed to the kernel:**

```sh
cat /proc/cmdline
```

Those are GRUB's exact words to the kernel (`root=… quiet`), editable in `/boot/grub/grub.cfg`.

**3. Get a timestamped boot timeline:**

```sh
journalctl -b -o short-monotonic | head -40
```

**4. Crack open an initramfs** (Arch uses `lsinitcpio`; Debian/Ubuntu use `lsinitramfs`):

```sh
lsinitcpio /boot/initramfs-linux.img   # Arch
lsinitramfs /boot/initrd.img-6.8.0     # Debian/Ubuntu
```

You'll find a miniature Linux filesystem in there — `/bin`, `/lib/modules` — proof that it's
just a tiny root the kernel mounts first.

## What you now know

- Boot is a relay: **firmware → bootloader → kernel → PID 1**, each only smart enough to start the next.
- The initramfs is a tiny temporary root filesystem carrying just the drivers *your* machine needs.
- PID 1 starts everything; if PID 1 dies, the kernel panics (Chapter 3 explains why).
- `dmesg`, `/proc/cmdline`, and `journalctl` let you watch the race after it's finished.

Next up: **the kernel itself** — what actually separates "the kernel" from "Ubuntu", and the
one door every program must knock on to touch hardware: the syscall.
