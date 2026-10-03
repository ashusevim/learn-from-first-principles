---
layout: ../../layouts/Chapter.astro
title: 'NAT, Routers & the Edge of Your Street'
description: 'How packets leave home, what your router rewrites, and what traceroute’s stars actually mean.'
part: 'Part IV — The Real World'
written: true
---

Your laptop has the address `192.168.1.20`. So does the laptop in a café in Lisbon, and an
office in Osaka — `192.168.x.x` addresses are reused on millions of streets (they're
*private*, by RFC 1918). The internet has ~4 billion IPv4 addresses and tens of billions of
devices. The trick that makes this work — the trick your router performs on **every single
packet you send** — is NAT. And it explains the weirdest fact of home networking: *the
internet can't reach you*.

## The lie you were told

> "My router connects me to the internet."

Your router **masquerades as you**. It doesn't forward your packets — it *rewrites* them:
your private source address is swapped for the router's *public* IP, and a port number is
swapped for a fresh one of the router's choosing. Every connection you make appears — to
the entire internet — to come from the router itself.

## The masquerade, packet by packet

```text
you:         192.168.1.20:51882  →  93.184.216.34:80
router out:  203.0.113.7:40001   →  93.184.216.34:80     [table: 40001 ↔ you:51882]
reply in:    93.184.216.34:80    →  203.0.113.7:40001    [lookup!]
router in:   93.184.216.34:80    →  192.168.1.20:51882   ← delivered to your laptop
```

The router keeps a **connection-tracking table** (Chapter 6's states, weaponized): every
outgoing flow gets an entry, every reply gets looked up, rewritten back, and delivered.
When the entry expires (TCP FIN/RST, or a UDP timeout) — the door closes.

Now the punchline: **inbound connections have no table entry**. The internet cannot open a
connection to your laptop — there is no mapping until *you* speak first. That's why your
home server needs "port forwarding" (a manual, permanent table entry) and why your seedbox
needs UPnP (asking the router to make one). NAT is simultaneously the address crisis's
life-support machine and the internet's largest accidental firewall.

## Prove it to yourself

**1. Watch your address change worlds:**

```sh
ip -4 addr show wlan0 | grep inet       # your street address: 192.168.1.20
curl -s https://ifconfig.me; echo       # the world's view of you: 203.0.113.7 (say)
```

Different! That difference *is* NAT. The second address is your router's public face —
shared with every device in the house.

**2. Decide like a router** — which exit for this destination?

```sh
ip route get 8.8.8.8        # "via 192.168.1.1 dev wlan0" — the routing decision, on demand
ip route get 192.168.1.1    # no "via" — same street, deliver directly (Ch 2's /24 math)
```

**3. Read the masquerade rules** (if you run Linux as a router, or Docker — which NATs
containers the same way):

```sh
sudo nft list ruleset 2>/dev/null | grep -i masquerade | head
```

## The build: traceroute, demystified then rebuilt

`traceroute` is Chapter 2's TTL turned into an instrument: send with TTL=1 → first router
kills it and returns ICMP "time exceeded" (its address!). TTL=2 → second router. And so on
— the path draws itself out of error messages.

```sh
#!/bin/sh
# mytrace.sh — a traceroute in 8 lines, using ping's TTL knob
for ttl in $(seq 1 15); do
    ping -t $ttl -c1 -W1 8.8.8.8 2>/dev/null | \
        grep -E '^From|time=' | head -1 | sed "s/^/ttl=$ttl /"
done
```

Every line is a router on your path — each one *admitting it killed your packet*, which is
the only way it ever introduces itself. The **stars** (`* * *` in real traceroute) are
routers that drop or rate-limit ICMP replies: not dead, just unsociable. And if you're
behind NAT wondering why hop 1 is your router's `192.168.1.1` — you already knew: it's the
first rewrite, the first handoff, the edge of your street.

## What you now know

- **NAT rewrites every outbound packet** and tracks the return trip in a state table.
- Private RFC 1918 addresses are reused everywhere; your public IP is shared by your street.
- The internet **cannot initiate** connections to you — no table entry, no path in.
- traceroute = TTL weaponized; stars = routers declining to reply, not the path breaking.

Next, the finale: one protocol, one checksum, ~70 lines of C — and you will own the most
famous utility in networking. **ping, from scratch.**
