---
layout: ../../layouts/Chapter.astro
title: 'Container Networking: veth, docker0, NAT'
description: 'How a container packet reaches the internet — and why -p 8080:80 is an nftables rule. Build: trace a packet hop by hop.'
part: 'Part III — The Ecosystem'
written: true
---

Chapter 4 built a private internet and wired it out with veth pairs, a bridge, and
MASQUERADE — `docker0` from primitives. Now the production version, traced live: how a
packet leaves a container, what `-p 8080:80` actually writes, and why `docker port`
looks like magic but is one nftables rule you can read. The networking course's
chapters 2, 6, and 11 all report for duty.

## The lie you were told

> "Docker has its own networking technology."

It's three primitives you already know, arranged:

```text
container eth0 ◄──veth pair──► host veth ──► docker0 bridge ──► host eth0 ──► internet
                                (172.17.0.1)     (NAT/MASQUERADE out)
inbound -p 8080:80:  DNAT rule: host:8080 → 172.17.0.2:80      (one nftables/iptables rule)
```

- **veth pair**: the patch cable per container (Chapter 4).
- **docker0 bridge**: the switch all container cables plug into; the host's side door.
- **NAT**: outbound gets MASQUERADEd (rewritten to the host IP — databases course,
  Chapter 11); published ports get DNAT (rewritten to the container).

## A packet's journey, checkpoint by checkpoint

Container → internet (`curl example.com` from inside):

```text
1. container: app writes to socket fd (Linux course Ch 11: sockets are fds)
2. container ns: route lookup → default via 172.17.0.1 (docker0)
3. veth pair: frame pops out on the host side
4. docker0 bridge: forwards to... the host's own stack (dst is external)
5. postrouting NAT: MASQUERADE — src 172.17.0.2 → host's public IP, port rewritten
6. host route: out eth0 to the internet
   (return traffic: conntrack table knows the mapping — databases course Ch 11)
```

Internet → published port (`curl host:8080`):

```text
1. packet arrives at host :8080
2. prerouting DNAT: dst host:8080 → 172.17.0.2:80     ← the -p flag's fingerprint
3. forwarded to docker0 → veth → container ns
4. container's app receives it as if addressed to it directly
```

## Prove it to yourself

**1. The container's private world:**

```sh
docker run -d --name netprobe alpine sleep 300
docker exec netprobe ip addr        # eth0@if... — a veth end, 172.17.0.2/16
docker exec netprobe ip route       # default via 172.17.0.1 — docker0 is the router
```

**2. Both cable ends, matched** (Chapter 4's `@if` indices):

```sh
ip link | grep veth                 # vethXXXX@ifN on the host
docker exec netprobe ip link        # eth0@ifN — same N: one patch cable, two ends
```

**3. Find the -p rule in the wild:**

```sh
docker run -d --name published -p 8080:80 nginx 2>/dev/null || \
  docker run -d --name published -p 8080:80 alpine sleep 300
sudo nft list ruleset | grep 8080        # or: sudo iptables -t nat -L DOCKER -n
# ... dport 8080 → dnat 172.17.0.2:80   ← THERE. "Port publishing" = one DNAT line.
```

## The build: trace a container packet, hop by hop

```sh
#!/bin/sh
# trace.sh — follow one ping from container to internet through every checkpoint
set -e
docker rm -f tracer 2>/dev/null || true
docker run -d --name tracer --cap-add=NET_RAW alpine sleep 300

echo "── 1. inside the container: the socket's route ──"
docker exec tracer ip route                    # default via 172.17.0.1

echo "── 2. the veth pair ──"
docker exec tracer ip link show eth0           # eth0@ifN
ip link | grep "veth.*@if.*:" | head -2        # host end, matching index

echo "── 3. docker0 sees the frame ──"
sudo tcpdump -i docker0 -n -c 2 icmp & TP=$!
docker exec tracer ping -c2 8.8.8.8 >/dev/null; sleep 1; kill $TP 2>/dev/null || true
# (frames on docker0: 172.17.0.2 > 8.8.8.8)

echo "── 4. NAT rewrites on the way up ──"
sudo tcpdump -i any -n -c 2 'icmp and host 8.8.8.8' & TP=$!
docker exec tracer ping -c2 8.8.8.8 >/dev/null; sleep 1; kill $TP 2>/dev/null || true
# on eth0 the SOURCE is now the host IP (MASQUERADE did its job — databases Ch 11)

echo "── 5. conntrack remembers ──"
sudo conntrack -L 2>/dev/null | grep icmp | head -1 || \
  echo "(install conntrack to see the mapping table: 172.17.0.2 ↔ host-IP:port)"
docker rm -f tracer >/dev/null
```

Five checkpoints, every one a kernel structure you've already met: routes (Linux Ch
11), veth (this course Ch 4), a bridge, NAT (databases Ch 11), conntrack. The "magic"
of Docker networking decomposes completely.

## What you now know

- Container networking = **veth + bridge + NAT** — no new technology, just the
  networking course's chapters arranged for isolation.
- **-p 8080:80 is a DNAT rule** — findable with `nft list ruleset`, deletable, breakable.
- Outbound and inbound are mirror images: MASQUERADE out, DNAT in, conntrack remembering.
- Kubernetes networking (CNI plugins) layers overlay/encryption choices on top of these
  same primitives — the vocabulary transfers one-to-one.

Next: the last userland mystery — where container writes go when they die. Volumes,
layers, and the filesystem contract that decides what survives.
