# Task: write the two capstone chapters for `networking-from-first-principles`

Read `/home/wanony/projects/first-principles/.authoring/SPEC.md` FIRST — it is the authoring spec (voice, structure, quality bar).
Then read `/home/wanony/projects/first-principles/networking-from-first-principles/src/lib/chapters.ts` and two existing chapters
(`/home/wanony/projects/first-principles/networking-from-first-principles/src/pages/chapters/01-*.md` and the `12-final-boss-*.md`) to absorb the voice.

## Create exactly these two files (nothing else)

### 1. `/home/wanony/projects/first-principles/networking-from-first-principles/src/pages/chapters/13-cheat-sheet.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Networking on One Page'
description: 'Frames, IP, TCP, DNS and TLS on one page — the model, the byte layouts, the state machine, and the tools that read them.'
part: 'Part V — Practice & Reference'
written: true
---
```

Body: the cheat-sheet structure from the spec (§ "Chapter 1"). Its pitfalls table must
reference only chapters that exist in the index below.

### 2. `/home/wanony/projects/first-principles/networking-from-first-principles/src/pages/chapters/14-labs.md`

Frontmatter — reproduce byte-for-byte:

```
---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs from raw frames to ping from Chapter 12 — handshakes, retransmits, sockets. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
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
| 1 | `01-what-the-wire-carries` | What the Wire Actually Carries | Part I — Wires and Frames |
| 2 | `02-ip-the-addressing-lie` | IP: The Addressing Lie | Part I — Wires and Frames |
| 3 | `03-arp-asking-the-room` | ARP: Asking the Whole Room | Part I — Wires and Frames |
| 4 | `04-tcp-handshake-byte-by-byte` | The TCP Handshake, Byte by Byte | Part II — TCP from Raw Bytes |
| 5 | `05-data-acks-retransmission` | Data, ACKs & Retransmission | Part II — TCP from Raw Bytes |
| 6 | `06-teardown-and-states` | Teardown & the Strange States | Part II — TCP from Raw Bytes |
| 7 | `07-sockets-and-the-kernel` | Sockets: The Kernel’s Side of the Deal | Part III — Programs on Top |
| 8 | `08-dns-the-phone-book` | DNS: The Internet’s Phone Book | Part III — Programs on Top |
| 9 | `09-http-from-raw-bytes` | HTTP Is Just Text (Until It Isn’t) | Part III — Programs on Top |
| 10 | `10-tls-the-hiding-handshake` | TLS: The Handshake That Hides Everyone | Part IV — The Real World |
| 11 | `11-nat-routers-traceroute` | NAT, Routers & the Edge of Your Street | Part IV — The Real World |
| 12 | `12-final-boss-ping` | Final Boss: ping, from Scratch | Part IV — The Real World |
| 13 | `13-cheat-sheet` | Cheat Sheet: Networking on One Page | Part V — Practice & Reference | **NEW**
| 14 | `14-labs` | Labs: Prove It Yourself | Part V — Practice & Reference | **NEW**

## Do not

- Edit `chapters.ts`, layouts, components, READMEs, `package.json`, or existing chapters.
- Create files in `code/`. Run `npm install` or `npm run build`.
- Invent chapter numbers or titles that are not in the index above.

## Finish by reporting

`wc -w` on both files, plus `head -8` of each.
