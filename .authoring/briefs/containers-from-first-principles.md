# Task: write the two capstone chapters for `containers-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/containers-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/containers-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/containers-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Containers on One Page'
description: 'Namespaces, cgroups, overlayfs and OCI on one page — the four kernel features, the syscalls, and the traps in the runtime.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/containers-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs on your own runtime from Chapter 12 — namespaces, cgroups, overlayfs, networking. Each is checkable by you alone.'
part: 'Part IV — Practice & Reference'
written: true
---
```

Body: the labs structure from the spec (§ "Chapter 2") — 3 warm-ups, 4-5 builds,
3 stretch goals, and 12 labs in total, each with **Goal** / **Do this** /
**You'll know it works when** / **Where it comes from**. Build every lab on artefacts
this course has already built.

## The course's chapter index — reference only these

| # | slug | title | part |
|---|------|-------|------|
| 1 | `01-process-is-a-container` | A Process Is a Container That Isn’t | Part I — The Kernel Foundation |
| 2 | `02-pid-namespaces` | PID Namespaces: A Private Process Tree | Part I — The Kernel Foundation |
| 3 | `03-mount-namespaces-pivot-root` | Mount Namespaces & pivot_root: A Private Filesystem | Part I — The Kernel Foundation |
| 4 | `04-network-namespaces` | Network Namespaces: A Private Internet | Part I — The Kernel Foundation |
| 5 | `05-cgroups-budget` | cgroups: The Budget | Part II — The Runtime |
| 6 | `06-images-overlayfs` | Images & overlayfs: Layers That Stack | Part II — The Runtime |
| 7 | `07-rootfs-distroless` | The rootfs: What’s Actually in There | Part II — The Runtime |
| 8 | `08-runc-oci-spec` | runc: Reading the Real Spec | Part II — The Runtime |
| 9 | `09-docker-anatomy` | Docker’s Anatomy: shim, containerd, daemon | Part III — The Ecosystem |
| 10 | `10-container-networking` | Container Networking: veth, docker0, NAT | Part III — The Ecosystem |
| 11 | `11-volumes-ports-contract` | Volumes, Ports & the Filesystem Contract | Part III — The Ecosystem |
| 12 | `12-final-boss-runtime` | Final Boss: Your Own Container Runtime | Part III — The Ecosystem |
| 13 | `13-cheat-sheet` | Cheat Sheet: Containers on One Page | Part IV — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part IV — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
