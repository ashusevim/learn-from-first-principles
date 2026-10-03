---
layout: ../../layouts/Chapter.astro
title: 'Labs: Prove It Yourself'
description: 'Twelve labs from raw frames to ping from Chapter 12 — handshakes, retransmits, sockets. Each is checkable by you alone.'
part: 'Part V — Practice & Reference'
written: true
---

Twelve labs, no grader: each ends in packets you capture yourself — with
`myping.py` / the Chapter 12 echo code, `tcpdump`, `dig`, and `traceroute`.
Nothing here is new: frames (Ch 1), IP (Ch 2), ARP (Ch 3), TCP (Ch 4–6),
sockets (Ch 7), DNS (Ch 8), TLS (Ch 10), NAT (Ch 11). What is new is *causing*
the traffic instead of reading about it.

## How the labs work

Every lab has **Goal**, **Do this**, **You'll know it works when**, and **Where
it comes from**. Root (or `NET_RAW`) is required for the raw-socket labs;
everything else runs as you.

| Tool | What it proves |
|---|---|
| `sudo python3 myping.py <target>` | your bytes, your checksum, your clock |
| `tcpdump -n -i <iface> icmp/tcp/arp` | the wire, quoted back at you |
| `dig +stats` / `traceroute -n` | caches and hops, measured |
| `python3 tcp_echo.py` (Ch 7) | the kernel's side of one connection |

## Warm-ups

**Lab 1.1 — Ping yourself**
**Goal:** the loopback round-trip as a baseline number.
**Do this:**
```sh
sudo python3 myping.py 127.0.0.1
```
**You'll know it works when:** four replies, RTT ≈ 0.0x ms, sequence 0–3, zero
loss. This number is the floor every later lab stands on — slower means the
network did something.
**Where it comes from:** Chapter 12 — Final Boss: ping, from Scratch.

**Lab 1.2 — Watch ARP ask the room**
**Goal:** the local question behind every first packet (Chapter 3).
**Do this:** clear the neighbor cache (`ip neigh flush all`), then in one shell
`tcpdump -n arp`, in another ping the gateway once.
**You'll know it works when:** a `who-has <gateway> tell <you>` appears *before*
the first echo request — resolution precedes transmission, on camera.
**Where it comes from:** Chapter 3 — ARP: Asking the Whole Room.

**Lab 1.3 — Break the checksum, get silence**
**Goal:** receivers discard bad checksums without telling you.
**Do this:** flip one bit in `myping.py`'s checksum before send, ping localhost
four times with `tcpdump` watching.
**You'll know it works when:** four requests out, zero replies back — and
`tcpdump` shows the requests leaving looking normal-ish. Silence *is* the error
message; the lab is learning to hear it.
**Where it comes from:** Chapters 2 and 12.

**Lab 2.1 — Shake hands, byte by byte**
**Goal:** the three-way handshake as three packets you can name (Chapter 4).
**Do this:** start `tcp_echo.py`, then `tcpdump -n -i lo tcp port 9007`, and in
a third shell connect once.
**You'll know it works when:** exactly `SYN`, `SYN-ACK`, `ACK` appear with
increasing sequence numbers — then your data, then `FIN` pairs on close. The
whole of Chapters 4–6 in one capture.
**Where it comes from:** Chapter 4 — The TCP Handshake, Byte by Byte.

**Lab 2.2 — Retransmission on a string**
**Goal:** TCP repairs loss; prove it by causing it.
**Do this:** easiest deterministic loss: unplug Wi-Fi / `sudo ip link set <iface> down`
for ~5 seconds mid-transfer of a 10 MB `scp` (or a long `curl`), then restore.
**You'll know it works when:** the transfer *completes* — with retransmit
timeouts visible in the timeline (`tcpdump` gaps + `ss -ti` retrans counters).
No error surfaced: that's the design working, priced in seconds.
**Where it comes from:** Chapter 5 — Data, ACKs & Retransmission.

