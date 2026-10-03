---
layout: ../../layouts/Chapter.astro
title: 'The TCP Handshake, Byte by Byte'
description: 'SYN, SYN-ACK, ACK — sequence numbers, flags, and the checksum. The killer chapter: perform a full handshake with raw sockets.'
part: 'Part II — TCP from Raw Bytes'
written: true
---

Three packets. That's the entire ceremony your kernel performs millions of times — every
page load, every API call, every SSH — to conjure a "reliable connection" out of a network
that guarantees nothing (Chapter 2). This chapter you do it **yourself**: craft each packet
byte by byte, checksums and all, with no help from the kernel's TCP stack. After this, TCP
is not a subject you studied. It's a language you speak.

## The lie you were told

> "TCP opens a connection like a phone call."

There is no connection. There is no circuit. There are **two kernels agreeing on two
numbers** (initial sequence numbers) and remembering them. "The connection" is that shared
arithmetic — if both sides agree what byte 42 means, bytes flow reliably. Lose the state
(crash the process, reboot the machine) and the "connection" evaporates, because it never
existed anywhere except as agreed-upon numbers.

## The TCP header (the whole protocol)

Twenty bytes, sitting inside an IP packet's payload (Chapter 2's `protocol = 6`):

```text
┌────────────────────────┬────────────────────────┐
│     source port (16)   │     dest port (16)     │
├────────────────────────┴────────────────────────┤
│              sequence number (32)               │  ← "my bytes start here"
├─────────────────────────────────────────────────┤
│            acknowledgment number (32)           │  ← "I've received everything before this"
├──────┬─────────┬────────────────────────────────┤
│ off  │ flags   │        window (16)             │  ← SYN,ACK,FIN,RST,PSH… and flow control
├──────┴─────────┼────────────────────────────────┤
│   checksum     │      urgent pointer (16)       │
└────────────────┴────────────────────────────────┘
```

