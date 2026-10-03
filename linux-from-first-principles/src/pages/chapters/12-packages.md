---
layout: ../../layouts/Chapter.astro
title: 'Packages & Distros: Who Puts Binaries on My Disk?'
description: 'Repositories, dependency resolution, and what pacman/apt actually do. The distro is a curation + update machine.'
part: 'Part IV — The Running System'
written: true
---

`pacman -S firefox` — ten seconds later, 200 MB of binaries, libraries, icons and man pages
exist on your disk, wired into the menus, with an uninstaller and an update channel. That
is not a download. That's the distro's whole reason to exist — and after this chapter,
"what does my package manager actually do" will be a question you can answer with `tar`
and `ls`.

## The lie you were told

> "I downloaded and installed a program."

You requested a **package**; a build farm somewhere decided the exact build, resolved which
libraries it needs, signed it, added it to a catalog — and your package manager executed a
*file manifest* on your disk, writing everything down in a local database so it can later
verify, upgrade, or remove it. "Installing" is a database transaction plus file copy.

## What a package actually is

Open one up and there's no magic, just an archive:

```text
firefox-129.0-x86_64.pkg.tar.zst
├── .PKGINFO      metadata: name, version, deps, size, build date
├── .MTREE        checksums of every file (for verification)
└── usr/
    ├── bin/firefox
    ├── lib/firefox/...
    └── share/applications/firefox.desktop
```

A package = **files + metadata + dependency list** (+ optional pre/post scripts). `apt`'s
`.deb` and pacman's `.pkg.tar.zst` differ in tooling, not concept.

## The distro machine

- **Repositories** are signed catalogs ("here's everything that works together, these are
  their checksums"). Signing is why `pacman -Sy` warns about stale keyrings: signatures
  *are* the trust model.
- **Dependency resolution** is a graph problem: firefox needs gtk3 needs glib needs…
  The package manager solves it, installs in dependency order, and refuses to break the
  graph (usually).
- **The FHS** (`/usr/bin`, `/usr/lib`, `/etc`, `/var`) is the contract for *where files go*
  — so `pacman -Ql`, `ldconfig`, and your muscle memory all agree.
- **Distro philosophies** are answers to one question — *who is responsible for
  consistency?* Debian: "we test for years" (stable). Arch: "you do, constantly" (rolling).
  NixOS: "nobody, it's all immutable and atomic". Same machine, different contracts.

## Prove it to yourself

**1. Every file a package owns** (the manifest is on your disk):

```sh
pacman -Ql bash | head        # Arch
dpkg -L bash | head           # Debian/Ubuntu
```

**2. The metadata, straight up:**

```sh
pacman -Si firefox | head     # or: apt show firefox
```

**3. Download a package without installing — and just... open it:**

```sh
cd /tmp
pacman -Sw --noconfirm htop && find /var/cache/pacman/pkg -name 'htop*' -newer /tmp -exec cp {} /tmp \;
tar -tf /tmp/htop*.pkg.tar.zst | head      # it's an archive. You know archives.
```

(On Debian: `apt download htop && dpkg -c htop*.deb`.)

## The build: ship your own package

Take the mini shell from Chapter 4 — or any script — and make it a real, installable,
uninstallable package. On Arch:

```sh
mkdir hello-fp && cd hello-fp
printf '#!/bin/sh\necho "hello, from my own package"\n' > hello-fp
chmod +x hello-fp

cat > PKGBUILD <<'EOF'
pkgname=hello-fp
pkgver=0.1
pkgrel=1
pkgdesc="My first hand-built package"
arch=('any')
license=('MIT')
package() {
    install -Dm755 hello-fp "$pkgdir/usr/bin/hello-fp"
}
EOF

makepkg                                    # builds hello-fp-0.1-1-any.pkg.tar.zst
sudo pacman -U ./hello-fp-0.1-1-any.pkg.tar.zst
hello-fp                                   # installed. On PATH. Yours.
pacman -Ql hello-fp                        # the manifest — you're in the database now
sudo pacman -R hello-fp                    # and perfectly removable
```

(On Debian/Ubuntu the same ritual is `dpkg-deb --build` with a `DEBIAN/control` file.)

That `.zst` file is structurally identical to what's in the mirrors. The distance between
"user of a distro" and "maintainer of a distro" is one config file and an upload form.

## What you now know

- A package is **files + metadata + deps** in an archive; installing is a recorded transaction.
- **Repos are signed catalogs**; dependency resolution keeps the graph consistent.
- The FHS tells every package where its files go; your package manager knows every file by name.
- Distro philosophies = different answers to "who guarantees consistency?"

Next: everything so far — boot, processes, memory, services, packets — left evidence.
The kernel keeps receipts, and it's time you learned to read them.