**Lab 2.3 — TIME_WAIT, introduced**
**Goal:** the strange state is protection, not a leak (Chapter 6).
**Do this:** connect/disconnect to `tcp_echo.py` 50 times rapidly from one
client port range, then run `ss -tan | grep TIME-WAIT | wc -l`.
**You'll know it works when:** dozens of `TIME-WAIT` entries sit there for ~60s
and then vanish. Force a *new* connection to the same 4-tuple early and watch
it be refused or take a fresh port — the past is being protected.
**Where it comes from:** Chapter 6 — Teardown & the Strange States.

**Lab 2.4 — Read DNS TTLs off the wire**
**Goal:** caches expire on the schedule the record states (Chapter 8).
**Do this:**
```sh
dig +stats example.com | grep -E 'Query time|ANSWER'   # cold: real server
dig +stats example.com | grep 'Query time'             # warm: ~0 msec
```
Then `dig +noall +answer example.com` and read the TTL ticking down per query.
**You'll know it works when:** the first query costs milliseconds, the second
~0, and the answer's TTL counts down until the cache refills. You set TTLs in
production with this exact arithmetic.
**Where it comes from:** Chapter 8 — DNS: The Internet's Phone Book.

**Lab 2.5 — HTTP is text until TLS**
**Goal:** Chapter 9's claim: the request line is readable bytes.
**Do this:**
```sh
printf 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n' | nc example.com 80 | head -12
```
**You'll know it works when:** the response headers print in plain text —
`HTTP/1.1 200 OK`, `Content-Type`, and the body starts. Repeat against `:443`
and read nothing but noise: that difference is Chapter 10.
**Where it comes from:** Chapter 9 — HTTP Is Just Text (Until It Isn't).

## Stretch goals

**Lab 3.1 — The MITM in your own lab**
**Goal:** TLS without verification is theater (Chapter 10), demonstrated.
**Do this:** run a local proxy that accepts plaintext, forwards to the real
server, and logs everything — point a client that skips verification at it.
**You'll know it works when:** your log holds the whole "secret" conversation.
Then flip the client to verify hostnames and watch the handshake die. The
certificate check *is* the security; encryption alone bought nothing.
**Where it comes from:** Chapter 10 — TLS: The Handshake That Hides Everyone.

**Lab 3.2 — Trace your own path**
**Goal:** TTL math as a map (Chapter 11), on your own route.
**Do this:** `traceroute -n <public-ip>`, then re-run twice and diff the hops.
**You'll know it works when:** hop count matches TTL reasoning, star hops mark
routers that drop ICMP, and the two runs differ mid-path — routing is dynamic,
and now you have the receipts to say so.
**Where it comes from:** Chapter 11 — NAT, Routers & the Edge of Your Street.

## Self-checking without a grader

- **Packet labs** (1.1–1.3, 2.1, 2.4, 2.5): counts and types off `tcpdump` /
  `dig` — echo in/out, SYN/SYN-ACK/ACK, TTL countdown, readable headers. The
  capture is the grader.
- **Behavior labs** (2.2, 2.3): transfer completion under loss, TIME-WAIT
  counts that decay. Numbers with timestamps, not vibes.
- **Security labs** (3.1): the proxy log's contents vs the verified client's
  refusal. If the plaintext is in your log, the lesson landed.

## What you now know

- **Every layer is one question:** resolution, addressing, reliability,
  naming, meaning, secrecy — and each question has a header you can print.
- **Silence is the network's only error message** (Lab 1.3): bad checksums and
  missed ACKs look identical from the sender — capture, don't guess.
- **TCP's oddities are its features:** retransmission (Lab 2.2) and TIME-WAIT
  (Lab 2.3) are the design working, priced in seconds and ports.
- You own a ping that is ~70 lines and a checksum you can defend (Lab 1.3) —
  which means you own the concepts, not just the tool.

Next: point `tcpdump` at your own daily traffic for ten minutes and label every
packet by layer — anything you can't label is the next chapter to reread.