The insight that makes TCP *TCP*: **sequence numbers count bytes, not packets.** Every byte
sent is numbered; every ACK says "I have all bytes up to N". That single idea is why TCP
handles loss, reordering, and duplication (Chapters 2's chaos) for free: the receiver just
assembles bytes into their numbered slots.

## The handshake, narrated

Say the client picks ISN 1000, the server picks ISN 5000:

```text
1. client → server:  SYN,  seq=1000
   "I want to talk. My byte counter starts at 1000."

2. server → client:  SYN+ACK,  seq=5000, ack=1001
   "OK. Mine starts at 5000 — and I confirm your 1000; next byte you send is 1001."

3. client → server:  ACK,  seq=1001, ack=5001
   "Confirmed. We both exist. Data may now flow."
```

After this, both sides hold two numbers each: *what I've sent* and *what I've received*.
That's the entire state of a connection. (Note the SYN "consumed" one sequence number —
that's so a stale duplicate of packet 1 can never be mistaken for data.)

## The checksum's dirty secret

The TCP checksum is computed over the header + data **plus a pseudo-header** containing src
IP, dst IP, protocol, and length — so a packet routed to the wrong place fails its check.
It's still just a 16-bit ones' complement sum (Chapter 2's function, reused): weak, 1980s
technology — real integrity comes from TLS (Chapter 10), not this.

## Prove it to yourself

Watch a real handshake with absolute sequence numbers (`-S` disables relative display):

```sh
sudo tcpdump -n -S -c 3 'tcp port 80 & host example.com' &
curl -s http://example.com >/dev/null
# IP 192.168.1.20.51882 > 93.184.216.34.80: Flags [S], seq 2841009657
# IP 93.184.216.34.80 > 192.168.1.20.51882: Flags [S.], seq 1006553452, ack 2841009658
# IP 192.168.1.20.51882 > 93.184.216.34.80: Flags [.], ack 1006553453
```

There they are — packets 1, 2, 3, with `ack` always exactly `seq + 1`. You've read
hundreds of these in your life without seeing them.

## The build: the handshake, by hand

This program performs a complete handshake with a real server using **raw sockets** — the
kernel's TCP stack never learns this conversation happened:

```c
// syn.c — gcc -o syn syn.c && sudo ./syn 93.184.216.34 80
#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <netinet/ip.h>
#include <netinet/tcp.h>
#include <sys/socket.h>

unsigned short cksum(unsigned short *p, int n) {
    long s = 0;
    for (int i = 0; i < n; i++) s += *p++;
    while (s >> 16) s = (s & 0xffff) + (s >> 16);
    return ~s;
}

/* TCP checksum needs the IPs — the "pseudo-header" trick */
unsigned short tcp_cksum(struct iphdr ip, struct tcphdr tcp) {
    struct { unsigned s, d; char z, proto; unsigned short len; } pseudo;
    pseudo.s = ip.saddr; pseudo.d = ip.daddr;
    pseudo.z = 0; pseudo.proto = 6; pseudo.len = tcp.len;
    /* (sum pseudo + header in your ones'-complement function — see rawip.c, Ch 2) */
    return 0; /* layout above; assemble 12-byte pseudo + 20-byte header and cksum() it */
}

int main(int argc, char **argv) {
    unsigned int isn = (unsigned)time(NULL) % 100000;   /* our "random" ISN */

    char pkt[40] = {0};
    struct iphdr *ip = (struct iphdr *)pkt;
    struct tcphdr *tcp = (struct tcphdr *)(pkt + 20);

    /* --- packet 1: the SYN --- */
    ip->ihl = 5;  ip->version = 4;  ip->ttl = 64;  ip->protocol = 6;
    ip->tot_len = htons(40);
    ip->daddr = inet_addr(argv[1]);
    inet_pton(AF_INET, "192.168.1.20", &ip->saddr);    /* your actual source IP */

    tcp->source = htons(44444);                        /* our port — we are the kernel now */
    tcp->dest = htons(atoi(argv[2]));
    tcp->seq = htonl(isn);
    tcp->doff = 5;
    tcp->syn = 1;                                      /* the flag that starts everything */
    tcp->window = htons(65535);
    /* compute tcp_cksum and ip->check here, then: */

    int fd = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);
    int one = 1;
    setsockopt(fd, IPPROTO_IP, IP_HDRINCL, &one, sizeof(one));  /* *we* write the IP header */

    struct sockaddr_in dst = {0};
    dst.sin_family = AF_INET;
    dst.sin_addr.s_addr = ip->daddr;
    sendto(fd, pkt, 40, 0, (struct sockaddr *)&dst, sizeof(dst));
    printf("SYN sent (seq=%u) — run tcpdump in another terminal and watch it get answered\n", isn);

    /* --- reading packet 2 and crafting packet 3 is the homework that IS this course --- */
    return 0;
}
```

The full program continues: `recvfrom` the SYN+ACK, extract the server's ISN from
`tcp->seq`, check the `ack` matches `isn + 1`, then send packet 3 — an ACK with
`seq = isn+1`, `ack = server_isn + 1`. **Do it yourself with tcpdump open** — that loop
(read a packet, understand its fields, answer it) is the entire skill of this course. The
checksum helpers you already wrote in Chapter 2.

When your `tcpdump` shows your three packets indistinguishable from curl's, you have
performed the TCP handshake *as a protocol participant*, not a user.

## What you now know

- A "connection" is **two agreed sequence numbers** — nothing more.
- Seq/ack count **bytes**; SYN consumes one; the 3-way handshake is a mutual introduction.
- The checksum covers a **pseudo-header** so packets can't be misdelivered silently.
- You can speak TCP with raw sockets — the kernel's TCP stack is optional for the willing.

Next: the handshake opened the channel. Now: how bytes actually flow — ACKs, windows,
and what happens when the network eats a packet (it will).
