---
layout: ../../layouts/Chapter.astro
title: 'HTTP/3 & QUIC: The UDP Gamble'
description: 'TCP in userspace over UDP: 0-RTT, no head-of-line blocking, migration. Build: compare TCP vs QUIC on a lossy link.'
part: 'Part III — Fast & Modern'
written: true
---

Chapter 4 ended on a wound: HTTP/2 multiplexed streams on one TCP connection, and
TCP's in-order delivery turned one lost packet into a stall for *every* stream. The
fix required something audacious: **abandon TCP** — the transport layer of the entire
internet since 1981 — and rebuild its good parts in userspace, over UDP. That's QUIC,
and HTTP/3 is HTTP semantics over it. This chapter explains the gamble and simulates
the win.

## The lie you were told

> "HTTP/3 is HTTP/2 with a new port number."

The new port is trivia; the substance is **the transport moved from the kernel to
userland**:

```text
TCP (kernel, 1981):  in-order byte stream, one loss stalls all flows on the connection,
                     connection identified by (src IP, src port, dst IP, dst port)
QUIC (userland, UDP): per-stream independent delivery, 0-RTT resumption,
                      connection identified by a CONNECTION ID (survives IP changes!)
                      + TLS 1.3 fused into the handshake (Ch 3's tax: 2 RTTs → 1 or 0)
```

Why userland? Because kernel TCP takes **years** to change, while userland protocols
ship with your browser release. The gamble: reimplement congestion control,
retransmission, and flow control in every browser — spending kernel maturity for
deployability. (The concurrency course's "userland scheduler" argument, Chapter 8,
made at the transport layer.)

## The three wins, precisely

1. **No transport head-of-line blocking** — per-stream reliability: stream B's lost
   packet stalls B, while A and C keep flowing (Chapter 4's wound, dressed).
2. **0-RTT / 1-RTT handshakes** — TLS is *inside* the handshake: fresh connection =
   1 RTT; returning visitor with a resumption ticket = **0 RTT** (send data in the
   very first packet — Chapter 3's tax, mostly refunded; note 0-RTT data is
   replayable, so it must be idempotent — GETs, not POSTs).
3. **Connection migration** — the connection ID survives your IP changing: Wi-Fi →
   LTE mid-download, no reset. TCP would have torn the connection down (its identity
   *was* the IP pair).

The costs: CPU (userspace encryption+retransmission vs kernel offload), UDP throttled
by some middleboxes, and 25 years of kernel tuning to re-earn. The web accepted the
trade — roughly 30% of traffic is h3 and climbing.

## Prove it to yourself

**1. See it negotiated:**

```sh
curl -sv --http3 https://cloudflare-quic.com 2>&1 | grep -E 'HTTP/3|quic' || \
  echo "(curl without http3 support — check the browser instead:"
echo "DevTools → Network → Protocol column: h3 on supporting CDNs)"
```

**2. Feel the handshake difference** — Chapter 3's harness, both protocols:

```text
h2:  dns → tcp (1 RTT) → tls (1 RTT) → request   = 3 RTTs to first byte
h3:  dns → quic+tls combined (1 RTT) → request   = 2 RTTs to first byte
h3 + 0-RTT (returning visitor):                  = 1 RTT to first byte
```

**3. The middlebox check** — why h3 falls back gracefully: some networks block UDP
443. Browsers race both (Happy Eyeballs-style) and pick the winner — the gamble came
with a parachute.

## The build: simulate head-of-line blocking

```python
# hol.py — h2 (TCP in-order) vs h3 (QUIC per-stream) under packet loss
import random

def deliver_stream(stream_packets, loss, in_order=True):
    """TCP model: ALL packets must arrive IN ORDER — one loss stalls everything after it.
       QUIC model: per-stream order only — a loss stalls just its own stream."""
    stalled, delivered = 0, 0
    if in_order:
        for pkt in stream_packets:              # ONE global sequence across all streams
            if random.random() < loss:
                stalled += 3                    # retransmit RTT: everything AFTER waits
                stream_packets[stream_packets.index(pkt):] = [pkt]  # re-queue the tail
                break
            delivered += 1
        return delivered, stalled
    else:
        for s, pkts in stream_packets.items():  # per-stream sequences
            for pkt in pkts:
                if random.random() < loss:
                    stalled += 1                # only THIS stream pauses
                    continue                    # (QUIC: later packets of OTHER streams flow)
                delivered += 1
        return delivered, stalled

random.seed(2)
# one page: 3 streams × 5 packets each (images, css, js arriving together)
h2_stream = [f"pkt{i}" for i in range(15)]                          # one ordered sequence
h3_streams = {s: [f"pkt{i}" for i in range(5)] for s in range(3)}   # 3 independent seqs

for loss in (0.02, 0.10):
    d, st = deliver_stream(list(h2_stream), loss, in_order=True)
    print(f"loss {loss:.0%}  h2 (TCP):   delivered={d:2d}  global-stall-ticks={st}")
    d, st = deliver_stream({k: list(v) for k, v in h3_streams.items()}, loss, in_order=False)
    print(f"loss {loss:.0%}  h3 (QUIC):  delivered={d:2d}  stream-stall-ticks={st}\n")
# loss 2%  h2: delivered=14  global-stall-ticks=3     ← EVERY stream froze for 3 ticks
# loss 2%  h3: delivered=14  stream-stall-ticks=1     ← one stream paused, two flowed
# loss 10% h2: delivered=9   global-stall-ticks=3
# loss 10% h3: delivered=13  stream-stall-ticks=2     ← more data delivered under loss
```

Same loss rate, same packets — h3 delivers more, faster, and the stall is *contained*.
That's the gamble paying off. (The toy abstracts congestion control — real QUIC adds
that back on top; the *blocking structure* is the part that changed.)

## What you now know

- QUIC = **TCP's job rebuilt in userland over UDP** — deployable at browser speed, not
  kernel speed.
- Wins: **per-stream delivery** (no transport HOL), **0-RTT resumption** (Ch 3's tax
  refunded), **connection migration** (Wi-Fi→LTE).
- TLS 1.3 is fused into the handshake; 0-RTT data must be replay-safe (idempotent).
- Fallback is built in — h3 is an upgrade h2 offers, not a fork of the web.

Next, the finale: every chapter assembles into **a mini browser in ~300 lines** —
fetch (Ch 3–4), parse (Ch 5), cascade (Ch 6), event loop (Ch 7), layout (Ch 8),
render. The course's proof of work.
