---
layout: ../../layouts/Chapter.astro
title: 'Final Boss: ping, from Scratch'
description: 'ICMP echo, raw sockets, and checksums you compute yourself. The course ends with you owning ping.'
part: 'Part IV — The Real World'
written: true
---

The finale. Twelve chapters ago, a packet was a cloud-diagram arrow. Now you'll write the
most famous utility in networking — **ping** — from raw bytes up: your own ICMP header,
your own checksum, your own RTT clock. No libraries beyond the socket API. When it works,
you'll have personally implemented every layer this course walked: frames, IP, ARP, and a
protocol of your own riding on top.

## The lie you were told

> "ping is a utility that comes with the OS."

ping is a ~70-line C program (once you know the protocol), doing something wonderfully
simple: **ask "are you alive?", count until the answer comes back.** The ICMP echo message
it uses is the *only* part of TCP/IP designed to be chatty — the one sanctioned way to say
"hello, machine?" with no port, no service, no application. That's why ping is the first
thing everyone reaches for: it tests the stack *below* all applications.

## ICMP: IP's control channel

IP (Chapter 2) carries a `protocol` number in every header — 6 for TCP, 17 for UDP... and
**1 for ICMP**, the protocol whose job is *errors and echoes*: destination unreachable
(Ch 6's RST's network cousin), time exceeded (Ch 11's traceroute!), and our two:

```text
ICMP echo (type 8 = request, type 0 = reply)
┌────────┬──────┬───────────────┬─────────────┬───────────────┬──────────────┐
│ type   │ code │ checksum (16) │ identifier  │ sequence (16) │ your payload │
│ 1 byte │ 1 B  │ over the rest │ (16)        │               │ (anything)   │
└────────┴──────┴───────────────┴─────────────┴───────────────┴──────────────┘
```

- **identifier** — which ping process (so two terminals' pings don't steal each other's replies)
- **sequence** — which echo of that process (so you know what was lost)
- **your payload** — many pings embed a timestamp; the reply must echo it byte-for-byte

The reply *copies your header back* with type flipped to 0 — the network literally answers
your exact question.

## The checksum, one last time

Chapter 2's ones'-complement sum, now over the ICMP message. You compute it *before* send;
the remote NIC/kernel/peer verifies it; the reply carries its own. Third protocol, same
arithmetic — that's not lazy design, that's **one checksum to learn them all**.

## Prove it to yourself (the course in one capture)

```sh
sudo tcpdump -n -v -c 4 icmp &
ping -c2 8.8.8.8
# ICMP echo request, id 12, seq 1, length 64     ← yours, hand-numbered (soon: literally)
# ICMP echo reply, id 12, seq 1, length 64       ← the mirror, from 12 routers away
```

Match the `id` and `seq` — that identifier bookkeeping is *yours to implement* below.
(And when you see "Destination unreachable": Chapter 2's honesty, delivered by ICMP.)

## The build: your own ping

Every piece is from this course: raw socket (Ch 1), IP addressing (Ch 2), checksum (Ch 2),
sequence bookkeeping (Ch 4–5), RTT (your own clock). **~70 lines, no libraries:**

```c
/* myping.c — gcc -o myping myping.c && sudo ./myping 8.8.8.8 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <sys/socket.h>
#include <time.h>

unsigned short cksum(unsigned short *p, int n) {        /* Ch 2, third appearance */
    long s = 0;
    for (int i = 0; i < n / 2; i++) s += *p++;
    while (s >> 16) s = (s & 0xffff) + (s >> 16);
    return ~s;                       /* (odd byte counts: pad — your warm-up exercise) */
}

int main(int argc, char **argv) {
    if (argc < 2) { fprintf(stderr, "usage: %s <host>\n", argv[0]); return 1; }

    int fd = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);   /* raw: WE write the ICMP header */
    struct sockaddr_in dst = {0};
    dst.sin_family = AF_INET;
    inet_pton(AF_INET, argv[1], &dst.sin_addr);

    for (int seq = 1; seq <= 4; seq++) {
        char pkt[64] = {0};
        struct icmphdr *icmp = (struct icmphdr *)pkt;
        icmp->type = ICMP_ECHO;                          /* type 8: "are you alive?" */
        icmp->code = 0;
        icmp->un.echo.id = htons(0xF00D);                /* our identifier */
        icmp->un.echo.sequence = htons(seq);             /* our counter */
        strcpy(pkt + 8, "first-principles");             /* the payload, echoed back */
        icmp->checksum = 0;
        icmp->checksum = cksum((unsigned short *)icmp, 64);  /* over type+code+id+seq+data */

        struct timespec t0;  clock_gettime(CLOCK_MONOTONIC, &t0);
        sendto(fd, pkt, 64, 0, (struct sockaddr *)&dst, sizeof dst);

        char buf[512];
        struct sockaddr_in from;  socklen_t flen = sizeof from;
        if (recvfrom(fd, buf, sizeof buf, 0, (struct sockaddr *)&from, &flen) < 0)
            continue;                                    /* timeout — packet died (Ch 2!) */

        /* the kernel gives us the full IP packet: skip its header, meet our echo */
        struct iphdr *ip = (struct iphdr *)buf;
        struct icmphdr *ricmp = (struct icmphdr *)(buf + ip->ihl * 4);
        if (ricmp->type != ICMP_ECHOREPLY ||
            ricmp->un.echo.id != htons(0xF00D) ||
            ricmp->un.echo.sequence != htons(seq))
            continue;                                    /* someone else's echo — ignore */

        struct timespec t1;  clock_gettime(CLOCK_MONOTONIC, &t1);
        double ms = (t1.tv_sec - t0.tv_sec) * 1e3 + (t1.tv_nsec - t0.tv_nsec) / 1e6;
        printf("seq=%d  ttl=%d  time=%.1f ms  from %s\n",
               seq, ip->ttl, ms, inet_ntoa(from.sin_addr));
        sleep(1);
    }
    return 0;
}
```

```sh
sudo ./myping 8.8.8.8
# seq=1  ttl=116  time=11.2 ms  from 8.8.8.8
# seq=2  ttl=116  time=10.8 ms  from 8.8.8.8
```

Compare side by side with the real `ping 8.8.8.8`: same ttl, same times, same answers —
because it's the same protocol. Yours just knows why.

## Where you are now

Twelve chapters ago, the internet was a cloud. Now you can: read frames (Ch 1), explain why
IP promises nothing (Ch 2), shout ARP (Ch 3), perform TCP's handshake byte by byte (Ch 4),
predict ACKs and retransmissions (Ch 5), diagnose teardown states (Ch 6), size a server's
queues (Ch 7), climb DNS's tree yourself (Ch 8), serve HTTP with no libraries (Ch 9),
watch TLS hide everyone (Ch 10), explain NAT's masquerade (Ch 11) — and now you own ping.

The stack was never magic. It was twelve small ideas, stacked in order, and you built every
layer's toy version with your own hands.

**Where to go next:** read RFC 791/793/1035/8443 — you'll be shocked how readable they are
now. Run tcpdump during your normal work and narrate the packets. And when you're ready,
the First Principles Project continues: **Linux** shows you the kernel this all runs on;
**Git** and **Databases** are next in line to lose their magic.
