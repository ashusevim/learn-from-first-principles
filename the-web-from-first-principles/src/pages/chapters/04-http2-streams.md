---
layout: ../../layouts/Chapter.astro
title: 'HTTP/2: One Connection, Many Streams'
description: 'Multiplexing, HPACK, stream priorities — and the head-of-line blocking it solved (and didn’t). Build: decode a real HTTP/2 session.'
part: 'Part I — The Pipe'
written: true
---

Chapter 3 priced the connection tax and left a wound: HTTP/1.1 makes the browser open
~6 connections per origin to fetch resources in parallel — six taxes, and head-of-line
blocking *within* each connection (request 2 waits for request 1's bytes, in order).
**HTTP/2** answers with one connection carrying many interleaved **streams** of binary
frames. It fixed the protocol-level queueing — and inherited a subtler one from TCP
itself. Decode a real session and see both.

## The lie you were told

> "HTTP/2 is HTTP/1.1 with a faster parser."

It's a different wire protocol entirely — binary frames instead of text lines:

```text
HTTP/1.1:  "GET /a HTTP/1.1\r\nHost: x\r\n\r\n"     ← text, one request per connection
HTTP/2:    [HEADERS frame, stream 1][DATA frame, stream 1]
           [HEADERS frame, stream 3][DATA frame, stream 1][DATA frame, stream 3]
           ← binary frames INTERLEAVED: many requests share one TCP connection
```

The vocabulary: a **stream** is one request/response; frames interleave across streams
so a big image's bytes don't queue the small CSS behind it; **HPACK** compresses the
repetitive headers (every request said "Host: x", "User-Agent: ..." — now a table of
indices); **priorities** tell the server which streams matter (the HTML before the
fonts).

## The win, and the wall

The win: one connection = one handshake (Chapter 3's tax paid once), no six-connection
limit, headers compressed to nothing. The wall: all streams share **one TCP
connection**, and TCP delivers bytes **in order**. One lost packet stalls *every*
stream until it's retransmitted — **TCP-level head-of-line blocking**:

```text
streams: [A][B][C] on one TCP connection. Packet for B is lost.
TCP:     "I can't deliver C's bytes yet — they come after B's." All streams stall.
```

HTTP/2 moved the queue from the application to the kernel — and made it worse for
lossy links. **HTTP/3/QUIC (Chapter 11) is the escape**: per-stream reliability over
UDP, so a lost packet stalls only its own stream. H2 didn't fail; it taught the web
exactly where TCP hurt.

## Prove it to yourself

**1. Confirm the protocol** — DevTools Network panel, right-click the table header,
enable "Protocol": `h2` everywhere. Or from the wire:

```sh
curl -sv --http2 https://example.com 2>&1 | grep -i 'HTTP/2 200'
curl -s -o /dev/null -w '%{http_version}\n' https://example.com    # 2
```

**2. Watch frames multiplex** — many assets, one connection:

```sh
# a page with many subresources: ONE "Connected", many requests:
curl -sv --http2 https://news.ycombinator.com 2>&1 | grep -cE 'Connected to'
# and in DevTools: Connection ID column — all requests share one ID
```

**3. Header compression, weighed:**

```sh
# h1: every request resends ~800 bytes of headers. 100 requests = 80KB of the SAME text.
# h2 HPACK: static table (well-known headers = 1 byte each) + dynamic table (your UAs).
curl -s -o /dev/null -w 'headers over the wire: %{size_header} bytes\n' \
     --http2 https://example.com
```

## The build: frame-level thinking

Full h2 framing needs a library, but the *decision* h2 makes — interleave vs queue —
models in 30 lines, and it's the model that explains h3's existence:

```python
# multiplex.py — h1 queueing vs h2 interleaving vs the TCP-level wall
import random

def h1_connection(resources, latency_per_resource=3):
    """One request at a time per connection: 6 connections, in-order within each."""
    conns = [[] for _ in range(6)]                    # browser's 6-connection limit
    for i, res in enumerate(resources): conns[i % 6].append(res)
    slowest = max(sum(latency_per_resource for _ in c) for c in conns)
    return f"h1: 6 connections, done in ~{slowest} resource-times (6 handshakes: Ch 3!)"

def h2_multiplexed(resources, packet_loss=0.0):
    """All streams interleave frames on ONE connection."""
    if packet_loss == 0:
        return f"h2: 1 connection, all {len(resources)} streams progress together"
    # TCP-level head-of-line blocking: ONE lost packet stalls ALL streams for 1 RTT
    stalls = sum(1 for _ in resources if random.random() < packet_loss)
    return f"h2 under {packet_loss:.0%} loss: ~{stalls} global stalls (ALL streams pause)"

def h3_independent(resources, packet_loss=0.0):
    """QUIC: per-stream reliability — loss stalls only its own stream (Ch 11)."""
    stalls = sum(1 for _ in resources if random.random() < packet_loss)
    return f"h3 under {packet_loss:.0%} loss: {stalls} stalls, but only {stalls} stream(s) affected"

random.seed(1)
res = [f"/asset{i}" for i in range(20)]
print(h1_connection(res))
print(h2_multiplexed(res, packet_loss=0.0))
print(h2_multiplexed(res, packet_loss=0.1))
print(h3_independent(res, packet_loss=0.1))
# h1: 6 connections, done in ~12 resource-times (6 handshakes: Ch 3!)
# h2: 1 connection, all 20 streams progress together
# h2 under 10% loss: ~2 global stalls (ALL streams pause)
# h3 under 10% loss: 2 stalls, but only 2 stream(s) affected
```

That last comparison — *global stalls vs isolated stalls* — is the entire h2→h3 story,
compressed to two lines.

## What you now know

- HTTP/2 = **binary frames + streams multiplexed on one connection + HPACK** — one
  handshake, no six-connection cap, no in-order request queue.
- Head-of-line blocking moved: solved at the HTTP layer, **inherited at the TCP layer**
  — one lost packet pauses every stream.
- Priorities/push existed to shape the interleaving (push is now dead; priorities
  evolved into extensible priorities).
- The h2 experience taught the web to want per-stream reliability — QUIC's charter.

Next: the pipe is understood — bytes arrive. Time for the browser's half: turning HTML
bytes into a living tree. Parsing, tokens, and the DOM.
