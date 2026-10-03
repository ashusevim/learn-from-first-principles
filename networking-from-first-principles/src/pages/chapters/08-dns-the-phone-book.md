---
layout: ../../layouts/Chapter.astro
title: 'DNS: The Internet’s Phone Book'
description: 'Queries, root servers, recursion, caching. Build: a tiny resolver that talks to the root servers itself.'
part: 'Part III — Programs on Top'
written: true
---

Every connection your code makes started with a name — `example.com` — and no packet
anywhere on the internet knows what that means. Converting names to IP addresses is **DNS**,
and it's the largest distributed database humans have ever built, running on a protocol
from 1983, over UDP port 53, in packets you can read like postcards. You will end this
chapter by walking the entire hierarchy yourself — root servers included.

## The lie you were told

> "The DNS server looks up the address."

*Which* one? There are 13 root server identities (letters a–m, `a.root-servers.net` —
thousands of actual machines behind anycast), and the answer to "where's example.com" lives
at none of them. DNS resolution is a **treasure hunt across a hierarchy**, and your
"DNS server" is just a librarian who runs the errands for you. Today, you fire the librarian.

## The hierarchy (and why it can't be one server)

```text
.                     ← root: "who handles .com?"     → TLD servers
com                   ← TLD: "who handles example.com?" → the domain's nameservers
example.com           ← authoritative: "example.com is 93.184.216.34"
www.example.com       ← even the www is just another (configurable) answer
```

No single machine knows everything — each level only knows *who's next*. That's the genius:
the database is the tree, and every node only needs to know its children. It scales because
it's lazy.

## The packet: tiny and naked

A DNS query is a UDP datagram (usually — TCP for big answers) with:

```text
header:  ID (matching answers to questions!), flags (recursive? authoritative?)
question: www.example.com  → encoded as: 3www7example3com0  + type A ("give me an IPv4")
```

That `3www7example3com0` encoding — length-prefixed labels — is the whole format. Plain
text answers ride back in a matching response. **No encryption anywhere**: everyone between
you and the resolver can read (and forge) your lookups. DNS-over-HTTPS exists precisely
because this chapter's packets are postcards.

Caching makes it all fly: your OS caches, the resolver caches, and every answer carries a
**TTL** (yes, same idea as IP's TTL — a countdown, in seconds) saying how long it may live.

## Prove it to yourself

**1. Watch the whole treasure hunt** — `+trace` walks root → TLD → authoritative, live:

```sh
dig +trace www.wikipedia.org | tail -20
```

**2. See the postcards on the wire:**

```sh
sudo tcpdump -n port 53 &
curl -s http://example.com >/dev/null
# 192.168.1.20.41234 > 1.1.1.1.53: 41234+ A? example.com.     ← your question
# 1.1.1.1.53 > 192.168.1.20.41234: 41234 1/0/1 A 93.184.216.34 ← the answer, in plain sight
```

**3. Time the cache** — run `dig example.com` twice; the second is instant (compare
`Query time:`). That's caching you can *measure*.

## The build: walk the hierarchy yourself

Forget the resolver — this tiny Python speaks UDP to the **root servers directly**, asks
"who handles `.com`?", follows the referral, and returns the answer. Forty lines, no
libraries:

```python
# resolver.py — python3 resolver.py example.com
import struct, socket, sys

def query(server, name):
    """Hand-craft a DNS query packet: header + question. It's just bytes."""
    qid = 0x1234
    header = struct.pack(">HHHHHH", qid, 0x0100, 1, 0, 0, 0)   # 1 question, recurse ok
    question = b"".join(bytes([len(l)]) + l.encode()
                        for l in name.split(".")) + b"\x00"
    question += struct.pack(">HH", 1, 1)                        # type A, class IN
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(3)
    sock.sendto(header + question, (server, 53))
    data, _ = sock.recvfrom(1024)

    answers = struct.unpack(">H", data[6:8])[0]                 # ANCOUNT from header
    if answers == 0:
        return None, parse_referral(data)                       # "ask these servers instead"
    return parse_answer(data), None

def parse_referral(data):
    """No answer section? The authority section holds NS names & their glue IPs."""
    ips = [socket.inet_ntoa(data[i:i+4]) for i in range(len(data) - 4)]
    return [ip for ip in ips if ip.startswith(("192.", "170.", "199.", "192.5"))] or None

name = sys.argv[1]
server = "198.41.0.4"                                            # a.root-servers.net
for hop in range(6):                                             # follow the referral chain
    ip, referral = query(server, name)
    if ip:
        print(f"{name} -> {ip}   (after {hop} referral hops)")
        break
    if not referral:
        sys.exit("no answer")
    server = referral[0]
    print(f"hopping to {server} ...")
```

Run it: `python3 resolver.py example.com` and watch it hop — root, then TLD, then the
authoritative server — printing the IP after climbing the *entire internet's hierarchy*
with hand-built packets. You have now personally done what "the DNS server" does.

## What you now know

- DNS is a **lazy tree**: every level only knows who's next — that's why it scales.
- The wire format is tiny: **ID + flags + length-prefixed labels**, over UDP 53, unencrypted.
- **Caching with TTLs** at every layer is what keeps the whole thing standing.
- "The DNS server" is a librarian; you just did its job, root servers and all.

Next: with names resolved and connections established, your code wants to say something
HTTP-shaped. It turns out HTTP is just... text. With a blank line at the end.
