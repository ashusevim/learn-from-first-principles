---
layout: ../../layouts/Chapter.astro
title: 'TCP & TLS: The Connection Tax'
description: 'Handshakes before bytes: why the first request is slow and keep-alive pays rent. Build: count the round trips with curl timings.'
part: 'Part I — The Pipe'
written: true
---

Chapter 1's harness showed the numbers: `tcp` delta ≈ 23ms, `tls` delta ≈ 27ms — and
*then* the first HTTP byte could even be requested. That's the **connection tax**: two
to three round trips of pure ceremony before any page content moves. The networking
course built these handshakes (Chapters 4 and 10); this chapter prices them, and
derives half of web performance folklore from one formula: **latency × round trips**.

## The lie you were told

> "Fetching a small page is fast because the page is small."

Size governs *transfer* time; the **connection tax** governs *start* time — and it's
paid in round trips, not bytes:

```text
DNS walk          ~1 RTT (if all caches miss — Chapter 2)
TCP handshake     1 RTT (SYN → SYN-ACK → ACK)
TLS 1.3           1 RTT (ClientHello → ServerHello+keys → Finished)
TLS 1.2 (legacy)  2 RTT
first HTTP byte   1 more RTT after the request
─────────────────────────────────────────────
~4 round trips before your HTML even begins downloading
```

At 10ms RTT: 40ms of ceremony. At 200ms RTT (a mobile phone on a far continent): **800ms
before the first byte** — for a 2KB page. The page size was irrelevant; geography
charged you.

## The derivations (folklore, from the formula)

- **Keep-alive** (HTTP/1.1 default): reuse the connection, pay the tax once — the
  single biggest win nobody configures because it's already on.
- **CDNs**: can't reduce RTT to your server, can reduce RTT to *their* edge node near
  the user. Same handshake, shorter legs.
- **TLS 1.3's 1-RTT** (vs 1.2's 2): halves the TLS tax; **0-RTT resumption**
  (Chapter 11) removes even that for repeat visitors.
- **The browser's connection pool**: ~6 per origin in HTTP/1.1 (six taxes!), *one*
  shared connection in HTTP/2 (Chapter 4) — that change alone restructured page design.

## Prove it to yourself

**1. Price the tax, per stage** (Chapter 1's harness, read as deltas):

```sh
curl -s -o /dev/null -w '
dns    %{time_namelookup}s
tcp    %{time_connect}s       ← delta = 1 RTT
tls    %{time_appconnect}s    ← delta = TLS (1 RTT in 1.3)
first  %{time_starttransfer}s ← delta = 1 RTT + server time
' https://example.com
```

**2. Prove keep-alive erases the tax** — same host, twice, one connection:

```sh
curl -sv https://example.com https://example.com 2>&1 | grep -E 'Connected|Re-using'
# Connected to example.com          ← first request pays
# Re-using existing connection      ← second request: tax already paid (Ch 6 of this course)
```

**3. Geography is destiny** — same request, three continents:

```sh
for host in example.com google.co.jp google.com.au; do
  curl -s -o /dev/null -w "$host: tls+tcp = " --time-connect -w "" \
       -w "%{time_appconnect}s\n" https://$host
done
# the deltas differ by exactly the speed of light + router hops. The tax is physical.
```

## The build: a round-trip accounting model

```python
# taxmodel.py — the connection tax, computed: predict TTFB from RTT and protocol
RTT = float(input("RTT to server in ms (ping it): ") or 40)

def connect_tax(tls="1.3", dns_cached=False, fresh_connection=True):
    r = 0
    if fresh_connection:
        if not dns_cached: r += 1          # DNS walk (Ch 2) — often cached away
        r += 1                             # TCP handshake (SYN/SYN-ACK/ACK)
        r += 1 if tls == "1.3" else 2      # TLS: 1.3 = 1 RTT, 1.2 = 2 RTT
    return r * RTT

for label, kwargs in [("TLS 1.3, cold", dict()),
                      ("TLS 1.2, cold", dict(tls="1.2")),
                      ("TLS 1.3, warm (keep-alive)", dict(fresh_connection=False))]:
    print(f"{label:28s}: {connect_tax(**kwargs):7.1f} ms before the first HTTP byte")

print(f"\nplus 1 RTT request→response: +{RTT} ms → TTFB")
# TLS 1.3, cold              :   120.0 ms before the first HTTP byte
# TLS 1.2, cold              :   160.0 ms before the first HTTP byte
# TLS 1.3, warm (keep-alive) :     0.0 ms before the first HTTP byte
# plus 1 RTT request→response: +40.0 ms → TTFB
```

Feed it a real `ping` result and compare against Chapter 1's measured TTFB — the model
lands within a round trip. Every web-performance decision ("CDN?", "TLS 1.3?", "how
many origins?") is now arithmetic on this table.

## What you now know

- The connection tax = **DNS + 1 RTT (TCP) + 1–2 RTT (TLS)** paid before any HTTP —
  pure latency, immune to page size.
- **Keep-alive** pays once; **HTTP/2** pays once for *all* resources (Ch 4); **TLS 1.3**
  halves it; **0-RTT** (Ch 11) nearly erases it for return visitors.
- CDN = moving the handshake's endpoint closer — you can't beat light, only shorten its
  trip.
- Web performance folklore is this formula with different constants.

Next: with the connection priced, HTTP/2's gambit — many streams, one connection, and
the head-of-line problem it inherited from TCP itself.
