# Networking from First Principles

> Don't memorize the tool. Understand the machine.

A free, open course that teaches networking from raw bytes up — Ethernet frames, hand-built
TCP handshakes, zero-library HTTP servers — until the protocols stop being acronyms and
start being things you can hold in your hands.

Part of [The First Principles Project](https://github.com/DsThakurRawat/Backend-from-first-Principle)
(sibling of [Linux from First Principles](../linux-from-first-principles)).

## Read it

```sh
npm install
npm run dev      # http://localhost:4321
```

Or build and deploy anywhere static:

```sh
npm run build    # outputs dist/
```

## The course

**Part I — Wires and Frames**
1. What the Wire Actually Carries ✅
2. IP: The Addressing Lie ✅
3. ARP: Asking the Whole Room ✅

**Part II — TCP from Raw Bytes**
4. The TCP Handshake, Byte by Byte ✅ *(the killer chapter — handshake by hand, raw sockets)*
5. Data, ACKs & Retransmission ✅
6. Teardown & the Strange States ✅

**Part III — Programs on Top**
7. Sockets: The Kernel's Side of the Deal ✅
8. DNS: The Internet's Phone Book ✅
9. HTTP Is Just Text (Until It Isn't) ✅

**Part IV — The Real World**
10. TLS: The Handshake That Hides Everyone ✅
11. NAT, Routers & the Edge of Your Street ✅
12. Final Boss: ping, from Scratch ✅ *(~70 lines of C — you own ping)*

All 12 chapters are fully written, each with runnable proofs and a hands-on build.
Things you build along the way: a frame sniffer, a hand-crafted IP packet, an ARP scanner,
a raw-socket TCP handshake, a fork-per-client server, a DNS resolver that climbs the real
hierarchy, a zero-library HTTP server, a traceroute in 8 lines, and your own ping.

## The rules of the course

1. **Start below the abstraction.** Before "how to use sockets", answer "what is on the wire?"
2. **Nothing is magic.** Every packet is bytes you can capture, inspect, and forge.
3. **Build a toy version.** An ARP scanner, a resolver, an HTTP server, your own ping.
4. **Then the RFCs are readable.** The course ends where the protocol documents begin.

## Contributing

Fixes, better explanations, diagrams, and snippets in other languages are all welcome —
open an issue or PR. The goal is simple: help people understand.

## Code

Second-language implementations of the flagship builds live in `code/`:

`code/go/tcp_echo.go` and `code/python/tcp_echo.py` (Chapter 11's echo server).
