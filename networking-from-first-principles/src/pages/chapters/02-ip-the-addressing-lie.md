---
layout: ../../layouts/Chapter.astro
title: 'IP: The Addressing Lie'
description: 'Packets, fragmentation, TTL, and why IP is unreliable by design. Build: craft raw IP packets by hand.'
part: 'Part I — Wires and Frames'
written: true
---

IP — the "Internet Protocol" — is the layer that lets any machine on Earth address any
other. And the most important thing about it is a promise it *never made*: IP guarantees
**nothing**. No delivery, no ordering, no duplicate protection. Packets get dropped,
duplicated, and arrive out of order — constantly. This isn't a flaw. It's the design that
lets a packet protocol survive chaos, and everything reliable built on top of it (yes,
TCP) is simply *repairing IP's honesty*.

## The lie you were told

> "IP delivers your packets."

IP **attempts** delivery. "Best effort" isn't marketing fluff — it's the contract: the
network tries its best, owes you nothing, and tells you nothing when it fails. Every
retransmission, every ordering fix, every duplicate filter in your stack exists because IP
kept its promise to promise nothing.

## The IPv4 header, field by field

Twenty bytes of header before any payload:

```text
┌────────────────┬──────────────────┬──────────────────────────┐
│ ver(4) IHL(4)  │ TOS (1 byte)     │ total length (2 bytes)   │
├────────────────┬──────────────────┼──────────────────────────┤
│ identification │ flags + frag off │ TTL (1 byte)             │
├────────────────┴──────────────────┼───────────┬──────────────┤
│ protocol (1 byte)                 │ header checksum          │
├───────────────────────────────────┴───────────┴──────────────┤
│                source address (4 bytes)                      │
├──────────────────────────────────────────────────────────────┤
│              destination address (4 bytes)                   │
└──────────────────────────────────────────────────────────────┘
```

The fields that actually run the world:

- **TTL** — starts at 64 (or 128), *decremented by every router*. Hits 0 → packet dies, and
  the router sends back an ICMP "time exceeded" (Chapter 11 weaponizes this into traceroute).
  TTL is what keeps routing loops from melting the internet.
- **Protocol** — who unwraps the payload next: `1` = ICMP, `6` = TCP, `17` = UDP.
  Same dispatch trick as the frame's type field — layers all the way down.
- **Header checksum** — covers *only the header*, and must be recomputed at **every hop**,
  because TTL just changed. Data is not checksummed: layers above handle that.
- **Identification + flags + frag offset** — when a packet exceeds a link's MTU (~1500
  bytes), it's split into fragments and reassembled at the destination using these fields.

## Addresses: names for interfaces

An IPv4 address belongs to an *interface*, not a machine (Linux course, Chapter 11):
`192.168.1.20/24` means "address 192.168.1.20, and the first 24 bits are the street name".
The `/24` prefix is what lets your machine decide *in one step* whether a destination is
"same street, deliver directly" or "elsewhere, hand to the router" — that's the entire
magic of subnetting, and it's just binary mask math.

## Prove it to yourself

**1. Watch TTL shrink hop by hop:**

```sh
ping -c1 127.0.0.1 | grep ttl    # ttl=64 — no hops, you are the router
ping -c1 8.8.8.8    | grep ttl   # ttl=116 — 64-116 = the internet is 12 routers wide (ish)
```

**2. See the header fields live:**

```sh
sudo tcpdump -n -v -c 3 'icmp'
# ... id 1, ttl 64, length 84, IP 192.168.1.20 > 142.250.74.36: ICMP echo request
```

**3. The path itself, using TTL as a weapon:**

```sh
traceroute -n 8.8.8.8    # each line = one router whose TTL ran out
```

## The build: craft a packet by hand

No friendly library structs — we write the header **byte by byte**, including the
checksum. This is the packet, not a library's idea of it:

```c
// rawip.c — gcc -o rawip rawip.c && sudo ./rawip
#include <stdio.h>
#include <string.h>
#include <arpa/inet.h>
#include <netinet/ip.h>
#include <sys/socket.h>
#include <unistd.h>

unsigned short cksum(unsigned short *p, int words) {   /* ones' complement sum */
    long sum = 0;
    for (int i = 0; i < words; i++) sum += *p++;
    while (sum >> 16) sum = (sum & 0xffff) + (sum >> 16);
    return ~sum;
}

int main(void) {
    char pkt[60] = {0};
    struct iphdr *ip = (struct iphdr *)pkt;

    ip->version = 4;  ip->ihl = 5;                 /* 20-byte header, no options */
    ip->tot_len = htons(24);
    ip->ttl = 64;                                  /* the countdown begins */
    ip->protocol = 253;                            /* 253 = "experiment", harmless */
    ip->saddr = inet_addr("192.168.1.20");
    ip->daddr = inet_addr("192.168.1.1");
    ip->check = cksum((unsigned short *)ip, 10);   /* only after all fields are set! */

    memcpy(pkt + 20, "hi\n", 4);                   /* the payload: ours, all ours */

    int fd = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);
    struct sockaddr_in dst = {0};
    dst.sin_family = AF_INET;
    dst.sin_addr.s_addr = ip->daddr;
    sendto(fd, pkt, 24, 0, (struct sockaddr *)&dst, sizeof(dst));
    printf("sent a hand-built IP packet\n");
    return 0;
}
```

Run `sudo tcpdump -n -v 'host 192.168.1.1'` in another terminal while you send it, and
watch your own header appear in the parse — ttl 64, your fields, your payload. You are no
longer *using* IP. You are *speaking* it.

## What you now know

- IP is **unreliable on purpose**; reliability is upper layers repairing honesty.
- **TTL** kills looping packets (and powers traceroute); **protocol** dispatches the payload.
- The header checksum is recomputed at every hop; big packets get **fragmented**.
- You hand-built a header — the "mystical packet" is 20 bytes you can write.

Next: IP doesn't know about *hardware addresses*. Who bridges "IP 192.168.1.1" to a MAC?
Everyone, loudly, all the time. Meet ARP.
