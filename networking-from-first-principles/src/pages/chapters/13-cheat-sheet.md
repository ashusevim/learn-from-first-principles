---
layout: ../../layouts/Chapter.astro
title: 'Cheat Sheet: Networking on One Page'
description: 'Frames, IP, TCP, DNS and TLS on one page — the model, the byte layouts, the state machine, and the tools that read them.'
part: 'Part V — Practice & Reference'
written: true
---

The whole course is one stack of envelopes: **each layer adds a header, each
header answers one question** — who (Ethernet/MAC, ARP), where (IP), reliably
how (TCP), what name (DNS), what meaning (HTTP), secretly (TLS). The layouts,
the state machine, and the tools that read the wire.

## The one-page model

```text
  frame [MAC dst|src] → IP [src|dst|proto] → TCP [ports|seq|ack|flags] → TLS → HTTP
  Ch 1–3                  Ch 2                  Ch 4–6                    Ch 10   Ch 9
```

Your `ping` from Chapter 12 skips TCP entirely — ICMP echo over raw IP — which
is why it fits in one screen: no ports, no handshake, no retransmission. Every
byte you add back buys a feature and a state to debug.

## The networking you actually use

| Name | Meaning | Chapter |
|---|---|---|
| Ethernet frame | MAC dst/src + ethertype: the local envelope | 1 |
| ARP request/reply | "who has this IP?" — asked of the whole room | 3 |
| IPv4 header (20 B) | src, dst, proto, TTL: forwarding's whole input | 2 |
| TTL decrement | each router subtracts one; zero means die + ICMP back | 2, 11 |
| TCP 3-way handshake | SYN → SYN-ACK → ACK: seq numbers agreed | 4 |
| seq/ack numbers | bytes counted, receipts expected, gaps retransmitted | 5 |
| FIN + the strange states | TIME_WAIT protects the next connection's past | 6 |
| socket (`AF_INET`, `SOCK_STREAM`) | the kernel's side: bind, listen, accept, send | 7 |
| raw socket (`SOCK_RAW`) | your Chapter 12 superpower: headers you build | 7, 12 |
| DNS A/AAAA + CNAME | names to addresses, cached all the way down | 8 |
| HTTP request line + headers | text over TCP — method, path, version, then meaning | 9 |
| TLS handshake | identities checked, session keys agreed, then hidden | 10 |
| NAT table entry | your private (ip,port) ↔ the world's (ip,port) | 11 |
| `traceroute` hops | TTLs expiring on purpose, one router at a time | 11 |
| ICMP echo (type 8/0) + checksum | the ping: identifier, sequence, echoed payload | 12 |

## The pitfalls, and the chapter that explains each

| Pitfall | What actually breaks | Chapter |
|---|---|---|
| Forgetting ARP | the frame has nowhere to go — IP without MAC is a letter without a door | Chapter 3 |
| Checksum over the wrong bytes | silent drops: receivers discard, nobody tells you | Chapters 2, 12 |
| Assuming ordered delivery | TCP reorders by design; your parser must buffer | Chapter 5 |
| Closing without TIME_WAIT | old duplicates poison the next same-port connection | Chapter 6 |
| Blocking `accept` in the main loop | one slow client stalls every client | Chapter 7 |
| DNS cached "forever" | migrations invisible until the TTL you set expires | Chapter 8 |
| HTTP without Content-Length discipline | the framing lies; pipelining desyncs | Chapter 9 |
| TLS without hostname verification | encrypted to *someone* — the MITM sends regards | Chapter 10 |
| NAT + protocols that embed addresses | FTP-style payloads disagree with the rewritten header | Chapter 11 |
| Identifier collisions in ping | two terminals' replies cross — sequence sorts it | Chapter 12 |

## When to use what

| You need | Reach for | Unless |
|---|---|---|
| "Are you alive?" | ICMP echo — no ports, no handshake | a firewall eats ICMP — then TCP SYN to 80/443 (Ch 12) |
| Reliable bytes | TCP: handshake, seq/ack, retransmit | latency beats loss — UDP + your own repair (Ch 4–5) |
| A name for an address | DNS, respecting TTLs you chose | it never changes — `/etc/hosts` is honest (Ch 8) |
| Secrets on the wire | TLS with verified hostnames | a trusted LAN with nothing secret — plain, knowingly (Ch 10) |
| Past one public IP | NAT + port forwarding, documented | inbound must just work — a real address (Ch 11) |
| The path packets take | `traceroute` + TTL reasoning | the routers hide — then infer from RTT steps (Ch 11) |

## Prove it to yourself

**1. The checksum is ones'-complement:**

```python
import struct
def cksum(data):
    s = sum(struct.unpack(f"!{len(data)//2}H", data))
    s = (s >> 16) + (s & 0xFFFF)
    return ~s & 0xFFFF          # your Chapter 12 function, verbatim shape
print(hex(cksum(b"\x08\x00\x00\x00\x00\x01\x00\x01")))  # nonzero header → nonzero sum
```

**2. DNS is a cache with a wire behind it:**

```sh
dig +stats example.com | grep -E 'Query time|SERVER'   # first: milliseconds, real server
dig +stats example.com | grep -E 'Query time'          # second: ~0 msec — the cache answered
```

**3. Your ping owns its bytes:**

```sh
sudo python3 myping.py 127.0.0.1        # identifier = your PID, sequence climbs
tcpdump -n -i lo icmp 2>/dev/null       # type 8 out, type 0 back — the whole dialogue
```

## What you now know

- **Headers are questions answered in order:** who, where, reliably-how,
  what-named, what-meant, secretly — skip one and debug it later.
- **TCP's state machine is the price of reliability:** handshakes, numbers,
  waits — every "strange state" protects a real past (Ch 4–6).
- **The wire is readable:** raw sockets, `tcpdump`, and `traceroute` turn
  "the network" into bytes you can quote (Ch 7, 11, 12).
- Encryption without verification is postage to strangers (Ch 10).

Next: twelve labs that interrogate the wire — forge packets, lose them on
purpose, and watch every layer above react exactly as this page predicts.
