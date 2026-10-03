---
layout: ../../layouts/Chapter.astro
title: 'Network Namespaces: A Private Internet'
description: 'A container with no network is safe and useless — veth pairs wire two private internets together. Build: your own docker0 bridge.'
part: 'Part I — The Kernel Foundation'
written: true
---

Three walls down (process tree, mounts) and one remains: the network. A **network
namespace** is a private internet in a box — its own interfaces, routes, firewall rules,
even its own loopback. But an isolated container is useless, so the interesting question
is *connection*: how do two private internets talk? The answer — a **veth pair** (a
virtual patch cable) and a **bridge** — is exactly how `docker0` works, and this chapter
builds it from raw `ip` commands.

## The lie you were told

> "Containers share the host's network stack."

Each network namespace has **everything**: interfaces, IP addresses, routing tables,
ARP caches, nftables rules, even a private loopback (`lo` — which is *down* in a fresh
namespace; `ping 127.0.0.1` fails until you up it, a rite of passage). A brand-new
namespace is a machine with no cables. Connection is explicit:

```text
┌── host ns ──────────────────────────────┐
│  veth0 ──┐         ┌── veth1            │
│          ▼         ▼                    │
│       [ docker0 bridge: 172.17.0.1 ]    │
└─────────────────────────────────────────┘
veth pair = a virtual patch cable: whatever enters one end exits the other.
bridge    = a virtual switch: every container's cable plugs into it.
```

## The wiring diagram of docker0, built by hand

```sh
# 1. two private internets
sudo ip netns add red; sudo ip netns add blue

# 2. a patch cable, then plug one end into each namespace
sudo ip link add veth-red type veth peer name veth-blue
sudo ip link set veth-red netns red
sudo ip link set veth-blue netns blue

# 3. addresses + up (inside each namespace: its own lo, its own route table)
sudo ip netns exec red  ip addr add 172.30.0.2/24 dev veth-red
sudo ip netns exec red  ip link set veth-red up;  sudo ip netns exec red ip link set lo up
sudo ip netns exec blue ip addr add 172.30.0.3/24 dev veth-blue
sudo ip netns exec blue ip link set veth-blue up; sudo ip netns exec blue ip link set lo up

# 4. the conversation — one cable, two internets
sudo ip netns exec red ping -c2 172.30.0.3
```

That's a complete private network connecting exactly two machines. Docker does this per
container (veth-red → renamed `eth0` inside), then attaches the host ends to `docker0`
— which is just a bridge with more cables:

```sh
sudo ip link add docker0 type bridge; sudo ip addr add 172.17.0.1/24 dev docker0
# (per container: veth pair, host end attached: sudo ip link set veth-X master docker0)
```

## Prove it to yourself

**1. Total isolation, then the cable:**

```sh
sudo ip netns add isolated
sudo ip netns exec isolated ping -c1 127.0.0.1   # fails: lo is DOWN in there
sudo ip netns exec isolated ip link set lo up
sudo ip netns exec isolated ping -c1 127.0.0.1   # works: private loopback, up
sudo ip netns exec isolated ping -c1 8.8.8.8     # fails: no routes, no cables. A whole
                                                  # internet, dark until you wire it.
```

**2. See both ends of the cable** — one veth, two namespaces, linked by `@if`:

```sh
sudo ip netns exec red ip link     # veth-red@if5   ← its pair is host ifindex 5
ip link | grep veth-blue           # veth-blue@if4  ← matching indices
```

**3. Routes are private too** — Chapter 11 of the Linux course, per-namespace:

```sh
sudo ip netns exec red  ip route   # 172.30.0.0/24 dev veth-red
sudo ip route                      # ...no 172.30 anywhere
```

## The build: container-to-internet, the missing pieces

Red and blue talk to each other but not to the internet. The remaining move is the
host-as-router: a bridge IP, default route via it, and **NAT** for the way out:

```sh
#!/bin/sh
# netlab.sh — docker0 rebuilt from primitives
set -e
sudo ip netns add red
sudo ip link add veth-red type veth peer name veth-host
sudo ip link set veth-red netns red
sudo ip link add br0 type bridge; sudo ip addr add 172.30.0.1/24 dev br0; sudo ip link set br0 up
sudo ip link set veth-host master br0; sudo ip link set veth-host up
sudo ip netns exec red ip addr add 172.30.0.2/24 dev veth-red
sudo ip netns exec red ip link set veth-red up
sudo ip netns exec red ip link set lo up
sudo ip netns exec red ip route add default via 172.30.0.1     # "the bridge is my router"
# the way OUT: NAT — rewrite 172.30.0.2 → host IP on the way up (Ch 11 of the DS... of
# the databases course Ch 11; networking course Ch 11 explained it):
sudo nft add table nat 2>/dev/null || true
sudo nft add chain nat postrouting '{ type nat hook postrouting priority 100; }' 2>/dev/null || true
sudo nft add rule nat postrouting ip saddr 172.30.0.0/24 masquerade
sudo sysctl -qw net.ipv4.ip_forward=1                          # host agrees to route
sudo ip netns exec red ping -c2 8.8.8.8 && echo "container reached the internet"
```

Every piece of `docker run -p` and Docker's "bridge networking" is in this script:
veth, bridge, default route, MASQUERADE. Port publishing (`-p 8080:80`) is the mirror
image — a DNAT rule sending host:8080 to 172.30.0.2:80 (Chapter 10 dissects it with
tcpdump).

## What you now know

- A network namespace = **private interfaces, routes, ARP, firewall, loopback** — a dark
  machine until wired.
- **veth pairs are patch cables; bridges are switches** — `docker0` is `ip link add
  bridge` plus one cable per container.
- Outbound internet = host as router + **MASQUERADE** (the databases course's NAT,
  re-cast for containers); `-p` publishing = the DNAT mirror image.
- You built docker0 from primitives — Docker's networking chapter is now your code review.

Next: the process tree, filesystem, and network are private — but the container can
still eat *all your RAM*. The fourth pillar doesn't hide anything: it rations. cgroups.
