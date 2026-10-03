---
layout: ../../layouts/Chapter.astro
title: 'Data, ACKs & Retransmission'
description: 'Sliding windows, retransmit timers, congestion control in miniature. Build: transfer a file over your own TCP.'
part: 'Part II — TCP from Raw Bytes'
written: true
---

The handshake agreed on the numbers. Now the actual work: moving data reliably over a
network that is trying to lose it. TCP's answer is so elegant it fits in one sentence —
**every byte is numbered, every byte is acknowledged, and anything unacknowledged gets
resent**. This chapter walks that machine until you can predict what `tcpdump` shows before
it shows it.

## The lie you were told

> "TCP guarantees delivery."

TCP guarantees nothing about the *network* — it guarantees about the **endpoints**. The
network will drop your packets (Chapter 2 kept its promise to promise nothing); TCP just
refuses to give up: resend until acknowledged, reorder what arrives scrambled, discard
duplicates. Reliability isn't a property of the wire. It's a *dictatorship at both ends*.

## The three machines inside TCP

**1. Cumulative ACKs.** `ack=5001` means "I have every byte through 5000 — send 5001".
One number summarizes the entire receive history; a lost ACK for packet 7 is healed by the
ACK for packet 8 ("cumulative"). Elegant, and old as the hills.

**2. The sliding window.** A sender can't just blast: unacknowledged bytes in flight are
capped by the receiver's advertised **window** (that 16-bit header field from Chapter 4).
The window *slides* forward as ACKs arrive:

```text
sent & ACKed    |   sent, awaiting ACK   |   allowed to send   |   not yet
────────────────┼────────────────────────┼─────────────────────┼──────────
     ████████████      ████████████           ░░░░░░░░░░
                     └──────── window slides right as ACKs arrive ────────┘
```

**3. Retransmission.** Every sent segment starts a timer. ACK arrives → timer cancels.
Timer fires → resend, timer doubles (exponential backoff). Fast path: three *duplicate*
ACKs trigger instant resend ("fast retransmit") without waiting for the timer.

And on top of all three: **congestion control** — the sender's own window (cwnd) starts
tiny and *doubles every round trip* until packets drop, treating loss as the network
saying "too fast". Slow start isn't slow; it's polite. It's why your download takes a
second to reach full speed.

## Prove it to yourself

**1. Watch a window grow** — download something real and inspect the live state:

```sh
curl -so /dev/null https://speed.hetzner.de/100MB.bin &
ss -ti dport = :443 | grep -A2 skmem    # look at cwnd, retrans, delivery_rate
```

**2. See the ACK machine in slow motion:**

```sh
sudo tcpdump -n -S 'tcp port 80 & host example.com'
# [.] ack 1006553453           ← handshake done
# [P.] seq 1001:1051, ack 1    ← data sent (PSH: "deliver to app now")
# [.] ack 1051                 ← every byte counted, every count answered
```

**3. Loss, caught red-handed** — `netstat -s` is the kernel's confession letter:

```sh
netstat -s | grep -i retrans    # "segments retransmitted: 12,481" — today, on your machine
```

## The build: carry the conversation yourself

Extend Chapter 4's raw-socket client: after your handshake, **send real data** — an HTTP
request — and receive the response, doing the bookkeeping by hand:

```c
/* after your ACK (packet 3): */
char *req = "GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n";
int len = strlen(req);

/* wrap `req` in a TCP header: seq = isn + 1, ack = server_isn + 1, flags PSH|ACK */
tcp->seq  = htonl(isn + 1);          /* our byte counter: SYN already consumed one */
tcp->ack  = htonl(server_isn + 1);   /* "I got your SYN+ACK; your data starts at +1" */
tcp->psh = 1;  tcp->ack = 1;
memcpy((char *)tcp + 20, req, len);  /* payload rides right after the header */
tcp->len = htons(20 + len);
/* recompute checksums, sendto() — your bytes are now ON THE WIRE, numbered by you */

/* then recvfrom() the reply: parse ip->tot_len / tcp->doff, read the HTML,
   and send your own ACK for it. If a gap in sequence numbers appears —
   the network ate a packet. Wait for the retransmission. You are TCP now. */
```

That's the whole course in one homework: **number, acknowledge, resend, reassemble.** When
your raw socket conversation serves you real HTML, TCP has no mystique left — just
bookkeeping you've personally done.

## What you now know

- Reliability = **numbered bytes + cumulative ACKs + retransmission**. Nothing else.
- The **window** is flow control (receiver's pace); **cwnd** is congestion control
  (network's pace); both slide.
- Loss isn't an error state — it's a Tuesday. Timers and duplicate ACKs handle it.
- "Slow" download start = slow start being polite, not a broken connection.

Next: data flows. But connections also *end* — and the goodbye is stranger than the hello.
TIME_WAIT awaits.
