---
layout: ../../layouts/Chapter.astro
title: 'What the Wire Actually Carries'
description: 'Ethernet frames, MAC addresses, and what a NIC really does. Your packets are just structured bytes on copper.'
part: 'Part I — Wires and Frames'
written: true
---

Forget the seven layers of the OSI model for a minute. At the bottom of everything — under
IP, under TCP, under TLS, under HTTP — there is one thing: **a chunk of bytes with a header,
shot down a wire or through the air**. This chapter is about those bytes. Once you can see
them, "the network" stops being a cloud diagram and becomes something you can catch in your
hand.

## The lie you were told

> "Wi-Fi and Ethernet are abstract connectivity."

They are **frames**: structured byte sequences. Destination, source, type, payload, and a
checksum the NIC verifies *in hardware*. That's the whole "link layer". If you can read a
frame, you can read the bottom of the entire internet.

## The frame, byte by byte

<figure class="diagram">
<svg viewBox="0 0 860 96" role="img" xmlns="http://www.w3.org/2000/svg">
  <g font-family="ui-monospace,monospace" font-size="12">
    <rect x="20"  y="20" width="150" height="44" rx="8" fill="#243040" stroke="#2d333b"/><text x="95"  y="40" text-anchor="middle" fill="#e6edf3" font-weight="bold">dst MAC</text><text x="95" y="56" text-anchor="middle" fill="#8b949e" font-size="10">6 bytes · next hop</text>
    <rect x="174" y="20" width="150" height="44" rx="8" fill="#243040" stroke="#2d333b"/><text x="249" y="40" text-anchor="middle" fill="#e6edf3" font-weight="bold">src MAC</text><text x="249" y="56" text-anchor="middle" fill="#8b949e" font-size="10">6 bytes · sender</text>
    <rect x="328" y="20" width="110" height="44" rx="8" fill="#3a2e1c" stroke="#e8b15c"/><text x="383" y="40" text-anchor="middle" fill="#e8b15c" font-weight="bold">type</text><text x="383" y="56" text-anchor="middle" fill="#8b949e" font-size="10">0x0800 = IP</text>
    <rect x="442" y="20" width="280" height="44" rx="8" fill="#1c2a20" stroke="#7ee2a8"/><text x="582" y="40" text-anchor="middle" fill="#7ee2a8" font-weight="bold">payload</text><text x="582" y="56" text-anchor="middle" fill="#8b949e" font-size="10">the real packet — IP, ARP… (up to ~1500 bytes)</text>
    <rect x="726" y="20" width="110" height="44" rx="8" fill="#243040" stroke="#2d333b"/><text x="781" y="40" text-anchor="middle" fill="#e6edf3" font-weight="bold">FCS</text><text x="781" y="56" text-anchor="middle" fill="#8b949e" font-size="10">CRC32 check</text>
  </g>
</svg>
<figcaption>Fig 1 — The Ethernet frame: the bottom of the entire internet, byte by byte.</figcaption>
</figure>


```text
┌──────────┬──────────┬─────────┬──────────────────────┬─────────┐
│ dst MAC  │ src MAC  │ type    │ payload (the real    │ FCS     │
│ 6 bytes  │ 6 bytes  │ 2 bytes │ packet — IP, ARP...) │ 4 bytes │
└──────────┴──────────┴─────────┴──────────────────────┴─────────┘
```

- **MAC addresses** — hardware identities of network cards (`aa:bb:cc:dd:ee:ff`). They matter
  *only on your local street*: a frame's MAC is "the next hop", never the final destination.
- **Type** — what's inside the payload: `0x0800` = IPv4, `0x0806` = ARP, `0x86dd` = IPv6.
  One number, and the kernel knows who should unwrap it next.
- **FCS** — a CRC32 checksum. If even one bit flipped in transit, the NIC drops the frame
  before the kernel ever sees it. This is why your Wi-Fi "just works" in a noisy room.

Everything you've ever sent — every video call, every git push — was chopped into ~1500-byte
frames, each wrapped in this exact envelope.

## The NIC: a bouncer with one rule

Your network card receives *every* frame on the wire (that's how the physics works), checks
the FCS, and then applies one rule: "is dst MAC **me**, or **broadcast**, or in my filter
list?" If not — drop, silently, in silicon. The kernel only sees frames addressed to it.
(Remember that rule; it's why sniffing needs special modes, and why Chapter 3's ARP trick
works at all.)

## Prove it to yourself

**1. Meet your hardware identity:**

```sh
ip link show wlan0    # or eth0 — find the "link/ether" line. That's your MAC.
```

**2. Catch live frames** — `-e` shows link-layer headers, which is exactly this chapter:

```sh
sudo tcpdump -e -n -c 5 not ip6
# 18:42:01.123456 aa:bb:cc:11:22:33 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806)...
# 18:42:01.124001 dc:ef:09:ab:cd:12 > aa:bb:cc:11:22:33, ethertype IPv4 (0x0800)...
```

Read one line out loud: *"sender MAC, arrow, destination MAC, carrying IPv4"*. You just
read a frame with human eyes. `tcpdump` is `cat` for the wire (Chapter 5 of the Linux
course strikes again).

**3. Watch the broadcast address** — `ff:ff:ff:ff:ff:ff` means "everyone on this street,
listen up". You'll see plenty; Chapter 3 explains why.

## The build: read frames with your own hands

A raw socket of type `AF_PACKET` hands you complete frames. This ~35-line program is your
own personal `tcpdump`:

```c
// sniffer.c — gcc -o sniffer sniffer.c && sudo ./sniffer wlan0
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <linux/if_ether.h>
#include <net/if.h>
#include <sys/socket.h>

int main(int argc, char **argv) {
    int fd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));  /* every frame */

    struct ifreq ifr;
    snprintf(ifr.ifr_name, sizeof(ifr.ifr_name), "%s", argc > 1 ? argv[1] : "eth0");
    setsockopt(fd, SOL_SOCKET, SO_BINDTODEVICE, &ifr, sizeof(ifr));  /* on one NIC */

    unsigned char buf[2048];
    for (int i = 0; i < 10; i++) {
        ssize_t n = read(fd, buf, sizeof(buf));
        if (n < 14) continue;                       /* shorter than a header: not ethernet */

        unsigned char *dst = buf, *src = buf + 6;
        unsigned short type = (buf[12] << 8) | buf[13];
        printf("frame %zd bytes  %02x:%02x:%02x:%02x:%02x:%02x -> %02x:%02x:%02x:%02x:%02x:%02x  type=0x%04x\n",
               n,
               dst[0], dst[1], dst[2], dst[3], dst[4], dst[5],
               src[0], src[1], src[2], src[3], src[4], src[5], type);
    }
    return 0;
}
```

Run it while browsing the web. Every line is a frame you *personally* decoded — dst, src,
type. No library knows more about the wire than you now do.

## What you now know

- The bottom of the internet is the **Ethernet frame**: MACs, a type byte, a payload, a CRC.
- **MACs are local** — next-hop labels, not identities; the NIC drops frames not for you.
- The **type field** is the dispatch that hands your payload up to IP or ARP.
- You wrote your own sniffer — `tcpdump` is now a colleague, not an oracle.

Next: inside that payload lives the protocol that holds the internet together — and its
central promise is *none at all*. Meet IP.
