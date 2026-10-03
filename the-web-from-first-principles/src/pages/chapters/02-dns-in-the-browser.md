---
layout: ../../layouts/Chapter.astro
title: 'DNS in the Browser: Caches All the Way Down'
description: 'Browser cache → OS cache → resolver → authority, plus DoH. Build: time each layer and watch the cache hierarchy save you.'
part: 'Part I — The Pipe'
written: true
---

Chapter 1's trace gave DNS 12 milliseconds and moved on. Those milliseconds hide a
**four-layer cache hierarchy** that usually answers before any network packet leaves
your machine — and understanding it explains why "the site is slow for new users but
fine for me", why moving to a new resolver changes everything, and what DNS-over-HTTPS
is quietly relocating. This chapter times every layer.

## The lie you were told

> "Every page load does a DNS lookup."

Every page load **asks** for DNS. The lookup only *reaches the network* when all four
caches miss:

```text
① browser DNS cache      (per-browser, respects TTL, ~60s floor in Chrome)
② OS stub resolver cache (systemd-resolved / dnscache / macOS mDNSResponder)
③ recursive resolver     (your ISP's or 1.1.1.1/8.8.8.8 — caches for the world)
④ authority servers      (root → TLD → authoritative: the actual walk, Ch 8 of networking)
```

Layer ③ is the workhorse: it answers from cache for *every user of that resolver*,
which is why popular domains resolve in single-digit milliseconds worldwide. TTLs
(datasets course... the networking course's Chapter 8) control each layer's memory.

## DoH: the quiet relocation

Traditionally, step ③ speaks **plaintext UDP 53** — every hop between you and the
resolver reads your lookups (networking course, Chapter 8's postcards). **DNS-over-HTTPS**
tunnels the query through TLS on port 443: private from middlemen, indistinguishable
from your other traffic — but now concentrated *inside the browser* (or OS), bypassing
layer ② and your network's resolver. Faster in constrained networks (one multiplexed
h2 connection), slower in others (an extra TCP+TLS setup, Chapter 3's tax). A tradeoff,
not an upgrade.

## Prove it to yourself

**1. Time the hierarchy** — same domain, four vantage points:

```sh
domain=example.com
# cold walk to the authorities (bypasses resolver cache):
dig +trace +stats $domain | grep "Query time" | head -3
# warm recursive resolver:
dig $domain | grep "Query time"          # ~10ms (network to 1.1.1.1)
# OS cache / browser cache: not directly queryable — but measurable from the app side:
python3 - <<'EOF'
import socket, time
for i in range(3):
    t = time.time(); socket.getaddrinfo("$domain", 443)
    print(f"getaddrinfo #{i}: {(time.time()-t)*1000:.3f} ms")
# first call may hit the OS walk; later calls are cache hits at 0.0xx ms
EOF
```

Three orders of magnitude between a cold walk and a warm cache — the hierarchy's
entire value, measured.

**2. Watch TTL expiry bite:**

```sh
dig $domain | grep -E '^example\.com'    # note the TTL counting down each second
# when it hits 0, the next lookup re-walks (or at least re-asks layer ③)
```

**3. The browser's own cache, made visible:**

```text
chrome://net-internals/#dns     (or edge://net-internals)  — the live host cache,
with each entry's remaining TTL. Clear it, reload your site, and watch the
Network panel's "DNS Lookup" bar reappear (Chapter 1's waterfall, stage 3).
```

## The build: a mini resolver cache with honest TTLs

```python
# dncache.py — a resolver cache: TTL expiry + negative caching, the layer-③ model
import time

class DNSCache:
    def __init__(self):
        self.store = {}                     # name -> (expires_at, ips, or None)

    def put(self, name, ips, ttl):
        self.store[name] = (time.monotonic() + ttl, ips)

    def put_nx(self, name, ttl=30):         # NEGATIVE caching: "no such name" is cached
        self.store[name] = (time.monotonic() + ttl, [])   # too! (RFC 2308 — often forgotten)

    def get(self, name):
        entry = self.store.get(name)
        if not entry: return None           # miss → walk (networking course, Ch 8)
        expires, ips = entry
        if time.monotonic() > expires:
            del self.store[name]            # TTL burned: forget and re-walk next time
            return None
        return ips

cache = DNSCache()
cache.put("example.com", ["93.184.216.34"], ttl=2)
print("warm:", cache.get("example.com"))    # instant — layer ③ answering
time.sleep(2.1)
print("expired:", cache.get("example.com")) # None — TTL burned, back to the walk
cache.put_nx("doesnotexist.example")        # attackers LOVE un-cached NXDOMAIN lookups:
print("neg-cached:", cache.get("doesnotexist.example"))  # cached=[] → no re-walk
```

Forty lines and it already models the *interesting* failures: TTL expiry, and negative
caching — the difference between a broken subdomain costing one lookup or ten thousand.

## What you now know

- DNS is a **four-layer cache read**, not a lookup — layers ①–③ usually answer at
  microseconds, and layer ③ shares warmth across all its users.
- **TTLs are per-layer budgets**; expiry is when the money runs out (and negative
  answers are cached too — RFC 2308).
- **DoH** relocates the lookup into TLS'd browser traffic — privacy up, a tradeoff in
  latency and in who controls your resolver.
- "Slow for new users, fine for me" = a cache-hierarchy asymmetry. Now diagnosable.

Next: the connection tax — the round trips TCP and TLS charge before a single HTTP
byte, and why keep-alive is the cheapest optimization nobody configures.
