---
layout: ../../layouts/Chapter.astro
title: 'ARP: Asking the Whole Room'
description: 'Who has 192.168.1.1? Broadcasts, caches, and spoofing. Build: your own ARP scanner.'
part: 'Part I — Wires and Frames'
written: true
---

Here's a gap nobody mentions: IP addresses are *logical*, MAC addresses are *physical*, and
neither knows anything about the other. Your kernel knows it should deliver a packet to
`192.168.1.1`, and it knows frames travel to MAC addresses. Who connects the two worlds?
**ARP** — and it does it the hilariously blunt way: by shouting to every machine in the
building at once.

## The lie you were told

> "The network figures out where machines are."

Nobody "figures out" anything on your street. Machines **yell**: *"WHO HAS IP
192.168.1.1? TELL 192.168.1.20!"* — broadcast to literally every NIC on the segment. The
machine that owns the IP whispers back, point to point: *"I do, here's my MAC."* Your
kernel writes the answer in a little black book and never asks again (for a while).

## The exchange, frame by frame

Using Chapter 1's envelope: an ARP request is a frame to `ff:ff:ff:ff:ff:ff` (broadcast)
with ethertype `0x0806`, containing four fields that make it a question:

```text
sender MAC: aa:bb:cc:11:22:33   sender IP: 192.168.1.20
target IP:  192.168.1.1         target MAC: 00:00:00:00:00:00  ← "unknown — this is the question"
```

The reply flips it: target fields become the answer. Two frames. That's the whole protocol —
it fits on an index card, which is why it's also trivially abused: **anyone can answer
anyone's question** (see "spoofing" below).

## The cache: the black book

Asking every time would flood the street, so answers are cached with a lifetime:

```sh
ip neigh show
# 192.168.1.1 dev wlan0 lladdr a4:2b:8c:xx:xx:xx REACHABLE
# 192.168.1.45 dev wlan0  FAILED          ← asked once, nobody answered: no such machine
```

`REACHABLE` → `STALE` → (re-verify) is the state machine your kernel runs for every
neighbor, silently, thousands of times a day.

## Spoofing, in one paragraph (defensively)

Because ARP trusts *any* reply with no verification, a machine can say "I'm 192.168.1.1"
and become a man-in-the-middle — the classic **ARP spoofing** attack. Defenses exist
(DAI on switches, static entries), and the lesson is bigger than security: **ARP has no
authentication because in 1982 nobody imagined a hostile living room**. Protocols carry
their era's assumptions with them forever.

## Prove it to yourself

**1. Ask, then check the black book:**

```sh
ping -c1 192.168.1.1 >/dev/null && ip neigh show
```

**2. Watch the shouting itself:**

```sh
sudo tcpdump -n -e -c 4 arp
# arp who-has 192.168.1.1? tell 192.168.1.20     ← broadcast frame
# arp reply 192.168.1.1 is-at a4:2b:8c:xx:xx:xx  ← unicast answer
```

**3. See the cache expire** — `ip neigh show` again 30 seconds later: your router went
from `REACHABLE` to `STALE` without any traffic. The kernel is already planning to re-ask.

## The build: an ARP scanner

Ping every address on the street in parallel, then read what the kernel's cache learned —
that's what `arp-scan`/`nmap -sn` do under the hood:

```sh
#!/bin/sh
# arp-scan.sh — ask the whole street who exists, then read the receipts
for i in $(seq 1 254); do
    ping -c1 -W1 192.168.1.$i >/dev/null 2>&1 &    # each ping ARPs its target
done
wait
ip neigh show | grep -v FAILED
```

Every line of output is a machine that *voluntarily answered a broadcast*. Run `tcpdump
arp` alongside it and you'll see the whole conversation your little scanner triggered —
hundreds of shouts, hundreds of whispers. That's your network's population census, and you
understood every frame of it.

## What you now know

- **ARP = broadcast question, unicast answer, cached in `ip neigh`.**
- Frames need MACs; ARP is the bridge from IP to MAC — no shouting, no delivery.
- It has **zero authentication** — which is both why it's simple and why it's spoofable.
- Next time "the network is down", check `ip neigh`: no neighbors answered = it's the street.

Next: with addressing (IP) and delivery-to-hardware (ARP) solved, we can finally build the
protocol you've heard of most — TCP. And you will perform its famous handshake *by hand*.
